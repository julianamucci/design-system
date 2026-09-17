// O algoritmo "esconder os outros", preso sem navegador.
//
// O projeto `unit` roda em `environment: 'node'` e não há jsdom no
// `package.json`: a árvore aqui é FALSA, com só o que `hideOthers` toca —
// `parentElement`, `children`, `contains` e os três métodos de atributo. A prova
// no navegador fica com a story `Modal` do popover; aqui ficam os casos que a
// story não alcança, sobretudo dois painéis fechando fora de ordem.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hideOthers } from '@/lib/hide-others';

class FakeElement {
  parentElement: FakeElement | null = null;
  children: FakeElement[] = [];
  private attrs = new Map<string, string>();

  constructor(readonly name: string) {}

  /** O nome do nó em caixa alta, como o `tagName` do DOM devolve. */
  get tagName(): string {
    return this.name.toUpperCase();
  }

  append(...kids: FakeElement[]): this {
    for (const kid of kids) {
      kid.parentElement = this;
      this.children.push(kid);
    }
    return this;
  }

  contains(other: FakeElement): boolean {
    for (let node: FakeElement | null = other; node; node = node.parentElement) {
      if (node === this) return true;
    }
    return false;
  }

  getAttribute(name: string): string | null {
    return this.attrs.has(name) ? this.attrs.get(name)! : null;
  }

  setAttribute(name: string, value: string): void {
    this.attrs.set(name, value);
  }

  removeAttribute(name: string): void {
    this.attrs.delete(name);
  }

  hasAttribute(name: string): boolean {
    return this.attrs.has(name);
  }
}

/**
 * body
 * ├── root
 * │   ├── header
 * │   └── main
 * ├── marked   (aria-hidden="false" já existente)
 * ├── panelA
 * │   ├── inner
 * └── (panelB, quando o caso o pendura)
 */
function tree() {
  const body = new FakeElement('body');
  const header = new FakeElement('header');
  const main = new FakeElement('main');
  const root = new FakeElement('root').append(header, main);
  const marked = new FakeElement('marked');
  marked.setAttribute('aria-hidden', 'false');
  const inner = new FakeElement('inner');
  const panelA = new FakeElement('panelA').append(inner);
  body.append(root, marked, panelA);
  return { body, root, header, main, marked, panelA, inner };
}

let dom: ReturnType<typeof tree>;

