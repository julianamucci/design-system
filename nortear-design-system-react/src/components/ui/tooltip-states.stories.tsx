import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within, expect, waitFor, screen } from "storybook/test";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  TOOLTIP_DEFAULT_DELAY,
} from "./tooltip";
import {
  balaoDe,
  bubbleHiddenBy,
  bubbleShownAt,
  movePointer,
  wait,
} from "./tooltip.fixtures";
import { Button } from "./button";
import { Save } from "lucide-react";
import {
  tooltipOpenSource,
  tooltipWithDelaySource,
  tooltipControlledSource,
  tooltipPersistenteSource,
  tooltipSource,
} from "./tooltip.source";

import { figmaDesign } from "@shared/figma/design-links";
// Os estados que o conteúdo compartilhado descreve: fechado (o inicial), aberto,
// aberto por hover (depois do delay do provider) e aberto por foco (na hora). A
// diferença entre os dois últimos é o que a WCAG 1.4.13 cobra: o tooltip não
// pode depender do mouse.

/** Espera em ms que o hover do provider precisa vencer nas stories de delay. */
const LONG_DELAY = 600;

const meta = {
  title: "Components/Overlay/Tooltip/States",
  tags: ["overlay"],
  component: Tooltip,
  decorators: [
    // Sem `delay={0}` (D5): o zero era resíduo, e as stories que precisam de
    // espera declarada trazem provedor próprio logo abaixo. Quem abre na hora
    // abre por foco ou por `defaultOpen`, que não esperam o ponteiro.
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
  parameters: {
    design: figmaDesign("tooltip"),
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: tooltipSource },
      description: {
        component:
          "Fechado é o padrão e o balão nem existe no DOM. Aberto pode vir do estado externo, do hover (depois do delay) ou do foco (imediato). Levar o mouse do gatilho até o balão não fecha nada — é a persistência que a WCAG 1.4.13 exige.",
      },
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  minHeight: 150,
  position: "relative",
};

export const Closed: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Estado padrão — apenas o trigger renderizado; portal vazio (nenhum role=tooltip no DOM).",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="ghost" size="icon" aria-label="Salvar">
              <Save aria-hidden="true" />
            </Button>
          )}
        />
        <TooltipContent>Salvar</TooltipContent>
      </Tooltip>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: /Salvar/i });

    await step("O balão não está no DOM, nem no canvas nem no portal", async () => {
      await expect(trigger).toBeVisible();
      await expect(document.querySelector('[data-slot="tooltip-content"]')).toBeNull();
      await expect(screen.queryByRole("tooltip")).toBeNull();
    });

    await step("Sem balão, não há describedby apontando para o vazio", async () => {
      // Um `aria-describedby` para um id ausente é violação de
      // `aria-valid-attr-value` — o mesmo axe que roda no addon-a11y da story.
      await expect(trigger.getAttribute("aria-describedby")).toBeNull();
    });
  },
};

export const Open: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Tooltip aberto via defaultOpen — Content visível com role=tooltip e aria-describedby ligando trigger ao conteúdo.",
      },
      // O estado inicial aberto é o assunto, e não cabe nos args deste arquivo.
      source: { transform: tooltipOpenSource },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Tooltip defaultOpen>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="ghost" size="icon" aria-label="Salvar">
              <Save aria-hidden="true" />
            </Button>
          )}
        />
        <TooltipContent>Salvar (Ctrl+S)</TooltipContent>
      </Tooltip>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: /Salvar/i });

    await step("O estado inicial abre o balão sem interação nenhuma", async () => {
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      const balao = balaoDe(trigger)!;
      await expect(balao).toHaveAttribute("role", "tooltip");
      await expect(balao).toHaveAttribute("data-slot", "tooltip-content");
      await waitFor(async () => {
        await expect(balao).toBeVisible();
      });
    });

    await step("O balão publica o estado de aberto da própria lib", async () => {
      // `role` e `data-slot` acima são atributos que ESTE design system
      // escreve: afirmá-los prova o nosso markup, não que a lib abriu. O
      // `data-open`/`data-closed` é o par que o base-ui publica no balão, e é
      // ele que o CSS de estado lê. Sem este passo a story não afirmava estado
      // nenhum.
      //
      // `data-instant` fica de fora de propósito: ele só ganha valor quando uma
      // INTERAÇÃO no gatilho o define (espera, dispensa, foco), e um balão que
      // nasce aberto por `defaultOpen` não passa por nenhuma delas — cobrá-lo
      // aqui seria afirmar um atributo que a lib não tem por que escrever.
      const balao = balaoDe(trigger)!;
      await expect(balao).toHaveAttribute("data-open");
      await expect(balao).not.toHaveAttribute("data-closed");
    });

    await step("E o gatilho passa a apontar para ele", async () => {
      await expect(
        document.getElementById(trigger.getAttribute("aria-describedby")!),
      ).toBe(balaoDe(trigger));
    });
  },
};

