import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { measureScroll } from '@shared/testing/data-table-probe';
import { NdsDataTable } from './data-table';
import { COLUMNS_INVOICES, INVOICES_DT, LABELS_DT, type InvoiceDT } from './data-table.fixtures';
import { dataTablePlaygroundSource, type DataTableArgs } from './data-table.source';
import { NdsDataTableDocs } from '@/components/docs/DataTableDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

/** Identidade da linha: a fatura, não a posição dela na página. */
const INVOICE_KEY = (invoice: InvoiceDT) => invoice.id;

const meta: Meta<DataTableArgs> = {
  title: 'Components/Tables/DataTable',
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
  // Sem compodoc (armadilha 2 do CLAUDE.md deste stack) a aba API Reference sai
  // inteira daqui: `table.type` e `table.defaultValue` escritos à mão são as
  // colunas "Tipo" e "Padrão". Sem eles a tabela nasce com as células vazias.
  argTypes: {
    caption: {
      control: 'text',
      description:
        'Nome acessível da tabela. Fica fora da tela e é o que o leitor anuncia ao entrar na grade.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "''" } },
    },
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
    // Objeto e funções não têm control útil, mas continuam na tabela: são o
    // contrato de quem vai escrever a tabela, não ruído de painel.
    labels: {
      control: false,
      description:
        'Textos da interface, com marcador para a coluna, a linha e as contagens. Só as chaves informadas mudam.',
      table: { type: { summary: 'Partial<DataTableLabels>' }, defaultValue: { summary: '{}' } },
    },
    rowKey: {
      control: false,
      description:
        'Identificador estável da linha. Sem ele a identidade é a posição, e ordenar moveria de linha o que estava marcado.',
      table: {
        type: { summary: '(row, index) => string' },
        defaultValue: { summary: 'índice do array' },
      },
    },
    rowLabel: {
      control: false,
      description:
        'Texto que identifica a linha no nome do checkbox de seleção. Sem ele o identificador sai da primeira coluna.',
      table: { type: { summary: '(row) => string' }, defaultValue: { summary: '—' } },
    },
  },
  args: {
    caption: 'Faturas recentes',
    enableRowSelection: true,
    enableGlobalFilter: true,
    enablePagination: true,
    pageSize: 5,
    labels: LABELS_DT,
    rowKey: INVOICE_KEY,
    // Declarado e deixado em branco de propósito: é AQUI que o degrau do meio do
    // fallback é provado — sem `rowLabel`, o nome do controle de seleção sai da
    // primeira coluna ("Fatura"). O caminho explícito, em que o rótulo vem de
    // OUTRA coluna, tem story própria em UI/DataTable/Settings.
    rowLabel: undefined,
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
      'functional.item9',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item3',
      'accessibility.item4',
      'accessibility.item5',
      'accessibility.item6',
      'visual.item1',
    ],
    docs: { source: { transform: dataTablePlaygroundSource } },
  },
  render: (args) => ({
    props: { ...args, colunas: COLUMNS_INVOICES, faturas: INVOICES_DT },
    template: `
      <div
        ndsDataTable
        [caption]="caption"
        [columns]="colunas"
        [data]="faturas"
        [labels]="labels"
        [rowKey]="rowKey"
        [rowLabel]="rowLabel"
        [enableRowSelection]="enableRowSelection"
        [enableGlobalFilter]="enableGlobalFilter"
        [enablePagination]="enablePagination"
        [pageSize]="pageSize"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const lines = () => [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
    const identidadeCell = (line: HTMLElement) =>
      line.querySelector<HTMLElement>('td:not(:has(button[role="checkbox"]))')!;
    const firstCell = () => identidadeCell(lines()[0]);

    // Os alvos são funções, e não elementos guardados: ordenar reordena os nós
    // do corpo, e um elemento capturado antes viraria referência a outra linha.
    const allBox = () => canvas.getByRole('checkbox', { name: 'Selecionar todas as faturas' });
    const invoiceBox = (id: string) =>
      canvas.getByRole('checkbox', { name: `Selecionar fatura ${id}` });
    const regiaoViva = () => canvasElement.querySelector<HTMLElement>('[role="status"]')!;
    const ordenarButton = () => canvas.getByRole('button', { name: 'Ordenar por Valor' });
    const valueHeader = () => ordenarButton().closest('th')!;

    // Precondição em vez de clique cego: o painel Interactions reexecuta a play
    // no MESMO DOM, e um clique que inverte estado dá resultado oposto na
    // segunda rodada. Dois cliques bastam para qualquer estado do checkbox —
    // do misto, o primeiro completa a página.
    // Os dois `if` são a mesma coisa que o laço de duas voltas que estava aqui,
    // escritos de forma que a GUARDA fique na linha do clique: é isso que
    // distingue clique condicional de clique cego, para quem lê e para a regra
    // `play_nao_idempotente` do audit — que só enxerga a condição quando ela
    // está na própria linha do `userEvent.click`.
    const moveBox = async (box: () => HTMLElement, state: 'true' | 'false') => {
      if (box().getAttribute('aria-checked') !== state) await userEvent.click(box());
      // Segundo clique: partindo do misto, o primeiro só completa a página.
      if (box().getAttribute('aria-checked') !== state) await userEvent.click(box());
      await expect(box()).toHaveAttribute('aria-checked', state);
    };

    /** Mesma ideia para a ordenação, que é um ciclo de três estados. */
    const moveOrdenacao = async (state: 'none' | 'ascending' | 'descending') => {
      for (let i = 0; i < 3 && valueHeader().getAttribute('aria-sort') !== state; i += 1) {
        await userEvent.click(ordenarButton());
      }
      await expect(valueHeader()).toHaveAttribute('aria-sort', state);
    };

    await step('É uma tabela de verdade, com nome e seções semânticas', async () => {
      // accessibility.item1 — o que faz um leitor anunciar "tabela, 6 colunas" é
      // a tag, não a classe. A mesma grade montada com div sumiria da árvore de
      // acessibilidade sem mudar um pixel.
      const table = canvas.getByRole('table', { name: /faturas recentes/i });
      await expect(table.tagName).toBe('TABLE');
      await expect(table).toHaveAttribute('data-slot', 'table');
      await expect(table.querySelector('thead')).toHaveAttribute('data-slot', 'table-header');
      await expect(table.querySelector('tbody')).toHaveAttribute('data-slot', 'table-body');
      await expect(canvasElement.querySelector('[data-slot="data-table"]')).toHaveClass(
        'nds-data-table',
      );
      await expect(lines().length).toBe(args.pageSize);
    });

    await step('Uma camada só rola na horizontal, e ela recebe foco', async () => {
      // accessibility.item5 — medido pelo estilo COMPUTADO, nunca pela presença
      // de classe: classe não protege nada, e foi justamente uma classe de
      // neutralização que zerava o overflow do contêiner alcançável por teclado
      // e empurrava a rolagem para o de fora, que não recebe foco
      // (WCAG 2.1.1, regra `scrollable-region-focusable` do axe).
      const r = measureScroll(canvasElement);
      await expect(r.camadasRolaveis).toEqual(['nds-table-wrapper']);
      await expect(r.rolaveisForaDoTeclado).toEqual([]);
      await expect(r.interno.overflowX).toBe('auto');
      await expect(r.interno.tabIndex).toBe(0);
      // A moldura externa é só borda e raio. Devolver `overflow-x` a ela faria
      // este passo falhar — que é exatamente o que se quer dele.
      await expect(r.externo.overflowX).toBe('visible');
      await expect(r.externo.tabIndex).toBe(-1);
    });

    await step('A legenda nomeia a tabela sem ocupar espaço na tela', async () => {
      // accessibility.item6 — o contrato é o EFEITO: a legenda abre a tabela,
      // dá o nome que o leitor anuncia e sai do fluxo numa caixa de 1px.
      // Afirmar `.nds-sr-only` provaria só que alguém escreveu a classe.
      const table = canvas.getByRole('table', { name: args.caption });
      const caption = table.firstElementChild!;
      await expect(caption.tagName).toBe('CAPTION');
      await expect(caption).toHaveTextContent(args.caption);

      const estilo = getComputedStyle(caption);
      const box = caption.getBoundingClientRect();
      await expect(estilo.position).toBe('absolute');
      await expect(box.width).toBeLessThanOrEqual(2);
      await expect(box.height).toBeLessThanOrEqual(2);
    });

    await step('Cabeçalho ordenável anuncia que ordena, e como', async () => {
      // accessibility.item2 — o aria-label carrega o nome da coluna: "Ordenar
      // por" cinco vezes seria indistinguível na lista de controles do leitor.
      // `getByRole` com o nome exato é o que prova isso — ele falha se o rótulo
      // perder a coluna. O aria-sort mora no `th`, que é quem tem a relação
      // com a coluna.
      await expect(valueHeader()).toHaveAttribute('scope', 'col');
      // Sem ordem aplicada, o th diz "none" — e dizer algo é o que anuncia que
      // a coluna ordena.
      await moveOrdenacao('none');

      // Coluna sem ordenação não promete ordenação nenhuma.
      const noOrder = canvas.getByText('Método').closest('th')!;
      await expect(noOrder.hasAttribute('aria-sort')).toBe(false);
    });

    await step('Ordenar percorre ascendente, descendente e nenhum', async () => {
      // functional.item3 — três estados. Sem o terceiro, quem ordenou por
      // engano não tem como voltar à ordem original dos dados.
      await moveOrdenacao('none');

      await userEvent.click(ordenarButton());
      await expect(valueHeader()).toHaveAttribute('aria-sort', 'ascending');
      await expect(firstCell()).toHaveTextContent('#INV-010');

      await userEvent.click(ordenarButton());
      await expect(valueHeader()).toHaveAttribute('aria-sort', 'descending');
      await expect(firstCell()).toHaveTextContent('#INV-011');

      await userEvent.click(ordenarButton());
      await expect(valueHeader()).toHaveAttribute('aria-sort', 'none');
      await expect(firstCell()).toHaveTextContent('#INV-001');
    });

    await step('Cada checkbox de linha tem um nome só dele', async () => {
      // accessibility.item3 — "Selecionar linha" repetido em doze checkboxes é o
      // mesmo que nenhum nome: o leitor lista doze controles idênticos.
      const boxes = lines().map(
        (line) => line.querySelector<HTMLElement>('button[role="checkbox"]')!,
      );
      const names = boxes.map((box) => box.getAttribute('aria-label')!);
      await expect(names).toEqual([
        'Selecionar fatura #INV-001',
        'Selecionar fatura #INV-002',
        'Selecionar fatura #INV-003',
        'Selecionar fatura #INV-004',
        'Selecionar fatura #INV-005',
      ]);

      // A lista literal sozinha não diz nada: trocar os cinco rótulos por um
      // mesmo valor repetido continuaria casando com uma lista escrita à mão.
      // O que o leitor precisa é de nomes DISTINTOS entre si.
      await expect(new Set(names).size).toBe(names.length);

      // E distintos pelo motivo certo: cada nome carrega o identificador da
      // PRÓPRIA linha — o mesmo texto que quem enxerga lê na primeira célula.
      for (const [i, box] of boxes.entries()) {
        const identificador = identidadeCell(lines()[i]).textContent!.trim();
        await expect(box.getAttribute('aria-label')).toContain(identificador);
      }

      // O do cabeçalho age sobre a página inteira: confundi-lo com o de uma
      // linha custaria doze marcações de uma vez.
      await expect(names).not.toContain(allBox().getAttribute('aria-label'));
    });

    await step('Selecionar tudo marca a página e a contagem é anunciada', async () => {
      // functional.item4 — e visual.item1: a linha marcada muda de fundo. Uma
      // tabela que só muda de COR é muda para quem não vê, por isso a região
      // viva carrega o número.
      await moveBox(allBox, 'true');

      for (const line of lines()) {
        await expect(line).toHaveAttribute('data-state', 'selected');
      }
      await expect(regiaoViva()).toHaveAttribute('aria-live', 'polite');
      await expect(regiaoViva()).toHaveTextContent('5 de 12 linha(s) selecionada(s).');
      await expect(getComputedStyle(lines()[0]).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    });

    await step('Desmarcar uma linha deixa o cabeçalho em estado misto', async () => {
      // A linha é escolhida pelo NOME: por índice, o passo continuaria passando
      // se a marcação tivesse trocado de linha.
      await moveBox(allBox, 'true');
      await moveBox(() => invoiceBox('#INV-001'), 'false');

      await expect(allBox()).toHaveAttribute('aria-checked', 'mixed');
      await expect(allBox()).toHaveAttribute('data-state', 'indeterminate');
      await expect(invoiceBox('#INV-001').closest('tr')!.hasAttribute('data-state')).toBe(false);
    });

    await step('Do estado misto, dois cliques marcam tudo e depois limpam', async () => {
      // O terceiro trecho de functional.item4 — "segundo clique desmarca tudo"
      // — estava documentado e NÃO verificado: a play só provava que o
      // cabeçalho MARCA. Partindo do misto, o primeiro clique completa a página
      // e o segundo esvazia.
      await expect(allBox()).toHaveAttribute('aria-checked', 'mixed');
      await moveBox(allBox, 'true');
      await moveBox(allBox, 'false');
      await expect(canvasElement.querySelectorAll('tbody tr[data-state="selected"]').length)
        .toBe(0);
      await expect(regiaoViva()).toHaveTextContent('0 de 12 linha(s) selecionada(s).');
    });

    await step('A busca livre recorta as linhas e a contagem acompanha', async () => {
      // functional.item1 — o filtro global casa em qualquer coluna, e é a
      // contagem que prova que ele recortou o conjunto inteiro, não só a
      // página visível.
      const search = canvas.getByRole('searchbox');
      // `type` acrescenta ao que estiver no campo — limpar antes é o que faz o
      // passo valer o mesmo na segunda rodada.
      await userEvent.clear(search);
      await userEvent.type(search, 'Karina');

      await expect(lines().length).toBe(1);
      await expect(firstCell()).toHaveTextContent('#INV-011');
      // O denominador acompanha o recorte: sem isto a contagem podia continuar
      // dizendo "de 12" com uma linha na tela.
      await expect(regiaoViva()).toHaveTextContent('de 1 linha(s) selecionada(s).');

      await userEvent.clear(search);
      await expect(lines().length).toBe(args.pageSize);
    });

    await step('Ordenar não move a marcação de linha', async () => {
      // functional.item9 — a marcação pertence à LINHA, não à posição da tela.
      // As duas faturas são escolhidas e conferidas pelo NOME: por índice, o
      // passo passaria mesmo se ordenar tivesse trocado quem está marcado.
      await moveOrdenacao('none');
      await moveBox(allBox, 'false');
      await moveBox(() => invoiceBox('#INV-002'), 'true');
      await moveBox(() => invoiceBox('#INV-005'), 'true');
      const contagemBefore = regiaoViva().textContent;
      await expect(regiaoViva()).toHaveTextContent('2 de 12 linha(s) selecionada(s).');

      await moveOrdenacao('ascending');
      // A ordem mudou de verdade — sem esta linha o passo provaria a
      // conservação de nada.
      await expect(firstCell()).toHaveTextContent('#INV-010');

      await expect(invoiceBox('#INV-002')).toHaveAttribute('aria-checked', 'true');
      await expect(invoiceBox('#INV-005')).toHaveAttribute('aria-checked', 'true');
      await expect(invoiceBox('#INV-002').closest('tr')).toHaveAttribute(
        'data-state',
        'selected',
      );
      await expect(regiaoViva().textContent).toBe(contagemBefore);

      // Volta ao estado de entrada: ordem original e nada marcado.
      await moveOrdenacao('none');
      await moveBox(allBox, 'false');
    });

    await step('A story termina com seleção parcial na tela', async () => {
      // visual.item1 — a captura do Chromatic guarda o ÚLTIMO estado, e o item
      // documentado é "estado padrão com seleção". Antes a play terminava com a
      // busca limpa e a seleção herdada do passo anterior, sem garantia.
      await moveBox(allBox, 'false');
      await moveBox(() => invoiceBox('#INV-001'), 'true');
      await moveBox(() => invoiceBox('#INV-003'), 'true');
      await expect(regiaoViva()).toHaveTextContent('2 de 12 linha(s) selecionada(s).');
    });
  },
};
