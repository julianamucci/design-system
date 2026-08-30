import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createCodeBlock } from './code-block';
import { codeBlockSource, codeBlockSourceWith } from './code-block.source';
import { LANGUAGE_ITEMS } from '@/components/docs/CodeBlockDocs';
import {
  CONTRAST_MINIMUM,
  PALETTE_TRECHOS,
  contrastLaudo,
} from '@shared/testing/code-block-probe';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Uma story por linguagem classificada, com o mesmo trecho da seção Variantes
// da docs page — os literais vêm de lá (LANGUAGE_ITEMS), não copiados, para que
// story e documentação não possam divergir em silêncio.

const meta: Meta = {
  tags: ['display'],
  title: 'Primitives/Display/CodeBlock/Variants',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: {
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

/** Trecho base do destaque nas stories de paleta. */
const PALETTE_CODE = `const items = await load();
const total = items.length;
render(items, total);`;

/**
 * Snippet da story: a MESMA linguagem e o mesmo trecho que ela renderiza.
 *
 * Override e não a transform do meta: a linguagem é o assunto de cada story
 * aqui, e o snippet do meta — que cai no padrão da fábrica — esconderia
 * justamente a opção que a story existe para mostrar.
 */
function languageSource(key: string) {
  const item = LANGUAGE_ITEMS.find(i => i.key === key)!;
  return codeBlockSourceWith({
    code: item.code,
    language: item.language,
    showLineNumbers: false,
  });
}

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
  parameters: {
    covers: ['visual.item2'],
    docs: { source: { transform: languageSource('script') } },
  },
  render: renderLanguage('script'),
  play: async ({ canvasElement, step }) => {
    await step('TypeScript recebe classificação de sintaxe', async () => {
      await expect(root(canvasElement)).toHaveAttribute('data-language', 'tsx');
      await expect(classifiedTokens(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Markup: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: { source: { transform: languageSource('markup') } },
  },
  render: renderLanguage('markup'),
  play: async ({ canvasElement, step }) => {
    await step('Marcação recebe classificação de sintaxe', async () => {
      await expect(root(canvasElement)).toHaveAttribute('data-language', 'vue');
      await expect(classifiedTokens(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Styles: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: { source: { transform: languageSource('styles') } },
  },
  render: renderLanguage('styles'),
  play: async ({ canvasElement, step }) => {
    await step('CSS recebe classificação de sintaxe', async () => {
      await expect(root(canvasElement)).toHaveAttribute('data-language', 'css');
      await expect(classifiedTokens(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Date: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: { source: { transform: languageSource('data') } },
  },
  render: renderLanguage('data'),
  play: async ({ canvasElement, step }) => {
    await step('JSON recebe classificação de sintaxe', async () => {
      await expect(root(canvasElement)).toHaveAttribute('data-language', 'json');
      await expect(classifiedTokens(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Shell: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: { source: { transform: languageSource('shell') } },
  },
  render: renderLanguage('shell'),
  play: async ({ canvasElement, step }) => {
    await step('Linha de comando recebe classificação de sintaxe', async () => {
      await expect(root(canvasElement)).toHaveAttribute('data-language', 'bash');
      await expect(classifiedTokens(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Text: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: { source: { transform: languageSource('text') } },
  },
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

// ─── Paleta por tema ──────────────────────────────────────────────────────────
//
// As cores de sintaxe são custom properties da raiz e trocam com o tema. As duas
// stories abaixo cobrem `testes.accessibility.item4` — "contraste mínimo 4.5:1
// na paleta de sintaxe", nos dois fundos possíveis (a superfície e a linha em
// destaque) e nos dois modos.
//
// Os trechos vêm do colhedor compartilhado e não de LANGUAGE_ITEMS: juntos eles
// acendem os ONZE tokens da paleta, e a medição das cinco stacks só é comparável
// sobre dados idênticos. Medir um trecho isolado alcançava cinco cores — as
// outras seis nunca tinham sido medidas contra fundo nenhum.

function renderPalette(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-stack';
  wrap.dataset.spacing = 'md';
  for (const t of PALETTE_TRECHOS) {
    wrap.append(createCodeBlock({ code: t.code, language: t.language, showLineNumbers: false }));
  }
  wrap.append(createCodeBlock({ code: PALETTE_CODE, language: 'ts', highlightLines: [2] }));
  return wrap;
}

export const LightPalette: Story = {
  parameters: { covers: ['accessibility.item4'] },
  render: renderPalette,
  play: async ({ canvasElement, step }) => {
    await step('No claro, nenhuma cor da paleta fica abaixo de 4.5:1', async () => {
      // A varredura roda nos três temas de marca e devolve a PIOR razão; o fundo
      // do destaque é semitransparente e é composto antes da conta, senão a
      // medida mentiria para o alfa. Comparar nome de token não responde a
      // pergunta — a razão WCAG responde.
      await expect(contrastLaudo(canvasElement, 'claro')).toContain(
        `abaixo de ${CONTRAST_MINIMUM}: false`,
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

export const DarkPalette: Story = {
  parameters: {
    covers: ['accessibility.item4'],
    // themeOverride é o canal do addon-themes: a classe volta sozinha na story
    // seguinte, porque o efeito do decorator depende dele.
    themes: { themeOverride: 'dark' },
  },
  render: renderPalette,
  play: async ({ canvasElement, step }) => {
    await step('O tema escuro está aplicado no documento', async () => {
      await expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    await step('No escuro, nenhuma cor da paleta fica abaixo de 4.5:1', async () => {
      // O escuro é metade do produto e o axe do test-runner nunca o vê: a tela
      // do runner está sempre no claro. A varredura restaura o className da raiz
      // no finally — deixá-lo posto envenenaria a story seguinte e o Chromatic.
      await expect(contrastLaudo(canvasElement, 'escuro')).toContain(
        `abaixo de ${CONTRAST_MINIMUM}: false`,
      );
    });
  },
};
