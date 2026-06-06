import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
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
  title: "UI/Sheet/Variantes",
  tags: ["disclosure"],
  component: Sheet,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Variantes do Sheet por `side` no SheetContent: Right (padrão), Left, Top e Bottom. A direção é controlada pelo Content, não pelo Sheet root.",
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
    location: "storybook:variantes",
  });

export const Right: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Padrão para desktop — desliza da direita, `w-3/4 sm:max-w-sm`. Ideal para filtros e configurações secundárias.",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(sheetTranslations);
    return (
      <Sheet defaultOpen onOpenChange={(o) => o && trackOpen("right")}>
        <SheetTrigger render={<Button variant="outline" />}>
          {t("demonstration.labels.trigger")}
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>{t("demonstration.labels.rightLabel")}</SheetTitle>
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
    await expect(dialog).toHaveAttribute("data-side", "right");
  },
};

export const Left: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Desliza da esquerda — ideal para navegação secundária ou painéis de configuração à esquerda do conteúdo.",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(sheetTranslations);
    return (
      <Sheet defaultOpen onOpenChange={(o) => o && trackOpen("left")}>
        <SheetTrigger render={<Button variant="outline" />}>
          {t("demonstration.labels.trigger")}
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>{t("demonstration.labels.leftLabel")}</SheetTitle>
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
    await expect(dialog).toHaveAttribute("data-side", "left");
  },
};

export const Top: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Desliza do topo — ocupa altura automática, útil para notificações ricas ou filtros horizontais.",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(sheetTranslations);
    return (
      <Sheet defaultOpen onOpenChange={(o) => o && trackOpen("top")}>
        <SheetTrigger render={<Button variant="outline" />}>
          {t("demonstration.labels.trigger")}
        </SheetTrigger>
        <SheetContent side="top">
          <SheetHeader>
            <SheetTitle>{t("demonstration.labels.topLabel")}</SheetTitle>
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
    await expect(dialog).toHaveAttribute("data-side", "top");
  },
};

export const Bottom: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Desliza de baixo — equivalente visual ao Drawer, mas sem gesture de arrastar. Para mobile com swipe, prefira Drawer.",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(sheetTranslations);
    return (
      <Sheet defaultOpen onOpenChange={(o) => o && trackOpen("bottom")}>
        <SheetTrigger render={<Button variant="outline" />}>
          {t("demonstration.labels.trigger")}
        </SheetTrigger>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{t("demonstration.labels.bottomLabel")}</SheetTitle>
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
    await expect(dialog).toHaveAttribute("data-side", "bottom");
  },
};
