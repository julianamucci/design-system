import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { NdsDataTable } from './data-table';
import { COLUNAS_FATURAS, FATURAS_DT, ROTULOS_DT } from './data-table.fixtures';
import { NdsDataTableDocs } from '@/components/docs/DataTableDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

type DataTableArgs = {
  enableRowSelection: boolean;
  enableGlobalFilter: boolean;
  enablePagination: boolean;
  pageSize: number;
};

/**
 * O painel Code imprime o `template` da story como está escrito — com todos os
 * bindings ligados aos args (`[enableRowSelection]="enableRowSelection"`) e com
 * a fixture do arquivo. É o andaime da story, não o que alguém escreve para
 * montar uma tabela. O `transform` devolve o uso real, com o valor atual dos
 * controls já resolvido. Ver a nota em `separator.stories.ts`.
 */
function playgroundSource(_gerado: string, ctx: { args?: Partial<DataTableArgs> }): string {
  const {
    enableRowSelection = true,
    enableGlobalFilter = true,
    enablePagination = true,
    pageSize = 5,
  } = ctx.args ?? {};

  // Só o que difere do padrão entra no snippet: repetir o valor default ensina
  // ruído a quem copia.
  const flags = [
    enableRowSelection ? '[enableRowSelection]="true"' : null,
    enableGlobalFilter ? null : '[enableGlobalFilter]="false"',
    enablePagination ? null : '[enablePagination]="false"',
    pageSize === 10 ? null : `[pageSize]="${pageSize}"`,
  ].filter(Boolean).join('\n      ');

  return `import { NdsDataTable, type DataTableColumn } from '@/components/ui/data-table';

interface Fatura { id: string; cliente: string; status: string; metodo: string; valor: number }

// Definidas UMA vez, em escopo estável: recriar o array a cada render zeraria
// ordenacao, filtros e selecao.
const COLUNAS: DataTableColumn<Fatura>[] = [
  { id: 'id',      header: 'Fatura',  accessor: (f) => f.id,      sortable: true, hideable: false },
  { id: 'cliente', header: 'Cliente', accessor: (f) => f.cliente, sortable: true },
  { id: 'status',  header: 'Status',  accessor: (f) => f.status },
  { id: 'metodo',  header: 'Método',  accessor: (f) => f.metodo },
  // numeric alinha a CÉLULA à direita. O cabeçalho fica à esquerda: no CSS
  // compartilhado \`.nds-table th\` vence a utilitária por especificidade.
  { id: 'valor',   header: 'Valor',   accessor: (f) => f.valor, format: brl, sortable: true, numeric: true },
];

@Component({
  imports: [NdsDataTable],
  template: \`
    <div
      ndsDataTable
      caption="Faturas recentes"
      [columns]="colunas"
      [data]="faturas()"
      ${flags}
    ></div>
  \`,
})
export class Exemplo {
  readonly colunas = COLUNAS;
  readonly faturas = signal(carregarFaturas());
}`;
}

const meta: Meta<DataTableArgs> = {
  title: 'UI/DataTable',
  tags: ['autodocs', 'tables'],
  decorators: [moduleMetadata({ imports: [NdsDataTable] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsDataTableDocs) },
    // Quatro itens do contrato de teste não têm story neste stack porque o
    // recurso não existe aqui. O motivo é o mesmo nos quatro e está registrado
    // no cabeçalho de `data-table.ts`.
    coversNotApplicable: {
      'functional.item6': 'reordenar coluna por arrasto nao e implementado neste stack',
      'functional.item7': 'virtualizacao nao e implementada neste stack: as linhas fantasma exigem altura em px no elemento, e CSS inline e proibido aqui',
      'visual.item3': 'redimensionar coluna nao e implementado: a largura arrastada so existe como style inline',
      'visual.item5': 'sem virtualizacao nao ha scroll virtual para capturar',
    },
  },
  argTypes: {
    enableRowSelection: {
      control: 'boolean',
      description:
        'Primeira coluna vira checkbox de seleção, com tri-state no cabeçalho e contagem anunciada por região viva.',
    },
    enableGlobalFilter: {
      control: 'boolean',
      description: 'Campo de busca livre na toolbar. Casa em todas as colunas, inclusive nas escondidas.',
    },
    enablePagination: {
      control: 'boolean',
      description: 'Rodapé com contagem, seletor de tamanho e navegação por página.',
    },
    pageSize: {
      control: { type: 'number', min: 1, max: 50, step: 1 },
      description: 'Linhas por página no primeiro render. Depois quem manda é o seletor do rodapé.',
    },
  },
  args: {
    enableRowSelection: true,
    enableGlobalFilter: true,
    enablePagination: true,
    pageSize: 5,
  },
};

