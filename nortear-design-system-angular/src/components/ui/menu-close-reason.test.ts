import { describe, expect, it } from 'vitest';
import { MenuCloseTracker, menuCloseReason, menuExitGesture } from './menu-close-reason';

// A tabela inteira, e não um caso por categoria: quem ler este arquivo sabe o
// que cada motivo da lib vira sem abrir a função.
describe('menuCloseReason', () => {
  it.each([
    ['escape-key', 'escape'],
    ['outside-press', 'overlay'],
    // O Tab: o wrapper fecha a cadeia inteira com `focus-out`.
    ['focus-out', 'overlay'],
    ['trigger-press', 'overlay'],
    ['sibling-open', 'overlay'],
    ['cancel-open', 'overlay'],
    // Item escolhido e menu fechado pelo código chegam os dois como `none`.
    ['none', 'api'],
  ])('%s vira %s', (libReason, expected) => {
    expect(menuCloseReason(libReason)).toBe(expected);
  });

  it('motivo desconhecido ou ausente cai em api, e nunca em overlay', () => {
    // A decisão da família (18-overlay §Analytics): o que não se sabe é
    // "decisão de dentro". Até 2026-09-11 as três docs pages mandavam overlay.
    expect(menuCloseReason(undefined)).toBe('api');
    expect(menuCloseReason('qualquer-coisa-nova-da-lib')).toBe('api');
  });

  it('o gesto observado desempata o `none`, e o item escolhido vence o gesto', () => {
    expect(menuCloseReason('none', { gesture: 'leave' })).toBe('overlay');
    expect(menuCloseReason('none', { gesture: 'escape' })).toBe('escape');
    expect(menuCloseReason('none', { itemChosen: true, gesture: 'leave' })).toBe('api');
    // O motivo da lib, quando existe, vale mais que qualquer pista.
    expect(menuCloseReason('escape-key', { itemChosen: true })).toBe('escape');
  });
});

describe('menuExitGesture', () => {
  it.each([
    [{ type: 'pointerdown' }, 'leave'],
    [{ type: 'keydown', key: 'Escape' }, 'escape'],
    [{ type: 'keydown', key: 'Enter' }, 'leave'],
    [{ type: 'keydown', key: ' ' }, 'leave'],
    // Qualquer outra tecla APAGA o gesto anterior.
    [{ type: 'keydown', key: 'ArrowDown' }, null],
    [{ type: 'focus' }, null],
  ])('%o vira %s', (event, expected) => {
    expect(menuExitGesture(event)).toBe(expected);
  });
});

describe('MenuCloseTracker', () => {
  it('item de ação escolhido fecha como api', () => {
    const tracker = new MenuCloseTracker();
    tracker.opened('demo-file');
    tracker.chose('demo-file');
    expect(tracker.closed('demo-file', 'none')).toBe('api');
  });

  it('a passagem ao menu vizinho fecha como overlay: o vizinho abre ANTES', () => {
    const tracker = new MenuCloseTracker();
    tracker.opened('demo-file');
    tracker.opened('demo-edit');
    expect(tracker.closed('demo-file', 'none')).toBe('overlay');
    // O vizinho, sozinho e sem gesto, é fechado pelo código.
    expect(tracker.closed('demo-edit', 'none')).toBe('api');
  });

  it('o clique no gatilho aberto fecha como overlay, e o Escape nele como escape', () => {
    const tracker = new MenuCloseTracker();
    tracker.opened('demo-file');
    tracker.observe({ type: 'pointerdown' });
    expect(tracker.closed('demo-file', 'none')).toBe('overlay');

    tracker.opened('demo-file');
    tracker.observe({ type: 'keydown', key: 'Escape' });
    expect(tracker.closed('demo-file', 'none')).toBe('escape');
  });

  it('a abertura consome o gesto que a causou', () => {
    // O clique que ABRE é o mesmo tipo de evento que o que fecha: se a abertura
    // não o apagasse, o fechamento pelo código sairia como overlay.
    const tracker = new MenuCloseTracker();
    tracker.observe({ type: 'pointerdown' });
    tracker.opened('demo-file');
    expect(tracker.closed('demo-file', 'none')).toBe('api');
  });

  it('a escolha não vaza para a abertura seguinte', () => {
    const tracker = new MenuCloseTracker();
    tracker.opened('demo-file');
    tracker.chose('demo-file');
    tracker.opened('demo-file');
    expect(tracker.closed('demo-file', 'none')).toBe('api');
    tracker.opened('demo-file');
    tracker.observe({ type: 'pointerdown' });
    expect(tracker.closed('demo-file', 'none')).toBe('overlay');
  });

  it('watch ouve em captura e para quando pedido', () => {
    const tracker = new MenuCloseTracker();
    const host = new EventTarget();
    const stop = tracker.watch(host);
    tracker.opened('demo-file');
    host.dispatchEvent(Object.assign(new Event('keydown'), { key: 'Escape' }));
    expect(tracker.closed('demo-file', 'none')).toBe('escape');

    stop();
    tracker.opened('demo-file');
    host.dispatchEvent(new Event('pointerdown'));
    expect(tracker.closed('demo-file', 'none')).toBe('api');
  });
});
