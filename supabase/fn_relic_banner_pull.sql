-- =============================================================================
-- ASTD — fn_relic_banner_pull
-- Banner de Relíquias (moeda: cristais).
-- Pré-requisito: nexus.structures.forge > 0.
-- Mecânica:
--   - 1ª vez que sorteia uma relíquia → desbloqueia a receita (nexus.relicRecipes)
--   - Já tem a receita → entrega a relíquia no relicStash
-- Retorna { ok, results[], save } ou { error }.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_relic_banner_pull(p_qty INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id   UUID;
  v_save        JSONB;
  v_cristais    BIGINT;
  v_cost        INT;
  v_pity        INT;
  v_stash       JSONB;
  v_recipes     JSONB;
  v_forge_lvl   INT;
  v_results     JSONB := '[]'::JSONB;
  v_item        TEXT;
  v_rarity      INT;
  v_rnd         FLOAT;
  v_stack       INT;
  v_has_recipe  BOOLEAN;
  i             INT;

  -- Pool por raridade (IDs espelham RELICS em relics.js)
  v_star4 TEXT[] := ARRAY[
    'relic_kunai_minato','relic_colar_sannin','relic_chapeu_palha',
    'relic_escudo_capita','relic_anel_lanterna','relic_laco_verdade'
  ];
  v_star5 TEXT[] := ARRAY[
    'relic_yoru','relic_tensa_zangetsu','relic_hogyoku','relic_mjolnir'
  ];
BEGIN
  IF p_qty NOT IN (1, 10) THEN
    RETURN jsonb_build_object('error', 'invalid_qty');
  END IF;

  v_player_id := public.get_my_player_id();
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  SELECT data INTO v_save FROM public.saves WHERE player_id = v_player_id FOR UPDATE;
  IF v_save IS NULL THEN
    RETURN jsonb_build_object('error', 'save_not_found');
  END IF;

  -- Forge precisa estar construída (level >= 1)
  v_forge_lvl := COALESCE((v_save->'nexus'->'structures'->>'forge')::INT, 0);
  IF v_forge_lvl < 1 THEN
    RETURN jsonb_build_object('error', 'forge_required');
  END IF;

  -- Custo: 150 × 1 / 1350 × 10
  v_cost     := CASE p_qty WHEN 1 THEN 150 ELSE 1350 END;
  v_cristais := COALESCE((v_save->>'cristais')::BIGINT, 0);
  IF v_cristais < v_cost THEN
    RETURN jsonb_build_object('error', 'insufficient_crystals');
  END IF;

  v_pity    := COALESCE((v_save->>'pity_reliquia')::INT, 0);
  v_stash   := COALESCE(v_save->'relicStash', '[]'::JSONB);
  v_recipes := COALESCE(v_save->'nexus'->'relicRecipes', '{}'::JSONB);
  IF jsonb_typeof(v_stash) <> 'array' THEN v_stash := '[]'::JSONB; END IF;

  FOR i IN 1..p_qty LOOP
    v_pity := v_pity + 1;
    v_rnd  := random();

    -- Resolve raridade (pity 80 garante 5★)
    IF v_pity >= 80 THEN
      v_rarity := 5; v_pity := 0;
    ELSIF v_rnd < 0.01 THEN
      v_rarity := 5; v_pity := 0;
    ELSE
      v_rarity := 4;
    END IF;

    -- Sorteia relíquia do pool
    IF v_rarity = 5 THEN
      v_item := v_star5[1 + floor(random() * array_length(v_star5,1))::INT];
    ELSE
      v_item := v_star4[1 + floor(random() * array_length(v_star4,1))::INT];
    END IF;

    v_has_recipe := (v_recipes->>v_item) IS NOT NULL AND (v_recipes->>v_item)::BOOLEAN;

    IF NOT v_has_recipe THEN
      -- 1ª vez → desbloqueia receita
      v_recipes := jsonb_set(v_recipes, ARRAY[v_item], 'true'::JSONB);
      v_results := v_results || jsonb_build_object(
        'id', v_item, 'rarity', v_rarity, 'type', 'recipe'
      );
    ELSE
      -- Já tem receita → entrega a relíquia no stash
      SELECT COUNT(*) INTO v_stack
      FROM jsonb_array_elements(v_stash) AS elem
      WHERE elem->>'id' = v_item;

      v_stash   := v_stash || jsonb_build_object('id', v_item, 'isCorrupted', false);
      v_results := v_results || jsonb_build_object(
        'id', v_item, 'rarity', v_rarity, 'type', 'relic', 'stack', v_stack + 1
      );
    END IF;
  END LOOP;

  -- Persiste alterações
  v_save := jsonb_set(v_save, '{cristais}',            to_jsonb(v_cristais - v_cost));
  v_save := jsonb_set(v_save, '{pity_reliquia}',        to_jsonb(v_pity));
  v_save := jsonb_set(v_save, '{relicStash}',           v_stash);
  v_save := jsonb_set(v_save, '{nexus,relicRecipes}',   v_recipes, true);

  UPDATE public.saves SET data = v_save, updated_at = NOW()
  WHERE player_id = v_player_id;

  RETURN jsonb_build_object('ok', true, 'results', v_results, 'save', v_save);
END;
$$;

REVOKE ALL ON FUNCTION public.fn_relic_banner_pull(INT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fn_relic_banner_pull(INT) TO authenticated;
