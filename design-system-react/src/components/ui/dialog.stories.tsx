import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect, fn, waitFor } from "storybook/test";
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
  tags: ["autodocs"],
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
          args.onOpenChange?.(open);
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

    await step("Trigger está presente no DOM", async () => {
      const trigger = canvas.getByRole("button", { name: /Editar perfil|Edit profile|Editar perfil/i });
      await expect(trigger).toBeInTheDocument();
    });

    await step("Diálogo abre ao clicar no trigger", async () => {
      const trigger = canvas.getAllByRole("button")[0];
      await userEvent.click(trigger);
      const dialog = await body.findByRole("dialog");
      await expect(dialog).toBeVisible();
    });

    await step("Diálogo tem título e descrição acessíveis", async () => {
      const dialog = await body.findByRole("dialog");
      await expect(dialog).toHaveAccessibleName();
      await expect(dialog).toHaveAccessibleDescription();
    });

    await step("Escape fecha o diálogo", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(
        () => {
          const dialog = body.queryByRole("dialog");
          if (dialog && dialog.getAttribute("data-state") !== "closed") {
            throw new Error("dialog still open");
          }
        },
        { timeout: 800 }
      );
    });
  },
};
