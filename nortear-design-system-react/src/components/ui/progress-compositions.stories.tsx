import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { within, expect, waitFor } from "storybook/test";
import {
  Progress,
  ProgressLabel,
  ProgressTrack,
  ProgressIndicator,
  ProgressValue,
} from "./progress";
import {
  barrasDeProgresso,
  contrastBarTrack,
  accessibleName,
  percentualDesenhado,
} from "@shared/testing/progress-probe";
import {
  progressWithAriaLiveSource,
  progressColorsSource,
  progressLabelEValorSource,
  progressSource,
  progressMultipleLevelsSource,
} from "./progress.source";

const meta = {
  title: "UI/Progress/Compositions",
  tags: ["feedback"],
  component: Progress,
  parameters: {
    layout: "padded",
    docs: {
      source: { transform: progressSource },
      description: {
        component:
          "Composicoes do Progress: várias barras lado a lado, cores semânticas numa lista, rótulo com valor formatado e texto aria-live anunciando o progresso.",
      },
    },
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof Progress>;

export const MultipleLevels: Story = {
  parameters: {
    docs: {
      // Três barras irmãs, cada uma com o próprio nome — o meta imprime uma.
      source: { transform: progressMultipleLevelsSource },
    },
  },
  render: () => (
    <div className="nds-stack nds-w-sm" data-spacing="md">
      <Progress value={0} aria-label="Etapa 1" />
      <Progress value={50} aria-label="Etapa 2" />
      <Progress value={100} aria-label="Etapa 3" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("3 progressbars no DOM", async () => {
      await expect(canvas.getAllByRole("progressbar")).toHaveLength(3);
    });

    await step("Cada barra anuncia o próprio valor", async () => {
      const values = canvas
        .getAllByRole("progressbar")
        .map((b) => b.getAttribute("aria-valuenow"));
      await expect(values).toEqual(["0", "50", "100"]);
    });

    await step("Cada barra desenha o próprio valor", async () => {
      // Três barras com o mesmo desenho e atributos diferentes é o defeito que
      // a lista existe para pegar.
      const barras = canvas.getAllByRole("progressbar");
      await waitFor(async () => {
        for (const [i, esperado] of [0, 50, 100].entries()) {
          await expect(
            Math.abs(percentualDesenhado(barras[i]) - esperado),
          ).toBeLessThan(2);
        }
      });
    });
  },
};

export const CustomColor: Story = {
  parameters: {
    docs: {
      // A lista com `data-variant` não sai de control nenhum neste arquivo.
      source: { transform: progressColorsSource },
    },
  },
  render: () => (
    <div className="nds-stack nds-w-sm" data-spacing="md">
      <Progress
        value={100}
        data-variant="success"
        aria-label="Sincronização concluída"
      />
      <Progress
        value={72}
        aria-label="Progresso do backup"
      />
      <Progress
        value={92}
        data-variant="destructive"
        aria-label="Espaço de armazenamento quase esgotado"
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("3 progressbars, uma por cor", async () => {
      await expect(canvas.getAllByRole("progressbar")).toHaveLength(3);
    });

    await step("As três cores são realmente distintas", async () => {
      const colors = canvas
        .getAllByRole("progressbar")
        .map(
          (raiz) =>
            getComputedStyle(
              raiz.querySelector<HTMLElement>("[data-slot='progress-indicator']")!,
            ).backgroundColor,
        );
      await expect(new Set(colors).size).toBe(3);
    });

    await step("Nenhuma variante abre mão dos 3:1 contra a trilha", async () => {
      for (const raiz of canvas.getAllByRole("progressbar")) {
        await expect(contrastBarTrack(raiz)).toBeGreaterThanOrEqual(3);
      }
    });

    await step("Toda barra da lista tem nome acessível", async () => {
      for (const bar of barrasDeProgresso(canvasElement)) {
        await expect(accessibleName(bar)).not.toBe("");
      }
    });
  },
};

export const WithLabelAndValue: Story = {
  parameters: {
    docs: {
      // Composição de quatro peças mais o valor vivo, que só existe no `render`.
      source: { transform: progressLabelEValorSource },
    },
  },
  render: function WithLabelEValorRender() {
    const [value, setValue] = useState<number>(0);

    useEffect(() => {
      const id = setInterval(() => {
        setValue((v) => (v >= 100 ? 0 : v + 5));
      }, 350);
      return () => clearInterval(id);
    }, []);

    return (
      <div className="nds-w-sm">
        <Progress value={value}>
          <ProgressLabel>Enviando arquivo</ProgressLabel>
          <ProgressValue />
          <ProgressTrack>
            <ProgressIndicator />
          </ProgressTrack>
        </Progress>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Rótulo visível e nome acessível são o mesmo texto", async () => {
      await expect(canvas.getByText("Enviando arquivo")).toBeVisible();
      await expect(
        canvas.getByRole("progressbar", { name: "Enviando arquivo" }),
      ).toBeInTheDocument();
    });

    await step("O valor formatado é escrito pelo componente", async () => {
      const valor = canvasElement.querySelector<HTMLElement>(
        "[data-slot='progress-value']",
      )!;
      await expect(valor.textContent?.trim()).toMatch(/^\d+%$/);
    });

    await step("A composição rende uma trilha só", async () => {
      await expect(
        canvasElement.querySelectorAll("[data-slot='progress-track']"),
      ).toHaveLength(1);
    });
  },
};

export const WithAriaLive: Story = {
  parameters: {
    docs: {
      // A região `aria-live` ao lado da barra é a composição que a story ensina.
      source: { transform: progressWithAriaLiveSource },
    },
  },
  render: function WithAriaLiveRender() {
    const [value, setValue] = useState<number>(0);

    useEffect(() => {
      const id = setInterval(() => {
        setValue((v) => (v >= 100 ? 0 : v + 10));
      }, 600);
      return () => clearInterval(id);
    }, []);

    return (
      <div className="nds-stack nds-w-sm" data-spacing="sm">
        <p className="nds-text-body" aria-live="polite">
          {value}% concluído
        </p>
        <Progress value={value} aria-label="Progresso do upload" />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("O texto vive numa região polite, não assertive", async () => {
      // `assertive` interrompe o leitor a cada ponto percentual — é a razão de
      // o par Do & Don't desta página existir.
      const live = canvasElement.querySelector("[aria-live]")!;
      await expect(live).toHaveAttribute("aria-live", "polite");
    });

    await step("O texto anunciado acompanha o valor da barra", async () => {
      const bar = canvas.getByRole("progressbar");
      const live = canvasElement.querySelector("[aria-live='polite']")!;
      const ofText = Number(live.textContent?.match(/\d+/)?.[0]);
      await expect(String(ofText)).toBe(bar.getAttribute("aria-valuenow"));
    });

    await step("A barra continua com nome próprio", async () => {
      await expect(
        canvas.getByRole("progressbar", { name: "Progresso do upload" }),
      ).toBeInTheDocument();
    });
  },
};
