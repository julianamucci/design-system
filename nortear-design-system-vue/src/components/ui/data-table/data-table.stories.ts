import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { userEvent, waitFor, within, expect, fn } from 'storybook/test';
import { DataTable } from './index';
import { baseColumns, invoices } from './data-table.fixtures';
import DataTableDocs from '@/components/docs/DataTableDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

/**
 * O painel Code imprime a story como está escrita — com a fixture do arquivo e
 * os spies das actions. O `transform` devolve o uso real, com o valor atual dos
 * controls já resolvido.
 */
function playgroundSource(
  _gerado: string,
  ctx: { args?: Record<string, unknown> },
): string {
  const a = ctx.args ?? {};
  const enableRowSelection = a.enableRowSelection !== false;
  const enablePagination = a.enablePagination !== false;
  const pageSize = (a.pageSize as number) ?? 10;
  const flags = [
    enableRowSelection ? '  :enable-row-selection="true"' : null,
    enablePagination ? null : '  :enable-pagination="false"',
    pageSize === 10 ? null : `  :page-size="${pageSize}"`,
  ]
    .filter(Boolean)
    .join('\n');

  return `<script setup lang="ts">
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';

interface Invoice { id: string; customer: string; status: string; method: string; amount: number }

// Definidas UMA vez, em escopo estável: recriar o array a cada render zeraria
// ordenação, filtros e seleção.
const columns: DataTableColumn<Invoice>[] = [
  { accessorKey: 'id', header: 'Fatura', size: 110 },
  { accessorKey: 'customer', header: 'Cliente', size: 200 },
  { accessorKey: 'status', header: 'Status', size: 140 },
  { accessorKey: 'method', header: 'Método', size: 200 },
  { accessorKey: 'amount', header: 'Valor', size: 130 },
];
<\/script>

<template>
  <DataTable
    :columns="columns"
    :data="invoices"
${flags}
    global-filter-placeholder="Buscar fatura, cliente, método..."
  />
</template>`;
}

const meta: Meta<Record<string, unknown>> = {
  title: 'UI/DataTable',
  component: DataTable as never,
  tags: ['autodocs', 'tables'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(DataTableDocs) },
  },
  argTypes: {
    enableRowSelection: {
      control: 'boolean',
      description:
        'Primeira coluna vira checkbox de seleção, com tri-state no cabeçalho e contagem anunciada por região viva.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    enableGlobalFilter: {
      control: 'boolean',
      description: 'Campo de busca livre na toolbar. Casa em todas as colunas, inclusive nas escondidas.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    enableColumnVisibility: {
      control: 'boolean',
      description: 'Menu na toolbar para esconder e exibir colunas.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    enablePagination: {
      control: 'boolean',
      description: 'Rodapé com contagem, seletor de tamanho e navegação por página.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    pageSize: {
      control: { type: 'number', min: 1, max: 50, step: 1 },
      description: 'Linhas por página no primeiro render. Depois quem manda é o seletor do rodapé.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '10' } },
    },
    globalFilterPlaceholder: {
      control: 'text',
      description: 'Texto do campo de busca. Serve também como nome acessível do campo.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'Buscar...'" } },
    },
    emptyMessage: {
      control: 'text',
      description: 'Texto exibido quando o recorte não devolve nenhuma linha.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'Sem resultados.'" } },
    },
    onCellEdit: {
      description: 'Disparado ao confirmar uma edição inline, com (rowIndex, columnId, value).',
      table: { type: { summary: '(rowIndex, columnId, value) => void' }, defaultValue: { summary: '—' } },
      control: false,
    },
    onTableReady: {
      description: 'Recebe a instância headless da tabela para leitura de estado de fora.',
      table: { type: { summary: '(table) => void' }, defaultValue: { summary: '—' } },
      control: false,
    },
    // `columns` e `data` são estruturas grandes: control ligado só polui o
    // painel e nenhum valor digitado à mão monta uma tabela válida.
    columns: { control: false, table: { type: { summary: 'DataTableColumn<TData>[]' } } },
    data: { control: false, table: { type: { summary: 'TData[]' } } },
  },
  args: {
    columns: baseColumns,
    data: invoices,
    enableRowSelection: true,
    enableGlobalFilter: true,
    enableColumnVisibility: true,
    enablePagination: true,
    pageSize: 10,
    globalFilterPlaceholder: 'Buscar fatura, cliente, método...',
    emptyMessage: 'Sem resultados.',
    onCellEdit: fn(),
    onTableReady: fn(),
  },
};

