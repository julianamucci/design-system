import { cn } from '@/lib/utils';
import {
  progressPercent,
  progressValueText,
  resolveProgressRange,
  resolveProgressValue,
} from '@shared/primitives/progress-value';
// ─── Progress — Vanilla factory standalone ──────────────────────────────────
//
// Visual: classes .nds-progress + .nds-progress-indicator (standalone).
// Posição do indicador via CSS custom property `--value` — o PERCENTUAL (0–100)
// dentro da faixa, nunca o número cru.
//
// ─── Contrato de valor (bloco canônico) ─────────────────────────────────────
//
// A decisão mora em `docs/shared/primitives/progress-value.ts`, a mesma regra
// que as cinco stacks leem; aqui só se escreve o que ela decide.
//
//   1. FAIXA. `min` nasce em 0 e `max` em 100; máximo menor ou igual ao mínimo
//      vira mínimo + 100 (`resolveProgressRange`). `aria-valuemin` e
//      `aria-valuemax` são escritos SEMPRE, inclusive sem valor.
//   2. VALOR. Omitido, `null` ou não finito (`NaN`) é indeterminado — igual ao
//      `<progress>` nativo. Até 2026-09-14 omitir dava ZERO nesta fábrica, e uma
//      barra vazia parece travada. Fora da faixa, o valor é LIMITADO antes de
//      ser anunciado e antes de ser desenhado (`resolveProgressValue`): número
//      anunciado que a barra não desenha é defeito silencioso.
//   3. TEXTO. `aria-valuetext` é escrito SEMPRE: o percentual arredondado
//      ("42%"), ou "Em andamento" sem valor (`progressValueText`). Quem compõe
//      troca o texto pela opção `getAriaValueText(value, min, max)`, que recebe
//      o valor JÁ limitado — ou `null` no indeterminado.
//
// ─── Indeterminado ──────────────────────────────────────────────────────────
//
// Três coisas mudam juntas, e é o conjunto que faz o estado existir:
//
//   1. `aria-valuenow` NÃO é escrito. Zero mentiria: diria "0%" quando a
//      verdade é "não sei quanto falta".
//   2. `data-indeterminate` vai na raiz — é o gancho do CSS compartilhado, o
//      mesmo atributo que as libs das outras stacks publicam sozinhas.
//   3. `--value` não é escrita; quem desenha o traço correndo é a animação da
//      folha, não uma largura calculada aqui.
//
// ─── Barra que anda ─────────────────────────────────────────────────────────
//
// A fábrica desenha UM valor. Quem faz a barra avançar reescreve, juntos,
// `aria-valuenow`, `aria-valuetext` e `--value` do indicador — deixar o texto
// para trás anunciaria "0%" numa barra em 80%.

export type ProgressVariant = 'success' | 'destructive';

/**
 * Texto anunciado no lugar do número. Recebe o valor já limitado à faixa, ou
 * `null` no indeterminado, e a faixa resolvida.
 */
export type ProgressValueTextFn = (value: number | null, min: number, max: number) => string;

export interface ProgressOptions {
  /**
   * Valor atual, entre `min` e `max`. Omitido, `null` ou não finito ativa o
   * modo indeterminado; fora da faixa, é limitado.
   */
  value?: number | null;
  /** Valor mínimo da escala (default: 0). */
  min?: number;
  /** Valor máximo da escala (default: 100). Menor ou igual a `min` vira `min + 100`. */
  max?: number;
  /** Cor semântica da barra. Ausente, a barra usa o primário. */
  variant?: ProgressVariant;
  /**
   * Nome acessível da barra. Um `role="progressbar"` sem nome é anunciado só
   * como "barra de progresso, 40%" — o leitor de tela diz quanto, nunca de quê.
   *
   * Vive aqui, e não num `setAttribute` depois de construir, porque o contorno
   * desaparece na primeira refatoração sem nada na tela denunciar.
   */
  'aria-label'?: string;
  /**
   * Texto de `aria-valuetext`. Ausente, o percentual arredondado — ou
   * "Em andamento" sem valor.
   */
  getAriaValueText?: ProgressValueTextFn;
  className?: string;
}

export function createProgress(options: ProgressOptions = {}): HTMLElement {
  const { variant, className, getAriaValueText } = options;
  const range = resolveProgressRange(options.min, options.max);
  const value = resolveProgressValue(options.value, range);

  const root = document.createElement('div');
  root.dataset.slot = 'progress';
  root.setAttribute('role', 'progressbar');
  root.setAttribute('aria-valuemin', String(range.min));
  root.setAttribute('aria-valuemax', String(range.max));
  root.className = cn('nds-progress', className);
  if (variant) root.dataset.variant = variant;
  if (options['aria-label']) root.setAttribute('aria-label', options['aria-label']);

  const indicator = document.createElement('div');
  indicator.dataset.slot = 'progress-indicator';
  indicator.className = 'nds-progress-indicator';

  const percent = progressPercent(value, range);
  if (value === null || percent === null) {
    root.dataset.indeterminate = '';
  } else {
    root.setAttribute('aria-valuenow', String(value));
    indicator.style.setProperty('--value', String(percent));
  }

  root.setAttribute(
    'aria-valuetext',
    getAriaValueText ? getAriaValueText(value, range.min, range.max) : progressValueText(value, range),
  );

  root.appendChild(indicator);

  return root;
}
