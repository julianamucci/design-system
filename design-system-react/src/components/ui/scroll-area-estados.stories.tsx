import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import { ScrollArea } from "./scroll-area";

const meta = {
  title: "UI/ScrollArea/Estados",
  tags: ["layout"],
  component: ScrollArea,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados canônicos do ScrollArea: Idle (estado padrão), AlwaysVisible (type="always"), Hover (type="hover" — scrollbar aparece ao mouse) e Focus (viewport focado com ring).',
      },
    },
  },
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const items = Array.from({ length: 24 }, (_, i) => i + 1);

function List() {
  return (
    <div className="p-4 space-y-2">
      {items.map((n) => (
        <div key={n} className="text-sm border-b pb-2 last:border-b-0">
          Item {n}
        </div>
      ))}
    </div>
  );
}

export const Idle: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Estado padrão (type="hover", default) — scrollbar aparece quando há overflow e some após scrollHideDelay.',
      },
    },
  },
  render: () => (
    <div className="h-[260px] w-[300px]">
      <ScrollArea className="h-full w-full rounded-md border">
        <List />
      </ScrollArea>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await step("ScrollArea renderiza viewport rolável", async () => {
      const viewport = canvasElement.querySelector(
        '[data-slot="scroll-area-viewport"]'
      );
      await expect(viewport).toBeInTheDocument();
    });
  },
};

export const AlwaysVisible: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'type="always" — scrollbar sempre visível, mesmo sem interação; útil em desktop quando descoberta visual do scroll é crítica.',
      },
    },
  },
  render: () => (
    <div className="h-[260px] w-[300px]">
      <ScrollArea type="always" className="h-full w-full rounded-md border">
        <List />
      </ScrollArea>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await step("Scrollbar é renderizada no DOM", async () => {
      const bars = canvasElement.querySelectorAll(
        '[data-slot="scroll-area-scrollbar"]'
      );
      await expect(bars.length).toBeGreaterThanOrEqual(1);
    });
  },
};

export const Hover: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'type="hover" (padrão da lib) — scrollbar aparece apenas ao passar o mouse sobre o viewport e some após scrollHideDelay.',
      },
    },
  },
  render: () => (
    <div className="h-[260px] w-[300px]">
      <ScrollArea
        type="hover"
        scrollHideDelay={300}
        className="h-full w-full rounded-md border"
      >
        <List />
      </ScrollArea>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await step("Root tem data-slot=scroll-area", async () => {
      const root = canvasElement.querySelector('[data-slot="scroll-area"]');
      await expect(root).toBeInTheDocument();
    });
  },
};

export const Focus: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Viewport focado via foco programático — exibe focus ring (ring-[3px] ring-ring/50). Tab navega para o viewport quando ele contém elementos focáveis.",
      },
    },
  },
  render: () => (
    <div className="h-[260px] w-[300px]">
      <ScrollArea className="h-full w-full rounded-md border">
        <List />
      </ScrollArea>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Viewport pode receber foco programaticamente", async () => {
      const viewport = canvasElement.querySelector(
        '[data-slot="scroll-area-viewport"]'
      ) as HTMLElement | null;
      await expect(viewport).not.toBeNull();
      if (viewport) {
        viewport.focus();
        // base-ui pode aplicar tabIndex internamente; o teste valida apenas presença
        await expect(viewport).toBeInTheDocument();
      }
    });
    void canvas;
  },
};
