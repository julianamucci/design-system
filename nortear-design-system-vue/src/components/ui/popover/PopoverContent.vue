<script setup lang="ts">
import type { PopoverContentEmits, PopoverContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  PopoverContent,
  PopoverPortal,
  useForwardPropsEmits,
} from 'reka-ui'
import { computed, inject, onBeforeUnmount, onMounted, ref, useAttrs } from 'vue'
import { cn } from '@/lib/utils'
import { POPOVER_ANCHOR, POPOVER_CLOSE_REASON, POPOVER_DISMISS, POPOVER_MODAL } from './popover.context'
import { PopoverAriaHiddenRestore } from './popover-aria-hidden-restore'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<PopoverContentProps & { class?: HTMLAttributes['class'] }>(),
  {
    align: 'center',
    // `alignOffset` DECLARADO, e não só repassado por spread. O tipo da lib já o
    // carrega (`PopperContentProps`), então até aqui ele chegava ao painel se
    // quem compõe o escrevesse — mas "repassado" não é a mesma afirmação que
    // "entregue": sem o padrão explícito, a tabela de props prometia um `0` que
    // nenhuma linha desta stack escrevia.
    alignOffset: 0,
    sideOffset: 4,
  },
)
const emits = defineEmits<PopoverContentEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

/**
 * `aria-modal` — nosso, porque nenhum caminho do primitivo o emite.
 *
 * SÓ no modo modal, e nunca `"false"` no padrão: o atributo ausente e o negado
 * dizem a mesma coisa ao leitor de tela, e anunciar inércia sem o foco preso
 * seria mentira. Quem prende o foco aqui é a lib — com `modal`, o painel que
 * renderiza é o modal, com `trap-focus` ligado —, então o anúncio é verdadeiro.
 */
const modal = inject(POPOVER_MODAL, computed(() => false))
// Anota o motivo para a raiz; inerte quando o painel é usado sem ela.
const anotarMotivo = inject(POPOVER_CLOSE_REASON, () => {})
// Fecha PELA raiz, já com o motivo — o caminho que a lib não dispensa sozinha.
const dismiss = inject(POPOVER_DISMISS, () => {})
const ariaModal = computed(() => (modal.value ? 'true' : undefined))

/**
 * `alignOffset` com `align="center"` — a metade da D14 que a reka não entrega.
 *
 * O `offset` do `@floating-ui` ignora `alignmentAxis` sem alinhamento, e
 * `center` é justamente a ausência dele: o painel ficava centrado como se o
 * deslocamento não existisse. Medido em 2026-09-17 pela `SideTop`, com
 * `alignOffset: 8`: 0px no eixo cruzado, contra 8px no vanilla, no react e no
 * angular.
 *
 * A correção entrega à lib uma referência VIRTUAL — o retângulo da âncora
 * deslizado no eixo cruzado — em vez de mexer no painel depois de posicionado.
 * Assim o deslocamento entra ANTES das colisões, como no vanilla: `shift` e
 * `flip` enxergam o painel onde ele de fato vai ficar. Positivo empurra para o
 * fim do eixo: direita em `top`/`bottom`, baixo em `left`/`right`.
 *
 * Só com `center` e deslocamento diferente de zero; nos outros casos a lib já
 * aplica o `alignmentAxis` sozinha, e a referência de quem compõe (se houver)
 * segue valendo.
 */
const anchor = inject(POPOVER_ANCHOR, null)
const crossAxisReference = computed(() => {
  const shift = props.alignOffset ?? 0
  if (props.align !== 'center' || !shift) return props.reference
  const el = anchor?.custom.value ?? anchor?.trigger.value
  if (!el) return props.reference
  const horizontalShift = props.side !== 'left' && props.side !== 'right'
  return {
    contextElement: el,
    getBoundingClientRect: () => {
      const rect = el.getBoundingClientRect()
      return horizontalShift
        ? new DOMRect(rect.x + shift, rect.y, rect.width, rect.height)
        : new DOMRect(rect.x, rect.y + shift, rect.width, rect.height)
    },
  }
})

/**
 * O que conta como "primeiro elemento focável".
 *
 * `[tabindex="-1"]` fica de fora de propósito: é o marcador de foco
 * programático, não de parada na ordem de tabulação — e o próprio painel o tem.
 * A exclusão vale para TODOS os seletores, e não só para o genérico: um
 * `<input tabindex="-1">` escondido ao lado de um controle entraria pela porta
 * do `input:not([disabled])` e roubaria a vez do primeiro focável de verdade.
 *
 * Lista igual à do `popover.ts` do Vanilla, que é a referência.
 */
const FOCAVEIS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]',
]
  .map((selector) => `${selector}:not([tabindex="-1"])`)
  .join(', ')

