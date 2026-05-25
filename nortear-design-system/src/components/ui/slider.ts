// ─── Slider — Vanilla factory standalone ────────────────────────────────────
// Visual: classes .nds-slider-* (zero Tailwind/basecoat-css).
// Native <input type="range"> sobreposto à track; CSS controla aparência.

// ─── Types ────────────────────────────────────────────────────────────────────

export type SliderOptions = {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  disabled?: boolean;
  onValueChange?: (value: number) => void;
  class?: string;
};

// ─── createSlider ─────────────────────────────────────────────────────────────

export function createSlider(options: SliderOptions = {}): HTMLElement {
  const { min = 0, max = 100, step = 1, disabled = false, onValueChange } = options;
  let value = options.value ?? min;

  const root = document.createElement('div');
  root.className = 'nds-slider';
  if (options.class) root.classList.add(...options.class.split(' ').filter(Boolean));
  root.dataset.slot = 'slider';

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

  function updateVisuals(v: number): void {
    const pct = max === min ? 0 : ((v - min) / (max - min)) * 100;
    range.style.width = `${pct}%`;
    thumb.style.left = `calc(${pct}% - 0.5rem)`;
  }

  updateVisuals(value);

  nativeInput.addEventListener('input', () => {
    value = Number(nativeInput.value);
    updateVisuals(value);
    onValueChange?.(value);
  });

  track.append(range, thumb, nativeInput);
  root.appendChild(track);

  return root;
}
