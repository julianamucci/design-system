import type { Meta, StoryObj } from "@storybook/react";
import { fn, userEvent, within, expect } from "storybook/test";
import { Loader2 } from "lucide-react";
import { Button } from "./button";

const meta = {
  title: "UI/Button/Estados",
  tags: ["form"],
  component: Button,
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Disabled: Story = {
  render: (args) => (
    <Button {...args} disabled>
      Salvar
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story: "Estado desabilitado. Previne cliques e reduz opacidade para 50%.",
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");

    await step("Botão possui atributo disabled", async () => {
      await expect(button).toBeDisabled();
    });

    await step("Clique não dispara onClick quando disabled", async () => {
      await userEvent.click(button, { pointerEventsCheck: 0 });
      await expect(args.onClick).not.toHaveBeenCalled();
    });
  },
};

export const Loading: Story = {
  render: (args) => (
    <Button {...args} disabled aria-busy="true">
      <Loader2 aria-hidden="true" className="animate-spin" />
      Salvando…
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story: "Estado de carregamento. Use disabled + aria-busy e substitua o label por estado progressivo.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");

    await step("Botão tem aria-busy durante loading", async () => {
      await expect(button).toHaveAttribute("aria-busy", "true");
    });

    await step("Botão está desabilitado durante loading", async () => {
      await expect(button).toBeDisabled();
    });
  },
};

export const FocusVisible: Story = {
  render: (args) => <Button {...args}>Foco visível</Button>,
  parameters: {
    docs: {
      description: {
        story: "Estado de foco via teclado. Use Tab para navegar e verificar o ring-[3px] de foco.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");

    await step("Botão recebe foco via teclado", async () => {
      button.focus();
      await expect(button).toHaveFocus();
    });
  },
};

export const Invalid: Story = {
  render: (args) => (
    <Button {...args} variant="outline" aria-invalid="true">
      Formulário inválido
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story: "Estado inválido. Use aria-invalid=\"true\" para sinalizar problemas de validação.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");

    await step("Botão tem aria-invalid=true", async () => {
      await expect(button).toHaveAttribute("aria-invalid", "true");
    });
  },
};
