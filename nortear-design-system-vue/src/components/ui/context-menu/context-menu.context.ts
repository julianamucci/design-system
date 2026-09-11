import type { InjectionKey } from 'vue'
import { inject } from 'vue'
import { injectContextMenuRootContext } from 'reka-ui'

/**
 * Por qual caminho o menu fechou, no vocabulário da família (`context_menu_close`
 * no `analytics.ts`, o mesmo do popover e do drawer):
 *
 *   escape   tecla Escape com o foco no painel raiz — no submenu ela fecha só
 *            o submenu e não emite fechamento (ver `useSubmenuEscape`)
 *   overlay  saiu sem decidir nada: clique fora, ou Tab levando o foco embora
 *   api      um item foi escolhido — é o padrão, porque é o que sobra quando
 *            nenhum gesto de saída foi visto
 *
 * O ContextMenu não tem controle de fechar, então `close-button` não ocorre aqui.
 */
export type ContextMenuCloseReason = 'escape' | 'overlay' | 'api'

/**
 * O caminho de volta do painel até a raiz.
 *
 * A reka-ui não publica o motivo em `update:open`, mas o gesto é OBSERVÁVEL: o
 * painel emite `escape-key-down` e `pointer-down-outside`, e o Tab passa pelo
 * nosso próprio ouvinte. Quem vê o gesto ANOTA; a raiz lê a anotação quando o
 * estado muda — o mesmo desenho do `popover.context.ts` desta stack.
 *
 * O destino do Tab viaja pelo mesmo canal porque quem o calcula é o painel que
 * recebeu a tecla (o raiz ou o do submenu) e quem o aplica é o painel RAIZ, no
 * instante em que a lib devolveria o foco à área.
 */
export interface ContextMenuCloseChannel {
  note: (reason: ContextMenuCloseReason) => void
  setTabTarget: (target: HTMLElement | null) => void
  takeTabTarget: () => HTMLElement | null
}

export const CONTEXT_MENU_CLOSE: InjectionKey<ContextMenuCloseChannel> =
  Symbol('nds-context-menu-close')

/** Canal inerte para quando o painel é montado sem a nossa raiz. */
const INERT_CHANNEL: ContextMenuCloseChannel = {
  note: () => {},
  setTabTarget: () => {},
  takeTabTarget: () => null,
}

export function injectCloseChannel(): ContextMenuCloseChannel {
  return inject(CONTEXT_MENU_CLOSE, INERT_CHANNEL)
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(',')

/**
 * O próximo (ou o anterior) ponto de tabulação da PÁGINA, a partir da área.
 *
 * A área é a âncora, e não o item em foco: o painel vive em portal no fim do
 * `<body>`, então "o próximo depois do item" seria o guarda de foco da lib ou o
 * fim do documento. Quem aperta Tab num menu de contexto quer seguir de onde
 * estava ANTES de abri-lo — é a leitura do bits-ui, que resolve o mesmo caso.
 *
 * Ficam de fora o próprio painel, os guardas de foco e o que estiver oculto,
 * inerte ou fora do percurso (`tabindex` negativo).
 */
export function tabbableBeside(anchor: HTMLElement, direction: 'next' | 'prev'): HTMLElement | null {
  const candidates = Array.from(anchor.ownerDocument.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) =>
      el !== anchor
      && el.tabIndex >= 0
      && !el.closest('[data-reka-menu-content], [data-reka-focus-guard], [inert], [hidden]')
      && el.getClientRects().length > 0,
  )
  if (direction === 'next') {
    return candidates.find(
      (el) => anchor.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING,
    ) ?? null
  }
  const before = candidates.filter(
    (el) =>
      anchor.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING
      && !el.contains(anchor),
  )
  return before[before.length - 1] ?? null
}

