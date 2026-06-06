import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useState } from "react";
import { within, expect } from "storybook/test";
import { Progress } from "./progress";
import { ProgressDocs } from "@/components/docs/ProgressDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Progress",
  component: Progress,
  tags: ["autodocs", "feedback"],
  parameters: {
    layout: "padded",
    docs: { page: withAutoDocsTab(ProgressDocs) },
  },
  argTypes: {
    value: {
      control: { type: "number", min: 0, max: 100, step: 1 },
      description:
        "Valor atual de 0 a 100. Use null para modo indeterminate.",
    },
    max: {
      control: { type: "number", min: 1, step: 1 },
      description: "Valor máximo da escala.",
    },
    min: {
      control: { type: "number", min: 0, step: 1 },
      description: "Valor mínimo da escala.",
    },
    className: {
      control: { type: "text" },
      description:
        "Classes Tailwind adicionais. Use [&>div]:bg-* para customizar a cor do indicador.",
    },
  },
  args: {
    value: 42,
    max: 100,
    min: 0,
    "aria-label": "Progresso do upload",
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="w-80">
      <Progress {...args} />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Progress tem role=progressbar", async () => {
      const bar = canvas.getByRole("progressbar");
      await expect(bar).toBeInTheDocument();
    });

    await step("Possui aria-label", async () => {
      const bar = canvas.getByRole("progressbar");
      await expect(bar).toHaveAttribute("aria-label", "Progresso do upload");
    });

    await step("aria-valuenow reflete value", async () => {
      const bar = canvas.getByRole("progressbar");
      await expect(bar).toHaveAttribute("aria-valuenow", "42");
      await expect(bar).toHaveAttribute("aria-valuemin", "0");
      await expect(bar).toHaveAttribute("aria-valuemax", "100");
    });

    await step("Track e Indicator renderizam no DOM", async () => {
      const track = canvasElement.querySelector("[data-slot='progress-track']");
      const indicator = canvasElement.querySelector(
        "[data-slot='progress-indicator']"
      );
      await expect(track).toBeInTheDocument();
      await expect(indicator).toBeInTheDocument();
    });
  },
};

export const Animated: Story = {
  args: {
    value: 0,
    "aria-label": "Carregando dados",
  },
  render: function AnimatedRender(args) {
    const [value, setValue] = useState<number>(0);

    useEffect(() => {
      const id = setInterval(() => {
        setValue((v) => (v >= 100 ? 0 : v + 5));
      }, 400);
      return () => clearInterval(id);
    }, []);

    return (
      <div className="w-80">
        <Progress {...args} value={value} />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Progressbar animado presente", async () => {
      await expect(canvas.getByRole("progressbar")).toBeInTheDocument();
    });
  },
};
