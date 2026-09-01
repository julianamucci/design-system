import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn, userEvent, waitFor, within, expect } from "storybook/test";
import { Button } from "@/components/ui/button";
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "./stepper";
import {
  BACK_LABEL,
  FLOW_LABEL,
  NEXT_LABEL,
  STATE_LABELS,
  STEP_HINTS,
  STEP_TITLES,
  stepperPart,
  stepperRoot,
} from "./stepper.fixtures";
import {
  stepperSource,
  stepperWithDescriptionsSource,
  stepperWizardSource,
} from "./stepper.source";

/** Etapa em que o fluxo abre, e para onde a play o devolve no replay. */
const FIRST_STEP = 1;
/** Etapa que o fluxo mostra quando o valor é fixo. */
const CURRENT_STEP = 2;

// Espião de módulo: prova que o número que chega ao callback é o da etapa
// escolhida, e não o índice nem o valor anterior do fluxo.
const onStepSelect = fn();

const meta: Meta = {
  title: "Primitives/Navigation/Stepper/Compositions",
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
          "Os dois modos de uso canônicos. Em ambos a fiação vem de FORA: o valor do fluxo é a " +
          "aplicação que decide, e o componente apenas avisa qual etapa foi escolhida. Nenhum dos " +
          "dois usa região viva — quem anuncia o avanço é o painel que trocou de conteúdo.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Wizard ───────────────────────────────────────────────────────────────────

/**
 * Fluxo completo: o indicador acima do painel, com voltar e avançar embaixo.
 *
 * Um caminho só — o valor vive no `useState` e desce para o componente. Não há
 * ramo "não controlado" ao lado: a metade menos exercitada apodreceria sem
 * ninguém notar.
 */
function MultiStepSignUp() {
  const [position, setPosition] = useState(FIRST_STEP);

  return (
    <div className="nds-stack" data-spacing="lg">
      <Stepper
        value={position}
        aria-label={FLOW_LABEL}
        labels={STATE_LABELS}
        onStepSelect={(next) => {
          onStepSelect(next);
          setPosition(next);
        }}
        className="nds-w-lg"
      >
        {STEP_TITLES.map((title, i) => (
          <StepperItem key={title} step={i + 1}>
            <StepperTrigger>
              <StepperIndicator />
              <StepperTitle>{title}</StepperTitle>
            </StepperTrigger>
            {i < STEP_TITLES.length - 1 && <StepperSeparator />}
          </StepperItem>
        ))}
      </Stepper>

      {/* O painel é quem troca de conteúdo, e é por ele que a pessoa descobre
          que o fluxo avançou — sem região viva por cima da leitura da tela. */}
      <div
        className="nds-stack nds-p-4 nds-rounded-md nds-border-default"
        data-spacing="sm"
      >
        <h3 className="nds-text-h3">
          {STEP_TITLES[position - 1]} — {position}/{STEP_TITLES.length}
        </h3>
        <p className="nds-text-body">{STEP_HINTS[position - 1]}</p>
      </div>

      <div className="nds-cluster" data-spacing="md">
        <Button
          variant="outline"
          disabled={position === FIRST_STEP}
          onClick={() => setPosition(position - 1)}
        >
          {BACK_LABEL}
        </Button>
        <Button
          disabled={position === STEP_TITLES.length}
          onClick={() => setPosition(position + 1)}
        >
          {NEXT_LABEL}
        </Button>
      </div>
    </div>
  );
}

export const Wizard: Story = {
  parameters: {
    covers: ["functional.item2", "visual.item4"],
    docs: {
      // O estado externo vive num `useState` que o snippet do `meta` não
      // imprime, e é justamente ele o que esta composição ensina.
      source: { transform: stepperWizardSource },
      description: {
        story:
          "Fluxo completo — o indicador acima do painel da etapa, com os controles de voltar e " +
          "avançar embaixo. Selecionar uma etapa no indicador leva ao mesmo lugar que os botões: " +
          "quem decide é o estado de fora, e o componente só avisa qual etapa foi escolhida.",
      },
    },
  },
  render: () => <MultiStepSignUp />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = () => stepperRoot(canvasElement);
    const trigger = (position: number) =>
      stepperPart(canvasElement, position, "stepper-trigger");

    // Par idempotente: clicar numa etapa que já é a atual a MANTÉM atual, então
    // só clicamos quando o alvo ainda não é o atual. O que quebra o replay é o
    // clique cego, que parte de um estado que a asserção seguinte não conhece.
    // Dentro do `waitFor` só há leitura pura — nada aqui toca o DOM, e por isso
    // a tentativa não provoca a própria reagendamento.
    const selectStep = async (position: number) => {
      if (trigger(position).getAttribute("aria-current") !== "step") await userEvent.click(trigger(position));
      await waitFor(() =>
        expect(trigger(position)).toHaveAttribute("aria-current", "step")
      );
    };

    await step("O fluxo abre na primeira etapa", async () => {
      await selectStep(FIRST_STEP);
      await expect(root()).toHaveAttribute("data-value", String(FIRST_STEP));
      await expect(canvas.getByRole("button", { name: BACK_LABEL })).toBeDisabled();
    });

    await step("Avançar leva o indicador para a etapa seguinte", async () => {
      await selectStep(FIRST_STEP);
      await userEvent.click(canvas.getByRole("button", { name: NEXT_LABEL }));
      await waitFor(() =>
        expect(root()).toHaveAttribute("data-value", String(CURRENT_STEP))
      );
      await expect(trigger(CURRENT_STEP)).toHaveAttribute("aria-current", "step");
      // A etapa que ficou para trás vira concluída sem ninguém escrever nada.
      await expect(
        stepperPart(canvasElement, FIRST_STEP, "stepper-indicator").querySelector(
          "svg"
        )
      ).not.toBeNull();
    });

    await step("O painel abaixo é quem conta que a etapa mudou", async () => {
      await expect(canvas.getByRole("heading", { level: 3 })).toHaveTextContent(
        STEP_TITLES[CURRENT_STEP - 1]
      );
      await expect(canvas.getByText(STEP_HINTS[CURRENT_STEP - 1])).toBeVisible();
    });

    await step("Selecionar uma etapa entrega o número DAQUELA etapa", async () => {
      // A precondição garante que o alvo ainda NÃO é o atual: sem ela o par
      // idempotente não clicaria, e o espião ficaria sem chamada para provar.
      await selectStep(FIRST_STEP);
      onStepSelect.mockClear();
      const chosen = STEP_TITLES.length;
      await selectStep(chosen);
      await expect(onStepSelect).toHaveBeenLastCalledWith(chosen);
      await expect(root()).toHaveAttribute("data-value", String(chosen));
      // Na última etapa não há para onde avançar.
      await expect(canvas.getByRole("button", { name: NEXT_LABEL })).toBeDisabled();
    });

    await step("Voltar recua uma etapa", async () => {
      await selectStep(STEP_TITLES.length);
      await userEvent.click(canvas.getByRole("button", { name: BACK_LABEL }));
      await waitFor(() =>
        expect(root()).toHaveAttribute(
          "data-value",
          String(STEP_TITLES.length - 1)
        )
      );
      await selectStep(FIRST_STEP);
    });
  },
};

