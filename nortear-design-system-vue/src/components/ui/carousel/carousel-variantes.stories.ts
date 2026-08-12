import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from './index';

const meta = {
  title: 'UI/Carousel/Variants',
  component: Carousel,
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
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
    covers: ['accessibility.item5', 'visual.item2'],
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
      <Carousel class="nds-w-full nds-max-w-sm" aria-label="Galeria na horizontal">
        <CarouselContent>
          <CarouselItem v-for="n in slides" :key="n">
            <div class="nds-cluster nds-aspect-video nds-bg-muted-soft nds-rounded-lg" data-justify="center">
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
    const regiao = canvas.getByRole('region', { name: /galeria na horizontal/i });
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
  },
};

export const Vertical: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item2'],
    docs: {
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
      <Carousel orientation="vertical" class="nds-w-full nds-max-w-xs" aria-label="Galeria na vertical">
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
    const regiao = canvas.getByRole('region', { name: /galeria na vertical/i });
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
  },
};
