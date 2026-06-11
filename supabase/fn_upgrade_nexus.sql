-- =============================================================================
-- ASTD — fn_upgrade_nexus
--
-- Valida e aplica o upgrade de uma estrutura do Nexus de forma atômica.
-- O servidor é a fonte de verdade: debita gemas e incrementa o nível.
-- Retorna { ok: true, save: {...} } ou { error: 'invalid'|'maxed'|'gems' }.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_upgrade_nexus(p_struct_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id      UUID;
  v_save           JSONB;
  v_struct         JSONB;
  v_max_level      INT;
  v_base_cost      INT;
  v_cost_per_level INT;
  v_level          INT;
  v_cost           INT;
  v_gems           BIGINT;
BEGIN
  v_player_id := public.get_my_player_id();
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  SELECT data INTO v_save FROM public.saves WHERE player_id = v_player_id FOR UPDATE;
  IF v_save IS NULL THEN
    RETURN jsonb_build_object('error', 'save_not_found');
  END IF;

  -- Definições das estruturas (espelha NEXUS_STRUCTURES em data/relics.js)
  v_struct := CASE p_struct_id
    WHEN 'hospital'   THEN '{"maxLevel":5,"baseCost":300,"costPerLevel":200}'::JSONB
    WHEN 'vault'      THEN '{"maxLevel":5,"baseCost":300,"costPerLevel":200}'::JSONB
    WHEN 'academia'   THEN '{"maxLevel":3,"baseCost":400,"costPerLevel":300}'::JSONB
    WHEN 'watchtower' THEN '{"maxLevel":3,"baseCost":500,"costPerLevel":400}'::JSONB
    WHEN 'forge'      THEN '{"maxLevel":3,"baseCost":600,"costPerLevel":500}'::JSONB
    WHEN 'barracks'   THEN '{"maxLevel":3,"baseCost":350,"costPerLevel":300}'::JSONB
    WHEN 'lab'        THEN '{"maxLevel":3,"baseCost":450,"costPerLevel":350}'::JSONB
    WHEN 'bank'       THEN '{"maxLevel":3,"baseCost":400,"costPerLevel":300}'::JSONB
    WHEN 'temple'     THEN '{"maxLevel":4,"baseCost":550,"costPerLevel":400}'::JSONB
    WHEN 'relay'      THEN '{"maxLevel":3,"baseCost":500,"costPerLevel":400}'::JSONB
    ELSE NULL
  END;

  IF v_struct IS NULL THEN
    RETURN jsonb_build_object('error', 'invalid');
  END IF;

  v_max_level      := (v_struct->>'maxLevel')::INT;
  v_base_cost      := (v_struct->>'baseCost')::INT;
  v_cost_per_level := (v_struct->>'costPerLevel')::INT;

  v_level := COALESCE((v_save->'nexus'->'structures'->>p_struct_id)::INT, 0);

  IF v_level >= v_max_level THEN
    RETURN jsonb_build_object('error', 'maxed');
  END IF;

  v_cost := v_base_cost + v_level * v_cost_per_level;
  v_gems := COALESCE((v_save->>'gemas')::BIGINT, 0);

  IF v_gems < v_cost THEN
    RETURN jsonb_build_object('error', 'gems');
  END IF;

  -- Garante que nexus.structures existe antes de setar a chave dinâmica
  IF v_save->'nexus' IS NULL THEN
    v_save := jsonb_set(v_save, '{nexus}', '{"structures":{}}'::JSONB, true);
  ELSIF v_save->'nexus'->'structures' IS NULL THEN
    v_save := jsonb_set(v_save, '{nexus,structures}', '{}'::JSONB, true);
  END IF;

  v_save := jsonb_set(v_save, '{gemas}', to_jsonb(v_gems - v_cost));
  v_save := jsonb_set(v_save, ARRAY['nexus', 'structures', p_struct_id], to_jsonb(v_level + 1), true);
  v_save := jsonb_set(v_save, '{_lastSyncAt}', to_jsonb(NOW()::TEXT));

  UPDATE public.saves
  SET    data       = v_save,
         updated_at = NOW()
  WHERE  player_id  = v_player_id;

  RETURN jsonb_build_object('ok', true, 'save', v_save);
END;
$$;

REVOKE ALL ON FUNCTION public.fn_upgrade_nexus(TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fn_upgrade_nexus(TEXT) TO authenticated;
