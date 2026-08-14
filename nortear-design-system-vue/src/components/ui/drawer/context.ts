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
