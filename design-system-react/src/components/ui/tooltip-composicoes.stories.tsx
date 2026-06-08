import type { Meta, StoryObj } from "@storybook/react";
import { expect, waitFor, screen } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { Button } from "./button";
import { Save, Trash2, Share2, Bold, Italic, Underline } from "lucide-react";

const meta = {
  title: "UI/Tooltip/Composicoes",
  tags: ["overlay"],
  component: Tooltip,
  decorators: [
    (Story) => (
      <TooltipProvider delay={0}>
        <Story />
      </TooltipProvider>
    ),
  ],
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes típicas: IconBarToolbar (barra de ferramentas icon-only), ComAtalhoTeclado (kbd) e SidesPosicionamento (top/bottom/left/right).",
      },
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  minHeight: 200,
  position: "relative",
};

const kbdClass =
  "inline-flex h-4 min-w-4 items-center justify-center rounded-sm bg-background/15 px-1 font-mono text-[10px] font-medium text-background";

export const IconBarToolbar: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Toolbar de ações icon-only — cada Button tem aria-label próprio (mobile sem hover) e Tooltip complementar com a mesma label.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle} className="flex items-center gap-1 rounded-md border border-border p-1 bg-card">
      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="ghost" size="icon" aria-label="Salvar">
              <Save aria-hidden="true" />
            </Button>
          )}
        />
        <TooltipContent>Salvar</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="ghost" size="icon" aria-label="Compartilhar">
              <Share2 aria-hidden="true" />
            </Button>
          )}
        />
        <TooltipContent>Compartilhar</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="ghost" size="icon" aria-label="Excluir">
              <Trash2 aria-hidden="true" />
            </Button>
          )}
        />
        <TooltipContent>Excluir</TooltipContent>
      </Tooltip>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await step("Todos os botões têm aria-label próprio", async () => {
      const buttons = canvasElement.querySelectorAll("button[aria-label]");
      await expect(buttons.length).toBe(3);
      await expect(buttons[0]).toHaveAttribute("aria-label", "Salvar");
      await expect(buttons[1]).toHaveAttribute("aria-label", "Compartilhar");
      await expect(buttons[2]).toHaveAttribute("aria-label", "Excluir");
    });
  },
};

export const ComAtalhoTeclado: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Tooltips com atalho de teclado em <kbd> — formatadores (Negrito Ctrl+B, Itálico Ctrl+I, Sublinhado Ctrl+U).",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle} className="flex items-center gap-1 rounded-md border border-border p-1 bg-card">
      <Tooltip defaultOpen>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="ghost" size="icon" aria-label="Negrito">
              <Bold aria-hidden="true" />
            </Button>
          )}
        />
        <TooltipContent side="bottom">
          <span>Negrito</span>
          <kbd className={kbdClass}>Ctrl</kbd>
          <kbd className={kbdClass}>B</kbd>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="ghost" size="icon" aria-label="Itálico">
              <Italic aria-hidden="true" />
            </Button>
          )}
        />
        <TooltipContent side="bottom">
          <span>Itálico</span>
          <kbd className={kbdClass}>Ctrl</kbd>
          <kbd className={kbdClass}>I</kbd>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="ghost" size="icon" aria-label="Sublinhado">
              <Underline aria-hidden="true" />
            </Button>
          )}
        />
        <TooltipContent side="bottom">
          <span>Sublinhado</span>
          <kbd className={kbdClass}>Ctrl</kbd>
          <kbd className={kbdClass}>U</kbd>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
  play: async ({ step }) => {
    await step("Tooltip aberto contém kbd elements", async () => {
      const tip = await waitForPortal("tooltip", { timeout: 5000 });
      await expect(tip).toBeVisible();
      const kbds = tip.querySelectorAll("kbd");
      await expect(kbds.length).toBeGreaterThanOrEqual(2);
    });
  },
};

export const SidesPosicionamento: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Quatro tooltips abertos lado-a-lado mostrando side=top/right/bottom/left. Auto-flip ocorre por colisão de viewport.",
      },
    },
  },
  render: () => (
    <div className="grid grid-cols-2 gap-12 p-12" style={{ contain: "layout", minHeight: 280, position: "relative" }}>
      <Tooltip defaultOpen>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="outline">
              top
            </Button>
          )}
        />
        <TooltipContent side="top">Top</TooltipContent>
      </Tooltip>

      <Tooltip defaultOpen>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="outline">
              right
            </Button>
          )}
        />
        <TooltipContent side="right">Right</TooltipContent>
      </Tooltip>

      <Tooltip defaultOpen>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="outline">
              bottom
            </Button>
          )}
        />
        <TooltipContent side="bottom">Bottom</TooltipContent>
      </Tooltip>

      <Tooltip defaultOpen>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="outline">
              left
            </Button>
          )}
        />
        <TooltipContent side="left">Left</TooltipContent>
      </Tooltip>
    </div>
  ),
  play: async ({ step }) => {
    await step("Quatro tooltips renderizados no portal", async () => {
      await waitFor(async () => {
        const tips = screen.getAllByRole("tooltip");
        await expect(tips.length).toBe(4);
      }, { timeout: 5000, interval: 100 });
    });
  },
};
