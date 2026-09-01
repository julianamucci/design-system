// Espécie de linha do CodeBlock — a decisão compartilhada pelas cinco stacks.
//
// Vive na stack de referência porque é lá que o projeto roda `--project unit`;
// o módulo em si é compartilhado e não importa framework nenhum.

import { describe, expect, it } from 'vitest';
import { LABELS_CODE_BLOCK_DEFAULT } from '@shared/primitives/code-block-labels';
import {
  codeLineMarks,
  hasLineKinds,
  type CodeLineKind,
} from '@shared/primitives/code-block-lines';

const labels = LABELS_CODE_BLOCK_DEFAULT;
const marks = (kinds: ReadonlyArray<CodeLineKind> | undefined, total: number) =>
  codeLineMarks(kinds, total, labels);

describe('espécie de linha', () => {
  it('sem espécie nenhuma não há marca — a calha segue numerando', () => {
    expect(marks(undefined, 3)).toEqual([]);
    expect(marks([], 3)).toEqual([]);
    expect(hasLineKinds(undefined)).toBe(false);
    expect(hasLineKinds([])).toBe(false);
    expect(hasLineKinds(['context'])).toBe(true);
  });

  it('adição e remoção têm marca visível E palavra falada', () => {
    // As duas juntas, e é o ponto: a marca cobre quem não separa verde de
    // vermelho, a palavra cobre quem não vê nenhuma das duas. Tinta sozinha é a
    // codificação que a regra 4 da §8 recusa.
    const saida = marks(['added', 'removed'], 2);
    expect(saida[0].mark).toBe('+');
    expect(saida[0].label).toBe(labels.lineAdded);
    expect(saida[1].mark).toBe('−');
    expect(saida[1].label).toBe(labels.lineRemoved);
    for (const item of saida) {
      expect(item.mark.length, item.kind).toBeGreaterThan(0);
      expect(item.label.length, item.kind).toBeGreaterThan(0);
    }
  });

  it('as duas marcas são DIFERENTES entre si', () => {
    const saida = marks(['added', 'removed'], 2);
    expect(saida[0].mark).not.toBe(saida[1].mark);
    expect(saida[0].label).not.toBe(saida[1].label);
  });

  it('o menos é o sinal tipográfico, não o hífen do teclado', () => {
    // Ele casa com a largura do `+` na fonte monoespaçada; o hífen desalinha o
    // par a olho nu.
    expect(marks(['removed'], 1)[0].mark).toBe('−');
    expect(marks(['removed'], 1)[0].mark).not.toBe('-');
  });

  it('contexto não mostra marca nem fala palavra', () => {
    const [item] = marks(['context'], 1);
    expect(item.kind).toBe('context');
    expect(item.mark).toBe('');
    expect(item.label).toBe('');
  });

  it('devolve uma entrada por linha, mesmo com a lista curta ou longa demais', () => {
    expect(marks(['added'], 3)).toHaveLength(3);
    expect(marks(['added', 'removed', 'added', 'added'], 2)).toHaveLength(2);
    // Quem sobra vira contexto: um produtor que erre o comprimento pinta de
    // menos, nunca pinta errado.
    expect(marks(['added'], 3)[2]).toEqual({ kind: 'context', mark: '', label: '' });
  });

  it('valor desconhecido cai em contexto em vez de vazar para a folha', () => {
    const saida = marks(['ruído' as CodeLineKind], 1);
    expect(saida[0].kind).toBe('context');
    expect(saida[0].mark).toBe('');
  });

  it('a palavra vem dos rótulos passados, não de cadeia cravada', () => {
    const outros = { ...labels, lineAdded: 'Line added', lineRemoved: 'Line removed' };
    const saida = codeLineMarks(['added', 'removed'], 2, outros);
    expect(saida[0].label).toBe('Line added');
    expect(saida[1].label).toBe('Line removed');
  });
});
