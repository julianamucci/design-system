import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { within, expect } from "storybook/test";
import { Slider } from "./slider";
import { Label } from "./label";

const meta = {
  title: "UI/Slider/Composicoes",
  tags: ["form"],
  component: Slider,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Composicoes do Slider: com Label e valor textual (aria-live), faixa de preço, step customizado e múltiplos sliders em formulário.",
      },
    },
    controls: { disable: true },
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComLabelEValor: Story = {
  render: function ComLabelEValorRender() {
    const [value, setValue] = useState<number[]>([75]);
    return (
      <div className="w-80 space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="volume-slider">Volume</Label>
          <span
            aria-live="polite"
            className="text-sm tabular-nums text-foreground"
          >
            {value[0]}%
          </span>
        </div>
        <Slider
          id="volume-slider"
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
    await step("Label visível e thumb presente", async () => {
      await expect(canvas.getByText("Volume")).toBeVisible();
      await expect(canvas.getByRole("slider")).toBeInTheDocument();
    });
    await step("Texto aria-live presente", async () => {
      const live = canvasElement.querySelector('[aria-live="polite"]');
      await expect(live).toBeInTheDocument();
    });
  },
};

export const FaixaDePreco: Story = {
  render: function FaixaDePrecoRender() {
    const [value, setValue] = useState<number[]>([100, 400]);
    return (
      <div className="w-80 space-y-3">
        <div className="flex items-center justify-between">
          <Label>Faixa de preço</Label>
          <span
            aria-live="polite"
            className="text-sm tabular-nums text-foreground"
          >
            R$ {value[0]} — R$ {value[1]}
          </span>
        </div>
        <Slider
          value={value}
          onValueChange={(v) => setValue(v as number[])}
          min={0}
          max={500}
          step={10}
          aria-label="Faixa de preço"
        />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Dois thumbs presentes", async () => {
      const thumbs = canvas.getAllByRole("slider");
      await expect(thumbs).toHaveLength(2);
    });
  },
};

export const StepCustomizado: Story = {
  render: function StepCustomizadoRender() {
    const [value, setValue] = useState<number[]>([50]);
    return (
      <div className="w-80 space-y-3">
        <div className="flex items-center justify-between">
          <Label>Nível (step=10)</Label>
          <span aria-live="polite" className="text-sm tabular-nums">
            {value[0]}
          </span>
        </div>
        <Slider
          value={value}
          onValueChange={(v) => setValue(v as number[])}
          min={0}
          max={100}
          step={10}
          aria-label="Nível"
        />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Thumb presente com valor inicial 50", async () => {
      const thumb = canvas.getByRole("slider");
      await expect(thumb).toHaveAttribute("aria-valuenow", "50");
    });
  },
};

export const EmFormulario: Story = {
  render: function EmFormularioRender() {
    const [volume, setVolume] = useState<number[]>([60]);
    const [brilho, setBrilho] = useState<number[]>([80]);
    return (
      <form className="w-80 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="form-volume">Volume</Label>
            <span aria-live="polite" className="text-sm tabular-nums">
              {volume[0]}%
            </span>
          </div>
          <Slider
            id="form-volume"
            value={volume}
            onValueChange={(v) => setVolume(v as number[])}
            min={0}
            max={100}
            aria-label="Volume"
          />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="form-brilho">Brilho</Label>
            <span aria-live="polite" className="text-sm tabular-nums">
              {brilho[0]}%
            </span>
          </div>
          <Slider
            id="form-brilho"
            value={brilho}
            onValueChange={(v) => setBrilho(v as number[])}
            min={0}
            max={100}
            aria-label="Brilho"
          />
        </div>
      </form>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Dois sliders no formulário", async () => {
      const thumbs = canvas.getAllByRole("slider");
      await expect(thumbs).toHaveLength(2);
    });
  },
};
