import { figmaDesign } from "@shared/figma/design-links";
import type { ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect, fn, waitFor } from "storybook/test";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "./alert";
import { alertSource } from "./alert.source";
import { AlertDocs } from "@/components/docs/AlertDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

/**
 * Título e descrição são args da STORY, não props do Alert: o conteúdo entra por
 * composição (`AlertTitle` / `AlertDescription`). Declará-los como control é o
 * que deixa o leitor mexer no texto sem editar o arquivo — e é o que o painel
 * Code lê para escrever o snippet.
 */
type AlertStoryArgs = ComponentProps<typeof Alert> & {
  title: string;
  description: string;
};

/**
 * O ícone que acompanha cada variante — o MESMO mapa que o painel Code aplica
 * (`variantIcon`, em `alert.source.ts`).
 *
 * As duas pontas escolhem o ícone pela mesma regra de propósito: com o mapa só
 * de um lado, o painel prometia `<CheckCircle2 />` enquanto a tela mostrava o
 * informativo em toda variante que não fosse a default. `default` não tem cor
 * semântica, então recebe o informativo; `destructive` é a única cujo nome de
 * variante e nome de ícone não coincidem.
 */
const VARIANT_ICON = {
  default: Info,
  destructive: AlertCircle,
  success: CheckCircle2,
  warning: TriangleAlert,
  info: Info,
} satisfies Record<string, LucideIcon>;

type AlertVariant = keyof typeof VARIANT_ICON;

function variantIcon(variant: AlertVariant): LucideIcon {
  return VARIANT_ICON[variant] ?? Info;
}

/**
 * A classe que o lucide escreve em todo ícone (`Info` → `lucide-info`) — é o
 * único traço do ícone que sobrevive no DOM, já que o SVG não carrega nome.
 * Derivada do `displayName` do próprio componente, e não de uma segunda tabela:
 * tabela paralela é justamente o que o mapa acima existe para eliminar.
 */
function lucideClass(Icon: LucideIcon): string {
  const name = Icon.displayName ?? "";
  return `lucide-${name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`;
}

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
    title: {
      control: "text",
      description: "Texto do título. Arg da story — o conteúdo entra por AlertTitle.",
      table: { type: { summary: "string" } },
    },
    description: {
      control: "text",
      description: "Texto da descrição. Arg da story — o conteúdo entra por AlertDescription.",
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
    title: "Atenção",
    description: "Suas alterações serão aplicadas na próxima sessão.",
    dismissible: false,
    onDismiss: fn(),
  },
} satisfies Meta<AlertStoryArgs>;

export default meta;
// Ligado ao tipo de args, e não ao `meta`: `StoryObj<typeof meta>` deriva os
// args do `component`, e `description` — que é arg da story, não prop do Alert —
// desaparece do `play`.
type Story = StoryObj<AlertStoryArgs>;

export const Playground: Story = {
  parameters: {
    covers: ["accessibility.item1", "accessibility.item4", "visual.item1"],
    // Própria, e não herdada do meta: herança acerta por coincidência, e a
    // coincidência não sobrevive à próxima edição do render.
    docs: { source: { transform: alertSource } },
  },
  // `title` e `description` saem do spread: são args da story, e `title` ainda
  // por cima é atributo HTML válido — repassado à raiz viraria tooltip nativo.
  render: ({ title, description, ...args }) => {
    const Icon = variantIcon(args.variant ?? "default");
    return (
      <Alert {...args}>
        <Icon aria-hidden="true" />
        {title && <AlertTitle as="h4">{title}</AlertTitle>}
        <AlertDescription>{description}</AlertDescription>
      </Alert>
    );
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    // O control `role` troca a semântica da raiz — TODAS as buscas seguem o arg
    // para a story continuar verde em qualquer configuração do painel.
    const role = args.role ?? "alert";
    const variant = args.variant ?? "default";
    const title = args.title;
    const description = args.description;

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

    if (title) {
      await step("AlertTitle é renderizado no nível que a story declara", async () => {
        await waitFor(() => expect(canvas.getByText(title)).toBeVisible());
        // O nível do título é decisão de hierarquia da página, não do
        // componente: a story pede `as="h4"` e o painel Code ensina o mesmo.
        // Medir a tag é o que impede as duas pontas de divergirem em silêncio.
        const heading = canvas.getByText(title);
        await expect(heading.tagName).toBe("H4");
        await expect(heading).toHaveClass("nds-alert-title");
      });
    }

    await step("AlertDescription é renderizado corretamente", async () => {
      await waitFor(() => expect(canvas.getByText(description)).toBeVisible());
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

    // `accessibility.item4` — "cada variante deve ter ícone e texto
    // correspondentes" — é declarado por ESTA story, e era ela que mostrava o
    // contrário: o `render` cravava o informativo em toda variante. A asserção
    // segue o mapa, então voltar a cravar um ícone fixo reprova aqui.
    await step("O ícone acompanha a variante escolhida", async () => {
      const icon = canvas.getByRole(role).querySelector(":scope > svg");
      const expected = lucideClass(variantIcon(variant));
      await expect(icon).toHaveClass(expected);
      // E nenhum dos outros: ícone errado não pode passar por "tem um ícone".
      for (const Other of Object.values(VARIANT_ICON)) {
        const otherClass = lucideClass(Other);
        if (otherClass !== expected) await expect(icon).not.toHaveClass(otherClass);
      }
    });
  },
};
