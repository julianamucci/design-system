import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, waitFor, screen, fn } from "storybook/test";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./popover";
import { Button } from "./button";
import { close, open, panel } from "./popover.fixtures";
import { popoverSource } from "./popover.source";
import { PopoverDocs } from "@/components/docs/PopoverDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

import { figmaDesign } from "@shared/figma/design-links";
const meta = {
  title: "Components/Overlay/Popover",
  component: Popover,
  tags: ["autodocs", "overlay"],
  parameters: {
    design: figmaDesign("popover"),
    layout: "centered",
    docs: { page: withAutoDocsTab(PopoverDocs), source: { transform: popoverSource } },
  },
  argTypes: {
    side: {
      control: { type: "radio" },
      options: ["top", "bottom", "left", "right"],
      description: "Lado preferido de abertura do Content (auto-flip on collision).",
      table: { type: { summary: '"top" | "bottom" | "left" | "right"' }, defaultValue: { summary: '"bottom"' } },
    },
    align: {
      control: { type: "radio" },
      options: ["start", "center", "end"],
      description: "Alinhamento ao longo do eixo do side.",
      table: { type: { summary: '"start" | "center" | "end"' }, defaultValue: { summary: '"center"' } },
    },
    sideOffset: {
      control: { type: "number" },
      description: "Distância em pixels entre trigger e content.",
      table: { type: { summary: "number" }, defaultValue: { summary: "4" } },
    },
    alignOffset: {
      control: { type: "number" },
      description: "Deslocamento em pixels ao longo do eixo do alinhamento.",
      table: { type: { summary: "number" }, defaultValue: { summary: "0" } },
    },
    defaultOpen: {
      control: "boolean",
      description: "Estado inicial em modo não-controlado.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    modal: {
      control: "boolean",
      description: "Quando true, trapeia foco e bloqueia scroll do body.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    onOpenChange: {
      control: false,
      description: "Callback disparado a cada abertura e fechamento, com o novo estado.",
      table: { type: { summary: "(open: boolean) => void" } },
    },
  },
  args: {
    side: "bottom",
    align: "center",
    sideOffset: 4,
    alignOffset: 0,
    defaultOpen: false,
    modal: false,
    onOpenChange: fn(),
  },
} as Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A altura mínima sai da escada de utilitárias, não de um valor cravado:
 *  inline vence a folha, e a medida sairia do tema e da densidade junto. */
