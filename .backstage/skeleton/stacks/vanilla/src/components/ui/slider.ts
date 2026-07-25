import { cn } from '@/lib/utils';

// ─── Slider classes ───────────────────────────────────────────────────────────

const SLIDER_ROOT = 'relative flex w-full touch-none select-none items-center cursor-pointer';
const SLIDER_TRACK = 'relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20';
const SLIDER_RANGE = 'absolute h-full bg-primary';
const SLIDER_THUMB =
  'block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ' +
  'disabled:pointer-events-none disabled:opacity-50';

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
  root.className = cn(SLIDER_ROOT, options.class);
  root.dataset.slot = 'slider';

  const track = document.createElement('div');
  track.className = SLIDER_TRACK;
  track.dataset.slot = 'slider-track';

  const range = document.createElement('div');
  range.className = SLIDER_RANGE;
  range.dataset.slot = 'slider-range';

  const thumb = document.createElement('span');
  thumb.className = SLIDER_THUMB;
  thumb.dataset.slot = 'slider-thumb';

  // Real range input — handles all interaction natively
  const nativeInput = document.createElement('input');
  nativeInput.type = 'range';
  nativeInput.min = String(min);
  nativeInput.max = String(max);
  nativeInput.step = String(step);
  nativeInput.value = String(value);
  nativeInput.disabled = disabled;
  // Overlay the native input over the visual track so clicks/drags work
  nativeInput.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;margin:0;';
  if (disabled) nativeInput.style.cursor = 'not-allowed';

  function updateVisuals(v: number): void {
    const pct = max === min ? 0 : ((v - min) / (max - min)) * 100;
    range.style.width = `${pct}%`;
    thumb.style.left = `calc(${pct}% - 0.5rem)`;
  }

  // Position thumb absolutely within track
  track.style.position = 'relative';
  thumb.style.position = 'absolute';
  thumb.style.top = '50%';
  thumb.style.transform = 'translateY(-50%)';

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
