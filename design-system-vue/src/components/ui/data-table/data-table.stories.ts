import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
import { DataTable } from './index';
import { baseColumns, invoices } from './data-table.fixtures';
import DataTableDocs from '@/components/docs/DataTableDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta: Meta<Record<string, unknown>> = {
  title: 'UI/DataTable',
  component: DataTable as never,
  tags: ['autodocs', 'tables'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(DataTableDocs) },
  },
};

export default meta;
type Story = StoryObj<Record<string, unknown>>;

export const Playground: Story = {
  render: (args) => ({
    components: { DataTable },
    setup() {
      return { args };
    },
    template: `<DataTable v-bind="args" />`,
  }),
  args: {
    columns: baseColumns,
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
