// Regra do valor do Progress. O módulo é compartilhado
// (`docs/shared/primitives/progress-value.ts`) e as cinco stacks o leem; o teste
// mora aqui, como o do `token-budget`, porque é função pura e o projeto unit do
// vanilla é o que roda sem navegador.
import { describe, expect, it } from 'vitest';
import {
  PROGRESS_INDETERMINATE_TEXT,
  progressPercent,
  progressValueText,
  resolveProgressRange,
  resolveProgressValue,
} from '@shared/primitives/progress-value';

const DEFAULT_RANGE = resolveProgressRange();

describe('resolveProgressRange', () => {
  it('sem nada, a faixa é 0–100', () => {
    expect(DEFAULT_RANGE).toEqual({ min: 0, max: 100 });
  });

  it('máximo menor ou igual ao mínimo vira mínimo + 100', () => {
    expect(resolveProgressRange(10, 10)).toEqual({ min: 10, max: 110 });
    expect(resolveProgressRange(50, 20)).toEqual({ min: 50, max: 150 });
  });

  it('valor não finito na faixa cai no padrão', () => {
    expect(resolveProgressRange(Number.NaN, Number.POSITIVE_INFINITY)).toEqual({ min: 0, max: 100 });
  });
});

describe('resolveProgressValue', () => {
  it('omitir, null e não finito são indeterminado — nunca zero', () => {
    expect(resolveProgressValue(undefined, DEFAULT_RANGE)).toBeNull();
    expect(resolveProgressValue(null, DEFAULT_RANGE)).toBeNull();
    expect(resolveProgressValue(Number.NaN, DEFAULT_RANGE)).toBeNull();
    expect(resolveProgressValue(Number.POSITIVE_INFINITY, DEFAULT_RANGE)).toBeNull();
  });

  it('zero é valor, não indeterminado', () => {
    expect(resolveProgressValue(0, DEFAULT_RANGE)).toBe(0);
  });

  it('fora da faixa é limitado nas duas pontas', () => {
    expect(resolveProgressValue(140, DEFAULT_RANGE)).toBe(100);
    expect(resolveProgressValue(-20, DEFAULT_RANGE)).toBe(0);
    expect(resolveProgressValue(5, resolveProgressRange(10, 20))).toBe(10);
  });
});

describe('progressPercent', () => {
  it('é a proporção dentro da faixa, não o número cru', () => {
    expect(progressPercent(15, resolveProgressRange(10, 20))).toBe(50);
    expect(progressPercent(42, DEFAULT_RANGE)).toBe(42);
  });

  it('indeterminado não tem percentual', () => {
    expect(progressPercent(null, DEFAULT_RANGE)).toBeNull();
  });
});

describe('progressValueText', () => {
  it('anuncia o percentual arredondado', () => {
    expect(progressValueText(42.4, DEFAULT_RANGE)).toBe('42%');
    expect(progressValueText(15, resolveProgressRange(10, 20))).toBe('50%');
    expect(progressValueText(0, DEFAULT_RANGE)).toBe('0%');
  });

  it('sem valor, anuncia que está em andamento', () => {
    expect(progressValueText(null, DEFAULT_RANGE)).toBe(PROGRESS_INDETERMINATE_TEXT);
    expect(PROGRESS_INDETERMINATE_TEXT).toBe('Em andamento');
  });
});
