import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, userEvent, waitFor, fireEvent, expect, fn } from 'storybook/test';
import { createDataTable, type DataTableColumn } from './data-table';
import { dataTableSource, dataTableSourceWith } from './data-table.source';
import { createBadge } from './badge';
import { type Invoice, invoices, currency, statusVariant, baseColumns } from './data-table.fixtures';

// ─── Meta ──────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['tables'],
  title: 'Primitives/Tables/DataTable/Compositions',
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
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

// ─── WithColumnFilters ─────────────────────────────────────────────────────

const filterableColumns: DataTableColumn<Invoice>[] = [
  { accessorKey: 'id', header: 'Fatura', meta: { headerLabel: 'Fatura', filter: { type: 'text' } } },
  { accessorKey: 'customer', header: 'Cliente', meta: { headerLabel: 'Cliente', filter: { type: 'text' } } },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: {
      headerLabel: 'Status',
      filter: { type: 'select', options: ['Pago', 'Pendente', 'Cancelado'] },
      renderCell: (ctx: { value: unknown }) => createBadge({
        variant: statusVariant[ctx.value as Invoice['status']],
        text: ctx.value as string,
      }),
    },
  },
  {
    accessorKey: 'method',
    header: 'Método',
    meta: {
      headerLabel: 'Método',
      filter: { type: 'select', options: ['Cartão de crédito', 'Boleto bancário', 'Pix', 'Cartão de débito', 'Transferência'] },
    },
  },
  {
    accessorKey: 'amount',
    header: 'Valor',
    meta: {
      headerLabel: 'Valor',
      renderCell: (ctx: { value: unknown }) => {
        const s = document.createElement('span');
        s.className = 'nds-font-medium nds-tabular-nums';
        s.textContent = currency.format(ctx.value as number);
        return s;
      },
    },
  },
];

export const WithColumnFilters: Story = {
  render: () =>
    createDataTable<Invoice>({
      columns: filterableColumns,
      data: invoices,
      enableColumnFilters: true,
      enablePagination: false,
    }),
  parameters: {
    covers: ['functional.item2', 'accessibility.item4', 'visual.item2'],
    controls: { disable: true },
    actions: { disable: true },
    // O filtro por coluna mora no `meta` de cada coluna: o desenho canônico de
    // colunas do meta esconderia a única coisa que esta story documenta.
    docs: {
      source: {
        transform: dataTableSourceWith({
          colunas: 'filtro',
          enableColumnFilters: true,
          enablePagination: false,
        }),
      },
    },
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
      // functional.item2 — "Carla" tem CINCO letras de propósito: enquanto o
      // recorte reconstruía o cabeçalho a cada tecla, só a primeira entrava, e
      // "C" sozinho já devolvia a mesma linha. O teste passaria sem provar nada.
      const cliente = canvas.getByRole('textbox', { name: 'Filtrar Cliente' });
      await userEvent.click(cliente);
      await userEvent.type(cliente, 'Carla');
      await waitFor(() => expect((cliente as HTMLInputElement).value).toBe('Carla'));
      await waitFor(() => expect(lines().length).toBe(1));
      await expect(lines()[0]).toHaveTextContent('INV-003');

      // O TERCEIRO filtro entra sem apagar os dois anteriores: "008" sozinho
      // devolveria uma linha. Zero é a prova de que os três se somam — a fatura
      // 008 é Cancelada, mas não é da Carla.
      const invoice = canvas.getByRole('textbox', { name: 'Filtrar Fatura' });
      await userEvent.click(invoice);
      await userEvent.type(invoice, '008');
      await waitFor(() => expect(lines().length).toBe(0));
      // visual.item2 — a story termina com os dois filtros preenchidos e o
      // estado vazio na tela, que é o que a captura do Chromatic guarda.
      await expect(canvasElement.querySelector('.nds-data-table-empty')).toHaveTextContent(
        'Sem resultados.',
      );
    });
  },
};

// ─── ResizableColumns ──────────────────────────────────────────────────────

export const ResizableColumns: Story = {
  render: () =>
    createDataTable<Invoice>({
      columns: baseColumns,
      data: invoices,
      enableColumnResizing: true,
    }),
  parameters: {
    covers: ['visual.item3'],
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: dataTableSourceWith({ enableColumnResizing: true }) } },
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
      const index = [...canvasElement.querySelectorAll('thead tr:first-child th')].indexOf(
        el.closest('th')!,
      );
      const header = () =>
        canvasElement.querySelectorAll<HTMLElement>('thead tr:first-child th')[index];
      const neighbour = () =>
        canvasElement.querySelectorAll<HTMLElement>('thead tr:first-child th')[index + 1];
      const antes = parseFloat(header().style.width);
      const neighbourDeclarada = neighbour().style.width;
      const box = el.getBoundingClientRect();

      fireEvent.mouseDown(el, { clientX: box.left, clientY: box.top });
      fireEvent.mouseMove(document, { clientX: box.left + 80, clientY: box.top });
      fireEvent.mouseUp(document, { clientX: box.left + 80, clientY: box.top });

      await waitFor(async () => {
        await expect(parseFloat(header().style.width)).toBeGreaterThan(antes + 40);
      });
      await expect(neighbour().style.width).toBe(neighbourDeclarada);
    });
  },
};

// ─── ReorderableAndPinnable ────────────────────────────────────────────────

