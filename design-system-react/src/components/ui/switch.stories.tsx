import type { Meta, StoryObj } from "@storybook/react";
import { fn, userEvent, within, expect } from "storybook/test";
import { Switch } from "./switch";
import { Label } from "./label";
import { SwitchDocs } from "@/components/docs/SwitchDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Switch",
  component: Switch,
  tags: ["autodocs", "form"],
  parameters: {
    docs: { page: withAutoDocsTab(SwitchDocs) },
  },
  argTypes: {
    checked: {
      control: "boolean",
      description: "Estado controlado do switch",
    },
    defaultChecked: {
      control: "boolean",
      description: "Estado inicial não controlado",
    },
    disabled: {
      control: "boolean",
      description: "Desabilita o switch",
    },
    size: {
      control: "inline-radio",
      options: ["default", "sm"],
      description: "Tamanho do switch",
    },
  },
  args: {
    disabled: false,
    size: "default",
    onCheckedChange: fn(),
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="flex items-center space-x-2">
      <Switch id="playground-switch" {...args} />
      <Label htmlFor="playground-switch">Receber notificações por email</Label>
    </div>
  ),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const switchEl = canvas.getByRole("switch");

    await step("Switch está presente com role=switch", async () => {
      await expect(switchEl).toBeInTheDocument();
      await expect(switchEl).toBeVisible();
      await expect(switchEl).toHaveAttribute("data-slot", "switch");
    });

    await step("Inicia com aria-checked=false", async () => {
      await expect(switchEl).toHaveAttribute("aria-checked", "false");
    });

    await step("Clique alterna o estado e dispara onCheckedChange", async () => {
      await userEvent.click(switchEl);
      await expect(args.onCheckedChange).toHaveBeenCalledTimes(1);
      await expect(switchEl).toHaveAttribute("aria-checked", "true");
    });

    await step("Space com foco alterna o estado", async () => {
      switchEl.focus();
      await expect(switchEl).toHaveFocus();
      await userEvent.keyboard(" ");
      await expect(args.onCheckedChange).toHaveBeenCalledTimes(2);
      await expect(switchEl).toHaveAttribute("aria-checked", "false");
    });

    await step("Clique no Label alterna o estado via htmlFor", async () => {
      const label = canvas.getByText("Receber notificações por email");
      await userEvent.click(label);
      await expect(args.onCheckedChange).toHaveBeenCalledTimes(3);
      await expect(switchEl).toHaveAttribute("aria-checked", "true");
    });
  },
};
