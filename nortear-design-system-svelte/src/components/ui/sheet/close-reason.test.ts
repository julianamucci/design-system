import { describe, it, expect } from 'vitest';
import {
  createSheetCloseWatch,
  sheetCloseReason,
  type SheetCloseReason,
  type SheetCloseSignal,
} from './close-reason';

/**
 * O mapeador é TS puro e roda no projeto `unit` (node): nenhuma suíte de
 * navegador alcança a tradução em si, só o efeito dela no evento.
 */
describe('sheetCloseReason', () => {
  it('traduz cada gesto da lib para a palavra da família', () => {
    expect(sheetCloseReason('escape-key')).toBe('escape');
    expect(sheetCloseReason('outside-press')).toBe('overlay');
    expect(sheetCloseReason('focus-out')).toBe('overlay');
    expect(sheetCloseReason('close-press')).toBe('close-button');
    expect(sheetCloseReason('confirm')).toBe('api');
  });

  /**
   * O defeito que motivou o arquivo: o padrão era `close-button`, e a ação que
   * confirma chegava ao relatório como "apertou o botão de fechar".
   */
  it('cai em api — nunca em close-button — quando não houve gesto anunciado', () => {
    expect(sheetCloseReason(null)).toBe('api');
    expect(sheetCloseReason(undefined)).toBe('api');
    expect(sheetCloseReason()).toBe('api');
    // Palavra que a lib venha a inventar cai no mesmo lugar, e não inventa um
    // clique que ninguém deu.
    expect(sheetCloseReason('imperative-action' as SheetCloseSignal)).toBe('api');
  });

  it('só produz palavras do vocabulário de fechamento da família', () => {
    const vocabulary: SheetCloseReason[] = ['escape', 'overlay', 'close-button', 'api'];
    const signals: SheetCloseSignal[] = [
      'escape-key',
      'outside-press',
      'focus-out',
      'close-press',
      'confirm',
    ];
    for (const signal of signals) {
      expect(vocabulary).toContain(sheetCloseReason(signal));
    }
    // As quatro são ALCANÇÁVEIS: vocabulário com palavra que nenhum caminho
    // produz é dimensão morta no GA4.
    expect(new Set(signals.map(sheetCloseReason))).toEqual(new Set(vocabulary));
  });
});

describe('createSheetCloseWatch', () => {
  it('reporta o gesto anotado pelos ouvintes do painel', () => {
    const watch = createSheetCloseWatch();
    watch.listeners.onEscapeKeydown();
    expect(watch.takeReason()).toBe('escape');

    watch.listeners.onInteractOutside();
    expect(watch.takeReason()).toBe('overlay');

    watch.listeners.onFocusOutside();
    expect(watch.takeReason()).toBe('overlay');

    watch.listeners.onClosePress();
    expect(watch.takeReason()).toBe('close-button');

    watch.closeTrigger.onclick();
    expect(watch.takeReason()).toBe('close-button');

    watch.markConfirmation();
    expect(watch.takeReason()).toBe('api');
  });

  it('sem gesto nenhum — fechamento por código — reporta api', () => {
    const watch = createSheetCloseWatch();
    expect(watch.takeReason()).toBe('api');
  });

  it('takeReason consome o gesto: o fechamento seguinte não herda o anterior', () => {
    const watch = createSheetCloseWatch();
    watch.listeners.onEscapeKeydown();
    expect(watch.takeReason()).toBe('escape');
    expect(watch.takeReason()).toBe('api');
  });

  it('reset limpa o gesto pendente da abertura', () => {
    const watch = createSheetCloseWatch();
    watch.markConfirmation();
    watch.reset();
    expect(watch.takeReason()).toBe('api');

    watch.listeners.onClosePress();
    watch.reset();
    expect(watch.takeReason()).toBe('api');
  });

  it('vence o ÚLTIMO gesto: confirmar e desistir pelo Escape fecha por escape', () => {
    const watch = createSheetCloseWatch();
    watch.markConfirmation();
    watch.listeners.onEscapeKeydown();
    expect(watch.takeReason()).toBe('escape');

    // E o sentido inverso: quem tinha o ponteiro fora e decidiu confirmar fecha
    // pela decisão.
    watch.listeners.onInteractOutside();
    watch.markConfirmation();
    expect(watch.takeReason()).toBe('api');
  });

  it('cada instância guarda o próprio gesto', () => {
    const a = createSheetCloseWatch();
    const b = createSheetCloseWatch();
    a.listeners.onEscapeKeydown();
    expect(b.takeReason()).toBe('api');
    expect(a.takeReason()).toBe('escape');
  });
});
