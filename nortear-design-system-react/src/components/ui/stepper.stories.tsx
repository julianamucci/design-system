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
  stepperPart,
  stepperRoot,
} from "./stepper.fixtures";
import { stepperSource } from "./stepper.source";
import { StepperDocs } from "@/components/docs/StepperDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "Primitives/Navigation/Stepper",
  component: Stepper,
  tags: ["autodocs", "navigation"],
  parameters: {
    layout: "padded",
    docs: {
      page: withAutoDocsTab(StepperDocs),
      source: { transform: stepperSource },
    },
  },
  argTypes: {
    value: {
      control: { type: "number", min: 1, max: STEP_TITLES.length, step: 1 },
      description:
        "Etapa atual, contando de 1. É dela que cada etapa deriva o próprio estado.",
      table: { type: { summary: "number" }, defaultValue: { summary: "1" } },
    },
    "aria-label": {
      control: "text",
      description:
        "Nome acessível do fluxo. Sem ele o leitor de tela anuncia só uma lista.",
      table: { type: { summary: "string" }, defaultValue: { summary: "—" } },
    },
    labels: {
      control: "object",
      description:
        "Palavras de estado do fluxo, lidas só por leitor de tela. São elas que separam concluída de futura para quem não vê a marca de verificação.",
      table: {
        type: { summary: "{ completed?: string; current?: string }" },
        defaultValue: { summary: "—" },
      },
    },
    onStepSelect: {
      // Callback não tem control: o painel entrega um espião, e o que interessa
      // é a chamada, não um valor a escolher.
      control: false,
      description:
        "Chamado com o número da etapa quando um gatilho disponível é acionado.",
      table: {
        type: { summary: "(step: number) => void" },
        defaultValue: { summary: "—" },
      },
    },
    className: {
      // Fixada pelo `render` depois do espalhamento: control aqui seria morto.
      control: false,
      description: "Classes .nds-* adicionais na raiz.",
      table: { type: { summary: "string" }, defaultValue: { summary: "—" } },
    },
  },
  args: {
    value: 2,
    "aria-label": FLOW_LABEL,
    labels: STATE_LABELS,
    onStepSelect: fn(),
  },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item1",
      "accessibility.item1",
      "accessibility.item2",
      "accessibility.item3",
      "accessibility.item4",
      "accessibility.item6",
      "visual.item1",
    ],
  },
  render: (args) => (
    <Stepper {...args} className="nds-w-lg">
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
  ),
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = () => stepperRoot(canvasElement);
    const items = () =>
      Array.from(
        root().querySelectorAll<HTMLElement>('[data-slot="stepper-item"]')
      );
    const part = (position: number, slot: string) =>
      stepperPart(canvasElement, position, slot);

    // O valor sai dos args, e não de um número cravado: trocar o control não
    // pode transformar uma asserção correta em falha inventada. O `?? 1` é o
    // MESMO padrão do componente — limpar o control não inventa outro estado.
    const current = args.value ?? 1;

    await step("A raiz é uma lista ordenada com um item por etapa", async () => {
      // A busca por nome é o que prova que o fluxo se identifica: sem
      // `aria-label` o leitor de tela anuncia apenas "lista".
      const list = canvas.getByRole("list", { name: FLOW_LABEL });
      await expect(list.tagName).toBe("OL");
      await expect(list).toHaveAttribute("data-slot", "stepper");
      await expect(canvas.getAllByRole("listitem")).toHaveLength(
        STEP_TITLES.length
      );
    });

    await step("O estado de cada etapa sai do valor do fluxo", async () => {
      await expect(root()).toHaveAttribute("data-value", String(current));
      await expect(items().map((item) => item.dataset.state)).toEqual(
        STEP_TITLES.map((_, i) => {
          const position = i + 1;
          if (position < current) return "completed";
          return position === current ? "active" : "inactive";
        })
      );
    });

    await step("Exatamente um controle se anuncia como a etapa atual", async () => {
      const marked = root().querySelectorAll('[aria-current="step"]');
      await expect(marked).toHaveLength(1);
      await expect(
        marked[0].closest('[data-slot="stepper-item"]')
      ).toHaveAttribute("data-step", String(current));
      // `step` e não `true`: o genérico diz "este é o atual" sem dizer atual
      // do quê, e é justamente a posição no processo que interessa aqui.
      await expect(marked[0].getAttribute("aria-current")).toBe("step");
    });

    await step("O estado chega por forma e por palavra, nunca só por cor", async () => {
      // Concluída: a marca de verificação SUBSTITUI o número. É forma, e
      // sobrevive a daltonismo e a tela monocromática.
      const done = part(current - 1, "stepper-indicator");
      await expect(done.querySelector("svg")).not.toBeNull();
      await expect(done.textContent).toBe("");
      // E a palavra `.nds-sr-only` leva o mesmo estado a quem não vê a marca.
      await expect(part(current - 1, "stepper-state-label")).toHaveTextContent(
        STATE_LABELS.completed
      );
      await expect(part(current, "stepper-state-label")).toHaveTextContent(
        STATE_LABELS.current
      );

      // Ainda não alcançada: o número volta, e nenhuma palavra é anunciada —
      // um rótulo fixo aqui diria "concluída" no passo seguinte.
      const upcoming = part(current + 1, "stepper-indicator");
      await expect(upcoming.querySelector("svg")).toBeNull();
      await expect(upcoming).toHaveTextContent(String(current + 1));
      await expect(part(current + 1, "stepper-state-label").textContent).toBe("");
    });

    await step("Indicador e traço ficam fora da árvore de acessibilidade", async () => {
      const decorations = root().querySelectorAll(
        '[data-slot="stepper-indicator"], [data-slot="stepper-separator"]'
      );
      // O número repete a posição que a `<ol>` já anuncia: lidos os dois, o
      // leitor de tela diz a mesma coisa duas vezes.
      for (const decoration of decorations) {
        await expect(decoration).toHaveAttribute("aria-hidden", "true");
      }
      // O traço nasce DENTRO do item, e o último não tem para onde apontar.
      await expect(
        root().querySelectorAll('[data-slot="stepper-separator"]')
      ).toHaveLength(STEP_TITLES.length - 1);
    });

    await step("Nenhuma parte do indicador se reanuncia sozinha", async () => {
      // Região viva aqui atropelaria a leitura do resto da tela a cada avanço.
      // Quem anuncia a troca é o painel que mudou de conteúdo.
      await expect(
        root().querySelectorAll(
          '[aria-live], [role="status"], [role="alert"], [role="log"]'
        )
      ).toHaveLength(0);
    });

    await step("O gatilho avisa qual etapa foi escolhida", async () => {
      // `toHaveBeenLastCalledWith` e não a contagem: no replay o espião chega
      // com as chamadas da rodada anterior, e a contagem reprovaria sozinha.
      await userEvent.click(part(STEP_TITLES.length, "stepper-trigger"));
      await expect(args.onStepSelect).toHaveBeenLastCalledWith(
        STEP_TITLES.length
      );
      // A story não controla o valor: o fluxo continua onde estava, e é isso
      // que deixa a rodada seguinte partir do mesmo lugar.
      await expect(root()).toHaveAttribute("data-value", String(current));
    });
  },
};
