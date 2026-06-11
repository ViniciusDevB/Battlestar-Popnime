-- =============================================================================
-- ASTD — fn_upgrade_nexus
--
-- Valida e aplica o upgrade de uma estrutura do Nexus de forma atômica.
-- O servidor é a fonte de verdade: debita gemas E materiais, incrementa o nível.
-- Retorna { ok: true, save: {...} }
--      ou { error: 'invalid'|'maxed'|'gems'|'materials' }.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_upgrade_nexus(p_struct_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id    UUID;
  v_save         JSONB;
  v_struct       JSONB;
  v_materials    JSONB;
  v_inv_mats     JSONB;
  v_max_level    INT;
  v_base_cost    INT;
  v_cost_per_lvl INT;
  v_level        INT;
  v_cost         INT;
  v_gems         BIGINT;
  v_mat_id       TEXT;
  v_mat_req      INT;
  v_mat_have     INT;
  v_mat_new      INT;
  i              INT;
  j              INT;
BEGIN
  v_player_id := public.get_my_player_id();
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  SELECT data INTO v_save FROM public.saves WHERE player_id = v_player_id FOR UPDATE;
  IF v_save IS NULL THEN
    RETURN jsonb_build_object('error', 'save_not_found');
  END IF;

  -- ── Definições de custo em gemas (3× original; espelha NEXUS_STRUCTURES) ─
  v_struct := CASE p_struct_id
    WHEN 'hospital'   THEN '{"maxLevel":5,"baseCost":1800,"costPerLevel":1200}'::JSONB
    WHEN 'vault'      THEN '{"maxLevel":5,"baseCost":1800,"costPerLevel":1200}'::JSONB
    WHEN 'academia'   THEN '{"maxLevel":3,"baseCost":2400,"costPerLevel":1800}'::JSONB
    WHEN 'watchtower' THEN '{"maxLevel":3,"baseCost":3000,"costPerLevel":2400}'::JSONB
    WHEN 'forge'      THEN '{"maxLevel":3,"baseCost":3600,"costPerLevel":3000}'::JSONB
    WHEN 'barracks'   THEN '{"maxLevel":3,"baseCost":2100,"costPerLevel":1800}'::JSONB
    WHEN 'lab'        THEN '{"maxLevel":3,"baseCost":2700,"costPerLevel":2100}'::JSONB
    WHEN 'bank'       THEN '{"maxLevel":3,"baseCost":2400,"costPerLevel":1800}'::JSONB
    WHEN 'temple'     THEN '{"maxLevel":4,"baseCost":3300,"costPerLevel":2400}'::JSONB
    WHEN 'relay'      THEN '{"maxLevel":3,"baseCost":3000,"costPerLevel":2400}'::JSONB
    ELSE NULL
  END;

  IF v_struct IS NULL THEN
    RETURN jsonb_build_object('error', 'invalid');
  END IF;

  -- ── Materiais por melhoria (espelha NEXUS_STRUCTURES.materials) ───────────
  v_materials := CASE p_struct_id
    WHEN 'hospital'   THEN '[{"id":"ninja_generico_1","qty":4},{"id":"pirata_generico_1","qty":4}]'::JSONB
    WHEN 'vault'      THEN '[{"id":"avenger_material_1","qty":5},{"id":"dc_material_1","qty":5}]'::JSONB
    WHEN 'academia'   THEN '[{"id":"ninja_generico_2","qty":5},{"id":"shinigami_generico_2","qty":5}]'::JSONB
    WHEN 'watchtower' THEN '[{"id":"dc_material_2","qty":6},{"id":"ninja_generico_2","qty":4}]'::JSONB
    WHEN 'forge'      THEN '[{"id":"shinigami_generico_3","qty":5},{"id":"avenger_material_2","qty":8}]'::JSONB
    WHEN 'barracks'   THEN '[{"id":"ninja_generico_1","qty":6},{"id":"pirata_generico_1","qty":6}]'::JSONB
    WHEN 'lab'        THEN '[{"id":"shinigami_generico_2","qty":5},{"id":"avenger_material_1","qty":5}]'::JSONB
    WHEN 'bank'       THEN '[{"id":"pirata_generico_2","qty":5},{"id":"dc_material_1","qty":5}]'::JSONB
    WHEN 'temple'     THEN '[{"id":"avenger_material_3","qty":4},{"id":"shinigami_generico_3","qty":4}]'::JSONB
    WHEN 'relay'      THEN '[{"id":"dc_material_2","qty":5},{"id":"pirata_generico_2","qty":5}]'::JSONB
    ELSE '[]'::JSONB
  END;

  v_max_level    := (v_struct->>'maxLevel')::INT;
  v_base_cost    := (v_struct->>'baseCost')::INT;
  v_cost_per_lvl := (v_struct->>'costPerLevel')::INT;

  v_level := COALESCE((v_save->'nexus'->'structures'->>p_struct_id)::INT, 0);

  IF v_level >= v_max_level THEN
    RETURN jsonb_build_object('error', 'maxed');
  END IF;

  -- Blueprint obrigatório para construção inicial (nível 0 → 1)
  IF v_level = 0 AND NOT COALESCE((v_save->'nexus'->'blueprints'->>p_struct_id)::BOOLEAN, false) THEN
    RETURN jsonb_build_object('error', 'blueprint_required');
  END IF;

  v_cost := v_base_cost + v_level * v_cost_per_lvl;
  v_gems := COALESCE((v_save->>'gemas')::BIGINT, 0);

  IF v_gems < v_cost THEN
    RETURN jsonb_build_object('error', 'gems');
  END IF;

  v_inv_mats := COALESCE(v_save->'inventario'->'materiais', '[]'::JSONB);

  -- ── Verifica disponibilidade de materiais ─────────────────────────────────
  FOR i IN 0..(jsonb_array_length(v_materials) - 1) LOOP
    v_mat_id  := v_materials->i->>'id';
    v_mat_req := (v_materials->i->>'qty')::INT;
    v_mat_have := 0;
    FOR j IN 0..(jsonb_array_length(v_inv_mats) - 1) LOOP
      IF v_inv_mats->j->>'id' = v_mat_id THEN
        v_mat_have := COALESCE((v_inv_mats->j->>'quantidade')::INT, 0);
        EXIT;
      END IF;
    END LOOP;
    IF v_mat_have < v_mat_req THEN
      RETURN jsonb_build_object('error', 'materials');
    END IF;
  END LOOP;

  -- ── Deduz materiais do inventário ─────────────────────────────────────────
  FOR i IN 0..(jsonb_array_length(v_materials) - 1) LOOP
    v_mat_id  := v_materials->i->>'id';
    v_mat_req := (v_materials->i->>'qty')::INT;
    FOR j IN 0..(jsonb_array_length(v_inv_mats) - 1) LOOP
      IF v_inv_mats->j->>'id' = v_mat_id THEN
        v_mat_new := COALESCE((v_inv_mats->j->>'quantidade')::INT, 0) - v_mat_req;
        IF v_mat_new <= 0 THEN
          SELECT COALESCE(jsonb_agg(elem), '[]'::JSONB)
          INTO   v_inv_mats
          FROM   jsonb_array_elements(v_inv_mats) WITH ORDINALITY AS t(elem, idx)
          WHERE  idx <> j + 1;
        ELSE
          v_inv_mats := jsonb_set(v_inv_mats, ARRAY[j::TEXT, 'quantidade'], to_jsonb(v_mat_new));
        END IF;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;

  -- ── Garante que nexus.structures existe ───────────────────────────────────
  IF v_save->'nexus' IS NULL THEN
    v_save := jsonb_set(v_save, '{nexus}', '{"structures":{}}'::JSONB, true);
  ELSIF v_save->'nexus'->'structures' IS NULL THEN
    v_save := jsonb_set(v_save, '{nexus,structures}', '{}'::JSONB, true);
  END IF;

  -- ── Aplica mudanças ───────────────────────────────────────────────────────
  v_save := jsonb_set(v_save, '{gemas}',                             to_jsonb(v_gems - v_cost));
  v_save := jsonb_set(v_save, '{inventario,materiais}',              v_inv_mats);
  v_save := jsonb_set(v_save, ARRAY['nexus','structures',p_struct_id], to_jsonb(v_level + 1), true);
  v_save := jsonb_set(v_save, '{_lastSyncAt}',                       to_jsonb(NOW()::TEXT));

  UPDATE public.saves
  SET    data       = v_save,
         updated_at = NOW()
  WHERE  player_id  = v_player_id;

  RETURN jsonb_build_object('ok', true, 'save', v_save);
END;
$$;

REVOKE ALL ON FUNCTION public.fn_upgrade_nexus(TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fn_upgrade_nexus(TEXT) TO authenticated;
