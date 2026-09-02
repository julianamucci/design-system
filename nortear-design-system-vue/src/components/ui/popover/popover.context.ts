import type { ComputedRef, InjectionKey } from 'vue'

/**
 * Leva `modal` da raiz do Popover até o painel.
 *
 * Existe porque quem decide o modo é a raiz e quem precisa anunciar
 * `aria-modal` é o painel — e o painel não recebe a prop. Ele vive em portal, e
 * o `modal` do primitivo fica no contexto interno da lib, cujo acesso não é
 * público: depender de interno de lib para uma decisão de acessibilidade é o
 * tipo de coisa que some numa atualização menor.
 *
 * O `inject` cai para `false` quando o painel é usado sem a nossa raiz.
 */
export const POPOVER_MODAL: InjectionKey<ComputedRef<boolean>> =
  Symbol('nds-popover-modal')
