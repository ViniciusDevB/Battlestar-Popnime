# GDD — Update 6: Protocolo Nemesis (Survival Horror)

> Documento de concepção e design futuro. Este update traz um evento focado em gerenciamento de recursos, tensão constante e a introdução de uma nova economia de endgame.

---

## 1. Novo Sistema Global: O Mercado Negro e Cristais

Para dar ainda mais valor ao grind diário e missões, o Update 6 introduz uma nova camada econômica: os **Cristais** e o **Vendedor Clandestino**.

### Nova Moeda: Cristais (Crystals)
- **Como Obter:** Drop garantido ao concluir fases pela primeira vez, além de ser recompensa de Missões Diárias, Missões de Comunidade e Conquistas.
- **Função Exclusiva:** Única moeda aceita pelo Mercado Negro. Não pode ser comprada com dinheiro real, premiando exclusivamente o esforço do jogador.

### O Mercador ("The Merchant")
Um NPC misterioso que não fica no menu principal o tempo todo. Ele tem uma **chance de aparecer no Lobby** após o jogador concluir uma fase (com um aviso na tela "O Mercador chegou...").
- **Inventário Rotativo:** O estoque muda a cada aparição.
- **O que ele vende:**
  - Pacotes de ingredientes específicos que o jogador está com preguiça de farmar.
  - Tickets Padrão e Tickets Premium.
  - **O Jackpot (Unidades Lendárias):** Muito raramente (chance de 1% a cada vez que a loja reseta), ele pode vender diretamente Unidades 5★ ou até mesmo Unidades 6★ (ex: Ichigo Final/Mugetsu 6★). O preço será astronômico (ex: 10.000 Cristais), o que funciona como o "Santo Graal" do farm de late-game, dando ao jogador um objetivo de muito longo prazo para não gastar seus cristais à toa.

---

## 2. Evento Temporário: Protocolo Nemesis

Um modo de jogo inspirado em Resident Evil clássico, que pune a passividade e recompensa a agilidade e o gerenciamento do mapa.

### A. O Nemesis Imortal (Perseguidor)
Diferente dos Bosses normais que tentam destruir sua base, o Nemesis está ativo desde a Wave 1 e seu único objetivo é **caçar as suas torres**.
- Ele anda livremente pelo mapa.
- Se ele alcançar uma torre, ele a destrói ou a nocauteia por um tempo absurdamente longo.
- **O objetivo não é matá-lo**, mas sim sobreviver até o cronômetro da "Extração" chegar a zero. Causar dano massivo nele apenas o atordoa (Stun) temporariamente para ganhar tempo.

### B. Mecânica de "Munição de Sobrevivência"
Torres no mapa do evento não atiram para sempre. Elas gastam "Munição" (que na verdade é Ouro/Fragmentos). Quando a barra de munição da torre esvazia, ela para de atacar. O jogador precisa clicar ativamente nela para "Recarregar", forçando a gerir a economia (pagar para recarregar ou pagar para colocar uma torre nova?) com o Nemesis caminhando nas costas.

---

## 3. "Gacha de Sobrevivência" (Sistema de Descoberta)

Diferente do Gacha tradicional do menu onde o jogador gasta Gemas, os heróis convidados deste evento (Leon, Jill, Wesker) são destravados de forma orgânica.

- Durante as fases do Protocolo Nemesis, "Eventos Dinâmicos" ocorrem no mapa. Exemplo: *Uma barricada paralela está sendo atacada por cães zumbis.*
- Se o jogador desviar recursos para proteger essa barricada e tiver sucesso antes dela cair, ele "Resgata um Sobrevivente".
- Ao final da fase, há uma **chance percentual base** de que esse resgate conceda instantaneamente um dos heróis exclusivos do evento (Leon, Jill ou Wesker).
- **Pity Progressivo:** Toda vez que o jogador completa o evento da barricada e *não* tira o personagem, a sua chance de conseguir na próxima vez **aumenta um pouco** (ex: sobe +0.5%). Quando ele finalmente ganhar o personagem, a chance reseta. Isso garante que a dedicação em cumprir os eventos perigosos no meio da partida será sempre recompensada a longo prazo.
