import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { AvatarDocs } from "@/components/docs/AvatarDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const DEMO_IMAGE =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces";

const meta = {
  title: "UI/Avatar",
  component: Avatar,
  tags: ["autodocs", "display"],
  parameters: {
    layout: "centered",
    docs: { page: withAutoDocsTab(AvatarDocs) },
  },
  argTypes: {
    className: {
      control: "text",
      description:
        "Classes Tailwind adicionais. Use `h-6 w-6`, `h-8 w-8` (padrão), `h-10 w-10` ou `h-12 w-12` para ajustar o tamanho.",
    },
  },
  args: {
    className: "",
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Avatar {...args}>
      <AvatarImage src={DEMO_IMAGE} alt="Foto de perfil de Maria Rodrigues" />
      <AvatarFallback delayMs={600}>MR</AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Avatar container está no DOM", async () => {
      const img = await canvas.findByAltText(/Maria Rodrigues/i).catch(() => null);
      const fallback = canvas.queryByText("MR");
      // Um dos dois deve estar visível (imagem carregada ou fallback enquanto carrega)
      await expect(img || fallback).toBeTruthy();
    });

    await step("Container circular renderizado", async () => {
      const root = canvasElement.querySelector('[data-slot="avatar"]');
      await expect(root).toBeInTheDocument();
      await expect(root).toHaveClass("rounded-full");
    });

    await step("Tamanho padrão aplicado via data-size + token --size-default", async () => {
      const root = canvasElement.querySelector('[data-slot="avatar"]');
      await expect(root).toHaveAttribute("data-size", "default");
      // Avatar usa size-(--size-default) — validar via data attribute em vez de classe literal
      await expect(root).toHaveClass("rounded-full");
    });
  },
};
