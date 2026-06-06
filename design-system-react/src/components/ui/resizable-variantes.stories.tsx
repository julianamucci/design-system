import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./resizable";

const meta = {
  title: "UI/Resizable/Variantes",
  tags: ["layout"],
  component: ResizablePanelGroup,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Variantes de layout do Resizable: Horizontal (split lateral), Vertical (split empilhado) e Nested (PanelGroup dentro de Panel, combinando direções).",
      },
    },
  },
} satisfies Meta<typeof ResizablePanelGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const boxStyle: React.CSSProperties = {
  width: 520,
  height: 280,
};

const ariaLabel = "Redimensionar painéis — use setas para ajustar";

export const Horizontal: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'direction="horizontal" — split lateral com handle vertical. Padrão para sidebar + conteúdo.',
      },
    },
  },
  render: () => (
    <div className="rounded-lg border overflow-hidden" style={boxStyle}>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
          <div className="flex h-full items-center justify-center bg-muted p-4 text-sm">
            Sidebar
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle aria-label={ariaLabel} />
        <ResizablePanel defaultSize={70} minSize={50} maxSize={80}>
          <div className="flex h-full items-center justify-center p-4 text-sm">
            Conteúdo principal
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Handle tem aria-orientation=vertical", async () => {
      const handle = canvas.getByRole("separator");
      await expect(handle).toHaveAttribute("aria-orientation", "vertical");
    });
  },
};

export const Vertical: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'direction="vertical" — split em pilha com handle horizontal. Útil para Topo + Rodapé ou Editor + Console.',
      },
    },
  },
  render: () => (
    <div className="rounded-lg border overflow-hidden" style={boxStyle}>
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={50} minSize={20} maxSize={80}>
          <div className="flex h-full items-center justify-center p-4 text-sm">
            Topo
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle aria-label={ariaLabel} />
        <ResizablePanel defaultSize={50} minSize={20} maxSize={80}>
          <div className="flex h-full items-center justify-center bg-muted p-4 text-sm">
            Rodapé
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Handle tem aria-orientation=horizontal", async () => {
      const handle = canvas.getByRole("separator");
      await expect(handle).toHaveAttribute("aria-orientation", "horizontal");
    });
  },
};

export const Nested: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "PanelGroup aninhado dentro de outro Panel — combina direções para layouts complexos tipo IDE (Sidebar | Editor / Console).",
      },
    },
  },
  render: () => (
    <div className="rounded-lg border overflow-hidden" style={boxStyle}>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
          <div className="flex h-full items-center justify-center bg-muted p-4 text-sm">
            Sidebar
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle aria-label={ariaLabel} />
        <ResizablePanel defaultSize={75} minSize={50}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={70} minSize={30}>
              <div className="flex h-full items-center justify-center p-4 text-sm">
                Editor
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle aria-label={ariaLabel} />
            <ResizablePanel defaultSize={30} minSize={15}>
              <div className="flex h-full items-center justify-center bg-muted/60 p-4 text-sm">
                Console
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Existem 2 handles aninhados", async () => {
      const handles = canvas.getAllByRole("separator");
      await expect(handles.length).toBe(2);
    });
    await step("Há um handle horizontal e um vertical", async () => {
      const handles = canvas.getAllByRole("separator");
      const orientations = handles.map((h) => h.getAttribute("aria-orientation"));
      await expect(orientations).toContain("vertical");
      await expect(orientations).toContain("horizontal");
    });
  },
};
