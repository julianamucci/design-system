// ─── Aspect Ratio ────────────────────────────────────────────────────────────

export interface AspectRatioOptions {
  /** Numeric ratio expressed as width / height (e.g. 16/9, 4/3, 1). */
  ratio?: number;
  /** Optional child element to place inside the inner container. */
  content?: HTMLElement;
  /** Additional CSS classes to append to the outer wrapper. */
  className?: string;
}

/**
 * Creates a wrapper div that enforces the given aspect ratio via the
 * padding-bottom trick.  The optional `content` element is placed inside an
 * absolutely-positioned inner div so it fills the constrained space exactly.
 */
export function createAspectRatio(options: AspectRatioOptions = {}): HTMLElement {
  const { ratio = 1, content, className } = options;

  const wrapper = document.createElement('div');
  wrapper.className = 'relative w-full';
  wrapper.style.paddingBottom = `${(1 / ratio) * 100}%`;
  if (className) wrapper.classList.add(...className.split(' ').filter(Boolean));

  const inner = document.createElement('div');
  inner.className = 'absolute inset-0';

  if (content) inner.appendChild(content);

  wrapper.appendChild(inner);

  return wrapper;
}
