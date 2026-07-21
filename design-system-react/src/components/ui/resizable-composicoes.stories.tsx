import type { Meta, StoryObj } from "@storybook/react-vite";
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
    <div className="nds-rounded-lg nds-border-default nds-overflow-hidden" style={boxStyle}>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          id="editor"
          defaultSize={50}
          minSize={30}
          maxSize={70}
        >
          <div className="nds-stack nds-p-4 nds-text-caption nds-font-mono" style={{ height: "100%" }}>
            <div className="nds-text-muted-foreground nds-mb-2">editor.tsx</div>
            <div>export function App() {`{`}</div>
            <div className="" style={{ paddingLeft: "1rem" }}>return &lt;Hello /&gt;;</div>
            <div>{`}`}</div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle aria-label={ariaLabel} />
        <ResizablePanel id="preview" defaultSize={50} minSize={30}>
          <div className="nds-cluster nds-bg-muted nds-p-4 nds-text-body" data-justify="center" style={{ height: "100%" }}>
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
    <div className="nds-rounded-lg nds-border-default nds-overflow-hidden" style={boxStyle}>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          id="sidebar"
          defaultSize={20}
          minSize={15}
          maxSize={35}
        >
          <div className="nds-stack nds-bg-muted nds-text-caption" style={{ height: "100%", padding: "0.75rem" }}>
            <div className="nds-font-medium nds-mb-2">Explorer</div>
            <div>📁 src</div>
            <div className="" style={{ paddingLeft: "0.75rem" }}>📄 App.tsx</div>
            <div className="" style={{ paddingLeft: "0.75rem" }}>📄 main.tsx</div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle aria-label={ariaLabel} />
        <ResizablePanel defaultSize={80} minSize={50}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel id="editor" defaultSize={70} minSize={30}>
              <div className="nds-cluster nds-text-caption nds-font-mono" style={{ height: "100%", padding: "0.75rem" }}>
                <div className="nds-text-muted-foreground">App.tsx (1:1)</div>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle aria-label={ariaLabel} />
            <ResizablePanel id="console" defaultSize={30} minSize={15}>
              <div className="nds-cluster bg-muted/60 nds-text-caption nds-font-mono" style={{ height: "100%", padding: "0.75rem" }}>
                <span className="nds-text-muted-foreground">{">"}</span>
                <span className="" style={{ marginLeft: "0.5rem" }}>npm run dev</span>
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
    <div className="nds-rounded-lg nds-border-default nds-overflow-hidden" style={boxStyle}>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
          <div className="nds-cluster nds-bg-muted nds-text-caption" data-align="center" data-justify="center" style={{ height: "100%", padding: "0.75rem" }}>
            Lista
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle aria-label={ariaLabel} />
        <ResizablePanel defaultSize={50} minSize={25}>
          <div className="nds-cluster nds-text-caption" data-align="center" data-justify="center" style={{ height: "100%", padding: "0.75rem" }}>
            Mensagens
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle aria-label={ariaLabel} />
        <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
          <div className="nds-cluster nds-bg-muted nds-text-caption" data-align="center" data-justify="center" style={{ height: "100%", padding: "0.75rem" }}>
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
    <div className="nds-rounded-lg nds-border-default nds-overflow-hidden" style={boxStyle}>
      <ResizablePanelGroup
        direction="horizontal"
        autoSaveId="resizable-storybook-demo"
      >
        <ResizablePanel id="left" defaultSize={30} minSize={20} maxSize={50}>
          <div className="nds-cluster nds-bg-muted nds-p-4 nds-text-body" data-justify="center" style={{ height: "100%" }}>
            Sidebar (persiste)
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle aria-label={ariaLabel} />
        <ResizablePanel id="right" defaultSize={70} minSize={50}>
          <div className="nds-cluster nds-p-4 nds-text-body" data-justify="center" style={{ height: "100%" }}>
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
