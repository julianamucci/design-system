<script lang="ts">
/**
 * A marca numerada que liga uma frase à fonte em que ela se apoia.
 *
 * Desenho em `nds/evidencia.css`, no bloco "Citação em linha", que também
 * guarda as dez decisões de acessibilidade e o eixo da família. O vocabulário —
 * `Citation`, `ChatSource` — vem de `@shared/primitives/chat-protocol`.
 *
 * POR QUE ELA É PEÇA, e não um cartão de ponteiro com título e link. A pergunta
 * veio antes do desenho, e a resposta tem duas metades que nenhum painel
 * flutuante genérico resolve:
 *
 *   · ELA VIVE DENTRO DE TEXTO CORRIDO, e isso é geometria própria. A marca
 *     interrompe um parágrafo: assenta na linha de base sem esticar a
 *     entrelinha, não se separa da palavra que a antecede quando a linha quebra,
 *     e mesmo assim oferece um alvo de toque de vinte e quatro pixels. As três
 *     exigências brigam entre si, e nenhuma classe desta base as concilia — as
 *     irmãs desenham listas e caixas, onde a altura do elemento é livre por não
 *     haver linha de texto em volta dele.
 *   · TOQUE NÃO TEM PONTEIRO. O cartão de ponteiro desta base abre por
 *     `mouseenter` e por `focus`, com seiscentos milissegundos de espera. Em
 *     telefone o primeiro não existe; e percorrer com tabulação um parágrafo de
 *     cinco citações pelo segundo abriria cinco painéis, um por parada.
 *
 * POR ISSO A PEÇA NÃO É MONTADA SOBRE O PAINEL ANCORADO DESTA STACK: aquele
 * nasce `role="dialog"` e abre no foco, que são exatamente as duas decisões que
 * esta peça inverte. A marcação é própria, e é a mesma nas cinco stacks.
 *
 * O QUE O COMPONENTE NÃO FAZ: buscar a fonte, resolver o endereço, recortar o
 * trecho, numerar as marcas de uma página, decidir se duas podem estar abertas
 * ao mesmo tempo. Ele desenha o que recebe (§2 da guideline 17).
 */
import type { Citation } from '@shared/primitives/chat-protocol'

export interface InlineCitationLabels {
  /**
   * O nome acessível da marca, JÁ ESCRITO.
   *
   * O que se vê é um número, e "1" sozinho não diz nada a quem ouve. O nome
   * chega escrito porque junta três coisas que só quem monta conhece — a
   * palavra para "fonte", o número e o título do documento —, e a ordem entre
   * elas troca com o idioma.
   *
   * Ele PRECISA conter o número que a marca mostra (WCAG 2.5.3, rótulo no
   * nome), e é por isso que quem o escreve recebe o número junto no andaime.
   */
  marker: string
  /**
   * O que se diz no lugar do endereço quando ele foi recusado.
   *
   * Endereço recusado não é um lugar, e imprimi-lo responderia com ruído a
   * pergunta que a linha existe para responder — de onde isto vem. O título
   * continua legível; o que sai é o link e o endereço.
   */
  unsafeSource: string
}

/**
 * Os comandos da marca — a DIVERGÊNCIA DE API DE FRAMEWORK desta peça,
 * registrada e não "alinhada".
 *
 * Não há propriedade `open` controlada, e a ausência é deliberada nas cinco
 * stacks: quem controla de fora ABRE E FECHA POR COMANDO e recebe cada mudança
 * de volta. O que muda por stack é só como se alcança o comando — aqui, um
 * `ref` de template sobre o que a peça expõe, que é a forma que esta stack tem
 * para falar com uma instância montada.
 *
 * É este comando que resolve a exclusão mútua entre duas prévias: a peça não
 * conhece as vizinhas, e não conhecê-las é o que permite que duas marcas da
 * mesma frase venham de lugares diferentes da resposta.
 */
