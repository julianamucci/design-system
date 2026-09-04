import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { CodeBlock } from './index';
import {
  CONTRAST_MINIMUM,
  PALETTE_TRECHOS,
  contrastLaudo,
} from '@shared/testing/code-block-probe';
import { codeBlockPaletteSource, codeBlockSource } from './code-block.source';

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
  title: 'Components/Display/CodeBlock/Variants',
  component: CodeBlock,
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: codeBlockSource } },
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

/** Trecho base do destaque nas stories de paleta. */
const PALETTE_CODE = `const items = await load();
const total = items.length;
render(items, total);`;

const rootOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;

const tokensClassificados = (canvasElement: HTMLElement) =>
  canvasElement.querySelectorAll('[data-token]:not([data-token="plain"])').length;

export const Script: Story = {
  parameters: { covers: ['visual.item2'] },
  args: { code: 'const total = items.length; // soma', language: 'tsx' },
  play: async ({ canvasElement, step }) => {
    await step('A sintaxe do script é classificada', async () => {
      await expect(rootOf(canvasElement)).toHaveAttribute('data-language', 'tsx');
      await expect(tokensClassificados(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Markup: Story = {
  parameters: { covers: ['visual.item2'] },
  args: {
    code: '<button class="nds-button" :disabled="loading">Salvar</button>',
    language: 'vue',
  },
  play: async ({ canvasElement, step }) => {
    await step('A sintaxe do markup é classificada', async () => {
      await expect(rootOf(canvasElement)).toHaveAttribute('data-language', 'vue');
      await expect(tokensClassificados(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Styles: Story = {
  parameters: { covers: ['visual.item2'] },
  args: { code: '.nds-card { padding: var(--spacing-4); }', language: 'css' },
  play: async ({ canvasElement, step }) => {
    await step('A sintaxe do CSS é classificada', async () => {
      await expect(rootOf(canvasElement)).toHaveAttribute('data-language', 'css');
      await expect(tokensClassificados(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Date: Story = {
  parameters: { covers: ['visual.item2'] },
  args: { code: '{ "port": 6006, "open": true }', language: 'json' },
  play: async ({ canvasElement, step }) => {
    await step('A sintaxe dos dados é classificada', async () => {
      await expect(rootOf(canvasElement)).toHaveAttribute('data-language', 'json');
      await expect(tokensClassificados(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Shell: Story = {
  parameters: { covers: ['visual.item2'] },
  args: { code: 'npm run build -- --mode production', language: 'bash' },
  play: async ({ canvasElement, step }) => {
    await step('A sintaxe do comando é classificada', async () => {
      await expect(rootOf(canvasElement)).toHaveAttribute('data-language', 'bash');
      await expect(tokensClassificados(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Text: Story = {
  parameters: { covers: ['visual.item2'] },
  args: { code: 'Sem classificação: monoespaçado e sem cor.', language: 'txt' },
  play: async ({ canvasElement, step }) => {
    await step('Texto simples não recebe nenhuma cor', async () => {
      // O contrário das outras cinco: aqui a ausência de token é o resultado
      // correto, e o trecho continua legível e copiável.
      await expect(rootOf(canvasElement)).toHaveAttribute('data-language', 'text');
      await expect(tokensClassificados(canvasElement)).toBe(0);
      await expect(canvasElement.querySelectorAll('.nds-code-block-line')).toHaveLength(1);
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
// Os trechos vêm do colhedor compartilhado e não da docs page: juntos eles
// acendem os ONZE tokens da paleta, e a medição das cinco stacks só é comparável
// sobre dados idênticos. Medir um trecho isolado alcançava cinco cores — as
// outras seis nunca tinham sido medidas contra fundo nenhum.

const renderPalette = () => ({
  components: { CodeBlock },
  setup() {
    return { trechos: PALETTE_TRECHOS, destacado: PALETTE_CODE, highlight: [2] };
  },
  template: `
    <div class="nds-stack" data-spacing="md">
      <CodeBlock
        v-for="t in trechos"
        :key="t.language"
        :code="t.code"
        :language="t.language"
        :showLineNumbers="false"
      />
      <CodeBlock :code="destacado" language="ts" :highlightLines="highlight" />
    </div>
  `,
});

export const LightPalette: Story = {
  parameters: {
    covers: ['accessibility.item4'],
    // São vários blocos empilhados, um por linguagem, mais um com linha em
    // destaque: a do meta mostraria um bloco só.
    docs: { source: { transform: codeBlockPaletteSource } },
  },
  args: { code: PALETTE_CODE },
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
    // Mesma composição da paleta clara — o tema é do documento, e não algo que
    // o snippet escreva.
    docs: { source: { transform: codeBlockPaletteSource } },
    // themeOverride é o canal do addon-themes: a classe volta sozinha na story
    // seguinte, porque o efeito do decorator depende dele.
    themes: { themeOverride: 'dark' },
  },
  args: { code: PALETTE_CODE },
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
