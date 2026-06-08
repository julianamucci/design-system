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
import { useTranslation } from "@/lib/i18n";
import { track } from "@/lib/analytics";
import dialogTranslations from "@shared/content/dialog/translations.json";

const meta = {
  title: "UI/Dialog/Variantes",
  tags: ["overlay"],
  component: Dialog,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes estruturais do Dialog: Default, WithForm, WithScrollContent, NoFooter, WithDestructiveAction e CustomCloseInFooter. Não há prop `variant` — a forma é dada pela composição interna.",
      },
    },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const trackOpen = (label: string) =>
  track("dialog_open", {
    component: "dialog",
    label,
    location: "storybook:variantes",
  });

const trackAction = (action_label: string) =>
  track("dialog_action", {
    component: "dialog",
    action_label,
    location: "storybook:variantes",
  });

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Title + Description + Footer com ação primária. Composição padrão para formulários e edições.",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(dialogTranslations);
    const title = t("demonstration.labels.title");
    return (
      <Dialog defaultOpen onOpenChange={(o) => o && trackOpen(title)}>
        <DialogTrigger render={<Button variant="outline" />}>
          {t("demonstration.labels.triggerLabel")}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {t("demonstration.labels.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {t("demonstration.labels.cancel")}
            </DialogClose>
            <Button onClick={() => trackAction(t("demonstration.labels.action"))}>
              {t("demonstration.labels.action")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
  play: async () => {
    const body = within(document.body);
    await expect(await waitForPortal("dialog")).toBeInTheDocument();
  },
};

export const WithForm: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Body com formulário inline (inputs e selects). Submissão dispara a ação primária do Footer.",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(dialogTranslations);
    const title = t("demonstration.labels.title");
    return (
      <Dialog defaultOpen onOpenChange={(o) => o && trackOpen(title)}>
        <DialogTrigger render={<Button variant="outline" />}>
          {t("demonstration.labels.triggerLabel")}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {t("demonstration.labels.description")}
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              trackAction(t("demonstration.labels.action"));
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="dialog-name">Nome</Label>
              <Input id="dialog-name" defaultValue="Maria Silva" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dialog-email">E-mail</Label>
              <Input id="dialog-email" type="email" defaultValue="maria@exemplo.com" />
            </div>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>
                {t("demonstration.labels.cancel")}
              </DialogClose>
              <Button type="submit">{t("demonstration.labels.action")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  },
  play: async () => {
    const body = within(document.body);
    await expect(await body.findByLabelText(/nome/i)).toBeInTheDocument();
    await expect(await body.findByLabelText(/e-mail/i)).toBeInTheDocument();
  },
};

export const WithScrollContent: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Conteúdo longo com scroll interno. Header e Footer fixos; o body recebe `max-h-[60vh] overflow-y-auto`.",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(dialogTranslations);
    const title = "Termos de uso";
    return (
      <Dialog defaultOpen onOpenChange={(o) => o && trackOpen(title)}>
        <DialogTrigger render={<Button variant="outline" />}>
          Ver termos
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Leia atentamente as condições antes de aceitar.
            </DialogDescription>
          </DialogHeader>
          <div tabIndex={0} role="region" aria-label="Conteúdo rolável" className="max-h-[40vh] overflow-y-auto pr-2 text-sm text-muted-foreground space-y-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <p key={i}>
                Cláusula {i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing
                elit. Sed do eiusmod tempor incididunt ut labore et dolore magna
                aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
                laboris nisi ut aliquip ex ea commodo consequat.
              </p>
            ))}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {t("demonstration.labels.cancel")}
            </DialogClose>
            <Button onClick={() => trackAction("Aceitar")}>Aceitar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
  play: async () => {
    const body = within(document.body);
    await expect(await body.findByText(/termos de uso/i)).toBeInTheDocument();
  },
};

export const NoFooter: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Apenas Title + Description, sem Footer. Para uso informativo ou pré-visualização passiva — fechamento via X, Escape ou clique no overlay.",
      },
    },
  },
  render: () => {
    const title = "Sobre este recurso";
    return (
      <Dialog defaultOpen onOpenChange={(o) => o && trackOpen(title)}>
        <DialogTrigger render={<Button variant="outline" />}>
          Saiba mais
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Este recurso permite visualizar detalhes do item selecionado sem sair
              da tela atual. Você pode fechar a qualquer momento.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  },
  play: async () => {
    const body = within(document.body);
    await expect(await body.findByText(/sobre este recurso/i)).toBeInTheDocument();
  },
};

export const WithDestructiveAction: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Footer com ação primária `destructive`. Use só quando a destrutividade é secundária ao fluxo (ex: remover item de lista). Para confirmação destrutiva canônica, use AlertDialog.",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(dialogTranslations);
    const title = "Remover item da lista";
    return (
      <Dialog defaultOpen onOpenChange={(o) => o && trackOpen(title)}>
        <DialogTrigger render={<Button variant="outline" />}>
          Remover
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              O item será removido desta lista. Você pode adicioná-lo novamente
              depois.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {t("demonstration.labels.cancel")}
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => trackAction("Remover item")}
            >
              Remover item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
  play: async () => {
    const body = within(document.body);
    const action = await waitForPortal("button", { name: /^Remover item$/i });
    await expect(action).toHaveClass("bg-destructive");
  },
};

export const CustomCloseInFooter: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`showCloseButton={false}` no Content e `showCloseButton` no Footer — botão de fechar fica abaixo das ações.",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(dialogTranslations);
    const title = t("demonstration.labels.title");
    return (
      <Dialog defaultOpen onOpenChange={(o) => o && trackOpen(title)}>
        <DialogTrigger render={<Button variant="outline" />}>
          {t("demonstration.labels.triggerLabel")}
        </DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {t("demonstration.labels.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <Button onClick={() => trackAction(t("demonstration.labels.action"))}>
              {t("demonstration.labels.action")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
  play: async () => {
    const body = within(document.body);
    await expect(await waitForPortal("dialog")).toBeInTheDocument();
  },
};
