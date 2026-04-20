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
  tags: ['autodocs'],
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
    img.className = 'object-cover w-full h-full rounded-md';

    const wrapper = document.createElement('div');
    wrapper.className = 'w-full max-w-xl';
    wrapper.appendChild(createAspectRatio({ ratio: args.ratio, content: img }));
    return wrapper;
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('Wrapper aplica padding-bottom calculado a partir do ratio', async () => {
      const wrappers = canvasElement.querySelectorAll<HTMLElement>('div.relative.w-full');
      const ratioWrapper = Array.from(wrappers).find((el) => el.style.paddingBottom);
      await expect(ratioWrapper).toBeTruthy();
      const expected = `${(1 / args.ratio) * 100}%`;
      await expect(ratioWrapper!.style.paddingBottom).toBe(expected);
    });

    await step('Inner container usa absolute inset-0', async () => {
      const inner = canvasElement.querySelector('.absolute.inset-0');
      await expect(inner).toBeInTheDocument();
    });

    await step('Imagem filha tem alt e preenche o container', async () => {
      const img = await canvas.findByRole('img', { name: args.alt });
      await expect(img).toHaveAttribute('alt', args.alt);
      await expect(img).toHaveClass('object-cover');
      await expect(img).toHaveClass('w-full');
      await expect(img).toHaveClass('h-full');
    });
  },
};
