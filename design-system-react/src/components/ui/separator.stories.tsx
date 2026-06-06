import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import { Separator } from "./separator";
import { SeparatorDocs } from "@/components/docs/SeparatorDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Separator",
  component: Separator,
  tags: ["autodocs", "layout"],
  parameters: {
    layout: "centered",
    docs: { page: withAutoDocsTab(SeparatorDocs) },
  },
  argTypes: {
    orientation: {
      control: { type: "radio" },
      options: ["horizontal", "vertical"],
      description: "Direção do divisor.",
    },
    decorative: {
      control: { type: "boolean" },
      description:
        "Quando true (padrão), aplica role=\"none\" + aria-hidden. Quando false, anuncia como separator.",
    },
  },
  args: {
    orientation: "horizontal",
    decorative: true,
  },
} as Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => {
    if (args.orientation === "vertical") {
      return (
        <div
          key={args.orientation}
          className="flex items-center h-12 gap-4 text-sm"
        >
          <span>Item 1</span>
          <Separator {...args} />
          <span>Item 2</span>
        </div>
      );
    }
    return (
      <div key={args.orientation} className="w-64 space-y-4 text-sm">
        <div>Item 1</div>
        <Separator {...args} />
        <div>Item 2</div>
      </div>
    );
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    const separator = canvasElement.querySelector(
      "[data-slot='separator']"
    ) as HTMLElement | null;

    await step("Separator está no DOM", async () => {
      await expect(separator).toBeInTheDocument();
    });

    await step("Tem data-orientation correspondente à prop", async () => {
      await expect(separator).toHaveAttribute(
        "data-orientation",
        args.orientation ?? "horizontal"
      );
    });

    await step("Role muda conforme decorative", async () => {
      if (args.decorative === false) {
        await expect(separator).toHaveAttribute("role", "separator");
        await expect(separator).toHaveAttribute(
          "aria-orientation",
          args.orientation ?? "horizontal"
        );
      } else {
        await expect(separator).toHaveAttribute("role", "none");
      }
    });

    await step("Não recebe foco por teclado", async () => {
      await expect(separator).not.toHaveAttribute("tabindex", "0");
      // Tenta focar — separator não deve receber foco
      separator?.focus?.();
      await expect(document.activeElement).not.toBe(separator);
      // Sanity: canvas existe
      await expect(canvas).toBeTruthy();
    });
  },
};
