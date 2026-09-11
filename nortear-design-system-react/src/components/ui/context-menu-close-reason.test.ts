import { describe, expect, it } from 'vitest';
import { contextMenuCloseReason, withReason } from './context-menu-close-reason';

describe('contextMenuCloseReason', () => {
  it.each([
    ['escape-key', 'escape'],
    ['outside-press', 'overlay'],
    ['focus-out', 'overlay'],
    ['cancel-open', 'overlay'],
    ['item-press', 'api'],
    ['imperative-action', 'api'],
    [undefined, 'api'],
  ])('%s vira %s', (motivo, esperado) => {
    expect(contextMenuCloseReason(motivo)).toBe(esperado);
  });

  it('nunca devolve close-button: o menu não tem botão de fechar', () => {
    for (const motivo of ['close-press', 'trigger-press', 'none']) {
      expect(contextMenuCloseReason(motivo)).not.toBe('close-button');
    }
  });
});

describe('withReason', () => {
  it('troca só o motivo e preserva o resto do objeto', () => {
    const evento = new Event('keydown');
    const original = { reason: 'imperative-action', event: evento };
    const copia = withReason(original, 'focus-out');
    expect(copia.reason).toBe('focus-out');
    expect(copia.event).toBe(evento);
    // O objeto da lib não é tocado: ele ainda é lido por dentro depois do callback.
    expect(original.reason).toBe('imperative-action');
  });

  it('o cancelamento feito na cópia continua visível pelo getter', () => {
    // A lib lê `isCanceled` do objeto DELA; o getter copiado fecha sobre o mesmo
    // estado. Espalhando o objeto, o valor ficaria congelado em `false`.
    let cancelado = false;
    const original = {
      reason: 'imperative-action',
      cancel() {
        cancelado = true;
      },
      get isCanceled() {
        return cancelado;
      },
    };
    const copia = withReason(original, 'focus-out');
    copia.cancel();
    expect(copia.isCanceled).toBe(true);
    expect(original.isCanceled).toBe(true);
  });
});
