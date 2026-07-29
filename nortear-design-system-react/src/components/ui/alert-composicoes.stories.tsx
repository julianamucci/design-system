import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "./alert";
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

export const ComIconeLucide: Story = {
  render: () => (
    <Alert>
      <Info aria-hidden="true" className="nds-icon" />
      <AlertTitle>Informação</AlertTitle>
      <AlertDescription>
        Ícone Lucide posicionado automaticamente via seletor CSS{" "}
        <code>[&gt;svg]:absolute</code>.
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Informação")).toBeInTheDocument();
  },
};

export const ComAcao: Story = {
  render: () => (
    <Alert>
      <Info aria-hidden="true" className="nds-icon" />
      <AlertTitle>Sessão expira em 5 minutos</AlertTitle>
      <AlertDescription className="nds-cluster nds-mt-1" data-align="center" data-justify="between" data-spacing="md">
        <span>Salve seu trabalho para não perder as alterações.</span>
        <Button size="sm" variant="outline">
          Salvar agora
        </Button>
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: /salvar agora/i })).toBeInTheDocument();
  },
};

export const MultiplosTipos: Story = {
  render: () => (
    <div className="nds-stack" data-spacing="sm">
      <Alert>
        <Info aria-hidden="true" className="nds-icon" />
        <AlertTitle>Informação</AlertTitle>
        <AlertDescription>Mensagem informativa e neutra.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertCircle aria-hidden="true" className="nds-icon" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>Erro crítico que bloqueia o fluxo.</AlertDescription>
      </Alert>
      <Alert className="nds-alert-success">
        <CheckCircle2 aria-hidden="true" className="nds-icon" />
        <AlertTitle>Sucesso</AlertTitle>
        <AlertDescription>Ação concluída com sucesso.</AlertDescription>
      </Alert>
      <Alert className="nds-alert-warning">
        <TriangleAlert aria-hidden="true" className="nds-icon" />
        <AlertTitle className="nds-text-foreground">Aviso</AlertTitle>
        <AlertDescription className="nds-text-muted-foreground">Aviso que requer atenção.</AlertDescription>
      </Alert>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alerts = canvas.getAllByRole("alert");
    await expect(alerts).toHaveLength(4);
    await expect(alerts[1]).toHaveClass("nds-alert-destructive");
    await expect(alerts[2]).toHaveClass("nds-alert-success");
    await expect(alerts[3]).toHaveClass("nds-alert-warning");
  },
};

export const SemTituloCompacto: Story = {
  render: () => (
    <Alert variant="destructive">
      <AlertCircle aria-hidden="true" className="nds-icon" />
      <AlertDescription>
        Formulário incompleto — preencha todos os campos obrigatórios.
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole("alert");
    await expect(alert).toHaveClass("nds-alert-destructive");
    await expect(alert.querySelector('[data-slot="alert-title"]')).toBeNull();
    await expect(canvas.getByText(/Formulário incompleto/)).toBeVisible();
  },
};
