-- =============================================================================
-- ASTD — fn_infinite_complete
-- Commita resultados de uma sessão de Modo Infinito no servidor.
--
-- Valida as recompensas (gemas e star experience) contra o número de waves,
-- aplica atomicamente no save, atualiza stats de onda. Retorna save canônico.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_infinite_complete(
  p_waves INT,
  p_gems  INT,
  p_drops JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id UUID;
  v_save      JSONB;
  v_intervals INT;
  v_max_gems  INT;
  v_cur_gems  BIGINT;
  v_mats_arr  JSONB;
  v_cur_best  INT;
  v_key       TEXT;
  v_qty       INT;
  v_found     BOOLEAN;
  j           INT;
BEGIN
  v_player_id := public.get_my_player_id();
  IF v_player_id IS NULL THEN RETURN jsonb_build_object('error', 'unauthorized'); END IF;

  IF p_waves < 1 THEN RETURN jsonb_build_object('error', 'invalid_waves'); END IF;
  IF p_gems  < 0 THEN RETURN jsonb_build_object('error', 'invalid_gems');  END IF;

  -- Tier 7+ = 200 gems por intervalo de 5 waves; +20% de tolerância anti-lag
  v_intervals := p_waves / 5;
  v_max_gems  := (v_intervals + 1) * 240;
  IF p_gems > v_max_gems THEN
    RETURN jsonb_build_object('error', 'gems_too_high');
  END IF;

  SELECT data INTO v_save FROM public.saves WHERE player_id = v_player_id FOR UPDATE;
  IF v_save IS NULL THEN RETURN jsonb_build_object('error', 'save_not_found'); END IF;

  v_cur_gems := COALESCE((v_save->>'gemas')::BIGINT, 0);
  v_mats_arr := COALESCE(v_save->'inventario'->'materiais', '[]');

  -- Adiciona gemas da sessão
  v_save := jsonb_set(v_save, '{gemas}', to_jsonb(v_cur_gems + p_gems));

  -- Adiciona drops de Star Experience (apenas star_exp_N, qty limitado a intervals+1)
  FOR v_key, v_qty IN
    SELECT key, (value)::INT FROM jsonb_each_text(p_drops)
  LOOP
    IF v_key NOT LIKE 'star_exp_%' THEN CONTINUE; END IF;
    IF v_qty < 1 THEN CONTINUE; END IF;
    v_qty := LEAST(v_qty, v_intervals + 1);

    v_found := false;
    FOR j IN 0..(jsonb_array_length(v_mats_arr) - 1) LOOP
      IF (v_mats_arr->j->>'id') = v_key THEN
        v_mats_arr := jsonb_set(v_mats_arr, ARRAY[j::TEXT, 'quantidade'],
          to_jsonb(COALESCE((v_mats_arr->j->>'quantidade')::INT, 0) + v_qty));
        v_found := true; EXIT;
      END IF;
    END LOOP;
    IF NOT v_found THEN
      v_mats_arr := v_mats_arr || jsonb_build_array(
        jsonb_build_object('id', v_key, 'quantidade', v_qty));
    END IF;
  END LOOP;

  v_save := jsonb_set(v_save, '{inventario,materiais}', v_mats_arr);

  -- Atualiza melhor_onda_infinita se for novo recorde
  v_cur_best := COALESCE((v_save->'stats'->>'melhor_onda_infinita')::INT, 0);
  IF p_waves > v_cur_best THEN
    v_save := jsonb_set(v_save, '{stats,melhor_onda_infinita}', to_jsonb(p_waves), true);
  END IF;

  -- Acumula ondas_infinito (total histórico)
  v_save := jsonb_set(v_save, '{stats,ondas_infinito}',
    to_jsonb(COALESCE((v_save->'stats'->>'ondas_infinito')::INT, 0) + p_waves), true);

  v_save := jsonb_set(v_save, '{_lastSyncAt}', to_jsonb(NOW()::TEXT));
  v_save := v_save - '_integrityViolations';

  UPDATE public.saves SET data = v_save, updated_at = NOW() WHERE player_id = v_player_id;

  RETURN jsonb_build_object('ok', true, 'save', v_save);
END;
$$;

REVOKE ALL ON FUNCTION public.fn_infinite_complete(INT, INT, JSONB) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fn_infinite_complete(INT, INT, JSONB) TO authenticated;
