import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { NdsDataTable } from './data-table';
import { COLUNAS_FATURAS, FATURAS_DT, ROTULOS_DT } from './data-table.fixtures';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'UI/DataTable/States',
  tags: ['tables'],
  decorators: [moduleMetadata({ imports: [NdsDataTable] })],
  parameters: {
    layout: 'padded',
    // Sem argTypes: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Os três estados que a tabela atravessa em uso normal: sem resultado, ordenada e com linhas marcadas.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const SEM_FATURAS: typeof FATURAS_DT = [];

// ─── Vazio ────────────────────────────────────────────────────────────────────

export const NoResults: Story = {
  parameters: {
    covers: ['visual.item6'],
    docs: {
      description: {
        story:
          'Sem linhas, uma célula única cobrindo a largura da tabela. A toolbar continua na tela: é por ela que se limpa o recorte que esvaziou o resultado.',
      },
    },
  },
  render: () => ({
    props: { colunas: COLUNAS_FATURAS, faturas: SEM_FATURAS, rotulos: ROTULOS_DT },
    template: `
      <div
        ndsDataTable
        caption="Faturas recentes"
        [columns]="colunas"
        [data]="faturas"
        [labels]="rotulos"
        [enableRowSelection]="true"
        emptyMessage="Nenhuma fatura encontrada."
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A mensagem ocupa a largura inteira da tabela', async () => {
      // visual.item6 — sem o colspan a mensagem cairia sob a primeira coluna e
      // as outras cinco ficariam vazias, como se faltassem dados.
      const celula = canvasElement.querySelector<HTMLTableCellElement>('.nds-data-table-empty')!;
      // Seis: as cinco colunas mais a de seleção. Derivado, nunca escrito à mão.
      await expect(celula).toHaveAttribute('colspan', String(COLUNAS_FATURAS.length + 1));
      await expect(celula).toHaveTextContent('Nenhuma fatura encontrada.');
      await expect(canvasElement.querySelectorAll('tbody tr').length).toBe(1);
    });

    await step('A estrutura e a toolbar sobrevivem ao vazio', async () => {
      // Estado vazio não é motivo para desmontar a grade: quem usa leitor de
      // tela precisa saber que colunas voltarão quando houver dados — e quem
      // esvaziou o resultado com um filtro precisa do campo para desfazer.
      await expect(canvas.getByRole('table', { name: /faturas recentes/i })).toBeTruthy();
      await expect(canvasElement.querySelectorAll('thead tr:first-child th').length).toBe(
        COLUNAS_FATURAS.length + 1,
      );
      await expect(canvas.getByRole('searchbox')).toBeTruthy();
    });

    await step('Sem linha nenhuma, o cabeçalho de seleção não fica marcado', async () => {
      // "Todas selecionadas" com zero linhas seria verdade vazia — e o checkbox
      // nasceria marcado numa tabela sem nada para marcar.
      const caixaDeTudo = canvas.getByRole('checkbox', { name: 'Selecionar todas as faturas' });
      await expect(caixaDeTudo).toHaveAttribute('aria-checked', 'false');
    });
  },
};

// ─── Ordenado ─────────────────────────────────────────────────────────────────

export const Sorted: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A coluna ordenada carrega o `aria-sort` na célula de cabeçalho e a seta na direção aplicada. A ordenação usa o valor bruto, não o texto formatado.',
      },
    },
  },
  render: () => ({
    props: { colunas: COLUNAS_FATURAS, faturas: FATURAS_DT, rotulos: ROTULOS_DT },
    template: `
      <div
        ndsDataTable
        caption="Faturas recentes"
        [columns]="colunas"
        [data]="faturas"
        [labels]="rotulos"
        [enableGlobalFilter]="false"
        [enablePagination]="false"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Só a coluna ordenada anuncia direção', async () => {
      const botao = canvas.getByRole('button', { name: 'Ordenar por Cliente' });
      await userEvent.click(botao);

      const ordenada = botao.closest('th')!;
      await expect(ordenada).toHaveAttribute('aria-sort', 'ascending');

      const outra = canvas.getByRole('button', { name: 'Ordenar por Fatura' }).closest('th')!;
      await expect(outra).toHaveAttribute('aria-sort', 'none');
    });

    await step('A ordem do dinheiro é numérica, não alfabética', async () => {
      // "R$ 50,00" depois de "R$ 450,00" é o defeito clássico de tabela de
      // valor: a coluna guarda número e só o texto é formatado.
      const botao = canvas.getByRole('button', { name: 'Ordenar por Valor' });
      await userEvent.click(botao);

      await waitFor(async () => {
        const valores = [
          ...canvasElement.querySelectorAll<HTMLElement>('tbody tr td:last-child'),
        ].map((td) => td.textContent!.trim());
        await expect(valores[0]).toContain('40,00');
        await expect(valores[valores.length - 1]).toContain('990,00');
      });
    });
  },
};

// ─── Selecionado ──────────────────────────────────────────────────────────────

export const SelectedRows: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A linha marcada recebe `data-state="selected"` e fundo destacado. A contagem sai por região viva: cor sozinha não chega a quem não enxerga.',
      },
    },
  },
  render: () => ({
    props: { colunas: COLUNAS_FATURAS, faturas: FATURAS_DT, rotulos: ROTULOS_DT },
    template: `
      <div
        ndsDataTable
        caption="Faturas recentes"
        [columns]="colunas"
        [data]="faturas"
        [labels]="rotulos"
        [enableRowSelection]="true"
        [pageSize]="5"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const linhas = () => [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];

    await step('Marcar duas linhas destaca só elas', async () => {
      const primeira = linhas()[0].querySelector<HTMLElement>('button[role="checkbox"]')!;
      await userEvent.click(primeira);
      const terceira = linhas()[2].querySelector<HTMLElement>('button[role="checkbox"]')!;
      await userEvent.click(terceira);

      await expect(linhas()[0]).toHaveAttribute('data-state', 'selected');
      await expect(linhas()[2]).toHaveAttribute('data-state', 'selected');
      await expect(linhas()[1].hasAttribute('data-state')).toBe(false);
      await expect(getComputedStyle(linhas()[0]).backgroundColor).not.toBe(
        getComputedStyle(linhas()[1]).backgroundColor,
      );
    });

    await step('A contagem é anunciada e conta o conjunto, não a página', async () => {
      const regiao = canvasElement.querySelector<HTMLElement>('[role="status"]')!;
      await expect(regiao).toHaveClass('nds-sr-only');
      await expect(regiao).toHaveTextContent('2 de 12 linha(s) selecionada(s).');
    });

    await step('O cabeçalho fica em estado misto enquanto a página não está inteira', async () => {
      const caixaDeTudo = canvas.getByRole('checkbox', { name: 'Selecionar todas as faturas' });
      await expect(caixaDeTudo).toHaveAttribute('aria-checked', 'mixed');
    });
  },
};
