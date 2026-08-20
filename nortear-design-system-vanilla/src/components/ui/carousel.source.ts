// Snippet do painel Code do Carousel — ver `@/lib/story-source`.

import {
  chamada,
  importar,
  montar,
  opcoes,
  snippet,
  texto,
  type SourceTransform,
} from '@/lib/story-source';
import type { CarouselOrientation } from './carousel';

/** O que a story usa da `CarouselOptions` e que o snippet precisa mostrar. */
export type CarouselSnippetOptions = {
  slides?: number;
  orientation?: CarouselOrientation;
  autoplay?: boolean;
  autoplayInterval?: number;
  /** Nome acessível — canônico, não o apelido `label`. */
  ariaLabel?: string;
  contentClass?: string;
  slideClass?: string;
  /** Corpo do callback de mudança de slide, quando a story o exercita. */
  onIndexChange?: string;
};

/**
 * A chamada real de `createCarousel` com as opções da story.
 *
 * Os slides são elementos que quem consome constrói — a fábrica não os inventa.
 * O snippet monta os dele com `createCard`, que é design system, e não com um
 * `buildSlide` que só existe dentro do arquivo de story.
 */
export function carouselSnippet(o: CarouselSnippetOptions = {}): string {
  const total = o.slides ?? 5;
  const linhas = opcoes([
    ['items', 'slides'],
    ['aria-label', texto(o.ariaLabel ?? 'Galeria de exemplos')],
    ['orientation', o.orientation && o.orientation !== 'horizontal' ? texto(o.orientation) : undefined],
    ['contentClass', o.contentClass ? texto(o.contentClass) : undefined],
    ['slideClass', o.slideClass ? texto(o.slideClass) : undefined],
    ['autoplay', o.autoplay ? 'true' : undefined],
    ['autoplayInterval', o.autoplay && o.autoplayInterval && o.autoplayInterval !== 3000 ? String(o.autoplayInterval) : undefined],
    ['onIndexChange', o.onIndexChange],
  ]);

  return snippet(
    [
      importar('carousel', 'createCarousel'),
      importar('card', 'createCard', 'createCardContent'),
    ].join('\n'),
    `const slides = Array.from({ length: ${total} }, (_, i) => {
  const card = createCard({ className: 'nds-w-full nds-cluster nds-aspect-16-9 nds-bg-muted-soft' });
  const conteudo = createCardContent({ className: 'nds-cluster' });
  conteudo.textContent = \`Slide \${i + 1}\`;
  card.appendChild(conteudo);
  return card;
});`,
    `const carrossel = ${chamada('createCarousel', linhas)};`,
    montar('carrossel'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai nos padrões da fábrica, que é
 * exatamente o uso canônico do componente.
 */
export const carouselSource: SourceTransform<CarouselSnippetOptions> = (_gerado, ctx) =>
  carouselSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function carouselSourceCom(fixas: CarouselSnippetOptions): SourceTransform<CarouselSnippetOptions> {
  return (_gerado, ctx) => carouselSnippet({ ...ctx.args, ...fixas });
}
