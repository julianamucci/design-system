import { describe, it, expect } from 'vitest';
import {
  alertDialogCloseReason,
  createAlertDialogCloseWatch,
  type AlertDialogCloseReason,
  type AlertDialogCloseSignal,
} from './close-reason';

/**
 * O mapeador é TS puro e roda no projeto `unit` (node): nenhuma suíte de
 * navegador alcança a tradução em si, só o efeito dela no evento.
 */
describe('alertDialogCloseReason', () => {
  it('traduz cada gesto para a palavra da família', () => {
    expect(alertDialogCloseReason('escape-key')).toBe('escape');
    expect(alertDialogCloseReason('close-press')).toBe('close-button');
    expect(alertDialogCloseReason('confirm')).toBe('api');
  });

  it('cai em api — nunca em close-button — quando não houve gesto anunciado', () => {
    expect(alertDialogCloseReason(null)).toBe('api');
    expect(alertDialogCloseReason(undefined)).toBe('api');
    expect(alertDialogCloseReason()).toBe('api');
    expect(alertDialogCloseReason('outside-press' as AlertDialogCloseSignal)).toBe('api');
  });

  /**
   * TRÊS palavras, e a que falta é `overlay`: clique no véu não fecha este
   * componente (D1 do PRD). A exceção correspondente vive em
   * `FAMILIA_DE_MOTIVO`, no `scripts/audit.mjs`.
   */
  it('não produz overlay, e as três palavras são alcançáveis', () => {
    const vocabulary: AlertDialogCloseReason[] = ['escape', 'close-button', 'api'];
    const signals: AlertDialogCloseSignal[] = ['escape-key', 'close-press', 'confirm'];
    for (const signal of signals) {
      expect(vocabulary).toContain(alertDialogCloseReason(signal));
    }
    expect(new Set(signals.map(alertDialogCloseReason))).toEqual(new Set(vocabulary));
  });
});

describe('createAlertDialogCloseWatch', () => {
  it('reporta o gesto anotado pelo conteúdo e pelo Cancelar', () => {
    const watch = createAlertDialogCloseWatch();
    watch.listeners.onEscapeKeydown();
    expect(watch.takeReason()).toBe('escape');

    watch.cancelTrigger.onclick();
    expect(watch.takeReason()).toBe('close-button');

    watch.markCancelPress();
    expect(watch.takeReason()).toBe('close-button');

    watch.markConfirmation();
    expect(watch.takeReason()).toBe('api');
  });

  it('sem gesto nenhum — fechamento por código — reporta api', () => {
    const watch = createAlertDialogCloseWatch();
    expect(watch.takeReason()).toBe('api');
  });

  it('takeReason consome o gesto: o fechamento seguinte não herda o anterior', () => {
    const watch = createAlertDialogCloseWatch();
    watch.listeners.onEscapeKeydown();
    expect(watch.takeReason()).toBe('escape');
    expect(watch.takeReason()).toBe('api');
  });

  it('reset limpa o gesto pendente da abertura', () => {
    const watch = createAlertDialogCloseWatch();
    watch.cancelTrigger.onclick();
    watch.reset();
    expect(watch.takeReason()).toBe('api');
  });

  it('vence o ÚLTIMO gesto: confirmar e desistir pelo Escape fecha por escape', () => {
    const watch = createAlertDialogCloseWatch();
    watch.markConfirmation();
    watch.listeners.onEscapeKeydown();
    expect(watch.takeReason()).toBe('escape');
  });

  /**
   * O preview do AlertDialog é instanciado uma vez por exemplo da docs page —
   * ao contrário do Dialog e do Sheet, que têm um só painel vivo por página.
   */
  it('cada instância guarda o próprio gesto', () => {
    const a = createAlertDialogCloseWatch();
    const b = createAlertDialogCloseWatch();
    a.listeners.onEscapeKeydown();
    expect(b.takeReason()).toBe('api');
    expect(a.takeReason()).toBe('escape');
  });
});
