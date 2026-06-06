import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import { within, expect, waitFor } from 'storybook/test';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from './index';

const meta = {
  title: 'UI/InputOTP/Estados',
  component: InputOTP,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados canônicos do InputOTP: Vazio (sem caracteres), Preenchendo (parcial), Completo (todos os slots), Desabilitado (disabled=true) e Erro (aria-invalid=true).',
      },
    },
  },
} satisfies Meta<typeof InputOTP>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = { InputOTP, InputOTPGroup, InputOTPSlot };

export const Vazio: Story = {
  parameters: {
    docs: {
      description: { story: 'Nenhum slot preenchido. Estado inicial.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const value = ref('');
      return { value };
    },
    template: `
      <div style="contain: layout; min-height: 80px;">
        <InputOTP :max-length="6" v-model="value" aria-label="Código vazio" inputmode="numeric">
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
    const input = await waitFor(() => canvas.getByLabelText(/vazio/i));
    await expect((input as HTMLInputElement).value).toBe('');
  },
};

export const Preenchendo: Story = {
  parameters: {
    docs: {
      description: { story: 'Três de seis slots preenchidos. Foco no slot 4.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const value = ref('123');
      return { value };
    },
    template: `
      <div style="contain: layout; min-height: 80px;">
        <InputOTP :max-length="6" v-model="value" aria-label="Código preenchendo" inputmode="numeric">
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
    const input = await waitFor(() => canvas.getByLabelText(/preenchendo/i));
    await expect((input as HTMLInputElement).value).toBe('123');
  },
};

export const Completo: Story = {
  parameters: {
    docs: {
      description: { story: 'Todos os slots preenchidos. onComplete dispara.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const value = ref('123456');
      return { value };
    },
    template: `
      <div style="contain: layout; min-height: 80px;">
        <InputOTP :max-length="6" v-model="value" aria-label="Código completo" inputmode="numeric">
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
    const input = await waitFor(() => canvas.getByLabelText(/completo/i));
    await expect((input as HTMLInputElement).value).toBe('123456');
    await expect((input as HTMLInputElement).value).toHaveLength(6);
  },
};

export const Desabilitado: Story = {
  parameters: {
    docs: {
      description: { story: 'disabled=true aplica has-disabled:opacity-50 no container.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const value = ref('12');
      return { value };
    },
    template: `
      <div style="contain: layout; min-height: 80px;">
        <InputOTP :max-length="6" :disabled="true" v-model="value" aria-label="Código desabilitado" inputmode="numeric">
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
    const input = await waitFor(() => canvas.getByLabelText(/desabilitado/i));
    await expect(input).toBeDisabled();
  },
};

export const Erro: Story = {
  parameters: {
    docs: {
      description: {
        story: 'aria-invalid=true aplica border-destructive e ring vermelho ao grupo.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const value = ref('123');
      return { value };
    },
    template: `
      <div style="contain: layout; min-height: 100px;" class="space-y-2">
        <InputOTP
          :max-length="6"
          v-model="value"
          aria-label="Código com erro"
          aria-invalid="true"
          aria-describedby="otp-error"
          inputmode="numeric"
        >
          <template #default="{ slots }">
            <InputOTPGroup>
              <InputOTPSlot v-for="(slot, index) in slots" :key="index" :index="index" aria-invalid="true" />
            </InputOTPGroup>
          </template>
        </InputOTP>
        <p id="otp-error" class="text-xs text-destructive">Código incorreto. Verifique e tente novamente.</p>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await waitFor(() => canvas.getByLabelText(/com erro/i));
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(canvas.getByText(/Código incorreto/i)).toBeVisible();
  },
};
