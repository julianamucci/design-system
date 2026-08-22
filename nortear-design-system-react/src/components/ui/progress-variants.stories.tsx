import type { Meta, StoryObj } from "@storybook/react-vite";
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
  indicadorDoProgresso,
  accessibleName,
  percentualDesenhado,
} from "@shared/testing/progress-probe";
import {
  progressWithLabelSource,
  progressColorSemanticaSource,
  progressIndeterminadoSource,
  progressSource,
} from "./progress.source";

const meta = {
  title: "UI/Progress/Variants",
  tags: ["feedback"],
  component: Progress,
  parameters: {
    layout: "padded",
    docs: {
      source: { transform: progressSource },
      description: {
        component:
          "As formas de uso: valor conhecido, valor com rótulo e cor semântica. Rótulo e valor formatado são partes do próprio componente — não texto solto ao lado.",
      },
    },
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof Progress>;

export const Determinate: Story = {
  parameters: { covers: ["accessibility.item2"] },
  render: () => (
    <div className="nds-w-sm">
      <Progress value={42} aria-label="Progresso do upload" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("O valor conhecido é anunciado e desenhado", async () => {
      await expect(canvas.getByRole("progressbar")).toHaveAttribute(
        "aria-valuenow",
        "42",
      );
      await waitFor(async () => {
        await expect(
          Math.abs(percentualDesenhado(canvasElement) - 42),
        ).toBeLessThan(2);
      });
    });

    await step("Indicador e trilha se distinguem com pelo menos 3:1", async () => {
      // WCAG 1.4.11: a barra só informa se for possível ver onde ela termina.
      await expect(contrastBarTrack(canvasElement)).toBeGreaterThanOrEqual(3);
    });
  },
};

export const Indeterminate: Story = {
  parameters: {
    docs: {
      // `value={null}` é o assunto e não sai de nenhum control deste arquivo.
      source: { transform: progressIndeterminadoSource },
    },
  },
  render: () => (
    <div className="nds-w-sm">
      <Progress value={null} aria-label="Processando dados" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Valor desconhecido não vira valor zero", async () => {
      const bar = canvas.getByRole("progressbar", { name: "Processando dados" });
      await expect(bar).not.toHaveAttribute("aria-valuenow");
      await expect(bar).toHaveAttribute("data-indeterminate", "");
    });

    await step("O estado chega à trilha, que é quem o CSS consulta", async () => {
      const trail = canvasElement.querySelector(
        "[data-slot='progress-track']",
      );
      await expect(trail).toHaveAttribute("data-indeterminate", "");
    });
  },
};

export const WithLabel: Story = {
  parameters: {
    covers: ["accessibility.item5"],
    docs: {
      // Composição de quatro peças: quem declara a própria trilha declara o
      // indicador junto, e o meta imprime só a barra sozinha.
      source: { transform: progressWithLabelSource },
    },
  },
  render: () => (
    <div className="nds-w-sm">
      <Progress value={42}>
        <ProgressLabel>Enviando arquivo</ProgressLabel>
        <ProgressValue />
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      </Progress>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("O rótulo visível vira o nome acessível da barra", async () => {
      // Com rótulo presente, o nome sai de `aria-labelledby` — não é preciso
      // repetir a frase num `aria-label`, que só duplicaria a manutenção.
      const bar = canvas.getByRole("progressbar", { name: "Enviando arquivo" });
      const rotulo = canvasElement.querySelector<HTMLElement>(
        "[data-slot='progress-label']",
      )!;
      await expect(bar.getAttribute("aria-labelledby")).toBe(rotulo.id);
    });

    await step("Toda barra da tela tem nome acessível", async () => {
      for (const bar of barrasDeProgresso(canvasElement)) {
        await expect(accessibleName(bar)).not.toBe("");
      }
    });

    await step("A composição não duplica a trilha", async () => {
      // Quem declara o próprio ProgressTrack recebia DUAS trilhas: a sua e a
      // que a raiz acrescentava sempre. Uma delas ficava sem indicador visível.
      await expect(
        canvasElement.querySelectorAll("[data-slot='progress-track']"),
      ).toHaveLength(1);
    });
  },
};

export const SemanticColor: Story = {
  parameters: {
    docs: {
      // Duas barras com `data-variant` — a cor só se lê em comparação.
      source: { transform: progressColorSemanticaSource },
    },
  },
  render: () => (
    <div className="nds-stack nds-w-sm" data-spacing="sm">
      <Progress
        value={100}
        data-variant="success"
        aria-label="Sincronização concluída"
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

    await step("Cada variante pinta a barra de uma cor diferente", async () => {
      const [ok, critico] = canvas.getAllByRole("progressbar");
      const colorOf = (raiz: HTMLElement) =>
        getComputedStyle(indicadorDoProgresso(raiz)).backgroundColor;
      await expect(colorOf(ok)).not.toBe(colorOf(critico));
    });

    await step("As duas variantes mantêm 3:1 contra a trilha", async () => {
      // O contraste não pode depender de qual variante alguém escolheu — é o
      // motivo de a trilha continuar neutra em vez de acompanhar a cor.
      for (const raiz of canvas.getAllByRole("progressbar")) {
        await expect(contrastBarTrack(raiz)).toBeGreaterThanOrEqual(3);
      }
    });

    await step("A cor sai do atributo, não de uma classe morta", async () => {
      const [ok] = canvas.getAllByRole("progressbar");
      await expect(ok).toHaveAttribute("data-variant", "success");
    });
  },
};
