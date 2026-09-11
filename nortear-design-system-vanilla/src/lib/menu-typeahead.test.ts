// A busca por digitação dos três menus desta stack, presa sem navegador.
//
// Unitário e não story porque o que diverge entre implementações é a CONTA — de
// onde a procura parte, se as letras se acumulam, quando o acúmulo expira —, e
// ela é pura de propósito. O `menubar` casava uma letra só, sem janela, e a
// story dele digitava uma letra só: nenhuma play distinguia as duas formas.
//
// O acumulador (`createMenuTypeahead`) também é exercitado, com um `document`
// e itens FALSOS: ele só lê `document.activeElement`, `textContent` e chama
// `focus()`, e o relógio falso é o que prova a janela sem esperar um segundo.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TYPEAHEAD_WINDOW_MS,
  createMenuTypeahead,
  findTypeaheadMatch,
  isTypeaheadKey,
} from '@/lib/menu-typeahead';

const keyEvent = (key: string, mods: Partial<Record<'ctrlKey' | 'altKey' | 'metaKey', boolean>> = {}) => ({
  key,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  ...mods,
});

describe('isTypeaheadKey', () => {
  it('aceita um caractere visível, letra, dígito ou acento', () => {
    expect(isTypeaheadKey(keyEvent('a'))).toBe(true);
    expect(isTypeaheadKey(keyEvent('7'))).toBe(true);
    expect(isTypeaheadKey(keyEvent('é'))).toBe(true);
  });

  it('recusa o espaço, que ativa o item, e as teclas nomeadas', () => {
    expect(isTypeaheadKey(keyEvent(' '))).toBe(false);
    expect(isTypeaheadKey(keyEvent('Enter'))).toBe(false);
    expect(isTypeaheadKey(keyEvent('ArrowDown'))).toBe(false);
  });

  it('recusa combinação com modificador, que é atalho', () => {
    expect(isTypeaheadKey(keyEvent('c', { ctrlKey: true }))).toBe(false);
    expect(isTypeaheadKey(keyEvent('c', { altKey: true }))).toBe(false);
    expect(isTypeaheadKey(keyEvent('c', { metaKey: true }))).toBe(false);
  });
});

describe('findTypeaheadMatch', () => {
  const ROTULOS = ['Editar', 'Duplicar', 'Excluir'];

  it('parte do item DEPOIS do atual', () => {
    expect(findTypeaheadMatch(ROTULOS, 0, 'e')).toBe(2);
    expect(findTypeaheadMatch(ROTULOS, 0, 'd')).toBe(1);
  });

  it('dá a volta e termina no próprio item atual', () => {
    expect(findTypeaheadMatch(ROTULOS, 2, 'e')).toBe(0);
    expect(findTypeaheadMatch(['Editar', 'Duplicar'], 0, 'e')).toBe(0);
  });

  it('com o foco fora da roda, começa do primeiro', () => {
    expect(findTypeaheadMatch(ROTULOS, -1, 'e')).toBe(0);
  });

  it('casa a busca acumulada inteira, sem caixa e sem espaço nas pontas', () => {
    expect(findTypeaheadMatch(['  Refazer', 'Recortar'], -1, 'REC')).toBe(1);
  });

  it('sem candidato, devolve -1', () => {
    expect(findTypeaheadMatch(ROTULOS, 0, 'z')).toBe(-1);
    expect(findTypeaheadMatch([], -1, 'a')).toBe(-1);
  });
});

describe('createMenuTypeahead', () => {
  const doc = { activeElement: null as unknown };

  /** Item falso: o rótulo, e um `focus()` que move o `activeElement` do documento falso. */
  function makeItems(labels: string[]): HTMLElement[] {
    return labels.map((textContent) => {
      const item = {
        textContent,
        focus: () => {
          doc.activeElement = item;
        },
      };
      return item as unknown as HTMLElement;
    });
  }

  beforeEach(() => {
    vi.useFakeTimers();
    doc.activeElement = null;
    vi.stubGlobal('document', doc);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('acumula as letras dentro da janela: "rec" acha Recortar, e não Refazer', () => {
    const items = makeItems(['Desfazer', 'Refazer', 'Recortar']);
    const typeahead = createMenuTypeahead();
    expect(typeahead.type('r', items)).toBe(items[1]);
    expect(typeahead.type('e', items)).toBe(items[2]);
    expect(typeahead.type('c', items)).toBe(items[2]);
  });

  it('o acúmulo EXPIRA: passada a janela, a letra vale sozinha de novo', () => {
    const items = makeItems(['Editar', 'Duplicar', 'Excluir']);
    const typeahead = createMenuTypeahead();
    items[0].focus();
    expect(typeahead.type('d', items)).toBe(items[1]);
    vi.advanceTimersByTime(TYPEAHEAD_WINDOW_MS + 1);
    // Sem expirar, a busca seria "dd", que não é começo de rótulo nenhum.
    expect(typeahead.type('d', items)).toBe(items[1]);
    expect(typeahead.type('e', items)).toBe(null);
  });

  it('sem candidato, o foco fica onde estava', () => {
    const items = makeItems(['Novo', 'Abrir']);
    const typeahead = createMenuTypeahead();
    items[0].focus();
    expect(typeahead.type('z', items)).toBe(null);
    expect(doc.activeElement).toBe(items[0]);
  });

  it('reset zera a busca e solta o temporizador', () => {
    const items = makeItems(['Editar', 'Excluir']);
    const typeahead = createMenuTypeahead();
    typeahead.type('x', items);
    typeahead.reset();
    expect(vi.getTimerCount()).toBe(0);
    // Sem o reset, "xe" não acharia nada.
    expect(typeahead.type('e', items)).toBe(items[0]);
  });
});
