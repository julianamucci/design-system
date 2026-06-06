import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import { AspectRatio } from './index';
import AspectRatioDocs from '@/components/docs/AspectRatioDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/AspectRatio',
  component: AspectRatio,
  tags: ['autodocs', 'layout'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(AspectRatioDocs),
      description: {
        component:
          'AspectRatio preserva uma proporção fixa de largura-altura para mídia responsiva — imagens, vídeos, iframes e mapas. Container passivo e stateless baseado em reka-ui.',
      },
    },
  },
  argTypes: {
    ratio: {
      control: { type: 'number', min: 0.25, max: 4, step: 0.01 },
      description: 'Proporção largura/altura (ex: 16/9 ≈ 1.777, 4/3 ≈ 1.333, 1/1 = 1).',
    },
  },
  args: {
    ratio: 16 / 9,
  },
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    components: { AspectRatio },
    setup() { return { args }; },
    template: `
      <div class="w-[480px]">
        <AspectRatio v-bind="args">
          <img
            src="https://images.unsplash.com/photo-1535025183041-0991a977e25b?w=800&auto=format"
            alt="Paisagem ao amanhecer"
            loading="lazy"
            decoding="async"
            class="h-full w-full object-cover rounded-md"
          />
        </AspectRatio>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Wrapper com data-slot aspect-ratio está presente', async () => {
      const wrapper = canvasElement.querySelector('[data-slot="aspect-ratio"]');
      await expect(wrapper).toBeInTheDocument();
    });

    await step('Imagem renderiza dentro do container', async () => {
      const img = canvas.getByRole('img', { name: /Paisagem ao amanhecer/ });
      await expect(img).toBeVisible();
    });

    await step('Imagem tem atributo alt descritivo', async () => {
      const img = canvas.getByRole('img', { name: /Paisagem ao amanhecer/ });
      await expect(img).toHaveAttribute('alt', 'Paisagem ao amanhecer');
    });
  },
};
