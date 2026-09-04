import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within, expect } from "storybook/test";
import {
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Bold, Italic, Underline,
  LayoutGrid, List,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";
import { definir } from "./toggle-group.fixtures";
import {
  toggleGroupControlledCombinadoSource,
  toggleGroupControlledExclusivoSource,
  toggleGroupSource,
  toggleGroupVerticalSource,
} from "./toggle-group.source";

const meta = {
  title: "Components/Form/ToggleGroup/Compositions",
  tags: ["form"],
  component: ToggleGroup,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      source: { transform: toggleGroupSource },
      description: {
        component:
          "Composicoes reais do ToggleGroup: barra de alinhamento (single), barra de formatação (multiple) e seletor vertical.",
      },
    },
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleAlignment: Story = {
  render: function AlignmentSingleRender() {
    const [alignment, setAlignment] = useState<string>("left");
    return (
      <div className="nds-stack nds-w-2xs" data-align="start" data-spacing="sm">
        <ToggleGroup
          variant="outline"
          value={alignment}
          // Modo exclusivo entrega string: manter o array aqui exigia
          // desembrulhar na mão e escondia a forma documentada do valor.
          onValueChange={(v: string) => setAlignment(v)}
          aria-label="Alinhamento do texto"
        >
          <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
            <AlignLeft aria-hidden="true" />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Centralizar">
            <AlignCenter aria-hidden="true" />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Alinhar à direita">
            <AlignRight aria-hidden="true" />
          </ToggleGroupItem>
          <ToggleGroupItem value="justify" aria-label="Justificar">
            <AlignJustify aria-hidden="true" />
          </ToggleGroupItem>
        </ToggleGroup>
        <p className="nds-text-caption nds-text-muted-foreground">
          Atual: <code className="nds-font-mono">{alignment}</code>
        </p>
      </div>
    );
  },
  parameters: {
    covers: ["visual.item4"],
    docs: {
      description: {
        story:
          "Barra de alinhamento com seleção única controlada — o modo exclusivo garante que apenas um item esteja ativo por vez.",
      },
      // O painel imprimia `<AlinhamentoSingleRender />`, que não existe fora daqui.
      source: { transform: toggleGroupControlledExclusivoSource },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const left = canvas.getByRole("button", { name: "Alinhar à esquerda" });
    const center = canvas.getByRole("button", { name: "Centralizar" });

    await step("visual.item4 — a variante outline emenda os itens num container só", async () => {
      const group = canvas.getByRole("toolbar");
      await expect(group).toHaveAttribute("data-variant", "outline");
      await expect(parseFloat(getComputedStyle(group).borderTopWidth)).toBeGreaterThan(0);
      await expect(parseFloat(getComputedStyle(left).borderTopWidth)).toBe(0);
    });

    await step("Quatro itens icon-only, cada um com a sua função no nome", async () => {
      const buttons = canvas.getAllByRole("button");
      await expect(buttons).toHaveLength(4);
      for (const b of buttons) await expect(b.getAttribute("aria-label")).toBeTruthy();
    });

    await step("Trocar a seleção desliga a anterior (exclusivo)", async () => {
      await definir(center, true);
      await expect(center).toHaveAttribute("aria-pressed", "true");
      await expect(left).toHaveAttribute("aria-pressed", "false");
      // O texto de apoio acompanha o estado controlado.
      await expect(canvas.getByText("center")).toBeVisible();
      // Volta ao estado inicial para a próxima rodada começar igual a esta.
      await definir(left, true);
    });
  },
};

export const MultipleFormatting: Story = {
  render: function FormattingMultipleRender() {
    const [formats, setFormats] = useState<string[]>(["bold"]);
    return (
      <div className="nds-stack nds-w-2xs" data-align="start" data-spacing="sm">
        <ToggleGroup
          type="multiple"
          value={formats}
          onValueChange={(v: string[]) => setFormats(v)}
          aria-label="Formatação"
        >
          <ToggleGroupItem value="bold" aria-label="Negrito">
            <Bold aria-hidden="true" />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Itálico">
            <Italic aria-hidden="true" />
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="Sublinhado">
            <Underline aria-hidden="true" />
          </ToggleGroupItem>
        </ToggleGroup>
        <p className="nds-text-caption nds-text-muted-foreground">
          Ativos: <code className="nds-font-mono">[{formats.join(", ")}]</code>
        </p>
      </div>
    );
  },
  parameters: {
    covers: ["visual.item5"],
    docs: {
      description: {
        story:
          "Barra de formatação Bold/Italic/Underline com seleção múltipla — o modo combinado permite ativar items independentemente. Os botões nascem emendados: o grupo não tem espaço entre items.",
      },
      // Controlado no modo combinado: o callback recebe a lista inteira.
      source: { transform: toggleGroupControlledCombinadoSource },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const bold = canvas.getByRole("button", { name: "Negrito" });
    const italic = canvas.getByRole("button", { name: "Itálico" });

    await step("Adiciona italic mantendo bold (combinado)", async () => {
      await definir(bold, true);
      await definir(italic, true);
      await expect(bold).toHaveAttribute("aria-pressed", "true");
      await expect(italic).toHaveAttribute("aria-pressed", "true");
    });

    await step("Desligar italic não mexe em bold", async () => {
      await definir(italic, false);
      await expect(italic).toHaveAttribute("aria-pressed", "false");
      await expect(bold).toHaveAttribute("aria-pressed", "true");
    });

    await step("visual.item5 — os itens são emendados, sem espaço entre eles", async () => {
      const a = bold.getBoundingClientRect();
      const b = italic.getBoundingClientRect();
      // Meio pixel de folga: o arredondamento do layout, não um gap.
      await expect(Math.abs(b.left - a.right)).toBeLessThanOrEqual(0.5);
    });
  },
};

export const Vertical: Story = {
  render: () => (
    <ToggleGroup
      orientation="vertical"
      defaultValue="grid"
      aria-label="Modo de visualização"
    >
      <ToggleGroupItem value="grid" aria-label="Grade">
        <LayoutGrid aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="Lista">
        <List aria-hidden="true" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Seletor de modo de visualização (Grid/Lista) em orientação vertical — ideal para painéis laterais.",
      },
      // Outro conjunto de itens e o eixo trocado — nada disso cabe nos args.
      source: { transform: toggleGroupVerticalSource },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole("button", { name: "Grade" });
    const list = canvas.getByRole("button", { name: "Lista" });

    await step("ArrowDown navega para o próximo item (vertical)", async () => {
      grid.focus();
      await userEvent.keyboard("{ArrowDown}");
      await expect(list).toHaveFocus();
    });

    await step("Empilhado de verdade: o segundo item começa abaixo do primeiro", async () => {
      const a = grid.getBoundingClientRect();
      const b = list.getBoundingClientRect();
      await expect(b.top).toBeGreaterThanOrEqual(a.bottom - 1);
    });
  },
};
