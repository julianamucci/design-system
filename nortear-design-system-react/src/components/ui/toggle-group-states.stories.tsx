import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect } from "storybook/test";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";
import {
  toggleGroupDesabilitadoSource,
  toggleGroupExclusivoSource,
  toggleGroupItemDesabilitadoSource,
  toggleGroupSource,
  toggleGroupVazioSource,
} from "./toggle-group.source";

const meta = {
  title: "UI/ToggleGroup/States",
  tags: ["form"],
  component: ToggleGroup,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      source: { transform: toggleGroupSource },
      description: {
        component:
          "Estados visuais e interativos do ToggleGroup: default, selected, focus (roving tabindex), disabled (grupo e item individual).",
      },
    },
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ToggleGroup aria-label="Alinhamento do texto">
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
    docs: {
      description: {
        story:
          'Estado padrão — nenhum item selecionado. Todos com aria-pressed="false", fundo transparente.',
      },
      // A AUSÊNCIA de defaultValue é o assunto: o grupo nasce sem seleção.
      source: { transform: toggleGroupVazioSource },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Sem seleção, nenhum item está pressionado", async () => {
      for (const item of canvas.getAllByRole("button")) {
        await expect(item).toHaveAttribute("aria-pressed", "false");
      }
    });

    await step("Mesmo sem seleção, um item entra na ordem de tabulação", async () => {
      // Roving tabindex não depende de haver item ativo: sem isto o grupo
      // inteiro sairia da navegação por Tab.
      const naOrdem = canvas.getAllByRole("button").filter((b) => b.tabIndex === 0);
      await expect(naOrdem).toHaveLength(1);
    });
  },
};

export const Selected: Story = {
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
    covers: ["accessibility.item2"],
    docs: {
      description: {
        story:
          'Estado selecionado — item ativo via defaultValue. aria-pressed="true" e fundo --accent.',
      },
      // O item ativo é o do meio, e não o primeiro que o padrão marcaria.
      source: { transform: toggleGroupExclusivoSource },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const center = canvas.getByRole("button", { name: "Centralizar" });
    const left = canvas.getByRole("button", { name: "Alinhar à esquerda" });

    await step("O item do defaultValue já nasce pressionado", async () => {
      await expect(center).toHaveAttribute("aria-pressed", "true");
      await expect(left).toHaveAttribute("aria-pressed", "false");
    });

    await step("accessibility.item2 — o item ativo tem fundo próprio, não só o atributo", async () => {
      // O contraste de 4.5:1 é medido pelo axe; aqui a garantia é mais rasa e
      // complementar: sem a regra de CSS, ativo e inativo pintariam igual e o
      // estado só existiria para quem lê o DOM.
      await expect(getComputedStyle(center).backgroundColor).not.toBe(
        getComputedStyle(left).backgroundColor,
      );
    });
  },
};

export const FocusVisible: Story = {
  render: () => (
    <ToggleGroup defaultValue="left" aria-label="Alinhamento do texto">
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
    covers: ["accessibility.item3"],
    docs: {
      description: {
        story:
          "Foco via teclado com roving tabindex — apenas 1 item Tab-focusable; setas movem dentro do grupo. Anel de 2px na cor --ring visível.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const items = canvas.getAllByRole("button");

    await step("Roving tabindex — apenas 1 item com tabIndex=0", async () => {
      const focusable = items.filter((el) => el.tabIndex === 0);
      await expect(focusable).toHaveLength(1);
    });

    await step("accessibility.item3 — o anel de foco aparece na navegação por teclado", async () => {
      // `userEvent.tab()` e não `focus()`: `:focus-visible` só casa quando o
      // foco veio do teclado, e um `focus()` programático deixaria a regra
      // fora — o teste passaria verde com o anel invisível na prática.
      items[0].blur();
      await userEvent.tab();
      await expect(items[0]).toHaveFocus();
      const sombra = getComputedStyle(items[0]).boxShadow;
      await expect(sombra).not.toBe("none");
      await expect(sombra.length).toBeGreaterThan(0);
    });

    await step("ArrowRight move o foco dentro do grupo", async () => {
      await userEvent.keyboard("{ArrowRight}");
      await expect(items[1]).toHaveFocus();
    });
  },
};

export const Disabled: Story = {
  render: () => (
    <ToggleGroup disabled defaultValue="center" aria-label="Alinhamento do texto">
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
    docs: {
      description: {
        story:
          'Grupo desabilitado via disabled — todos os items ficam disabled, opacity-50 e pointer-events-none. Clique não altera aria-pressed.',
      },
      // A prop mora no grupo e desce por herança até cada item.
      source: { transform: toggleGroupDesabilitadoSource },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const left = canvas.getByRole("button", { name: "Alinhar à esquerda" });
    const center = canvas.getByRole("button", { name: "Centralizar" });

    await step("Todos os items estão desabilitados", async () => {
      const items = canvas.getAllByRole("button");
      for (const item of items) {
        await expect(item).toBeDisabled();
      }
    });

    await step("Clique no item disabled não altera a seleção", async () => {
      const before = center.getAttribute("aria-pressed");
      await userEvent.click(left, { pointerEventsCheck: 0 });
      await expect(center.getAttribute("aria-pressed")).toBe(before);
    });
  },
};

export const DisabledItem: Story = {
  render: () => (
    <ToggleGroup aria-label="Alinhamento do texto">
      <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
        <AlignLeft aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" disabled aria-label="Centralizar">
        <AlignCenter aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Alinhar à direita">
        <AlignRight aria-hidden="true" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Item individual desabilitado — apenas 'Centralizar' está disabled, enquanto os demais permanecem interativos.",
      },
      // A prop desce para o ITEM: é o oposto de desabilitar o grupo.
      source: { transform: toggleGroupItemDesabilitadoSource },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const left = canvas.getByRole("button", { name: "Alinhar à esquerda" });
    const center = canvas.getByRole("button", { name: "Centralizar" });

    await step("Apenas 'Centralizar' está desabilitado", async () => {
      await expect(center).toBeDisabled();
      await expect(left).not.toBeDisabled();
    });
  },
};
