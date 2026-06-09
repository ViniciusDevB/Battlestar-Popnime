# Guia de Balanceamento — Battlestar Popnime

> Gerado em 2026-06-09 a partir de `data/characters.js`, `data/enemies.js`, `data/stages.js`, `data/world.js`.
> Documento vivo: atualize após cada update que adicione unidades, inimigos ou mundos.

---

## 1. Princípios de Design (Regras Não Negociáveis)

### 1.1 Acessibilidade de Conteúdo

- **Nenhum estágio exige uma unidade específica.** Qualquer fase deve ser clearável com uma equipe razoável da raridade esperada para o mundo, sem prestige e sem composição metaforçada (ex: "Ichigo 6⭐ P10 obrigatório").
- **Margem de segurança mínima (P0, equipe de 4):** DPS disponível ≥ 1.0× DPS exigido pelo boss. Alvo confortável: ≥ 1.5×.
- **Prestige é bônus, não requisito.** Jogadores que nunca prestigiaram devem conseguir clear do último mundo disponível.

### 1.2 Progressão de Raridade

- **Unidades de raridade maior sempre superam** o DPS bruto de raridades menores. Um 6⭐ deve ser visivelmente mais forte que um 4⭐.
- **Novas unidades são marginalmente mais fortes** que as existentes da mesma raridade — dentro do envelope de design (seção 4), não fora dele.
- **Evolução tem custo oculto** (materiais de gacha). O DPS pós-evolução deve justificar isso vs simplesmente gachar um tier acima diretamente.

### 1.3 Economia

- **Farm não é requisito.** O jogador deve conseguir clear sem L/farm se construir a equipe de combate corretamente. Farm é acelerador.
- **Novos mundos calibram ouro ao custo de deploy** das unidades necessárias. Se o deploy médio subiu 3×, o ouro por wave ou kill deve escalar proporcionalmente.
- **Bosses entregam o mesmo ouro que capangas** (50 fixo). Em updates futuros, considerar bônus proporcional ao HP do boss.

### 1.4 Red Flags (Nunca Faça)

- ❌ Boss com HP/speed que resulta em margem < 1.0× com equipe P0 da raridade esperada
- ❌ Unidade de raridade menor mais eficiente (ouro/DPS) que todas as de raridade 2+ acima
- ❌ Unidade 6⭐ com ouro/DPS pior que a média dos 5⭐
- ❌ Unit event-exclusive com deploy > 2× a média da raridade sem DPS proporcional
- ❌ Balancear conteúdo assumindo que o jogador terá P5+ em múltiplas unidades

## 2. Unidades de Combate — Estado Atual

> **DPS = damage × attack\_speed** (attack\_speed = ataques/s; confirmado em game.js: `attackTimer = 1/attack_speed`).
> **DPS Ef.** = DPS Máx × mult. tipo (hits médios/ataque em wave típica) — use para comparar eficiência geral.
> **DPS Boss** = DPS Máx sem mult. tipo (boss é alvo único) — use para análise de clearabilidade.
> **Ouro/DPS Ef.** = custo total ÷ DPS Ef. Menor = mais eficiente. Ordenado crescente.

