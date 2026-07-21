import type { Meta, StoryObj } from "@storybook/react-vite";
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
      <CheckCircle2 aria-hidden="true" className="" style={{marginRight: "0.25rem", height: "0.75rem", width: "0.75rem" }}  />
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
      className="nds-cluster" style={{ position: "relative" }}
      role="status"
      aria-label="12 notificações não lidas"
    >
      <Bell aria-hidden="true" className="nds-text-foreground" style={{ height: "1.5rem", width: "1.5rem" }} />
      <Badge
        variant="destructive"
        className="-right-2 -top-2 nds-px-1" style={{minWidth: "1.25rem", position: "absolute" }} data-justify="center" 
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
      className="nds-cluster nds-rounded-md nds-focus-ring-inset"
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
      className="nds-cluster nds-rounded-md nds-focus-ring-inset"
    >
      <Badge variant="secondary">React</Badge>
    </button>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: /filtrar por react/i })).toBeInTheDocument();
  },
};
