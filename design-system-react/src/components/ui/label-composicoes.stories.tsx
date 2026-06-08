import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect } from "storybook/test";
import { Label } from "./label";
import { Input } from "./input";
import { Checkbox } from "./checkbox";

const meta = {
  title: "UI/Label/Composicoes",
  tags: ["form"],
  component: Label,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes do Label com outros elementos de formulário: Input, Checkbox e campo obrigatório.",
      },
    },
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComInput: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-64">
      <Label htmlFor="comp-input">Telefone</Label>
      <Input id="comp-input" type="tel" placeholder="(11) 99999-9999" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Par clássico Label + Input. O htmlFor do Label corresponde ao id do Input. Clicar no Label foca o campo.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText("Telefone");
    const input = canvas.getByRole("textbox");

    await step("Label está associado ao Input via htmlFor", async () => {
      await expect(label).toHaveAttribute("for", "comp-input");
      await expect(input).toHaveAttribute("id", "comp-input");
    });

    await step("Clicar no Label foca o Input", async () => {
      await userEvent.click(label);
      await expect(input).toHaveFocus();
    });
  },
};

export const ComCheckbox: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="comp-checkbox" />
      <Label htmlFor="comp-checkbox">Concordo com os termos de uso</Label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Label associado a um Checkbox via htmlFor. Clicar no texto do Label alterna o estado do Checkbox.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText("Concordo com os termos de uso");
    const checkbox = canvas.getByRole("checkbox");

    await step("Label está associado ao Checkbox via htmlFor", async () => {
      await expect(label).toHaveAttribute("for", "comp-checkbox");
    });

    await step("Clicar no Label alterna o Checkbox", async () => {
      await expect(checkbox).not.toBeChecked();
      await userEvent.click(label);
      await expect(checkbox).toBeChecked();
    });
  },
};

export const CampoObrigatorio: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-64">
      <Label htmlFor="comp-required">
        Email profissional
        <span className="text-destructive" aria-hidden="true">*</span>
      </Label>
      <Input
        id="comp-required"
        type="email"
        aria-required="true"
        placeholder="ex: joao@empresa.com"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Campo obrigatório: asterisco em text-destructive com aria-hidden=\"true\" no Label, aria-required=\"true\" no Input. As duas partes são necessárias: visual e semântica.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    const asterisk = canvasElement.querySelector("[aria-hidden='true']");

    await step("Asterisco tem aria-hidden=true", async () => {
      await expect(asterisk).toHaveAttribute("aria-hidden", "true");
      await expect(asterisk).toHaveTextContent("*");
    });

    await step("Input tem aria-required=true", async () => {
      await expect(input).toHaveAttribute("aria-required", "true");
    });
  },
};