| Personagem | ⭐ | Série | Deploy | Total | DPS Base | DPS Máx | DPS Boss | Tipo | ×Tipo | DPS Ef. | Ouro/DPS | P1/P10 DPS | Perfil |
|---|:---:|---|---:|---:|---:|---:|---:|---|:---:|---:|---:|---|---|
| Gojo Satoru | 5⭐ | jjk | 500 | 4470 | 761 | 2836 | 2836 | aoe_full | ×7.0 | **19851** | 0.23 | 3.4k / 8.5k | Aura |
| Luffy (Gear 4) | 5⭐ | onepiece | 650 | 3050 | 770 | 1725 | 1725 | aoe | ×4.0 | **6899** | 0.44 | 2.1k / 5.2k | Puro Dano |
| Robin | 4⭐ | onepiece | 300 | 1350 | 183 | 385 | 385 | aoe_full | ×7.0 | **2692** | 0.50 | 462 / 1.2k | Puro Dano |
| Naruto (Shippuden) | 4⭐ | naruto | 300 | 4480 | 233 | 1903 | 1903 | aoe | ×4.0 | **7614** | 0.59 | 2.3k / 5.7k | Puro Dano |
| 🔁Zoro (Ashura) | 5⭐ | onepiece | 600 | 2800 | 784 | 1647 | 1647 | linha | ×2.5 | **4116** | 0.68 | 2.0k / 4.9k | Puro Dano |
| Meliodas | 4⭐ | nanatsu | 300 | 4430 | 210 | 1378 | 1378 | aoe | ×4.0 | **5513** | 0.80 | 1.7k / 4.1k | DoT |
| Levi Ackerman | 4⭐ | snk | 300 | 5555 | 264 | 2680 | 2680 | linha | ×2.5 | **6700** | 0.83 | 3.2k / 8.0k | Frenezi |
| Zoro (East Blue) | 3⭐ | onepiece | 140 | 740 | 209 | 407 | 407 | cone | ×2.0 | **813** | 0.91 | 488 / 1.2k | CC |
| Ace | 4⭐ | onepiece | 320 | 1520 | 319 | 766 | 766 | cone | ×2.0 | **1531** | 0.99 | 919 / 2.3k | DoT |
| 🔁Ichigo (Vizard) | 6⭐ | bleach | 1400 | 16350 | 637 | 8080 | 8080 | cone | ×2.0 | **16160** | 1.01 | 9.7k / 24.2k | Puro Dano |
| Luffy (East Blue) | 3⭐ | onepiece | 120 | 570 | 209 | 528 | 528 | single_target | ×1.0 | **528** | 1.08 | 633 / 1.6k | Puro Dano |
| Orochimaru | 4⭐ | naruto | 450 | 1900 | 220 | 429 | 429 | aoe | ×4.0 | **1716** | 1.11 | 515 / 1.3k | DoT+Farm |
| Pain (Seis Caminhos) | 5⭐ | naruto | 800 | 4400 | 385 | 970 | 970 | aoe | ×4.0 | **3881** | 1.13 | 1.2k / 2.9k | Puro Dano |
| Goku (Base) | 3⭐ | dragonball | 150 | 2960 | 120 | 986 | 986 | linha | ×2.5 | **2466** | 1.20 | 1.2k / 3.0k | Crítico |
| Barba Branca | 5⭐ | onepiece | 700 | 3400 | 488 | 1024 | 1024 | linha | ×2.5 | **2559** | 1.33 | 1.2k / 3.1k | Invocação |
| Brook | 3⭐ | onepiece | 180 | 800 | 109 | 229 | 229 | linha | ×2.5 | **572** | 1.40 | 274 / 686 | DoT |
| Ichigo (Bankai) | 5⭐ | bleach | 600 | 4850 | 480 | 1290 | 1290 | linha | ×2.5 | **3226** | 1.50 | 1.5k / 3.9k | Aura |
| Byakuya Kuchiki | 4⭐ | bleach | 380 | 3430 | 157 | 454 | 454 | scatter | ×5.0 | **2271** | 1.51 | 545 / 1.4k | Puro Dano |
| 🎪Tsunade | 4⭐ | naruto | 600 | 8700 | 288 | 1378 | 1378 | aoe | ×4.0 | **5511** | 1.58 | 1.7k / 4.1k | Defesa |
| Renji Abarai | 3⭐ | bleach | 240 | 2370 | 116 | 360 | 360 | aoe | ×4.0 | **1441** | 1.64 | 432 / 1.1k | Puro Dano |
| Thor | 4⭐ | marvel | 350 | 6970 | 275 | 1045 | 1045 | aoe | ×4.0 | **4181** | 1.67 | 1.3k / 3.1k | Puro Dano |
| Sanji | 4⭐ | onepiece | 250 | 1150 | 376 | 685 | 685 | single_target | ×1.0 | **685** | 1.68 | 822 / 2.1k | DoT |
| Orihime Inoue | 3⭐ | bleach | 210 | 1980 | 64 | 155 | 155 | aoe_full | ×7.0 | **1084** | 1.83 | 186 / 465 | Defesa |
| Demolidor | 3⭐ | marvel | 150 | 2815 | 116 | 571 | 571 | linha | ×2.5 | **1427** | 1.97 | 685 / 1.7k | CC |
| Hulk | 4⭐ | marvel | 350 | 6970 | 158 | 872 | 872 | aoe | ×4.0 | **3487** | 2.00 | 1.0k / 2.6k | Puro Dano |
| Homem-Aranha | 3⭐ | marvel | 150 | 3990 | 173 | 985 | 985 | cone | ×2.0 | **1969** | 2.03 | 1.2k / 3.0k | CC |
| 🔁Naruto (Sage Mode) | 5⭐ | naruto | 500 | 5600 | 653 | 2744 | 2744 | single_target | ×1.0 | **2744** | 2.04 | 3.3k / 8.2k | Invocação |
| Nami | 3⭐ | onepiece | 150 | 700 | 87 | 169 | 169 | cone | ×2.0 | **339** | 2.07 | 203 / 508 | Puro Dano |
| 🔁Hulk Quebra-Mundo | 5⭐ | marvel | 1000 | 17000 | 352 | 2037 | 2037 | aoe | ×4.0 | **8149** | 2.09 | 2.4k / 6.1k | Puro Dano |
| Killua Zoldyck | 3⭐ | hxh | 150 | 3720 | 145 | 890 | 890 | cone | ×2.0 | **1781** | 2.09 | 1.1k / 2.7k | Puro Dano |
| Tanjiro Kamado | 3⭐ | kimetsu | 150 | 2875 | 104 | 643 | 643 | cone | ×2.0 | **1286** | 2.24 | 771 / 1.9k | Puro Dano |
| Kenpachi Zaraki | 4⭐ | bleach | 420 | 3820 | 156 | 854 | 854 | cone | ×2.0 | **1708** | 2.24 | 1.0k / 2.6k | Frenezi |
| Ichigo (Base) | 3⭐ | bleach | 150 | 3570 | 128 | 626 | 626 | linha | ×2.5 | **1566** | 2.28 | 752 / 1.9k | DoT |
| Sasuke Uchiha | 3⭐ | naruto | 150 | 2870 | 104 | 467 | 467 | linha | ×2.5 | **1168** | 2.46 | 560 / 1.4k | Crítico |
| Viúva Negra | 3⭐ | marvel | 150 | 3870 | 167 | 629 | 629 | linha | ×2.5 | **1571** | 2.46 | 754 / 1.9k | Aura |
| 🎪Killer Bee | 5⭐ | naruto | 800 | 12700 | 384 | 995 | 995 | scatter | ×5.0 | **4977** | 2.55 | 1.2k / 3.0k | Bijuu |
| Uryu Ishida | 3⭐ | bleach | 230 | 2100 | 108 | 323 | 323 | pierce | ×2.5 | **809** | 2.60 | 388 / 970 | Puro Dano |
| Toshiro Hitsugaya | 4⭐ | bleach | 400 | 3630 | 128 | 338 | 338 | aoe | ×4.0 | **1354** | 2.68 | 406 / 1.0k | CC |
| Iron Man Mark 50 | 5⭐ | marvel | 800 | 13700 | 401 | 2015 | 2015 | linha | ×2.5 | **5038** | 2.72 | 2.4k / 6.0k | Puro Dano |
| Chad Yasutora | 3⭐ | bleach | 260 | 2580 | 133 | 403 | 403 | cone | ×2.0 | **806** | 3.20 | 483 / 1.2k | Anti-Boss |
| Rukia Kuchiki | 3⭐ | bleach | 225 | 2175 | 110 | 247 | 247 | linha | ×2.5 | **617** | 3.53 | 296 / 740 | CC |
| Gavião Arqueiro | 3⭐ | marvel | 150 | 3920 | 81 | 417 | 417 | pierce | ×2.5 | **1043** | 3.76 | 501 / 1.3k | Puro Dano |
| Usopp | 3⭐ | onepiece | 160 | 760 | 81 | 170 | 170 | single_target | ×1.0 | **170** | 4.47 | 204 / 510 | Puro Dano |
| Pantera Negra | 4⭐ | marvel | 350 | 6950 | 277 | 1391 | 1391 | single_target | ×1.0 | **1391** | 5.00 | 1.7k / 4.2k | Puro Dano |

