-- =============================================================================
-- ASTD — fn_craft_relic
--
-- Valida materiais, remove-os do inventário e adiciona a relíquia ao stash.
-- O servidor decide se a relíquia fica corrompida (RNG server-side).
-- Retorna { ok: true, save: {...}, isCorrupted: bool }
--      ou { error: 'insufficient_materials', material: '...' }.
--
-- p_relic_id  : ID da relíquia (chave em RELICS)
-- p_materials : [{"id":"mat_id","qty":N},...] — receita ajustada pelo cliente
--               (já inclui o multiplicador do nível da Forja)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_craft_relic(
  p_relic_id  TEXT,
  p_materials JSONB   -- [{"id": "mat_id", "qty": N}, ...]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id   UUID;
  v_save        JSONB;
  v_materiais   JSONB;
  v_stash       JSONB;
  v_mat         JSONB;
  v_mat_id      TEXT;
  v_mat_qty     INT;
  v_have        INT;
  v_forge_level INT;
  v_corrupt_pct FLOAT;
  v_rare_bonus  FLOAT;
  v_is_corrupted BOOL;
BEGIN
  v_player_id := public.get_my_player_id();
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  SELECT data INTO v_save FROM public.saves WHERE player_id = v_player_id FOR UPDATE;
  IF v_save IS NULL THEN
    RETURN jsonb_build_object('error', 'save_not_found');
  END IF;

  -- Verifica que a Forja está construída (nível >= 1)
  v_forge_level := COALESCE((v_save->'nexus'->'structures'->>'forge')::INT, 0);
  IF v_forge_level = 0 THEN
    RETURN jsonb_build_object('error', 'forge_locked');
  END IF;

  v_materiais := COALESCE(v_save->'inventario'->'materiais', '[]'::JSONB);

  -- Valida que o jogador tem todos os materiais necessários
  FOR v_mat IN SELECT value FROM jsonb_array_elements(p_materials) LOOP
    v_mat_id  := v_mat->>'id';
    v_mat_qty := (v_mat->>'qty')::INT;

    SELECT COALESCE((elem->>'quantidade')::INT, 0)
    INTO   v_have
    FROM   jsonb_array_elements(v_materiais) AS elem
    WHERE  elem->>'id' = v_mat_id
    LIMIT  1;

    IF COALESCE(v_have, 0) < v_mat_qty THEN
      RETURN jsonb_build_object('error', 'insufficient_materials', 'material', v_mat_id);
    END IF;
  END LOOP;

  -- Remove os materiais do inventário
  FOR v_mat IN SELECT value FROM jsonb_array_elements(p_materials) LOOP
    v_mat_id  := v_mat->>'id';
    v_mat_qty := (v_mat->>'qty')::INT;

    -- Reduz quantidade, removendo o item se chegar a zero
    SELECT jsonb_agg(upd)
    INTO   v_materiais
    FROM (
      SELECT
        CASE
          WHEN elem->>'id' = v_mat_id AND ((elem->>'quantidade')::INT - v_mat_qty) <= 0 THEN NULL
          WHEN elem->>'id' = v_mat_id
            THEN jsonb_set(elem, '{quantidade}', to_jsonb((elem->>'quantidade')::INT - v_mat_qty))
          ELSE elem
        END AS upd
      FROM jsonb_array_elements(v_materiais) AS elem
    ) t
    WHERE upd IS NOT NULL;

    v_materiais := COALESCE(v_materiais, '[]'::JSONB);
  END LOOP;

  v_save := jsonb_set(v_save, '{inventario,materiais}', v_materiais);

  -- Calcula chance de corrupção server-side
  -- Tabela de corruptChance por relíquia (espelha RELICS em data/relics.js)
  v_corrupt_pct := CASE p_relic_id
    WHEN 'relic_hogyoku' THEN 0.15
    ELSE 0.015
  END;

  -- Bônus do Forja nível 3 reduz corrupção em 5%
  v_rare_bonus   := CASE WHEN v_forge_level >= 3 THEN 0.05 ELSE 0.0 END;
  v_corrupt_pct  := GREATEST(0.005, v_corrupt_pct - v_rare_bonus);
  v_is_corrupted := random() < v_corrupt_pct;

  -- Adiciona relíquia ao stash
  v_stash := COALESCE(v_save->'relicStash', '[]'::JSONB)
          || jsonb_build_array(jsonb_build_object('id', p_relic_id, 'isCorrupted', v_is_corrupted));
  v_save  := jsonb_set(v_save, '{relicStash}', v_stash);
  v_save  := jsonb_set(v_save, '{_lastSyncAt}', to_jsonb(NOW()::TEXT));

  UPDATE public.saves
  SET    data       = v_save,
         updated_at = NOW()
  WHERE  player_id  = v_player_id;

  RETURN jsonb_build_object('ok', true, 'save', v_save, 'isCorrupted', v_is_corrupted);
END;
$$;

REVOKE ALL ON FUNCTION public.fn_craft_relic(TEXT, JSONB) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fn_craft_relic(TEXT, JSONB) TO authenticated;
