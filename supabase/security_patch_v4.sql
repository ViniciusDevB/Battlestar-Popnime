-- =============================================================================
-- ASTD — Security Patch v4
--
-- Corrige brechas encontradas na auditoria de grants e políticas RLS:
--
--   1. saves_own_all (CRÍTICO): política que permitia UPDATE/INSERT direto no
--      save do player estava anulando a Solução B inteira. Drop + substituição
--      por política de DELETE somente (necessária para resetAccount).
--
--   2. anon grants: RPCs econômicas e de gacha acessíveis por usuários não
--      autenticados. REVOKE para que só authenticated execute essas funções.
--
--   3. scores_insert_own: política de INSERT sem WITH CHECK permitia player
--      inserir scores com player_id de outro jogador. Recriada com check correto.
--
--   4. validate_save_delta: função morta da era pré-Solução B, removida.
--
-- Execute no SQL Editor do Supabase.
-- =============================================================================

-- ── 1. CRÍTICO: corrige RLS da tabela saves ───────────────────────────────────
-- A política saves_own_all permitia UPDATE direto no save (bypass da Solução B).
-- O DROP IF EXISTS "saves_rw_own" anterior silenciosamente falhou pois o nome
-- real era saves_own_all.
DROP POLICY IF EXISTS "saves_own_all" ON public.saves;

-- Mantém saves_read_own (SELECT) que já existe.
-- Adiciona DELETE para resetAccount() no cliente.
DROP POLICY IF EXISTS "saves_delete_own" ON public.saves;
CREATE POLICY "saves_delete_own" ON public.saves
  FOR DELETE TO authenticated
  USING (player_id = public.get_my_player_id());

-- Estado final da tabela saves:
--   SELECT  → saves_read_own   (player lê o próprio save)
--   DELETE  → saves_delete_own (apenas reset de conta)
--   INSERT/UPDATE → bloqueado para authenticated; só funções SECURITY DEFINER escrevem

-- ── 2. Revoga acesso anon das RPCs econômicas ─────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.fn_sync_progress(JSONB)                      FROM anon;
REVOKE EXECUTE ON FUNCTION public.fn_complete_stage(TEXT, TEXT, INT, BOOLEAN)  FROM anon;
REVOKE EXECUTE ON FUNCTION public.fn_gacha_pull(INT, TEXT)                     FROM anon;
REVOKE EXECUTE ON FUNCTION public.fn_claim_reward(TEXT, TEXT)                  FROM anon;
REVOKE EXECUTE ON FUNCTION public.fn_update_gacha_pool(TEXT[], TEXT[], TEXT[]) FROM anon;

-- ── 3. Corrige política de INSERT em scores ───────────────────────────────────
-- Sem WITH CHECK, qualquer player autenticado podia inserir score com
-- o player_id de outro jogador.
DROP POLICY IF EXISTS "scores_insert_own" ON public.scores;
CREATE POLICY "scores_insert_own" ON public.scores
  FOR INSERT TO authenticated
  WITH CHECK (player_id = public.get_my_player_id());

-- ── 4. Remove função morta ────────────────────────────────────────────────────
-- validate_save_delta foi substituída pela Solução B (fn_sync_progress).
DROP FUNCTION IF EXISTS public.validate_save_delta CASCADE;

-- =============================================================================
-- FIM. Verificação pós-execução:
--
-- SELECT policyname, cmd, qual FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'saves'
-- ORDER BY policyname;
--
-- Resultado esperado: saves_delete_own (DELETE) + saves_read_own (SELECT)
-- =============================================================================
