import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, expect, waitFor, screen } from "storybook/test";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { Button } from "./button";
import { Save } from "lucide-react";
import { TooltipDocs } from "@/components/docs/TooltipDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <TooltipProvider delay={0}>
        <Story />
      </TooltipProvider>
    ),
  ],
  parameters: {
    layout: "centered",
    docs: { page: withAutoDocsTab(TooltipDocs) },
  },
  argTypes: {
    side: {
      control: { type: "radio" },
      options: ["top", "bottom", "left", "right"],
      description: "Lado preferido de abertura do Content (auto-flip on collision).",
    },
    align: {
      control: { type: "radio" },
      options: ["start", "center", "end"],
      description: "Alinhamento ao longo do eixo do side.",
    },
    sideOffset: {
      control: { type: "number" },
      description: "Distância em pixels entre trigger e content.",
    },
    defaultOpen: {
      control: "boolean",
      description: "Estado inicial em modo não-controlado.",
    },
  },
  args: {
    side: "top",
    align: "center",
    sideOffset: 4,
    defaultOpen: false,
  },
} satisfies Meta<
  typeof Tooltip & {
    side?: "top" | "bottom" | "left" | "right";
    align?: "start" | "center" | "end";
    sideOffset?: number;
  }
>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => {
    const { side, align, sideOffset, defaultOpen } = args as typeof args & {
      side?: "top" | "bottom" | "left" | "right";
      align?: "start" | "center" | "end";
      sideOffset?: number;
    };
    return (
      <div style={{ contain: "layout", minHeight: 150, position: "relative" }}>
        <Tooltip key={String(defaultOpen)} defaultOpen={defaultOpen}>
          <TooltipTrigger
            render={(props) => (
              <Button {...props} variant="ghost" size="icon" aria-label="Salvar">
                <Save aria-hidden="true" />
              </Button>
            )}
          />
          <TooltipContent side={side} align={align} sideOffset={sideOffset}>
            Salvar (Ctrl+S)
          </TooltipContent>
        </Tooltip>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    await step("1. Botão tem aria-label próprio (não substituído pelo Tooltip)", async () => {
      const trigger = canvasElement.querySelector(
        'button[aria-label="Salvar"]'
      ) as HTMLButtonElement | null;
      await expect(trigger).not.toBeNull();
      trigger?.focus();
    });

    await step("2. Foco no trigger abre o Tooltip (WCAG 1.4.13)", async () => {
      await waitFor(
        async () => {
          const tip = await screen.findByRole("tooltip");
          await expect(tip).toBeVisible();
        },
        { timeout: 2000 }
      );
    });

    await step("3. Escape fecha o Tooltip", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(
        () => {
          const tip = screen.queryByRole("tooltip");
          if (tip) throw new Error("tooltip ainda aberto");
        },
        { timeout: 1500 }
      );
    });
  },
};
