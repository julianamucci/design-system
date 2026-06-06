import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect } from 'storybook/test';
import { Checkbox } from './index';
import CheckboxStory from './CheckboxStory.svelte';
import CheckboxDocs from '@/components/docs/CheckboxDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Checkbox',
  component: Checkbox,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(CheckboxDocs) },
    layout: 'centered',
  },
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Estado controlado do checkbox.',
    },
    indeterminate: {
      control: 'boolean',
      description: 'Estado indeterminado (bits-ui — Svelte only).',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o componente.',
    },
    ariaInvalid: {
      control: 'boolean',
      description: 'Aplica aria-invalid para estado de erro.',
    },
    withLabel: {
      control: 'boolean',
      description: 'Renderiza com Label associada.',
    },
    withDescription: {
      control: 'boolean',
      description: 'Renderiza com Label e texto descritivo.',
    },
    labelText: {
      control: 'text',
      description: 'Texto da label associada.',
    },
  },
  args: {
    checked: false,
    indeterminate: false,
    disabled: false,
    ariaInvalid: false,
    withLabel: true,
    withDescription: false,
    labelText: 'Aceito os termos e condições',
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    Component: CheckboxStory,
    props: { ...args },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox está presente no DOM', async () => {
      await expect(checkbox).toBeInTheDocument();
    });

    await step('Checkbox começa desmarcado', async () => {
      await expect(checkbox).not.toBeChecked();
    });

    await step('Clicar no checkbox o marca', async () => {
      await userEvent.click(checkbox);
      await expect(checkbox).toBeChecked();
    });

    await step('Clicar novamente desmarca o checkbox', async () => {
      await userEvent.click(checkbox);
      await expect(checkbox).not.toBeChecked();
    });

    await step('Space alterna o estado via teclado', async () => {
      checkbox.focus();
      await userEvent.keyboard(' ');
      await expect(checkbox).toBeChecked();
      await userEvent.keyboard(' ');
      await expect(checkbox).not.toBeChecked();
    });
  },
};