const wrapperClass = "nds-min-h-70";
const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  position: "relative",
};

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item1", "functional.item2", "functional.item3",
      "accessibility.item4",
    ],
  },
  render: (args) => {
    const { side, align, sideOffset, alignOffset, defaultOpen, modal, onOpenChange } = args as typeof args & {
      side?: "top" | "bottom" | "left" | "right";
      align?: "start" | "center" | "end";
      sideOffset?: number;
      alignOffset?: number;
      // O tipo da lib entrega `(open, eventDetails)`; o espião recebe SÓ o
      // valor. Dentro de `eventDetails` vem o evento nativo, e a aba Actions
      // estoura um SecurityError ao serializar o `Window` do iframe.
      onOpenChange?: (open: boolean) => void;
    };
    // CONTROLADO por causa do Salvar: confirmar fecha por CÓDIGO, e código só
    // tem como fechar se o estado for de quem compõe. Era `defaultOpen` puro
    // até 2026-09-13, e o `defaultOpen` continua sendo o valor INICIAL —
    // o `key` remonta quando o control muda, como antes.
    const PlaygroundDemo = () => {
      const [open, setOpen] = useState(Boolean(defaultOpen));
      return (
        <Popover
          open={open}
          modal={modal}
          onOpenChange={(next) => { setOpen(next); onOpenChange?.(next); }}
        >
          <PopoverTrigger asChild>
            <Button variant="outline">Abrir popover</Button>
          </PopoverTrigger>
          <PopoverContent
            side={side}
            align={align}
            sideOffset={sideOffset}
            alignOffset={alignOffset}
          >
            <PopoverHeader>
              <PopoverTitle>Configurações de exibição</PopoverTitle>
              <PopoverDescription>
                Ajuste a aparência do conteúdo da página.
              </PopoverDescription>
            </PopoverHeader>
            {/* As duas ações fecham, por CAMINHOS diferentes, e a diferença é o
                que separa desistiu de concluiu no relatório:

                  Cancelar → `PopoverClose`, e o motivo é `close-button`
                  Salvar   → código, depois de salvar, e o motivo é `api`

                Um "Cancelar" que não fecha é promessa de saída não cumprida — o
                defeito visto na tela em 2026-09-12. Um "Salvar" que fecha COMO
                se fosse o botão de fechar é o mesmo evento para os dois
                desfechos, e apaga o sinal que justifica o campo existir. */}
            <div className="nds-cluster" data-justify="end" data-spacing="sm">
              <PopoverClose asChild>
                <Button variant="ghost" size="sm">Cancelar</Button>
              </PopoverClose>
              <Button
                size="sm"
                onClick={() => { setOpen(false); onOpenChange?.(false); }}
              >Salvar</Button>
            </div>
          </PopoverContent>
        </Popover>
      );
    };
    return (
      <div className={`nds-stack ${wrapperClass}`} style={wrapperStyle} data-spacing="md" data-align="center">
        <PlaygroundDemo key={`${String(defaultOpen)}-${String(modal)}`} />

        {/* Alvo inerte para a dispensa por clique fora: clicar em `document.body`
            depende da geometria da página e do ponto exato do clique sintético. */}
        <p className="nds-text-body nds-text-muted-foreground" data-testid="area-externa">
          Área externa
        </p>
      </div>
    );
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: /Abrir popover/i });

    await step("O gatilho anuncia que abre um diálogo", async () => {
      await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
      await expect(trigger.tagName).toBe("BUTTON");
    });

    await step("Clicar no gatilho abre o painel com role=dialog", async () => {
      await close(trigger);
      const antes = (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length;
      const p = await open(trigger);
      await expect(p).toHaveClass(/nds-popover-content/);
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await expect(
        (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length,
      ).toBe(antes + 1);
    });

    await step("O painel é nomeado pelo título e descrito pela descrição", async () => {
      const dialogo = screen.getByRole("dialog");
      const idTitle = dialogo.getAttribute("aria-labelledby");
      await expect(idTitle).toBeTruthy();
      await expect(document.getElementById(idTitle!)).toHaveAttribute(
        "data-slot", "popover-title",
      );
      const idDescription = dialogo.getAttribute("aria-describedby");
      await expect(idDescription).toBeTruthy();
      await expect(document.getElementById(idDescription!)).toHaveAttribute(
        "data-slot", "popover-description",
      );
    });

    await step("O painel não é modal", async () => {
      // Popover não bloqueia o resto da página: `aria-modal` faria o leitor de
      // tela esconder tudo o que está fora dele, que é contrato de Dialog.
      await expect(panel()).not.toHaveAttribute("aria-modal");
    });

    await step("Ao abrir, o foco vai ao PRIMEIRO focável do painel", async () => {
      // É o que separa popover de tooltip: o conteúdo é interativo, então o
      // foco precisa alcançá-lo sem caçar com Tab pela página inteira.
      //
      // E o alvo é EXATO, não "algum lugar dentro do painel": `contains` é
      // verdade no modo modal e no não-modal, com política de foco e sem
      // nenhuma — a asserção passava com qualquer elemento focado. Aqui o
      // primeiro focável é o Cancelar do rodapé, e é o contrato de
      // `accessibility.item4` sem a marca de `data-autofocus`.
      const p = await open(trigger);
      await waitFor(() => expect(p.contains(document.activeElement)).toBe(true));
      await expect(within(p).getByRole("button", { name: /Cancelar/i })).toHaveFocus();
    });

    await step("E `data-autofocus` VENCE o primeiro focável, mesmo com tabindex=-1", async () => {
      // A outra metade de `accessibility.item4`, que o `covers` desta story
      // reivindica desde que o conteúdo passou a nomear o atributo.
      //
      // O alvo marcado é o TÍTULO, com `tabindex="-1"`: não é o primeiro
      // focável (nem sequer tabulável), então a asserção só passa se a marca for
      // lida — e lida SEM o filtro da lista de tabuláveis, que exclui
      // `tabindex="-1"` de propósito. Uma implementação que passasse a marca
      // pela lista de focáveis cairia no Cancelar e reprovaria aqui.
      //
      // A marca é posta QUANDO o painel monta, e não no painel aberto antes de
      // fechar: fechar desmonta o conteúdo, a reabertura cria nós novos, e um
      // atributo escrito no nó anterior some com ele.
      //
      // Mesmo mecanismo das outras quatro, com a premissa medida NESTA lib: a
      // base-ui 1.7.0 não lê o `initialFocus` no efeito de layout. O
      // `useIsoLayoutEffect` de `FloatingFocusManager.mjs:352` só ENFILEIRA um
      // `queueMicrotask` (`:362`), e é dentro dele que a função é chamada
      // (`:364`); o foco em si sai num `requestAnimationFrame`
      // (`enqueueFocus.mjs:22`). A inserção do painel acontece na fase de
      // mutação do commit, ANTES dos efeitos de layout, então a notificação do
      // observador é microtarefa enfileirada antes da que resolve o alvo.
      await close(trigger);
      const marked: HTMLElement[] = [];
      // TODOS os títulos de painel, e não só o de `panel()`: um painel ainda em
      // saída pode continuar no DOM, e a primeira ocorrência seria ele.
      const mark = () => {
        const titles = document.querySelectorAll<HTMLElement>(
          '[data-slot="popover-content"] [data-slot="popover-title"]:not([data-autofocus])',
        );
        for (const title of titles) {
          title.setAttribute("tabindex", "-1");
          title.setAttribute("data-autofocus", "");
          marked.push(title);
        }
      };
      const observer = new MutationObserver(mark);
      let openPanel: HTMLElement | null = null;
      try {
        // `data-slot` também: onde ele é escrito por binding, pode chegar
        // depois da inserção do nó.
        //
        // E NÃO `data-state`, que o svelte precisou acrescentar em 2026-09-17 —
        // premissa medida aqui, e é ela que dispensa o atributo: o `close()` das
        // fixtures espera `panel()` virar `null`, ou seja o nó FORA do DOM.
        // Reabrir depois disso é sempre uma INSERÇÃO, que o `childList` pega; o
        // que quebrou lá foi o `closed()` tolerar o painel ainda no DOM com
        // `data-state="closed"`, e aí o bits reusava o nó sem inserir nada.
        //
        // A premissa se cobra sozinha: se a lib passar a manter o painel montado
        // ao fechar, é o `close()` que estoura por tempo — ruidosamente —, e não
        // este passo que fica verde medindo menos. Se algum dia a espera for
        // afrouxada, o filtro tem de crescer junto.
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["data-slot"],
        });
        openPanel = await open(trigger);
        const title = openPanel.querySelector<HTMLElement>('[data-slot="popover-title"]')!;
        await expect(title).toHaveAttribute("data-autofocus");
        await waitFor(() => expect(title).toHaveFocus());
      } finally {
        observer.disconnect();
        // O foco sai do título ANTES de a marca sair: tirar o `tabindex` de um
        // elemento focado joga o foco no `body`, e foco fora do painel o
        // dispensa. O estado final é o do passo anterior — aberto, foco no
        // Cancelar —, e o replay do painel Interactions parte dele.
        if (openPanel?.isConnected) {
          within(openPanel).queryByRole("button", { name: /Cancelar/i })?.focus();
        }
        for (const el of marked) {
          el.removeAttribute("data-autofocus");
          el.removeAttribute("tabindex");
        }
      }
    });

    await step("Escape fecha e devolve o foco ao gatilho", async () => {
      await open(trigger);
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(panel()).toBeNull());
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await waitFor(() => expect(trigger).toHaveFocus());
    });

    await step("Clicar fora fecha o painel", async () => {
      await open(trigger);
      await userEvent.click(canvas.getByTestId("area-externa"));
      await waitFor(() => expect(panel()).toBeNull());
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    await step("O controle de fechar do rodapé fecha o painel", async () => {
      // O motivo que chega ao `onOpenChange` é o assunto da story CloseButton,
      // em States: aqui o espião recebe só o estado, porque serializar o
      // `eventDetails` na aba Actions estoura SecurityError.
      const p = await open(trigger);
      await userEvent.click(within(p).getByRole("button", { name: /Cancelar/i }));
      await waitFor(() => expect(panel()).toBeNull());
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    // A story termina ABERTA: é o estado que o axe varre e o Chromatic fotografa.
    await step("Estado final: painel aberto", async () => {
      await expect(await open(trigger)).toBeVisible();
    });
  },
};
