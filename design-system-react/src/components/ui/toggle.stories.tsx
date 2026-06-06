import type { Meta, StoryObj } from "@storybook/react";
import { fn, userEvent, within, expect } from "storybook/test";
import { Bold } from "lucide-react";
import { Toggle } from "./toggle";
import { ToggleDocs } from "@/components/docs/ToggleDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Toggle",
  component: Toggle,
  tags: ["autodocs", "form"],
  parameters: {
    docs: { page: withAutoDocsTab(ToggleDocs) },
  },
  argTypes: {
    pressed: {
      control: "boolean",
      description: "Estado controlado (pressed/unpressed)",
    },
    defaultPressed: {
      control: "boolean",
      description: "Estado inicial não controlado",
    },
    disabled: {
      control: "boolean",
      description: "Desabilita o Toggle",
    },
    variant: {
      control: "inline-radio",
      options: ["default", "outline"],
      description: "Estilo visual",
    },
    size: {
      control: "inline-radio",
      options: ["sm", "default", "lg"],
      description: "Tamanho via tokens --height-*",
    },
  },
  args: {
    disabled: false,
    variant: "default",
    size: "default",
    onPressedChange: fn(),
    "aria-label": "Negrito",
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Toggle {...args}>
      <Bold aria-hidden="true" />
    </Toggle>
  ),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: "Negrito" });

    await step("Toggle está presente com data-slot=toggle", async () => {
      await expect(toggle).toBeInTheDocument();
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveAttribute("data-slot", "toggle");
    });

    await step("Inicia com aria-pressed=false", async () => {
      await expect(toggle).toHaveAttribute("aria-pressed", "false");
    });

    await step("Clique alterna o estado e dispara onPressedChange", async () => {
      await userEvent.click(toggle);
      await expect(args.onPressedChange).toHaveBeenCalledTimes(1);
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
    });

    await step("Space com foco alterna o estado", async () => {
      toggle.focus();
      await expect(toggle).toHaveFocus();
      await userEvent.keyboard(" ");
      await expect(args.onPressedChange).toHaveBeenCalledTimes(2);
      await expect(toggle).toHaveAttribute("aria-pressed", "false");
    });

    await step("Enter com foco alterna o estado (idêntico a Space)", async () => {
      toggle.focus();
      await userEvent.keyboard("{Enter}");
      await expect(args.onPressedChange).toHaveBeenCalledTimes(3);
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
    });
  },
};
