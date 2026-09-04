import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { within, userEvent, waitFor, fireEvent, expect, fn } from 'storybook/test';
import DataTable from './data-table.svelte';
import DataTableEditStory from './DataTableEditStory.svelte';
import type { DataTableColumn } from './index';
import { waitForPortal, waitForPortalGone, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';
import {
  dataTableColumnsRedimensionaveisSource,
  dataTableEditInlineSource,
  columnDataTableFiltersSource,
  dataTableReordenarEFixarSource,
  dataTableSource,
} from './data-table.source';
import { invoices, baseColumns, currency, statusVariant, type Invoice } from './data-table.fixtures';

const meta: Meta = {
  title: 'Components/Tables/DataTable/Compositions',
  component: DataTable,
  tags: ['tables'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
    // própria configuração de colunas logo abaixo.
    docs: { source: { transform: dataTableSource } },
  },
};

export default meta;
type Story = StoryObj;

/** Linhas de dado — a mensagem de "sem resultados" também é um `tr` do tbody. */
function datumLines(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>('tbody tr')].filter(
    (tr) => !tr.querySelector('.nds-data-table-empty'),
  );
}

const filterableColumns: DataTableColumn<Invoice>[] = [
  { accessorKey: 'id', header: 'Fatura', meta: { filter: { type: 'text' } } },
  { accessorKey: 'customer', header: 'Cliente', meta: { filter: { type: 'text' } } },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: {
      filter: { type: 'select', options: ['Pago', 'Pendente', 'Cancelado'] },
      badgeVariant: (v) => statusVariant[v as Invoice['status']] ?? 'default',
    },
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
    meta: {
      format: (v) => currency.format(Number(v)),
      cellClass: 'nds-font-medium nds-tabular-nums',
    },
  },
];

