import type { Meta, StoryObj } from "@storybook/react";
import { fn, userEvent, within, expect } from "storybook/test";
import { Checkbox } from "./checkbox";
import { CheckboxDocs } from "@/components/docs/CheckboxDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Checkbox",
  component: Checkbox,
  tags: ["autodocs", "form"],
  parameters: {
    docs: { page: withAutoDocsTab(CheckboxDocs) },
  },
  argTypes: {
    checked: {
      control: "boolean",
      description: "Estado controlado do checkbox",
    },
    defaultChecked: {
      control: "boolean",
      description: "Estado inicial não controlado",
    },
    disabled: {
      control: "boolean",
      description: "Desabilita o checkbox",
    },
    required: {
      control: "boolean",
      description: "Marca o campo como obrigatório",
    },
  },
  args: {
    disabled: false,
    required: false,
    onCheckedChange: fn(),
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox id="playground-checkbox" {...args} />
      <label
        htmlFor="playground-checkbox"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Aceito os termos e condições
      </label>
    </div>
  ),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox");

    await step("Checkbox está presente e visível", async () => {
      await expect(checkbox).toBeInTheDocument();
      await expect(checkbox).toBeVisible();
    });

    await step("Checkbox tem data-slot correto", async () => {
      await expect(checkbox).toHaveAttribute("data-slot", "checkbox");
    });

    await step("Label está associada via htmlFor/id", async () => {
      const label = canvas.getByText("Aceito os termos e condições");
      await expect(label).toBeVisible();
    });

    await step("Clique alterna o estado e dispara onCheckedChange", async () => {
      await userEvent.click(checkbox);
      await expect(args.onCheckedChange).toHaveBeenCalledTimes(1);
    });

    await step("Space alterna o estado com foco no checkbox", async () => {
      checkbox.focus();
      await expect(checkbox).toHaveFocus();
      await userEvent.keyboard(" ");
      await expect(args.onCheckedChange).toHaveBeenCalledTimes(2);
    });
  },
};
