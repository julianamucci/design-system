import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import { Badge } from "./badge";

const meta = {
  title: "UI/Badge/Variantes",
  tags: ["feedback"],
  component: Badge,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Cada variante do Badge reflete um nível de hierarquia visual: default destaca, secondary informa, destructive alerta e outline oferece baixa ênfase.",
      },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Badge variant="default">Novo</Badge>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Novo")).toBeInTheDocument();
  },
};

export const Secondary: Story = {
  render: () => <Badge variant="secondary">Beta</Badge>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Beta")).toBeInTheDocument();
  },
};

export const Destructive: Story = {
  render: () => <Badge variant="destructive">Urgente</Badge>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Urgente")).toBeInTheDocument();
  },
};

export const Outline: Story = {
  render: () => <Badge variant="outline">Rascunho</Badge>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Rascunho")).toBeInTheDocument();
  },
};
