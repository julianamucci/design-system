import { describe, expect, it } from 'vitest';
import {
  carouselAutoplaySource,
  carouselComDotsSource,
  carouselGaleriaSource,
  carouselSource,
  carouselUltimoSlideSource,
  carouselVariosItensSource,
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

<div class="nds-w-full nds-max-w-md">
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
    const saida = carouselSource('', { args: { orientation: 'vertical' } });
    expect(saida).toContain('<Carousel orientation="vertical" aria-label="Galeria de exemplos">');
    // Sem altura DEFINIDA a base do slide não tem contra o que resolver e o
    // carrossel cresce em vez de recortar.
    expect(saida).toContain('<CarouselContent class="nds-aspect-4-3">');
    expect(saida).not.toContain('nds-aspect-square');
  });

  it('não escreve a orientação padrão — repetir o valor padrão ensina ruído', () => {
    expect(carouselSource('', { args: { orientation: 'horizontal' } })).not.toContain(
      'orientation=',
    );
  });

  it('a região se nomeia e cada slide anuncia posição e total', () => {
    const saida = carouselSource();
    expect(saida).toContain('aria-label="Galeria de exemplos"');
    expect(saida).toContain('aria-label="Slide {numero} de {slides.length}"');
  });
});

describe('transforms das stories de variante e estado', () => {
  it('a vertical é a canônica com o eixo trocado', () => {
    expect(carouselVerticalSource()).toBe(
      carouselSource('', { args: { orientation: 'vertical' } }),
    );
  });

  it('o último slide sai de uma opção do motor, não de navegação na play', () => {
    const saida = carouselUltimoSlideSource();
    expect(saida).toContain('opts={{ startIndex: slides.length - 1 }}');
    // O estado das setas é calculado pelo componente: escrevê-lo à mão no
    // snippet ensinaria uma prop que não existe.
    expect(saida).not.toContain('disabled');
  });
});

describe('transforms das stories de configuração', () => {
  it('vários itens por vez: a base responsiva mora no ITEM', () => {
    const saida = carouselVariosItensSource();
    expect(saida).toContain('class="nds-md-basis-half nds-lg-basis-third"');
    expect(saida).toContain('const slides = [1, 2, 3, 4, 5, 6];');
    // A base é do item; o trilho continua sem classe própria.
    expect(saida).toContain('<CarouselContent>');
  });

  it('o autoplay vem de plugin do motor, com parada na interação', () => {
    const saida = carouselAutoplaySource();
    expect(saida).toContain('import Autoplay from "embla-carousel-autoplay";');
    expect(saida).toContain('plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}');
    expect(saida).toContain('opts={{ loop: true }}');
  });
});

describe('transforms das stories de composição', () => {
  it('a galeria dá um texto alternativo próprio a cada foto', () => {
    const saida = carouselGaleriaSource();
    expect(saida).toContain('alt={foto.alt}');
    const alts = saida.match(/alt: "/g);
    expect(alts).toHaveLength(3);
    // Repetir o mesmo alt em todas equivale a não ter nenhum.
    const textos = [...saida.matchAll(/alt: "([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(textos).size).toBe(textos.length);
  });

  it('os dots se montam sobre a instância que o componente expõe', () => {
    const saida = carouselComDotsSource();
    expect(saida).toContain('setApi={registrarApi}');
    expect(saida).toContain('api?.scrollTo(i)');
  });

  it('o dot é botão comum, e só o atual carrega aria-current', () => {
    const saida = carouselComDotsSource();
    expect(saida).toContain('type="button"');
    expect(saida).toContain('aria-current={atual === i ? "true" : null}');
    // Nem `tablist` nem `tab`: o controle não comanda painel nenhum.
    expect(saida).not.toContain('role="tab"');
    // A string "false" ainda casaria com um seletor de presença.
    expect(saida).not.toContain('"false"');
  });

  it('o rótulo visível do dot é um pedaço do nome acessível (WCAG 2.5.3)', () => {
    const saida = carouselComDotsSource();
    expect(saida).toContain('aria-label="Ir para o slide {numero} de {slides.length}"');
    expect(saida).toContain('<span class="nds-carousel-dot-label">Slide {numero}</span>');
  });
});
