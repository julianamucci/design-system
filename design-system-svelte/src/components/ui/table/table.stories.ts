import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import { Table } from './index';
import TableStory from './TableStory.svelte';
import TableDocs from '@/components/docs/TableDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Table',
  component: Table,
  tags: ['autodocs', 'tables'],
  parameters: {
    docs: { page: withAutoDocsTab(TableDocs) },
  },
  argTypes: {
    caption: {
      control: 'text',
      description: 'Texto do TableCaption — descreve o propósito da tabela',
    },
    showFooter: {
      control: 'boolean',
      description: 'Exibe o TableFooter com total',
    },
  },
  args: {
    caption: 'Lista de faturas recentes',
    showFooter: false,
  },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    Component: TableStory,
    props: {
      caption: args.caption,
      showFooter: args.showFooter,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Elemento table está presente no DOM', async () => {
      const table = canvasElement.querySelector('table');
      await expect(table).toBeInTheDocument();
    });

    await step('thead está presente', async () => {
      const thead = canvasElement.querySelector('thead');
      await expect(thead).toBeInTheDocument();
    });

    await step('tbody está presente', async () => {
      const tbody = canvasElement.querySelector('tbody');
      await expect(tbody).toBeInTheDocument();
    });

    await step('TableHead tem scope="col"', async () => {
      const ths = canvasElement.querySelectorAll('th');
      for (const th of ths) {
        await expect(th).toHaveAttribute('scope', 'col');
      }
    });

    await step('TableCaption está presente', async () => {
      const caption = canvasElement.querySelector('caption');
      await expect(caption).toBeInTheDocument();
    });

    await step('Linhas de dados são renderizadas', async () => {
      await expect(canvas.getByText('#INV-001')).toBeVisible();
      await expect(canvas.getByText('#INV-005')).toBeVisible();
    });
  },
};
