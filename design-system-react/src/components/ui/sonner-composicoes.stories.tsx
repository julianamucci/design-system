import type { Meta, StoryObj } from "@storybook/react";
import { Toaster } from "./sonner";
import { toast } from "sonner";
import { Button } from "./button";
import { useEffect } from "react";

const meta = {
  title: "UI/Sonner/Composições",
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

export const ComAcao: Story = {
  name: "Com Ação",
  render: (args) => {
    const trigger = () =>
      toast("Item excluído", {
        action: {
          label: "Desfazer",
          onClick: () => toast.success("Ação desfeita!"),
        },
      });

    useEffect(() => { const t = setTimeout(trigger, 300); return () => clearTimeout(t); }, []);

    return (
      <>
        <Toaster {...args} />
        <Button onClick={trigger}>Excluir item</Button>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Toast com botão de ação inline. O padrão mais comum é \"Desfazer\" para ações destrutivas reversíveis.",
      },
    },
  },
};

export const ComDescricao: Story = {
  name: "Com Descrição",
  render: (args) => {
    const trigger = () =>
      toast("Relatório gerado", {
        description: "O arquivo estará disponível para download em instantes.",
      });

    useEffect(() => { const t = setTimeout(trigger, 300); return () => clearTimeout(t); }, []);

    return (
      <>
        <Toaster {...args} />
        <Button onClick={trigger}>Gerar relatório</Button>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Toast com texto de descrição abaixo do título. Use para fornecer detalhes adicionais sem poluir o título.",
      },
    },
  },
};

export const Promise: Story = {
  name: "Promise (async)",
  render: (args) => {
    const trigger = () =>
      toast.promise(
        new Promise((resolve) => setTimeout(resolve, 2500)),
        {
          loading: "Salvando dados...",
          success: "Dados salvos com sucesso!",
          error: "Erro ao salvar dados",
        },
      );

    return (
      <>
        <Toaster {...args} />
        <Button onClick={trigger}>Salvar dados</Button>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "toast.promise() gerencia automaticamente os estados loading → success/error. Ideal para operações assíncronas — evita race conditions com gerenciamento manual.",
      },
    },
  },
};

export const RichColors: Story = {
  name: "Rich Colors",
  render: () => {
    const triggerAll = () => {
      toast.success("Sucesso com rich colors");
      toast.error("Erro com rich colors");
      toast.warning("Aviso com rich colors");
      toast.info("Info com rich colors");
    };

    useEffect(() => { const t = setTimeout(triggerAll, 300); return () => clearTimeout(t); }, []);

    return (
      <>
        <Toaster richColors position="bottom-right" closeButton />
        <Button onClick={triggerAll}>Todos os tipos</Button>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Com richColors ativado, cada tipo de toast exibe cores vibrantes e distintas. Útil quando a diferenciação visual entre tipos é importante.",
      },
    },
  },
};

export const ComAcaoEDescricao: Story = {
  name: "Ação + Descrição",
  render: (args) => {
    const trigger = () =>
      toast.error("Falha ao enviar e-mail", {
        description: "Verifique o endereço e tente novamente.",
        action: {
          label: "Tentar novamente",
          onClick: () => toast.loading("Reenviando..."),
        },
      });

    useEffect(() => { const t = setTimeout(trigger, 300); return () => clearTimeout(t); }, []);

    return (
      <>
        <Toaster {...args} />
        <Button onClick={trigger}>Enviar e-mail</Button>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Combinação de descrição e ação em um toast de erro. Padrão recomendado para erros recuperáveis — descreve o problema e oferece retry.",
      },
    },
  },
};
