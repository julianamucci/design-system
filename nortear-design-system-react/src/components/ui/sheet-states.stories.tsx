import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within, expect, waitFor } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import {
  Sheet,
  SheetBody,
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
  sheetContentLongSource,
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
          "LongScrollBody (corpo mais alto que o painel), WithCloseButtonHidden " +
          "(sem o botão do canto) e Controlled (estado externo).",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="nds-min-h-80" style={{ contain: "layout" }}>
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

/**
 * Texto dos parágrafos longos, montado fora do JSX.
 *
 * Não é preferência de estilo: a catraca `identificador_pt_novo` descasca texto
 * entre tags com `>[^<>{}]*<`, e uma interpolação no meio da frase
 * (`Parágrafo {i + 1}: …`) quebra esse pareamento — dali para a frente a prosa
 * passa a ser lida como código, e "corpo" e "painel" entram como identificador.
 * Foi o que aconteceu uma vez: alguém calou a catraca traduzindo a FRASE, e a
 * story passou a exibir "inside do panel, without empurrar o rodapé para
 * outside da tela" a quem lê a documentação. Em literal, o contador não
 * enxerga — e é também a forma que o Vanilla, referência, sempre usou.
 */
const LONG_PARAGRAPHS = Array.from(
  { length: 24 },
  (_, i) =>
    `Parágrafo ${i + 1}: termos longos o bastante para o corpo precisar rolar ` +
    `dentro do painel, sem empurrar o rodapé para fora da tela.`,
);

export const LongScrollBody: Story = {
  parameters: {
    covers: ["visual.item4"],
    docs: {
      // O corpo que rola é o assunto, e ele só aparece com o SheetBody cheio.
      source: { transform: sheetContentLongSource },
      description: {
        story:
          "Corpo mais alto que o painel. O corpo rola sozinho e o rodapé continua visível — " +
          "é o que separa 'conteúdo longo' de 'ação fora de alcance'.",
      },
    },
  },
  render: () => (
    <Sheet defaultOpen>
      <SheetTrigger render={<Button variant="outline" />}>Ler termos</SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Termos de uso</SheetTitle>
          <SheetDescription>Leia atentamente antes de aceitar.</SheetDescription>
        </SheetHeader>
        <SheetBody className="nds-stack" data-spacing="sm">
          {LONG_PARAGRAPHS.map((text, i) => (
            <p key={i} className="nds-text-body">
              {text}
            </p>
          ))}
        </SheetBody>
        <SheetFooter>
          <SheetClose render={<Button variant="outline" />}>Cancelar</SheetClose>
          <Button>Aceitar termos</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
  play: async ({ step }) => {
    const panel = await waitForPortal("dialog");
    const body = panel.querySelector<HTMLElement>('[data-slot="sheet-body"]')!;
    const footer = panel.querySelector<HTMLElement>('[data-slot="sheet-footer"]')!;

    await step("O corpo é quem rola, não o painel", async () => {
      await expect(body).not.toBeNull();
      await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
      // O painel em si não rola: o `flex: 1 1 auto` do corpo é o que segura o rodapé.
      await expect(panel.scrollHeight).toBeLessThanOrEqual(panel.clientHeight + 1);
    });

    await step("A região rolável é alcançável por teclado", async () => {
      // WCAG 2.1.1 — sem o tabindex quem navega por teclado não consegue rolar
      // o corpo (é a regra scrollable-region-focusable do axe).
      await expect(body).toHaveAttribute("tabindex", "0");
    });

    await step("O rodapé continua visível com o corpo cheio", async () => {
      const boxFooter = footer.getBoundingClientRect();
      const boxPanel = panel.getBoundingClientRect();
      await expect(boxFooter.bottom).toBeLessThanOrEqual(boxPanel.bottom + 1);
      await expect(boxFooter.height).toBeGreaterThan(0);
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
