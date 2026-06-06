import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import { Table } from './index';
import TableEstadoEmpty from './TableEstadoEmpty.svelte';
import TableEstadoLinhaSelecionada from './TableEstadoLinhaSelecionada.svelte';
import TableEstadoCarregando from './TableEstadoCarregando.svelte';

const meta = {
  title: 'UI/Table/Estados',
  component: Table,
  tags: ['tables'],
  parameters: {
    controls: { disable: true },
  },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  render: () => ({
    Component: TableEstadoEmpty,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Mensagem de empty state visível', async () => {
      await expect(canvas.getByText('Nenhuma fatura encontrada.')).toBeVisible();
    });

    await step('tbody presente no DOM', async () => {
      const tbody = canvasElement.querySelector('tbody');
      await expect(tbody).toBeInTheDocument();
    });

    await step('Célula com colSpan cobre todas as colunas', async () => {
      const td = canvasElement.querySelector('tbody td');
      await expect(td).toHaveAttribute('colspan', '4');
    });
  },
};

export const LinhaSelecionada: Story = {
  render: () => ({
    Component: TableEstadoLinhaSelecionada,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    await step('TableRow com data-state="selected" presente', async () => {
      const selectedRow = canvasElement.querySelector('[data-state="selected"]');
      await expect(selectedRow).toBeInTheDocument();
    });

    await step('Apenas uma linha está selecionada', async () => {
      const selectedRows = canvasElement.querySelectorAll('[data-state="selected"]');
      await expect(selectedRows).toHaveLength(1);
    });
  },
};

export const Carregando: Story = {
  render: () => ({
    Component: TableEstadoCarregando,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    await step('Skeletons estão presentes no tbody', async () => {
      const tbody = canvasElement.querySelector('tbody');
      await expect(tbody).toBeInTheDocument();
      const skeletons = tbody!.querySelectorAll('[data-slot="skeleton"]');
      await expect(skeletons.length).toBeGreaterThan(0);
    });

    await step('thead permanece visível durante carregamento', async () => {
      const thead = canvasElement.querySelector('thead');
      await expect(thead).toBeInTheDocument();
    });
  },
};
