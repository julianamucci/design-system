import type { Meta, StoryObj } from '@storybook/html';
import { within, userEvent, expect, waitFor } from 'storybook/test';
import { createDataTable } from './data-table';
import { createDataTableDocs } from '@/components/docs/DataTableDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { type Invoice, invoices, baseColumns } from './data-table.fixtures';

// ─── Meta ──────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'UI/DataTable',
  tags: ['autodocs', 'tables'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createDataTableDocs) },
  },
};

export default meta;
type Story = StoryObj;

// ─── Playground ────────────────────────────────────────────────────────────

export const Playground: Story = {
  args: {
    enableRowSelection: true,
    enableGlobalFilter: true,
    enableColumnVisibility: true,
    enablePagination: true,
    globalFilterPlaceholder: 'Buscar fatura, cliente, método...',
  },
  argTypes: {
    enableRowSelection: { control: 'boolean' },
    enableGlobalFilter: { control: 'boolean' },
    enableColumnVisibility: { control: 'boolean' },
    enablePagination: { control: 'boolean' },
    globalFilterPlaceholder: { control: 'text' },
  },
  render: (args: {
    enableRowSelection?: boolean;
    enableGlobalFilter?: boolean;
    enableColumnVisibility?: boolean;
    enablePagination?: boolean;
    globalFilterPlaceholder?: string;
  }) => createDataTable<Invoice>({
    columns: baseColumns,
    data: invoices,
    enableRowSelection: args.enableRowSelection,
    enableGlobalFilter: args.enableGlobalFilter,
    enableColumnVisibility: args.enableColumnVisibility,
    enablePagination: args.enablePagination,
    globalFilterPlaceholder: args.globalFilterPlaceholder,
  }),
  play: async ({ canvasElement, step }) => {
    const c = within(canvasElement);

    await step('Renderiza linhas iniciais', async () => {
      await expect(c.getByText('INV-001')).toBeInTheDocument();
      await expect(c.getByText('Ana Souza')).toBeInTheDocument();
    });

    await step('Filtro global reduz linhas', async () => {
      const search = c.getByLabelText(/Buscar fatura/i) as HTMLInputElement;
      // Foca antes de limpar — em browser-mode o user-event pode falhar com
      // "element could not be focused" se chamar clear() sem foco prévio.
      await userEvent.click(search);
      await userEvent.type(search, 'Pix');
      await waitFor(() => {
        expect(canvasElement.querySelector('.nds-data-table-tr')).not.toBeNull();
      });
      // Restaura o filtro selecionando tudo e deletando (mantém foco).
      await userEvent.tripleClick(search);
      await userEvent.keyboard('{Delete}');
    });

    await step('Ordenação por coluna Valor', async () => {
      const sortBtn = c.getByRole('button', { name: /ordenar por valor/i });
      await userEvent.click(sortBtn);
      await userEvent.click(sortBtn);
    });
  },
};
