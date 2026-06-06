import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import { Progress } from "./progress";

const meta = {
  title: "UI/Progress/Estados",
  tags: ["feedback"],
  component: Progress,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Estados do Progress: default (value=0), loading (0 < value < 100), complete (value=100) e indeterminate (value=null).",
      },
    },
    controls: { disable: true },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  render: () => (
    <div className="w-80">
      <Progress value={0} aria-label="Progresso inicial" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("aria-valuenow=0", async () => {
      const bar = canvas.getByRole("progressbar");
      await expect(bar).toHaveAttribute("aria-valuenow", "0");
    });
  },
};

export const Loading: Story = {
  render: () => (
    <div className="w-80">
      <Progress value={50} aria-label="Carregando dados" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("aria-valuenow=50", async () => {
      const bar = canvas.getByRole("progressbar");
      await expect(bar).toHaveAttribute("aria-valuenow", "50");
    });
  },
};

export const Complete: Story = {
  render: () => (
    <div className="w-80">
      <Progress value={100} aria-label="Concluído" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("aria-valuenow=100", async () => {
      const bar = canvas.getByRole("progressbar");
      await expect(bar).toHaveAttribute("aria-valuenow", "100");
    });
  },
};

export const Indeterminate: Story = {
  render: () => (
    <div className="w-80">
      <Progress
        value={null}
        aria-label="Processando"
        className="[&>div]:animate-indeterminate"
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Progressbar sem aria-valuenow", async () => {
      const bar = canvas.getByRole("progressbar");
      await expect(bar).toBeInTheDocument();
      await expect(bar).not.toHaveAttribute("aria-valuenow");
    });
  },
};
