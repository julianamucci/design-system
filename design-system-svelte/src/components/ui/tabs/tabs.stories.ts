import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import { Tabs } from './index';
import TabsStory from './TabsStory.svelte';
import TabsDocs from '@/components/docs/TabsDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs', 'navigation'],
  parameters: {
    docs: { page: withAutoDocsTab(TabsDocs) },
  },
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Direção da navegação por setas e layout.',
    },
    activationMode: {
      control: 'select',
      options: ['automatic', 'manual'],
      description: '`automatic` ativa ao mover setas; `manual` exige Enter/Space.',
    },
  },
  args: {
    orientation: 'horizontal',
    activationMode: 'automatic',
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    Component: TabsStory,
    props: {
      orientation: args.orientation,
      activationMode: args.activationMode,
      defaultValue: 'overview',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Primeira tab começa ativa (defaultValue)', async () => {
      const tabs = canvas.getAllByRole('tab');
      await waitFor(
        () => expect(tabs[0]).toHaveAttribute('aria-selected', 'true'),
        { timeout: 500 }
      );
      await expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    });

    await step('Clicar em uma tab a ativa', async () => {
      const tabs = canvas.getAllByRole('tab');
      await userEvent.click(tabs[1]);
      await expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
      await expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
    });

    await step('ArrowRight move para próxima tab (modo automatic)', async () => {
      const tabs = canvas.getAllByRole('tab');
      tabs[1].focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
    });

    await step('TabsList tem role tablist e aria-label', async () => {
      const list = canvas.getByRole('tablist');
      await expect(list).toHaveAttribute('aria-label');
    });
  },
};
