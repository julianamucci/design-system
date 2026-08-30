import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within, expect, fn, waitFor } from "storybook/test";
import {
  open,
  cantoButtonClose,
  checkNameEDescricao,
  waitForOpen,
  waitForClosed,
  trigger,
  overlay,
  panel,
} from "./dialog.fixtures";
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
import {
  dialogOpenSource,
  dialogControlledSource,
  dialogNoButtonCloseSource,
  dialogSource,
} from "./dialog.source";
import { Button } from "./button";
import { useTranslation } from "@/lib/i18n";
import dialogTranslations from "@shared/content/dialog/translations.json";

const meta = {
  title: "Primitives/Overlay/Dialog/States",
  tags: ["overlay"],
  component: Dialog,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: dialogSource },
      description: {
        component:
          "Configuracoes canônicas do Dialog: Closed (estado inicial), Open (defaultOpen), WithCloseButtonHidden (sem X no canto) e Controlled (controle externo via open + onOpenChange).",
      },
    },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  parameters: {
    covers: ["visual.item3"],
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
      <Dialog>
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
  // Esta story não interage com nada: é aqui que a leitura do estado de
  // MONTAGEM vale, porque nenhum replay pode ter mudado o que ela observa.
  play: async ({ canvasElement, step }) => {
    const triggerEl = trigger(canvasElement)!;

    await step("Fechado, nada do conteúdo existe no DOM", async () => {
      // O portal é estrutural: fechado, nem o overlay nem o painel estão no
      // DOM. Um painel escondido por CSS continuaria na ordem de tabulação e
      // seria lido pelo leitor de tela.
      await expect(panel()).toBeNull();
      await expect(overlay()).toBeNull();
      await expect(triggerEl).toBeVisible();
    });

    await step("O gatilho anuncia que abre um diálogo, e que está recolhido", async () => {
      await expect(triggerEl).toHaveAttribute("aria-haspopup", "dialog");
      await expect(triggerEl).toHaveAttribute("aria-expanded", "false");
    });
  },
};

export const Open: Story = {
  parameters: {
    covers: ["visual.item3"],
    docs: {
      // `defaultOpen` é o assunto da story, e o arquivo desliga os controls: o
      // snippet do `meta` cairia no padrão e não mostraria a prop.
      source: { transform: dialogOpenSource },
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
      <Dialog defaultOpen>
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
  play: async ({ step }) => {
    // `waitForOpen` e não o helper idempotente: esta story tem que provar que
    // `defaultOpen` MONTA aberta. Abrir por clique aqui passaria mesmo com a
    // prop sendo ignorada em silêncio.
    const p = await waitForOpen();

    await step("Monta já aberto, sem estado externo nenhum", async () => {
      await expect(p).toBeVisible();
      await expect(overlay()).toBeVisible();
      await expect(p).toHaveAttribute("role", "dialog");
      await expect(p).toHaveAttribute("aria-modal", "true");
      await checkNameEDescricao(p);
    });

    await step("E o foco já está dentro do painel", async () => {
      await waitFor(async () => {
        await expect(p.contains(document.activeElement)).toBe(true);
      });
    });
  },
};

export const WithCloseButtonHidden: Story = {
  parameters: {
    covers: ["visual.item3"],
    docs: {
      // A prop vive no Content, não na raiz — o snippet do `meta` esconderia
      // justamente onde ela entra.
      source: { transform: dialogNoButtonCloseSource },
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
      <Dialog defaultOpen>
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
  play: async ({ canvasElement, step }) => {
    const p = await waitForOpen();

    await step("Sem X no canto", async () => {
      await expect(cantoButtonClose(p)).toBeNull();
    });

    await step("Escape continua fechando — nunca se tira toda saída", async () => {
      // Sem o X, Escape e o Cancelar do rodapé são as saídas que restam.
      // Retirar todas de uma vez deixaria o diálogo sem fechamento acessível.
      await userEvent.keyboard("{Escape}");
      await waitForClosed();
      // Reabre: o Chromatic fotografa o estado final, e o que esta story existe
      // para mostrar é o painel SEM o X no canto.
      await expect(await open(canvasElement)).toBeVisible();
    });
  },
};

// Espião do modo controlado. Vive fora do `render` para que a play alcance as
// chamadas — spy criado dentro do render é inalcançável e deixa a aba Actions
// vazia. `mockClear()` no início da play zera o que a execução anterior deixou.
const spyControlled = fn();

export const Controlled: Story = {
  parameters: {
    covers: ["functional.item7"],
    docs: {
      // Sem gatilho e com estado externo: `open` + `onOpenChange` é outra
      // composição, não a padrão com `DialogTrigger`.
      source: { transform: dialogControlledSource },
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
        <div className="nds-stack" data-spacing="sm">
          <Button
            onClick={() => {
              setOpen(true);
              spyControlled(true);
            }}
          >
            Open programmatically
          </Button>
          <Dialog
            open={open}
            onOpenChange={(value) => {
              setOpen(value);
              spyControlled(value);
            }}
          >
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
    spyControlled.mockClear();

    await step("Nasce fechado, porque o valor externo diz que sim", async () => {
      await expect(panel()).toBeNull();
    });

    await step("Interagir avisa o dono do estado, e o painel segue o valor", async () => {
      const externo = canvas.getByRole("button", { name: /Open programmatically/i });
      await userEvent.click(externo);
      await expect(await waitForOpen()).toBeVisible();
      await expect(spyControlled).toHaveBeenLastCalledWith(true);
    });

    await step("Escape também passa pelo dono do estado", async () => {
      await userEvent.keyboard("{Escape}");
      await waitForClosed();
      // O valor externo é quem fecha: se o callback não disparasse, o painel
      // teria sumido por conta própria e o estado do pai ficaria mentindo.
      await expect(spyControlled).toHaveBeenLastCalledWith(false);
      await expect(panel()).toBeNull();
    });
  },
};