🔁 = evolução (custo gacha não incluso) | 🎪 = exclusivo de evento

**Top 3 eficientes:** Gojo Satoru (0.23) → Luffy (Gear 4) (0.44) → Robin (0.50)

**3 menos eficientes:** Gavião Arqueiro (3.76) → Usopp (4.47) → Pantera Negra (5.00)

## 3. Unidades de Farm e Suporte Puro

| Personagem | ⭐ | Deploy | Total | Ouro/Wave Base | Ouro/Wave Máx | Kill Gold | Perfil |
|---|:---:|---:|---:|---:|---:|---|---|
| L (Death Note) | 3⭐ | 150 | 1860 | 50 | **500** | +15/kill | Farm |

> Ouro fixo por wave = 100. Uma farm maxada pode dobrar/triplicar a renda passiva. Mas farm só vale se a equipe de combate sobrevive sem ela — não projete fases que exijam farm para passar.

## 4. Envelopes de Design por Raridade

Use esta seção ao criar novas unidades. O objetivo: novas unidades são **marginalmente melhores** que a média, sem sair do envelope.

| Raridade | Qtd | Ouro/DPS mín | Ouro/DPS méd | Ouro/DPS máx | DPS Boss méd | DPS Boss máx | Alvo novas (ouro/DPS) |
|---|:---:|---:|---:|---:|---:|---:|---|
| 3⭐ | 19 | 0.91 | 2.27 | 4.47 | 484 | 986 | 0.91–2.00 |
| 4⭐ | 14 | 0.50 | 1.66 | 5.00 | 1040 | 2680 | 0.50–1.46 |
| 5⭐ | 10 | 0.23 | 1.47 | 2.72 | 1728 | 2836 | 0.23–1.29 |
| 6⭐ | 1 | 1.01 | 1.01 | 1.01 | 8080 | 8080 | 1.01–0.89 |

### Custo de Referência por Raridade

| Raridade | Deploy alvo | Custo total alvo | Upgrades mínimos |
|---|---|---|:---:|
| 3⭐ | 120–300 | 600–3000 | 3+ |
| 4⭐ | 300–600 | 1500–6000 | 3+ |
| 5⭐ | 500–900 | 3000–10000 | 3+ |
| 6⭐ | 1000–1800 | 5000–16000 | 3+ |

