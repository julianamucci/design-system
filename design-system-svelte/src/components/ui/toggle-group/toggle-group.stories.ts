import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect, fn } from 'storybook/test';
import { ToggleGroup } from './index';
import ToggleGroupStory from './ToggleGroupStory.svelte';
import ToggleGroupDocs from '@/components/docs/ToggleGroupDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/ToggleGroup',
  component: ToggleGroup,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(ToggleGroupDocs) },
    layout: 'centered',
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['single', 'multiple'],
      description: 'Modo de seleção. Define se value é string ou array.',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita todos os itens do grupo.',
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Direção da navegação por setas.',
    },
    variant: {
      control: 'select',
      options: ['default', 'outline'],
      description: 'Estilo visual herdado pelos itens.',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg'],
      description: 'Altura herdada pelos itens.',
    },
  },
  args: {
    type: 'single',
    disabled: false,
    orientation: 'horizontal',
    variant: 'default',
    size: 'default',
    onValueChange: fn(),
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    Component: ToggleGroupStory,
    props: {
      type: args.type,
      disabled: args.disabled,
      orientation: args.orientation,
      variant: args.variant,
      size: args.size,
      kind: 'alignment',
      ariaLabel: 'Alinhamento do texto',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group');
    const items = canvas.getAllByRole('radio');

    await step('ToggleGroup tem aria-label', async () => {
      await expect(group).toHaveAttribute('aria-label', 'Alinhamento do texto');
    });

    await step('Renderiza 3 itens', async () => {
      await expect(items).toHaveLength(3);
    });

    await step('Nenhum item começa pressionado', async () => {
      for (const it of items) await expect(it).toHaveAttribute('aria-checked', 'false');
    });

    await step('Clicar no primeiro item ativa-o', async () => {
      await userEvent.click(items[0]);
      await expect(items[0]).toHaveAttribute('aria-checked', 'true');
    });

    await step('ArrowRight move o foco para o próximo item', async () => {
      (items[0] as HTMLElement).focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(items[1]).toHaveFocus();
    });

    await step('Space alterna o item focado', async () => {
      await userEvent.keyboard(' ');
      await expect(items[1]).toHaveAttribute('aria-checked', 'true');
      await expect(items[0]).toHaveAttribute('aria-checked', 'false');
    });
  },
};
