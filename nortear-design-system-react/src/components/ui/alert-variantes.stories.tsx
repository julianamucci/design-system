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
      await expect(dismiss).toHaveAttribute("data-slot", "alert-dismiss");
      // waitFor: o alert dismissible ENTRA animado (.nds-animate-in, opacidade
      // 0 → 1). Asserção de visibilidade no primeiro quadro é racy em qualquer
      // browser — e no Chromium headless dos testes a animação fica presa no
      // quadro zero até o timeout de segurança limpar a classe.
      await waitFor(() => expect(dismiss).toBeVisible());
    });

    await step("Clique remove o alert original e a demo remonta", async () => {
      const alertOriginal = canvas.getByRole("alert");
      await userEvent.click(canvas.getByRole("button", { name: "Fechar alerta" }));

      // waitFor: a saída é animada (.nds-animate-out) e o nó só sai do DOM
      // quando a animação termina — ou no timeout de segurança do primitivo.
      await waitFor(() => expect(alertOriginal).not.toBeInTheDocument());

      await waitFor(async () => {
        const remontado = canvas.getByRole("alert");
        await expect(remontado).not.toBe(alertOriginal);
        await expect(remontado).toBeVisible();
      });
    });

    // Depois da remontagem tudo já assentou: o callback foi disparado uma vez
    // só, e depois que o nó saiu da tela.
    await step("Callback disparado uma única vez", async () => {
      await expect(args.onDismiss).toHaveBeenCalledTimes(1);
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

    await step("Enter no botão focado remove o alert original e a demo remonta", async () => {
      const alertOriginal = canvas.getByRole("alert");
      const dismiss = canvas.getByRole("button", { name: "Fechar alerta" });
      dismiss.focus();
      await expect(dismiss).toHaveFocus();
      await userEvent.keyboard("{Enter}");

      // waitFor: a saída é animada (.nds-animate-out) e o nó só sai do DOM
      // quando a animação termina — ou no timeout de segurança do primitivo.
      await waitFor(() => expect(alertOriginal).not.toBeInTheDocument());

      await waitFor(async () => {
        const remontado = canvas.getByRole("alert");
        await expect(remontado).not.toBe(alertOriginal);
        await expect(remontado).toBeVisible();
      });
    });

    await step("Callback disparado uma única vez", async () => {
      await expect(args.onDismiss).toHaveBeenCalledTimes(1);
    });
  },
};
