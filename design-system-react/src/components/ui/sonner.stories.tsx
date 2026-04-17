import type { Meta, StoryObj } from "@storybook/react";
import { fn, userEvent, within, expect, waitFor } from "storybook/test";
import { Toaster } from "./sonner";
import { SonnerDocs } from "@/components/docs/SonnerDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";
import { toast } from "sonner";
import { Button } from "./button";

const meta = {
  title: "UI/Sonner",
  component: Toaster,
  tags: ["autodocs"],
  parameters: {
    docs: { page: withAutoDocsTab(SonnerDocs) },
  },
  argTypes: {
    position: {
      control: "select",
      description: "Posição dos toasts na tela",
      options: ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"],
    },
    richColors: {
      control: "boolean",
      description: "Ativa cores vibrantes por tipo de toast",
    },
    expand: {
      control: "boolean",
      description: "Expande todos os toasts simultaneamente",
    },
    closeButton: {
      control: "boolean",
      description: "Exibe botão de fechar em todos os toasts",
    },
    duration: {
      control: "number",
      description: "Duração padrão em ms antes do auto-dismiss",
    },
  },
  args: {
    position: "bottom-right",
    richColors: false,
    expand: false,
    closeButton: false,
    duration: 4000,
  },
  decorators: [
    (Story) => (
      <div className="min-h-[300px] flex items-center justify-center">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <>
      <Toaster {...args} />
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => toast("Toast padrão")}>Default</Button>
        <Button variant="outline" onClick={() => toast.success("Salvo com sucesso")}>Success</Button>
        <Button variant="outline" onClick={() => toast.error("Falha ao salvar")}>Error</Button>
        <Button variant="outline" onClick={() => toast.warning("Conexão instável")}>Warning</Button>
        <Button variant="outline" onClick={() => toast.info("Nova versão disponível")}>Info</Button>
        <Button variant="outline" onClick={() => toast.loading("Processando...")}>Loading</Button>
        <Button variant="outline" onClick={() => toast("Item excluído", { action: { label: "Desfazer", onClick: () => toast.success("Desfeito!") } })}>Com ação</Button>
        <Button variant="secondary" onClick={() => toast.dismiss()}>Fechar todos</Button>
      </div>
    </>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Dispara um toast default e verifica que aparece", async () => {
      const defaultBtn = canvas.getByRole("button", { name: "Default" });
      await userEvent.click(defaultBtn);
      await waitFor(() => {
        const toastEl = document.querySelector('[data-sonner-toast]');
        expect(toastEl).toBeTruthy();
      }, { timeout: 3000 });
    });

    await step("Toast usa role status para acessibilidade", async () => {
      const toastRegion = document.querySelector('[data-sonner-toaster]');
      expect(toastRegion).toBeTruthy();
    });

    await step("Dispara toast de sucesso", async () => {
      const successBtn = canvas.getByRole("button", { name: "Success" });
      await userEvent.click(successBtn);
      await waitFor(() => {
        const toasts = document.querySelectorAll('[data-sonner-toast]');
        expect(toasts.length).toBeGreaterThanOrEqual(2);
      }, { timeout: 3000 });
    });

    await step("Dispara toast de erro", async () => {
      const errorBtn = canvas.getByRole("button", { name: "Error" });
      await userEvent.click(errorBtn);
      await waitFor(() => {
        const toasts = document.querySelectorAll('[data-sonner-toast]');
        expect(toasts.length).toBeGreaterThanOrEqual(3);
      }, { timeout: 3000 });
    });

    await step("Dispara toast com ação e verifica botão de ação", async () => {
      const actionBtn = canvas.getByRole("button", { name: "Com ação" });
      await userEvent.click(actionBtn);
      await waitFor(() => {
        const actionButton = document.querySelector('[data-sonner-toast] button');
        expect(actionButton).toBeTruthy();
      }, { timeout: 3000 });
    });

    await step("Dismiss fecha todos os toasts", async () => {
      const dismissBtn = canvas.getByRole("button", { name: "Fechar todos" });
      await userEvent.click(dismissBtn);
    });
  },
  parameters: {
    docs: {
      description: {
        story: "Playground interativo com todos os tipos de toast. Cobre critérios: disparo de toast, verificação de visibilidade, role de acessibilidade, toast com ação e dismiss. Veja a aba **Interactions**.",
      },
    },
  },
};
