import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from './index';
import InputOTPDocs from '@/components/docs/InputOTPDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/InputOTP',
  component: InputOTP,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: {
      page: withAutoDocsTab(InputOTPDocs),
      description: {
        component:
          'InputOTP (vue-input-otp) é um campo de código de verificação OTP/PIN com slots individuais. Renderiza um <input> real internamente (visualmente oculto via clip-path) e distribui caracteres digitados/colados nos slots. Suporta autoComplete one-time-code para autofill SMS, paste, navegação por setas e Backspace.',
      },
    },
  },
  argTypes: {
    maxLength: {
      control: { type: 'number', min: 1, max: 12, step: 1 },
      description: 'Total de slots/caracteres do código.',
    },
    disabled: {
      control: 'boolean',
      description: 'Bloqueia interação e aplica opacity-50.',
    },
    autoFocus: {
      control: 'boolean',
      description: 'Foca o primeiro slot automaticamente ao montar.',
    },
  },
  args: {
    maxLength: 6,
    disabled: false,
    autoFocus: false,
  },
} satisfies Meta<any>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    components: { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot },
    setup() {
      const value = ref('');
      return { args, value };
    },
    template: `
      <div style="contain: layout; min-height: 80px;" class="flex items-center justify-center">
        <InputOTP
          :key="String(args.maxLength) + String(args.disabled) + String(args.autoFocus)"
          :max-length="args.maxLength"
          :disabled="args.disabled"
          :auto-focus="args.autoFocus"
          v-model="value"
          autocomplete="one-time-code"
          inputmode="numeric"
          aria-label="Código de verificação"
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('1. Input interno renderizado com aria-label', async () => {
      const input = await waitFor(() =>
        canvas.getByLabelText(/código de verificação/i),
      );
      await expect(input).toBeInTheDocument();
    });

    await step('2. Digitar caracteres distribui pelos slots', async () => {
      const input = canvas.getByLabelText(/código de verificação/i);
      await userEvent.click(input);
      await userEvent.type(input, '123');
      await waitFor(() => expect((input as HTMLInputElement).value).toBe('123'));
    });

    await step('3. Backspace limpa o último slot', async () => {
      const input = canvas.getByLabelText(/código de verificação/i);
      await userEvent.type(input, '{Backspace}');
      await waitFor(() => expect((input as HTMLInputElement).value).toBe('12'));
    });
  },
};
