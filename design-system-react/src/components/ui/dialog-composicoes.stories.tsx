import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { track } from "@/lib/analytics";

const meta = {
  title: "UI/Dialog/Composicoes",
  tags: ["overlay"],
  component: Dialog,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes reais do Dialog em fluxos de produto: confirmar e-mail, edição de perfil e pré-visualização de mídia.",
      },
    },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const trackOpen = (label: string, location: string) =>
  track("dialog_open", { component: "dialog", label, location });

const trackAction = (action_label: string, location: string) =>
  track("dialog_action", { component: "dialog", action_label, location });

export const ConfirmEmail: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Dialog usado para confirmar e-mail antes de prosseguir. Title nomeia a ação, Description orienta o usuário, Footer com Cancelar + Confirmar.",
      },
    },
  },
  render: () => {
    const location = "storybook:composicoes:confirm-email";
    const title = "Confirmar e-mail";
    return (
      <Dialog defaultOpen onOpenChange={(o) => o && trackOpen(title, location)}>
        <DialogTrigger render={<Button variant="outline" />}>
          Confirmar e-mail
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Enviaremos um link de confirmação para{" "}
              <strong>maria@exemplo.com</strong>. Verifique sua caixa de entrada.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button onClick={() => trackAction("Enviar link", location)}>
              Enviar link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal("dialog");
    await expect(dialog).toHaveAccessibleName(/Confirmar e-mail/i);
  },
};

export const ProfileEdit: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Edição de perfil em formulário modal. Submissão dispara `dialog_action` e fecha o Dialog ao concluir.",
      },
    },
  },
  render: () => {
    const location = "storybook:composicoes:profile-edit";
    const title = "Editar perfil";
    return (
      <Dialog defaultOpen onOpenChange={(o) => o && trackOpen(title, location)}>
        <DialogTrigger render={<Button variant="outline" />}>
          Editar perfil
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Atualize suas informações pessoais. As mudanças são salvas ao
              confirmar.
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              trackAction("Salvar alterações", location);
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="profile-name">Nome completo</Label>
              <Input id="profile-name" defaultValue="Maria Silva" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profile-username">Nome de usuário</Label>
              <Input id="profile-username" defaultValue="@mariasilva" />
            </div>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>
                Cancelar
              </DialogClose>
              <Button type="submit">Salvar alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  },
  play: async () => {
    const body = within(document.body);
    const input = await body.findByLabelText(/Nome completo/i);
    await expect(input).toBeVisible();
  },
};

export const MediaPreview: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Pré-visualização de mídia (imagem) em destaque, sem Footer. Fechamento via X, Escape ou clique no overlay.",
      },
    },
  },
  render: () => {
    const location = "storybook:composicoes:media-preview";
    const title = "Pôr-do-sol na praia";
    return (
      <Dialog defaultOpen onOpenChange={(o) => o && trackOpen(title, location)}>
        <DialogTrigger render={<Button variant="outline" />}>
          Ver imagem
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Captura realizada em outubro de 2026, costa norte.
            </DialogDescription>
          </DialogHeader>
          <div
            role="img"
            aria-label="Imagem ilustrativa de pôr-do-sol em gradiente laranja"
            className="aspect-video w-full rounded-md bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600"
          />
        </DialogContent>
      </Dialog>
    );
  },
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal("dialog");
    await expect(dialog).toBeVisible();
  },
};
