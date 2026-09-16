import { figmaDesign } from "@shared/figma/design-links";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import { Badge } from "./badge";
import { BadgeDocs } from "@/components/docs/BadgeDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";
import { badgeSource } from "./badge.source";
import badgeTranslations from "@shared/content/badge/translations.json";

/**
 * Rótulos do bloco pt-BR, lidos DIRETO do JSON compartilhado — o mesmo que o
 * construtor do snippet lê. A story é fixture: o texto que ela monta e o que ela
 * procura têm de ser o mesmo, e não podem mudar com o idioma do navegador.
 */
const LABELS = badgeTranslations["pt-BR"].demonstration.labels;

const meta = {
  title: "Components/Feedback/Badge",
  component: Badge,
  tags: ["autodocs", "feedback"],
  parameters: {
    design: figmaDesign("badge"),
    actions: { disable: true },
    layout: "centered",
    docs: { page: withAutoDocsTab(BadgeDocs), source: { transform: badgeSource } },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "warning", "success", "info"],
      description: "Variante visual do Badge",
    },
    children: {
      control: "text",
      description: "Conteúdo do Badge — texto curto ou número",
    },
  },
  args: {
    variant: "default",
    children: LABELS.defaultLabel,
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  // A transform é declarada AQUI, e não herdada do `meta`: herança acerta por
  // coincidência, e no dia em que o `meta` trocar de transform esta story passa
  // a publicar outro exemplo sem ninguém ver.
  parameters: {
    covers: ['accessibility.item1', 'visual.item1'],
    docs: { source: { transform: badgeSource } },
  },
  // Com o control no padrão, a story NÃO passa `variant`: é o que prova que o
  // padrão chega ao DOM como `data-variant="default"` sem ninguém pedir.
  render: ({ variant, ...args }) => (
    <Badge {...args} variant={variant === "default" ? undefined : variant} />
  ),
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText(String(args.children));

    await step("Os controls chegam ao elemento", async () => {
      await expect(badge).toHaveAttribute("data-slot", "badge");
      // Sem variante escolhida no control, o padrão tem de sair declarado no
      // DOM — a folha e a sonda leem `data-variant`, não a ausência dele.
      await expect(badge).toHaveAttribute("data-variant", args.variant ?? "default");
    });

    await step("É um <span>, para caber dentro de frase e célula", async () => {
      // Um <div> aqui quebra o fluxo do texto que acompanha o badge, e
      // <div> dentro de <p> é aninhamento inválido.
      await expect(badge.tagName).toBe("SPAN");
    });

    await step("Etiqueta inline, não bloco", async () => {
      // accessibility.item1 — o badge mora dentro de frase e de célula: se
      // virasse bloco, quebraria a linha do texto que o acompanha.
      const style = getComputedStyle(badge);
      await expect(style.display).toBe("inline-flex");
      await expect(style.whiteSpace).toBe("nowrap");
      // Etiqueta passiva: não entra na ordem de Tab.
      await expect(badge.hasAttribute("tabindex")).toBe(false);
    });

    await step("Tipografia compacta do componente", async () => {
      const style = getComputedStyle(badge);
      await expect(style.fontSize).toBe("12px");
      await expect(Number(style.fontWeight)).toBeGreaterThanOrEqual(500);
    });
  },
};
