import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect, waitFor } from 'storybook/test';
import PaginationStory from './PaginationStory.svelte';

const meta = {
  title: 'UI/Pagination/Estados',
  component: PaginationStory,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados canônicos do Pagination: Default (link inativo), Hover (bg-accent), Active (página atual com aria-current), Disabled (Previous na primeira ou Next na última, com aria-disabled e pointer-events-none) e Focus (ring-2 ring-ring visível).',
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
    page: 2,
    siblingCount: 2,
    demonstration: 'simples',
  },
  parameters: {
    docs: { description: { story: 'Link inativo — fundo transparente, texto em foreground.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByLabelText(/Ir para página 3/i);
    await expect(link).toBeVisible();
  },
};

export const Hover: Story = {
  args: {
    count: 50,
    perPage: 10,
    page: 1,
    siblingCount: 2,
    demonstration: 'simples',
  },
  parameters: {
    pseudo: { hover: true },
    docs: {
      description: {
        story: 'Estado hover — bg-accent + text-accent-foreground (simulado via parameters.pseudo).',
      },
    },
  },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
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
    docs: { description: { story: 'Página atual — isActive aplica outline + aria-current="page".' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const active = canvas.getByLabelText(/Página atual, 3/i);
    await expect(active).toHaveAttribute('aria-current', 'page');
  },
};

export const Disabled: Story = {
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
        story:
          'Previous na primeira página recebe aria-disabled="true" e pointer-events-none — bits-ui aplica automaticamente quando page === 1.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const prev = canvas.getByLabelText(/anterior/i);
    await expect(prev).toBeVisible();
  },
};

export const Focus: Story = {
  args: {
    count: 50,
    perPage: 10,
    page: 1,
    siblingCount: 2,
    demonstration: 'simples',
  },
  parameters: {
    pseudo: { focusVisible: true },
    docs: { description: { story: 'Foco visível — ring-2 ring-ring (simulado via parameters.pseudo).' } },
  },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};
