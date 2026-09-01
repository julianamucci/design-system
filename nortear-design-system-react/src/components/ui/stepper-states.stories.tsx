import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, userEvent, within, expect } from "storybook/test";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "./stepper";
import {
  FLOW_LABEL,
  STATE_LABELS,
  STEP_TITLES,
  stepperItem,
  stepperPart,
} from "./stepper.fixtures";
import {
  stepperCompletedSource,
  stepperDisabledSource,
  stepperSource,
} from "./stepper.source";

/** Etapa em que o fluxo está — as três derivações saem da comparação com ela. */
const CURRENT_STEP = 2;

/** Etapa que cada story usa para demonstrar o seu estado. */
const COMPLETED_STEP = 1;
const INACTIVE_STEP = 3;
const DISABLED_STEP = 3;
/** Etapa depois da atual, marcada como concluída à mão. */
const OUT_OF_ORDER_STEP = 4;

// Espião de módulo: as sub-stories não têm `args`, e é ele que permite provar
// que a etapa indisponível não dispara seleção nenhuma.
const onStepSelect = fn();

const meta: Meta = {
  title: "Primitives/Navigation/Stepper/States",
  component: Stepper,
  tags: ["navigation"],
  parameters: {
    layout: "padded",
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: stepperSource },
      description: {
        component:
          "As quatro situações em que uma etapa pode estar. Três delas são DERIVADAS do valor do " +
          "fluxo — concluída, atual e ainda não alcançada saem da comparação entre o número da " +
          "etapa e o valor da raiz, e não de um estado escrito à mão. A quarta, indisponível, é a " +
          "única que a aplicação afirma.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

interface FlowProps {
  /** Etapa marcada como indisponível, se houver. */
  disabledStep?: number;
  /** Etapa marcada como concluída fora de ordem, se houver. */
  completedStep?: number;
}

function flow({ disabledStep, completedStep }: FlowProps = {}) {
  return (
    <Stepper
      value={CURRENT_STEP}
      aria-label={FLOW_LABEL}
      labels={STATE_LABELS}
      onStepSelect={onStepSelect}
      className="nds-w-lg"
    >
      {STEP_TITLES.map((title, i) => {
        const position = i + 1;
        return (
          <StepperItem
            key={title}
            step={position}
            completed={position === completedStep || undefined}
            disabled={position === disabledStep || undefined}
          >
            <StepperTrigger>
              <StepperIndicator />
              <StepperTitle>{title}</StepperTitle>
            </StepperTrigger>
            {i < STEP_TITLES.length - 1 && <StepperSeparator />}
          </StepperItem>
        );
      })}
    </Stepper>
  );
}

// ─── Inactive ─────────────────────────────────────────────────────────────────

export const Inactive: Story = {
  render: () => flow(),
  parameters: {
    docs: {
      description: {
        story:
          "Etapa ainda não alcançada — círculo neutro com o número da etapa. Não carrega palavra " +
          "de estado nenhuma: um rótulo fixo aqui estaria errado no passo seguinte, quando esta " +
          "mesma etapa virar a atual.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step("A etapa depois da atual se declara não alcançada", async () => {
      const item = stepperItem(canvasElement, INACTIVE_STEP);
      await expect(item).toHaveAttribute("data-state", "inactive");
      // Nem `data-completed` nem `data-disabled`: o estado é derivado, e nada
      // foi afirmado sobre esta etapa.
      await expect(item).not.toHaveAttribute("data-completed");
      await expect(item).not.toHaveAttribute("data-disabled");
    });

    await step("Mostra o número, e não a marca de verificação", async () => {
      const indicator = stepperPart(
        canvasElement,
        INACTIVE_STEP,
        "stepper-indicator"
      );
      await expect(indicator).toHaveTextContent(String(INACTIVE_STEP));
      await expect(indicator.querySelector("svg")).toBeNull();
    });

    await step("Não se anuncia como atual nem carrega palavra de estado", async () => {
      const trigger = stepperPart(
        canvasElement,
        INACTIVE_STEP,
        "stepper-trigger"
      );
      await expect(trigger).not.toHaveAttribute("aria-current");
      await expect(trigger).toBeEnabled();
      await expect(
        stepperPart(canvasElement, INACTIVE_STEP, "stepper-state-label")
          .textContent
      ).toBe("");
    });
  },
};

// ─── Active ───────────────────────────────────────────────────────────────────

export const Active: Story = {
  render: () => flow(),
  parameters: {
    docs: {
      description: {
        story:
          "Etapa atual — círculo no primário e `aria-current=\"step\"` no controle. A palavra de " +
          "estado da raiz entra aqui como texto só para leitor de tela.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("A etapa igual ao valor do fluxo é a atual", async () => {
      await expect(stepperItem(canvasElement, CURRENT_STEP)).toHaveAttribute(
        "data-state",
        "active"
      );
      await expect(
        stepperPart(canvasElement, CURRENT_STEP, "stepper-trigger")
      ).toHaveAttribute("aria-current", "step");
    });

    await step("E é a ÚNICA — dois 'atual' são piores que nenhum", async () => {
      await expect(
        canvasElement.querySelectorAll('[aria-current="step"]')
      ).toHaveLength(1);
    });

    await step("A palavra de estado acompanha o gatilho da etapa atual", async () => {
      await expect(
        stepperPart(canvasElement, CURRENT_STEP, "stepper-state-label")
      ).toHaveTextContent(STATE_LABELS.current);
      // E ela ENTRA no nome acessível do controle: a busca por papel só acha o
      // gatilho da etapa atual porque a palavra faz parte do que é anunciado.
      // Um `.nds-sr-only` que não chegasse ao nome não seria lido por ninguém.
      const announced = canvas.getByRole("button", {
        name: new RegExp(STATE_LABELS.current),
      });
      await expect(
        announced.closest('[data-slot="stepper-item"]')
      ).toHaveAttribute("data-step", String(CURRENT_STEP));
    });

    await step("O indicador da etapa atual segue mostrando o número", async () => {
      const indicator = stepperPart(
        canvasElement,
        CURRENT_STEP,
        "stepper-indicator"
      );
      await expect(indicator).toHaveTextContent(String(CURRENT_STEP));
      await expect(indicator.querySelector("svg")).toBeNull();
    });
  },
};

// ─── Completed ────────────────────────────────────────────────────────────────

export const Completed: Story = {
  parameters: {
    covers: ["functional.item4", "visual.item2"],
    docs: {
      // A etapa concluída fora de ordem é afirmada no item, e o snippet do
      // `meta` — que deriva tudo do valor do fluxo — não teria como mostrá-la.
      source: { transform: stepperCompletedSource },
      description: {
        story:
          "Etapa concluída — o número dá lugar a uma marca de verificação, e o traço até a próxima " +
          "acompanha a cor. A última etapa está marcada como concluída à mão, embora venha DEPOIS " +
          "da atual: é o caso do fluxo que aceita ordem fora do comum.",
      },
    },
  },
  render: () => flow({ completedStep: OUT_OF_ORDER_STEP }),
  play: async ({ canvasElement, step }) => {
    await step("A etapa anterior à atual é concluída por derivação", async () => {
      const item = stepperItem(canvasElement, COMPLETED_STEP);
      await expect(item).toHaveAttribute("data-state", "completed");
      // Sem `data-completed`: ninguém afirmou nada sobre ela, o estado saiu da
      // comparação com o valor do fluxo.
      await expect(item).not.toHaveAttribute("data-completed");
    });

    await step("A etapa posterior marcada à mão também é concluída", async () => {
      const item = stepperItem(canvasElement, OUT_OF_ORDER_STEP);
      await expect(item).toHaveAttribute("data-completed");
      await expect(item).toHaveAttribute("data-state", "completed");
    });

    await step("As duas mostram a marca de verificação em vez do número", async () => {
      for (const position of [COMPLETED_STEP, OUT_OF_ORDER_STEP]) {
        const indicator = stepperPart(
          canvasElement,
          position,
          "stepper-indicator"
        );
        const check = indicator.querySelector("svg");
        await expect(check).not.toBeNull();
        // Um svg vazio seria uma marca que não desenhou nada, e ninguém veria
        // falhar.
        await expect(check!.childElementCount).toBeGreaterThan(0);
        await expect(indicator.textContent).toBe("");
      }
    });

    await step("E levam a palavra 'concluída' a quem não vê a marca", async () => {
      for (const position of [COMPLETED_STEP, OUT_OF_ORDER_STEP]) {
        await expect(
          stepperPart(canvasElement, position, "stepper-state-label")
        ).toHaveTextContent(STATE_LABELS.completed);
      }
    });

    await step("A concluída não é a atual", async () => {
      await expect(
        stepperPart(canvasElement, OUT_OF_ORDER_STEP, "stepper-trigger")
      ).not.toHaveAttribute("aria-current");
      await expect(
        canvasElement.querySelectorAll('[aria-current="step"]')
      ).toHaveLength(1);
    });
  },
};

// ─── Disabled ─────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  parameters: {
    covers: ["functional.item3", "accessibility.item5", "visual.item3"],
    docs: {
      // `disabled` desce para UM item, e só existe neste `render`.
      source: { transform: stepperDisabledSource },
      description: {
        story:
          "Etapa indisponível — o controle sai da ordem de tabulação e o item deixa de responder " +
          "ao ponteiro. Um botão focável que não leva a lugar nenhum é uma parada de foco que " +
          "gasta o tempo de quem navega por teclado sem entregar nada.",
      },
    },
  },
  render: () => flow({ disabledStep: DISABLED_STEP }),
  play: async ({ canvasElement, step }) => {
    const doc = canvasElement.ownerDocument;

    await step("O item se declara indisponível e o controle é disabled", async () => {
      await expect(stepperItem(canvasElement, DISABLED_STEP)).toHaveAttribute(
        "data-disabled"
      );
      // `disabled` de verdade, e não `aria-disabled`: aqui não há navegação por
      // seta que precise alcançar a etapa para anunciá-la, então mantê-la
      // focável só custaria uma parada de foco sem destino.
      await expect(
        stepperPart(canvasElement, DISABLED_STEP, "stepper-trigger")
      ).toBeDisabled();
    });

    await step("E o item deixa de responder ao ponteiro", async () => {
      await expect(
        getComputedStyle(stepperItem(canvasElement, DISABLED_STEP)).pointerEvents
      ).toBe("none");
    });

    await step("O Tab pula a etapa indisponível", async () => {
      // Precondição do PRÓPRIO passo: no replay o foco ficou onde a rodada
      // anterior o deixou, e um `tab()` a partir dali começaria em outro lugar.
      (doc.activeElement as HTMLElement | null)?.blur();
      stepperPart(canvasElement, DISABLED_STEP - 1, "stepper-trigger").focus();
      await userEvent.tab();
      await expect(
        stepperPart(canvasElement, DISABLED_STEP + 1, "stepper-trigger")
      ).toHaveFocus();
    });

    await step("E o clique nela não seleciona etapa nenhuma", async () => {
      onStepSelect.mockClear();
      // `pointerEventsCheck: 0` porque o alvo tem o ponteiro bloqueado: sem
      // isso o userEvent recusa o clique e o teste passaria sem exercitar nada.
      await userEvent.click(
        stepperPart(canvasElement, DISABLED_STEP, "stepper-trigger"),
        { pointerEventsCheck: 0 }
      );
      await expect(onStepSelect).not.toHaveBeenCalled();
    });

    await step("Enquanto uma etapa disponível continua selecionando", async () => {
      // O contraponto é o que dá dentes ao passo anterior: sem ele, um
      // `onStepSelect` desligado por engano passaria como sucesso.
      onStepSelect.mockClear();
      await userEvent.click(
        stepperPart(canvasElement, DISABLED_STEP + 1, "stepper-trigger")
      );
      await expect(onStepSelect).toHaveBeenLastCalledWith(DISABLED_STEP + 1);
    });
  },
};
