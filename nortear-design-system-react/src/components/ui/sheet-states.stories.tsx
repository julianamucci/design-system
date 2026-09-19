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
  sheetSecondPanelSource,
  sheetSource,
} from "./sheet.source";
import {
  dialogCloseReason,
  type DialogCloseReason,
} from "./dialog-close-reason";
import { label } from "./sheet.fixtures";
import { Button } from "./button";
import { useTranslation } from "@/lib/i18n";
import sheetTranslations from "@shared/content/sheet/translations.json";

import { figmaDesign } from "@shared/figma/design-links";
// Fechado e aberto são os dois extremos do ciclo. Fechado o painel nem existe
// no DOM; aberto, o foco entra e fica preso até o fechamento.

const meta = {
  title: "Components/Overlay/Sheet/States",
  tags: ["overlay"],
  component: Sheet,
  parameters: {
    design: figmaDesign("sheet"),
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

/**
 * O que a trava de rolagem escreve, e onde.
 *
 * A lib tranca o elemento que de fato rola a viewport — `<html>` quando ele é o
 * container, `<body>` caso contrário — e escreve INLINE. Ler o estilo inline, e
 * não o computado, é o que separa a trava do componente de um `overflow` que a
 * folha da página já tivesse: com o computado, uma página trancada por CSS
 * faria a asserção passar sem o componente ter feito nada.
 */
function inlineOverflow(): string[] {
  return [document.documentElement.style.overflowY, document.body.style.overflowY];
}

/** Motivos relatados pelo PRIMEIRO painel da story de dois painéis. */
const firstPanelReasons: DialogCloseReason[] = [];

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
      // O nome ESPERADO, e não "algum nome": sem argumento a asserção passa com
      // qualquer palavra — inclusive com o título de outro painel, ou com a
      // descrição no lugar do título. O texto sai do conteúdo compartilhado
      // pela MESMA store de locale que o render lê, então a asserção continua
      // valendo nos três idiomas.
      await expect(panel).toHaveAccessibleName(label("demonstration.labels.title"));
      await expect(panel).toHaveAccessibleDescription(
        label("demonstration.labels.description"),
      );
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
        {/* O corpo é NOMEADO, e é o nome que liga o trio de C7: o primitivo só
            emite `role="group"` quando o `aria-label` vem, então sem nome o
            papel nunca chegava a existir — e nenhuma story das cinco passava um.
            O rótulo é o do vanilla, que é a referência: cinco nomes diferentes
            para o mesmo corpo fariam a comparação entre as páginas deixar de
            responder qualquer coisa. */}
        <SheetBody
          aria-label="Termos de uso"
          className="nds-stack"
          data-spacing="sm"
        >
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

    await step("A região rolável é alcançável por teclado, e se anuncia", async () => {
      // C7 exige os TRÊS juntos, e é por isso que eles são afirmados juntos:
      // caixa que rola é parada de teclado (WCAG 2.1.1, a regra
      // `scrollable-region-focusable` do axe), parada de teclado precisa de
      // papel, e nome em elemento sem papel é atributo proibido — o leitor de
      // tela o descarta. Tirar qualquer um dos três reprova aqui.
      await expect(body).toHaveAttribute("tabindex", "0");
      await expect(body).toHaveAttribute("role", "group");
      await expect(body).toHaveAccessibleName("Termos de uso");
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
            {/* O rodapé tem DOIS botões, como na referência: a saída explícita
                e a ação primária. Com só o Cancelar, o exemplo mostrava um
                painel que não faz nada — e a contagem abaixo, que tem dentes,
                provava justamente o exemplo errado. */}
            <Button>{t("demonstration.labels.apply")}</Button>
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
      // O seletor da própria folha, e não só o papel: o botão do canto é o
      // único elemento que carrega esta classe, então zero dele é a prova
      // direta. Mesma asserção da referência.
      await expect(panel.querySelector(".nds-sheet-close-position")).toBeNull();
    });

    await step("E ainda assim existe uma saída — o rodapé", async () => {
      const footer = panel.querySelector<HTMLElement>('[data-slot="sheet-footer"]');
      await expect(footer).not.toBeNull();
      // O NÚMERO esperado, e por `queryAllByRole`: o `getAllByRole` estoura em
      // zero antes de a comparação acontecer, então `length > 0` nunca podia
      // reprovar — e passaria igual com um rodapé de três botões.
      await expect(within(footer!).queryAllByRole("button")).toHaveLength(2);
      // E a saída é o CANCELAR: o que faz um botão fechar é a marca, não a
      // presença. A primária confirma e não a carrega.
      await expect(
        within(footer!).getByRole("button", { name: label("demonstration.labels.cancel") }),
      ).toHaveAttribute("data-slot", "sheet-close");
      await expect(
        within(footer!).getByRole("button", { name: label("demonstration.labels.apply") }),
      ).not.toHaveAttribute("data-slot", "sheet-close");
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
          {/* `modal` vai EXPLÍCITO: a trava de rolagem desta stack cai de
              `useScrollLock(open && modal === true)`, então é o control que
              decide se C5 vale — e é ele que a play afirma abaixo. */}
          <Sheet modal open={open} onOpenChange={(value) => setOpen(value)}>
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
      // O que a espera NÃO prova, e por isso é o que se afirma: o NÓ do painel
      // saiu do documento, e não só o papel `dialog` — repetir a condição da
      // espera é uma asserção que não pode reprovar.
      await expect(document.querySelector('[data-slot="sheet-content"]')).toBeNull();
    });

    // Lido ANTES de abrir: o que o fechamento tem de devolver é isto, e não a
    // string vazia — a página pode chegar aqui com a rolagem já tratada.
    const overflowAntes = inlineOverflow();

    await step("O estado externo abre o painel", async () => {
      await userEvent.click(externo);
      const panel = await waitForPortal("dialog");
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute("data-slot", "sheet-content");
    });

    await step("Com o painel aberto, a página atrás não rola", async () => {
      // C5. `aria-modal="true"` promete que o resto da página está fora de
      // alcance; sem a trava a promessa é falsa — o leitor de tela não alcança
      // o que está atrás, mas o mouse e a roda alcançam. Até esta rodada só o
      // vanilla afirmava isto.
      await expect(inlineOverflow()).toContain("hidden");
    });

    await step("Fechar por dentro devolve o valor e solta a rolagem", async () => {
      const panel = await waitForPortal("dialog");
      await userEvent.click(within(panel).getByRole("button", { name: /fechar/i }));
      await waitForPortalGone("dialog");
      // Se o callback não tivesse chegado, o estado do pai continuaria `true` e
      // o painel reabriria no próximo render. A espera já provou que o papel
      // sumiu; o que se afirma aqui é o NÓ fora do documento.
      await expect(document.querySelector('[data-slot="sheet-content"]')).toBeNull();
      // E a trava é DEVOLVIDA: uma que ficasse presa deixaria a página inteira
      // sem rolagem depois de um painel fechado, que é o defeito mais caro de
      // notar porque não acontece na tela do componente.
      await waitFor(() => {
        const agora = inlineOverflow();
        if (agora.join("|") !== overflowAntes.join("|")) {
          throw new Error(`a trava de rolagem não foi devolvida: ${agora.join("|")}`);
        }
      });
    });
  },
};

