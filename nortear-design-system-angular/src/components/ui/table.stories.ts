import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect } from 'storybook/test';
import {
  NdsTable,
  NdsTableBody,
  NdsTableCaption,
  NdsTableCell,
  NdsTableFooter,
  NdsTableHead,
  NdsTableHeader,
  NdsTableRow,
  NdsTableWrapper,
} from './table';
import { NdsTableDocs } from '@/components/docs/TableDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { INVOICES, TOTAL } from './table.fixtures';
import { tablePlaygroundSource, type TableArgs } from './table.source';

const meta: Meta<TableArgs> = {
  title: 'Components/Tables/Table',
  tags: ['autodocs', 'tables'],
  decorators: [
    moduleMetadata({
      imports: [
        NdsTableWrapper,
        NdsTable,
        NdsTableCaption,
        NdsTableHeader,
        NdsTableBody,
        NdsTableFooter,
        NdsTableRow,
        NdsTableHead,
        NdsTableCell,
      ],
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsTableDocs) },
  },
  argTypes: {
    captionVisible: {
      control: 'boolean',
      description:
        'Legenda visível ou apenas para leitor de tela (nds-sr-only). Ela nunca sai do DOM — é o nome da tabela.',
    },
    withFooter: {
      control: 'boolean',
      description: 'Renderiza o tfoot com o total. Rodapé é para sumário, nunca para mais um registro.',
    },
  },
  args: { captionVisible: false, withFooter: true },
};

export default meta;
type Story = StoryObj<TableArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

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
    docs: { source: { transform: tablePlaygroundSource } },
  },
  render: (args) => ({
    props: { ...args, faturas: INVOICES },
    template: `
      <div ndsTableWrapper>
        <table ndsTable>
          <caption ndsTableCaption [class]="captionVisible ? '' : 'nds-sr-only'">
            Lista de faturas recentes
          </caption>
          <thead ndsTableHeader>
            <tr ndsTableRow>
              <th ndsTableHead>Fatura</th>
              <th ndsTableHead>Status</th>
              <th ndsTableHead>Método</th>
              <th ndsTableHead class="nds-text-right">Valor</th>
            </tr>
          </thead>
          <tbody ndsTableBody>
            @for (invoice of faturas; track invoice.id) {
              <tr ndsTableRow>
                <td ndsTableCell class="nds-font-medium">{{ invoice.id }}</td>
                <td ndsTableCell>{{ invoice.status }}</td>
                <td ndsTableCell>{{ invoice.metodo }}</td>
                <td ndsTableCell class="nds-text-right">{{ invoice.value }}</td>
              </tr>
            }
          </tbody>
          @if (withFooter) {
            <tfoot ndsTableFooter>
              <tr ndsTableRow>
                <td ndsTableCell colspan="3">Total</td>
                <td ndsTableCell class="nds-text-right">${TOTAL}</td>
              </tr>
            </tfoot>
          }
        </table>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('A tabela é uma tabela, com as seções semânticas no lugar', async () => {
      // functional.item1 — o que faz um leitor de tela anunciar "tabela, 4
      // colunas" é a tag, não a classe. Uma grade montada com div passaria
      // visualmente e sumiria da árvore de acessibilidade.
      const table = canvas.getByRole('table');
      await expect(table.tagName).toBe('TABLE');
      await expect(table).toHaveClass('nds-table');
      await expect(table).toHaveAttribute('data-slot', 'table');
      await expect(table.querySelector('thead')).toHaveAttribute('data-slot', 'table-header');
      await expect(table.querySelector('tbody')).toHaveAttribute('data-slot', 'table-body');
      await expect(table.querySelectorAll('tbody tr').length).toBe(INVOICES.length);
    });

    await step('A região rolável é alcançável por teclado', async () => {
      // accessibility.item4 na prática: `.nds-table-wrapper` é overflow-x auto,
      // e sem tabindex quem navega sem mouse nunca chega às colunas que ficaram
      // fora da caixa (axe scrollable-region-focusable).
      const wrapper = canvasElement.querySelector<HTMLElement>('[data-slot="table-container"]')!;
      await expect(wrapper.tagName).toBe('DIV');
      await expect(wrapper).toHaveClass('nds-table-wrapper');
      await expect(wrapper).toHaveAttribute('tabindex', '0');
    });

    await step('Todo cabeçalho declara a coluna que representa', async () => {
      // accessibility.item1 — sem scope o leitor lê os valores sem dizer de que
      // coluna vieram. O default vem da diretiva: ninguém precisa lembrar.
      const cabecalhos = [...canvasElement.querySelectorAll<HTMLElement>('th')];
      await expect(cabecalhos.length).toBe(4);
      for (const th of cabecalhos) {
        await expect(th).toHaveAttribute('scope', 'col');
        await expect(th).toHaveAttribute('data-slot', 'table-head');
        // Coluna sem ordenação não anuncia ordenação — aria-sort="none" diria
        // que dá para ordenar, e não dá.
        await expect(th.hasAttribute('aria-sort')).toBe(false);
      }
    });

    await step('A legenda dá nome à tabela, visível ou não', async () => {
      // accessibility.item2 e functional.item6 — sr-only tira da tela, não do
      // DOM: some a duplicação visual e o nome acessível continua existindo.
      const caption = canvasElement.querySelector<HTMLElement>('caption')!;
      await expect(caption).toHaveAttribute('data-slot', 'table-caption');
      await expect(caption).toHaveTextContent('Lista de faturas recentes');
      await expect(caption.classList.contains('nds-sr-only')).toBe(!args.captionVisible);
      // O nome acessível da tabela sai do caption — é o que prova que ele foi
      // lido como legenda, e não como um texto solto qualquer.
      await expect(canvas.getByRole('table', { name: /faturas recentes/ })).toBeTruthy();
    });

    await step('O total vive no rodapé, não como mais uma linha', async () => {
      // functional.item3 — tfoot é anunciado como rodapé; a mesma célula dentro
      // do tbody entraria na contagem de registros.
      const tfoot = canvasElement.querySelector<HTMLElement>('tfoot');
      if (!args.withFooter) {
        await expect(tfoot).toBeNull();
        return;
      }
      await expect(tfoot).toHaveAttribute('data-slot', 'table-footer');
      await expect(tfoot!.querySelector('td[colspan="3"]')).not.toBeNull();
      await expect(tfoot!).toHaveTextContent(TOTAL);
    });
  },
};