export const Hover: Story = {
  parameters: {
    covers: ["functional.item1"],
    docs: {
      description: {
        story:
          "Hover no trigger com delay longo — o balão só abre depois da espera do Provider. É o delay que separa passar o mouse de parar sobre o elemento.",
      },
      // O atraso é a lição, e ele mora no provider — fora da raiz do Tooltip.
      source: { transform: tooltipWithDelaySource },
    },
  },
  render: () => (
    // Provider próprio: o delay do decorator é 0, e sem espera não há o que medir.
    <TooltipProvider delay={LONG_DELAY}>
      <div style={wrapperStyle}>
        <Tooltip>
          <TooltipTrigger
            delay={LONG_DELAY}
            render={(props) => (
              <Button {...props} variant="ghost" size="icon" aria-label="Salvar">
                <Save aria-hidden="true" />
              </Button>
            )}
          />
          <TooltipContent>Salvar (Ctrl+S)</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: /Salvar/i });

    await step("O mouse passando não abre — o delay separa passar de parar", async () => {
      await userEvent.hover(trigger);
      await expect(balaoDe(trigger)).toBeNull();
    });

    await step("Parado sobre o gatilho, o balão abre depois do delay", async () => {
      await waitFor(
        async () => {
          await expect(balaoDe(trigger)).not.toBeNull();
        },
        { timeout: LONG_DELAY * 5 },
      );
      await expect(balaoDe(trigger)).toHaveAttribute("role", "tooltip");
    });
  },
};

export const HoverDefaultDelay: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "O atraso quando ninguém escolhe valor: um Provider sem espera declarada espera 300 ms antes de abrir. Passar o mouse por cima não acende balão; parar sobre o gatilho acende.",
      },
    },
  },
  render: () => (
    // Provider SEM `delay`: é o PADRÃO que está sob medição, e o decorator do
    // arquivo passa 0 — daí o provedor próprio. Aninhar governa de verdade: o
    // provedor do base-ui monta o seu grupo de espera, e o gatilho lê o mais
    // interno.
    <TooltipProvider>
      <div style={wrapperStyle}>
        <Tooltip>
          <TooltipTrigger
            render={(props) => (
              <Button {...props} variant="outline" size="icon" aria-label="Salvar">
                <Save aria-hidden="true" />
              </Button>
            )}
          />
          <TooltipContent>Salvar (Ctrl+S)</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: /Salvar/i });

    const start = performance.now();
    await userEvent.hover(trigger);

    await step("Antes de cumprir o atraso padrão, o balão não existe", async () => {
      // PISO em 0,9× o padrão, e não em metade dele: com 150 ms a story passava
      // igual se o atraso caísse para 200, que é praticamente o zero que a D5
      // condena. O piso só tem dentes quando encosta no valor declarado.
      await wait(TOOLTIP_DEFAULT_DELAY * 0.9);
      await expect(balaoDe(trigger)).toBeNull();
    });

    await step("Cumprido o atraso, o balão abre — e não no atraso da lib", async () => {
      const openedAfter =
        (await bubbleShownAt(trigger, TOOLTIP_DEFAULT_DELAY * 6)) - start;
      await expect(openedAfter).toBeLessThan(Number.POSITIVE_INFINITY);
      // TETO em 1,7×, abaixo do `OPEN_DELAY` de 600 do base-ui: se o default
      // deste wrapper sumir, quem assume o lugar é o da lib, e a story reprova
      // em vez de seguir verde medindo "abriu em algum momento". Um teto
      // cravado em 2× encostaria justamente nos 600 e passaria por um triz.
      await expect(openedAfter).toBeLessThan(TOOLTIP_DEFAULT_DELAY * 1.7);
      await expect(balaoDe(trigger)).toHaveAttribute("role", "tooltip");
    });
  },
};

