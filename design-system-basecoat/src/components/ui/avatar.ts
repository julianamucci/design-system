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
  // PATCH: bugfix — object-cover evita distorção de imagens não-quadradas em container circular (ver PATCHES.md#avatar-object-cover)
  img.className = 'aspect-square h-full w-full object-cover';
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

    const showImage = () => {
      img.style.display = '';
      fallback.style.display = 'none';
    };
    const showFallback = () => {
      img.style.display = 'none';
      fallback.style.display = '';
    };

    // Fallback is visible by default so screen readers and tests see content
    // even if the image is still loading or fails.
    img.style.display = 'none';

    img.addEventListener('load', showImage);
    img.addEventListener('error', showFallback);

    // If the browser resolved the image synchronously (cached) before listeners
    // were attached, reconcile state now.
    if (img.complete) {
      if (img.naturalWidth > 0) showImage();
      else showFallback();
    }

    root.appendChild(img);
  }

  root.appendChild(fallback);

  return root;
}
