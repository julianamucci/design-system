import type { Meta, StoryObj } from "@storybook/react";
import { Toaster } from "./sonner";
import { toast } from "sonner";
import { Button } from "./button";
import { useEffect } from "react";

const meta = {
  title: "UI/Sonner/Tipos",
  component: Toaster,
  args: {
    richColors: true,
    position: "bottom-right",
    closeButton: true,
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

function AutoToast({ type, message }: { type: string; message: string }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      switch (type) {
        case "default": toast(message); break;
        case "success": toast.success(message); break;
        case "error": toast.error(message); break;
        case "warning": toast.warning(message); break;
        case "info": toast.info(message); break;
        case "loading": toast.loading(message); break;
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [type, message]);
  return null;
}

export const Default: Story = {
  render: (args) => (
    <>
      <Toaster {...args} />
      <AutoToast type="default" message="Notificação padrão" />
      <Button onClick={() => toast("Notificação padrão")}>Mostrar toast</Button>
    </>
  ),
  parameters: {
    docs: {
      description: {
        story: "Toast padrão sem ícone. Use para feedback geral que não se encaixa em sucesso, erro, aviso ou informação.",
      },
    },
  },
};

export const Success: Story = {
  render: (args) => (
    <>
      <Toaster {...args} />
      <AutoToast type="success" message="Item salvo com sucesso" />
      <Button onClick={() => toast.success("Item salvo com sucesso")}>Sucesso</Button>
    </>
  ),
  parameters: {
    docs: {
      description: {
        story: "Toast de sucesso com ícone verde. Use para confirmar que uma ação foi concluída com êxito.",
      },
    },
  },
};

export const Error: Story = {
  render: (args) => (
    <>
      <Toaster {...args} />
      <AutoToast type="error" message="Falha ao salvar alterações" />
      <Button onClick={() => toast.error("Falha ao salvar alterações")}>Erro</Button>
    </>
  ),
  parameters: {
    docs: {
      description: {
        story: "Toast de erro com ícone vermelho. Para erros críticos, combine com duration maior ou closeButton.",
      },
    },
  },
};

export const Warning: Story = {
  render: (args) => (
    <>
      <Toaster {...args} />
      <AutoToast type="warning" message="Conexão instável detectada" />
      <Button onClick={() => toast.warning("Conexão instável detectada")}>Aviso</Button>
    </>
  ),
  parameters: {
    docs: {
      description: {
        story: "Toast de aviso com ícone amarelo. Use para alertar sobre situações que requerem atenção mas não são erros.",
      },
    },
  },
};

export const Info: Story = {
  render: (args) => (
    <>
      <Toaster {...args} />
      <AutoToast type="info" message="Nova versão disponível" />
      <Button onClick={() => toast.info("Nova versão disponível")}>Informação</Button>
    </>
  ),
  parameters: {
    docs: {
      description: {
        story: "Toast informativo com ícone azul. Use para informações contextuais não-críticas.",
      },
    },
  },
};

export const Loading: Story = {
  render: (args) => (
    <>
      <Toaster {...args} />
      <AutoToast type="loading" message="Processando dados..." />
      <Button onClick={() => toast.loading("Processando dados...")}>Carregando</Button>
    </>
  ),
  parameters: {
    docs: {
      description: {
        story: "Toast de carregamento com spinner animado. Para operações assíncronas, prefira toast.promise() que gerencia loading/success/error automaticamente.",
      },
    },
  },
};
