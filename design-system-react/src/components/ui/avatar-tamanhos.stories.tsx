import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "storybook/test";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";

const IMG_MARIA =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces";

const meta = {
  title: "UI/Avatar/Tamanhos",
  tags: ["display"],
  component: Avatar,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Tamanhos canônicos do Avatar controlados exclusivamente via `className` — não existe prop `size`.",
      },
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Size6: Story = {
  name: "h-6 w-6 (compacto)",
  render: () => (
    <Avatar className="h-6 w-6">
      <AvatarImage src={IMG_MARIA} alt="Foto de perfil de Maria Rodrigues" />
      <AvatarFallback className="text-[10px]">MR</AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[class*="rounded-full"]');
    await expect(root).toHaveClass("h-6");
    await expect(root).toHaveClass("w-6");
  },
};

export const Size8: Story = {
  name: "h-8 w-8 (médio-compacto)",
  render: () => (
    <Avatar className="h-8 w-8">
      <AvatarImage src={IMG_MARIA} alt="Foto de perfil de Maria Rodrigues" />
      <AvatarFallback className="text-xs">MR</AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[class*="rounded-full"]');
    await expect(root).toHaveClass("h-8");
    await expect(root).toHaveClass("w-8");
  },
};

export const Size10: Story = {
  name: "size-8 (padrão)",
  render: () => (
    <Avatar>
      <AvatarImage src={IMG_MARIA} alt="Foto de perfil de Maria Rodrigues" />
      <AvatarFallback>MR</AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector('[data-slot="avatar"]');
    await step("Tamanho padrão aplicado via --size-default token + data-size", async () => {
      await expect(root).toHaveAttribute("data-size", "default");
      // Avatar usa size-(--size-default) — validar via data attribute
      await expect(root).toHaveClass("rounded-full");
    });
  },
};

export const Size12: Story = {
  name: "h-12 w-12 (grande)",
  render: () => (
    <Avatar className="h-12 w-12">
      <AvatarImage src={IMG_MARIA} alt="Foto de perfil de Maria Rodrigues" />
      <AvatarFallback>MR</AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[class*="rounded-full"]');
    await expect(root).toHaveClass("h-12");
    await expect(root).toHaveClass("w-12");
  },
};
