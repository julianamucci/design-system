import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { CodeBlock } from "./code-block";

/**
 * "Variantes" aqui são as linguagens suportadas — o componente não tem variantes
 * de estilo. Os literais são os mesmos da seção Variantes da docs page.
 */
const LANG_SCRIPT = `const total = items.length; // soma`;
const LANG_MARKUP = `<button class="nds-btn" :disabled="loading">Salvar</button>`;
const LANG_STYLES = `.nds-card { padding: var(--spacing-4); }`;
const LANG_DATA = `{ "port": 6006, "open": true }`;
const LANG_SHELL = `npm run build -- --mode production`;
const LANG_TEXT = `Sem classificação: monoespaçado e sem cor.`;

const rootOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;

/** Classes de token presentes no bloco. `plain` não vira elemento — vira texto. */
const tokensOf = (root: HTMLElement) =>
  [...root.querySelectorAll("[data-token]")].map((el) => el.getAttribute("data-token"));

const meta = {
  title: "UI/CodeBlock/Variants",
  component: CodeBlock,
  tags: ["display"],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Script: Story = {
  args: { code: LANG_SCRIPT, language: "tsx", showLineNumbers: false },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement }) => {
    const tokens = tokensOf(rootOf(canvasElement));
    await expect(tokens.length).toBeGreaterThan(0);
    await expect(tokens).not.toContain("plain");
  },
};

export const Markup: Story = {
  args: { code: LANG_MARKUP, language: "vue", showLineNumbers: false },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement }) => {
    const tokens = tokensOf(rootOf(canvasElement));
    await expect(tokens.length).toBeGreaterThan(0);
    await expect(tokens).not.toContain("plain");
  },
};

export const Styles: Story = {
  args: { code: LANG_STYLES, language: "css", showLineNumbers: false },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement }) => {
    const tokens = tokensOf(rootOf(canvasElement));
    await expect(tokens.length).toBeGreaterThan(0);
    await expect(tokens).not.toContain("plain");
  },
};

export const Date: Story = {
  args: { code: LANG_DATA, language: "json", showLineNumbers: false },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement }) => {
    const tokens = tokensOf(rootOf(canvasElement));
    await expect(tokens.length).toBeGreaterThan(0);
    await expect(tokens).not.toContain("plain");
  },
};

export const Shell: Story = {
  args: { code: LANG_SHELL, language: "bash", showLineNumbers: false },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement }) => {
    const tokens = tokensOf(rootOf(canvasElement));
    await expect(tokens.length).toBeGreaterThan(0);
    await expect(tokens).not.toContain("plain");
  },
};

export const Text: Story = {
  args: { code: LANG_TEXT, language: "txt", showLineNumbers: false },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement }) => {
    // Texto simples não é classificado: nenhum trecho vira elemento de token.
    const root = rootOf(canvasElement);
    await expect(root.querySelectorAll("[data-token]")).toHaveLength(0);
    await expect(root.querySelector(".nds-code-block-code")).toHaveTextContent(LANG_TEXT);
  },
};
