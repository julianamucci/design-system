import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { within, expect, waitFor } from "storybook/test";
import { Progress } from "./progress";
import {
  isAnimationRunning,
  indicadorAnimation,
  indicadorDoProgresso,
  enableReducedMotion,
  percentualDesenhado,
} from "@shared/testing/progress-probe";
import { PROGRESS_INDETERMINATE_TEXT } from "@shared/primitives/progress-value";
import {
  progressAnimatedSource,
  progressCompleteSource,
  progressIndeterminateSource,
  progressLoadingSource,
  progressReducedMotionSource,
  progressSource,
  progressZeroSource,
} from "./progress.source";

const meta = {
  title: "Components/Feedback/Progress/States",
  tags: ["feedback"],
  component: Progress,
  parameters: {
    layout: "padded",
    docs: {
      source: { transform: progressSource },
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
  parameters: {
    covers: ["functional.item1", "visual.item1"],
    docs: {
      // `value={0}` está no `render`; o meta imprime o valor do Playground.
      source: { transform: progressZeroSource },
    },
  },
  render: () => (
    <div className="nds-w-md">
      <Progress value={0} aria-label="Progresso do upload" />
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
      await expect(bar).toHaveAttribute("aria-valuetext", "0%");
    });
  },
};

export const Loading: Story = {
  parameters: {
    covers: ["functional.item2", "visual.item2"],
    docs: {
      // Valor afirmado no `render`, sem control que o descreva.
      source: { transform: progressLoadingSource },
    },
  },
  render: () => (
    <div className="nds-w-md">
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

    await step("O percentual é o texto anunciado", async () => {
      await expect(canvas.getByRole("progressbar")).toHaveAttribute(
        "aria-valuetext",
        "50%",
      );
    });

    await step("O estado em progresso chega ao DOM", async () => {
      const bar = canvas.getByRole("progressbar");
      await expect(bar).toHaveAttribute("data-progressing", "");
      await expect(bar).not.toHaveAttribute("data-complete");
    });
  },
};

export const Complete: Story = {
  parameters: {
    covers: ["functional.item3", "functional.item5", "visual.item3"],
    docs: {
      // Valor afirmado no `render`, sem control que o descreva.
      source: { transform: progressCompleteSource },
    },
  },
  render: () => (
    <div className="nds-w-md">
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

    await step("Fora da faixa, o valor é limitado antes de anunciar e de desenhar", async () => {
      // As duas barras só existem durante este passo: montadas ao lado da
      // story, medidas e desmontadas no `finally`, para a foto do Chromatic
      // continuar sendo a do estado concluído.
      const host = document.createElement("div");
      host.className = "nds-stack nds-w-md";
      host.dataset.spacing = "sm";
      canvasElement.appendChild(host);
      const root = createRoot(host);
      try {
        flushSync(() => {
          root.render(
            <>
              <Progress value={140} aria-label="Acima do máximo" />
              <Progress value={-20} aria-label="Abaixo do mínimo" />
            </>,
          );
        });
        const above = within(host).getByRole("progressbar", { name: "Acima do máximo" });
        const below = within(host).getByRole("progressbar", { name: "Abaixo do mínimo" });
        await expect(above).toHaveAttribute("aria-valuenow", "100");
        await expect(above).toHaveAttribute("aria-valuetext", "100%");
        await expect(below).toHaveAttribute("aria-valuenow", "0");
        await expect(below).toHaveAttribute("aria-valuetext", "0%");
        await waitFor(async () => {
          await expect(Math.abs(percentualDesenhado(above) - 100)).toBeLessThan(2);
          await expect(percentualDesenhado(below)).toBeLessThan(1);
        });
      } finally {
        root.unmount();
        host.remove();
      }
    });
  },
};

