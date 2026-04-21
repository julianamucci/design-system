import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createAvatar } from './avatar';

const meta: Meta = {
  title: 'UI/Avatar/Tamanhos',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Tamanhos do Avatar via className. Não existe prop size — use h-6/h-8/h-10/h-12 com w equivalente.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildAvatar(size: string, alt = 'Foto de perfil de Maria Rodrigues'): HTMLElement {
  return createAvatar({
    src: 'https://github.com/shadcn.png',
    alt,
    fallbackText: 'MR',
    className: size,
  });
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Size6: Story = {
  parameters: {
    docs: { description: { story: 'Tamanho compacto (h-6 w-6) — listas densas.' } },
  },
  render: () => buildAvatar('h-6 w-6'),
};

export const Size8: Story = {
  parameters: {
    docs: { description: { story: 'Tamanho médio-compacto (h-8 w-8) — comentários e chips.' } },
  },
  render: () => buildAvatar('h-8 w-8'),
};

export const Size10: Story = {
  parameters: {
    docs: { description: { story: 'Tamanho padrão do componente (h-10 w-10).' } },
  },
  render: () => buildAvatar('h-10 w-10'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // hidden:true — img começa com display:none até o load completar.
    const img = (await canvas.findByRole('img', { hidden: true })) as HTMLImageElement;
    await expect(img).toBeInTheDocument();
  },
};

export const Size12: Story = {
  parameters: {
    docs: { description: { story: 'Tamanho grande (h-12 w-12) — headers de perfil.' } },
  },
  render: () => buildAvatar('h-12 w-12'),
};
