import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within, expect, waitFor } from "storybook/test";
import { waitForPortal } from "@/lib/wait-for-portal";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";
import { Button } from "./button";

const meta = {
  title: "UI/HoverCard/Estados",
  tags: ["overlay"],
  component: HoverCard,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Estados canônicos do HoverCard: Fechado (apenas trigger), Aberto (defaultOpen) e Controlado (open + onOpenChange).",
      },
    },
  },
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  minHeight: 250,
  position: "relative",
};

export const Fechado: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Estado padrão — apenas o trigger renderizado; portal vazio (nenhum role=dialog no DOM).",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <HoverCard>
        <HoverCardTrigger asChild>
          <a
            href="/users/joana"
            className="nds-text-body nds-font-medium nds-text-foreground" style={{ textDecoration: "underline", textUnderlineOffset: "4px" }}
          >
            @joana
          </a>
        </HoverCardTrigger>
        <HoverCardContent>
          <p className="nds-text-body">Conteúdo oculto</p>
        </HoverCardContent>
      </HoverCard>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Apenas trigger visível, dialog ausente", async () => {
      const trigger = canvas.getByRole("link", { name: /@joana/i });
      await expect(trigger).toBeVisible();
      const dialog = body.queryByRole("dialog");
      await expect(dialog).toBeNull();
    });
  },
};

export const Aberto: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "HoverCard aberto via defaultOpen — Content visível com role=dialog e aria-modal=false.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <HoverCard defaultOpen openDelay={0} closeDelay={0}>
        <HoverCardTrigger asChild>
          <a
            href="/users/joana"
            className="nds-text-body nds-font-medium nds-text-foreground" style={{ textDecoration: "underline", textUnderlineOffset: "4px" }}
          >
            @joana
          </a>
        </HoverCardTrigger>
        <HoverCardContent>
          <div className="nds-cluster" data-spacing="sm">
            <div
              aria-hidden="true"
              className="nds-cluster nds-size-10 nds-shrink-0 nds-rounded-full nds-bg-muted nds-text-body nds-font-medium" data-align="center" data-justify="center"
            >
              JS
            </div>
            <div className="nds-stack" data-spacing="xs">
              <p className="nds-text-body nds-font-medium" style={{ lineHeight: 1 }}>Joana Silva</p>
              <p className="nds-text-caption nds-text-muted-foreground">Designer · 142 seguidores</p>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  ),
  play: async ({ step }) => {
    await step("Content aberto com role=dialog", async () => {
      const dialog = await waitForPortal("dialog");
      await expect(dialog).toBeVisible();
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
        <div className="nds-stack" data-spacing="sm" style={wrapperStyle}>
          <div className="nds-cluster" data-spacing="sm">
            <Button onClick={() => setOpen(true)}>Abrir externamente</Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Fechar externamente
            </Button>
          </div>
          <HoverCard open={open} onOpenChange={setOpen} openDelay={0} closeDelay={0}>
            <HoverCardTrigger asChild>
              <a
                href="/users/joana"
                className="nds-text-body nds-font-medium nds-text-foreground" style={{ textDecoration: "underline", textUnderlineOffset: "4px" }}
              >
                @joana
              </a>
            </HoverCardTrigger>
            <HoverCardContent>
              <div className="nds-stack" data-spacing="xs">
                <p className="nds-text-body nds-font-medium" style={{ lineHeight: 1 }}>Joana Silva</p>
                <p className="nds-text-caption nds-text-muted-foreground">Designer · 142 seguidores</p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      );
    };
    return <ControlledDemo />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Botão externo abre o HoverCard", async () => {
      const openBtn = canvas.getByRole("button", { name: /Abrir externamente/i });
      await userEvent.click(openBtn);
      const dialog = await waitForPortal("dialog");
      await expect(dialog).toBeVisible();
    });

    await step("Botão externo fecha o HoverCard", async () => {
      const closeBtn = canvas.getByRole("button", { name: /Fechar externamente/i });
      await userEvent.click(closeBtn);
      await waitFor(
        () => {
          const dialog = body.queryByRole("dialog");
          if (dialog) throw new Error("ainda aberto");
        },
        { timeout: 1500 }
      );
    });
  },
};
