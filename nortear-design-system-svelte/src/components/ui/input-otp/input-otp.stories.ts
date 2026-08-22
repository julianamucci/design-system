import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, expect, fn, waitFor } from 'storybook/test';
import InputOTPStory from './InputOTPStory.svelte';
import InputOTPDocs from '@/components/docs/InputOTPDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { campo } from './input-otp.fixtures';
import { inputOtpSource } from './input-otp.source';

const meta: Meta = {
  title: 'UI/InputOTP',
  component: InputOTPStory,
  tags: ['autodocs', 'form'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(InputOTPDocs),
      source: { transform: inputOtpSource },
      description: {
        component:
          'Campo de código de verificação (OTP/PIN) com uma caixa por dígito. Renderiza um input real recortado por trás das caixas e distribui nelas o que for digitado ou colado, com pedido de código de uso único ao sistema e suporte a colar.',
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
    hasError: {
      control: 'boolean',
      description: 'Marca o campo com aria-invalid e pinta a borda de erro.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    inputmode: {
      control: 'inline-radio',
      options: ['numeric', 'text'],
      description: 'Teclado oferecido pelo dispositivo.',
      table: { type: { summary: "'numeric' | 'text'" }, defaultValue: { summary: 'numeric' } },
    },
    defaultValue: {
      control: 'text',
      description: 'Valor inicial do código.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "''" } },
    },
    label: {
      control: 'text',
      description: 'Rótulo visível, associado ao campo — é o que o leitor anuncia ao focar.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'Código de verificação' } },
    },
    variant: {
      // Andaime da story, não API do componente: escolhe qual composição o
      // arquivo monta. Sem control ativo para não sugerir uma prop que o
      // InputOTP não tem.
      control: false,
      description: 'Composição montada pela story (andaime, não é prop do componente).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'default' } },
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
    onComplete: fn(),
    maxLength: 6,
    disabled: false,
    autoFocus: false,
    hasError: false,
    inputmode: 'numeric',
    defaultValue: '',
    label: 'Código de verificação',
    variant: 'default',
  },
};

export default meta;
type Story = StoryObj;

const caixas = (raiz: HTMLElement): HTMLElement[] => [
  ...raiz.querySelectorAll<HTMLElement>('[data-slot="input-otp-slot"]'),
];

const textos = (raiz: HTMLElement): string[] =>
  caixas(raiz).map((c) => c.textContent?.trim() ?? '');

const boxAtiva = (raiz: HTMLElement): number =>
  caixas(raiz).findIndex(
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
  play: async ({ canvasElement, step, args }) => {
    const total = (args.maxLength as number) ?? 6;
    const input = campo(canvasElement);

    await step('O campo tem nome e uma caixa por dígito', async () => {
      const rotulo = canvasElement.querySelector<HTMLLabelElement>('label[for]')!;
      await expect(rotulo.htmlFor).toBe(input.id);
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
      await expect(boxAtiva(canvasElement)).toBe(2);
    });

    await step('Setas movem o cursor sem alterar o valor', async () => {
      await userEvent.keyboard('{ArrowLeft}');
      await waitFor(() => expect(boxAtiva(canvasElement)).toBe(1));
      await expect(input).toHaveValue('12');
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(boxAtiva(canvasElement)).toBe(2));
    });

    await step('Backspace apaga a última caixa preenchida', async () => {
      await userEvent.keyboard('{Backspace}');
      await waitFor(() => expect(input).toHaveValue('1'));
      await expect(textos(canvasElement)[1]).toBe('');
    });

    await step('Colar distribui o código inteiro e dispara onComplete', async () => {
      const codigo = '123456'.slice(0, total);
      input.focus();
      await userEvent.clear(input);
      await userEvent.paste(codigo);
      await waitFor(() => expect(textos(canvasElement).join('')).toBe(codigo));
      await expect(args.onComplete).toHaveBeenCalledWith(codigo);
    });
  },
};
