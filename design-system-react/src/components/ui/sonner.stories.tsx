import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import { toast } from "sonner";
import { Toaster } from "./sonner";
import { Button } from "./button";
import { SonnerDocs } from "@/components/docs/SonnerDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Sonner",
  component: Toaster,
  tags: ["autodocs", "feedback"],
  parameters: {
    docs: { page: withAutoDocsTab(SonnerDocs) },
    // Sonner com richColors usa paletas da lib externa que podem não atingir 4.5:1.
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

export const Playground: Story = {
  render: () => (
    <div style={{ contain: "layout", minHeight: 120, position: "relative" }}>
      <Toaster position="top-right" richColors />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast("Código copiado.")}
        >
          Default
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.success("Alterações salvas.")}
        >
          Success
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.error("Não foi possível salvar. Tente novamente.")}
        >
          Error
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.warning("Sua sessão expira em 5 minutos.")}
        >
          Warning
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.info("Nova versão disponível.")}
        >
          Info
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.loading("Enviando arquivo...")}
        >
          Loading
        </Button>
      </div>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Botão Default está presente no DOM", async () => {
      const btn = canvas.getByRole("button", { name: "Default" });
      await expect(btn).toBeInTheDocument();
      await expect(btn).not.toBeDisabled();
    });

    await step("Botão Success está presente e habilitado", async () => {
      const btn = canvas.getByRole("button", { name: "Success" });
      await expect(btn).toBeInTheDocument();
      await expect(btn).not.toBeDisabled();
    });

    await step("Botão Error está presente e habilitado", async () => {
      const btn = canvas.getByRole("button", { name: "Error" });
      await expect(btn).toBeInTheDocument();
      await expect(btn).not.toBeDisabled();
    });
  },
};
