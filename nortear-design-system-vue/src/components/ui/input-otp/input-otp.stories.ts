import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, userEvent, expect, fn, waitFor } from 'storybook/test';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from './index';
import { campo } from './input-otp.fixtures';
import InputOTPDocs from '@/components/docs/InputOTPDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { inputOtpSource } from './input-otp.source';

const meta = {
  title: 'UI/InputOTP',
  component: InputOTP,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: {
      page: withAutoDocsTab(InputOTPDocs),
      source: { transform: inputOtpSource },
      description: {
        component:
          'Campo de código de verificação (OTP/PIN) com uma caixa por dígito. Renderiza um input real recortado por trás das caixas e distribui nelas o que for digitado ou colado. Suporta o pedido de código de uso único ao sistema, navegação por setas e Backspace.',
      },
    },
  },
  argTypes: {
    maxLength: {
      control: { type: 'number', min: 4, max: 8, step: 1 },
      description: 'Número total de slots/caracteres do código.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '6' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Bloqueia a interação e esmaece o campo.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    autoFocus: {
      control: 'boolean',
      description: 'Foca o campo automaticamente ao montar.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    onComplete: {
      control: false,
      description: 'Chamado quando todos os slots estão preenchidos.',
      table: {
        type: { summary: '(value: string) => void' },
        defaultValue: { summary: '—' },
      },
    },
  },
  args: {
    maxLength: 6,
    disabled: false,
    autoFocus: false,
    onComplete: fn(),
  },
} satisfies Meta<any>;

export default meta;
type Story = StoryObj<typeof meta>;

const caixas = (canvasElement: HTMLElement): HTMLElement[] => [
  ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="input-otp-slot"]'),
];

const textos = (canvasElement: HTMLElement): string[] =>
  caixas(canvasElement).map((c) => c.textContent?.trim() ?? '');

const caixaAtiva = (canvasElement: HTMLElement): number =>
  caixas(canvasElement).findIndex(
    (c) => c.hasAttribute('data-active') && c.getAttribute('data-active') !== 'false',
  );

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3',
      'functional.item4', 'functional.item5',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
    ],
  },
  render: (args) => ({
    components: { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot },
    setup() {
      const value = ref('');
      return { args, value };
    },
    template: `
      <div style="contain: layout" class="nds-stack nds-min-h-20" data-spacing="sm">
        <label for="otp-playground" class="nds-text-label">Código de verificação</label>
        <InputOTP
          :key="String(args.maxLength) + String(args.disabled) + String(args.autoFocus)"
          id="otp-playground"
          :max-length="args.maxLength"
          :disabled="args.disabled"
          :auto-focus="args.autoFocus"
          v-model="value"
          autocomplete="one-time-code"
          inputmode="numeric"
          @complete="args.onComplete"
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const total = (args.maxLength as number) ?? 6;
    const input = campo(canvasElement);

    await step('O campo tem nome e uma caixa por dígito', async () => {
      await expect(canvas.getByLabelText('Código de verificação')).toBe(input);
      await expect(caixas(canvasElement)).toHaveLength(total);
    });

    await step('O campo pede o código de uso único ao sistema', async () => {
      await expect(input).toHaveAttribute('autocomplete', 'one-time-code');
      await expect(input).toHaveAttribute('inputmode', 'numeric');
    });

    await step('Digitar preenche a caixa e move o cursor para a seguinte', async () => {
      // Precondição própria: o painel Interactions reexecuta a play no mesmo
      // DOM, e limpar antes é o que torna o passo repetível.
      input.focus();
      await userEvent.clear(input);
      await userEvent.type(input, '12');
      await waitFor(() => expect(textos(canvasElement).slice(0, 2)).toEqual(['1', '2']));
      await expect(caixaAtiva(canvasElement)).toBe(2);
    });

    await step('Setas movem o cursor sem alterar o valor', async () => {
      await userEvent.keyboard('{ArrowLeft}');
      await waitFor(() => expect(caixaAtiva(canvasElement)).toBe(1));
      await expect(input).toHaveValue('12');
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(caixaAtiva(canvasElement)).toBe(2));
    });

    await step('Backspace apaga a última caixa preenchida', async () => {
      await userEvent.keyboard('{Backspace}');
      await waitFor(() => expect(input).toHaveValue('1'));
      await expect(textos(canvasElement)[1]).toBe('');
    });

    await step('Colar distribui o código inteiro e dispara o evento de conclusão', async () => {
      const codigo = '123456'.slice(0, total);
      input.focus();
      await userEvent.clear(input);
      await userEvent.paste(codigo);
      await waitFor(() => expect(textos(canvasElement).join('')).toBe(codigo));
      await expect(args.onComplete).toHaveBeenCalledWith(codigo);
    });
  },
};
