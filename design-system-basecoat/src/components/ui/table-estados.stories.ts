import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import {
  createTable, createTableHeader, createTableBody,
  createTableRow, createTableHead, createTableCell,
} from './table';

const meta: Meta = {
  title: 'UI/Table/Estados',
};

export default meta;
type Story = StoryObj;

function headerRow(labels: string[]): HTMLTableSectionElement {
  const thead = createTableHeader();
  const tr = createTableRow();
  labels.forEach((label) => {
    const th = createTableHead(label);
    th.setAttribute('scope', 'col');
    tr.appendChild(th);
  });
  thead.appendChild(tr);
  return thead;
}

export const Hover: Story = {
  name: 'Hover (automático)',
  render: () => {
    const { wrapper, table } = createTable();
    table.appendChild(headerRow(['Fatura', 'Status', 'Valor']));
    const tbody = createTableBody();
    [
      ['INV001', 'Pago',     'R$ 250,00'],
      ['INV002', 'Pendente', 'R$ 150,00'],
      ['INV003', 'Pago',     'R$ 350,00'],
    ].forEach((cells) => {
      const tr = createTableRow();
      cells.forEach((text, i) => {
        tr.appendChild(createTableCell(text, i === 0 ? 'font-medium' : ''));
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Hover em linha do body aplica bg-muted/50', async () => {
      const firstRow = canvas.getAllByRole('row')[1] as HTMLElement;
      await userEvent.hover(firstRow);
      await expect(firstRow.className).toContain('hover:bg-muted/50');
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          '`TableRow` aplica `hover:bg-muted/50` automaticamente — sem prop. O efeito vale para linhas do `<tbody>` e do `<tfoot>`.',
      },
    },
  },
};

export const Selected: Story = {
  name: 'Selecionada (data-state)',
  render: () => {
    const { wrapper, table } = createTable();
    table.appendChild(headerRow(['Fatura', 'Status', 'Valor']));
    const tbody = createTableBody();
    const rows = [
      ['INV001', 'Pago',     'R$ 250,00'],
      ['INV002', 'Pendente', 'R$ 150,00'],
      ['INV003', 'Pago',     'R$ 350,00'],
    ];
    rows.forEach((cells, idx) => {
      const tr = createTableRow();
      if (idx === 1) tr.setAttribute('data-state', 'selected');
      cells.forEach((text, i) => {
        tr.appendChild(createTableCell(text, i === 0 ? 'font-medium' : ''));
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    await step('Linha com data-state=selected aplica bg-muted persistente', async () => {
      const selected = canvasElement.querySelector('tr[data-state="selected"]');
      await expect(selected).toBeInTheDocument();
      await expect(selected?.className).toContain('data-[state=selected]:bg-muted');
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Aplique `data-state="selected"` na `<tr>` para marcar uma linha como selecionada. O fundo `bg-muted` persiste independente de hover.',
      },
    },
  },
};

export const Empty: Story = {
  name: 'Vazio',
  render: () => {
    const { wrapper, table } = createTable();
    table.appendChild(headerRow(['Fatura', 'Status', 'Valor']));
    const tbody = createTableBody();
    const tr = createTableRow();
    const td = createTableCell('Nenhuma fatura encontrada. Crie a primeira.', 'text-center text-muted-foreground py-8');
    td.setAttribute('colspan', '3');
    tr.appendChild(td);
    tbody.appendChild(tr);
    table.appendChild(tbody);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    await step('Renderiza linha única com colspan cobrindo todas as colunas', async () => {
      const cells = canvasElement.querySelectorAll('tbody td');
      await expect(cells.length).toBe(1);
      await expect(cells[0].getAttribute('colspan')).toBe('3');
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Estado vazio: linha única com `colspan` igual ao número de colunas da tabela. O texto deve descrever o vazio e sugerir próxima ação — nunca apenas "Vazio".',
      },
    },
  },
};

export const Scroll: Story = {
  name: 'Scroll horizontal (automático)',
  render: () => {
    const container = document.createElement('div');
    container.style.maxWidth = '400px';
    const { wrapper, table } = createTable();
    const wideCols = ['Fatura', 'Status', 'Método', 'Valor', 'Data', 'Vencimento', 'Descrição', 'Observações'];
    table.appendChild(headerRow(wideCols));
    const tbody = createTableBody();
    const row = createTableRow();
    ['INV001', 'Pago', 'Cartão de crédito', 'R$ 250,00', '01/04/2026', '15/04/2026', 'Assinatura mensal', 'Processado via Stripe'].forEach((text) => {
      row.appendChild(createTableCell(text));
    });
    tbody.appendChild(row);
    table.appendChild(tbody);
    container.appendChild(wrapper);
    return container;
  },
  play: async ({ canvasElement, step }) => {
    await step('Wrapper aplica overflow-x-auto quando tabela excede a largura', async () => {
      const wrapper = canvasElement.querySelector('div.overflow-x-auto');
      await expect(wrapper).toBeInTheDocument();
      await expect(wrapper?.className).toContain('overflow-x-auto');
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'O wrapper de `Table` aplica `overflow-x-auto`, fazendo a barra de rolagem horizontal aparecer automaticamente quando a tabela excede a largura do container.',
      },
    },
  },
};
