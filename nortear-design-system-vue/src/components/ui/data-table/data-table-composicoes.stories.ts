import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { h, ref } from 'vue';
import { within, userEvent, waitFor, fireEvent, expect, fn } from 'storybook/test';
import { DataTable, type DataTableColumn } from './index';
import { Badge } from '@/components/ui/badge';
import { waitForPortal, waitForPortalGone, REGRA_GUARDA_DE_FOCO } from '@/lib/wait-for-portal';
import {
  type Invoice,
  invoices,
  currency,
  statusVariant,
  baseColumns,
} from './data-table.fixtures';
import {
  dataTableColunasRedimensionaveisSource,
  dataTableEdicaoInlineSource,
  dataTableFiltrosPorColunaSource,
  dataTableReordenarEFixarSource,
} from './data-table.source';

const meta: Meta<Record<string, unknown>> = {
  title: 'UI/DataTable/Compositions',
  component: DataTable as never,
  tags: ['tables'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: dataTableFiltrosPorColunaSource } },
  },
};

export default meta;
type Story = StoryObj<Record<string, unknown>>;

/** Linhas de dado — a mensagem de "sem resultados" também é um `tr` do tbody. */
function linhasDeDado(raiz: HTMLElement): HTMLElement[] {
  return [...raiz.querySelectorAll<HTMLElement>('tbody tr')].filter(
    (tr) => !tr.querySelector('.nds-data-table-empty'),
  );
}

// ── Filtros por coluna ─────────────────────────────────────────────────────
const filterableColumns: DataTableColumn<Invoice>[] = [
  { accessorKey: 'id', header: 'Fatura', meta: { filter: { type: 'text' } } },
  { accessorKey: 'customer', header: 'Cliente', meta: { filter: { type: 'text' } } },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { filter: { type: 'select', options: ['Pago', 'Pendente', 'Cancelado'] } },
    cell: ({ row }) =>
      h(Badge, { variant: statusVariant[row.original.status] }, () => row.original.status),
  },
  {
    accessorKey: 'method',
    header: 'Método',
    meta: {
      filter: {
        type: 'select',
        options: ['Cartão de crédito', 'Boleto bancário', 'Pix', 'Cartão de débito', 'Transferência'],
      },
    },
  },
  {
    accessorKey: 'amount',
    header: 'Valor',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'nds-font-medium nds-tabular-nums' },
        currency.format(row.original.amount),
      ),
  },
];

export const WithColumnFilters: Story = {
  render: () => ({
    components: { DataTable },
    setup() {
      return { columns: filterableColumns, data: invoices };
    },
    template: `<DataTable :columns="columns" :data="data" :enable-column-filters="true" :enable-pagination="false" />`,
  }),
  parameters: {
    covers: ['functional.item2', 'accessibility.item4', 'visual.item2'],
    controls: { disable: true },
    actions: { disable: true },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const linhas = () => linhasDeDado(canvasElement);

    await step('A linha de filtros existe e cada célula dela tem nome', async () => {
      // Sem texto no `th`, a célula chega ao axe como cabeçalho vazio: o VALOR
      // de um input não entra no nome acessível do elemento que o contém, então
      // uma célula que só tem o campo é, para a árvore de acessibilidade, vazia.
      const linhaDeFiltros = canvasElement.querySelector<HTMLElement>(
        '.nds-data-table-filter-row',
      )!;
      const celulas = [...linhaDeFiltros.querySelectorAll('th')];
      await expect(celulas.length).toBe(filterableColumns.length);
      // A coluna Valor não tem filtro — e é justamente ela que precisa dizer
      // de qual coluna a célula vazia é.
      await expect(celulas[celulas.length - 1]).toHaveTextContent('Sem filtro para Valor');
    });

    await step('O select por coluna recorta pelo valor exato', async () => {
      const select = canvas.getByRole('combobox', { name: 'Filtrar Status' });
      await userEvent.selectOptions(select, 'Cancelado');
      await waitFor(() => expect(linhas().length).toBe(2));
    });

    await step('O filtro de texto soma ao anterior, não o substitui', async () => {
      // functional.item2 — o valor esperado é 1, e não 2: se o segundo filtro
      // trocasse o primeiro, "Carla" sozinha devolveria a mesma linha e o teste
      // passaria sem provar nada. A prova é que "Ana" (que é Pago) some.
      const campo = canvas.getByRole('textbox', { name: 'Filtrar Cliente' });
      await userEvent.clear(campo);
      await userEvent.type(campo, 'Carla');
      await waitFor(() => expect(linhas().length).toBe(1));
      await expect(linhas()[0]).toHaveTextContent('INV-003');

      await userEvent.clear(campo);
      await userEvent.type(campo, 'Ana');
      await waitFor(() => expect(linhas().length).toBe(0));
      // visual.item2 — a story termina com os dois filtros preenchidos e o
      // estado vazio na tela, que é o que a captura do Chromatic guarda.
      await expect(canvasElement.querySelector('.nds-data-table-empty')).toHaveTextContent(
        'Sem resultados.',
      );
    });
  },
};

