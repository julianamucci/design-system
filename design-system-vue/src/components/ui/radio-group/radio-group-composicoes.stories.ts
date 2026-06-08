import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
import { RadioGroup, RadioGroupItem } from './index';
import { Label } from '@/components/ui/label';

const meta = {
  title: 'UI/RadioGroup/Composicoes',
  component: RadioGroup,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Padrões de composição do RadioGroup: forma de pagamento, fieldset+legend, em formulário e cartões selecionáveis.',
      },
    },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FormaDePagamento: Story = {
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    setup() { return {}; },
    template: `
      <RadioGroup aria-label="Forma de pagamento" class="grid gap-2 w-72">
        <div class="flex items-center gap-2">
          <RadioGroupItem value="cartao" id="cp-cartao" />
          <Label :for="'cp-cartao'">Cartão de crédito</Label>
        </div>
        <div class="flex items-center gap-2">
          <RadioGroupItem value="pix" id="cp-pix" />
          <Label :for="'cp-pix'">Pix</Label>
        </div>
        <div class="flex items-center gap-2">
          <RadioGroupItem value="boleto" id="cp-boleto" />
          <Label :for="'cp-boleto'">Boleto bancário</Label>
        </div>
      </RadioGroup>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio');

    await step('3 opções renderizadas e associadas às labels', async () => {
      await expect(radios).toHaveLength(3);
      await expect(canvas.getByRole('radio', { name: 'Cartão de crédito' })).toBeInTheDocument();
      await expect(canvas.getByRole('radio', { name: 'Pix' })).toBeInTheDocument();
      await expect(canvas.getByRole('radio', { name: 'Boleto bancário' })).toBeInTheDocument();
    });

    await step('Clicar na label seleciona o radio', async () => {
      await userEvent.click(canvas.getByText('Pix'));
      await expect(canvas.getByRole('radio', { name: 'Pix' })).toHaveAttribute('aria-checked', 'true');
    });
  },
};

export const ComFieldsetLegend: Story = {
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    setup() { return {}; },
    template: `
      <fieldset class="space-y-3 border rounded-lg p-4 w-80">
        <legend class="text-sm font-semibold px-1">Forma de entrega</legend>
        <RadioGroup aria-label="Forma de entrega" class="grid gap-2">
          <div class="flex items-center gap-2">
            <RadioGroupItem value="standard" id="cfl-standard" />
            <Label :for="'cfl-standard'">Padrão (5 dias)</Label>
          </div>
          <div class="flex items-center gap-2">
            <RadioGroupItem value="express" id="cfl-express" />
            <Label :for="'cfl-express'">Expressa (1 dia)</Label>
          </div>
          <div class="flex items-center gap-2">
            <RadioGroupItem value="pickup" id="cfl-pickup" />
            <Label :for="'cfl-pickup'">Retirar na loja</Label>
          </div>
        </RadioGroup>
      </fieldset>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Legend visível agrupa as opções', async () => {
      await expect(canvas.getByText('Forma de entrega')).toBeVisible();
    });
    await step('3 opções de entrega', async () => {
      await expect(canvas.getAllByRole('radio')).toHaveLength(3);
    });
  },
};

export const EmFormulario: Story = {
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    setup() { return {}; },
    template: `
      <form class="space-y-4 w-80" @submit.prevent>
        <div class="space-y-2">
          <label class="text-sm font-medium" for="form-email">Email</label>
          <input
            id="form-email"
            type="email"
            placeholder="seu@email.com"
            class="w-full h-(--height-default) px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <fieldset class="space-y-2">
          <legend class="text-sm font-medium mb-1">Forma de pagamento</legend>
          <RadioGroup aria-label="Forma de pagamento" required class="grid gap-2">
            <div class="flex items-center gap-2">
              <RadioGroupItem value="cartao" id="form-cartao" />
              <Label :for="'form-cartao'">Cartão de crédito</Label>
            </div>
            <div class="flex items-center gap-2">
              <RadioGroupItem value="pix" id="form-pix" />
              <Label :for="'form-pix'">Pix</Label>
            </div>
            <div class="flex items-center gap-2">
              <RadioGroupItem value="boleto" id="form-boleto" />
              <Label :for="'form-boleto'">Boleto bancário</Label>
            </div>
          </RadioGroup>
        </fieldset>

        <button
          type="submit"
          class="w-full h-(--height-default) px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Finalizar pedido
        </button>
      </form>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Formulário tem campo de email e radios', async () => {
      await expect(canvas.getByLabelText(/Email/i)).toBeInTheDocument();
      await expect(canvas.getAllByRole('radio')).toHaveLength(3);
    });

    await step('Botão de submit presente', async () => {
      await expect(canvas.getByRole('button', { name: 'Finalizar pedido' })).toBeInTheDocument();
    });

    await step('Selecionar uma opção marca aria-checked', async () => {
      const pix = canvas.getByRole('radio', { name: 'Pix' });
      await userEvent.click(pix);
      await expect(pix).toHaveAttribute('aria-checked', 'true');
    });
  },
};

export const CartoesSelecionaveis: Story = {
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    setup() { return {}; },
    template: `
      <RadioGroup aria-label="Plano" class="grid gap-3 w-80">
        <label
          for="card-basic"
          class="flex items-start gap-3 rounded-lg border border-input p-4 cursor-pointer hover:bg-muted/40 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5"
        >
          <RadioGroupItem value="basic" id="card-basic" class="mt-1" />
          <div class="space-y-0.5">
            <span class="block text-sm font-medium">Básico — R$ 19/mês</span>
            <span class="block text-xs text-muted-foreground">Para uso pessoal e projetos pequenos.</span>
          </div>
        </label>
        <label
          for="card-pro"
          class="flex items-start gap-3 rounded-lg border border-input p-4 cursor-pointer hover:bg-muted/40 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5"
        >
          <RadioGroupItem value="pro" id="card-pro" class="mt-1" />
          <div class="space-y-0.5">
            <span class="block text-sm font-medium">Pro — R$ 49/mês</span>
            <span class="block text-xs text-muted-foreground">Para times com até 5 pessoas.</span>
          </div>
        </label>
        <label
          for="card-enterprise"
          class="flex items-start gap-3 rounded-lg border border-input p-4 cursor-pointer hover:bg-muted/40 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5"
        >
          <RadioGroupItem value="enterprise" id="card-enterprise" class="mt-1" />
          <div class="space-y-0.5">
            <span class="block text-sm font-medium">Enterprise — Sob consulta</span>
            <span class="block text-xs text-muted-foreground">Suporte dedicado e SLA personalizado.</span>
          </div>
        </label>
      </RadioGroup>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio');
    await step('3 cartões/radios renderizados', async () => {
      await expect(radios).toHaveLength(3);
    });
    await step('Clique no cartão Pro seleciona seu radio', async () => {
      await userEvent.click(canvas.getByText(/Pro — R\$ 49/));
      await expect(radios[1]).toHaveAttribute('aria-checked', 'true');
    });
  },
};
