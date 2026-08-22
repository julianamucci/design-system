import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within, expect } from "storybook/test";
import { Slider } from "./slider";
import {
  sliderDisabledSource,
  sliderNotControlledSource,
  sliderSource,
} from "./slider.source";
import {
  handleDesabilitada,
  alcasDoSlider,
  focusAssentadoRing,
  restRing,
  contextoHandleTrack,
  contrastHandleTrack,
  handleValue,
} from "@shared/testing/slider-probe";

const meta = {
  title: "UI/Slider/States",
  tags: ["form"],
  component: Slider,
  parameters: {
    layout: "padded",
    docs: {
      source: { transform: sliderSource },
      description: {
        component:
          "Estados do Slider: default, focus (via teclado), active (durante arrasto) e disabled.",
      },
    },
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    covers: ["accessibility.item2"],
    docs: {
      // A AUSÊNCIA de estado é o assunto: `defaultValue` é o caso em que o valor
      // não precisa sair do componente, e o meta imprime o par controlado.
      source: { transform: sliderNotControlledSource },
    },
  },
  render: () => (
    <div className="nds-w-sm">
      <Slider defaultValue={[50]} min={0} max={100} aria-label="Volume" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    // Story sem interação: é aqui que o valor de montagem pode ser afirmado.
    await step("Alça no valor inicial", async () => {
      await expect(handleValue(canvas.getByRole("slider"))).toBe(50);
    });

    await step("A borda da alça alcança 3:1 contra o trilho", async () => {
      // WCAG 1.4.11. O miolo da alça é da cor do fundo de propósito, então quem
      // a separa do trilho é a borda — é essa razão que a norma cobra.
      await expect(
        contrastHandleTrack(canvasElement),
        contextoHandleTrack(canvasElement),
      ).toBeGreaterThanOrEqual(3);
    });
  },
};

export const Focus: Story = {
  parameters: {
    covers: ["accessibility.item3"],
    docs: {
      // Mesmo controle não controlado da story anterior: o anel de foco é da
      // folha, e nenhuma prop o liga — não há o que acrescentar ao snippet.
      source: { transform: sliderNotControlledSource },
    },
  },
  render: () => (
    <div className="nds-w-sm">
      <Slider defaultValue={[50]} min={0} max={100} aria-label="Volume" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const thumb = () => alcasDoSlider(canvasElement)[0];
    const rest = await restRing(thumb());

    await step("A alça recebe foco por teclado", async () => {
      await userEvent.tab();
      await expect(canvas.getByRole("slider")).toHaveFocus();
    });

    await step("A alça focada fica visivelmente diferente da alça em repouso", async () => {
      // O anel de foco é o critério, não o foco em si: alça focada idêntica à
      // alça parada é 2.4.7 reprovado com o teste verde.
      const focada = await focusAssentadoRing(thumb(), rest);
      await expect(focada.sombra !== rest.sombra || focada.border !== rest.border).toBe(true);
      await expect(focada.sombra).not.toBe("none");
    });
  },
};

export const KeyboardInteraction: Story = {
  render: function KeyboardRender() {
    const [value, setValue] = useState<number[]>([50]);
    return (
      <div className="nds-stack nds-w-sm" data-spacing="sm">
        <span aria-live="polite" className="nds-text-body nds-tabular-nums">
          {value[0]}
        </span>
        <Slider
          value={value}
          onValueChange={(v) => setValue(v as number[])}
          min={0}
          max={100}
          aria-label="Volume"
        />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("ArrowRight incrementa", async () => {
      const thumb = canvas.getByRole("slider");
      const antes = handleValue(thumb);
      thumb.focus();
      await userEvent.keyboard("{ArrowRight}");
      await expect(handleValue(canvas.getByRole("slider"))).toBe(Math.min(100, antes + 1));
    });

    await step("ArrowLeft decrementa", async () => {
      const antes = handleValue(canvas.getByRole("slider"));
      await userEvent.keyboard("{ArrowLeft}");
      await expect(handleValue(canvas.getByRole("slider"))).toBe(Math.max(0, antes - 1));
    });

    await step("PageUp anda mais que uma seta", async () => {
      const antes = handleValue(canvas.getByRole("slider"));
      await userEvent.keyboard("{PageUp}");
      await expect(handleValue(canvas.getByRole("slider"))).toBeGreaterThan(antes + 1);
    });
  },
};

export const Disabled: Story = {
  parameters: {
    covers: ["visual.item4"],
    docs: {
      // Estado que só existe no `render`: `disabled` desliga todas as alças de
      // uma vez, e não há control que o descreva neste arquivo.
      source: { transform: sliderDisabledSource },
    },
  },
  render: () => (
    <div className="nds-w-sm">
      <Slider
        defaultValue={[50]}
        min={0}
        max={100}
        disabled
        aria-label="Volume desabilitado"
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("A alça está marcada como desabilitada", async () => {
      // Três marcas legítimas para o mesmo estado (`disabled` nativo,
      // `aria-disabled`, `data-disabled`); a sonda aceita qualquer uma.
      await expect(handleDesabilitada(alcasDoSlider(canvasElement)[0])).toBe(true);
    });

    await step("O teclado não move o valor", async () => {
      const thumb = canvas.getByRole("slider");
      const antes = handleValue(thumb);
      thumb.focus();
      await userEvent.keyboard("{ArrowRight}");
      await expect(handleValue(canvas.getByRole("slider"))).toBe(antes);
    });
  },
};
