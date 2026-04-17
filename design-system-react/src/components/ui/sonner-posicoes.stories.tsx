import type { Meta, StoryObj } from "@storybook/react";
import { Toaster } from "./sonner";
import { toast } from "sonner";
import { Button } from "./button";
import { useEffect } from "react";

const meta = {
  title: "UI/Sonner/Posições",
  component: Toaster,
  args: {
    richColors: false,
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

function AutoToast({ message }: { message: string }) {
  useEffect(() => {
    const timer = setTimeout(() => toast(message), 300);
    return () => clearTimeout(timer);
  }, [message]);
  return null;
}

export const TopRight: Story = {
  args: { position: "top-right" },
  render: (args) => (
    <>
      <Toaster {...args} />
      <AutoToast message="Posição: top-right (padrão)" />
      <Button onClick={() => toast("Posição: top-right")}>Top Right</Button>
    </>
  ),
  parameters: {
    docs: {
      description: {
        story: "Posição padrão, recomendada para a maioria das aplicações desktop.",
      },
    },
  },
};

export const TopCenter: Story = {
  args: { position: "top-center" },
  render: (args) => (
    <>
      <Toaster {...args} />
      <AutoToast message="Posição: top-center" />
      <Button onClick={() => toast("Posição: top-center")}>Top Center</Button>
    </>
  ),
  parameters: {
    docs: {
      description: {
        story: "Centralizado no topo. Ideal para aplicações com foco central ou quando não há sidebar.",
      },
    },
  },
};

export const TopLeft: Story = {
  args: { position: "top-left" },
  render: (args) => (
    <>
      <Toaster {...args} />
      <AutoToast message="Posição: top-left" />
      <Button onClick={() => toast("Posição: top-left")}>Top Left</Button>
    </>
  ),
  parameters: {
    docs: {
      description: {
        story: "Alinhado ao topo esquerdo. Use em layouts RTL ou quando a sidebar está à direita.",
      },
    },
  },
};

export const BottomRight: Story = {
  args: { position: "bottom-right" },
  render: (args) => (
    <>
      <Toaster {...args} />
      <AutoToast message="Posição: bottom-right" />
      <Button onClick={() => toast("Posição: bottom-right")}>Bottom Right</Button>
    </>
  ),
  parameters: {
    docs: {
      description: {
        story: "Inferior direito. Bom para formulários e ações concentradas na parte inferior.",
      },
    },
  },
};

export const BottomCenter: Story = {
  args: { position: "bottom-center" },
  render: (args) => (
    <>
      <Toaster {...args} />
      <AutoToast message="Posição: bottom-center" />
      <Button onClick={() => toast("Posição: bottom-center")}>Bottom Center</Button>
    </>
  ),
  parameters: {
    docs: {
      description: {
        story: "Centralizado na parte inferior. Recomendado para apps mobile-first, similar ao padrão Android Snackbar.",
      },
    },
  },
};

export const BottomLeft: Story = {
  args: { position: "bottom-left" },
  render: (args) => (
    <>
      <Toaster {...args} />
      <AutoToast message="Posição: bottom-left" />
      <Button onClick={() => toast("Posição: bottom-left")}>Bottom Left</Button>
    </>
  ),
  parameters: {
    docs: {
      description: {
        story: "Inferior esquerdo. Use em layouts com sidebar à direita.",
      },
    },
  },
};
