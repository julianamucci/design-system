import { describe, it, expect } from 'vitest';
import {
  createMenuCloseWatch,
  menuCloseReason,
  type MenuCloseReason,
  type MenuCloseSignal,
} from './menu-close-reason';

const SUB = '[data-slot="dropdown-menu-sub-content"]';

/** Um evento de ponteiro com o alvo que o teste precisa, e nada mais. */
function pointerOn(target: Element | null): PointerEvent {
  return { target } as unknown as PointerEvent;
}

function keydown(key: string): KeyboardEvent {
  return { key } as KeyboardEvent;
}

/** Um elemento que responde ao `closest` como o painel de submenu responderia. */
function elementoNoSubmenu(): Element {
  return { closest: (selector: string) => (selector === SUB ? ({} as Element) : null) } as Element &
    Record<string, unknown>;
}

/**
 * O mapeador é TS puro e roda no projeto `unit` (node): nenhuma suíte de
 * navegador alcança a tradução em si, só o efeito dela no evento.
 */
describe('menuCloseReason', () => {
  it('traduz cada gesto para a palavra da família', () => {
    expect(menuCloseReason('escape-key')).toBe('escape');
    expect(menuCloseReason('outside-press')).toBe('overlay');
    expect(menuCloseReason('focus-out')).toBe('overlay');
    expect(menuCloseReason('trigger-press')).toBe('overlay');
    expect(menuCloseReason('sibling-open')).toBe('overlay');
    expect(menuCloseReason('item-press')).toBe('api');
  });

  /**
   * Até 2026-09-11 o padrão era `overlay`, e todo fechamento de origem
   * desconhecida contava como clique fora.
   */
  it('cai em api quando não houve gesto anunciado', () => {
    expect(menuCloseReason(null)).toBe('api');
    expect(menuCloseReason(undefined)).toBe('api');
    expect(menuCloseReason()).toBe('api');
    expect(menuCloseReason('imperative-action' as MenuCloseSignal)).toBe('api');
  });

  /** TRÊS palavras: menu não tem botão de fechar. */
  it('não produz close-button, e as três palavras são alcançáveis', () => {
    const vocabulary: MenuCloseReason[] = ['escape', 'overlay', 'api'];
    const signals: MenuCloseSignal[] = [
      'escape-key',
      'outside-press',
      'focus-out',
      'trigger-press',
      'sibling-open',
      'item-press',
    ];
    for (const signal of signals) {
      expect(vocabulary).toContain(menuCloseReason(signal));
    }
    expect(new Set(signals.map(menuCloseReason))).toEqual(new Set(vocabulary));
  });
});

describe('createMenuCloseWatch', () => {
  it('reporta o gesto anotado pelo painel', () => {
    const watch = createMenuCloseWatch({ subContentSelector: SUB });

    watch.content.onEscapeKeydown();
    expect(watch.takeReason()).toBe('escape');

    watch.content.onInteractOutside(pointerOn(null));
    expect(watch.takeReason()).toBe('overlay');

    watch.content.onkeydown(keydown('Tab'));
    expect(watch.takeReason()).toBe('overlay');

    watch.subContent.onkeydown(keydown('Tab'));
    expect(watch.takeReason()).toBe('overlay');

    watch.markItemPress();
    expect(watch.takeReason()).toBe('api');

    watch.markSiblingOpen();
    expect(watch.takeReason()).toBe('overlay');
  });

  it('tecla que não é Tab não anota nada', () => {
    const watch = createMenuCloseWatch({ subContentSelector: SUB });
    watch.content.onkeydown(keydown('ArrowDown'));
    watch.subContent.onkeydown(keydown('Enter'));
    expect(watch.takeReason()).toBe('api');
  });

  /**
   * O clique num painel de submenu chega ao `onInteractOutside` do painel de
   * cima, e a lib não fecha por ele: é interação DENTRO do menu.
   */
  it('clique no painel do submenu não conta como clique fora', () => {
    const watch = createMenuCloseWatch({ subContentSelector: SUB });
    watch.content.onInteractOutside(pointerOn(elementoNoSubmenu()));
    expect(watch.takeReason()).toBe('api');
  });

  it('o gatilho só dispensa o menu ABERTO', () => {
    let open = false;
    const watch = createMenuCloseWatch({ subContentSelector: SUB, isOpen: () => open });

    watch.trigger.onpointerdown();
    expect(watch.takeReason()).toBe('api');

    open = true;
    watch.trigger.onpointerdown();
    expect(watch.takeReason()).toBe('overlay');
  });

  it('sem `isOpen` — o menu de contexto, que não tem gatilho — o clique não anota', () => {
    const watch = createMenuCloseWatch({ subContentSelector: SUB });
    watch.trigger.onpointerdown();
    expect(watch.takeReason()).toBe('api');
  });

  it('takeReason consome o gesto: o fechamento seguinte não herda o anterior', () => {
    const watch = createMenuCloseWatch({ subContentSelector: SUB });
    watch.content.onEscapeKeydown();
    expect(watch.takeReason()).toBe('escape');
    expect(watch.takeReason()).toBe('api');
  });

  it('reset limpa o gesto pendente da abertura', () => {
    const watch = createMenuCloseWatch({ subContentSelector: SUB });
    watch.content.onInteractOutside(pointerOn(null));
    watch.reset();
    expect(watch.takeReason()).toBe('api');
  });

  it('vence o ÚLTIMO gesto: sair do menu e escolher um item fecha pela decisão', () => {
    const watch = createMenuCloseWatch({ subContentSelector: SUB });
    watch.content.onkeydown(keydown('Tab'));
    watch.markItemPress();
    expect(watch.takeReason()).toBe('api');
  });

  /** A página monta vários menus vivos ao mesmo tempo. */
  it('cada instância guarda o próprio gesto', () => {
    const a = createMenuCloseWatch({ subContentSelector: SUB });
    const b = createMenuCloseWatch({ subContentSelector: SUB });
    a.content.onEscapeKeydown();
    expect(b.takeReason()).toBe('api');
    expect(a.takeReason()).toBe('escape');
  });
});
