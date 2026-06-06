import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import { AspectRatio } from './index';
import AspectRatioStory from './AspectRatioStory.svelte';
import AspectRatioDocs from '@/components/docs/AspectRatioDocs.svelte';
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
          'Container passivo que preserva uma proporção fixa de largura-altura para mídia responsiva — imagens, vídeos e iframes.',
      },
    },
  },
  argTypes: {
    ratio: {
      control: { type: 'number', min: 0.25, max: 4, step: 0.05 },
      description: 'Proporção largura/altura (ex.: 16/9 ≈ 1.777).',
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
    Component: AspectRatioStory,
    props: {
      ratio: args.ratio,
      child: 'img',
      src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop&q=60',
      alt: 'Paisagem ao entardecer',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Wrapper com data-slot aspect-ratio está presente', async () => {
      const wrapper = canvasElement.querySelector('[data-slot="aspect-ratio"]');
      await expect(wrapper).toBeInTheDocument();
    });

    await step('Imagem filha renderiza com alt descritivo', async () => {
      const img = await canvas.findByRole('img', { name: /Paisagem ao entardecer/i });
      await expect(img).toHaveAttribute('alt', 'Paisagem ao entardecer');
    });

    await step('Imagem preenche o container com object-cover', async () => {
      const img = await canvas.findByRole('img', { name: /Paisagem ao entardecer/i });
      await expect(img).toHaveClass('object-cover');
      await expect(img).toHaveClass('w-full');
      await expect(img).toHaveClass('h-full');
    });
  },
};
