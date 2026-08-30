import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, userEvent, waitFor, within, expect } from "storybook/test";
import { CodeBlock } from "./code-block";
import {
  codeBlockRemovivelSource,
  codeBlockRolagemSource,
  codeBlockSource,
} from "./code-block.source";
import { Button } from "@/components/ui/button";

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
  title: "Primitives/Display/CodeBlock/States",
  component: CodeBlock,
  tags: ["display"],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: codeBlockSource } },
  },
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithNumbering: Story = {
  parameters: { covers: ["visual.item3"] },
  args: { code: BASE_CODE, language: "ts", showLineNumbers: true },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement }) => {
    const root = rootOf(canvasElement);
    await expect(root).toHaveAttribute("data-numbered", "true");
    const gutter = root.querySelector<HTMLElement>(".nds-code-block-gutter")!;
    await expect(gutter).toBeVisible();
    await expect(gutter).toHaveTextContent("1");
  },
};

export const WithoutNumbering: Story = {
  parameters: { covers: ["functional.item6", "visual.item3"] },
  args: { code: BASE_CODE, language: "ts", showLineNumbers: false },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement, step }) => {
    await step("Sem numeração a coluna some da tela", async () => {
      const root = rootOf(canvasElement);
      await expect(root).toHaveAttribute("data-numbered", "false");
      // O gutter continua no DOM (é aria-hidden e não selecionável); quem o
      // remove é o CSS, via data-numbered.
      await expect(root.querySelector(".nds-code-block-gutter")).not.toBeVisible();
    });

    await step("O código recebe o recuo que a coluna ocupava", async () => {
      // Sem este respiro o trecho encosta na borda — é o resultado que a linha
      // "Sem numeração" da tabela de configurações promete.
      const text = rootOf(canvasElement).querySelector<HTMLElement>(".nds-code-block-text")!;
      await expect(parseFloat(getComputedStyle(text).paddingInlineStart)).toBeGreaterThan(0);
    });
  },
};

export const Copied: Story = {
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
  parameters: {
    covers: ["visual.item5"],
    // O trecho da story tem 40 linhas geradas: despejá-lo no painel seria uma
    // parede de texto, e não existe prop de rolagem para ensinar.
    docs: { source: { transform: codeBlockRolagemSource } },
  },
  args: { code: SCROLL_CODE, language: "ts" },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement, step }) => {
    await step("A região rola nos dois eixos e aceita foco", async () => {
      const scroll = rootOf(canvasElement).querySelector<HTMLElement>(".nds-code-block-scroll")!;
      await expect(scroll).toHaveAttribute("tabindex", "0");
      await expect(scroll.scrollWidth).toBeGreaterThan(scroll.clientWidth);
      await expect(scroll.scrollHeight).toBeGreaterThan(scroll.clientHeight);
    });

    await step("Um eixo, um dono: só a região de scroll rola", async () => {
      // Contêineres aninhados com overflow deixam o eixo sem dono claro e a
      // rolagem por teclado inalcançável (WCAG 2.1.1, axe
      // scrollable-region-focusable). Ver guidelines/01-acessibilidade.
      const root = rootOf(canvasElement);
      const rolaveis = [...root.querySelectorAll<HTMLElement>("*")].filter((el) => {
        const cs = getComputedStyle(el);
        return (
          (/(auto|scroll)/.test(cs.overflowX) || /(auto|scroll)/.test(cs.overflowY)) &&
          (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)
        );
      });
      await expect(rolaveis.map((el) => el.className)).toEqual(["nds-code-block-scroll"]);
    });

    await step("A numeração continua visível no scroll horizontal", async () => {
      // O gutter é sticky: sem isso, rolar para o lado esconde os números e a
      // linha em destaque ganha uma emenda visível.
      const gutter = rootOf(canvasElement).querySelector<HTMLElement>(".nds-code-block-gutter")!;
      await expect(getComputedStyle(gutter).position).toBe("sticky");
    });
  },
};

