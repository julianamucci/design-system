import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, userEvent, expect } from 'storybook/test';
import InputOTPStory from './InputOTPStory.svelte';
import { campo } from './input-otp.fixtures';
import {
  inputOtpComErroSource,
  inputOtpComReenvioSource,
  inputOtpComTextoDeApoioSource,
  inputOtpSource,
} from './input-otp.source';

const meta: Meta = {
  title: 'UI/InputOTP/Compositions',
  component: InputOTPStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; a de rótulo visível já é a
      // forma canônica, as demais sobrescrevem logo abaixo.
      source: { transform: inputOtpSource },
      description: {
        component:
          'Composicoes do InputOTP: WithLabel (rótulo visível associado), WithHelpText (origem + validade), WithErrorMessage (aria-describedby + aria-invalid) e WithResendButton (botão para reenviar o código).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const WithLabel: Story = {
  args: {
    maxLength: 6,
    label: 'Código de verificação',
    variant: 'withLabel',
  },
  play: async ({ canvasElement, step }) => {
    await step('O rótulo visível é o nome do campo', async () => {
      // `for`/`id` e não só texto na tela: é a ligação que faz o leitor
      // anunciar o rótulo ao entrar no campo.
      const rotulo = canvasElement.querySelector<HTMLLabelElement>('label[for]')!;
      await expect(rotulo.textContent?.trim()).toBe('Código de verificação');
      await expect(rotulo.htmlFor).toBe(campo(canvasElement).id);
    });
  },
};

export const WithHelpText: Story = {
  parameters: { docs: { source: { transform: inputOtpComTextoDeApoioSource } } },
  args: {
    maxLength: 6,
    label: 'Código de verificação',
    helpText: 'Enviamos por SMS, expira em 5 min.',
    variant: 'withHelpText',
  },
  play: async ({ canvasElement, step }) => {
    await step('A ajuda é lida junto com o campo', async () => {
      const descrito = campo(canvasElement).getAttribute('aria-describedby');
      await expect(descrito).toBeTruthy();
      await expect(canvasElement.querySelector(`#${descrito}`)?.textContent).toContain('SMS');
    });
  },
};

export const WithErrorMessage: Story = {
  parameters: { docs: { source: { transform: inputOtpComErroSource } } },
  args: {
    maxLength: 6,
    hasError: true,
    defaultValue: '482913',
    label: 'Código de verificação',
    errorMessage: 'Código incorreto. Verifique e tente novamente.',
    variant: 'withErrorMessage',
  },
  play: async ({ canvasElement, step }) => {
    await step('Causa e ação corretiva chegam pelo mesmo caminho do erro', async () => {
      const input = campo(canvasElement);
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      const descrito = input.getAttribute('aria-describedby');
      await expect(canvasElement.querySelector(`#${descrito}`)?.textContent).toContain(
        'tente novamente',
      );
    });
  },
};

export const WithResendButton: Story = {
  parameters: { docs: { source: { transform: inputOtpComReenvioSource } } },
  args: {
    maxLength: 6,
    label: 'Código de verificação',
    variant: 'withResendButton',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O reenvio é alcançável pelo teclado depois do campo', async () => {
      // O botão vem DEPOIS do campo na ordem do DOM: quem chega ao fim do
      // código encontra o reenvio no próximo Tab, sem voltar pelo caminho.
      campo(canvasElement).focus();
      await userEvent.tab();
      await expect(canvas.getByRole('button', { name: 'Reenviar código' })).toHaveFocus();
    });
  },
};
