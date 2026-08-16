import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, userEvent, waitFor, expect, fn } from 'storybook/test';
import { createDataTable } from './data-table';
import { createDataTableDocs } from '@/components/docs/DataTableDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { type Invoice, invoices, baseColumns } from './data-table.fixtures';

// ─── Meta ──────────────────────────────────────────────────────────────────

type PlaygroundArgs = {
  enableRowSelection: boolean;
  enableGlobalFilter: boolean;
  enableColumnVisibility: boolean;
  enablePagination: boolean;
  pageSize: number;
  globalFilterPlaceholder: string;
  emptyMessage: string;
  onCellEdit: (rowIndex: number, columnId: string, value: unknown) => void;
  onTableReady: (table: unknown) => void;
};

/**
 * Não há componente para o Storybook introspectar aqui, então o `argTypes` é a
 * única fonte da aba API Reference — e o snippet vem do `outerHTML`, que não
 * muda quando a configuração vive só no closure da factory. O `transform`
 * devolve o uso real com o valor atual dos controls já resolvido.
 */
function playgroundSource(_gerado: string, ctx: { args?: Partial<PlaygroundArgs> }): string {
  const {
    enableRowSelection = true,
    enablePagination = true,
    pageSize = 10,
  } = ctx.args ?? {};
  const flags = [
    enableRowSelection ? '  enableRowSelection: true,' : null,
    enablePagination ? null : '  enablePagination: false,',
    pageSize === 10 ? null : `  pageSize: ${pageSize},`,
  ]
    .filter(Boolean)
    .join('\n');

  return `import { createDataTable, type DataTableColumn } from '@/components/ui/data-table';

interface Invoice { id: string; customer: string; status: string; method: string; amount: number }

// Definidas UMA vez, em escopo estável: recriar o array a cada render zeraria
// ordenação, filtros e seleção.
const columns: DataTableColumn<Invoice>[] = [
  { accessorKey: 'id', header: 'Fatura', size: 110, meta: { headerLabel: 'Fatura' } },
  { accessorKey: 'customer', header: 'Cliente', size: 200, meta: { headerLabel: 'Cliente' } },
  { accessorKey: 'status', header: 'Status', size: 140, meta: { headerLabel: 'Status' } },
  { accessorKey: 'method', header: 'Método', size: 200, meta: { headerLabel: 'Método' } },
  { accessorKey: 'amount', header: 'Valor', size: 130, meta: { headerLabel: 'Valor' } },
];

const tabela = createDataTable<Invoice>({
  columns,
  data: invoices,
${flags}
  globalFilterPlaceholder: 'Buscar fatura, cliente, método...',
});
document.querySelector('#app')!.appendChild(tabela);`;
}

const meta: Meta = {
  title: 'UI/DataTable',
  tags: ['autodocs', 'tables'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createDataTableDocs) },
  },
};

export default meta;
type Story = StoryObj;

// ─── Playground ────────────────────────────────────────────────────────────