// ── Resize ─────────────────────────────────────────────────────────────────
export const ResizableColumns: Story = {
  render: () => ({
    components: { DataTable },
    setup() {
      return { columns: baseColumns, data: invoices };
    },
    template: `<DataTable :columns="columns" :data="data" :enable-column-resizing="true" />`,
  }),
  parameters: {
    covers: ['visual.item3'],
    controls: { disable: true },
    actions: { disable: true },
    // Colunas sem `meta.filter`, e a paginação de volta: o snippet do meta
    // mostra o oposto dos dois.
    docs: { source: { transform: dataTableColunasRedimensionaveisSource } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const alca = () => canvas.getByRole('separator', { name: 'Redimensionar coluna Cliente' });

    await step('A alça se anuncia como separador, com o nome da coluna', async () => {
      const el = alca();
      await expect(el).toHaveAttribute('aria-orientation', 'vertical');
      await expect(el.closest('th')).toHaveClass('nds-data-table-th');
    });

    await step('Arrastar a alça muda a largura daquela coluna, e só dela', async () => {
      // visual.item3 — a story termina com a coluna redimensionada; é esse o
      // estado que a regressão visual guarda.
      //
      // A medida é a largura DECLARADA (`style.width`), não a renderizada: com
      // `table-layout: fixed` o navegador redistribui o que sobra, então a
      // coluna vizinha encolhe na tela sem que ninguém tenha mexido no tamanho
      // dela.
      const el = alca();
      const cabecalho = el.closest('th') as HTMLElement;
      const vizinho = cabecalho.nextElementSibling as HTMLElement;
      const antes = parseFloat(cabecalho.style.width);
      const declaradaDoVizinho = vizinho.style.width;
      const caixa = el.getBoundingClientRect();

      fireEvent.mouseDown(el, { clientX: caixa.left, clientY: caixa.top });
      fireEvent.mouseMove(document, { clientX: caixa.left + 80, clientY: caixa.top });
      fireEvent.mouseUp(document, { clientX: caixa.left + 80, clientY: caixa.top });

      await waitFor(async () => {
        await expect(parseFloat(cabecalho.style.width)).toBeGreaterThan(antes + 40);
      });
      await expect(vizinho.style.width).toBe(declaradaDoVizinho);
    });
  },
};

// ── Reorder + Pin ──────────────────────────────────────────────────────────
export const ReorderableAndPinnable: Story = {
  render: () => ({
    components: { DataTable },
    setup() {
      return { columns: baseColumns, data: invoices };
    },
    template: `<DataTable :columns="columns" :data="data" :enable-column-ordering="true" :enable-column-pinning="true" />`,
  }),
  parameters: {
    covers: ['functional.item6', 'visual.item3'],
    a11y: { config: { rules: [REGRA_GUARDA_DE_FOCO] } },
    controls: { disable: true },
    actions: { disable: true },
    // Duas flags que nenhuma outra story liga, e que andam em par: reordenar
    // sem fixar deixa a coluna fixada saindo de lugar.
    docs: { source: { transform: dataTableReordenarEFixarSource } },
  },
  play: async ({ canvasElement, step }) => {
    const cabecalhos = () => [
      ...canvasElement.querySelectorAll<HTMLElement>('thead tr:first-child th'),
    ];
    const rotulos = () => cabecalhos().map((th) => th.textContent!.trim());

    await step('Arrastar um cabeçalho troca a ordem das colunas E das células', async () => {
      // functional.item6 — o cabeçalho mudar de lugar não bastaria: a grade
      // pode reordenar o topo e deixar os dados onde estavam. A prova é a
      // primeira célula da primeira linha passar a ser o outro dado.
      const antes = rotulos();
      const primeiraCelulaAntes = canvasElement
        .querySelector<HTMLElement>('tbody tr td')!
        .textContent!.trim();

      const origem = cabecalhos()[0];
      const destino = cabecalhos()[1];
      await expect(origem).toHaveAttribute('draggable', 'true');

      fireEvent.dragStart(origem);
      fireEvent.dragOver(destino);
      fireEvent.drop(destino);

      await waitFor(async () => {
        await expect(rotulos()[0]).toBe(antes[1]);
      });
      await expect(rotulos()[1]).toBe(antes[0]);
      await expect(
        canvasElement.querySelector<HTMLElement>('tbody tr td')!.textContent!.trim(),
      ).not.toBe(primeiraCelulaAntes);
    });

    await step('Fixar uma coluna a gruda na borda durante o scroll horizontal', async () => {
      // visual.item3 — a story termina com a coluna fixada e as colunas
      // reordenadas, que é o par que o item documenta.
      const gatilho = canvasElement.querySelector<HTMLElement>('.nds-data-table-columns-btn')!;
      await userEvent.click(gatilho);
      await waitForPortal('menu');

      // Par idempotente: se a rodada anterior deixou a coluna fixada, desafixa
      // primeiro. Assim o passo sempre executa o clique que ele afirma testar.
      const menu = within(document.body);
      const jaFixada = menu.queryByRole('button', { name: 'Desafixar Cliente' });
      if (jaFixada) {
        await userEvent.click(jaFixada);
        await waitFor(() =>
          expect(canvasElement.querySelector('thead th.nds-data-table-th-pinned')).toBeNull(),
        );
      }

      await userEvent.click(
        await waitFor(() => menu.getByRole('button', { name: 'Fixar Cliente à esquerda' })),
      );

      await waitFor(async () => {
        const fixado = canvasElement.querySelector<HTMLElement>(
          'thead th.nds-data-table-th-pinned',
        );
        await expect(fixado).not.toBeNull();
        // Fixar é POSIÇÃO, não cor: sem `sticky` a coluna rola junto e o pin
        // vira só um ícone aceso.
        await expect(getComputedStyle(fixado!).position).toBe('sticky');
      });

      if (document.body.querySelector('[role="menu"]')) {
        await userEvent.keyboard('{Escape}');
        await waitForPortalGone('menu');
      }
    });
  },
};

// ── Edição inline ──────────────────────────────────────────────────────────
const editableColumns: DataTableColumn<Invoice>[] = [
  { accessorKey: 'id', header: 'Fatura' },
  { accessorKey: 'customer', header: 'Cliente', meta: { editable: true } },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) =>
      h(Badge, { variant: statusVariant[row.original.status] }, () => row.original.status),
  },
  { accessorKey: 'method', header: 'Método', meta: { editable: true } },
  {
    accessorKey: 'amount',
    header: 'Valor',
    meta: { editable: true },
    cell: ({ row }) =>
      h(
        'span',
        { class: 'nds-font-medium nds-tabular-nums' },
        currency.format(row.original.amount),
      ),
  },
];

