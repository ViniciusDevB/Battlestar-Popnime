-- =============================================================================
-- ASTD — Gacha Server-Side RPC
-- Toda a lógica de sorteio, dedução de moeda e gravação no inventário roda
-- dentro do banco. O cliente envia apenas "quero X pulls com Y moeda" e recebe
-- de volta os itens sorteados + o novo estado do save. Nenhum dado econômico
-- vem do cliente — elimina injeção de gemas/unidades via Postman ou clone local.
--
-- Execute no SQL Editor do Supabase.
-- Requer: security_patch_v2.sql já aplicado (get_my_player_id, is_admin).
-- =============================================================================

-- ─── 1. Tabela de configuração do pool ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gacha_config (
  id           SERIAL PRIMARY KEY,
  pool_star3   TEXT[]      NOT NULL,  -- IDs dos personagens 3★ sorteáveis
  pool_star4   TEXT[]      NOT NULL,  -- IDs dos personagens 4★ sorteáveis
  pool_star5   TEXT[]      NOT NULL,  -- IDs dos personagens 5★ sorteáveis
  playable_ids TEXT[]      NOT NULL,  -- IDs que vão para inventario.unidades
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.gacha_config ENABLE ROW LEVEL SECURITY;

-- Nenhum cliente lê ou altera esta tabela diretamente
DROP POLICY IF EXISTS "gacha_config_no_access" ON public.gacha_config;
CREATE POLICY "gacha_config_no_access" ON public.gacha_config
  FOR ALL TO authenticated USING (false);

-- ─── 2. Seed inicial do pool (todos os personagens gacha-elegíveis) ───────────
-- Execute apenas uma vez. Re-execução é segura (faz UPDATE se já existir).
INSERT INTO public.gacha_config (pool_star3, pool_star4, pool_star5, playable_ids)
SELECT
  ARRAY[
    'ichigo_base','goku_base','l_deathnote','demolidor','sasuke_uchiha',
    'killua_zoldyck','tanjiro_kamado','rukia_kuchiki','renji_abarai',
    'uryu_ishida','orihime_inoue','chad_yasutora',
    'luffy_3','zoro_3','nami_3','usopp_3','brook_3',
    'spider_man','black_widow','hawkeye'
  ],
  ARRAY[
    'naruto_shippuden','levi_ackerman','meliodas_base',
    'byakuya_kuchiki','toshiro_hitsugaya','kenpachi_zaraki',
    'sanji_4','robin_4','ace_4',
    'black_panther','thor','hulk_base'
  ],
  ARRAY[
    'gojo_satoru','luffy_5','ichigo_bankai'
  ],
  -- playable_ids = union dos três pools
  ARRAY[
    'ichigo_base','goku_base','l_deathnote','demolidor','sasuke_uchiha',
    'killua_zoldyck','tanjiro_kamado','rukia_kuchiki','renji_abarai',
    'uryu_ishida','orihime_inoue','chad_yasutora',
    'luffy_3','zoro_3','nami_3','usopp_3','brook_3',
    'spider_man','black_widow','hawkeye',
    'naruto_shippuden','levi_ackerman','meliodas_base',
    'byakuya_kuchiki','toshiro_hitsugaya','kenpachi_zaraki',
    'sanji_4','robin_4','ace_4',
    'black_panther','thor','hulk_base',
    'gojo_satoru','luffy_5','ichigo_bankai'
  ]
WHERE NOT EXISTS (SELECT 1 FROM public.gacha_config);

-- ─── 3. fn_gacha_pull ─────────────────────────────────────────────────────────
-- Parâmetros: p_qty INT (1 ou 10), p_currency TEXT ('gems' ou 'tickets')
-- Retorna: JSONB com { ok, results[], new_pity, new_gems, new_tickets, save }
--          ou       { error: 'motivo' }
CREATE OR REPLACE FUNCTION public.fn_gacha_pull(p_qty INT, p_currency TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id   UUID;
  v_save        JSONB;
  v_gems        BIGINT;
  v_tickets     INT;
  v_pity        INT;
  v_pulls_stat  INT;
  v_cost        INT;
  v_rate_s5     FLOAT8 := 0.01;
  v_rate_s4     FLOAT8;
  v_pool_3      TEXT[];
  v_pool_4      TEXT[];
  v_pool_5      TEXT[];
  v_playable    TEXT[];
  v_results     JSONB  := '[]';
  v_units_arr   JSONB;
  v_mats_arr    JSONB;
  v_rarity      INT;
  v_unit_id     TEXT;
  v_uid         TEXT;
  v_rand        FLOAT8;
  v_found       BOOLEAN;
  i             INT;
  j             INT;
BEGIN
  -- ── Autenticação ────────────────────────────────────────────────────────
  v_player_id := public.get_my_player_id();
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  -- ── Validação de parâmetros ──────────────────────────────────────────────
  IF p_qty NOT IN (1, 10) THEN
    RETURN jsonb_build_object('error', 'invalid_qty');
  END IF;
  IF p_currency NOT IN ('gems', 'tickets') THEN
    RETURN jsonb_build_object('error', 'invalid_currency');
  END IF;

  -- ── Carrega e trava o save (FOR UPDATE previne pulls simultâneos) ────────
  SELECT data INTO v_save
  FROM public.saves
  WHERE player_id = v_player_id
  FOR UPDATE;

  IF v_save IS NULL THEN
    RETURN jsonb_build_object('error', 'save_not_found');
  END IF;

  -- ── Lê estado atual ──────────────────────────────────────────────────────
  v_gems       := COALESCE((v_save->>'gemas')::BIGINT, 0);
  v_tickets    := COALESCE((v_save->>'tickets')::INT,   0);
  v_pity       := COALESCE((v_save->>'pity_contador')::INT, 0);
  v_pulls_stat := COALESCE((v_save->'stats'->>'pulls_realizados')::INT, 0);

  -- ── Verifica saldo e define taxa s4 ─────────────────────────────────────
  IF p_currency = 'gems' THEN
    v_cost    := CASE WHEN p_qty = 1 THEN 100 ELSE 950 END;
    v_rate_s4 := 0.29;
    IF v_gems < v_cost THEN
      RETURN jsonb_build_object('error', 'insufficient_gems');
    END IF;
  ELSE
    v_cost    := p_qty;
    v_rate_s4 := 0.45;
    IF v_tickets < v_cost THEN
      RETURN jsonb_build_object('error', 'insufficient_tickets');
    END IF;
  END IF;

  -- ── Carrega pool ─────────────────────────────────────────────────────────
  SELECT pool_star3, pool_star4, pool_star5, playable_ids
  INTO   v_pool_3,   v_pool_4,   v_pool_5,  v_playable
  FROM   public.gacha_config
  ORDER  BY updated_at DESC
  LIMIT  1;

  IF v_pool_3 IS NULL THEN
    RETURN jsonb_build_object('error', 'pool_not_configured');
  END IF;

  -- ── Inicializa arrays do inventário ─────────────────────────────────────
  v_units_arr := COALESCE(v_save->'inventario'->'unidades',  '[]');
  v_mats_arr  := COALESCE(v_save->'inventario'->'materiais', '[]');

  -- ── Sorteio ──────────────────────────────────────────────────────────────
  FOR i IN 1..p_qty LOOP
    v_pity := v_pity + 1;

    -- Determina raridade (pity garante 5★ em 150)
    IF v_pity >= 150 AND array_length(v_pool_5, 1) > 0 THEN
      v_rarity := 5;
      v_pity   := 0;
    ELSE
      v_rand := random();
      IF v_rand < v_rate_s5 AND array_length(v_pool_5, 1) > 0 THEN
        v_rarity := 5;
      ELSIF v_rand < (v_rate_s5 + v_rate_s4) THEN
        v_rarity := 4;
      ELSE
        v_rarity := 3;
      END IF;
    END IF;

    -- Escolhe personagem do pool correspondente
    CASE v_rarity
      WHEN 5 THEN v_unit_id := v_pool_5[1 + floor(random() * array_length(v_pool_5, 1))::INT];
      WHEN 4 THEN v_unit_id := v_pool_4[1 + floor(random() * array_length(v_pool_4, 1))::INT];
      ELSE        v_unit_id := v_pool_3[1 + floor(random() * array_length(v_pool_3, 1))::INT];
    END CASE;

    -- Gera UID único para esta instância (sem pgcrypto — uuid nativo)
    v_uid := substr(replace(gen_random_uuid()::text, '-', ''), 1, 13);

    -- Adiciona ao array de resultados
    v_results := v_results || jsonb_build_array(
      jsonb_build_object('id', v_unit_id, 'rarity', v_rarity, 'uid', v_uid)
    );

    -- Adiciona ao inventário
    IF v_unit_id = ANY(v_playable) THEN
      -- Personagem jogável → inventario.unidades
      v_units_arr := v_units_arr || jsonb_build_array(
        jsonb_build_object('uid', v_uid, 'id', v_unit_id, 'nivel', 1, 'xp_atual', 0)
      );
    ELSE
      -- Material → inventario.materiais (incrementa ou cria)
      v_found := false;
      FOR j IN 0..(jsonb_array_length(v_mats_arr) - 1) LOOP
        IF (v_mats_arr->j->>'id') = v_unit_id THEN
          v_mats_arr := jsonb_set(
            v_mats_arr,
            ARRAY[j::TEXT, 'quantidade'],
            to_jsonb(COALESCE((v_mats_arr->j->>'quantidade')::INT, 0) + 1)
          );
          v_found := true;
          EXIT;
        END IF;
      END LOOP;
      IF NOT v_found THEN
        v_mats_arr := v_mats_arr || jsonb_build_array(
          jsonb_build_object('id', v_unit_id, 'quantidade', 1)
        );
      END IF;
    END IF;
  END LOOP;

  -- ── Aplica mudanças ao save ───────────────────────────────────────────────
  -- Deduz moeda
  IF p_currency = 'gems' THEN
    v_save := jsonb_set(v_save, '{gemas}',   to_jsonb(v_gems    - v_cost));
  ELSE
    v_save := jsonb_set(v_save, '{tickets}', to_jsonb(v_tickets - v_cost));
  END IF;

  -- Atualiza pity, inventário e estatísticas
  v_save := jsonb_set(v_save, '{pity_contador}',             to_jsonb(v_pity));
  v_save := jsonb_set(v_save, '{inventario,unidades}',       v_units_arr);
  v_save := jsonb_set(v_save, '{inventario,materiais}',      v_mats_arr);
  v_save := jsonb_set(v_save, '{stats,pulls_realizados}',    to_jsonb(v_pulls_stat + p_qty));
  v_save := jsonb_set(v_save, '{_lastSyncAt}',               to_jsonb(NOW()::TEXT));
  v_save := jsonb_set(v_save, '{_cloudLinked}',              to_jsonb(true));

  -- ── Persiste no banco ─────────────────────────────────────────────────────
  UPDATE public.saves
  SET    data       = v_save,
         updated_at = NOW()
  WHERE  player_id  = v_player_id;

  -- ── Retorna resultado para o cliente ─────────────────────────────────────
  RETURN jsonb_build_object(
    'ok',          true,
    'results',     v_results,
    'new_pity',    v_pity,
    'new_gems',    COALESCE((v_save->>'gemas')::BIGINT,    0),
    'new_tickets', COALESCE((v_save->>'tickets')::INT,     0),
    'save',        v_save
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_gacha_pull(INT, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fn_gacha_pull(INT, TEXT) TO authenticated;

-- ─── 4. fn_update_gacha_pool (uso admin — sincroniza banner atual) ────────────
-- Chamada futura: quando o banner rodar, admin chama esta função para atualizar o pool.
CREATE OR REPLACE FUNCTION public.fn_update_gacha_pool(
  p_star3 TEXT[], p_star4 TEXT[], p_star5 TEXT[]
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'unauthorized'; END IF;
  UPDATE public.gacha_config
  SET    pool_star5  = p_star5,
         pool_star4  = p_star4,
         pool_star3  = p_star3,
         updated_at  = NOW()
  WHERE  id = (SELECT id FROM public.gacha_config ORDER BY updated_at DESC LIMIT 1);
END;
$$;

REVOKE ALL ON FUNCTION public.fn_update_gacha_pool(TEXT[], TEXT[], TEXT[]) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fn_update_gacha_pool(TEXT[], TEXT[], TEXT[]) TO authenticated;

-- =============================================================================
-- FIM. Execute no SQL Editor do Supabase.
-- Após executar, teste com: SELECT fn_gacha_pull(1, 'gems');
-- =============================================================================
