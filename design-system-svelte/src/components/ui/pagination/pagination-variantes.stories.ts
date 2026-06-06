import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import PaginationStory from './PaginationStory.svelte';

const meta = {
  title: 'UI/Pagination/Variantes',
  component: PaginationStory,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Pagination: Default (link de página inativo, ghost), Active (página atual com outline + aria-current="page") e Directional (Previous/Next com ícone e label).',
      },
    },
  },
} satisfies Meta<typeof PaginationStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    count: 50,
    perPage: 10,
    page: 1,
    siblingCount: 2,
    demonstration: 'simples',
  },
  parameters: {
    docs: {
      description: {
        story: 'Link de página inativo — variant=ghost, fundo transparente, sem aria-current.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByLabelText(/Ir para página 3/i);
    await expect(link).not.toHaveAttribute('aria-current');
  },
};

export const Active: Story = {
  args: {
    count: 50,
    perPage: 10,
    page: 3,
    siblingCount: 2,
    demonstration: 'simples',
  },
  parameters: {
    docs: {
      description: {
        story: 'Página atual — isActive=true aplica variant=outline e aria-current="page".',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const active = canvas.getByLabelText(/Página atual, 3/i);
    await expect(active).toHaveAttribute('aria-current', 'page');
    await expect(active).toHaveAttribute('data-active', 'true');
  },
};

export const Directional: Story = {
  args: {
    count: 50,
    perPage: 10,
    page: 2,
    demonstration: 'directional',
  },
  parameters: {
    docs: {
      description: {
        story: 'Previous e Next — link com ícone e label visível a partir do breakpoint sm.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const prev = canvas.getByLabelText(/anterior/i);
    const next = canvas.getByLabelText(/próxima/i);
    await expect(prev).toBeVisible();
    await expect(next).toBeVisible();
  },
};
