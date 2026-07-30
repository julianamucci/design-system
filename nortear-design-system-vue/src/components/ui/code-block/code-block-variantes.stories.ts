import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { CodeBlock } from './index';

/**
 * Uma story por linguagem classificada, com os mesmos literais da seção
 * "Variantes" da docs page.
 *
 * O que cada play verifica é o núcleo do componente: a tokenização. Um span só
 * ganha `data-token` quando o token é diferente de `plain` — então a presença do
 * atributo já é a prova de que a sintaxe foi classificada, e a ausência dele em
 * `Text` é a prova de que texto simples continua sem cor.
 */
const meta = {
  title: 'UI/CodeBlock/Variantes',
  component: CodeBlock,
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
  args: { showLineNumbers: false },
  render: (args) => ({
    components: { CodeBlock },
    setup() { return { args }; },
    template: '<CodeBlock v-bind="args" />',
  }),
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Script: Story = {
  args: { code: 'const total = items.length; // soma', language: 'tsx' },
  play: async ({ canvasElement, step }) => {
    await step('A sintaxe do script é classificada', async () => {
      const tokens = [...canvasElement.querySelectorAll('[data-token]')]
        .map((el) => el.getAttribute('data-token'));
      await expect(tokens.length).toBeGreaterThan(0);
      await expect(tokens).not.toContain('plain');
    });
  },
};

export const Markup: Story = {
  args: {
    code: '<button class="nds-btn" :disabled="loading">Salvar</button>',
    language: 'vue',
  },
  play: async ({ canvasElement, step }) => {
    await step('A sintaxe do markup é classificada', async () => {
      const tokens = [...canvasElement.querySelectorAll('[data-token]')]
        .map((el) => el.getAttribute('data-token'));
      await expect(tokens.length).toBeGreaterThan(0);
      await expect(tokens).not.toContain('plain');
    });
  },
};

export const Styles: Story = {
  args: { code: '.nds-card { padding: var(--spacing-4); }', language: 'css' },
  play: async ({ canvasElement, step }) => {
    await step('A sintaxe do CSS é classificada', async () => {
      const tokens = [...canvasElement.querySelectorAll('[data-token]')]
        .map((el) => el.getAttribute('data-token'));
      await expect(tokens.length).toBeGreaterThan(0);
      await expect(tokens).not.toContain('plain');
    });
  },
};

export const Data: Story = {
  args: { code: '{ "port": 6006, "open": true }', language: 'json' },
  play: async ({ canvasElement, step }) => {
    await step('A sintaxe dos dados é classificada', async () => {
      const tokens = [...canvasElement.querySelectorAll('[data-token]')]
        .map((el) => el.getAttribute('data-token'));
      await expect(tokens.length).toBeGreaterThan(0);
      await expect(tokens).not.toContain('plain');
    });
  },
};

export const Shell: Story = {
  args: { code: 'npm run build -- --mode production', language: 'bash' },
  play: async ({ canvasElement, step }) => {
    await step('A sintaxe do comando é classificada', async () => {
      const tokens = [...canvasElement.querySelectorAll('[data-token]')]
        .map((el) => el.getAttribute('data-token'));
      await expect(tokens.length).toBeGreaterThan(0);
      await expect(tokens).not.toContain('plain');
    });
  },
};

export const Text: Story = {
  args: { code: 'Sem classificação: monoespaçado e sem cor.', language: 'txt' },
  play: async ({ canvasElement, step }) => {
    await step('Texto simples não recebe nenhum token', async () => {
      await expect(canvasElement.querySelectorAll('[data-token]')).toHaveLength(0);
      await expect(canvasElement.querySelectorAll('.nds-code-block-line')).toHaveLength(1);
    });
  },
};
