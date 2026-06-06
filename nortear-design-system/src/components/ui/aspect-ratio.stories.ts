import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createAspectRatio } from './aspect-ratio';
import { createAspectRatioDocs } from '@/components/docs/AspectRatioDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type AspectRatioArgs = {
  ratio: number;
  imageUrl: string;
  alt: string;
};

const meta: Meta<AspectRatioArgs> = {
  title: 'UI/AspectRatio',
  tags: ['autodocs', 'layout'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createAspectRatioDocs) },
  },
  argTypes: {
    ratio: {
      control: { type: 'number', min: 0.25, max: 4, step: 0.05 },
      description: 'Proporção largura/altura (ex.: 16/9 ≈ 1.78, 1, 4/3 ≈ 1.33, 3/4 = 0.75).',
    },
    imageUrl: {
      control: 'text',
      description: 'URL da imagem renderizada dentro do AspectRatio.',
    },
    alt: {
      control: 'text',
      description: 'Texto alternativo da imagem.',
    },
  },
  args: {
    ratio: 16 / 9,
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
    alt: 'Paisagem montanhosa ao entardecer',
  },
};

export default meta;
type Story = StoryObj<AspectRatioArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const img = document.createElement('img');
    img.src = args.imageUrl;
    img.alt = args.alt;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.className = 'object-cover w-full h-full nds-rounded-md';

    const wrapper = document.createElement('div');
    wrapper.className = 'nds-w-full';
    wrapper.style.maxWidth = '36rem';
    wrapper.appendChild(createAspectRatio({ ratio: args.ratio, content: img }));
    return wrapper;
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('Wrapper aplica CSS custom property --ratio', async () => {
      const ratioWrapper = canvasElement.querySelector<HTMLElement>('[data-slot="aspect-ratio"]');
      await expect(ratioWrapper).toBeTruthy();
      await expect(ratioWrapper!.style.getPropertyValue('--ratio')).toBe(String(args.ratio));
    });

    await step('Imagem filha tem alt e está visível no container', async () => {
      const img = await canvas.findByRole('img', { name: args.alt });
      await expect(img).toHaveAttribute('alt', args.alt);
      await expect(img).toBeVisible();
    });
  },
};
