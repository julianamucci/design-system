import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import { Info } from "lucide-react";
import { Alert, AlertAction, AlertTitle, AlertDescription } from "./alert";
import { Button } from "./button";

const meta = {
  title: "UI/Alert/Composicoes",
  tags: ["feedback"],
  component: Alert,
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComIcone: Story = {
  render: () => (
    <Alert>
      <Info aria-hidden="true" className="nds-icon" />
      <AlertTitle>Informação</AlertTitle>
      <AlertDescription>Ícone SVG posicionado automaticamente.</AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole("alert");
    await expect(alert.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    await expect(canvas.getByText("Informação")).toBeVisible();
  },
};

export const ComAcao: Story = {
  render: () => (
    <Alert>
      <Info aria-hidden="true" className="nds-icon" />
      <AlertTitle>Atualização disponível</AlertTitle>
      <AlertDescription>Uma nova versão está pronta para instalação.</AlertDescription>
      <AlertAction>
        <Button size="sm" variant="outline">
          Atualizar
        </Button>
      </AlertAction>
    </Alert>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("A ação fica acessível como botão dentro do alert", async () => {
      const alert = canvas.getByRole("alert");
      await expect(within(alert).getByRole("button", { name: "Atualizar" })).toBeVisible();
    });

    await step("O slot de ação usa a classe do componente", async () => {
      const action = canvasElement.querySelector('[data-slot="alert-action"]');
      await expect(action).toHaveClass("nds-alert-action");
    });
  },
};

export const SemIcone: Story = {
  render: () => (
    <Alert>
      <AlertTitle>Sem ícone</AlertTitle>
      <AlertDescription>Alert sem ícone mantém layout de coluna única.</AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole("alert");
    await expect(alert.querySelector("svg")).toBeNull();
    await expect(canvas.getByText("Sem ícone")).toBeVisible();
  },
};
