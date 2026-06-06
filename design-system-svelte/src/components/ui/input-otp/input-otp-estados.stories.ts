import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, expect, waitFor } from 'storybook/test';
import InputOTPStory from './InputOTPStory.svelte';

const meta = {
  title: 'UI/InputOTP/Estados',
  component: InputOTPStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do InputOTP: vazio, preenchendo, completo, desabilitado e erro (aria-invalid).',
      },
    },
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

export const Vazio: Story = {
  name: 'Vazio',
  args: {
    maxLength: 6,
    defaultValue: '',
    label: 'Código de verificação',
  },
  play: async ({ canvasElement }) => {
    const input = findOtpInput(canvasElement);
    await expect(input).toHaveValue('');
  },
};

export const Preenchendo: Story = {
  name: 'Preenchendo (3 de 6)',
  args: {
    maxLength: 6,
    defaultValue: '123',
    label: 'Código de verificação',
  },
  play: async ({ canvasElement }) => {
    const input = findOtpInput(canvasElement);
    await waitFor(() => expect(input).toHaveValue('123'));
  },
};

export const Completo: Story = {
  name: 'Completo (6 dígitos)',
  args: {
    maxLength: 6,
    defaultValue: '123456',
    label: 'Código de verificação',
  },
  play: async ({ canvasElement }) => {
    const input = findOtpInput(canvasElement);
    await waitFor(() => expect(input).toHaveValue('123456'));
  },
};

export const Desabilitado: Story = {
  name: 'Desabilitado',
  args: {
    maxLength: 6,
    disabled: true,
    defaultValue: '12',
    label: 'Código de verificação',
  },
  play: async ({ canvasElement }) => {
    const input = findOtpInput(canvasElement);
    await expect(input).toBeDisabled();
    // tentar digitar não deve alterar
    input.focus();
    await userEvent.type(input, '9');
    await waitFor(() => expect(input).toHaveValue('12'));
  },
};

export const Erro: Story = {
  name: 'Erro (aria-invalid)',
  args: {
    maxLength: 6,
    hasError: true,
    defaultValue: '123456',
    label: 'Código de verificação',
    errorMessage: 'Código incorreto. Verifique e tente novamente.',
    variant: 'withErrorMessage',
  },
  play: async ({ canvasElement }) => {
    const input = findOtpInput(canvasElement);
    await expect(input).toHaveAttribute('aria-invalid', 'true');
  },
};
