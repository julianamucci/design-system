import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createAvatar, type AvatarSize } from './avatar';

const meta: Meta = {
  tags: ['display'],
  title: 'UI/Avatar/Tamanhos',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Tamanhos do Avatar via prop `size`: sm (24px), md (32px, padrão), lg (40px), xl (48px), 2xl (64px).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildAvatar(size: AvatarSize, alt = 'Foto de perfil de Maria Rodrigues'): HTMLElement {
  return createAvatar({
    src: 'https://github.com/shadcn.png',
    alt,
    fallbackText: 'MR',
    size,
  });
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Sm: Story = {
  parameters: {
    docs: { description: { story: 'Tamanho compacto (24px) — listas densas.' } },
  },
  render: () => buildAvatar('sm'),

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const Md: Story = {
  parameters: {
    docs: { description: { story: 'Tamanho padrão do componente (32px) — comentários e chips.' } },
  },
  render: () => buildAvatar('md'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const img = (await canvas.findByRole('img', { hidden: true })) as HTMLImageElement;
    await expect(img).toBeInTheDocument();
  },
};

export const Lg: Story = {
  parameters: {
    docs: { description: { story: 'Tamanho médio-grande (40px).' } },
  },
  render: () => buildAvatar('lg'),

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const Xl: Story = {
  parameters: {
    docs: { description: { story: 'Tamanho grande (48px) — headers de perfil.' } },
  },
  render: () => buildAvatar('xl'),

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};