export default meta;
type Story = StoryObj<DataTableArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

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
    props: { ...args, colunas: COLUNAS_FATURAS, faturas: FATURAS_DT, rotulos: ROTULOS_DT },
    template: `
      <div
        ndsDataTable
        caption="Faturas recentes"
        [columns]="colunas"
        [data]="faturas"
        [labels]="rotulos"
        [enableRowSelection]="enableRowSelection"
        [enableGlobalFilter]="enableGlobalFilter"
        [enablePagination]="enablePagination"
        [pageSize]="pageSize"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const linhas = () => [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
    const primeiraCelula = () =>
      linhas()[0].querySelector<HTMLElement>('td:not(:has(button[role="checkbox"]))')!;

    await step('É uma tabela de verdade, com nome e seções semânticas', async () => {
      // accessibility.item1 — o que faz um leitor anunciar "tabela, 6 colunas" é
      // a tag, não a classe. A mesma grade montada com div sumiria da árvore de
      // acessibilidade sem mudar um pixel.
      const tabela = canvas.getByRole('table', { name: /faturas recentes/i });
      await expect(tabela.tagName).toBe('TABLE');
      await expect(tabela).toHaveAttribute('data-slot', 'table');
      await expect(tabela.querySelector('thead')).toHaveAttribute('data-slot', 'table-header');
      await expect(tabela.querySelector('tbody')).toHaveAttribute('data-slot', 'table-body');
      await expect(canvasElement.querySelector('[data-slot="data-table"]')).toHaveClass(
        'nds-data-table',
      );
      await expect(linhas().length).toBe(args.pageSize);
    });

    await step('Cabeçalho ordenável anuncia que ordena, e como', async () => {
      // accessibility.item2 — o aria-label carrega o nome da coluna: "Ordenar
      // por" cinco vezes seria indistinguível na lista de controles do leitor.
      // O aria-sort mora no `th`, que é quem tem a relação com a coluna.
      const botao = canvas.getByRole('button', { name: 'Ordenar por Valor' });
      const cabecalho = botao.closest('th')!;
      await expect(cabecalho).toHaveAttribute('aria-sort', 'none');
      await expect(cabecalho).toHaveAttribute('scope', 'col');

      // Coluna sem ordenação não promete ordenação nenhuma.
      const semOrdem = canvas.getByText('Método').closest('th')!;
      await expect(semOrdem.hasAttribute('aria-sort')).toBe(false);
    });

    await step('Ordenar percorre ascendente, descendente e nenhum', async () => {
      // functional.item3 — três estados. Sem o terceiro, quem ordenou por
      // engano não tem como voltar à ordem original dos dados.
      const botao = canvas.getByRole('button', { name: 'Ordenar por Valor' });
      const cabecalho = botao.closest('th')!;

      await userEvent.click(botao);
      await expect(cabecalho).toHaveAttribute('aria-sort', 'ascending');
      await expect(primeiraCelula()).toHaveTextContent('#INV-010');

      await userEvent.click(botao);
      await expect(cabecalho).toHaveAttribute('aria-sort', 'descending');
      await expect(primeiraCelula()).toHaveTextContent('#INV-011');

      await userEvent.click(botao);
      await expect(cabecalho).toHaveAttribute('aria-sort', 'none');
      await expect(primeiraCelula()).toHaveTextContent('#INV-001');
    });

    await step('Cada checkbox de linha tem um nome só dele', async () => {
      // accessibility.item3 — "Selecionar linha" repetido em doze checkboxes é o
      // mesmo que nenhum nome: o leitor lista doze controles idênticos.
      const caixaDeTudo = canvas.getByRole('checkbox', { name: 'Selecionar todas as faturas' });
      await expect(caixaDeTudo).toBeTruthy();

      const nomes = linhas().map(
        (linha) => linha.querySelector('button[role="checkbox"]')!.getAttribute('aria-label'),
      );
      await expect(nomes).toEqual([
        'Selecionar fatura #INV-001',
        'Selecionar fatura #INV-002',
        'Selecionar fatura #INV-003',
        'Selecionar fatura #INV-004',
        'Selecionar fatura #INV-005',
      ]);
    });

    await step('Selecionar tudo marca a página e a contagem é anunciada', async () => {
      // functional.item4 — e visual.item1: a linha marcada muda de fundo. Uma
      // tabela que só muda de COR é muda para quem não vê, por isso a região
      // viva carrega o número.
      const caixaDeTudo = canvas.getByRole('checkbox', { name: 'Selecionar todas as faturas' });
      await userEvent.click(caixaDeTudo);

      for (const linha of linhas()) {
        await expect(linha).toHaveAttribute('data-state', 'selected');
      }
      const regiao = canvasElement.querySelector<HTMLElement>('[role="status"]')!;
      await expect(regiao).toHaveAttribute('aria-live', 'polite');
      await expect(regiao).toHaveTextContent('5 de 12 linha(s) selecionada(s).');
      await expect(getComputedStyle(linhas()[0]).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    });

    await step('Desmarcar uma linha deixa o cabeçalho em estado misto', async () => {
      const primeira = linhas()[0].querySelector<HTMLElement>('button[role="checkbox"]')!;
      await userEvent.click(primeira);

      const caixaDeTudo = canvas.getByRole('checkbox', { name: 'Selecionar todas as faturas' });
      await expect(caixaDeTudo).toHaveAttribute('aria-checked', 'mixed');
      await expect(caixaDeTudo).toHaveAttribute('data-state', 'indeterminate');
      await expect(linhas()[0].hasAttribute('data-state')).toBe(false);
    });

    await step('A busca livre recorta as linhas e a contagem acompanha', async () => {
      // functional.item1 — o filtro global casa em qualquer coluna, e é a
      // contagem do rodapé que prova que ele recortou o conjunto inteiro, não
      // só a página visível.
      const busca = canvas.getByRole('searchbox');
      await userEvent.type(busca, 'Karina');

      await expect(linhas().length).toBe(1);
      await expect(primeiraCelula()).toHaveTextContent('#INV-011');

      await userEvent.clear(busca);
      await expect(linhas().length).toBe(args.pageSize);
    });
  },
};
