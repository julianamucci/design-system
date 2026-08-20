import { describe, expect, it } from 'vitest';
import {
  carouselArrastarSource,
  carouselAutoplaySource,
  carouselComDotsSource,
  carouselGaleriaSource,
  carouselHorizontalSource,
  carouselItemUnicoSource,
  carouselMultiResponsivoSource,
  carouselPrimeiroSlideSource,
  carouselSource,
  carouselUltimoSlideSource,
  carouselVerticalSource,
} from './carousel.source';

describe('carouselSource', () => {
  it('sem args, entrega a forma canônica no eixo horizontal', () => {
    expect(carouselSource()).toBe(
      `<script setup lang="ts">
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

const slides = [1, 2, 3, 4, 5]
</script>

<template>
  <Carousel class="nds-w-cap-sm" aria-label="Galeria de exemplos">
    <CarouselContent>
      <CarouselItem v-for="n in slides" :key="n">
        <div class="nds-cluster nds-aspect-16-9 nds-bg-muted-soft nds-rounded-lg" data-justify="center">
          <span class="nds-text-h3 nds-font-semibold nds-text-muted-foreground">Slide {{ n }}</span>
        </div>
      </CarouselItem>
    </CarouselContent>
    <CarouselPrevious aria-label="Item anterior" />
    <CarouselNext aria-label="Próximo item" />
  </Carousel>
</template>`,
    );
  });

  it('acompanha o control de orientação, e com ele a altura do trilho', () => {
    const saida = carouselSource('', { args: { orientation: 'vertical' } });
    expect(saida).toContain('<Carousel orientation="vertical"');
    // Sem altura DEFINIDA a base do slide não tem contra o que resolver e o
    // carrossel cresce em vez de recortar.
    expect(saida).toContain('<CarouselContent class="nds-aspect-4-3">');
    expect(saida).not.toContain('nds-aspect-16-9');
  });

  it('não escreve a orientação padrão — repetir valor padrão ensina ruído', () => {
    expect(carouselSource('', { args: { orientation: 'horizontal' } })).not.toContain(
      'orientation=',
    );
  });

  it('a região se nomeia e os controles têm nome próprio', () => {
    const saida = carouselSource();
    expect(saida).toContain('aria-label="Galeria de exemplos"');
    expect(saida).toContain('<CarouselPrevious aria-label="Item anterior" />');
    expect(saida).toContain('<CarouselNext aria-label="Próximo item" />');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const saida = carouselSource('', { args: { orientation: (() => {}) as never } });
    expect(saida).not.toContain('function');
    expect(saida).not.toContain('orientation=');
  });
});

describe('transforms das stories de variante e estado', () => {
  it('a horizontal é a canônica com o rótulo da própria story', () => {
    expect(carouselHorizontalSource()).toContain('aria-label="Slides na horizontal"');
    expect(carouselHorizontalSource()).not.toContain('orientation=');
  });

  it('a vertical troca o eixo, a largura e a altura do trilho', () => {
    const saida = carouselVerticalSource();
    expect(saida).toContain('orientation="vertical"');
    expect(saida).toContain('nds-w-cap-xs');
    expect(saida).toContain('<CarouselContent class="nds-aspect-4-3">');
    expect(saida).toContain('nds-h-full');
  });

  it('os extremos saem de uma opção do motor, não de navegação na play', () => {
    expect(carouselPrimeiroSlideSource()).toContain('const opts = { startIndex: 0 }');
    expect(carouselUltimoSlideSource()).toContain(
      'const opts = { startIndex: slides.length - 1 }',
    );
    // O estado das setas é calculado pelo componente: escrevê-lo à mão no
    // snippet ensinaria uma prop que não existe.
    expect(carouselUltimoSlideSource()).not.toContain('disabled');
  });
});

describe('transforms das stories de configuração', () => {
  it('item único não põe base própria no item', () => {
    const saida = carouselItemUnicoSource();
    expect(saida).toContain('<CarouselItem v-for="n in slides" :key="n">');
    expect(saida).not.toContain('nds-md-basis-half');
  });

  it('conjunto longo de slides: a base responsiva mora no ITEM', () => {
    const saida = carouselMultiResponsivoSource();
    expect(saida).toContain('class="nds-md-basis-half nds-lg-basis-third"');
    expect(saida).toContain('const slides = [1, 2, 3, 4, 5, 6]');
    // A base é do item; o trilho continua sem classe própria.
    expect(saida).toContain('<CarouselContent>');
  });

  it('o autoplay vem de plugin do motor, com parada na interação', () => {
    const saida = carouselAutoplaySource();
    expect(saida).toContain(`import AutoplayPlugin from 'embla-carousel-autoplay'`);
    expect(saida).toContain('AutoplayPlugin({ delay: 4000, stopOnInteraction: true })');
    expect(saida).toContain(':plugins="plugins"');
  });

  it('o arraste não tem prop a ligar — o motor já escuta o ponteiro', () => {
    const saida = carouselArrastarSource();
    expect(saida).toContain('const slides = [1, 2, 3, 4]');
    expect(saida).not.toContain('draggable');
  });
});

describe('transforms das stories de composição', () => {
  it('a galeria dá um rótulo próprio a cada slide', () => {
    const saida = carouselGaleriaSource();
    expect(saida).toContain('v-for="(rotulo, i) in slides"');
    const rotulos = [...saida.matchAll(/^ {2}'([^']+)',$/gm)].map((m) => m[1]);
    expect(rotulos.length).toBe(3);
    // Repetir o mesmo rótulo em todos equivale a não ter nenhum.
    expect(new Set(rotulos).size).toBe(rotulos.length);
  });

  it('os dots se montam sobre a instância que o componente entrega', () => {
    const saida = carouselComDotsSource();
    expect(saida).toContain('@init-api="aoIniciar"');
    expect(saida).toContain('@click="api?.scrollTo(i)"');
  });

  it('o dot é botão comum, e só o atual carrega aria-current', () => {
    const saida = carouselComDotsSource();
    expect(saida).toContain('type="button"');
    expect(saida).toContain(`:aria-current="atual === i ? 'true' : null"`);
    // Nem `tablist` nem `tab`: o controle não comanda painel nenhum.
    expect(saida).not.toContain('role="tab"');
    // A string "false" ainda casaria com um seletor de presença.
    expect(saida).not.toContain(`'false'`);
  });

  it('o rótulo visível do dot é um pedaço do nome acessível (WCAG 2.5.3)', () => {
    const saida = carouselComDotsSource();
    expect(saida).toContain('Ir para o slide ${i + 1} de ${slides.length}');
    expect(saida).toContain('<span class="nds-carousel-dot-label">Slide {{ i + 1 }}</span>');
  });
});
