// Snippet do painel Code do Carousel — ver `@/lib/story-source`.

import {
  chamada,
  importing,
  montar,
  options,
  snippet,
  text,
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
 *
 * A moldura é `div` + classe, e NÃO `createCard`. O card declara
 * `background-color` próprio, e `card.css` é importado depois de `colors.css`
 * no `index.css`: mesma especificidade, o posterior vence, e o fundo do card
 * apagava `nds-bg-muted-soft`. O snippet ensinava o slide branco que a dona viu
 * na tela — copiar daqui reproduzia o defeito.
 */
export function carouselSnippet(o: CarouselSnippetOptions = {}): string {
  const total = o.slides ?? 5;
  const lines = options([
    ['items', 'slides'],
    ['aria-label', text(o.ariaLabel ?? 'Galeria de exemplos')],
    ['orientation', o.orientation && o.orientation !== 'horizontal' ? text(o.orientation) : undefined],
    ['contentClass', o.contentClass ? text(o.contentClass) : undefined],
    ['slideClass', o.slideClass ? text(o.slideClass) : undefined],
    ['autoplay', o.autoplay ? 'true' : undefined],
    ['autoplayInterval', o.autoplay && o.autoplayInterval && o.autoplayInterval !== 3000 ? String(o.autoplayInterval) : undefined],
    ['onIndexChange', o.onIndexChange],
  ]);

  return snippet(
    [
      importing('carousel', 'createCarousel'),
    ].join('\n'),
    `const slides = Array.from({ length: ${total} }, (_, i) => {
  const moldura = document.createElement('div');
  moldura.className = 'nds-aspect-16-9';

  const caixa = document.createElement('div');
  caixa.className = 'nds-cluster nds-h-full nds-rounded-lg nds-bg-muted-soft';
  caixa.dataset.align = 'center';
  caixa.dataset.justify = 'center';
  caixa.textContent = \`Slide \${i + 1}\`;

  moldura.appendChild(caixa);
  return moldura;
});`,
    `const carrossel = ${chamada('createCarousel', lines)};`,
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
export function carouselSourceWith(fixas: CarouselSnippetOptions): SourceTransform<CarouselSnippetOptions> {
  return (_gerado, ctx) => carouselSnippet({ ...ctx.args, ...fixas });
}
