import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, userEvent, waitFor, expect } from "storybook/test";
import { CodeBlock } from "./code-block";

const BASE_CODE = `const items = await load();
const total = items.length;
render(items, total);`;

/** Longo nos dois eixos: força o scroll vertical e o horizontal ao mesmo tempo. */
const SCROLL_CODE = Array.from(
  { length: 40 },
  (_, i) =>
    `const registro${i + 1} = { id: ${i + 1}, nome: "linha propositalmente longa para forçar o scroll horizontal do bloco", descricao: "a região de rolagem recebe foco pelo teclado para quem navega sem mouse", ativo: true, criadoEm: "2026-07-30T12:00:00.000Z" };`,
).join("\n");

const COBOL_CODE = `IDENTIFICATION DIVISION.
PROGRAM-ID. RELATORIO.`;

const rootOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;

const meta = {
  title: "UI/CodeBlock/States",
  component: CodeBlock,
  tags: ["display"],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithNumbering: Story = {
  args: { code: BASE_CODE, language: "ts", showLineNumbers: true },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement }) => {
    const root = rootOf(canvasElement);
    await expect(root).toHaveAttribute("data-numbered", "true");
    await expect(root.querySelector(".nds-code-block-gutter")).toBeVisible();
  },
};

export const WithoutNumbering: Story = {
  args: { code: BASE_CODE, language: "ts", showLineNumbers: false },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement }) => {
    const root = rootOf(canvasElement);
    await expect(root).toHaveAttribute("data-numbered", "false");
    await expect(root.querySelector(".nds-code-block-gutter")).not.toBeVisible();
  },
};

export const Copiado: Story = {
  args: { code: BASE_CODE, language: "ts" },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement }) => {
    const root = rootOf(canvasElement);
    const button = root.querySelector<HTMLElement>('[data-slot="code-block-copy"]')!;

    // Stub do writeText: o clipboard real rejeita por permissão no browser de
    // teste e o fallback via execCommand exige user activation. O que interessa
    // aqui é o feedback, não a API do browser.
    const writeText = fn((text: string) => Promise.resolve(text));
    const original = navigator.clipboard;
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

    try {
      await userEvent.click(button);

      const status = root.querySelector<HTMLElement>('[role="status"]')!;
      await waitFor(() => expect(status).toHaveTextContent("Copiado!"));
      await expect(status).toHaveAttribute("aria-live", "polite");
      // Um ícone por vez: os dois no DOM ao mesmo tempo já aconteceu.
      await expect(button.querySelectorAll("svg")).toHaveLength(1);
    } finally {
      Object.defineProperty(navigator, "clipboard", { value: original, configurable: true });
    }
  },
};

export const DoubleScroll: Story = {
  args: { code: SCROLL_CODE, language: "ts" },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement }) => {
    const scroll = rootOf(canvasElement).querySelector<HTMLElement>(".nds-code-block-scroll")!;
    await expect(scroll).toHaveAttribute("tabindex", "0");
    await expect(scroll.scrollWidth).toBeGreaterThan(scroll.clientWidth);
  },
};

export const LinguagemDesconhecida: Story = {
  args: { code: COBOL_CODE, language: "cobol" },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement }) => {
    // Linguagem não reconhecida cai em texto simples: sem cor, sem quebrar.
    const root = rootOf(canvasElement);
    await expect(root.querySelectorAll("[data-token]")).toHaveLength(0);
    await expect(root.querySelector(".nds-code-block-code")).toHaveTextContent("PROGRAM-ID.");
  },
};
