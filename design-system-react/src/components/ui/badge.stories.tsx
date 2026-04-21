import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import { Badge } from "./badge";
import { BadgeDocs } from "@/components/docs/BadgeDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  parameters: {
    docs: { page: withAutoDocsTab(BadgeDocs) },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline"],
      description: "Variante visual do Badge",
    },
    children: {
      control: "text",
      description: "Conteúdo do Badge — texto curto ou número",
    },
  },
  args: {
    variant: "default",
    children: "Novo",
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => <Badge {...args} />,
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step("Badge é renderizado com o texto correto", async () => {
      const badge = canvas.getByText(String(args.children));
      await expect(badge).toBeVisible();
    });

    await step("Variante default aplica bg-primary", async () => {
      const badge = canvas.getByText(String(args.children));
      await expect(badge).toHaveClass("bg-primary");
    });

    await step("Badge usa classes base de inline-flex", async () => {
      const badge = canvas.getByText(String(args.children));
      await expect(badge).toHaveClass("inline-flex");
      await expect(badge).toHaveClass("items-center");
    });

    await step("Badge tem tipografia compacta", async () => {
      const badge = canvas.getByText(String(args.children));
      await expect(badge).toHaveClass("text-xs");
      await expect(badge).toHaveClass("font-semibold");
    });
  },
};