export interface InlineCitationCommands {
  open: () => void
  close: () => void
  toggle: () => void
  isOpen: () => boolean
}

/**
 * Espera antes de abrir ao passar o ponteiro.
 *
 * Menor que os seiscentos milissegundos do cartão de ponteiro, e de propósito:
 * lá o gatilho é um nome de pessoa ou um link, e abrir cedo demais atrapalha
 * quem só atravessa a frase; aqui o gatilho é uma marca deliberadamente
 * pequena, difícil de pegar por acidente. Quem parou o ponteiro em cima dela
 * quis parar.
 */
const OPEN_DELAY = 300

/**
 * Espera antes de fechar depois que o ponteiro sai.
 *
 * Dá tempo de atravessar o vão entre a marca e a caixa. Mesmo valor do cartão
 * de ponteiro, e pelo mesmo motivo.
 */
const CLOSE_DELAY = 300

/**
 * Folga entre a caixa e a borda da janela, em pixels.
 *
 * Número mecânico, e não valor de desenho: ele não pinta nada e não entra em
 * folha nenhuma — é o limite contra o qual a caixa é empurrada de volta para
 * dentro da tela.
 */
const VIEWPORT_GUTTER = 8

/**
 * Empurra a caixa de volta para dentro da janela, e escolhe o lado.
 *
 * A FOLHA POSICIONA; esta função só MEDE, e devolve o resultado por uma custom
 * property e por um atributo. É a divisão que mantém o desenho na folha: sem
 * ela, o deslocamento viraria `left` em `style` inline, e no dia em que a folha
 * mudasse a largura da caixa o número inline continuaria o mesmo.
 *
 * As duas escritas são IMPERATIVAS de propósito, e não expressões de atributo:
 * a segunda medida precisa da caixa já no lado escolhido, e um valor reativo só
 * chegaria ao DOM no próximo ciclo — a medida sairia do estado anterior. Como
 * a caixa é montada e desmontada a cada abertura, não há resíduo a limpar.
 *
 * Roda uma vez por abertura, e fora de qualquer espera com observador de
 * mutação — ela LÊ layout, e leitura que provoca a própria reavaliação é a
 * armadilha que pendura a aba.
 */
