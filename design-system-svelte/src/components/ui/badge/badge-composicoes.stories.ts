import type { Meta, StoryObj } from '@storybook/svelte';

import { expect, waitFor } from 'storybook/test';
import { Badge } from './index';
import BadgeStory from './BadgeStory.svelte';

const meta = {
  title: 'UI/Badge/Composicoes',
  component: Badge,
  tags: ['feedback'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Composicoes do Badge: com ícone, como link, envolvido em botão clicável e como contador numérico.',
      },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithIcon: Story = {
  render: () => ({
    Component: BadgeStory,
    props: { variant: 'default', label: 'Ativo', icon: 'check' },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const AsLink: Story = {
  render: () => ({
    Component: BadgeStory,
    props: {
      variant: 'secondary',
      label: 'Design',
      href: '#categoria-design',
      ariaLabel: 'Filtrar por categoria Design',
    },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const AsButton: Story = {
  render: () => ({
    Component: BadgeStory,
    props: {
      variant: 'outline',
      label: 'React',
      icon: 'tag',
      asButton: true,
      ariaLabel: 'Filtrar por tag React',
    },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const CountBadge: Story = {
  render: () => ({
    Component: BadgeStory,
    props: {
      variant: 'destructive',
      label: '99+',
      ariaLabel: '99 ou mais notificações não lidas',
    },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};
