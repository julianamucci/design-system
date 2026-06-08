import type { Meta, StoryObj } from '@storybook/svelte';

import { expect, waitFor } from 'storybook/test';
import { Breadcrumb } from './index';
import BreadcrumbStory from './BreadcrumbStory.svelte';

const meta = {
  title: 'UI/Breadcrumb/Composicoes',
  component: Breadcrumb,
  tags: ['navigation'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      description: {
        component:
          'Configuracoes disponíveis do Breadcrumb: padrão com ChevronRight, com ellipsis para níveis longos, separador customizado (Slash) e composição responsiva com DropdownMenu.',
      },
    },
  },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    Component: BreadcrumbStory,
    props: { variant: 'default' },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const WithEllipsis: Story = {
  render: () => ({
    Component: BreadcrumbStory,
    props: { variant: 'withEllipsis' },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const CustomSeparator: Story = {
  render: () => ({
    Component: BreadcrumbStory,
    props: { variant: 'customSeparator' },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const Responsive: Story = {
  render: () => ({
    Component: BreadcrumbStory,
    props: { variant: 'responsive' },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};
