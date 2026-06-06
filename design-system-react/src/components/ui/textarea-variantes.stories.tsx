import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { within, expect } from "storybook/test";
import { Textarea } from "./textarea";
import { Label } from "./label";

const meta = {
  title: "UI/Textarea/Variantes",
  tags: ["form"],
  component: Textarea,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Variantes visuais do Textarea: padrão (resize-y), com contador de caracteres e sem redimensionamento (resize-none).",
      },
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      <Label htmlFor="var-default">Biografia</Label>
      <Textarea
        id="var-default"
        placeholder="Conte um pouco sobre você..."
        className="resize-y min-h-[120px]"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Variante padrão com resize-y e min-h-[120px]. Redimensionamento vertical apenas.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText("Biografia");

    await step("Textarea tem classes resize-y e min-h-[120px]", async () => {
      await expect(textarea).toHaveClass("resize-y");
      await expect(textarea).toHaveClass("min-h-[120px]");
    });
  },
};

function WithCounterRender() {
  const [value, setValue] = useState("");
  const max = 500;
  return (
    <div className="w-80 space-y-2">
      <Label htmlFor="var-counter">Descrição</Label>
      <Textarea
        id="var-counter"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="ex: Camiseta de algodão, gola redonda..."
        className="resize-y min-h-[120px]"
        maxLength={max}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Descreva com clareza.</span>
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

export const WithCounter: Story = {
  render: () => <WithCounterRender />,
  parameters: {
    docs: {
      description: {
        story:
          'Com contador de caracteres — combina maxLength + span com aria-live="polite" + aria-label descritivo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText("Descrição") as HTMLTextAreaElement;
    const counter = canvas.getByLabelText(/de 500 caracteres usados/);

    await step("Textarea tem maxLength=500", async () => {
      await expect(textarea).toHaveAttribute("maxLength", "500");
    });

    await step("Contador tem aria-live polite", async () => {
      await expect(counter).toHaveAttribute("aria-live", "polite");
      await expect(counter).toHaveTextContent("0/500");
    });
  },
};

export const NoResize: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      <Label htmlFor="var-noresize">Feedback</Label>
      <Textarea
        id="var-noresize"
        placeholder="O que poderíamos melhorar?"
        className="resize-none min-h-[120px]"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "resize-none — útil em modais ou layouts onde o redimensionamento quebra a UI.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText("Feedback");

    await step("Textarea tem classe resize-none", async () => {
      await expect(textarea).toHaveClass("resize-none");
    });
  },
};
