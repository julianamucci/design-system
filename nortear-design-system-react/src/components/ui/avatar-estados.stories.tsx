import { figmaDesign } from "@shared/figma/design-links";
import type { Meta, StoryObj } from "@storybook/react-vite";
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
    design: figmaDesign("avatar"),
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Configuracoes do Avatar conforme o ciclo de carregamento da imagem: loaded, loading (com atraso), failed e noImage.",
      },
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  parameters: { covers: ["functional.item1", "visual.item1"] },
  render: () => (
    <Avatar>
      <AvatarImage src={IMG_MARIA} alt="Foto de perfil de Maria Rodrigues" />
      <AvatarFallback aria-hidden="true">MR</AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    // functional.item1 — carregada a imagem, ela é o que fica; o fallback sai.
    await waitFor(
      async () => {
        const img = canvasElement.querySelector<HTMLImageElement>(
          '[data-slot="avatar-image"]',
        );
        await expect(img).not.toBeNull();
        await expect(img!.alt).toBe("Foto de perfil de Maria Rodrigues");
      },
      { timeout: 5000 },
    );
    // Quem está pintado no centro é a imagem: uma stack remove o fallback do
    // DOM, outra só o esconde, e a promessa das duas é a mesma — depois do load
    // é a foto que aparece.
    const root = canvasElement.querySelector('[data-slot="avatar"]')!;
    await waitFor(async () => {
      const r = root.getBoundingClientRect();
      const alvo = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      await expect(alvo && alvo.closest('[data-slot="avatar-image"]')).not.toBeNull();
    }, { timeout: 5000 });
  },
};

export const Loading: Story = {
  name: "Loading (atraso de 600ms)",
  parameters: { covers: ["functional.item4"] },
  render: () => (
    <Avatar>
      <AvatarImage src={IMG_BROKEN} alt="Foto de perfil de Maria Rodrigues" />
      <AvatarFallback delayMs={600}>MR</AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // functional.item4 — o atraso segura as iniciais e depois as entrega. A
    // janela ANTES do prazo não é asserida de propósito: ela é transitória e o
    // replay do painel roda no mesmo DOM, já com o prazo vencido.
    await waitFor(
      async () => {
        await expect(canvas.getByText("MR")).toBeVisible();
      },
      { timeout: 3000 },
    );
  },
};

export const Failed: Story = {
  parameters: { covers: ["functional.item2"] },
  render: () => (
    <Avatar>
      <AvatarImage src={IMG_BROKEN} alt="Foto de perfil de Maria Rodrigues" />
      <AvatarFallback>MR</AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // functional.item2 — com src inválido o fallback fica, e a imagem não entra.
    await waitFor(
      async () => {
        await expect(canvas.getByText("MR")).toBeVisible();
      },
      { timeout: 5000 },
    );
    // A imagem não pode estar por cima: uma stack tira o <img> do DOM no erro,
    // outra o mantém escondido. O que vale nas duas é quem está pintado no
    // centro do avatar — e é isso que o leitor vê.
    const root = canvasElement.querySelector('[data-slot="avatar"]')!;
    const r = root.getBoundingClientRect();
    const alvo = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    await expect(alvo && alvo.closest('[data-slot="avatar-image"]')).toBeNull();
  },
};

export const NoImage: Story = {
  parameters: { covers: ["functional.item3"] },
  render: () => (
    <Avatar>
      <AvatarFallback role="img" aria-label="Usuário genérico">
        <User
          aria-hidden="true"
          style={{ height: "1.25rem", width: "1.25rem" }}
        />
      </AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // functional.item3 — sem imagem o fallback é imediato, sem espera nenhuma.
    const fallback = canvas.getByRole("img", { name: /Usuário genérico/i });
    await expect(fallback).toBeVisible();
    await expect(fallback.querySelector("svg")).not.toBeNull();
    await expect(canvasElement.querySelector("img")).toBeNull();
  },
};
