import { describe, expect, it } from 'vitest';
import {
  carouselArrastarSource,
  carouselAutoplaySource,
  carouselWithDotsSource,
  carouselGaleriaSource,
  carouselHorizontalSource,
  carouselItemUnicoSource,
  carouselMultiResponsivoSource,
  carouselFirstSlideSource,
  carouselSource,
  carouselLastSlideSource,
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
  <Carousel class="nds-w-sm" aria-label="Galeria de exemplos">
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
    const output = carouselSource('', { args: { orientation: 'vertical' } });
    expect(output).toContain('<Carousel orientation="vertical"');
    // Sem altura DEFINIDA a base do slide não tem contra o que resolver e o
    // carrossel cresce em vez de recortar.
    expect(output).toContain('<CarouselContent class="nds-aspect-4-3">');
    expect(output).not.toContain('nds-aspect-16-9');
  });

  it('não escreve a orientação padrão — repetir valor padrão ensina ruído', () => {
    expect(carouselSource('', { args: { orientation: 'horizontal' } })).not.toContain(
      'orientation=',
    );
  });

  it('a região se nomeia e os controles têm nome próprio', () => {
    const output = carouselSource();
    expect(output).toContain('aria-label="Galeria de exemplos"');
    expect(output).toContain('<CarouselPrevious aria-label="Item anterior" />');
    expect(output).toContain('<CarouselNext aria-label="Próximo item" />');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const output = carouselSource('', { args: { orientation: (() => {}) as never } });
    expect(output).not.toContain('function');
    expect(output).not.toContain('orientation=');
  });
});

describe('transforms das stories de variante e estado', () => {
  it('a horizontal é a canônica com o rótulo da própria story', () => {
    expect(carouselHorizontalSource()).toContain('aria-label="Slides na horizontal"');
    expect(carouselHorizontalSource()).not.toContain('orientation=');
  });

  it('a vertical troca o eixo, a largura e a altura do trilho', () => {
    const output = carouselVerticalSource();
    expect(output).toContain('orientation="vertical"');
    expect(output).toContain('nds-w-xs');
    expect(output).toContain('<CarouselContent class="nds-aspect-4-3">');
    expect(output).toContain('nds-h-full');
  });

  it('os extremos saem de uma opção do motor, não de navegação na play', () => {
    expect(carouselFirstSlideSource()).toContain('const opts = { startIndex: 0 }');
    expect(carouselLastSlideSource()).toContain(
      'const opts = { startIndex: slides.length - 1 }',
    );
    // O estado das setas é calculado pelo componente: escrevê-lo à mão no
    // snippet ensinaria uma prop que não existe.
    expect(carouselLastSlideSource()).not.toContain('disabled');
  });
});

describe('transforms das stories de configuração', () => {
  it('item único não põe base própria no item', () => {
    const output = carouselItemUnicoSource();
    expect(output).toContain('<CarouselItem v-for="n in slides" :key="n">');
    expect(output).not.toContain('nds-md-basis-half');
  });

  it('conjunto longo de slides: a base responsiva mora no ITEM', () => {
    const output = carouselMultiResponsivoSource();
    expect(output).toContain('class="nds-md-basis-half nds-lg-basis-third"');
    expect(output).toContain('const slides = [1, 2, 3, 4, 5, 6]');
    // A base é do item; o trilho continua sem classe própria.
    expect(output).toContain('<CarouselContent>');
  });

  it('o autoplay vem de plugin do motor, com parada na interação', () => {
    const output = carouselAutoplaySource();
    expect(output).toContain(`import AutoplayPlugin from 'embla-carousel-autoplay'`);
    expect(output).toContain('AutoplayPlugin({ delay: 4000, stopOnInteraction: true })');
    expect(output).toContain(':plugins="plugins"');
  });

  it('o arraste não tem prop a ligar — o motor já escuta o ponteiro', () => {
    const output = carouselArrastarSource();
    expect(output).toContain('const slides = [1, 2, 3, 4]');
    expect(output).not.toContain('draggable');
  });
});

describe('transforms das stories de composição', () => {
  it('a galeria dá um rótulo próprio a cada slide', () => {
    const output = carouselGaleriaSource();
    expect(output).toContain('v-for="(rotulo, i) in slides"');
    const rotulos = [...output.matchAll(/^ {2}'([^']+)',$/gm)].map((m) => m[1]);
    expect(rotulos.length).toBe(3);
    // Repetir o mesmo rótulo em todos equivale a não ter nenhum.
    expect(new Set(rotulos).size).toBe(rotulos.length);
  });

  it('os dots se montam sobre a instância que o componente entrega', () => {
    const output = carouselWithDotsSource();
    expect(output).toContain('@init-api="aoIniciar"');
    expect(output).toContain('@click="api?.scrollTo(i)"');
  });

  it('o dot é botão comum, e só o atual carrega aria-current', () => {
    const output = carouselWithDotsSource();
    expect(output).toContain('type="button"');
    expect(output).toContain(`:aria-current="atual === i ? 'true' : null"`);
    // Nem `tablist` nem `tab`: o controle não comanda painel nenhum.
    expect(output).not.toContain('role="tab"');
    // A string "false" ainda casaria com um seletor de presença.
    expect(output).not.toContain(`'false'`);
  });

  it('o rótulo visível do dot é um pedaço do nome acessível (WCAG 2.5.3)', () => {
    const output = carouselWithDotsSource();
    expect(output).toContain('Ir para o slide ${i + 1} de ${slides.length}');
    expect(output).toContain('<span class="nds-carousel-dot-label">Slide {{ i + 1 }}</span>');
  });
});
