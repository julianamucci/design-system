import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect } from "storybook/test";
import { Input } from "./input";
import { InputDocs } from "@/components/docs/InputDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs", "form"],
  parameters: {
    layout: "centered",
    docs: { page: withAutoDocsTab(InputDocs) },
  },
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "tel", "url", "search", "date", "file"],
      description: "Tipo HTML do input. Use sempre o tipo semântico correto.",
    },
    placeholder: {
      control: "text",
      description: "Texto de exemplo do formato esperado.",
    },
    disabled: {
      control: "boolean",
      description: "Desabilita o campo.",
    },
    "aria-invalid": {
      control: "boolean",
      description: "Estado de erro. Aplica borda e ring destrutivos.",
    },
  },
  args: {
    type: "text",
    placeholder: "ex: João da Silva",
    disabled: false,
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="flex flex-col gap-1.5 w-72">
      <label htmlFor="playground-input" className="text-sm font-medium">
        Nome completo
      </label>
      <Input id="playground-input" {...args} />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");

    await step("Input está presente e visível no DOM", async () => {
      await expect(input).toBeInTheDocument();
      await expect(input).toBeVisible();
    });

    await step("Input tem data-slot='input'", async () => {
      await expect(input).toHaveAttribute("data-slot", "input");
    });

    await step("Digitar no campo atualiza o valor", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "Maria Souza");
      await expect(input).toHaveValue("Maria Souza");
    });
  },
};
