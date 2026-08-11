import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { NdsDataTable } from './data-table';
import {
  COLUNAS_COM_FILTRO,
  FATURAS_DT,
  NdsDataTableDemo,
  ROTULOS_DT,
} from './data-table.fixtures';
import { esperarPortal, esperarPortalSumir, REGRA_GUARDA_DE_FOCO } from '@/lib/wait-for-portal';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'UI/DataTable/Variants',
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
    covers: ['functional.item2', 'visual.item2'],
    docs: {
      description: {
        story:
          'Segunda linha no cabeçalho, com input ou select conforme o tipo declarado na coluna. Os filtros se somam entre si e ao filtro global.',
      },
    },
  },
  render: () => ({
    props: { colunas: COLUNAS_COM_FILTRO, faturas: FATURAS_DT, rotulos: ROTULOS_DT },
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
    const linhas = () =>
      [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')].filter(
        (tr) => !tr.querySelector('.nds-data-table-empty'),
      );

    await step('A linha de filtros existe e cada célula dela tem nome', async () => {
      // Sem texto no `th`, a célula chega ao axe como cabeçalho vazio: o VALOR
      // de um input não entra no nome acessível do elemento que o contém, então
      // uma célula que só tem o campo é, para a árvore de acessibilidade, vazia.
      const linhaDeFiltros = canvasElement.querySelector<HTMLElement>(
        '.nds-data-table-filter-row',
      )!;
      const celulas = [...linhaDeFiltros.querySelectorAll('th')];
      await expect(celulas.length).toBe(COLUNAS_COM_FILTRO.length);
      for (const celula of celulas) {
        await expect(celula.querySelector('.nds-sr-only')!.textContent!.trim().length)
          .toBeGreaterThan(0);
      }
    });

    await step('O select por coluna recorta pelo valor exato', async () => {
      const select = canvas.getByRole('combobox', { name: 'Filtrar Status' });
      await userEvent.selectOptions(select, 'Cancelado');
      await waitFor(async () => {
        await expect(linhas().length).toBe(3);
      });
    });

    await step('O filtro de texto soma ao anterior, não o substitui', async () => {
      // functional.item2 — o valor esperado é 1, e não 3: se o segundo filtro
      // trocasse o primeiro, "Carla" sozinha devolveria a mesma linha e o teste
      // passaria sem provar nada. A prova é que "Ana" (que é Pago) some.
      const campo = canvas.getByRole('textbox', { name: 'Filtrar Cliente' });
      await userEvent.type(campo, 'Carla');
      await waitFor(async () => {
        await expect(linhas().length).toBe(1);
      });
      await expect(linhas()[0]).toHaveTextContent('#INV-003');

      await userEvent.clear(campo);
      await userEvent.type(campo, 'Ana');
      await waitFor(async () => {
        await expect(linhas().length).toBe(0);
      });
      // visual.item2 — a story termina com os dois filtros preenchidos e o
      // estado vazio na tela, que é o que a captura do Chromatic guarda.
      await expect(canvasElement.querySelector('.nds-data-table-empty')).toHaveTextContent(
        'Sem resultados.',
      );
    });
  },
};

// ─── Menu de colunas ──────────────────────────────────────────────────────────

export const WithColumnVisibility: Story = {
  parameters: {
    a11y: { config: { rules: [REGRA_GUARDA_DE_FOCO] } },
    docs: {
      description: {
        story:
          'O menu da toolbar liga e desliga colunas. Esconder uma coluna é decisão de leitura: a busca livre continua casando nela.',
      },
    },
  },
  render: () => ({
    props: { colunas: COLUNAS_COM_FILTRO, faturas: FATURAS_DT, rotulos: ROTULOS_DT },
    template: `
      <div
        ndsDataTable
        caption="Faturas recentes"
        [columns]="colunas"
        [data]="faturas"
        [labels]="rotulos"
        [pageSize]="5"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const cabecalhos = () => [
      ...canvasElement.querySelectorAll<HTMLElement>('thead tr:first-child th'),
    ];

    await step('O gatilho é achável pela classe, não pelo data-slot', async () => {
      // Duas diretivas no mesmo botão (gatilho do menu e visual do botão) ligam
      // `data-slot` e uma sobrescreve a outra sem ordem garantida. A classe é o
      // que sobra estável — armadilha 11 do CLAUDE.md deste stack.
      const gatilho = canvasElement.querySelector<HTMLElement>('.nds-data-table-columns-btn')!;
      await expect(gatilho.tagName).toBe('BUTTON');
      await expect(gatilho).toHaveAttribute('aria-haspopup', 'menu');
      await expect(cabecalhos().length).toBe(COLUNAS_COM_FILTRO.length);
    });

    await step('Desmarcar uma coluna a tira da grade inteira', async () => {
      const gatilho = canvasElement.querySelector<HTMLElement>('.nds-data-table-columns-btn')!;
      await userEvent.click(gatilho);
      await esperarPortal('menu');

      const menu = within(document.body);
      const item = menu.getByRole('menuitemcheckbox', { name: 'Método' });
      await expect(item).toHaveAttribute('aria-checked', 'true');
      await userEvent.click(item);

      await waitFor(async () => {
        await expect(cabecalhos().length).toBe(COLUNAS_COM_FILTRO.length - 1);
      });
      await expect(canvas.queryByText('Método')).toBeNull();
    });

    await step('A busca continua casando na coluna escondida', async () => {
      // Esconder é decisão de LEITURA. Se o filtro global deixasse de olhar a
      // coluna, esconder mudaria o resultado da busca — e ninguém veria por quê.
      await userEvent.keyboard('{Escape}');
      await esperarPortalSumir('menu');

      const busca = canvas.getByRole('searchbox');
      await userEvent.type(busca, 'Transferência');
      await waitFor(async () => {
        await expect(canvasElement.querySelectorAll('tbody tr').length).toBe(2);
      });
    });
  },
};

// ─── Edição inline ────────────────────────────────────────────────────────────

export const WithInlineEditing: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item4'],
    docs: {
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
      const botao = canvas.getAllByRole('button', { name: 'Editar Cliente' })[0];
      await expect(botao).toHaveClass('nds-data-table-edit-btn');
      await expect(botao).toHaveTextContent('Ana Prado');
    });

    await step('Enter confirma e o valor novo chega à célula', async () => {
      // functional.item5 — a prova de que o evento carregou (rowIndex, columnId,
      // value) é o texto da célula mudar: quem atualiza o array é o consumidor,
      // com os três campos do payload.
      const botao = canvas.getAllByRole('button', { name: 'Editar Cliente' })[0];
      await userEvent.click(botao);

      const campo = await waitFor(() =>
        canvas.getByRole('textbox', { name: 'Editar Cliente' }),
      );
      await expect(campo).toHaveFocus();

      await userEvent.clear(campo);
      await userEvent.type(campo, 'Ana Prado Filha{Enter}');

      await waitFor(async () => {
        await expect(canvas.getAllByRole('button', { name: 'Editar Cliente' })[0])
          .toHaveTextContent('Ana Prado Filha');
      });
    });

    await step('Escape descarta o rascunho e devolve o valor original', async () => {
      const botao = canvas.getAllByRole('button', { name: 'Editar Valor' })[0];
      await userEvent.click(botao);

      const campo = await waitFor(() => canvas.getByRole('textbox', { name: 'Editar Valor' }));
      await userEvent.clear(campo);
      await userEvent.type(campo, '9999{Escape}');

      await waitFor(async () => {
        await expect(canvas.getAllByRole('button', { name: 'Editar Valor' })[0])
          .not.toHaveTextContent('9.999');
      });
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