> **Regra prática:** passivas de Aura (ex: Gojo +25% equipe) ou CC permitem DPS individual menor — a passiva multiplica o output do time inteiro. Documente o multiplicador real ao adicionar Auras novas.

## 5. Clearabilidade por Mundo — Boss Final

**Método:** DPS Necessário = HP ÷ (Comprimento Caminho ÷ Velocidade Boss). DPS Disponível = soma dos 4 melhores DPS Boss (sem prestige, rarity ≤ cap do mundo).

| Mundo | Fase | Boss | HP | Vel | Caminho | Tempo | DPS Nec. | Equipe referência | DPS Disp. | Margem |
|---|---|---|---:|---:|---:|---:|---:|---|---:|:---:|
| naruto | O Julgamento | Pain (Nagato) | 20.000 | 38 | 1814px | 47.7s | **419** | Levi Ackerman, Naruto (Shippuden), Pantera Negra, Meliodas | 7352 | 🟢 **17.55×** |
| onepiece | Guerra dos Melhores | Akainu | 35.000 | 40 | 1848px | 46.2s | **758** | Levi Ackerman, Naruto (Shippuden), Pantera Negra, Meliodas | 7352 | 🟢 **9.70×** |
| bleach | Fake Karakura | Aizen — Estrategista | 75.000 | 22 | 1824px | 82.9s | **905** | Gojo Satoru, Naruto (Sage Mode), Levi Ackerman, Hulk Quebra-Mundo | 10297 | 🟢 **11.38×** |
| marvel | O Espaço | Thanos — O Eterno | 100.000 | 20 | 2284px | 114.2s | **876** | Ichigo (Vizard), Gojo Satoru, Naruto (Sage Mode), Levi Ackerman | 16340 | 🟢 **18.65×** |

🟢 ≥2.0× confortável | 🟡 1.5–2.0× seguro | 🟠 1.0–1.5× apertado | 🔴 <1.0× impossível sem prestige

### 5.1 Impacto do Prestígio na Clearabilidade

| Mundo | Boss | DPS Nec. | P0 (base) | P1 (+20%) | P5 (+100%) | Margem P0 | Margem P1 | Margem P5 |
|---|---|---:|---:|---:|---:|:---:|:---:|:---:|
| naruto | Pain (Nagato) | 419 | 7352 | 8823 | 14706 | 🟢17.55× | 🟢21.06× | 🟢35.10× |
| onepiece | Akainu | 758 | 7352 | 8823 | 14706 | 🟢9.70× | 🟢11.64× | 🟢19.40× |
| bleach | Aizen — Estrategista | 905 | 10297 | 12357 | 20595 | 🟢11.38× | 🟢13.65× | 🟢22.76× |
| marvel | Thanos — O Eterno | 876 | 16340 | 19608 | 32680 | 🟢18.65× | 🟢22.38× | 🟢37.31× |

> Se P0 já é ≥1.5×, prestige é bônus. Se P0 < 1.0×, o boss foi mal calibrado — corrija antes de lançar.

## 6. Sistema de Prestígio — Referência

Implementação em game.js: `stats.damage *= 1 + tower.prestige * 0.20` (linear por nível de prestige).

| Prestígio | Mult. Dano | Bônus Range | DPS resultante |
|:---:|---:|---:|---|
| P0  | ×1.00 | +0%  | Base |
| P1  | ×1.20 | +6%  | +20% DPS + passiva única P1 |
| P5  | ×2.00 | +30% | DPS dobrado + passiva única P5 |
| P10 | ×3.00 | +60% | DPS triplicado + passiva única P10 |

> **Cuidado:** uma 4⭐ P10 tem 3× o DPS de P0, aproximando-se de uma 6⭐ sem prestige. Nunca calibre um estágio assumindo P5+ em múltiplas unidades.

Unidades com passivas de prestígio (44): Gojo Satoru, Luffy (Gear 4), Robin, Naruto (Shippuden), Zoro (Ashura), Meliodas, Levi Ackerman, Zoro (East Blue), Ace, Ichigo (Vizard), Luffy (East Blue), Orochimaru, Pain (Seis Caminhos), Goku (Base), Barba Branca, Brook, Ichigo (Bankai), Byakuya Kuchiki, Tsunade, Renji Abarai, Thor, Sanji, Orihime Inoue, Demolidor, Hulk, Homem-Aranha, Naruto (Sage Mode), Nami, Hulk Quebra-Mundo, Killua Zoldyck, Tanjiro Kamado, Kenpachi Zaraki, Ichigo (Base), Sasuke Uchiha, Viúva Negra, Killer Bee, Uryu Ishida, Toshiro Hitsugaya, Iron Man Mark 50, Chad Yasutora, Rukia Kuchiki, Gavião Arqueiro, Usopp, Pantera Negra

## 7. Economia do Jogo

