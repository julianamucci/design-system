import type { Meta, StoryObj } from '@storybook/vue3';
import { fn, userEvent, within, expect } from 'storybook/test';
import { Switch } from './index';
import { Label } from '@/components/ui/label';
import SwitchDocs from '@/components/docs/SwitchDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Switch',
  component: Switch,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(SwitchDocs) },
  },
  argTypes: {
    modelValue: {
      control: 'boolean',
      description: 'Estado controlado (v-model).',
    },
    defaultValue: {
      control: 'boolean',
      description: 'Estado inicial não-controlado.',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o Switch.',
    },
    required: {
      control: 'boolean',
      description: 'Marca o campo como obrigatório.',
    },
    name: {
      control: 'text',
      description: 'Nome do campo no formulário HTML.',
    },
    size: {
      control: 'select',
      options: ['default', 'sm'],
      description: 'Tamanho do Switch.',
    },
    'onUpdate:modelValue': {
      action: 'update:modelValue',
      description: 'Disparado ao alternar o estado.',
    },
  },
  args: {
    disabled: false,
    required: false,
    size: 'default',
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    'onUpdate:modelValue': fn(),
  } as never,
  render: (args) => ({
    components: { Switch, Label },
    setup() { return { args }; },
    template: `
      <div class="flex items-center space-x-2">
        <Switch id="playground-switch" v-bind="args" />
        <Label :for="'playground-switch'">Receber notificações por email</Label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('Switch está presente com role=switch', async () => {
      await expect(sw).toBeInTheDocument();
      await expect(sw).toBeVisible();
    });

    await step('Switch começa desativado (aria-checked=false)', async () => {
      await expect(sw).toHaveAttribute('aria-checked', 'false');
    });

    await step('Clique alterna para ativo', async () => {
      await userEvent.click(sw);
      await expect(sw).toHaveAttribute('aria-checked', 'true');
    });

    await step('Clique novamente alterna para inativo', async () => {
      await userEvent.click(sw);
      await expect(sw).toHaveAttribute('aria-checked', 'false');
    });

    await step('Foco via teclado', async () => {
      (sw as HTMLElement).focus();
      await expect(sw).toHaveFocus();
    });

    await step('Space alterna o estado', async () => {
      (sw as HTMLElement).focus();
      await userEvent.keyboard(' ');
      await expect(sw).toHaveAttribute('aria-checked', 'true');
    });
  },
};
