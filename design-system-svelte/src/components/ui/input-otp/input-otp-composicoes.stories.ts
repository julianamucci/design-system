import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import InputOTPStory from './InputOTPStory.svelte';

const meta = {
  title: 'UI/InputOTP/Composicoes',
  component: InputOTPStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes do InputOTP: com label, com texto de ajuda, com mensagem de erro e com botão reenviar.',
      },
    },
  },
} satisfies Meta<typeof InputOTPStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComLabel: Story = {
  name: 'Com Label',
  args: {
    maxLength: 6,
    label: 'Código de verificação',
    variant: 'withLabel',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Código de verificação')).toBeInTheDocument();
  },
};

export const ComHelpText: Story = {
  name: 'Com Help Text',
  args: {
    maxLength: 6,
    label: 'Código de verificação',
    helpText: 'Enviamos por SMS, expira em 5 min',
    variant: 'withHelpText',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/enviamos por sms/i)).toBeInTheDocument();
  },
};

export const ComErrorMessage: Story = {
  name: 'Com Error Message',
  args: {
    maxLength: 6,
    hasError: true,
    defaultValue: '999999',
    label: 'Código de verificação',
    errorMessage: 'Código incorreto. Verifique e tente novamente.',
    variant: 'withErrorMessage',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/código incorreto/i)).toBeInTheDocument();
    const input = canvasElement.querySelector(
      'input[autocomplete="one-time-code"]'
    ) as HTMLInputElement;
    await expect(input).toHaveAttribute('aria-invalid', 'true');
  },
};

export const ComResendButton: Story = {
  name: 'Com Resend Button',
  args: {
    maxLength: 6,
    label: 'Código de verificação',
    variant: 'withResendButton',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('button', { name: /reenviar código/i })
    ).toBeInTheDocument();
  },
};
