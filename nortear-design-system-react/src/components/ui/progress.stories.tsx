import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { within, expect, waitFor } from "storybook/test";
import { Progress } from "./progress";
import { ProgressDocs } from "@/components/docs/ProgressDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";
import {
  percentualDesenhado,
  indicadorDoProgresso,
} from "@shared/testing/progress-probe";

const meta = {
  title: "UI/Progress",
  component: Progress,
  tags: ["autodocs", "feedback"],
  parameters: {
    layout: "padded",
    docs: { page: withAutoDocsTab(ProgressDocs) },
  },
  argTypes: {
    value: {
      control: { type: "number", min: 0, max: 100, step: 1 },
      description:
        "Valor atual de 0 a 100. Use null para modo indeterminate.",
      table: { type: { summary: "number | null" }, defaultValue: { summary: "—" } },
    },
    max: {
      control: { type: "number", min: 1, step: 1 },
      description: "Valor máximo da escala.",
      table: { type: { summary: "number" }, defaultValue: { summary: "100" } },
    },
    min: {
      control: { type: "number", min: 0, step: 1 },
      description: "Valor mínimo da escala.",
      table: { type: { summary: "number" }, defaultValue: { summary: "0" } },
    },
    "aria-label": {
      control: { type: "text" },
      description:
        "Nome acessível — descreve a operação medida, não o componente.",
      table: { type: { summary: "string" }, defaultValue: { summary: "—" } },
    },
    className: {
      control: { type: "text" },
      description:
        "Classes utilitárias .nds-* adicionais. A cor da barra não se troca por classe — use data-variant.",
      table: { type: { summary: "string" }, defaultValue: { summary: "—" } },
    },
  },
  args: {
    value: 42,
    max: 100,
    min: 0,
    className: "",
    "aria-label": "Progresso do upload",
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    covers: ["accessibility.item1", "accessibility.item3", "accessibility.item4"],
  },
  render: (args) => (
    <div className="nds-w-sm">
      <Progress {...args} />
    </div>
  ),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step("A raiz é anunciada como barra de progresso, com nome próprio", async () => {
      const bar = canvas.getByRole("progressbar", { name: args["aria-label"] });
      await expect(bar).toHaveAttribute("data-slot", "progress");
    });

    await step("A escala inteira chega ao leitor de tela", async () => {
      const bar = canvas.getByRole("progressbar");
      await expect(bar).toHaveAttribute("aria-valuenow", String(args.value));
      await expect(bar).toHaveAttribute("aria-valuemin", String(args.min));
      await expect(bar).toHaveAttribute("aria-valuemax", String(args.max));
    });

    await step("Trilha e indicador existem como partes distintas", async () => {
      await expect(
        canvasElement.querySelector("[data-slot='progress-track']"),
      ).not.toBeNull();
      await expect(
        canvasElement.querySelector("[data-slot='progress-indicator']"),
      ).not.toBeNull();
    });

    await step("A barra desenhada corresponde ao valor pedido", async () => {
      // Atributo certo com desenho errado já passou por aqui: medir é o único
      // jeito de saber que o valor virou pixel.
      const min = args.min ?? 0;
      const max = args.max ?? 100;
      const esperado = (((args.value ?? 0) - min) / (max - min)) * 100;
      await waitFor(async () => {
        await expect(
          Math.abs(percentualDesenhado(canvasElement) - esperado),
        ).toBeLessThan(2);
      });
    });

    await step("A composição rende uma trilha só", async () => {
      // Sem children, a raiz monta trilha e indicador sozinha — e uma vez só.
      await expect(
        canvasElement.querySelectorAll("[data-slot='progress-track']"),
      ).toHaveLength(1);
    });
  },
};

export const Animated: Story = {
  args: {
    value: 0,
    "aria-label": "Carregando dados",
  },
  parameters: { controls: { disable: true } },
  render: function AnimatedRender(args) {
    const [value, setValue] = useState<number>(0);

    useEffect(() => {
      const id = setInterval(() => {
        setValue((v) => (v >= 100 ? 0 : v + 5));
      }, 400);
      return () => clearInterval(id);
    }, []);

    return (
      <div className="nds-w-sm">
        <Progress {...args} value={value} />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Progressbar animado presente e nomeado", async () => {
      const bar = canvas.getByRole("progressbar", { name: "Carregando dados" });
      await expect(bar).toHaveAttribute("aria-valuemin", "0");
      await expect(bar).toHaveAttribute("aria-valuemax", "100");
    });

    await step("O valor anunciado fica dentro da escala em toda rodada", async () => {
      // O valor muda a cada 400ms; afirmar um número seria racy. O que vale em
      // qualquer instante é o intervalo — e um valor fora dele seria defeito.
      const bar = canvas.getByRole("progressbar");
      const agora = Number(bar.getAttribute("aria-valuenow"));
      await expect(Number.isFinite(agora)).toBe(true);
      await expect(agora >= 0 && agora <= 100).toBe(true);
    });

    await step("O indicador transiciona em vez de saltar", async () => {
      // A suavidade é do design system, não da story: sem a transição o valor
      // pularia de 5 em 5 e a barra pareceria travada.
      const transicao = getComputedStyle(
        indicadorDoProgresso(canvasElement),
      ).transitionProperty;
      await expect(transicao).toContain("width");
    });
  },
};
