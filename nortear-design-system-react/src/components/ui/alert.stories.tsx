import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect, fn, waitFor } from "storybook/test";
import { Info } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "./alert";
import { AlertDocs } from "@/components/docs/AlertDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Alert",
  component: Alert,
  tags: ["autodocs", "feedback"],
  parameters: {
    docs: { page: withAutoDocsTab(AlertDocs) },
  },
  // A aba "API Reference" combina o docgen com estes argTypes. children fica sem
  // control porque o render fixa a composição da story.
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "success", "warning", "info"],
      description: "Variante semântica do alert.",
      table: { type: { summary: "'default' | 'destructive' | 'success' | 'warning' | 'info'" }, defaultValue: { summary: "'default'" } },
    },
    dismissible: {
      control: "boolean",
      description: "Exibe o botão de fechar no canto superior direito. Fechar remove o alert da tela.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    onDismiss: {
      control: false,
      description: "Callback de fechamento — disparado uma única vez ao acionar o botão de fechar.",
      table: { type: { summary: "() => void" } },
    },
    dismissLabel: {
      // O render não precisa fiá-lo: o default do componente já cobre o playground.
      control: false,
      description: "Rótulo acessível (aria-label) do botão de fechar.",
      table: { type: { summary: "string" }, defaultValue: { summary: "'Fechar alerta'" } },
    },
    className: {
      control: false,
      description: "Classes adicionais no elemento raiz.",
      table: { type: { summary: "string" } },
    },
    children: {
      control: false,
      description: "Composição interna: ícone opcional, AlertTitle, AlertDescription e AlertAction.",
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    variant: "default",
    dismissible: false,
    onDismiss: fn(),
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Alert {...args}>
      <Info aria-hidden="true" className="" style={{ height: "1rem", width: "1rem" }} />
      <AlertTitle>Atenção</AlertTitle>
      <AlertDescription>
        Suas alterações serão aplicadas na próxima sessão.
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Elemento alert está presente no DOM", async () => {
      const alert = canvas.getByRole("alert");
      await expect(alert).toBeInTheDocument();
    });

    // waitFor nas asserções de visibilidade: com o control `dismissible`
    // ligado, o alert ENTRA animado (opacidade 0 → 1) e medir no primeiro
    // quadro falha. Sem o control ligado passa de primeira — o waitFor não
    // custa nada e cobre as duas configurações do Playground.
    await step("Alert está visível", async () => {
      await waitFor(() => expect(canvas.getByRole("alert")).toBeVisible());
    });

    await step("AlertTitle é renderizado corretamente", async () => {
      await waitFor(() => expect(canvas.getByText("Atenção")).toBeVisible());
    });

    await step("AlertTitle é H5 por padrão", async () => {
      const title = canvas.getByText("Atenção");
      await expect(title.tagName).toBe("H5");
    });

    await step("AlertDescription é renderizado corretamente", async () => {
      await waitFor(() =>
        expect(canvas.getByText(/Suas alterações serão aplicadas/)).toBeVisible(),
      );
    });

    await step("Variante default aplica classes corretas", async () => {
      const alert = canvas.getByRole("alert");
      await expect(alert).toHaveAttribute("data-slot", "alert");
      await expect(alert).toHaveClass("nds-alert");
    });
  },
};
