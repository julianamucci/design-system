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
import { createButton } from '@/components/ui/button';

const meta: Meta = {
  tags: ['tables'],
  title: 'UI/Table/Variantes',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const invoices = [
  { id: '#INV-001', status: 'Pago',      method: 'Cartão de crédito', amount: 'R$ 250,00' },
  { id: '#INV-002', status: 'Pendente',  method: 'Boleto bancário',   amount: 'R$ 150,00' },
  { id: '#INV-003', status: 'Cancelado', method: 'Pix',               amount: 'R$ 350,00' },
];

function buildHeader(table: HTMLTableElement, cols: string[]): void {
  const thead = createTableHeader();
  const tr = createTableRow();
  for (const col of cols) {
    const th = createTableHead(col);
    th.setAttribute('scope', 'col');
    tr.appendChild(th);
  }
  thead.appendChild(tr);
  table.appendChild(thead);
}

function buildBodyRows(table: HTMLTableElement, rows: typeof invoices): void {
  const tbody = createTableBody();
  for (const inv of rows) {
    const tr = createTableRow();
    tr.appendChild(createTableCell(inv.id));
    tr.appendChild(createTableCell(inv.status));
    tr.appendChild(createTableCell(inv.method));
    tr.appendChild(createTableCell(inv.amount));
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
}

// ─── Basica ───────────────────────────────────────────────────────────────────

export const Basica: Story = {
  render: () => {
    const { wrapper, table } = createTable();
    table.appendChild(createTableCaption('Lista de faturas recentes'));
    buildHeader(table, ['Fatura', 'Status', 'Método', 'Valor']);
    buildBodyRows(table, invoices);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Tabela básica renderizada', async () => {
      await expect(canvas.getByText('Lista de faturas recentes')).toBeVisible();
      await expect(canvasElement.querySelector('thead')).not.toBeNull();
      await expect(canvasElement.querySelector('tbody')).not.toBeNull();
      await expect(canvasElement.querySelector('tfoot')).toBeNull();
    });
    await step('Todos os th têm scope="col"', async () => {
      const headers = canvasElement.querySelectorAll('th[scope="col"]');
      await expect(headers.length).toBe(4);
    });
  },
};

// ─── ComRodape ────────────────────────────────────────────────────────────────

export const ComRodape: Story = {
  render: () => {
    const { wrapper, table } = createTable();
    table.appendChild(createTableCaption('Faturas com total'));
    buildHeader(table, ['Fatura', 'Status', 'Método', 'Valor']);
    buildBodyRows(table, invoices);

    const tfoot = createTableFooter();
    const footerRow = createTableRow();
    const totalLabel = createTableCell('Total');
    totalLabel.setAttribute('colspan', '3');
    footerRow.appendChild(totalLabel);
    footerRow.appendChild(createTableCell('R$ 750,00'));
    tfoot.appendChild(footerRow);
    table.appendChild(tfoot);

    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('TableFooter com total é renderizado', async () => {
      await expect(canvasElement.querySelector('tfoot')).not.toBeNull();
      await expect(canvas.getByText('R$ 750,00')).toBeVisible();
    });
  },
};

// ─── CaptionSrOnly ────────────────────────────────────────────────────────────

export const CaptionSrOnly: Story = {
  render: () => {
    const { wrapper, table } = createTable();
    table.appendChild(createTableCaption('Lista de faturas recentes', 'sr-only'));
    buildHeader(table, ['Fatura', 'Status', 'Método', 'Valor']);
    buildBodyRows(table, invoices);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    await step('Caption existe no DOM (para leitores de tela)', async () => {
      const caption = canvasElement.querySelector('caption');
      await expect(caption).not.toBeNull();
      await expect(caption?.classList.contains('sr-only')).toBe(true);
    });
  },
};

// ─── ComAcoesPorLinha ─────────────────────────────────────────────────────────

export const ComAcoesPorLinha: Story = {
  render: () => {
    const { wrapper, table } = createTable();
    table.appendChild(createTableCaption('Faturas com ações por linha'));
    buildHeader(table, ['Fatura', 'Status', 'Método', 'Valor', 'Ações']);

    const tbody = createTableBody();
    for (const inv of invoices) {
      const tr = createTableRow();
      tr.appendChild(createTableCell(inv.id));
      tr.appendChild(createTableCell(inv.status));
      tr.appendChild(createTableCell(inv.method));
      tr.appendChild(createTableCell(inv.amount));

      const actionCell = createTableCell('');
      const btn = createButton({
        variant: 'ghost',
        label: '...',
        ariaLabel: `Ações para fatura ${inv.id}`,
      });
      actionCell.appendChild(btn);
      tr.appendChild(actionCell);
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Botões de ação têm aria-label contextual', async () => {
      const btn = canvas.getByRole('button', { name: 'Ações para fatura #INV-001' });
      await expect(btn).toBeVisible();
    });
    await step('Coluna Ações presente no cabeçalho', async () => {
      await expect(canvas.getByText('Ações')).toBeVisible();
    });
  },
};
