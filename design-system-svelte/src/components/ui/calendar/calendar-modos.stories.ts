import type { Meta, StoryObj } from '@storybook/svelte';
import { Calendar } from './index';
import CalendarStory from './CalendarStory.svelte';

const meta = {
  title: 'UI/Calendar/Modos',
  component: Calendar,
  parameters: {
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
};

export const Multiple: Story = {
  render: () => ({
    Component: CalendarStory,
    props: { variant: 'multiple', locale: 'pt-BR' },
  }),
};
