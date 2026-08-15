// ─── Slider — Vanilla factory standalone ────────────────────────────────────
// Visual: classes .nds-slider-* (standalone).
// Native <input type="range"> sobreposto à track; CSS controla aparência.

// ─── Types ────────────────────────────────────────────────────────────────────

import { cn } from '@/lib/utils';

export type SliderOptions = {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  disabled?: boolean;
  orientation?: 'horizontal' | 'vertical';
  /** Nome acessível da alça. É `role="slider"` sem nome que o leitor de tela não sabe ler. */
  ariaLabel?: string;
  /** Durante o arrasto e a cada tecla — um evento por movimento. */
  onValueChange?: (value: number) => void;
  /**
   * Ao soltar o arrasto ou largar a tecla — um evento por interação.
   *
   * É o `change` do input nativo, que existe exatamente para isto: o `input`
   * dispara a cada pixel e o `change` só quando o valor assenta. É o callback
   * para analytics e submit; usar o contínuo enche o GA4 de um evento por pixel.
   */
  onValueCommitted?: (value: number) => void;
  class?: string;
};

// ─── createSlider ─────────────────────────────────────────────────────────────

export function createSlider(options: SliderOptions = {}): HTMLElement {
  const {
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    orientation = 'horizontal',
    ariaLabel,
    onValueChange,
    onValueCommitted,
  } = options;
  let value = options.value ?? min;
  const vertical = orientation === 'vertical';

  const root = document.createElement('div');
  root.className = cn('nds-slider', options.class);
  root.dataset.slot = 'slider';
  root.dataset.orientation = orientation;

  const track = document.createElement('div');
  track.className = 'nds-slider-track';
  track.dataset.slot = 'slider-track';

  const range = document.createElement('div');
  range.className = 'nds-slider-range';
  range.dataset.slot = 'slider-range';

  const thumb = document.createElement('span');
  thumb.className = 'nds-slider-thumb';
  thumb.dataset.slot = 'slider-thumb';

  // Real range input — handles all interaction natively (sobreposto à track via CSS).
  const nativeInput = document.createElement('input');
  nativeInput.type = 'range';
  nativeInput.min = String(min);
  nativeInput.max = String(max);
  nativeInput.step = String(step);
  nativeInput.value = String(value);
  nativeInput.disabled = disabled;
  if (ariaLabel) nativeInput.setAttribute('aria-label', ariaLabel);
  // `<input type="range">` é horizontal por definição na árvore de
  // acessibilidade; em pé, a orientação precisa ser dita.
  if (vertical) nativeInput.setAttribute('aria-orientation', 'vertical');

  /**
   * Posiciona preenchimento e alça a partir do valor.
   *
   * O `- 0.75rem` é METADE DA ALÇA — ela mede 24px (o alvo de toque da WCAG
   * 2.5.8), e sem descontar a metade o centro dela não cairia sobre a posição
   * do valor. Andou junto com o CSS quando a alça deixou de ser 16px de caixa
   * com área de toque por pseudo-elemento e passou a ter os 24 na caixa real;
   * enquanto era 16, o desconto era 0.5rem. Se a dimensão da alça mudar, este
   * número muda com ela.
   */
  function updateVisuals(v: number): void {
    const pct = max === min ? 0 : ((v - min) / (max - min)) * 100;
    if (vertical) {
      // Em pé o preenchimento cresce de baixo para cima, e a alça anda no
      // mesmo eixo — `left`/`width` posicionariam no eixo errado e deixariam a
      // alça parada no topo com o valor mudando.
      range.style.height = `${pct}%`;
      range.style.bottom = '0';
      thumb.style.bottom = `calc(${pct}% - 0.75rem)`;
    } else {
      range.style.width = `${pct}%`;
      thumb.style.left = `calc(${pct}% - 0.75rem)`;
    }
  }

  updateVisuals(value);

  nativeInput.addEventListener('input', () => {
    value = Number(nativeInput.value);
    updateVisuals(value);
    onValueChange?.(value);
  });

  nativeInput.addEventListener('change', () => {
    onValueCommitted?.(Number(nativeInput.value));
  });

  track.append(range, thumb, nativeInput);
  root.appendChild(track);

  return root;
}
