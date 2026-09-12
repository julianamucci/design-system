/**
 * Por qual caminho o painel fechou, no vocabulário do DESIGN SYSTEM — as mesmas
 * quatro palavras do `drawer_close` e do `popover_close`, para a família ser uma
 * dimensão só no GA4. É o `reason` do `dialog_close`, obrigatório desde
 * 2026-09-10 (`docs/shared/guidelines/18-overlay.md` §Analytics).
 *
 *   escape        tecla Escape
 *   overlay       saiu do painel sem decidir nada: clique no véu, ou foco que
 *                 escapou
 *   close-button  um controle de fechar explícito — o X do canto ou qualquer
 *                 `SheetClose` do rodapé
 *   api           fechou por decisão de DENTRO: a ação primária que confirma, ou
 *                 o código. É também o que sobra quando nenhum gesto foi visto.
 *
 * Até 2026-09-11 esta stack declarava o tipo dentro da docs page, com TRÊS
 * palavras, e o que sobrava caía em `close-button`: "confirmou e fechou" chegava
 * ao relatório como "apertou o X", e a família perdia a palavra que diz
 * exatamente isso. O portão `reason_entre_stacks_divergente` compara o conjunto
 * de palavras de cada `*CloseReason` EXPORTADO entre as stacks — é por isso que
 * o nome do tipo e as quatro palavras importam, e que ele mora aqui, ao lado do
 * primitivo, e não numa página.
 */
export type SheetCloseReason = 'escape' | 'overlay' | 'close-button' | 'api'

/**
 * O gesto OBSERVADO, com o nome que o primitivo lhe dá.
 *
 * A reka-ui não publica motivo nenhum em `update:open` — ela avisa QUE o painel
 * fechou, nunca POR QUÊ. O gesto, porém, é observável: o painel emite
 * `escape-key-down`, `pointer-down-outside` e `focus-outside`, e o clique num
 * controle de fechar passa pelo próprio painel antes de chegar ao botão. Quem vê
 * o gesto ANOTA; quem emite a mudança de estado lê a anotação e a traduz com
 * `sheetCloseReason`. É o mesmo desenho do `popover.context.ts` e do
 * `context-menu.context.ts` desta stack.
 *
 * `confirm` não é gesto de saída: é a ação primária avisando que o fechamento
 * seguinte foi decisão de dentro. Sem ela, confirmar e fechar seria indistinguível
 * de desistir.
 */
export type SheetCloseGesture =
  | 'escape-key-down'
  | 'pointer-down-outside'
  | 'focus-outside'
  | 'close-press'
  | 'confirm'

/**
 * Traduz o gesto observado para o vocabulário do design system.
 *
 * Função pura e exportada de propósito: o evento `dialog_close` nasce na camada
 * de produto (docs page, app), nunca aqui dentro — primitivo de UI que importa
 * `@/lib/analytics` é o que a regra `analytics_in_ui_primitive` proíbe. É o
 * mesmo corte do `sheetCloseReason()` do Angular e do `mapCloseReason()` do
 * React.
 */
export function sheetCloseReason(gesture?: SheetCloseGesture | null): SheetCloseReason {
  switch (gesture) {
    case 'escape-key-down':
      return 'escape'
    // Clique no véu e foco que escapa são o mesmo gesto do ponto de vista de
    // quem usa: "saí do painel sem decidir nada".
    case 'pointer-down-outside':
    case 'focus-outside':
      return 'overlay'
    case 'close-press':
      return 'close-button'
    // Sobra a confirmação e o painel fechado por CÓDIGO — "fechou por decisão de
    // dentro", que a família chama de `api`. O que não se sabe cai aqui, e nunca
    // em `close-button`: inventar o botão é afirmar um gesto que ninguém viu.
    default:
      return 'api'
  }
}

/**
 * Todo controle de fechar do painel se nomeia assim — o X que o `SheetContent`
 * monta e todo `SheetClose` que o rodapé compõe.
 */
export const SHEET_CLOSE_SLOT = '[data-slot="sheet-close"]'

/** O que `createSheetCloseWatch` devolve, pronto para `v-bind` no SheetContent. */
export interface SheetCloseWatch {
  onEscapeKeyDown: () => void
  onPointerDownOutside: () => void
  onFocusOutside: () => void
  onClickCapture: (event: MouseEvent) => void
}

/**
 * Os ouvintes que observam a saída, prontos para `v-bind` num `SheetContent`.
 *
 * Os três primeiros são emits do primitivo, e chegam ao `DialogContent` pelo
 * repasse do `SheetContent`. O quarto é DELEGAÇÃO, e é ele que faltava: o rodapé
 * é de quem compõe, então um ouvinte por botão só alcançaria o X que o painel
 * monta — era essa a lacuna que fazia "Cancelar" ser relatado como qualquer
 * outra coisa. O painel é ANCESTRAL dos controles de fechar, e a fase de captura
 * nele corre antes do clique chegar ao botão, que é o que garante a anotação
 * antes de o `update:open` sair.
 *
 * `closest` e não `target`: o clique costuma cair no ícone ou no `.nds-sr-only`
 * dentro do botão, e a comparação direta erraria os dois. É a mesma delegação do
 * `sheet.ts` do Vanilla, que é a referência do contrato.
 *
 * Nada aqui importa analytics: a função devolve ouvintes, e o que fazer com o
 * gesto é decisão de quem chama.
 */
export function createSheetCloseWatch(
  note: (gesture: SheetCloseGesture) => void,
): SheetCloseWatch {
  return {
    onEscapeKeyDown: () => note('escape-key-down'),
    onPointerDownOutside: () => note('pointer-down-outside'),
    onFocusOutside: () => note('focus-outside'),
    onClickCapture: (event: MouseEvent) => {
      const target = event.target as Element | null
      if (target?.closest?.(SHEET_CLOSE_SLOT)) note('close-press')
    },
  }
}
