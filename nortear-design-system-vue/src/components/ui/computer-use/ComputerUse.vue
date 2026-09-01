<script lang="ts">
/**
 * A tela que o agente está dirigindo, com a marca da ação em curso e o rastro
 * de onde ela veio.
 *
 * Desenho em `nds/agent-run.css`, no bloco "Tela do computador", que também
 * guarda as nove decisões de acessibilidade. O vocabulário — `ComputerStep`,
 * `RunStatus` — vem de `@shared/primitives/chat-protocol`.
 *
 * POR QUE ELA É PEÇA, e não composição das irmãs. É a primeira da família cujo
 * eixo é o ESPAÇO. `tool-group` desenha uma lista, `agent-plan` desenha uma
 * lista, `terminal-block` desenha linhas: todas ordenam no tempo, e a posição
 * de cada item é consequência da ordem. Aqui a posição é DADO — o ponto que o
 * agente clicou —, e nada no design system posiciona dado em coordenada sobre
 * uma superfície que ele não conhece. O que falta para compor isto não é uma
 * classe, é um sistema de coordenadas.
 *
 * A TELA É ESPAÇO, e a peça nunca a cria. Captura de tela de sistema real traz
 * marca registrada e conteúdo de terceiro (§1 da guideline 17), que é a mesma
 * razão pela qual os logotipos de modelo não entram no repositório. Quem
 * consome preenche o espaço, como o retrato do autor já faz na mensagem — e o
 * TEXTO ALTERNATIVO dele é de quem consome, porque a peça não é dona daquele
 * elemento. A orientação está escrita na decisão 6 da folha: com a legenda ao
 * lado dizendo o que está acontecendo, a captura é decorativa e vai com texto
 * alternativo vazio; quando ela carrega o que a legenda não diz, o texto é
 * obrigatório.
 *
 * A DIVERGÊNCIA DE API DE FRAMEWORK, e ela é uma só: aqui o espaço da tela é um
 * SLOT NOMEADO, `#screen`. Não é alinhamento pendente — é o mesmo espaço
 * escrito na forma que esta stack tem para espaço, e é o precedente que
 * `ChatMessage.vue` já fixou com o retrato do autor. Um nó de interface por
 * propriedade obrigaria quem consome a construí-lo fora do template, que é
 * justamente onde esta stack não escreve interface. O resto do contrato — o
 * endereço, os passos, o índice, o estado e os rótulos — não diverge.
 *
 * O ESTADO É `RunStatus`, INTEIRO, e é usado para uma pergunta só: a execução
 * ainda corre? É ela que decide se a peça se declara ocupada e se a marca ativa
 * pulsa — marca que pulsa depois do fim é o cursor que fica mentindo do bloco
 * de terminal. Receber as cinco palavras e perguntar uma coisa só NÃO é o
 * achatamento que a §5.3 da guideline condena: aquele critério é sobre o modelo
 * de DADOS, e o que ele condena é a informação se perder na entrada. Aqui ela
 * entra inteira, vinda do mesmo `RunStatus` que alimenta o estado da execução
 * logo acima na tela; um booleano na assinatura obrigaria quem consome a
 * traduzir cinco palavras em duas no ponto da chamada, que é exatamente onde a
 * perda aconteceria.
 *
 * O PASSO NÃO TEM ESTADO, e isso é do vocabulário: o que está acontecendo vale
 * para a SESSÃO, não por passo. Um passo com estado próprio faria a peça
 * desenhar cinco marcas diferentes sobre uma tela que ela não conhece — cor
 * sobre conteúdo de terceiro, que é a codificação que a legenda existe para não
 * precisar.
 *
 * O QUE O COMPONENTE NÃO FAZ: dirigir, clicar, avançar sozinho, capturar tela,
 * agendar quadro, contar tempo, rolar. Ele desenha o endereço, a tela que
 * recebe, as marcas dos passos que recebe e a legenda do passo ativo. Avançar é
 * de quem consome — a peça não agenda nada (§2 da guideline 17).
 */
import type { ComputerStep, RunStatus } from '@shared/primitives/chat-protocol'

/**
 * Quantas marcas o rastro mostra, contando a ativa.
 *
 * Três, e o número tem motivo: duas marcas são um segmento, e um segmento é uma
 * direção — com duas não dá para saber se o agente estava subindo ou descendo a
 * tela. Com três há duas pernas, que é o mínimo que desenha um caminho. Mais do
 * que isso e o rastro passa a cobrir a tela que ele deveria estar apontando.
 *
 * Não é opção: o número é desenho, e quem consome que quisesse outro estaria
 * pedindo outra peça. Quem tiver menos de três passos vê menos marcas, que é o
 * começo de toda sessão.
 */
