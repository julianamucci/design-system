import type { Meta, StoryObj } from '@storybook/svelte';

import { expect, waitFor } from 'storybook/test';
import { Calendar } from './index';
import CalendarStory from './CalendarStory.svelte';

const meta = {
  title: 'UI/Calendar/Layouts',
  component: Calendar,
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      description: {
        component:
          'Variações de layout do Calendar: CaptionLabel exibe o mês como texto fixo; CaptionDropdown transforma mês/ano em <select> usando calendar-month-select e calendar-year-select; TwoMonths exibe dois meses lado a lado via numberOfMonths={2}. A stack Svelte (bits-ui) não expõe showWeekNumber nativo.',
      },
    },
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CaptionLabel: Story = {
  render: () => ({
    Component: CalendarStory,
    props: { variant: 'captionLabel', locale: 'pt-BR' },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const CaptionDropdown: Story = {
  render: () => ({
    Component: CalendarStory,
    props: { variant: 'captionDropdown', locale: 'pt-BR' },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const TwoMonths: Story = {
  render: () => ({
    Component: CalendarStory,
    props: { variant: 'twoMonths', locale: 'pt-BR' },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};
