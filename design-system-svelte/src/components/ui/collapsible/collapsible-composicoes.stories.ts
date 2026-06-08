import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import { Collapsible } from './index';
import CollapsibleComButtonStory from './CollapsibleComButtonStory.svelte';
import CollapsibleComIconeStory from './CollapsibleComIconeStory.svelte';

const meta = {
  title: 'UI/Collapsible/Composicoes',
  component: Collapsible,
  tags: ['disclosure'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Composicoes do Collapsible: trigger estilizado como botão e trigger com ícone rotativo indicando o estado.',
      },
    },
  },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComButton: Story = {
  name: 'Com Button',
  render: () => ({
    Component: CollapsibleComButtonStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('trigger está presente no DOM', async () => {
      const trigger = canvas.getByRole('button');
      await expect(trigger).toBeInTheDocument();
    });

    await step('trigger possui atributo aria-expanded', async () => {
      const trigger = canvas.getByRole('button');
      await expect(trigger).toHaveAttribute('aria-expanded');
    });
  },
};

export const ComIconeRotativo: Story = {
  name: 'Com Ícone Rotativo',
  render: () => ({
    Component: CollapsibleComIconeStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('trigger presente com ícones decorativos aria-hidden', async () => {
      const trigger = canvas.getByRole('button');
      await expect(trigger).toBeInTheDocument();
      const icons = trigger.querySelectorAll('svg');
      for (const icon of icons) {
        await expect(icon).toHaveAttribute('aria-hidden', 'true');
      }
    });

    await step('painel fechado por padrão', async () => {
      const trigger = canvas.getByRole('button');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  },
};
