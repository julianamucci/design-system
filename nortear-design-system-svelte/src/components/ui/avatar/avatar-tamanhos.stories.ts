import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { expect } from 'storybook/test';
import { Avatar } from './index';
import AvatarStory from './AvatarStory.svelte';

const meta: Meta = {
  title: 'UI/Avatar/Tamanhos',
  component: Avatar,
  tags: ['display'],
  parameters: {
    design: figmaDesign('avatar'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Presets de tamanho da prop `size`: sm (24px), md (32px, padrão), lg (40px), xl (48px) e 2xl (64px).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const baseProps = {
  variant: 'image' as const,
  src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=60',
  alt: 'Foto de perfil de Maria Rodrigues',
  initials: 'MR',
};

/**
 * O diâmetro é o contrato do preset. Medir o elemento renderizado prova que
 * `data-size` chegou ao CSS — as stories antigas passavam classes do Tailwind
 * (`h-6 w-6`), que saíram do projeto: os cinco tamanhos renderizavam igual e
 * nenhuma asserção reprovava.
 */
const caixaDo = (canvasElement: HTMLElement) => {
  const root = canvasElement.querySelector('[data-slot="avatar"]');
  if (!root) throw new Error('avatar não renderizou');
  return root.getBoundingClientRect();
};

export const Sm: Story = {
  name: 'sm (24px)',
  parameters: { covers: ['functional.item6', 'visual.item3'] },
  render: () => ({ Component: AvatarStory, props: { ...baseProps, size: 'sm' } }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-slot="avatar"]')).toHaveAttribute(
      'data-size',
      'sm',
    );
    const { width, height } = caixaDo(canvasElement);
    await expect(Math.abs(width - 24)).toBeLessThan(0.5);
    await expect(Math.abs(height - 24)).toBeLessThan(0.5);
  },
};

export const Md: Story = {
  name: 'md (32px · padrão)',
  parameters: { covers: ['functional.item6', 'visual.item3'] },
  render: () => ({ Component: AvatarStory, props: { ...baseProps } }),
  play: async ({ canvasElement }) => {
    // Sem passar size: o padrão do componente é o preset md, e não um valor
    // que não casa com seletor nenhum.
    await expect(canvasElement.querySelector('[data-slot="avatar"]')).toHaveAttribute(
      'data-size',
      'md',
    );
    const { width, height } = caixaDo(canvasElement);
    await expect(Math.abs(width - 32)).toBeLessThan(0.5);
    await expect(Math.abs(height - 32)).toBeLessThan(0.5);
  },
};

export const Lg: Story = {
  name: 'lg (40px)',
  parameters: { covers: ['functional.item6', 'visual.item3'] },
  render: () => ({ Component: AvatarStory, props: { ...baseProps, size: 'lg' } }),
  play: async ({ canvasElement }) => {
    const { width, height } = caixaDo(canvasElement);
    await expect(Math.abs(width - 40)).toBeLessThan(0.5);
    await expect(Math.abs(height - 40)).toBeLessThan(0.5);
  },
};

export const Xl: Story = {
  name: 'xl (48px)',
  parameters: { covers: ['functional.item6', 'visual.item3'] },
  render: () => ({ Component: AvatarStory, props: { ...baseProps, size: 'xl' } }),
  play: async ({ canvasElement }) => {
    const { width, height } = caixaDo(canvasElement);
    await expect(Math.abs(width - 48)).toBeLessThan(0.5);
    await expect(Math.abs(height - 48)).toBeLessThan(0.5);
  },
};

export const TwoXl: Story = {
  name: '2xl (64px)',
  parameters: { covers: ['functional.item6', 'visual.item3'] },
  render: () => ({ Component: AvatarStory, props: { ...baseProps, size: '2xl' } }),
  play: async ({ canvasElement }) => {
    const { width, height } = caixaDo(canvasElement);
    await expect(Math.abs(width - 64)).toBeLessThan(0.5);
    await expect(Math.abs(height - 64)).toBeLessThan(0.5);
  },
};
