import type { Meta, StoryObj } from '@storybook/vue3';
import { fn, userEvent, within, expect } from 'storybook/test';
import { Toggle } from './index';
import { Bold } from 'lucide-vue-next';
import ToggleDocs from '@/components/docs/ToggleDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Toggle',
  component: Toggle,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(ToggleDocs) },
  },
  argTypes: {
    modelValue: {
      control: 'boolean',
      description: 'Estado controlado (pressed). Use com @update:modelValue.',
    },
    defaultValue: {
      control: 'boolean',
      description: 'Estado inicial não-controlado.',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o Toggle.',
    },
    variant: {
      control: 'select',
      options: ['default', 'outline'],
      description: 'Estilo visual.',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg'],
      description: 'Altura via tokens --height-*.',
    },
    'onUpdate:modelValue': {
      action: 'update:modelValue',
      description: 'Disparado ao alternar o estado.',
    },
  },
  args: {
    disabled: false,
    variant: 'default',
    size: 'default',
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    'onUpdate:modelValue': fn(),
  } as never,
  render: (args) => ({
    components: { Toggle, Bold },
    setup() { return { args }; },
    template: `
      <Toggle v-bind="args" aria-label="Negrito">
        <Bold aria-hidden="true" />
      </Toggle>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Negrito' });

    await step('Toggle está presente com aria-label', async () => {
      await expect(toggle).toBeInTheDocument();
      await expect(toggle).toBeVisible();
    });

    await step('Toggle começa não-pressionado (aria-pressed=false)', async () => {
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    });

    await step('Clique alterna para pressionado', async () => {
      await userEvent.click(toggle);
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
      await expect(toggle).toHaveAttribute('data-state', 'on');
    });

    await step('Clique novamente alterna para não-pressionado', async () => {
      await userEvent.click(toggle);
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
      await expect(toggle).toHaveAttribute('data-state', 'off');
    });

    await step('Foco via teclado', async () => {
      (toggle as HTMLElement).focus();
      await expect(toggle).toHaveFocus();
    });

    await step('Space alterna o estado', async () => {
      (toggle as HTMLElement).focus();
      await userEvent.keyboard(' ');
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    });

    await step('Enter alterna o estado', async () => {
      (toggle as HTMLElement).focus();
      await userEvent.keyboard('{Enter}');
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    });
  },
};
