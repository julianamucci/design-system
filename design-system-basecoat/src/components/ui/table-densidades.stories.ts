import type { Meta, StoryObj } from '@storybook/html';
import {
  createTable, createTableHeader, createTableBody,
  createTableRow, createTableHead, createTableCell,
} from './table';

const meta: Meta = {
  title: 'UI/Table/Densidades',
};

export default meta;
type Story = StoryObj;

function buildDensityTable(headExtra: string, cellExtra: string): HTMLElement {
  const { wrapper, table } = createTable();
  const thead = createTableHeader();
  const trHead = createTableRow();
  ['Fatura', 'Status', 'Método', 'Valor'].forEach((label, i) => {
    const th = createTableHead(label, `${headExtra} ${i === 3 ? 'text-right' : ''}`.trim());
    th.setAttribute('scope', 'col');
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);

  const tbody = createTableBody();
  [
    ['INV001', 'Pago',     'Cartão de crédito', 'R$ 250,00'],
    ['INV002', 'Pendente', 'PayPal',            'R$ 150,00'],
    ['INV003', 'Pago',     'Transferência',     'R$ 350,00'],
    ['INV004', 'Pago',     'Cartão de crédito', 'R$ 450,00'],
  ].forEach((cells) => {
    const tr = createTableRow();
    cells.forEach((text, i) => {
      const extra = `${cellExtra} ${i === 0 ? 'font-medium' : ''} ${i === 3 ? 'text-right' : ''}`.trim();
      tr.appendChild(createTableCell(text, extra));
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  return wrapper;
}

export const Compact: Story = {
  name: 'Compact (h-8)',
  render: () => buildDensityTable('h-8', 'py-1'),
  parameters: {
    docs: {
      description: {
        story:
          'Densidade compacta (`h-8` no `TableHead`, `py-1` no `TableCell`). Use em dashboards com muitos dados onde a compactação visual é prioritária.',
      },
    },
  },
};

export const Default: Story = {
  name: 'Default (h-10)',
  render: () => buildDensityTable('', ''),
  parameters: {
    docs: {
      description: {
        story:
          'Densidade padrão — o `TableHead` já vem com `h-10` por padrão e o `TableCell` com `p-2`. Use em uso geral: equilíbrio entre densidade e legibilidade.',
      },
    },
  },
};

export const Comfortable: Story = {
  name: 'Comfortable (h-12)',
  render: () => buildDensityTable('h-12', 'py-4'),
  parameters: {
    docs: {
      description: {
        story:
          'Densidade confortável (`h-12` no `TableHead`, `py-4` no `TableCell`). Use quando células contêm conteúdo rico: avatares, badges, múltiplas ações ou descrições.',
      },
    },
  },
};
