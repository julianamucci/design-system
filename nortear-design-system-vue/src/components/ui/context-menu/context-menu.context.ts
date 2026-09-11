import type { InjectionKey } from 'vue'
import { inject } from 'vue'
import { injectContextMenuRootContext } from 'reka-ui'
import { useTabLeavesMenu } from '@/components/ui/dropdown-menu/tab-leaves-menu'

/**
 * Por qual caminho o menu fechou, no vocabulário da família (`context_menu_close`
 * no `analytics.ts`, o mesmo do popover e do drawer):
 *
 *   escape   tecla Escape com o foco no painel raiz — no submenu ela fecha só
 *            o submenu e não emite fechamento (`useSubmenuEscape`, no
 *            `dropdown-menu.context.ts`)
 *   overlay  saiu sem decidir nada: clique fora, ou Tab levando o foco embora
 *   api      um item foi escolhido, ou o código fechou — é o padrão, porque é o
 *            que sobra quando nenhum gesto de saída foi visto
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
 * O destino do Tab NÃO viaja mais por aqui: ele mora no mecanismo compartilhado
 * com o DropdownMenu (`useTabLeavesMenu`), guardado pela raiz da reka, que o
 * painel raiz e o do submenu recebem iguais.
 */
export interface ContextMenuCloseChannel {
  note: (reason: ContextMenuCloseReason) => void
}

export const CONTEXT_MENU_CLOSE: InjectionKey<ContextMenuCloseChannel> =
  Symbol('nds-context-menu-close')

/** Canal inerte para quando o painel é montado sem a nossa raiz. */
const INERT_CHANNEL: ContextMenuCloseChannel = {
  note: () => {},
}

export function injectCloseChannel(): ContextMenuCloseChannel {
  return inject(CONTEXT_MENU_CLOSE, INERT_CHANNEL)
}

/**
 * Tab FECHA o menu (C2) — e a reka, no modo modal, o prende.
 *
 * `MenuContentImpl` faz `preventDefault` no Tab sempre que a raiz é modal, e a
 * raiz do ContextMenu nasce modal. O resultado era um menu que não soltava o
 * foco: Tab não fazia nada. Desligar `modal` resolveria o Tab e levaria junto o
 * véu de interação e a trava de rolagem, que são o que `modal` quer dizer aqui
 * (D1 do PRD do DropdownMenu) — então quem resolve é um ouvinte nosso, e a lib
 * continua como está.
 *
 * O ouvinte é o do DropdownMenu (`useTabLeavesMenu`), ligado à raiz do
 * ContextMenu: a âncora do destino é a ÁREA, que a lib guarda no mesmo campo
 * (`triggerElement`) em que o DropdownMenu guarda o gatilho. O painel raiz
 * aplica o destino no `close-auto-focus`, quando a lib devolveria o foco à
 * área; sem destino (a área é o último ponto da página), o foco volta a ela.
 */
export function useTabCloses() {
  const root = injectContextMenuRootContext(null)
  const channel = injectCloseChannel()
  // PATCH: a11y — a reka prende o Tab no modo modal; aqui ele fecha e segue a página (ver PATCHES.md#vue-context-menu-tab-closes)
  const { onKeydownCapture, onCloseAutoFocus } = useTabLeavesMenu(root, channel)
  return { root, channel, onKeydownCapture, onCloseAutoFocus }
}
