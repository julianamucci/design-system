import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import {
  createTable,
  createTableHeader,
  createTableBody,
  createTableRow,
  createTableHead,
  createTableCell,
  createTableCaption,
} from './table';

const meta: Meta = {
  tags: ['tables'],
  title: 'UI/Table/Estados',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildStandardHeader(table: HTMLTableElement): void {
  const thead = createTableHeader();
  const tr = createTableRow();
  for (const col of ['Fatura', 'Status', 'Método', 'Valor']) {
    const th = createTableHead(col);
    th.setAttribute('scope', 'col');
    tr.appendChild(th);
  }
  thead.appendChild(tr);
  table.appendChild(thead);
}

// ─── Empty ────────────────────────────────────────────────────────────────────

export const Empty: Story = {
  render: () => {
    const { wrapper, table } = createTable();
    table.appendChild(createTableCaption('Lista de faturas recentes'));
    buildStandardHeader(table);

    const tbody = createTableBody();
    const emptyRow = createTableRow();
    const emptyCell = createTableCell('Nenhuma fatura encontrada.', 'h-24 text-center text-muted-foreground');
    emptyCell.setAttribute('colspan', '4');
    emptyRow.appendChild(emptyCell);
    tbody.appendChild(emptyRow);
    table.appendChild(tbody);

    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Mensagem de empty state é visível', async () => {
      await expect(canvas.getByText('Nenhuma fatura encontrada.')).toBeVisible();
    });
    await step('Célula de empty state ocupa todas as colunas', async () => {
      const td = canvasElement.querySelector('td[colspan="4"]');
      await expect(td).not.toBeNull();
    });
  },
};

// ─── LinhaSelecionada ─────────────────────────────────────────────────────────

export const LinhaSelecionada: Story = {
  render: () => {
    const invoices = [
      { id: '#INV-001', status: 'Pago',     method: 'Cartão de crédito', amount: 'R$ 250,00' },
      { id: '#INV-002', status: 'Pendente', method: 'Boleto bancário',   amount: 'R$ 150,00' },
      { id: '#INV-003', status: 'Cancelado', method: 'Pix',              amount: 'R$ 350,00' },
    ];

    const { wrapper, table } = createTable();
    table.appendChild(createTableCaption('Faturas — linha selecionada'));
    buildStandardHeader(table);

    const tbody = createTableBody();
    for (const inv of invoices) {
      const tr = createTableRow();
      if (inv.id === '#INV-002') {
        tr.setAttribute('data-state', 'selected');
        tr.className = 'nds-bg-muted';
      }
      tr.appendChild(createTableCell(inv.id));
      tr.appendChild(createTableCell(inv.status));
      tr.appendChild(createTableCell(inv.method));
      tr.appendChild(createTableCell(inv.amount));
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    await step('Linha selecionada possui data-state="selected"', async () => {
      const selectedRow = canvasElement.querySelector('tr[data-state="selected"]');
      await expect(selectedRow).not.toBeNull();
    });
    await step('Apenas uma linha está selecionada', async () => {
      const selectedRows = canvasElement.querySelectorAll('tr[data-state="selected"]');
      await expect(selectedRows.length).toBe(1);
    });
  },
};

// ─── Carregando ───────────────────────────────────────────────────────────────

export const Carregando: Story = {
  render: () => {
    const { wrapper, table } = createTable();
    table.appendChild(createTableCaption('Faturas — carregando'));
    buildStandardHeader(table);

    const tbody = createTableBody();
    for (let i = 0; i < 4; i++) {
      const tr = createTableRow();
      for (let j = 0; j < 4; j++) {
        const td = createTableCell('');
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton nds-rounded';
        skeleton.style.height = '1rem';
        skeleton.style.width = j === 3 ? '5rem' : '100%';
        skeleton.setAttribute('aria-hidden', 'true');
        td.appendChild(skeleton);
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    await step('Skeletons de loading são renderizados', async () => {
      const skeletons = canvasElement.querySelectorAll('.skeleton');
      await expect(skeletons.length).toBe(16);
    });
    await step('Skeletons têm aria-hidden para leitores de tela', async () => {
      const first = canvasElement.querySelector('[aria-hidden="true"]');
      await expect(first).not.toBeNull();
    });
  },
};
