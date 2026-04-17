import type { Meta, StoryObj } from '@storybook/svelte';
import { userEvent, within, expect } from 'storybook/test';
import TableStory from './TableStory.svelte';

const meta = {
  title: 'UI/Table/Estados',
  component: TableStory,
} satisfies Meta<typeof TableStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Hover: Story = {
  name: 'Hover (automático)',
  args: { scenario: 'hover' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Hover em linha do body aplica bg-muted/50', async () => {
      const firstRow = canvas.getAllByRole('row')[1];
      await userEvent.hover(firstRow);
      await expect(firstRow.className).toContain('hover:bg-muted/50');
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          '`TableRow` aplica `hover:bg-muted/50` automaticamente — sem prop. O efeito vale para linhas do `<tbody>` e do `<tfoot>`.',
      },
    },
  },
};

export const Selected: Story = {
  name: 'Selecionada (data-state)',
  args: { scenario: 'selected' },
  play: async ({ canvasElement, step }) => {
    await step('Linha com data-state=selected aplica bg-muted persistente', async () => {
      const selected = canvasElement.querySelector('tr[data-state="selected"]');
      await expect(selected).toBeInTheDocument();
      await expect(selected?.className).toContain('data-[state=selected]:bg-muted');
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Aplique `data-state="selected"` na `<tr>` para marcar uma linha como selecionada. O fundo `bg-muted` persiste independente de hover.',
      },
    },
  },
};

export const Empty: Story = {
  name: 'Vazio',
  args: { scenario: 'empty' },
  play: async ({ canvasElement, step }) => {
    await step('Renderiza linha única com colspan cobrindo todas as colunas', async () => {
      const cells = canvasElement.querySelectorAll('tbody td');
      await expect(cells.length).toBe(1);
      await expect(cells[0].getAttribute('colspan')).toBe('3');
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Estado vazio: linha única com `colspan` igual ao número de colunas da tabela. O texto deve descrever o vazio e sugerir próxima ação — nunca apenas "Vazio".',
      },
    },
  },
};

export const Scroll: Story = {
  name: 'Scroll horizontal (automático)',
  args: { scenario: 'scroll' },
  play: async ({ canvasElement, step }) => {
    await step('Wrapper aplica overflow-x-auto quando tabela excede a largura', async () => {
      const wrapper = canvasElement.querySelector('div[data-slot="table-container"]');
      await expect(wrapper).toBeInTheDocument();
      await expect(wrapper?.className).toContain('overflow-x-auto');
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'O wrapper de `Table` aplica `overflow-x-auto`, fazendo a barra de rolagem horizontal aparecer automaticamente quando a tabela excede a largura do container.',
      },
    },
  },
};
