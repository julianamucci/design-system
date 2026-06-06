import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect, fn, waitFor } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";
import { Button } from "./button";
import { useTranslation } from "@/lib/i18n";
import { track } from "@/lib/analytics";
import sheetTranslations from "@shared/content/sheet/translations.json";
import { SheetDocs } from "@/components/docs/SheetDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Sheet",
  component: Sheet,
  tags: ["autodocs", "disclosure"],
  parameters: {
    layout: "centered",
    docs: { page: withAutoDocsTab(SheetDocs) },
  },
  argTypes: {
    defaultOpen: {
      control: "boolean",
      description: "Se o Sheet inicia aberto (útil para captura visual).",
    },
    modal: {
      control: "boolean",
      description: "Se o overlay bloqueia interação com o restante da página.",
    },
  },
  decorators: [
    (Story) => (
      <div style={{ contain: "layout", minHeight: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    defaultOpen: false,
    modal: true,
    onOpenChange: fn(),
  },
  render: (args) => {
    const { t } = useTranslation(sheetTranslations);
    return (
      <Sheet
        {...args}
        onOpenChange={(open) => {
          args.onOpenChange?.(open, undefined as never);
          if (open) {
            track("dialog_open", {
              component: "sheet",
              trigger_label: t("demonstration.labels.trigger"),
              location: "storybook:playground",
            });
          } else {
            track("dialog_close", {
              component: "sheet",
              reason: "user",
              location: "storybook:playground",
            });
          }
        }}
      >
        <SheetTrigger render={<Button variant="outline" />}>
          {t("demonstration.labels.trigger")}
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>{t("demonstration.labels.title")}</SheetTitle>
            <SheetDescription>
              {t("demonstration.labels.description")}
            </SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose render={<Button variant="outline" />}>
              {t("demonstration.labels.cancel")}
            </SheetClose>
            <Button
              onClick={() =>
                track("dialog_confirm", {
                  component: "sheet",
                  action: t("demonstration.labels.apply"),
                  location: "storybook:playground",
                })
              }
            >
              {t("demonstration.labels.apply")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
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
            throw new Error("sheet still open");
          }
        },
        { timeout: 800 }
      );
    };

    await step("1. Abre ao clicar no trigger", async () => {
      const trigger = canvas.getByRole("button", { name: /Abrir filtros/i });
      await expect(trigger).toBeInTheDocument();
      await userEvent.click(trigger);
      const dialog = await waitForPortal("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAccessibleName();
      await expect(dialog).toHaveAccessibleDescription();
    });

    await step("2. Focus trap — foco entra no sheet ao abrir", async () => {
      const dialog = await waitForPortal("dialog");
      await waitFor(() => {
        if (!dialog.contains(document.activeElement)) {
          throw new Error("focus did not move into sheet");
        }
      });
    });

    await step("3. Escape fecha o sheet", async () => {
      await userEvent.keyboard("{Escape}");
      await waitForClose();
    });

    await step("4. Retorno de foco ao trigger após Escape", async () => {
      await waitFor(() => {
        const trigger = canvas.getByRole("button", { name: /Abrir filtros/i });
        if (document.activeElement !== trigger) {
          throw new Error("focus did not return to trigger");
        }
      });
    });

    await step("5. Reabrir e fechar via clique no overlay", async () => {
      const trigger = canvas.getByRole("button", { name: /Abrir filtros/i });
      await userEvent.click(trigger);
      await waitForPortal("dialog");
      const overlay = document.querySelector<HTMLElement>(
        '[data-slot="sheet-overlay"]'
      );
      await expect(overlay).not.toBeNull();
      overlay?.click();
      await waitForClose();
    });

    await step("6. Reabrir e fechar via botão Close (X)", async () => {
      const trigger = canvas.getByRole("button", { name: /Abrir filtros/i });
      await userEvent.click(trigger);
      const dialog = await waitForPortal("dialog");
      const closeBtn = within(dialog).getByRole("button", { name: /close/i });
      await userEvent.click(closeBtn);
      await waitForClose();
    });
  },
};
