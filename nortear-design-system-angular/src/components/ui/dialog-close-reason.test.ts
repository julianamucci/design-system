import { describe, expect, it } from 'vitest';
import {
  alertDialogCloseReason,
  alertDialogConfirmedFromEvent,
  dialogCloseReason,
} from './dialog-close-reason';

// A tabela INTEIRA do `RdxDialogOpenChangeReason` — as oito palavras da lib, e
// não um caso por categoria: quem ler este arquivo sabe o que cada motivo vira
// sem abrir a função. É a tabela que tem de bater com a da outra stack que
// recebe o motivo pronto da lib.
describe('dialogCloseReason', () => {
  it.each([
    ['escape-key', 'escape'],
    ['outside-press', 'overlay'],
    ['focus-out', 'overlay'],
    ['close-press', 'close-button'],
    // Painel modal: o gatilho fica coberto pelo véu, e só código fecha por ele
    // — a diferença deliberada em relação ao popover, que o põe em `overlay`.
    ['trigger-press', 'api'],
    ['swipe', 'api'],
    ['imperative-action', 'api'],
    ['none', 'api'],
  ])('%s vira %s', (motivo, esperado) => {
    expect(dialogCloseReason(motivo)).toBe(esperado);
  });

  it('motivo desconhecido ou ausente cai em api, e nunca em close-button', () => {
    // Com o padrão em `close-button`, o formulário que salvou e fechou chegaria
    // ao relatório como "apertou fechar".
    expect(dialogCloseReason(undefined)).toBe('api');
    expect(dialogCloseReason('qualquer-coisa-nova-da-lib')).toBe('api');
  });

  it('a confirmação vence o motivo da lib', () => {
    // A ação primária da demonstração fecha pelo mesmo caminho do X (é um
    // `ndsDialogClose`): sem a marca, "concluiu" chegaria como "desistiu".
    expect(dialogCloseReason('close-press', { confirmed: true })).toBe('api');
    expect(dialogCloseReason('escape-key', { confirmed: true })).toBe('api');
    // E sem a marca o motivo da lib vale inteiro.
    expect(dialogCloseReason('close-press', { confirmed: false })).toBe('close-button');
  });
});

describe('alertDialogCloseReason', () => {
  it.each([
    ['escape-key', 'escape'],
    ['close-press', 'close-button'],
    // Clique fora não fecha este componente e o foco não escapa do painel: se
    // estes motivos chegarem, é a lib e não a pessoa. `overlay` não existe no
    // vocabulário dele (D1 do prd/alert-dialog.md).
    ['outside-press', 'api'],
    ['focus-out', 'api'],
    ['trigger-press', 'api'],
    ['swipe', 'api'],
    ['imperative-action', 'api'],
    ['none', 'api'],
  ])('%s vira %s', (motivo, esperado) => {
    expect(alertDialogCloseReason(motivo)).toBe(esperado);
  });

  it('motivo desconhecido ou ausente cai em api, e nunca em close-button', () => {
    expect(alertDialogCloseReason(undefined)).toBe('api');
    expect(alertDialogCloseReason('qualquer-coisa-nova-da-lib')).toBe('api');
  });

  it('a confirmação vence o motivo da lib', () => {
    // O Cancelar e a ação que confirma chegam os dois como `close-press`.
    expect(alertDialogCloseReason('close-press', { confirmed: true })).toBe('api');
    expect(alertDialogCloseReason('close-press', { confirmed: false })).toBe('close-button');
  });

  it('nunca devolve overlay: a palavra não existe no vocabulário deste componente', () => {
    const motivos = [
      'escape-key',
      'close-press',
      'outside-press',
      'focus-out',
      'trigger-press',
      'swipe',
      'imperative-action',
      'none',
      undefined,
    ];
    for (const motivo of motivos) {
      expect(alertDialogCloseReason(motivo)).not.toBe('overlay');
      expect(alertDialogCloseReason(motivo, { confirmed: true })).not.toBe('overlay');
    }
  });
});

// Quem separa a confirmação do cancelamento nesta stack é o ALVO do evento que
// fechou o painel — as duas chegam como `close-press` da lib. A bandeira
// levantada no `(click)` de quem consome NÃO serve: medido em 2026-09-22, o
// `(click)` do template corre depois do ouvinte de host do `RdxDialogClose` que
// o `ndsAlertDialogAction` compõe, e a marca chega tarde. Este projeto roda em
// node, então o alvo é dublado pela única capacidade que a função usa.
describe('alertDialogConfirmedFromEvent', () => {
  const eventOn = (matchingSelector: string | null) =>
    ({
      target: {
        closest: (selector: string) => (selector === matchingSelector ? {} : null),
      },
    }) as unknown as Event;

  it('o clique na ação que confirma é confirmação', () => {
    expect(alertDialogConfirmedFromEvent(eventOn('[ndsAlertDialogAction]'))).toBe(true);
  });

  it('o Cancelar não é confirmação, e é o caso que o motivo errado estragava', () => {
    expect(alertDialogConfirmedFromEvent(eventOn(null))).toBe(false);
  });

  it('o Escape não tem alvo de botão, e também não é confirmação', () => {
    expect(alertDialogConfirmedFromEvent(undefined)).toBe(false);
    expect(alertDialogConfirmedFromEvent({ target: null } as unknown as Event)).toBe(false);
  });

  it('alvo sem closest não derruba a página', () => {
    expect(alertDialogConfirmedFromEvent({ target: {} } as unknown as Event)).toBe(false);
  });
});
