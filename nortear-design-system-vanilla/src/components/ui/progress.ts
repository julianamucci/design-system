import { cn } from '@/lib/utils';
// ─── Progress — Vanilla factory standalone ──────────────────────────────────
//
// Visual: classes .nds-progress + .nds-progress-indicator (standalone).
// Posição do indicador via CSS custom property `--value` (0–100).
//
// ─── Indeterminado ──────────────────────────────────────────────────────────
//
// `value: null` é o modo sem estimativa. Três coisas mudam juntas, e é o
// conjunto que faz o estado existir:
//
//   1. `aria-valuenow` NÃO é escrito. Zero mentiria: diria "0%" quando a
//      verdade é "não sei quanto falta".
//   2. `data-indeterminate` vai na raiz — é o gancho do CSS compartilhado, o
//      mesmo atributo que as libs das outras stacks publicam sozinhas.
//   3. `--value` não é escrita; quem desenha o traço correndo é a animação da
//      folha, não uma largura calculada aqui.
//
// Antes disso a factory não aceitava `null` e as stories fingiam o estado à
// mão — removendo o atributo e acrescentando uma classe que não existe em CSS
// nenhum. O resultado era uma barra vazia e parada.

export type ProgressVariant = 'success' | 'destructive';

export interface ProgressOptions {
  /** Valor atual (0–max). `null` ativa o modo indeterminado. */
  value?: number | null;
  /** Valor máximo (default: 100). */
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
  className?: string;
}

export function createProgress(options: ProgressOptions = {}): HTMLElement {
  const { value = 0, max = 100, variant, className } = options;

  const root = document.createElement('div');
  root.dataset.slot = 'progress';
  root.setAttribute('role', 'progressbar');
  root.setAttribute('aria-valuemin', '0');
  root.setAttribute('aria-valuemax', String(max));
  root.className = cn('nds-progress', className);
  if (variant) root.dataset.variant = variant;
  if (options['aria-label']) root.setAttribute('aria-label', options['aria-label']);

  const indicator = document.createElement('div');
  indicator.dataset.slot = 'progress-indicator';
  indicator.className = 'nds-progress-indicator';

  if (value == null) {
    root.dataset.indeterminate = '';
  } else {
    const clampedValue = Math.min(Math.max(value, 0), max);
    const percentage = max > 0 ? (clampedValue / max) * 100 : 0;
    root.setAttribute('aria-valuenow', String(clampedValue));
    indicator.style.setProperty('--value', String(percentage));
  }

  root.appendChild(indicator);

  return root;
}
