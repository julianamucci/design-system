import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { expect } from 'storybook/test';
import AspectRatioStory from './AspectRatioStory.svelte';
import { aspectRatioSource } from './aspect-ratio.source';

const meta: Meta = {
  title: 'UI/AspectRatio/Variants',
  component: AspectRatioStory,
  tags: ['layout'],
  parameters: {
    design: figmaDesign('aspectRatio'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma declara em `args` a
      // proporção e o filho que o snippet deve mostrar.
      source: { transform: aspectRatioSource },
      description: {
        component:
          'Cinco ratios canônicos adotados no design system: 16/9, 4/3, 1/1, 3/4 e 21/9.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const SixteenNine: Story = {
  parameters: { covers: ['functional.item1', 'visual.item1'] },
  args: {
    ratio: 16 / 9,
    child: 'img',
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop&q=60',
    alt: 'Paisagem 16:9',
    width: 'nds-w-lg',
  },

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
  args: {
    ratio: 4 / 3,
    child: 'img',
    src: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=60',
    alt: 'Imagem de produto 4:3',
    width: 'nds-w-md',
  },

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
  args: {
    ratio: 1,
    child: 'img',
    src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=60',
    alt: 'Avatar quadrado 1:1',
    width: 'nds-w-xs',
  },

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
  args: {
    ratio: 3 / 4,
    child: 'img',
    src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&auto=format&fit=crop&q=60',
    alt: 'Retrato 3:4',
    width: 'nds-w-xs',
  },

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
  args: {
    ratio: 21 / 9,
    child: 'img',
    src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1600&auto=format&fit=crop&q=60',
    alt: 'Hero panorâmico 21:9',
    width: 'nds-w-prose',
  },

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
