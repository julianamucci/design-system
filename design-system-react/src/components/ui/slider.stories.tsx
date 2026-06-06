import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { fn, userEvent, within, expect } from "storybook/test";
import { Slider } from "./slider";
import { SliderDocs } from "@/components/docs/SliderDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Slider",
  component: Slider,
  tags: ["autodocs", "form"],
  parameters: {
    layout: "padded",
    docs: { page: withAutoDocsTab(SliderDocs) },
  },
  argTypes: {
    min: {
      control: { type: "number" },
      description: "Valor mínimo da faixa.",
    },
    max: {
      control: { type: "number" },
      description: "Valor máximo da faixa.",
    },
    step: {
      control: { type: "number", min: 1 },
      description: "Incremento por seta de teclado.",
    },
    orientation: {
      control: { type: "radio" },
      options: ["horizontal", "vertical"],
      description: "Direção do slider.",
    },
    disabled: {
      control: { type: "boolean" },
      description: "Desabilita todos os thumbs.",
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
  render: function PlaygroundRender(args) {
    const [value, setValue] = useState<number[]>([50]);
    const isVertical = args.orientation === "vertical";

    return (
      <div className={isVertical ? "h-40 w-32 flex flex-col items-center gap-3" : "w-80 space-y-3"}>
        <div className="flex items-center justify-between w-full">
          <span className="text-sm text-muted-foreground">
            {args["aria-label"]}
          </span>
          <span
            aria-live="polite"
            className="text-sm tabular-nums text-foreground"
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

    await step("Thumb tem role=slider", async () => {
      const thumb = canvas.getByRole("slider");
      await expect(thumb).toBeInTheDocument();
    });

    await step("Possui aria-label", async () => {
      const thumb = canvas.getByRole("slider");
      await expect(thumb).toHaveAttribute("aria-label", "Volume");
    });

    await step("aria-valuenow reflete o valor inicial", async () => {
      const thumb = canvas.getByRole("slider");
      await expect(thumb).toHaveAttribute("aria-valuenow", "50");
      await expect(thumb).toHaveAttribute("aria-valuemin", "0");
      await expect(thumb).toHaveAttribute("aria-valuemax", "100");
    });

    await step("ArrowRight incrementa o valor", async () => {
      const thumb = canvas.getByRole("slider");
      thumb.focus();
      await userEvent.keyboard("{ArrowRight}");
      await expect(Number(thumb.getAttribute("aria-valuenow"))).toBeGreaterThan(50);
      await expect(args.onValueChange).toHaveBeenCalled();
    });

    await step("Home leva ao valor mínimo", async () => {
      const thumb = canvas.getByRole("slider");
      thumb.focus();
      await userEvent.keyboard("{Home}");
      await expect(thumb).toHaveAttribute("aria-valuenow", "0");
    });

    await step("End leva ao valor máximo", async () => {
      const thumb = canvas.getByRole("slider");
      thumb.focus();
      await userEvent.keyboard("{End}");
      await expect(thumb).toHaveAttribute("aria-valuenow", "100");
    });
  },
};
