import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from './index';
import { Card } from '@/components/ui/card';

const meta = {
  title: 'UI/Carousel/Variantes',
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
      <Carousel class="w-full max-w-sm" aria-label="Galeria de exemplos">
        <CarouselContent>
          <CarouselItem v-for="n in slides" :key="n">
            <Card class="flex aspect-square items-center justify-center p-6">
              <span class="text-3xl font-semibold">{{ n }}</span>
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
      <Carousel orientation="vertical" class="w-full max-w-xs" aria-label="Galeria vertical">
        <CarouselContent class="h-[200px]">
          <CarouselItem v-for="n in slides" :key="n">
            <Card class="flex aspect-square items-center justify-center p-4">
              <span class="text-2xl font-semibold">{{ n }}</span>
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
