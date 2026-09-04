import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsCodeBlock } from './code-block';
import { root } from './code-block.fixtures';
import { LANGUAGE_ITEMS, COMPOSITION_CODE } from '@/components/docs/CodeBlockDocs';
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
  title: 'Components/Display/CodeBlock/Variants',
  tags: ['display'],
  decorators: [moduleMetadata({ imports: [NdsCodeBlock] })],
  parameters: {
    layout: 'padded',
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

/**
 * Spans classificados. `plain` não vira elemento — vira nó de texto —, então
 * qualquer `[data-token]` aqui é sintaxe reconhecida. É o núcleo do componente:
 * sem esta contagem, um tokenizador que devolvesse tudo `plain` passaria por
 * todos os outros testes.
 */
function tokensClassificados(canvasElement: HTMLElement): number {
  return canvasElement.querySelectorAll('[data-token]:not([data-token="plain"])').length;
}

/** Story de uma linguagem: mesmo trecho e mesma linguagem da docs page. */
function renderLanguage(key: string) {
  const item = LANGUAGE_ITEMS.find((i) => i.key === key)!;
  return () => ({
    props: { code: item.code, language: item.language },
    template: `<nds-code-block [code]="code" [language]="language" [showLineNumbers]="false" />`,
  });
}

/**
 * Paleta inteira em uma tela: os trechos do colhedor compartilhado — que juntos
 * acendem os ONZE tokens — e uma linha em destaque, que é o SEGUNDO fundo
 * possível.
 *
 * Os trechos vêm de `code-block-probe` e não de `LANGUAGE_ITEMS` de propósito:
 * os itens da docs page são idiomáticos por stack, e a medição das cinco só é
 * comparável sobre dados idênticos. A primeira versão media `LANGUAGE_ITEMS` e
 * alcançava cinco cores das onze — as outras seis nunca tinham sido medidas
 * contra fundo nenhum.
 */
const renderPalette = () => ({
  props: { trechos: PALETTE_TRECHOS, destacado: COMPOSITION_CODE, highlight: [2] },
  template: `
    <div class="nds-stack" data-spacing="md">
      @for (t of trechos; track t.language) {
        <nds-code-block [code]="t.code" [language]="t.language" [showLineNumbers]="false" />
      }
      <nds-code-block [code]="destacado" language="ts" [highlightLines]="highlight" />
    </div>
  `,
});

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Script: Story = {
  parameters: { covers: ['visual.item2'] },
  render: renderLanguage('script'),
  play: async ({ canvasElement, step }) => {
    await step('TypeScript recebe classificação de sintaxe', async () => {
      await expect(root(canvasElement)).toHaveAttribute('data-language', 'ts');
      await expect(tokensClassificados(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Markup: Story = {
  parameters: { covers: ['visual.item2'] },
  render: renderLanguage('markup'),
  play: async ({ canvasElement, step }) => {
    await step('Marcação recebe classificação de sintaxe', async () => {
      await expect(root(canvasElement)).toHaveAttribute('data-language', 'html');
      await expect(tokensClassificados(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Styles: Story = {
  parameters: { covers: ['visual.item2'] },
  render: renderLanguage('styles'),
  play: async ({ canvasElement, step }) => {
    await step('CSS recebe classificação de sintaxe', async () => {
      await expect(root(canvasElement)).toHaveAttribute('data-language', 'css');
      await expect(tokensClassificados(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Date: Story = {
  parameters: { covers: ['visual.item2'] },
  render: renderLanguage('data'),
  play: async ({ canvasElement, step }) => {
    await step('JSON recebe classificação de sintaxe', async () => {
      await expect(root(canvasElement)).toHaveAttribute('data-language', 'json');
      await expect(tokensClassificados(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Shell: Story = {
  parameters: { covers: ['visual.item2'] },
  render: renderLanguage('shell'),
  play: async ({ canvasElement, step }) => {
    await step('Linha de comando recebe classificação de sintaxe', async () => {
      await expect(root(canvasElement)).toHaveAttribute('data-language', 'bash');
      await expect(tokensClassificados(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Text: Story = {
  parameters: { covers: ['visual.item2'] },
  render: renderLanguage('text'),
  play: async ({ canvasElement, step }) => {
    await step('Texto simples não recebe nenhuma cor', async () => {
      // O contrário das outras cinco: aqui a ausência de token é o resultado
      // correto, e o trecho continua legível e copiável.
      await expect(root(canvasElement)).toHaveAttribute('data-language', 'text');
      await expect(tokensClassificados(canvasElement)).toBe(0);
    });
  },
};

// ─── Paleta por tema ──────────────────────────────────────────────────────────
//
// As cores de sintaxe são custom properties da raiz e trocam com o tema. As duas
// stories abaixo cobrem `testes.accessibility.item4` — "contraste mínimo 4.5:1
// na paleta de sintaxe", nos dois fundos possíveis e nos dois modos.
//
// A versão anterior declarava o item e assertava só a DIREÇÃO da luminância
// (mais escura que a superfície no claro, mais clara no escuro): passaria com
// uma cor a 1.2:1, desde que apontasse para o lado certo. O número que o
// critério pede é a razão WCAG, e é ela que se afirma agora — calculada nos três
// temas de marca, porque cada um traz a própria superfície.

export const LightPalette: Story = {
  parameters: { covers: ['accessibility.item4'] },
  render: renderPalette,
  play: async ({ canvasElement, step }) => {
    await step('No claro, nenhuma cor da paleta fica abaixo de 4.5:1', async () => {
      // A varredura roda nos três temas e devolve a PIOR razão; o fundo do
      // destaque é semitransparente e é composto antes da conta, senão a medida
      // mentiria para o alfa.
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
      // do runner está sempre no claro. Aqui a classe é posta e retirada pela
      // varredura, que restaura o className da raiz no finally.
      await expect(contrastLaudo(canvasElement, 'escuro')).toContain(
        `abaixo de ${CONTRAST_MINIMUM}: false`,
      );
    });
  },
};
