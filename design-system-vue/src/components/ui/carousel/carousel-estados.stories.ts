import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from './index';
import { Card } from '@/components/ui/card';

const meta = {
  title: 'UI/Carousel/Estados',
  component: Carousel,
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component: 'Estados de extremo do Carousel — sem loop, o botão anterior ou próximo fica automaticamente desabilitado.',
      },
    },
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PrimeiroSlide: Story = {
  render: () => ({
    components: { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, Card },
    setup() { return { opts: { startIndex: 0 }, slides: [1, 2, 3, 4, 5] }; },
    template: `
      <Carousel :opts="opts" class="w-full max-w-sm" aria-label="Galeria no primeiro slide">
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

    await step('No primeiro slide, "Item anterior" fica disabled', async () => {
      const prev = canvas.getByRole('button', { name: /item anterior/i });
      await expect(prev).toBeDisabled();
    });

    await step('"Próximo item" fica habilitado', async () => {
      const next = canvas.getByRole('button', { name: /próximo item/i });
      await expect(next).toBeEnabled();
    });
  },
};

export const UltimoSlide: Story = {
  render: () => ({
    components: { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, Card },
    setup() { return { opts: { startIndex: 4 }, slides: [1, 2, 3, 4, 5] }; },
    template: `
      <Carousel :opts="opts" class="w-full max-w-sm" aria-label="Galeria no último slide">
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

    await step('No último slide, "Próximo item" fica disabled', async () => {
      const next = canvas.getByRole('button', { name: /próximo item/i });
      await expect(next).toBeDisabled();
    });

    await step('"Item anterior" fica habilitado', async () => {
      const prev = canvas.getByRole('button', { name: /item anterior/i });
      await expect(prev).toBeEnabled();
    });
  },
};
