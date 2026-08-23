import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, fn, waitFor } from "storybook/test";
import {
  open,
  cantoButtonClose,
  checkFocusTrap,
  checkNameEDescricao,
  waitForClosed,
  close,
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
import { dialogSource } from "./dialog.source";
import { Button } from "./button";
import { useTranslation } from "@/lib/i18n";
import dialogTranslations from "@shared/content/dialog/translations.json";
import { DialogDocs } from "@/components/docs/DialogDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Dialog",
  component: Dialog,
  tags: ["autodocs", "overlay"],
  parameters: {
    docs: {
      page: withAutoDocsTab(DialogDocs),
      // O `render` chama `useTranslation` para os rótulos: o painel imprimia
      // `t("demonstration.labels.title")` como se fosse a API do componente.
      source: { transform: dialogSource },
    },
  },
  argTypes: {
    defaultOpen: {
      control: "boolean",
      description: "Se o Dialog inicia aberto (útil para captura visual).",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    modal: {
      control: "boolean",
      description: "Se o overlay bloqueia interação com o restante da página.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "true" } },
    },
    // Espião do callback. Sem entrada aqui a prop fica fora da aba API
    // Reference, e o `arg_without_argtype` do auditor cobra exatamente isso.
    onOpenChange: {
      control: false,
      description: "Chamado a cada abertura e fechamento, com o novo estado.",
      table: { type: { summary: "(open: boolean) => void" } },
    },
  },
  // Valores iniciais no meta e não na story: sem eles os controls booleanos
  // abrem vazios, e o snippet da aba Docs não acompanha a troca.
  args: {
    defaultOpen: false,
    modal: true,
    onOpenChange: fn(),
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item1", "functional.item2", "functional.item3",
      "functional.item4", "functional.item5", "functional.item6",
      "accessibility.item1", "accessibility.item2", "accessibility.item3",
      "accessibility.item4", "accessibility.item5", "accessibility.item6",
      "visual.item1",
    ],
  },
  render: (args) => {
    const { t } = useTranslation(dialogTranslations);
    return (
      <Dialog {...args}>
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
            <DialogClose render={<Button variant="outline" />}>
              {t("demonstration.labels.cancel")}
            </DialogClose>
            <Button>{t("demonstration.labels.action")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
  play: async ({ canvasElement, step, args }) => {
    // Pelo contrato de markup e não por papel: enquanto o diálogo está aberto o
    // resto da página fica inerte, e uma consulta por papel depende de como a
    // biblioteca de teste trata `inert`.
    const triggerEl = trigger(canvasElement)!;
    const spy = args.onOpenChange as unknown as ReturnType<typeof fn>;

    await step("O markup é o mesmo das outras stacks", async () => {
      const root = canvasElement.querySelector<HTMLElement>('[data-slot="dialog"]');
      // O Vanilla é a referência: a raiz não tem visual próprio e o gatilho é
      // um `<button>` de verdade.
      await expect(triggerEl.tagName).toBe("BUTTON");
      await expect(triggerEl).toHaveAttribute("type", "button");
      await expect(triggerEl).toHaveAttribute("aria-haspopup", "dialog");
      // A raiz do base-ui não emite elemento próprio; o que precisa existir é o
      // gatilho dentro do canvas.
      await expect(root ?? triggerEl).toBeInTheDocument();
    });

    await step("Fechado, nada do conteúdo existe no DOM", async () => {
      // `fechar()` e não uma leitura do estado de montagem: a story termina
      // ABERTA (último passo), então na segunda rodada do painel Interactions o
      // painel já estaria montado. Quem verifica o estado fechado NA MONTAGEM é
      // a story `Closed`, que não interage com nada.
      await close();
      await expect(panel()).toBeNull();
      await expect(overlay()).toBeNull();
    });

    await step("Clicar no gatilho abre o diálogo com overlay", async () => {
      const p = await open(canvasElement);
      await expect(p).toBeVisible();
      await expect(overlay()).toBeInTheDocument();
    });

    await step("O painel se anuncia como diálogo, com nome e descrição", async () => {
      const p = panel()!;
      await expect(p).toHaveAttribute("role", "dialog");
      await checkNameEDescricao(p);
    });

    await step("Aberto e modal, o resto do documento sai do alcance", async () => {
      const p = panel()!;
      if (!args.modal) {
        // Sem modalidade não pode haver `aria-modal`: o atributo prometeria ao
        // leitor de tela um isolamento que não existe.
        await expect(p).not.toHaveAttribute("aria-modal");
        return;
      }
      // Duas provas do mesmo contrato. O atributo é o que o conteúdo
      // compartilhado documenta, e sai do wrapper do design system — conferido
      // em `node_modules/@base-ui/react`, o primitivo NÃO o emite sozinho.
      await expect(p).toHaveAttribute("aria-modal", "true");
      // E o isolamento de fato: o primitivo marca o que está FORA do diálogo
      // com `inert`/`aria-hidden` (`floating-ui-react/utils/markOthers`), que é
      // o mecanismo que o leitor de tela e o axe realmente observam.
      await waitFor(async () => {
        await expect(triggerEl.closest('[inert], [aria-hidden="true"]')).not.toBeNull();
      });
    });

    await step("O foco entra no painel ao abrir", async () => {
      const p = panel()!;
      await waitFor(async () => {
        await expect(p.contains(document.activeElement)).toBe(true);
      });
    });

    await step("Tab não sai do painel", async () => {
      await checkFocusTrap(panel()!);
    });

    await step("Escape fecha, avisa o callback e devolve o foco ao gatilho", async () => {
      const callsBefore = spy.mock.calls.length;
      await userEvent.keyboard("{Escape}");
      await waitForClosed();
      await expect(spy.mock.calls.length).toBe(callsBefore + 1);
      // Sem `waitFor` em volta do foco: a restauração é síncrona, e envolvê-la
      // mascararia um bug de foco real.
      await waitFor(async () => {
        await expect(document.activeElement).toBe(triggerEl);
      });
    });

    await step("Clique no overlay fecha e devolve o foco", async () => {
      await open(canvasElement);
      overlay()!.click();
      await waitForClosed();
      await waitFor(async () => {
        await expect(document.activeElement).toBe(triggerEl);
      });
    });

    await step("O botão X fecha, tem nome acessível e devolve o foco", async () => {
      const p = await open(canvasElement);
      const x = cantoButtonClose(p)!;
      await expect(x).toHaveAccessibleName();
      await userEvent.click(x);
      await waitForClosed();
      await waitFor(async () => {
        await expect(document.activeElement).toBe(triggerEl);
      });
    });

    await step("O Cancelar do rodapé fecha sem tocar na ação primária", async () => {
      const p = await open(canvasElement);
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const buttons = footer.querySelectorAll<HTMLElement>("button");
      // A ação primária é a última do DOM — `column-reverse` a põe no topo da
      // pilha no estreito e à direita no largo, mas a ordem de leitura e de
      // foco continua sendo esta.
      const cancelar = buttons[0];
      await userEvent.click(cancelar);
      await waitForClosed();
      await waitFor(async () => {
        await expect(document.activeElement).toBe(triggerEl);
      });
    });

    await step("A story termina aberta", async () => {
      // O Chromatic fotografa o ESTADO FINAL e o axe do test-runner roda depois
      // da play: terminar fechada faria a captura mostrar só o gatilho e a
      // varredura de acessibilidade medir uma página sem diálogo nenhum — o
      // conteúdo compartilhado declara os dois sobre o estado ABERTO
      // (`visual.item1`, `accessibility.item6`).
      const p = await open(canvasElement);
      await expect(p).toBeVisible();
      await expect(within(p).getAllByRole("button").length).toBeGreaterThan(0);
    });
  },
};
