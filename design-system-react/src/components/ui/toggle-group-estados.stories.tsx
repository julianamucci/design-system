import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect } from "storybook/test";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

const meta = {
  title: "UI/ToggleGroup/Estados",
  tags: ["form"],
  component: ToggleGroup,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
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
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Todos os items com aria-pressed=false", async () => {
      const items = canvas.getAllByRole("button");
      for (const item of items) {
        await expect(item).toHaveAttribute("aria-pressed", "false");
      }
    });
  },
};

export const Selected: Story = {
  render: () => (
    <ToggleGroup defaultValue={["center"]} aria-label="Alinhamento do texto">
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
          'Estado selecionado — item ativo via defaultValue. aria-pressed="true" e fundo --muted.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const center = canvas.getByRole("button", { name: "Centralizar" });

    await step("Item 'center' está pressionado", async () => {
      await expect(center).toHaveAttribute("aria-pressed", "true");
    });
  },
};

export const Focus: Story = {
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
          "Foco via teclado com roving tabindex — apenas 1 item Tab-focusable; setas movem dentro do grupo. Anel ring-[3px] ring-ring/50 visível.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const items = canvas.getAllByRole("button");

    await step("Roving tabindex — apenas 1 item com tabIndex=0", async () => {
      const focusable = items.filter((el) => el.tabIndex === 0);
      await expect(focusable.length).toBeLessThanOrEqual(1);
    });

    await step("Primeiro item recebe foco e ArrowRight move", async () => {
      items[0].focus();
      await expect(items[0]).toHaveFocus();
      await userEvent.keyboard("{ArrowRight}");
      await expect(items[1]).toHaveFocus();
    });
  },
};

export const Disabled: Story = {
  render: () => (
    <ToggleGroup disabled defaultValue={["center"]} aria-label="Alinhamento do texto">
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
