import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect, fn } from 'storybook/test';
import { Toggle } from './index';
import ToggleStory from './ToggleStory.svelte';
import ToggleDocs from '@/components/docs/ToggleDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Toggle',
  component: Toggle,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(ToggleDocs) },
    layout: 'centered',
  },
  argTypes: {
    pressed: {
      control: 'boolean',
      description: 'Estado controlado do toggle (pressed/not pressed).',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o componente.',
    },
    ariaInvalid: {
      control: 'boolean',
      description: 'Aplica aria-invalid para estado de erro.',
    },
    variant: {
      control: 'select',
      options: ['default', 'outline'],
      description: 'Estilo visual.',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg'],
      description: 'Altura do toggle via tokens --height-*.',
    },
    icon: {
      control: 'select',
      options: ['bold', 'italic', 'underline', 'list', 'eye', 'layout'],
      description: 'Ícone interno (aria-hidden).',
    },
    label: {
      control: 'text',
      description: 'Texto/label associado ao toggle.',
    },
    ariaLabel: {
      control: 'text',
      description: 'aria-label — obrigatório em icon-only (quando withLabel=false).',
    },
    withLabel: {
      control: 'boolean',
      description: 'Renderiza com texto visível ao lado do ícone.',
    },
  },
  args: {
    pressed: false,
    disabled: false,
    ariaInvalid: false,
    variant: 'default',
    size: 'default',
    icon: 'bold',
    label: 'Negrito',
    ariaLabel: 'Negrito',
    withLabel: false,
    onPressedChange: fn(),
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    Component: ToggleStory,
    props: { ...args },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button');

    await step('Toggle está presente no DOM', async () => {
      await expect(toggle).toBeInTheDocument();
    });

    await step('Toggle começa não pressionado (aria-pressed=false)', async () => {
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    });

    await step('Clicar no toggle alterna para pressed=true', async () => {
      await userEvent.click(toggle);
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    });

    await step('Clicar novamente alterna para pressed=false', async () => {
      await userEvent.click(toggle);
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    });

    await step('Space alterna o estado via teclado', async () => {
      toggle.focus();
      await userEvent.keyboard(' ');
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    });

    await step('Enter alterna o estado via teclado', async () => {
      toggle.focus();
      await userEvent.keyboard('{Enter}');
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    });
  },
};