export const Indeterminate: Story = {
  parameters: {
    covers: ["functional.item4", "visual.item4"],
    docs: {
      // A ausência de valor é o assunto: `value={null}`, não zero.
      source: { transform: progressIndeterminateSource },
    },
  },
  render: () => (
    <div className="nds-w-md">
      <Progress value={null} aria-label="Processando…" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Sem valor, aria-valuenow some e o nome permanece", async () => {
      // Um `aria-valuenow` fixo em 0 mentiria: diria "zero por cento" quando a
      // verdade é "não sei quanto falta".
      const bar = canvas.getByRole("progressbar", { name: "Processando…" });
      await expect(bar).not.toHaveAttribute("aria-valuenow");
      await expect(bar).toHaveAttribute("data-indeterminate", "");
    });

    await step("Os limites sobrevivem, e o texto diz que está em andamento", async () => {
      const bar = canvas.getByRole("progressbar");
      await expect(bar).toHaveAttribute("aria-valuemin", "0");
      await expect(bar).toHaveAttribute("aria-valuemax", "100");
      await expect(bar).toHaveAttribute("aria-valuetext", PROGRESS_INDETERMINATE_TEXT);
    });

    await step("O traço corre de verdade", async () => {
      // Medir POSIÇÃO no meio de uma animação infinita é racy por construção —
      // o traço está sempre em outro lugar. Afirmar a existência da animação,
      // pelo nome do keyframes do design system, é o que dá para provar sem
      // sorte. Foi assim que se descobriu que não havia animação nenhuma.
      await waitFor(async () => {
        await expect(indicadorAnimation(canvasElement)).toBe(
          "nds-progress-indeterminate",
        );
      });
    });

    await step("O traço é o do design system, não o de um homônimo", async () => {
      // Discriminador do defeito que estava vivo: um segundo
      // `@keyframes nds-progress-indeterminate` morava em `utilities.css`, o
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

export const Animated: Story = {
  parameters: {
    docs: {
      // O valor que anda sozinho vive no `render`: nenhum control o descreve.
      source: { transform: progressAnimatedSource },
    },
  },
  render: function AnimatedRender() {
    const [value, setValue] = useState<number>(0);

    useEffect(() => {
      const id = setInterval(() => {
        setValue((v) => (v >= 100 ? 0 : v + 5));
      }, 400);
      return () => clearInterval(id);
    }, []);

    return (
      <div className="nds-stack nds-w-md" data-spacing="xs">
        <div className="nds-cluster nds-text-body" data-justify="between">
          <span className="nds-text-foreground">Enviando arquivo</span>
          <span
            className="nds-text-muted-foreground nds-tabular-nums"
            aria-live="polite"
          >
            {value}%
          </span>
        </div>
        <Progress value={value} aria-label="Progresso do upload" />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Progressbar animado presente e nomeado", async () => {
      const bar = canvas.getByRole("progressbar", { name: "Progresso do upload" });
      await expect(bar).toHaveAttribute("aria-valuemin", "0");
      await expect(bar).toHaveAttribute("aria-valuemax", "100");
    });

    await step("O valor anunciado fica dentro da escala em toda rodada", async () => {
      // O valor muda a cada 400ms; afirmar um número seria racy. O que vale em
      // qualquer instante é o intervalo — e um valor fora dele seria defeito.
      const bar = canvas.getByRole("progressbar");
      const now = Number(bar.getAttribute("aria-valuenow"));
      await expect(Number.isFinite(now)).toBe(true);
      await expect(now >= 0 && now <= 100).toBe(true);
    });

    await step("O texto anunciado acompanha o número", async () => {
      // Os dois atributos saem do mesmo render: lidos juntos, batem.
      const bar = canvas.getByRole("progressbar");
      await expect(bar.getAttribute("aria-valuetext")).toBe(
        `${bar.getAttribute("aria-valuenow")}%`,
      );
    });

    await step("O texto da porcentagem usa aria-live=polite", async () => {
      // `assertive` interromperia o leitor a cada 5% — é o par Do & Don't desta
      // página.
      const live = canvasElement.querySelector("[aria-live]");
      await expect(live).toHaveAttribute("aria-live", "polite");
    });

    await step("O indicador transiciona em vez de saltar", async () => {
      // A suavidade é do design system, não da story: sem a transição o valor
      // pularia de 5 em 5 e a barra pareceria travada.
      const transition = getComputedStyle(
        indicadorDoProgresso(canvasElement),
      ).transitionProperty;
      await expect(transition).toContain("width");
    });
  },
};

export const ReducedMotion: Story = {
  parameters: {
    covers: ["functional.item7"],
    docs: {
      // A MESMA barra indeterminada: o que muda é a preferência do sistema, que
      // prop nenhuma controla.
      source: { transform: progressReducedMotionSource },
      description: {
        story:
          "Com movimento reduzido o traço indeterminado para no início da trilha. A barra continua dizendo que está em andamento — o que some é o movimento.",
      },
    },
  },
  render: () => (
    <div className="nds-w-md">
      <Progress value={null} aria-label="Processando dados" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    // A barra se nomeia antes de qualquer medição de movimento.
    await within(canvasElement).findByRole("progressbar", { name: "Processando dados" });
    const indicator = indicadorDoProgresso(canvasElement);

    await step("Sem a preferência, o traço anima", async () => {
      await waitFor(async () => {
        await expect(isAnimationRunning(indicator)).toBe(true);
      });
    });

    // O desfazer roda no finally para a story seguinte (e a foto do Chromatic)
    // não herdarem a marca.
    const undo = enableReducedMotion(canvasElement.ownerDocument);
    try {
      await step("Com movimento reduzido, o traço para", async () => {
        // Asserção pelo PAR nome + duração: o nome continua lá depois que a
        // duração é zerada. Dentro de `waitFor` porque a folha só aplica a
        // regra na próxima recomputação de estilo; a leitura é pura.
        await waitFor(async () => {
          await expect(isAnimationRunning(indicator)).toBe(false);
        });
      });

      await step("O traço continua visível na trilha", async () => {
        await expect(indicator.getBoundingClientRect().width).toBeGreaterThan(0);
      });
    } finally {
      undo();
    }
  },
};
