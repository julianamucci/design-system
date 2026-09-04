import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, userEvent, expect, waitFor } from 'storybook/test';
import InputOTPStory from './InputOTPStory.svelte';
import { field } from './input-otp.fixtures';
import { inputOtpWithSeparatorSource, inputOtpSource } from './input-otp.source';

const meta: Meta = {
  title: 'Components/Form/InputOTP/Variants',
  component: InputOTPStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo: comprimento, teclado e
      // padrão aceito saem dos args. Só o bloco partido muda a marcação.
      source: { transform: inputOtpSource },
      description: {
        component:
          'Variantes do InputOTP: SixDigits (padrão SMS), FourDigits (PIN), WithSeparator (3+3) e Alphanumeric (código de autenticação).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const boxes = (root: HTMLElement): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>('[data-slot="input-otp-slot"]'),
];

const texts = (root: HTMLElement): string[] =>
  boxes(root).map((c) => c.textContent?.trim() ?? '');

export const SixDigits: Story = {
  name: 'Six digits (SMS)',
  args: {
    maxLength: 6,
    inputmode: 'numeric',
    label: 'Código enviado por SMS',
    variant: 'sixDigits',
  },
  play: async ({ canvasElement, step }) => {
    await step('Seis caixas, teclado numérico', async () => {
      await expect(boxes(canvasElement)).toHaveLength(6);
      await expect(field(canvasElement)).toHaveAttribute('inputmode', 'numeric');
    });

    await step('Os seis dígitos aparecem nas caixas, um em cada', async () => {
      const input = field(canvasElement);
      input.focus();
      await userEvent.clear(input);
      await userEvent.type(input, '123456');
      await waitFor(() => expect(texts(canvasElement)).toEqual(['1', '2', '3', '4', '5', '6']));
    });
  },
};

export const FourDigits: Story = {
  name: 'Four digits (PIN)',
  args: {
    maxLength: 4,
    inputmode: 'numeric',
    label: 'PIN do aplicativo',
    variant: 'fourDigits',
  },
  play: async ({ canvasElement, step }) => {
    await step('O comprimento pedido chega ao componente', async () => {
      // Quatro e não seis: renderizar com o default passaria despercebido.
      await expect(boxes(canvasElement)).toHaveLength(4);
    });

    await step('O quinto caractere não entra', async () => {
      const input = field(canvasElement);
      input.focus();
      await userEvent.clear(input);
      await userEvent.type(input, '12345');
      await waitFor(() => expect(input).toHaveValue('1234'));
      await expect(texts(canvasElement).join('')).toBe('1234');
    });
  },
};

export const WithSeparator: Story = {
  name: 'With separator (3+3)',
  parameters: {
    covers: ['accessibility.item4', 'visual.item5'],
    docs: { source: { transform: inputOtpWithSeparatorSource } },
  },
  args: {
    maxLength: 6,
    inputmode: 'numeric',
    label: 'Código de recuperação',
    variant: 'withSeparator',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O separador tem papel próprio, não é enfeite escondido', async () => {
      // `role="separator"` é o que informa ao leitor que o código vem em dois
      // blocos de três — seis dígitos de enfiada são mais difíceis de conferir.
      const separadores = canvas.getAllByRole('separator');
      await expect(separadores).toHaveLength(1);
    });

    await step('O separador afasta os dois blocos, e só eles', async () => {
      // Efeito computado, não nome de classe: o respiro é margem do separador.
      const all = boxes(canvasElement);
      const separator = canvasElement.querySelector<HTMLElement>(
        '[data-slot="input-otp-separator"]',
      )!;
      const folga = (a: Element, b: Element) =>
        Math.round(b.getBoundingClientRect().left - a.getBoundingClientRect().right);
      await expect(folga(all[0], all[1])).toBe(0);
      await expect(folga(all[2], separator)).toBeGreaterThan(0);
      await expect(folga(separator, all[3])).toBeGreaterThan(0);
    });

    await step('Os seis dígitos se distribuem entre os dois blocos', async () => {
      const input = field(canvasElement);
      input.focus();
      await userEvent.clear(input);
      await userEvent.type(input, '123456');
      await waitFor(() => expect(texts(canvasElement).join('')).toBe('123456'));
    });
  },
};

export const Alphanumeric: Story = {
  args: {
    maxLength: 6,
    inputmode: 'text',
    pattern: '^[a-zA-Z0-9]+$',
    label: 'Código de autenticação',
    variant: 'alphanumeric',
  },
  play: async ({ canvasElement, step }) => {
    await step('O teclado do dispositivo passa a ser de texto', async () => {
      await expect(field(canvasElement)).toHaveAttribute('inputmode', 'text');
    });

    await step('Letra e dígito são aceitos', async () => {
      const input = field(canvasElement);
      input.focus();
      await userEvent.clear(input);
      await userEvent.type(input, 'a9');
      await waitFor(() => expect(texts(canvasElement).slice(0, 2)).toEqual(['a', '9']));
    });
  },
};
