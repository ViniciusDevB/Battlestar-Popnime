-- =============================================================================
-- ASTD — fn_structure_banner_pull
-- Banner de Estruturas (moeda: cristais).
-- Lógica: debita cristais, resolve raridade + pity (80 pulls = garantia 5★),
-- unlock do blueprint ou converte duplicata em cristais (50/100/200 por raridade).
-- Retorna { ok, results[], save } ou { error }.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_structure_banner_pull(p_qty INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id     UUID;
  v_save          JSONB;
  v_cristais      BIGINT;
  v_cost          INT;
  v_pity          INT;
  v_blueprints    JSONB;
  v_results       JSONB := '[]'::JSONB;
  v_item          TEXT;
  v_rarity        INT;
  v_rnd           FLOAT;
  v_dup_xtal      INT;
  v_total_dup     BIGINT := 0;
  i               INT;

  -- Pool de estruturas por raridade
  v_star3 TEXT[] := ARRAY['hospital','vault','barracks'];
  v_star4 TEXT[] := ARRAY['academia','bank','lab'];
  v_star5 TEXT[] := ARRAY['forge','watchtower','temple','relay'];

  -- Cristais por duplicata (50 / 100 / 200 por raridade)
  v_dup_map JSONB := '{
    "hospital":50,"vault":50,"barracks":50,
    "academia":100,"bank":100,"lab":100,
    "forge":200,"watchtower":200,"temple":200,"relay":200
  }'::JSONB;
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

  -- Custo: 150 × 1 / 1350 × 10
  v_cost     := CASE p_qty WHEN 1 THEN 150 ELSE 1350 END;
  v_cristais := COALESCE((v_save->>'cristais')::BIGINT, 0);
  IF v_cristais < v_cost THEN
    RETURN jsonb_build_object('error', 'insufficient_crystals');
  END IF;

  v_pity       := COALESCE((v_save->>'pity_estrutura')::INT, 0);
  v_blueprints := COALESCE(v_save->'nexus'->'blueprints', '{}'::JSONB);

  FOR i IN 1..p_qty LOOP
    v_pity := v_pity + 1;
    v_rnd  := random();

    -- Resolve raridade (pity 80 garante 5★)
    IF v_pity >= 80 THEN
      v_rarity := 5; v_pity := 0;
    ELSIF v_rnd < 0.01 THEN
      v_rarity := 5; v_pity := 0;
    ELSIF v_rnd < 0.41 THEN
      v_rarity := 4;
    ELSE
      v_rarity := 3;
    END IF;

    -- Sorteia estrutura do pool
    IF v_rarity = 5 THEN
      v_item := v_star5[1 + floor(random() * array_length(v_star5,1))::INT];
    ELSIF v_rarity = 4 THEN
      v_item := v_star4[1 + floor(random() * array_length(v_star4,1))::INT];
    ELSE
      v_item := v_star3[1 + floor(random() * array_length(v_star3,1))::INT];
    END IF;

    -- Blueprint já existe → converte em cristais
    IF (v_blueprints->>v_item) IS NOT NULL AND (v_blueprints->>v_item)::BOOLEAN THEN
      v_dup_xtal  := COALESCE((v_dup_map->>v_item)::INT, 0);
      v_total_dup := v_total_dup + v_dup_xtal;
      v_results   := v_results || jsonb_build_object(
        'id', v_item, 'rarity', v_rarity, 'duplicate', true, 'crystals', v_dup_xtal
      );
    ELSE
      -- Desbloqueia blueprint
      v_blueprints := jsonb_set(v_blueprints, ARRAY[v_item], 'true'::JSONB);
      v_results    := v_results || jsonb_build_object(
        'id', v_item, 'rarity', v_rarity, 'duplicate', false
      );
    END IF;
  END LOOP;

  -- Persiste: debita custo e adiciona bônus de duplicatas
  v_save := jsonb_set(v_save, '{cristais}',       to_jsonb(v_cristais - v_cost + v_total_dup));
  v_save := jsonb_set(v_save, '{pity_estrutura}',  to_jsonb(v_pity));
  v_save := jsonb_set(v_save, '{nexus,blueprints}', v_blueprints);

  UPDATE public.saves SET data = v_save, updated_at = NOW()
  WHERE player_id = v_player_id;

  RETURN jsonb_build_object('ok', true, 'results', v_results, 'save', v_save);
END;
$$;

REVOKE ALL ON FUNCTION public.fn_structure_banner_pull(INT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fn_structure_banner_pull(INT) TO authenticated;
