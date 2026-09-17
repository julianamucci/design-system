import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, fn, waitFor } from "storybook/test";
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
import { sheetSource } from "./sheet.source";
import {
  dialogCloseReason,
  markConfirmation,
  type DialogCloseReason,
} from "./dialog-close-reason";
import { Button } from "./button";
import { label } from "./sheet.fixtures";
import { useTranslation } from "@/lib/i18n";
import sheetTranslations from "@shared/content/sheet/translations.json";
import { SheetDocs } from "@/components/docs/SheetDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

import { figmaDesign } from "@shared/figma/design-links";
/**
 * Motivo de cada fechamento desta rodada, na ordem em que aconteceram.
 *
 * O motivo é derivado AO LADO do primitivo (`dialogCloseReason`) e só repassado
 * aqui — a story não inventa palavra, ela confere a que o componente entrega.
 * Até esta rodada o react não afirmava motivo em story nenhuma: Escape, véu e X
 * podiam chegar ao GA4 com a palavra errada sem nada reprovar.
 */
const closeReasons: DialogCloseReason[] = [];

const lastCloseReason = (): DialogCloseReason | undefined => closeReasons.at(-1);

type SheetArgs = {
  side: "top" | "right" | "bottom" | "left";
  showCloseButton: boolean;
  modal: boolean;
  defaultOpen: boolean;
  triggerLabel: string;
  onOpenChange: (open: boolean) => void;
};