function fitPanel(marker: HTMLElement, panel: HTMLElement): void {
  panel.style.removeProperty('--nds-inline-citation-shift')
  panel.dataset.side = 'bottom'

  const markerRect = marker.getBoundingClientRect()
  const panelRect = panel.getBoundingClientRect()

  // ABAIXO NÃO CABE? Abre para cima — e só quando ACIMA cabe. Sem a segunda
  // metade da pergunta, uma marca numa janela baixa trocaria um transbordo por
  // outro, e o de cima é pior: a caixa cobriria a frase que se estava lendo.
  const roomBelow = window.innerHeight - markerRect.bottom - VIEWPORT_GUTTER
  if (panelRect.height > roomBelow && markerRect.top > panelRect.height + VIEWPORT_GUTTER) {
    panel.dataset.side = 'top'
  }

  // O DESVIO HORIZONTAL é medido depois do lado, com a caixa já onde vai ficar.
  // Só a componente horizontal é empurrada: a vertical já foi resolvida pelo
  // lado, e empurrar as duas faria a caixa descolar da marca que a abriu.
  const placed = panel.getBoundingClientRect()
  let shift = 0
  if (placed.right > window.innerWidth - VIEWPORT_GUTTER) {
    shift = window.innerWidth - VIEWPORT_GUTTER - placed.right
  }
  if (placed.left + shift < VIEWPORT_GUTTER) {
    shift = VIEWPORT_GUTTER - placed.left
  }
  if (shift !== 0) {
    panel.style.setProperty('--nds-inline-citation-shift', `${Math.round(shift)}px`)
  }
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
// No call site, e não atrás de um invólucro local: é o que faz a análise
// estática reconhecer a validação onde ela acontece.
import { isSafeUrl } from '@shared/primitives/markdown-ast'

const props = withDefaults(
  defineProps<{
    /**
     * A citação: a fonte, o trecho e onde dentro dela.
     *
     * `excerpt` e `anchor` são opcionais no vocabulário compartilhado e
     * continuam opcionais aqui: quem cita um documento sem saber a página tem
     * uma citação legítima, e a caixa simplesmente não monta a parte que não
     * veio — nunca um traço no lugar dela.
     */
    citation: Citation
    /**
     * O número que a marca mostra.
     *
     * É CONTEÚDO, e não decoração: é por ele que a frase se refere à fonte, e é
     * ele que amarra a marca à lista de fontes do turno. Quem numera é quem
     * escreve a frase — uma marca que se numerasse sozinha precisaria conhecer
     * as irmãs, e marcas irmãs podem nem estar no mesmo parágrafo.
     */
    index: number
    /** Nasce com a prévia aberta — serve para fotografar o estado. */
    defaultOpen?: boolean
    labels: InlineCitationLabels
  }>(),
  { defaultOpen: false },
)

/**
 * Cada abertura e cada fechamento, para quem controla de fora.
 *
 * O conteúdo compartilhado o descreve como callback, que é a forma do primitivo
 * de referência; aqui ele é um EVENTO, e quem consome o escuta. O DADO que
 * viaja é o mesmo dos dois lados: o novo estado da caixa, um booleano.
 */
const emit = defineEmits<{ 'open-change': [open: boolean] }>()

// O identificador liga o botão à caixa por `aria-controls`, e a caixa só existe
// enquanto está aberta. `useId` porque a mesma frase monta várias marcas, e um
// identificador derivado do índice colidiria entre dois parágrafos.
const id = `inline-citation-${useId()}`
const panelId = `${id}-panel`

const expanded = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const markerRef = ref<HTMLButtonElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)

let openTimer: ReturnType<typeof setTimeout> | null = null
let closeTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Quem abriu.
 *
 * `pointer` fecha sozinho quando o ponteiro sai; `control` fica até alguém
 * fechar. Sem essa distinção, a caixa aberta por clique sumiria ao primeiro
 * movimento do mouse — e quem abriu por toque veria a prévia piscar.
 */
let openedBy: 'pointer' | 'control' = 'pointer'

function clearTimers(): void {
  if (openTimer) { clearTimeout(openTimer); openTimer = null }
  if (closeTimer) { clearTimeout(closeTimer); closeTimer = null }
}

function onOutsidePointer(event: Event): void {
  const target = event.target
  if (target instanceof Node && rootRef.value?.contains(target)) return
  hide()
}

function onKeyDown(event: KeyboardEvent): void {
  // Escape fecha e o foco NÃO se move: ele já está na marca, que é de onde a
  // caixa saiu (WCAG 2.1.2, e a regra 2 da §8 da guideline 17).
  if (event.key !== 'Escape') return
  event.stopPropagation()
  hide()
  markerRef.value?.focus()
}

function detachDocumentListeners(): void {
  document.removeEventListener('keydown', onKeyDown)
  document.removeEventListener('pointerdown', onOutsidePointer, true)
}

function show(): void {
  clearTimers()
  expanded.value = true
}

function hide(): void {
  clearTimers()
  expanded.value = false
}

/**
 * O que só pode acontecer DEPOIS de a caixa existir na página.
 *
 * `flush: 'post'` é o que dá isso: encaixar exige o retângulo da marca e o da
 * caixa, e antes da aplicação no DOM nenhum dos dois existe. Os dois ouvintes
 * de documento vivem só enquanto a caixa está aberta, e quem os solta é o mesmo
 * observador — o desmonte com a caixa aberta passa por `onBeforeUnmount`.
 */
