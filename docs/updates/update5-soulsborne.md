# GDD — Update 5: O Reino das Cinzas (Soulsborne)

> Documento de concepção e design futuro. Este update traz a estética dark fantasy dos jogos da FromSoftware, introduzindo novas mecânicas essenciais para o "Endgame" do Battlestar Popnime.

---

## 1. Novo Sistema Global: Tipos de Dano (Damage Types)

A grande inovação arquitetônica do Update 5 é a implementação do **Sistema de Tipos de Dano**. Para lidar com inimigos complexos (como o Boss Final Alma das Cinzas), o jogo passará a classificar o dano das torres.

### Categorias de Dano
1. **Físico (Physical):** Dano padrão de espadas, flechas, armas de fogo.
2. **Mágico (Magical):** Disparos de energia e magias elementais puras.
3. **Fogo (Fire):** Causa pequeno dano extra contra inimigos biológicos/focados em regeneração.
4. **Gelo (Frostbite):** Tem chance passiva de dar slow extremo ao invés de dano constante.
5. **Divino/Sagrado (Holy):** Dano cósmico ou sagrado.
6. **[NOVO] Veneno (Poison / DOT):** Novo tipo de dano ao longo do tempo (DOT) que ignora armaduras (Fortified) e causa % de HP Máximo como dano.

### Como funciona no Personagem
Toda torre passa a ter a propriedade visual e sistêmica de seu Tipo de Dano:
- **Dano Base:** O tipo do ataque normal (Auto-Attack).
- **Dano Secundário (Passivas):** Uma habilidade pode dar dano de Fogo, mesmo que o ataque básico seja Físico.
- **Transição por Upgrade:** O tipo de dano pode mudar! Exemplo: Um personagem pode dar Dano Físico do Nível 1 ao 3, mas no Upgrade 4 (onde saca uma espada mágica) o dano base se transforma permanentemente em Dano Mágico ou Sagrado.
- **UI:** A cor do dano flutuante na tela (Damage Text) mudará conforme o tipo. As cartas no inventário terão ícones mostrando o tipo de dano principal da unidade.

---

## 2. O Mundo 6: O Reino das Cinzas

Mundo temático com mecânicas punitivas.

### Mecânica Exclusiva do Mundo: Postura (Poise)
Inimigos reduzem passivamente todo dano recebido em 50%. Porém, se tomarem múltiplos hits consecutivos em pouco tempo, sua "Postura" quebra (som de *Parry*). Por 2 segundos, eles ficam paralisados (Stun) e recebem 300% de dano. Isso obriga o jogador a misturar torres lentas com torres de ataque ultra-rápido.

---

## 3. As 6 Fases e Bosses

As fases fogem do tradicional e punem vícios do jogador.

### Fase 1: O Pântano da Perdição
* **Regra:** Áreas de pântano no mapa dão debuff de velocidade de ataque nas torres.
* **Miniboss — Basilisco Ancestral:** Ele expira uma nuvem de "Maldição" que **Petrifica** a torre mais cara do mapa. A torre vira pedra e para de funcionar. O jogador precisa clicar nela e pagar um resgate em ouro altíssimo para descongelá-la.

### Fase 2: Arquivos do Duque
* **Regra:** Cristais no caminho bloqueiam projéteis de longa distância (Snipers sofrem).
* **Miniboss — Seath, o Descamado:** Cristaliza torres aleatórias. O jogador tem que "quebrar o cristal" clicando 10 vezes com o mouse em cima da torre afetada.

### Fase 3: O Pesadelo (Loucura)
* **Regra:** O mapa causa *Frenzy*. Torres perdem o alvo inteligente e focam no inimigo com MENOS vida, deixando os inimigos mais fortes passarem imunes.
* **Miniboss — Amygdala:** Salta e troca de posição no trajeto ao receber muito burst de dano, forçando espalhamento de torres.

### Fase 4: A Forja dos Gigantes
* **Regra:** O mapa é extremamente quente. O botão de **"Vender Torre" derrete** e some da interface nesta fase. Qualquer torre colocada é definitiva.
* **Miniboss — Gigante de Fogo:** Em vez de fazer curvas pelo labirinto, ele rola por cima das paredes do cenário, pegando atalhos em linha reta para a base.

### Fase 5: O Trono de Lothric
* **Regra:** Inimigos andam em pares. Se um morrer e o outro não for morto em 5 segundos, o parceiro ressuscita com 50% da vida. Exige alto dano em Área (AOE).
* **Miniboss Duplo — Lorian e Lothric:** Lorian toma o dano físico, enquanto Lothric teleporta o irmão pelo caminho se tomarem dano lento demais.

### Fase 6: A Fornalha (Boss Final)
* **Boss Final — Alma das Cinzas (Soul of Cinder):** Possui 4 Barras de Vida. A cada barra zerada, ele troca o **Tipo de Dano Imune**, forçando uso do novo sistema de Tipos de Dano:
  1. *Fase Espada:* Imune a **Físico**.
  2. *Fase Cajado:* Imune a **Mágico** e dá pequenos teleportes.
  3. *Fase Lança:* Reflete atiradores de longe (exige dano de perto).
  4. *Fase Lorde Gwyn:* Música de piano. Torres pegam fogo e dão 50% menos dano. A única fonte de dano 100% garantida que ele não consegue bloquear nesta fase é o **DOT de Veneno**, forçando o uso de personagens focados em status.

---

## 4. Personagens (Gacha: Heróis e Lendas)

*Protagonistas excluídos. Foco nos NPCs icônicos e chefes.*

**3★ (Comuns) - 4 Personagens:**
- **Patches, a Hiena (Dark Souls):** Torre de baixo custo que atira "Potes Tóxicos", excelente para acumular Veneno rápido no início do mapa.
- **Alexander, o Punho de Ferro (Elden Ring):** Jarro gigante. Dano físico massivo em curto alcance.
- **Siegmeyer de Catarina (Dark Souls):** O famoso "Cavaleiro Cebola". Ataque físico extremamente lento, mas que dá Stun (paralisa) inimigos menores com o peso do golpe.
- **Varré, da Máscara Branca (Elden Ring):** Arremessa adagas à distância. Aplica efeito de sangramento (Dano Físico bônus) a cada 5 golpes.

**4★ (Épicos) - 3 Personagens:**
- **Quelaag, a Bruxa do Caos (Dark Souls):** Dano Base Mágico (Fogo). Passiva: Cospe poças no chão que dão o status de Veneno aos inimigos que pisam nelas.
- **Solaire de Astora (Dark Souls):** Não ataca. Buffa a velocidade de ataque ao redor e limpa status negativos de outras torres (Suporte Puro).
- **Eileen, o Corvo (Bloodborne):** Dano Físico Ultra-rápido. Consegue quebrar a postura dos inimigos mais rápido que qualquer um, sendo a maior "abridora de defesa" do jogo.

**5★ (Lendários) - 2 Personagens:**
- **Gravelord Nito (Dark Souls):** O Lorde Supremo do Veneno. Irradia Miasma em Área Absoluta (AOE Global), aplicando Stacks de Veneno contínuos a inimigos. A arma definitiva para derreter Bosses com muita vida.
- **Lady Maria da Torre Astral (Bloodborne):** Começa com espada curta (Dano Físico Rápido). No Nível Máximo de upgrade, a arma muda para Lâminas de Sangue e Fogo, dobrando o alcance e mudando o tipo de dano para Mágico/Fogo com efeito de Pierce (Linha Reta) que vara todos os inimigos no caminho.
