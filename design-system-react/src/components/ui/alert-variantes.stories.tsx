import type { Meta, StoryObj } from "@storybook/react";
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
      <Info aria-hidden="true" className="h-4 w-4" />
      <AlertTitle>Atenção</AlertTitle>
      <AlertDescription>
        Suas alterações serão aplicadas na próxima sessão.
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("alert")).toBeInTheDocument();
    await expect(canvas.getByText("Atenção")).toBeInTheDocument();
  },
};

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive">
      <AlertCircle aria-hidden="true" className="h-4 w-4" />
      <AlertTitle>Erro ao salvar</AlertTitle>
      <AlertDescription>
        Não foi possível salvar. Verifique sua conexão e tente novamente.
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("alert")).toBeInTheDocument();
    await expect(canvas.getByText("Erro ao salvar")).toBeInTheDocument();
  },
};

export const Success: Story = {
  render: () => (
    <Alert className="bg-success/10 text-success border-success/30">
      <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
      <AlertTitle>Perfil atualizado</AlertTitle>
      <AlertDescription>
        Suas informações foram salvas com sucesso.
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Perfil atualizado")).toBeInTheDocument();
  },
};

export const Warning: Story = {
  render: () => (
    <Alert className="bg-warning/10 border-warning/30 text-foreground [&_svg]:text-warning">
      <TriangleAlert aria-hidden="true" className="h-4 w-4" />
      <AlertTitle className="text-foreground">Assinatura expirando</AlertTitle>
      <AlertDescription className="text-muted-foreground">
        Sua assinatura expira em 3 dias. Renove para evitar interrupções.
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Assinatura expirando")).toBeInTheDocument();
  },
};
