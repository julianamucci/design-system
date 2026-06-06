import type { Meta, StoryObj } from '@storybook/vue3';
import { fn, userEvent, within, expect } from 'storybook/test';
import { Checkbox } from './index';
import CheckboxDocs from '@/components/docs/CheckboxDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Checkbox',
  component: Checkbox,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(CheckboxDocs) },
  },
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Estado controlado do checkbox',
    },
    defaultChecked: {
      control: 'boolean',
      description: 'Estado inicial não controlado',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o checkbox',
    },
    required: {
      control: 'boolean',
      description: 'Marca o campo como obrigatório',
    },
    name: {
      control: 'text',
      description: 'Nome do campo para formulários HTML',
    },
    value: {
      control: 'text',
      description: 'Valor enviado no submit quando marcado',
    },
  },
  args: {
    disabled: false,
    required: false,
  },
} satisfies Meta<any>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    'onUpdate:checked': fn(),
  } as never,
  render: (args) => ({
    components: { Checkbox },
    setup() { return { args }; },
    template: `
      <div class="flex items-center gap-2">
        <Checkbox id="playground-checkbox" v-bind="args" />
        <label
          for="playground-checkbox"
          class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Aceito os termos e condições
        </label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox está presente e visível', async () => {
      await expect(checkbox).toBeInTheDocument();
      await expect(checkbox).toBeVisible();
    });

    await step('Checkbox começa desmarcado', async () => {
      await expect(checkbox).not.toBeChecked();
    });

    await step('Clique marca o checkbox', async () => {
      await userEvent.click(checkbox);
      await expect(checkbox).toBeChecked();
    });

    await step('Clique novamente desmarca o checkbox', async () => {
      await userEvent.click(checkbox);
      await expect(checkbox).not.toBeChecked();
    });

    await step('Focus via teclado', async () => {
      (checkbox as HTMLElement).focus();
      await expect(checkbox).toHaveFocus();
    });

    await step('Space alterna o estado', async () => {
      (checkbox as HTMLElement).focus();
      await userEvent.keyboard(' ');
      await expect(checkbox).toBeChecked();
    });
  },
};