/**
 * ONDE o foco pousa ao abrir — `data-autofocus` primeiro.
 *
 * "Primeiro elemento focável" é a resposta errada para alguma coisa: num painel
 * cujo miolo tem navegação antes do conteúdo, o foco para no primeiro botão da
 * navegação e quem abre por teclado atravessa tudo antes de chegar ao que
 * importa. `data-autofocus` é como o CONTEÚDO diz onde quer o foco.
 *
 * A ordem é a mesma nas cinco: o primeiro `[data-autofocus]` DENTRO do painel;
 * sem marca, o primeiro focável; sem nenhum, o próprio painel — que o
 * gerenciador de foco da lib já deixou com `tabindex="-1"`, para o leitor de
 * tela anunciar o diálogo mesmo quando ele só tem texto.
 *
 * `[data-autofocus]` com `tabindex="-1"` VALE como alvo, e por isso a consulta
 * dele não passa por `FOCAVEIS`: o atributo pede foco PROGRAMÁTICO, que é
 * justamente o que `tabindex="-1"` existe para permitir.
 *
 * O `preventDefault` não é detalhe: o `FocusScope` da reka dispara este evento
 * e, se ele não for prevenido, foca o primeiro tabulável logo em seguida
 * (`FocusScope.js`, `dispatchMountAutoFocus`) — desfazendo a escolha do
 * conteúdo. Tomar a decisão aqui exige tirá-la da lib.
 */
function aoAutoFocar(evento: Event): void {
  const panelEl = evento.target as HTMLElement | null
  if (!panelEl) return
  evento.preventDefault()
  const declarado = panelEl.querySelector<HTMLElement>('[data-autofocus]')
  const alvo = declarado ?? panelEl.querySelector<HTMLElement>(FOCAVEIS)
  ;(alvo ?? panelEl).focus()
}

/**
 * `Tab` para FORA do painel FECHA e DEVOLVE O FOCO AO GATILHO — e só fora do
 * modo modal.
 *
 * Decisão da dona de 2026-09-17, igual nas cinco, e nos DOIS sentidos: `Tab` a
 * partir do último focável, `Shift+Tab` a partir do primeiro, ou qualquer um dos
 * dois num painel sem focável nenhum. O motivo é `overlay`: quem tabulou para
 * fora saiu do painel sem decidir nada, como quem clica fora.
 *
 * Quem fecha é a TECLA, e não um ouvinte de foco, por duas medições que valem
 * nas cinco stacks:
 *
 *  - `focusin`/`focusout` chegam também pelo PONTEIRO. Clicar num botão o foca
 *    antes do `click`, então o clique no gatilho fecharia o painel pelo foco e o
 *    `click` logo abaixo o reabriria — o gatilho deixaria de fechar o que abriu.
 *  - Tabular para fora do último focável da PÁGINA não produz `focusin` nenhum:
 *    o foco vai para o navegador e o documento fica com o `body`. O painel mora
 *    em portal no fim do `body`, então este é justamente o caso comum aqui.
 *
 * ─── E por que a interceptação é na fase de CAPTURA, nesta stack ────────────
 *
 * Aqui não basta fechar: é preciso PRIMEIRO desligar o laço de tabulação da
 * lib, ou o foco nunca sai. Medido na fonte em 2026-09-17:
 *
 *  - `FocusScope.js:168` pendura `onKeydown: handleKeyDown` no `Primitive`, ou
 *    seja no PRÓPRIO painel, em fase de bolha e SEMPRE — com ou sem trap;
 *  - a única porteira do handler é `:142` (`if (!props.loop && !props.trapped)
 *    return`), e o `PopoverContentImpl` passa `loop` CRAVADO (`loop: ""`), sem
 *    prop que o desligue. A porteira nunca fecha, nem no não-modal;
 *  - em `:152-156`, no `Tab` a partir do último tabulável, a lib faz
 *    `event.preventDefault()` e foca o PRIMEIRO. O foco dá a volta e fica.
 *
 * É divergência real de lib, e não descuido nosso: o bits (svelte) protege na
 * REGISTRAÇÃO — sem trap os ouvintes nem nascem —, então lá o `loop` é inerte no
 * não-modal e o foco sai sozinho.
 *
 * Um ouvinte de captura NO PAINEL roda antes do alvo e, portanto, antes do
 * handler de bolha da lib no mesmo elemento; `stopPropagation()` ali impede o
 * evento de descer até o alvo e voltar, e é isso que tira o laço do caminho.
 * Mesma porta que o `@click.capture` do `PopoverClose.vue` usa, pela mesma
 * razão: é o único ponto em que se entra na frente da lib sem depender de
 * contexto interno dela.
 *
 * O corte é estreito de propósito — só `Tab`, só no não-modal, só quando o foco
 * está de saída. Nos outros casos o evento segue inteiro, e o laço da lib
 * continua sendo quem prende o foco no modo modal.
 *
 * ─── `preventDefault`, e quem devolve o foco ──────────────────────────────
 *
 * Até 2026-09-16 não havia `preventDefault` aqui, porque o contrato era "o foco
 * segue a ordem da página". O de 2026-09-17 é outro: o destino é o GATILHO, então
 * o `Tab` nativo não pode mover o foco. Sem ele, o foco sai do painel antes de o
 * painel fechar, e o gatilho deixa de ser o destino.
 *
 * O `focus()` no gatilho NÃO é nosso: com o foco ainda dentro do painel no
 * fechamento, o `closeAutoFocus` do `PopoverContentNonModal` da reka foca o
 * gatilho (só deixa de fazê-lo quando houve interação FORA, que aqui não houve).
 * Focar também daqui seria focar duas vezes — a story `Focused` mede o destino.
 *
 * ─── E a PERDA DE FOCO (D15), que é o caso oposto ───────────────────────────
 *
 * Foco levado por código a outro elemento da página fecha o painel com
 * `overlay`, uma vez, e o foco FICA onde foi posto. Aqui não há código nosso
 * para isso, e não há devolução a suprimir — medido na suíte e na fonte da
 * reka 2.10.4, em 2026-09-17:
 *
 *  - quem fecha é o `DismissableLayer` (`DismissableLayer/DismissableLayer.js:65-71`):
 *    `focusin` fora da camada emite `focusOutside` + `interactOutside` e, sem
 *    `preventDefault`, `dismiss`. O `@focus-outside` do template só anota o motivo;
 *  - quem PODERIA devolver o foco ao gatilho é o `closeAutoFocus` de
 *    `Popover/PopoverContentNonModal.js:125` — e ele não o faz porque `:134`
 *    marca `hasInteractedOutsideRef` em QUALQUER interação fora não prevenida,
 *    `focusin` incluído. Por isso este ouvinte de foco nunca chama
 *    `preventDefault`: prevenir o `focusOutside` desligaria a marca e o foco
 *    voltaria ao gatilho — foi o defeito plantado que deu dentes à `Focused`;
 *  - o gatilho conta como parte do painel em `:138-139` (interação cujo alvo é o
 *    gatilho é prevenida, então nem ponteiro nem foco nele dispensam: quem fecha
 *    é o clique, uma vez);
 *  - o clique fora não soma dois: `:140` previne o `focusin` que chega depois de
 *    um `pointerdown` fora.
 *
 * O `Tab` da borda continua devolvendo ao gatilho porque ele não passa por
 * interação fora nenhuma: o `preventDefault` acima segura o foco dentro até o
 * desmonte.
 */
