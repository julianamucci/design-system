import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { waitForPortal } from "@/lib/wait-for-portal";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";

const meta = {
  title: "UI/HoverCard/Variants",
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
            className="nds-text-body nds-font-medium" style={{ textDecoration: "underline", textUnderlineOffset: "4px" }}
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
    await step("Content tem role=dialog", async () => {
      const dialog = await waitForPortal("dialog");
      await expect(dialog).toBeVisible();
    });
  },
};

export const WithShortDelay: Story = {
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
            className="nds-text-body nds-font-medium" style={{ textDecoration: "underline", textUnderlineOffset: "4px" }}
          >
            example.com
          </a>
        </HoverCardTrigger>
        <HoverCardContent>
          <div className="nds-stack" data-spacing="xs">
            <p className="nds-text-body nds-font-medium" style={{ lineHeight: 1 }}>Example Domain</p>
            <p className="nds-text-caption nds-text-muted-foreground">
              openDelay=100ms · closeDelay=50ms
            </p>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  ),
  play: async ({ step }) => {
    await step("Content tem role=dialog", async () => {
      const dialog = await waitForPortal("dialog");
      await expect(dialog).toBeVisible();
    });
  },
};
