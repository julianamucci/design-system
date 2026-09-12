import { describe, expect, it, vi } from 'vitest';
import {
  createDialogCloseWatch,
  dialogCloseReason,
  DIALOG_CLOSE_SLOT,
  type DialogCloseGesture,
} from './dialog.close-reason';

// A tabela inteira, e não um caso por categoria: quem ler este arquivo sabe o
// que cada gesto vira sem abrir a função.
describe('dialogCloseReason', () => {
  it.each([
    ['escape-key-down', 'escape'],
    ['pointer-down-outside', 'overlay'],
    ['focus-outside', 'overlay'],
    ['close-press', 'close-button'],
    // A ação primária fecha pelo mesmo caminho do cancelar; sem esta marca,
    // "confirmou e fechou" sairia como "apertou o botão de fechar".
    ['confirm', 'api'],
  ] as const)('%s vira %s', (gesture, expected) => {
    expect(dialogCloseReason(gesture)).toBe(expected);
  });

  it('gesto ausente ou desconhecido cai em api, e nunca em close-button', () => {
    // A decisão da família (18-overlay §Analytics): o que não se sabe é "decisão
    // de dentro". Até 2026-09-12 a docs page desta stack mandava `close-button`,
    // afirmando um gesto que ninguém tinha visto.
    expect(dialogCloseReason()).toBe('api');
    expect(dialogCloseReason(null)).toBe('api');
    expect(dialogCloseReason('gesto-novo-da-lib' as DialogCloseGesture)).toBe('api');
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
        ] as DialogCloseGesture[]
      ).map((gesture) => dialogCloseReason(gesture)),
    );
    expect([...words].sort()).toEqual(['api', 'close-button', 'escape', 'overlay']);
  });
});

describe('createDialogCloseWatch', () => {
  it('cada emit do painel anota o próprio gesto', () => {
    const note = vi.fn();
    const watch = createDialogCloseWatch(note);

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
    const watch = createDialogCloseWatch(note);
    // O clique costuma cair no ícone DENTRO do botão — é o `closest` que o
    // alcança, e é por isso que o alvo aqui não é o próprio controle. O seletor
    // vale para o X do canto, para o fechar do rodapé e para todo `DialogClose`
    // que a composição monte: os três carregam `data-slot="dialog-close"`.
    const target = { closest: (selector: string) => (selector === DIALOG_CLOSE_SLOT ? {} : null) };

    watch.onClickCapture({ target } as unknown as MouseEvent);

    expect(note).toHaveBeenCalledWith('close-press');
  });

  it('clique em qualquer outro ponto do painel não anota nada', () => {
    const note = vi.fn();
    const watch = createDialogCloseWatch(note);

    watch.onClickCapture({ target: { closest: () => null } } as unknown as MouseEvent);
    // Alvo sem `closest` (nó de texto, ou o próprio document) também não pode
    // derrubar o ouvinte: ele corre em captura, antes de qualquer clique do painel.
    watch.onClickCapture({ target: null } as unknown as MouseEvent);
    watch.onClickCapture({ target: {} } as unknown as MouseEvent);

    expect(note).not.toHaveBeenCalled();
  });
});
