import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { within, expect } from "storybook/test";
import { Slider } from "./slider";

const meta = {
  title: "UI/Slider/Variantes",
  tags: ["form"],
  component: Slider,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Variantes do Slider: single (um thumb), range (dois thumbs para min/max) e vertical (orientação vertical com altura definida no container).",
      },
    },
    controls: { disable: true },
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {
  render: function SingleRender() {
    const [value, setValue] = useState<number[]>([50]);
    return (
      <div className="w-80 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Volume</span>
          <span aria-live="polite" className="text-sm tabular-nums">
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
      await expect(thumbs[0]).toHaveAttribute("aria-valuenow", "50");
    });
  },
};

export const Range: Story = {
  render: function RangeRender() {
    const [value, setValue] = useState<number[]>([20, 80]);
    return (
      <div className="w-80 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Faixa de preço</span>
          <span aria-live="polite" className="text-sm tabular-nums">
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
      await expect(thumbs[0]).toHaveAttribute("aria-valuenow", "20");
      await expect(thumbs[1]).toHaveAttribute("aria-valuenow", "80");
    });
  },
};

export const Vertical: Story = {
  render: function VerticalRender() {
    const [value, setValue] = useState<number[]>([50]);
    return (
      <div className="h-40 w-32 flex flex-col items-center gap-3">
        <span aria-live="polite" className="text-sm tabular-nums">
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
    await step("Thumb com aria-orientation=vertical", async () => {
      const thumb = canvas.getByRole("slider");
      await expect(thumb).toHaveAttribute("aria-orientation", "vertical");
    });
  },
};
