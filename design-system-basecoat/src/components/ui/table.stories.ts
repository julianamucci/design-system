import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import {
  createTable, createTableHeader, createTableBody, createTableFooter,
  createTableRow, createTableHead, createTableCell, createTableCaption,
} from './table';
import { createTableDocs } from '@/components/docs/TableDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

type TableArgs = Record<string, never>;

const meta: Meta<TableArgs> = {
  title: 'UI/Table',
  tags: ['autodocs'],
  parameters: {
    docs: { page: withAutoDocsTab(createTableDocs) },
  },
};

export default meta;
type Story = StoryObj<TableArgs>;

const INVOICES = [
  { invoice: 'INV001', status: 'Pago',       method: 'Cartão de crédito',  amount: 'R$ 250,00' },
  { invoice: 'INV002', status: 'Pendente',   method: 'PayPal',             amount: 'R$ 150,00' },
  { invoice: 'INV003', status: 'Em aberto',  method: 'Transferência',      amount: 'R$ 350,00' },
  { invoice: 'INV004', status: 'Pago',       method: 'Cartão de crédito',  amount: 'R$ 450,00' },
  { invoice: 'INV005', status: 'Pago',       method: 'PayPal',             amount: 'R$ 550,00' },
];

/**
 * Tabela completa com `<caption>`, `<thead>`, `<tbody>` e `<tfoot>`.
 * Cobre a estrutura semântica recomendada para dados tabulares.
 *
 * @summary Demonstração interativa do componente Table.
 */
export const Playground: Story = {
  render: () => {
    const { wrapper, table } = createTable();
    table.appendChild(createTableCaption('Lista das faturas recentes.'));

    const thead = createTableHeader();
    const trHead = createTableRow();
    const headCols = [
      { label: 'Fatura',  extra: 'w-[100px]' },
      { label: 'Status',  extra: '' },
      { label: 'Método',  extra: '' },
      { label: 'Valor',   extra: 'text-right' },
    ];
    headCols.forEach(({ label, extra }) => {
      const th = createTableHead(label, extra);
      th.setAttribute('scope', 'col');
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    const tbody = createTableBody();
    INVOICES.forEach((row) => {
      const tr = createTableRow();
      tr.appendChild(createTableCell(row.invoice, 'font-medium'));
      tr.appendChild(createTableCell(row.status));
      tr.appendChild(createTableCell(row.method));
      tr.appendChild(createTableCell(row.amount, 'text-right'));
      tbody.appendChild(tr);
    });

    const tfoot = createTableFooter();
    const trFoot = createTableRow();
    const tdTotal = createTableCell('Total');
    tdTotal.setAttribute('colspan', '3');
    trFoot.appendChild(tdTotal);
    trFoot.appendChild(createTableCell('R$ 1.750,00', 'text-right'));
    tfoot.appendChild(trFoot);

    table.appendChild(thead);
    table.appendChild(tbody);
    table.appendChild(tfoot);
    return wrapper;
  },
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
      const firstRow = canvasElement.querySelectorAll('tbody tr')[0] as HTMLElement;
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