| Fonte | Ouro | Observação |
|---|---:|---|
| Inicial | 300 | Fixo |
| Por wave completa | 100 | Fixo |
| Por kill | 50 | Fixo — boss = mesmo que capanga |
| Skip de wave | 100 × mult | Mult sobe 1 por skip (começa em 2) |
| Farm maxada | +500/wave | Ver seção 3 |

### Orçamento Estimado — Stage de 6 Waves

- **Sem farm/skip:** ~3900 ouro (inicial + waves + ~10 kills/wave)
- **Com farm maxada:** ~6900 ouro
- **Com farm + 2 skips:** ~7400 ouro

> Novos mundos devem ser calibrados para que o jogador consiga fazer 2–3 upgrades da equipe dentro do orçamento sem farm. Se o deploy médio do tier subir muito, aumentar ouro por wave ou kill dos estágios.

## 8. Inimigos — Escalonamento de HP

| Inimigo | HP | Vel | Tipos | Especial | Ouro/Kill | Classe |
|---|---:|---:|---|---|---:|---|
| Thanos — Manopla Completa | 120.000 | 55 | powerful3 | thanos_manopla_special | 50 | 🔴 Boss |
| Thanos — O Eterno | 100.000 | 20 | powerful3+fortified | thanos_fase1_special | 50 | 🔴 Boss |
| Replicante de Killer Bee | 100.000 | 60 | powerful3 | killerbee_replica_special | 50 | 🔴 Boss |
| Aizen — Hogyoku Desperto | 85.000 | 90 | powerful3 | aizen_hogyoku_phase2 | 50 | 🔴 Boss |
| Replicante do Tsuchikage | 80.000 | 42 | powerful3 | tsuchikage_special | 50 | 🔴 Boss |
| Aizen — Estrategista | 75.000 | 22 | powerful3+fortified | aizen_hogyoku_phase1 | 50 | 🔴 Boss |
| Jinchuuriki Corrompido | 70.000 | 55 | powerful2+fortified | — | 50 | 🔴 Boss |
| Ebony Maw | 65.000 | 48 | powerful3+regenerator | ebony_maw_special | 50 | 🔴 Boss |
| Replicante do Mizukage | 65.000 | 70 | powerful3 | mizukage_special | 50 | 🔴 Boss |
| Corvus Glaive | 55.000 | 55 | powerful3+fortified | corvus_glaive_special | 50 | 🔴 Boss |
| Ulquiorra Cifer | 50.000 | 55 | powerful3+regenerator | base_drain | 50 | 🔴 Boss |
| Replicante do Kazekage | 50.000 | 48 | powerful3+fortified | base_drain | 50 | 🔴 Boss |
| Ronan, o Acusador | 45.000 | 45 | powerful2 | ronan_special | 50 | 🔴 Boss |
| Nnoitra Gilga | 40.000 | 42 | powerful3+fortified | nnoitra_special | 50 | 🔴 Boss |
| ??? | 40.000 | 50 | powerful2+regenerator | — | 50 | 🔴 Boss |
| Golem de Terra | 40.000 | 35 | powerful2+fortified | — | 50 | 🔴 Boss |
| Akainu | 35.000 | 40 | powerful3+bomber | — | 50 | 🔴 Boss |
| Grimmjow Jaegerjaquez | 32.000 | 98 | powerful2 | grimmjow_special | 50 | 🔴 Boss |
| Crossbones | 30.000 | 60 | powerful2+fortified | crossbones_special | 50 | 🔴 Boss |
| Golem de Areia | 30.000 | 38 | powerful2+fortified | — | 50 | 🔴 Boss |
| Invasor Regen | 24.000 | 44 | powerful2+regenerator | — | 50 | 🟠 Miniboss |
| Rob Lucci | 22.000 | 55 | powerful2 | — | 50 | 🟠 Miniboss |
| Hollow Regen | 22.000 | 44 | powerful2+regenerator | — | 50 | 🟠 Miniboss |
| Pain (Nagato) | 20.000 | 38 | powerful3 | pain_boss | 50 | 🟠 Miniboss |
| Gin Ichimaru | 20.000 | 72 | powerful2 | base_drain | 50 | 🟠 Miniboss |
| Invasor Fortified | 20.000 | 50 | powerful2+fortified | — | 50 | 🟠 Miniboss |
| Batroc | 20.000 | 110 | powerful2 | batroc_special | 50 | 🟠 Miniboss |
| Hollow Fortified | 18.000 | 50 | powerful2+fortified | — | 50 | 🟠 Miniboss |
| Mr. 1 | 14.000 | 46 | powerful2 | — | 50 | 🟠 Miniboss |
| Grand Fisher | 14.000 | 50 | powerful2 | grand_fisher_special | 50 | 🟠 Miniboss |
| Caminho Deus Animal | 12.000 | 46 | powerful1 | — | 50 | 🟠 Miniboss |
| Vasto Lorde | 12.000 | 92 | powerful2 | — | 50 | 🟠 Miniboss |
| Vice-Almirante | 10.000 | 65 | powerful2 | — | 50 | 🟠 Miniboss |
| ??? | 10.000 | 110 | powerful1+speed | — | 50 | 🟠 Miniboss |
| Marionete da Areia | 9.000 | 95 | powerful1+speed | — | 50 | 🟠 Miniboss |
| Konan | 8.000 | 50 | powerful1 | — | 50 | 🟠 Miniboss |
| Arlong | 8.000 | 50 | powerful1 | — | 50 | 🟠 Miniboss |
| Assassino CP9 | 8.000 | 75 | powerful2 | — | 50 | 🟠 Miniboss |
| Ninja das Nuvens Speed | 7.000 | 140 | powerful1+speed | — | 50 | 🟠 Miniboss |
| Itachi Uchiha | 6.000 | 54 | powerful1 | genjutsu | 50 | 🟠 Miniboss |
| Capitão da Marinha | 6.000 | 70 | powerful1 | — | 50 | 🟠 Miniboss |
| Elite Baroque Works | 5.500 | 62 | powerful2 | — | 50 | 🟠 Miniboss |
| Sasuke (Equipe Taka) | 5.000 | 56 | powerful1 | base_drain | 50 | 🟡 Elite |
| Don Krieg | 5.000 | 52 | powerful1 | — | 50 | 🟡 Elite |
| Guerreiro de Pedra | 5.000 | 60 | normal | — | 50 | 🟡 Elite |
| Mestre Rokushiki | 4.500 | 80 | powerful1 | — | 50 | 🟡 Elite |
| Ninja das Nuvens | 4.500 | 80 | normal | — | 50 | 🟡 Elite |
| Akatsuki da Chuva | 4.000 | 65 | powerful1 | — | 50 | 🟡 Elite |
| ??? | 4.000 | 65 | normal | — | 50 | 🟡 Elite |
| Deidara | 3.500 | 58 | normal | — | 50 | 🟡 Elite |
| Marinheiro | 3.500 | 75 | normal | — | 50 | 🟡 Elite |
| Soldado da Areia | 3.500 | 70 | normal | — | 50 | 🟡 Elite |
| Oficial Baroque Works | 3.200 | 65 | powerful1 | — | 50 | 🟡 Elite |
| Hollow Shield | 3.200 | 58 | powerful1 | — | 50 | 🟡 Elite |
| Caranguejo Invocado | 3.000 | 56 | powerful1 | — | 50 | 🟡 Elite |
| Capitão Morgan | 3.000 | 55 | powerful1 | — | 50 | 🟡 Elite |
| Caminho Asura | 2.800 | 60 | powerful1 | — | 50 | 🟡 Elite |
| Arrancar | 2.800 | 82 | powerful1 | — | 50 | 🟡 Elite |
| Ninja da Chuva | 2.500 | 72 | normal | — | 50 | 🟡 Elite |
| Agente CP9 | 2.500 | 85 | normal | — | 50 | 🟡 Elite |
| Explosão de Terra | 2.500 | 100 | powerful1+bomber | — | 50 | 🟡 Elite |
| Homem-Peixe Guerreiro | 2.200 | 60 | powerful1 | — | 50 | 🟡 Elite |
| Caminho Humano | 2.000 | 64 | powerful1 | — | 50 | 🟡 Elite |
| Lesma Invocada | 1.800 | 64 | normal | — | 50 | 🟡 Elite |
| Agente Baroque Works | 1.800 | 70 | normal | — | 50 | 🟡 Elite |
| Hollow Powerful | 1.800 | 70 | normal | — | 50 | 🟡 Elite |
| Hollow Speed | 1.800 | 150 | powerful1+speed | — | 50 | 🟡 Elite |
| Invasor Speed | 1.800 | 155 | powerful1+speed | — | 50 | 🟡 Elite |
| Ninja da Chuva Veloz | 1.500 | 152 | speed | — | 50 | 🟢 Normal |
| Agente Soru | 1.500 | 160 | speed | — | 50 | 🟢 Normal |
| Invasor | 1.500 | 85 | normal | — | 50 | 🟢 Normal |
| Boa Constritora | 1.300 | 68 | powerful1 | — | 50 | 🟢 Normal |
| Invasor Bomb | 1.300 | 125 | powerful1+bomber | — | 50 | 🟢 Normal |
| Caminho Animal | 1.200 | 70 | normal | — | 50 | 🟢 Normal |
| Pirata Veterano | 1.200 | 65 | powerful1 | — | 50 | 🟢 Normal |
| Hollow Explosion | 1.200 | 120 | powerful1+bomber | — | 50 | 🟢 Normal |
| Homem-Peixe | 1.100 | 65 | normal | — | 50 | 🟢 Normal |
| Millions Rápido | 1.000 | 140 | speed | — | 50 | 🟢 Normal |
| Hollow | 900 | 95 | normal | — | 50 | 🟢 Normal |
| Mini Shinra Tensei | 800 | 76 | bomber | — | 50 | 🟢 Normal |
| Bandido Chefe | 800 | 65 | powerful1 | — | 50 | 🟢 Normal |
| Serpente | 750 | 78 | normal | — | 50 | 🟢 Normal |
| Agente Ambu | 700 | 72 | powerful1 | — | 50 | 🟢 Normal |
| Pirata Comum | 700 | 68 | normal | — | 50 | 🟢 Normal |
| Ninja Ambu | 400 | 75 | normal | — | 50 | 🟢 Normal |
| Bandido | 400 | 72 | normal | — | 50 | 🟢 Normal |
| Ninja Comum | 200 | 75 | normal | — | 50 | 🟢 Normal |

