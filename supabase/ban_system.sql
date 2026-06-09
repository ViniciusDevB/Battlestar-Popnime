-- =============================================================================
-- ASTD — Sistema de Banimento e Log de Violações
-- Idempotente. Execute APÓS schema.sql e security_patch.sql.
-- =============================================================================

-- ── 1. Campos de banimento na tabela players ──────────────────────────────────
ALTER TABLE players ADD COLUMN IF NOT EXISTS banned     BOOLEAN     DEFAULT false;
ALTER TABLE players ADD COLUMN IF NOT EXISTS ban_reason TEXT        DEFAULT NULL;
ALTER TABLE players ADD COLUMN IF NOT EXISTS banned_at  TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS players_banned_idx ON players(id) WHERE banned = true;

-- ── 2. Tabela de IPs banidos ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS banned_ips (
  ip         TEXT PRIMARY KEY,
  reason     TEXT DEFAULT NULL,
  banned_at  TIMESTAMPTZ DEFAULT now()
);

-- Sem RLS pública — apenas funções SECURITY DEFINER leem/escrevem
ALTER TABLE banned_ips ENABLE ROW LEVEL SECURITY;

-- ── 3. Log de violações de integridade ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS integrity_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id      UUID REFERENCES players(id) ON DELETE CASCADE,
  violation_type TEXT NOT NULL,
  detail         JSONB DEFAULT '{}',
  client_ip      TEXT DEFAULT NULL,   -- preenchido pela Edge Function
  logged_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE integrity_log ENABLE ROW LEVEL SECURITY;
-- Sem política SELECT pública — admin acessa via service role key

CREATE INDEX IF NOT EXISTS integrity_log_player_type
  ON integrity_log(player_id, violation_type, logged_at DESC);

-- ── 4. RLS: bloquear contas banidas de inserir scores ─────────────────────────
DROP POLICY IF EXISTS "scores_insert_own" ON scores;
CREATE POLICY "scores_insert_own" ON scores FOR INSERT
  WITH CHECK (
    player_id = get_my_player_id()
    AND NOT COALESCE(
      (SELECT banned FROM players WHERE id = get_my_player_id()), false
    )
  );

-- ── 5. RLS: bloquear contas banidas de sincronizar saves ──────────────────────
DROP POLICY IF EXISTS "saves_own_all" ON saves;
CREATE POLICY "saves_own_all" ON saves FOR ALL
  USING (player_id = get_my_player_id())
  WITH CHECK (
    player_id = get_my_player_id()
    AND NOT COALESCE(
      (SELECT banned FROM players WHERE id = get_my_player_id()), false
    )
  );

