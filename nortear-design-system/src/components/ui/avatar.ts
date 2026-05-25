// ─── Avatar — Vanilla factories standalone ──────────────────────────────────
//
// Visual: classes .nds-avatar-* (zero Tailwind/basecoat-css).
// Tokens: --muted, --muted-foreground, --background.
//
// API:
//   createAvatar({ src, alt, fallbackText, size })  // composto
//   createAvatarRoot(), createAvatarImage(), createAvatarFallback()  // granular

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface AvatarOptions {
  /** Tamanho preset (sm=24, md=32, lg=40, xl=48, 2xl=64). Default: 'md'. */
  size?: AvatarSize;
  /** Classes adicionais. */
  className?: string;
}

export interface AvatarImageOptions {
  src: string;
  alt?: string;
  className?: string;
}

export interface AvatarFallbackOptions {
  /** Texto curto (1–3 caracteres) — iniciais ou ícone. */
  text?: string;
  className?: string;
}

export interface AvatarComposedOptions {
  src?: string;
  alt?: string;
  fallbackText?: string;
  size?: AvatarSize;
  className?: string;
}

// ─── Factories granulares ────────────────────────────────────────────────────

export function createAvatarRoot(options: AvatarOptions = {}): HTMLElement {
  const { size, className } = options;

  const el = document.createElement('span');
  el.dataset.slot = 'avatar';
  el.className = 'nds-avatar';
  if (size) el.dataset.size = size;
  if (className) el.classList.add(...className.split(' ').filter(Boolean));

  return el;
}

export function createAvatarImage(options: AvatarImageOptions): HTMLImageElement {
  const { src, alt = '', className } = options;

  const img = document.createElement('img');
  img.dataset.slot = 'avatar-image';
  img.src = src;
  img.alt = alt;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.className = 'nds-avatar-image';
  if (className) img.classList.add(...className.split(' ').filter(Boolean));

  return img;
}

export function createAvatarFallback(options: AvatarFallbackOptions = {}): HTMLElement {
  const { text = '', className } = options;

  const el = document.createElement('span');
  el.dataset.slot = 'avatar-fallback';
  el.className = 'nds-avatar-fallback';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));
  if (text) el.textContent = text;

  return el;
}

// ─── Composto: root + image + fallback com reconciliação automática ─────────

export function createAvatar(options: AvatarComposedOptions = {}): HTMLElement {
  const { src, alt = '', fallbackText = '', size, className } = options;

  const root = createAvatarRoot({ size, className });
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

    // Fallback visível por default para SR/tests verem conteúdo durante load.
    img.style.display = 'none';

    img.addEventListener('load', showImage);
    img.addEventListener('error', showFallback);

    if (img.complete) {
      if (img.naturalWidth > 0) showImage();
      else showFallback();
    }

    root.appendChild(img);
  }

  root.appendChild(fallback);

  return root;
}
