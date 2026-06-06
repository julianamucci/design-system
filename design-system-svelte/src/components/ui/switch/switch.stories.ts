import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect, fn } from 'storybook/test';
import { Switch } from './index';
import SwitchStory from './SwitchStory.svelte';
import SwitchDocs from '@/components/docs/SwitchDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Switch',
  component: Switch,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(SwitchDocs) },
    layout: 'centered',
  },
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Estado controlado do switch.',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o componente.',
    },
    ariaInvalid: {
      control: 'boolean',
      description: 'Aplica aria-invalid para estado de erro.',
    },
    size: {
      control: 'select',
      options: ['default', 'sm'],
      description: 'Tamanho do switch.',
    },
    withLabel: {
      control: 'boolean',
      description: 'Renderiza com Label associada.',
    },
    withDescription: {
      control: 'boolean',
      description: 'Renderiza com Label e texto descritivo (layout em painel).',
    },
    labelText: {
      control: 'text',
      description: 'Texto da label associada.',
    },
  },
  args: {
    checked: false,
    disabled: false,
    ariaInvalid: false,
    size: 'default',
    withLabel: true,
    withDescription: false,
    labelText: 'Receber notificações por email',
    onCheckedChange: fn(),
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    Component: SwitchStory,
    props: { ...args, id: 'pg-switch' },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('Switch está presente no DOM', async () => {
      await expect(sw).toBeInTheDocument();
    });

    await step('Switch começa desativado (aria-checked=false)', async () => {
      await expect(sw).toHaveAttribute('aria-checked', 'false');
    });

    await step('Clicar no switch alterna para ativado', async () => {
      await userEvent.click(sw);
      await expect(sw).toHaveAttribute('aria-checked', 'true');
    });

    await step('Clicar novamente alterna para desativado', async () => {
      await userEvent.click(sw);
      await expect(sw).toHaveAttribute('aria-checked', 'false');
    });

    await step('Space alterna o estado via teclado', async () => {
      sw.focus();
      await userEvent.keyboard(' ');
      await expect(sw).toHaveAttribute('aria-checked', 'true');
      await userEvent.keyboard(' ');
      await expect(sw).toHaveAttribute('aria-checked', 'false');
    });
  },
};
