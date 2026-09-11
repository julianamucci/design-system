// Arquivo próprio, e não dentro de `context-menu.tsx`: exportar função de um
// arquivo de componente quebra o fast refresh (`react-refresh/only-export-components`).
// Mesma forma de `popover-close-reason.ts` ao lado.

/**
 * Por qual caminho o ContextMenu fechou, no vocabulário do DESIGN SYSTEM — as
 * mesmas quatro palavras do `drawer_close`, do `popover_close` e do
 * `dialog_close`, para a família ser uma dimensão só no GA4. O menu não tem
 * botão de fechar, então `close-button` nunca sai daqui; o tipo carrega as
 * quatro porque é o do evento.
 */
export type ContextMenuCloseReason = "escape" | "overlay" | "close-button" | "api"

/**
 * Traduz o motivo da base-ui (`eventDetails.reason` do `onOpenChange`).
 *
 * Função pura e exportada de propósito: o evento `context_menu_close` nasce na
 * camada de produto, nunca no primitivo — primitivo de UI que importa
 * `@/lib/analytics` é o que a regra `analytics_in_ui_primitive` proíbe.
 */
export function contextMenuCloseReason(reason: string | undefined): ContextMenuCloseReason {
  switch (reason) {
    case "escape-key":
      return "escape"
    // "Saí do menu sem decidir nada": clique fora, foco saindo — o Tab entra
    // aqui, porque o wrapper o entrega como `focus-out` (ver `withReason`) — e o
    // botão direito solto fora do painel depois de um toque longo.
    case "outside-press":
    case "focus-out":
    case "cancel-open":
      return "overlay"
    // Sobra o menu fechado por DECISÃO: `item-press` (um item escolhido) e o que
    // for fechado por código — `imperative-action`, `none` e o que a lib
    // acrescentar.
    default:
      return "api"
  }
}

/**
 * Cópia do `eventDetails` com outro `reason`, preservando o resto.
 *
 * Existe por causa do Tab. A base-ui passa `modal: true` ao gerenciador de foco
 * do menu de contexto, e ali o Tab fica preso no painel; o wrapper fecha o menu
 * por `actionsRef.close()`, que a lib anuncia como `imperative-action`. Só que
 * quem apertou Tab SAIU do menu sem decidir — é o `focus-out` que a mesma lib
 * entrega quando o foco sai de um menu que não prende, como o DropdownMenu. Sem
 * esta troca o Tab chegaria ao GA4 como `api`, a palavra de "escolheu um item".
 *
 * Cópia por descritores, e não espalhamento: `isCanceled` e
 * `isPropagationAllowed` são GETTERS sobre o estado interno do objeto da lib —
 * espalhar os congelaria no valor do instante, e um `cancel()` chamado por quem
 * consome deixaria de ser visível na leitura seguinte.
 */
export function withReason<T extends { reason: string }>(details: T, reason: T["reason"]): T {
  const copy = Object.create(
    Object.getPrototypeOf(details),
    Object.getOwnPropertyDescriptors(details),
  ) as T
  Object.defineProperty(copy, "reason", { value: reason, enumerable: true })
  return copy
}