/**
 * O DataTable não guarda os dados: `cellEdit` avisa e quem consome atualiza o
 * array. O spy é de escopo de MÓDULO: criado dentro do `setup` ele seria
 * inalcançável pela play e deixaria a aba Actions vazia.
 */
const aoEditar = fn();

export const WithInlineEditing: Story = {
  render: () => ({
    components: { DataTable },
    setup() {
      const data = ref<Invoice[]>(invoices.slice(0, 6));
      const onCellEdit = (rowIndex: number, columnId: string, value: unknown) => {
        aoEditar(rowIndex, columnId, value);
        data.value = data.value.map((row, i) =>
          i === rowIndex ? { ...row, [columnId]: value } : row,
        );
      };
      return { columns: editableColumns, data, onCellEdit };
    },
    template: `<DataTable
      :columns="columns"
      :data="data"
      :enable-global-filter="false"
      :enable-column-visibility="false"
      :enable-pagination="false"
      @cell-edit="onCellEdit"
    />`,
  }),
  parameters: {
    covers: ['functional.item5', 'visual.item4'],
    controls: { disable: true },
    actions: { disable: true },
    // A tabela não é dona do estado: o snippet precisa mostrar o array do
    // consumidor e o handler que o atualiza — nada disso cabe no do meta.
    docs: { source: { transform: dataTableEdicaoInlineSource } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A célula editável é um botão com nome, não um texto solto', async () => {
      const botao = canvas.getAllByRole('button', { name: 'Editar Cliente' })[0];
      await expect(botao).toHaveClass('nds-data-table-edit-btn');
      await expect(botao.closest('td')).toHaveClass('nds-data-table-td');
    });

    await step('Enter confirma, avisa quem consome e o valor novo chega à célula', async () => {
      // functional.item5 — a prova de que o evento carregou (rowIndex, columnId,
      // value) é a chamada registrada MAIS o texto da célula mudar: quem
      // atualiza o array é o consumidor, com os três campos do payload.
      aoEditar.mockClear();
      const botao = canvas.getAllByRole('button', { name: 'Editar Cliente' })[0];
      const valorAntigo = botao.textContent!.trim();
      await userEvent.click(botao);

      const campo = await waitFor(() =>
        canvas.getByRole('textbox', { name: 'Editar Cliente' }),
      );
      await expect(campo).toHaveFocus();

      await userEvent.clear(campo);
      await userEvent.type(campo, 'Ana Prado Filha{Enter}');

      await waitFor(async () => {
        await expect(
          canvas.getAllByRole('button', { name: 'Editar Cliente' })[0],
        ).toHaveTextContent('Ana Prado Filha');
      });
      await expect(aoEditar).toHaveBeenCalledWith(0, 'customer', 'Ana Prado Filha');
      await expect(valorAntigo).not.toBe('Ana Prado Filha');
    });

    await step('Escape descarta o rascunho e não avisa ninguém', async () => {
      aoEditar.mockClear();
      const botao = canvas.getAllByRole('button', { name: 'Editar Valor' })[0];
      const original = botao.textContent!.trim();
      await userEvent.click(botao);

      const campo = await waitFor(() => canvas.getByRole('textbox', { name: 'Editar Valor' }));
      await userEvent.clear(campo);
      await userEvent.type(campo, '9999{Escape}');

      await waitFor(async () => {
        await expect(
          canvas.getAllByRole('button', { name: 'Editar Valor' })[0],
        ).toHaveTextContent(original);
      });
      await expect(aoEditar).not.toHaveBeenCalled();
    });

    await step('A segunda célula editável fica em edição para a captura', async () => {
      // visual.item4 — a story termina COM um campo aberto: é esse o estado que
      // a regressão visual precisa guardar.
      const botao = canvas.getAllByRole('button', { name: 'Editar Cliente' })[1];
      await userEvent.click(botao);
      await waitFor(async () => {
        await expect(canvasElement.querySelectorAll('.nds-data-table-edit-input').length).toBe(1);
      });
    });
  },
};
