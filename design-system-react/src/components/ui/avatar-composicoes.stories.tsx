import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import { User } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";

const IMG_MARIA =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces";
const IMG_SECOND =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=faces";
const IMG_THIRD =
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160&h=160&fit=crop&crop=faces";

const meta = {
  title: "UI/Avatar/Composições",
  component: Avatar,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Composições canônicas do Avatar: com imagem, com iniciais, com ícone, agrupamento e com indicador de status.",
      },
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src={IMG_MARIA} alt="Foto de perfil de Maria Rodrigues" />
      <AvatarFallback delayMs={600}>MR</AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[class*="rounded-full"]');
    await expect(root).toBeInTheDocument();
    // O alt deve ser descritivo quando identifica pessoa
    const imgs = canvas.queryAllByAltText(/Maria Rodrigues/i);
    await expect(imgs.length + (canvas.queryByText("MR") ? 1 : 0)).toBeGreaterThan(0);
  },
};

export const WithInitials: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>JP</AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("JP")).toBeVisible();
  },
};

export const WithIcon: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback aria-label="Usuário genérico">
        <User aria-hidden="true" className="h-5 w-5" />
      </AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const fallback = canvas.getByLabelText(/Usuário genérico/i);
    await expect(fallback).toBeVisible();
    // Ícone Lucide renderizado como SVG
    await expect(fallback.querySelector("svg")).toBeTruthy();
  },
};

export const Group: Story = {
  render: () => (
    <div
      role="group"
      aria-label="Participantes"
      className="flex -space-x-2"
    >
      <Avatar className="ring-2 ring-background">
        <AvatarImage src={IMG_MARIA} alt="" />
        <AvatarFallback aria-hidden="true">MR</AvatarFallback>
      </Avatar>
      <Avatar className="ring-2 ring-background">
        <AvatarImage src={IMG_SECOND} alt="" />
        <AvatarFallback aria-hidden="true">JP</AvatarFallback>
      </Avatar>
      <Avatar className="ring-2 ring-background">
        <AvatarImage src={IMG_THIRD} alt="" />
        <AvatarFallback aria-hidden="true">AS</AvatarFallback>
      </Avatar>
      <Avatar className="ring-2 ring-background">
        <AvatarFallback aria-hidden="true">
          <User aria-hidden="true" className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group", { name: /Participantes/i });
    await expect(group).toHaveClass("-space-x-2");
    const avatars = group.querySelectorAll('[class*="rounded-full"]');
    await expect(avatars.length).toBeGreaterThanOrEqual(4);
  },
};

export const WithStatus: Story = {
  render: () => (
    <div className="relative inline-block">
      <Avatar>
        <AvatarImage src={IMG_MARIA} alt="" />
        <AvatarFallback aria-hidden="true">MR</AvatarFallback>
      </Avatar>
      <span
        aria-label="online"
        className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const status = canvas.getByLabelText(/online/i);
    await expect(status).toBeVisible();
    await expect(status).toHaveClass("bg-primary");
    await expect(status).toHaveClass("ring-background");
  },
};
