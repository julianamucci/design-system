import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import { Calendar } from './index';
import CalendarStory from './CalendarStory.svelte';
import CalendarDocs from '@/components/docs/CalendarDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Calendar',
  component: Calendar,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: {
      page: withAutoDocsTab(CalendarDocs),
      description: {
        component:
          'Calendar é um seletor visual de datas baseado em bits-ui. Aceita type="single" ou type="multiple", locale para rótulos traduzidos, captionLayout label/dropdown e datas desabilitadas via isDateDisabled. Na stack Svelte a API usa @internationalized/date (DateValue) em vez do Date nativo.',
      },
    },
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => ({
    Component: CalendarStory,
    props: { variant: 'single', locale: 'pt-BR' },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Grid semântico é renderizado (role="grid")', async () => {
      const grid = canvas.getByRole('grid');
      await expect(grid).toBeInTheDocument();
    });

    await step('Cabeçalhos dos dias da semana (role="columnheader")', async () => {
      const headers = canvas.getAllByRole('columnheader');
      await expect(headers.length).toBeGreaterThanOrEqual(7);
    });

    await step('Dia de hoje marcado com data-today', async () => {
      const todayCell = canvasElement.querySelector('[data-today]');
      await expect(todayCell).toBeInTheDocument();
    });

    await step('Botões de navegação anterior/próximo presentes', async () => {
      const prev = canvas.getByRole('button', { name: /previous/i });
      const next = canvas.getByRole('button', { name: /next/i });
      await expect(prev).toBeInTheDocument();
      await expect(next).toBeInTheDocument();
    });

    await step('Célula selecionada tem aria-selected="true"', async () => {
      const selected = canvasElement.querySelector('[data-selected]');
      await expect(selected).toBeInTheDocument();
    });
  },
};
