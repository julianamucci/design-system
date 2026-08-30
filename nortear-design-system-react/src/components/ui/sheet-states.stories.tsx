import type { Meta, StoryObj } from "@storybook/react-vite";
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
import {
  sheetOpenSource,
  sheetControlledSource,
  sheetNoButtonCloseSource,
  sheetSource,
} from "./sheet.source";
import { Button } from "./button";
import { useTranslation } from "@/lib/i18n";
import sheetTranslations from "@shared/content/sheet/translations.json";

// Fechado e aberto são os dois extremos do ciclo. Fechado o painel nem existe
// no DOM; aberto, o foco entra e fica preso até o fechamento.

const meta = {
  title: "Primitives/Overlay/Sheet/States",
  tags: ["overlay"],
  component: Sheet,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: sheetSource },
      description: {
        component:
          "Estados canônicos do Sheet: Closed (inicial), Open (defaultOpen), " +
          "WithCloseButtonHidden (sem o botão do canto) e Controlled (estado externo).",
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

export const Closed: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Estado inicial. O painel não está no DOM, e o gatilho anuncia que existe um " +
          "diálogo por trás dele sem prometer que já está aberto.",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(sheetTranslations);
    return (
      <Sheet>
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
        </SheetContent>
      </Sheet>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getAllByRole("button")[0];

    await step("Fechado, o painel não existe no DOM", async () => {
      await expect(within(document.body).queryAllByRole("dialog")).toHaveLength(0);
      await expect(document.querySelector('[data-slot="sheet-content"]')).toBeNull();
    });

    await step("O gatilho anuncia o diálogo sem afirmar que está aberto", async () => {
      await expect(trigger).toBeVisible();
      await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
      await expect(trigger).toHaveAttribute("data-slot", "sheet-trigger");
    });
  },
};

export const Open: Story = {
  parameters: {
    docs: {
      // Aqui a abertura inicial É o assunto — nas outras stories `defaultOpen`
      // é só o que põe o painel no DOM para a foto.
      source: { transform: sheetOpenSource },
      description: {
        story:
          "Aberto por defaultOpen, sem estado externo nenhum. O foco entra no painel e o " +
          "restante da página fica inerte enquanto ele durar.",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(sheetTranslations);
    return (
      <Sheet defaultOpen>
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
  play: async ({ step }) => {
    const panel = await waitForPortal("dialog");

    await step("Monta já aberto, com o contrato de markup completo", async () => {
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute("aria-modal", "true");
      await expect(panel).toHaveAccessibleName();
      await expect(panel).toHaveAccessibleDescription();
      await expect(document.querySelector('[data-slot="sheet-overlay"]')).not.toBeNull();
    });

    await step("O foco está dentro do painel", async () => {
      await waitFor(() => {
        if (!panel.contains(document.activeElement)) {
          throw new Error("o foco não entrou no painel");
        }
      });
    });
  },
};

export const WithCloseButtonHidden: Story = {
  parameters: {
    docs: {
      // A AUSÊNCIA do botão do canto é o assunto, e ela só se sustenta com o
      // rodapé oferecendo a outra saída.
      source: { transform: sheetNoButtonCloseSource },
      description: {
        story:
          "Sem o botão do canto. Só faz sentido quando o rodapé já oferece uma saída " +
          "explícita — Escape continua fechando de qualquer forma.",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(sheetTranslations);
    return (
      <Sheet defaultOpen>
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
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  },
  play: async ({ step }) => {
    const panel = await waitForPortal("dialog");

    await step("O botão do canto não é renderizado", async () => {
      await expect(panel).toBeVisible();
      await expect(
        within(panel).queryByRole("button", { name: /^Fechar$/i }),
      ).toBeNull();
    });

    await step("E ainda assim existe uma saída — o rodapé", async () => {
      const footer = panel.querySelector<HTMLElement>('[data-slot="sheet-footer"]');
      await expect(footer).not.toBeNull();
      await expect(within(footer!).getAllByRole("button").length).toBeGreaterThan(0);
    });
  },
};

export const Controlled: Story = {
  parameters: {
    docs: {
      // Estado externo por useState e SEM gatilho interno: composição que o
      // snippet do meta, não controlado, esconderia.
      source: { transform: sheetControlledSource },
      description: {
        story:
          "Estado do lado de fora. O componente não decide nada sozinho: abre quando o " +
          "valor ligado diz que sim, e avisa a cada mudança para que o dono do estado acompanhe.",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(sheetTranslations);
    const ControlledDemo = () => {
      const [open, setOpen] = useState(false);
      return (
        <div className="nds-stack" data-spacing="sm">
          <Button variant="outline" onClick={() => setOpen(true)}>
            Abrir pelo estado externo
          </Button>
          <Sheet open={open} onOpenChange={(value) => setOpen(value)}>
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
    const externo = canvas.getByRole("button", { name: "Abrir pelo estado externo" });

    await step("Sem gatilho interno, o painel nasce fechado", async () => {
      if (within(document.body).queryAllByRole("dialog").length > 0) {
        await userEvent.keyboard("{Escape}");
        await waitForPortalGone("dialog");
      }
      await expect(within(document.body).queryAllByRole("dialog")).toHaveLength(0);
    });

    await step("O estado externo abre o painel", async () => {
      await userEvent.click(externo);
      const panel = await waitForPortal("dialog");
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute("data-slot", "sheet-content");
    });

    await step("Fechar por dentro devolve o valor a quem é dono dele", async () => {
      const panel = await waitForPortal("dialog");
      await userEvent.click(within(panel).getByRole("button", { name: /fechar/i }));
      await waitForPortalGone("dialog");
      // Se o callback não tivesse chegado, o estado do pai continuaria `true` e
      // o painel reabriria no próximo render.
      await expect(within(document.body).queryAllByRole("dialog")).toHaveLength(0);
    });
  },
};
