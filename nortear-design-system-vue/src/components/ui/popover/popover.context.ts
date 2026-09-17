import type { ComputedRef, InjectionKey, ShallowRef } from 'vue'

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
 *   close-button  o `PopoverClose` desta stack — controle de fechar explícito
 *                 DENTRO do painel, entregue em 2026-09-12. Até então a stack
 *                 não tinha a peça e o valor nunca ocorria aqui; o rodapé de
 *                 Cancelar + Salvar era um cancelar que não cancelava
 *   api           fechado por código — é aqui que cai "salvou e fechou"
 */
export type PopoverCloseReason = 'escape' | 'overlay' | 'close-button' | 'api'

/**
 * O caminho de volta do motivo, do painel e do gatilho até a raiz.
 *
 * A reka-ui não publica o motivo em `update:open` — o docs page desta stack
 * mandava o fechamento SEM `reason` por isso, e dizia com razão que cravar um
 * valor seria inventar dado. Mas o gesto é OBSERVÁVEL: o painel emite
 * `escape-key-down` e `pointer-down-outside`, o gatilho vê o próprio clique, e o
 * `PopoverClose` vê o dele. É o mesmo caminho que o drawer desta stack já usa.
 * Quem vê o gesto ANOTA; quem emite a mudança de estado lê a anotação.
 *
 * A ordem importa, e cada peça resolve a sua: o painel e o gatilho anotam antes
 * de a lib reagir, e o `PopoverClose` precisa da fase de CAPTURA para chegar na
 * frente do handler que a própria lib pendura no botão — o porquê está no
 * template de `PopoverClose.vue`.
 *
 * O `inject` cai para uma anotação inerte quando a peça é usada sem a raiz.
 */
export const POPOVER_CLOSE_REASON: InjectionKey<(reason: PopoverCloseReason) => void> =
  Symbol('nds-popover-close-reason')

/**
 * Fecha o painel por um caminho que a LIB não dispensa sozinha — e já com o
 * motivo.
 *
 * Quem sabe fechar um popover não-controlado da reka é a RAIZ dela, que publica
 * `close()` no slot; o painel vive em portal e recebe o slot de quem compõe, não
 * o da raiz, então ele não tem como alcançá-lo. Este é o caminho de volta: a
 * raiz guarda o `close` que recebeu e o entrega por contexto.
 *
 * Existe por causa do `Tab` para fora (decisão de 2026-09-16, igual nas cinco).
 * Os outros caminhos de fechar — Escape, clique fora, peça de fechar — são da
 * própria lib, e para eles basta ANOTAR o motivo por `POPOVER_CLOSE_REASON`.
 * Este não: a reka não fecha no `Tab`, ela dá a volta com o foco (ver
 * `PopoverContent.vue`). É a mesma peça que o `dismiss` do contexto do svelte,
 * pela mesma razão, do outro lado.
 *
 * O motivo viaja JUNTO da chamada porque fechar por aqui é mudar o estado da
 * raiz em silêncio: a anotação e o fechamento precisam ser o mesmo gesto, ou o
 * motivo chega para o fechamento seguinte.
 *
 * O `inject` cai numa dispensa inerte quando o painel é usado sem a nossa raiz.
 */
export const POPOVER_DISMISS: InjectionKey<(reason: PopoverCloseReason) => void> =
  Symbol('nds-popover-dismiss')

/**
 * O elemento em que o painel se ancora, levado da raiz até o painel — para o
 * `alignOffset` valer também com `align="center"` (D14).
 *
 * A reka posiciona pelo `@floating-ui`, e o middleware `offset` dele só aplica
 * `alignmentAxis` quando há alinhamento (`start`/`end`): com `center`, o padrão,
 * o deslocamento do eixo cruzado some sem aviso (`@floating-ui/core`,
 * `if (alignment && typeof alignmentAxis === 'number')`). A base-ui e o radix-ng
 * passam o valor também como `crossAxis`, e o vanilla o soma em qualquer
 * alinhamento — a reka não, e não há prop que o ligue. Medido em 2026-09-17 pela
 * `SideTop`: `alignOffset: 8` com `center` deslocava 0px.
 *
 * O painel corrige entregando à lib uma referência VIRTUAL, com o retângulo do
 * gatilho deslizado no eixo cruzado — e para isso precisa do elemento, que a
 * reka guarda em contexto interno (recusado aqui pelo mesmo motivo do
 * `POPOVER_MODAL`). O gatilho se registra; o `PopoverAnchor`, quando existe,
 * vence, como na lib.
 */
export interface PopoverAnchorRegistry {
  trigger: ShallowRef<HTMLElement | null>
  custom: ShallowRef<HTMLElement | null>
}

export const POPOVER_ANCHOR: InjectionKey<PopoverAnchorRegistry> =
  Symbol('nds-popover-anchor')
