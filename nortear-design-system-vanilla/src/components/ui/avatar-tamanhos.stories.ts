import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createAvatar, type AvatarSize } from './avatar';

const meta: Meta = {
  tags: ['display'],
  title: 'UI/Avatar/Sizes',
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildAvatar(size?: AvatarSize): HTMLElement {
  const av = createAvatar({
    src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces',
    alt: 'Foto de perfil de Maria Rodrigues',
    fallbackText: 'MR',
    size,
  });
  av.querySelector('[data-slot="avatar-fallback"]')?.setAttribute('aria-hidden', 'true');
  return av;
}

/**
 * O diâmetro é o contrato do preset. Medir o elemento renderizado prova que
 * `data-size` chegou ao CSS — antes as plays contavam botões, que não existem
 * em avatar nenhum, e passavam com a tela vazia.
 */
const caixaDo = (canvasElement: HTMLElement) => {
  const root = canvasElement.querySelector('[data-slot="avatar"]');
  if (!root) throw new Error('avatar não renderizou');
  return root.getBoundingClientRect();
};

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Sm: Story = {
  name: 'sm (24px)',
  parameters: {
    covers: ['functional.item6', 'visual.item3'],
    docs: { description: { story: 'Tamanho compacto (24px) — listas densas.' } },
  },
  render: () => buildAvatar('sm'),
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
  name: 'md (32px · default)',
  parameters: {
    covers: ['functional.item6', 'visual.item3'],
    docs: { description: { story: 'Tamanho padrão do componente (32px) — comentários e chips.' } },
  },
  // Sem passar size: o padrão da factory é o preset md.
  render: () => buildAvatar(),
  play: async ({ canvasElement }) => {
    const { width, height } = caixaDo(canvasElement);
    await expect(Math.abs(width - 32)).toBeLessThan(0.5);
    await expect(Math.abs(height - 32)).toBeLessThan(0.5);
  },
};

export const Lg: Story = {
  name: 'lg (40px)',
  parameters: {
    covers: ['functional.item6', 'visual.item3'],
    docs: { description: { story: 'Tamanho médio-grande (40px).' } },
  },
  render: () => buildAvatar('lg'),
  play: async ({ canvasElement }) => {
    const { width, height } = caixaDo(canvasElement);
    await expect(Math.abs(width - 40)).toBeLessThan(0.5);
    await expect(Math.abs(height - 40)).toBeLessThan(0.5);
  },
};

export const Xl: Story = {
  name: 'xl (48px)',
  parameters: {
    covers: ['functional.item6', 'visual.item3'],
    docs: { description: { story: 'Tamanho grande (48px) — headers de perfil.' } },
  },
  render: () => buildAvatar('xl'),
  play: async ({ canvasElement }) => {
    const { width, height } = caixaDo(canvasElement);
    await expect(Math.abs(width - 48)).toBeLessThan(0.5);
    await expect(Math.abs(height - 48)).toBeLessThan(0.5);
  },
};

export const TwoXl: Story = {
  name: '2xl (64px)',
  parameters: {
    covers: ['functional.item6', 'visual.item3'],
    docs: { description: { story: 'Maior preset (64px) — página de perfil.' } },
  },
  render: () => buildAvatar('2xl'),
  play: async ({ canvasElement }) => {
    const { width, height } = caixaDo(canvasElement);
    await expect(Math.abs(width - 64)).toBeLessThan(0.5);
    await expect(Math.abs(height - 64)).toBeLessThan(0.5);
  },
};
