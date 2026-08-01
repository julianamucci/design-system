import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect, fn, userEvent, waitFor } from "storybook/test";
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

/**
 * O Alert se desmonta ao fechar. Sem remontagem o canvas ficaria vazio depois da
 * play function — a story não "carregaria" no Storybook e o Chromatic
 * fotografaria o vazio. Este wrapper troca a `key` no onDismiss: o nó original
 * sai do DOM (a prova do fechamento continua mensurável) e um alert novo monta
 * imediatamente no lugar.
 */
function AlertDismissivelRemontavel({
  onDismiss,
  icon,
  title,
  description,
}: {
  onDismiss?: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  const [instancia, setInstancia] = React.useState(0);

  return (
    <Alert
      key={instancia}
      dismissible
      onDismiss={() => {
        setInstancia((n) => n + 1);
        onDismiss?.();
      }}
    >
      {icon}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}

export const Dismissible: Story = {
  args: { onDismiss: fn() },
  render: (args) => (
    <AlertDismissivelRemontavel
      onDismiss={args.onDismiss}
      icon={<CheckCircle2 aria-hidden="true" className="nds-icon" />}
      title="Perfil atualizado"
      description="Suas informações foram salvas com sucesso."
    />
  ),
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);

    await step("Botão de fechar visível e acessível por rótulo", async () => {
      const dismiss = canvas.getByRole("button", { name: "Fechar alerta" });
      await expect(dismiss).toBeVisible();
      await expect(dismiss).toHaveAttribute("data-slot", "alert-dismiss");
    });

    await step("Clique remove o alert original e dispara o callback uma vez", async () => {
      const alertOriginal = canvas.getByRole("alert");
      await userEvent.click(canvas.getByRole("button", { name: "Fechar alerta" }));
      await expect(alertOriginal).not.toBeInTheDocument();
      await expect(args.onDismiss).toHaveBeenCalledTimes(1);
    });

    await step("Um alert novo ocupa o lugar — o canvas nunca fica vazio", async () => {
      await waitFor(async () => {
        await expect(canvas.getByRole("alert")).toBeVisible();
      });
    });
  },
};

// Segundo cenário do contrato: o caso documentado é "clique ou Enter" — este
// story cobre o caminho de teclado (Enter no botão focado).
export const DismissibleTeclado: Story = {
  args: { onDismiss: fn() },
  render: (args) => (
    <AlertDismissivelRemontavel
      onDismiss={args.onDismiss}
      icon={<Info aria-hidden="true" className="nds-icon" />}
      title="Atenção"
      description="Suas alterações serão aplicadas na próxima sessão."
    />
  ),
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);

    await step("Enter no botão focado remove o alert original e dispara o callback uma vez", async () => {
      const alertOriginal = canvas.getByRole("alert");
      const dismiss = canvas.getByRole("button", { name: "Fechar alerta" });
      dismiss.focus();
      await expect(dismiss).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await expect(alertOriginal).not.toBeInTheDocument();
      await expect(args.onDismiss).toHaveBeenCalledTimes(1);
    });

    await step("Um alert novo ocupa o lugar — o canvas nunca fica vazio", async () => {
      await waitFor(async () => {
        await expect(canvas.getByRole("alert")).toBeVisible();
      });
    });
  },
};
