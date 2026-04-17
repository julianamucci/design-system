import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect, waitFor } from "storybook/test";
import { Toaster } from "./sonner";
import { toast } from "sonner";
import { Button } from "./button";
import { useEffect } from "react";

const meta = {
  title: "UI/Sonner/Estados",
  component: Toaster,
  args: {
    richColors: true,
    position: "bottom-right",
    closeButton: true,
  },
  decorators: [
    (Story) => (
      <div className="min-h-[400px] flex items-center justify-center">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Expanded: Story = {
  name: "Expandido (múltiplos toasts)",
  render: () => {
    const triggerMultiple = () => {
      toast("Primeira notificação");
      setTimeout(() => toast.success("Segunda notificação"), 200);
      setTimeout(() => toast.info("Terceira notificação"), 400);
    };

    useEffect(() => { const t = setTimeout(triggerMultiple, 300); return () => clearTimeout(t); }, []);

    return (
      <>
        <Toaster expand richColors position="bottom-right" closeButton />
        <Button onClick={triggerMultiple}>Disparar 3 toasts</Button>
      </>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Múltiplos toasts são exibidos simultaneamente", async () => {
      const btn = canvas.getByRole("button", { name: "Disparar 3 toasts" });
      await userEvent.click(btn);
      await waitFor(() => {
        const toasts = document.querySelectorAll('[data-sonner-toast]');
        expect(toasts.length).toBeGreaterThanOrEqual(3);
      }, { timeout: 3000 });
    });
  },
  parameters: {
    docs: {
      description: {
        story: "Com expand={true}, todos os toasts ficam visíveis e expandidos simultaneamente em vez de empilhados.",
      },
    },
  },
};

export const ComCloseButton: Story = {
  name: "Com Botão de Fechar",
  render: () => {
    const trigger = () =>
      toast.error("Erro crítico — leia antes de fechar", {
        duration: Infinity,
      });

    useEffect(() => { const t = setTimeout(trigger, 300); return () => clearTimeout(t); }, []);

    return (
      <>
        <Toaster closeButton richColors position="bottom-right" />
        <Button onClick={trigger}>Toast persistente</Button>
      </>
    );
  },
  play: async ({ canvasElement, step }) => {
    await step("Toast com closeButton exibe botão X", async () => {
      await waitFor(() => {
        const closeBtn = document.querySelector('[data-sonner-toast] [data-close-button]');
        expect(closeBtn).toBeTruthy();
      }, { timeout: 3000 });
    });
  },
  parameters: {
    docs: {
      description: {
        story: "Toast persistente (duration: Infinity) com botão de fechar. Padrão obrigatório para erros críticos que o usuário precisa ler — atende WCAG 2.2.1.",
      },
    },
  },
};

export const Dismiss: Story = {
  name: "Dismiss Programático",
  render: (args) => (
    <>
      <Toaster {...args} />
      <div className="flex gap-3">
        <Button onClick={() => toast("Toast temporário", { id: "demo-dismiss" })}>Criar toast</Button>
        <Button variant="outline" onClick={() => toast.dismiss("demo-dismiss")}>Fechar por ID</Button>
        <Button variant="secondary" onClick={() => toast.dismiss()}>Fechar todos</Button>
      </div>
    </>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("toast.dismiss() fecha todos os toasts", async () => {
      const createBtn = canvas.getByRole("button", { name: "Criar toast" });
      await userEvent.click(createBtn);
      await waitFor(() => {
        const toasts = document.querySelectorAll('[data-sonner-toast]');
        expect(toasts.length).toBeGreaterThanOrEqual(1);
      }, { timeout: 3000 });

      const dismissAllBtn = canvas.getByRole("button", { name: "Fechar todos" });
      await userEvent.click(dismissAllBtn);
    });
  },
  parameters: {
    docs: {
      description: {
        story: "Controle programático de dismiss. toast.dismiss(id) fecha um toast específico; toast.dismiss() sem argumento fecha todos.",
      },
    },
  },
};

export const DuracaoCustom: Story = {
  name: "Duração Customizada",
  render: () => (
    <>
      <Toaster richColors position="bottom-right" closeButton />
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => toast("2 segundos", { duration: 2000 })}>2s</Button>
        <Button variant="outline" onClick={() => toast.warning("8 segundos", { duration: 8000 })}>8s</Button>
        <Button variant="outline" onClick={() => toast.error("Persistente", { duration: Infinity })}>Infinito</Button>
      </div>
    </>
  ),
  parameters: {
    docs: {
      description: {
        story: "Duração customizada por toast. Toasts de erro crítico devem usar duration: Infinity com closeButton para WCAG 2.2.1.",
      },
    },
  },
};
