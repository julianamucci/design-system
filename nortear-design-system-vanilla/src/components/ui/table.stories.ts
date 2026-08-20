import type { Meta, StoryObj } from '@storybook/html-vite';
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
import { tableSource } from './table.source';
import { createTableDocs } from '@/components/docs/TableDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { COLUNAS, INVOICES, TOTAL } from './table.fixtures';

// ─── Meta ─────────────────────────────────────────────────────────────────────

interface TableArgs {
  captionVisivel: boolean;
  comRodape: boolean;
}

const meta: Meta<TableArgs> = {
  title: 'UI/Table',
  tags: ['autodocs', 'tables'],
  parameters: {
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(createTableDocs),
      // O painel Code mostra a MONTAGEM das fábricas, e não o `outerHTML` da
      // tabela. A transform cascateia para todas as stories deste arquivo.
      source: { transform: tableSource },
    },
  },
  argTypes: {
    captionVisivel: {
      control: 'boolean',
      description:
        'Legenda visível ou apenas para leitor de tela. Ela nunca sai do DOM — é o nome da tabela.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    comRodape: {
      control: 'boolean',
      description:
        'Renderiza o rodapé com o total. Rodapé é para sumário, nunca para mais um registro.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
  },
  args: { captionVisivel: false, comRodape: true },
};

export default meta;
type Story = StoryObj<TableArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

function buildPlaygroundTable(args: TableArgs): HTMLElement {
  const { wrapper, table } = createTable();

  // A legenda nunca some do DOM: é ela que dá nome à tabela para o leitor de
  // tela. O que muda é ficar ou não visível.
  table.appendChild(
    createTableCaption(
      'Lista de faturas recentes',
      args.captionVisivel ? undefined : 'nds-sr-only',
    ),
  );

  const thead = createTableHeader();
  const headerRow = createTableRow();
  for (const [i, label] of COLUNAS.entries()) {
    // A última coluna é numérica: rótulo alinhado com os próprios números.
    headerRow.appendChild(createTableHead(label, i === COLUNAS.length - 1 ? 'nds-text-right' : undefined));
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = createTableBody();
  for (const inv of INVOICES) {
    const tr = createTableRow();
    tr.appendChild(createTableCell(inv.id, 'nds-font-medium'));
    tr.appendChild(createTableCell(inv.status));
    tr.appendChild(createTableCell(inv.method));
    tr.appendChild(createTableCell(inv.amount, 'nds-text-right'));
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  if (args.comRodape) {
    const tfoot = createTableFooter();
    const footerRow = createTableRow();
    const totalLabel = createTableCell('Total');
    totalLabel.setAttribute('colspan', '3');
    footerRow.appendChild(totalLabel);
    footerRow.appendChild(createTableCell(TOTAL, 'nds-text-right'));
    tfoot.appendChild(footerRow);
    table.appendChild(tfoot);
  }

  return wrapper;
}

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item3',
      'functional.item6',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item4',
      'visual.item1',
      'visual.item3',
    ],
  },
  render: (args) => buildPlaygroundTable(args),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('A tabela é uma tabela, com as seções semânticas no lugar', async () => {
      // functional.item1 — o que faz um leitor de tela anunciar "tabela, 4
      // colunas" é a tag, não a classe. Uma grade montada com div passaria
      // visualmente e sumiria da árvore de acessibilidade.
      const tabela = canvas.getByRole('table');
      await expect(tabela.tagName).toBe('TABLE');
      await expect(tabela).toHaveClass('nds-table');
      await expect(tabela.querySelector('thead')).not.toBeNull();
      await expect(tabela.querySelector('tbody')).not.toBeNull();
      await expect(tabela.querySelectorAll('tbody tr').length).toBe(INVOICES.length);
    });

    await step('A região rolável é alcançável por teclado', async () => {
      // `.nds-table-wrapper` é overflow-x auto, e sem tabindex quem navega sem
      // mouse nunca chega às colunas que ficaram fora da caixa
      // (axe scrollable-region-focusable, WCAG 2.1.1).
      const wrapper = canvasElement.querySelector<HTMLElement>('.nds-table-wrapper')!;
      await expect(wrapper.tagName).toBe('DIV');
      await expect(wrapper).toHaveAttribute('tabindex', '0');
    });

    await step('Todo cabeçalho declara a coluna que representa', async () => {
      // accessibility.item1 — sem scope o leitor lê os valores sem dizer de que
      // coluna vieram. Nenhuma chamada acima passa `scope`: o default vem da
      // factory, e é isso que esta asserção guarda.
      const cabecalhos = [...canvasElement.querySelectorAll<HTMLElement>('th')];
      await expect(cabecalhos.length).toBe(COLUNAS.length);
      for (const th of cabecalhos) {
        await expect(th).toHaveAttribute('scope', 'col');
        // Coluna sem ordenação não anuncia ordenação — aria-sort="none" diria
        // que dá para ordenar, e não dá.
        await expect(th.hasAttribute('aria-sort')).toBe(false);
      }
    });

    await step('A coluna de valores alinha à direita, rótulo junto com os números', async () => {
      // visual.item1 — número se lê pela unidade, alinhado à direita, e o rótulo
      // tem de acompanhar. Esta stack não escrevia a classe em lugar nenhum: a
      // coluna de valores saía alinhada à esquerda como as descritivas.
      const ths = [...canvasElement.querySelectorAll<HTMLElement>('thead th')];
      await expect(getComputedStyle(ths[3]).textAlign).toBe('right');
      await expect(getComputedStyle(ths[0]).textAlign).toBe('left');
      const valorTd = canvasElement.querySelector<HTMLElement>('tbody tr td:last-child')!;
      await expect(getComputedStyle(valorTd).textAlign).toBe('right');
    });

    await step('A legenda dá nome à tabela, visível ou não', async () => {
      // accessibility.item2 e functional.item6 — a classe de leitor de tela tira
      // da tela, não do DOM. A asserção é do EFEITO: esta stack passava
      // `'sr-only'`, sem prefixo, e a legenda ficava visível — a story antiga
      // conferia o nome da classe e ficava verde guardando o defeito.
      const caption = canvasElement.querySelector<HTMLElement>('caption')!;
      await expect(caption).toHaveTextContent('Lista de faturas recentes');
      const escondida = getComputedStyle(caption).position === 'absolute';
      await expect(escondida).toBe(!args.captionVisivel);
      await expect(canvas.getByRole('table', { name: /faturas recentes/ })).toBeTruthy();
    });

    await step('O total vive no rodapé, não como mais uma linha', async () => {
      // functional.item3 — tfoot é anunciado como rodapé; a mesma célula dentro
      // do tbody entraria na contagem de registros.
      const tfoot = canvasElement.querySelector<HTMLElement>('tfoot');
      if (!args.comRodape) {
        await expect(tfoot).toBeNull();
        return;
      }
      await expect(tfoot!.querySelector('td[colspan="3"]')).not.toBeNull();
      await expect(tfoot!).toHaveTextContent(TOTAL);
    });
  },
};
