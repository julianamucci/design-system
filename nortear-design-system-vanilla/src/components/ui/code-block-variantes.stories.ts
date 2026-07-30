import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createCodeBlock } from './code-block';
import { LANGUAGE_ITEMS } from '@/components/docs/CodeBlockDocs';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Uma story por linguagem classificada, com o mesmo trecho da seção Variantes
// da docs page — os literais vêm de lá (LANGUAGE_ITEMS), não copiados, para que
// story e documentação não possam divergir em silêncio.

const meta: Meta = {
  tags: ['display'],
  title: 'UI/CodeBlock/Variantes',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Linguagens suportadas pela classificação de sintaxe. Sem numeração: os trechos têm uma linha só.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Trecho e linguagem da seção Variantes, pela chave do item. */
function renderLanguage(key: string): () => HTMLElement {
  const item = LANGUAGE_ITEMS.find(i => i.key === key)!;
  return () =>
    createCodeBlock({
      code: item.code,
      language: item.language,
      showLineNumbers: false,
    });
}

/**
 * Spans classificados. `plain` não vira elemento — vira nó de texto —, então
 * qualquer `[data-token]` aqui é sintaxe reconhecida. É o núcleo do componente:
 * sem esta contagem, um tokenizador que devolvesse tudo `plain` passaria por
 * todos os outros testes.
 */
function classifiedTokens(canvasElement: HTMLElement): number {
  return canvasElement.querySelectorAll('[data-token]:not([data-token="plain"])').length;
}

/** Raiz do bloco renderizado pela story. */
function root(canvasElement: HTMLElement): HTMLElement {
  return canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Script: Story = {
  render: renderLanguage('script'),
  play: async ({ canvasElement, step }) => {
    await step('TypeScript recebe classificação de sintaxe', async () => {
      await expect(root(canvasElement)).toHaveAttribute('data-language', 'tsx');
      await expect(classifiedTokens(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Markup: Story = {
  render: renderLanguage('markup'),
  play: async ({ canvasElement, step }) => {
    await step('Marcação recebe classificação de sintaxe', async () => {
      await expect(root(canvasElement)).toHaveAttribute('data-language', 'vue');
      await expect(classifiedTokens(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Styles: Story = {
  render: renderLanguage('styles'),
  play: async ({ canvasElement, step }) => {
    await step('CSS recebe classificação de sintaxe', async () => {
      await expect(root(canvasElement)).toHaveAttribute('data-language', 'css');
      await expect(classifiedTokens(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Data: Story = {
  render: renderLanguage('data'),
  play: async ({ canvasElement, step }) => {
    await step('JSON recebe classificação de sintaxe', async () => {
      await expect(root(canvasElement)).toHaveAttribute('data-language', 'json');
      await expect(classifiedTokens(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Shell: Story = {
  render: renderLanguage('shell'),
  play: async ({ canvasElement, step }) => {
    await step('Linha de comando recebe classificação de sintaxe', async () => {
      await expect(root(canvasElement)).toHaveAttribute('data-language', 'bash');
      await expect(classifiedTokens(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Text: Story = {
  render: renderLanguage('text'),
  play: async ({ canvasElement, step }) => {
    await step('Texto simples não recebe nenhuma cor', async () => {
      // O contrário das outras cinco: aqui a ausência de token é o resultado
      // correto, e o trecho continua legível e copiável.
      await expect(root(canvasElement)).toHaveAttribute('data-language', 'text');
      await expect(classifiedTokens(canvasElement)).toBe(0);
    });
  },
};