const TRAIL_LENGTH = 3

export interface ComputerUseLabels {
  /**
   * A palavra que apresenta o endereço, e que só quem ouve recebe.
   *
   * Sem os pontos de janela — que a folha recusou, e diz por quê —, o que diz
   * "isto é um endereço" é a posição e o tratamento, e nada disso chega a quem
   * não vê a barra. Uma cadeia solta no começo da figura seria texto sem
   * assunto (decisão 8 da folha).
   */
  address: string
  /**
   * O molde da contagem. `{index}` vira a posição do passo e `{total}` vira
   * quantos são.
   *
   * Molde, e não texto pronto, pela mesma divisão do código de saída do bloco
   * de terminal: a palavra que liga os dois números é do idioma, e os números
   * são dado. O `{index}` já chega contado a partir de um — quem lê conta a
   * partir de um, e deixar a conversão para o molde a espalharia por três
   * idiomas.
   */
  position: string
}
</script>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** O endereço da tela que está sendo dirigida. */
    url: string
    /**
     * Os passos da sessão, na ordem em que aconteceram.
     *
     * Sem passo nenhum não há rastro nem legenda: sobra a moldura com o
     * endereço e a tela, que é o que existe antes de o agente tocar em
     * qualquer coisa.
     */
    steps?: readonly ComputerStep[]
    /**
     * Qual passo está acontecendo agora.
     *
     * Índice, e não fatia — e a diferença importa. A revelação aos poucos é
     * recorte de quem consome, como em toda esta família; mas a legenda diz
     * "3 de 6", e o total não sobrevive a uma fatia. Fora de alcance é preso
     * ao alcance, para que incrementar além do último passo continue apontando
     * para um passo de verdade.
     */
    activeIndex?: number
    /**
     * Em que pé está a sessão. Quem dirige é quem sabe, e é quem passa.
     *
     * Decide se a peça se declara ocupada e se a marca ativa pulsa. Não decide
     * cor de marca: estado por cor sobre uma tela de terceiro é a codificação
     * que a legenda substitui.
     */
    status?: RunStatus
    labels: ComputerUseLabels
  }>(),
  { steps: () => [], activeIndex: 0, status: 'idle' },
)

/**
 * A TELA, que é ESPAÇO de quem consome.
 *
 * Slot nomeado, e não propriedade: é a forma que esta stack tem para espaço, e
 * a mesma por onde o retrato entra na mensagem. A peça não cria imagem nenhuma
 * (§1 da guideline 17), e não escreve nem apaga o texto alternativo do que
 * recebe — nem o `inert` que faz da tela uma foto em vez de um formulário para
 * preencher.
 */
defineSlots<{ screen?: () => unknown }>()

/**
 * O ÍNDICE É PRESO AO ALCANCE, e não recusado: quem avança uma sessão
 * incrementa um número, e o passo seguinte ao último é o último. Recusar
 * deixaria a tela sem marca justamente quando a sessão acabou de terminar.
 */
const clampedIndex = computed(() =>
  Math.min(Math.max(props.activeIndex, 0), Math.max(props.steps.length - 1, 0)),
)

/**
 * As marcas do rastro, da mais antiga para a mais recente — a última é a ativa.
 *
 * A janela sai do template de propósito: ela é decisão de desenho, e deixá-la
 * numa expressão de atributo a espalharia por dois lugares que teriam de
 * concordar.
 */
const trail = computed(() => {
  if (props.steps.length === 0) return []
  const from = Math.max(clampedIndex.value - (TRAIL_LENGTH - 1), 0)
  return props.steps.slice(from, clampedIndex.value + 1).map((step, offset) => ({
    key: step.id ?? String(from + offset),
    step,
    active: from + offset === clampedIndex.value,
  }))
})

/** O passo que a legenda descreve, ou nada quando a sessão não tem passo. */
const activeStep = computed<ComputerStep | undefined>(() => props.steps[clampedIndex.value])

/**
 * OCUPADO ENQUANTO CORRE, e só (decisão 1, regra 1 da §8 da guideline 17).
 *
 * `aria-busy` diz que aquele pedaço da tela ainda se escreve, sem anunciar
 * nada — é o contrário da região viva. Nada aqui é `aria-live`: a legenda troca
 * a cada passo, e uma tela dirigida por agente troca de passo mais depressa do
 * que se lê; anunciar cada uma seria a rajada da saída de terminal com outro
 * nome. `undefined` remove o atributo, porque `aria-busy="false"` é uma
 * afirmação a mais que ninguém pediu.
 */
const busy = computed(() => (props.status === 'running' ? 'true' : undefined))

