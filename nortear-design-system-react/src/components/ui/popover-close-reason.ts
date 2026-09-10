// Arquivo próprio, e não dentro de `popover.tsx`: exportar função de um
// arquivo de componente quebra o fast refresh (`react-refresh/only-export-components`),
// e a regra aponta este caminho. Mesma forma de `media-embed.ts` ao lado.

/**
 * Por qual caminho o painel fechou, no vocabulário do DESIGN SYSTEM — as
 * mesmas quatro palavras do `drawer_close`, para a família ser uma dimensão só
 * no GA4. A lib tem onze motivos; quem consome o analytics reconhece quatro.
 */
export type PopoverCloseReason = "escape" | "overlay" | "close-button" | "api"

/**
 * Traduz o motivo da base-ui para o vocabulário do design system.
 *
 * Função pura e exportada de propósito: o evento `popover_close` nasce na
 * camada de produto, nunca aqui — primitivo de UI que importa `@/lib/analytics`
 * é o que a regra `analytics_in_ui_primitive` proíbe. Mesma forma do
 * `drawerCloseReason`.
 */
export function popoverCloseReason(motivo: string | undefined): PopoverCloseReason {
  switch (motivo) {
    case "escape-key":
      return "escape"
    // "Saí do painel sem decidir nada". `trigger-press` entra aqui e NÃO em
    // `api`, que é onde o drawer o põe: lá o gatilho fica coberto pelo véu e só
    // código fecha por ele; aqui o popover é não-modal, o gatilho continua
    // clicável, e o clique é vontade de quem usa.
    case "outside-press":
    case "focus-out":
    case "trigger-press":
      return "overlay"
    case "close-press":
      return "close-button"
    // Sobra o painel fechado por CÓDIGO — `imperative-action`, `none` e o que a
    // lib acrescentar. É aqui que cai o formulário que salvou e fechou, e é por
    // isso que o padrão é `api` e não `close-button`: com o padrão do drawer,
    // "concluiu" chegaria ao relatório como "apertou o botão de fechar".
    default:
      return "api"
  }
}
