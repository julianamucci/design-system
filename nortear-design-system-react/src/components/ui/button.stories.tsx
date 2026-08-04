import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, userEvent, within, expect } from "storybook/test";
import { Button } from "./button";
import { ButtonDocs } from "@/components/docs/ButtonDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs", "form"],
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
      options: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"],
      description: "Tamanho do botão",
    },
    disabled: {
      control: "boolean",
      description: "Desabilita interação com o botão",
    },
    // Estavam em `args` sem argType: ficavam fora da aba API Reference.
    children: {
      control: "text",
      description: "Conteúdo do botão — texto, ícone ou ambos.",
      table: { type: { summary: "ReactNode" } },
    },
    onClick: {
      control: false,
      description: "Callback disparado ao clique. Não dispara quando desabilitado.",
      table: { type: { summary: "(e: MouseEvent) => void" } },
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
  parameters: {
    covers: [
      "functional.item1",
      "functional.item3",
      "functional.item4",
      "accessibility.item1",
      "accessibility.item2",
      "accessibility.item5",
      "visual.item1",
    ],
  },
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