/** Os dois números já dentro do molde do idioma. */
const positionText = computed(() =>
  props.labels.position
    .replace('{index}', String(clampedIndex.value + 1))
    .replace('{total}', String(props.steps.length)),
)
</script>

<template>
  <!-- `<figure>` e não `role="region"` (decisão 4): marco de página por tela
       numa conversa é uma lista de marcos que ninguém navega, e figura ainda
       amarra a legenda à imagem que ela descreve. -->
  <figure
    class="nds-computer-use"
    data-slot="computer-use"
    :data-status="status"
    :aria-busy="busy"
  >
    <!-- ── O endereço ───────────────────────────────────────────────── -->
    <p
      class="nds-computer-use-address nds-font-mono"
      data-slot="computer-use-address"
    >
      <!-- A PALAVRA QUE SÓ QUEM OUVE RECEBE (decisão 8). Ela não é enfeite de
           leitor de tela: é o que a barra diz pelo desenho e não conseguiria
           dizer em voz. -->
      <span class="nds-sr-only">{{ labels.address }}</span>

      <!-- `lang="en"`: um endereço é máquina — servidor, caminho, parâmetro.
           Sem isto, a voz do leitor em pt-BR tenta pronunciá-lo como português
           (WCAG 3.1.2). Mesma decisão do comando no bloco de terminal. -->
      <span
        class="nds-computer-use-url nds-truncate"
        data-slot="computer-use-url"
        lang="en"
      >{{ url }}</span>
    </p>

    <!-- ── O quadro ─────────────────────────────────────────────────
         Ele RECORTA e não rola (decisão 5); a proporção o faz crescer com a
         largura em vez de espremer a imagem. -->
    <div
      class="nds-computer-use-screen"
      data-slot="computer-use-screen"
    >
      <!-- A tela chega inteira de quem consome, e a peça não mexe em nada do
           que veio com ela. Sem marcação em cadeia não há o que sanitizar. -->
      <div
        class="nds-computer-use-surface"
        data-slot="computer-use-surface"
      >
        <slot name="screen" />
      </div>

      <!-- O RASTRO É UMA CAMADA SÓ, e é ela que sai inteira do que é lido em
           voz (decisão 2) — um `aria-hidden` por marca seria a mesma decisão
           repetida em tantos lugares quantos forem os passos. Posição numa
           imagem não chega a quem não a vê; o que chega é a legenda, logo
           abaixo. -->
      <span
        v-if="trail.length > 0"
        class="nds-computer-use-trail"
        data-slot="computer-use-trail"
        aria-hidden="true"
      >
        <!-- O PONTO É DADO, e entra em propriedade personalizada: não existe
             token de "62%", e a regra do repositório reserva `style` inline
             para mecânica e para propriedade personalizada. A conta de
             porcentagem fica na folha, que é onde ela pode mudar sem tocar nas
             cinco stacks. -->
        <span
          v-for="mark in trail"
          :key="mark.key"
          class="nds-computer-use-mark"
          data-slot="computer-use-mark"
          :data-active="mark.active ? 'true' : undefined"
          :style="{
            '--computer-use-mark-x': String(mark.step.x),
            '--computer-use-mark-y': String(mark.step.y),
          }"
        />
      </span>
    </div>

    <!-- ── A legenda ────────────────────────────────────────────────
         Ela é a peça para quem ouve (decisão 2), e é `<figcaption>` porque a
         legenda de uma figura É o nome dela: sem isso a tela seria uma imagem
         anônima no meio da conversa. Sem passo nenhum não há legenda — não há o
         que dizer, e uma legenda vazia daria à figura um nome em branco. -->
    <figcaption
      v-if="activeStep"
      class="nds-computer-use-caption"
      data-slot="computer-use-caption"
    >
      <!-- O VERBO É O QUE DESCREVE, e por isso carrega o peso e a cor de
           texto — mesma divisão do nome e do detalhe da chamada de
           ferramenta. -->
      <span
        class="nds-computer-use-action"
        data-slot="computer-use-action"
      >{{ activeStep.action }}</span>

      <span
        class="nds-computer-use-target nds-truncate"
        data-slot="computer-use-target"
      >{{ activeStep.target }}</span>

      <!-- A CONTAGEM É NÚMERO, e chega a quem ouve: ela não se reescreve
           sozinha — quem a muda é um passo novo —, então não é o relógio de que
           esta folha se defende. É também a única parte da peça que diz que
           existe uma SEQUÊNCIA: o rastro diz isso pelo desenho, e o desenho não
           é lido. -->
      <span
        class="nds-computer-use-position"
        data-slot="computer-use-position"
      >{{ positionText }}</span>
    </figcaption>
  </figure>
</template>
