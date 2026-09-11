import { injectDropdownMenuRootContext } from 'reka-ui'

/**
 * Tab SAI do menu e o fecha — C2 do PRD do DropdownMenu, e o que o vanilla, o
 * react e o bits-ui fazem.
 *
 * Medido em 2026-09-10 com teclado real (Playwright), foco num item e o menu
 * aberto, com um botão antes e outro depois do gatilho:
 *
 *   DropdownMenu (modal, o padrão)  Tab e Shift+Tab com `preventDefault`, o foco
 *                                   não sai do item e o menu segue aberto
 *   Menubar (a lib o monta como     o menu fecha, mas Tab joga o foco no
 *   não modal)                      `<body>` e Shift+Tab no botão DEPOIS da
 *                                   barra — o painel vive em portal no fim do
 *                                   documento, e a ordem de tabulação parte dele
 *
 * A causa do primeiro: `MenuContentImpl` faz `preventDefault` no Tab sempre que
 * a raiz é modal (`reka-ui/dist/Menu/MenuContentImpl.js:210`), e o FocusScope
 * do modal prende o foco. Desligar `modal` resolveria o Tab e levaria junto o
 * véu de interação e a trava de rolagem, que são o que `modal` quer dizer aqui
 * (D1) — então quem resolve é um ouvinte nosso, e a lib continua como está.
 *
 * O destino é o do bits-ui (`handleTabKeyDown`): o ponto de tabulação vizinho
 * do GATILHO, e não do item em foco — quem aperta Tab num menu quer seguir de
 * onde estava antes de abri-lo.
 */

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

/** Tab puro ou com Shift — com Alt, Ctrl ou Meta a tecla é de outro gesto. */
export function isPlainTab(event: KeyboardEvent): boolean {
  return event.key === 'Tab' && !event.altKey && !event.ctrlKey && !event.metaKey
}

/**
 * O próximo (ou o anterior) ponto de tabulação da PÁGINA, a partir do gatilho.
 *
 * Ficam de fora os painéis de menu, os guardas de foco da lib e o que estiver
 * oculto, inerte ou fora do percurso (`tabindex` negativo — é assim que os
 * gatilhos vizinhos de uma barra de menus saem da conta).
 */
export function tabbableBeside(anchor: HTMLElement, direction: 'next' | 'prev'): HTMLElement | null {
  const candidates = Array.from(
    anchor.ownerDocument.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(
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
 * O destino guardado entre a tecla e o fechamento, por menu. A chave é o
 * contexto da raiz, que o painel raiz e o do submenu recebem IGUAL — o portal
 * separa o DOM, não a árvore de componentes.
 */
const pendingTarget = new WeakMap<object, HTMLElement>()

/**
 * O ouvinte é de CAPTURA no painel (raiz e submenu): roda antes do `keydown` da
 * lib, que começa olhando `defaultPrevented` e sai. A tecla é consumida, o
 * destino guardado, e a raiz fecha. O foco pousa no destino quando a lib o
 * devolveria ao gatilho — `onCloseAutoFocus`, só no painel raiz. Sem destino (o
 * gatilho é o último ponto da página), a lib segue o caminho de sempre e o foco
 * volta ao gatilho.
 */
export function useDropdownMenuTabLeaves() {
  const root = injectDropdownMenuRootContext(null)

  function onKeydownCapture(event: KeyboardEvent) {
    if (!root || !isPlainTab(event)) return
    event.preventDefault()
    const trigger = root.triggerElement.value
    const target = trigger ? tabbableBeside(trigger, event.shiftKey ? 'prev' : 'next') : null
    if (target) pendingTarget.set(root, target)
    root.onOpenChange(false)
  }

  function onCloseAutoFocus(event: Event) {
    if (!root) return
    const target = pendingTarget.get(root)
    if (!target) return
    pendingTarget.delete(root)
    event.preventDefault()
    target.focus()
  }

  return { onKeydownCapture, onCloseAutoFocus }
}
