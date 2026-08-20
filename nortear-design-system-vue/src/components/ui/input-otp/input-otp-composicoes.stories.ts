import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, userEvent, expect, waitFor } from 'storybook/test';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from './index';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  inputOtpComApoioSource,
  inputOtpComErroSource,
  inputOtpComReenvioSource,
  inputOtpComRotuloSource,
} from './input-otp.source';

const meta = {
  title: 'UI/InputOTP/Compositions',
  component: InputOTP,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: inputOtpComRotuloSource },
      description: {
        component:
          'Composicoes reais de InputOTP: ComLabel (Label associada via for/id), ComHelpText (texto auxiliar via aria-describedby), ComErrorMessage (mensagem de erro com aria-invalid) e ComResendButton (botão para reenviar código).',
      },
    },
  },
} satisfies Meta<typeof InputOTP>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = { InputOTP, InputOTPGroup, InputOTPSlot, Label, Button };

export const WithLabel: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Label visível associado ao input via for/id. Atende WCAG 3.3.2 (Labels and Instructions).',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const value = ref('');
      return { value };
    },
    template: `
      <div style="contain: layout; min-height: 100px;" class="nds-stack" data-spacing="sm">
        <Label for="otp-with-label">Código de verificação</Label>
        <InputOTP
          id="otp-with-label"
          :max-length="6"
          v-model="value"
          autocomplete="one-time-code"
          inputmode="numeric"
        >
          <template #default="{ slots }">
            <InputOTPGroup>
              <InputOTPSlot v-for="(slot, index) in slots" :key="index" :index="index" />
            </InputOTPGroup>
          </template>
        </InputOTP>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText(/Código de verificação/i);
    await expect(label).toBeVisible();
    const input = await waitFor(() => canvas.getByLabelText(/Código de verificação/i));
    await expect(input).toBeInTheDocument();
  },
};

export const WithHelpText: Story = {
  parameters: {
    docs: {
      // O `aria-describedby` e o parágrafo que ele aponta são a lição, e não
      // existem na marcação do `meta`.
      source: { transform: inputOtpComApoioSource },
      description: {
        story: 'Texto auxiliar conectado via aria-describedby — origem do código + tempo de validade.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const value = ref('');
      return { value };
    },
    template: `
      <div style="contain: layout; min-height: 120px;" class="nds-stack" data-spacing="sm">
        <Label for="otp-help">Código SMS</Label>
        <InputOTP
          id="otp-help"
          :max-length="6"
          v-model="value"
          aria-describedby="otp-help-text"
          autocomplete="one-time-code"
          inputmode="numeric"
        >
          <template #default="{ slots }">
            <InputOTPGroup>
              <InputOTPSlot v-for="(slot, index) in slots" :key="index" :index="index" />
            </InputOTPGroup>
          </template>
        </InputOTP>
        <p id="otp-help-text" class="nds-text-caption nds-text-muted-foreground">Enviamos por SMS, expira em 5 min.</p>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Enviamos por SMS/i)).toBeVisible();
    const input = await waitFor(() => canvas.getByLabelText(/Código SMS/i));
    await expect(input).toHaveAttribute('aria-describedby', 'otp-help-text');
  },
};

export const WithErrorMessage: Story = {
  parameters: {
    docs: {
      // `aria-invalid` mais a mensagem conectada: a borda vermelha sozinha não
      // alcança quem não enxerga cor.
      source: { transform: inputOtpComErroSource },
      description: {
        story:
          'Mensagem de erro com aria-invalid=true e aria-describedby. Causa + ação corretiva.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const value = ref('123456');
      return { value };
    },
    template: `
      <div style="contain: layout; min-height: 120px;" class="nds-stack" data-spacing="sm">
        <Label for="otp-error">Código de verificação</Label>
        <InputOTP
          id="otp-error"
          :max-length="6"
          v-model="value"
          aria-invalid="true"
          aria-describedby="otp-error-msg"
          inputmode="numeric"
        >
          <template #default="{ slots }">
            <InputOTPGroup>
              <InputOTPSlot v-for="(slot, index) in slots" :key="index" :index="index" />
            </InputOTPGroup>
          </template>
        </InputOTP>
        <p id="otp-error-msg" class="nds-text-caption nds-text-destructive">Código incorreto. Verifique e tente novamente.</p>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await waitFor(() => canvas.getByLabelText(/Código de verificação/i));
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(canvas.getByText(/Código incorreto/i)).toBeVisible();
  },
};

export const WithResendButton: Story = {
  parameters: {
    docs: {
      // O reenvio vem DEPOIS do campo na ordem do DOM, e é essa ordem que a
      // story ensina — o `meta` termina no campo.
      source: { transform: inputOtpComReenvioSource },
      description: {
        story:
          'Botão "Reenviar código" abaixo do input. Verbo no infinitivo + objeto. Útil quando SMS demora.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const value = ref('');
      return { value };
    },
    template: `
      <div style="contain: layout; min-height: 140px;" class="nds-stack" data-spacing="sm">
        <Label for="otp-resend">Código de verificação</Label>
        <InputOTP
          id="otp-resend"
          :max-length="6"
          v-model="value"
          autocomplete="one-time-code"
          inputmode="numeric"
        >
          <template #default="{ slots }">
            <InputOTPGroup>
              <InputOTPSlot v-for="(slot, index) in slots" :key="index" :index="index" />
            </InputOTPGroup>
          </template>
        </InputOTP>
        <div class="nds-cluster" data-align="center" data-spacing="xs">
          <span class="nds-text-caption nds-text-muted-foreground">Não recebeu?</span>
          <Button variant="link" size="sm" type="button">Reenviar código</Button>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O reenvio é alcançável pelo teclado depois do campo', async () => {
      // O botão vem DEPOIS do campo na ordem do DOM: quem chega ao fim do
      // código encontra o reenvio no próximo Tab, sem voltar pelo caminho.
      // Uma contagem de cliques mora mal aqui — o painel Interactions reexecuta
      // a play no mesmo DOM e o número esperado muda a cada rodada.
      const input = canvasElement.querySelector<HTMLInputElement>(
        'input[autocomplete="one-time-code"]',
      )!;
      input.focus();
      await userEvent.tab();
      await expect(canvas.getByRole('button', { name: 'Reenviar código' })).toHaveFocus();
    });
  },
};
