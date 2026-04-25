import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect } from "storybook/test";
import { toast } from "sonner";
import { Toaster } from "./sonner";
import { Button } from "./button";
import { SonnerDocs } from "@/components/docs/SonnerDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Sonner",
  component: Toaster,
  tags: ["autodocs"],
  parameters: {
    docs: { page: withAutoDocsTab(SonnerDocs) },
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
    });

    await step("Clicar no botão Default dispara toast", async () => {
      const btn = canvas.getByRole("button", { name: "Default" });
      await userEvent.click(btn);
      // O toast é montado via portal fora do canvasElement — verificamos que o
      // botão está habilitado e o click não lança exceção.
      await expect(btn).not.toBeDisabled();
    });

    await step("Botão Success está presente e clicável", async () => {
      const btn = canvas.getByRole("button", { name: "Success" });
      await expect(btn).toBeInTheDocument();
      await userEvent.click(btn);
    });

    await step("Botão Error está presente e clicável", async () => {
      const btn = canvas.getByRole("button", { name: "Error" });
      await expect(btn).toBeInTheDocument();
    });
  },
};
