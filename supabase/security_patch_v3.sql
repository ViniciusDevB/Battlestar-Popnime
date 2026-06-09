-- =============================================================================
-- ASTD — Security Patch v3
-- Corrige:
--   A. Bot de gemas: rate-limit de 8s→30s, delta máximo 15k→5k, cap diário
--   B. Leaderboard fake: correlação wave/dano quadrática, menos submissões/hora
--   D. Trades com unidades injetadas: verifica ownership no save do servidor
-- Idempotente. Execute APÓS security_patch_v2.sql.
-- =============================================================================

-- ─── A. validate_save_delta mais restritivo ───────────────────────────────────
-- Antes: 8s mínimo entre syncs, +15.000 gemas por sync → ~6.75M gemas/hora com bot
-- Depois: 30s mínimo, +5.000 gemas por sync, cap de 200 syncs/dia e 50k gemas/dia
CREATE OR REPLACE FUNCTION public.validate_save_delta(p_new JSONB)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_player_id   UUID;
  v_old         JSONB;
  v_last_save   TIMESTAMPTZ;
  d_gemas       BIGINT;
  d_units       INT;
  d_pulls       INT;
  v_syncs_today INT;
  v_gemas_today BIGINT;
BEGIN
  v_player_id := public.get_my_player_id();
  IF v_player_id IS NULL THEN RETURN 'not_authenticated'; END IF;
  IF public.is_admin() THEN RETURN 'ok'; END IF;

  -- Rate limit: mínimo 30 segundos entre syncs (era 8s)
  SELECT updated_at INTO v_last_save FROM public.saves WHERE player_id = v_player_id;
  IF v_last_save IS NOT NULL AND NOW() - v_last_save < INTERVAL '30 seconds' THEN
    RETURN 'rate_limited';
  END IF;

  SELECT data INTO v_old FROM public.saves WHERE player_id = v_player_id;
  IF v_old IS NULL THEN RETURN 'ok'; END IF;

  d_gemas := COALESCE((p_new->>'gemas')::BIGINT, 0)
           - COALESCE((v_old->>'gemas')::BIGINT, 0);

  d_pulls := COALESCE((p_new->'stats'->>'pulls_realizados')::INT, 0)
           - COALESCE((v_old->'stats'->>'pulls_realizados')::INT, 0);

  d_units := COALESCE(jsonb_array_length(p_new->'inventario'->'unidades'), 0)
           - COALESCE(jsonb_array_length(v_old->'inventario'->'unidades'), 0);

  -- Delta máximo por sync: 5.000 gemas (era 15.000)
  IF d_gemas > 5000 THEN
    PERFORM public.log_integrity_violation('gemas_delta_absurdo',
      jsonb_build_object('delta', d_gemas, 'old', v_old->>'gemas', 'new', p_new->>'gemas'));
    RETURN 'gemas_delta_absurdo';
  END IF;

  IF d_units > d_pulls + 5 AND d_units > 0 THEN
    PERFORM public.log_integrity_violation('unidades_delta_absurdo',
      jsonb_build_object('d_units', d_units, 'd_pulls', d_pulls));
    RETURN 'unidades_delta_absurdo';
  END IF;

  IF COALESCE((p_new->>'gemas')::BIGINT, 0) < 0 THEN
    PERFORM public.log_integrity_violation('gemas_negativas',
      jsonb_build_object('value', p_new->>'gemas'));
    RETURN 'gemas_negativas';
  END IF;

  -- Cap diário: máximo 200 syncs por dia por jogador
  SELECT COUNT(*) INTO v_syncs_today
  FROM public.saves_audit
  WHERE player_id = v_player_id
    AND synced_at > NOW() - INTERVAL '24 hours';
  IF v_syncs_today >= 200 THEN
    RETURN 'daily_sync_limit';
  END IF;

  -- Cap diário: máximo 50.000 gemas ganhas por dia (legítimo: ~2.800 gemas/hora de jogo)
  SELECT COALESCE(SUM(gemas_delta), 0) INTO v_gemas_today
  FROM public.saves_audit
  WHERE player_id = v_player_id
    AND synced_at > NOW() - INTERVAL '24 hours'
    AND gemas_delta > 0;
  IF v_gemas_today + GREATEST(d_gemas, 0) > 50000 THEN
    PERFORM public.log_integrity_violation('gemas_daily_cap',
      jsonb_build_object('today', v_gemas_today, 'delta', d_gemas));
    RETURN 'gemas_daily_cap';
  END IF;

  -- Registra o sync no audit log
  INSERT INTO public.saves_audit (player_id, gemas_delta, units_delta, synced_at)
  VALUES (v_player_id, d_gemas, d_units, NOW())
  ON CONFLICT DO NOTHING;

  RETURN 'ok';
END;
$$;
GRANT EXECUTE ON FUNCTION public.validate_save_delta(JSONB) TO authenticated;

