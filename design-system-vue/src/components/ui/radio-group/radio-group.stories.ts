import type { Meta, StoryObj } from '@storybook/vue3';
import { fn, userEvent, within, expect, waitFor } from 'storybook/test';
import { RadioGroup, RadioGroupItem } from './index';
import { Label } from '@/components/ui/label';
import RadioGroupDocs from '@/components/docs/RadioGroupDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(RadioGroupDocs) },
  },
  argTypes: {
    modelValue: {
      control: 'text',
      description: 'Valor selecionado (controlado).',
    },
    defaultValue: {
      control: 'text',
      description: 'Valor inicial não-controlado.',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita todos os itens do grupo.',
    },
    orientation: {
      control: 'select',
      options: ['vertical', 'horizontal'],
      description: 'Direção da navegação por setas.',
    },
    name: {
      control: 'text',
      description: 'Nome do campo no formulário HTML.',
    },
    onUpdateModelValue: {
      action: 'update:modelValue',
      description: 'Disparado ao trocar a seleção.',
    },
  },
  args: {
    disabled: false,
    orientation: 'vertical',
  },
} satisfies Meta<any>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    'onUpdate:modelValue': fn(),
  } as never,
  render: (args) => ({
    components: { RadioGroup, RadioGroupItem, Label },
    setup() { return { args }; },
    template: `
      <RadioGroup
        v-bind="args"
        aria-label="Forma de pagamento"
        class="grid gap-2"
      >
        <div class="flex items-center gap-2">
          <RadioGroupItem value="cartao" id="pg-cartao" />
          <Label :for="'pg-cartao'">Cartão de crédito</Label>
        </div>
        <div class="flex items-center gap-2">
          <RadioGroupItem value="pix" id="pg-pix" />
          <Label :for="'pg-pix'">Pix</Label>
        </div>
        <div class="flex items-center gap-2">
          <RadioGroupItem value="boleto" id="pg-boleto" />
          <Label :for="'pg-boleto'">Boleto bancário</Label>
        </div>
      </RadioGroup>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio');

    await step('RadioGroup renderiza 3 itens com role=radio', async () => {
      await expect(radios).toHaveLength(3);
      for (const r of radios) await expect(r).toBeInTheDocument();
    });

    await step('Nenhum item começa selecionado', async () => {
      for (const r of radios) await expect(r).toHaveAttribute('aria-checked', 'false');
    });

    await step('Clicar no primeiro item seleciona-o', async () => {
      await userEvent.click(radios[0]);
      await waitFor(() => expect(radios[0]).toHaveAttribute('aria-checked', 'true'));
      await expect(radios[1]).toHaveAttribute('aria-checked', 'false');
    });

    await step('Setas alternam o item selecionado', async () => {
      (radios[0] as HTMLElement).focus();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(radios[1]).toHaveAttribute('aria-checked', 'true'));
      await expect(radios[0]).toHaveAttribute('aria-checked', 'false');
    });

    await step('ArrowUp volta ao anterior', async () => {
      await userEvent.keyboard('{ArrowUp}');
      await waitFor(() => expect(radios[0]).toHaveAttribute('aria-checked', 'true'));
    });
  },
};
