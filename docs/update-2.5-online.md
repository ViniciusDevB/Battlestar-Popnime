# Atualização 2.5 — ASTD Online

**Versão:** 2.5.0  
**Tema:** Conexão entre jogadores — Leaderboard, Rankings e Sistema de Trocas  
**Sem PvP · Sem Co-op · Assíncrono**

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura Técnica](#2-arquitetura-técnica)
3. [Banco de Dados — Schema Completo](#3-banco-de-dados--schema-completo)
4. [Autenticação e Perfis](#4-autenticação-e-perfis)
5. [Sincronização de Save](#5-sincronização-de-save)
6. [Leaderboard](#6-leaderboard)
7. [Rankings](#7-rankings)
8. [Sistema de Trocas](#8-sistema-de-trocas)
9. [Missões Globais da Comunidade](#9-missões-globais-da-comunidade)
10. [Anti-Cheat Online (Server-Side)](#10-anti-cheat-online-server-side)
11. [Anti-Cheat Offline (Client-Side Integrity)](#11-anti-cheat-offline-client-side-integrity)
12. [Plano de Implementação por Fases](#12-plano-de-implementação-por-fases)
13. [Estrutura de Arquivos Novos](#13-estrutura-de-arquivos-novos)
14. [Migração do Save Local](#14-migração-do-save-local)

---

## 1. Visão Geral

A atualização 2.5 introduz a camada online do ASTD de forma totalmente assíncrona — sem PvP, sem co-op em tempo real. Jogadores continuam jogando sozinhos, mas agora existem dentro de uma comunidade: seus scores aparecem em rankings globais, podem trocar personagens com outros jogadores, e participam de metas coletivas semanais.

### O que entra na 2.5

| Feature | Descrição curta |
|---|---|
| Conta e perfil | Login com email/senha, username público, avatar por rarity da unidade favorita |
| Save na nuvem | Save sincronizado automaticamente, com fallback local |
| Leaderboard | Top 100 por categoria com snapshot semanal |
| Rankings | Posição global do jogador em tempo real |
| Sistema de Trocas | Ofertas assíncronas de personagens entre jogadores |
| Missões da Comunidade | Metas globais semanais com recompensas coletivas |

### O que NÃO entra na 2.5

- PvP de qualquer natureza
- Co-op ou partidas compartilhadas
- Chat em tempo real
- Guilds/clãs

---

## 2. Arquitetura Técnica

### Backend: Supabase

**Supabase** é o backend escolhido por oferecer:
- PostgreSQL gerenciado com Row Level Security (RLS)
- Auth com email/senha e JWT
- API REST auto-gerada para todas as tabelas
- Realtime via websocket (usado apenas para notificações de troca)
- SDK JavaScript (`@supabase/supabase-js`) compatível com browser puro
- Free tier: 500MB banco + 2GB egress/mês — suficiente para escala inicial

### Fluxo de dados

```
Browser (ASTD)
    │
    ├── localStorage  ←──── fallback offline / save rápido local
    │
    └── Supabase Client SDK
            │
            ├── Auth API        (login, cadastro, token)
            ├── REST API        (leitura/escrita de tabelas)
            └── Realtime        (notificações de trocas aceitas/recusadas)
```

### Princípio de operação offline-first

O jogo continua funcionando 100% offline. A nuvem é uma camada adicional, não obrigatória. Se o Supabase estiver fora do ar ou o jogador estiver sem internet:

1. Todas as ações são salvas localmente como sempre
2. Na próxima vez que conectar, o save é sincronizado (merge por timestamp)
3. Leaderboard e trocas ficam indisponíveis, mas o jogo não trava

### Novo arquivo: `js/online.js`

Módulo IIFE `Online` que encapsula todo o SDK do Supabase e expõe funções de alto nível para o restante do jogo. Nenhum outro arquivo chama o Supabase diretamente.

```javascript
const Online = (() => {
  // Única referência ao cliente Supabase no projeto
  const _client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let _session = null;
  let _profile  = null;

  // ...funções públicas: login, logout, syncSave, postScore, fetchLeaderboard, etc.

  return { login, logout, register, getProfile, syncSave, postScore,
           fetchLeaderboard, fetchRankings, createTrade, getTrades, acceptTrade,
           declineTrade, cancelTrade, fetchCommunityMissions };
})();
```

---

## 3. Banco de Dados — Schema Completo

### Tabela: `players`

```sql
CREATE TABLE players (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id     UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE NOT NULL CHECK (length(username) BETWEEN 3 AND 20),
  avatar_unit TEXT,                    -- charId da unidade usada como avatar
  created_at  TIMESTAMPTZ DEFAULT now(),
  last_seen   TIMESTAMPTZ DEFAULT now()
);
```

### Tabela: `saves`

```sql
CREATE TABLE saves (
  player_id   UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  data        JSONB NOT NULL,          -- JSON idêntico ao astd_save_v1 local
  version     INTEGER DEFAULT 1,       -- incrementado a cada sync para detectar conflito
  updated_at  TIMESTAMPTZ DEFAULT now()
);
```

Row Level Security: cada jogador só lê/escreve o próprio save.

### Tabela: `scores`

```sql
CREATE TABLE scores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  mode        TEXT NOT NULL,           -- 'stage', 'infinite', 'event'
  stage_id    TEXT,                    -- ex: 'w1_s1', null no modo infinito
  difficulty  TEXT,                    -- 'normal', 'hard', 'lunatic'
  score       BIGINT NOT NULL,         -- critério principal de ranking
  wave        INTEGER,                 -- última wave atingida (infinito)
  damage      BIGINT,                  -- dano total da sessão
  duration_s  INTEGER,                 -- duração em segundos
  units_used  TEXT[],                  -- array de charIds usados
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para queries de leaderboard
CREATE INDEX scores_mode_score ON scores(mode, score DESC);
CREATE INDEX scores_stage_score ON scores(stage_id, difficulty, score DESC);
CREATE INDEX scores_player ON scores(player_id);
```

Row Level Security: inserção só pelo próprio jogador; leitura pública.

### Tabela: `leaderboard_snapshots`

```sql
CREATE TABLE leaderboard_snapshots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start  DATE NOT NULL,
  mode        TEXT NOT NULL,
  stage_id    TEXT,
  difficulty  TEXT,
  rank        INTEGER NOT NULL,
  player_id   UUID NOT NULL REFERENCES players(id),
  score       BIGINT NOT NULL,
  snapshot_at TIMESTAMPTZ DEFAULT now()
);
```

Populada por uma função Supabase Edge que roda todo domingo à meia-noite. Preserva histórico semanal sem depender dos dados mutáveis de `scores`.

### Tabela: `trades`

```sql
CREATE TABLE trades (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offerer_id      UUID NOT NULL REFERENCES players(id),
  receiver_id     UUID,                -- NULL = oferta aberta para qualquer jogador
  offered_unit_id TEXT NOT NULL,       -- charId do personagem oferecido
  offered_unit_uid TEXT NOT NULL,      -- uid único da instância no inventário
  offered_unit_level INTEGER DEFAULT 1,
  wanted_unit_id  TEXT,                -- charId desejado em troca (NULL = qualquer)
  wanted_unit_min_level INTEGER DEFAULT 1,
  status          TEXT DEFAULT 'open' CHECK (status IN ('open','pending','accepted','declined','cancelled','expired')),
  message         TEXT CHECK (length(message) <= 120),
  created_at      TIMESTAMPTZ DEFAULT now(),
  expires_at      TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  resolved_at     TIMESTAMPTZ
);

CREATE INDEX trades_open       ON trades(status, wanted_unit_id) WHERE status = 'open';
CREATE INDEX trades_receiver   ON trades(receiver_id, status);
CREATE INDEX trades_offerer    ON trades(offerer_id, status);
```

### Tabela: `community_missions`

```sql
CREATE TABLE community_missions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  goal_type     TEXT NOT NULL,        -- 'kills', 'damage', 'stages_cleared', 'pulls'
  goal_value    BIGINT NOT NULL,
  current_value BIGINT DEFAULT 0,
  reward_gems   INTEGER DEFAULT 0,
  reward_units  TEXT[],               -- charIds de recompensa
  starts_at     TIMESTAMPTZ NOT NULL,
  ends_at       TIMESTAMPTZ NOT NULL,
  completed     BOOLEAN DEFAULT false
);

CREATE TABLE community_contributions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id    UUID REFERENCES community_missions(id),
  player_id     UUID REFERENCES players(id),
  value         BIGINT NOT NULL,
  contributed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mission_id, player_id)      -- 1 contribuição por jogador por missão
);
```

---

## 4. Autenticação e Perfis

### Fluxo de cadastro

```
1. Jogador clica "Criar Conta" no hub
2. Modal de cadastro: email + senha + username
3. Online.register() → supabase.auth.signUp()
4. Supabase envia email de confirmação
5. Após confirmar, Online.createProfile() insere na tabela players
6. Save local é sincronizado para a nuvem automaticamente
```

### Fluxo de login

```
1. Online.login(email, senha) → supabase.auth.signInWithPassword()
2. JWT armazenado no sessionStorage (não localStorage — expira ao fechar aba)
3. Online.syncSave() → merge entre save da nuvem e save local
4. UI atualiza: mostra username, botão de trocas, leaderboard habilitado
```

### Sessão persistente

O Supabase SDK gerencia o refresh automático do JWT. Na inicialização do jogo:

```javascript
// Em main.js, após Save.load():
supabase.auth.onAuthStateChange((event, session) => {
  if (session) Online.onSessionRestored(session);
});
```

### Perfil público

Cada jogador tem uma página de perfil visualizável por link:
- Username + avatar (sprite da unidade escolhida)
- Stats públicos: fases completas, melhor wave infinita, pulls totais
- Unidades com maior nível (top 6)
- Histórico de trades concluídas

---

## 5. Sincronização de Save

### Estratégia: Last-Write-Wins com merge por seção

Conflitos de save (ex: jogador abriu em dois dispositivos) são resolvidos pela coluna `updated_at`. A seção com timestamp mais recente vence campo a campo, não o save inteiro.

```javascript
async function syncSave() {
  const local  = Save.get();
  const remote = await fetchRemoteSave();  // tabela saves

  if (!remote) {
    // Primeiro acesso — faz upload do save local
    return await pushSave(local);
  }

  const merged = mergeSaves(local, remote.data, remote.updated_at);
  Save._setData(merged);           // atualiza save local
  await pushSave(merged);          // envia para a nuvem
}

function mergeSaves(local, remote, remoteTs) {
  const localTs = new Date(local._lastSyncAt || 0);
  const cloudTs = new Date(remoteTs);

  return {
    // Inventário: usa o que tem mais unidades (nunca perde progresso)
    inventario: {
      unidades:  mergeUnits(local.inventario.unidades, remote.inventario.unidades),
      materiais: mergeMaterials(local.inventario.materiais, remote.inventario.materiais)
    },
    // Moedas: soma delta (evita sobrescrever ganhos de ambos os lados)
    gemas:   Math.max(local.gemas, remote.gemas),
    tickets: Math.max(local.tickets, remote.tickets),
    // Stats: sempre o maior valor (stats nunca diminuem)
    stats:   mergeStats(local.stats, remote.stats),
    // Fases: união (nunca perde fase completa)
    fases_completas: { ...remote.fases_completas, ...local.fases_completas },
    // Time salvo: mais recente vence
    time_salvo: cloudTs > localTs ? remote.time_salvo : local.time_salvo,
    _lastSyncAt: new Date().toISOString()
  };
}
```

### Quando sincronizar

| Evento | Ação |
|---|---|
| Login | Pull completo → merge |
| Fim de fase (vitória) | Push parcial (stats, fases, inventário) |
| Gacha pull | Push parcial (inventário, gemas) |
| Evolução/feed | Push parcial (inventário) |
| Abertura do hub | Pull silencioso em background |
| Trade aceita | Pull forçado (receber unidade) |

---

## 6. Leaderboard

### Categorias

| ID | Descrição | Critério de score |
|---|---|---|
| `infinite_wave` | Modo Infinito — maior wave atingida | `wave` DESC, depois `damage` DESC |
| `infinite_dmg`  | Modo Infinito — maior dano total | `damage` DESC |
| `stage_speed`   | Fases normais — conclusão mais rápida | `duration_s` ASC |
| `event_score`   | Fases de evento — score especial | `score` DESC |

### Tela de Leaderboard (nova aba no hub)

```
┌─────────────────────────────────────────────────┐
│  LEADERBOARD                        [Semana ▾]  │
│  ○ Wave Infinito  ○ Dano  ○ Velocidade  ○ Evento │
├─────────────────────────────────────────────────┤
│  #   JOGADOR          SCORE        UNIDADES      │
│  1   NarutoBR         Wave 847     [🟡][🟡][🟠]  │
│  2   GokuSSJ          Wave 821     [🟡][🔴][🟠]  │
│  3   IchigoFan        Wave 799     [🟠][🟠][🟡]  │
│  ...                                             │
│ ─────────────── SUA POSIÇÃO ─────────────────── │
│ 142  Você             Wave 312     [🟠][🟣][🟢]  │
└─────────────────────────────────────────────────┘
```

### Query de leaderboard (exemplo: infinito por wave)

```javascript
async function fetchLeaderboard(mode, limit = 100) {
  const { data } = await _client
    .from('scores')
    .select('score, wave, damage, units_used, players(username, avatar_unit)')
    .eq('mode', mode)
    .order('wave', { ascending: false })
    .order('damage', { ascending: false })
    .limit(limit);
  return data;
}
```

### Ranking do próprio jogador

```javascript
async function fetchMyRank(mode) {
  // Chama uma Postgres Function (RPC) para evitar full scan
  const { data } = await _client.rpc('get_player_rank', {
    p_player_id: _profile.id,
    p_mode: mode
  });
  return data; // { rank: 142, total: 3841, score: 312 }
}
```

```sql
-- Função no Supabase
CREATE OR REPLACE FUNCTION get_player_rank(p_player_id UUID, p_mode TEXT)
RETURNS TABLE(rank BIGINT, total BIGINT, score BIGINT) AS $$
  WITH best AS (
    SELECT player_id, MAX(wave) AS score
    FROM scores WHERE mode = p_mode
    GROUP BY player_id
  )
  SELECT
    RANK() OVER (ORDER BY score DESC) AS rank,
    COUNT(*) OVER () AS total,
    score
  FROM best
  WHERE player_id = p_player_id;
$$ LANGUAGE sql;
```

---

## 7. Rankings

### Diferença entre Leaderboard e Ranking

- **Leaderboard**: top 100 absoluto, atualizado ao vivo, filtrável por semana/mês/tudo
- **Ranking**: posição relativa do jogador entre todos, com percentil e badge de título

### Títulos de ranking

| Percentil | Título | Badge |
|---|---|---|
| Top 1% | **Kage** | Vermelho |
| Top 5% | **Jonin Elite** | Laranja |
| Top 15% | **Jonin** | Amarelo |
| Top 30% | **Chunin** | Verde |
| Top 50% | **Genin** | Azul |
| Resto | **Acadêmico** | Cinza |

O título é calculado localmente com os dados de `get_player_rank` — sem tabela separada.

---

## 8. Sistema de Trocas

### Fluxo completo

```
OFERTANTE                          SISTEMA                         RECEPTOR
    │                                 │                                │
    ├── Seleciona unidade p/ oferecer │                                │
    ├── Define unidade desejada       │                                │
    ├── [Opcional] Define receptor    │                                │
    ├── Confirma → createTrade()  ───►│                                │
    │                                 ├── Bloqueia unidade no save     │
    │                                 ├── status = 'open'              │
    │                                 │                                │
    │                            (receptor busca na lista de trocas)  │
    │                                 │                               ├── Vê oferta
    │                                 │                               ├── Clica aceitar
    │                                 │                               ├── acceptTrade() ─►│
    │                                 ├── Valida ambos têm as unidades  │
    │                                 ├── Troca atomicamente no banco   │
    │                                 ├── status = 'accepted'           │
    │◄─────────────────────────────── ├── Realtime notifica ofertante   │
    │                                 │                                ├── Recebe notificação
    ├── Recebe nova unidade via sync  │                                ├── Recebe nova unidade via sync
```

### Regras de negócio

1. **Limite por jogador**: máximo 5 ofertas abertas simultâneas
2. **Unidade bloqueada**: ao criar oferta, a unidade é marcada como `in_trade: true` no save. Não pode ser usada em feed/evolução enquanto bloqueada
3. **Expiração**: ofertas expiram em 7 dias automaticamente. Unidade é desbloqueada
4. **Sem troca de materiais**: apenas personagens (unidades) podem ser trocados
5. **Rarity mínima para troca**: apenas unidades 3★ ou acima
6. **Histórico**: últimas 20 trocas concluídas ficam visíveis no perfil

### UI — Tela de Trocas

```
┌──────────────────────────────────────────────────────┐
│  TROCAS                          [Minhas Ofertas (2)] │
│                                                       │
│  Filtros: [Qualquer ▾] [3★+▾] [Naruto ▾]            │
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │ NarutoBR oferece:        Quer em troca:       │    │
│  │  [Obito Nv.23 🟠]   ←→   [Itachi qualquer]   │    │
│  │  "Boa troca, Itachi p/ completar time!"       │    │
│  │                              [Propor Troca]   │    │
│  └──────────────────────────────────────────────┘    │
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │ IchigoFan oferece:       Quer em troca:       │    │
│  │  [Aizen Nv.12 🟡]   ←→   [Qualquer 5★+]     │    │
│  │                              [Propor Troca]   │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

### Transação atômica no banco (sem race condition)

A aceitação da troca é feita em uma única Postgres Function para garantir atomicidade:

```sql
CREATE OR REPLACE FUNCTION accept_trade(
  p_trade_id   UUID,
  p_accepter_id UUID
) RETURNS TEXT AS $$
DECLARE
  v_trade trades%ROWTYPE;
BEGIN
  -- Lock da linha para evitar dupla aceitação
  SELECT * INTO v_trade FROM trades
  WHERE id = p_trade_id AND status = 'open'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'trade_not_available';
  END IF;

  IF v_trade.offerer_id = p_accepter_id THEN
    RETURN 'cannot_accept_own_trade';
  END IF;

  -- Marca como aceita e registra quem aceitou
  UPDATE trades SET
    status      = 'accepted',
    receiver_id = p_accepter_id,
    resolved_at = now()
  WHERE id = p_trade_id;

  -- A transferência real das unidades é feita no cliente via syncSave
  -- após receber a confirmação de 'accepted'
  RETURN 'ok';
END;
$$ LANGUAGE plpgsql;
```

---

## 9. Missões Globais da Comunidade

### Conceito

A cada semana, uma missão global aparece no hub. Todos os jogadores contribuem juntos para a meta. Ao atingir o goal, **todos** que contribuíram recebem a recompensa — incluindo jogadores que contribuíram minimamente.

### Exemplos de missões semanais

| Semana | Meta | Recompensa |
|---|---|---|
| 1 | Comunidade elimina 10 milhões de inimigos | 200 gemas + ticket |
| 2 | Comunidade completa 50.000 fases | 3 tickets |
| 3 | Comunidade causa 1 trilhão de dano total | Personagem exclusivo "Herói da Comunidade" |

### Contribuição automática

Ao final de cada partida, se o jogador estiver logado, `Online.contributeToMission()` envia os stats da sessão. O backend incrementa `current_value` atomicamente:

```sql
-- Função RPC
CREATE OR REPLACE FUNCTION contribute_to_mission(
  p_player_id UUID, p_mission_id UUID, p_value BIGINT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO community_contributions (mission_id, player_id, value)
  VALUES (p_mission_id, p_player_id, p_value)
  ON CONFLICT (mission_id, player_id) DO UPDATE
    SET value = community_contributions.value + p_value;

  UPDATE community_missions
  SET current_value = current_value + p_value
  WHERE id = p_mission_id AND NOT completed;

  -- Verifica se atingiu o goal
  UPDATE community_missions SET completed = true
  WHERE id = p_mission_id AND current_value >= goal_value AND NOT completed;
END;
$$ LANGUAGE plpgsql;
```

---

## 10. Anti-Cheat Online (Server-Side)

### Premissa

Em um jogo browser-based, o cliente nunca é confiável. Todo dado crítico enviado ao servidor precisa ser validado independentemente, como se o cliente fosse um adversário.

### Ameaças e mitigações

| Ameaça | Mitigação |
|---|---|
| Score manipulado no cliente | Validação de plausibilidade no servidor (score máximo teórico por wave × duração) |
| Save editado e sincronizado | Checksums no cliente + validação de delta de stats no servidor |
| Bot de trocas | Rate limit: máximo 10 aceitações por dia por conta + cooldown de 30s entre ações |
| Multi-contas para top | IP rate limit no cadastro + verificação de email obrigatória |
| Injeção de unidades via trade | Validação server-side de existência da unidade no inventário do ofertante antes de aceitar |
| Replay de token JWT | Supabase RLS garante que cada operação é autenticada pelo token do próprio jogador |

### Validação de score — Supabase Edge Function

```javascript
// supabase/functions/validate-score/index.ts
const MAX_WAVE_PER_HOUR = 120;    // benchmark medido em condições normais
const MAX_DMG_PER_WAVE  = 50_000_000;
const MAX_TICKETS_TOTAL = 500;    // máximo acumulável por jogo legítimo

export function isScorePlausible(score) {
  const durationHours = score.duration_s / 3600;

  // Wave impossível para o tempo jogado (margem de 20%)
  if (score.wave > MAX_WAVE_PER_HOUR * durationHours * 1.2) return false;

  // Dano impossível para a quantidade de waves
  if (score.damage > score.wave * MAX_DMG_PER_WAVE) return false;

  // Duração mínima realista (evita submissões instantâneas)
  if (score.duration_s < score.wave * 8) return false;

  return true;
}
```

Scores implausíveis são aceitos no banco mas marcados com `flagged = true` e excluídos do leaderboard público. Um painel de moderação mostra os flagged para revisão manual.

### Validação de delta de save no servidor

Antes de aceitar um push de save, a Edge Function compara os campos críticos com o último save registrado:

```javascript
function isSaveDeltaPlausible(prev, next) {
  // Gemas nunca podem diminuir em mais do que o custo de um pull (300)
  // nem aumentar mais do que o máximo ganho em uma sessão (~5000)
  const gemsDelta = next.gemas - prev.gemas;
  if (gemsDelta > 5000) return false;

  // Unidades nunca aparecem do nada — total de pulls deve cobrir o inventário
  const prevPulls = prev.stats.pulls_realizados;
  const nextPulls = next.stats.pulls_realizados;
  const unitsDelta = next.inventario.unidades.length - prev.inventario.unidades.length;
  if (unitsDelta > (nextPulls - prevPulls) + 5) return false; // +5 = starter units

  // Stats nunca diminuem
  const statsKeys = ['inimigos_derrotados', 'fases_completas', 'pulls_realizados'];
  for (const k of statsKeys) {
    if ((next.stats[k] || 0) < (prev.stats[k] || 0)) return false;
  }

  return true;
}
```

---

## 11. Anti-Cheat Offline (Client-Side Integrity)

### Realidade e objetivo

Em um jogo browser, **não é possível impedir cheating de quem tem conhecimento técnico suficiente** — o código JS roda no cliente e o localStorage é editável livremente. O objetivo do sistema offline não é tornar o cheat impossível, mas:

1. **Detectar** a maioria das formas de trapaça comuns (edição de JSON no localStorage, injeção via console)
2. **Tornar difícil** para usuários casuais sem conhecimento técnico
3. **Bloquear a propagação** para o leaderboard — saves suspeitos offline nunca chegam ao servidor
4. **Registrar evidências** do estado adulterado para moderação

O sistema é implementado no novo arquivo `js/integrity.js`, carregado antes de `save.js`.

---

### 11.1 HMAC do Save — Detecção de Edição de localStorage

#### Conceito

Ao salvar, é gerado um HMAC-SHA256 do JSON do save. Esse hash é armazenado em uma chave separada no localStorage. Se alguém editar o JSON do save sem atualizar o hash, a adulteração é detectada no próximo carregamento.

#### Geração da chave HMAC

A chave é derivada de um salt aleatório gerado no primeiro acesso e armazenado em `astd_integrity_v1`. Quem editar o save precisaria também saber o salt para recalcular o HMAC válido — o que exige inspecionar o localStorage e entender o sistema, elevando a barra consideravelmente acima da edição casual.

```javascript
const Integrity = (() => {
  const SALT_KEY = 'astd_integrity_v1';
  const HMAC_KEY = 'astd_save_hmac_v1';

  // Gera ou recupera o salt do dispositivo
  async function _getSalt() {
    let salt = localStorage.getItem(SALT_KEY);
    if (!salt) {
      const buf = crypto.getRandomValues(new Uint8Array(32));
      salt = Array.from(buf).map(b => b.toString(16).padStart(2,'0')).join('');
      localStorage.setItem(SALT_KEY, salt);
    }
    return salt;
  }

  // Importa o salt como chave HMAC via Web Crypto API
  async function _getKey(salt) {
    const enc  = new TextEncoder();
    const raw  = enc.encode(salt + '_astd_2025');
    return crypto.subtle.importKey(
      'raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
    );
  }

  // Computa HMAC-SHA256 do JSON do save
  async function computeHmac(saveJson) {
    const salt = await _getSalt();
    const key  = await _getKey(salt);
    const enc  = new TextEncoder();
    const sig  = await crypto.subtle.sign('HMAC', key, enc.encode(saveJson));
    return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  // Grava o HMAC após cada save
  async function seal(saveJson) {
    const hmac = await computeHmac(saveJson);
    localStorage.setItem(HMAC_KEY, hmac);
  }

  // Verifica se o save não foi adulterado
  async function verify(saveJson) {
    const stored   = localStorage.getItem(HMAC_KEY);
    if (!stored) return 'no_seal';         // save antigo sem HMAC (pré-2.5)
    const computed = await computeHmac(saveJson);
    return computed === stored ? 'ok' : 'tampered';
  }

  return { seal, verify };
})();
```

#### Integração com `save.js`

```javascript
// No save.js — função save():
async function save() {
  if (!_data) return;
  const json = JSON.stringify(_data);
  try {
    localStorage.setItem(KEY, json);
    await Integrity.seal(json);      // atualiza HMAC após cada save legítimo
  } catch(e) { /* quota exceeded handling */ }
}

// No save.js — função load():
async function load() {
  const raw = localStorage.getItem(KEY);
  if (!raw) { _data = defaultSave(); return _data; }

  const verdict = await Integrity.verify(raw);
  if (verdict === 'tampered') {
    _integrityViolation = 'hmac_mismatch';
    // Não reseta o save imediatamente — registra e restringe features online
  }
  // ... resto da lógica de parse e migração
}
```

#### Resposta à adulteração detectada

| Verdict | Resposta |
|---|---|
| `ok` | Normal |
| `no_seal` | Aviso silencioso — save legítimo antigo. HMAC gerado agora |
| `tampered` | Toast de aviso ao jogador + flag `_integrityViolation` no save em memória + bloqueio de sync com leaderboard |

O jogo **não é resetado automaticamente** — isso puniria falsos positivos (ex: migração de dispositivo). O jogador pode continuar jogando offline, mas não aparece no leaderboard até a situação ser resolvida.

---

### 11.2 Validação de Plausibilidade do Save no Carregamento

Mesmo que o HMAC seja burlado (com salt copiado), o save passa por validação de consistência interna:

```javascript
function validateSavePlausibility(data) {
  const violations = [];

  // Gemas: máximo realista por tempo de jogo (~10k por hora de gacha intensiva)
  if (data.gemas > 999_999) violations.push('gemas_absurdas');

  // Unidades: total no inventário não pode ser maior que pulls totais + starters
  const maxLegitUnits = (data.stats.pulls_realizados || 0) + 10;
  if (data.inventario.unidades.length > maxLegitUnits) violations.push('unidades_excedentes');

  // Pity: deve estar entre 0 e 100
  if (data.pity_contador < 0 || data.pity_contador > 100) violations.push('pity_invalido');

  // Níveis de unidades: nenhuma pode exceder max_level
  data.inventario.unidades.forEach(u => {
    if (u.nivel > 60) violations.push(`nivel_invalido:${u.id}`);
    if (u.prestige > 10) violations.push(`prestige_invalido:${u.id}`);
  });

  // Stats não podem ser negativos
  const statsKeys = ['inimigos_derrotados','dano_total_causado','torres_colocadas'];
  statsKeys.forEach(k => {
    if ((data.stats[k] || 0) < 0) violations.push(`stat_negativo:${k}`);
  });

  return violations;
}
```

Se `violations.length > 0`, o campo `_integrityViolation` é populado com a lista. O sync online é bloqueado e um toast informa o jogador.

---

### 11.3 Monitoramento de Estado em Runtime

Durante o jogo, o `Integrity` módulo observa variáveis críticas em busca de saltos impossíveis:

```javascript
// Chamado a cada fim de wave pelo Game module
function auditGameState(state) {
  const { gold, wave, sessionDmg, sessionKills } = state;

  // Ouro não pode exceder o máximo teórico por wave (inimigos × recompensa máxima)
  const maxGoldPerWave = 500;
  if (gold > wave * maxGoldPerWave * 1.5) {
    _runtimeViolations.push({ type: 'gold_spike', wave, gold });
  }

  // Dano por kill impossível (single hit = mais de 1 bilhão)
  if (sessionKills > 0 && sessionDmg / sessionKills > 1_000_000_000) {
    _runtimeViolations.push({ type: 'dmg_per_kill_absurdo', wave });
  }
}
```

Violações de runtime são salvas no campo `_runtimeViolations` do save e impedem a submissão ao leaderboard dessa sessão.

---

### 11.4 Detecção de Função Adulterada (Console Injection)

O ataque mais comum via DevTools é sobrescrever funções: `Save.addUnit = () => {}` ou `Game.addGold = (n) => { gold += n * 1000; }`.

O Integrity module tira um "fingerprint" das funções críticas no momento do init e verifica periodicamente:

```javascript
const FunctionGuard = (() => {
  const _snapshots = {};

  // Chamado uma única vez no init, antes de qualquer interação do usuário
  function snapshot(targets) {
    // targets = { 'Save.addUnit': Save.addUnit, 'Save.spendGems': Save.spendGems, ... }
    for (const [name, fn] of Object.entries(targets)) {
      if (typeof fn === 'function') {
        _snapshots[name] = fn.toString();
      }
    }
  }

  // Chamado a cada 30s e antes de submissões ao leaderboard
  function audit(targets) {
    const patched = [];
    for (const [name, fn] of Object.entries(targets)) {
      if (typeof fn === 'function' && fn.toString() !== _snapshots[name]) {
        patched.push(name);
      }
    }
    return patched;
  }

  return { snapshot, audit };
})();
```

**Integração em `main.js`:**

```javascript
// No DOMContentLoaded, após inicialização:
FunctionGuard.snapshot({
  'Save.addUnit':     Save.addUnit,
  'Save.addGems':     Save.addGems,
  'Save.spendGems':   Save.spendGems,
  'Save.addTickets':  Save.addTickets,
  'Save.addMaterial': Save.addMaterial,
});

// Verificação periódica:
setInterval(() => {
  const patched = FunctionGuard.audit({
    'Save.addUnit':     Save.addUnit,
    'Save.addGems':     Save.addGems,
    'Save.spendGems':   Save.spendGems,
    'Save.addTickets':  Save.addTickets,
    'Save.addMaterial': Save.addMaterial,
  });
  if (patched.length > 0) {
    Integrity.recordViolation('function_patched', patched);
  }
}, 30_000);
```

> **Nota:** `fn.toString()` retorna o código-fonte da função. Uma função substituída no console terá um toString diferente da original. Isso detecta substituição mas não wrappers sofisticados — soluçôes avançadas exigiriam minificação/ofuscação.

---

### 11.5 Congelamento de Constantes Críticas

Objetos de configuração imutáveis são congelados no carregamento para dificultar modificação via console:

```javascript
// No final do carregamento de characters.js, enemies.js, stages.js:
Object.freeze(RARITY_COLORS);
Object.freeze(RARITY_LABELS);

// Para arrays de dados, freeze raso + freeze de cada item:
function deepFreeze(obj) {
  Object.getOwnPropertyNames(obj).forEach(name => {
    const val = obj[name];
    if (val && typeof val === 'object') deepFreeze(val);
  });
  return Object.freeze(obj);
}
// Aplicado aos dados de personagens e inimigos
```

> **Limitação:** `Object.freeze` impede escrita direta, mas não impede a substituição da referência (`CHARACTERS = { ... }` ainda funciona se `CHARACTERS` for declarado com `var`). Por isso a migração de `var` para `const` nos data files é parte desta seção.

---

### 11.6 Detecção de DevTools Aberto

Detectar DevTools é uma medida de dissuasão leve — não impede cheating, mas sinaliza ao jogador que a ação é registrada:

```javascript
const DevToolsGuard = (() => {
  let _open = false;

  function _check() {
    // Método 1: diferença de tamanho de janela (funciona na maioria dos browsers)
    const widthThreshold  = window.outerWidth  - window.innerWidth  > 200;
    const heightThreshold = window.outerHeight - window.innerHeight > 200;

    // Método 2: tempo de execução de debugger statement (detecta breakpoints)
    const t0 = performance.now();
    // eslint-disable-next-line no-debugger
    debugger;
    const debuggerTime = performance.now() - t0 > 100;

    return widthThreshold || heightThreshold || debuggerTime;
  }

  function startMonitoring() {
    setInterval(() => {
      const nowOpen = _check();
      if (nowOpen && !_open) {
        _open = true;
        // Não bloqueia o jogo — apenas marca a sessão como "inspecionada"
        Integrity.recordViolation('devtools_opened', { ts: Date.now() });
        console.warn(
          '%c⚠ ASTD Integrity Monitor',
          'color: #f87171; font-size: 16px; font-weight: bold',
          '\nEsta sessão foi detectada com DevTools aberto.',
          '\nSubmissões ao leaderboard desta sessão serão marcadas para revisão.'
        );
      }
      if (!nowOpen) _open = false;
    }, 2000);
  }

  return { startMonitoring };
})();
```

---

### 11.7 Módulo Integrity — Estrutura Completa

```javascript
// js/integrity.js — estrutura do módulo unificado
const Integrity = (() => {
  let _violations = [];       // violações da sessão atual
  let _savedViolations = [];  // violações persistidas no save

  function recordViolation(type, detail) {
    const v = { type, detail, ts: Date.now() };
    _violations.push(v);
    console.warn('[Integrity]', type, detail);
    // Persiste no save para auditoria posterior
    Save.get()._integrityViolations = [
      ...(Save.get()._integrityViolations || []).slice(-19),
      v
    ];
  }

  // Retorna true se a sessão está limpa para submissão ao leaderboard
  function isClean() {
    const blockers = ['hmac_mismatch', 'unidades_excedentes', 'function_patched', 'gold_spike'];
    return !_violations.some(v => blockers.includes(v.type));
  }

  // Chamado por Online.postScore() antes de qualquer envio
  function assertCleanOrThrow() {
    if (!isClean()) throw new Error('integrity_violation');
  }

  return { seal, verify, auditGameState, recordViolation, isClean, assertCleanOrThrow };
})();
```

---

### 11.8 Tabela de Violações — O que cada uma bloqueia

| Violação | Causa | Bloqueia leaderboard | Bloqueia trocas | Reset de save |
|---|---|---|---|---|
| `no_seal` | Save pré-2.5 sem HMAC | Não | Não | Não |
| `hmac_mismatch` | JSON editado no localStorage | **Sim** | Não | Não |
| `unidades_excedentes` | Mais unidades que pulls possíveis | **Sim** | **Sim** | Não |
| `nivel_invalido` | Unidade acima do nível máximo | **Sim** | **Sim** | Campo específico |
| `function_patched` | Função substituída via console | **Sim** | Não | Não |
| `gold_spike` | Ouro impossível em runtime | **Sim** | Não | Não |
| `devtools_opened` | DevTools detectado | Marcado p/ revisão | Não | Não |

---

### 11.9 Limitações conhecidas e honestidade sobre o sistema

| O que o sistema **protege** | O que ele **não protege** |
|---|---|
| Edição casual de JSON no localStorage | Cheater que lê o código e recalcula o HMAC |
| Injeção simples de função via console | Cheater que copia o salt e recria o contexto |
| Valores absurdos no save | Memory editing via extensões do browser |
| Multiplicação de ouro via override de função | Modificação do código JS antes do carregamento |
| Propagação de saves trapaceados ao leaderboard | Uso do CheatMode legítimo (CHEATON) — esse é intencional |

O CheatMode existente (`CHEATON`) é a única forma **intencional e autorizada** de dar vantagens. O sistema de integridade reconhece que uma sessão com cheatmode ativado (`Save.get()._cheatMode === true`) é legítima por design — ela simplesmente não aparece no leaderboard.

---

## 12. Plano de Implementação por Fases

### Fase 1 — Infraestrutura + Integrity (sem feature visível ao jogador)

- [ ] Criar projeto no Supabase
- [ ] Implementar schema completo (todas as tabelas + coluna `flagged` em `scores`)
- [ ] Criar `js/integrity.js` com HMAC, FunctionGuard, DevToolsGuard e auditGameState
- [ ] Integrar `Integrity.seal()` / `verify()` e plausibilidade no `save.js`
- [ ] Migrar `var PASSIVE_ENTRIES` → `const` e demais globals de `var` para `const`
- [ ] Criar `js/online.js` com cliente Supabase e funções base
- [ ] Adicionar `supabase-js` via CDN no `index.html`
- [ ] Implementar `Online.syncSave()` completo com merge
- [ ] Testes: sem conta, login, conflito de save, HMAC mismatch, plausibilidade

### Fase 2 — Conta e Perfil

- [ ] Modal de cadastro/login na UI (novo componente em `ui.js`)
- [ ] Tela de perfil público (nova aba no hub)
- [ ] Indicador de status online no canto do hub (username + avatar)
- [ ] Opção de deslogar
- [ ] `FunctionGuard.snapshot()` no init + auditoria periódica (30s)
- [ ] `DevToolsGuard.startMonitoring()` no init

### Fase 3 — Leaderboard e Rankings

- [ ] Envio automático de score ao fim de partida com `Integrity.assertCleanOrThrow()`
- [ ] Edge Function `validate-score` com plausibilidade server-side
- [ ] Tela de Leaderboard com filtros de modo e período
- [ ] Badge de título (Kage, Jonin, etc.) visível no perfil e no hub
- [ ] Postgres Functions: `get_player_rank`, snapshot semanal
- [ ] Painel de moderação para scores `flagged = true`

### Fase 4 — Sistema de Trocas

- [ ] Lógica de bloqueio de unidade no `Save` local (`in_trade` flag)
- [ ] Validação de plausibilidade antes de criar oferta (`Integrity.isClean()`)
- [ ] Tela de Trocas: listagem, filtros, criação de oferta
- [ ] Notificação realtime de trade aceita/recusada
- [ ] Postgres Function `accept_trade` atômica
- [ ] Expiração automática: cron job Supabase a cada hora

### Fase 5 — Missões da Comunidade + Polish

- [ ] Widget de missão global na tela do hub
- [ ] Contribuição automática pós-partida (filtrada por `Integrity.isClean()`)
- [ ] Barra de progresso comunitária em tempo real (Realtime subscription)
- [ ] Sistema de entrega de recompensa ao atingir meta
- [ ] Testes de stress com dados simulados
- [ ] Validação de delta de save na Edge Function de sync

---

## 13. Estrutura de Arquivos Novos

```
ASTD/
├── index.html                (adicionar tags <script>: supabase CDN + novos módulos)
├── js/
│   ├── integrity.js          (NOVO — HMAC, FunctionGuard, DevToolsGuard, auditGameState)
│   ├── online.js             (NOVO — cliente Supabase, todas as funções online)
│   ├── ui-online.js          (NOVO — componentes DOM: login modal, leaderboard, trocas)
│   ├── save.js               (MODIFICADO — seal/verify Integrity, _lastSyncAt, in_trade)
│   └── main.js               (MODIFICADO — FunctionGuard.snapshot, DevToolsGuard.start)
├── data/
│   └── online_config.js      (NOVO — SUPABASE_URL e SUPABASE_ANON_KEY, sem segredos)
├── supabase/
│   └── functions/
│       └── validate-score/   (NOVO — Edge Function de validação server-side)
└── docs/
    └── update-2.5-online.md  (este documento)
```

### Ordem de carregamento em `index.html`

```html
<!-- CDN do Supabase (antes de qualquer script do jogo) -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Config pública -->
<script src="data/online_config.js"></script>

<!-- Integrity ANTES do save.js — save.js usa Integrity.seal/verify -->
<script src="js/integrity.js"></script>

<!-- Lógica online (depois do save.js, antes do main.js) -->
<script src="js/online.js"></script>
<script src="js/ui-online.js"></script>
```

---

## 14. Migração do Save Local

Jogadores existentes (com save em `localStorage`) precisam de uma migração suave:

### Fluxo de migração para novos usuários logados

```
1. Jogador cria conta (ou loga pela primeira vez)
2. Online.syncSave() detecta: save na nuvem ausente, save local presente
3. Sistema pergunta: "Deseja sincronizar seu progresso atual para a nuvem?"
4. Jogador confirma → push do save local para tabela saves
5. Campo _cloudLinked = true adicionado ao save
6. A partir daí, sync é automático
```

### Compatibilidade do schema do save

O JSONB na tabela `saves` armazena o mesmo objeto do `astd_save_v1` local sem alterações estruturais. Campos novos introduzidos pela 2.5 (`_lastSyncAt`, flag `in_trade` nas unidades) são opcionais e têm fallback `null`/`false` — save antigo continua válido.

---

*Documento de design — ASTD Update 2.5*  
*Gerado em: 2026-06-08*
