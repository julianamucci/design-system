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
import { Save } from "lucide-react";

const meta = {
  title: "UI/Tooltip/Variantes",
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
          "Variantes do Tooltip: Default (texto curto), ComAtalho (texto + kbd) e TextoLongo (até max-w-xs).",
      },
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  minHeight: 150,
  position: "relative",
};

const kbdClass =
  "inline-flex h-4 min-w-4 items-center justify-center rounded-sm bg-background/15 px-1 font-mono text-[10px] font-medium text-background";

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Default — texto curto explicativo, fundo foreground, texto background. defaultOpen=true para captura visual.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Tooltip defaultOpen>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="ghost" size="icon" aria-label="Salvar">
              <Save aria-hidden="true" />
            </Button>
          )}
        />
        <TooltipContent>Salvar</TooltipContent>
      </Tooltip>
    </div>
  ),
  play: async ({ step }) => {
    await step("Tooltip tem role=tooltip", async () => {
      const tip = await waitForPortal("tooltip", { timeout: 5000 });
      await expect(tip).toBeVisible();
      await expect(tip.textContent).toMatch(/Salvar/i);
    });
  },
};

export const ComAtalho: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Tooltip com atalho de teclado em <kbd> — útil para botões icon-only com hotkeys (ex.: Salvar Ctrl+S).",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Tooltip defaultOpen>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="ghost" size="icon" aria-label="Salvar">
              <Save aria-hidden="true" />
            </Button>
          )}
        />
        <TooltipContent>
          <span>Salvar</span>
          <kbd className={kbdClass}>Ctrl</kbd>
          <kbd className={kbdClass}>S</kbd>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
  play: async ({ step }) => {
    await step("Tooltip contém kbd elements", async () => {
      const tip = await waitForPortal("tooltip", { timeout: 5000 });
      await expect(tip).toBeVisible();
      const kbds = tip.querySelectorAll("kbd");
      await expect(kbds.length).toBeGreaterThanOrEqual(2);
    });
  },
};

export const TextoLongo: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Texto longo — ocupa até max-w-xs com quebra natural. Use só se realmente couber em uma linha — não substitui Popover.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Tooltip defaultOpen>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="outline">
              Compartilhar
            </Button>
          )}
        />
        <TooltipContent side="bottom">
          Cria um link público com permissão de leitura — qualquer pessoa com o link pode visualizar o conteúdo.
        </TooltipContent>
      </Tooltip>
    </div>
  ),
  play: async ({ step }) => {
    await step("Tooltip aberto com texto longo", async () => {
      const tip = await waitForPortal("tooltip", { timeout: 5000 });
      await expect(tip).toBeVisible();
      await expect(tip.textContent).toMatch(/link público/i);
    });
  },
};
