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
import { PROGRESS_INDETERMINATE_TEXT } from "@shared/primitives/progress-value";
import {
  progressWithLabelSource,
  progressSemanticColorSource,
  progressOmittedValueSource,
  progressSource,
} from "./progress.source";

const meta = {
  title: "Components/Feedback/Progress/Variants",
  tags: ["feedback"],
  component: Progress,
  parameters: {
    layout: "padded",
    docs: {
      source: { transform: progressSource },
      description: {
        component:
          "As formas de uso: valor conhecido, valor desconhecido, valor com rótulo e cor semântica. Rótulo e valor formatado são partes do próprio componente — não texto solto ao lado.",
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
    <div className="nds-w-md">
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
    covers: ["functional.item6"],
    docs: {
      // A AUSÊNCIA de `value` é o assunto e não sai de nenhum control deste arquivo.
      source: { transform: progressOmittedValueSource },
    },
  },
  render: () => (
    <div className="nds-w-md">
      <Progress aria-label="Processando…" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Omitir o valor não vira valor zero", async () => {
      // Igual ao `<progress>` nativo: sem valor, não há número a anunciar.
      const bar = canvas.getByRole("progressbar", { name: "Processando…" });
      await expect(bar).not.toHaveAttribute("aria-valuenow");
      await expect(bar).toHaveAttribute("data-indeterminate", "");
    });

    await step("A escala continua anunciada, e o texto diz que está em andamento", async () => {
      const bar = canvas.getByRole("progressbar");
      await expect(bar).toHaveAttribute("aria-valuemin", "0");
      await expect(bar).toHaveAttribute("aria-valuemax", "100");
      await expect(bar).toHaveAttribute("aria-valuetext", PROGRESS_INDETERMINATE_TEXT);
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
    <div className="nds-w-md">
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
      const label = canvasElement.querySelector<HTMLElement>(
        "[data-slot='progress-label']",
      )!;
      await expect(bar.getAttribute("aria-labelledby")).toBe(label.id);
      await expect(bar).not.toHaveAttribute("aria-label");
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
      source: { transform: progressSemanticColorSource },
    },
  },
  render: () => (
    <div className="nds-stack nds-w-md" data-spacing="sm">
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
      const [ok, critical] = canvas.getAllByRole("progressbar");
      const colorOf = (root: HTMLElement) =>
        getComputedStyle(indicadorDoProgresso(root)).backgroundColor;
      await expect(colorOf(ok)).not.toBe(colorOf(critical));
    });

    await step("As duas variantes mantêm 3:1 contra a trilha", async () => {
      // O contraste não pode depender de qual variante alguém escolheu — é o
      // motivo de a trilha continuar neutra em vez de acompanhar a cor.
      for (const root of canvas.getAllByRole("progressbar")) {
        await expect(contrastBarTrack(root)).toBeGreaterThanOrEqual(3);
      }
    });

    await step("A cor sai do atributo, não de uma classe morta", async () => {
      const [ok] = canvas.getAllByRole("progressbar");
      await expect(ok).toHaveAttribute("data-variant", "success");
    });
  },
};