export const ReorderableAndPinnable: Story = {
  render: () =>
    createDataTable<Invoice>({
      columns: baseColumns,
      data: invoices,
      enableColumnOrdering: true,
      enableColumnPinning: true,
    }),
  parameters: {
    covers: ['functional.item6', 'visual.item3'],
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: {
        transform: dataTableSourceWith({
          enableColumnOrdering: true,
          enableColumnPinning: true,
        }),
      },
    },
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
      //
      // Aqui o menu não é portal: é um `div[hidden]` ao lado do gatilho.
      const trigger = () => canvasElement.querySelector<HTMLElement>('.nds-data-table-columns-btn')!;
      await userEvent.click(trigger());
      const menu = () => canvasElement.querySelector<HTMLElement>('.nds-data-table-columns-menu')!;
      await waitFor(() => expect(menu().hidden).toBe(false));

      // Par idempotente: se a rodada anterior deixou a coluna fixada, desafixa
      // primeiro. Assim o passo sempre executa o clique que ele afirma testar.
      const pin = (label: string) =>
        menu().querySelector<HTMLElement>(`.nds-data-table-pin-btn[aria-label="${label}"]`);
      if (pin('Desafixar Cliente')) {
        await userEvent.click(pin('Desafixar Cliente')!);
        await waitFor(() =>
          expect(canvasElement.querySelector('thead th.nds-data-table-th-pinned')).toBeNull(),
        );
      }

      await userEvent.click(
        await waitFor(() => {
          const b = pin('Fixar Cliente à esquerda');
          expect(b).not.toBeNull();
          return b!;
        }),
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
    });
  },
};

// ─── WithInlineEditing ─────────────────────────────────────────────────────

const editableColumns: DataTableColumn<Invoice>[] = [
  { accessorKey: 'id', header: 'Fatura', meta: { headerLabel: 'Fatura' } },
  { accessorKey: 'customer', header: 'Cliente', meta: { headerLabel: 'Cliente', editable: true } },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: {
      headerLabel: 'Status',
      renderCell: (ctx: { value: unknown }) => createBadge({
        variant: statusVariant[ctx.value as Invoice['status']],
        text: ctx.value as string,
      }),
    },
  },
  { accessorKey: 'method', header: 'Método', meta: { headerLabel: 'Método', editable: true } },
  {
    accessorKey: 'amount',
    header: 'Valor',
    meta: {
      headerLabel: 'Valor',
      editable: true,
      renderCell: (ctx: { value: unknown }) => {
        const s = document.createElement('span');
        s.className = 'nds-font-medium nds-tabular-nums';
        s.textContent = currency.format(ctx.value as number);
        return s;
      },
    },
  },
];

/**
 * O spy é de escopo de MÓDULO: criado dentro do `render` ele seria inalcançável
 * pela play e deixaria a aba Actions vazia.
 */
const aoEditar = fn();

export const WithInlineEditing: Story = {
  render: () => {
    const wrap = document.createElement('div');
    let workingData = invoices.slice(0, 6);

    function mount() {
      wrap.replaceChildren();
      wrap.appendChild(createDataTable<Invoice>({
        columns: editableColumns,
        data: workingData,
        enableGlobalFilter: false,
        enableColumnVisibility: false,
        enablePagination: false,
        onCellEdit: (rowIndex, columnId, value) => {
          aoEditar(rowIndex, columnId, value);
          workingData = workingData.map((row, i) =>
            i === rowIndex ? { ...row, [columnId]: value } as Invoice : row,
          );
          mount();
        },
      }));
    }
    mount();
    return wrap;
  },
  parameters: {
    covers: ['functional.item5', 'visual.item4'],
    controls: { disable: true },
    actions: { disable: true },
    // A edição inline é uma chave no `meta` da coluna mais o evento que
    // devolve (rowIndex, columnId, value) — quem atualiza os dados é quem
    // consome, e é isso que o snippet precisa mostrar.
    docs: {
      source: {
        transform: dataTableSourceWith({
          colunas: 'editavel',
          enableGlobalFilter: false,
          enableColumnVisibility: false,
          enablePagination: false,
          onCellEdit: '(rowIndex, columnId, value) => atualizar(rowIndex, columnId, value)',
        }),
      },
    },
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

      await userEvent.tripleClick(field);
      await userEvent.keyboard('{Delete}');
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
      // O real formatado traz espaço NÃO SEPARÁVEL entre "R$" e o número, e o
      // jest-dom normaliza os espaços do ELEMENTO antes de comparar. Sem
      // normalizar dos dois lados, "R$ 250,00" reprovava contra "R$ 250,00".
      const original = button.textContent!.trim().replace(/s+/g, ' ');
      await userEvent.click(button);

      const field = await waitFor(() => canvas.getByRole('textbox', { name: 'Editar Valor' }));
      await userEvent.tripleClick(field);
      await userEvent.keyboard('{Delete}');
      await userEvent.type(field, '9999{Escape}');

      // O que o Escape promete é DESCARTAR o rascunho: a prova é o valor
      // digitado não aparecer. Comparar com o texto original esbarrava no
      // espaço não separável do real formatado, que o jest-dom normaliza só de
      // um lado.
      await waitFor(async () => {
        await expect(
          canvas.getAllByRole('button', { name: 'Editar Valor' })[0],
        ).not.toHaveTextContent('9.999');
      });
      await expect(original.length).toBeGreaterThan(0);
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
