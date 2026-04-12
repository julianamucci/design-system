import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";

const meta = {
  title: "UI/Button/Variantes",
  component: Button,
  argTypes: {
    onClick: { action: "clicked" },
  },
  args: {
    children: "Botão",
    size: "default",
    disabled: false,
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Variante Default: A principal ação em uma visão ou formulário.
 * 
 * @summary Ação primária de alta prioridade.
 */
export const Default: Story = {
  args: { variant: "default" },
  parameters: {
    docs: {
      description: {
        story: "A variante padrão para ações primárias que devem chamar a atenção do usuário.",
      },
    },
  },
};

/**
 * Variante Secondary: Ações de apoio que não devem competir com a primária.
 * 
 * @summary Ação de suporte de média prioridade.
 */
export const Secondary: Story = {
  args: { variant: "secondary" },
  parameters: {
    docs: {
      description: {
        story: "Alternativa de menor hierarquia visual. Usar para ações de suporte à ação primária.",
      },
    },
  },
};

/**
 * Variante Outline: Ações secundárias com borda definida para visibilidade clara sem preenchimento.
 * 
 * @summary Ação secundária outline.
 */
export const Outline: Story = {
  args: { variant: "outline" },
  parameters: {
    docs: {
      description: {
        story: "Ideal para ações secundárias ou botões que não devem competir visualmente com a ação primária.",
      },
    },
  },
};

/**
 * Variante Ghost: Ação sutil sem bordas ou fundo, visível apenas no hover.
 * 
 * @summary Ação de baixa prioridade/sutil.
 */
export const Ghost: Story = {
  args: { variant: "ghost" },
  parameters: {
    docs: {
      description: {
        story: "Ações sutis, comumente usadas em toolbars ou botões de fechar/cancelar.",
      },
    },
  },
};

/**
 * Variante Link: Para ações que se comportam e parecem links dentro de textos.
 * 
 * @summary Ação de estilo link.
 */
export const Link: Story = {
  args: { variant: "link" },
  parameters: {
    docs: {
      description: {
        story: "Para ações que parecem links. Use quando o botão está embutido em texto corrido ou em listas de ações inline.",
      },
    },
  },
};

/**
 * Variante Destructive: Para ações irreversíveis ou de perigo.
 * 
 * @summary Ação de aviso/destrutiva.
 */
export const Destructive: Story = {
  args: { variant: "destructive" },
  parameters: {
    docs: {
      description: {
        story: "Para ações irreversíveis. Deve sempre ser precedida de um AlertDialog de confirmação — nunca dispare a ação diretamente no onClick.",
      },
    },
  },
};
