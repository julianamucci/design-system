import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within, expect } from "storybook/test";
import { Slider } from "./slider";
import { sliderRangeSource, sliderSource, sliderVerticalSource } from "./slider.source";
import { alcasDoSlider, sliderTrack, handleValue } from "@shared/testing/slider-probe";

const meta = {
  title: "UI/Slider/Variants",
  tags: ["form"],
  component: Slider,
  parameters: {
    layout: "padded",
    docs: {
      source: { transform: sliderSource },
      description: {
        component:
          "Variantes do Slider: single (um thumb), range (dois thumbs para min/max) e vertical (orientação vertical com altura definida no container).",
      },
    },
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {
  render: function SingleRender() {
    const [value, setValue] = useState<number[]>([50]);
    return (
      <div className="nds-stack nds-w-sm" data-spacing="sm">
        <div className="nds-cluster" data-justify="between">
          <span className="nds-text-body nds-text-muted-foreground">Volume</span>
          <span aria-live="polite" className="nds-text-body nds-tabular-nums">
            {value[0]}%
          </span>
        </div>
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
    await step("Um único thumb com aria-valuenow=50", async () => {
      const thumbs = canvas.getAllByRole("slider");
      await expect(thumbs).toHaveLength(1);
      await expect(handleValue(thumbs[0])).toBe(50);
    });
  },
};

export const Range: Story = {
  parameters: {
    covers: ["visual.item2"],
    docs: {
      // A segunda alça não vem de prop: vem do `value` chegar com DOIS números,
      // e o meta imprime o array de um elemento do Playground.
      source: { transform: sliderRangeSource },
    },
  },
  render: function RangeRender() {
    const [value, setValue] = useState<number[]>([20, 80]);
    return (
      <div className="nds-stack nds-w-sm" data-spacing="sm">
        <div className="nds-cluster" data-justify="between">
          <span className="nds-text-body nds-text-muted-foreground">Faixa de preço</span>
          <span aria-live="polite" className="nds-text-body nds-tabular-nums">
            R$ {value[0]} — R$ {value[1]}
          </span>
        </div>
        <Slider
          value={value}
          onValueChange={(v) => setValue(v as number[])}
          min={0}
          max={100}
          aria-label="Faixa de preço"
        />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Dois thumbs com valores 20 e 80", async () => {
      const thumbs = canvas.getAllByRole("slider");
      await expect(thumbs).toHaveLength(2);
      await expect(handleValue(thumbs[0])).toBe(20);
      await expect(handleValue(thumbs[1])).toBe(80);
    });

    await step("O preenchimento é o miolo entre as duas alças", async () => {
      // Afirma o desenho, não o dado: 80 − 20 do trilho, com folga de 1pt para
      // o arredondamento de subpixel.
      const track = sliderTrack(canvasElement);
      const range = canvasElement.querySelector<HTMLElement>('[data-slot="slider-range"]')!;
      const pct =
        (range.getBoundingClientRect().width / track.getBoundingClientRect().width) * 100;
      await expect(Math.abs(pct - 60)).toBeLessThan(1.5);
    });
  },
};

export const Vertical: Story = {
  parameters: {
    covers: ["visual.item3"],
    docs: {
      // A orientação troca a COMPOSIÇÃO: em pé não há largura para o par
      // rótulo/valor lado a lado, e o valor sobe para cima da barra.
      source: { transform: sliderVerticalSource },
    },
  },
  render: function VerticalRender() {
    const [value, setValue] = useState<number[]>([50]);
    return (
      <div className="nds-stack nds-demo-box" data-align="center" data-spacing="sm" data-size="sm" style={{ width: "8rem" }}>
        <span aria-live="polite" className="nds-text-body nds-tabular-nums">
          {value[0]}%
        </span>
        <Slider
          value={value}
          onValueChange={(v) => setValue(v as number[])}
          orientation="vertical"
          min={0}
          max={100}
          aria-label="Brilho"
        />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("A orientação vertical é anunciada", async () => {
      await expect(canvas.getByRole("slider")).toHaveAttribute("aria-orientation", "vertical");
    });

    await step("O trilho fica em pé", async () => {
      // A orientação não pode ser só um atributo: a geometria tem que virar
      // junto, senão o controle continua deitado dizendo que está de pé.
      const box = sliderTrack(canvasElement).getBoundingClientRect();
      await expect(box.height).toBeGreaterThan(box.width);
    });

    await step("ArrowUp incrementa no eixo vertical", async () => {
      const thumb = alcasDoSlider(canvasElement)[0];
      const antes = handleValue(thumb);
      canvas.getByRole("slider").focus();
      await userEvent.keyboard("{ArrowUp}");
      await expect(handleValue(alcasDoSlider(canvasElement)[0])).toBe(Math.min(100, antes + 1));
    });
  },
};
