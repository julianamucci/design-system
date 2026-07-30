import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createCodeBlock } from './code-block';
import { COMPOSITION_CODE } from '@/components/docs/CodeBlockDocs';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os quatro arranjos da seção Composições da docs page, sobre o mesmo trecho
// base: o que muda entre eles é só a opção passada à factory.

const meta: Meta = {
  tags: ['display'],
  title: 'UI/CodeBlock/Composicoes',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Arranjos canônicos: rótulo no header, sem numeração, com linhas em destaque e com rodapé.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const root = (canvasElement: HTMLElement): HTMLElement =>
  canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const ComRotulo: Story = {
  render: () =>
    createCodeBlock({ code: COMPOSITION_CODE, language: 'ts', title: 'lista.ts' }),
  play: async ({ canvasElement, step }) => {
    await step('O header mostra o nome do arquivo ao lado da ação de copiar', async () => {
      const title = root(canvasElement).querySelector('.nds-code-block-title')!;
      await expect(title).toBeVisible();
      await expect(title).toHaveTextContent('lista.ts');
      await expect(root(canvasElement).querySelector('[data-slot="code-block-copy"]')).toBeVisible();
    });
  },
};

export const SemNumeracao: Story = {
  render: () =>
    createCodeBlock({ code: COMPOSITION_CODE, language: 'ts', showLineNumbers: false }),
  play: async ({ canvasElement, step }) => {
    await step('A coluna de numeração some', async () => {
      await expect(root(canvasElement)).toHaveAttribute('data-numbered', 'false');
      // O gutter permanece no DOM — aria-hidden e não selecionável; quem o
      // remove da tela é o CSS, via data-numbered.
      await expect(root(canvasElement).querySelector('.nds-code-block-gutter')).not.toBeVisible();
    });
  },
};

export const ComDestaque: Story = {
  render: () =>
    createCodeBlock({ code: COMPOSITION_CODE, language: 'ts', highlightLines: [2] }),
  play: async ({ canvasElement, step }) => {
    await step('Só a linha pedida fica marcada', async () => {
      const marked = root(canvasElement).querySelectorAll('[data-highlighted="true"]');
      await expect(marked).toHaveLength(1);
      await expect(marked[0]).toHaveTextContent('const total = items.length;');
    });
  },
};

export const ComRodape: Story = {
  render: () =>
    createCodeBlock({
      code: COMPOSITION_CODE,
      language: 'ts',
      footer: 'A ação de copiar leva apenas o código.',
    }),
  play: async ({ canvasElement, step }) => {
    await step('O rodapé aparece abaixo do código', async () => {
      const footer = root(canvasElement).querySelector('.nds-code-block-footer')!;
      await expect(footer).toBeVisible();
      await expect(footer).toHaveTextContent('A ação de copiar leva apenas o código.');
    });
  },
};
