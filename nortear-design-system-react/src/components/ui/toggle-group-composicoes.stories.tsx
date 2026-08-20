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

const meta = {
  title: "UI/ToggleGroup/Compositions",
  tags: ["form"],
  component: ToggleGroup,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes reais do ToggleGroup: barra de alinhamento (single), barra de formatação (multiple), seletor vertical e versão outline/segmented.",
      },
    },
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleAlignment: Story = {
  render: function AlinhamentoSingleRender() {
    const [alignment, setAlignment] = useState<string>("left");
    return (
      <div className="nds-stack" data-align="start" data-spacing="sm" style={{ width: "18rem" }}>
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
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const left = canvas.getByRole("button", { name: "Alinhar à esquerda" });
    const center = canvas.getByRole("button", { name: "Centralizar" });

    await step("visual.item4 — a variante outline emenda os itens num container só", async () => {
      const grupo = canvas.getByRole("toolbar");
      await expect(grupo).toHaveAttribute("data-variant", "outline");
      await expect(parseFloat(getComputedStyle(grupo).borderTopWidth)).toBeGreaterThan(0);
      await expect(parseFloat(getComputedStyle(left).borderTopWidth)).toBe(0);
    });

    await step("Quatro itens icon-only, cada um com a sua função no nome", async () => {
      const botoes = canvas.getAllByRole("button");
      await expect(botoes).toHaveLength(4);
      for (const b of botoes) await expect(b.getAttribute("aria-label")).toBeTruthy();
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
  render: function FormatacaoMultipleRender() {
    const [formats, setFormats] = useState<string[]>(["bold"]);
    return (
      <div className="nds-stack" data-align="start" data-spacing="sm" style={{ width: "18rem" }}>
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
    docs: {
      description: {
        story:
          "Barra de formatação Bold/Italic/Underline com seleção múltipla — o modo combinado permite ativar items independentemente.",
      },
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

export const OutlineSpaced: Story = {
  render: () => (
    // O contorno vai no ITEM, não no grupo: `variant="outline"` no grupo emenda
    // os botões num container só e zera a borda de cada um — o oposto do que
    // esta composição demonstra.
    <ToggleGroup spacing={1} defaultValue="center" aria-label="Alinhamento do texto">
      <ToggleGroupItem variant="outline" value="left" aria-label="Alinhar à esquerda">
        <AlignLeft aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem variant="outline" value="center" aria-label="Centralizar">
        <AlignCenter aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem variant="outline" value="right" aria-label="Alinhar à direita">
        <AlignRight aria-hidden="true" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
  parameters: {
    covers: ["visual.item5"],
    docs: {
      description: {
        story:
          "spacing=1 com contorno em cada item — botões separados, cada um com a própria borda. Contraste com o estilo segmented padrão (spacing=0).",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const left = canvas.getByRole("button", { name: "Alinhar à esquerda" });
    const center = canvas.getByRole("button", { name: "Centralizar" });

    await step("visual.item5 — com espaçamento os botões deixam de ser emendados", async () => {
      await expect(canvas.getByRole("toolbar")).toHaveAttribute("data-spacing", "1");
      const a = left.getBoundingClientRect();
      const b = center.getBoundingClientRect();
      await expect(b.left).toBeGreaterThan(a.right);
    });

    await step("Separados, os itens mantêm borda e canto próprios", async () => {
      await expect(parseFloat(getComputedStyle(left).borderTopWidth)).toBeGreaterThan(0);
      await expect(parseFloat(getComputedStyle(left).borderTopRightRadius)).toBeGreaterThan(0);
    });
  },
};
