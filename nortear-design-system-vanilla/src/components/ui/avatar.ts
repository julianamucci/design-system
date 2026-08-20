// ─── Avatar — Vanilla factories standalone ──────────────────────────────────
//
// Visual: classes .nds-avatar-* (standalone).
// Tokens: --muted, --muted-foreground, --background.
//
// API:
//   createAvatar({ src, alt, fallbackText, size })  // composto
//   createAvatarRoot(), createAvatarImage(), createAvatarFallback()  // granular

import { cn } from '@/lib/utils';

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
  /**
   * Atraso, em ms, antes de mostrar o fallback. Evita o piscar das iniciais em
   * imagem que carrega rápido. As outras stacks recebem isto da lib headless;
   * aqui faltava, e a prop era documentada nas quatro.
   */
  delayMs?: number;
  className?: string;
}

// ─── Factories granulares ────────────────────────────────────────────────────

export function createAvatarRoot(options: AvatarOptions = {}): HTMLElement {
  const { size, className } = options;

  const el = document.createElement('span');
  el.dataset.slot = 'avatar';
  el.className = cn('nds-avatar', className);
  if (size) el.dataset.size = size;

  return el;
}

export function createAvatarImage(options: AvatarImageOptions): HTMLImageElement {
  const { src, alt = '', className } = options;

  const img = document.createElement('img');
  img.dataset.slot = 'avatar-image';
  img.src = src;
  img.alt = alt;
  // Sem `loading="lazy"`: o composto esconde a imagem com display:none até o
  // load, e imagem sem caixa nunca entra em viewport — o carregamento adiado
  // não disparava nunca e o avatar ficava eternamente nas iniciais. Foto de
  // 24 a 64px não é o que pesa numa página; a correção é mais barata que o
  // adiamento.
  img.decoding = 'async';
  img.className = cn('nds-avatar-image', className);

  return img;
}

export function createAvatarFallback(options: AvatarFallbackOptions = {}): HTMLElement {
  const { text = '', className } = options;

  const el = document.createElement('span');
  el.dataset.slot = 'avatar-fallback';
  el.className = cn('nds-avatar-fallback', className);
  if (text) el.textContent = text;

  return el;
}

// ─── Grupo, contador e badge de status ──────────────────────────────────────
//
// As três classes existem no CSS compartilhado desde a migração `.nds-*` e as
// outras stacks já expõem os componentes. Aqui não havia factory: cada story e
// cada demo remontava o mesmo markup à mão, com classe do Tailwind que saiu do
// projeto — o ponto do status renderizava sem tamanho e sem cor.

export interface AvatarGroupOptions {
  /** Nome acessível do grupo. Sem ele o grupo é anônimo. */
  'aria-label'?: string;
  /** @deprecated Apelido de `aria-label`. */
  label?: string;
  className?: string;
}

export interface AvatarGroupCountOptions {
  /** Texto do excedente, no formato `+N`. */
  text?: string;
  className?: string;
}

export interface AvatarBadgeOptions {
  /**
   * Nome acessível do indicador. Um ponto colorido não diz nada sozinho —
   * sem isto o estado só existe para quem enxerga.
   */
  'aria-label'?: string;
  /** @deprecated Apelido de `aria-label`. */
  label?: string;
  className?: string;
}

/** Fila de avatares sobrepostos. O recuo e a borda vêm de `.nds-avatar-group`. */
export function createAvatarGroup(options: AvatarGroupOptions = {}): HTMLElement {
  const { className } = options;
  // `label` continua aceito como apelido do nome acessível; o canônico vence.
  const label = options['aria-label'] ?? options.label;

  const el = document.createElement('div');
  el.dataset.slot = 'avatar-group';
  el.className = cn('nds-avatar-group', className);
  if (label) {
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', label);
  }

  return el;
}

/** Contador do excedente (`+3`), último item da fila. */
export function createAvatarGroupCount(options: AvatarGroupCountOptions = {}): HTMLElement {
  const { text = '', className } = options;

  const el = document.createElement('div');
  el.dataset.slot = 'avatar-group-count';
  el.className = cn('nds-avatar-group-count', className);
  if (text) el.textContent = text;

  return el;
}

/**
 * Ponto de status no canto do avatar. É FILHO do root: o CSS o posiciona por
 * `position: absolute` contra o `.nds-avatar`, que já é `relative`, e as regras
 * de tamanho (`[data-size]`) são descendentes — o badge acompanha o diâmetro
 * sem wrapper nenhum.
 *
 * `role="img"` e não `role="status"`: status é live region, e anunciar de novo
 * a cada renderização um ponto que não muda só atrapalha quem ouve.
 */
export function createAvatarBadge(options: AvatarBadgeOptions = {}): HTMLElement {
  const { className } = options;
  // `label` continua aceito como apelido do nome acessível; o canônico vence.
  const label = options['aria-label'] ?? options.label;

  const el = document.createElement('span');
  el.dataset.slot = 'avatar-badge';
  el.className = cn('nds-avatar-badge', className);
  if (label) {
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', label);
  } else {
    el.setAttribute('aria-hidden', 'true');
  }

  return el;
}

// ─── Composto: root + image + fallback com reconciliação automática ─────────

export function createAvatar(options: AvatarComposedOptions = {}): HTMLElement {
  const { src, alt = '', fallbackText = '', size, delayMs, className } = options;

  const root = createAvatarRoot({ size, className });
  const fallback = createAvatarFallback({ text: fallbackText });

  if (src) {
    const img = createAvatarImage({ src, alt });
    let espera: number | undefined;

    const showImage = () => {
      window.clearTimeout(espera);
      img.style.display = '';
      fallback.style.display = 'none';
    };
    const showFallback = () => {
      img.style.display = 'none';
      // Com atraso pendente, quem revela é o temporizador: um 404 rápido não
      // pode furar o prazo, senão o piscar que o atraso existe para evitar
      // volta pelo caminho do erro. É o que as libs das outras stacks fazem.
      if (espera === undefined) fallback.style.display = '';
    };

    // Fallback visível por default para SR/tests verem conteúdo durante load.
    img.style.display = 'none';

    // Com atraso, o avatar começa vazio: as iniciais só entram se o load passar
    // do prazo. Sem ele, aparecem na hora — que é o comportamento de sempre.
    if (delayMs && delayMs > 0) {
      fallback.style.display = 'none';
      espera = window.setTimeout(() => {
        if (img.style.display === 'none') fallback.style.display = '';
      }, delayMs);
    }

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
