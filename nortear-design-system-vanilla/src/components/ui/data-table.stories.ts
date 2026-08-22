import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, userEvent, waitFor, expect, fn } from 'storybook/test';
import { createDataTable, type DataTableLabels } from './data-table';
import { dataTableSource } from './data-table.source';
import { createDataTableDocs } from '@/components/docs/DataTableDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { type Invoice, invoices, baseColumns, labelsInvoice } from './data-table.fixtures';
import { measureScroll } from '@shared/testing/data-table-probe';

// ─── Meta ──────────────────────────────────────────────────────────────────

type PlaygroundArgs = {
  enableRowSelection: boolean;
  enableGlobalFilter: boolean;
  enableColumnVisibility: boolean;
  enablePagination: boolean;
  pageSize: number;
  globalFilterPlaceholder: string;
  emptyMessage: string;
  caption: string;
  labels: Partial<DataTableLabels>;
  rowKey: (row: Invoice, index: number) => string;
  rowLabel?: (row: Invoice) => string;
  onCellEdit: (rowIndex: number, columnId: string, value: unknown) => void;
  onTableReady: (table: unknown) => void;
};

const meta: Meta = {
  title: 'UI/DataTable',
  tags: ['autodocs', 'tables'],
  parameters: {
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(createDataTableDocs),
      // Não há componente para o Storybook introspectar aqui: o snippet vinha
      // do `outerHTML`, que não muda quando a configuração vive só no closure
      // da factory. A transform devolve o uso real com o valor atual dos
      // controls já resolvido — ela mora em `data-table.source.ts`, tem teste
      // unitário próprio e cascateia para todas as stories deste arquivo.
      source: { transform: dataTableSource },
    },
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
    caption: 'Faturas recentes',
    labels: labelsInvoice,
    rowKey: (fatura: Invoice) => fatura.id,
    // Deliberadamente ausente: é aqui que o FALLBACK é provado. Sem `rowLabel`,
    // o nome de cada controle de seleção sai da primeira coluna — e a play
    // compara os nomes entre si para mostrar que saem distintos.
    rowLabel: undefined,
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
    caption: {
      control: 'text',
      description:
        'Nome acessível da tabela. Vira uma legenda fora da tela: o leitor a anuncia ao entrar na grade e nenhum pixel muda.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    labels: {
      control: false,
      description:
        'Textos da interface: rótulos dos controles, contagens e navegação. Só as chaves informadas mudam; o resto continua no padrão.',
      table: {
        type: { summary: 'Partial<DataTableLabels>' },
        defaultValue: { summary: 'textos padrão em pt-BR' },
      },
    },
    rowKey: {
      control: false,
      description:
        'Identificador estável da linha. Sem ele a identidade da linha é a posição, e reordenar mudaria de linha o que estava marcado.',
      table: {
        type: { summary: '(row: TData, index: number) => string' },
        defaultValue: { summary: '—' },
      },
    },
    rowLabel: {
      control: false,
      description:
        'Texto que identifica a linha no nome do controle de seleção. Sem ele o identificador sai da primeira coluna, para que duas linhas nunca tenham o mesmo nome.',
      table: { type: { summary: '(row: TData) => string' }, defaultValue: { summary: '—' } },
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
      'functional.item9',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item3',
      'accessibility.item4',
      'accessibility.item5',
      'accessibility.item6',
      'visual.item1',
    ],
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
      caption: args.caption,
      labels: args.labels,
      rowKey: args.rowKey,
      // `rowLabel` não é encaminhado de propósito — ver o comentário em `args`.
      onCellEdit: args.onCellEdit,
      onTableReady: args.onTableReady,
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const linhas = () => [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
    /** Primeira célula de DADOS da linha — é ela que identifica a fatura. */
    const identidadeCell = (tr: HTMLElement) =>
      tr.querySelector<HTMLElement>("td:not(:has([role='checkbox']))")!;
    const firstCell = () => identidadeCell(linhas()[0]);
    // O nome vem da fixture `labelsInvoice`: se `labels` deixasse de chegar aos
    // controles, nenhuma das buscas por nome abaixo encontraria nada.
    const allBox = () => canvas.getByRole('checkbox', { name: 'Selecionar todas as faturas' });
    const invoiceBox = (fatura: string) => () =>
      canvas.getByRole('checkbox', { name: `Selecionar fatura ${fatura}` });
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
    const lineBox = (i: number) => () =>
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

    await step('A tabela diz o próprio nome sem ocupar espaço na tela', async () => {
      // accessibility.item6 — a legenda é o PRIMEIRO filho de `<table>`: em
      // qualquer outra posição o parser de HTML a move, e a tabela volta a
      // chegar ao leitor como "tabela, 6 colunas", sem nome.
      const tabela = canvas.getByRole('table');
      const legenda = tabela.firstElementChild!;
      await expect(legenda.tagName).toBe('CAPTION');
      // O nome ACESSÍVEL, e não o texto do nó: é a pergunta que o leitor faz.
      await expect(canvas.getByRole('table', { name: 'Faturas recentes' })).toBe(tabela);

      // Fora da tela pela CAIXA COMPUTADA, não pela classe: asserir
      // `.nds-sr-only` provaria só que alguém escreveu o nome da classe.
      const estilo = getComputedStyle(legenda);
      const caixa = legenda.getBoundingClientRect();
      await expect(estilo.position).toBe('absolute');
      await expect(caixa.width).toBeLessThanOrEqual(2);
      await expect(caixa.height).toBeLessThanOrEqual(2);
    });

    await step('Uma camada rola na horizontal, e o teclado alcança ela', async () => {
      // accessibility.item5 — medido pelo estilo COMPUTADO. A classe que
      // neutralizava o wrapper do primitivo empurrava a rolagem para o contêiner
      // externo, que não está na ordem de tabulação: quem navega por teclado não
      // chegava às colunas fora da tela (WCAG 2.1.1).
      const r = measureScroll(canvasElement);
      await expect(r.camadasRolaveis).toEqual(['nds-table-wrapper']);
      await expect(r.rolaveisForaDoTeclado).toEqual([]);
      await expect(r.interno.overflowX).toBe('auto');
      await expect(r.interno.tabIndex).toBe(0);
      // O externo é moldura: rola nada na horizontal e não é parada de teclado.
      // Um `tabindex` aqui seria parada sem função, que é defeito e não sobra.
      await expect(r.externo.overflowX).toBe('visible');
      await expect(r.externo.tabIndex).toBe(-1);
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
      await expect(firstCell()).toHaveTextContent('INV-009');

      await userEvent.click(ordenar());
      await waitFor(() => expect(cabecalho()).toHaveAttribute('aria-sort', 'descending'));
      await expect(firstCell()).toHaveTextContent('INV-008');

      await userEvent.click(ordenar());
      await waitFor(() => expect(cabecalho()).toHaveAttribute('aria-sort', 'none'));
      await expect(firstCell()).toHaveTextContent('INV-001');
    });

    await step('Cada checkbox de linha tem um nome só dele', async () => {
      // accessibility.item3 — a asserção antiga fixava o texto 'Selecionar
      // linha' e, com isso, GUARDAVA o defeito: dez controles homônimos passavam
      // por ela todo dia. Nome repetido em dez controles é o mesmo que nome
      // nenhum na lista do leitor (WCAG 4.1.2).
      const nomes = linhas().map(
        (tr) => tr.querySelector<HTMLElement>("[role='checkbox']")!.getAttribute('aria-label')!,
      );

      await expect(nomes.length).toBe(linhas().length);
      // Distintos ENTRE SI — só verificar a presença deixaria os homônimos
      // passarem exatamente como antes.
      await expect(new Set(nomes).size).toBe(nomes.length);
      // E cada nome é o da PRÓPRIA linha: nomes distintos porém trocados seriam
      // igualmente inúteis para quem não vê a tabela. O identificador vem da
      // primeira coluna, que é o fallback em ação — a story não passa `rowLabel`.
      for (const [i, linha] of linhas().entries()) {
        await expect(nomes[i]).toContain(identidadeCell(linha).textContent!.trim());
      }
      await expect(nomes).not.toContain(allBox().getAttribute('aria-label'));
    });

    await step('A busca livre recorta as linhas', async () => {
      // functional.item1 — o filtro global casa em qualquer coluna.
      const busca = canvas.getByRole('searchbox') as HTMLInputElement;
      await userEvent.click(busca);
      await userEvent.tripleClick(busca);
      await userEvent.keyboard('{Delete}');
      await userEvent.type(busca, 'Karen');
      await waitFor(() => expect(linhas().length).toBe(1));
      await expect(firstCell()).toHaveTextContent('INV-011');
      // A contagem acompanha o recorte, e não o total do dataset.
      await expect(regiaoViva()).toHaveTextContent('de 1 fatura(s) selecionada(s).');

      await userEvent.tripleClick(busca);
      await userEvent.keyboard('{Delete}');
      await waitFor(() => expect(linhas().length).toBe(10));
    });

    await step('Selecionar tudo marca a página e a contagem é anunciada', async () => {
      // functional.item4 — e visual.item1: a linha marcada muda de fundo. Uma
      // tabela que só muda de COR é muda para quem não vê, por isso a região
      // viva carrega o número.
      await marcar(allBox, 'true');

      for (const linha of linhas()) {
        await expect(linha).toHaveAttribute('data-state', 'selected');
      }
      await expect(regiaoViva()).toHaveAttribute('aria-live', 'polite');
      // Dez marcadas de doze: o cabeçalho marca a PÁGINA, a contagem conta o
      // conjunto filtrado inteiro.
      await expect(regiaoViva()).toHaveTextContent('10 de 12 fatura(s) selecionada(s).');
      await expect(getComputedStyle(linhas()[0]).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    });

    await step('Desmarcar uma linha deixa o cabeçalho em estado misto', async () => {
      await marcar(lineBox(0), 'false');
      await waitFor(() => expect(allBox()).toHaveAttribute('aria-checked', 'mixed'));
      await expect(linhas()[0].hasAttribute('data-state')).toBe(false);
    });

    await step('Do estado misto, dois cliques marcam tudo e depois limpam', async () => {
      // O terceiro trecho de functional.item4: o cabeçalho precisa DESMARCAR,
      // não só marcar. Partindo do misto, o primeiro clique completa a página e
      // o segundo esvazia.
      await marcar(allBox, 'true');
      await marcar(allBox, 'false');
      await expect(regiaoViva()).toHaveTextContent('0 de 12 fatura(s) selecionada(s).');
      await expect(
        canvasElement.querySelectorAll("tbody tr[data-state='selected']").length,
      ).toBe(0);
    });

    await step('Ordenar carrega a marcação junto com a linha', async () => {
      // functional.item9 — as linhas são marcadas por NOME e não por posição, que
      // é exatamente a diferença que o item cobra: sem identidade estável, "a
      // terceira linha está marcada" continua verdade depois de ordenar, só que
      // apontando para outra fatura.
      await zerarOrdenacao();
      // Precondição idempotente: nada marcado, venha o replay de onde vier.
      await marcar(allBox, 'true');
      await marcar(allBox, 'false');

      await marcar(invoiceBox('INV-003'), 'true');
      await marcar(invoiceBox('INV-007'), 'true');
      const contagemBefore = regiaoViva().textContent;

      const ordenar = () => canvas.getByRole('button', { name: 'Ordenar por Valor' });
      await userEvent.click(ordenar());
      await waitFor(() =>
        expect(ordenar().closest('th')).toHaveAttribute('aria-sort', 'ascending'),
      );
      // A ordem mudou DE VERDADE: sem esta linha o passo passaria numa tabela
      // que engoliu o clique e não mexeu em nada.
      await expect(firstCell()).toHaveTextContent('INV-009');

      await expect(invoiceBox('INV-003')()).toHaveAttribute('aria-checked', 'true');
      await expect(invoiceBox('INV-007')()).toHaveAttribute('aria-checked', 'true');
      await expect(
        canvasElement.querySelectorAll("tbody tr[data-state='selected']").length,
      ).toBe(2);
      // A contagem anunciada não pode ter se mexido: ordenar não seleciona nem
      // deseleciona ninguém.
      await expect(regiaoViva().textContent).toBe(contagemBefore);

      // Devolve o estado ao passo seguinte: sem ordem e sem marcação.
      await zerarOrdenacao();
      await marcar(allBox, 'true');
      await marcar(allBox, 'false');
    });

    await step('A story termina com seleção parcial na tela', async () => {
      // visual.item1 — a captura do Chromatic guarda o ÚLTIMO estado, e o item
      // documentado é "estado padrão com seleção".
      await marcar(lineBox(0), 'true');
      await marcar(lineBox(2), 'true');
      await expect(regiaoViva()).toHaveTextContent('2 de 12 fatura(s) selecionada(s).');
    });
  },
};
