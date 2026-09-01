<script lang="ts">
/**
 * Quanto a resposta demorou, repartida nas medidas que quem lê usa.
 *
 * Desenho em `nds/medicao.css`, no bloco "Tempo de uma resposta", que também
 * guarda as oito decisões de acessibilidade e o motivo de esta peça existir.
 *
 * A PERGUNTA DE TRIAGEM VEIO ANTES DO DESENHO, porque as quatro medições irmãs
 * medem CONSUMO contra um teto e esta mede TEMPO. Três diferenças responderam,
 * e cada uma bastaria:
 *
 *   - TEMPO NÃO TEM DENOMINADOR. A peça da janela é uma fração, um medidor e um
 *     nível; tirar o teto dela não deixa uma versão mais magra, deixa nada.
 *     "Demorou 4,2 s" só viraria fração se comparasse com alguma coisa, e
 *     comparar com o quê é decisão de produto (§2 da guideline 17).
 *   - SÃO VÁRIAS GRANDEZAS, E ELAS NÃO SOMAM. Duas durações, uma taxa e uma
 *     contagem convivem numa linha só. A repartição do contexto também carrega
 *     várias, mas todas são parcelas de um mesmo total — aqui não há total.
 *   - O NÚMERO PODE ESTAR ANDANDO. Nenhuma irmã tem esse estado, e ele muda o
 *     que se desenha E o que se pode ler em voz.
 *
 * TUDO CHEGA ESCRITO, e é por isso que esta é a única peça da família sem
 * conta: não há nada em `token-budget.ts` para ela ler, e não há nada dela para
 * pôr lá. Duração tem separador decimal, ordem de unidade e abreviatura que
 * trocam com o idioma; velocidade tem tudo isso mais o nome da unidade. É o
 * mesmo precedente do relógio do estado da execução, do tempo decorrido do
 * ditado, do carimbo da faixa de rascunho e da quantia do custo — e aqui ele
 * vale para a peça inteira, porque não sobra número cru nenhum.
 *
 * A DECISÃO QUE SÓ ESTA PEÇA TEM: OS NÚMEROS FICAM DENTRO DO QUE É LIDO. O
 * relógio do estado da execução é `aria-hidden` porque ele CORRE — se reescreve
 * sozinho enquanto a resposta é gerada. Aqui os números SÃO a peça; escondê-los
 * deixaria uma medição inteira vazia para quem ouve. Enquanto a medição ainda
 * anda, o que se diz é `aria-busy="true"`, que é o oposto de anunciar: ele
 * avisa que aquilo ainda está mudando sem tirar nada da leitura, e é o mesmo
 * que a mensagem em streaming já usa.
 *
 * E A DECISÃO QUE GOVERNA A FAMÍLIA INTEIRA continua valendo: não há `aria-live`
 * em lugar nenhum, e nada aqui se reanuncia. Quem quiser que a medição se
 * anuncie ao terminar põe a região viva por fora, sabendo o que está fazendo —
 * mesma saída que as quatro irmãs oferecem.
 *
 * O QUE O COMPONENTE NÃO FAZ: cronometrar, contar token, dividir token por
 * segundo, formatar duração, decidir se 4,2 s é muito. Ele recebe a medição
 * escrita e desenha — §2 da guideline 17.
 *
 * A ÚNICA DIVERGÊNCIA DE API a registrar é a ausência de uma prop `class`: a
 * classe extra chega por atributo e o renderizador a concatena à classe da
 * raiz sozinho. Declará-la como prop criaria um segundo caminho para a mesma
 * coisa, e os dois discordariam no dia em que alguém usasse os dois. É o que as
 * quatro medições irmãs desta pasta já fazem, e o resto da API não diverge: os
 * três nomes são os mesmos em todas as stacks.
 *
 * O vocabulário mora neste bloco, e não no índice da pasta, porque a peça é
 * autônoma: ela não entra na API de nenhuma outra, e quem a usa a importa por
 * inteiro — componente e tipos — de um lugar só.
 */

/**
 * Uma medição: o que foi medido, e quanto deu.
 *
 * Os dois lados andam juntos num objeto só porque um sem o outro não é uma
 * medição: valor sem termo é um número solto na linha, e termo sem valor é uma
 * pergunta sem resposta. É o mesmo par que o alcance do cartão de autorização
 * usa, e por isso os dois desenham `<dt>` e `<dd>`.
 */
export interface MessageTimingStat {
  /**
   * O que foi medido.
   *
   * Interface, e não dado: "Primeiro token" tem três traduções, e é por isso
   * que ele chega de quem monta em vez de sair de uma tabela daqui. Nomear as
   * medições dentro do componente fixaria QUAIS medições existem, e quantas
   * delas se conhece é de quem mede.
   */
  label: string
  /**
   * Quanto deu, JÁ ESCRITO.
   *
   * Cadeia, e não número com unidade ao lado: `420 ms`, `1,24 s` e
   * `38,4 tok/s` diferem em separador decimal, em abreviatura e na ordem das
   * partes conforme o idioma, e nenhuma heurística de componente acerta os
   * três. Quem sabe disso é quem mediu.
   */
  value: string
}

