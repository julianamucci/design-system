import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { NdsDataTable } from './data-table';
import {
  COLUMNS_WITH_FILTER,
  INVOICES_DT,
  NdsDataTableDemo,
  LABELS_DT,
} from './data-table.fixtures';
import {
  dataTableColumnFiltersSource,
  dataTableInlineEditingSource,
} from './data-table.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'Components/Tables/DataTable/Compositions',
  tags: ['tables'],
  decorators: [moduleMetadata({ imports: [NdsDataTable, NdsDataTableDemo] })],
  parameters: {
    layout: 'padded',
    // Sem argTypes: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Cada recurso do DataTable é uma flag independente. Aqui estão os três que mudam o cabeçalho e a célula: filtro por coluna, menu de visibilidade e edição inline.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Filtros por coluna ───────────────────────────────────────────────────────

export const WithColumnFilters: Story = {
  parameters: {
    // `accessibility.item4` fala em "estados padrão, filtrado e selecionado", e
    // o axe roda no DOM FINAL de cada story. O Playground cobria padrão e
    // selecionado; o estado filtrado só existe ao fim desta — declarar o item
    // só lá era cobertura parcial passando por completa.
    covers: ['functional.item2', 'accessibility.item4', 'visual.item2'],
    docs: {
      // Sem `transform`, o painel publicaria o template da story — com a
      // fixture importada e o objeto de `props` que o renderer monta. O painel
      // é a única parte da página feita para ser COPIADA.
      source: { transform: dataTableColumnFiltersSource },
      description: {
        story:
          'Segunda linha no cabeçalho, com input ou select conforme o tipo declarado na coluna. Os filtros se somam entre si e ao filtro global.',
      },
    },
  },
  render: () => ({
    props: { colunas: COLUMNS_WITH_FILTER, faturas: INVOICES_DT, rotulos: LABELS_DT },
    template: `
      <div
        ndsDataTable
        caption="Faturas recentes"
        [columns]="colunas"
        [data]="faturas"
        [labels]="rotulos"
        [enableColumnFilters]="true"
        [enablePagination]="false"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    // A linha de "sem resultados" também é um `tr` do tbody. Contá-la como dado
    // faria "zero linhas" e "uma linha" darem o mesmo número.
    const lines = () =>
      [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')].filter(
        (tr) => !tr.querySelector('.nds-data-table-empty'),
      );

    await step('A linha de filtros existe e cada célula dela tem nome', async () => {
      // Sem texto no `th`, a célula chega ao axe como cabeçalho vazio: o VALOR
      // de um input não entra no nome acessível do elemento que o contém, então
      // uma célula que só tem o campo é, para a árvore de acessibilidade, vazia.
      const filtersLine = canvasElement.querySelector<HTMLElement>(
        '.nds-data-table-filter-row',
      )!;
      const celulas = [...filtersLine.querySelectorAll('th')];
      await expect(celulas.length).toBe(COLUMNS_WITH_FILTER.length);
      for (const celula of celulas) {
        await expect(celula.querySelector('.nds-sr-only')!.textContent!.trim().length)
          .toBeGreaterThan(0);
      }
    });

    await step('O select por coluna recorta pelo valor exato', async () => {
      const select = canvas.getByRole('combobox', { name: 'Filtrar Status' });
      await userEvent.selectOptions(select, 'Cancelado');
      await waitFor(async () => {
        await expect(lines().length).toBe(3);
      });
    });

    await step('O filtro de texto soma ao anterior, não o substitui', async () => {
      // functional.item2 — o valor esperado é 1, e não 3: se o segundo filtro
      // trocasse o primeiro, "Carla" sozinha devolveria a mesma linha e o teste
      // passaria sem provar nada. A prova é que "Ana" (que é Pago) some.
      const field = canvas.getByRole('textbox', { name: 'Filtrar Cliente' });
      await userEvent.type(field, 'Carla');
      await waitFor(async () => {
        await expect(lines().length).toBe(1);
      });
      await expect(lines()[0]).toHaveTextContent('#INV-003');

      await userEvent.clear(field);
      await userEvent.type(field, 'Ana');
      await waitFor(async () => {
        await expect(lines().length).toBe(0);
      });
      // visual.item2 — a story termina com os dois filtros preenchidos e o
      // estado vazio na tela, que é o que a captura do Chromatic guarda.
      await expect(canvasElement.querySelector('.nds-data-table-empty')).toHaveTextContent(
        'Sem resultados.',
      );
    });
  },
};

// ─── Edição inline ────────────────────────────────────────────────────────────

export const WithInlineEditing: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item4'],
    docs: {
      // O preview usa `<nds-data-table-demo>`, que é ANDAIME: ele existe para a
      // story ter onde guardar o array. O snippet publica a classe de verdade,
      // com o sinal e o método que aplicam a edição.
      source: { transform: dataTableInlineEditingSource },
      description: {
        story:
          'Colunas marcadas como editáveis viram input ao clique. O componente não guarda os dados: ele avisa a edição e quem consome atualiza o array.',
      },
    },
  },
  render: () => ({
    template: `<nds-data-table-demo [enablePagination]="false" [enableGlobalFilter]="false" />`,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A célula editável é um botão com nome, não um texto solto', async () => {
      const button = canvas.getAllByRole('button', { name: 'Editar Cliente' })[0];
      await expect(button).toHaveClass('nds-data-table-edit-btn');
      await expect(button).toHaveTextContent('Ana Prado');
    });

    await step('Enter confirma e o valor novo chega à célula', async () => {
      // functional.item5 — a prova de que o evento carregou (rowIndex, columnId,
      // value) é o texto da célula mudar: quem atualiza o array é o consumidor,
      // com os três campos do payload.
      const button = canvas.getAllByRole('button', { name: 'Editar Cliente' })[0];
      await userEvent.click(button);

      const field = await waitFor(() =>
        canvas.getByRole('textbox', { name: 'Editar Cliente' }),
      );
      await expect(field).toHaveFocus();

      await userEvent.clear(field);
      await userEvent.type(field, 'Ana Prado Filha{Enter}');

      await waitFor(async () => {
        await expect(canvas.getAllByRole('button', { name: 'Editar Cliente' })[0])
          .toHaveTextContent('Ana Prado Filha');
      });
    });

    await step('Escape descarta o rascunho e devolve o valor original', async () => {
      const button = canvas.getAllByRole('button', { name: 'Editar Valor' })[0];
      await userEvent.click(button);

      const field = await waitFor(() => canvas.getByRole('textbox', { name: 'Editar Valor' }));
      await userEvent.clear(field);
      await userEvent.type(field, '9999{Escape}');

      await waitFor(async () => {
        await expect(canvas.getAllByRole('button', { name: 'Editar Valor' })[0])
          .not.toHaveTextContent('9.999');
      });
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
