import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, within } from 'storybook/test';
import { NdsDataTable } from './data-table';
import { COLUMNS_INVOICES, INVOICES_DT, LABELS_DT } from './data-table.fixtures';
import {
  dataTableNoResultsSource,
} from './data-table.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'Components/Tables/DataTable/States',
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

const NO_INVOICES: typeof INVOICES_DT = [];

// ─── Vazio ────────────────────────────────────────────────────────────────────

export const NoResults: Story = {
  parameters: {
    covers: ['visual.item6'],
    docs: {
      // Sem transform, o painel publicaria o template da story — com a fixture
      // importada e o objeto de props que o renderer do Angular monta. O painel
      // é a única parte da página feita para ser COPIADA.
      source: { transform: dataTableNoResultsSource },
      description: {
        story:
          'Sem linhas, uma célula única cobrindo a largura da tabela. A toolbar continua na tela: é por ela que se limpa o recorte que esvaziou o resultado.',
      },
    },
  },
  render: () => ({
    props: { colunas: COLUMNS_INVOICES, faturas: NO_INVOICES, rotulos: LABELS_DT },
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
      await expect(celula).toHaveAttribute('colspan', String(COLUMNS_INVOICES.length + 1));
      await expect(celula).toHaveTextContent('Nenhuma fatura encontrada.');
      await expect(canvasElement.querySelectorAll('tbody tr').length).toBe(1);
    });

    await step('A estrutura e a toolbar sobrevivem ao vazio', async () => {
      // Estado vazio não é motivo para desmontar a grade: quem usa leitor de
      // tela precisa saber que colunas voltarão quando houver dados — e quem
      // esvaziou o resultado com um filtro precisa do campo para desfazer.
      await expect(canvas.getByRole('table', { name: /faturas recentes/i })).toBeTruthy();
      await expect(canvasElement.querySelectorAll('thead tr:first-child th').length).toBe(
        COLUMNS_INVOICES.length + 1,
      );
      await expect(canvas.getByRole('searchbox')).toBeTruthy();
    });

    await step('Sem linha nenhuma, o cabeçalho de seleção não fica marcado', async () => {
      // "Todas selecionadas" com zero linhas seria verdade vazia — e o checkbox
      // nasceria marcado numa tabela sem nada para marcar.
      const allBox = canvas.getByRole('checkbox', { name: 'Selecionar todas as faturas' });
      await expect(allBox).toHaveAttribute('aria-checked', 'false');
    });
  },
};
