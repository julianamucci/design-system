import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import { toast } from "sonner";
import { Toaster } from "./sonner";
import { Button } from "./button";

const meta = {
  title: "UI/Sonner/Composicoes",
  tags: ["feedback"],
  component: Toaster,
  parameters: {
    controls: { disable: true },
    // Sonner com richColors — ver PATCHES.md#sonner-rich-colors-contrast.
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

export const WithDescription: Story = {
  render: () => (
    <div style={{ contain: "layout", minHeight: 100, position: "relative" }}>
      <Toaster position="top-right" richColors />
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          toast.success("Preferências atualizadas.", {
            description:
              "Suas configurações foram salvas e entrarão em vigor na próxima sessão.",
          })
        }
      >
        Com descrição
      </Button>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Botão de disparo está presente", async () => {
      const btn = canvas.getByRole("button", { name: "Com descrição" });
      await expect(btn).toBeInTheDocument();
    });
  },
};

export const WithAction: Story = {
  render: () => (
    <div style={{ contain: "layout", minHeight: 100, position: "relative" }}>
      <Toaster position="top-right" richColors />
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          toast("Item excluído.", {
            action: {
              label: "Desfazer",
              onClick: () => {
                // ação de desfazer
              },
            },
          })
        }
      >
        Com ação
      </Button>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Botão de disparo está presente", async () => {
      const btn = canvas.getByRole("button", { name: "Com ação" });
      await expect(btn).toBeInTheDocument();
    });
  },
};

export const WithPromise: Story = {
  render: () => (
    <div style={{ contain: "layout", minHeight: 100, position: "relative" }}>
      <Toaster position="top-right" richColors />
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const promise = new Promise<void>((resolve) =>
            setTimeout(resolve, 2000)
          );
          toast.promise(promise, {
            loading: "Enviando arquivo...",
            success: "Arquivo enviado com sucesso.",
            error: "Erro ao enviar. Tente novamente.",
          });
        }}
      >
        Com promise
      </Button>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Botão de disparo está presente", async () => {
      const btn = canvas.getByRole("button", { name: "Com promise" });
      await expect(btn).toBeInTheDocument();
    });
  },
};

export const Persistent: Story = {
  render: () => (
    <div style={{ contain: "layout", minHeight: 100, position: "relative" }}>
      <Toaster position="top-right" richColors />
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          toast.error("Falha crítica no servidor.", {
            duration: Infinity,
            dismissible: true,
          })
        }
      >
        Persistente
      </Button>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Botão de disparo está presente", async () => {
      const btn = canvas.getByRole("button", { name: "Persistente" });
      await expect(btn).toBeInTheDocument();
    });
  },
};
