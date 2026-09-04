import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect } from "storybook/test";
import {
  AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline,
  LayoutGrid, List,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";
import { definir } from "./toggle-group.fixtures";
import {
  toggleGroupCombinadoSource,
  toggleGroupExclusivoSource,
  toggleGroupSource,
  toggleGroupVerticalSource,
} from "./toggle-group.source";

const meta = {
  title: "Components/Form/ToggleGroup/Variants",
  tags: ["form"],
  component: ToggleGroup,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      source: { transform: toggleGroupSource },
      description: {
        component:
          "Variantes do ToggleGroup: single (seleção exclusiva), multiple (combinação) e vertical (items empilhados).",
      },
    },
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {
  render: () => (
    <ToggleGroup defaultValue="center" aria-label="Alinhamento do texto">
      <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
        <AlignLeft aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Centralizar">
        <AlignCenter aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Alinhar à direita">
        <AlignRight aria-hidden="true" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
  parameters: {
    covers: ["functional.item1", "visual.item1"],
    docs: {
      // O arquivo desliga os controls: o modo e o item ativo vêm da story.
      source: { transform: toggleGroupExclusivoSource },
      description: {
        story:
          'Seleção exclusiva (apenas um item ativo) — o valor é uma string. Ideal para alinhamento de texto.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const center = canvas.getByRole("button", { name: "Centralizar" });
    const left = canvas.getByRole("button", { name: "Alinhar à esquerda" });

    await step("O modo exclusivo nasce com exatamente um item ativo", async () => {
      const pressionados = canvas
        .getAllByRole("button")
        .filter((b) => b.getAttribute("aria-pressed") === "true");
      await expect(pressionados).toHaveLength(1);
      await expect(center).toHaveAttribute("aria-pressed", "true");
    });

    await step("aria-label do grupo presente", async () => {
      await expect(canvas.getByRole("toolbar")).toHaveAttribute(
        "aria-label",
        "Alinhamento do texto",
      );
    });

    await step("functional.item1 — escolher um item desliga o anterior", async () => {
      await definir(left, true);
      await expect(left).toHaveAttribute("aria-pressed", "true");
      await expect(center).toHaveAttribute("aria-pressed", "false");
      // Volta ao estado inicial para a próxima rodada começar igual a esta.
      await definir(center, true);
    });
  },
};

export const Multiple: Story = {
  render: () => (
    <ToggleGroup type="multiple" defaultValue={["bold", "italic"]} aria-label="Formatação">
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
  ),
  parameters: {
    covers: ["functional.item2", "visual.item2"],
    docs: {
      // No modo combinado a forma do valor vira lista — é a diferença de API.
      source: { transform: toggleGroupCombinadoSource },
      description: {
        story:
          'Seleção combinada (vários items podem estar ativos) — o valor é um array de strings. Ideal para formatação Bold/Italic/Underline.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const bold = canvas.getByRole("button", { name: "Negrito" });
    const italic = canvas.getByRole("button", { name: "Itálico" });
    const underline = canvas.getByRole("button", { name: "Sublinhado" });
    const ativos = () =>
      canvas.getAllByRole("button").filter((b) => b.getAttribute("aria-pressed") === "true");

    await step("O modo combinado aceita mais de um ativo ao mesmo tempo", async () => {
      await definir(bold, true);
      await definir(italic, true);
      await definir(underline, false);
      await expect(ativos()).toHaveLength(2);
    });

    await step("functional.item2 — ligar um item soma; desligar subtrai", async () => {
      await definir(underline, true);
      await expect(ativos()).toHaveLength(3);
      await expect(bold).toHaveAttribute("aria-pressed", "true");

      await definir(italic, false);
      await expect(ativos()).toHaveLength(2);

      // Restaura o estado inicial da story.
      await definir(italic, true);
      await definir(underline, false);
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
    covers: ["visual.item3"],
    docs: {
      // Outro conjunto de itens e o eixo trocado — nada disso cabe nos args.
      source: { transform: toggleGroupVerticalSource },
      description: {
        story:
          'orientation="vertical" — items empilhados. Navegação via ArrowUp/ArrowDown. Útil para sidebars com modos de visualização.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole("button", { name: "Grade" });
    const list = canvas.getByRole("button", { name: "Lista" });

    await step("A orientação chega ao markup", async () => {
      await expect(canvas.getByRole("toolbar")).toHaveAttribute("data-orientation", "vertical");
    });

    await step("Empilhado de verdade: o segundo item começa abaixo do primeiro", async () => {
      // `data-orientation` certo com CSS ausente deixaria os dois lado a lado.
      const a = grid.getBoundingClientRect();
      const b = list.getBoundingClientRect();
      await expect(b.top).toBeGreaterThanOrEqual(a.bottom - 1);
    });

    await step("As setas verticais navegam dentro do grupo", async () => {
      // Orientação que não chega ao primitivo deixa ArrowDown sem efeito, com
      // o `data-orientation` certo no markup — foi o defeito daqui.
      grid.focus();
      await userEvent.keyboard("{ArrowDown}");
      await expect(list).toHaveFocus();
      await userEvent.keyboard("{ArrowUp}");
      await expect(grid).toHaveFocus();
    });
  },
};