export const Playground: Story = {
  args: {
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
  },
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
  render: (args: Partial<PlaygroundArgs>) =>
    createDataTable<Invoice>({
      columns: baseColumns,
      data: invoices,
      enableRowSelection: args.enableRowSelection,
      enableGlobalFilter: args.enableGlobalFilter,
      enableColumnVisibility: args.enableColumnVisibility,
      enablePagination: args.enablePagination,
      pageSize: args.pageSize,
      globalFilterPlaceholder: args.globalFilterPlaceholder,
      emptyMessage: args.emptyMessage,
      onCellEdit: args.onCellEdit,
      onTableReady: args.onTableReady,
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const linhas = () => [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
    const primeiraCelula = () =>
      linhas()[0].querySelector<HTMLElement>("td:not(:has([role='checkbox']))")!;
    const caixaDeTudo = () => canvas.getByRole('checkbox', { name: 'Selecionar todas as linhas' });
    const regiaoViva = () => canvasElement.querySelector<HTMLElement>("[role='status']")!;

    /** Estabelece a precondição do passo: sem ordem aplicada, venha de onde vier. */
    const zerarOrdenacao = async () => {
      for (let i = 0; i < 3; i++) {
        const botao = canvas.getByRole('button', { name: 'Ordenar por Valor' });
        if (botao.closest('th')!.getAttribute('aria-sort') === 'none') break;
        await userEvent.click(botao);
      }
      await waitFor(() =>
        expect(
          canvas.getByRole('button', { name: 'Ordenar por Valor' }).closest('th'),
        ).toHaveAttribute('aria-sort', 'none'),
      );
    };
    /**
     * Clica só se o estado ainda não é o desejado — sobrevive ao replay. A
     * caixa é buscada de novo a cada chamada porque a factory REMONTA o corpo
     * a cada mudança de estado: o nó capturado antes do clique já morreu.
     */
    const marcar = async (achar: () => HTMLElement, alvo: 'true' | 'false') => {
      if (achar().getAttribute('aria-checked') !== alvo) await userEvent.click(achar());
      await waitFor(() => expect(achar()).toHaveAttribute('aria-checked', alvo));
    };
    const caixaDaLinha = (i: number) => () =>
      linhas()[i].querySelector<HTMLElement>("[role='checkbox']")!;

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
      await zerarOrdenacao();
      const cabecalho = canvas
        .getByRole('button', { name: 'Ordenar por Valor' })
        .closest('th')!;
      await expect(cabecalho).toHaveAttribute('scope', 'col');
      // `none` explícito: ausência seria indistinguível de "não ordena".
      await expect(cabecalho).toHaveAttribute('aria-sort', 'none');
    });

    await step('Ordenar percorre ascendente, descendente e nenhum', async () => {
      // functional.item3 — três estados. Sem o terceiro, quem ordenou por
      // engano não tem como voltar à ordem original dos dados.
      await zerarOrdenacao();
      const ordenar = () => canvas.getByRole('button', { name: 'Ordenar por Valor' });
      const cabecalho = () => ordenar().closest('th')!;

      await userEvent.click(ordenar());
      await waitFor(() => expect(cabecalho()).toHaveAttribute('aria-sort', 'ascending'));
      // O menor valor é 60 (INV-009). Se a ordenação comparasse o TEXTO
      // formatado, "R$ 1.200,00" viria antes de "R$ 60,00".
      await expect(primeiraCelula()).toHaveTextContent('INV-009');

      await userEvent.click(ordenar());
      await waitFor(() => expect(cabecalho()).toHaveAttribute('aria-sort', 'descending'));
      await expect(primeiraCelula()).toHaveTextContent('INV-008');

      await userEvent.click(ordenar());
      await waitFor(() => expect(cabecalho()).toHaveAttribute('aria-sort', 'none'));
      await expect(primeiraCelula()).toHaveTextContent('INV-001');
    });

    await step('O checkbox do cabeçalho tem nome diferente do das linhas', async () => {
      // accessibility.item3 — o mesmo nome nos onze controles é o mesmo que
      // nenhum nome: o leitor lista onze caixas idênticas.
      await expect(caixaDaLinha(0)()).toHaveAttribute('aria-label', 'Selecionar linha');
      await expect(caixaDeTudo().getAttribute('aria-label')).not.toBe(
        caixaDaLinha(0)().getAttribute('aria-label'),
      );
    });

    await step('A busca livre recorta as linhas', async () => {
      // functional.item1 — o filtro global casa em qualquer coluna.
      const busca = canvas.getByRole('searchbox') as HTMLInputElement;
      await userEvent.click(busca);
      await userEvent.tripleClick(busca);
      await userEvent.keyboard('{Delete}');
      await userEvent.type(busca, 'Karen');
      await waitFor(() => expect(linhas().length).toBe(1));
      await expect(primeiraCelula()).toHaveTextContent('INV-011');
      // A contagem acompanha o recorte, e não o total do dataset.
      await expect(regiaoViva()).toHaveTextContent('de 1 linha(s) selecionada(s).');

      await userEvent.tripleClick(busca);
      await userEvent.keyboard('{Delete}');
      await waitFor(() => expect(linhas().length).toBe(10));
    });

    await step('Selecionar tudo marca a página e a contagem é anunciada', async () => {
      // functional.item4 — e visual.item1: a linha marcada muda de fundo. Uma
      // tabela que só muda de COR é muda para quem não vê, por isso a região
      // viva carrega o número.
      await marcar(caixaDeTudo, 'true');

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
      await marcar(caixaDaLinha(0), 'false');
      await waitFor(() => expect(caixaDeTudo()).toHaveAttribute('aria-checked', 'mixed'));
      await expect(linhas()[0].hasAttribute('data-state')).toBe(false);
    });

    await step('Do estado misto, dois cliques marcam tudo e depois limpam', async () => {
      // O terceiro trecho de functional.item4: o cabeçalho precisa DESMARCAR,
      // não só marcar. Partindo do misto, o primeiro clique completa a página e
      // o segundo esvazia.
      await marcar(caixaDeTudo, 'true');
      await marcar(caixaDeTudo, 'false');
      await expect(regiaoViva()).toHaveTextContent('0 de 12 linha(s) selecionada(s).');
      await expect(
        canvasElement.querySelectorAll("tbody tr[data-state='selected']").length,
      ).toBe(0);
    });

    await step('A story termina com seleção parcial na tela', async () => {
      // visual.item1 — a captura do Chromatic guarda o ÚLTIMO estado, e o item
      // documentado é "estado padrão com seleção".
      await marcar(caixaDaLinha(0), 'true');
      await marcar(caixaDaLinha(2), 'true');
      await expect(regiaoViva()).toHaveTextContent('2 de 12 linha(s) selecionada(s).');
    });
  },
};
