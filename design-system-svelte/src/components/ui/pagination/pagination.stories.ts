import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect } from 'storybook/test';
import PaginationStory from './PaginationStory.svelte';
import PaginationDocs from '@/components/docs/PaginationDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Pagination',
  component: PaginationStory,
  tags: ['autodocs', 'navigation'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(PaginationDocs),
      description: {
        component:
          'Pagination (bits-ui) — navegação entre páginas de um conjunto paginado. Renderiza um <nav aria-label="pagination"> com PaginationContent (<ul>), PaginationItem (<li>), PaginationLink (numerado, aplica aria-current="page" quando isActive), PaginationPrevious/Next (direcionais com ícone) e PaginationEllipsis (decorativo, aria-hidden).',
      },
    },
  },
  argTypes: {
    count: {
      control: { type: 'number', min: 0, step: 10 },
      description: 'Total de itens — usado por bits-ui para calcular o número de páginas.',
    },
    perPage: {
      control: { type: 'number', min: 1, step: 1 },
      description: 'Itens por página.',
    },
    page: {
      control: { type: 'number', min: 1, step: 1 },
      description: 'Página inicial em modo não-controlado.',
    },
    siblingCount: {
      control: { type: 'number', min: 0, max: 4, step: 1 },
      description: 'Quantidade de páginas vizinhas exibidas à esquerda e à direita da atual.',
    },
    demonstration: {
      control: 'select',
      options: ['simples', 'comEllipsis', 'ultimaPagina', 'directional', 'controlada', 'tabela'],
      description: 'Composição interna usada na demonstração.',
    },
  },
  args: {
    count: 50,
    perPage: 10,
    page: 1,
    siblingCount: 1,
    demonstration: 'simples',
  },
} satisfies Meta<typeof PaginationStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('1. Pagination tem nav com aria-label', async () => {
      const nav = canvas.getByRole('navigation');
      await expect(nav).toBeInTheDocument();
      await expect(nav).toHaveAttribute('aria-label', 'pagination');
    });

    await step('2. Página ativa anuncia aria-current="page"', async () => {
      const active = canvas.getByLabelText(/Página atual, 1/i);
      await expect(active).toHaveAttribute('aria-current', 'page');
    });

    await step('3. Click em link numerado dispara navegação', async () => {
      const page2 = canvas.getByLabelText(/Ir para página 2/i);
      await userEvent.click(page2);
    });
  },
};
