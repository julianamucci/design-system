import type { Meta, StoryObj } from "@storybook/react";
import { Mail, ArrowRight } from "lucide-react";
import { Button } from "./button";

const meta = {
  title: "UI/Button/Composições",
  component: Button,
  argTypes: {
    onClick: { action: "clicked" },
  },
  args: {
    variant: "default",
    size: "default",
    disabled: false,
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithIconLeading: Story = {
  name: "Ícone à esquerda",
  render: (args) => (
    <Button {...args}>
      <Mail className="h-4 w-4" />
      Enviar email
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story: "Ícone posicionado antes do label. O gap entre ícone e texto é gerenciado automaticamente pela classe `gap-2` do componente.",
      },
    },
  },
};

export const WithIconTrailing: Story = {
  name: "Ícone à direita",
  render: (args) => (
    <Button {...args} variant="outline">
      Próximo
      <ArrowRight className="h-4 w-4" />
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story: "Ícone posicionado após o label. Use para botões de navegação que indicam continuidade ou próximo passo.",
      },
    },
  },
};

export const AsChild: Story = {
  name: "Como link (asChild)",
  render: (args) => (
    <Button {...args} asChild variant="outline">
      <a href="#">Link estilizado como botão</a>
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story: "Substitui o `<button>` pelo filho via Radix Slot. Use para renderizar o botão como `<a>` ou `Link` do router sem perder estilo e comportamento.",
      },
    },
  },
};
