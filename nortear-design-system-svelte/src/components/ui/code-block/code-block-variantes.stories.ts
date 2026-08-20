import type { Meta, StoryObj } from '@storybook/svelte-vite';
import type { ComponentProps } from 'svelte';
import { expect } from 'storybook/test';
import { CodeBlock } from './index';
import CodeBlockPaletaStory from './CodeBlockPaletaStory.svelte';
import { MINIMO_DE_CONTRASTE, laudoDeContraste } from '@shared/testing/code-block-probe';
import { codeBlockPaletaSource, codeBlockSource } from './code-block.source';

/**
 * "Variantes" aqui são as linguagens suportadas — o componente não tem variantes
 * de estilo. Os literais são os mesmos da seção Variantes da docs page.
 */
const LANG_SCRIPT = `const total = items.length; // soma`;
const LANG_MARKUP = `<button class="nds-button" :disabled="loading">Salvar</button>`;
const LANG_STYLES = `.nds-card { padding: var(--spacing-4); }`;
const LANG_DATA = `{ "port": 6008, "open": true }`;
const LANG_SHELL = `npm run build -- --mode production`;
const LANG_TEXT = `Sem classificação: monoespaçado e sem cor.`;

/** Trecho base do destaque nas stories de paleta. */
const PALETA_CODE = `const items = await load();
const total = items.length;
render(items, total);`;

const rootOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;

/**
 * Spans classificados. `plain` não vira elemento — vira nó de texto —, então
 * qualquer `[data-token]` aqui é sintaxe reconhecida. É o núcleo do componente:
 * sem esta contagem, um tokenizador que devolvesse tudo `plain` passaria por
 * todos os outros testes.
 */
const tokensClassificados = (canvasElement: HTMLElement) =>
  canvasElement.querySelectorAll('[data-token]:not([data-token="plain"])').length;

