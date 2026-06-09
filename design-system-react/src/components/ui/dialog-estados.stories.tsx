import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { userEvent, within, expect, waitFor } from "storybook/test";
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
import { useTranslation } from "@/lib/i18n";
import { track } from "@/lib/analytics";
import dialogTranslations from "@shared/content/dialog/translations.json";

const meta = {
  title: "UI/Dialog/Estados",
  tags: ["overlay"],
  component: Dialog,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Configuracoes canônicas do Dialog: Closed (estado inicial), Open (defaultOpen), WithCloseButtonHidden (sem X no canto) e Controlled (controle externo via open + onOpenChange).",
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
    location: "storybook:estados",
  });

export const Closed: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Estado inicial — apenas o trigger visível. O Content não está renderizado no DOM (Portal vazio).",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(dialogTranslations);
    const title = t("demonstration.labels.title");
    return (
      <Dialog onOpenChange={(o) => o && trackOpen(title)}>
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
            <Button>{t("demonstration.labels.action")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getAllByRole("button")[0];
    await expect(trigger).toBeVisible();
    const dialog = body.queryByRole("dialog");
    if (dialog) {
      await expect(dialog).toHaveAttribute("data-state", "closed");
    }
  },
};

export const Open: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Diálogo aberto via `defaultOpen`. Overlay com blur, focus trap ativo, scroll-lock no body.",
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
            <Button>{t("demonstration.labels.action")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleName();
  },
};

export const WithCloseButtonHidden: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`showCloseButton={false}` no Content. Sem X no canto — fechamento apenas por Escape, clique no overlay ou ação do Footer.",
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
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {t("demonstration.labels.cancel")}
            </DialogClose>
            <Button>{t("demonstration.labels.action")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal("dialog");
    await expect(dialog).toBeVisible();
    // Não há botão Close (X) com sr-only "Close"
    const closeBtn = body.queryByRole("button", { name: /^Close$/i });
    await expect(closeBtn).toBeNull();
  },
};

export const Controlled: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          "Abertura controlada por estado externo via `open` + `onOpenChange`. Útil quando o pai precisa abrir o diálogo a partir de outro fluxo (ex.: confirmação assíncrona).",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(dialogTranslations);
    const title = t("demonstration.labels.title");
    const ControlledDemo = () => {
      const [open, setOpen] = useState(false);
      return (
        <div className="flex flex-col gap-3">
          <Button onClick={() => setOpen(true)}>Open programmatically</Button>
          <Dialog open={open} onOpenChange={setOpen}>
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
                <Button onClick={() => setOpen(false)}>
                  {t("demonstration.labels.action")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      );
    };
    return <ControlledDemo />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step("Clique no trigger externo abre o diálogo", async () => {
      const trigger = canvas.getByRole("button", { name: /Open programmatically/i });
      await userEvent.click(trigger);
      const dialog = await waitForPortal("dialog");
      await expect(dialog).toBeVisible();
    });

    await step("Escape fecha o diálogo controlado", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(
        () => {
          const dialog = body.queryByRole("dialog");
          if (dialog && dialog.getAttribute("data-closed") === null) {
            throw new Error("dialog ainda aberto");
          }
        },
        { timeout: 2000 },
      );
    });
  },
};
