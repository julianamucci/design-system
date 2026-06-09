import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { userEvent, within, expect, waitFor } from "storybook/test";
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

const meta = {
  title: "UI/Sheet/Estados",
  tags: ["disclosure"],
  component: Sheet,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Estados canônicos do Sheet: Closed (inicial), Open (defaultOpen), WithCloseButtonHidden (sem X embutido) e Controlled (estado externo via open + onOpenChange).",
      },
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

const trackOpen = (label: string) =>
  track("dialog_open", {
    component: "sheet",
    trigger_label: label,
    location: "storybook:estados",
  });

export const Closed: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Estado inicial — apenas o trigger visível. O SheetContent não está renderizado no DOM (Portal vazio).",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(sheetTranslations);
    return (
      <Sheet onOpenChange={(o) => o && trackOpen("closed")}>
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
            <Button>{t("demonstration.labels.apply")}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
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
          "Sheet aberto via `defaultOpen`. Overlay com backdrop blur, focus trap ativo, scroll-lock no body.",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(sheetTranslations);
    return (
      <Sheet defaultOpen onOpenChange={(o) => o && trackOpen("open")}>
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
            <Button>{t("demonstration.labels.apply")}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  },
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleName();
    await expect(dialog).toHaveAccessibleDescription();
  },
};

export const WithCloseButtonHidden: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`showCloseButton={false}` no SheetContent — sem X no canto. Fechamento apenas via Escape, clique no overlay ou ação do Footer.",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(sheetTranslations);
    return (
      <Sheet defaultOpen onOpenChange={(o) => o && trackOpen("no-close-btn")}>
        <SheetTrigger render={<Button variant="outline" />}>
          {t("demonstration.labels.trigger")}
        </SheetTrigger>
        <SheetContent side="right" showCloseButton={false}>
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
            <Button>{t("demonstration.labels.apply")}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  },
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal("dialog");
    await expect(dialog).toBeVisible();
    const closeBtn = within(dialog).queryByRole("button", { name: /^Close$/i });
    await expect(closeBtn).toBeNull();
  },
};

export const Controlled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Abertura controlada por estado externo via `open` + `onOpenChange`. Útil quando o pai precisa abrir o Sheet a partir de outro fluxo.",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(sheetTranslations);
    const ControlledDemo = () => {
      const [open, setOpen] = useState(false);
      return (
        <div className="flex flex-col gap-3">
          <Button onClick={() => setOpen(true)}>Open programmatically</Button>
          <Sheet open={open} onOpenChange={setOpen}>
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
                <Button onClick={() => setOpen(false)}>
                  {t("demonstration.labels.apply")}
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      );
    };
    return <ControlledDemo />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step("Clique no trigger externo abre o sheet", async () => {
      const trigger = canvas.getByRole("button", {
        name: /Open programmatically/i,
      });
      await userEvent.click(trigger);
      const dialog = await waitForPortal("dialog");
      await expect(dialog).toBeVisible();
    });

    await step("Escape fecha o sheet controlado", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(
        () => {
          const dialog = body.queryByRole("dialog");
          if (dialog && dialog.getAttribute("data-closed") === null) {
            throw new Error("sheet ainda aberto");
          }
        },
        { timeout: 2000 },
      );
    });
  },
};
