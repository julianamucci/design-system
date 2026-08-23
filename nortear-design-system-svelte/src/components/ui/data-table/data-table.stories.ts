import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { within, userEvent, waitFor, expect, fn } from 'storybook/test';
import { measureScroll } from '@shared/testing/data-table-probe';
import DataTable from './data-table.svelte';
import DataTableDocs from '@/components/docs/DataTableDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { dataTableSource } from './data-table.source';
import { invoices, baseColumns, labelsInvoice, type Invoice } from './data-table.fixtures';

/** Legenda da tabela — o nome que o leitor de tela anuncia ao entrar na grade. */
const CAPTION = 'Faturas recentes';

const meta: Meta = {
  title: 'UI/DataTable',
  component: DataTable,
  tags: ['autodocs', 'tables'],
  parameters: {
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(DataTableDocs),
      source: { transform: dataTableSource },
    },
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
        'Nome acessível da tabela. Sai como legenda fora da tela — só o leitor alcança — e é o que ele anuncia ao entrar na grade.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    // Objeto e funções não se digitam no painel: as três entradas abaixo existem
    // para DOCUMENTAR o contrato na aba de API, não para receber valor.
    labels: {
      description:
        'Textos da interface: rótulos dos controles, contagens e navegação. Só as chaves informadas mudam; o resto continua no padrão.',
      table: {
        type: { summary: 'Partial<DataTableLabels>' },
        defaultValue: { summary: 'DATA_TABLE_LABELS_PADRAO' },
      },
      control: false,
    },
    rowKey: {
      description:
        'Identificador estável de cada linha. Sem ele a identidade é a posição, e reordenar move a marcação de linha.',
      table: {
        type: { summary: '(row: TData, index: number) => string' },
        defaultValue: { summary: '—' },
      },
      control: false,
    },
    rowLabel: {
      description:
        'Texto que identifica a linha no nome do controle de seleção. Sem ele o identificador sai da primeira coluna.',
      table: { type: { summary: '(row: TData) => string' }, defaultValue: { summary: '—' } },
      control: false,
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
    columns: baseColumns as never,
    data: invoices,
    enableRowSelection: true,
    enableGlobalFilter: true,
    enableColumnVisibility: true,
    enablePagination: true,
    pageSize: 10,
    globalFilterPlaceholder: 'Buscar fatura, cliente, método...',
    emptyMessage: 'Sem resultados.',
    caption: CAPTION,
    labels: labelsInvoice,
    rowKey: (f: Invoice) => f.id,
    // Declarado e deixado em branco de propósito: é AQUI que o degrau do meio do
    // fallback é provado — sem `rowLabel`, o nome do controle de seleção sai da
    // primeira coluna ("Fatura").
    rowLabel: undefined,
    onCellEdit: fn(),
    onTableReady: fn(),
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const lines = () => [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
    /** A primeira coluna de DADOS: é ela que identifica a linha na leitura visual. */
    const cellIdentificadora = (line: HTMLElement) =>
      line.querySelector<HTMLElement>("td:not(:has([role='checkbox']))")!;
    const firstCell = () => cellIdentificadora(lines()[0]);
    const identificador = (line: HTMLElement) =>
      cellIdentificadora(line).textContent!.trim();
    const lineBox = (line: HTMLElement) =>
      line.querySelector<HTMLElement>("[role='checkbox']")!;
    const lineOf = (id: string) => lines().find((l) => identificador(l) === id)!;
    // O nome vem de `labels`, e não do padrão do componente: se a prop fosse
    // ignorada, este seletor não acharia nada e a play morreria aqui.
    const allBox = () => canvas.getByRole('checkbox', { name: 'Selecionar todas as faturas' });
    const regiaoViva = () => canvasElement.querySelector<HTMLElement>("[role='status']")!;

    /** Estabelece a precondição do passo: sem ordem aplicada, venha de onde vier. */
    const zerarOrdenacao = async (button: HTMLElement) => {
      const th = button.closest('th')!;
      for (let i = 0; i < 3 && th.getAttribute('aria-sort') !== 'none'; i++) {
        await userEvent.click(button);
      }
      await waitFor(() => expect(th).toHaveAttribute('aria-sort', 'none'));
    };
    /** Clica só se o estado ainda não é o desejado — sobrevive ao replay. */
    const marcar = async (caixa: HTMLElement, alvo: 'true' | 'false') => {
      if (caixa.getAttribute('aria-checked') !== alvo) await userEvent.click(caixa);
      await waitFor(() => expect(caixa).toHaveAttribute('aria-checked', alvo));
    };
    /** Precondição de qualquer passo de seleção: nada marcado, venha de onde vier. */
    const clearSelection = async () => {
      for (const line of lines()) await marcar(lineBox(line), 'false');
      await waitFor(() =>
        expect(
          canvasElement.querySelectorAll("tbody tr[data-state='selected']").length,
        ).toBe(0),
      );
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
      await expect(lines().length).toBe(10);
    });

    await step('Uma única camada rola na horizontal, e o teclado alcança ela', async () => {
      // accessibility.item5 — medido no ESTILO COMPUTADO, nunca na classe: a
      // classe morta não protege nada, e foi justamente uma regra de classe que
      // punha `overflow-x` no contêiner de fora, que não está na ordem de
      // tabulação. Duas camadas declaradas roláveis é uma a mais: a de fora
      // captura o gesto e quem navega por teclado nunca chega às colunas
      // escondidas à direita.
      const r = measureScroll(canvasElement);
      await expect(r.camadasRolaveis).toEqual(['nds-table-wrapper']);
      await expect(r.rolaveisForaDoTeclado).toEqual([]);
      await expect(r.interno.overflowX).toBe('auto');
      await expect(r.interno.tabIndex).toBe(0);
      // A moldura de fora é só moldura. Devolver `overflow-x` a ela reprova aqui.
      await expect(r.externo.overflowX).toBe('visible');
      await expect(r.externo.tabIndex).toBe(-1);
    });

    await step('A legenda nomeia a tabela sem ocupar espaço na tela', async () => {
      // accessibility.item6 — o que importa é o EFEITO: a tabela tem nome e a
      // legenda não desloca uma linha de layout. Asserir `.nds-sr-only` provaria
      // apenas que alguém escreveu a classe.
      const tabela = canvas.getByRole('table', { name: CAPTION });
      const legenda = tabela.querySelector('caption')!;
      await expect(legenda.tagName).toBe('CAPTION');
      await expect(legenda).toHaveTextContent(CAPTION);
      const estilo = getComputedStyle(legenda);
      const caixa = legenda.getBoundingClientRect();
      await expect(estilo.position).toBe('absolute');
      await expect(caixa.width).toBeLessThanOrEqual(2);
      await expect(caixa.height).toBeLessThanOrEqual(2);
    });

    await step('Cabeçalho ordenável anuncia que ordena, e como', async () => {
      // accessibility.item2 — o aria-label carrega o NOME da coluna: "Ordenar
      // por" cinco vezes seria indistinguível na lista de controles do leitor.
      const button = canvas.getByRole('button', { name: 'Ordenar por Valor' });
      await zerarOrdenacao(button);
      const header = button.closest('th')!;
      await expect(header).toHaveAttribute('scope', 'col');
      // `none` explícito: ausência seria indistinguível de "não ordena".
      await expect(header).toHaveAttribute('aria-sort', 'none');
    });

    await step('Ordenar percorre ascendente, descendente e nenhum', async () => {
      // functional.item3 — três estados. Sem o terceiro, quem ordenou por
      // engano não tem como voltar à ordem original dos dados.
      const button = canvas.getByRole('button', { name: 'Ordenar por Valor' });
      await zerarOrdenacao(button);
      const header = button.closest('th')!;

      await userEvent.click(button);
      await waitFor(() => expect(header).toHaveAttribute('aria-sort', 'ascending'));
      // O menor valor é 60 (INV-009). Se a ordenação comparasse o TEXTO
      // formatado, "R$ 1.200,00" viria antes de "R$ 60,00".
      await expect(firstCell()).toHaveTextContent('INV-009');

      await userEvent.click(button);
      await waitFor(() => expect(header).toHaveAttribute('aria-sort', 'descending'));
      await expect(firstCell()).toHaveTextContent('INV-008');

      await userEvent.click(button);
      await waitFor(() => expect(header).toHaveAttribute('aria-sort', 'none'));
      await expect(firstCell()).toHaveTextContent('INV-001');
    });

    await step('Cada caixa de seleção tem um nome só dela', async () => {
      /*
       * accessibility.item3 — a asserção antiga fixava `aria-label` em
       * "Selecionar linha" e, com isso, GUARDAVA o defeito: dez controles
       * homônimos passavam no teste porque o teste pedia exatamente o nome
       * repetido. O que o leitor de tela precisa é distinguir um do outro
       * (WCAG 4.1.2), então a prova é a comparação ENTRE si.
       *
       * O prefixo "Selecionar fatura" prova de quebra que `labels` chegou ao
       * componente: o padrão diria "Selecionar linha".
       */
      const boxes = [
        ...canvasElement.querySelectorAll<HTMLElement>("tbody [role='checkbox']"),
      ];
      await expect(boxes.length).toBe(lines().length);

      const names = boxes.map((c) => c.getAttribute('aria-label') ?? '');
      await expect(new Set(names).size).toBe(names.length);

      // Cada nome carrega o identificador da PRÓPRIA linha — o mesmo texto que
      // quem enxerga usaria para apontar a linha.
      for (const line of lines()) {
        await expect(lineBox(line)).toHaveAttribute(
          'aria-label',
          `Selecionar fatura ${identificador(line)}`,
        );
      }

      const allName = allBox().getAttribute('aria-label') ?? '';
      await expect(names).not.toContain(allName);
    });

    await step('A busca livre recorta as linhas', async () => {
      // functional.item1 — o filtro global casa em qualquer coluna.
      const search = canvas.getByRole('searchbox');
      await userEvent.clear(search);
      await userEvent.type(search, 'Karen');
      await waitFor(() => expect(lines().length).toBe(1));
      await expect(firstCell()).toHaveTextContent('INV-011');
      // A contagem acompanha o recorte, e não o total do dataset.
      await expect(regiaoViva()).toHaveTextContent('de 1 fatura(s) selecionada(s).');

      await userEvent.clear(search);
      await waitFor(() => expect(lines().length).toBe(10));
    });

    await step('Selecionar tudo marca a página e a contagem é anunciada', async () => {
      // functional.item4 — e visual.item1: a linha marcada muda de fundo. Uma
      // tabela que só muda de COR é muda para quem não vê, por isso a região
      // viva carrega o número.
      const all = allBox();
      await marcar(all, 'true');

      for (const line of lines()) {
        await expect(line).toHaveAttribute('data-state', 'selected');
      }
      await expect(regiaoViva()).toHaveAttribute('aria-live', 'polite');
      // Dez marcadas de doze: o cabeçalho marca a PÁGINA, a contagem conta o
      // conjunto filtrado inteiro.
      await expect(regiaoViva()).toHaveTextContent('10 de 12 fatura(s) selecionada(s).');
      await expect(getComputedStyle(lines()[0]).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    });

    await step('Desmarcar uma linha deixa o cabeçalho em estado misto', async () => {
      const first = lines()[0].querySelector<HTMLElement>("[role='checkbox']")!;
      await marcar(first, 'false');
      await waitFor(() => expect(allBox()).toHaveAttribute('aria-checked', 'mixed'));
      await expect(lines()[0].hasAttribute('data-state')).toBe(false);
    });

    await step('Do estado misto, dois cliques marcam tudo e depois limpam', async () => {
      // O terceiro trecho de functional.item4: o cabeçalho precisa DESMARCAR,
      // não só marcar. Partindo do misto, o primeiro clique completa a página e
      // o segundo esvazia.
      const all = allBox();
      await marcar(all, 'true');
      await marcar(all, 'false');
      await expect(regiaoViva()).toHaveTextContent('0 de 12 fatura(s) selecionada(s).');
      await expect(
        canvasElement.querySelectorAll("tbody tr[data-state='selected']").length,
      ).toBe(0);
    });

    await step('Ordenar não muda de linha o que estava marcado', async () => {
      /*
       * functional.item9 — a marcação tem de viajar com o REGISTRO, não com a
       * posição na tela. Por isso as duas linhas são escolhidas pelo
       * identificador e reconferidas pelo identificador: comparar posições
       * passaria mesmo se a ordenação tivesse embaralhado a marcação junto.
       */
      const button = canvas.getByRole('button', { name: 'Ordenar por Valor' });
      await zerarOrdenacao(button);
      await clearSelection();

      const targets = ['INV-002', 'INV-005'];
      for (const id of targets) await marcar(lineBox(lineOf(id)), 'true');
      await expect(regiaoViva()).toHaveTextContent('2 de 12 fatura(s) selecionada(s).');

      const header = button.closest('th')!;
      await userEvent.click(button);
      await waitFor(() => expect(header).toHaveAttribute('aria-sort', 'ascending'));
      // A ordem mudou de verdade: sem isto o passo provaria a persistência em
      // cima de uma tabela que não reordenou nada.
      await expect(firstCell()).toHaveTextContent('INV-009');

      const checked = lines()
        .filter((l) => lineBox(l).getAttribute('aria-checked') === 'true')
        .map(identificador);
      await expect([...checked].sort()).toEqual([...targets].sort());
      await expect(regiaoViva()).toHaveTextContent('2 de 12 fatura(s) selecionada(s).');

      // Devolve o estado que o passo seguinte espera: sem ordem, sem marcação.
      await zerarOrdenacao(button);
      await clearSelection();
    });

    await step('A story termina com seleção parcial na tela', async () => {
      // visual.item1 — a captura do Chromatic guarda o ÚLTIMO estado, e o item
      // documentado é "estado padrão com seleção".
      await clearSelection();
      await marcar(lineBox(lines()[0]), 'true');
      await marcar(lineBox(lines()[2]), 'true');
      await expect(regiaoViva()).toHaveTextContent('2 de 12 fatura(s) selecionada(s).');
    });
  },
};
