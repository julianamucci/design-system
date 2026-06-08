import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import { expect, waitFor } from 'storybook/test';
import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'vue-input-otp';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from './index';

const meta = {
  title: 'UI/InputOTP/Variantes',
  component: InputOTP,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do InputOTP: SeisDigitos (padrão SMS de 6 dígitos), QuatroDigitos (PIN de 4 dígitos), ComSeparator (formato 3+3 com InputOTPSeparator) e Alfanumerico (pattern REGEXP_ONLY_DIGITS_AND_CHARS).',
      },
    },
  },
} satisfies Meta<typeof InputOTP>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot };

export const SeisDigitos: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'maxLength=6 — padrão para códigos OTP enviados via SMS/email. inputMode=numeric.',
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
      <div style="contain: layout; min-height: 80px;">
        <InputOTP
          :max-length="6"
          v-model="value"
          autocomplete="one-time-code"
          inputmode="numeric"
          aria-label="Código de 6 dígitos"
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
    await waitFor(() => {
      const el = canvasElement.querySelector('input');
      if (!el) throw new Error('input not mounted');
      return el as HTMLInputElement;
    });
    // vue-input-otp não seta maxlength no <input> — o limite é gerenciado via
    // props/state. Validar contando os slots renderizados.
    const slots = canvasElement.querySelectorAll('[data-slot="input-otp-slot"]');
    await expect(slots.length).toBe(6);
  },
};

export const QuatroDigitos: Story = {
  parameters: {
    docs: {
      description: {
        story: 'maxLength=4 — PIN local de 4 dígitos (carteira, conta, app travado).',
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
      <div style="contain: layout; min-height: 80px;">
        <InputOTP
          :max-length="4"
          v-model="value"
          inputmode="numeric"
          aria-label="PIN de 4 dígitos"
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
    await waitFor(() => {
      const el = canvasElement.querySelector('input');
      if (!el) throw new Error('input not mounted');
      return el as HTMLInputElement;
    });
    const slots = canvasElement.querySelectorAll('[data-slot="input-otp-slot"]');
    await expect(slots.length).toBe(4);
  },
};

export const ComSeparator: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Dois InputOTPGroup separados por InputOTPSeparator (formato 3+3). Útil para códigos de backup tipo xxx-xxx.',
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
      <div style="contain: layout; min-height: 80px;">
        <InputOTP
          :max-length="6"
          v-model="value"
          autocomplete="one-time-code"
          inputmode="numeric"
          aria-label="Código com separador"
        >
          <template #default>
            <InputOTPGroup>
              <InputOTPSlot :index="0" />
              <InputOTPSlot :index="1" />
              <InputOTPSlot :index="2" />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot :index="3" />
              <InputOTPSlot :index="4" />
              <InputOTPSlot :index="5" />
            </InputOTPGroup>
          </template>
        </InputOTP>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const separator = canvasElement.querySelector('[role="separator"]');
    await expect(separator).toBeInTheDocument();
    await waitFor(() => {
      const el = canvasElement.querySelector('input');
      if (!el) throw new Error('input not mounted');
      return el as HTMLInputElement;
    });
    const slots = canvasElement.querySelectorAll('[data-slot="input-otp-slot"]');
    await expect(slots.length).toBe(6);
  },
};

export const Alfanumerico: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'pattern=REGEXP_ONLY_DIGITS_AND_CHARS e inputMode=text. Útil para auth codes do GitHub/Google.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const value = ref('');
      return { value, pattern: REGEXP_ONLY_DIGITS_AND_CHARS };
    },
    template: `
      <div style="contain: layout; min-height: 80px;">
        <InputOTP
          :max-length="6"
          :pattern="pattern"
          v-model="value"
          inputmode="text"
          aria-label="Código alfanumérico"
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
    const input = await waitFor(() => {
      const el = canvasElement.querySelector('input');
      if (!el) throw new Error('input not mounted');
      return el as HTMLInputElement;
    });
    await expect(input).toHaveAttribute('inputmode', 'text');
  },
};
