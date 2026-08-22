import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, waitFor } from 'storybook/test';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from './index';
import {
  measureSlides,
  reprovasDeEscala,
  feedbackDePointerReprovas,
  pontoDeParadaIntacto,
  controlReach,
  escalaSobMovimentoReduzido,
  describeFailures,
} from '@shared/testing/carousel-probe';
import { carouselHorizontalSource, carouselVerticalSource } from './carousel.source';

const meta = {
  title: 'UI/Carousel/Variants',
  component: Carousel,
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: carouselHorizontalSource },
      description: {
        component: 'Orientações disponíveis do Carousel — horizontal (padrão) e vertical (o viewport precisa de altura definida).',
      },
    },
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  parameters: {
    covers: ['accessibility.item5', 'accessibility.item7', 'functional.item10', 'visual.item2', 'visual.item6'],
    docs: {
      description: {
        story: 'Orientação padrão: os slides deitam em linha e as setas ficam nas laterais, fora da área do conteúdo.',
      },
    },
  },
  render: () => ({
    components: { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext },
    setup() { return { slides: [1, 2, 3, 4, 5] }; },
    template: `
      <Carousel class="nds-w-sm" aria-label="Slides na horizontal">
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
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const regiao = canvas.getByRole('region', { name: /slides na horizontal/i });
    const track = canvasElement.querySelector<HTMLElement>('.nds-carousel-track')!;

    await step('O trilho deita os slides em linha', async () => {
      await expect(track).toHaveAttribute('data-orientation', 'horizontal');
      await expect(getComputedStyle(track).flexDirection).toBe('row');
    });

    await step('As setas ficam nas laterais, fora da área dos slides', async () => {
      // É o que `.nds-carousel-arrow-prev[data-orientation="horizontal"]` faz;
      // se o atributo não chegasse aos botões, eles empilhariam sobre o
      // primeiro slide sem nenhum erro visível no console.
      const area = regiao.getBoundingClientRect();
      const anterior = canvas.getByRole('button', { name: /item anterior/i }).getBoundingClientRect();
      const proximo = canvas.getByRole('button', { name: /próximo item/i }).getBoundingClientRect();
      await expect(anterior.right).toBeLessThan(area.left);
      await expect(proximo.left).toBeGreaterThan(area.right);
    });

    await step('O slide atual fica em tamanho cheio e os vizinhos recuam', async () => {
      // A escala é `transform`, e `transform` não deixa rastro em atributo, em
      // texto nem em papel ARIA: a única prova é a caixa RENDERIZADA contra a
      // caixa de LAYOUT. O `waitFor` não é folga — a transição parte do tamanho
      // cheio e leva `--duration-base` para chegar, então o primeiro quadro
      // mede o ponto de partida e reprovaria por corrida.
      await waitFor(async () => {
        await expect(describeFailures(reprovasDeEscala(measureSlides(canvasElement), 0))).toBe('');
      }, { timeout: 4000 });
    });

    await step('A escala não moveu o ponto de parada da rolagem', async () => {
      // `transform` é pintura, não layout — mas isso é promessa. Passos de
      // layout desiguais entre slides significariam que a escala vazou para o
      // layout, e o carrossel passaria a parar fora do slide.
      await expect(describeFailures(pontoDeParadaIntacto(canvasElement))).toBe('');
    });

    await step('Com movimento reduzido a escala some por inteiro', async () => {
      // Não basta a transição parar: um salto de tamanho é justamente o que a
      // preferência pede para não acontecer. A sonda liga a preferência pelo
      // mesmo canal do toolbar do Storybook e a desliga no `finally`, senão a
      // story seguinte e a foto dela sairiam envenenadas.
      const failures = await escalaSobMovimentoReduzido(canvasElement, waitFor);
      await expect(describeFailures(failures)).toBe('');
    });

    await step('A seta responde ao ponteiro sem sair do lugar', async () => {
      const proximo = canvas.getByRole('button', { name: /próximo item/i });

      // A escrita direta do `transform` faz as vezes do ponteiro. Não é atalho:
      // `userEvent.hover` despacha eventos, e o `:hover` do CSS responde ao
      // cursor de verdade — medido, dá razão 1.000 e não verifica nada. O que
      // importa aqui é a COLISÃO de duas regras na propriedade `transform`, e
      // escrevê-la à mão reproduz a colisão inteira.
      const failures = [
        ...(await feedbackDePointerReprovas(proximo, waitFor)),
        ...controlReach(proximo),
      ];
      await expect(describeFailures(failures)).toBe('');
    });
  },
};

export const Vertical: Story = {
  parameters: {
    covers: ['functional.item5', 'functional.item10', 'visual.item2'],
    docs: {
      // O eixo troca a largura da moldura e exige altura definida no trilho —
      // a do `meta` mostraria o horizontal, que é outra composição.
      source: { transform: carouselVerticalSource },
      description: {
        story: 'Os slides empilham e as setas passam para cima e para baixo. O viewport precisa de altura definida — aqui ela vem de uma classe de proporção, nunca de style inline.',
      },
    },
  },
  render: () => ({
    components: { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext },
    setup() { return { slides: [1, 2, 3, 4, 5] }; },
    // `nds-aspect-4-3` dá ao trilho a altura DEFINIDA contra a qual a base
    // `flex: 0 0 100%` do slide resolve. Sem ela o carrossel vertical empilha
    // os slides no tamanho do conteúdo e nada é recortado.
    template: `
      <Carousel orientation="vertical" class="nds-w-xs" aria-label="Slides na vertical">
        <CarouselContent class="nds-aspect-4-3">
          <CarouselItem v-for="n in slides" :key="n">
            <div class="nds-cluster nds-h-full nds-bg-muted-soft nds-rounded-lg" data-justify="center">
              <span class="nds-text-h3 nds-font-semibold nds-text-muted-foreground">Slide {{ n }}</span>
            </div>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious aria-label="Item anterior" />
        <CarouselNext aria-label="Próximo item" />
      </Carousel>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const regiao = canvas.getByRole('region', { name: /slides na vertical/i });
    const track = canvasElement.querySelector<HTMLElement>('.nds-carousel-track')!;
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;

    await step('O trilho empilha os slides em coluna', async () => {
      await expect(track).toHaveAttribute('data-orientation', 'vertical');
      await expect(getComputedStyle(track).flexDirection).toBe('column');
    });

    await step('Cada slide ocupa a altura inteira do viewport', async () => {
      // A prova de que a altura definida chegou: sem ela a base 100% do slide
      // cai para `auto` e o slide encolhe até o conteúdo.
      //
      // A proporção passa de 1 porque a margem negativa do trilho puxa o
      // padding do primeiro slide para fora do viewport — é ele que dá o
      // respiro entre os slides.
      const slide = canvas.getAllByRole('group')[0];
      const proporcao = slide.getBoundingClientRect().height / viewport.clientHeight;
      await expect(proporcao).toBeGreaterThan(0.98);
    });

    await step('As setas ficam acima e abaixo do viewport', async () => {
      const area = regiao.getBoundingClientRect();
      const anterior = canvas.getByRole('button', { name: /item anterior/i }).getBoundingClientRect();
      const proximo = canvas.getByRole('button', { name: /próximo item/i }).getBoundingClientRect();
      await expect(anterior.bottom).toBeLessThan(area.top);
      await expect(proximo.top).toBeGreaterThan(area.bottom);
    });

    await step('A seta girada também não sai do lugar sob o ponteiro', async () => {
      // O eixo vertical é o caso difícil: aqui a centralização vem acompanhada
      // de uma ROTAÇÃO. Escrita em `transform`, ela desaparecia junto com a
      // centralização quando o `scale` do hover chegava — o chevron voltava a
      // apontar para o lado errado no mesmo quadro em que o botão despencava.
      // Escrita em `translate` + `rotate`, as duas convivem com o `scale`.
      const proximo = canvas.getByRole('button', { name: /próximo item/i });
      const failures = await feedbackDePointerReprovas(proximo, waitFor);
      await expect(describeFailures(failures)).toBe('');
    });
  },
};
