import { figmaDesign } from "@shared/figma/design-links";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import { Badge } from "./badge";
import { BadgeDocs } from "@/components/docs/BadgeDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs", "feedback"],
  parameters: {
    design: figmaDesign("badge"),
    docs: { page: withAutoDocsTab(BadgeDocs) },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline"],
      description: "Variante visual do Badge",
    },
    children: {
      control: "text",
      description: "Conteúdo do Badge — texto curto ou número",
    },
  },
  args: {
    variant: "default",
    children: "Novo",
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: { covers: ['accessibility.item1', 'visual.item1'] },
  render: (args) => <Badge {...args} />,
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText(String(args.children));

    await step("Os controls chegam ao elemento", async () => {
      await expect(badge).toHaveAttribute("data-slot", "badge");
      await expect(badge).toHaveAttribute("data-variant", String(args.variant));
    });

    await step("É um <span>, para caber dentro de frase e célula", async () => {
      // Um <div> aqui quebra o fluxo do texto que acompanha o badge, e
      // <div> dentro de <p> é aninhamento inválido. Só o Angular afirmava
      // isso — e era justamente a stack que sobrava que renderizava <div>.
      await expect(badge.tagName).toBe("SPAN");
    });

    await step("Etiqueta inline, não bloco", async () => {
      // accessibility.item1 — o badge mora dentro de frase e de célula: se
      // virasse bloco, quebraria a linha do texto que o acompanha.
      const estilo = getComputedStyle(badge);
      await expect(estilo.display).toBe("inline-flex");
      await expect(estilo.whiteSpace).toBe("nowrap");
    });

    await step("Tipografia compacta do componente", async () => {
      const estilo = getComputedStyle(badge);
      await expect(estilo.fontSize).toBe("12px");
      await expect(Number(estilo.fontWeight)).toBeGreaterThanOrEqual(500);
    });
  },
};
