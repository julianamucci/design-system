import { describe, it, expect } from 'vitest';
import {
  createDialogCloseWatch,
  dialogCloseReason,
  type DialogCloseReason,
  type DialogCloseSignal,
} from './close-reason';

/**
 * O mapeador é TS puro e roda no projeto `unit` (node): nenhuma suíte de
 * navegador alcança a tradução em si, só o efeito dela no evento.
 */
describe('dialogCloseReason', () => {
  it('traduz cada gesto da lib para a palavra da família', () => {
    expect(dialogCloseReason('escape-key')).toBe('escape');
    expect(dialogCloseReason('outside-press')).toBe('overlay');
    expect(dialogCloseReason('focus-out')).toBe('overlay');
    expect(dialogCloseReason('close-press')).toBe('close-button');
    expect(dialogCloseReason('confirm')).toBe('api');
  });

  /**
   * O defeito que motivou o arquivo: o padrão era `close-button`, e a ação que
   * confirma chegava ao relatório como "apertou o botão de fechar".
   */
  it('cai em api — nunca em close-button — quando não houve gesto anunciado', () => {
    expect(dialogCloseReason(null)).toBe('api');
    expect(dialogCloseReason(undefined)).toBe('api');
    expect(dialogCloseReason()).toBe('api');
    // Palavra que a lib venha a inventar cai no mesmo lugar, e não inventa um
    // clique que ninguém deu.
    expect(dialogCloseReason('imperative-action' as DialogCloseSignal)).toBe('api');
  });

  it('só produz palavras do vocabulário de fechamento da família', () => {
    const vocabulary: DialogCloseReason[] = ['escape', 'overlay', 'close-button', 'api'];
    const signals: DialogCloseSignal[] = [
      'escape-key',
      'outside-press',
      'focus-out',
      'close-press',
      'confirm',
    ];
    for (const signal of signals) {
      expect(vocabulary).toContain(dialogCloseReason(signal));
    }
    // As quatro são ALCANÇÁVEIS: vocabulário com palavra que nenhum caminho
    // produz é dimensão morta no GA4.
    expect(new Set(signals.map(dialogCloseReason))).toEqual(new Set(vocabulary));
  });
});

describe('createDialogCloseWatch', () => {
  it('reporta o gesto anotado pelos ouvintes do painel', () => {
    const watch = createDialogCloseWatch();
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

    // O fechar que o `DialogFooter` emite sozinho, pelo `showCloseButton`: não
    // há elemento na mão de quem chama, então a marca entra pela função.
    watch.markClosePress();
    expect(watch.takeReason()).toBe('close-button');

    watch.markConfirmation();
    expect(watch.takeReason()).toBe('api');
  });

  it('sem gesto nenhum — fechamento por código — reporta api', () => {
    const watch = createDialogCloseWatch();
    expect(watch.takeReason()).toBe('api');
  });

  it('takeReason consome o gesto: o fechamento seguinte não herda o anterior', () => {
    const watch = createDialogCloseWatch();
    watch.listeners.onEscapeKeydown();
    expect(watch.takeReason()).toBe('escape');
    expect(watch.takeReason()).toBe('api');
  });

  it('reset limpa o gesto pendente da abertura', () => {
    const watch = createDialogCloseWatch();
    watch.markConfirmation();
    watch.reset();
    expect(watch.takeReason()).toBe('api');

    watch.listeners.onClosePress();
    watch.reset();
    expect(watch.takeReason()).toBe('api');
  });

  it('vence o ÚLTIMO gesto: confirmar e desistir pelo Escape fecha por escape', () => {
    const watch = createDialogCloseWatch();
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
    const a = createDialogCloseWatch();
    const b = createDialogCloseWatch();
    a.listeners.onEscapeKeydown();
    expect(b.takeReason()).toBe('api');
    expect(a.takeReason()).toBe('escape');
  });
});
