import type { ComputedRef, InjectionKey } from 'vue'
import { computed, inject, provide } from 'vue'

/**
 * O modo modal, da raiz para o painel.
 *
 * O primitivo desta stack não escreve `aria-modal` — quem cumpre o contrato de
 * markup do design system é o wrapper. E `aria-modal="true"` fixo é mentira
 * quando a raiz é `:modal="false"`: o leitor de tela passaria a ignorar o resto
 * da página justamente no modo em que o resto da página continua utilizável
 * (WCAG 4.1.2). O painel precisa saber o modo real, e só a raiz o conhece.
 */
const DRAWER_MODAL_KEY: InjectionKey<ComputedRef<boolean>> = Symbol('nds-drawer-modal')

export function provideDrawerModal(modal: ComputedRef<boolean>): void {
  provide(DRAWER_MODAL_KEY, modal)
}

/** `true` por omissão — é o default da raiz e do primitivo. */
export function useDrawerModal(): ComputedRef<boolean> {
  return inject(DRAWER_MODAL_KEY, computed(() => true))
}

/**
 * A direção, da raiz para o painel.
 *
 * A folha compartilhada posiciona o painel por `[data-direction]` — borda,
 * cantos, alça, cabeçalho e as transições das quatro direções saem dali. Sem o
 * atributo, o painel não tem posição nenhuma.
 *
 * O atributo é escrito pelo wrapper, e não herdado da lib de gesto: o
 * `data-vaul-drawer-direction` que ela injeta continua no elemento, mas é NOME
 * DELA, e só três das cinco stacks a carregam. O contrato de markup do design
 * system não pode ser batizado com o nome de uma dependência que parte das
 * implementações não tem.
 *
 * Mesma razão do modo modal acima: a direção é prop da RAIZ e quem precisa do
 * atributo é o painel, então ela desce por injeção.
 */
export type DrawerDirection = 'top' | 'bottom' | 'left' | 'right'

const DRAWER_DIRECTION_KEY: InjectionKey<ComputedRef<DrawerDirection>>
  = Symbol('nds-drawer-direction')

export function provideDrawerDirection(direction: ComputedRef<DrawerDirection>): void {
  provide(DRAWER_DIRECTION_KEY, direction)
}

/** `'bottom'` por omissão — é o default da raiz e o do primitivo. */
export function useDrawerDirection(): ComputedRef<DrawerDirection> {
  return inject(DRAWER_DIRECTION_KEY, computed<DrawerDirection>(() => 'bottom'))
}
