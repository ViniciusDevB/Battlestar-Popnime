// Edge Function: log-violation
// Recebe uma violação de integridade do cliente, associa ao IP real e loga no banco.
// O IP nunca chega ao cliente JS — só o servidor o vê.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  // ── 1. Autenticação ────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('unauthorized', { status: 401, headers: CORS });

  // ── 2. Extrair IP real ─────────────────────────────────────────────────────
  // Supabase injeta o IP real em x-forwarded-for (primeiro da cadeia)
  const rawIp  = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const clientIp = rawIp.split(',')[0].trim();

  // ── 3. Clientes Supabase ───────────────────────────────────────────────────
  const anonClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // ── 4. Verificar usuário autenticado ───────────────────────────────────────
  const { data: { user }, error: authErr } = await anonClient.auth.getUser();
  if (authErr || !user) return new Response('unauthorized', { status: 401, headers: CORS });

  // ── 5. Buscar player_id ────────────────────────────────────────────────────
  const { data: player } = await serviceClient
    .from('players')
    .select('id, banned')
    .eq('auth_id', user.id)
    .single();

  if (!player) return new Response('player_not_found', { status: 404, headers: CORS });

  // ── 6. Verificar se o IP já está banido ────────────────────────────────────
  const { data: ipBan } = await serviceClient
    .from('banned_ips')
    .select('ip')
    .eq('ip', clientIp)
    .single();

  if (ipBan) {
    // IP banido: ban a conta associada também
    if (!player.banned) {
      await serviceClient.from('players').update({
        banned:     true,
        ban_reason: 'ip_banned: ' + clientIp,
        banned_at:  new Date().toISOString(),
      }).eq('id', player.id);
    }
    return new Response('banned', { status: 403, headers: CORS });
  }

  // ── 7. Registrar violação com IP ───────────────────────────────────────────
  let body: { violation_type?: string; detail?: Record<string, unknown> } = {};
  try { body = await req.json(); } catch { /* body vazio é ok */ }

  const violationType = body.violation_type || 'unknown';
  const detail        = body.detail || {};

  await serviceClient.from('integrity_log').insert({
    player_id:      player.id,
    violation_type: violationType,
    detail,
    client_ip:      clientIp,
  });

  // ── 8. Verificar contagem de violações graves para auto-ban ───────────────
  const hardTypes = [
    'hmac_mismatch', 'gemas_absurdas', 'unidades_excedentes',
    'cheat_mode_flag', 'gemas_delta_absurdo', 'unidades_delta_absurdo',
    'player_mismatch', 'pity_invalido', 'gemas_negativas',
  ];

  if (hardTypes.includes(violationType)) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const { count } = await serviceClient
      .from('integrity_log')
      .select('*', { count: 'exact', head: true })
      .eq('player_id', player.id)
      .in('violation_type', hardTypes)
      .gte('logged_at', sevenDaysAgo);

    if ((count ?? 0) >= 3) {
      // Ban da conta
      await serviceClient.from('players').update({
        banned:     true,
        ban_reason: `auto: ${violationType} (${count} violations em 7d)`,
        banned_at:  new Date().toISOString(),
      }).eq('id', player.id);

      // Ban do IP associado
      await serviceClient.from('banned_ips').upsert({
        ip:        clientIp,
        reason:    `auto_ban player=${player.id} type=${violationType}`,
        banned_at: new Date().toISOString(),
      }, { onConflict: 'ip' });

      return new Response('banned', { status: 403, headers: CORS });
    }
  }

  return new Response('ok', { status: 200, headers: CORS });
});
