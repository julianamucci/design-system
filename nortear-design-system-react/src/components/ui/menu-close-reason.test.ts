import { describe, expect, it } from 'vitest';
import { menuCloseReason, withReason } from './menu-close-reason';

describe('menuCloseReason', () => {
  it.each([
    ['escape-key', 'escape'],
    ['outside-press', 'overlay'],
    ['focus-out', 'overlay'],
    ['cancel-open', 'overlay'],
    // O gatilho: clique nele com o menu aberto, e a troca de menu na barra.
    ['trigger-press', 'overlay'],
    ['trigger-hover', 'overlay'],
    ['sibling-open', 'overlay'],
    ['list-navigation', 'overlay'],
    ['item-press', 'api'],
    ['imperative-action', 'api'],
    // Caminho desconhecido ou fechado pelo código: decisão de dentro.
    ['none', 'api'],
    ['qualquer-coisa-nova-da-lib', 'api'],
    [undefined, 'api'],
  ])('%s vira %s', (motivo, esperado) => {
    expect(menuCloseReason(motivo)).toBe(esperado);
  });

  it('nunca devolve close-button: o menu não tem botão de fechar', () => {
    for (const motivo of ['close-press', 'none', 'trigger-press']) {
      expect(menuCloseReason(motivo)).not.toBe('close-button');
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
