import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Separator } from "./separator";
import { separatorSource, type SeparatorArgs } from "./separator.source";
import { SeparatorDocs } from "@/components/docs/SeparatorDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Separator",
  component: Separator,
  tags: ["autodocs", "layout"],
  parameters: {
    layout: "padded",
    docs: { page: withAutoDocsTab(SeparatorDocs), source: { transform: separatorSource } },
  },
  argTypes: {
    orientation: {
      control: { type: "inline-radio" },
      options: ["horizontal", "vertical"],
      description: "Direção do divisor.",
      table: { type: { summary: "'horizontal' | 'vertical'" }, defaultValue: { summary: "'horizontal'" } },
    },
    decorative: {
      control: { type: "boolean" },
      description:
        "Quando true (padrão), aplica role=none e aria-hidden, sem anunciar orientação. Quando false, expõe role=separator + aria-orientation.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "true" } },
    },
    emphasis: {
      control: { type: "inline-radio" },
      options: ["default", "strong"],
      description: "Peso da linha. O valor forte dobra a espessura e troca o token de cor.",
      table: { type: { summary: "'default' | 'strong'" }, defaultValue: { summary: "'default'" } },
    },
  },
  args: {
    orientation: "horizontal",
    decorative: true,
    emphasis: "default",
  },
} as Meta<typeof Separator>;

export default meta;
type Story = StoryObj<SeparatorArgs>;

export const Playground: Story = {
  parameters: {
    covers: ["functional.item1", "functional.item3", "accessibility.item1", "accessibility.item5"],
  },
  render: (args) => {
    if (args.orientation === "vertical") {
      // Sem altura cravada: o `align-self: stretch` da folha faz a linha
      // acompanhar a linha do flex. Cravar altura aqui esconderia o contrato.
      return (
        <div
          key={args.orientation}
          className="nds-cluster nds-docs-demo-row nds-w-md"
          data-spacing="md"
        >
          <span className="nds-text-body">Item A</span>
          <Separator {...args} />
          <span className="nds-text-body nds-text-muted-foreground">Item B</span>
        </div>
      )
    }
    return (
      <div key={args.orientation} className="nds-stack nds-w-md" data-spacing="md">
        <p className="nds-text-body">Seção superior</p>
        <Separator {...args} />
        <p className="nds-text-body">Seção inferior</p>
      </div>
    )
  },
  play: async ({ canvasElement, args, step }) => {
    const separator = canvasElement.querySelector<HTMLElement>(".nds-separator");

    await step("A linha existe e reflete a orientação escolhida", async () => {
      await expect(separator).toBeInTheDocument();
      await expect(separator).toHaveAttribute("data-orientation", args.orientation);
    });

    await step("Espessura de 1px no eixo da orientação", async () => {
      // Medida computada, não nome de classe: é a espessura que a pessoa vê, e
      // é o que uma troca de folha quebraria sem mudar atributo nenhum.
      const box = separator!.getBoundingClientRect();
      await expect(Math.min(box.width, box.height)).toBeCloseTo(1, 1);
      await expect(Math.max(box.width, box.height)).toBeGreaterThan(8);
    });

    await step("Semântica conforme o modo escolhido", async () => {
      if (args.decorative) {
        await expect(separator).toHaveAttribute("role", "none");
        await expect(separator).toHaveAttribute("aria-hidden", "true");
        // O atributo não é permitido em role="none" e nada informaria fora da
        // árvore de acessibilidade.
        await expect(separator).not.toHaveAttribute("aria-orientation");
      } else {
        await expect(separator).toHaveAttribute("role", "separator");
        await expect(separator).toHaveAttribute("aria-orientation", args.orientation);
        await expect(separator).not.toHaveAttribute("aria-hidden");
      }
    });

    await step("Fora da ordem de tabulação e sem aceitar foco", async () => {
      await expect(separator).not.toHaveAttribute("tabindex");
      // `focus()` num elemento não focável não muda o `activeElement` — a
      // asserção é idempotente e sobrevive ao replay do painel Interactions.
      separator!.focus?.();
      await expect(canvasElement.ownerDocument.activeElement).not.toBe(separator);
    });
  },
};
