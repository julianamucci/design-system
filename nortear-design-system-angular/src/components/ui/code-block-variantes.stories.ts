import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsCodeBlock } from './code-block';
import { LANGUAGE_ITEMS, COMPOSITION_CODE } from '@/components/docs/CodeBlockDocs';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Uma story por linguagem classificada, com o mesmo trecho da seção Variantes
// da docs page — os literais vêm de lá (LANGUAGE_ITEMS), não copiados, para que
// story e documentação não possam divergir em silêncio.

const meta: Meta = {
  title: 'UI/CodeBlock/Variantes',
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

/** Raiz do bloco renderizado pela story. */
function root(canvasElement: HTMLElement): HTMLElement {
  return canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;
}

/**
 * Spans classificados. `plain` não vira elemento — vira nó de texto —, então
 * qualquer `[data-token]` aqui é sintaxe reconhecida. É o núcleo do componente:
 * sem esta contagem, um tokenizador que devolvesse tudo `plain` passaria por
 * todos os outros testes.
 */
function tokensClassificados(canvasElement: HTMLElement): number {
  return canvasElement.querySelectorAll('[data-token]:not([data-token="plain"])').length;
}

/** Luminância relativa (WCAG) de uma cor computada no formato `rgb(...)`. */
function luminancia(cor: string): number {
  const [r, g, b] = (cor.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map((n) => {
    const c = Number(n) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Story de uma linguagem: mesmo trecho e mesma linguagem da docs page. */
function renderLanguage(key: string) {
  const item = LANGUAGE_ITEMS.find((i) => i.key === key)!;
  return () => ({
    props: { code: item.code, language: item.language },
    template: `<nds-code-block [code]="code" [language]="language" [showLineNumbers]="false" />`,
  });
}

/** Paleta inteira em uma tela: as seis linguagens e uma linha em destaque. */
const renderPaleta = () => ({
  props: { itens: LANGUAGE_ITEMS, destacado: COMPOSITION_CODE, destaque: [2] },
  template: `
    <div class="nds-stack" data-spacing="md">
      @for (item of itens; track item.key) {
        <nds-code-block [code]="item.code" [language]="item.language" [showLineNumbers]="false" />
      }
      <nds-code-block [code]="destacado" language="ts" [highlightLines]="destaque" />
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
  render: renderLanguage('markup'),
  play: async ({ canvasElement, step }) => {
    await step('Marcação recebe classificação de sintaxe', async () => {
      await expect(root(canvasElement)).toHaveAttribute('data-language', 'html');
      await expect(tokensClassificados(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Styles: Story = {
  render: renderLanguage('styles'),
  play: async ({ canvasElement, step }) => {
    await step('CSS recebe classificação de sintaxe', async () => {
      await expect(root(canvasElement)).toHaveAttribute('data-language', 'css');
      await expect(tokensClassificados(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Data: Story = {
  render: renderLanguage('data'),
  play: async ({ canvasElement, step }) => {
    await step('JSON recebe classificação de sintaxe', async () => {
      await expect(root(canvasElement)).toHaveAttribute('data-language', 'json');
      await expect(tokensClassificados(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Shell: Story = {
  render: renderLanguage('shell'),
  play: async ({ canvasElement, step }) => {
    await step('Linha de comando recebe classificação de sintaxe', async () => {
      await expect(root(canvasElement)).toHaveAttribute('data-language', 'bash');
      await expect(tokensClassificados(canvasElement)).toBeGreaterThan(0);
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
      await expect(tokensClassificados(canvasElement)).toBe(0);
    });
  },
};

// ─── Paleta por tema ──────────────────────────────────────────────────────────
//
// As cores de sintaxe são custom properties da raiz e trocam com o tema. As duas
// stories abaixo existem para que o axe meça o contraste da paleta INTEIRA nos
// dois fundos possíveis — a superfície e a linha em destaque — no claro e no
// escuro, que é o critério `testes.accessibility.item4`.

export const PaletaClara: Story = {
  parameters: { covers: ['accessibility.item4'] },
  render: renderPaleta,
  play: async ({ canvasElement, step }) => {
    await step('No tema claro a sintaxe é mais escura que a superfície', async () => {
      const bloco = root(canvasElement);
      const keyword = canvasElement.querySelector<HTMLElement>('[data-token="keyword"]')!;
      await expect(keyword).toBeInTheDocument();
      await expect(luminancia(getComputedStyle(keyword).color)).toBeLessThan(
        luminancia(getComputedStyle(bloco).backgroundColor),
      );
    });

    await step('A linha em destaque não depende só de cor', async () => {
      // Barra de acento além do fundo: a marcação precisa sobreviver à visão
      // monocromática (WCAG 1.4.1).
      const marcada = canvasElement.querySelector<HTMLElement>('[data-highlighted="true"]')!;
      await expect(marcada).toBeInTheDocument();
      await expect(getComputedStyle(marcada).boxShadow).not.toBe('none');
    });
  },
};

export const PaletaEscura: Story = {
  parameters: {
    covers: ['accessibility.item4'],
    // themeOverride é o canal do addon-themes: a classe volta sozinha na story
    // seguinte, porque o efeito do decorator depende dele.
    themes: { themeOverride: 'dark' },
  },
  render: renderPaleta,
  play: async ({ canvasElement, step }) => {
    await step('O tema escuro está aplicado no documento', async () => {
      await expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    await step('No tema escuro a sintaxe é mais clara que a superfície', async () => {
      // Prova que a paleta escura entrou: com as custom properties do claro,
      // a palavra reservada continuaria mais escura que o fundo.
      const bloco = root(canvasElement);
      const keyword = canvasElement.querySelector<HTMLElement>('[data-token="keyword"]')!;
      await expect(luminancia(getComputedStyle(keyword).color)).toBeGreaterThan(
        luminancia(getComputedStyle(bloco).backgroundColor),
      );
    });
  },
};
