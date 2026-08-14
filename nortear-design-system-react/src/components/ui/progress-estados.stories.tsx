import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect, waitFor } from "storybook/test";
import { Progress } from "./progress";
import {
  animacaoDoIndicador,
  indicadorDoProgresso,
  percentualDesenhado,
} from "@shared/testing/progress-probe";

const meta = {
  title: "UI/Progress/States",
  tags: ["feedback"],
  component: Progress,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Estados derivados do valor: default (0), loading (parcial), complete (100) e indeterminate (sem valor). O estado é do primitivo — chega ao DOM em data-progressing, data-complete e data-indeterminate.",
      },
    },
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  parameters: { covers: ["functional.item1", "visual.item1"] },
  render: () => (
    <div className="nds-w-sm">
      <Progress value={0} aria-label="Progresso inicial" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("value=0 anuncia zero e não desenha preenchimento", async () => {
      await expect(canvas.getByRole("progressbar")).toHaveAttribute(
        "aria-valuenow",
        "0",
      );
      await waitFor(async () => {
        await expect(percentualDesenhado(canvasElement)).toBeLessThan(1);
      });
    });

    await step("Zero não é o mesmo que indeterminate", async () => {
      // Sem esta linha, um bug que trocasse 0 por null passaria: as duas telas
      // são idênticas, mas só uma delas informa o progresso ao leitor.
      const bar = canvas.getByRole("progressbar");
      await expect(bar).not.toHaveAttribute("data-indeterminate");
      await expect(bar).toHaveAttribute("data-progressing", "");
    });
  },
};

export const Loading: Story = {
  parameters: { covers: ["functional.item2", "visual.item2"] },
  render: () => (
    <div className="nds-w-sm">
      <Progress value={50} aria-label="Carregando dados" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("value=50 preenche metade da trilha", async () => {
      await expect(canvas.getByRole("progressbar")).toHaveAttribute(
        "aria-valuenow",
        "50",
      );
      await waitFor(async () => {
        await expect(
          Math.abs(percentualDesenhado(canvasElement) - 50),
        ).toBeLessThan(2);
      });
    });

    await step("O estado em progresso chega ao DOM", async () => {
      const bar = canvas.getByRole("progressbar");
      await expect(bar).toHaveAttribute("data-progressing", "");
      await expect(bar).not.toHaveAttribute("data-complete");
    });
  },
};

export const Complete: Story = {
  parameters: { covers: ["functional.item3", "visual.item3"] },
  render: () => (
    <div className="nds-w-sm">
      <Progress value={100} aria-label="Concluído" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("value=100 preenche a trilha inteira", async () => {
      await expect(canvas.getByRole("progressbar")).toHaveAttribute(
        "aria-valuenow",
        "100",
      );
      await waitFor(async () => {
        await expect(
          Math.abs(percentualDesenhado(canvasElement) - 100),
        ).toBeLessThan(2);
      });
    });

    await step("A conclusão é um estado próprio no DOM", async () => {
      // `data-complete` é o gancho de quem quer trocar cor ou remover a barra
      // ao fim — sem ele, o consumidor teria que comparar value com max.
      const bar = canvas.getByRole("progressbar");
      await expect(bar).toHaveAttribute("data-complete", "");
      await expect(bar).not.toHaveAttribute("data-progressing");
    });
  },
};

export const Indeterminate: Story = {
  parameters: { covers: ["functional.item4", "visual.item4"] },
  render: () => (
    <div className="nds-w-sm">
      <Progress value={null} aria-label="Processando" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Sem valor, aria-valuenow some e o nome permanece", async () => {
      // Um `aria-valuenow` fixo em 0 mentiria: diria "zero por cento" quando a
      // verdade é "não sei quanto falta".
      const bar = canvas.getByRole("progressbar", { name: "Processando" });
      await expect(bar).not.toHaveAttribute("aria-valuenow");
      await expect(bar).toHaveAttribute("data-indeterminate", "");
    });

    await step("O traço corre de verdade", async () => {
      // Medir POSIÇÃO no meio de uma animação infinita é racy por construção —
      // o traço está sempre em outro lugar. Afirmar a existência da animação,
      // pelo nome do keyframes do design system, é o que dá para provar sem
      // sorte. Foi assim que se descobriu que não havia animação nenhuma.
      await waitFor(async () => {
        await expect(animacaoDoIndicador(canvasElement)).toBe(
          "nds-progress-indeterminate",
        );
      });
    });

    await step("O traço é o do design system, não o de um homônimo", async () => {
      // Discriminador do defeito que estava vivo: um segundo
      // `@keyframes nds-progress-indeterminate` morava em `tw-compat.css`, o
      // último import da folha, e vencia calado — mesmo NOME, outro conteúdo.
      // Afirmar o nome da animação não separa os dois; o efeito separa. O ciclo
      // do design system desloca `margin-inline-start` e deixa `transform` em
      // `none`; o homônimo animava `transform`, e aqui apareceria uma matriz.
      await expect(
        getComputedStyle(indicadorDoProgresso(canvasElement)).transform,
      ).toBe("none");
    });
  },
};
