import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useState } from "react";
import { within, expect } from "storybook/test";
import {
  Progress,
  ProgressLabel,
  ProgressTrack,
  ProgressIndicator,
  ProgressValue,
} from "./progress";

const meta = {
  title: "UI/Progress/Variantes",
  tags: ["feedback"],
  component: Progress,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Variantes do Progress: determinate (valor numérico 0–100), indeterminate (sem valor definido, animação infinita) e withLabel (com ProgressLabel e ProgressValue).",
      },
    },
    controls: { disable: true },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof Progress>;

export const Determinate: Story = {
  render: () => (
    <div className="w-80">
      <Progress value={42} aria-label="Progresso do upload" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Progressbar presente com aria-valuenow=42", async () => {
      const bar = canvas.getByRole("progressbar");
      await expect(bar).toHaveAttribute("aria-valuenow", "42");
    });
  },
};

export const Indeterminate: Story = {
  render: () => (
    <div className="w-80">
      <Progress
        value={null}
        aria-label="Processando dados"
        className="[&>div]:animate-indeterminate"
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Progressbar presente sem aria-valuenow", async () => {
      const bar = canvas.getByRole("progressbar");
      await expect(bar).toBeInTheDocument();
      await expect(bar).not.toHaveAttribute("aria-valuenow");
    });
  },
};

export const WithLabel: Story = {
  render: function WithLabelRender() {
    const [value, setValue] = useState<number>(20);

    useEffect(() => {
      const id = setInterval(() => {
        setValue((v) => (v >= 100 ? 20 : v + 10));
      }, 600);
      return () => clearInterval(id);
    }, []);

    return (
      <div className="w-80">
        <Progress value={value} aria-label="Enviando arquivo">
          <ProgressLabel>Enviando arquivo</ProgressLabel>
          <ProgressValue />
          <ProgressTrack>
            <ProgressIndicator />
          </ProgressTrack>
        </Progress>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Label visível", async () => {
      await expect(canvas.getByText("Enviando arquivo")).toBeVisible();
    });

    await step("Progressbar presente", async () => {
      await expect(canvas.getByRole("progressbar")).toBeInTheDocument();
    });
  },
};
