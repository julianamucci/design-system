import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { CodeBlock } from "./code-block";

/** Mesmo código base das 4 composições da docs page. */
const COMPOSITION_CODE = `const items = await load();
const total = items.length;
render(items, total);`;

const FOOTER_NOTE = "A ação de copiar leva apenas o código.";

const rootOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;

const meta = {
  title: "UI/CodeBlock/Composicoes",
  component: CodeBlock,
  tags: ["display"],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComRotulo: Story = {
  args: { code: COMPOSITION_CODE, language: "ts", title: "lista.ts" },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement }) => {
    const title = rootOf(canvasElement).querySelector(".nds-code-block-title");
    await expect(title).toBeVisible();
    await expect(title).toHaveTextContent("lista.ts");
  },
};

export const SemNumeracao: Story = {
  args: { code: COMPOSITION_CODE, language: "ts", showLineNumbers: false },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement }) => {
    const root = rootOf(canvasElement);
    await expect(root).toHaveAttribute("data-numbered", "false");
    await expect(root.querySelector(".nds-code-block-gutter")).not.toBeVisible();
  },
};

export const ComDestaque: Story = {
  args: { code: COMPOSITION_CODE, language: "ts", highlightLines: [2] },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement }) => {
    const root = rootOf(canvasElement);
    const marked = root.querySelectorAll('[data-highlighted="true"]');
    await expect(marked).toHaveLength(1);
    await expect(marked[0]).toHaveTextContent("const total = items.length;");
  },
};

export const ComRodape: Story = {
  args: { code: COMPOSITION_CODE, language: "ts", footer: FOOTER_NOTE },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement }) => {
    const footer = rootOf(canvasElement).querySelector(".nds-code-block-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveTextContent(FOOTER_NOTE);
  },
};
