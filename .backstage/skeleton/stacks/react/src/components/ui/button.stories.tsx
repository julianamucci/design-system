import type { Meta, StoryObj } from "@storybook/react";
import { fn, userEvent, within, expect } from "storybook/test";
import { Button } from "./button";
import { ButtonDocs } from "@/components/docs/ButtonDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: {
    docs: { page: withAutoDocsTab(ButtonDocs) },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
      description: "Variante visual do botão",
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon", "icon-sm", "icon-lg"],
      description: "Tamanho do botão",
    },
    disabled: {
      control: "boolean",
      description: "Desabilita interação com o botão",
    },
    asChild: {
      control: "boolean",
      description: "Renderiza o filho passando props (usa Radix Slot)",
    },
  },
  args: {
    variant: "default",
    size: "default",
    disabled: false,
    onClick: fn(),
    children: "Botão",
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");

    await step("Botão está presente e visível", async () => {
      await expect(button).toBeInTheDocument();
      await expect(button).toBeVisible();
    });

    await step("Clique dispara onClick", async () => {
      await userEvent.click(button);
      await expect(args.onClick).toHaveBeenCalledTimes(1);
    });

    await step("Focus via teclado", async () => {
      button.focus();
      await expect(button).toHaveFocus();
    });

    await step("Enter dispara onClick", async () => {
      button.focus();
      await userEvent.keyboard("{Enter}");
      await expect(args.onClick).toHaveBeenCalledTimes(2);
    });

    await step("Space dispara onClick", async () => {
      button.focus();
      await userEvent.keyboard(" ");
      await expect(args.onClick).toHaveBeenCalledTimes(3);
    });
  },
};
