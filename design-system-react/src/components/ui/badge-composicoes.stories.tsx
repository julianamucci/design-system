import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import { CheckCircle2, Bell } from "lucide-react";
import { Badge } from "./badge";

const meta = {
  title: "UI/Badge/Composicoes",
  tags: ["feedback"],
  component: Badge,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Configuracoes contextuais do Badge: combinado com ícone, como contador numérico, envolvido em <a> para navegação ou em <button> para trigger clicável.",
      },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithIcon: Story = {
  render: () => (
    <Badge variant="secondary">
      <CheckCircle2 aria-hidden="true" className="mr-1 h-3 w-3" />
      Ativo
    </Badge>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Ativo")).toBeInTheDocument();
  },
};

export const CountBadge: Story = {
  render: () => (
    <span
      className="relative inline-flex"
      role="status"
      aria-label="12 notificações não lidas"
    >
      <Bell aria-hidden="true" className="h-6 w-6 text-foreground" />
      <Badge
        variant="destructive"
        className="absolute -right-2 -top-2 min-w-[1.25rem] justify-center px-1"
      >
        12
      </Badge>
    </span>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("status", { name: /12 notificações não lidas/i })).toBeInTheDocument();
    await expect(canvas.getByText("12")).toBeInTheDocument();
  },
};

export const AsLink: Story = {
  render: () => (
    <a
      href="#design"
      aria-label="Ver todos os itens da categoria Design"
      className="inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      <Badge variant="outline">Design</Badge>
    </a>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("link", { name: /design/i })).toBeInTheDocument();
  },
};

export const AsButton: Story = {
  render: () => (
    <button
      type="button"
      aria-label="Filtrar por React"
      className="inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      <Badge variant="secondary">React</Badge>
    </button>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: /filtrar por react/i })).toBeInTheDocument();
  },
};