export default meta;
type Story = StoryObj<Record<string, unknown>>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item3',
      'functional.item4',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item3',
      'accessibility.item4',
      'visual.item1',
    ],
    docs: { source: { transform: playgroundSource } },
  },
  render: (args) => ({
    components: { DataTable },
    setup() {
      return { args };
    },
    template: `<DataTable v-bind="args" />`,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const linhas = () => [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
    const primeiraCelula = () =>
      linhas()[0].querySelector<HTMLElement>("td:not(:has([role='checkbox']))")!;
    const caixaDeTudo = () => canvas.getByRole('checkbox', { name: 'Selecionar todas as linhas' });
    const regiaoViva = () => canvasElement.querySelector<HTMLElement>("[role='status']")!;

    /** Estabelece a precondição do passo: sem ordem aplicada, venha de onde vier. */
    const zerarOrdenacao = async (botao: HTMLElement) => {
      const th = botao.closest('th')!;
      for (let i = 0; i < 3 && th.getAttribute('aria-sort') !== 'none'; i++) {
        await userEvent.click(botao);
      }
      await waitFor(() => expect(th).toHaveAttribute('aria-sort', 'none'));
    };
    /** Clica só se o estado ainda não é o desejado — sobrevive ao replay. */
    const marcar = async (caixa: HTMLElement, alvo: 'true' | 'false') => {
      if (caixa.getAttribute('aria-checked') !== alvo) await userEvent.click(caixa);
      await waitFor(() => expect(caixa).toHaveAttribute('aria-checked', alvo));
    };

    await step('É uma tabela de verdade, com seções semânticas', async () => {
      // accessibility.item1 — o que faz um leitor anunciar "tabela, 6 colunas" é
      // a TAG, não a classe. A mesma grade montada com div sumiria da árvore de
      // acessibilidade sem mudar um pixel.
      const tabela = canvas.getByRole('table');
      await expect(tabela.tagName).toBe('TABLE');
      await expect(tabela).toHaveAttribute('data-slot', 'table');
      await expect(tabela.querySelector('thead')).toHaveAttribute('data-slot', 'table-header');
      await expect(tabela.querySelector('tbody')).toHaveAttribute('data-slot', 'table-body');
      await expect(canvasElement.querySelector("[data-slot='data-table']")).toHaveClass(
        'nds-data-table',
      );
      await expect(linhas().length).toBe(10);
    });

    await step('Cabeçalho ordenável anuncia que ordena, e como', async () => {
      // accessibility.item2 — o aria-label carrega o NOME da coluna: "Ordenar
      // por" cinco vezes seria indistinguível na lista de controles do leitor.
      const botao = canvas.getByRole('button', { name: 'Ordenar por Valor' });
      await zerarOrdenacao(botao);
      const cabecalho = botao.closest('th')!;
      await expect(cabecalho).toHaveAttribute('scope', 'col');
      // `none` explícito: ausência seria indistinguível de "não ordena".
      await expect(cabecalho).toHaveAttribute('aria-sort', 'none');
    });

    await step('Ordenar percorre ascendente, descendente e nenhum', async () => {
      // functional.item3 — três estados. Sem o terceiro, quem ordenou por
      // engano não tem como voltar à ordem original dos dados.
      const botao = canvas.getByRole('button', { name: 'Ordenar por Valor' });
      await zerarOrdenacao(botao);
      const cabecalho = botao.closest('th')!;

      await userEvent.click(botao);
      await waitFor(() => expect(cabecalho).toHaveAttribute('aria-sort', 'ascending'));
      // O menor valor é 60 (INV-009). Se a ordenação comparasse o TEXTO
      // formatado, "R$ 1.200,00" viria antes de "R$ 60,00".
      await expect(primeiraCelula()).toHaveTextContent('INV-009');

      await userEvent.click(botao);
      await waitFor(() => expect(cabecalho).toHaveAttribute('aria-sort', 'descending'));
      await expect(primeiraCelula()).toHaveTextContent('INV-008');

      await userEvent.click(botao);
      await waitFor(() => expect(cabecalho).toHaveAttribute('aria-sort', 'none'));
      await expect(primeiraCelula()).toHaveTextContent('INV-001');
    });

    await step('O checkbox do cabeçalho tem nome diferente do das linhas', async () => {
      // accessibility.item3 — o mesmo nome nos onze controles é o mesmo que
      // nenhum nome: o leitor lista onze caixas idênticas.
      const tudo = caixaDeTudo();
      const daLinha = linhas()[0].querySelector<HTMLElement>("[role='checkbox']")!;
      await expect(daLinha).toHaveAttribute('aria-label', 'Selecionar linha');
      await expect(tudo.getAttribute('aria-label')).not.toBe(daLinha.getAttribute('aria-label'));
    });

    await step('A busca livre recorta as linhas', async () => {
      // functional.item1 — o filtro global casa em qualquer coluna.
      const busca = canvas.getByRole('searchbox');
      await userEvent.clear(busca);
      await userEvent.type(busca, 'Karen');
      await waitFor(() => expect(linhas().length).toBe(1));
      await expect(primeiraCelula()).toHaveTextContent('INV-011');
      // A contagem acompanha o recorte, e não o total do dataset.
      await expect(regiaoViva()).toHaveTextContent('de 1 linha(s) selecionada(s).');

      await userEvent.clear(busca);
      await waitFor(() => expect(linhas().length).toBe(10));
    });

    await step('Selecionar tudo marca a página e a contagem é anunciada', async () => {
      // functional.item4 — e visual.item1: a linha marcada muda de fundo. Uma
      // tabela que só muda de COR é muda para quem não vê, por isso a região
      // viva carrega o número.
      const tudo = caixaDeTudo();
      await marcar(tudo, 'true');

      for (const linha of linhas()) {
        await expect(linha).toHaveAttribute('data-state', 'selected');
      }
      await expect(regiaoViva()).toHaveAttribute('aria-live', 'polite');
      // Dez marcadas de doze: o cabeçalho marca a PÁGINA, a contagem conta o
      // conjunto filtrado inteiro.
      await expect(regiaoViva()).toHaveTextContent('10 de 12 linha(s) selecionada(s).');
      await expect(getComputedStyle(linhas()[0]).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    });

    await step('Desmarcar uma linha deixa o cabeçalho em estado misto', async () => {
      const primeira = linhas()[0].querySelector<HTMLElement>("[role='checkbox']")!;
      await marcar(primeira, 'false');
      await waitFor(() => expect(caixaDeTudo()).toHaveAttribute('aria-checked', 'mixed'));
      await expect(linhas()[0].hasAttribute('data-state')).toBe(false);
    });

    await step('Do estado misto, dois cliques marcam tudo e depois limpam', async () => {
      // O terceiro trecho de functional.item4: o cabeçalho precisa DESMARCAR,
      // não só marcar. Partindo do misto, o primeiro clique completa a página e
      // o segundo esvazia.
      const tudo = caixaDeTudo();
      await marcar(tudo, 'true');
      await marcar(tudo, 'false');
      await expect(regiaoViva()).toHaveTextContent('0 de 12 linha(s) selecionada(s).');
      await expect(
        canvasElement.querySelectorAll("tbody tr[data-state='selected']").length,
      ).toBe(0);
    });

    await step('A story termina com seleção parcial na tela', async () => {
      // visual.item1 — a captura do Chromatic guarda o ÚLTIMO estado, e o item
      // documentado é "estado padrão com seleção".
      await marcar(linhas()[0].querySelector<HTMLElement>("[role='checkbox']")!, 'true');
      await marcar(linhas()[2].querySelector<HTMLElement>("[role='checkbox']")!, 'true');
      await expect(regiaoViva()).toHaveTextContent('2 de 12 linha(s) selecionada(s).');
    });
  },
};
