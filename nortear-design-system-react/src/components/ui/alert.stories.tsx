import { figmaDesign } from "@shared/figma/design-links";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect, fn, waitFor } from "storybook/test";
import { Info } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "./alert";
import { alertSource } from "./alert.source";
import { AlertDocs } from "@/components/docs/AlertDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "Components/Feedback/Alert",
  component: Alert,
  tags: ["autodocs", "feedback"],
  parameters: {
    design: figmaDesign("alert"),
    docs: {
      page: withAutoDocsTab(AlertDocs),
      // O painel imprimia a árvore do `render`; a transform do `meta` devolve o
      // uso real e cascateia para toda story do arquivo.
      source: { transform: alertSource },
    },
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
    role: {
      control: "select",
      options: ["alert", "status", "note"],
      description:
        "Semântica de anúncio para leitores de tela. 'alert' e 'status' são live regions; 'note' não é — use-o para conteúdo estático já presente no carregamento da página.",
      table: { type: { summary: "'alert' | 'status' | 'note'" }, defaultValue: { summary: "'alert'" } },
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
    role: "alert",
    dismissible: false,
    onDismiss: fn(),
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: { covers: ["accessibility.item1", "accessibility.item4", "visual.item1"] },
  render: (args) => (
    <Alert {...args}>
      <Info aria-hidden="true" />
      <AlertTitle as="h4">Atenção</AlertTitle>
      <AlertDescription>
        Suas alterações serão aplicadas na próxima sessão.
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    // O control `role` troca a semântica da raiz — TODAS as buscas seguem o arg
    // para a story continuar verde em qualquer configuração do painel.
    const role = args.role ?? "alert";
    const variant = args.variant ?? "default";

    await step("A semântica de anúncio escolhida chega ao DOM", async () => {
      const alert = canvas.getByRole(role);
      await expect(alert).toBeInTheDocument();
      await expect(alert).toHaveAttribute("role", role);
    });

    // waitFor nas asserções de visibilidade: com o control `dismissible`
    // ligado, o alert ENTRA animado (opacidade 0 → 1) e medir no primeiro
    // quadro falha. Sem o control ligado passa de primeira — o waitFor não
    // custa nada e cobre as duas configurações do Playground.
    await step("Alert está visível", async () => {
      await waitFor(() => expect(canvas.getByRole(role)).toBeVisible());
    });

    await step("AlertTitle é renderizado corretamente", async () => {
      await waitFor(() => expect(canvas.getByText("Atenção")).toBeVisible());
    });

    // O nível do título é decisão de hierarquia da página, não do componente: a
    // story pede `as="h4"` e o painel Code ensina o mesmo. Medir a tag é o que
    // impede a story e o snippet de divergirem em silêncio.
    await step("AlertTitle renderiza no nível pedido", async () => {
      const title = canvas.getByText("Atenção");
      await expect(title.tagName).toBe("H4");
    });

    await step("AlertDescription é renderizado corretamente", async () => {
      await waitFor(() =>
        expect(canvas.getByText(/Suas alterações serão aplicadas/)).toBeVisible(),
      );
    });

    await step("A variante do control aplica as classes corretas", async () => {
      const alert = canvas.getByRole(role);
      await expect(alert).toHaveAttribute("data-slot", "alert");
      await expect(alert).toHaveClass("nds-alert");
      for (const modifier of ["destructive", "success", "warning", "info"]) {
        // A default não recebe modificador; as outras recebem só o seu.
        if (modifier === variant) await expect(alert).toHaveClass(`nds-alert-${modifier}`);
        else await expect(alert).not.toHaveClass(`nds-alert-${modifier}`);
      }
    });

    await step("O ícone é decorativo e filho direto do alert", async () => {
      // Filho DIRETO: é `.nds-alert > svg` que abre a coluna do ícone.
      const icon = canvas.getByRole(role).querySelector(":scope > svg");
      await expect(icon).toHaveAttribute("aria-hidden", "true");
      await expect(icon).not.toHaveClass("nds-icon");
    });
  },
};
