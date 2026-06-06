import type { Meta, StoryObj } from '@storybook/svelte';

import { expect, waitFor } from 'storybook/test';
import { Calendar } from './index';
import CalendarStory from './CalendarStory.svelte';

const meta = {
  title: 'UI/Calendar/Modos',
  component: Calendar,
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      description: {
        component:
          'Modos de seleção do Calendar: Single (uma data), Multiple (várias datas independentes). Em bits-ui o tipo é "single" ou "multiple" via prop `type`; não existe tipo "range" nativo nessa stack (ver nota em Layouts).',
      },
    },
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {
  render: () => ({
    Component: CalendarStory,
    props: { variant: 'single', locale: 'pt-BR' },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const Multiple: Story = {
  render: () => ({
    Component: CalendarStory,
    props: { variant: 'multiple', locale: 'pt-BR' },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const RangeFallback: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'bits-ui não expõe RangeCalendar nativo. Para seleção de intervalo, use dois Calendars single lado a lado com estado compartilhado, ou consulte a stack React/Vue que implementa range nativamente.',
      },
    },
  },
  render: () => ({
    Component: CalendarStory,
    props: { variant: 'multiple', locale: 'pt-BR' },
  }),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};