const meta = {
  title: "Components/Overlay/Sheet",
  component: Sheet,
  tags: ["autodocs", "overlay"],
  parameters: {
    design: figmaDesign("sheet"),
    layout: "centered",
    docs: {
      page: withAutoDocsTab(SheetDocs),
      source: { transform: sheetSource },
    },
  },
  argTypes: {
    side: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
      description: "Borda de onde o painel desliza. Mora no conteúdo, não na raiz.",
      table: { type: { summary: '"top" | "right" | "bottom" | "left"' }, defaultValue: { summary: '"right"' } },
    },
    showCloseButton: {
      control: "boolean",
      description: "Exibe o botão de fechar no canto superior direito do painel.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "true" } },
    },
    modal: {
      control: "boolean",
      description:
        "Prende o foco, trava a rolagem da página e bloqueia o ponteiro fora do painel.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "true" } },
    },
    defaultOpen: {
      control: "boolean",
      description: "Estado inicial no modo não-controlado.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    triggerLabel: {
      control: "text",
      description: 'Texto do gatilho. Verbo no infinitivo — nomeie a ação, nunca "Mais".',
      table: { type: { summary: "string" } },
    },
    // Espião de callback: documentação, não controle.
    onOpenChange: {
      control: false,
      description: "Chamado a cada abertura e fechamento, com o novo estado.",
      table: { type: { summary: "(open: boolean) => void" } },
    },
  },
  args: {
    side: "right",
    showCloseButton: true,
    modal: true,
    defaultOpen: false,
    triggerLabel: label("demonstration.labels.trigger"),
    onOpenChange: fn(),
  },
  decorators: [
    (Story) => (
      <div className="nds-min-h-80" style={{ contain: "layout" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<SheetArgs>;

export default meta;
type Story = StoryObj<SheetArgs>;

/** Espera o `body` voltar a aceitar ponteiro depois de um fechamento. */
async function waitForPointerLiberado(): Promise<void> {
  await waitFor(() => {
    if (getComputedStyle(document.body).pointerEvents === "none") {
      throw new Error("o overlay ainda bloqueia o ponteiro");
    }
  });
}

/**
 * Abre só se estiver fechado.
 *
 * O painel Interactions REEXECUTA a play no mesmo DOM: um clique cego partiria
 * do estado que a rodada anterior deixou e inverteria o resultado.
 */
async function open(trigger: HTMLElement): Promise<HTMLElement> {
  // O ponteiro volta DEPOIS do nó sair: enquanto o painel é modal a lib deixa
  // `pointer-events: none` no `body` e só o devolve depois de remover o painel.
  // Sem esta espera o clique de reabertura falha no intervalo — medido.
  await waitForPointerLiberado();
  if (within(document.body).queryAllByRole("dialog").length === 0) {
    await userEvent.click(trigger);
  }
  return await waitForPortal("dialog");
}

/**
 * Fecha e espera a interação voltar.
 *
 * O painel sumir do DOM não basta: enquanto ele é modal a lib deixa
 * `pointer-events: none` no `body` e só devolve DEPOIS de remover o nó. O
 * clique seguinte falharia nesse intervalo.
 */
async function close(): Promise<void> {
  if (within(document.body).queryAllByRole("dialog").length > 0) {
    await userEvent.keyboard("{Escape}");
  }
  await waitForPortalGone("dialog");
  await waitForPointerLiberado();
}

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item1", "functional.item2", "functional.item3", "functional.item4",
      "accessibility.item3", "accessibility.item4", "accessibility.item5",
    ],
  },
  render: (args) => {
    const { t } = useTranslation(sheetTranslations);
    return (
      <Sheet
        defaultOpen={args.defaultOpen}
        modal={args.modal}
        // Só o VALOR chega ao espião: o `eventDetails` do base-ui carrega o
        // evento nativo, e a aba Actions estoura SecurityError ao serializar
        // `event.view`. O motivo é lido aqui e guardado como palavra.
        onOpenChange={(open, details) => {
          if (!open) closeReasons.push(dialogCloseReason(details?.reason));
          args.onOpenChange?.(open);
        }}
      >
        <SheetTrigger render={<Button variant="outline" />}>
          {args.triggerLabel}
        </SheetTrigger>
        <SheetContent side={args.side} showCloseButton={args.showCloseButton}>
          <SheetHeader>
            <SheetTitle>{t("demonstration.labels.title")}</SheetTitle>
            <SheetDescription>
              {t("demonstration.labels.description")}
            </SheetDescription>
          </SheetHeader>
          {/* Fixture em pt-BR: story não consome o conteúdo compartilhado, mas
              diz a mesma coisa que "demonstration.labels.body". */}
          <SheetBody>
            <p className="nds-text-body nds-text-muted-foreground">
              Conteúdo do painel: formulário, lista ou mensagem. É esta área que
              rola quando o conteúdo passa da altura da tela.
            </p>
          </SheetBody>
          <SheetFooter>
            <SheetClose render={<Button variant="outline" />}>
              {t("demonstration.labels.cancel")}
            </SheetClose>
            {/*
              A primária CONFIRMA e FECHA, como na referência — e o fecho sai
              `api`, não `close-button`.

              Quem separa os dois caminhos é `markConfirmation()`: a lib entrega
              `close-press` tanto para o Cancelar quanto para esta, e sem a marca
              "confirmou os filtros" chegaria ao relatório como "apertou o botão
              de fechar". O `onClick` de quem compõe é mesclado pela base-ui e
              roda ANTES do fechamento, que é o que torna a marca eficaz.
            */}
            <SheetClose render={<Button />} onClick={() => markConfirmation()}>
              {t("demonstration.labels.apply")}
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: args.triggerLabel });

    await close();
    // Zerado DEPOIS do fechamento de partida: o painel Interactions reexecuta a
    // play no mesmo DOM, e o fecho que prepara o terreno não é um dos caminhos
    // que esta rodada mede.
    closeReasons.length = 0;

    await step("Clicar no gatilho abre o painel, com nome e descrição acessíveis", async () => {
      const callsBefore = (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length;
      const panel = await open(trigger);

      await expect(panel).toBeVisible();
      // O nome acessível vem do aria-labelledby ligado ao id REAL do SheetTitle
      // — painel modal anônimo é o defeito silencioso aqui.
      await expect(panel).toHaveAccessibleName(label("demonstration.labels.title"));
      await expect(panel).toHaveAccessibleDescription(label("demonstration.labels.description"));
      await expect(panel).toHaveAttribute("aria-modal", "true");
      await expect(panel).toHaveAttribute("data-slot", "sheet-content");
      await expect(panel).toHaveAttribute("data-side", args.side);
      await expect(panel).toHaveClass(/nds-sheet-content/);
      await expect(
        (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length,
      ).toBe(callsBefore + 1);
    });

    await step("O painel é portalizado para fora da story", async () => {
      // É o que faz `position: fixed` valer contra a viewport, e não contra um
      // ancestral com `contain`/`transform`.
      const panel = await waitForPortal("dialog");
      await expect(canvasElement.contains(panel)).toBe(false);
      await expect(document.body.contains(panel)).toBe(true);
    });

    await step("O foco entra no painel ao abrir", async () => {
      const panel = await waitForPortal("dialog");
      await waitFor(() => {
        if (!panel.contains(document.activeElement)) {
          throw new Error("o foco não entrou no painel");
        }
      });
    });

    await step("Tab mantém o foco preso dentro do painel", async () => {
      const panel = await waitForPortal("dialog");
      // Voltas suficientes para dar o ciclo completo em qualquer um dos lados.
      for (let i = 0; i < 6; i++) await userEvent.tab();
      // A espera é o mecanismo, não folga: quem dá a volta é uma âncora de foco
      // da lib — um <span> IRMÃO do painel — e o retorno para dentro acontece no
      // tique seguinte. Medido: logo após o Tab que fecha o ciclo o foco está no
      // span, e um quadro depois já está no primeiro botão. Sem a espera, a
      // asserção reprova o transporte em vez do destino; com ela, um foco que
      // realmente escapasse continuaria reprovando, porque nunca voltaria.
      // A ESPERA é a asserção: ela reprova por tempo esgotado se o foco não
      // voltar. Um `expect(panel.contains(document.activeElement))` logo abaixo
      // repetia a condição que a espera acabara de garantir — asserção que não
      // pode reprovar, e que dava ao passo uma aparência de rigor que ele já
      // tinha por outro meio.
      await waitFor(() => {
        if (!panel.contains(document.activeElement)) {
          throw new Error("o foco saiu do painel e não voltou");
        }
      });
    });

    await step("Shift+Tab dá a volta para o outro lado, sem sair do painel", async () => {
      const panel = await waitForPortal("dialog");
      // O par negativo do passo acima: `accessibility.keyboard` documenta as
      // duas direções e só a direta tinha asserção. No sentido inverso o laço
      // passa por um ramo próprio — no Vanilla é literalmente o `if
      // (e.shiftKey)`, que nenhuma story percorria.
      for (let i = 0; i < 6; i++) await userEvent.tab({ shift: true });
      // Mesma espera do sentido direto, e pelo mesmo motivo: a volta passa
      // por uma âncora de foco irmã do painel e o retorno cai no tique
      // seguinte. Foco que escapasse de verdade nunca voltaria, e reprovaria.
      // Mesma leitura do passo anterior: a espera reprova sozinha, e a asserção
      // idêntica logo depois dela não media nada de novo.
      await waitFor(() => {
        if (!panel.contains(document.activeElement)) {
          throw new Error("o foco saiu do painel para trás e não voltou");
        }
      });
    });

    await step("Escape fecha, devolve o foco ao gatilho e relata escape", async () => {
      await close();
      await waitFor(() => {
        if (document.activeElement !== trigger) {
          throw new Error("o foco não voltou ao gatilho");
        }
      });
      await expect(lastCloseReason()).toBe("escape");
    });

    // Os passos do véu e do X NÃO são condicionados a control. Presos a
    // `args.modal`/`args.showCloseButton`, eles sumiam em silêncio para quem
    // mexesse no painel Controls — e sumiam junto com a única prova de C4. As
    // outras stacks sempre os executaram.
    await step("Clique no overlay fecha o painel e relata overlay", async () => {
      await open(trigger);
      const overlay = document.querySelector<HTMLElement>('[data-slot="sheet-overlay"]');
      await expect(overlay).not.toBeNull();
      // `overlay.click()` NÃO serve: a lib dispensa a camada no `pointerdown`,
      // que o `click()` sintético não emite.
      await userEvent.click(overlay!);
      await waitForPortalGone("dialog");
      await expect(lastCloseReason()).toBe("overlay");
    });

    await step("O botão do canto fecha o painel e relata close-button", async () => {
      const panel = await open(trigger);
      const closeBtn = within(panel).getByRole("button", { name: /fechar/i });
      // O X é UM controle de fechar entre os possíveis, e se nomeia como tal.
      await expect(closeBtn.closest('[data-slot="sheet-close"]')).not.toBeNull();
      await userEvent.click(closeBtn);
      await waitForPortalGone("dialog");
      await expect(lastCloseReason()).toBe("close-button");
    });

    await step("Cancelar no rodapé também fecha, e pelo mesmo motivo", async () => {
      const panel = await open(trigger);
      const cancelar = within(panel).getByRole("button", {
        name: label("demonstration.labels.cancel"),
      });
      await userEvent.click(cancelar);
      await waitForPortalGone("dialog");
      await expect(lastCloseReason()).toBe("close-button");
    });

    await step("A ação primária confirma e fecha, e isso se chama api", async () => {
      const panel = await open(trigger);
      const primaria = within(panel).getByRole("button", {
        name: label("demonstration.labels.apply"),
      });
      await userEvent.click(primaria);
      await waitForPortalGone("dialog");
      // O defeito que este passo guarda: sem `markConfirmation()` a lib entrega
      // `close-press` também aqui, e "confirmou os filtros" chegaria ao
      // relatório indistinguível de "apertou o X".
      await expect(lastCloseReason()).toBe("api");
    });

    await step("Nenhum caminho de saída foi relatado por omissão", async () => {
      // A série inteira, e não só a última palavra: é o que impede um motivo de
      // vazar para o caminho vizinho sem ninguém ver.
      await expect(closeReasons).toEqual([
        "escape",
        "overlay",
        "close-button",
        "close-button",
        "api",
      ]);
    });

    // Termina fechado: a próxima rodada da play (painel Interactions) precisa do
    // mesmo ponto de partida desta.
    await close();
  },
};