export const KeyboardFocus: Story = {
  parameters: {
    covers: ["functional.item2"],
    docs: {
      description: {
        story:
          "Foco via teclado — WCAG 1.4.13. O foco abre o tooltip sem hover e sem esperar o delay; sair do trigger fecha.",
      },
      // Mesma montagem do atraso: o que a story afirma é que o foco a ignora.
      source: { transform: tooltipWithDelaySource },
    },
  },
  render: () => (
    // Delay longo de propósito: quem chega por teclado não tem como "parar em
    // cima", então esperar aqui esconderia a informação de quem não usa mouse.
    <TooltipProvider delay={LONG_DELAY}>
      <div style={wrapperStyle}>
        <Tooltip>
          <TooltipTrigger
            delay={LONG_DELAY}
            render={(props) => (
              <Button {...props} variant="ghost" size="icon" aria-label="Salvar">
                <Save aria-hidden="true" />
              </Button>
            )}
          />
          <TooltipContent>Salvar (Ctrl+S)</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: /Salvar/i });

    await step("O foco abre na hora, mesmo com o provider pedindo espera", async () => {
      trigger.blur();
      const start = performance.now();
      trigger.focus();
      await expect(trigger).toHaveFocus();
      // Por relógio, e com teto: um `waitFor` de prazo padrão passaria mesmo se
      // o foco tivesse sido preso à espera de 600 ms deste provider — diria
      // "abriu", nunca "abriu na hora". O teto é o atraso PADRÃO do hover: se o
      // foco esperar qualquer coisa parecida com um atraso de ponteiro, reprova.
      const openedAfter = (await bubbleShownAt(trigger, LONG_DELAY * 2)) - start;
      await expect(openedAfter).toBeLessThan(TOOLTIP_DEFAULT_DELAY);
      await expect(balaoDe(trigger)).toHaveAttribute("role", "tooltip");
    });

    await step("Sair do gatilho fecha o balão", async () => {
      trigger.blur();
      await waitFor(async () => {
        await expect(balaoDe(trigger)).toBeNull();
      });
    });
  },
};

