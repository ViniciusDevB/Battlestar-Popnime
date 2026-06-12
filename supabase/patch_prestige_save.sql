-- =============================================================================
-- ASTD — patch_prestige_save.sql
--
-- Problema: múltiplos arquivos SQL criaram versões sobrecarregadas de
-- fn_update_inventory com 1, 2 e 3 parâmetros. PostgreSQL não consegue
-- desambiguar quando o cliente chama com 2 parâmetros nomeados (p_inventory
-- + p_relic_stash), causando erro silencioso → updateInventory() retorna
-- {ok:false} → prestígio e relíquia não persistem no servidor → reload
-- restaura o estado antigo (nível 50, sem relíquia).
--
-- Solução: dropar todos os overloads antigos e manter apenas a versão
-- canônica de 3 parâmetros, que agora retorna o save completo para que
-- o cliente possa aplicar o estado do servidor imediatamente.
--
-- Execute no SQL Editor do Supabase — pode rodar em cima de qualquer versão.
-- =============================================================================

-- Remove overloads antigos que causam ambiguidade
DROP FUNCTION IF EXISTS public.fn_update_inventory(JSONB);
DROP FUNCTION IF EXISTS public.fn_update_inventory(JSONB, JSONB);

-- Versão canônica única: 3 parâmetros opcionais, retorna save completo
CREATE OR REPLACE FUNCTION public.fn_update_inventory(
    p_inventory     JSONB,
    p_relic_stash   JSONB DEFAULT NULL,
    p_nexus_structs JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_player_id     UUID;
    v_save          JSONB;
    v_nexus_merged  JSONB;
    v_blueprints    JSONB;
    v_relic_recipes JSONB;
    k               TEXT;
BEGIN
    v_player_id := public.get_my_player_id();
    IF v_player_id IS NULL THEN
        RETURN jsonb_build_object('error', 'unauthorized');
    END IF;

    SELECT data INTO v_save FROM public.saves WHERE player_id = v_player_id FOR UPDATE;
    IF v_save IS NULL THEN
        RETURN jsonb_build_object('error', 'save_not_found');
    END IF;

    -- Sempre substitui inventário com o do cliente (autoridade do cliente para inventário)
    v_save := jsonb_set(v_save, '{inventario}', p_inventory);

    -- relicStash: substitui quando fornecido (relic equip remove do stash e coloca na unidade)
    IF p_relic_stash IS NOT NULL THEN
        v_save := jsonb_set(v_save, '{relicStash}', p_relic_stash);
    END IF;

    -- nexus.structures: merge tomando máximo por chave (nunca regride nível)
    -- Preserva blueprints e relicRecipes intocados
    IF p_nexus_structs IS NOT NULL THEN
        SELECT COALESCE(jsonb_object_agg(k,
            to_jsonb(GREATEST(
                COALESCE((v_save->'nexus'->'structures'->>k)::INT, 0),
                COALESCE((p_nexus_structs->>k)::INT, 0)
            ))
        ), '{}')
        INTO v_nexus_merged
        FROM (
            SELECT DISTINCT k FROM (
                SELECT jsonb_object_keys(COALESCE(v_save->'nexus'->'structures', '{}')) AS k
                UNION ALL
                SELECT jsonb_object_keys(p_nexus_structs) AS k
            ) t
        ) keys;

        v_blueprints    := COALESCE(v_save->'nexus'->'blueprints', '{}');
        v_relic_recipes := COALESCE(v_save->'nexus'->'relicRecipes', '{}');
        v_save := jsonb_set(v_save, '{nexus}',
            jsonb_build_object(
                'structures',   v_nexus_merged,
                'blueprints',   v_blueprints,
                'relicRecipes', v_relic_recipes
            ));
    END IF;

    v_save := jsonb_set(v_save, '{_lastSyncAt}', to_jsonb(NOW()::TEXT));

    UPDATE public.saves
    SET    data       = v_save,
           updated_at = NOW()
    WHERE  player_id  = v_player_id;

    -- Retorna save completo para o cliente aplicar estado canônico sem reload
    RETURN jsonb_build_object('ok', true, 'save', v_save);
END;
$$;

REVOKE ALL ON FUNCTION public.fn_update_inventory(JSONB, JSONB, JSONB) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fn_update_inventory(JSONB, JSONB, JSONB) TO authenticated;
