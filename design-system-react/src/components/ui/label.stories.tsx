import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect } from "storybook/test";
import { Label } from "./label";
import { Input } from "./input";
import { LabelDocs } from "@/components/docs/LabelDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Label",
  component: Label,
  tags: ["autodocs", "form"],
  parameters: {
    layout: "centered",
    docs: { page: withAutoDocsTab(LabelDocs) },
  },
  argTypes: {
    className: {
      control: "text",
      description: "Classes Tailwind adicionais para personalização do rótulo.",
    },
  },
  args: {
    children: "Nome completo",
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="flex flex-col gap-1.5 w-64">
      <Label htmlFor="playground-label" {...args} />
      <Input id="playground-label" placeholder="ex: João da Silva" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText("Nome completo");

    await step("Label está presente e visível no DOM", async () => {
      await expect(label).toBeInTheDocument();
      await expect(label).toBeVisible();
    });

    await step("Label tem atributo data-slot=label", async () => {
      await expect(label).toHaveAttribute("data-slot", "label");
    });

    await step("Label está associado ao campo via htmlFor", async () => {
      await expect(label).toHaveAttribute("for", "playground-label");
    });

    await step("Clicar no Label foca o campo associado", async () => {
      const input = canvas.getByRole("textbox");
      await userEvent.click(label);
      await expect(input).toHaveFocus();
    });
  },
};