export interface MessageTimingLabels {
  /**
   * De que medição se trata.
   *
   * "1,24 s" ao pé de uma mensagem não diz de qual resposta se fala, nem se o
   * tempo é do turno ou da conversa inteira. O título não aparece na tela — o
   * lugar em que a peça está já responde a quem vê — e é o que responde a quem
   * ouve. Mesma decisão das quatro medições irmãs.
   */
  title: string
  /**
   * A palavra que diz que a medição ainda não acabou.
   *
   * É ela que descreve, e não um destaque de cor: cor sozinha não descreve
   * estado (WCAG 1.4.1), e aqui ela descreveria o estado MAIS importante desta
   * peça — o de que o número ainda não vale. Obrigatória mesmo para quem nunca
   * mostra a peça em movimento: um rótulo opcional viraria uma peça que, no dia
   * em que alguém passasse `streaming`, mostraria o estado em branco.
   */
  measuring: string
}
</script>

<script setup lang="ts">
import { Badge } from '@/components/ui/badge'

withDefaults(defineProps<{
  /**
   * As medições, na ordem em que quem mediu as produziu.
   *
   * A ORDEM É DE QUEM MEDIU, e a peça não reordena — mesma decisão da
   * repartição do contexto, e pelo mesmo motivo: a linha se lê por posição, e
   * uma medição que subisse de lugar entre uma resposta e a seguinte faria
   * comparar duas fotos diferentes achando que é a mesma.
   *
   * Quem não mediu nada não monta a peça. Uma lista vazia não é uma medição
   * pela metade, é a ausência da pergunta — e a peça responde a isso não
   * montando a lista, em vez de deixar um `<dl>` vazio na árvore.
   */
  stats: readonly MessageTimingStat[]
  /**
   * A medição ainda está andando?
   *
   * Enquanto está, a peça diz `aria-busy` e mostra a palavra do estado. Nome
   * herdado da mensagem em streaming, que é quem já usa esta palavra nesta base
   * para dizer a mesma coisa — dois nomes para um estado só seriam duas
   * palavras que quem consome teria de traduzir entre si.
   */
  streaming?: boolean
  labels: MessageTimingLabels
}>(), {
  streaming: false,
})
</script>

<template>
  <!-- `<div>`, e não `<p>` como três das quatro irmãs: o corpo desta peça é uma
       lista de definição, e lista não cabe dentro de parágrafo. Nenhum papel
       ARIA, nenhuma região viva (decisão 3 da folha).

       ENQUANTO A MEDIÇÃO ANDA, `aria-busy` — e só enquanto ela anda. O atributo
       SAI quando a medição encerra: um `aria-busy="false"` permanente seria uma
       afirmação a mais na árvore dizendo exatamente o que a ausência já diz.

       Nenhum atributo de estado, e a ausência é decisão: não há medidor que
       troque de forma, não há teto de que caiba uma fração, e o que muda quando
       a medição encerra é a etiqueta EXISTIR — marcação, e não desenho. -->
  <div
    class="nds-message-timing"
    data-slot="message-timing"
    :aria-busy="streaming ? 'true' : undefined"
  >
    <!-- A MEDIÇÃO TEM NOME (decisão 7). Ele não aparece na tela: quem vê já sabe
         do que se trata pelo lugar em que a peça está, e quem ouve não sabe. -->
    <span
      class="nds-sr-only"
      data-slot="message-timing-title"
    >{{ labels.title }}</span>

    <!-- O ESTADO É PALAVRA (decisão 4), E VEM ANTES DOS NÚMEROS (decisão 5). É a
         divergência em relação às irmãs, onde a etiqueta fecha a linha: lá ela é
         um juízo sobre um número completo, e aqui ela diz que o que vem a seguir
         ainda não vale — um aviso desses que chegasse depois chegaria tarde.

         A ETIQUETA SÓ APARECE ENQUANTO MEDE (decisão 6): uma etiqueta permanente
         dizendo "final" nunca variaria, e o que nunca varia não informa.

         Ela NÃO tem classe própria, e é a única da folha sem uma: as irmãs dão
         uma à delas para empurrá-la para a direita, e aqui não há declaração
         para escrever. Classe sem regra é classe morta. O `data-slot` é
         sobrescrito para a peça se achar no documento. -->
    <Badge
      v-if="streaming"
      data-slot="message-timing-state"
    >
      {{ labels.measuring }}
    </Badge>

    <!-- QUEM NÃO MEDIU NADA NÃO MONTA A LISTA: um `<dl>` vazio deixaria na
         árvore um `data-slot` que não descreve nada, e um espaço que ninguém
         pediu. Mesma escolha da caixa de controles da faixa de cota. -->
    <dl
      v-if="stats.length > 0"
      class="nds-message-timing-stats"
      data-slot="message-timing-stats"
    >
      <!-- O `<div>` dentro do `<dl>` é o que a especificação permite justamente
           para agrupar um par, e ele não é embrulho de conveniência (decisão 1
           da folha): sem ele, o termo terminaria uma linha e o valor abriria a
           seguinte, e duas medições diferentes pareceriam uma só.

           A chave é a POSIÇÃO de propósito: a ordem é a de quem mediu, e é ela
           que identifica cada par. Chavear pelo termo quebraria no dia em que a
           medição trouxesse duas medidas com o mesmo nome. -->
      <div
        v-for="(stat, index) in stats"
        :key="index"
        class="nds-message-timing-stat"
        data-slot="message-timing-stat"
      >
        <dt
          class="nds-message-timing-label"
          data-slot="message-timing-label"
        >
          {{ stat.label }}
        </dt>
        <dd
          class="nds-message-timing-value"
          data-slot="message-timing-value"
        >
          {{ stat.value }}
        </dd>
      </div>
    </dl>
  </div>
</template>
