import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./badge";

const meta = {
  title: "UI/Badge/Variantes",
  component: Badge,
  parameters: {
    layout: "centered",
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
};

export const Secondary: Story = {
  render: () => <Badge variant="secondary">Beta</Badge>,
};

export const Destructive: Story = {
  render: () => <Badge variant="destructive">Urgente</Badge>,
};

export const Outline: Story = {
  render: () => <Badge variant="outline">Rascunho</Badge>,
};