export const WithColumnFilters: Story = {
  args: {
    columns: filterableColumns as never,
    data: invoices,
    enableColumnFilters: true,
    enablePagination: false,
  },
  parameters: {
    covers: ['functional.item2', 'accessibility.item4', 'visual.item2'],
    docs: { source: { transform: columnDataTableFiltersSource } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const lines = () => datumLines(canvasElement);

    await step('A linha de filtros existe e cada célula dela tem nome', async () => {
      // Sem texto no `th`, a célula chega ao axe como cabeçalho vazio: o VALOR
      // de um input não entra no nome acessível do elemento que o contém, então
      // uma célula que só tem o campo é, para a árvore de acessibilidade, vazia.
      const filtersLine = canvasElement.querySelector<HTMLElement>(
        '.nds-data-table-filter-row',
      )!;
      const celulas = [...filtersLine.querySelectorAll('th')];
      await expect(celulas.length).toBe(filterableColumns.length);
      // A coluna Valor não tem filtro — e é justamente ela que precisa dizer
      // de qual coluna a célula vazia é.
      await expect(celulas[celulas.length - 1]).toHaveTextContent('Sem filtro para Valor');
    });

    await step('O select por coluna recorta pelo valor exato', async () => {
      const select = canvas.getByRole('combobox', { name: 'Filtrar Status' });
      await userEvent.selectOptions(select, 'Cancelado');
      await waitFor(() => expect(lines().length).toBe(2));
    });

    await step('O filtro de texto soma ao anterior, não o substitui', async () => {
      // functional.item2 — o valor esperado é 1, e não 2: se o segundo filtro
      // trocasse o primeiro, "Carla" sozinha devolveria a mesma linha e o teste
      // passaria sem provar nada. A prova é que "Ana" (que é Pago) some.
      const field = canvas.getByRole('textbox', { name: 'Filtrar Cliente' });
      await userEvent.clear(field);
      await userEvent.type(field, 'Carla');
      await waitFor(() => expect(lines().length).toBe(1));
      await expect(lines()[0]).toHaveTextContent('INV-003');

      await userEvent.clear(field);
      await userEvent.type(field, 'Ana');
      await waitFor(() => expect(lines().length).toBe(0));
      // visual.item2 — a story termina com os dois filtros preenchidos e o
      // estado vazio na tela, que é o que a captura do Chromatic guarda.
      await expect(canvasElement.querySelector('.nds-data-table-empty')).toHaveTextContent(
        'Sem resultados.',
      );
    });
  },
};

export const ResizableColumns: Story = {
  args: {
    columns: baseColumns as never,
    data: invoices,
    enableColumnResizing: true,
  },
  parameters: {
    covers: ['visual.item3'],
    docs: { source: { transform: dataTableColumnsRedimensionaveisSource } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const thumb = () => canvas.getByRole('separator', { name: 'Redimensionar coluna Cliente' });

    await step('A alça se anuncia como separador, com o nome da coluna', async () => {
      const el = thumb();
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
      const el = thumb();
      const header = el.closest('th') as HTMLElement;
      const neighbour = header.nextElementSibling as HTMLElement;
      const antes = parseFloat(header.style.width);
      const neighbourDeclarada = neighbour.style.width;
      const box = el.getBoundingClientRect();

      fireEvent.mouseDown(el, { clientX: box.left, clientY: box.top });
      fireEvent.mouseMove(document, { clientX: box.left + 80, clientY: box.top });
      fireEvent.mouseUp(document, { clientX: box.left + 80, clientY: box.top });

      await waitFor(async () => {
        await expect(parseFloat(header.style.width)).toBeGreaterThan(antes + 40);
      });
      await expect(neighbour.style.width).toBe(neighbourDeclarada);
    });
  },
};

export const ReorderableAndPinnable: Story = {
  args: {
    columns: baseColumns as never,
    data: invoices,
    enableColumnOrdering: true,
    enableColumnPinning: true,
  },
  parameters: {
    covers: ['functional.item6', 'visual.item3'],
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
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
      const firstCellBefore = canvasElement
        .querySelector<HTMLElement>('tbody tr td')!
        .textContent!.trim();

      const origem = cabecalhos()[0];
      const destination = cabecalhos()[1];
      await expect(origem).toHaveAttribute('draggable', 'true');

      fireEvent.dragStart(origem);
      fireEvent.dragOver(destination);
      fireEvent.drop(destination);

      await waitFor(async () => {
        await expect(rotulos()[0]).toBe(antes[1]);
      });
      await expect(rotulos()[1]).toBe(antes[0]);
      await expect(
        canvasElement.querySelector<HTMLElement>('tbody tr td')!.textContent!.trim(),
      ).not.toBe(firstCellBefore);
    });

    await step('Fixar uma coluna a gruda na borda durante o scroll horizontal', async () => {
      // visual.item3 — a story termina com a coluna fixada e as colunas
      // reordenadas, que é o par que o item documenta.
      const trigger = canvasElement.querySelector<HTMLElement>('.nds-data-table-columns-btn')!;
      await userEvent.click(trigger);
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

/**
 * O spy é de escopo de MÓDULO: criado dentro do wrapper ele seria inalcançável
 * pela play e deixaria a aba Actions vazia.
 */
const aoEditar = fn();

export const WithInlineEditing: Story = {
  render: () => ({ Component: DataTableEditStory, props: { onEdit: aoEditar } }),
  parameters: {
    covers: ['functional.item5', 'visual.item4'],
    docs: { source: { transform: dataTableEditInlineSource } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A célula editável é um botão com nome, não um texto solto', async () => {
      const button = canvas.getAllByRole('button', { name: 'Editar Cliente' })[0];
      await expect(button).toHaveClass('nds-data-table-edit-btn');
      await expect(button.closest('td')).toHaveClass('nds-data-table-td');
    });

    await step('Enter confirma, avisa quem consome e o valor novo chega à célula', async () => {
      // functional.item5 — a prova de que o evento carregou (rowIndex, columnId,
      // value) é a chamada registrada MAIS o texto da célula mudar: quem
      // atualiza o array é o consumidor, com os três campos do payload.
      aoEditar.mockClear();
      const button = canvas.getAllByRole('button', { name: 'Editar Cliente' })[0];
      const legacyValue = button.textContent!.trim();
      await userEvent.click(button);

      const field = await waitFor(() => canvas.getByRole('textbox', { name: 'Editar Cliente' }));
      await expect(field).toHaveFocus();

      await userEvent.clear(field);
      await userEvent.type(field, 'Ana Prado Filha{Enter}');

      await waitFor(async () => {
        await expect(
          canvas.getAllByRole('button', { name: 'Editar Cliente' })[0],
        ).toHaveTextContent('Ana Prado Filha');
      });
      await expect(aoEditar).toHaveBeenCalledWith(0, 'customer', 'Ana Prado Filha');
      await expect(legacyValue).not.toBe('Ana Prado Filha');
    });

    await step('Escape descarta o rascunho e não avisa ninguém', async () => {
      aoEditar.mockClear();
      const button = canvas.getAllByRole('button', { name: 'Editar Valor' })[0];
      const original = button.textContent!.trim();
      await userEvent.click(button);

      const field = await waitFor(() => canvas.getByRole('textbox', { name: 'Editar Valor' }));
      await userEvent.clear(field);
      await userEvent.type(field, '9999{Escape}');

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
      const button = canvas.getAllByRole('button', { name: 'Editar Cliente' })[1];
      await userEvent.click(button);
      await waitFor(async () => {
        await expect(canvasElement.querySelectorAll('.nds-data-table-edit-input').length).toBe(1);
      });
    });
  },
};
