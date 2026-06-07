import type * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect, waitFor } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";
import { HoverCardDocs } from "@/components/docs/HoverCardDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

type HoverCardPlaygroundArgs = {
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  openDelay?: number;
  closeDelay?: number;
  defaultOpen?: boolean;
};

const HoverCardForArgs = HoverCard as unknown as React.ComponentType<HoverCardPlaygroundArgs>;

const meta = {
  title: "UI/HoverCard",
  component: HoverCardForArgs,
  tags: ["autodocs", "overlay"],
  parameters: {
    layout: "centered",
    docs: { page: withAutoDocsTab(HoverCardDocs) },
  },
  argTypes: {
    side: {
      control: { type: "radio" },
      options: ["top", "bottom", "left", "right"],
      description: "Lado de abertura do Content.",
    },
    align: {
      control: { type: "radio" },
      options: ["start", "center", "end"],
      description: "Alinhamento horizontal do Content.",
    },
    openDelay: {
      control: { type: "number" },
      description: "Delay em ms antes de abrir após hover.",
    },
    closeDelay: {
      control: { type: "number" },
      description: "Delay em ms antes de fechar após cursor sair.",
    },
    defaultOpen: {
      control: "boolean",
      description: "Estado inicial em modo não-controlado.",
    },
  },
  args: {
    side: "bottom",
    align: "center",
    openDelay: 0,
    closeDelay: 0,
    defaultOpen: false,
  },
} satisfies Meta<typeof HoverCardForArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => {
    const { side, align, openDelay, closeDelay, defaultOpen } = args as typeof args & {
      side?: "top" | "bottom" | "left" | "right";
      align?: "start" | "center" | "end";
    };
    return (
      <div style={{ contain: "layout", minHeight: 250, position: "relative" }}>
        <HoverCard openDelay={openDelay} closeDelay={closeDelay} defaultOpen={defaultOpen}>
          <HoverCardTrigger asChild>
            <a
              href="/users/joana"
              className="text-sm font-medium underline underline-offset-4 text-foreground"
            >
              @joana
            </a>
          </HoverCardTrigger>
          <HoverCardContent side={side} align={align}>
            <div className="flex gap-3">
              <div
                aria-hidden="true"
                className="size-10 shrink-0 rounded-full bg-muted flex items-center justify-center text-sm font-medium"
              >
                JS
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Joana Silva</p>
                <p className="text-xs text-muted-foreground">Designer · 142 seguidores</p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step("1. Tab foca o trigger e abre o Content", async () => {
      const trigger = canvas.getByRole("link", { name: /@joana/i });
      trigger.focus();
      await waitFor(
        async () => {
          const dialog = await waitForPortal("dialog");
          await expect(dialog).toBeVisible();
        },
        { timeout: 2000 }
      );
    });

    await step("2. ESC fecha o Content", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(
        () => {
          const dialog = body.queryByRole("dialog");
          if (dialog) throw new Error("dialog ainda aberto");
        },
        { timeout: 1500 }
      );
    });
  },
};
