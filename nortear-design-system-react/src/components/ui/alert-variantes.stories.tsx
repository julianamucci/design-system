import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect, fn, userEvent } from "storybook/test";
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
    <Alert variant="success">
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
    <Alert variant="warning">
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

export const InfoVariante: Story = {
  name: "Info",
  render: () => (
    <Alert variant="info">
      <Info aria-hidden="true" className="nds-icon" />
      <AlertTitle>Dica</AlertTitle>
      <AlertDescription>
        Você pode alterar o tema em Configurações a qualquer momento.
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole("alert");
    await expect(alert).toHaveClass("nds-alert-info");
    await expect(canvas.getByText("Dica")).toBeVisible();
  },
};

export const Dismissible: Story = {
  args: { onDismiss: fn() },
  render: (args) => (
    <Alert dismissible onDismiss={args.onDismiss}>
      <CheckCircle2 aria-hidden="true" className="nds-icon" />
      <AlertTitle>Perfil atualizado</AlertTitle>
      <AlertDescription>
        Suas informações foram salvas com sucesso.
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);

    await step("Botão de fechar visível e acessível por rótulo", async () => {
      const dismiss = canvas.getByRole("button", { name: "Fechar alerta" });
      await expect(dismiss).toBeVisible();
      await expect(dismiss).toHaveAttribute("data-slot", "alert-dismiss");
    });

    await step("Clique fecha o alert e dispara o callback uma vez", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Fechar alerta" }));
      await expect(canvas.queryByRole("alert")).toBeNull();
      await expect(args.onDismiss).toHaveBeenCalledTimes(1);
    });
  },
};

// Segundo cenário do contrato: o caso documentado é "clique ou Enter" — este
// story remonta o alert e cobre o caminho de teclado (Enter no botão focado).
export const DismissibleTeclado: Story = {
  args: { onDismiss: fn() },
  render: (args) => (
    <Alert dismissible onDismiss={args.onDismiss}>
      <Info aria-hidden="true" className="nds-icon" />
      <AlertTitle>Atenção</AlertTitle>
      <AlertDescription>
        Suas alterações serão aplicadas na próxima sessão.
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);

    await step("Enter no botão focado fecha o alert e dispara o callback uma vez", async () => {
      const dismiss = canvas.getByRole("button", { name: "Fechar alerta" });
      dismiss.focus();
      await expect(dismiss).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await expect(canvas.queryByRole("alert")).toBeNull();
      await expect(args.onDismiss).toHaveBeenCalledTimes(1);
    });
  },
};