// ─── Dois painéis, e o mais novo manda ────────────────────────────────────────
//
// O Sheet é MODAL: um de cada vez. Abrir o segundo tira o primeiro da tela, e
// essa saída é um fechamento como qualquer outro — precisa dizer por quê. A lib
// desta stack EMPILHA diálogos; quem recolhe o anterior é a guarda do primitivo,
// como na referência, e o painel que sai relata `api`: ninguém o dispensou, foi
// a modalidade do componente que o recolheu.
//
// O botão que abre o segundo mora DENTRO do primeiro painel, e isso é mecânica
// desta stack e não escolha de exemplo: com `modal` ligado a lib marca o resto
// do documento como `inert`, então um botão no canvas ficaria inalcançável pelo
// ponteiro enquanto o primeiro painel estivesse aberto — para a play e para quem
// lê a página. Os dois `Sheet` continuam IRMÃOS no JSX: aninhar o segundo dentro
// do primeiro o desmontaria junto com quem o abriu.

export const SecondPanelClosesFirst: Story = {
  parameters: {
    docs: {
      source: { transform: sheetSecondPanelSource },
      description: {
        story:
          "Dois painéis na mesma página. Abrir o segundo fecha o primeiro, que relata o motivo api — ninguém o dispensou, foi a modalidade do componente que o recolheu.",
      },
    },
  },
  render: () => {
    const TwoPanels = () => {
      const [secondOpen, setSecondOpen] = useState(false);
      return (
        <div className="nds-cluster" data-spacing="md">
          <Sheet
            onOpenChange={(open, details) => {
              // O motivo sai de onde o painel fecha e só é repassado aqui.
              if (!open) firstPanelReasons.push(dialogCloseReason(details?.reason));
            }}
          >
            <SheetTrigger render={<Button variant="outline" />}>
              Abrir o primeiro
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Primeiro painel</SheetTitle>
                <SheetDescription>Este sai de cena quando o outro entra.</SheetDescription>
              </SheetHeader>
              <SheetBody>
                <p className="nds-text-body nds-text-muted-foreground">
                  Abra o segundo painel e este aqui se recolhe.
                </p>
              </SheetBody>
              <SheetFooter>
                <Button variant="outline" onClick={() => setSecondOpen(true)}>
                  Abrir o segundo
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <Sheet open={secondOpen} onOpenChange={(open) => setSecondOpen(open)}>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Segundo painel</SheetTitle>
                <SheetDescription>
                  O mais novo manda: dois painéis modais ao mesmo tempo deixariam um deles
                  inalcançável.
                </SheetDescription>
              </SheetHeader>
              <SheetBody>
                <p className="nds-text-body nds-text-muted-foreground">
                  Este entrou por último, então é este que está na tela.
                </p>
              </SheetBody>
            </SheetContent>
          </Sheet>
        </div>
      );
    };
    return <TwoPanels />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const firstTrigger = canvas.getByRole("button", { name: "Abrir o primeiro" });
    // Zerado aqui, e não no `render`: o render de React reexecuta a cada
    // mudança de estado, e um reset ali apagaria o motivo recém-registrado.
    firstPanelReasons.length = 0;

    await step("O primeiro painel abre sozinho na tela", async () => {
      await userEvent.click(firstTrigger);
      const panel = await waitForPortal("dialog");
      await expect(panel).toHaveAccessibleName("Primeiro painel");
      await expect(firstPanelReasons).toEqual([]);
    });

    await step("Abrir o segundo recolhe o primeiro, e ele diz por quê", async () => {
      const openPanel = await waitForPortal("dialog");
      await userEvent.click(
        within(openPanel).getByRole("button", { name: "Abrir o segundo" }),
      );
      await waitFor(() => {
        const openPanels = document.querySelectorAll('[data-slot="sheet-content"]');
        if (openPanels.length !== 1) {
          throw new Error(`esperava um painel na tela, achei ${openPanels.length}`);
        }
      });
      const panel = document.querySelector<HTMLElement>('[data-slot="sheet-content"]')!;
      await expect(panel).toHaveAccessibleName("Segundo painel");
      // O painel que sai da TELA tem de sair também do analytics. `api` e não
      // `overlay`/`escape`/`close-button`: nenhum gesto da pessoa fechou este
      // painel — foi uma decisão de dentro do componente.
      await expect(firstPanelReasons).toEqual(["api"]);
    });

    await step("Fechado o segundo, não sobra painel nenhum", async () => {
      await userEvent.keyboard("{Escape}");
      await waitForPortalGone("dialog");
      await expect(document.querySelector('[data-slot="sheet-content"]')).toBeNull();
      // E o primeiro não relatou um segundo fechamento: ele já tinha saído.
      await expect(firstPanelReasons).toEqual(["api"]);
    });
  },
};
