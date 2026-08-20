import { describe, expect, it } from 'vitest';
import { carouselSnippet, carouselSource, carouselSourceCom } from './carousel.source';

describe('carouselSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const código = carouselSnippet();
    expect(código).toContain("import { createCarousel } from '@/components/ui/carousel';");
    expect(código).toContain('createCarousel({');
    expect(código).not.toContain('data-slot=');
  });

  it('usa o nome acessível canônico, nunca o apelido depreciado', () => {
    const código = carouselSnippet({ ariaLabel: 'Galeria de exemplos' });
    expect(código).toContain("'aria-label': 'Galeria de exemplos'");
    expect(código).not.toMatch(/(^|\W)label:/);
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = carouselSnippet();
    expect(código).not.toContain('orientation');
    expect(código).not.toContain('autoplay');
    expect(código).not.toContain('autoplayInterval');
  });

  it('mostra a orientação e a altura definida do recorte quando a story as usa', () => {
    const código = carouselSnippet({ orientation: 'vertical', contentClass: 'nds-aspect-4-3' });
    expect(código).toContain("orientation: 'vertical'");
    expect(código).toContain("contentClass: 'nds-aspect-4-3'");
  });

  it('só mostra o intervalo quando o autoplay está ligado e o valor difere do padrão', () => {
    expect(carouselSnippet({ autoplayInterval: 5000 })).not.toContain('autoplayInterval');
    expect(carouselSnippet({ autoplay: true, autoplayInterval: 3000 })).not.toContain('autoplayInterval');
    expect(carouselSnippet({ autoplay: true, autoplayInterval: 5000 })).toContain('autoplayInterval: 5000');
  });

  it('constrói os slides com fábricas do design system, sem helper de story', () => {
    const código = carouselSnippet({ slides: 3 });
    expect(código).toContain('const slides = Array.from({ length: 3 }');
    expect(código).toContain('createCard(');
    expect(código).not.toContain('buildSlide');
    expect(código).not.toContain('buildSlides');
  });
});

describe('carouselSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const semArgs = carouselSource('<div data-slot="carousel">', {});
    const comArgs = carouselSource('<div data-slot="carousel">', {
      args: { slides: 8, autoplay: true },
    });
    expect(semArgs).not.toBe(comArgs);
    expect(comArgs).toContain('{ length: 8 }');
    expect(comArgs).toContain('autoplay: true');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(carouselSource('<div data-slot="carousel" role="region">', {})).not.toContain('role="region"');
  });
});

describe('carouselSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = carouselSourceCom({ orientation: 'vertical', slides: 4 });
    const código = transform('', { args: { slides: 9 } });
    expect(código).toContain("orientation: 'vertical'");
    expect(código).toContain('{ length: 4 }');
  });
});