-- Tabela de audit (cria se não existir — idempotente)
CREATE TABLE IF NOT EXISTS public.saves_audit (
  id          BIGSERIAL PRIMARY KEY,
  player_id   UUID        NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  gemas_delta BIGINT      NOT NULL DEFAULT 0,
  units_delta INT         NOT NULL DEFAULT 0,
  synced_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.saves_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "saves_audit_no_direct_access" ON public.saves_audit;
CREATE POLICY "saves_audit_no_direct_access" ON public.saves_audit
  FOR ALL TO authenticated USING (false);

CREATE INDEX IF NOT EXISTS saves_audit_player_time
  ON public.saves_audit (player_id, synced_at DESC);

-- ─── B. validate_score_insert com correlação quadrática ───────────────────────
-- Antes: dano mínimo = wave * 1.000 — trivial de satisfazer com requisição direta
-- Depois: dano mínimo = LEAST(wave² × 100, wave × 50.000) — sobe quadraticamente
--         Ex: wave 100 → 1M; wave 500 → 25M; wave 9998 → ~500M
--         Reduz submissões/hora de 30 para 10.
CREATE OR REPLACE FUNCTION public.validate_score_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_player_id UUID;
  v_count     INT;
  v_min_dmg   BIGINT;
BEGIN
  v_player_id := public.get_my_player_id();
  IF v_player_id IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF public.is_admin() THEN RETURN NEW; END IF;

  NEW.player_id := v_player_id;

  IF NEW.score      < 0 THEN RAISE EXCEPTION 'score_negativo';    END IF;
  IF NEW.damage     < 0 THEN RAISE EXCEPTION 'damage_negativo';   END IF;
  IF NEW.duration_s < 0 THEN RAISE EXCEPTION 'duration_negativo'; END IF;

  IF NEW.score      > 999999999   THEN RAISE EXCEPTION 'score_absurdo';    END IF;
  IF NEW.damage     > 99999999999 THEN RAISE EXCEPTION 'damage_absurdo';   END IF;
  IF NEW.wave IS NOT NULL AND NEW.wave > 9999 THEN RAISE EXCEPTION 'wave_absurda'; END IF;
  IF NEW.duration_s > 10800       THEN RAISE EXCEPTION 'duration_absurda'; END IF;

  IF NEW.mode NOT IN ('infinite', 'stage', 'event') THEN
    RAISE EXCEPTION 'modo_invalido';
  END IF;

  IF NEW.mode = 'infinite' AND COALESCE(NEW.wave, 0) > 50 THEN
    -- Correlação quadrática: LEAST(wave² × 100, wave × 50.000)
    -- Cresce rápido para waves altas, sem punir jogadores legítimos de baixa wave
    v_min_dmg := LEAST(
      (NEW.wave::BIGINT * NEW.wave::BIGINT * 100),
      (NEW.wave::BIGINT * 50000)
    );
    IF NEW.damage < v_min_dmg THEN
      RAISE EXCEPTION 'correlacao_wave_dano';
    END IF;
    -- Mínimo 5 segundos por wave (era 3s)
    IF NEW.duration_s < NEW.wave * 5 THEN
      RAISE EXCEPTION 'correlacao_wave_duracao';
    END IF;
  END IF;

  -- Rate limit: máximo 10 submissões/hora (era 30)
  SELECT COUNT(*) INTO v_count
  FROM public.scores
  WHERE player_id  = v_player_id
    AND submitted_at > NOW() - INTERVAL '1 hour';
  IF v_count >= 10 THEN RAISE EXCEPTION 'rate_limit_scores'; END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS scores_validate_before_insert ON public.scores;
CREATE TRIGGER scores_validate_before_insert
  BEFORE INSERT ON public.scores
  FOR EACH ROW EXECUTE FUNCTION public.validate_score_insert();

-- ─── D. Validação de ownership de unidades nas trocas ────────────────────────
-- Antes: qualquer uid podia ser oferecido — unidades geradas offline passavam.
-- Depois: verifica no save do servidor se cada uid existe antes de criar a trade.
CREATE OR REPLACE FUNCTION public.validate_trade_unit_ownership()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_player_id UUID;
  v_save      JSONB;
  v_uid       TEXT;
  v_found     BOOLEAN;
BEGIN
  v_player_id := public.get_my_player_id();
  IF v_player_id IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF public.is_admin() THEN RETURN NEW; END IF;

  SELECT data INTO v_save FROM public.saves WHERE player_id = v_player_id;
  IF v_save IS NULL THEN RAISE EXCEPTION 'save_not_found'; END IF;

  FOREACH v_uid IN ARRAY NEW.offered_unit_uids LOOP
    SELECT EXISTS(
      SELECT 1
      FROM jsonb_array_elements(v_save->'inventario'->'unidades') AS u
      WHERE (u->>'uid') = v_uid
    ) INTO v_found;
    IF NOT v_found THEN
      RAISE EXCEPTION 'unit_not_owned:%', v_uid;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_trade_unit_ownership() FROM PUBLIC;

DROP TRIGGER IF EXISTS trades_validate_ownership ON public.trades;
CREATE TRIGGER trades_validate_ownership
  BEFORE INSERT ON public.trades
  FOR EACH ROW
  WHEN (NEW.status = 'open')
  EXECUTE FUNCTION public.validate_trade_unit_ownership();

-- =============================================================================
-- FIM. Execute no SQL Editor do Supabase.
-- Não requer logout/login — as funções entram em vigor imediatamente.
-- =============================================================================
