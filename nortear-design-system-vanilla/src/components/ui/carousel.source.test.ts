import { describe, expect, it } from 'vitest';
import { carouselSnippet, carouselSource, carouselSourceWith } from './carousel.source';

describe('carouselSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = carouselSnippet();
    expect(code).toContain("import { createCarousel } from '@/components/ui/carousel';");
    expect(code).toContain('createCarousel({');
    expect(code).not.toContain('data-slot=');
  });

  it('usa o nome acessível canônico, nunca o apelido depreciado', () => {
    const code = carouselSnippet({ ariaLabel: 'Galeria de exemplos' });
    expect(code).toContain("'aria-label': 'Galeria de exemplos'");
    expect(code).not.toMatch(/(^|\W)label:/);
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = carouselSnippet();
    expect(code).not.toContain('orientation');
    expect(code).not.toContain('autoplay');
    expect(code).not.toContain('autoplayInterval');
  });

  it('mostra a orientação e a altura definida do recorte quando a story as usa', () => {
    const code = carouselSnippet({ orientation: 'vertical', contentClass: 'nds-aspect-4-3' });
    expect(code).toContain("orientation: 'vertical'");
    expect(code).toContain("contentClass: 'nds-aspect-4-3'");
  });

  it('só mostra o intervalo quando o autoplay está ligado e o valor difere do padrão', () => {
    expect(carouselSnippet({ autoplayInterval: 5000 })).not.toContain('autoplayInterval');
    expect(carouselSnippet({ autoplay: true, autoplayInterval: 3000 })).not.toContain('autoplayInterval');
    expect(carouselSnippet({ autoplay: true, autoplayInterval: 5000 })).toContain('autoplayInterval: 5000');
  });

  it('constrói os slides com o vocabulário do design system, sem helper de story', () => {
    const code = carouselSnippet({ slides: 3 });
    expect(code).toContain('const slides = Array.from({ length: 3 }');
    expect(code).not.toContain('buildSlide');
    expect(code).not.toContain('buildSlides');

    // A moldura é `div` + classe, e NÃO `createCard`. O card declara
    // `background-color` próprio e `card.css` carrega depois de `colors.css`,
    // então o fundo dele apagava `nds-bg-muted-soft` e o slide saía branco.
    // Ensinar o card aqui reproduziria na mão de quem copia o defeito que a
    // dona viu na tela.
    expect(code).not.toContain('createCard(');
    expect(code).toContain("moldura.className = 'nds-aspect-16-9'");
    expect(code).toContain('nds-bg-muted-soft');
  });
});

describe('carouselSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = carouselSource('<div data-slot="carousel">', {});
    const withArgs = carouselSource('<div data-slot="carousel">', {
      args: { slides: 8, autoplay: true },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain('{ length: 8 }');
    expect(withArgs).toContain('autoplay: true');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(carouselSource('<div data-slot="carousel" role="region">', {})).not.toContain('role="region"');
  });
});

describe('carouselSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = carouselSourceWith({ orientation: 'vertical', slides: 4 });
    const code = transform('', { args: { slides: 9 } });
    expect(code).toContain("orientation: 'vertical'");
    expect(code).toContain('{ length: 4 }');
  });
});