> Bosses entregam os mesmos 50 ouro que capangas com 500 HP. Em updates futuros: considerar `boss_gold_bonus = Math.floor(hp / 1000)` com teto de 500.

## 9. Problemas Detectados (Análise Automática)

- ⚠️ **Zoro (East Blue)** (3⭐) — eficiência 0.91 está menos da metade da média 2.27 da raridade. Considere reduzir dano ou aumentar custo.
- ⚠️ **Luffy (East Blue)** (3⭐) — eficiência 1.08 está menos da metade da média 2.27 da raridade. Considere reduzir dano ou aumentar custo.
- ⚠️ **Robin** (4⭐) — eficiência 0.50 está menos da metade da média 1.66 da raridade. Considere reduzir dano ou aumentar custo.
- ⚠️ **Naruto (Shippuden)** (4⭐) — eficiência 0.59 está menos da metade da média 1.66 da raridade. Considere reduzir dano ou aumentar custo.
- ⚠️ **Meliodas** (4⭐) — eficiência 0.80 está menos da metade da média 1.66 da raridade. Considere reduzir dano ou aumentar custo.
- ⚠️ **Gojo Satoru** (5⭐) — eficiência 0.23 está menos da metade da média 1.47 da raridade. Considere reduzir dano ou aumentar custo.
- ⚠️ **Luffy (Gear 4)** (5⭐) — eficiência 0.44 está menos da metade da média 1.47 da raridade. Considere reduzir dano ou aumentar custo.
- ⚠️ **Zoro (Ashura)** (5⭐) — eficiência 0.68 está menos da metade da média 1.47 da raridade. Considere reduzir dano ou aumentar custo.
- ⚠️ **Inversão:** Robin (4⭐, 0.5) mais eficiente que Ichigo (Vizard) (6⭐, 1.0).
- ⚠️ **Inversão:** Zoro (East Blue) (3⭐, 0.9) mais eficiente que Naruto (Sage Mode) (5⭐, 2.0).
- ⚠️ **Inversão:** Zoro (East Blue) (3⭐, 0.9) mais eficiente que Hulk Quebra-Mundo (5⭐, 2.1).
- ⚠️ **Inversão:** Zoro (East Blue) (3⭐, 0.9) mais eficiente que Killer Bee (5⭐, 2.6).
- ⚠️ **Inversão:** Zoro (East Blue) (3⭐, 0.9) mais eficiente que Iron Man Mark 50 (5⭐, 2.7).
- ⚠️ **Inversão:** Luffy (East Blue) (3⭐, 1.1) mais eficiente que Naruto (Sage Mode) (5⭐, 2.0).
- ⚠️ **Inversão:** Luffy (East Blue) (3⭐, 1.1) mais eficiente que Hulk Quebra-Mundo (5⭐, 2.1).
- ⚠️ **Inversão:** Luffy (East Blue) (3⭐, 1.1) mais eficiente que Killer Bee (5⭐, 2.6).
- ⚠️ **Inversão:** Luffy (East Blue) (3⭐, 1.1) mais eficiente que Iron Man Mark 50 (5⭐, 2.7).
- ⚠️ **Inversão:** Goku (Base) (3⭐, 1.2) mais eficiente que Killer Bee (5⭐, 2.6).
- ⚠️ **Inversão:** Goku (Base) (3⭐, 1.2) mais eficiente que Iron Man Mark 50 (5⭐, 2.7).
- ⚠️ **Inversão:** Brook (3⭐, 1.4) mais eficiente que Killer Bee (5⭐, 2.6).
- ⚠️ **Inversão:** Brook (3⭐, 1.4) mais eficiente que Iron Man Mark 50 (5⭐, 2.7).
- ℹ️ **Luffy (Gear 4)** (5⭐) — apenas 2 upgrade(s). Progressão limitada.
- ℹ️ **Robin** (4⭐) — apenas 2 upgrade(s). Progressão limitada.
- ℹ️ **Zoro (Ashura)** (5⭐) — apenas 2 upgrade(s). Progressão limitada.
- ℹ️ **Zoro (East Blue)** (3⭐) — apenas 2 upgrade(s). Progressão limitada.
- ℹ️ **Ace** (4⭐) — apenas 2 upgrade(s). Progressão limitada.
- ℹ️ **Luffy (East Blue)** (3⭐) — apenas 2 upgrade(s). Progressão limitada.
- ℹ️ **Orochimaru** (4⭐) — apenas 2 upgrade(s). Progressão limitada.
- ℹ️ **Pain (Seis Caminhos)** (5⭐) — apenas 2 upgrade(s). Progressão limitada.
- ℹ️ **Barba Branca** (5⭐) — apenas 2 upgrade(s). Progressão limitada.
- ℹ️ **Brook** (3⭐) — apenas 2 upgrade(s). Progressão limitada.
- ℹ️ **Sanji** (4⭐) — apenas 2 upgrade(s). Progressão limitada.
- ℹ️ **Nami** (3⭐) — apenas 2 upgrade(s). Progressão limitada.
- ℹ️ **Usopp** (3⭐) — apenas 2 upgrade(s). Progressão limitada.

