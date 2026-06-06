import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
import { RadioGroup, RadioGroupItem } from './index';
import { Label } from '@/components/ui/label';

const meta = {
  title: 'UI/RadioGroup/Estados',
  component: RadioGroup,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados do RadioGroup: default, checked, focus, disabled (grupo inteiro), itemDisabled (somente um item) e invalid (aria-invalid).',
      },
    },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    setup() { return {}; },
    template: `
      <RadioGroup aria-label="Forma de pagamento" class="grid gap-2 w-72">
        <div class="flex items-center gap-2">
          <RadioGroupItem value="cartao" id="est-def-cartao" />
          <Label :for="'est-def-cartao'">Cartão de crédito</Label>
        </div>
        <div class="flex items-center gap-2">
          <RadioGroupItem value="pix" id="est-def-pix" />
          <Label :for="'est-def-pix'">Pix</Label>
        </div>
      </RadioGroup>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio');
    await step('Nenhum item selecionado por padrão', async () => {
      for (const r of radios) await expect(r).toHaveAttribute('aria-checked', 'false');
    });
  },
};

export const Checked: Story = {
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    setup() { return {}; },
    template: `
      <RadioGroup default-value="pix" aria-label="Forma de pagamento" class="grid gap-2 w-72">
        <div class="flex items-center gap-2">
          <RadioGroupItem value="cartao" id="est-chk-cartao" />
          <Label :for="'est-chk-cartao'">Cartão de crédito</Label>
        </div>
        <div class="flex items-center gap-2">
          <RadioGroupItem value="pix" id="est-chk-pix" />
          <Label :for="'est-chk-pix'">Pix</Label>
        </div>
      </RadioGroup>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const pix = canvas.getByRole('radio', { name: /Pix/ });
    await step('Item Pix está selecionado', async () => {
      await expect(pix).toHaveAttribute('aria-checked', 'true');
    });
  },
};

export const FocoVisivel: Story = {
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    setup() { return {}; },
    template: `
      <RadioGroup aria-label="Forma de pagamento" class="grid gap-2 w-72">
        <div class="flex items-center gap-2">
          <RadioGroupItem value="cartao" id="est-foc-cartao" />
          <Label :for="'est-foc-cartao'">Cartão de crédito</Label>
        </div>
        <div class="flex items-center gap-2">
          <RadioGroupItem value="pix" id="est-foc-pix" />
          <Label :for="'est-foc-pix'">Pix</Label>
        </div>
      </RadioGroup>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Foco via teclado: Tab entra no grupo, setas movem entre itens com auto-seleção em desktop.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio');
    await step('Primeiro item recebe foco programaticamente', async () => {
      (radios[0] as HTMLElement).focus();
      await expect(radios[0]).toHaveFocus();
    });
  },
};

export const Disabled: Story = {
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    setup() { return {}; },
    template: `
      <RadioGroup :disabled="true" aria-label="Forma de pagamento" class="grid gap-2 w-72">
        <div class="flex items-center gap-2">
          <RadioGroupItem value="cartao" id="est-dis-cartao" />
          <Label :for="'est-dis-cartao'">Cartão de crédito</Label>
        </div>
        <div class="flex items-center gap-2">
          <RadioGroupItem value="pix" id="est-dis-pix" />
          <Label :for="'est-dis-pix'">Pix</Label>
        </div>
      </RadioGroup>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio');
    await step('Todos os itens estão desabilitados', async () => {
      for (const r of radios) {
        await expect(r).toHaveAttribute('data-disabled');
      }
    });
    await step('Clicar não altera seleção', async () => {
      await userEvent.click(radios[0], { pointerEventsCheck: 0 });
      await expect(radios[0]).toHaveAttribute('aria-checked', 'false');
    });
  },
};

export const ItemDisabled: Story = {
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    setup() { return {}; },
    template: `
      <RadioGroup aria-label="Forma de pagamento" class="grid gap-2 w-72">
        <div class="flex items-center gap-2">
          <RadioGroupItem value="cartao" id="est-itd-cartao" />
          <Label :for="'est-itd-cartao'">Cartão de crédito</Label>
        </div>
        <div class="flex items-center gap-2">
          <RadioGroupItem value="pix" id="est-itd-pix" :disabled="true" />
          <Label :for="'est-itd-pix'">Pix (indisponível)</Label>
        </div>
        <div class="flex items-center gap-2">
          <RadioGroupItem value="boleto" id="est-itd-boleto" />
          <Label :for="'est-itd-boleto'">Boleto bancário</Label>
        </div>
      </RadioGroup>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const pix = canvas.getByRole('radio', { name: /Pix/i });
    await step('Apenas o item Pix está desabilitado', async () => {
      await expect(pix).toHaveAttribute('data-disabled');
    });
  },
};

export const Invalid: Story = {
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    setup() { return {}; },
    template: `
      <div class="space-y-2 w-80">
        <fieldset class="space-y-2">
          <legend class="text-sm font-semibold">Forma de pagamento *</legend>
          <RadioGroup aria-label="Forma de pagamento" aria-invalid="true" aria-describedby="est-inv-err" class="grid gap-2">
            <div class="flex items-center gap-2">
              <RadioGroupItem value="cartao" id="est-inv-cartao" aria-invalid="true" />
              <Label :for="'est-inv-cartao'">Cartão de crédito</Label>
            </div>
            <div class="flex items-center gap-2">
              <RadioGroupItem value="pix" id="est-inv-pix" aria-invalid="true" />
              <Label :for="'est-inv-pix'">Pix</Label>
            </div>
          </RadioGroup>
        </fieldset>
        <p id="est-inv-err" class="text-sm text-destructive">
          Selecione uma forma de pagamento para continuar.
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio');
    await step('Itens estão marcados como aria-invalid', async () => {
      for (const r of radios) await expect(r).toHaveAttribute('aria-invalid', 'true');
    });
    await step('Mensagem de erro visível', async () => {
      await expect(canvas.getByText(/Selecione uma forma de pagamento/)).toBeVisible();
    });
  },
};