/**
 * Tab FECHA o menu (C2) — e a reka, no modo modal, o prende.
 *
 * `MenuContentImpl` faz `preventDefault` no Tab sempre que a raiz é modal, e a
 * raiz do ContextMenu nasce modal. O resultado era um menu que não soltava o
 * foco: Tab não fazia nada. Desligar `modal` resolveria o Tab e levaria junto o
 * véu de interação e a trava de rolagem, que são o que `modal` quer dizer aqui
 * (D1 do PRD do DropdownMenu) — então quem resolve é este ouvinte, e a lib
 * continua como está.
 *
 * O ouvinte é de CAPTURA no painel: roda antes do `keydown` da lib, que começa
 * olhando `defaultPrevented` e sai. A tecla é consumida, o motivo anotado, o
 * destino guardado, e a raiz fecha. O foco pousa no destino quando a lib o
 * devolveria à área (ver `onCloseAutoFocus` no painel raiz).
 */
export function useTabCloses() {
  const root = injectContextMenuRootContext(null)
  const channel = injectCloseChannel()

  function onKeydownCapture(event: KeyboardEvent) {
    if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return
    if (!root) return
    // PATCH: a11y — a reka prende o Tab no modo modal; aqui ele fecha e segue a página (ver PATCHES.md#vue-context-menu-tab-closes)
    event.preventDefault()
    const area = root.triggerElement.value
    channel.setTabTarget(area ? tabbableBeside(area, event.shiftKey ? 'prev' : 'next') : null)
    channel.note('overlay')
    root.onOpenChange(false)
  }

  return { root, channel, onKeydownCapture }
}

/** Fecha o submenu mais próximo — provido pelo `ContextMenuSub` desta stack. */
export const CONTEXT_MENU_SUB_CLOSE: InjectionKey<() => void> =
  Symbol('nds-context-menu-sub-close')

/**
 * Escape DENTRO do submenu fecha só o submenu e devolve o foco ao sub-gatilho —
 * o padrão de menu da WAI-ARIA APG, e o que o vanilla faz. O menu raiz segue
 * aberto, e por isso nenhum fechamento é emitido.
 *
 * A reka fecha a árvore inteira: o `MenuSubContent` responde ao
 * `escape-key-down` com `rootContext.onClose()`, e esse ouvinte não olha
 * `defaultPrevented`. Não há como barrá-lo depois de emitido — então a tecla
 * não chega a ser emitida. O Escape da camada dispensável é ouvido na `window`,
 * na fase de borbulha; este ouvinte é de CAPTURA no painel do submenu e
 * interrompe a propagação antes dela.
 *
 * O resto é o que a própria lib faz na seta esquerda (`SUB_CLOSE_KEYS` no
 * mesmo `MenuSubContent`): fecha o submenu e foca o gatilho. Quem fecha é o
 * nosso `ContextMenuSub`, que guarda o estado aberto e entrega o fechamento por
 * `CONTEXT_MENU_SUB_CLOSE` — o contexto de menu da reka não é exportado, e
 * depender de interno de lib é o que some numa atualização menor. O gatilho é
 * achado pelo `aria-labelledby` do painel, que a lib aponta para ele.
 *
 * Com o foco no menu RAIZ (o submenu aberto só pelo ponteiro), a tecla não
 * passa por aqui: a camada mais alta ainda é o submenu, a lib fecha tudo, e o
 * painel do submenu anota `escape` — o foco estava no raiz, e fechar o raiz é
 * o certo.
 */
export function useSubmenuEscape() {
  const closeSubmenu = inject(CONTEXT_MENU_SUB_CLOSE, null)

  function onKeydownCapture(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !closeSubmenu) return
    // PATCH: a11y — a reka fecha o menu inteiro no Escape do submenu; aqui fecha só o submenu (ver PATCHES.md#vue-context-menu-submenu-escape)
    event.preventDefault()
    event.stopPropagation()
    const panel = event.currentTarget instanceof HTMLElement ? event.currentTarget : null
    const triggerId = panel?.getAttribute('aria-labelledby')
    const trigger = triggerId ? panel?.ownerDocument.getElementById(triggerId) : null
    closeSubmenu()
    trigger?.focus()
  }

  return { onKeydownCapture }
}
