/**
 * Regra do valor do Progress — a mesma nas cinco stacks.
 *
 * Existe porque cada lib decidia sozinha, e as cinco divergiam em três pontos
 * medidos em 2026-09-13 e decididos pela dona em 2026-09-14:
 *
 *  1. **Omitir o valor.** A `@base-ui/react` e o `@radix-ng` davam indeterminado;
 *     a `reka-ui`, a `bits-ui` e a fábrica do vanilla davam ZERO. Duas telas
 *     idênticas com significados opostos — uma barra vazia que parece travada.
 *     A regra segue o HTML nativo: `<progress>` sem `value` é indeterminado, e o
 *     ARIA diz o mesmo pela ausência de `aria-valuenow`. Ausente, `null` e valor
 *     não finito (`NaN`, `Infinity`) são indeterminado.
 *  2. **Fora da faixa.** O valor é limitado ao mínimo e ao máximo antes de ser
 *     anunciado e antes de ser desenhado — um número anunciado que a barra não
 *     desenha é o defeito silencioso que o PRD registra na D5.
 *  3. **O texto anunciado.** Duas libs escreviam `aria-valuetext` sozinhas, com a
 *     frase de indeterminado em inglês; uma só se quem compunha pedisse; duas
 *     nunca. As cinco passam a anunciar o percentual arredondado, ou
 *     "Em andamento" sem valor.
 *
 * Função pura: decide, não age. Nenhuma recebe elemento — quem escreve atributo
 * e `--value` é cada stack, no idioma dela.
 */

/** O que o leitor de tela ouve quando não há valor. */
export const PROGRESS_INDETERMINATE_TEXT = 'Em andamento';

export interface ProgressRange {
  min: number;
  max: number;
}

/**
 * Mínimo e máximo usáveis. Ausente, o mínimo é 0 e o máximo é 100; máximo menor
 * ou igual ao mínimo é corrigido para mínimo + 100, porque a divisão do
 * percentual não pode ser por zero nem negativa.
 */
export function resolveProgressRange(min?: number | null, max?: number | null): ProgressRange {
  const lo = typeof min === 'number' && Number.isFinite(min) ? min : 0;
  const hi = typeof max === 'number' && Number.isFinite(max) ? max : 100;
  return { min: lo, max: hi > lo ? hi : lo + 100 };
}

/**
 * O valor que a barra anuncia e desenha: limitado à faixa, ou `null` —
 * indeterminado — quando ausente, nulo ou não finito.
 */
export function resolveProgressValue(value: unknown, range: ProgressRange): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.min(Math.max(value, range.min), range.max);
}

/** Percentual (0–100) de um valor JÁ resolvido; `null` no indeterminado. */
export function progressPercent(value: number | null, range: ProgressRange): number | null {
  if (value === null) return null;
  return ((value - range.min) / (range.max - range.min)) * 100;
}

/** O texto de `aria-valuetext` por padrão: "42%", ou "Em andamento" sem valor. */
export function progressValueText(value: number | null, range: ProgressRange): string {
  const percent = progressPercent(value, range);
  return percent === null ? PROGRESS_INDETERMINATE_TEXT : `${Math.round(percent)}%`;
}
