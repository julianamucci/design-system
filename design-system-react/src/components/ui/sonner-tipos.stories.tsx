import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import { toast } from "sonner";
import { Toaster } from "./sonner";
import { Button } from "./button";

const meta = {
  title: "UI/Sonner/Tipos",
  tags: ["feedback"],
  component: Toaster,
  parameters: {
    controls: { disable: true },
    // Sonner com richColors aplica paletas semi-transparentes (success/error/warning/info)
    // herdadas da própria lib `sonner`. Não controlamos os valores RGBA — auditoria de
    // contraste é feita manualmente em foundations/colors.
    // aria-prohibited-attr: o toast renderizado pela lib usa <div data-title aria-label="...">
    // que axe reporta como prohibited; o Toaster (lib externa) gera essa estrutura.
    // Ver PATCHES.md#sonner-rich-colors-contrast.
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: false },
          { id: 'aria-prohibited-attr', enabled: false },
        ],
      },
    },
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
  },
};