const meta: Meta = {
  title: 'UI/CodeBlock/Variants',
  component: CodeBlock,
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      // Cascateia para todas as stories do arquivo; as duas de paleta
      // sobrescrevem com a própria composição logo abaixo.
      source: { transform: codeBlockSource },
      description: {
        component:
          'Linguagens suportadas pela classificação de sintaxe. Sem numeração: os trechos têm uma linha só.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Script: Story = {
  parameters: { covers: ['visual.item2'] },
  args: { code: LANG_SCRIPT, language: 'tsx', showLineNumbers: false },
  play: async ({ canvasElement, step }) => {
    await step('A sintaxe do script é classificada', async () => {
      await expect(rootOf(canvasElement)).toHaveAttribute('data-language', 'tsx');
      await expect(tokensClassificados(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Markup: Story = {
  parameters: { covers: ['visual.item2'] },
  args: { code: LANG_MARKUP, language: 'vue', showLineNumbers: false },
  play: async ({ canvasElement, step }) => {
    await step('A sintaxe do markup é classificada', async () => {
      await expect(rootOf(canvasElement)).toHaveAttribute('data-language', 'vue');
      await expect(tokensClassificados(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Styles: Story = {
  parameters: { covers: ['visual.item2'] },
  args: { code: LANG_STYLES, language: 'css', showLineNumbers: false },
  play: async ({ canvasElement, step }) => {
    await step('A sintaxe do CSS é classificada', async () => {
      await expect(rootOf(canvasElement)).toHaveAttribute('data-language', 'css');
      await expect(tokensClassificados(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Date: Story = {
  parameters: { covers: ['visual.item2'] },
  args: { code: LANG_DATA, language: 'json', showLineNumbers: false },
  play: async ({ canvasElement, step }) => {
    await step('A sintaxe dos dados é classificada', async () => {
      await expect(rootOf(canvasElement)).toHaveAttribute('data-language', 'json');
      await expect(tokensClassificados(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Shell: Story = {
  parameters: { covers: ['visual.item2'] },
  args: { code: LANG_SHELL, language: 'bash', showLineNumbers: false },
  play: async ({ canvasElement, step }) => {
    await step('A sintaxe do comando é classificada', async () => {
      await expect(rootOf(canvasElement)).toHaveAttribute('data-language', 'bash');
      await expect(tokensClassificados(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Text: Story = {
  parameters: { covers: ['visual.item2'] },
  args: { code: LANG_TEXT, language: 'txt', showLineNumbers: false },
  play: async ({ canvasElement, step }) => {
    await step('Texto simples não recebe nenhuma cor', async () => {
      // O contrário das outras cinco: aqui a ausência de token é o resultado
      // correto, e o trecho continua legível e copiável.
      await expect(rootOf(canvasElement)).toHaveAttribute('data-language', 'text');
      await expect(tokensClassificados(canvasElement)).toBe(0);
      await expect(rootOf(canvasElement).querySelector('.nds-code-block-code')).toHaveTextContent(
        LANG_TEXT,
      );
    });
  },
};

// ─── Paleta por tema ──────────────────────────────────────────────────────────
//
// As cores de sintaxe são custom properties da raiz e trocam com o tema. As duas
// stories abaixo cobrem `testes.accessibility.item4` — "contraste mínimo 4.5:1
// na paleta de sintaxe", nos dois fundos possíveis (a superfície e a linha em
// destaque) e nos dois modos.

export const LightPalette: StoryObj<ComponentProps<typeof CodeBlockPaletaStory>> = {
  parameters: {
    covers: ['accessibility.item4'],
    docs: { source: { transform: codeBlockPaletaSource } },
  },
  render: (args) => ({ Component: CodeBlockPaletaStory, props: args }),
  args: { code: PALETA_CODE },
  play: async ({ canvasElement, step }) => {
    await step('No claro, nenhuma cor da paleta fica abaixo de 4.5:1', async () => {
      // A varredura roda nos três temas de marca e devolve a PIOR razão; o fundo
      // do destaque é semitransparente e é composto antes da conta, senão a
      // medida mentiria para o alfa. Comparar nome de token não responde a
      // pergunta — a razão WCAG responde.
      await expect(laudoDeContraste(canvasElement, 'claro')).toContain(
        `abaixo de ${MINIMO_DE_CONTRASTE}: false`,
      );
    });

    await step('A linha em destaque não depende só de cor', async () => {
      // Barra de acento além do fundo: a marcação precisa sobreviver à visão
      // monocromática (WCAG 1.4.1).
      const marcada = canvasElement.querySelector<HTMLElement>(
        '[data-highlighted]:not([data-highlighted="false"])',
      )!;
      await expect(marcada).toBeInTheDocument();
      await expect(getComputedStyle(marcada).boxShadow).not.toBe('none');
    });
  },
};

export const DarkPalette: StoryObj<ComponentProps<typeof CodeBlockPaletaStory>> = {
  parameters: {
    covers: ['accessibility.item4'],
    // themeOverride é o canal do addon-themes: a classe volta sozinha na story
    // seguinte, porque o efeito do decorator depende dele.
    themes: { themeOverride: 'dark' },
    docs: { source: { transform: codeBlockPaletaSource } },
  },
  render: (args) => ({ Component: CodeBlockPaletaStory, props: args }),
  args: { code: PALETA_CODE },
  play: async ({ canvasElement, step }) => {
    await step('O tema escuro está aplicado no documento', async () => {
      await expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    await step('No escuro, nenhuma cor da paleta fica abaixo de 4.5:1', async () => {
      // O escuro é metade do produto e o axe do test-runner nunca o vê: a tela
      // do runner está sempre no claro. A varredura restaura o className da raiz
      // no finally — deixá-lo posto envenenaria a story seguinte e o Chromatic.
      await expect(laudoDeContraste(canvasElement, 'escuro')).toContain(
        `abaixo de ${MINIMO_DE_CONTRASTE}: false`,
      );
    });
  },
};
