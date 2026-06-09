-- =============================================================================
-- ASTD — Setup de Admin
-- Execute após ban_system.sql.
-- =============================================================================

-- ── 1. Coluna is_admin em players ─────────────────────────────────────────────
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- ── 2. Marcar GordaneliGM como admin ─────────────────────────────────────────
UPDATE players SET is_admin = true WHERE username = 'GordaneliGM';

-- ── 3. Índice único case-insensitive no username ──────────────────────────────
-- Impede que alguém registre 'gordaneligm', 'GORDANELIGM', 'Gordaneligm', etc.
CREATE UNIQUE INDEX IF NOT EXISTS players_username_lower_uidx
  ON players(LOWER(username));

-- ── 4. Função auxiliar: checar se o usuário atual é admin ────────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(is_admin, false) FROM players WHERE auth_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── 5. RLS: admin bypassa ban em scores ───────────────────────────────────────
DROP POLICY IF EXISTS "scores_insert_own" ON scores;
CREATE POLICY "scores_insert_own" ON scores FOR INSERT
  WITH CHECK (
    player_id = get_my_player_id()
    AND (
      is_admin()
      OR NOT COALESCE((SELECT banned FROM players WHERE id = get_my_player_id()), false)
    )
  );

-- ── 6. RLS: admin bypassa ban em saves ───────────────────────────────────────
DROP POLICY IF EXISTS "saves_own_all" ON saves;
CREATE POLICY "saves_own_all" ON saves FOR ALL
  USING (player_id = get_my_player_id())
  WITH CHECK (
    player_id = get_my_player_id()
    AND (
      is_admin()
      OR NOT COALESCE((SELECT banned FROM players WHERE id = get_my_player_id()), false)
    )
  );

-- ── 7. log_integrity_violation: ignorar admin ────────────────────────────────
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

  -- Admin nunca é logado nem banido
  IF (SELECT COALESCE(is_admin, false) FROM players WHERE id = v_player_id) THEN
    RETURN;
  END IF;

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

    IF p_client_ip IS NOT NULL THEN
      INSERT INTO banned_ips (ip, reason, banned_at)
      VALUES (p_client_ip, 'auto_ban:player=' || v_player_id::text, now())
      ON CONFLICT (ip) DO NOTHING;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 8. validate_save_delta: ignorar admin ────────────────────────────────────
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

  -- Admin: sem validação de delta
  IF (SELECT COALESCE(is_admin, false) FROM players WHERE id = v_player_id) THEN
    RETURN 'ok';
  END IF;

  SELECT data INTO v_old FROM saves WHERE player_id = v_player_id;
  IF NOT FOUND THEN RETURN 'ok'; END IF;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 9. validate_score_insert: ignorar admin ───────────────────────────────────
CREATE OR REPLACE FUNCTION validate_score_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Admin não passa por nenhuma validação
  IF (SELECT COALESCE(is_admin, false) FROM players
      WHERE id = NEW.player_id) THEN
    RETURN NEW;
  END IF;

  IF NEW.score    < 0 OR NEW.score    > 999_999_999    THEN RAISE EXCEPTION 'score_invalido';    END IF;
  IF NEW.damage   < 0 OR NEW.damage   > 99_999_999_999 THEN RAISE EXCEPTION 'damage_invalido';   END IF;
  IF NEW.duration_s < 0 OR NEW.duration_s > 10800      THEN RAISE EXCEPTION 'duration_invalida'; END IF;
  IF NEW.wave IS NOT NULL AND NEW.wave > 99999          THEN RAISE EXCEPTION 'wave_invalida';     END IF;
  IF NEW.mode NOT IN ('infinite', 'stage', 'event')    THEN RAISE EXCEPTION 'modo_invalido';     END IF;
  IF NEW.player_id <> get_my_player_id()               THEN RAISE EXCEPTION 'player_mismatch';   END IF;

  IF (SELECT COUNT(*) FROM scores
      WHERE player_id  = NEW.player_id
        AND submitted_at > now() - INTERVAL '1 hour') >= 30 THEN
    RAISE EXCEPTION 'rate_limit_scores';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar trigger com a nova função
DROP TRIGGER IF EXISTS scores_validate_before_insert ON scores;
CREATE TRIGGER scores_validate_before_insert
  BEFORE INSERT ON scores
  FOR EACH ROW EXECUTE FUNCTION validate_score_insert();

-- =============================================================================
-- FIM
-- =============================================================================
