import { describe, expect, it, vi } from 'vitest';
import {
  createSheetCloseWatch,
  sheetCloseReason,
  SHEET_CLOSE_SLOT,
  type SheetCloseGesture,
} from './sheet.close-reason';

// A tabela inteira, e não um caso por categoria: quem ler este arquivo sabe o
// que cada gesto vira sem abrir a função.
describe('sheetCloseReason', () => {
  it.each([
    ['escape-key-down', 'escape'],
    ['pointer-down-outside', 'overlay'],
    ['focus-outside', 'overlay'],
    ['close-press', 'close-button'],
    // A ação primária fecha pelo mesmo caminho do cancelar; sem esta marca,
    // "confirmou e fechou" sairia como "apertou o botão de fechar".
    ['confirm', 'api'],
  ] as const)('%s vira %s', (gesture, expected) => {
    expect(sheetCloseReason(gesture)).toBe(expected);
  });

  it('gesto ausente ou desconhecido cai em api, e nunca em close-button', () => {
    // A decisão da família (18-overlay §Analytics): o que não se sabe é "decisão
    // de dentro". Até 2026-09-11 esta stack mandava `close-button`, afirmando um
    // gesto que ninguém tinha visto.
    expect(sheetCloseReason()).toBe('api');
    expect(sheetCloseReason(null)).toBe('api');
    expect(sheetCloseReason('gesto-novo-da-lib' as SheetCloseGesture)).toBe('api');
  });

  it('as quatro palavras da família, e só elas', () => {
    const words = new Set(
      (
        [
          'escape-key-down',
          'pointer-down-outside',
          'focus-outside',
          'close-press',
          'confirm',
        ] as SheetCloseGesture[]
      ).map((gesture) => sheetCloseReason(gesture)),
    );
    expect([...words].sort()).toEqual(['api', 'close-button', 'escape', 'overlay']);
  });
});

describe('createSheetCloseWatch', () => {
  it('cada emit do painel anota o próprio gesto', () => {
    const note = vi.fn();
    const watch = createSheetCloseWatch(note);

    watch.onEscapeKeyDown();
    watch.onPointerDownOutside();
    watch.onFocusOutside();

    expect(note.mock.calls.map((c) => c[0])).toEqual([
      'escape-key-down',
      'pointer-down-outside',
      'focus-outside',
    ]);
  });

  it('clique em qualquer controle de fechar do painel anota close-press', () => {
    const note = vi.fn();
    const watch = createSheetCloseWatch(note);
    // O clique costuma cair no ícone DENTRO do botão — é o `closest` que o
    // alcança, e é por isso que o alvo aqui não é o próprio controle.
    const target = { closest: (selector: string) => (selector === SHEET_CLOSE_SLOT ? {} : null) };

    watch.onClickCapture({ target } as unknown as MouseEvent);

    expect(note).toHaveBeenCalledWith('close-press');
  });

  it('clique em qualquer outro ponto do painel não anota nada', () => {
    const note = vi.fn();
    const watch = createSheetCloseWatch(note);

    watch.onClickCapture({ target: { closest: () => null } } as unknown as MouseEvent);
    // Alvo sem `closest` (nó de texto, ou o próprio document) também não pode
    // derrubar o ouvinte: ele corre em captura, antes de qualquer clique do painel.
    watch.onClickCapture({ target: null } as unknown as MouseEvent);
    watch.onClickCapture({ target: {} } as unknown as MouseEvent);

    expect(note).not.toHaveBeenCalled();
  });
});
