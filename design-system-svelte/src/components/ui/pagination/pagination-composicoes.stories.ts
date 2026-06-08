import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import PaginationStory from './PaginationStory.svelte';

const meta = {
  title: 'UI/Pagination/Composicoes',
  component: PaginationStory,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes reais do Pagination: Simples (5 páginas), ComEllipsis (lista longa com primeira/última fixas), UltimaPagina (Next desabilitado), Controlada (page sincronizada com state externo) e CompletaTabela (rodapé de DataTable).',
      },
    },
  },
} satisfies Meta<typeof PaginationStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Simples: Story = {
  args: {
    count: 50,
    perPage: 10,
    page: 1,
    siblingCount: 2,
    demonstration: 'simples',
  },
  parameters: {
    docs: { description: { story: 'Paginação básica de 5 páginas — página 1 ativa, Previous desabilitado.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole('navigation');
    await expect(nav).toBeInTheDocument();
    const active = canvas.getByLabelText(/Página atual, 1/i);
    await expect(active).toHaveAttribute('aria-current', 'page');
  },
};

export const ComEllipsis: Story = {
  args: {
    count: 120,
    perPage: 10,
    page: 6,
    siblingCount: 1,
    demonstration: 'simples',
  },
  parameters: {
    docs: {
      description: {
        story:
          '12 páginas com página 6 ativa — primeira (1), siblings (5,6,7) e última (12) visíveis, ellipsis nas lacunas. Reticências tipográficas (…) com aria-hidden.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const active = canvas.getByLabelText(/Página atual, 6/i);
    await expect(active).toHaveAttribute('aria-current', 'page');
  },
};

export const UltimaPagina: Story = {
  args: {
    count: 100,
    perPage: 10,
    page: 10,
    siblingCount: 1,
    demonstration: 'simples',
  },
  parameters: {
    docs: { description: { story: 'Última página ativa — Next deve ficar visualmente desabilitado pelo bits-ui.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const active = canvas.getByLabelText(/Página atual, 10/i);
    await expect(active).toHaveAttribute('aria-current', 'page');
  },
};

export const Controlada: Story = {
  args: {
    count: 50,
    perPage: 10,
    page: 2,
    siblingCount: 2,
    demonstration: 'controlada',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Controlled — page sincronizada com state externo ($state). Cada PaginationLink recebe isActive dinâmico baseado em currentPage.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const active = canvas.getByLabelText(/Página atual, 2/i);
    await expect(active).toHaveAttribute('aria-current', 'page');
  },
};

export const CompletaTabela: Story = {
  args: {
    count: 120,
    perPage: 10,
    page: 2,
    siblingCount: 1,
    demonstration: 'tabela',
  },
  parameters: {
    docs: {
      description: {
        story: 'Cenário canônico: rodapé de tabela com contador de itens à esquerda e Pagination à direita.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole('navigation');
    await expect(nav).toBeInTheDocument();
    const active = canvas.getByLabelText(/Página atual, 2/i);
    await expect(active).toHaveAttribute('aria-current', 'page');
  },
};
