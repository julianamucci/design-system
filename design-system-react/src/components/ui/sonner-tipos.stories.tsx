import type { Meta, StoryObj } from "@storybook/react";
import { within, userEvent, expect } from "storybook/test";
import { toast } from "sonner";
import { Toaster } from "./sonner";
import { Button } from "./button";

const meta = {
  title: "UI/Sonner/Tipos",
  component: Toaster,
  parameters: {
    controls: { disable: true },
  },
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ contain: "layout", minHeight: 100, position: "relative" }}>
      <Toaster position="top-right" richColors />
      <Button
        variant="outline"
        size="sm"
        onClick={() => toast("Código copiado.")}
      >
        Disparar default
      </Button>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Botão de disparo está presente", async () => {
      const btn = canvas.getByRole("button", { name: "Disparar default" });
      await expect(btn).toBeInTheDocument();
    });
    await step("Clicar no botão não lança erro", async () => {
      const btn = canvas.getByRole("button", { name: "Disparar default" });
      await userEvent.click(btn);
    });
  },
};

export const Success: Story = {
  render: () => (
    <div style={{ contain: "layout", minHeight: 100, position: "relative" }}>
      <Toaster position="top-right" richColors />
      <Button
        variant="outline"
        size="sm"
        onClick={() => toast.success("Alterações salvas.")}
      >
        Disparar success
      </Button>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Botão de disparo está presente", async () => {
      const btn = canvas.getByRole("button", { name: "Disparar success" });
      await expect(btn).toBeInTheDocument();
    });
    await step("Clicar no botão não lança erro", async () => {
      const btn = canvas.getByRole("button", { name: "Disparar success" });
      await userEvent.click(btn);
    });
  },
};

export const Error: Story = {
  render: () => (
    <div style={{ contain: "layout", minHeight: 100, position: "relative" }}>
      <Toaster position="top-right" richColors />
      <Button
        variant="outline"
        size="sm"
        onClick={() => toast.error("Não foi possível salvar. Tente novamente.")}
      >
        Disparar error
      </Button>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Botão de disparo está presente", async () => {
      const btn = canvas.getByRole("button", { name: "Disparar error" });
      await expect(btn).toBeInTheDocument();
    });
    await step("Clicar no botão não lança erro", async () => {
      const btn = canvas.getByRole("button", { name: "Disparar error" });
      await userEvent.click(btn);
    });
  },
};

export const Warning: Story = {
  render: () => (
    <div style={{ contain: "layout", minHeight: 100, position: "relative" }}>
      <Toaster position="top-right" richColors />
      <Button
        variant="outline"
        size="sm"
        onClick={() => toast.warning("Sua sessão expira em 5 minutos.")}
      >
        Disparar warning
      </Button>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Botão de disparo está presente", async () => {
      const btn = canvas.getByRole("button", { name: "Disparar warning" });
      await expect(btn).toBeInTheDocument();
    });
    await step("Clicar no botão não lança erro", async () => {
      const btn = canvas.getByRole("button", { name: "Disparar warning" });
      await userEvent.click(btn);
    });
  },
};

export const Info: Story = {
  render: () => (
    <div style={{ contain: "layout", minHeight: 100, position: "relative" }}>
      <Toaster position="top-right" richColors />
      <Button
        variant="outline"
        size="sm"
        onClick={() => toast.info("Nova versão disponível.")}
      >
        Disparar info
      </Button>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Botão de disparo está presente", async () => {
      const btn = canvas.getByRole("button", { name: "Disparar info" });
      await expect(btn).toBeInTheDocument();
    });
    await step("Clicar no botão não lança erro", async () => {
      const btn = canvas.getByRole("button", { name: "Disparar info" });
      await userEvent.click(btn);
    });
  },
};

export const Loading: Story = {
  render: () => (
    <div style={{ contain: "layout", minHeight: 100, position: "relative" }}>
      <Toaster position="top-right" richColors />
      <Button
        variant="outline"
        size="sm"
        onClick={() => toast.loading("Enviando arquivo...")}
      >
        Disparar loading
      </Button>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Botão de disparo está presente", async () => {
      const btn = canvas.getByRole("button", { name: "Disparar loading" });
      await expect(btn).toBeInTheDocument();
    });
    await step("Clicar no botão não lança erro", async () => {
      const btn = canvas.getByRole("button", { name: "Disparar loading" });
      await userEvent.click(btn);
    });
  },
};