function handleTabOut(event: KeyboardEvent): void {
  if (modal.value) return
  if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return

  // O ouvinte está no painel, então `currentTarget` É o painel — e ele continua
  // certo mesmo com dois popovers abertos, porque cada um tem o seu ouvinte.
  const panelEl = event.currentTarget as HTMLElement | null
  if (!panelEl) return

  const focusable = Array.from(panelEl.querySelectorAll<HTMLElement>(FOCAVEIS))
  const active = document.activeElement
  const isLeaving =
    !panelEl.contains(active) ||
    !focusable.length ||
    (event.shiftKey ? active === focusable[0] : active === focusable[focusable.length - 1])
  if (!isLeaving) return

  event.preventDefault()
  event.stopPropagation()
  dismiss('overlay')
}

// Sem nome acessível de reserva aqui: a lib já aponta o `aria-labelledby` do
// painel para o GATILHO, que é exatamente o comportamento desejado quando não
// há título — o mesmo que o Vanilla, referência cross-stack, produz. Quando há
// `PopoverTitle`, é ele que reivindica o nome (ver PopoverTitle.vue): quem sabe
// que o título existe é o próprio título, e ele monta junto com o painel.

/**
 * `aria-label` DECLARADO por quem compõe vence o `aria-labelledby` da lib.
 *
 * Mesma raiz do `PopoverTitle.vue`: o `mergeProps` do primitivo escreve o
 * `aria-labelledby` (o id do GATILHO) por último, e nem prop nem atributo o
 * sobrepõem. Passar `aria-label` sozinho seria silencioso — os dois no mesmo
 * elemento fazem o leitor de tela ler o `labelledby` e ignorar o rótulo.
 *
 * Por isso a correção é no DOM, e só quando o painel não tem título: com
 * título quem manda é o `PopoverTitle`, que remove o `aria-label` de volta.
 * O observador reafirma porque cada re-render da lib reescreve o valor dela.
 */
const attrs = useAttrs()
const panelRef = ref<{ $el?: unknown } | null>(null)
let labelObserver: MutationObserver | null = null

