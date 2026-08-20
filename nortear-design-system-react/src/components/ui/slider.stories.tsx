import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn, userEvent, within, expect } from "storybook/test";
import { Slider } from "./slider";
import { sliderSource } from "./slider.source";
import { SliderDocs } from "@/components/docs/SliderDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";
import { limitesDaAlca, valorDaAlca } from "@shared/testing/slider-probe";

const meta = {
  title: "UI/Slider",
  component: Slider,
  tags: ["autodocs", "form"],
  parameters: {
    layout: "padded",
    docs: {
      page: withAutoDocsTab(SliderDocs),
      source: { transform: sliderSource },
    },
  },
  argTypes: {
    min: {
      control: { type: "number" },
      description: "Valor mínimo da faixa.",
      table: { type: { summary: "number" }, defaultValue: { summary: "0" } },
    },
    max: {
      control: { type: "number" },
      description: "Valor máximo da faixa.",
      table: { type: { summary: "number" }, defaultValue: { summary: "100" } },
    },
    step: {
      control: { type: "number", min: 1 },
      description: "Incremento por seta de teclado.",
      table: { type: { summary: "number" }, defaultValue: { summary: "1" } },
    },
    orientation: {
      control: { type: "radio" },
      options: ["horizontal", "vertical"],
      description: "Direção do slider.",
      table: {
        type: { summary: '"horizontal" | "vertical"' },
        defaultValue: { summary: '"horizontal"' },
      },
    },
    disabled: {
      control: { type: "boolean" },
      description: "Desabilita todos os thumbs.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    "aria-label": {
      control: { type: "text" },
      description: "Nome acessível, aplicado a cada alça. Obrigatório.",
      table: { type: { summary: "string" }, defaultValue: { summary: "—" } },
    },
    // Callbacks: documentação e aba Actions, não controle — não há control que
    // faça sentido para uma função.
    onValueChange: {
      control: false,
      description: "Disparado a cada movimento, durante o arrasto e a cada tecla.",
      table: { type: { summary: "(value: number[]) => void" } },
    },
    onValueCommitted: {
      control: false,
      description: "Disparado ao soltar o arrasto ou largar a tecla. Use para analytics.",
      table: { type: { summary: "(value: number[]) => void" } },
    },
  },
  args: {
    min: 0,
    max: 100,
    step: 1,
    orientation: "horizontal",
    disabled: false,
    onValueChange: fn(),
    onValueCommitted: fn(),
    "aria-label": "Volume",
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item1",
      "functional.item2",
      "functional.item3",
      "functional.item4",
      "accessibility.item1",
      "accessibility.item4",
      "accessibility.item5",
      "visual.item1",
    ],
  },
  render: function PlaygroundRender(args) {
    const [value, setValue] = useState<number[]>([50]);
    const isVertical = args.orientation === "vertical";

    return (
      <div
        className={isVertical ? "nds-stack" : "nds-stack nds-w-sm"}
        data-spacing="sm"
        style={isVertical ? { height: "10rem", width: "8rem", alignItems: "center" } : undefined}
      >
        <div className="nds-cluster nds-w-full" data-align="center" data-justify="between">
          <span className="nds-text-body nds-text-muted-foreground">
            {args["aria-label"]}
          </span>
          <span
            aria-live="polite"
            className="nds-text-body nds-tabular-nums"
          >
            {value[0]}
          </span>
        </div>
        <Slider
          {...args}
          value={value}
          onValueChange={(v) => {
            setValue(v as number[]);
            args.onValueChange?.(v);
          }}
        />
      </div>
    );
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    // Cada passo estabelece a própria precondição: nada aqui depende do valor
    // de montagem, porque a play reexecuta no MESMO DOM no painel Interactions.
    // O valor inicial é afirmado na story de estado, que não interage.
    await step("Uma alça, com role=slider e nome acessível", async () => {
      const alcas = canvas.getAllByRole("slider");
      await expect(alcas).toHaveLength(1);
      await expect(alcas[0]).toHaveAttribute("aria-label", "Volume");
    });

    await step("Os limites da faixa chegam à árvore de acessibilidade", async () => {
      // Lê `aria-valuemin`/`aria-valuemax` OU `min`/`max` do input nativo: as
      // duas anatomias expõem o mesmo limite por superfícies diferentes, e
      // exigir uma delas reprova a outra sem nada quebrado.
      const { min, max } = limitesDaAlca(canvas.getByRole("slider"));
      await expect(min).toBe(0);
      await expect(max).toBe(100);
    });

    await step("Arrastar move o valor e avisa a cada movimento", async () => {
      const control = canvasElement.querySelector<HTMLElement>(".nds-slider")!;
      const trilho = canvasElement.querySelector<HTMLElement>('[data-slot="slider-track"]')!;
      const caixa = trilho.getBoundingClientRect();
      const y = caixa.top + caixa.height / 2;

      // Limpa antes de medir: no replay o espião chega com as chamadas da
      // rodada anterior, e `toHaveBeenCalled` passaria mesmo se o arrasto desta
      // rodada não tivesse movido nada.
      const espiaoMudanca = args.onValueChange as unknown as ReturnType<typeof fn>;
      const espiaoCommit = args.onValueCommitted as unknown as ReturnType<typeof fn>;
      espiaoMudanca.mockClear();
      espiaoCommit.mockClear();

      // userEvent.pointer, e não PointerEvent à mão: o primitivo chama
      // setPointerCapture no pointerdown, e captura só existe para ponteiro que
      // o navegador conhece.
      // Pressionar, mover e SOLTAR na mesma chamada. A API direta do
      // `userEvent` cria uma instância nova a cada chamada, e com ela um estado
      // de ponteiro novo: um `[/MouseLeft]` solto numa segunda chamada solta um
      // botão que aquela instância nunca viu apertado, e o `pointerup` que
      // fecha o arrasto nunca chegava ao componente.
      await userEvent.pointer([
        { keys: "[MouseLeft>]", target: control, coords: { clientX: caixa.left + caixa.width * 0.2, clientY: y } },
        { target: control, coords: { clientX: caixa.left + caixa.width * 0.6, clientY: y } },
        { keys: "[/MouseLeft]" },
      ]);

      await expect(args.onValueChange).toHaveBeenCalled();
      // Gateado na geometria da própria alça, não no valor que acabamos de
      // escrever: a alça tem de ter andado para depois do meio do trilho.
      const alca = canvasElement.querySelector<HTMLElement>('[data-slot="slider-thumb"]')!;
      const centroDaAlca = alca.getBoundingClientRect().left + alca.getBoundingClientRect().width / 2;
      await expect(centroDaAlca).toBeGreaterThan(caixa.left + caixa.width * 0.5);
    });

    await step("Soltar dispara o callback de commit", async () => {
      // O arrasto acima já terminou com o botão solto; aqui só se cobra o
      // efeito dele, que é o commit — um por interação, não um por pixel.
      await expect(args.onValueCommitted).toHaveBeenCalled();
    });

    await step("ArrowRight incrementa em step", async () => {
      const alca = canvas.getByRole("slider");
      const antes = valorDaAlca(alca);
      alca.focus();
      await userEvent.keyboard("{ArrowRight}");
      await expect(valorDaAlca(canvas.getByRole("slider"))).toBe(
        Math.min(args.max ?? 100, antes + (args.step ?? 1)),
      );
    });

    await step("Home leva ao mínimo e End ao máximo", async () => {
      const alca = canvas.getByRole("slider");
      alca.focus();
      await userEvent.keyboard("{Home}");
      await expect(valorDaAlca(canvas.getByRole("slider"))).toBe(0);
      await userEvent.keyboard("{End}");
      await expect(valorDaAlca(canvas.getByRole("slider"))).toBe(100);
    });
  },
};
