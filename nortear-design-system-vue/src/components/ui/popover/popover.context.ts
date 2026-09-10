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

/**
 * Por qual caminho o painel fechou, no vocabulário do DESIGN SYSTEM — as mesmas
 * quatro palavras do `drawer_close`, para a família ser uma dimensão só no GA4.
 *
 *   escape        tecla Escape
 *   overlay       saiu do painel sem decidir nada: clique fora, foco que saiu,
 *                 ou clique no gatilho de novo
 *   close-button  controle de fechar explícito (esta stack não tem a peça, então
 *                 o valor não ocorre aqui — e não é divergência)
 *   api           fechado por código — é aqui que cai "salvou e fechou"
 */
export type PopoverCloseReason = 'escape' | 'overlay' | 'close-button' | 'api'

/**
 * O caminho de volta do motivo, do painel e do gatilho até a raiz.
 *
 * A reka-ui não publica o motivo em `update:open` — o docs page desta stack
 * mandava o fechamento SEM `reason` por isso, e dizia com razão que cravar um
 * valor seria inventar dado. Mas o gesto é OBSERVÁVEL: o painel emite
 * `escape-key-down` e `pointer-down-outside`, o gatilho vê o próprio clique. É o
 * mesmo caminho que o drawer desta stack já usa. Quem vê o gesto ANOTA; quem
 * emite a mudança de estado lê a anotação.
 *
 * O `inject` cai para uma anotação inerte quando a peça é usada sem a raiz.
 */
export const POPOVER_CLOSE_REASON: InjectionKey<(reason: PopoverCloseReason) => void> =
  Symbol('nds-popover-close-reason')
