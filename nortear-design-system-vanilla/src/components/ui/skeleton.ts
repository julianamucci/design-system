import { cn } from '@/lib/utils';
// ─── Skeleton — Vanilla factory standalone ──────────────────────────────────
//
// Visual: classe .nds-skeleton (standalone).
//
// A caixa NÃO vem de style inline. `data-shape` e `data-width` seguem a mesma
// convenção de `data-spacing` e `data-size` do resto do sistema e mantêm a
// folha de estilo como única dona das medidas — é o que o docs/shared/styles/
// nds/skeleton.css documenta, e o que faz o esqueleto crescer junto quando a
// pessoa aumenta a fonte do navegador (guideline 12, WCAG 1.4.4).
//
// `aria-hidden` sai marcado de fábrica: o esqueleto é ruído para leitor de
// tela. Quem anuncia o carregamento é a região que o contém — e ela é peça
// desta stack: `createSkeletonRegion`, no fim deste arquivo.

export type SkeletonShape = 'text' | 'heading' | 'avatar' | 'fill';
export type SkeletonWidth = 'full' | '3-4' | '2-3' | '1-2' | '1-3';
export type SkeletonSize = 'sm' | 'lg';

export interface SkeletonOptions {
  /** Classes adicionais (utilitárias .nds-*). */
  className?: string;
  /** Forma do placeholder — decide a caixa que ele desenha. */
  shape?: SkeletonShape;
  /** Fração da largura do container. */
  width?: SkeletonWidth;
  /** Medida do avatar na escada `--size-*`. Só vale com `shape: 'avatar'`. */
  size?: SkeletonSize;
}

export function createSkeleton(options: SkeletonOptions = {}): HTMLElement {
  const { className, shape, width, size } = options;

  const el = document.createElement('div');
  el.dataset.slot = 'skeleton';
  el.setAttribute('aria-hidden', 'true');
  el.className = cn('nds-skeleton', className);
  if (shape) el.dataset.shape = shape;
  if (width) el.dataset.width = width;
  if (size) el.dataset.size = size;

  return el;
}

// ─── createSkeletonRegion ───────────────────────────────────────────────────
//
// A espera é anunciada pela REGIÃO, não pelo esqueleto — e desde 2026-09-13,
// por decisão da dona, a região é PEÇA. Antes as cinco docs pages a montavam à
// mão e tinham divergido em cinco formas (no Svelte, a lista da demonstração
// ficou sem `role="status"`): regra que cada consumidor executa por conta é
// regra que se perde no quinto consumidor.
//
// O trio é indivisível e vem escrito de fábrica:
//   · `role="status"` — `aria-busy` sozinho num `div` sem papel não é anunciado;
//   · `aria-busy="true"` — é o estado, e virá-lo para `false` é o que dispara o
//     anúncio de "pronto";
//   · `aria-label` — nome em elemento sem papel é atributo proibido, e o axe o
//     acusa em `aria-prohibited-attr`.
//
// Uma região por BLOCO, nunca por peça: cinco itens de três esqueletos seriam
// quinze avisos repetindo o mesmo.
//
// A peça NÃO tem CSS própria de propósito — o esqueleto é que desenha. Quem
// compõe passa `nds-stack`, `nds-grid` ou `nds-cluster` pela opção `class`, e os
// atributos que essas classes leem (`data-spacing`, `data-align`) ficam com
// quem compõe também.

export interface SkeletonRegionOptions {
  /**
   * Nome acessível da região — descreve o CONTEÚDO que está carregando
   * ("Carregando lista de pedidos"), não o esqueleto. Obrigatório: é opção da
   * fábrica e não retoque posterior, porque quem escreve o atributo depois
   * perde na próxima chamada que reconstrói a peça.
   */
  label: string;
  /** Peças que a região embrulha, na ordem em que entram. */
  children?: HTMLElement | HTMLElement[];
  /** Classes de layout e utilitárias `.nds-*`. A região não traz nenhuma. */
  class?: string;
}

export function createSkeletonRegion(options: SkeletonRegionOptions): HTMLElement {
  const { label, children, class: className } = options;

  const el = document.createElement('div');
  el.dataset.slot = 'skeleton-region';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-busy', 'true');
  el.setAttribute('aria-label', label);
  if (className) el.className = className;
  if (children) el.append(...(Array.isArray(children) ? children : [children]));

  return el;
}
