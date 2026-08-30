import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { CodeBlock } from "./code-block";
import { codeBlockPaletteSource, codeBlockSource } from "./code-block.source";
import {
  CONTRAST_MINIMUM,
  PALETTE_TRECHOS,
  contrastLaudo,
} from "@shared/testing/code-block-probe";

/**
 * "Variantes" aqui são as linguagens suportadas — o componente não tem variantes
 * de estilo. Os literais são os mesmos da seção Variantes da docs page.
 */
const LANG_SCRIPT = `const total = items.length; // soma`;
const LANG_MARKUP = `<button class="nds-button" :disabled="loading">Salvar</button>`;
const LANG_STYLES = `.nds-card { padding: var(--spacing-4); }`;
const LANG_DATA = `{ "port": 6006, "open": true }`;
const LANG_SHELL = `npm run build -- --mode production`;
const LANG_TEXT = `Sem classificação: monoespaçado e sem cor.`;

/** Trecho base do destaque nas stories de paleta. */
const PALETTE_CODE = `const items = await load();
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

const meta = {
  title: "Primitives/Display/CodeBlock/Variants",
  component: CodeBlock,
  tags: ["display"],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    // Cada linguagem chega pelos args da story, então a transform do meta já
    // imprime o trecho e a prop `language` corretos.
    docs: { source: { transform: codeBlockSource } },
  },
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Script: Story = {
  parameters: { covers: ["visual.item2"] },
  args: { code: LANG_SCRIPT, language: "tsx", showLineNumbers: false },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement, step }) => {
    await step("TypeScript recebe classificação de sintaxe", async () => {
      await expect(rootOf(canvasElement)).toHaveAttribute("data-language", "tsx");
      await expect(tokensClassificados(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Markup: Story = {
  parameters: { covers: ["visual.item2"] },
  args: { code: LANG_MARKUP, language: "vue", showLineNumbers: false },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement, step }) => {
    await step("Marcação recebe classificação de sintaxe", async () => {
      await expect(rootOf(canvasElement)).toHaveAttribute("data-language", "vue");
      await expect(tokensClassificados(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Styles: Story = {
  parameters: { covers: ["visual.item2"] },
  args: { code: LANG_STYLES, language: "css", showLineNumbers: false },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement, step }) => {
    await step("CSS recebe classificação de sintaxe", async () => {
      await expect(rootOf(canvasElement)).toHaveAttribute("data-language", "css");
      await expect(tokensClassificados(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Date: Story = {
  parameters: { covers: ["visual.item2"] },
  args: { code: LANG_DATA, language: "json", showLineNumbers: false },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement, step }) => {
    await step("JSON recebe classificação de sintaxe", async () => {
      await expect(rootOf(canvasElement)).toHaveAttribute("data-language", "json");
      await expect(tokensClassificados(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Shell: Story = {
  parameters: { covers: ["visual.item2"] },
  args: { code: LANG_SHELL, language: "bash", showLineNumbers: false },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement, step }) => {
    await step("Linha de comando recebe classificação de sintaxe", async () => {
      await expect(rootOf(canvasElement)).toHaveAttribute("data-language", "bash");
      await expect(tokensClassificados(canvasElement)).toBeGreaterThan(0);
    });
  },
};

export const Text: Story = {
  parameters: { covers: ["visual.item2"] },
  args: { code: LANG_TEXT, language: "txt", showLineNumbers: false },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement, step }) => {
    await step("Texto simples não recebe nenhuma cor", async () => {
      // O contrário das outras cinco: aqui a ausência de token é o resultado
      // correto, e o trecho continua legível e copiável.
      await expect(rootOf(canvasElement)).toHaveAttribute("data-language", "text");
      await expect(tokensClassificados(canvasElement)).toBe(0);
      await expect(rootOf(canvasElement).querySelector(".nds-code-block-code")).toHaveTextContent(
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
//
// Os trechos vêm do colhedor compartilhado e não da docs page: juntos eles
// acendem os ONZE tokens da paleta, e a medição das cinco stacks só é comparável
// sobre dados idênticos. Medir um trecho isolado alcançava cinco cores — as
// outras seis nunca tinham sido medidas contra fundo nenhum.

const Paleta = () => (
  <div className="nds-stack" data-spacing="md">
    {PALETTE_TRECHOS.map((t) => (
      <CodeBlock key={t.language} code={t.code} language={t.language} showLineNumbers={false} />
    ))}
    <CodeBlock code={PALETTE_CODE} language="ts" highlightLines={[2]} />
  </div>
);

export const LightPalette: Story = {
  parameters: {
    covers: ["accessibility.item4"],
    // A story empilha vários blocos só para medir contraste; o que se ensina é
    // um bloco, porque a cor vem do tema e não de prop nenhuma.
    docs: { source: { transform: codeBlockPaletteSource } },
  },
  args: { code: PALETTE_CODE },
  render: () => <Paleta />,
  play: async ({ canvasElement, step }) => {
    await step("No claro, nenhuma cor da paleta fica abaixo de 4.5:1", async () => {
      // A varredura roda nos três temas de marca e devolve a PIOR razão; o fundo
      // do destaque é semitransparente e é composto antes da conta, senão a
      // medida mentiria para o alfa. Comparar nome de token não responde a
      // pergunta — a razão WCAG responde.
      await expect(contrastLaudo(canvasElement, "claro")).toContain(
        `abaixo de ${CONTRAST_MINIMUM}: false`,
      );
    });

    await step("A linha em destaque não depende só de cor", async () => {
      // Barra de acento além do fundo: a marcação precisa sobreviver à visão
      // monocromática (WCAG 1.4.1).
      const marcada = canvasElement.querySelector<HTMLElement>(
        '[data-highlighted]:not([data-highlighted="false"])',
      )!;
      await expect(marcada).toBeInTheDocument();
      await expect(getComputedStyle(marcada).boxShadow).not.toBe("none");
    });
  },
};

export const DarkPalette: Story = {
  parameters: {
    covers: ["accessibility.item4"],
    // Mesmo snippet da paleta clara: o que muda entre as duas é o tema aplicado
    // pelo toolbar, nunca o código.
    docs: { source: { transform: codeBlockPaletteSource } },
    // themeOverride é o canal do addon-themes: a classe volta sozinha na story
    // seguinte, porque o efeito do decorator depende dele.
    themes: { themeOverride: "dark" },
  },
  args: { code: PALETTE_CODE },
  render: () => <Paleta />,
  play: async ({ canvasElement, step }) => {
    await step("O tema escuro está aplicado no documento", async () => {
      await expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    await step("No escuro, nenhuma cor da paleta fica abaixo de 4.5:1", async () => {
      // O escuro é metade do produto e o axe do test-runner nunca o vê: a tela
      // do runner está sempre no claro. A varredura restaura o className da raiz
      // no finally — deixá-lo posto envenenaria a story seguinte e o Chromatic.
      await expect(contrastLaudo(canvasElement, "escuro")).toContain(
        `abaixo de ${CONTRAST_MINIMUM}: false`,
      );
    });
  },
};
