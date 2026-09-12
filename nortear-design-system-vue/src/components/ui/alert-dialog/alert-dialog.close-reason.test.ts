import { describe, expect, it, vi } from 'vitest';
import {
  alertDialogCloseReason,
  ALERT_DIALOG_CANCEL_SLOT,
  createAlertDialogCloseWatch,
  type AlertDialogCloseGesture,
} from './alert-dialog.close-reason';
import { dialogCloseReason, type DialogCloseGesture } from '../dialog/dialog.close-reason';

// A tabela inteira — três caminhos, porque o clique no véu NÃO fecha este painel
// (D1 do prd/alert-dialog.md).
describe('alertDialogCloseReason', () => {
  it.each([
    ['escape-key-down', 'escape'],
    ['close-press', 'close-button'],
    // A ação que confirma é decisão de dentro; sem a marca, confirmar seria
    // indistinguível de cancelar, já que as duas são partes de fechar da lib.
    ['confirm', 'api'],
  ] as const)('%s vira %s', (gesture, expected) => {
    expect(alertDialogCloseReason(gesture)).toBe(expected);
  });

  it('gesto ausente ou desconhecido cai em api, e nunca em close-button', () => {
    expect(alertDialogCloseReason()).toBe('api');
    expect(alertDialogCloseReason(null)).toBe('api');
    expect(alertDialogCloseReason('gesto-novo-da-lib' as AlertDialogCloseGesture)).toBe('api');
  });

  it('as três palavras da categoria, e só elas — overlay não é palavra daqui', () => {
    const words = new Set(
      (['escape-key-down', 'close-press', 'confirm'] as AlertDialogCloseGesture[]).map((gesture) =>
        alertDialogCloseReason(gesture),
      ),
    );
    expect([...words].sort()).toEqual(['api', 'close-button', 'escape']);
    expect([...words]).not.toContain('overlay');
  });

  it('gesto de FORA, se chegar, vira api — nunca overlay', () => {
    // Composição fora do contrato, ou a lib mudando: o AlertDialog não fala
    // `overlay`, e o estreitamento é o que separa este mapeador do do Dialog.
    // O `as` é o ponto do caso — o tipo já proíbe, e aqui se mede o RUNTIME.
    for (const fora of ['pointer-down-outside', 'focus-outside']) {
      expect(dialogCloseReason(fora as DialogCloseGesture)).toBe('overlay');
      expect(alertDialogCloseReason(fora as unknown as AlertDialogCloseGesture)).toBe('api');
    }
  });

  it('para os gestos que os dois falam, a palavra é a MESMA do Dialog', () => {
    // O evento é um só (`dialog_close`), então uma segunda tabela que divergisse
    // partiria a dimensão do GA4 em duas. É o que aconteceu com o Sheet, que
    // ficou seis semanas com três palavras contra as quatro do Dialog.
    for (const gesture of ['escape-key-down', 'close-press', 'confirm'] as const) {
      expect(alertDialogCloseReason(gesture)).toBe(dialogCloseReason(gesture));
    }
  });
});

describe('createAlertDialogCloseWatch', () => {
  it('o Escape do painel anota o próprio gesto', () => {
    const note = vi.fn();
    createAlertDialogCloseWatch(note).onEscapeKeyDown();

    expect(note).toHaveBeenCalledWith('escape-key-down');
  });

  it('clique no Cancelar anota close-press', () => {
    const note = vi.fn();
    const watch = createAlertDialogCloseWatch(note);
    // O clique cai no texto dentro do botão; quem o alcança é o `closest`.
    const target = {
      closest: (selector: string) => (selector === ALERT_DIALOG_CANCEL_SLOT ? {} : null),
    };

    watch.onClickCapture({ target } as unknown as MouseEvent);

    expect(note).toHaveBeenCalledWith('close-press');
  });

  it('clique na ação primária não anota nada — quem marca a confirmação é quem a executa', () => {
    const note = vi.fn();
    const watch = createAlertDialogCloseWatch(note);
    // A ação tem slot próprio (`alert-dialog-action`), e anotá-la aqui como
    // `close-press` apagaria a confirmação marcada pelo `@click` da página.
    const acao = {
      closest: (selector: string) =>
        (selector === '[data-slot="alert-dialog-action"]' ? {} : null),
    };

    watch.onClickCapture({ target: acao } as unknown as MouseEvent);
    watch.onClickCapture({ target: { closest: () => null } } as unknown as MouseEvent);
    watch.onClickCapture({ target: null } as unknown as MouseEvent);
    watch.onClickCapture({ target: {} } as unknown as MouseEvent);

    expect(note).not.toHaveBeenCalled();
  });
});
