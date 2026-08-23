import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { createAspectRatio } from './aspect-ratio';
import { boxed, buildImage } from './aspect-ratio.fixtures';
import { aspectRatioSource, aspectRatioSourceWith } from './aspect-ratio.source';
import { expect } from 'storybook/test';

const meta: Meta = {
  tags: ['layout'],
  title: 'UI/AspectRatio/Variants',
  parameters: {
    design: figmaDesign('aspectRatio'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      source: { transform: aspectRatioSource },
      description: {
        component:
          'Ratios canônicos adotados pelo design system: 16/9, 4/3, 1/1, 3/4 e 21/9. ' +
          'Ratios não são variantes de cva() — são padrões de proporção reutilizáveis.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────
//
// `boxed` e `buildImage` vêm de `aspect-ratio.fixtures.ts`. Aqui nenhuma story
// passa `extraClass`, e sem ela a classe da imagem é a mesma de sempre.

export const SixteenNine: Story = {
  // A proporção é a única coisa que muda entre as stories deste arquivo, e ela
  // não passa por control nenhum: cada uma declara a sua.
  parameters: {
    covers: ['functional.item1', 'visual.item1'],
    docs: {
      source: {
        transform: aspectRatioSourceWith({
          ratio: 16 / 9,
          alt: 'Paisagem montanhosa — proporção 16/9',
        }),
      },
    },
  },
  name: '16 / 9',
  render: () =>
    boxed(
      createAspectRatio({
        ratio: 16 / 9,
        content: buildImage(
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
          'Paisagem montanhosa — proporção 16/9',
        ),
      }),
    ),

  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector('[data-slot="aspect-ratio"]');
    await expect(box).not.toBeNull();
    // A proporção É o componente: medir a caixa renderizada prova que o ratio
    // chegou ao CSS, seja por --ratio, por padding ou pelo que a lib usar.
    const { width, height } = box!.getBoundingClientRect();
    await expect(width).toBeGreaterThan(0);
    await expect(Math.abs(width / height - 16 / 9)).toBeLessThan(0.02);
  },
};

export const FourThree: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      source: {
        transform: aspectRatioSourceWith({
          ratio: 4 / 3,
          imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80',
          alt: 'Imagem de produto — proporção 4/3',
        }),
      },
    },
  },
  name: '4 / 3',
  render: () =>
    boxed(
      createAspectRatio({
        ratio: 4 / 3,
        content: buildImage(
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80',
          'Imagem de produto — proporção 4/3',
        ),
      }),
    ),

  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector('[data-slot="aspect-ratio"]');
    await expect(box).not.toBeNull();
    // A proporção É o componente: medir a caixa renderizada prova que o ratio
    // chegou ao CSS, seja por --ratio, por padding ou pelo que a lib usar.
    const { width, height } = box!.getBoundingClientRect();
    await expect(width).toBeGreaterThan(0);
    await expect(Math.abs(width / height - 4 / 3)).toBeLessThan(0.02);
  },
};

export const Square: Story = {
  // O quadrado é o padrão da fábrica, então a opção `ratio` some do snippet —
  // documentação não ensina a repetir o default.
  parameters: {
    covers: ['functional.item2', 'visual.item3'],
    docs: {
      source: {
        transform: aspectRatioSourceWith({
          ratio: 1,
          imageUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&q=80',
          alt: 'Avatar quadrado — proporção 1/1',
        }),
      },
    },
  },
  name: '1 / 1',
  render: () =>
    boxed(
      createAspectRatio({
        ratio: 1,
        content: buildImage(
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&q=80',
          'Avatar quadrado — proporção 1/1',
        ),
      }),
      '20rem',
    ),

  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector('[data-slot="aspect-ratio"]');
    await expect(box).not.toBeNull();
    // A proporção É o componente: medir a caixa renderizada prova que o ratio
    // chegou ao CSS, seja por --ratio, por padding ou pelo que a lib usar.
    const { width, height } = box!.getBoundingClientRect();
    await expect(width).toBeGreaterThan(0);
    await expect(Math.abs(width / height - 1)).toBeLessThan(0.02);
  },
};

export const ThreeFour: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      source: {
        transform: aspectRatioSourceWith({
          ratio: 3 / 4,
          imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80',
          alt: 'Retrato vertical — proporção 3/4',
        }),
      },
    },
  },
  name: '3 / 4',
  render: () =>
    boxed(
      createAspectRatio({
        ratio: 3 / 4,
        content: buildImage(
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80',
          'Retrato vertical — proporção 3/4',
        ),
      }),
      '24rem',
    ),

  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector('[data-slot="aspect-ratio"]');
    await expect(box).not.toBeNull();
    // A proporção É o componente: medir a caixa renderizada prova que o ratio
    // chegou ao CSS, seja por --ratio, por padding ou pelo que a lib usar.
    const { width, height } = box!.getBoundingClientRect();
    await expect(width).toBeGreaterThan(0);
    await expect(Math.abs(width / height - 3 / 4)).toBeLessThan(0.02);
  },
};

export const UltraWide: Story = {
  parameters: {
    covers: ['visual.item5'],
    docs: {
      source: {
        transform: aspectRatioSourceWith({
          ratio: 21 / 9,
          imageUrl: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1600&q=80',
          alt: 'Hero cinematográfico — proporção 21/9',
        }),
      },
    },
  },
  name: '21 / 9',
  render: () =>
    boxed(
      createAspectRatio({
        ratio: 21 / 9,
        content: buildImage(
          'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1600&q=80',
          'Hero cinematográfico — proporção 21/9',
        ),
      }),
      '48rem',
    ),

  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector('[data-slot="aspect-ratio"]');
    await expect(box).not.toBeNull();
    // A proporção É o componente: medir a caixa renderizada prova que o ratio
    // chegou ao CSS, seja por --ratio, por padding ou pelo que a lib usar.
    const { width, height } = box!.getBoundingClientRect();
    await expect(width).toBeGreaterThan(0);
    await expect(Math.abs(width / height - 21 / 9)).toBeLessThan(0.02);
  },
};