function applyLabel(el: HTMLElement): void {
  const label = String(attrs['aria-label'] ?? '').trim()
  if (!label) return
  if (el.querySelector('[data-slot="popover-title"]')) return
  if (el.getAttribute('aria-labelledby')) el.removeAttribute('aria-labelledby')
  if (el.getAttribute('aria-label') !== label) el.setAttribute('aria-label', label)
}

/*
 * O painel é achado no DOM por um marcador PRÓPRIO, não pelo `$el` do Vue.
 *
 * Três tentativas falharam antes, e todas partiam de `panelRef.value?.$el`:
 *
 * 1. `requestAnimationFrame` até dez vezes — desistia em silêncio.
 * 2. `watch(() => panelRef.value?.$el, …)` — PIOR: `$el` não é reativo no Vue 3
 *    (é um getter para `instance.vnode.el`), e template ref é atribuído uma vez,
 *    então o watcher dispara no máximo duas vezes.
 * 3. laço de relógio de 2s a cada 50ms — e aqui veio o dado que fechou o caso:
 *    o teste reprovou em 6094ms contra 6115ms da tentativa anterior, bit a bit
 *    o mesmo. Com 2s de tentativas contra dois disparos e resultado idêntico,
 *    TEMPO não é a variável.
 *
 * O que sobra é o alvo: o conteúdo vive sob `PopoverPortal`, ou seja dentro de
 * um `Teleport`, e o `$el` do componente ali não é o nó que o leitor de tela vê.
 * Um marcador que nós mesmos escrevemos atravessa o portal junto com o elemento,
 * e `document.querySelector` o encontra onde quer que a lib o tenha posto.
 */
/*
 * O painel se identifica pelo PRÓPRIO `aria-label`, não por um marcador novo.
 *
 * A primeira versão que funcionou cravava um `data-nds-panel` só para achar o
 * elemento — atributo que nenhuma das outras quatro stacks tem, ou seja
 * divergência de markup criada para uso interno. Não é preciso: o `aria-label`
 * de quem compõe JÁ chega ao elemento por fallthrough. O que a lib vence é o
 * `aria-labelledby`, que ela escreve por conta própria — medido em 2026-09-05
 * com um experimento que removeu o mecanismo inteiro e sobrepôs por binding:
 * reprovou em 6155ms, o prazo inteiro do helper.
 *
 * A comparação é em JS, não em seletor: montar `[aria-label="..."]` com texto
 * traduzido exige escapar aspas e acentos, e escape em camada de string é onde
 * esta campanha já tropeçou três vezes.
 *
 * Dois painéis abertos com o mesmo rótulo cairiam no primeiro, e aplicar a
 * mesma correção a qualquer um deles dá no mesmo — o rótulo é o mesmo.
 */
function findPanel(): HTMLElement | null {
  const label = String(attrs['aria-label'] ?? '').trim()
  if (!label) return null
  const todos = document.querySelectorAll<HTMLElement>('[data-slot="popover-content"]')
  for (const el of todos) {
    if (el.getAttribute('aria-label') === label) return el
  }
  return null
}

function attachLabel(el: HTMLElement): void {
  applyLabel(el)
  labelObserver?.disconnect()
  labelObserver = new MutationObserver(() => applyLabel(el))
  labelObserver.observe(el, { attributes: true, attributeFilter: ['aria-labelledby', 'aria-label'] })
}

let deadline = 0
let timer: ReturnType<typeof setTimeout> | null = null

function resolvePanel(): void {
  const el = findPanel()
  if (el) {
    attachLabel(el)
    return
  }
  if (performance.now() > deadline) return
  timer = setTimeout(resolvePanel, 50)
}

onMounted(() => {
  deadline = performance.now() + 2000
  resolvePanel()
})




onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
  timer = null
  labelObserver?.disconnect()
  labelObserver = null
})
</script>

<template>
  <PopoverPortal>
    <PopoverContent
      ref="panelRef"
      data-slot="popover-content"
      v-bind="{ ...$attrs, ...forwarded }"
      :reference="crossAxisReference"
      @escape-key-down="anotarMotivo('escape')"
      @pointer-down-outside="anotarMotivo('overlay')"
      @focus-outside="anotarMotivo('overlay')"
      :aria-modal="ariaModal"
      :class="cn( 'nds-popover-content', props.class, )"
      @open-auto-focus="aoAutoFocar"
      @keydown.capture="handleTabOut"
    >
      <slot />
      <!-- Modo modal: quem esconde o resto da página é a lib; este devolve o
           `aria-hidden="false"` que ela apaga ao desfazer (ver o arquivo). -->
      <PopoverAriaHiddenRestore v-if="modal" />
    </PopoverContent>
  </PopoverPortal>
</template>
