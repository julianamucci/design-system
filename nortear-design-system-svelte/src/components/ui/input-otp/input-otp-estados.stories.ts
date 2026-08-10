import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, expect, waitFor } from 'storybook/test';
import InputOTPStory from './InputOTPStory.svelte';

const meta: Meta = {
  title: 'UI/InputOTP/States',
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
};

export default meta;
type Story = StoryObj;

function findOtpInput(canvasElement: HTMLElement): HTMLInputElement {
  const input = canvasElement.querySelector(
    'input[autocomplete="one-time-code"]'
  ) as HTMLInputElement | null;
  if (!input) throw new Error('OTP input não encontrado');
  return input;
}

export const Empty: Story = {
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

export const Filling: Story = {
  name: 'Filling (3 of 6)',
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

export const Complete: Story = {
  name: 'Complete (6 digits)',
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

export const Disabled: Story = {
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

export const Error: Story = {
  name: 'Error (aria-invalid)',
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
