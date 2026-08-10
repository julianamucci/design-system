import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect } from 'storybook/test';
import { RadioGroup, RadioGroupItem } from './index';
import { Label } from '@/components/ui/label';

const meta = {
  title: 'UI/RadioGroup/Compositions',
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
      <RadioGroup aria-label="Forma de pagamento" class="nds-grid" data-spacing="sm" style="width: 18rem">
        <div class="nds-cluster" data-spacing="sm">
          <RadioGroupItem value="cartao" id="cp-cartao" />
          <Label :for="'cp-cartao'">Cartão de crédito</Label>
        </div>
        <div class="nds-cluster" data-spacing="sm">
          <RadioGroupItem value="pix" id="cp-pix" />
          <Label :for="'cp-pix'">Pix</Label>
        </div>
        <div class="nds-cluster" data-spacing="sm">
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

export const WithFieldsetLegend: Story = {
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    setup() { return {}; },
    template: `
      <fieldset class="nds-border-default nds-rounded-lg nds-p-4" data-spacing="sm" style="width: 20rem">
        <legend class="nds-text-body nds-font-semibold nds-px-1">Forma de entrega</legend>
        <RadioGroup aria-label="Forma de entrega" class="nds-stack" data-spacing="sm">
          <div class="nds-cluster" data-spacing="sm">
            <RadioGroupItem value="standard" id="cfl-standard" />
            <Label :for="'cfl-standard'">Padrão (5 dias)</Label>
          </div>
          <div class="nds-cluster" data-spacing="sm">
            <RadioGroupItem value="express" id="cfl-express" />
            <Label :for="'cfl-express'">Expressa (1 dia)</Label>
          </div>
          <div class="nds-cluster" data-spacing="sm">
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

export const InForm: Story = {
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    setup() { return {}; },
    template: `
      <form class="" data-spacing="md" style="width: 20rem" @submit.prevent>
        <div class="nds-stack" data-spacing="sm">
          <label class="nds-text-body nds-font-medium" for="form-email">Email</label>
          <input
            id="form-email"
            type="email"
            placeholder="seu@email.com"
            class="nds-w-full nds-rounded-md nds-border-default nds-border-default nds-bg-background nds-text-body nds-focus-ring" style="height: var(--height-default); padding-inline: 0.75rem" 
          />
        </div>

        <fieldset class="nds-stack" data-spacing="sm">
          <legend class="nds-text-body nds-font-medium nds-mb-1">Forma de pagamento</legend>
          <RadioGroup aria-label="Forma de pagamento" required class="nds-stack" data-spacing="sm">
            <div class="nds-cluster" data-spacing="sm">
              <RadioGroupItem value="cartao" id="form-cartao" />
              <Label :for="'form-cartao'">Cartão de crédito</Label>
            </div>
            <div class="nds-cluster" data-spacing="sm">
              <RadioGroupItem value="pix" id="form-pix" />
              <Label :for="'form-pix'">Pix</Label>
            </div>
            <div class="nds-cluster" data-spacing="sm">
              <RadioGroupItem value="boleto" id="form-boleto" />
              <Label :for="'form-boleto'">Boleto bancário</Label>
            </div>
          </RadioGroup>
        </fieldset>

        <button
          type="submit"
          class="nds-w-full nds-px-4 nds-rounded-md nds-bg-primary text-primary-foreground nds-text-body nds-font-medium nds-hover-bg-primary-90 transition-colors" style="height: var(--height-default)"
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

export const SelectableCards: Story = {
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    setup() { return {}; },
    template: `
      <RadioGroup aria-label="Plano" class="nds-grid" data-spacing="sm" style="width: 20rem">
        <label
          for="card-basic"
          class="nds-cluster nds-rounded-lg nds-border-default nds-border-default nds-p-4 nds-cursor-pointer nds-hover-bg-muted-40 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5" data-align="start" data-spacing="sm"
        >
          <RadioGroupItem value="basic" id="card-basic" class="nds-mt-1" />
          <div class="" data-spacing="xs">
            <span class="nds-block nds-text-body nds-font-medium">Básico — R$ 19/mês</span>
            <span class="nds-block nds-text-caption nds-text-muted-foreground">Para uso pessoal e projetos pequenos.</span>
          </div>
        </label>
        <label
          for="card-pro"
          class="nds-cluster nds-rounded-lg nds-border-default nds-border-default nds-p-4 nds-cursor-pointer nds-hover-bg-muted-40 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5" data-align="start" data-spacing="sm"
        >
          <RadioGroupItem value="pro" id="card-pro" class="nds-mt-1" />
          <div class="" data-spacing="xs">
            <span class="nds-block nds-text-body nds-font-medium">Pro — R$ 49/mês</span>
            <span class="nds-block nds-text-caption nds-text-muted-foreground">Para times com até 5 pessoas.</span>
          </div>
        </label>
        <label
          for="card-enterprise"
          class="nds-cluster nds-rounded-lg nds-border-default nds-border-default nds-p-4 nds-cursor-pointer nds-hover-bg-muted-40 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5" data-align="start" data-spacing="sm"
        >
          <RadioGroupItem value="enterprise" id="card-enterprise" class="nds-mt-1" />
          <div class="" data-spacing="xs">
            <span class="nds-block nds-text-body nds-font-medium">Enterprise — Sob consulta</span>
            <span class="nds-block nds-text-caption nds-text-muted-foreground">Suporte dedicado e SLA personalizado.</span>
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
