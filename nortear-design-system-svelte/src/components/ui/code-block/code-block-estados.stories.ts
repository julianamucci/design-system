import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import { CodeBlock } from './index';

/** Mesmo trecho base da seção Composições da docs page. */
const BASE_CODE = `const items = await load();
const total = items.length;
render(items, total);`;

/** Longo nas duas direções: força barra horizontal e vertical ao mesmo tempo. */
const LONG_CODE = Array.from({ length: 40 }, (_, i) => {
  const campos = Array.from({ length: 12 }, (_, j) => `campoBastanteDescritivo${j}: true`).join(', ');
  return `const registro${i} = await repositorio.buscarPorIdentificadorCompletoComRelacionamentos(${i}, { ${campos} });`;
}).join('\n');

const meta: Meta = {
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      description: {
        component:
          'Configurações do bloco: numeração ligada e desligada, confirmação de cópia, rolagem nos dois eixos e linguagem não reconhecida.',
      },
    },
  },
  title: 'UI/CodeBlock/Estados',
  component: CodeBlock,
  tags: ['display'],
};

export default meta;
type Story = StoryObj;

export const ComNumeracao: Story = {
  args: { code: BASE_CODE, language: 'ts', showLineNumbers: true },
  play: async ({ canvasElement, step }) => {
    await step('A raiz registra a numeração e o gutter aparece', async () => {
      const root = canvasElement.querySelector('[data-slot="code-block"]');
      await expect(root).toHaveAttribute('data-numbered', 'true');
      await expect(canvasElement.querySelectorAll('.nds-code-block-gutter')).toHaveLength(
        BASE_CODE.split('\n').length,
      );
      await expect(canvasElement.querySelector('.nds-code-block-gutter')).toBeVisible();
    });
  },
};

export const SemNumeracao: Story = {
  args: { code: BASE_CODE, language: 'ts', showLineNumbers: false },
  play: async ({ canvasElement, step }) => {
    await step('A raiz registra a ausência de numeração e o gutter some', async () => {
      const root = canvasElement.querySelector('[data-slot="code-block"]');
      await expect(root).toHaveAttribute('data-numbered', 'false');
      // O gutter continua no DOM (aria-hidden) e é o data-numbered que o oculta.
      await expect(canvasElement.querySelector('.nds-code-block-gutter')).not.toBeVisible();
    });
  },
};

export const Copiado: Story = {
  args: { code: BASE_CODE, language: 'ts', showLineNumbers: false },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    // O clipboard real rejeita por permissão no browser de teste; o que
    // interessa aqui é o feedback, não a API do browser.
    const writeText = fn((text: string) => Promise.resolve(text));
    const original = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    try {
      await step('Copiar anuncia a confirmação por aria-live', async () => {
        await userEvent.click(canvas.getByRole('button', { name: /copiar código/i }));
        const status = canvasElement.querySelector('[role="status"]');
        await expect(status).toHaveAttribute('aria-live', 'polite');
        await waitFor(() => expect(status).toHaveTextContent('Copiado!'));
      });

      await step('Um ícone por vez dentro do botão', async () => {
        const button = canvasElement.querySelector('[data-slot="code-block-copy"]');
        await expect(button?.querySelectorAll('svg')).toHaveLength(1);
      });
    } finally {
      Object.defineProperty(navigator, 'clipboard', { value: original, configurable: true });
    }
  },
};

export const ScrollDuplo: Story = {
  args: { code: LONG_CODE, language: 'ts', showLineNumbers: true },
  play: async ({ canvasElement, step }) => {
    await step('A região rolável é alcançável por teclado e rola na horizontal', async () => {
      const scroll = canvasElement.querySelector<HTMLElement>('.nds-code-block-scroll')!;
      await expect(scroll).toHaveAttribute('tabindex', '0');
      await waitFor(() => expect(scroll.scrollWidth).toBeGreaterThan(scroll.clientWidth));
    });
  },
};

export const LinguagemDesconhecida: Story = {
  args: { code: BASE_CODE, language: 'cobol', showLineNumbers: false },
  play: async ({ canvasElement, step }) => {
    await step('Linguagem não reconhecida cai em texto simples sem quebrar o bloco', async () => {
      await expect(canvasElement.querySelectorAll('[data-token]')).toHaveLength(0);
      await expect(canvasElement.querySelectorAll('.nds-code-block-line')).toHaveLength(
        BASE_CODE.split('\n').length,
      );
    });
  },
};
