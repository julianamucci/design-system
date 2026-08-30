import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { userEvent, waitFor, within, expect, fn } from 'storybook/test';
import { measureScroll } from '@shared/testing/data-table-probe';
import { DataTable } from './index';
import { baseColumns, invoices, labelsInvoice, type Invoice } from './data-table.fixtures';
import DataTableDocs from '@/components/docs/DataTableDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { dataTableSource } from './data-table.source';

const meta: Meta<Record<string, unknown>> = {
  title: 'Primitives/Tables/DataTable',
  component: DataTable as never,
  tags: ['autodocs', 'tables'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(DataTableDocs), source: { transform: dataTableSource } },
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
    caption: {
      control: 'text',
      description:
        'Nome acessível da tabela. Sai como legenda fora da tela — só o leitor alcança — e é o que ele anuncia ao entrar na grade.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    labels: {
      description:
        'Textos da interface: rótulos dos controles, contagens e navegação. Só as chaves informadas mudam; o resto continua no padrão.',
      table: { type: { summary: 'Partial<DataTableLabels>' }, defaultValue: { summary: 'DATA_TABLE_LABELS_PADRAO' } },
      control: false,
    },
    rowKey: {
      description:
        'Identificador estável de cada linha. Sem ele a identidade é a posição, e reordenar move a marcação de linha.',
      table: { type: { summary: '(row: TData, index: number) => string' }, defaultValue: { summary: '—' } },
      control: false,
    },
    rowLabel: {
      description:
        'Texto que identifica a linha no nome do controle de seleção. Sem ele o identificador sai da primeira coluna.',
      table: { type: { summary: '(row: TData) => string' }, defaultValue: { summary: '—' } },
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
    caption: 'Faturas recentes',
    labels: labelsInvoice,
    rowKey: (f: Invoice) => f.id,
    // Declarado e NÃO passado, de propósito: é aqui que o fallback do nome da
    // linha é exercido — sem `rowLabel`, o identificador tem de sair da
    // primeira coluna sozinho. A chave existe porque toda entrada de `argTypes`
    // precisa do par em `args` (e vice-versa), senão a aba API Reference lista
    // uma prop que o painel não conhece.
    rowLabel: undefined,
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
  render: (args) => ({
    components: { DataTable },
    setup() {
      return { args };
    },
    template: `<DataTable v-bind="args" />`,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const lines = () => [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
    const firstCell = () =>
      lines()[0].querySelector<HTMLElement>("td:not(:has([role='checkbox']))")!;
    /** Identificador da linha como a pessoa vidente o lê: a primeira coluna. */
    const lineId = (tr: HTMLElement) =>
      tr.querySelector<HTMLElement>("td:not(:has([role='checkbox']))")!.textContent!.trim();
    const lineBox = (tr: HTMLElement) => tr.querySelector<HTMLElement>("[role='checkbox']")!;
    // O nome vem de `labels.selectAll` — a story passa `labelsInvoice`, então
    // procurar por "Selecionar todas as linhas" aqui só acharia o padrão de
    // volta, isto é, `labels` ignorado.
    const allBox = () => canvas.getByRole('checkbox', { name: 'Selecionar todas as faturas' });
    const byInvoice = (id: string) =>
      canvas.getByRole('checkbox', { name: `Selecionar fatura ${id}` });
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
    const marcar = async (box: HTMLElement, target: 'true' | 'false') => {
      if (box.getAttribute('aria-checked') !== target) await userEvent.click(box);
      await waitFor(() => expect(box).toHaveAttribute('aria-checked', target));
    };

    await step('É uma tabela de verdade, com seções semânticas', async () => {
      // accessibility.item1 — o que faz um leitor anunciar "tabela, 6 colunas" é
      // a TAG, não a classe. A mesma grade montada com div sumiria da árvore de
      // acessibilidade sem mudar um pixel.
      const table = canvas.getByRole('table');
      await expect(table.tagName).toBe('TABLE');
      await expect(table).toHaveAttribute('data-slot', 'table');
      await expect(table.querySelector('thead')).toHaveAttribute('data-slot', 'table-header');
      await expect(table.querySelector('tbody')).toHaveAttribute('data-slot', 'table-body');
      await expect(canvasElement.querySelector("[data-slot='data-table']")).toHaveClass(
        'nds-data-table',
      );
      await expect(lines().length).toBe(10);
    });

    await step('A legenda nomeia a tabela sem ocupar espaço na tela', async () => {
      // accessibility.item6 — a legenda é a única coisa que diz DE QUÊ é esta
      // grade a quem entra nela pelo leitor. Fora da tela porque o título já
      // está acima para quem vê; repeti-lo seria ruído visual.
      const table = canvas.getByRole('table');
      const caption = table.querySelector('caption');
      await expect(caption).not.toBeNull();
      // Primeiro filho porque o HTML exige: em outra posição o navegador a
      // descarta e o nome acessível some junto.
      await expect(table.firstElementChild).toBe(caption);
      await expect(table).toHaveAccessibleName('Faturas recentes');
      // O efeito COMPUTADO, não o nome da classe: uma classe renomeada no CSS
      // deixaria a legenda visível sem quebrar asserção nenhuma.
      const estilo = getComputedStyle(caption!);
      const box = caption!.getBoundingClientRect();
      await expect(estilo.position).toBe('absolute');
      await expect(box.width).toBeLessThanOrEqual(2);
      await expect(box.height).toBeLessThanOrEqual(2);
    });

    await step('Uma só camada rola na horizontal, e ela recebe foco', async () => {
      // accessibility.item5 — quem rola tem de estar na ordem de tabulação
      // (WCAG 2.1.1 / axe scrollable-region-focusable). Duas camadas roláveis
      // aninhadas são pior que uma: o teclado alcança a de fora e move a de
      // dentro. A medição é do estilo computado, porque foi justamente uma
      // classe morta que neutralizava o contêiner alcançável.
      const r = measureScroll(canvasElement);
      await expect(r.camadasRolaveis).toEqual(['nds-table-wrapper']);
      await expect(r.rolaveisForaDoTeclado).toEqual([]);
      await expect(r.interno.overflowX).toBe('auto');
      await expect(r.interno.tabIndex).toBe(0);
      await expect(r.externo.overflowX).toBe('visible');
      await expect(r.externo.tabIndex).toBe(-1);
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

    await step('Cada checkbox de seleção tem um nome só dele', async () => {
      // accessibility.item3 — o mesmo nome nos onze controles é o mesmo que
      // nenhum nome (WCAG 4.1.2): o leitor lista onze caixas idênticas e
      // marcar vira aposta. A asserção anterior exigia o literal "Selecionar
      // linha" em toda linha, ou seja, GUARDAVA o defeito: só passava enquanto
      // os nomes fossem indistinguíveis.
      const boxes = [...canvasElement.querySelectorAll<HTMLElement>("tbody [role='checkbox']")];
      await expect(boxes.length).toBe(lines().length);

      const names = boxes.map((c) => c.getAttribute('aria-label') ?? '');
      await expect(new Set(names).size).toBe(names.length);

      // Cada nome carrega o identificador da PRÓPRIA linha. Como a story não
      // passa `rowLabel`, esse identificador só pode ter vindo da primeira
      // coluna — é o fallback sendo exercido, e não a prop.
      for (const [i, tr] of lines().entries()) {
        await expect(names[i]).toContain(lineId(tr));
      }

      const headerName = allBox().getAttribute('aria-label');
      await expect(headerName).toBe('Selecionar todas as faturas');
      await expect(names).not.toContain(headerName);
    });

    await step('A busca livre recorta as linhas', async () => {
      // functional.item1 — o filtro global casa em qualquer coluna.
      const search = canvas.getByRole('searchbox');
      await userEvent.clear(search);
      await userEvent.type(search, 'Karen');
      await waitFor(() => expect(lines().length).toBe(1));
      await expect(firstCell()).toHaveTextContent('INV-011');
      // A contagem acompanha o recorte, e não o total do dataset.
      await expect(regiaoViva()).toHaveTextContent('de 1 linha(s) selecionada(s).');

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
      await expect(regiaoViva()).toHaveTextContent('10 de 12 linha(s) selecionada(s).');
      await expect(getComputedStyle(lines()[0]).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    });

    await step('Desmarcar uma linha deixa o cabeçalho em estado misto', async () => {
      const first = lineBox(lines()[0]);
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
      await expect(regiaoViva()).toHaveTextContent('0 de 12 linha(s) selecionada(s).');
      await expect(
        canvasElement.querySelectorAll("tbody tr[data-state='selected']").length,
      ).toBe(0);
    });

    await step('Ordenar não transfere a marcação para outra linha', async () => {
      // functional.item9 — a marcação pertence à LINHA e não à posição. Sem
      // `rowKey`, a identidade seria o índice: reordenar deixaria marcada a
      // terceira posição, com outra fatura dentro dela — e ninguém veria, já
      // que a contagem continuaria em dois.
      const button = canvas.getByRole('button', { name: 'Ordenar por Valor' });
      await zerarOrdenacao(button);
      // Reconsulta a cada volta: a linha é reescrita entre um clique e o outro,
      // e uma referência colhida antes pode não ser mais a que está na tela.
      const clearMarkup = async () => {
        for (let i = 0; i < lines().length; i++) {
          await marcar(lineBox(lines()[i]), 'false');
        }
      };
      await clearMarkup();

      // Marcadas por NOME: por posição, o passo não distinguiria "a mesma
      // linha" de "a mesma linha da tela".
      await marcar(byInvoice('INV-002'), 'true');
      await marcar(byInvoice('INV-009'), 'true');
      const contagemBefore = regiaoViva().textContent!.trim();
      await expect(contagemBefore).toBe('2 de 12 linha(s) selecionada(s).');

      await userEvent.click(button);
      await waitFor(() =>
        expect(button.closest('th')!).toHaveAttribute('aria-sort', 'ascending'),
      );
      // INV-009 tem o menor valor: as linhas de fato trocaram de lugar.
      await expect(firstCell()).toHaveTextContent('INV-009');

      const checked = lines()
        .filter((tr) => tr.getAttribute('data-state') === 'selected')
        .map(lineId)
        .sort();
      await expect(checked).toEqual(['INV-002', 'INV-009']);
      await expect(regiaoViva().textContent!.trim()).toBe(contagemBefore);

      // Devolve a tabela ao estado em que o passo a encontrou: o painel
      // Interactions reexecuta a play no MESMO DOM.
      await zerarOrdenacao(button);
      await clearMarkup();
    });

    await step('A story termina com seleção parcial na tela', async () => {
      // visual.item1 — a captura do Chromatic guarda o ÚLTIMO estado, e o item
      // documentado é "estado padrão com seleção".
      await marcar(lineBox(lines()[0]), 'true');
      await marcar(lineBox(lines()[2]), 'true');
      await expect(regiaoViva()).toHaveTextContent('2 de 12 linha(s) selecionada(s).');
    });
  },
};
