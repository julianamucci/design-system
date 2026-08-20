import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, waitFor } from "storybook/test";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./resizable";
import { fracaoDoPrimeiro } from "./resizable.fixtures";
import { ResizableDocs } from "@/components/docs/ResizableDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";
import { resizableSource } from "./resizable.source";

/**
 * Rótulo do punho repetido nas stories.
 *
 * O aria-label é o nome acessível de um `role="separator"` focável — sem ele o
 * leitor de tela anuncia "separador" e nada mais. E ele diz o ATALHO, porque a
 * alternativa ao arrasto não tem nenhuma pista visual.
 */
const ROTULO_PUNHO = "Redimensionar painéis — use setas para ajustar";

type PlaygroundArgs = {
  direction: "horizontal" | "vertical";
  withHandle: boolean;
  defaultSize: number;
  minSize: number;
  maxSize: number;
};

const meta = {
  title: "UI/Resizable",
  component: ResizablePanelGroup,
  tags: ["autodocs", "layout"],
  parameters: {
    layout: "centered",
    docs: {
      page: withAutoDocsTab(ResizableDocs),
      source: { transform: resizableSource },
    },
  },
  argTypes: {
    direction: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
      description: "Split lateral (horizontal) ou empilhado (vertical).",
      table: { type: { summary: '"horizontal" | "vertical"' }, defaultValue: { summary: "horizontal" } },
    },
    withHandle: {
      control: "boolean",
      description: "Mostra o pegador visual centralizado no divisor.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    defaultSize: {
      control: { type: "range", min: 20, max: 60, step: 5 },
      description: "Tamanho inicial do primeiro painel, em porcentagem do grupo.",
      table: { type: { summary: "number" }, defaultValue: { summary: "—" } },
    },
    minSize: {
      control: { type: "range", min: 10, max: 40, step: 5 },
      description: "Tamanho mínimo de cada painel, em porcentagem do grupo.",
      table: { type: { summary: "number" }, defaultValue: { summary: "10" } },
    },
    maxSize: {
      control: { type: "range", min: 40, max: 90, step: 5 },
      description: "Tamanho máximo do primeiro painel, em porcentagem do grupo.",
      table: { type: { summary: "number" }, defaultValue: { summary: "100" } },
    },
  },
  args: {
    direction: "horizontal",
    withHandle: true,
    defaultSize: 30,
    minSize: 20,
    maxSize: 60,
  },
} satisfies Meta<PlaygroundArgs>;

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item2",
      "accessibility.item1",
      "accessibility.item4",
      "accessibility.item5",
    ],
  },
  render: ({ direction, withHandle, defaultSize, minSize, maxSize }) => (
    // key: trocar a direção com o grupo montado não é suportado pela lib.
    <div
      key={direction}
      className="nds-rounded-lg nds-border-default nds-overflow-hidden"
      style={{ width: 520, height: 280 }}
    >
      <ResizablePanelGroup direction={direction}>
        <ResizablePanel defaultSize={defaultSize} minSize={minSize} maxSize={maxSize}>
          <div className="nds-stack nds-p-4" data-spacing="xs">
            <p className="nds-text-body nds-font-semibold">Sidebar</p>
            <p className="nds-text-caption nds-text-muted-foreground">Navegação do projeto</p>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle={withHandle} aria-label={ROTULO_PUNHO} />
        <ResizablePanel defaultSize={100 - defaultSize} minSize={minSize}>
          <div className="nds-stack nds-p-4" data-spacing="xs">
            <p className="nds-text-body nds-font-semibold">Conteúdo principal</p>
            <p className="nds-text-caption nds-text-muted-foreground">
              Arraste o divisor ou use as setas com ele focado.
            </p>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const punho = canvas.getByRole("separator", { name: ROTULO_PUNHO });
    const horizontal = args.direction === "horizontal";

    await step("O divisor é um separator com nome e valor", async () => {
      // accessibility.item4 e item5 — o `getByRole` acima já falharia sem papel
      // ou sem nome. Aqui fica o VALOR, que é o que um separator focável precisa
      // ter para o leitor de tela anunciar o tamanho ao mover.
      await expect(punho).toHaveAttribute(
        "aria-orientation",
        horizontal ? "vertical" : "horizontal",
      );
      await expect(Number(punho.getAttribute("aria-valuemin"))).toBeCloseTo(args.minSize, 0);
      await expect(Number(punho.getAttribute("aria-valuenow"))).toBeCloseTo(
        fracaoDoPrimeiro(canvasElement, horizontal) * 100,
        0,
      );
    });

    await step("O tamanho declarado chega à tela na proporção pedida", async () => {
      // A lib lê NÚMERO como pixel: `defaultSize={30}` nascia com 30px, e o
      // layout aparecia 13%/87% em vez de 30%/70%. O componente converte para
      // porcentagem; esta asserção é o que impede a regressão, porque nenhuma
      // das anteriores olhava a geometria.
      await expect(fracaoDoPrimeiro(canvasElement, horizontal)).toBeCloseTo(
        args.defaultSize / 100,
        1,
      );
    });

    await step("As setas movem o divisor — o equivalente por teclado do arrasto", async () => {
      // functional.item2. Sem isto, ajustar o layout seria um gesto de arrasto
      // sem alternativa (WCAG 2.1.1 e 2.5.7).
      //
      // O par cresce/encolhe é de saldo ZERO: o painel Interactions reexecuta a
      // play no mesmo DOM, e um passo que só cresce iria encostando no limite
      // até a asserção inverter de sentido numa rodada qualquer.
      const antes = fracaoDoPrimeiro(canvasElement, horizontal);
      punho.focus();
      await expect(punho).toHaveFocus();

      const cresce = horizontal ? "{ArrowRight}" : "{ArrowDown}";
      const encolhe = horizontal ? "{ArrowLeft}" : "{ArrowUp}";

      await userEvent.keyboard(cresce);
      await waitFor(() =>
        expect(fracaoDoPrimeiro(canvasElement, horizontal)).toBeGreaterThan(antes + 0.01),
      );

      await userEvent.keyboard(encolhe);
      await waitFor(() =>
        expect(fracaoDoPrimeiro(canvasElement, horizontal)).toBeCloseTo(antes, 2),
      );
    });

    await step("A seta do outro eixo não é sequestrada", async () => {
      // Um separator vertical que consumisse ArrowUp roubaria a rolagem de quem
      // só está de passagem pelo foco.
      const antes = fracaoDoPrimeiro(canvasElement, horizontal);
      await userEvent.keyboard(horizontal ? "{ArrowUp}" : "{ArrowLeft}");
      await expect(fracaoDoPrimeiro(canvasElement, horizontal)).toBeCloseTo(antes, 2);
    });
  },
};
