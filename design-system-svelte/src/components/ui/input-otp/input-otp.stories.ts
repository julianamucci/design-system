import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import InputOTPStory from './InputOTPStory.svelte';
import InputOTPDocs from '@/components/docs/InputOTPDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/InputOTP',
  component: InputOTPStory,
  tags: ['autodocs', 'form'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(InputOTPDocs),
      description: {
        component:
          'InputOTP construído sobre bits-ui/PinInput. Campo de código de verificação (OTP/PIN) com slots individuais, autofill SMS via autoComplete=one-time-code e suporte a paste.',
      },
    },
  },
  argTypes: {
    maxLength: {
      control: { type: 'number', min: 4, max: 8, step: 1 },
      description: 'Número total de slots/caracteres do código.',
    },
    disabled: {
      control: 'boolean',
      description: 'Bloqueia interação e aplica opacity-50.',
    },
    autoFocus: {
      control: 'boolean',
      description: 'Foca o primeiro slot automaticamente ao montar.',
    },
    hasError: {
      control: 'boolean',
      description: 'Aplica aria-invalid=true e estilo de erro.',
    },
    inputmode: {
      control: 'inline-radio',
      options: ['numeric', 'text'],
      description: 'inputMode do input interno.',
    },
    defaultValue: {
      control: 'text',
      description: 'Valor inicial do código.',
    },
  },
  args: {
    maxLength: 6,
    disabled: false,
    autoFocus: false,
    hasError: false,
    inputmode: 'numeric',
    defaultValue: '',
    label: 'Código de verificação',
    variant: 'default',
  },
} satisfies Meta<typeof InputOTPStory>;

export default meta;
type Story = StoryObj<typeof meta>;

function findOtpInput(canvasElement: HTMLElement): HTMLInputElement {
  const input = canvasElement.querySelector(
    'input[autocomplete="one-time-code"]'
  ) as HTMLInputElement | null;
  if (!input) throw new Error('OTP input não encontrado');
  return input;
}

export const Playground: Story = {
  play: async ({ canvasElement, step }) => {
    await step('Input renderiza com autocomplete=one-time-code', async () => {
      const input = findOtpInput(canvasElement);
      await expect(input).toBeTruthy();
      await expect(input).toHaveAttribute('autocomplete', 'one-time-code');
    });

    await step('Aceita digitação numérica', async () => {
      const input = findOtpInput(canvasElement);
      input.focus();
      await userEvent.type(input, '123456');
      await waitFor(() => expect(input).toHaveValue('123456'));
    });

    await step('Label associada via aria-label', async () => {
      const canvas = within(canvasElement);
      await expect(canvas.getByText(/código de verificação/i)).toBeInTheDocument();
    });
  },
};
