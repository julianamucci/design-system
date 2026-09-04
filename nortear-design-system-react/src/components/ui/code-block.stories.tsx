import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, waitFor, fn } from "storybook/test";
import { CodeBlock } from "./code-block";
import { codeBlockSource } from "./code-block.source";
import { CodeBlockDocs } from "@/components/docs/CodeBlockDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

/** Snippet canônico das stories e da docs page nas 4 stacks. */
const DEMO_CODE = `import { CodeBlock } from "@/components/ui/code-block";

<CodeBlock
  code={source}
  language="tsx"
  title="exemplo.tsx"
  highlightLines={[3, "5-7"]}
/>

// O botão copiar leva só o código.`;

const meta = {
  title: "Components/Display/CodeBlock",
  component: CodeBlock,
  tags: ["autodocs", "display"],
  parameters: {
    docs: {
      page: withAutoDocsTab(CodeBlockDocs),
      // O trecho chega por prop de texto: o painel precisa declará-lo como
      // template literal, senão o snippet copiado perde as quebras de linha.
      source: { transform: codeBlockSource },
    },
  },
  // A aba "API Reference" combina o docgen com estes argTypes.
  argTypes: {
    code: {
      control: "text",
      description: "Código a exibir. É exatamente o que o botão copiar coloca no clipboard.",
      table: { type: { summary: "string" } },
    },
    language: {
      control: "select",
      options: ["ts", "tsx", "js", "jsx", "vue", "svelte", "html", "css", "json", "bash", "text"],
      description: "Linguagem ou extensão. Valor desconhecido cai em text (sem cor), não quebra.",
      table: { type: { summary: "string" }, defaultValue: { summary: "'text'" } },
    },
    title: {
      control: "text",
      description: "Rótulo do header, normalmente o nome do arquivo. O botão copiar aparece com ou sem título.",
      table: { type: { summary: "string" } },
    },
    showLineNumbers: {
      control: "boolean",
      description: "Numeração de linha. A numeração nunca entra no texto copiado.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "true" } },
    },
    highlightLines: {
      control: "text",
      description: "Linhas destacadas. Aceita '3, 5-7' ou [3, '5-7'].",
      table: { type: { summary: "string | Array<number | string>" } },
    },
    footer: {
      control: "text",
      description: "Observações abaixo do código. Aceita qualquer ReactNode.",
      table: { type: { summary: "ReactNode" } },
    },
    copyLabel: {
      control: false,
      description: "Rótulo acessível do botão copiar.",
      table: { type: { summary: "string" }, defaultValue: { summary: "'Copiar código'" } },
    },
    copiedLabel: {
      control: false,
      description: "Rótulo de confirmação, anunciado por aria-live.",
      table: { type: { summary: "string" }, defaultValue: { summary: "'Copiado!'" } },
    },
    className: {
      control: false,
      description: "Classes adicionais na raiz. Use para sobrescrever --code-block-highlight-bg.",
      table: { type: { summary: "string" } },
    },
  },
  args: {
    code: DEMO_CODE,
    language: "tsx",
    title: "exemplo.tsx",
    showLineNumbers: true,
    highlightLines: "3, 5-7",
    footer: "",
  },
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    // accessibility.item5 é 'sem violações axe-core': o addon-a11y roda em toda
    // story, mas o audit só enxerga o critério se alguma story o declarar.
    covers: [
      "functional.item1", "functional.item2", "functional.item3", "functional.item4",
      "accessibility.item1", "accessibility.item2", "accessibility.item3", "accessibility.item5",
      "visual.item1",
    ],
  },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;

    await step("A raiz registra a configuração recebida", async () => {
      await expect(root).toHaveAttribute("data-numbered", String(args.showLineNumbers));
      // A linguagem RESOLVIDA na raiz é o que torna "caiu em texto simples"
      // observável de fora — sem ela, nenhuma story consegue afirmar o fallback.
      await expect(root).toHaveAttribute("data-language", args.language);
    });

    await step("Uma linha por quebra do código, numeradas a partir de 1", async () => {
      const lines = [...root.querySelectorAll<HTMLElement>(".nds-code-block-line")];
      await expect(lines).toHaveLength(args.code.split("\n").length);
      const numeros = lines.map(
        (l) => l.querySelector<HTMLElement>(".nds-code-block-gutter")!.textContent?.trim(),
      );
      await expect(numeros[0]).toBe("1");
      await expect(numeros.at(-1)).toBe(String(lines.length));
    });

    await step("A linguagem suportada recebe classificação com cor própria", async () => {
      // Núcleo do componente: sem esta verificação um tokenizador que devolvesse
      // tudo `plain` passaria em todos os outros testes. `plain` não vira
      // elemento — vira nó de texto —, então todo [data-token] aqui é sintaxe.
      //
      // Sem fixar QUAL token: cada linguagem acende um conjunto diferente, e
      // exigir `keyword` reprovava o trecho de marcação — cujo tokenizador
      // classifica tag, atributo e string, e nenhuma palavra reservada.
      const classificados = [
        ...root.querySelectorAll<HTMLElement>('[data-token]:not([data-token="plain"])'),
      ];
      await expect(classificados.length).toBeGreaterThan(0);
      // A cor sai de --code-token-*, não da cor de corpo herdada.
      const bodyColor = getComputedStyle(root).color;
      const proprias = classificados.filter(
        (el) => getComputedStyle(el).color !== bodyColor,
      );
      await expect(proprias.length).toBeGreaterThan(0);
    });

    await step("O highlight marca exatamente as linhas pedidas", async () => {
      const marked = [...root.querySelectorAll(".nds-code-block-line")]
        .map((el, i) => (el.getAttribute("data-highlighted") === "true" ? i + 1 : 0))
        .filter(Boolean);
      await expect(marked).toEqual([3, 5, 6, 7]);
    });

    await step("A numeração não é selecionável, então não entra no texto copiado", async () => {
      const gutter = root.querySelector<HTMLElement>(".nds-code-block-gutter")!;
      await expect(getComputedStyle(gutter).userSelect).toBe("none");
    });

    await step("Copiar coloca no clipboard só o código, sem os números de linha", async () => {
      // Stub do writeText: o clipboard real não funciona no browser de teste
      // (rejeita por permissão, e o fallback via execCommand exige user
      // activation, que evento sintético não tem). O que interessa verificar é
      // nosso lado — o que é copiado e o feedback — não a API do browser.
      const writeText = fn((text: string) => Promise.resolve(text));
      const original = navigator.clipboard;
      Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

      try {
        await userEvent.click(canvas.getByRole("button", { name: /copiar código/i }));
        await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
        await expect(writeText).toHaveBeenCalledWith(args.code);
        // A numeração é 1..N; se tivesse vazado, apareceria no texto copiado.
        await expect(writeText).not.toHaveBeenCalledWith(expect.stringMatching(/^1import/));
      } finally {
        Object.defineProperty(navigator, "clipboard", { value: original, configurable: true });
      }
    });

    await step("O feedback aparece e é anunciado por aria-live", async () => {
      // Um ícone por vez. A primeira versão do Vanilla mantinha os dois no DOM
      // alternando o atributo hidden, que não esconde SVG — e os dois apareciam.
      const button = canvasElement.querySelector("[data-slot='code-block-copy']");
      await expect(button?.querySelectorAll("svg")).toHaveLength(1);
      await waitFor(() =>
        expect(canvas.getByRole("button", { name: /copiado/i })).toBeInTheDocument(),
      );
      await expect(root.querySelector(".nds-sr-only")).toHaveTextContent("Copiado!");
    });

    await step("A confirmação sai por uma região de status, não pela classe", async () => {
      // Alcançar a região pela classe deixaria trocar o role passar verde.
      const status = root.querySelector<HTMLElement>('[role="status"]')!;
      await expect(status).toHaveAttribute("aria-live", "polite");
      await expect(status).toHaveTextContent("Copiado!");
      // FORA do botão, que é a metade do critério que ninguém verificava: uma
      // live region DENTRO do botão faria o leitor reanunciar o rótulo inteiro
      // no meio da interação em vez de só a confirmação.
      const button = root.querySelector<HTMLElement>('[data-slot="code-block-copy"]')!;
      await expect(button.contains(status)).toBe(false);
    });

    await step("Numeração e ícone ficam fora da árvore de acessibilidade", async () => {
      const button = root.querySelector<HTMLElement>('[data-slot="code-block-copy"]')!;
      await expect(root.querySelector(".nds-code-block-gutter")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      await expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });

    await step("Passados 2 segundos, tudo volta ao rótulo inicial", async () => {
      await waitFor(
        () => expect(canvas.getByRole("button", { name: /copiar código/i })).toBeInTheDocument(),
        { timeout: 4000 },
      );
      await expect(root.querySelector<HTMLElement>('[role="status"]')!.textContent).toBe("");
    });

    await step("Tab chega ao botão copiar e Enter aciona a cópia", async () => {
      // Enter, não click: click não é teclado e passaria mesmo sem foco.
      const writeText = fn((text: string) => Promise.resolve(text));
      const original = navigator.clipboard;
      Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

      try {
        (document.activeElement as HTMLElement | null)?.blur();
        await userEvent.tab();
        const button = canvas.getByRole("button", { name: /copiar código/i });
        await expect(button).toHaveFocus();

        await userEvent.keyboard("{Enter}");
        await waitFor(() => expect(writeText).toHaveBeenCalledWith(args.code));
        await waitFor(() =>
          expect(canvas.getByRole("button", { name: /copiado/i })).toBeInTheDocument(),
        );
      } finally {
        Object.defineProperty(navigator, "clipboard", { value: original, configurable: true });
      }
    });

    await step("A região de scroll recebe foco — é como se rola sem mouse", async () => {
      const scroll = root.querySelector<HTMLElement>(".nds-code-block-scroll")!;
      await expect(scroll).toHaveAttribute("tabindex", "0");
      await userEvent.tab();
      await expect(scroll).toHaveFocus();
    });
  },
};
