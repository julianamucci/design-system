import type { Meta, StoryObj } from '@storybook/vue3';
import { DataTable } from './index';
import { baseColumns } from './data-table.fixtures';

const meta: Meta<Record<string, unknown>> = {
  title: 'UI/DataTable/Estados',
  component: DataTable as never,
  tags: ['tables'],
  parameters: { controls: { disable: true }, actions: { disable: true } },
};

export default meta;
type Story = StoryObj<Record<string, unknown>>;

export const SemResultados: Story = {
  render: () => ({
    components: { DataTable },
    setup() {
      return { columns: baseColumns };
    },
    template: `<DataTable
      :columns="columns"
      :data="[]"
      empty-message="Nenhuma fatura encontrada."
    />`,
  }),
  parameters: { controls: { disable: true }, actions: { disable: true } },
};
