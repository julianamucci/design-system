// ─── Tab de teclado nas stories dos menus ─────────────────────────────────────
//
// Um `Tab`, DESPACHADO À MÃO no elemento em foco. Andaime de teste, das stories
// do DropdownMenu, do ContextMenu e do Menubar — fica aqui, e não num
// `*.stories.ts`, porque todo export nomeado de story vira story no índice.
// Mesmo helper do Vanilla (`src/lib/press-tab.ts`), que é a referência.
//
// Por que não `userEvent.keyboard('{Tab}')` nem `userEvent.tab()`: as duas
// formas simulam também o MOVIMENTO do foco, pela conta de ordem de tabulação
// da própria biblioteca de teste — e a asserção passaria a medir essa conta, e
// não a do menu. O que se quer medir é o `keydown` que o menu recebe e o que
// ELE faz com a tecla: os três consomem o Tab (`preventDefault`) e põem o foco
// no destino por conta própria (`@/lib/tabbable`). Evento sintético não tem
// ação padrão do navegador, então com este despacho o foco só se move se o menu
// o mover — um menu que devolvesse o Tab ao navegador ficaria com o foco parado
// (ou no `<body>`), e a story reprova. Com teclado de verdade o resultado é o
// mesmo, porque a ação padrão foi consumida.

/** Despacha `keydown` de Tab (ou Shift+Tab) no elemento em foco. */
export function pressTab(shift = false): void {
  (document.activeElement ?? document.body).dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Tab', shiftKey: shift, bubbles: true, cancelable: true }),
  );
}
