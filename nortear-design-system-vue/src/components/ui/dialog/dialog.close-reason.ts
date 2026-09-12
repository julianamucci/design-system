/**
 * Por qual caminho o painel fechou, no vocabulário do DESIGN SYSTEM — as mesmas
 * quatro palavras do `drawer_close` e do `popover_close`, para a família ser uma
 * dimensão só no GA4. É o `reason` do `dialog_close`, obrigatório desde
 * 2026-09-10 (`docs/shared/guidelines/18-overlay.md` §Analytics).
 *
 *   escape        tecla Escape
 *   overlay       saiu do painel sem decidir nada: clique no véu, ou foco que
 *                 escapou
 *   close-button  um controle de fechar explícito — o X do canto, o fechar do
 *                 rodapé ou qualquer `DialogClose` que a composição monte
 *   api           fechou por decisão de DENTRO: a ação primária que confirma, ou
 *                 o código. É também o que sobra quando nenhum gesto foi visto.
 *
 * Até 2026-09-12 esta stack declarava o tipo dentro da `DialogDocs.vue`, com
 * TRÊS palavras, e o que sobrava caía em `close-button`: "confirmou e fechou"
 * chegava ao relatório como "apertou o X", e a família perdia a palavra que diz
 * exatamente isso. Três portões viam a mesma causa por eixos diferentes —
 * `reason_entre_stacks_divergente` (o mesmo tipo com vocabulários diferentes
 * entre stacks), `reason_da_familia_divergente` (tipos diferentes alimentando o
 * mesmo evento) e `motivo_sintetizado_na_docs_page` (a página deduzindo o que é
 * do componente). É por isso que o nome do tipo e as quatro palavras importam, e
 * que ele mora aqui, ao lado do primitivo, e não numa página.
 *
 * Irmão direto do `sheet.close-reason.ts` desta stack, que é o modelo; o mesmo
 * corte existe no `dialog-close-reason.ts` do React.
 */
export type DialogCloseReason = 'escape' | 'overlay' | 'close-button' | 'api'

/**
 * O gesto OBSERVADO, com o nome que o primitivo lhe dá.
 *
 * A reka-ui não publica motivo nenhum em `update:open` — ela avisa QUE o painel
 * fechou, nunca POR QUÊ. O gesto, porém, é observável: o painel emite
 * `escape-key-down`, `pointer-down-outside` e `focus-outside`, e o clique num
 * controle de fechar passa pelo próprio painel antes de chegar ao botão. Quem vê
 * o gesto ANOTA; quem emite a mudança de estado lê a anotação e a traduz com
 * `dialogCloseReason`.
 *
 * `confirm` não é gesto de saída: é a ação primária avisando que o fechamento
 * seguinte foi decisão de dentro. Sem ela, confirmar e fechar seria
 * indistinguível de desistir.
 */
export type DialogCloseGesture =
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
 * `@/lib/analytics` é o que a regra `analytics_in_ui_primitive` proíbe.
 */
export function dialogCloseReason(gesture?: DialogCloseGesture | null): DialogCloseReason {
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
 * Todo controle de fechar do painel se nomeia assim — o X que o `DialogContent`
 * monta, o fechar que o `DialogFooter` emite com `showCloseButton` e todo
 * `DialogClose` que a composição compõe. É o mesmo contrato do `dialog.ts` do
 * Vanilla, que é a referência: lá a fábrica delega o clique neste mesmo seletor.
 */
export const DIALOG_CLOSE_SLOT = '[data-slot="dialog-close"]'

/** O que `createDialogCloseWatch` devolve, pronto para `v-bind` no DialogContent. */
export interface DialogCloseWatch {
  onEscapeKeyDown: () => void
  onPointerDownOutside: () => void
  onFocusOutside: () => void
  onClickCapture: (event: MouseEvent) => void
}

/**
 * Os ouvintes que observam a saída, prontos para `v-bind` num `DialogContent`.
 *
 * Os três primeiros são emits do primitivo, e chegam ao `DialogContent` da lib
 * pelo repasse do wrapper. O quarto é DELEGAÇÃO: o rodapé é de quem compõe,
 * então um ouvinte por botão só alcançaria o X que o painel monta — o Cancelar
 * do rodapé ficaria sem gesto e sairia como `api`. O painel é ANCESTRAL dos
 * controles de fechar, e a fase de captura nele corre antes do clique chegar ao
 * botão, que é o que garante a anotação antes de o `update:open` sair.
 *
 * `closest` e não `target`: o clique costuma cair no ícone ou no `.nds-sr-only`
 * dentro do botão, e a comparação direta erraria os dois.
 *
 * Nada aqui importa analytics: a função devolve ouvintes, e o que fazer com o
 * gesto é decisão de quem chama.
 */
export function createDialogCloseWatch(
  note: (gesture: DialogCloseGesture) => void,
): DialogCloseWatch {
  return {
    onEscapeKeyDown: () => note('escape-key-down'),
    onPointerDownOutside: () => note('pointer-down-outside'),
    onFocusOutside: () => note('focus-outside'),
    onClickCapture: (event: MouseEvent) => {
      const target = event.target as Element | null
      if (target?.closest?.(DIALOG_CLOSE_SLOT)) note('close-press')
    },
  }
}
