import type { Meta, StoryObj } from '@storybook/vue3';
import { DataTable } from './index';
import { type Invoice, invoices, baseColumns } from './data-table.fixtures';

const meta: Meta<Record<string, unknown>> = {
  title: 'UI/DataTable/Configuracoes',
  component: DataTable as never,
  tags: ['tables'],
  parameters: { controls: { disable: true }, actions: { disable: true } },
};

export default meta;
type Story = StoryObj<Record<string, unknown>>;

const bigData: Invoice[] = Array.from({ length: 1000 }, (_, i) => ({
  id: `INV-${String(i + 1).padStart(5, '0')}`,
  customer: invoices[i % invoices.length].customer,
  status: invoices[i % 3].status,
  method: invoices[i % 5].method,
  amount: Math.round(Math.random() * 2000),
}));

export const Virtualizado1000Linhas: Story = {
  render: () => ({
    components: { DataTable },
    setup() {
      return { columns: baseColumns, data: bigData };
    },
    template: `<DataTable
      :columns="columns"
      :data="data"
      :virtualized="true"
      max-height="400px"
      :enable-column-visibility="false"
    />`,
  }),
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: { canvas: { sourceState: 'none' } },
  },
};
