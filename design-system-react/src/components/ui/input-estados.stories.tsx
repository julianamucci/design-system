import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect } from "storybook/test";
import { Input } from "./input";

const meta = {
  title: "UI/Input/Estados",
  tags: ["form"],
  component: Input,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Estados do Input: padrão, desabilitado, erro (aria-invalid) e com placeholder.",
      },
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-72">
      <label htmlFor="estado-padrao" className="text-sm font-medium">
        Nome completo
      </label>
      <Input id="estado-padrao" type="text" placeholder="ex: João da Silva" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");

    await step("Input padrão está visível e editável", async () => {
      await expect(input).toBeVisible();
      await expect(input).not.toBeDisabled();
      await expect(input).not.toHaveAttribute("aria-invalid", "true");
    });

    await step("Aceita digitação normalmente", async () => {
      await userEvent.type(input, "Maria Souza");
      await expect(input).toHaveValue("Maria Souza");
      await userEvent.clear(input);
    });
  },
};

export const ComPlaceholder: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-72">
      <label htmlFor="estado-placeholder" className="text-sm font-medium">
        Email
      </label>
      <Input
        id="estado-placeholder"
        type="email"
        placeholder="ex: joao@empresa.com"
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");

    await step("Placeholder está configurado", async () => {
      await expect(input).toHaveAttribute("placeholder", "ex: joao@empresa.com");
    });

    await step("Placeholder desaparece ao digitar", async () => {
      await userEvent.type(input, "joao@empresa.com");
      await expect(input).toHaveValue("joao@empresa.com");
      await userEvent.clear(input);
    });
  },
};

export const Desabilitado: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-72">
      <label htmlFor="estado-disabled" className="text-sm font-medium">
        Campo desabilitado
      </label>
      <Input
        id="estado-disabled"
        type="text"
        placeholder="Não disponível"
        disabled
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");

    await step("Input está desabilitado", async () => {
      await expect(input).toBeDisabled();
    });

    await step("Input desabilitado não aceita digitação", async () => {
      await userEvent.type(input, "teste", { pointerEventsCheck: 0 });
      await expect(input).toHaveValue("");
    });
  },
};

export const Erro: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-72">
      <label htmlFor="estado-erro" className="text-sm font-medium">
        Email
      </label>
      <Input
        id="estado-erro"
        type="email"
        placeholder="ex: joao@empresa.com"
        aria-invalid="true"
        aria-describedby="estado-erro-msg"
      />
      <p id="estado-erro-msg" className="text-sm text-destructive">
        Email inválido. Use o formato nome@dominio.com
      </p>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");

    await step("Input tem aria-invalid=true", async () => {
      await expect(input).toHaveAttribute("aria-invalid", "true");
    });

    await step("Mensagem de erro está visível", async () => {
      const errorMsg = canvas.getByText(/Email inválido/);
      await expect(errorMsg).toBeVisible();
    });

    await step("aria-describedby aponta para a mensagem de erro", async () => {
      await expect(input).toHaveAttribute("aria-describedby", "estado-erro-msg");
    });
  },
};
