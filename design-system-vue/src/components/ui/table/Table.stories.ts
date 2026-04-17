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
  tags: ['autodocs'],
  parameters: {
    docs: { page: withAutoDocsTab(TableDocs) },
  },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => ({
    components: {
      Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow,
    },
    template: `
      <Table>
        <TableCaption>Lista das faturas recentes.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[100px]" scope="col">Fatura</TableHead>
            <TableHead scope="col">Status</TableHead>
            <TableHead scope="col">Método</TableHead>
            <TableHead class="text-right" scope="col">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell class="font-medium">INV001</TableCell>
            <TableCell>Pago</TableCell>
            <TableCell>Cartão de crédito</TableCell>
            <TableCell class="text-right">R$ 250,00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-medium">INV002</TableCell>
            <TableCell>Pendente</TableCell>
            <TableCell>PayPal</TableCell>
            <TableCell class="text-right">R$ 150,00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-medium">INV003</TableCell>
            <TableCell>Em aberto</TableCell>
            <TableCell>Transferência</TableCell>
            <TableCell class="text-right">R$ 350,00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-medium">INV004</TableCell>
            <TableCell>Pago</TableCell>
            <TableCell>Cartão de crédito</TableCell>
            <TableCell class="text-right">R$ 450,00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-medium">INV005</TableCell>
            <TableCell>Pago</TableCell>
            <TableCell>PayPal</TableCell>
            <TableCell class="text-right">R$ 550,00</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell :colspan="3">Total</TableCell>
            <TableCell class="text-right">R$ 1.750,00</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Renderiza elemento <table>', async () => {
      const table = canvas.getByRole('table');
      await expect(table).toBeInTheDocument();
    });

    await step('Renderiza <caption> visível abaixo da tabela', async () => {
      const caption = canvasElement.querySelector('caption');
      await expect(caption).toBeInTheDocument();
      await expect(caption).toHaveTextContent('Lista das faturas recentes.');
    });

    await step('Todos os <th> usam scope=col', async () => {
      const headers = canvasElement.querySelectorAll('th');
      await expect(headers.length).toBeGreaterThan(0);
      headers.forEach((th) => {
        expect(th.getAttribute('scope')).toBe('col');
      });
    });

    await step('Corpo da tabela tem 5 linhas de dados', async () => {
      const bodyRows = canvasElement.querySelectorAll('tbody tr');
      await expect(bodyRows.length).toBe(5);
    });

    await step('Footer renderiza célula com colspan=3', async () => {
      const footerCell = canvasElement.querySelector('tfoot td');
      await expect(footerCell).toBeInTheDocument();
      await expect(footerCell?.getAttribute('colspan')).toBe('3');
    });

    await step('Hover em linha aplica bg-muted/50', async () => {
      const firstRow = canvasElement.querySelectorAll('tbody tr')[0];
      await userEvent.hover(firstRow);
      await expect(firstRow.className).toContain('hover:bg-muted/50');
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Cobre os critérios de estrutura semântica: <caption> presente, <th> com scope, body e footer com colspan, hover automático em linhas. Veja a aba **Interactions** para acompanhar a execução.',
      },
    },
  },
};