export const PersistenceInBubble: Story = {
  parameters: {
    covers: ["functional.item4"],
    docs: {
      description: {
        story:
          "Levar o ponteiro do trigger até o balão não fecha nada — a área de tolerância entre os dois é o que a WCAG 1.4.13 (Hoverable) exige.",
      },
      // Gatilho com texto, e não só-ícone: aqui o balão acrescenta, não nomeia.
      source: { transform: tooltipPersistenteSource },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="outline">
              Compartilhar
            </Button>
          )}
        />
        <TooltipContent side="bottom">
          Cria um link público de leitura
        </TooltipContent>
      </Tooltip>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: /Compartilhar/i });

    await step("O hover abre o balão", async () => {
      // Hover, e não foco: o que se mede aqui é o trajeto do PONTEIRO do
      // gatilho até o balão, e ele precisa começar sobre o gatilho. O prazo
      // acomoda a espera do provedor, que agora é a real e não mais zero.
      trigger.blur();
      await userEvent.hover(trigger);
      await waitFor(
        async () => {
          await expect(balaoDe(trigger)).not.toBeNull();
        },
        { timeout: TOOLTIP_DEFAULT_DELAY * 5 },
      );
    });

    await step("Levar o ponteiro até o balão não fecha nada", async () => {
      // Coordenada ditada à mão, e não `userEvent.hover(balao)`: a folha deixa
      // o balão `pointer-events: none`, e um hover sintético sobre um nó assim
      // chega com clientX/clientY em 0,0 — mediria o ponteiro no canto da tela,
      // não sobre o balão (D2). A tolerância do floating-ui lê COORDENADA.
      const centro = movePointer(balaoDe(trigger)!);
      await expect(centro.x).toBeGreaterThan(0);
      await wait(400);
      await expect(balaoDe(trigger)).not.toBeNull();
    });

    await step("Levar o ponteiro para longe fecha — a tolerância tem limite", async () => {
      // O par com o passo anterior é o que impede a asserção de passar por
      // acidente: se a tolerância nunca fechasse, "continua aberto" não
      // provaria nada, e uma tolerância infinita seria aprovada como acerto.
      //
      // DUAS metades, e as duas são necessárias — medido: o `useHover` do
      // base-ui só solta o balão quando o ponteiro SAI DO GATILHO
      // (`mouseleave`), e a tolerância do floating-ui decide pela COORDENADA.
      // Só o mousemove para longe deixava o gatilho ainda "sob o ponteiro" para
      // a lib, e o balão seguia aberto — foi exatamente assim que este passo
      // reprovou.
      await userEvent.unhover(trigger);
      document.dispatchEvent(
        new MouseEvent("mousemove", { clientX: 0, clientY: 0, bubbles: true }),
      );
      // Relógio com leitura pura, e não `waitFor`: o que se espera é o fim de
      // uma tolerância medida em tempo, e o laço só lê o DOM.
      const fechou = await bubbleHiddenBy(trigger, TOOLTIP_DEFAULT_DELAY * 6);
      await expect(
        fechou,
        "o balão seguiu aberto depois de o ponteiro sair do gatilho e ir para longe — tolerância sem limite",
      ).toBe(true);
    });
  },
};

export const Controlled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Estado controlado via open + onOpenChange. Botões externos abrem e fecham programaticamente.",
      },
      // O painel imprimia `<ControlledDemo />`, que não existe fora da story.
      source: { transform: tooltipControlledSource },
    },
  },
  render: () => {
    const ControlledDemo = () => {
      const [open, setOpen] = useState(false);
      return (
        <div className="nds-stack" data-spacing="sm" style={wrapperStyle}>
          <div className="nds-cluster" data-spacing="md">
            <Button onClick={() => setOpen(true)}>Abrir externamente</Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Fechar externamente
            </Button>
          </div>
          <Tooltip open={open} onOpenChange={setOpen}>
            <TooltipTrigger
              render={(props) => (
                <Button {...props} variant="ghost" size="icon" aria-label="Salvar">
                  <Save aria-hidden="true" />
                </Button>
              )}
            />
            <TooltipContent>Salvar (Ctrl+S)</TooltipContent>
          </Tooltip>
        </div>
      );
    };
    return <ControlledDemo />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    // Dois botões, e não um só que alterna: o `pointerdown` do clique fora
    // dispensa o balão ANTES do `click`, então um toggle leria o estado já
    // invertido pela lib e reabriria o que acabou de fechar.
    await step("Botão externo abre o Tooltip", async () => {
      const open = canvas.getByRole("button", { name: /Abrir externamente/i });
      await userEvent.click(open);
      const trigger = canvas.getByRole("button", { name: /Salvar/i });
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      await expect(balaoDe(trigger)).toHaveAttribute("role", "tooltip");
    });

    await step("Botão externo fecha o Tooltip", async () => {
      const close = canvas.getByRole("button", { name: /Fechar externamente/i });
      await userEvent.click(close);
      await waitFor(async () => {
        await expect(screen.queryByRole("tooltip")).toBeNull();
      });
    });
  },
};
