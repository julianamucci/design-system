import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./resizable";

const meta = {
  title: "UI/Resizable/Estados",
  tags: ["layout"],
  component: ResizablePanelGroup,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Estados canônicos do ResizableHandle: Idle (estado padrão), Focus (handle focado via teclado com ring), WithoutHandle (sem pegador visual) e Disabled (handle não-arrastável).",
      },
    },
  },
} satisfies Meta<typeof ResizablePanelGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const boxStyle: React.CSSProperties = {
  width: 520,
  height: 240,
};

const ariaLabel = "Redimensionar painéis — use setas para ajustar";

export const Idle: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Estado padrão — handle visível com cor border, sem foco nem interação.",
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
        <ResizablePanel defaultSize={70} minSize={50}>
          <div className="flex h-full items-center justify-center p-4 text-sm">
            Conteúdo
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Handle existe e está visível com role=separator", async () => {
      const handle = canvas.getByRole("separator");
      await expect(handle).toBeVisible();
    });
  },
};

export const Focus: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Handle focado via teclado — ring visível (focus-visible:ring-1 ring-ring); setas ajustam tamanho.",
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
        <ResizablePanel defaultSize={70} minSize={50}>
          <div className="flex h-full items-center justify-center p-4 text-sm">
            Conteúdo
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Handle recebe foco programático", async () => {
      const handle = canvas.getByRole("separator");
      handle.focus();
      await expect(handle).toHaveFocus();
    });
  },
};

export const WithoutHandle: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "withHandle={false} (padrão) — sem pegador visual; área de arrasto continua focável e funcional, mas descoberta visual fica reduzida. Use em layouts compactos.",
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
        <ResizableHandle aria-label={ariaLabel} />
        <ResizablePanel defaultSize={70} minSize={50}>
          <div className="flex h-full items-center justify-center p-4 text-sm">
            Conteúdo
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Handle existe sem o pegador visual interno", async () => {
      const handle = canvas.getByRole("separator");
      await expect(handle).toBeInTheDocument();
      // Sem withHandle, o div interno do pegador não é renderizado
      await expect(handle.querySelector("div")).toBeNull();
    });
  },
};

export const Disabled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "disabled — handle não-arrastável; data-disabled aplicado, sem cursor de resize. Use quando o layout está temporariamente bloqueado (ex.: durante operação).",
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
        <ResizableHandle disabled withHandle aria-label={ariaLabel} />
        <ResizablePanel defaultSize={70} minSize={50}>
          <div className="flex h-full items-center justify-center p-4 text-sm">
            Conteúdo
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Handle existe com role=separator no estado desabilitado", async () => {
      const handle = canvas.getByRole("separator");
      await expect(handle).toBeInTheDocument();
    });
  },
};