beforeEach(() => {
  dom = tree();
  vi.stubGlobal('document', { body: dom.body });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const as = (el: FakeElement) => el as unknown as Element;

describe('hideOthers', () => {
  it('esconde os irmãos de cada ancestral até o body, e não o alvo nem a cadeia dele', () => {
    const restore = hideOthers(as(dom.inner));
    expect(dom.root.getAttribute('aria-hidden')).toBe('true');
    expect(dom.marked.getAttribute('aria-hidden')).toBe('true');
    expect(dom.panelA.hasAttribute('aria-hidden')).toBe(false);
    expect(dom.inner.hasAttribute('aria-hidden')).toBe(false);
    // Filhos de um irmão escondido não são tocados: o ancestral já os esconde.
    expect(dom.header.hasAttribute('aria-hidden')).toBe(false);
    restore();
  });

  it('restaura exatamente: sem atributo volta sem, e o "false" que já existia volta "false"', () => {
    const restore = hideOthers(as(dom.panelA));
    restore();
    expect(dom.root.hasAttribute('aria-hidden')).toBe(false);
    expect(dom.marked.getAttribute('aria-hidden')).toBe('false');
  });

  it('um "true" que já existia continua "true" depois de restaurar', () => {
    dom.root.setAttribute('aria-hidden', 'true');
    const restore = hideOthers(as(dom.panelA));
    restore();
    expect(dom.root.getAttribute('aria-hidden')).toBe('true');
  });

  it('chamar a restauração duas vezes não solta a contagem de outra instância', () => {
    const first = hideOthers(as(dom.panelA));
    const second = hideOthers(as(dom.panelA));
    first();
    first();
    expect(dom.root.getAttribute('aria-hidden')).toBe('true');
    second();
    expect(dom.root.hasAttribute('aria-hidden')).toBe(false);
  });

  it('dois painéis abertos em sequência e fechados FORA de ordem não deixam marca', () => {
    const restoreA = hideOthers(as(dom.panelA));
    const panelB = new FakeElement('panelB');
    dom.body.append(panelB);
    const restoreB = hideOthers(as(panelB));
    // B esconde o painel A, e o resto continua escondido pelos dois.
    expect(dom.panelA.getAttribute('aria-hidden')).toBe('true');

    restoreA();
    // B ainda está aberto: o que ele escondeu continua escondido.
    expect(dom.root.getAttribute('aria-hidden')).toBe('true');
    expect(dom.marked.getAttribute('aria-hidden')).toBe('true');

    restoreB();
    expect(dom.root.hasAttribute('aria-hidden')).toBe(false);
    expect(dom.marked.getAttribute('aria-hidden')).toBe('false');
    expect(dom.panelA.hasAttribute('aria-hidden')).toBe(false);
  });

  it('dois painéis em sequência — abre, fecha, abre, fecha — não deixam marca', () => {
    hideOthers(as(dom.panelA))();
    hideOthers(as(dom.panelA))();
    expect(dom.root.hasAttribute('aria-hidden')).toBe(false);
    expect(dom.marked.getAttribute('aria-hidden')).toBe('false');
  });

  // ─── Região viva e `<script>` ──────────────────────────────────────────────
  //
  // Decisão da dona de 2026-09-17: o item 7 mandava esconder TODO elemento de
  // fora, e com isso um toast de "salvo" ou de erro ficava mudo com o painel
  // modal aberto. Região viva é anunciada sem receber foco, e `aria-hidden`
  // apaga o anúncio. `markOthers` da base-ui e o pacote `aria-hidden` 1.2.6
  // pulam os mesmos elementos.

  it('não esconde região viva nem <script>, e esconde o resto na mesma passada', () => {
    const live = new FakeElement('div');
    live.setAttribute('aria-live', 'polite');
    const script = new FakeElement('script');
    dom.body.append(live, script);

    const restore = hideOthers(as(dom.panelA));
    expect(live.hasAttribute('aria-hidden')).toBe(false);
    expect(script.hasAttribute('aria-hidden')).toBe(false);
    // O contraste, e é ele que dá dentes: exceção larga demais reprova aqui.
    expect(dom.root.getAttribute('aria-hidden')).toBe('true');
    restore();
  });

  it('`aria-live="off"` também é pulado — a exceção é do ATRIBUTO, não do valor', () => {
    const live = new FakeElement('div');
    live.setAttribute('aria-live', 'off');
    dom.body.append(live);

    const restore = hideOthers(as(dom.panelA));
    expect(live.hasAttribute('aria-hidden')).toBe(false);
    restore();
  });

  it.each(['status', 'alert', 'log', 'progressbar', 'marquee', 'timer'])(
    'role="%s" implica região viva e também é pulado',
    (role) => {
      const region = new FakeElement('div');
      region.setAttribute('role', role);
      dom.body.append(region);

      const restore = hideOthers(as(dom.panelA));
      expect(region.hasAttribute('aria-hidden')).toBe(false);
      restore();
    },
  );

  it('papel que NÃO implica região viva continua escondido', () => {
    const region = new FakeElement('div');
    region.setAttribute('role', 'region');
    dom.body.append(region);

    const restore = hideOthers(as(dom.panelA));
    expect(region.getAttribute('aria-hidden')).toBe('true');
    restore();
  });

  it('região viva pulada não entra na contagem: um "false" anterior fica intacto', () => {
    const live = new FakeElement('div');
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('aria-hidden', 'false');
    dom.body.append(live);

    const restore = hideOthers(as(dom.panelA));
    expect(live.getAttribute('aria-hidden')).toBe('false');
    restore();
    expect(live.getAttribute('aria-hidden')).toBe('false');
  });

  it('alvo fora do documento não esconde nada', () => {
    const loose = new FakeElement('loose');
    const restore = hideOthers(as(loose));
    expect(dom.root.hasAttribute('aria-hidden')).toBe(false);
    restore();
  });
});
