# Guia Estratégico de Balanceamento ASTD (Por Modo de Jogo)

Como a economia do jogo é rígida (baseada em waves completas e mortes), a quantidade de Waves define completamente o Ouro disponível e, por consequência, o Teto de Poder do jogador.

Aqui está o guia de como você deve balancear a Vida (HP) e os desafios para os 3 formatos principais do jogo.

---

## 1. Mundos Padrões (Campanha de 1 a 10 Waves)

Neste modo, o jogador tem tempo de se preparar, mas **não atinge o ouro máximo do jogo**.

- **Economia Típica:** 10 ondas garantem cerca de $1.000 fixos + Ouro de Kills. Um jogador usando *L (Death Note)* muito bem terminará a wave 10 com cerca de **$18.000 a $25.000 de Ouro total**.
- **O Teto de Poder:** O jogador NÃO conseguirá montar o "Time Exodia" completo. Ele terá que escolher entre **1 Ichigo Vizard MÁX** ($16k) + um suporte barato (Viúva Negra ou Orihime), **OU** focar em múltiplas torres de médio custo (Tsunade, Kenpachi, Thor).
- **DPS Real no Final (Wave 10):** Em torno de **30.000 a 40.000 DPS**.

### Matemática de HP para Mundos (1 a 10)
- **Lacaios (Wave 1-5):** 200 a 1.000 HP. O jogador ainda está colocando as torres iniciais.
- **Lacaios (Wave 6-10):** 1.500 a 6.000 HP.
- **Boss Final (Wave 10):** Deve ter entre **100.000 a 180.000 HP**.
> *Justificativa:* A 40.000 de DPS (um Ichigo buffado pela Viúva), um boss de 180k morre em 4 a 5 segundos de área útil. Qualquer coisa acima de 250k exigirá um nível de farm perfeito que jogadores iniciantes não terão.

---

## 2. Eventos Sazonais (Poucas Waves: Ex. 1 a 5 Waves)

Eventos curtos mudam todas as regras do jogo. O foco sai do "Late Game" e vai para o **"Snowball Rápido"**.

- **Economia Típica:** O jogo acaba muito rápido. O jogador termina o evento com **apenas $5.000 a $8.000 de Ouro total**.
- **O Meta (O que funciona):** Torres de Farm (*L*) são uma **armadilha** aqui, pois não há waves suficientes para eles se pagarem. O meta foca em personagens baratos que causam muito dano inicial: *Kenpachi Zaraki*, *Tsunade*, *Ace*, *Zoro (East Blue)*.
- **O Teto de Poder:** O jogador usará torres 3⭐ e 4⭐ pela metade do nível de upgrade. **DPS Real: ~4.000 a 8.000 DPS.**

### Matemática de HP para Eventos (Curtos)
- **Lacaios:** Nunca passe de **800 a 2.500 HP**. Se você colocar um lacaio com 5.000 HP na wave 3 de um evento, o time sem ouro não conseguirá matá-lo.
- **Boss do Evento (Wave 5):** **25.000 a 50.000 HP**.
> *Justificativa:* O jogador está usando um Kenpachi Zaraki dando 1.500 de dano. Um boss de 50.000 já é extremamente tenso e fará o jogador suar para usar poderes ativos de parada de tempo ou lentidão (Homem-Aranha).

### Dica de Design para Eventos:
Em eventos, a dificuldade não deve vir do HP, mas das **Mecânicas de Status**:
- **Inimigos com Regeneração Alta:** Exigem que o jogador construa personagens de Fogo (*Tanjiro*, *Sasuke*) logo no início.
- **Corredores Velozes (Speed):** Forçam o uso imediato de *Demolidor* ou *Toshiro*.

---

## 3. Modo Infinito (Escalonamento Sem Fim)

Aqui, o tempo é irrelevante. O ouro chegará a valores absurdos e o jogador eventualmente alcançará o limite absoluto da sua conta.

- **Economia Típica:** Após a wave 30, o ouro perde o sentido. O jogador terá **+$100.000** e todas as suas torres estarão no limite máximo (Level Máx + Todos Upgrades).
- **O Teto de Poder:** "O Time Exodia". *Ichigo Vizard* posicionado centralmente, banhado na Aura do *Gojo* e da *Orihime*, com a *Viúva Negra* ativando seu multiplicador de 55% e o *Ichigo Bankai* somando pressão global.
- **DPS Real Fixo:** **90.000 a 120.000 DPS Estáveis** em múltiplos pontos do mapa.

### Matemática de HP para Modo Infinito
- **Lacaios Básicos (Waves 15+):** 10.000 a 30.000 HP (Eles começam a sobreviver aos danos em área e requerem foco das torres single-target).
- **Escalonamento de Bosses:** Os bosses do Infinito precisam começar na faixa dos **300.000 HP** e escalar massivamente a cada aparição (+20% a 30% a mais a cada boss).
> *Exemplo de Escalonamento do Boss Infinito:*
> Wave 15: 300.000 HP (Fácil para o Exodia)
> Wave 30: 800.000 HP (O jogador começa a depender do Stun do Gojo)
> Wave 45: 2.500.000 HP (Requer posicionamento perfeito de teias do Aranha e Reset de CD)

### Dica de Design para o Infinito:
Como o jogador terá dano "infinito", o modo Infinito deve **quebrar as auras**.
Adicione inimigos com a tag `stun_immune` em waves muito altas para invalidar o "Gojo Stun Lock", ou inimigos do tipo *Assassino Soru*, que pulam uma faixa do mapa invisíveis, exigindo que as torres sejam espalhadas em vez de concentradas em um único "Mega-Combo".

---

## 4. Multiplicador de HP entre Mundos

Para manter a dificuldade crescente entre worlds, cada novo mundo aplica um multiplicador de base sobre o mundo anterior:

| Mundo | Multiplicador | HP Lacaio W1-5 | HP Lacaio W6-10 | HP Boss |
|-------|-------------|----------------|-----------------|---------|
| W1 Naruto | 1.0× | 200–600 | 1.000–4.000 | 60.000–100.000 |
| W2 One Piece | 1.15× | 300–750 | 1.300–5.000 | 80.000–130.000 |
| W3 Bleach | 1.3× | 400–900 | 1.500–5.500 | 100.000–160.000 |
| W4 Marvel | 1.3× (vs W3) | 500–1.200 | 2.000–7.000 | 140.000–220.000 |
| **W5 DC** | **1.35× (vs W4)** | **700–1.600** | **2.700–9.500** | **190.000–300.000** |
