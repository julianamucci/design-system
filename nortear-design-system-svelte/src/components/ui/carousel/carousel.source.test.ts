import { describe, expect, it } from 'vitest';
import {
  carouselAutoplaySource,
  carouselWithDotsSource,
  carouselGaleriaSource,
  carouselSource,
  carouselLastSlideSource,
  carouselMultipleItemsSource,
  carouselVerticalSource,
} from './carousel.source';

describe('carouselSource', () => {
  it('sem args, entrega a forma canônica no eixo horizontal', () => {
    expect(carouselSource()).toBe(
      `<script lang="ts">
  import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
  } from "@/components/ui/carousel";

  const slides = [1, 2, 3, 4, 5];
</script>

<div class="nds-w-md">
  <Carousel aria-label="Galeria de exemplos">
    <CarouselContent>
      {#each slides as numero (numero)}
        <CarouselItem aria-label="Slide {numero} de {slides.length}">
          <div class="nds-p-1">
            <div
              class="nds-cluster nds-aspect-square nds-rounded-md nds-bg-muted"
              data-align="center"
              data-justify="center"
            >
              {numero}
            </div>
          </div>
        </CarouselItem>
      {/each}
    </CarouselContent>
    <CarouselPrevious aria-label="Item anterior" />
    <CarouselNext aria-label="Próximo item" />
  </Carousel>
</div>`,
    );
  });

  it('acompanha o control de orientação, e com ele a altura do trilho', () => {
    const output = carouselSource('', { args: { orientation: 'vertical' } });
    expect(output).toContain('<Carousel orientation="vertical" aria-label="Galeria de exemplos">');
    // Sem altura DEFINIDA a base do slide não tem contra o que resolver e o
    // carrossel cresce em vez de recortar.
    expect(output).toContain('<CarouselContent class="nds-aspect-4-3">');
    expect(output).not.toContain('nds-aspect-square');
  });

  it('não escreve a orientação padrão — repetir o valor padrão ensina ruído', () => {
    expect(carouselSource('', { args: { orientation: 'horizontal' } })).not.toContain(
      'orientation=',
    );
  });

  it('a região se nomeia e cada slide anuncia posição e total', () => {
    const output = carouselSource();
    expect(output).toContain('aria-label="Galeria de exemplos"');
    expect(output).toContain('aria-label="Slide {numero} de {slides.length}"');
  });
});

describe('transforms das stories de variante e estado', () => {
  it('a vertical é a canônica com o eixo trocado', () => {
    expect(carouselVerticalSource()).toBe(
      carouselSource('', { args: { orientation: 'vertical' } }),
    );
  });

  it('o último slide sai de uma opção do motor, não de navegação na play', () => {
    const output = carouselLastSlideSource();
    expect(output).toContain('opts={{ startIndex: slides.length - 1 }}');
    // O estado das setas é calculado pelo componente: escrevê-lo à mão no
    // snippet ensinaria uma prop que não existe.
    expect(output).not.toContain('disabled');
  });
});

describe('transforms das stories de configuração', () => {
  it('conjunto longo de slides: a base responsiva mora no ITEM', () => {
    const output = carouselMultipleItemsSource();
    expect(output).toContain('class="nds-md-basis-half nds-lg-basis-third"');
    expect(output).toContain('const slides = [1, 2, 3, 4, 5, 6];');
    // A base é do item; o trilho continua sem classe própria.
    expect(output).toContain('<CarouselContent>');
  });

  it('o autoplay vem de plugin do motor, com parada na interação', () => {
    const output = carouselAutoplaySource();
    expect(output).toContain('import Autoplay from "embla-carousel-autoplay";');
    expect(output).toContain('plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}');
    expect(output).toContain('opts={{ loop: true }}');
  });
});

describe('transforms das stories de composição', () => {
  it('a galeria dá um texto alternativo próprio a cada foto', () => {
    const output = carouselGaleriaSource();
    expect(output).toContain('alt={foto.alt}');
    const alts = output.match(/alt: "/g);
    expect(alts).toHaveLength(3);
    // Repetir o mesmo alt em todas equivale a não ter nenhum.
    const texts = [...output.matchAll(/alt: "([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(texts).size).toBe(texts.length);
  });

  it('os dots se montam sobre a instância que o componente expõe', () => {
    const output = carouselWithDotsSource();
    expect(output).toContain('setApi={registrarApi}');
    expect(output).toContain('api?.scrollTo(i)');
  });

  it('o dot é botão comum, e só o atual carrega aria-current', () => {
    const output = carouselWithDotsSource();
    expect(output).toContain('type="button"');
    expect(output).toContain('aria-current={atual === i ? "true" : null}');
    // Nem `tablist` nem `tab`: o controle não comanda painel nenhum.
    expect(output).not.toContain('role="tab"');
    // A string "false" ainda casaria com um seletor de presença.
    expect(output).not.toContain('"false"');
  });

  it('o rótulo visível do dot é um pedaço do nome acessível (WCAG 2.5.3)', () => {
    const output = carouselWithDotsSource();
    expect(output).toContain('aria-label="Ir para o slide {numero} de {slides.length}"');
    expect(output).toContain('<span class="nds-carousel-dot-label">Slide {numero}</span>');
  });
});
