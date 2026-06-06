import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import { Input } from "./input";

const meta = {
  title: "UI/Input/Tipos",
  tags: ["form"],
  component: Input,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "O Input não tem variantes via prop. A aparência muda conforme o `type` HTML — text, email, password, number e file são os mais comuns.",
      },
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-72">
      <label htmlFor="tipo-text" className="text-sm font-medium">
        Nome completo
      </label>
      <Input id="tipo-text" type="text" placeholder="ex: João da Silva" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Input type text está presente", async () => {
      const input = canvas.getByRole("textbox");
      await expect(input).toHaveAttribute("type", "text");
    });
  },
};

export const Email: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-72">
      <label htmlFor="tipo-email" className="text-sm font-medium">
        Email
      </label>
      <Input id="tipo-email" type="email" placeholder="ex: joao@empresa.com" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Input type email está presente", async () => {
      const input = canvas.getByRole("textbox");
      await expect(input).toHaveAttribute("type", "email");
    });
  },
};

export const Password: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-72">
      <label htmlFor="tipo-password" className="text-sm font-medium">
        Senha
      </label>
      <Input id="tipo-password" type="password" placeholder="Mínimo 8 caracteres" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Input type password está presente", async () => {
      const input = canvas.getByLabelText("Senha");
      await expect(input).toHaveAttribute("type", "password");
    });
  },
};

export const Number: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-72">
      <label htmlFor="tipo-number" className="text-sm font-medium">
        Quantidade
      </label>
      <Input id="tipo-number" type="number" placeholder="0" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Input type number está presente", async () => {
      const input = canvas.getByRole("spinbutton");
      await expect(input).toHaveAttribute("type", "number");
    });
  },
};

export const File: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-72">
      <label htmlFor="tipo-file" className="text-sm font-medium">
        Arquivo
      </label>
      <Input id="tipo-file" type="file" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Input type file está presente", async () => {
      const input = canvas.getByLabelText("Arquivo");
      await expect(input).toHaveAttribute("type", "file");
    });
  },
};
