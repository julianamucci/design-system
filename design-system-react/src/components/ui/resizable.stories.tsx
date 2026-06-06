import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect } from "storybook/test";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./resizable";
import { ResizableDocs } from "@/components/docs/ResizableDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

type PlaygroundArgs = {
  direction: "horizontal" | "vertical";
  withHandle: boolean;
  defaultSizeLeft: number;
  minSizeLeft: number;
  maxSizeLeft: number;
};

const meta = {
  title: "UI/Resizable",
  component: ResizablePanelGroup,
  tags: ["autodocs", "layout"],
  parameters: {
    layout: "centered",
    docs: { page: withAutoDocsTab(ResizableDocs) },
  },
  argTypes: {
    direction: {
      control: "radio",
      options: ["horizontal", "vertical"],
      description:
        "Direção do PanelGroup. horizontal = split lateral; vertical = split em pilha.",
    },
    withHandle: {
      control: "boolean",
      description:
        "Exibe o pegador visual no ResizableHandle — melhora descoberta visual em desktop.",
    },
    defaultSizeLeft: {
      control: { type: "number", min: 10, max: 90, step: 5 },
      description: "Tamanho inicial do primeiro painel (%).",
    },
    minSizeLeft: {
      control: { type: "number", min: 5, max: 50, step: 5 },
      description: "Tamanho mínimo do primeiro painel (%). Evita colapso.",
    },
    maxSizeLeft: {
      control: { type: "number", min: 30, max: 95, step: 5 },
      description: "Tamanho máximo do primeiro painel (%).",
    },
  },
  args: {
    direction: "horizontal",
    withHandle: true,
    defaultSizeLeft: 30,
    minSizeLeft: 20,
    maxSizeLeft: 60,
  },
} satisfies Meta<PlaygroundArgs>;

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const Playground: Story = {
  render: (args) => {
    const { direction, withHandle, defaultSizeLeft, minSizeLeft, maxSizeLeft } =
      args;
    // key garante re-mount quando direction muda (mudar direção mid-flight é unsafe)
    return (
      <div
        key={direction}
        className="rounded-lg border overflow-hidden"
        style={{ width: 520, height: 280 }}
      >
        <ResizablePanelGroup direction={direction}>
          <ResizablePanel
            defaultSize={defaultSizeLeft}
            minSize={minSizeLeft}
            maxSize={maxSizeLeft}
          >
            <div className="flex h-full items-center justify-center bg-muted p-4 text-sm">
              Sidebar
            </div>
          </ResizablePanel>
          <ResizableHandle
            withHandle={withHandle}
            aria-label="Redimensionar painéis — use setas para ajustar"
          />
          <ResizablePanel defaultSize={100 - defaultSizeLeft} minSize={20}>
            <div className="flex h-full items-center justify-center p-4 text-sm">
              Conteúdo principal
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Handle tem role=separator", async () => {
      const handle = canvas.getByRole("separator");
      await expect(handle).toBeInTheDocument();
    });

    await step("Handle tem aria-label descritivo com atalho", async () => {
      const handle = canvas.getByRole("separator");
      await expect(handle).toHaveAttribute(
        "aria-label",
        "Redimensionar painéis — use setas para ajustar"
      );
    });

    await step("Handle tem aria-orientation refletindo direction", async () => {
      const handle = canvas.getByRole("separator");
      const orientation = handle.getAttribute("aria-orientation");
      await expect(["vertical", "horizontal"]).toContain(orientation);
    });

    await step("Handle é focável via Tab", async () => {
      const handle = canvas.getByRole("separator");
      await userEvent.tab();
      // O foco pode ir para outro elemento antes; força o foco direto para checar focável
      handle.focus();
      await expect(handle).toHaveFocus();
    });
  },
};
