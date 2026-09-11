import type { InjectionKey } from 'vue'
import { inject } from 'vue'

/**
 * Por qual caminho o menu fechou, no vocabulário da família de menus
 * (`dropdown_menu_close`, `context_menu_close` e `menubar_close` no
 * `analytics.ts` — as mesmas palavras do popover e do drawer):
 *
 *   escape   tecla Escape com o foco no painel raiz — no submenu ela fecha só
 *            o submenu e não emite fechamento (ver `useSubmenuEscape`)
 *   overlay  saiu sem decidir nada: clique fora, clique no gatilho aberto, ou
 *            Tab levando o foco embora
 *   api      um item foi escolhido, ou o código fechou — é o padrão, porque é o
 *            que sobra quando nenhum gesto de saída foi visto
 *
 * O menu não tem controle de fechar, então `close-button` não ocorre aqui.
 * Marcar um item de marcação ou escolher uma opção de rádio NÃO fecha (C10), e
 * por isso não arma nada: o fechamento seguinte leva o motivo de quem fechou.
 */
export type DropdownMenuCloseReason = 'escape' | 'overlay' | 'api'

/**
 * O caminho de volta do painel até a raiz.
 *
 * A reka-ui não publica o motivo em `update:open`, mas o gesto é OBSERVÁVEL: o
 * painel emite `escape-key-down` e `pointer-down-outside`, e o Tab passa pelo
 * nosso próprio ouvinte (`tab-leaves-menu.ts`). Quem vê o gesto ANOTA; a raiz lê
 * a anotação quando o estado muda — o mesmo desenho do `context-menu.context.ts`
 * e do `popover.context.ts` desta stack.
 *
 * O `pointer-down-outside` cobre também o clique no gatilho aberto: o painel o
 * emite antes de a lib decidir que aquele clique não dispensa a camada, e é o
 * clique no gatilho que fecha em seguida — com o motivo certo, `overlay`.
 */
export interface DropdownMenuCloseChannel {
  note: (reason: DropdownMenuCloseReason) => void
}

export const DROPDOWN_MENU_CLOSE: InjectionKey<DropdownMenuCloseChannel> =
  Symbol('nds-dropdown-menu-close')

/** Canal inerte para quando o painel é montado sem a nossa raiz. */
const INERT_CHANNEL: DropdownMenuCloseChannel = { note: () => {} }

export function injectDropdownMenuCloseChannel(): DropdownMenuCloseChannel {
  return inject(DROPDOWN_MENU_CLOSE, INERT_CHANNEL)
}

/**
 * Fecha o submenu mais próximo — provido pelo `DropdownMenuSub`, pelo
 * `MenubarSub` e pelo `ContextMenuSub` desta stack, que guardam o estado aberto
 * do submenu.
 */
export const MENU_SUB_CLOSE: InjectionKey<() => void> = Symbol('nds-menu-sub-close')

/**
 * Escape DENTRO do submenu fecha só o submenu e devolve o foco ao sub-gatilho —
 * o padrão de menu da WAI-ARIA APG, o que o vanilla faz, o F12 do DropdownMenu,
 * o F5 do Menubar e o F6 do ContextMenu. O menu raiz segue aberto, e por isso
 * nenhum fechamento é emitido.
 *
 * UM ouvinte para os três membros da família. Até 2026-09-11 o ContextMenu tinha
 * a própria cópia (`CONTEXT_MENU_SUB_CLOSE` e um `useSubmenuEscape` em
 * `context-menu.context.ts`), idêntica linha a linha e livre para divergir na
 * próxima correção.
 *
 * A reka fecha a árvore inteira: o `MenuSubContent` responde ao
 * `escape-key-down` com `rootContext.onClose()`, e esse ouvinte não olha
 * `defaultPrevented`. Não há como barrá-lo depois de emitido — então a tecla
 * não chega a ser emitida. O Escape da camada dispensável é ouvido na `window`,
 * na fase de borbulha; este ouvinte é de CAPTURA no painel do submenu e
 * interrompe a propagação antes dela. Medido no submenu do menu de contexto em
 * 2026-09-10, e é de lá que o conserto veio.
 *
 * O resto é o que a própria lib faz na seta esquerda (`SUB_CLOSE_KEYS` no
 * mesmo `MenuSubContent`): fecha o submenu e foca o gatilho. Quem fecha é o
 * nosso `*Sub`, que guarda o estado aberto e o entrega por `MENU_SUB_CLOSE` — o
 * contexto de menu da reka não é exportado, e depender de interno de lib é o que
 * some numa atualização menor. O gatilho é achado pelo `aria-labelledby` do
 * painel, que a lib aponta para ele.
 *
 * Com o foco no menu RAIZ (o submenu aberto só pelo ponteiro), a tecla não passa
 * por aqui: a camada mais alta ainda é o submenu, a lib fecha tudo, e o painel
 * do submenu anota `escape` — o foco estava no raiz, e fechar o raiz é o certo.
 */
export function useSubmenuEscape() {
  const closeSubmenu = inject(MENU_SUB_CLOSE, null)

  function onKeydownCapture(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !closeSubmenu) return
    // PATCH: a11y — a reka fecha o menu inteiro no Escape do submenu; aqui fecha só o submenu (ver PATCHES.md#vue-menu-submenu-escape)
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
