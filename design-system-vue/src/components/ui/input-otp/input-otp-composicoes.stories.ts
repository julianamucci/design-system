import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from './index';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const meta = {
  title: 'UI/InputOTP/Composicoes',
  component: InputOTP,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
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

export const ComLabel: Story = {
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
      <div style="contain: layout; min-height: 100px;" class="space-y-2">
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

export const ComHelpText: Story = {
  parameters: {
    docs: {
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
      <div style="contain: layout; min-height: 120px;" class="space-y-2">
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
        <p id="otp-help-text" class="text-xs text-muted-foreground">Enviamos por SMS, expira em 5 min.</p>
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

export const ComErrorMessage: Story = {
  parameters: {
    docs: {
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
      <div style="contain: layout; min-height: 120px;" class="space-y-2">
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
              <InputOTPSlot v-for="(slot, index) in slots" :key="index" :index="index" aria-invalid="true" />
            </InputOTPGroup>
          </template>
        </InputOTP>
        <p id="otp-error-msg" class="text-xs text-destructive">Código incorreto. Verifique e tente novamente.</p>
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

export const ComResendButton: Story = {
  parameters: {
    docs: {
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
      const resends = ref(0);
      return { value, resends };
    },
    template: `
      <div style="contain: layout; min-height: 140px;" class="space-y-3">
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
        <div class="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Não recebeu?</span>
          <Button variant="link" class="h-auto p-0 text-xs" @click="resends++">
            Reenviar código
          </Button>
          <span v-if="resends > 0" data-testid="resend-count">({{ resends }})</span>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Botão Reenviar visível', async () => {
      const btn = canvas.getByRole('button', { name: /Reenviar código/i });
      await expect(btn).toBeVisible();
    });

    await step('Click incrementa contagem', async () => {
      const btn = canvas.getByRole('button', { name: /Reenviar código/i });
      await userEvent.click(btn);
      await waitFor(() => expect(canvas.getByTestId('resend-count')).toHaveTextContent('(1)'));
    });
  },
};
