import type { Meta, StoryObj } from '@storybook/svelte';
import { userEvent, within, expect } from 'storybook/test';
import TableStory from './TableStory.svelte';
import TableDocs from '@/components/docs/TableDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Table',
  component: TableStory,
  tags: ['autodocs'],
  parameters: {
    docs: { page: withAutoDocsTab(TableDocs) },
  },
} satisfies Meta<typeof TableStory>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Tabela completa com `<caption>`, `<thead>`, `<tbody>` e `<tfoot>`.
 * Cobre a estrutura semântica recomendada para dados tabulares.
 *
 * @summary Demonstração interativa do componente Table.
 */
export const Playground: Story = {
  args: { scenario: 'playground' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Renderiza elemento <table>', async () => {
      const table = canvas.getByRole('table');
      await expect(table).toBeInTheDocument();
    });

    await step('Renderiza <caption> visível abaixo da tabela', async () => {
      const caption = canvasElement.querySelector('caption');
      await expect(caption).toBeInTheDocument();
      await expect(caption).toHaveTextContent('Lista das faturas recentes.');
    });

    await step('Todos os <th> usam scope=col', async () => {
      const headers = canvasElement.querySelectorAll('th');
      await expect(headers.length).toBeGreaterThan(0);
      headers.forEach((th) => {
        expect(th.getAttribute('scope')).toBe('col');
      });
    });

    await step('Corpo da tabela tem 5 linhas de dados', async () => {
      const bodyRows = canvasElement.querySelectorAll('tbody tr');
      await expect(bodyRows.length).toBe(5);
    });

    await step('Footer renderiza célula com colspan=3', async () => {
      const footerCell = canvasElement.querySelector('tfoot td');
      await expect(footerCell).toBeInTheDocument();
      await expect(footerCell?.getAttribute('colspan')).toBe('3');
    });

    await step('Hover em linha aplica bg-muted/50', async () => {
      const firstRow = canvasElement.querySelectorAll('tbody tr')[0];
      await userEvent.hover(firstRow);
      await expect(firstRow.className).toContain('hover:bg-muted/50');
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Cobre os critérios de estrutura semântica: <caption> presente, <th> com scope, body e footer com colspan, hover automático em linhas. Veja a aba **Interactions** para acompanhar a execução.',
      },
    },
  },
};
