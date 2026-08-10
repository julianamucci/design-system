import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from './index';
import { Card } from '@/components/ui/card';

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
        component: 'Orientações disponíveis do Carousel — horizontal (padrão) e vertical (requer altura fixa).',
      },
    },
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => ({
    components: { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, Card },
    setup() { return { slides: [1, 2, 3, 4, 5] }; },
    template: `
      <Carousel class="nds-w-full nds-max-w-sm" aria-label="Galeria de exemplos">
        <CarouselContent>
          <CarouselItem v-for="n in slides" :key="n">
            <Card class="nds-cluster aspect-square nds-p-6" data-align="center" data-justify="center">
              <span class="text-3xl nds-font-semibold">{{ n }}</span>
            </Card>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious aria-label="Item anterior" />
        <CarouselNext aria-label="Próximo item" />
      </Carousel>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Carousel horizontal presente com role=region', async () => {
      await expect(canvas.getByRole('region', { name: /galeria de exemplos/i })).toBeInTheDocument();
    });

    await step('Botões de navegação expostos', async () => {
      await expect(canvas.getByRole('button', { name: /item anterior/i })).toBeInTheDocument();
      await expect(canvas.getByRole('button', { name: /próximo item/i })).toBeInTheDocument();
    });
  },
};

export const Vertical: Story = {
  render: () => ({
    components: { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, Card },
    setup() { return { slides: [1, 2, 3, 4, 5] }; },
    template: `
      <Carousel orientation="vertical" class="nds-w-full nds-max-w-xs" aria-label="Galeria vertical">
        <CarouselContent class="" style="height: 200px">
          <CarouselItem v-for="n in slides" :key="n">
            <Card class="nds-cluster aspect-square nds-p-4" data-align="center" data-justify="center">
              <span class="nds-font-semibold" style="font-size: 1.5rem; line-height: 2rem">{{ n }}</span>
            </Card>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious aria-label="Item anterior" />
        <CarouselNext aria-label="Próximo item" />
      </Carousel>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Carousel vertical presente com role=region', async () => {
      await expect(canvas.getByRole('region', { name: /galeria vertical/i })).toBeInTheDocument();
    });

    await step('Slides renderizados', async () => {
      const slides = canvas.getAllByRole('group');
      await expect(slides.length).toBeGreaterThanOrEqual(5);
    });
  },
};
