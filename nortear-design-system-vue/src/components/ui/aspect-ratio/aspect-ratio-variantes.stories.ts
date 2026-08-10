import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { AspectRatio } from './index';

const meta = {
  title: 'UI/AspectRatio/Variants',
  component: AspectRatio,
  tags: ['layout'],
  parameters: {
    design: figmaDesign('aspectRatio'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Cinco ratios canônicos adotados no design system: 16/9 (paisagem), 4/3 (produto), 1/1 (quadrado), 3/4 (retrato) e 21/9 (ultra-wide).',
      },
    },
  },
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SixteenNine: Story = {
  parameters: { covers: ['functional.item1', 'visual.item1'] },
  name: '16 / 9',
  render: () => ({
    components: { AspectRatio },
    template: `
      <div class="" style="width: 480px">
        <AspectRatio :ratio="16 / 9">
          <img
            src="https://images.unsplash.com/photo-1535025183041-0991a977e25b?w=800&auto=format"
            alt="Paisagem 16:9"
            loading="lazy"
            decoding="async"
            class="nds-w-full nds-rounded-md" style="height: 100%; object-fit: cover"
          />
        </AspectRatio>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const caixa = canvasElement.querySelector('[data-slot="aspect-ratio"]');
    await expect(caixa).not.toBeNull();
    // A proporção É o componente: medir a caixa renderizada prova que o ratio
    // chegou ao CSS, seja por --ratio, por padding ou pelo que a lib usar.
    const { width, height } = caixa!.getBoundingClientRect();
    await expect(width).toBeGreaterThan(0);
    await expect(Math.abs(width / height - 16 / 9)).toBeLessThan(0.02);
  },
};

export const FourThree: Story = {
  parameters: { covers: ['visual.item2'] },
  name: '4 / 3',
  render: () => ({
    components: { AspectRatio },
    template: `
      <div class="" style="width: 400px">
        <AspectRatio :ratio="4 / 3">
          <img
            src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format"
            alt="Produto 4:3"
            loading="lazy"
            decoding="async"
            class="nds-w-full nds-rounded-md" style="height: 100%; object-fit: cover"
          />
        </AspectRatio>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const caixa = canvasElement.querySelector('[data-slot="aspect-ratio"]');
    await expect(caixa).not.toBeNull();
    // A proporção É o componente: medir a caixa renderizada prova que o ratio
    // chegou ao CSS, seja por --ratio, por padding ou pelo que a lib usar.
    const { width, height } = caixa!.getBoundingClientRect();
    await expect(width).toBeGreaterThan(0);
    await expect(Math.abs(width / height - 4 / 3)).toBeLessThan(0.02);
  },
};

export const Square: Story = {
  parameters: { covers: ['functional.item2', 'visual.item3'] },
  name: '1 / 1',
  render: () => ({
    components: { AspectRatio },
    template: `
      <div class="" style="width: 320px">
        <AspectRatio :ratio="1">
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format"
            alt="Avatar quadrado"
            loading="lazy"
            decoding="async"
            class="nds-w-full nds-rounded-md" style="height: 100%; object-fit: cover"
          />
        </AspectRatio>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const caixa = canvasElement.querySelector('[data-slot="aspect-ratio"]');
    await expect(caixa).not.toBeNull();
    // A proporção É o componente: medir a caixa renderizada prova que o ratio
    // chegou ao CSS, seja por --ratio, por padding ou pelo que a lib usar.
    const { width, height } = caixa!.getBoundingClientRect();
    await expect(width).toBeGreaterThan(0);
    await expect(Math.abs(width / height - 1)).toBeLessThan(0.02);
  },
};

export const ThreeFour: Story = {
  parameters: { covers: ['visual.item4'] },
  name: '3 / 4',
  render: () => ({
    components: { AspectRatio },
    template: `
      <div class="" style="width: 320px">
        <AspectRatio :ratio="3 / 4">
          <img
            src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&auto=format"
            alt="Capa vertical 3:4"
            loading="lazy"
            decoding="async"
            class="nds-w-full nds-rounded-md" style="height: 100%; object-fit: cover"
          />
        </AspectRatio>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const caixa = canvasElement.querySelector('[data-slot="aspect-ratio"]');
    await expect(caixa).not.toBeNull();
    // A proporção É o componente: medir a caixa renderizada prova que o ratio
    // chegou ao CSS, seja por --ratio, por padding ou pelo que a lib usar.
    const { width, height } = caixa!.getBoundingClientRect();
    await expect(width).toBeGreaterThan(0);
    await expect(Math.abs(width / height - 3 / 4)).toBeLessThan(0.02);
  },
};

export const UltraWide: Story = {
  parameters: { covers: ['visual.item5'] },
  name: '21 / 9',
  render: () => ({
    components: { AspectRatio },
    template: `
      <div class="" style="width: 600px">
        <AspectRatio :ratio="21 / 9">
          <img
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format"
            alt="Cabeçalho panorâmico 21:9"
            loading="lazy"
            decoding="async"
            class="nds-w-full nds-rounded-md" style="height: 100%; object-fit: cover"
          />
        </AspectRatio>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const caixa = canvasElement.querySelector('[data-slot="aspect-ratio"]');
    await expect(caixa).not.toBeNull();
    // A proporção É o componente: medir a caixa renderizada prova que o ratio
    // chegou ao CSS, seja por --ratio, por padding ou pelo que a lib usar.
    const { width, height } = caixa!.getBoundingClientRect();
    await expect(width).toBeGreaterThan(0);
    await expect(Math.abs(width / height - 21 / 9)).toBeLessThan(0.02);
  },
};
