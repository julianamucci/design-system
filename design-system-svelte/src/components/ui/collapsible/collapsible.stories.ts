import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect } from 'storybook/test';
import { Collapsible } from './index';
import CollapsibleStory from './CollapsibleStory.svelte';
import CollapsibleDocs from '@/components/docs/CollapsibleDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Collapsible',
  component: Collapsible,
  tags: ['autodocs', 'disclosure'],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(CollapsibleDocs) },
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Estado aberto/fechado do painel',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o trigger impedindo interação',
    },
  },
  args: {
    open: false,
    disabled: false,
  },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    Component: CollapsibleStory,
    props: {
      open: args.open,
      disabled: args.disabled,
      label: 'Exibir filtros avançados',
      contentText: 'Filtro avançado 1 · Filtro avançado 2',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('trigger está presente no DOM', async () => {
      const trigger = canvas.getByRole('button');
      await expect(trigger).toBeInTheDocument();
    });

    await step('painel está fechado por padrão', async () => {
      const trigger = canvas.getByRole('button');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('clicar no trigger expande o painel', async () => {
      const trigger = canvas.getByRole('button');
      await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('clicar novamente colapsa o painel', async () => {
      const trigger = canvas.getByRole('button');
      await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  },
};
