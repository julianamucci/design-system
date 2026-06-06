import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect, fn, waitFor } from "storybook/test";
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
import { DialogDocs } from "@/components/docs/DialogDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Dialog",
  component: Dialog,
  tags: ["autodocs", "overlay"],
  parameters: {
    docs: { page: withAutoDocsTab(DialogDocs) },
  },
  argTypes: {
    defaultOpen: {
      control: "boolean",
      description: "Se o Dialog inicia aberto (útil para captura visual).",
    },
    modal: {
      control: "boolean",
      description: "Se o overlay bloqueia interação com o restante da página.",
    },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    defaultOpen: false,
    modal: true,
    onOpenChange: fn(),
  },
  render: (args) => {
    const { t } = useTranslation(dialogTranslations);
    const onAction = fn();
    return (
      <Dialog
        {...args}
        onOpenChange={(open) => {
          args.onOpenChange?.(open, undefined as never);
          if (open) {
            track("dialog_open", {
              component: "dialog",
              label: t("demonstration.labels.title"),
              location: "storybook:playground",
            });
          } else {
            track("dialog_close", {
              component: "dialog",
              label: t("demonstration.labels.title"),
              reason: "unknown",
              location: "storybook:playground",
            });
          }
        }}
      >
        <DialogTrigger render={<Button variant="outline" />}>
          {t("demonstration.labels.triggerLabel")}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("demonstration.labels.title")}</DialogTitle>
            <DialogDescription>
              {t("demonstration.labels.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" />}
              onClick={() =>
                track("dialog_close", {
                  component: "dialog",
                  label: t("demonstration.labels.title"),
                  reason: "action",
                  location: "storybook:playground",
                })
              }
            >
              {t("demonstration.labels.cancel")}
            </DialogClose>
            <Button
              onClick={() => {
                onAction();
                track("dialog_action", {
                  component: "dialog",
                  action_label: t("demonstration.labels.action"),
                  location: "storybook:playground",
                });
              }}
            >
              {t("demonstration.labels.action")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    const waitForClose = async () => {
      await waitFor(
        () => {
          const dialog = body.queryByRole("dialog");
          if (dialog && dialog.getAttribute("data-state") !== "closed") {
            throw new Error("dialog still open");
          }
        },
        { timeout: 800 }
      );
    };

    await step("1. Abre ao clicar no trigger", async () => {
      const trigger = canvas.getByRole("button", { name: /Editar perfil/i });
      await expect(trigger).toBeInTheDocument();
      await userEvent.click(trigger);
      const dialog = await waitForPortal("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAccessibleName();
      await expect(dialog).toHaveAccessibleDescription();
    });

    await step("5. Focus trap — foco entra no dialog ao abrir", async () => {
      const dialog = await waitForPortal("dialog");
      await waitFor(() => {
        if (!dialog.contains(document.activeElement)) {
          throw new Error("focus did not move into dialog");
        }
      });
    });

    await step("2. Escape fecha o diálogo", async () => {
      await userEvent.keyboard("{Escape}");
      await waitForClose();
    });

    await step("6. Retorno de foco ao trigger após Escape", async () => {
      await waitFor(() => {
        const trigger = canvas.getByRole("button", { name: /Editar perfil/i });
        if (document.activeElement !== trigger) {
          throw new Error("focus did not return to trigger");
        }
      });
    });

    await step("3. Reabrir e fechar via clique no overlay", async () => {
      const trigger = canvas.getByRole("button", { name: /Editar perfil/i });
      await userEvent.click(trigger);
      await waitForPortal("dialog");
      const overlay = document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]');
      await expect(overlay).not.toBeNull();
      overlay?.click();
      await waitForClose();
    });

    await step("4. Reabrir e fechar via botão Close (X)", async () => {
      const trigger = canvas.getByRole("button", { name: /Editar perfil/i });
      await userEvent.click(trigger);
      const dialog = await waitForPortal("dialog");
      const closeBtn = within(dialog).getByRole("button", { name: /close/i });
      await userEvent.click(closeBtn);
      await waitForClose();
    });

    await step("7. Uncontrolled — defaultOpen reabre sem controle externo", async () => {
      // Playground usa onOpenChange (uncontrolled): reabrir e fechar via Cancel
      const trigger = canvas.getByRole("button", { name: /Editar perfil/i });
      await userEvent.click(trigger);
      const dialog = await waitForPortal("dialog");
      const cancel = within(dialog).getByRole("button", { name: /Cancelar/i });
      await userEvent.click(cancel);
      await waitForClose();
    });
  },
};
