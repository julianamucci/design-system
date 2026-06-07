import type { Meta, StoryObj } from "@storybook/react";
import { within, expect, waitFor } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";

const meta = {
  title: "UI/HoverCard/Variantes",
  tags: ["overlay"],
  component: HoverCard,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Variantes do HoverCard: Default (delays padrão lib) e ComDelayCurto (openDelay=100, closeDelay=50) para previews ricos.",
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

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Default — openDelay 700ms (lib), closeDelay 300ms; w-64, p-2.5, shadow-md. defaultOpen=true para captura visual.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <HoverCard defaultOpen openDelay={0} closeDelay={0}>
        <HoverCardTrigger asChild>
          <a
            href="/users/joana"
            className="text-sm font-medium underline underline-offset-4 text-foreground"
          >
            @joana
          </a>
        </HoverCardTrigger>
        <HoverCardContent>
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
  ),
  play: async ({ step }) => {
    const body = within(document.body);
    await step("Content tem role=dialog", async () => {
      const dialog = await waitForPortal("dialog");
      await expect(dialog).toBeVisible();
    });
  },
};

export const ComDelayCurto: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Delay curto — openDelay=100ms, closeDelay=50ms. Recomendado para previews ricos onde a velocidade de feedback é importante.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <HoverCard defaultOpen openDelay={0} closeDelay={0}>
        <HoverCardTrigger asChild>
          <a
            href="https://example.com"
            className="text-sm font-medium underline underline-offset-4 text-foreground"
          >
            example.com
          </a>
        </HoverCardTrigger>
        <HoverCardContent>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">Example Domain</p>
            <p className="text-xs text-muted-foreground">
              openDelay=100ms · closeDelay=50ms
            </p>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  ),
  play: async ({ step }) => {
    const body = within(document.body);
    await step("Content tem role=dialog", async () => {
      const dialog = await waitForPortal("dialog");
      await expect(dialog).toBeVisible();
    });
  },
};
