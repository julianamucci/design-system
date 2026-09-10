/**
 * Por qual caminho o painel modal fechou, no vocabulário do DESIGN SYSTEM —
 * as mesmas quatro palavras do `drawer_close` e do `popover_close`, para a
 * família ser uma dimensão só no GA4. Vale para o `dialog_close`, que é o
 * evento do Dialog, do Sheet e do AlertDialog.
 *
 * Até 2026-09-10 este mapeador devolvia `action` e `user`, e o tipo do evento
 * aceitava ainda `unknown`: seis palavras aqui, quatro nas outras stacks, e o
 * caso "fechou por decisão de dentro" escrito `action` enquanto o drawer e o
 * popover escreviam `api`. A dona decidiu por `api`. Regra em
 * `docs/shared/guidelines/18-overlay.md` §Analytics.
 */
export type DialogCloseReason = "escape" | "overlay" | "close-button" | "api"

/**
 * A ação que CONFIRMA fecha pelo mesmo caminho do cancelar — no AlertDialog,
 * as duas são partes de fechar da lib, e a base-ui entrega `close-press` para
 * ambas. Sem esta marca, "confirmou a exclusão" chegaria ao relatório como
 * "apertou o botão de fechar". Quem confirma chama `markConfirmation()` antes
 * de o painel fechar, e o próximo `mapCloseReason` devolve `api`.
 *
 * Uma variável para a página inteira basta: o painel é modal, e nunca há dois
 * abertos ao mesmo tempo — é a mesma forma do motivo pendente do Vue e do
 * Svelte.
 */
let confirmed = false

export function markConfirmation(): void {
  confirmed = true
}

/**
 * Traduz o motivo da base-ui (`eventDetails.reason` do `onOpenChange`).
 *
 * `trigger-press` vai para `api`, e não para `overlay` como no popover: num
 * painel modal o gatilho fica coberto pelo véu, e só código fecha por ele — a
 * mesma leitura do drawer.
 */
export function mapCloseReason(reason?: string): DialogCloseReason {
  if (confirmed) {
    confirmed = false
    return "api"
  }
  switch (reason) {
    case "escape-key":
      return "escape"
    case "outside-press":
    case "focus-out":
      return "overlay"
    case "close-press":
      return "close-button"
    // Sobra o painel fechado por CÓDIGO — `imperative-action`, `trigger-press`,
    // `none` e o que a lib acrescentar.
    default:
      return "api"
  }
}
