import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, expect, waitFor } from 'storybook/test';
import InputOTPStory from './InputOTPStory.svelte';

const meta = {
  title: 'UI/InputOTP/Variantes',
  component: InputOTPStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do InputOTP: SeisDigitos (default SMS), QuatroDigitos (PIN), ComSeparator (3+3) e Alfanumerico.',
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

export const SeisDigitos: Story = {
  name: '6 dígitos (padrão SMS)',
  args: {
    maxLength: 6,
    inputmode: 'numeric',
    label: 'Código de 6 dígitos',
    variant: 'sixDigits',
  },
  play: async ({ canvasElement, step }) => {
    await step('Aceita 6 dígitos numéricos', async () => {
      const input = findOtpInput(canvasElement);
      input.focus();
      await userEvent.type(input, '123456');
      await waitFor(() => expect(input).toHaveValue('123456'));
    });
  },
};

export const QuatroDigitos: Story = {
  name: '4 dígitos (PIN)',
  args: {
    maxLength: 4,
    inputmode: 'numeric',
    label: 'PIN de 4 dígitos',
    variant: 'fourDigits',
  },
  play: async ({ canvasElement, step }) => {
    await step('Aceita 4 dígitos', async () => {
      const input = findOtpInput(canvasElement);
      input.focus();
      await userEvent.type(input, '1234');
      await waitFor(() => expect(input).toHaveValue('1234'));
    });
  },
};

export const ComSeparator: Story = {
  name: 'Com Separator (3+3)',
  args: {
    maxLength: 6,
    inputmode: 'numeric',
    label: 'Código com separator',
    variant: 'withSeparator',
  },
  play: async ({ canvasElement, step }) => {
    await step('Separator possui role=separator', async () => {
      const sep = canvasElement.querySelector('[role="separator"]');
      await expect(sep).toBeTruthy();
    });
    await step('Aceita 6 dígitos distribuídos', async () => {
      const input = findOtpInput(canvasElement);
      input.focus();
      await userEvent.type(input, '123456');
      await waitFor(() => expect(input).toHaveValue('123456'));
    });
  },
};

export const Alfanumerico: Story = {
  name: 'Alfanumérico',
  args: {
    maxLength: 6,
    inputmode: 'text',
    pattern: '^[a-zA-Z0-9]+$',
    label: 'Código alfanumérico',
    variant: 'alphanumeric',
  },
  play: async ({ canvasElement, step }) => {
    await step('Aceita caracteres alfanuméricos', async () => {
      const input = findOtpInput(canvasElement);
      input.focus();
      await userEvent.type(input, 'AB12CD');
      await waitFor(() => {
        const v = input.value;
        expect(v.length).toBeGreaterThan(0);
      });
    });
  },
};
