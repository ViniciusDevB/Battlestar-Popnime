-- =============================================================================
-- ASTD — Security Patch v2
-- Corrige: RLS de escalada de privilégios, clonagem de unidades em trocas,
--          rate-limit temporal no save sync, correlação de score no leaderboard.
-- Idempotente. Execute no SQL Editor do Supabase APÓS ban_system.sql e admin_setup.sql.
-- =============================================================================

SET search_path TO public;

-- ─── 1. CRÍTICO: Remover players_update_own ──────────────────────────────────
-- Esta política permitia que qualquer jogador atualizasse is_admin, banned, etc.
-- via requisição direta à API do Supabase.
DROP POLICY IF EXISTS "players_update_own" ON players;

-- Única atualização que o cliente precisa fazer na própria linha: last_seen.
-- Feito via SECURITY DEFINER para que nunca toque em campos sensíveis.
CREATE OR REPLACE FUNCTION update_my_last_seen()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE players SET last_seen = NOW() WHERE auth_id = auth.uid();
END;
$$;
REVOKE ALL ON FUNCTION update_my_last_seen() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_my_last_seen() TO authenticated;

-- Função para atualização de avatar (uso futuro — UI ainda não expõe isso).
CREATE OR REPLACE FUNCTION update_my_avatar(p_avatar_unit TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF length(p_avatar_unit) > 64 THEN RAISE EXCEPTION 'invalid_avatar'; END IF;
  UPDATE players SET avatar_unit = p_avatar_unit WHERE auth_id = auth.uid();
END;
$$;
REVOKE ALL ON FUNCTION update_my_avatar(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_my_avatar(TEXT) TO authenticated;

-- ─── 2. Clonagem de unidades nas trocas ──────────────────────────────────────
-- Sem isso, um jogador pode colocar a mesma unidade em N trades simultâneas
-- via Postman/fetch, multiplicando itens raros.
CREATE OR REPLACE FUNCTION check_trade_unit_uniqueness()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  -- Verifica sobreposição de UIDs com qualquer trade 'open' que não seja a atual
  IF EXISTS (
    SELECT 1 FROM trades
    WHERE status = 'open'
      AND id IS DISTINCT FROM NEW.id
      AND offered_unit_uids && NEW.offered_unit_uids
  ) THEN
    RAISE EXCEPTION 'unit_already_in_trade';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trades_unit_uniqueness ON trades;
CREATE TRIGGER trades_unit_uniqueness
  BEFORE INSERT OR UPDATE ON trades
  FOR EACH ROW
  WHEN (NEW.status = 'open' AND array_length(NEW.offered_unit_uids, 1) > 0)
  EXECUTE FUNCTION check_trade_unit_uniqueness();

-- ─── 3. Rate-limit temporal no save sync ─────────────────────────────────────
-- Sem isso, um loop no console poderia acumular +14.999 gemas/sync indefinidamente.
-- Redefine validate_save_delta adicionando verificação de intervalo mínimo entre syncs.
CREATE OR REPLACE FUNCTION validate_save_delta(p_new JSONB)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_player_id  UUID;
  v_old        JSONB;
  v_last_save  TIMESTAMPTZ;
  d_gemas      BIGINT;
  d_units      INT;
  d_pulls      INT;
BEGIN
  v_player_id := get_my_player_id();
  IF v_player_id IS NULL THEN RETURN 'not_authenticated'; END IF;
  IF is_admin() THEN RETURN 'ok'; END IF;

  -- Rate limit: mínimo 8 segundos entre syncs (bloqueia loops automáticos)
  SELECT updated_at INTO v_last_save FROM saves WHERE player_id = v_player_id;
  IF v_last_save IS NOT NULL AND NOW() - v_last_save < INTERVAL '8 seconds' THEN
    RETURN 'rate_limited';
  END IF;

  SELECT data INTO v_old FROM saves WHERE player_id = v_player_id;
  IF v_old IS NULL THEN RETURN 'ok'; END IF;

  d_gemas := COALESCE((p_new->>'gemas')::BIGINT, 0)
           - COALESCE((v_old->>'gemas')::BIGINT, 0);

  d_pulls := COALESCE((p_new->'stats'->>'pulls_realizados')::INT, 0)
           - COALESCE((v_old->'stats'->>'pulls_realizados')::INT, 0);

  d_units := COALESCE(jsonb_array_length(p_new->'inventario'->'unidades'), 0)
           - COALESCE(jsonb_array_length(v_old->'inventario'->'unidades'), 0);

  IF d_gemas > 15000 THEN
    PERFORM log_integrity_violation('gemas_delta_absurdo',
      jsonb_build_object('delta', d_gemas, 'old', v_old->>'gemas', 'new', p_new->>'gemas'));
    RETURN 'gemas_delta_absurdo';
  END IF;

  IF d_units > d_pulls + 5 AND d_units > 0 THEN
    PERFORM log_integrity_violation('unidades_delta_absurdo',
      jsonb_build_object('d_units', d_units, 'd_pulls', d_pulls));
    RETURN 'unidades_delta_absurdo';
  END IF;

  IF COALESCE((p_new->>'gemas')::BIGINT, 0) < 0 THEN
    PERFORM log_integrity_violation('gemas_negativas',
      jsonb_build_object('value', p_new->>'gemas'));
    RETURN 'gemas_negativas';
  END IF;

  RETURN 'ok';
END;
$$;
GRANT EXECUTE ON FUNCTION validate_save_delta(JSONB) TO authenticated;

-- ─── 4. Correlação de score no leaderboard ───────────────────────────────────
-- O trigger anterior só verificava tetos absolutos absurdos.
-- Agora também bloqueia combinações implausíveis: wave alta + dano zero,
-- wave alta + partida de 3 segundos, etc.
-- Só se aplica a wave > 50 para não afetar partidas legítimas de início de jogo.
CREATE OR REPLACE FUNCTION validate_score_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_player_id UUID;
  v_count     INT;
BEGIN
  v_player_id := get_my_player_id();
  IF v_player_id IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF is_admin() THEN RETURN NEW; END IF;

  -- Força player_id autenticado (nunca confia no valor do cliente)
  NEW.player_id := v_player_id;

  -- Valores negativos
  IF NEW.score     < 0 THEN RAISE EXCEPTION 'score_negativo';    END IF;
  IF NEW.damage    < 0 THEN RAISE EXCEPTION 'damage_negativo';   END IF;
  IF NEW.duration_s < 0 THEN RAISE EXCEPTION 'duration_negativo'; END IF;

  -- Tetos absolutos
  IF NEW.score       > 999999999    THEN RAISE EXCEPTION 'score_absurdo';    END IF;
  IF NEW.damage      > 99999999999  THEN RAISE EXCEPTION 'damage_absurdo';   END IF;
  IF NEW.wave IS NOT NULL AND NEW.wave > 9999 THEN RAISE EXCEPTION 'wave_absurda'; END IF;
  IF NEW.duration_s  > 10800        THEN RAISE EXCEPTION 'duration_absurda'; END IF;

  -- Modo válido
  IF NEW.mode NOT IN ('infinite', 'stage', 'event') THEN
    RAISE EXCEPTION 'modo_invalido';
  END IF;

  -- Correlação wave × dano × duração (apenas infinite, apenas acima de wave 50)
  -- Objetivo: bloquear "wave 5000, damage 0, duração 1s" sem afetar jogadores reais.
  IF NEW.mode = 'infinite' AND COALESCE(NEW.wave, 0) > 50 THEN
    -- Mínimo de 1.000 de dano por wave (tower defense: inimigos inevitavelmente recebem dano)
    IF NEW.damage < NEW.wave * 1000 THEN
      RAISE EXCEPTION 'correlacao_wave_dano';
    END IF;
    -- Mínimo de 3 segundos por wave (impossível jogar mais rápido que isso legítimamente)
    IF NEW.duration_s < NEW.wave * 3 THEN
      RAISE EXCEPTION 'correlacao_wave_duracao';
    END IF;
  END IF;

  -- Rate limit: máximo 30 scores por hora
  SELECT COUNT(*) INTO v_count
  FROM scores
  WHERE player_id = v_player_id
    AND submitted_at > NOW() - INTERVAL '1 hour';
  IF v_count >= 30 THEN RAISE EXCEPTION 'rate_limit_scores'; END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS scores_validate_before_insert ON scores;
CREATE TRIGGER scores_validate_before_insert
  BEFORE INSERT ON scores
  FOR EACH ROW EXECUTE FUNCTION validate_score_insert();

-- =============================================================================
-- FIM. Após executar este SQL, faça logout/login no jogo para garantir que
-- o perfil seja recarregado com as novas permissões.
-- =============================================================================
