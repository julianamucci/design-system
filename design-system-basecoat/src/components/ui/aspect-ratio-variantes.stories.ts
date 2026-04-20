import type { Meta, StoryObj } from '@storybook/html';
import { createAspectRatio } from './aspect-ratio';

const meta: Meta = {
  title: 'UI/AspectRatio/Variantes',
  parameters: {
    layout: 'padded',
    docs: {
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

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildImage(src: string, alt: string): HTMLImageElement {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.className = 'object-cover w-full h-full rounded-md';
  return img;
}

function boxed(el: HTMLElement, maxWidth = 'max-w-xl'): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = `w-full ${maxWidth}`;
  wrap.appendChild(el);
  return wrap;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const SixteenNine: Story = {
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
};

export const FourThree: Story = {
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
};

export const Square: Story = {
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
      'max-w-xs',
    ),
};

export const ThreeFour: Story = {
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
      'max-w-sm',
    ),
};

export const UltraWide: Story = {
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
      'max-w-3xl',
    ),
};
