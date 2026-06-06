import type { Meta, StoryObj } from '@storybook/svelte';
import { within, userEvent, expect } from 'storybook/test';
import DataTable from './data-table.svelte';
import DataTableDocs from '@/components/docs/DataTableDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { invoices, baseColumns } from './data-table.fixtures';

const meta = {
  title: 'UI/DataTable',
  component: DataTable,
  tags: ['autodocs', 'tables'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(DataTableDocs) },
  },
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    columns: baseColumns as never,
    data: invoices,
    enableRowSelection: true,
    globalFilterPlaceholder: 'Buscar fatura, cliente, método...',
  },
  play: async ({ canvasElement, step }) => {
    const c = within(canvasElement);

    await step('Renderiza linhas iniciais', async () => {
      await expect(c.getByText('INV-001')).toBeInTheDocument();
      await expect(c.getByText('Ana Souza')).toBeInTheDocument();
    });

    await step('Filtro global reduz linhas', async () => {
      const search = c.getByLabelText(/buscar/i);
      await userEvent.clear(search);
      await userEvent.type(search, 'Pix');
      await expect(c.queryByText('Boleto bancário')).not.toBeInTheDocument();
      await userEvent.clear(search);
    });

    await step('Ordenação por coluna Valor', async () => {
      const sortBtn = c.getByRole('button', { name: /ordenar por valor/i });
      await userEvent.click(sortBtn);
      await userEvent.click(sortBtn);
    });
  },
};