-- ── 6. Função: registrar violação + auto-ban ──────────────────────────────────
-- Chamada pelo client via RPC (sem IP) ou pela Edge Function (com IP).
CREATE OR REPLACE FUNCTION log_integrity_violation(
  p_type      TEXT,
  p_detail    JSONB    DEFAULT '{}',
  p_client_ip TEXT     DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_player_id  UUID;
  v_hard_count INT;
BEGIN
  v_player_id := get_my_player_id();
  IF v_player_id IS NULL THEN RETURN; END IF;

  -- Conta já banida: não polui o log com mais entradas
  IF (SELECT COALESCE(banned, false) FROM players WHERE id = v_player_id) THEN
    RETURN;
  END IF;

  INSERT INTO integrity_log (player_id, violation_type, detail, client_ip)
  VALUES (v_player_id, p_type, p_detail, p_client_ip);

  -- Violações graves: ban automático após 3 em 7 dias
  SELECT COUNT(*) INTO v_hard_count
  FROM integrity_log
  WHERE player_id      = v_player_id
    AND violation_type = ANY(ARRAY[
          'hmac_mismatch', 'gemas_absurdas', 'unidades_excedentes',
          'cheat_mode_flag', 'gemas_delta_absurdo', 'unidades_delta_absurdo',
          'player_mismatch', 'pity_invalido', 'gemas_negativas'
        ])
    AND logged_at > now() - INTERVAL '7 days';

  IF v_hard_count >= 3 THEN
    UPDATE players
    SET banned     = true,
        ban_reason = 'auto: ' || p_type || ' (' || v_hard_count || ' violations em 7d)',
        banned_at  = now()
    WHERE id = v_player_id;

    -- Associar IP ao ban se fornecido
    IF p_client_ip IS NOT NULL THEN
      INSERT INTO banned_ips (ip, reason, banned_at)
      VALUES (p_client_ip, 'auto_ban:player=' || v_player_id::text, now())
      ON CONFLICT (ip) DO NOTHING;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 7. Função: validar delta do save antes de aceitar o upsert ────────────────
-- Compara o save novo com o save atual no banco.
-- Se o delta for implausível, loga violação e rejeita.
CREATE OR REPLACE FUNCTION validate_save_delta(p_new JSONB)
RETURNS TEXT AS $$
DECLARE
  v_player_id UUID;
  v_old       JSONB;
  d_gemas     BIGINT;
  d_units     INT;
  d_pulls     INT;
BEGIN
  v_player_id := get_my_player_id();
  IF v_player_id IS NULL THEN RETURN 'not_authenticated'; END IF;

  SELECT data INTO v_old FROM saves WHERE player_id = v_player_id;
  IF NOT FOUND THEN RETURN 'ok'; END IF; -- Primeiro sync: sem referência anterior

  d_gemas := COALESCE((p_new->>'gemas')::BIGINT,    0)
           - COALESCE((v_old->>'gemas')::BIGINT,     0);

  d_pulls := COALESCE((p_new->'stats'->>'pulls_realizados')::INT, 0)
           - COALESCE((v_old->'stats'->>'pulls_realizados')::INT, 0);

  d_units := COALESCE(jsonb_array_length(p_new->'inventario'->'unidades'), 0)
           - COALESCE(jsonb_array_length(v_old->'inventario'->'unidades'), 0);

  -- Gemas não podem aumentar mais de 15.000 por sync (máximo legítimo por sessão longa)
  IF d_gemas > 15000 THEN
    PERFORM log_integrity_violation('gemas_delta_absurdo',
      jsonb_build_object('delta', d_gemas, 'old', v_old->>'gemas', 'new', p_new->>'gemas'));
    RETURN 'gemas_delta_absurdo';
  END IF;

  -- Unidades novas não podem exceder novos pulls + margem de 5
  IF d_units > d_pulls + 5 AND d_units > 0 THEN
    PERFORM log_integrity_violation('unidades_delta_absurdo',
      jsonb_build_object('d_units', d_units, 'd_pulls', d_pulls));
    RETURN 'unidades_delta_absurdo';
  END IF;

  -- Gemas nunca devem ser negativas no save
  IF COALESCE((p_new->>'gemas')::BIGINT, 0) < 0 THEN
    PERFORM log_integrity_violation('gemas_negativas',
      jsonb_build_object('value', p_new->>'gemas'));
    RETURN 'gemas_negativas';
  END IF;

  RETURN 'ok';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 8. Função: verificar se IP está banido ────────────────────────────────────
-- Usada pela Edge Function log-violation.
CREATE OR REPLACE FUNCTION is_ip_banned(p_ip TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM banned_ips WHERE ip = p_ip);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── 9. Função: banir IP manualmente (admin) ───────────────────────────────────
CREATE OR REPLACE FUNCTION admin_ban_ip(p_ip TEXT, p_reason TEXT DEFAULT NULL)
RETURNS VOID AS $$
  INSERT INTO banned_ips (ip, reason) VALUES (p_ip, p_reason)
  ON CONFLICT (ip) DO UPDATE SET reason = EXCLUDED.reason, banned_at = now();
$$ LANGUAGE sql SECURITY DEFINER;

-- ── 10. Função: banir conta manualmente (admin) ───────────────────────────────
CREATE OR REPLACE FUNCTION admin_ban_player(p_player_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS VOID AS $$
  UPDATE players
  SET banned     = true,
      ban_reason = COALESCE(p_reason, 'manual_ban'),
      banned_at  = now()
  WHERE id = p_player_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- =============================================================================
-- FIM — após executar, suba a Edge Function log-violation (ver instruções em
-- supabase/functions/log-violation/README.md)
-- =============================================================================
