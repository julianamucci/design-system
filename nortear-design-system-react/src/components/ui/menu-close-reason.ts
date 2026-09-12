// Arquivo próprio, e não dentro de um arquivo de componente: exportar função de
// um `.tsx` de componente quebra o fast refresh
// (`react-refresh/only-export-components`). Mesma forma de
// `popover-close-reason.ts` ao lado.
//
// Neutro de propósito, como `menu-tab-exit.ts`: serve os TRÊS membros da família
// — o ContextMenu, o DropdownMenu e, pelo DropdownMenu que ele compõe, o
// Menubar. Um tradutor só é o que garante que o mesmo gesto chegue ao GA4 com a
// mesma palavra nos três eventos de fechamento.

/**
 * Por qual caminho um menu da família fechou, no vocabulário do DESIGN SYSTEM:
 * as palavras do `drawer_close`, do `popover_close` e do `dialog_close`, para
 * a família ser uma dimensão só no GA4. São TRÊS: menu não tem botão de fechar,
 * e `close-button` nunca sairia daqui — o tipo do EVENTO, em `lib/analytics.ts`,
 * é que carrega as quatro da família. O vanilla e o angular já declaravam três,
 * e esta era a única stack fora (medido em 2026-09-11 pelo
 * `reason_entre_stacks_divergente`).
 */
export type MenuCloseReason = "escape" | "overlay" | "api"

/**
 * Traduz o motivo da base-ui (`eventDetails.reason` do `onOpenChange`).
 *
 * Função pura e exportada de propósito: os eventos `context_menu_close`,
 * `dropdown_menu_close` e `menubar_close` nascem na camada de produto, nunca no
 * primitivo — primitivo de UI que importa `@/lib/analytics` é o que a regra
 * `analytics_in_ui_primitive` proíbe.
 *
 * Os motivos do gatilho — o clique num gatilho de menu aberto (`trigger-press`)
 * e, no Menubar, a passagem para o menu vizinho (`sibling-open`,
 * `list-navigation`, `trigger-hover`) — não saem do menu de contexto, que não
 * tem gatilho; valem para ele do mesmo jeito se algum dia saírem. Nos quatro a
 * pessoa saiu sem escolher nada: é `overlay`, como o clique fora. É o que o
 * conteúdo compartilhado promete em `analytics.table.closeTrigger`.
 */
export function menuCloseReason(reason: string | undefined): MenuCloseReason {
  switch (reason) {
    case "escape-key":
      return "escape"
    // "Saí do menu sem decidir nada": clique fora, foco saindo — o Tab entra
    // aqui, porque o wrapper o entrega como `focus-out` (ver `withReason`) —, o
    // botão direito solto fora do painel depois de um toque longo, o clique no
    // gatilho aberto e a troca de menu dentro da barra.
    case "outside-press":
    case "focus-out":
    case "cancel-open":
    case "trigger-press":
    case "trigger-hover":
    case "sibling-open":
    case "list-navigation":
      return "overlay"
    // Sobra o menu fechado por DECISÃO: `item-press` (um item escolhido) e o que
    // for fechado por código ou por caminho desconhecido — `imperative-action`,
    // `none` e o que a lib acrescentar. "Decisão de dentro" (18-overlay
    // §Analytics).
    default:
      return "api"
  }
}

/**
 * Cópia do `eventDetails` com outro `reason`, preservando o resto.
 *
 * Existe por causa do Tab, nos dois wrappers que o consertam (`context-menu.tsx`
 * e `dropdown-menu.tsx`): o wrapper fecha o menu por `actionsRef.close()`, que a
 * lib anuncia como `imperative-action`. Só que quem apertou Tab SAIU do menu sem
 * decidir — é o `focus-out` que a mesma lib entrega quando o foco sai de um menu
 * sozinho. Sem esta troca o Tab chegaria ao GA4 como `api`, a palavra de
 * "escolheu um item".
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
