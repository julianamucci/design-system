import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect, waitFor } from "storybook/test";
import { Progress } from "./progress";
import { ProgressDocs } from "@/components/docs/ProgressDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";
import { progressSource, type ProgressArgs } from "./progress.source";
import { percentualDesenhado } from "@shared/testing/progress-probe";
import {
  progressValueText,
  resolveProgressRange,
  resolveProgressValue,
} from "@shared/primitives/progress-value";

const meta: Meta<ProgressArgs> = {
  title: "Components/Feedback/Progress",
  tags: ["autodocs", "feedback"],
  parameters: {
    layout: "padded",
    docs: {
      page: withAutoDocsTab(ProgressDocs),
      source: { transform: progressSource },
    },
  },
  argTypes: {
    value: {
      control: { type: "number", step: 1 },
      description:
        "Valor atual, limitado à faixa. Vazio ativa o modo indeterminado.",
      table: { type: { summary: "number | null" }, defaultValue: { summary: "null" } },
    },
    min: {
      control: { type: "number", step: 1 },
      description: "Valor mínimo da escala.",
      table: { type: { summary: "number" }, defaultValue: { summary: "0" } },
    },
    max: {
      control: { type: "number", step: 1 },
      description: "Valor máximo da escala.",
      table: { type: { summary: "number" }, defaultValue: { summary: "100" } },
    },
    variant: {
      control: { type: "select" },
      options: ["", "success", "destructive"],
      description:
        "Cor semântica da barra, escrita em data-variant. Vazio, a barra usa o primário.",
      table: { type: { summary: "'success' | 'destructive'" }, defaultValue: { summary: "—" } },
    },
    "aria-label": {
      control: { type: "text" },
      description:
        "Nome acessível — descreve a operação medida, não o componente.",
      table: { type: { summary: "string" }, defaultValue: { summary: "—" } },
    },
  },
  args: {
    value: 42,
    min: 0,
    max: 100,
    variant: "",
    "aria-label": "Progresso do upload",
  },
};

export default meta;
type Story = StoryObj<ProgressArgs>;

export const Playground: Story = {
  parameters: {
    covers: ["accessibility.item1", "accessibility.item3", "accessibility.item4"],
  },
  render: (args) => (
    <div className="nds-w-md">
      <Progress
        value={args.value}
        min={args.min}
        max={args.max}
        data-variant={args.variant || undefined}
        aria-label={args["aria-label"]}
      />
    </div>
  ),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    // A expectativa sai da MESMA regra que as cinco stacks usam — o control pode
    // levar o valor para fora da faixa ou esvaziá-lo, e a asserção acompanha.
    const range = resolveProgressRange(args.min, args.max);
    const value = resolveProgressValue(args.value, range);

    await step("A raiz é anunciada como barra de progresso, com nome próprio", async () => {
      const bar = canvas.getByRole("progressbar", { name: args["aria-label"] });
      await expect(bar).toHaveAttribute("data-slot", "progress");
    });

    await step("A escala inteira chega ao leitor de tela", async () => {
      const bar = canvas.getByRole("progressbar");
      await expect(bar).toHaveAttribute("aria-valuemin", String(range.min));
      await expect(bar).toHaveAttribute("aria-valuemax", String(range.max));
      if (value === null) {
        await expect(bar).not.toHaveAttribute("aria-valuenow");
      } else {
        await expect(bar).toHaveAttribute("aria-valuenow", String(value));
      }
    });

    await step("O texto anunciado é o da regra compartilhada", async () => {
      // Sem a regra, a lib anunciava a frase de indeterminado em inglês.
      await expect(canvas.getByRole("progressbar")).toHaveAttribute(
        "aria-valuetext",
        progressValueText(value, range),
      );
    });

    await step("A barra não entra na ordem do Tab", async () => {
      // É indicador passivo: foco nela seria uma parada sem ação.
      await expect(canvas.getByRole("progressbar")).not.toHaveAttribute("tabindex");
    });

    await step("A barra desenhada corresponde ao valor anunciado", async () => {
      // Atributo certo com desenho errado já passou por aqui: medir é o único
      // jeito de saber que o valor virou pixel.
      if (value === null) return;
      const expected = ((value - range.min) / (range.max - range.min)) * 100;
      await waitFor(async () => {
        await expect(
          Math.abs(percentualDesenhado(canvasElement) - expected),
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
