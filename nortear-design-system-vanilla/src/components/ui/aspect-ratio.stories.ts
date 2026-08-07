import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
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
    design: figmaDesign('aspectRatio'),
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
  parameters: {
    covers: ['functional.item1', 'functional.item3', 'accessibility.item1'],
  },
  render: (args) => {
    const img = document.createElement('img');
    img.src = args.imageUrl;
    img.alt = args.alt;
    img.loading = 'lazy';
    img.decoding = 'async';
    // object-cover/w-full/h-full são vocabulário do Tailwind, que saiu do
    // projeto: as três eram inertes e a imagem não preenchia a caixa. O resto
    // das stories já monta assim (nds-* + estilo para o que não é utility).
    img.className = 'nds-w-full nds-rounded-md';
    img.style.objectFit = 'cover';
    img.style.height = '100%';

    const wrapper = document.createElement('div');
    wrapper.className = 'nds-w-full';
    wrapper.style.maxWidth = '36rem';
    wrapper.appendChild(createAspectRatio({ ratio: args.ratio, content: img }));
    return wrapper;
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('Caixa respeita a proporção do control', async () => {
      // functional.item1 — a custom property é o meio; a proporção medida é o
      // fim. Verificar as duas separa "o valor chegou" de "o CSS o aplicou".
      const caixa = canvasElement.querySelector<HTMLElement>('[data-slot="aspect-ratio"]');
      await expect(caixa).not.toBeNull();
      await expect(caixa!.style.getPropertyValue('--ratio')).toBe(String(args.ratio));
      const { width, height } = caixa!.getBoundingClientRect();
      await expect(width).toBeGreaterThan(0);
      await expect(Math.abs(width / height - args.ratio)).toBeLessThan(0.02);
    });

    await step('Imagem filha tem alt e está visível no container', async () => {
      // accessibility.item1
      const img = await canvas.findByRole('img', { name: args.alt });
      await expect(img).toHaveAttribute('alt', args.alt);
      await expect(img).toBeVisible();
    });

    await step('Imagem preenche a caixa sem distorcer', async () => {
      // functional.item3 — comportamento, não classe.
      const img = await canvas.findByRole('img', { name: args.alt });
      await expect(getComputedStyle(img).objectFit).toBe('cover');
      const caixa = canvasElement.querySelector('[data-slot="aspect-ratio"]')!;
      await expect(img.getBoundingClientRect().width).toBeCloseTo(
        caixa.getBoundingClientRect().width,
        0,
      );
    });
  },
};