export const UnknownLanguage: Story = {
  parameters: { covers: ["functional.item7"] },
  args: { code: COBOL_CODE, language: "cobol" },
  render: (args) => <CodeBlock {...args} />,
  play: async ({ canvasElement, step }) => {
    await step("Linguagem desconhecida cai em texto simples sem quebrar o bloco", async () => {
      const root = rootOf(canvasElement);
      await expect(root).toHaveAttribute("data-language", "text");
      await expect(
        root.querySelectorAll('[data-token]:not([data-token="plain"])'),
      ).toHaveLength(0);
      // O conteúdo continua todo lá: uma linha por linha do código.
      await expect(root.querySelectorAll(".nds-code-block-line")).toHaveLength(
        COBOL_CODE.split("\n").length,
      );
    });
  },
};

/**
 * Alterna em vez de só remover: o painel Interactions reexecuta a play no MESMO
 * DOM, e um botão que só sabe remover deixa a segunda rodada sem bloco nenhum
 * para copiar.
 */
function BlockRemovivel({ code }: { code: string }) {
  const [visible, setVisivel] = React.useState(true);
  return (
    <div className="nds-stack" data-spacing="md">
      {visible && <CodeBlock code={code} language="ts" />}
      <Button variant="outline" onClick={() => setVisivel((v) => !v)}>
        {visible ? "Remover o bloco" : "Restaurar o bloco"}
      </Button>
    </div>
  );
}

export const RemovedBeforeFeedback: Story = {
  parameters: {
    covers: ["functional.item8"],
    // A ausência do bloco é o assunto: o que se ensina é a montagem condicional,
    // e o render da story usa um componente que só existe dentro dela.
    docs: { source: { transform: codeBlockRemovivelSource } },
  },
  args: { code: BASE_CODE },
  render: (args) => <BlockRemovivel code={args.code} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    // Precondição própria: no replay a rodada anterior deixou o bloco removido.
    await step("O bloco está na tela antes de qualquer coisa", async () => {
      if (!canvasElement.querySelector('[data-slot="code-block"]')) {
        await userEvent.click(canvas.getByRole("button", { name: /restaurar o bloco/i }));
      }
      await waitFor(() =>
        expect(canvasElement.querySelector('[data-slot="code-block"]')).not.toBeNull(),
      );
    });

    // Espiões sobre os temporizadores globais: o componente chama `setTimeout` e
    // `clearTimeout` sem alias, então o que ele usa é o global do momento da
    // chamada. Passa-tudo — só registram.
    const setOriginal = window.setTimeout;
    const clearOriginal = window.clearTimeout;
    let confirmId: number | undefined;
    const limpos: number[] = [];

    window.setTimeout = ((handler: TimerHandler, ms?: number, ...rest: unknown[]) => {
      const id = setOriginal(handler, ms, ...rest);
      // 2000ms é o intervalo do feedback de "copiado".
      if (ms === 2000) confirmId = id;
      return id;
    }) as typeof window.setTimeout;
    window.clearTimeout = ((id?: number) => {
      if (typeof id === "number") limpos.push(id);
      return clearOriginal(id);
    }) as typeof window.clearTimeout;

    const writeText = fn((text: string) => Promise.resolve(text));
    const originalClipboard = navigator.clipboard;
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

    try {
      await step("Copiar agenda a volta do rótulo em 2 segundos", async () => {
        await userEvent.click(
          canvasElement.querySelector<HTMLElement>('[data-slot="code-block-copy"]')!,
        );
        await waitFor(() =>
          expect(canvas.getByRole("button", { name: /copiado/i })).toBeInTheDocument(),
        );
        await expect(confirmId).toBeDefined();
      });

      await step("Remover o bloco cancela o temporizador pendente", async () => {
        // Sem o clearTimeout do cleanup, o callback dispararia sobre um
        // componente já desmontado — setState em árvore morta.
        await userEvent.click(canvas.getByRole("button", { name: /remover o bloco/i }));
        await waitFor(() =>
          expect(canvasElement.querySelector('[data-slot="code-block"]')).toBeNull(),
        );
        await expect(limpos).toContain(confirmId);
      });
    } finally {
      window.setTimeout = setOriginal;
      window.clearTimeout = clearOriginal;
      Object.defineProperty(navigator, "clipboard", {
        value: originalClipboard,
        configurable: true,
      });
    }
  },
};
