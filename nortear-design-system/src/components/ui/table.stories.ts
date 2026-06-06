import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import {
  createTable,
  createTableHeader,
  createTableBody,
  createTableFooter,
  createTableRow,
  createTableHead,
  createTableCell,
  createTableCaption,
} from './table';
import { createTableDocs } from '@/components/docs/TableDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'UI/Table',
  tags: ['autodocs', 'tables'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createTableDocs) },
  },
};

export default meta;
type Story = StoryObj;

// ─── Dados de exemplo ─────────────────────────────────────────────────────────

const invoices = [
  { id: '#INV-001', status: 'Pago',      method: 'Cartão de crédito',  amount: 'R$ 250,00' },
  { id: '#INV-002', status: 'Pendente',  method: 'Boleto bancário',    amount: 'R$ 150,00' },
  { id: '#INV-003', status: 'Cancelado', method: 'Pix',                amount: 'R$ 350,00' },
  { id: '#INV-004', status: 'Pago',      method: 'Cartão de débito',   amount: 'R$ 450,00' },
  { id: '#INV-005', status: 'Pendente',  method: 'Transferência',      amount: 'R$ 200,00' },
];

// ─── Playground ───────────────────────────────────────────────────────────────

function buildPlaygroundTable(): HTMLElement {
  const { wrapper, table } = createTable();

  // Caption
  table.appendChild(createTableCaption('Lista de faturas recentes'));

  // Header
  const thead = createTableHeader();
  const headerRow = createTableRow();
  for (const label of ['Fatura', 'Status', 'Método', 'Valor']) {
    const th = createTableHead(label);
    th.setAttribute('scope', 'col');
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body
  const tbody = createTableBody();
  for (const inv of invoices) {
    const tr = createTableRow();
    tr.appendChild(createTableCell(inv.id));
    tr.appendChild(createTableCell(inv.status));
    tr.appendChild(createTableCell(inv.method));
    tr.appendChild(createTableCell(inv.amount));
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  // Footer
  const tfoot = createTableFooter();
  const footerRow = createTableRow();
  const totalLabel = createTableCell('Total');
  totalLabel.setAttribute('colspan', '3');
  footerRow.appendChild(totalLabel);
  footerRow.appendChild(createTableCell('R$ 1.400,00'));
  tfoot.appendChild(footerRow);
  table.appendChild(tfoot);

  return wrapper;
}

export const Playground: Story = {
  render: () => buildPlaygroundTable(),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Tabela está presente no DOM', async () => {
      const table = canvasElement.querySelector('table');
      await expect(table).not.toBeNull();
    });

    await step('Caption está visível', async () => {
      await expect(canvas.getByText('Lista de faturas recentes')).toBeVisible();
    });

    await step('Cabeçalhos possuem scope="col"', async () => {
      const headers = canvasElement.querySelectorAll('th[scope="col"]');
      await expect(headers.length).toBe(4);
    });

    await step('Dados de faturas são renderizados', async () => {
      await expect(canvas.getByText('#INV-001')).toBeVisible();
      await expect(canvas.getByText('#INV-005')).toBeVisible();
    });

    await step('Rodapé com total é renderizado', async () => {
      await expect(canvas.getByText('R$ 1.400,00')).toBeVisible();
    });
  },
};
