import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "./alert";

const meta = {
  title: "UI/Alert/Variantes",
  tags: ["feedback"],
  component: Alert,
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Alert>
      <Info aria-hidden="true" className="nds-icon" />
      <AlertTitle>Atenção</AlertTitle>
      <AlertDescription>
        Suas alterações serão aplicadas na próxima sessão.
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole("alert");
    await expect(alert).toHaveClass("nds-alert");
    await expect(alert).not.toHaveClass("nds-alert-destructive");
    await expect(canvas.getByText("Atenção")).toBeVisible();
  },
};

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive">
      <AlertCircle aria-hidden="true" className="nds-icon" />
      <AlertTitle>Erro ao salvar</AlertTitle>
      <AlertDescription>
        Não foi possível salvar. Verifique sua conexão e tente novamente.
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole("alert");
    await expect(alert).toHaveClass("nds-alert-destructive");
    await expect(canvas.getByText("Erro ao salvar")).toBeVisible();
  },
};

export const Success: Story = {
  render: () => (
    <Alert className="nds-alert-success">
      <CheckCircle2 aria-hidden="true" className="nds-icon" />
      <AlertTitle>Perfil atualizado</AlertTitle>
      <AlertDescription>
        Suas informações foram salvas com sucesso.
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole("alert");
    await expect(alert).toHaveClass("nds-alert-success");
    await expect(canvas.getByText("Perfil atualizado")).toBeVisible();
  },
};

export const Warning: Story = {
  render: () => (
    <Alert className="nds-alert-warning">
      <TriangleAlert aria-hidden="true" className="nds-icon" />
      <AlertTitle>Assinatura expirando</AlertTitle>
      <AlertDescription>
        Sua assinatura expira em 3 dias. Renove para evitar interrupções.
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole("alert");
    await expect(alert).toHaveClass("nds-alert-warning");
    await expect(canvas.getByText("Assinatura expirando")).toBeVisible();
  },
};
