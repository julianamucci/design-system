import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, userEvent, expect, waitFor } from 'storybook/test';
import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'vue-input-otp';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from './index';
import { campo } from './input-otp.fixtures';
import {
  inputOtpAlfanumericoSource,
  inputOtpWithSeparatorSource,
  inputOtpQuatroDigitosSource,
  inputOtpSeisDigitosSource,
} from './input-otp.source';

const meta = {
  title: 'UI/InputOTP/Variants',
  component: InputOTP,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: inputOtpSeisDigitosSource },
      description: {
        component:
          'Variantes do InputOTP: SixDigits (padrão SMS), FourDigits (PIN), WithSeparator (3+3) e Alphanumeric (código de autenticação).',
      },
    },
  },
} satisfies Meta<typeof InputOTP>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot };

const boxes = (canvasElement: HTMLElement): HTMLElement[] => [
  ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="input-otp-slot"]'),
];

const texts = (canvasElement: HTMLElement): string[] =>
  boxes(canvasElement).map((c) => c.textContent?.trim() ?? '');

export const SixDigits: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '6 dígitos — padrão para códigos enviados por SMS/email; teclado numérico e pedido de código de uso único.',
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
      <div style="contain: layout" class="nds-stack nds-min-h-20" data-spacing="sm">
        <label for="otp-six" class="nds-text-label">Código enviado por SMS</label>
        <InputOTP id="otp-six" :max-length="6" v-model="value"
                  autocomplete="one-time-code" inputmode="numeric">
          <template #default="{ slots }">
            <InputOTPGroup>
              <InputOTPSlot v-for="(slot, index) in slots" :key="index" :index="index" />
            </InputOTPGroup>
          </template>
        </InputOTP>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Seis caixas, teclado numérico', async () => {
      await expect(boxes(canvasElement)).toHaveLength(6);
      await expect(campo(canvasElement)).toHaveAttribute('inputmode', 'numeric');
    });

    await step('Letra não entra no modo numérico', async () => {
      const input = campo(canvasElement);
      input.focus();
      await userEvent.clear(input);
      await userEvent.type(input, 'a');
      await expect(input).toHaveValue('');
      await userEvent.type(input, '7');
      await waitFor(() => expect(texts(canvasElement)[0]).toBe('7'));
    });
  },
};

export const FourDigits: Story = {
  parameters: {
    docs: {
      // O comprimento é a variante inteira, e a do `meta` mostra seis caixas.
      source: { transform: inputOtpQuatroDigitosSource },
      description: {
        story: 'PIN de 4 dígitos — PINs locais (carteira, conta, app travado).',
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
      <div style="contain: layout" class="nds-stack nds-min-h-20" data-spacing="sm">
        <label for="otp-four" class="nds-text-label">PIN do aplicativo</label>
        <InputOTP id="otp-four" :max-length="4" v-model="value"
                  autocomplete="one-time-code" inputmode="numeric">
          <template #default="{ slots }">
            <InputOTPGroup>
              <InputOTPSlot v-for="(slot, index) in slots" :key="index" :index="index" />
            </InputOTPGroup>
          </template>
        </InputOTP>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O comprimento pedido chega ao componente', async () => {
      // Quatro e não seis: renderizar com o default passaria despercebido —
      // foi exatamente esse o defeito que deixou o campo sem caixa nenhuma.
      await expect(boxes(canvasElement)).toHaveLength(4);
    });

    await step('O quinto caractere não entra', async () => {
      const input = campo(canvasElement);
      input.focus();
      await userEvent.clear(input);
      await userEvent.type(input, '12345');
      await waitFor(() => expect(input).toHaveValue('1234'));
      await expect(texts(canvasElement).join('')).toBe('1234');
    });
  },
};

export const WithSeparator: Story = {
  parameters: {
    covers: ['accessibility.item4', 'visual.item5'],
    docs: {
      // Dois grupos e um separador: o miolo deixa de vir do escopo do slot e
      // passa a nomear índice por índice — o do `meta` esconderia a divisão.
      source: { transform: inputOtpWithSeparatorSource },
      description: {
        story:
          'Dois grupos de 3 caixas com um separador entre eles — formato xxx-xxx de códigos de recuperação.',
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
      <div style="contain: layout" class="nds-stack nds-min-h-20" data-spacing="sm">
        <label for="otp-sep" class="nds-text-label">Código de recuperação</label>
        <InputOTP id="otp-sep" :max-length="6" v-model="value"
                  autocomplete="one-time-code" inputmode="numeric">
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O separador tem papel próprio, não é enfeite escondido', async () => {
      const separadores = canvas.getAllByRole('separator');
      await expect(separadores).toHaveLength(1);
    });

    await step('O separador afasta os dois blocos, e só eles', async () => {
      // Efeito computado, não nome de classe: o respiro é margem do separador.
      const todas = boxes(canvasElement);
      const separador = canvasElement.querySelector<HTMLElement>(
        '[data-slot="input-otp-separator"]',
      )!;
      const folga = (a: Element, b: Element) =>
        Math.round(b.getBoundingClientRect().left - a.getBoundingClientRect().right);
      await expect(folga(todas[0], todas[1])).toBe(0);
      await expect(folga(todas[2], separador)).toBeGreaterThan(0);
      await expect(folga(separador, todas[3])).toBeGreaterThan(0);
    });

    await step('Os seis dígitos se distribuem entre os dois blocos', async () => {
      const input = campo(canvasElement);
      input.focus();
      await userEvent.clear(input);
      await userEvent.type(input, '123456');
      await waitFor(() => expect(texts(canvasElement).join('')).toBe('123456'));
    });
  },
};

export const Alphanumeric: Story = {
  parameters: {
    docs: {
      // O `pattern` é o que recusa o caractere fora do conjunto, e o teclado
      // muda junto: duas trocas que o snippet do `meta` não tem.
      source: { transform: inputOtpAlfanumericoSource },
      description: {
        story:
          'Conjunto alfanumérico e teclado de texto — códigos de autenticação que misturam letras e dígitos.',
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
      <div style="contain: layout" class="nds-stack nds-min-h-20" data-spacing="sm">
        <label for="otp-alpha" class="nds-text-label">Código de autenticação</label>
        <InputOTP id="otp-alpha" :max-length="6" :pattern="pattern" v-model="value"
                  autocomplete="one-time-code" inputmode="text">
          <template #default="{ slots }">
            <InputOTPGroup>
              <InputOTPSlot v-for="(slot, index) in slots" :key="index" :index="index" />
            </InputOTPGroup>
          </template>
        </InputOTP>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O teclado do dispositivo passa a ser de texto', async () => {
      await expect(campo(canvasElement)).toHaveAttribute('inputmode', 'text');
    });

    await step('Letra e dígito são aceitos', async () => {
      const input = campo(canvasElement);
      input.focus();
      await userEvent.clear(input);
      await userEvent.type(input, 'a9');
      await waitFor(() => expect(texts(canvasElement).slice(0, 2)).toEqual(['a', '9']));
    });
  },
};
