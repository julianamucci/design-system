import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Separator } from "./separator";
import { separatorSemanticoSource, separatorSource } from "./separator.source";

const meta = {
  title: "UI/Separator/States",
  tags: ["layout"],
  component: Separator,
  parameters: {
    layout: "padded",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: separatorSource },
      description: {
        component:
          "Modos do Separator: decorativo (padrão, ignorado por leitores de tela) e semântico (anunciado como divisor, com a própria orientação).",
      },
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Decorative: Story = {
  parameters: { covers: ["functional.item3", "accessibility.item2", "accessibility.item3"] },
  render: () => (
    <div className="nds-stack nds-w-md" data-spacing="sm">
      <h3 className="nds-text-body nds-font-medium">Decorativo (padrão)</h3>
      <p className="nds-text-caption nds-text-muted-foreground">
        Ignorado por leitores de tela — a divisão é só visual.
      </p>
      <p className="nds-text-body">Conteúdo antes do separador.</p>
      <Separator orientation="horizontal" decorative />
      <p className="nds-text-body">Conteúdo depois do separador.</p>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const sep = canvasElement.querySelector<HTMLElement>(".nds-separator");

    await step("Sai da árvore de acessibilidade", async () => {
      await expect(sep).toHaveAttribute("role", "none");
      await expect(sep).toHaveAttribute("aria-hidden", "true");
    });

    await step("Não anuncia orientação", async () => {
      // `aria-orientation` não é permitido em role="none" e nada informaria
      // fora da árvore de acessibilidade — o atributo é ruído, não detalhe.
      await expect(sep).not.toHaveAttribute("aria-orientation");
    });
  },
};

export const Semantic: Story = {
  parameters: {
    covers: ["functional.item4", "accessibility.item4"],
    docs: {
      // `decorative={false}` é o que a story afirma no `render`, sem control
      // nenhum descrevendo a troca de `role="none"` por `role="separator"`.
      source: { transform: separatorSemanticoSource },
    },
  },
  render: () => (
    <div className="nds-stack nds-w-md" data-spacing="sm">
      <h3 className="nds-text-body nds-font-medium">Semântico</h3>
      <p className="nds-text-caption nds-text-muted-foreground">
        Anunciado como divisor, com a orientação da linha.
      </p>
      <p className="nds-text-body">Categoria: Layout</p>
      <Separator orientation="horizontal" decorative={false} />
      <p className="nds-text-body">Categoria: Formulários</p>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const sep = canvasElement.querySelector<HTMLElement>(".nds-separator");

    await step("Exposto como divisor", async () => {
      await expect(sep).toHaveAttribute("role", "separator");
      await expect(sep).not.toHaveAttribute("aria-hidden");
    });

    await step("Anuncia a própria orientação", async () => {
      await expect(sep).toHaveAttribute("aria-orientation", "horizontal");
    });
  },
};