## 10. Diretrizes para Futuras Atualizações

### 10.1 Checklist — Nova Unidade de Combate

- [ ] **Raridade coerente:** DPS Máx ≥ DPS Boss médio da raridade imediatamente abaixo
- [ ] **Envelope de eficiência:** ouro/DPS Ef. dentro do alvo da raridade (seção 4)
- [ ] **Deploy coerente:** dentro do alvo da raridade (seção 4)
- [ ] **Progressão de upgrades:** ≥ 3 upgrades; primeiro upgrade ≤ 30% do custo de deploy
- [ ] **Passiva justificada:** Aura/CC pode reduzir DPS individual — documente o multiplicador de equipe
- [ ] **Sem inversão:** verificar que nenhuma unidade de raridade ≥2 acima é menos eficiente
- [ ] **Prestige não quebra:** P10 desta unidade não deve tornar estágios triviais (margem > 5×)
- [ ] **Event-exclusive:** deploy ≤ 2× média da raridade; justificado por passiva diferenciada

### 10.2 Checklist — Novo Mundo / Nova Fase

Fórmula de calibragem do boss: `HP_Boss = DPS_disponível × 0.65 × (pathLength / speed)` para margem confortável.

- [ ] **Margem de segurança calculada:** top 4 unidades do tier, P0, margem ≥ 1.0× (alvo: 1.5×)
- [ ] **Dificuldade Normal/Lendário:** mods ×1.5 e ×2.2 de HP não tornam o boss intransponível (P0)
- [ ] **Ouro por wave calibrado:** cobre 2–3 upgrades ao longo do stage (ver orçamento seção 7)
- [ ] **Stage modifiers:** dualFront / sandShield / blockZones — máximo 2 combinados no mesmo stage
- [ ] **Wave design:** waves anteriores ao boss não devem gastar tanto recurso que impeça o kill do boss
- [ ] **Path length:** caminhos muito curtos (< 1000px) aumentam drasticamente o DPS necessário

