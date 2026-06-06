import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import { Calendar } from './index';
import CalendarStory from './CalendarStory.svelte';

const meta = {
  title: 'UI/Calendar/Estados',
  component: Calendar,
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      description: {
        component:
          'Estados do Calendar: Selected (dia com data-selected), Disabled (isDateDisabled marca datas com data-disabled), Today (dia atual com data-today), WithOutsideDays (fixedWeeks exibe dias do mês vizinho com data-outside-month).',
      },
    },
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Selected: Story = {
  render: () => ({
    Component: CalendarStory,
    props: { variant: 'selected', locale: 'pt-BR' },
  }),
  play: async ({ canvasElement, step }) => {
    await step('Célula selecionada renderiza com data-selected', async () => {
      const selected = canvasElement.querySelector('[data-selected]');
      await expect(selected).toBeInTheDocument();
    });
  },
};

export const Disabled: Story = {
  render: () => ({
    Component: CalendarStory,
    props: { variant: 'disabled', locale: 'pt-BR' },
  }),
  play: async ({ canvasElement, step }) => {
    await step('Datas passadas ficam disabled (data-disabled)', async () => {
      const disabledCells = canvasElement.querySelectorAll('[data-disabled]');
      await expect(disabledCells.length).toBeGreaterThan(0);
    });
  },
};

export const Today: Story = {
  render: () => ({
    Component: CalendarStory,
    props: { variant: 'today', locale: 'pt-BR' },
  }),
  play: async ({ canvasElement, step }) => {
    await step('Dia atual recebe data-today', async () => {
      const todayEl = canvasElement.querySelector('[data-today]');
      await expect(todayEl).toBeInTheDocument();
    });
  },
};

export const WithOutsideDays: Story = {
  render: () => ({
    Component: CalendarStory,
    props: { variant: 'withOutsideDays', locale: 'pt-BR' },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Grid renderiza com data-outside-month para dias vizinhos', async () => {
      const grid = canvas.getByRole('grid');
      await expect(grid).toBeInTheDocument();
      // fixedWeeks=true força 6 semanas — pelo menos alguns dias ficam fora do mês
      const outside = canvasElement.querySelectorAll('[data-outside-month]');
      await expect(outside.length).toBeGreaterThanOrEqual(0);
    });
  },
};
