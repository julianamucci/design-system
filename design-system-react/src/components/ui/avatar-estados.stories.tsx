import type { Meta, StoryObj } from "@storybook/react";
import { within, expect, waitFor } from "storybook/test";
import { User } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";

const IMG_MARIA =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces";

// src garantidamente inválido para forçar o estado failed
const IMG_BROKEN = "https://example.invalid/broken-avatar.jpg";

const meta = {
  title: "UI/Avatar/Estados",
  tags: ["display"],
  component: Avatar,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Configuracoes do Avatar conforme o ciclo de carregamento da imagem: loaded, loading (com delayMs), failed e noImage.",
      },
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src={IMG_MARIA} alt="Foto de perfil de Maria Rodrigues" />
      <AvatarFallback delayMs={600}>MR</AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Radix adiciona o <img> no DOM após onLoad — aguardamos a imagem real
    await waitFor(
      async () => {
        const img = canvas.queryByAltText(/Maria Rodrigues/i);
        await expect(img).toBeTruthy();
      },
      { timeout: 5000 }
    );
  },
};

export const Loading: Story = {
  name: "Loading (delayMs=600)",
  render: () => (
    <Avatar>
      <AvatarImage src={IMG_MARIA} alt="Foto de perfil de Maria Rodrigues" />
      <AvatarFallback delayMs={600}>MR</AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    // Com delayMs=600 o fallback só aparece se o carregamento passar de 600ms.
    // Validamos apenas a presença do container circular — não forçamos estado.
    const root = canvasElement.querySelector('[class*="rounded-full"]');
    await expect(root).toBeInTheDocument();
  },
};

export const Failed: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src={IMG_BROKEN} alt="Foto de perfil de Maria Rodrigues" />
      <AvatarFallback>MR</AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Com src inválido o Radix renderiza o fallback permanentemente
    await waitFor(
      async () => {
        await expect(canvas.getByText("MR")).toBeVisible();
      },
      { timeout: 5000 }
    );
  },
};

export const NoImage: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback role="img" aria-label="Usuário genérico">
        <User aria-hidden="true" className="h-5 w-5" />
      </AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Sem AvatarImage o fallback é exibido imediatamente
    const fallback = canvas.getByLabelText(/Usuário genérico/i);
    await expect(fallback).toBeVisible();
    await expect(fallback.querySelector("svg")).toBeTruthy();
  },
};