### 10.3 Referência de HP de Boss por Mundo

Valores atuais e alvos para calibrar progressão:

| Mundo | Cap Raridade | DPS Disp. (P0) | HP Confortável | HP Apertado | HP Atual | Status |
|---|:---:|---:|---:|---:|---:|---|
| naruto | ≤4⭐ | 7352 | 227.949 | 315.621 | 20.000 | ✅ OK |
| onepiece | ≤4⭐ | 7352 | 220.781 | 305.696 | 35.000 | ✅ OK |
| bleach | ≤5⭐ | 10297 | 554.854 | 768.259 | 75.000 | ✅ OK |
| marvel | ≤6⭐ | 16340 | 1.212.918 | 1.679.425 | 100.000 | ✅ OK |
| **Mundo 5 (hipotético)** | ≤6⭐ | ~24510 (projeção) | ~669.123 | ~926.478 | — | 📋 Planejar |

### 10.4 Recomendações Prioritárias

1. **Boss economy:** bosses entregam mesmo ouro que capangas — desequilíbrio histórico. Próximo update: adicionar `boss_gold_bonus` proporcional ao HP.
2. **Diversidade de farm:** `edo_tensei_economy` (reembolso total) existe em apenas 1 unidade. Adicionar variações (kill_gold farm, gold_per_wave-diferenciado) reduz dependência.
3. **Auras invisíveis no DPS:** Gojo (+25% equipe), Bankai (×1.55 dano recebido), Killer Bee (+55% tinta) multiplicam o output de toda a equipe — o DPS individual subestima muito seu valor. Documentar o multiplicador efetivo de cada aura ao calibrar novos estágios.
4. **Regra 6⭐:** apenas 1 cópia no campo preserva equilíbrio. Novas 6⭐ devem ser fortes o suficiente para justificar o slot, mas não ao ponto de tornar outras 6⭐ irrelevantes.
5. **Teto de prestige:** ao lançar novo conteúdo, testar clearabilidade com time full-P10 para garantir que o jogo ainda existe — o boss ainda deve levar dano não-trivial mesmo no scenario mais overpower.

---

*Próximo update: após adicionar novas unidades ou mundos, execute `node analyze_balance.js` para regenerar este guia.*
