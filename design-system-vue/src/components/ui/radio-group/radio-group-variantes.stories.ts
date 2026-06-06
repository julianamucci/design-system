import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import { RadioGroup, RadioGroupItem } from './index';
import { Label } from '@/components/ui/label';

const meta = {
  title: 'UI/RadioGroup/Variantes',
  component: RadioGroup,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do RadioGroup: vertical (padrão para 4+ opções), horizontal (2–3 opções curtas) e withDescription (cada item com descrição auxiliar).',
      },
    },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vertical: Story = {
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    setup() { return {}; },
    template: `
      <RadioGroup aria-label="Forma de pagamento" class="grid gap-2 w-72">
        <div class="flex items-center gap-2">
          <RadioGroupItem value="cartao" id="vert-cartao" />
          <Label :for="'vert-cartao'">Cartão de crédito</Label>
        </div>
        <div class="flex items-center gap-2">
          <RadioGroupItem value="pix" id="vert-pix" />
          <Label :for="'vert-pix'">Pix</Label>
        </div>
        <div class="flex items-center gap-2">
          <RadioGroupItem value="boleto" id="vert-boleto" />
          <Label :for="'vert-boleto'">Boleto bancário</Label>
        </div>
      </RadioGroup>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('radiogroup');
    await step('Container tem role=radiogroup', async () => {
      await expect(group).toBeInTheDocument();
    });
    await step('Renderiza 3 radios', async () => {
      await expect(canvas.getAllByRole('radio')).toHaveLength(3);
    });
  },
};

export const Horizontal: Story = {
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    setup() { return {}; },
    template: `
      <RadioGroup orientation="horizontal" aria-label="Forma de entrega" class="flex flex-wrap gap-6">
        <div class="flex items-center gap-2">
          <RadioGroupItem value="standard" id="horiz-standard" />
          <Label :for="'horiz-standard'">Padrão</Label>
        </div>
        <div class="flex items-center gap-2">
          <RadioGroupItem value="express" id="horiz-express" />
          <Label :for="'horiz-express'">Expressa</Label>
        </div>
        <div class="flex items-center gap-2">
          <RadioGroupItem value="pickup" id="horiz-pickup" />
          <Label :for="'horiz-pickup'">Retirar na loja</Label>
        </div>
      </RadioGroup>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('radiogroup');
    await step('Orientação horizontal aplicada', async () => {
      await expect(group).toHaveAttribute('aria-orientation', 'horizontal');
    });
    await step('Renderiza 3 radios', async () => {
      await expect(canvas.getAllByRole('radio')).toHaveLength(3);
    });
  },
};

export const WithDescription: Story = {
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    setup() { return {}; },
    template: `
      <RadioGroup aria-label="Forma de pagamento" class="grid gap-3 w-80">
        <div class="flex items-start gap-2">
          <RadioGroupItem value="cartao" id="wd-cartao" class="mt-1" aria-describedby="wd-cartao-desc" />
          <div class="space-y-0.5">
            <Label :for="'wd-cartao'">Cartão de crédito</Label>
            <p id="wd-cartao-desc" class="text-xs text-muted-foreground">
              Aprovação imediata em até 12x.
            </p>
          </div>
        </div>
        <div class="flex items-start gap-2">
          <RadioGroupItem value="pix" id="wd-pix" class="mt-1" aria-describedby="wd-pix-desc" />
          <div class="space-y-0.5">
            <Label :for="'wd-pix'">Pix</Label>
            <p id="wd-pix-desc" class="text-xs text-muted-foreground">
              Pagamento instantâneo com 5% de desconto.
            </p>
          </div>
        </div>
        <div class="flex items-start gap-2">
          <RadioGroupItem value="boleto" id="wd-boleto" class="mt-1" aria-describedby="wd-boleto-desc" />
          <div class="space-y-0.5">
            <Label :for="'wd-boleto'">Boleto bancário</Label>
            <p id="wd-boleto-desc" class="text-xs text-muted-foreground">
              Compensação em até 3 dias úteis.
            </p>
          </div>
        </div>
      </RadioGroup>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Cada radio tem aria-describedby para sua descrição', async () => {
      const cartao = canvas.getByRole('radio', { name: /Cartão de crédito/i });
      await expect(cartao).toHaveAttribute('aria-describedby', 'wd-cartao-desc');
    });
    await step('Descrições auxiliares estão visíveis', async () => {
      await expect(canvas.getByText(/Aprovação imediata/)).toBeVisible();
      await expect(canvas.getByText(/Pagamento instantâneo/)).toBeVisible();
    });
  },
};
