import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from './index';
import { Card } from '@/components/ui/card';
import CarouselDocs from '@/components/docs/CarouselDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Carousel',
  component: Carousel,
  tags: ['autodocs', 'display'],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(CarouselDocs) },
  },
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Direção do deslize do carrossel',
    },
  },
  args: {
    orientation: 'horizontal',
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    components: { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, Card },
    setup() { return { args, slides: [1, 2, 3, 4, 5] }; },
    template: `
      <Carousel v-bind="args" class="w-full max-w-sm" aria-label="Galeria de exemplos">
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

    await step('Container do Carousel tem role=region', async () => {
      const region = canvas.getByRole('region');
      await expect(region).toBeInTheDocument();
      await expect(region).toHaveAttribute('aria-roledescription', 'carousel');
    });

    await step('Região tem nome acessível', async () => {
      await expect(canvas.getByRole('region', { name: /galeria de exemplos/i })).toBeInTheDocument();
    });

    await step('Slides têm role=group e aria-roledescription=slide', async () => {
      const slides = canvas.getAllByRole('group');
      await expect(slides.length).toBeGreaterThanOrEqual(5);
      await expect(slides[0]).toHaveAttribute('aria-roledescription', 'slide');
    });

    await step('Botão "Item anterior" presente e inicialmente desabilitado', async () => {
      const prev = canvas.getByRole('button', { name: /item anterior/i });
      await expect(prev).toBeInTheDocument();
      await expect(prev).toBeDisabled();
    });

    await step('Botão "Próximo item" presente e habilitado', async () => {
      const next = canvas.getByRole('button', { name: /próximo item/i });
      await expect(next).toBeInTheDocument();
      await expect(next).toBeEnabled();
    });
  },
};
