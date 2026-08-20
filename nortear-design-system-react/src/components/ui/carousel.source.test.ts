import { describe, expect, it } from 'vitest';
import {
  carouselAutoplaySource,
  carouselComDotsSource,
  carouselGaleriaSource,
  carouselItemUnicoSource,
  carouselSource,
  carouselUltimoSlideSource,
  carouselVariosItensSource,
  carouselVerticalSource,
} from './carousel.source';

const TODAS = [
  carouselSource,
  carouselVerticalSource,
  carouselItemUnicoSource,
  carouselVariosItensSource,
  carouselAutoplaySource,
  carouselUltimoSlideSource,
  carouselGaleriaSource,
  carouselComDotsSource,
];

describe('carouselSource', () => {
  it('ensina a importação do design system, com as cinco peças do conjunto', () => {
    const saida = carouselSource();
    expect(saida).toContain('} from "@/components/ui/carousel";');
    for (const peca of [
      'Carousel',
      'CarouselContent',
      'CarouselItem',
      'CarouselNext',
      'CarouselPrevious',
    ]) {
      expect(saida).toContain(`  ${peca},`);
    }
  });

  it('escreve o miolo do slide por extenso — o andaime das stories não existe fora delas', () => {
    const saida = carouselSource();
    // Era isto que o painel imprimia antes: uma peça exportada só pelo módulo
    // de apoio das stories, que falhava ao colar.
    expect(saida).not.toContain('SlideCard');
    expect(saida).toContain('<div className="nds-aspect-16-9">');
    expect(saida).toContain('Slide {numero}');
  });

  it('a região se anuncia com nome próprio', () => {
    // Sem nome acessível o leitor de tela diz "carrossel" sem dizer de quê, e a
    // região deixa de ser marco de navegação.
    expect(carouselSource()).toContain('aria-label="Galeria de exemplos"');
  });

  it('as duas setas carregam nome — o chevron sozinho não diz para onde leva', () => {
    const saida = carouselSource();
    expect(saida).toContain('<CarouselPrevious aria-label="Item anterior" />');
    expect(saida).toContain('<CarouselNext aria-label="Próximo item" />');
  });

  it('no eixo horizontal o eixo não é escrito — é o padrão do componente', () => {
    const saida = carouselSource(undefined, { args: { orientation: 'horizontal' } });
    expect(saida).not.toContain('orientation=');
    expect(saida).toContain('className="nds-w-full nds-max-w-md"');
  });

  it('no eixo vertical o trilho ganha altura DEFINIDA, e por classe de proporção', () => {
    const saida = carouselSource(undefined, { args: { orientation: 'vertical' } });
    expect(saida).toContain('orientation="vertical"');
    // Sem altura definida a base `flex: 0 0 100%` do slide não tem contra o que
    // resolver: o carrossel cresce em vez de recortar.
    expect(saida).toContain('<CarouselContent className="nds-aspect-4-3">');
    expect(saida).toContain('className="nds-basis-full"');
    // E a medida nunca vem de `style`, que escaparia do tema e da densidade.
    expect(saida).not.toContain('style=');
    expect(saida).not.toContain('height:');
  });

  it('a variante vertical repete exatamente o eixo vertical do meta', () => {
    expect(carouselVerticalSource()).toBe(
      carouselSource(undefined, { args: { orientation: 'vertical' } }),
    );
  });

  it('não inventa eixo fora da união', () => {
    const saida = carouselSource(undefined, { args: { orientation: 'diagonal' as never } });
    expect(saida).not.toContain('diagonal');
  });
});

describe('configurações', () => {
  it('um item por vez: a base de largura mora no ITEM', () => {
    const saida = carouselItemUnicoSource();
    expect(saida).toContain('<CarouselItem key={numero} className="nds-basis-full">');
  });

  it('vários itens: a base é responsiva, sem media query autoral', () => {
    const saida = carouselVariosItensSource();
    expect(saida).toContain('nds-md-basis-half nds-lg-basis-third');
    expect(saida).toContain('const slides = [1, 2, 3, 4, 5, 6];');
  });

  it('o avanço automático vem de plugin do motor, não de prop do componente', () => {
    const saida = carouselAutoplaySource();
    expect(saida).toContain('import Autoplay from "embla-carousel-autoplay";');
    expect(saida).toContain('plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}');
    // Repetição ligada mantém as setas vivas nos extremos: junto com a entrega
    // do controle na interação, é o que a WCAG 2.2.2 pede.
    expect(saida).toContain('opts={{ loop: true }}');
  });

  it('o último slide é escolha do motor, e o extremo é calculado pelo componente', () => {
    const saida = carouselUltimoSlideSource();
    expect(saida).toContain('opts={{ startIndex: slides.length - 1 }}');
    // Nenhum estado autoral desabilita a seta: quem calcula os extremos é o
    // componente.
    expect(saida).not.toContain('disabled');
  });
});

describe('composições', () => {
  it('na galeria a imagem É o conteúdo, então cada uma tem alternativa própria', () => {
    const saida = carouselGaleriaSource();
    expect(saida).toContain('import { Card, CardContent } from "@/components/ui/card";');
    expect(saida).toContain('alt={foto.alt}');
    // Três textos alternativos distintos: repetir o mesmo equivale a não ter.
    const alts = [...saida.matchAll(/alt: "([^"]+)"/g)].map(([, texto]) => texto);
    expect(alts.length).toBe(3);
    expect(new Set(alts).size).toBe(3);
  });

  it('a paginação se monta sobre a instância entregue em setApi', () => {
    const saida = carouselComDotsSource();
    expect(saida).toContain('import { useEffect, useState } from "react";');
    expect(saida).toContain('type CarouselApi,');
    expect(saida).toContain('<Carousel setApi={setApi}');
    expect(saida).toContain('api.selectedScrollSnap()');
    expect(saida).toContain('api?.scrollTo(i)');
  });

  it('o ponto é botão comum, com posição e total no nome', () => {
    const saida = carouselComDotsSource();
    expect(saida).toContain('type="button"');
    expect(saida).toContain('className="nds-carousel-dot"');
    // "2" sozinho não diz para onde leva.
    expect(saida).toContain('Ir para o slide ${numero} de ${slides.length}');
    // O rótulo visível é um PEDAÇO do nome acessível (WCAG 2.5.3).
    expect(saida).toContain('<span className="nds-carousel-dot-label">Slide {numero}</span>');
    // Nada de `role="tab"`: a paginação não comanda painel nenhum.
    expect(saida).not.toContain('role="tab"');
  });

  it('o ponto inativo NÃO carrega aria-current — a string "false" casaria com presença', () => {
    const saida = carouselComDotsSource();
    expect(saida).toContain('{...(i === atual ? { "aria-current": "true" as const } : {})}');
    expect(saida).not.toContain('aria-current="false"');
    expect(saida).not.toContain('aria-current={false}');
  });
});

describe('nenhum snippet ensina o andaime da story', () => {
  it('todos falam só do design system e das dependências reais', () => {
    for (const fn of TODAS) {
      const saida = fn();
      expect(saida).not.toContain('fixtures');
      expect(saida).not.toContain('SlideCard');
      expect(saida).not.toContain('visivelNoViewport');
      expect(saida).toContain('@/components/ui/carousel');
    }
  });
});
