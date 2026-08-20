import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { computed } from 'vue';
import { within, expect } from 'storybook/test';
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
import { INVOICES, TOTAL } from './table.fixtures';
import { tableSource } from './table.source';

interface TableArgs {
  captionVisivel: boolean;
  comRodape: boolean;
}

const meta: Meta<TableArgs> = {
  title: 'UI/Table',
  component: Table,
  tags: ['autodocs', 'tables'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(TableDocs), source: { transform: tableSource } },
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
  render: (args) => ({
    components: {
      Table,
      TableBody,
      TableCaption,
      TableCell,
      TableFooter,
      TableHead,
      TableHeader,
      TableRow,
    },
    setup() {
      // A classe da legenda é resolvida aqui, e não num ternário dentro do
      // template: no template ela vira texto, e o auditor de classe morta lê
      // `args.captionVisivel` e `undefined` como se fossem nomes de classe.
      const captionClass = computed(() => (args.captionVisivel ? undefined : 'nds-sr-only'));
      return { args, captionClass, invoices: INVOICES, total: TOTAL };
    },
    template: `
      <Table>
        <!-- A legenda nunca some do DOM: é ela que dá nome à tabela para o
             leitor de tela. O que muda é ficar ou não visível. -->
        <TableCaption :class="captionClass">
          Lista de faturas recentes
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Fatura</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Método</TableHead>
            <TableHead class="nds-text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="invoice in invoices" :key="invoice.id">
            <TableCell class="nds-font-medium">{{ invoice.id }}</TableCell>
            <TableCell>{{ invoice.status }}</TableCell>
            <TableCell>{{ invoice.method }}</TableCell>
            <TableCell class="nds-text-right">{{ invoice.amount }}</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter v-if="args.comRodape">
          <TableRow>
            <!-- colspan, e não :col-span: o Vue repassa o atributo com o nome
                 exato que foi escrito, e "col-span" não existe em HTML. A
                 célula ficava com uma coluna só, sem erro nenhum. -->
            <TableCell colspan="3">Total</TableCell>
            <TableCell class="nds-text-right">{{ total }}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('A tabela é uma tabela, com as seções semânticas no lugar', async () => {
      // functional.item1 — o que faz um leitor de tela anunciar "tabela, 4
      // colunas" é a tag, não a classe. Uma grade montada com div passaria
      // visualmente e sumiria da árvore de acessibilidade.
      const tabela = canvas.getByRole('table');
      await expect(tabela.tagName).toBe('TABLE');
      await expect(tabela).toHaveClass('nds-table');
      await expect(tabela).toHaveAttribute('data-slot', 'table');
      await expect(tabela.querySelector('thead')).toHaveAttribute('data-slot', 'table-header');
      await expect(tabela.querySelector('tbody')).toHaveAttribute('data-slot', 'table-body');
      await expect(tabela.querySelectorAll('tbody tr').length).toBe(INVOICES.length);
    });

    await step('A região rolável é alcançável por teclado', async () => {
      // `.nds-table-wrapper` é overflow-x auto, e sem tabindex quem navega sem
      // mouse nunca chega às colunas que ficaram fora da caixa
      // (axe scrollable-region-focusable, WCAG 2.1.1).
      const wrapper = canvasElement.querySelector<HTMLElement>('[data-slot="table-container"]')!;
      await expect(wrapper.tagName).toBe('DIV');
      await expect(wrapper).toHaveClass('nds-table-wrapper');
      await expect(wrapper).toHaveAttribute('tabindex', '0');
    });

    await step('Todo cabeçalho declara a coluna que representa', async () => {
      // accessibility.item1 — sem scope o leitor lê os valores sem dizer de que
      // coluna vieram. Nenhuma story acima passa `scope`: o default vem do
      // componente, e é isso que esta asserção guarda.
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

    await step('A coluna de valores alinha à direita, rótulo junto com os números', async () => {
      // visual.item1 — número se lê pela unidade, alinhado à direita, e o rótulo
      // tem de acompanhar. A asserção é do alinhamento COMPUTADO, não da classe:
      // enquanto o seletor de `th` do CSS vencia a utilitária, escrever a classe
      // não pintava nada e o markup passava verde com a coluna torta.
      const ths = [...canvasElement.querySelectorAll<HTMLElement>('thead th')];
      await expect(getComputedStyle(ths[3]).textAlign).toBe('right');
      await expect(getComputedStyle(ths[0]).textAlign).toBe('left');
    });

    await step('A legenda dá nome à tabela, visível ou não', async () => {
      // accessibility.item2 e functional.item6 — a classe de leitor de tela tira
      // da tela, não do DOM: some a duplicação visual e o nome acessível
      // continua existindo.
      const caption = canvasElement.querySelector<HTMLElement>('caption')!;
      await expect(caption).toHaveAttribute('data-slot', 'table-caption');
      await expect(caption).toHaveTextContent('Lista de faturas recentes');
      await expect(caption.classList.contains('nds-sr-only')).toBe(!args.captionVisivel);
      await expect(canvas.getByRole('table', { name: /faturas recentes/ })).toBeTruthy();
    });

    await step('O total vive no rodapé, não como mais uma linha', async () => {
      // functional.item3 — tfoot é anunciado como rodapé; a mesma célula dentro
      // do tbody entraria na contagem de registros. O `colspan` é o que faz o
      // rótulo "Total" cobrir as três colunas descritivas.
      const tfoot = canvasElement.querySelector<HTMLElement>('tfoot');
      if (!args.comRodape) {
        await expect(tfoot).toBeNull();
        return;
      }
      await expect(tfoot).toHaveAttribute('data-slot', 'table-footer');
      await expect(tfoot!.querySelector('td[colspan="3"]')).not.toBeNull();
      await expect(tfoot!).toHaveTextContent(TOTAL);
    });
  },
};
