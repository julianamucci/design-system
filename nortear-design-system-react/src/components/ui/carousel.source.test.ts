import { describe, expect, it } from 'vitest';
import {
  carouselAutoplaySource,
  carouselWithDotsSource,
  carouselGaleriaSource,
  carouselItemUnicoSource,
  carouselSource,
  carouselLastSlideSource,
  carouselMultipleItemsSource,
  carouselVerticalSource,
} from './carousel.source';

const ALL = [
  carouselSource,
  carouselVerticalSource,
  carouselItemUnicoSource,
  carouselMultipleItemsSource,
  carouselAutoplaySource,
  carouselLastSlideSource,
  carouselGaleriaSource,
  carouselWithDotsSource,
];

describe('carouselSource', () => {
  it('ensina a importação do design system, com as cinco peças do conjunto', () => {
    const output = carouselSource();
    expect(output).toContain('} from "@/components/ui/carousel";');
    for (const part of [
      'Carousel',
      'CarouselContent',
      'CarouselItem',
      'CarouselNext',
      'CarouselPrevious',
    ]) {
      expect(output).toContain(`  ${part},`);
    }
  });

  it('escreve o miolo do slide por extenso — o andaime das stories não existe fora delas', () => {
    const output = carouselSource();
    // Era isto que o painel imprimia antes: uma peça exportada só pelo módulo
    // de apoio das stories, que falhava ao colar.
    expect(output).not.toContain('SlideCard');
    expect(output).toContain('<div className="nds-aspect-16-9">');
    expect(output).toContain('Slide {numero}');
  });

  it('a região se anuncia com nome próprio', () => {
    // Sem nome acessível o leitor de tela diz "carrossel" sem dizer de quê, e a
    // região deixa de ser marco de navegação.
    expect(carouselSource()).toContain('aria-label="Galeria de exemplos"');
  });

  it('as duas setas carregam nome — o chevron sozinho não diz para onde leva', () => {
    const output = carouselSource();
    expect(output).toContain('<CarouselPrevious aria-label="Item anterior" />');
    expect(output).toContain('<CarouselNext aria-label="Próximo item" />');
  });

  it('no eixo horizontal o eixo não é escrito — é o padrão do componente', () => {
    const output = carouselSource(undefined, { args: { orientation: 'horizontal' } });
    expect(output).not.toContain('orientation=');
    expect(output).toContain('className="nds-w-md"');
  });

  it('no eixo vertical o trilho ganha altura DEFINIDA, e por classe de proporção', () => {
    const output = carouselSource(undefined, { args: { orientation: 'vertical' } });
    expect(output).toContain('orientation="vertical"');
    // Sem altura definida a base `flex: 0 0 100%` do slide não tem contra o que
    // resolver: o carrossel cresce em vez de recortar.
    expect(output).toContain('<CarouselContent className="nds-aspect-4-3">');
    expect(output).toContain('className="nds-basis-full"');
    // E a medida nunca vem de `style`, que escaparia do tema e da densidade.
    expect(output).not.toContain('style=');
    expect(output).not.toContain('height:');
  });

  it('a variante vertical repete exatamente o eixo vertical do meta', () => {
    expect(carouselVerticalSource()).toBe(
      carouselSource(undefined, { args: { orientation: 'vertical' } }),
    );
  });

  it('não inventa eixo fora da união', () => {
    const output = carouselSource(undefined, { args: { orientation: 'diagonal' as never } });
    expect(output).not.toContain('diagonal');
  });
});

describe('configurações', () => {
  it('um item por vez: a base de largura mora no ITEM', () => {
    const output = carouselItemUnicoSource();
    expect(output).toContain('<CarouselItem key={numero} className="nds-basis-full">');
  });

  it('vários itens: a base é responsiva, sem media query autoral', () => {
    const output = carouselMultipleItemsSource();
    expect(output).toContain('nds-md-basis-half nds-lg-basis-third');
    expect(output).toContain('const slides = [1, 2, 3, 4, 5, 6];');
  });

  it('o avanço automático vem de plugin do motor, não de prop do componente', () => {
    const output = carouselAutoplaySource();
    expect(output).toContain('import Autoplay from "embla-carousel-autoplay";');
    expect(output).toContain('plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}');
    // Repetição ligada mantém as setas vivas nos extremos: junto com a entrega
    // do controle na interação, é o que a WCAG 2.2.2 pede.
    expect(output).toContain('opts={{ loop: true }}');
  });

  it('o último slide é escolha do motor, e o extremo é calculado pelo componente', () => {
    const output = carouselLastSlideSource();
    expect(output).toContain('opts={{ startIndex: slides.length - 1 }}');
    // Nenhum estado autoral desabilita a seta: quem calcula os extremos é o
    // componente.
    expect(output).not.toContain('disabled');
  });
});

describe('composições', () => {
  it('na galeria a imagem É o conteúdo, então cada uma tem alternativa própria', () => {
    const output = carouselGaleriaSource();
    expect(output).toContain('import { Card, CardContent } from "@/components/ui/card";');
    expect(output).toContain('alt={foto.alt}');
    // Três textos alternativos distintos: repetir o mesmo equivale a não ter.
    const alts = [...output.matchAll(/alt: "([^"]+)"/g)].map(([, text]) => text);
    expect(alts.length).toBe(3);
    expect(new Set(alts).size).toBe(3);
  });

  it('a paginação se monta sobre a instância entregue em setApi', () => {
    const output = carouselWithDotsSource();
    expect(output).toContain('import { useEffect, useState } from "react";');
    expect(output).toContain('type CarouselApi,');
    expect(output).toContain('<Carousel setApi={setApi}');
    expect(output).toContain('api.selectedScrollSnap()');
    expect(output).toContain('api?.scrollTo(i)');
  });

  it('o ponto é botão comum, com posição e total no nome', () => {
    const output = carouselWithDotsSource();
    expect(output).toContain('type="button"');
    expect(output).toContain('className="nds-carousel-dot"');
    // "2" sozinho não diz para onde leva.
    expect(output).toContain('Ir para o slide ${numero} de ${slides.length}');
    // O rótulo visível é um PEDAÇO do nome acessível (WCAG 2.5.3).
    expect(output).toContain('<span className="nds-carousel-dot-label">Slide {numero}</span>');
    // Nada de `role="tab"`: a paginação não comanda painel nenhum.
    expect(output).not.toContain('role="tab"');
  });

  it('o ponto inativo NÃO carrega aria-current — a string "false" casaria com presença', () => {
    const output = carouselWithDotsSource();
    expect(output).toContain('{...(i === atual ? { "aria-current": "true" as const } : {})}');
    expect(output).not.toContain('aria-current="false"');
    expect(output).not.toContain('aria-current={false}');
  });
});

describe('nenhum snippet ensina o andaime da story', () => {
  it('todos falam só do design system e das dependências reais', () => {
    for (const fn of ALL) {
      const output = fn();
      expect(output).not.toContain('fixtures');
      expect(output).not.toContain('SlideCard');
      expect(output).not.toContain('visivelNoViewport');
      expect(output).toContain('@/components/ui/carousel');
    }
  });
});
