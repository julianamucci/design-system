import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { fn, userEvent, within, expect } from "storybook/test";
import { Textarea } from "./textarea";
import { Label } from "./label";
import { TextareaDocs } from "@/components/docs/TextareaDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  tags: ["autodocs", "form"],
  parameters: {
    docs: { page: withAutoDocsTab(TextareaDocs) },
  },
  argTypes: {
    placeholder: {
      control: "text",
      description: "Texto exibido quando o campo está vazio",
    },
    disabled: {
      control: "boolean",
      description: "Desabilita o textarea",
    },
    readOnly: {
      control: "boolean",
      description: "Torna o textarea somente leitura",
    },
    maxLength: {
      control: { type: "number", min: 0, step: 10 },
      description: "Limite de caracteres",
    },
    rows: {
      control: { type: "number", min: 1, max: 20, step: 1 },
      description: "Altura inicial em linhas",
    },
  },
  args: {
    placeholder: "ex: Descreva o produto em até 500 caracteres...",
    disabled: false,
    readOnly: false,
    maxLength: 500,
    onChange: fn(),
    onBlur: fn(),
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

function PlaygroundRender(args: React.ComponentProps<typeof Textarea>) {
  const [value, setValue] = useState("");
  const max = args.maxLength ?? 500;
  return (
    <div className="w-full max-w-md space-y-2">
      <Label htmlFor="playground-textarea">Descrição</Label>
      <Textarea
        id="playground-textarea"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          args.onChange?.(e);
        }}
        onBlur={args.onBlur}
        placeholder={args.placeholder}
        disabled={args.disabled}
        readOnly={args.readOnly}
        maxLength={args.maxLength}
        rows={args.rows}
        className="resize-y min-h-[120px]"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Descreva o produto com clareza.</span>
        <span
          aria-live="polite"
          aria-label={`${value.length} de ${max} caracteres usados`}
        >
          {value.length}/{max}
        </span>
      </div>
    </div>
  );
}

export const Playground: Story = {
  render: (args) => <PlaygroundRender {...args} />,
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText("Descrição") as HTMLTextAreaElement;

    await step("Textarea presente com data-slot=textarea", async () => {
      await expect(textarea).toBeInTheDocument();
      await expect(textarea).toHaveAttribute("data-slot", "textarea");
    });

    await step("Clique no Label foca o Textarea via htmlFor", async () => {
      const label = canvas.getByText("Descrição");
      await userEvent.click(label);
      await expect(textarea).toHaveFocus();
    });

    await step("Digitar texto atualiza o value e dispara onChange", async () => {
      await userEvent.type(textarea, "Camiseta de algodão");
      await expect(args.onChange).toHaveBeenCalled();
      await expect(textarea.value).toBe("Camiseta de algodão");
    });

    await step("Contador reflete o número de caracteres com aria-live", async () => {
      const counter = canvas.getByLabelText(/de 500 caracteres usados/);
      await expect(counter).toHaveAttribute("aria-live", "polite");
      await expect(counter).toHaveTextContent("19/500");
    });

    await step("Blur dispara onBlur", async () => {
      textarea.blur();
      await expect(args.onBlur).toHaveBeenCalled();
    });
  },
};
