import { describe, it, expect } from 'vitest';
import {
  createDrawerCloseWatch,
  drawerCloseReason,
  type DrawerCloseReason,
  type DrawerCloseSignal,
} from './close-reason';

/** O arraste devolve um `PointerEvent`, e a dedução nunca o lê. */
const evento = {} as PointerEvent;

/**
 * O mapeador é TS puro e roda no projeto `unit` (node): nenhuma suíte de
 * navegador alcança a tradução em si, só o efeito dela no evento.
 */
describe('drawerCloseReason', () => {
  it('traduz cada gesto da lib para a palavra da família', () => {
    expect(drawerCloseReason('escape-key')).toBe('escape');
    expect(drawerCloseReason('outside-press')).toBe('overlay');
    expect(drawerCloseReason('drag-dismiss')).toBe('overlay');
    expect(drawerCloseReason('imperative-action')).toBe('api');
  });

  /**
   * O default da GAVETA é `close-button`, ao contrário da família do Dialog: o
   * que sobra depois de Escape, véu e arraste é a saída do rodapé, que a lib
   * não anuncia por evento próprio.
   */
  it('cai em close-button — e não em api — quando não houve gesto anunciado', () => {
    expect(drawerCloseReason(null)).toBe('close-button');
    expect(drawerCloseReason(undefined)).toBe('close-button');
    expect(drawerCloseReason()).toBe('close-button');
    expect(drawerCloseReason('focus-out' as DrawerCloseSignal)).toBe('close-button');
  });

  it('só produz palavras do vocabulário, e as quatro são alcançáveis', () => {
    const vocabulary: DrawerCloseReason[] = ['escape', 'overlay', 'close-button', 'api'];
    const signals: DrawerCloseSignal[] = [
      'escape-key',
      'outside-press',
      'drag-dismiss',
      'imperative-action',
    ];
    for (const signal of signals) {
      expect(vocabulary).toContain(drawerCloseReason(signal));
    }
    // `close-button` é o default, e por isso entra pelo gesto AUSENTE.
    expect(new Set([...signals.map(drawerCloseReason), drawerCloseReason()])).toEqual(
      new Set(vocabulary),
    );
  });
});

describe('createDrawerCloseWatch', () => {
  it('reporta o gesto anotado pelos ouvintes do painel', () => {
    const watch = createDrawerCloseWatch();
    watch.listeners.onEscapeKeydown();
    expect(watch.takeReason()).toBe('escape');

    watch.listeners.onInteractOutside();
    expect(watch.takeReason()).toBe('overlay');

    watch.markProgrammatic();
    expect(watch.takeReason()).toBe('api');
  });

  it('sem gesto nenhum — a saída do rodapé — reporta close-button', () => {
    const watch = createDrawerCloseWatch();
    expect(watch.takeReason()).toBe('close-button');
  });

  /**
   * O motivo sai do ARRASTE: a lib fecha a gaveta antes de anunciar a soltura,
   * e anotado no release ele chegaria depois do evento que explica.
   */
  it('o arraste que dispensa reporta overlay', () => {
    const watch = createDrawerCloseWatch();
    watch.drag.onDrag();
    expect(watch.takeReason()).toBe('overlay');
  });

  /**
   * O defeito que o release evita: arraste curto volta ao repouso, e sem a
   * limpeza o próximo fechamento pelo botão herdaria `overlay`.
   */
  it('arraste que volta ao repouso limpa a anotação, e o botão volta a ser close-button', () => {
    const watch = createDrawerCloseWatch();
    watch.drag.onDrag();
    watch.drag.onRelease(evento, true);
    expect(watch.takeReason()).toBe('close-button');
  });

  it('soltura que FECHA preserva o motivo do arraste', () => {
    const watch = createDrawerCloseWatch();
    watch.drag.onDrag();
    watch.drag.onRelease(evento, false);
    expect(watch.takeReason()).toBe('overlay');
  });

  it('takeReason consome o gesto: o fechamento seguinte não herda o anterior', () => {
    const watch = createDrawerCloseWatch();
    watch.listeners.onEscapeKeydown();
    expect(watch.takeReason()).toBe('escape');
    expect(watch.takeReason()).toBe('close-button');
  });

  it('reset limpa o gesto pendente da abertura', () => {
    const watch = createDrawerCloseWatch();
    watch.listeners.onInteractOutside();
    watch.reset();
    expect(watch.takeReason()).toBe('close-button');
  });

  it('vence o ÚLTIMO gesto: arrastar e desistir pelo Escape fecha por escape', () => {
    const watch = createDrawerCloseWatch();
    watch.drag.onDrag();
    watch.listeners.onEscapeKeydown();
    expect(watch.takeReason()).toBe('escape');
  });

  it('cada instância guarda o próprio gesto', () => {
    const a = createDrawerCloseWatch();
    const b = createDrawerCloseWatch();
    a.listeners.onEscapeKeydown();
    expect(b.takeReason()).toBe('close-button');
    expect(a.takeReason()).toBe('escape');
  });
});