watch(expanded, (isOpen) => {
  if (isOpen) {
    const marker = markerRef.value
    const panel = panelRef.value
    if (marker && panel) fitPanel(marker, panel)
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onOutsidePointer, true)
  } else {
    detachDocumentListeners()
  }
  emit('open-change', isOpen)
}, { flush: 'post' })

function scheduleShow(): void {
  if (closeTimer) { clearTimeout(closeTimer); closeTimer = null }
  if (expanded.value) return
  openTimer = setTimeout(() => { openedBy = 'pointer'; show() }, OPEN_DELAY)
}

function scheduleHide(): void {
  if (openTimer) { clearTimeout(openTimer); openTimer = null }
  // Aberta por controle, o ponteiro que sai não fecha: quem clicou pediu que
  // ficasse, e em toque não há "sair" nenhum para desfazer o pedido.
  if (openedBy === 'control') return
  closeTimer = setTimeout(() => { hide() }, CLOSE_DELAY)
}

function cancelHide(): void {
  if (closeTimer) { clearTimeout(closeTimer); closeTimer = null }
}

// PONTEIRO, TOQUE E TECLADO, e nenhum deles sozinho. O clique é o caminho que
// serve aos três — em toque ele é o único que existe, e no teclado ele é o que
// Enter e Espaço já disparam num botão. O ponteiro ganha a abertura por espera
// como CONVENIÊNCIA, nunca como único caminho (regra 3 da §8).
function onMarkerClick(): void {
  clearTimers()
  openedBy = 'control'
  if (expanded.value) hide()
  else show()
}

// A MARCA NÃO ABRE POR FOCO, e é a divergência deliberada em relação ao cartão
// de ponteiro. Percorrer com tabulação um parágrafo de cinco citações abriria
// cinco caixas, uma por parada — e caixa aberta sem ninguém pedir cobre o texto
// que a pessoa estava lendo. Por isso não existe manipulador de `focus` aqui.

onMounted(() => {
  // Depois da montagem, e não na inicialização do estado: encaixar a caixa
  // exige o retângulo da marca, que só existe com a raiz no documento.
  if (props.defaultOpen) {
    openedBy = 'control'
    show()
  }
})

onBeforeUnmount(() => {
  clearTimers()
  detachDocumentListeners()
})

defineExpose<InlineCitationCommands>({
  open: () => { openedBy = 'control'; show() },
  close: () => { hide() },
  toggle: () => { openedBy = 'control'; if (expanded.value) hide(); else show() },
  isOpen: () => expanded.value,
})
</script>

