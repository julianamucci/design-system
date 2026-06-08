import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./resizable";

const meta = {
  title: "UI/Resizable/Composicoes",
  tags: ["layout"],
  component: ResizablePanelGroup,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes típicas: EditorPreview (editor + preview lado a lado), IDELayout (sidebar + editor + console), TripleSplit (3 painéis lado a lado) e PersistedLayout (autoSaveId persistindo tamanhos no localStorage).",
      },
    },
  },
} satisfies Meta<typeof ResizablePanelGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const boxStyle: React.CSSProperties = {
  width: 600,
  height: 320,
};

const ariaLabel = "Redimensionar painéis — use setas para ajustar";

export const EditorPreview: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Editor de código + preview lado a lado — caso clássico de Resizable em ferramentas dev/design (Storybook, CodeSandbox, Figma Make).",
      },
    },
  },
  render: () => (
    <div className="rounded-lg border overflow-hidden" style={boxStyle}>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          id="editor"
          defaultSize={50}
          minSize={30}
          maxSize={70}
        >
          <div className="flex h-full flex-col p-4 text-xs font-mono">
            <div className="text-muted-foreground mb-2">editor.tsx</div>
            <div>export function App() {`{`}</div>
            <div className="pl-4">return &lt;Hello /&gt;;</div>
            <div>{`}`}</div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle aria-label={ariaLabel} />
        <ResizablePanel id="preview" defaultSize={50} minSize={30}>
          <div className="flex h-full items-center justify-center bg-muted p-4 text-sm">
            Preview
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Composição renderiza com 1 handle horizontal", async () => {
      const handles = canvas.getAllByRole("separator");
      await expect(handles.length).toBe(1);
      await expect(handles[0]).toHaveAttribute("aria-orientation", "vertical");
    });
  },
};

export const IDELayout: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Layout típico de IDE — Sidebar | (Editor / Console). Combina direções horizontais e verticais para reproduzir VS Code, IntelliJ etc.",
      },
    },
  },
  render: () => (
    <div className="rounded-lg border overflow-hidden" style={boxStyle}>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          id="sidebar"
          defaultSize={20}
          minSize={15}
          maxSize={35}
        >
          <div className="flex h-full flex-col bg-muted p-3 text-xs">
            <div className="font-medium mb-2">Explorer</div>
            <div>📁 src</div>
            <div className="pl-3">📄 App.tsx</div>
            <div className="pl-3">📄 main.tsx</div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle aria-label={ariaLabel} />
        <ResizablePanel defaultSize={80} minSize={50}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel id="editor" defaultSize={70} minSize={30}>
              <div className="flex h-full p-3 text-xs font-mono">
                <div className="text-muted-foreground">App.tsx (1:1)</div>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle aria-label={ariaLabel} />
            <ResizablePanel id="console" defaultSize={30} minSize={15}>
              <div className="flex h-full bg-muted/60 p-3 text-xs font-mono">
                <span className="text-muted-foreground">{">"}</span>
                <span className="ml-2">npm run dev</span>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Layout IDE tem 2 handles (1 horizontal split, 1 vertical split)", async () => {
      const handles = canvas.getAllByRole("separator");
      await expect(handles.length).toBe(2);
    });
  },
};

export const TripleSplit: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "3 painéis lado a lado com 2 handles — distribuição inicial 25/50/25. Útil para Email (lista | mensagem | leitura).",
      },
    },
  },
  render: () => (
    <div className="rounded-lg border overflow-hidden" style={boxStyle}>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
          <div className="flex h-full items-center justify-center bg-muted p-3 text-xs">
            Lista
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle aria-label={ariaLabel} />
        <ResizablePanel defaultSize={50} minSize={25}>
          <div className="flex h-full items-center justify-center p-3 text-xs">
            Mensagens
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle aria-label={ariaLabel} />
        <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
          <div className="flex h-full items-center justify-center bg-muted p-3 text-xs">
            Leitura
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Triple split renderiza 2 handles verticais", async () => {
      const handles = canvas.getAllByRole("separator");
      await expect(handles.length).toBe(2);
      handles.forEach(async (h) => {
        await expect(h).toHaveAttribute("aria-orientation", "vertical");
      });
    });
  },
};

export const PersistedLayout: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'autoSaveId="resizable-demo" — react-resizable-panels persiste os tamanhos no localStorage automaticamente; ao recarregar a página, o layout volta como estava.',
      },
    },
  },
  render: () => (
    <div className="rounded-lg border overflow-hidden" style={boxStyle}>
      <ResizablePanelGroup
        direction="horizontal"
        autoSaveId="resizable-storybook-demo"
      >
        <ResizablePanel id="left" defaultSize={30} minSize={20} maxSize={50}>
          <div className="flex h-full items-center justify-center bg-muted p-4 text-sm">
            Sidebar (persiste)
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle aria-label={ariaLabel} />
        <ResizablePanel id="right" defaultSize={70} minSize={50}>
          <div className="flex h-full items-center justify-center p-4 text-sm">
            Conteúdo principal
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Layout persistido renderiza com handle válido", async () => {
      const handle = canvas.getByRole("separator");
      await expect(handle).toHaveAttribute(
        "aria-label",
        "Redimensionar painéis — use setas para ajustar"
      );
    });
  },
};
