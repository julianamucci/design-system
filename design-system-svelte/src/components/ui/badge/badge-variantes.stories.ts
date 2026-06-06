import type { Meta, StoryObj } from '@storybook/svelte';

import { expect, waitFor } from 'storybook/test';
import { Badge } from './index';
import BadgeStory from './BadgeStory.svelte';

const meta = {
  title: 'UI/Badge/Variantes',
  component: Badge,
  tags: ['feedback'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Quatro variantes nativas do Badge via prop `variant`: default, secondary, destructive e outline.',
      },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    Component: BadgeStory,
    props: { variant: 'default', label: 'Novo' },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const Secondary: Story = {
  render: () => ({
    Component: BadgeStory,
    props: { variant: 'secondary', label: 'Beta' },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const Destructive: Story = {
  render: () => ({
    Component: BadgeStory,
    props: { variant: 'destructive', label: 'Urgente' },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const Outline: Story = {
  render: () => ({
    Component: BadgeStory,
    props: { variant: 'outline', label: 'Rascunho' },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};