<template>
  <!-- A RAIZ É UM `<span>` EM LINHA, e a caixa é FILHA dela — nunca um portal
       para o fim do documento. Duas coisas dependem disso:

         · A ORDEM DE TABULAÇÃO fica natural. Da marca, o Tab entra na caixa e
           alcança o link do título. Portalada, o Tab sairia da marca para a
           próxima palavra do parágrafo e o link ficaria inalcançável sem mover
           o foco à mão — que é o que a regra 2 da §8 proíbe.
         · O POSICIONAMENTO fica na FOLHA. A raiz é `position: relative`, então
           a caixa se ancora nela por CSS. -->
  <span
    ref="rootRef"
    class="nds-inline-citation"
    data-slot="inline-citation"
  >
    <!-- A MARCA É UM BOTÃO QUE EXPANDE, e não um link nem um gatilho de
         diálogo: papel de diálogo exige nome acessível, e com um gatilho cujo
         texto é "1" o resultado seria um diálogo chamado "1" (decisão 1 da
         folha). `aria-expanded` é o que diz o estado, e ele é PALAVRA para quem
         ouve — nada aqui depende de a marca mudar de cor (WCAG 1.4.1). -->
    <button
      :id="id"
      ref="markerRef"
      class="nds-inline-citation-marker"
      data-slot="inline-citation-marker"
      type="button"
      :aria-expanded="expanded ? 'true' : 'false'"
      :aria-controls="panelId"
      :aria-label="labels.marker"
      @click="onMarkerClick"
      @mouseenter="scheduleShow"
      @mouseleave="scheduleHide"
    >{{ index }}</button>

    <!-- `<span>`, e não `<div>`: a marca vive dentro de um parágrafo, e `<p>`
         só aceita conteúdo de frase. Um `<div>` aqui fecharia o parágrafo antes
         da metade da frase, e o resto do texto viraria irmão dele em vez de
         continuação. Dentro de uma caixa flexível todo filho é blocado de
         qualquer jeito, então nada se perde no desenho.

         A SUPERFÍCIE É A COMPARTILHADA: fundo, borda, raio, sombra e respiro
         vêm do painel ancorado desta base; o que a folha desta família
         acrescenta é o que só a citação tem. A caixa não tem papel e não tem
         nome próprio — quem chegou até ela veio da marca, e a marca já disse de
         que fonte se trata. -->
    <span
      v-if="expanded"
      :id="panelId"
      ref="panelRef"
      class="nds-popover-content nds-inline-citation-panel"
      data-slot="inline-citation-panel"
      data-side="bottom"
      @mouseenter="cancelHide"
      @mouseleave="scheduleHide"
    >
      <!-- O ENDEREÇO VEM DE QUEM GEROU A RESPOSTA, e endereço vindo dali é
           ENTRADA: `javascript:` num `href` executa. A pergunta é feita no ponto
           em que o endereço encosta no DOM, e não antes — mesma decisão da lista
           de fontes da conversa e do Markdown.

           O MONOESPAÇADO SÓ ENTRA QUANDO A LINHA É MESMO UM ENDEREÇO. Recusado,
           o que fica ali são PALAVRAS, e endereço recusado não é um lugar. -->
      <span
        :class="isSafeUrl(citation.source.url)
          ? 'nds-inline-citation-address nds-font-mono nds-truncate'
          : 'nds-inline-citation-address'"
        data-slot="inline-citation-address"
      >{{ isSafeUrl(citation.source.url) ? citation.source.url : labels.unsafeSource }}</span>

      <!-- O TÍTULO CONTINUA LEGÍVEL quando o endereço foi recusado, e deixa de
           ser link: não há para onde ir, e um link que não leva a lugar nenhum é
           uma parada de tabulação sem destino. Como vira `<span>`, ele também
           sai do percurso do teclado. -->
      <a
        v-if="isSafeUrl(citation.source.url)"
        class="nds-inline-citation-title"
        data-slot="inline-citation-title"
        :href="citation.source.url"
        rel="noreferrer"
      >{{ citation.source.title }}</a>
      <span
        v-else
        class="nds-inline-citation-title"
        data-slot="inline-citation-title"
        data-unsafe=""
      >{{ citation.source.title }}</span>

      <!-- O TRECHO É UMA CITAÇÃO, e `<q>` é o elemento que diz isso — com as
           aspas do idioma vindo do navegador em vez de escritas no texto, que é
           o mesmo motivo pelo qual nenhum glifo entra na `translations.json`.
           `cite` leva o endereço só quando ele passou, porque o atributo é um
           endereço como o `href`. -->
      <q
        v-if="citation.excerpt"
        class="nds-inline-citation-excerpt"
        data-slot="inline-citation-excerpt"
        :cite="isSafeUrl(citation.source.url) ? citation.source.url : undefined"
      >{{ citation.excerpt }}</q>

      <!-- ONDE DENTRO DA FONTE — página, âncora, intervalo de linhas. Chega
           escrito, porque "12" sozinho não é um lugar e o que precede o número é
           idioma. Ausente é ausente: nada é montado no lugar dele. -->
      <span
        v-if="citation.anchor"
        class="nds-inline-citation-anchor"
        data-slot="inline-citation-anchor"
      >{{ citation.anchor }}</span>
    </span>
  </span>
</template>
