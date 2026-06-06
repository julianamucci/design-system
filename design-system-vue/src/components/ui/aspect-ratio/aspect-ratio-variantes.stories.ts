import type { Meta, StoryObj } from '@storybook/vue3';
import { expect } from 'storybook/test';
import { AspectRatio } from './index';

const meta = {
  title: 'UI/AspectRatio/Variantes',
  component: AspectRatio,
  tags: ['layout'],
  parameters: {
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
  name: '16 / 9',
  render: () => ({
    components: { AspectRatio },
    template: `
      <div class="w-[480px]">
        <AspectRatio :ratio="16 / 9">
          <img
            src="https://images.unsplash.com/photo-1535025183041-0991a977e25b?w=800&auto=format"
            alt="Paisagem 16:9"
            loading="lazy"
            decoding="async"
            class="h-full w-full object-cover rounded-md"
          />
        </AspectRatio>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const FourThree: Story = {
  name: '4 / 3',
  render: () => ({
    components: { AspectRatio },
    template: `
      <div class="w-[400px]">
        <AspectRatio :ratio="4 / 3">
          <img
            src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format"
            alt="Produto 4:3"
            loading="lazy"
            decoding="async"
            class="h-full w-full object-cover rounded-md"
          />
        </AspectRatio>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const Square: Story = {
  name: '1 / 1',
  render: () => ({
    components: { AspectRatio },
    template: `
      <div class="w-[320px]">
        <AspectRatio :ratio="1">
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format"
            alt="Avatar quadrado"
            loading="lazy"
            decoding="async"
            class="h-full w-full object-cover rounded-md"
          />
        </AspectRatio>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const ThreeFour: Story = {
  name: '3 / 4',
  render: () => ({
    components: { AspectRatio },
    template: `
      <div class="w-[320px]">
        <AspectRatio :ratio="3 / 4">
          <img
            src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&auto=format"
            alt="Capa vertical 3:4"
            loading="lazy"
            decoding="async"
            class="h-full w-full object-cover rounded-md"
          />
        </AspectRatio>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const UltraWide: Story = {
  name: '21 / 9',
  render: () => ({
    components: { AspectRatio },
    template: `
      <div class="w-[600px]">
        <AspectRatio :ratio="21 / 9">
          <img
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format"
            alt="Cabeçalho panorâmico 21:9"
            loading="lazy"
            decoding="async"
            class="h-full w-full object-cover rounded-md"
          />
        </AspectRatio>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};
