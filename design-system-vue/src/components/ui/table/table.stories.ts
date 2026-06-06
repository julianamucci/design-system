import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './index';
import TableDocs from '@/components/docs/TableDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Table',
  component: Table,
  tags: ['autodocs', 'tables'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(TableDocs) },
  },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    components: {
      Table,
      TableBody,
      TableCaption,
      TableCell,
      TableFooter,
      TableHead,
      TableHeader,
      TableRow,
    },
    setup() { return { args }; },
    template: `
      <Table v-bind="args">
        <TableCaption>Lista de faturas recentes</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Fatura</TableHead>
            <TableHead scope="col">Status</TableHead>
            <TableHead scope="col">Método</TableHead>
            <TableHead scope="col" class="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell class="font-medium">#INV-001</TableCell>
            <TableCell>Pago</TableCell>
            <TableCell>Cartão de crédito</TableCell>
            <TableCell class="text-right">R$ 250,00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-medium">#INV-002</TableCell>
            <TableCell>Pendente</TableCell>
            <TableCell>Boleto bancário</TableCell>
            <TableCell class="text-right">R$ 150,00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-medium">#INV-003</TableCell>
            <TableCell>Cancelado</TableCell>
            <TableCell>Pix</TableCell>
            <TableCell class="text-right">R$ 350,00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-medium">#INV-004</TableCell>
            <TableCell>Pago</TableCell>
            <TableCell>Cartão de débito</TableCell>
            <TableCell class="text-right">R$ 450,00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-medium">#INV-005</TableCell>
            <TableCell>Pendente</TableCell>
            <TableCell>Transferência</TableCell>
            <TableCell class="text-right">R$ 200,00</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell :col-span="3">Total</TableCell>
            <TableCell class="text-right">R$ 1.400,00</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Tabela está presente no DOM', async () => {
      const table = canvasElement.querySelector('table');
      await expect(table).toBeInTheDocument();
    });

    await step('thead está presente', async () => {
      const thead = canvasElement.querySelector('thead');
      await expect(thead).toBeInTheDocument();
    });

    await step('tbody está presente', async () => {
      const tbody = canvasElement.querySelector('tbody');
      await expect(tbody).toBeInTheDocument();
    });

    await step('Todos os th têm scope="col"', async () => {
      const ths = canvasElement.querySelectorAll('th');
      await expect(ths.length).toBeGreaterThan(0);
      for (const th of Array.from(ths)) {
        await expect(th.getAttribute('scope')).toBe('col');
      }
    });

    await step('TableCaption está presente', async () => {
      const caption = canvasElement.querySelector('caption');
      await expect(caption).toBeInTheDocument();
      await expect(caption).toBeVisible();
    });

    await step('Tabela tem 5 linhas de dados no tbody', async () => {
      const rows = canvasElement.querySelectorAll('tbody tr');
      await expect(rows.length).toBe(5);
    });

    await step('TableFooter está presente', async () => {
      const tfoot = canvasElement.querySelector('tfoot');
      await expect(tfoot).toBeInTheDocument();
    });
  },
};
