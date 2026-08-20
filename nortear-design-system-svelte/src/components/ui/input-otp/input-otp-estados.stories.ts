import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, expect } from 'storybook/test';
import { razao, resolverCor } from '@shared/testing/cor';
import InputOTPStory from './InputOTPStory.svelte';
import { campo } from './input-otp.fixtures';
import { inputOtpComErroSource, inputOtpSource } from './input-otp.source';

const meta: Meta = {
  title: 'UI/InputOTP/States',
  component: InputOTPStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo: vazio, preenchendo,
      // completo e desabilitado só mudam args. O erro traz mensagem junto.
      source: { transform: inputOtpSource },
      description: {
        component:
          'Estados canônicos do InputOTP: Vazio, Preenchendo (3 de 6), Completo (6 de 6), Desabilitado e Erro.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const caixas = (raiz: HTMLElement): HTMLElement[] => [
  ...raiz.querySelectorAll<HTMLElement>('[data-slot="input-otp-slot"]'),
];

const textos = (raiz: HTMLElement): string[] =>
  caixas(raiz).map((c) => c.textContent?.trim() ?? '');

export const Empty: Story = {
  parameters: { covers: ['visual.item1'] },
  args: {
    maxLength: 6,
    defaultValue: '',
    autoFocus: true,
    label: 'Código de verificação',
  },
  play: async ({ canvasElement, step }) => {
    await step('Nasce vazio com o campo pronto para receber', async () => {
      await expect(caixas(canvasElement)).toHaveLength(6);
      await expect(textos(canvasElement).join('')).toBe('');
      await expect(campo(canvasElement)).toHaveFocus();
    });
  },
};

export const Filling: Story = {
  name: 'Filling (3 of 6)',
  parameters: { covers: ['visual.item2', 'accessibility.item6'] },
  args: {
    maxLength: 6,
    defaultValue: '123',
    label: 'Código de verificação',
  },
  play: async ({ canvasElement, step }) => {
    await step('O valor inicial se distribui da esquerda para a direita', async () => {
      await expect(textos(canvasElement)).toEqual(['1', '2', '3', '', '', '']);
    });

    await step('O dígito tem contraste suficiente contra a caixa', async () => {
      // Uma caixa pequena com um caractere só: se o contraste cair, não há
      // palavra em volta para compensar pelo contexto. Conta WCAG do colhedor
      // compartilhado, não olhômetro nem nome de token.
      const cs = getComputedStyle(caixas(canvasElement)[0]);
      const medida = razao(cs.color, cs.backgroundColor);
      await expect(medida?.razao ?? 0).toBeGreaterThanOrEqual(4.5);
    });
  },
};

export const Complete: Story = {
  name: 'Complete (6 digits)',
  parameters: { covers: ['visual.item3'] },
  args: {
    maxLength: 6,
    defaultValue: '482913',
    label: 'Código de verificação',
  },
  play: async ({ canvasElement, step }) => {
    await step('Todas as caixas preenchidas, na ordem do código', async () => {
      await expect(textos(canvasElement).join('')).toBe('482913');
    });
  },
};

export const Disabled: Story = {
  parameters: { covers: ['functional.item6'] },
  args: {
    maxLength: 6,
    disabled: true,
    defaultValue: '4829',
    label: 'Código de verificação',
  },
  play: async ({ canvasElement, step }) => {
    await step('O campo não aceita foco nem digitação', async () => {
      const input = campo(canvasElement);
      await expect(input).toBeDisabled();
      await userEvent.click(input);
      await expect(input).not.toHaveFocus();
      await expect(textos(canvasElement).join('')).toBe('4829');
    });

    await step('O bloqueio também se vê', async () => {
      // Efeito computado: a folha esmaece o campo inteiro. Medir a opacidade é
      // o que prova que a cascata chegou — nome de classe não prova nada.
      const container = canvasElement.querySelector<HTMLElement>('.nds-input-otp-container')!;
      await expect(Number(getComputedStyle(container).opacity)).toBeLessThan(1);
    });
  },
};

export const Error: Story = {
  name: 'Error (aria-invalid)',
  parameters: {
    covers: ['functional.item7', 'accessibility.item5', 'visual.item4'],
    docs: { source: { transform: inputOtpComErroSource } },
  },
  args: {
    maxLength: 6,
    hasError: true,
    defaultValue: '482913',
    label: 'Código de verificação',
    errorMessage: 'Código incorreto. Verifique e tente novamente.',
    variant: 'withErrorMessage',
  },
  play: async ({ canvasElement, step }) => {
    await step('O erro é anunciado por ARIA, não só pela borda', async () => {
      await expect(campo(canvasElement)).toHaveAttribute('aria-invalid', 'true');
    });

    await step('A mensagem de erro está ligada ao campo', async () => {
      const descrito = campo(canvasElement).getAttribute('aria-describedby');
      await expect(descrito).toBeTruthy();
      await expect(canvasElement.querySelector(`#${descrito}`)?.textContent).toContain(
        'tente novamente',
      );
    });

    await step('A borda da caixa é a cor de erro do tema', async () => {
      // Aqui a comparação não é contra uma segunda instância (o andaime desta
      // stack monta uma por story): a cor de erro é resolvida PELO NAVEGADOR a
      // partir do token, dentro da mesma árvore, e comparada com a computada.
      // Continua podendo falhar — se a regra sumir, a borda volta a `--input`.
      const esperada = resolverCor(canvasElement, 'hsl(var(--destructive))');
      const medida = getComputedStyle(caixas(canvasElement)[0]).borderTopColor;
      await expect(medida).toBe(esperada);
    });
  },
};
