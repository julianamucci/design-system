import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, waitFor, expect } from 'storybook/test';
import { RadioGroup, RadioGroupItem } from './index';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  radioGroupCartoesSource,
  formRadioGroupSource,
  radioGroupFieldsetSource,
  radioGroupPagamentoSource,
} from './radio-group.source';

const meta = {
  title: 'UI/RadioGroup/Compositions',
  component: RadioGroup,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: radioGroupPagamentoSource },
      description: {
        component:
          'Padrões de composição do RadioGroup: forma de pagamento, fieldset+legend, em formulário e cartões selecionáveis.',
      },
    },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Idempotente — ver a nota em `radio-group.stories.ts`. */
const choose = async (alvo: HTMLElement): Promise<void> => {
  if (alvo.getAttribute('aria-checked') !== 'true') await userEvent.click(alvo);
  await waitFor(() => expect(alvo).toHaveAttribute('aria-checked', 'true'));
};

export const PaymentMethod: Story = {
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    setup() { return {}; },
    template: `
      <RadioGroup aria-label="Forma de pagamento" class="nds-grid nds-w-2xs" data-spacing="sm">
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
      // O rótulo faz parte do alvo de clique. Clicar num rótulo já escolhido o
      // mantém escolhido, então o passo sobrevive ao replay.
      await userEvent.click(canvas.getByText('Pix'));
      await waitFor(() =>
        expect(canvas.getByRole('radio', { name: 'Pix' })).toHaveAttribute('aria-checked', 'true'),
      );
      await expect(canvas.getByRole('radio', { name: 'Cartão de crédito' })).toHaveAttribute(
        'aria-checked',
        'false',
      );
    });
  },
};

export const WithFieldsetLegend: Story = {
  parameters: {
    // O fieldset com legend visível é a composição — o grupo solto do meta não
    // mostra o título nem a moldura.
    docs: { source: { transform: radioGroupFieldsetSource } },
  },
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    setup() { return {}; },
    template: `
      <fieldset class="nds-border-default nds-rounded-lg nds-p-4 nds-w-xs" data-spacing="sm">
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
  parameters: {
    // O assunto é o grupo convivendo com outros campos e com o envio.
    docs: { source: { transform: formRadioGroupSource } },
  },
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label, Button },
    setup() { return {}; },
    template: `
      <form class="nds-stack nds-w-xs" data-spacing="md" @submit.prevent>
        <div class="nds-stack" data-spacing="sm">
          <label class="nds-text-body nds-font-medium" for="form-email">Email</label>
          <input
            id="form-email"
            type="email"
            placeholder="seu@email.com"
            class="nds-input" 
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

        <Button type="submit" class="nds-w-full">Finalizar pedido</Button>
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
      await choose(canvas.getByRole('radio', { name: 'Pix' }));
      await expect(canvas.getByRole('radio', { name: 'Cartão de crédito' })).toHaveAttribute(
        'aria-checked',
        'false',
      );
    });
  },
};

export const SelectableCards: Story = {
  parameters: {
    // O rótulo passa a envolver o item, e o cartão inteiro vira alvo de clique:
    // a linha item-ao-lado-do-rótulo do meta é outra estrutura.
    docs: { source: { transform: radioGroupCartoesSource } },
  },
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    setup() { return {}; },
    template: `
      <RadioGroup aria-label="Plano" class="nds-grid nds-w-xs" data-spacing="sm">
        <label for="card-basic" class="nds-radio-card nds-cluster" data-align="start" data-spacing="sm">
          <RadioGroupItem value="basic" id="card-basic" class="nds-mt-1" />
          <div class="nds-stack" data-spacing="xs">
            <span class="nds-block nds-text-body nds-font-medium">Básico — R$ 19/mês</span>
            <span class="nds-block nds-text-caption nds-text-muted-foreground">Para uso pessoal e projetos pequenos.</span>
          </div>
        </label>
        <label for="card-pro" class="nds-radio-card nds-cluster" data-align="start" data-spacing="sm">
          <RadioGroupItem value="pro" id="card-pro" class="nds-mt-1" />
          <div class="nds-stack" data-spacing="xs">
            <span class="nds-block nds-text-body nds-font-medium">Pro — R$ 49/mês</span>
            <span class="nds-block nds-text-caption nds-text-muted-foreground">Para times com até 5 pessoas.</span>
          </div>
        </label>
        <label for="card-enterprise" class="nds-radio-card nds-cluster" data-align="start" data-spacing="sm">
          <RadioGroupItem value="enterprise" id="card-enterprise" class="nds-mt-1" />
          <div class="nds-stack" data-spacing="xs">
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
      await waitFor(() => expect(radios[1]).toHaveAttribute('aria-checked', 'true'));
    });

    await step('O cartão escolhido muda de aparência', async () => {
      // A razão de existir da composição. Enquanto o destaque saía de classe
      // morta, os três cartões ficavam idênticos e nenhuma asserção reprovava:
      // a play só olhava o aria-checked do rádio de dentro.
      const cartoes = Array.from(canvasElement.querySelectorAll<HTMLElement>('.nds-radio-card'));
      const escolhido = cartoes.find((c) => c.querySelector('[role="radio"][aria-checked="true"]'))!;
      const other = cartoes.find((c) => c !== escolhido)!;
      await waitFor(async () => {
        await expect(getComputedStyle(escolhido).borderTopColor).not.toBe(
          getComputedStyle(other).borderTopColor,
        );
        await expect(getComputedStyle(escolhido).backgroundColor).not.toBe(
          getComputedStyle(other).backgroundColor,
        );
      });
    });
  },
};
