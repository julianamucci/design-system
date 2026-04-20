// ─── Avatar ──────────────────────────────────────────────────────────────────

export interface AvatarOptions {
  /** Additional CSS classes to append to the root element. */
  className?: string;
}

export interface AvatarImageOptions {
  src: string;
  alt?: string;
  /** Additional CSS classes to append. */
  className?: string;
}

export interface AvatarFallbackOptions {
  /** Text shown when image is absent or fails to load (e.g. initials). */
  text?: string;
  className?: string;
}

export interface AvatarComposedOptions {
  src?: string;
  alt?: string;
  /** Fallback text displayed when the image is absent or fails to load. */
  fallbackText?: string;
  className?: string;
}

export function createAvatarRoot(options: AvatarOptions = {}): HTMLElement {
  const { className } = options;

  const el = document.createElement('span');
  el.className = 'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));

  return el;
}

export function createAvatarImage(options: AvatarImageOptions): HTMLImageElement {
  const { src, alt = '', className } = options;

  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.className = 'aspect-square h-full w-full';
  if (className) img.classList.add(...className.split(' ').filter(Boolean));

  return img;
}

export function createAvatarFallback(options: AvatarFallbackOptions = {}): HTMLElement {
  const { text = '', className } = options;

  const el = document.createElement('span');
  el.className = 'flex h-full w-full items-center justify-center rounded-full bg-muted';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));
  if (text) el.textContent = text;

  return el;
}

/**
 * Convenience factory that composes root + image + fallback.
 * The fallback is hidden while the image loads successfully; if the image
 * fails (or no src is provided), the fallback is revealed automatically.
 */
export function createAvatar(options: AvatarComposedOptions = {}): HTMLElement {
  const { src, alt = '', fallbackText = '', className } = options;

  const root = createAvatarRoot({ className });
  const fallback = createAvatarFallback({ text: fallbackText });

  if (src) {
    const img = createAvatarImage({ src, alt });

    // Hide fallback while image is present and loading.
    fallback.style.display = 'none';

    img.addEventListener('error', () => {
      img.style.display = 'none';
      fallback.style.display = '';
    });

    img.addEventListener('load', () => {
      fallback.style.display = 'none';
    });

    root.appendChild(img);
  }

  root.appendChild(fallback);

  return root;
}
