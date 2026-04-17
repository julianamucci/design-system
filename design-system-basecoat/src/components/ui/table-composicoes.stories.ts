import type { Meta, StoryObj } from '@storybook/html';
import {
  createTable, createTableHeader, createTableBody, createTableFooter,
  createTableRow, createTableHead, createTableCell, createTableCaption,
} from './table';

const meta: Meta = {
  title: 'UI/Table/Composições',
};

export default meta;
type Story = StoryObj;

function headerRow(cols: { label: string; extra?: string }[]): HTMLTableSectionElement {
  const thead = createTableHeader();
  const tr = createTableRow();
  cols.forEach(({ label, extra }) => {
    const th = createTableHead(label, extra);
    th.setAttribute('scope', 'col');
    tr.appendChild(th);
  });
  thead.appendChild(tr);
  return thead;
}

function bodyRows(rows: string[][]): HTMLTableSectionElement {
  const tbody = createTableBody();
  rows.forEach((cells) => {
    const tr = createTableRow();
    cells.forEach((text, i) => {
      const extra = i === 0 ? 'font-medium' : i === cells.length - 1 ? 'text-right' : '';
      tr.appendChild(createTableCell(text, extra));
    });
    tbody.appendChild(tr);
  });
  return tbody;
}

export const Basic: Story = {
  name: 'Básica',
  render: () => {
    const { wrapper, table } = createTable();
    table.appendChild(headerRow([
      { label: 'Fatura', extra: 'w-[100px]' },
      { label: 'Status' },
      { label: 'Método' },
      { label: 'Valor', extra: 'text-right' },
    ]));
    table.appendChild(bodyRows([
      ['INV001', 'Pago',     'Cartão de crédito', 'R$ 250,00'],
      ['INV002', 'Pendente', 'PayPal',            'R$ 150,00'],
      ['INV003', 'Pago',     'Transferência',     'R$ 350,00'],
    ]));
    return wrapper;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Composição mais comum: apenas cabeçalho e corpo. Use quando a tabela não precisa de caption descritiva ou totais.',
      },
    },
  },
};

export const WithCaption: Story = {
  name: 'Com Caption',
  render: () => {
    const { wrapper, table } = createTable();
    table.appendChild(createTableCaption('Faturas dos últimos 30 dias.'));
    table.appendChild(headerRow([
      { label: 'Fatura', extra: 'w-[100px]' },
      { label: 'Status' },
      { label: 'Método' },
      { label: 'Valor', extra: 'text-right' },
    ]));
    table.appendChild(bodyRows([
      ['INV001', 'Pago',     'Cartão de crédito', 'R$ 250,00'],
      ['INV002', 'Pendente', 'PayPal',            'R$ 150,00'],
    ]));
    return wrapper;
  },
  parameters: {
    docs: {
      description: {
        story:
          '`<caption>` é renderizada abaixo da tabela (`caption-bottom`) e anunciada por leitores de tela antes dos cabeçalhos. Obrigatória quando a tabela precisa de contexto descritivo.',
      },
    },
  },
};

export const WithFooter: Story = {
  name: 'Com Footer (totais)',
  render: () => {
    const { wrapper, table } = createTable();
    table.appendChild(headerRow([
      { label: 'Fatura', extra: 'w-[100px]' },
      { label: 'Status' },
      { label: 'Método' },
      { label: 'Valor', extra: 'text-right' },
    ]));
    table.appendChild(bodyRows([
      ['INV001', 'Pago',     'Cartão de crédito', 'R$ 250,00'],
      ['INV002', 'Pendente', 'PayPal',            'R$ 150,00'],
      ['INV003', 'Pago',     'Transferência',     'R$ 350,00'],
    ]));
    const tfoot = createTableFooter();
    const trFoot = createTableRow();
    const tdTotal = createTableCell('Total');
    tdTotal.setAttribute('colspan', '3');
    trFoot.appendChild(tdTotal);
    trFoot.appendChild(createTableCell('R$ 750,00', 'text-right'));
    tfoot.appendChild(trFoot);
    table.appendChild(tfoot);
    return wrapper;
  },
  parameters: {
    docs: {
      description: {
        story:
          '`<tfoot>` agrega valores do corpo. Use `colspan` para que o rótulo "Total" ocupe as colunas não-numéricas e o valor fique alinhado com a coluna correspondente.',
      },
    },
  },
};

export const WithSelection: Story = {
  name: 'Com linha selecionada',
  render: () => {
    const { wrapper, table } = createTable();
    table.appendChild(headerRow([
      { label: 'Fatura', extra: 'w-[100px]' },
      { label: 'Status' },
      { label: 'Método' },
      { label: 'Valor', extra: 'text-right' },
    ]));
    const tbody = createTableBody();
    const rows = [
      ['INV001', 'Pago',     'Cartão de crédito', 'R$ 250,00'],
      ['INV002', 'Pendente', 'PayPal',            'R$ 150,00'],
      ['INV003', 'Pago',     'Transferência',     'R$ 350,00'],
    ];
    rows.forEach((cells, idx) => {
      const tr = createTableRow();
      if (idx === 1) tr.setAttribute('data-state', 'selected');
      cells.forEach((text, i) => {
        const extra = i === 0 ? 'font-medium' : i === cells.length - 1 ? 'text-right' : '';
        tr.appendChild(createTableCell(text, extra));
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    return wrapper;
  },
  parameters: {
    docs: {
      description: {
        story:
          'O atributo `data-state="selected"` na `<tr>` aplica fundo `bg-muted` persistente. Use em combinação com `Checkbox` para seleção múltipla.',
      },
    },
  },
};
