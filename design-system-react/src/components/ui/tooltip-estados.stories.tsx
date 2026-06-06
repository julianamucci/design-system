import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { userEvent, within, expect, waitFor, screen } from "storybook/test";
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
  title: "UI/Tooltip/Estados",
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
          "Estados canônicos do Tooltip: Fechado (sem dialog no DOM), Aberto (defaultOpen), Focado (foco via Tab) e Controlado (open + onOpenChange).",
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

export const Fechado: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Estado padrão — apenas o trigger renderizado; portal vazio (nenhum role=tooltip no DOM).",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
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
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Apenas trigger visível, tooltip ausente", async () => {
      const trigger = canvas.getByRole("button", { name: /Salvar/i });
      await expect(trigger).toBeVisible();
      const tip = screen.queryByRole("tooltip");
      await expect(tip).toBeNull();
    });
  },
};

export const Aberto: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Tooltip aberto via defaultOpen — Content visível com role=tooltip e aria-describedby ligando trigger ao conteúdo.",
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
        <TooltipContent>Salvar (Ctrl+S)</TooltipContent>
      </Tooltip>
    </div>
  ),
  play: async ({ step }) => {
    await step("Tooltip com role=tooltip e aria-describedby", async () => {
      const tip = await waitForPortal("tooltip", { timeout: 5000 });
      await expect(tip).toBeVisible();
      // trigger deve ter aria-describedby
      const trigger = screen.getByRole("button", { name: /Salvar/i });
      await expect(trigger).toHaveAttribute("aria-describedby");
    });
  },
};

export const Focado: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Foco via teclado — WCAG 1.4.13. Trigger.focus() abre o tooltip sem hover. Escape fecha mantendo foco.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="ghost" size="icon" aria-label="Salvar">
              <Save aria-hidden="true" />
            </Button>
          )}
        />
        <TooltipContent>Salvar (Ctrl+S)</TooltipContent>
      </Tooltip>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Trigger recebe foco programaticamente (WCAG 1.4.13)", async () => {
      const trigger = canvas.getByRole("button", { name: /Salvar/i });
      trigger.focus();
      await expect(trigger).toHaveFocus();
    });

    await step("Tab move o foco para o trigger (focus-visible)", async () => {
      const trigger = canvas.getByRole("button", { name: /Salvar/i });
      trigger.blur();
      await userEvent.tab();
      await expect(trigger).toHaveFocus();
    });
  },
};

export const Controlado: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Estado controlado via open + onOpenChange. Botões externos abrem e fecham programaticamente.",
      },
    },
  },
  render: () => {
    const ControlledDemo = () => {
      const [open, setOpen] = useState(false);
      return (
        <div className="flex flex-col gap-3" style={wrapperStyle}>
          <div className="flex gap-2">
            <Button onClick={() => setOpen(true)}>Abrir externamente</Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Fechar externamente
            </Button>
          </div>
          <Tooltip open={open} onOpenChange={setOpen}>
            <TooltipTrigger
              render={(props) => (
                <Button {...props} variant="ghost" size="icon" aria-label="Salvar">
                  <Save aria-hidden="true" />
                </Button>
              )}
            />
            <TooltipContent>Salvar (Ctrl+S)</TooltipContent>
          </Tooltip>
        </div>
      );
    };
    return <ControlledDemo />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Botão externo abre o Tooltip", async () => {
      const openBtn = canvas.getByRole("button", { name: /Abrir externamente/i });
      await userEvent.click(openBtn);
      const tip = await waitForPortal("tooltip", { timeout: 5000 });
      await expect(tip).toBeInTheDocument();
    });

    await step("Botão externo fecha o Tooltip", async () => {
      const closeBtn = canvas.getByRole("button", { name: /Fechar externamente/i });
      await userEvent.click(closeBtn);
      await waitFor(
        () => {
          const tip = screen.queryByRole("tooltip");
          if (tip) throw new Error("ainda aberto");
        },
        { timeout: 3000 }
      );
    });
  },
};
