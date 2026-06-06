import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createBadge } from './badge';

const meta: Meta = {
  tags: ['feedback'],
  title: 'UI/Badge/Variantes',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'As 4 variantes nativas do Badge renderizadas via createBadge({ variant, children }). ' +
          'Cada variante aplica classes CSS distintas para hierarquia visual — sem prop size.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Variantes ────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => createBadge({ variant: 'default', children: 'Novo' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Novo')).toBeVisible();
    const el = canvasElement.querySelector('.nds-badge');
    await expect(el).not.toBeNull();
    // Default não aplica modificador — apenas .nds-badge.
    await expect(el?.classList.contains('nds-badge-secondary')).toBe(false);
    await expect(el?.classList.contains('nds-badge-destructive')).toBe(false);
    await expect(el?.classList.contains('nds-badge-outline')).toBe(false);
  },
};

export const Secondary: Story = {
  render: () => createBadge({ variant: 'secondary', children: 'Beta' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Beta')).toBeVisible();
    const el = canvasElement.querySelector('.nds-badge-secondary');
    await expect(el).not.toBeNull();
  },
};

export const Destructive: Story = {
  render: () => createBadge({ variant: 'destructive', children: 'Urgente' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Urgente')).toBeVisible();
    const el = canvasElement.querySelector('.nds-badge-destructive');
    await expect(el).not.toBeNull();
  },
};

export const Outline: Story = {
  render: () => createBadge({ variant: 'outline', children: 'Rascunho' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Rascunho')).toBeVisible();
    const el = canvasElement.querySelector('.nds-badge-outline');
    await expect(el).not.toBeNull();
  },
};
