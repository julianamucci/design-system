import type { InjectionKey } from 'vue'
import { inject } from 'vue'

/**
 * Por qual caminho um menu da barra fechou, no vocabulário da família de menus
 * (`menubar_close` no `analytics.ts`, o mesmo do DropdownMenu e do ContextMenu):
 *
 *   escape   tecla Escape com o foco no painel raiz do menu — no submenu ela
 *            fecha só o submenu e não emite fechamento (`useSubmenuEscape`)
 *   overlay  saiu sem decidir nada: clique fora, clique no gatilho aberto (ou
 *            Enter e Espaço nele), Tab levando o foco embora, ou passagem ao
 *            menu vizinho — pela seta lateral ou pelo ponteiro
 *   api      um item foi escolhido, ou o código fechou — é o padrão, porque é o
 *            que sobra quando nenhum gesto de saída foi visto
 *
 * A barra não tem controle de fechar, então `close-button` não ocorre aqui.
 * Marcar e escolher rádio não fecham (C10), e por isso não armam nada.
 */
export type MenubarCloseReason = 'escape' | 'overlay' | 'api'

/**
 * O caminho de volta do painel e do gatilho até a barra.
 *
 * A reka-ui não publica o motivo: a barra só emite o NOVO valor
 * (`update:modelValue`, o menu aberto ou `''`). O gesto é observável — o painel
 * emite `escape-key-down` e `pointer-down-outside`, o Tab passa pelo nosso
 * ouvinte (`tab-leaves-menu.ts`) e o gatilho vê a própria tecla. Quem vê o gesto
 * ANOTA; a barra lê a anotação quando o valor muda — o mesmo desenho do
 * `dropdown-menu.context.ts` e do `context-menu.context.ts` desta stack.
 */
export interface MenubarCloseChannel {
  note: (reason: MenubarCloseReason) => void
}

export const MENUBAR_CLOSE: InjectionKey<MenubarCloseChannel> = Symbol('nds-menubar-close')

/** Canal inerte para quando a peça é montada sem a nossa barra. */
const INERT_CHANNEL: MenubarCloseChannel = { note: () => {} }

export function injectMenubarCloseChannel(): MenubarCloseChannel {
  return inject(MENUBAR_CLOSE, INERT_CHANNEL)
}

/**
 * O motivo de um fechamento, a partir do valor anterior e do novo.
 *
 * Função pura, e é por isso que mora aqui e não no `Menubar.vue`: a decisão tem
 * três ramos e cada um é um bug diferente se trocar de lugar.
 *
 *   - nada estava aberto, ou o valor não mudou → não houve fechamento
 *   - de um menu para OUTRO → `overlay`, sempre: a pessoa passou ao vizinho sem
 *     escolher nada, e qualquer anotação pendente é de um gesto que também
 *     serviu para abrir o outro
 *   - de um menu para nenhum → o que o gesto anotou, ou `api`
 */
export function closeReasonFor(
  previous: string,
  next: string,
  noted: MenubarCloseReason | null,
): MenubarCloseReason | undefined {
  if (!previous || previous === next) return undefined
  if (next) return 'overlay'
  return noted ?? 'api'
}
