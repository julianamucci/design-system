import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { userEvent, within, expect } from "storybook/test";
import { Slider } from "./slider";

const meta = {
  title: "UI/Slider/Estados",
  tags: ["form"],
  component: Slider,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Estados do Slider: default, focus (via teclado), active (durante arrasto) e disabled.",
      },
    },
    controls: { disable: true },
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-80">
      <Slider defaultValue={[50]} min={0} max={100} aria-label="Volume" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Thumb tem aria-valuenow=50", async () => {
      const thumb = canvas.getByRole("slider");
      await expect(thumb).toHaveAttribute("aria-valuenow", "50");
    });
  },
};

export const Focus: Story = {
  render: () => (
    <div className="w-80">
      <Slider defaultValue={[50]} min={0} max={100} aria-label="Volume" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Thumb recebe foco programaticamente", async () => {
      const thumb = canvas.getByRole("slider");
      thumb.focus();
      await expect(thumb).toHaveFocus();
    });
  },
};

export const KeyboardInteraction: Story = {
  render: function KeyboardRender() {
    const [value, setValue] = useState<number[]>([50]);
    return (
      <div className="w-80 space-y-3">
        <span aria-live="polite" className="text-sm tabular-nums">
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
    const thumb = canvas.getByRole("slider");

    await step("ArrowRight incrementa", async () => {
      thumb.focus();
      await userEvent.keyboard("{ArrowRight}");
      await expect(Number(thumb.getAttribute("aria-valuenow"))).toBeGreaterThan(50);
    });

    await step("ArrowLeft decrementa", async () => {
      const before = Number(thumb.getAttribute("aria-valuenow"));
      await userEvent.keyboard("{ArrowLeft}");
      await expect(Number(thumb.getAttribute("aria-valuenow"))).toBeLessThan(before);
    });
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="w-80">
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
    await step("Slider possui atributo de disabled", async () => {
      const thumb = canvas.getByRole("slider");
      await expect(thumb).toHaveAttribute("aria-disabled", "true");
    });
  },
};
