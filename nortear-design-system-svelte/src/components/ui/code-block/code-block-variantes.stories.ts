import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { expect } from 'storybook/test';
import { CodeBlock } from './index';

/**
 * Os mesmos trechos da seção Variantes da docs page — uma linguagem por story.
 * O que cada play verifica é o núcleo do componente: a classificação de sintaxe
 * produziu tokens (`[data-token]`) para o trecho, e em `Text` não produziu
 * nenhum.
 */
const LANG_SCRIPT = `const total = items.length; // soma`;
const LANG_MARKUP = `<button class="nds-btn" :disabled="loading">Salvar</button>`;
const LANG_STYLES = `.nds-card { padding: var(--spacing-4); }`;
const LANG_DATA = `{ "port": 6006, "open": true }`;
const LANG_SHELL = `npm run build -- --mode production`;
const LANG_TEXT = `Sem classificação: monoespaçado e sem cor.`;

const meta = {
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      description: {
        component:
          'Uma story por linguagem reconhecida pela classificação de sintaxe: script, marcação, estilos, dados, shell e texto simples. Numeração desligada para manter o foco na cor.',
      },
    },
  },
  title: 'UI/CodeBlock/Variantes',
  component: CodeBlock,
  tags: ['display'],
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Script: Story = {
  args: { code: LANG_SCRIPT, language: 'tsx', showLineNumbers: false },
  play: async ({ canvasElement, step }) => {
    await step('O trecho de script recebeu classificação de sintaxe', async () => {
      const tokens = [...canvasElement.querySelectorAll('[data-token]')]
        .map((el) => el.getAttribute('data-token'))
        .filter((token) => token !== 'plain');
      await expect(tokens.length).toBeGreaterThan(0);
      await expect(canvasElement.querySelectorAll('.nds-code-block-line')).toHaveLength(1);
    });
  },
};

export const Markup: Story = {
  args: { code: LANG_MARKUP, language: 'vue', showLineNumbers: false },
  play: async ({ canvasElement, step }) => {
    await step('A marcação recebeu classificação de sintaxe', async () => {
      const tokens = [...canvasElement.querySelectorAll('[data-token]')]
        .map((el) => el.getAttribute('data-token'))
        .filter((token) => token !== 'plain');
      await expect(tokens.length).toBeGreaterThan(0);
      await expect(canvasElement.querySelectorAll('.nds-code-block-line')).toHaveLength(1);
    });
  },
};

export const Styles: Story = {
  args: { code: LANG_STYLES, language: 'css', showLineNumbers: false },
  play: async ({ canvasElement, step }) => {
    await step('A folha de estilo recebeu classificação de sintaxe', async () => {
      const tokens = [...canvasElement.querySelectorAll('[data-token]')]
        .map((el) => el.getAttribute('data-token'))
        .filter((token) => token !== 'plain');
      await expect(tokens.length).toBeGreaterThan(0);
      await expect(canvasElement.querySelectorAll('.nds-code-block-line')).toHaveLength(1);
    });
  },
};

export const Data: Story = {
  args: { code: LANG_DATA, language: 'json', showLineNumbers: false },
  play: async ({ canvasElement, step }) => {
    await step('Os dados estruturados receberam classificação de sintaxe', async () => {
      const tokens = [...canvasElement.querySelectorAll('[data-token]')]
        .map((el) => el.getAttribute('data-token'))
        .filter((token) => token !== 'plain');
      await expect(tokens.length).toBeGreaterThan(0);
      await expect(canvasElement.querySelectorAll('.nds-code-block-line')).toHaveLength(1);
    });
  },
};

export const Shell: Story = {
  args: { code: LANG_SHELL, language: 'bash', showLineNumbers: false },
  play: async ({ canvasElement, step }) => {
    await step('A linha de comando recebeu classificação de sintaxe', async () => {
      const tokens = [...canvasElement.querySelectorAll('[data-token]')]
        .map((el) => el.getAttribute('data-token'))
        .filter((token) => token !== 'plain');
      await expect(tokens.length).toBeGreaterThan(0);
      await expect(canvasElement.querySelectorAll('.nds-code-block-line')).toHaveLength(1);
    });
  },
};

export const Text: Story = {
  args: { code: LANG_TEXT, language: 'txt', showLineNumbers: false },
  play: async ({ canvasElement, step }) => {
    await step('Texto simples sai sem nenhum token colorido', async () => {
      await expect(canvasElement.querySelectorAll('[data-token]')).toHaveLength(0);
      await expect(canvasElement.querySelector('.nds-code-block-text')).toHaveTextContent(
        'Sem classificação',
      );
    });
  },
};
