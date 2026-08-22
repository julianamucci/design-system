import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { CodeBlock } from "./code-block";
import { codeBlockSource } from "./code-block.source";

/** Mesmo código base das 4 composições da docs page. */
const COMPOSITION_CODE = `const items = await load();
const total = items.length;
render(items, total);`;

/**
 * Seis linhas, porque um intervalo precisa de espaço para existir. Sobre as três
 * de `COMPOSITION_CODE`, `'1, 3'` seriam dois números avulsos — e uma story de
 * intervalo que não contém intervalo é declaração falsa.
 */
const RANGE_CODE = `import { load } from './api';

const items = await load();
const total = items.length;
render(items, total);
export default total;`;

const FOOTER_NOTE = "A ação de copiar leva apenas o código.";

const rootOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;

/** Números 1-based das linhas marcadas. */
const linesChecked = (canvasElement: HTMLElement) =>
  [...rootOf(canvasElement).querySelectorAll(".nds-code-block-line")]
    .map((el, i) => (el.getAttribute("data-highlighted") === "true" ? i + 1 : 0))
    .filter((n) => n > 0);

const meta = {
  title: "UI/CodeBlock/Compositions",
  component: CodeBlock,
  tags: ["display"],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    // Todas as composições daqui são dirigidas por args (título, numeração,
    // destaque, rodapé), então a transform do meta as cobre sem override.
    docs: { source: { transform: codeBlockSource } },
  },
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithLabel: Story = {
  args: { code: COMPOSITION_CODE, language: "ts", title: "lista.ts" },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement, step }) => {
    await step("O header mostra o nome do arquivo ao lado da ação de copiar", async () => {
      const title = rootOf(canvasElement).querySelector(".nds-code-block-title");
      await expect(title).toBeVisible();
      await expect(title).toHaveTextContent("lista.ts");
      // data-slot é o contrato que story, teste e ferramenta usam para achar a
      // ação de copiar sem depender de classe — as cinco stacks emitem o mesmo.
      await expect(
        rootOf(canvasElement).querySelector('[data-slot="code-block-copy"]'),
      ).toBeVisible();
    });

    await step("O rótulo longo trunca em vez de empurrar o botão para fora", async () => {
      // Os dois numa asserção só: `text-overflow` sem `nowrap` não trunca nada,
      // então o par é o comportamento — verificar um de cada vez daria a falsa
      // impressão de que qualquer um deles basta.
      const { textOverflow, whiteSpace } = getComputedStyle(
        rootOf(canvasElement).querySelector<HTMLElement>(".nds-code-block-title")!,
      );
      await expect({ textOverflow, whiteSpace }).toEqual({
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      });
    });
  },
};

export const WithoutNumbering: Story = {
  args: { code: COMPOSITION_CODE, language: "ts", showLineNumbers: false },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement, step }) => {
    await step("A coluna de numeração some", async () => {
      const root = rootOf(canvasElement);
      await expect(root).toHaveAttribute("data-numbered", "false");
      await expect(root.querySelector(".nds-code-block-gutter")).not.toBeVisible();
    });
  },
};

export const WithHighlight: Story = {
  parameters: { covers: ["functional.item5", "visual.item4"] },
  args: { code: COMPOSITION_CODE, language: "ts", highlightLines: [2] },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement, step }) => {
    await step("Só a linha pedida fica marcada, contando a partir de 1", async () => {
      await expect(linesChecked(canvasElement)).toEqual([2]);
      const marcada = rootOf(canvasElement).querySelector<HTMLElement>(
        '[data-highlighted]:not([data-highlighted="false"])',
      )!;
      await expect(marcada).toHaveTextContent("const total = items.length;");
    });

    await step("A marcação não é só cor", async () => {
      // Barra de acento na lateral além do fundo — WCAG 1.4.1.
      const marcada = rootOf(canvasElement).querySelector<HTMLElement>(
        '[data-highlighted]:not([data-highlighted="false"])',
      )!;
      await expect(getComputedStyle(marcada).boxShadow).not.toBe("none");
    });
  },
};

export const WithHighlightedRange: Story = {
  parameters: { covers: ["functional.item5", "visual.item4"] },
  args: { code: RANGE_CODE, language: "ts", highlightLines: "1, 4-5" },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement, step }) => {
    await step("Número avulso e intervalo convivem na mesma entrada", async () => {
      // A forma string é a que o control do Playground usa; a forma array já é
      // exercitada em WithHighlight.
      await expect(linesChecked(canvasElement)).toEqual([1, 4, 5]);
    });

    await step("As linhas de fora seguem sem marcação", async () => {
      // Sem isto, um componente que marcasse TUDO passaria: a asserção acima
      // conferiria a presença das três pedidas e ignoraria as outras três.
      const root = rootOf(canvasElement);
      await expect(root.querySelectorAll(".nds-code-block-line")).toHaveLength(
        RANGE_CODE.split("\n").length,
      );
      await expect(
        root.querySelectorAll(
          '.nds-code-block-line[data-highlighted]:not([data-highlighted="false"])',
        ),
      ).toHaveLength(3);
    });
  },
};

export const WithFooter: Story = {
  args: { code: COMPOSITION_CODE, language: "ts", footer: FOOTER_NOTE },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement, step }) => {
    await step("O rodapé aparece abaixo do código", async () => {
      const footer = rootOf(canvasElement).querySelector(".nds-code-block-footer");
      await expect(footer).toBeVisible();
      await expect(footer).toHaveTextContent(FOOTER_NOTE);
    });

    await step("O rodapé fica fora da região que rola", async () => {
      // A observação precisa continuar visível enquanto a pessoa rola o trecho.
      const root = rootOf(canvasElement);
      const scroll = root.querySelector<HTMLElement>(".nds-code-block-scroll")!;
      const footer = root.querySelector<HTMLElement>(".nds-code-block-footer")!;
      await expect(scroll.contains(footer)).toBe(false);
    });
  },
};

export const WithoutFooter: Story = {
  args: { code: COMPOSITION_CODE, language: "ts" },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement, step }) => {
    await step("Sem observação o bloco não cria a faixa inferior", async () => {
      // Faixa vazia deixaria uma borda solta abaixo do código.
      await expect(rootOf(canvasElement).querySelector(".nds-code-block-footer")).toBeNull();
    });
  },
};
