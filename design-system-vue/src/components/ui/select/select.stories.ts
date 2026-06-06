import type { Meta, StoryObj } from '@storybook/vue3';
import { fn, userEvent, within, expect, waitFor } from 'storybook/test';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './index';
import SelectDocs from '@/components/docs/SelectDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs', 'form'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(SelectDocs),
      description: {
        component:
          'Select (reka-ui) é um campo de seleção única com Trigger (role=combobox), Content em portal (role=listbox), Items, Groups e Labels. Use para 3–9 opções fixas — para listas longas com busca, prefira Combobox.',
      },
    },
  },
  argTypes: {
    defaultValue: {
      control: 'text',
      description: 'Valor inicial não-controlado.',
    },
    modelValue: {
      control: 'text',
      description: 'Valor selecionado (controlado).',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o trigger e impede abertura.',
    },
    name: {
      control: 'text',
      description: 'Nome do campo no formulário HTML.',
    },
    // Vue não tem argTypesRegex — declarar handler manualmente
    'onUpdate:modelValue': {
      action: 'update:modelValue',
      description: 'Disparado ao trocar a seleção.',
      table: { category: 'events' },
    },
  },
  args: {
    disabled: false,
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    'onUpdate:modelValue': fn(),
  } as never,
  render: (args) => ({
    components: {
      Select,
      SelectContent,
      SelectItem,
      SelectTrigger,
      SelectValue,
    },
    setup() { return { args }; },
    template: `
      <div style="contain: layout; min-height: 280px;" class="flex items-start justify-center">
        <Select v-bind="args">
          <SelectTrigger aria-label="Selecionar estado" class="w-56" :disabled="args.disabled">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sp">São Paulo</SelectItem>
            <SelectItem value="rj">Rio de Janeiro</SelectItem>
            <SelectItem value="mg">Minas Gerais</SelectItem>
            <SelectItem value="es">Espírito Santo</SelectItem>
          </SelectContent>
        </Select>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step('Trigger renderiza com role=combobox e placeholder', async () => {
      const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });
      await expect(trigger).toBeInTheDocument();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(canvas.getByText(/Selecione\.\.\./i)).toBeVisible();
    });

    await step('Click no trigger abre o Content (role=listbox)', async () => {
      const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });
      await userEvent.click(trigger);
      const listbox = await waitForPortal('listbox', { timeout: 2000 });
      await expect(listbox).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Selecionar item fecha dropdown e atualiza valor', async () => {
      const option = await waitForPortal('option', { name: /Rio de Janeiro/i });
      await userEvent.click(option);
      await waitFor(
        () => {
          if (body.queryByRole('listbox')) throw new Error('dropdown ainda aberto');
        },
        { timeout: 2000 },
      );
      await expect(canvas.getByText(/Rio de Janeiro/i)).toBeVisible();
    });
  },
};