// ─── Com descrições ───────────────────────────────────────────────────────────

export const WithDescriptions: Story = {
  parameters: {
    docs: {
      // A descrição é a peça a mais, e o snippet do `meta` não a tem.
      source: { transform: stepperWithDescriptionsSource },
      description: {
        story:
          "Etapas com texto de apoio sob o título, para quando o nome sozinho não basta. O apoio " +
          "vive DENTRO do controle, então entra no que o leitor de tela anuncia junto com o nome " +
          "da etapa — e não vira um segundo alvo de foco.",
      },
    },
  },
  render: () => (
    <Stepper
      value={CURRENT_STEP}
      aria-label={FLOW_LABEL}
      labels={STATE_LABELS}
      className="nds-w-lg"
    >
      {STEP_TITLES.map((title, i) => (
        <StepperItem key={title} step={i + 1}>
          <StepperTrigger>
            <StepperIndicator />
            <StepperTitle>{title}</StepperTitle>
            <StepperDescription>{STEP_HINTS[i]}</StepperDescription>
          </StepperTrigger>
          {i < STEP_TITLES.length - 1 && <StepperSeparator />}
        </StepperItem>
      ))}
    </Stepper>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Cada etapa carrega o próprio texto de apoio", async () => {
      const hints = canvasElement.querySelectorAll(
        '[data-slot="stepper-description"]'
      );
      await expect(hints).toHaveLength(STEP_TITLES.length);
      await expect(Array.from(hints).map((el) => el.textContent)).toEqual([
        ...STEP_HINTS,
      ]);
    });

    await step("O apoio fica dentro do controle, e não ao lado dele", async () => {
      for (let i = 0; i < STEP_TITLES.length; i += 1) {
        const hint = stepperPart(canvasElement, i + 1, "stepper-description");
        await expect(hint.closest('[data-slot="stepper-trigger"]')).toBe(
          stepperPart(canvasElement, i + 1, "stepper-trigger")
        );
      }
    });

    await step("E entra no que o leitor de tela anuncia", async () => {
      // A busca por papel só encontra o gatilho porque título e apoio compõem
      // um nome acessível só — o apoio não é um controle à parte.
      const announced = canvas.getByRole("button", {
        name: new RegExp(STEP_HINTS[0]),
      });
      await expect(
        announced.closest('[data-slot="stepper-item"]')
      ).toHaveAttribute("data-step", String(FIRST_STEP));
      // Quatro etapas, quatro controles: se o apoio virasse alvo próprio,
      // apareceria um quinto na contagem.
      await expect(canvas.getAllByRole("button")).toHaveLength(
        STEP_TITLES.length
      );
    });
  },
};
