import type { Meta, StoryObj } from '@storybook/vue3';
import { expect } from 'storybook/test';
import Autoplay from 'embla-carousel-autoplay';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from './index';
import { Card } from '@/components/ui/card';

const meta = {
  title: 'UI/Carousel/Configuracoes',
  component: Carousel,
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component: 'Configuracoes principais do Carousel — quantos itens por vez, autoplay via plugin.',
      },
    },
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {
  render: () => ({
    components: { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, Card },
    setup() { return { slides: [1, 2, 3, 4, 5] }; },
    template: `
      <Carousel class="w-full max-w-sm" aria-label="Galeria de item único">
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
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const MultiResponsive: Story = {
  render: () => ({
    components: { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, Card },
    setup() { return { slides: [1, 2, 3, 4, 5, 6] }; },
    template: `
      <Carousel class="w-full max-w-md" aria-label="Galeria responsiva">
        <CarouselContent>
          <CarouselItem v-for="n in slides" :key="n" class="md:basis-1/2 lg:basis-1/3">
            <Card class="flex aspect-square items-center justify-center p-4">
              <span class="text-xl font-semibold">{{ n }}</span>
            </Card>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious aria-label="Item anterior" />
        <CarouselNext aria-label="Próximo item" />
      </Carousel>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const AutoplayStory: Story = {
  name: 'Autoplay',
  render: () => ({
    components: { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, Card },
    setup() {
      const plugins = [Autoplay({ delay: 3000, stopOnInteraction: true })];
      return { plugins, opts: { loop: true }, slides: [1, 2, 3, 4, 5] };
    },
    template: `
      <Carousel :opts="opts" :plugins="plugins" class="w-full max-w-sm" aria-label="Galeria com autoplay">
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
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};
