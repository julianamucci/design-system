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
import { balaoDe } from "./tooltip.fixtures";
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

/** Pausa explícita — usada só onde a asserção é "continua assim depois de X". */
function wait(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

/**
 * Instante em que o balão apareceu, por relógio.
 *
 * Laço de relógio, e não `waitFor`: o que se afirma aqui é TEMPO, e o `waitFor`
 * reagenda por observador de mutação — um prazo dele diria "apareceu em algum
 * momento", que é justamente o que não distingue 300 ms de 600. O laço só LÊ
 * (`aria-describedby` + `getElementById`), sem tocar no DOM, então não há como
 * a própria tentativa provocar a seguinte.
 *
 * Passo de 10 ms porque a medição é de borda: o limite superior da asserção é o
 * default de 600 da biblioteca, e granularidade grossa comeria a margem.
 */
async function bubbleShownAt(
  trigger: HTMLElement,
  budget: number,
): Promise<number> {
  const deadline = performance.now() + budget;
  while (performance.now() < deadline) {
    if (balaoDe(trigger) !== null) {
      return performance.now();
    }
    await wait(10);
  }
  return Number.POSITIVE_INFINITY;
}

const meta = {
  title: "Components/Overlay/Tooltip/States",
  tags: ["overlay"],
  component: Tooltip,
  decorators: [
    (Story) => (
      <TooltipProvider delay={0}>
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
      await wait(TOOLTIP_DEFAULT_DELAY / 2);
      // Se o padrão voltasse a ser zero, o balão já estaria aqui: com espera
      // nenhuma a lib abre no primeiro movimento do ponteiro.
      await expect(balaoDe(trigger)).toBeNull();
    });

    await step("Cumprido o atraso, o balão abre — e não no atraso da lib", async () => {
      const openedAfter =
        (await bubbleShownAt(trigger, TOOLTIP_DEFAULT_DELAY * 6)) - start;
      await expect(openedAfter).toBeLessThan(Number.POSITIVE_INFINITY);
      // O teto é o `OPEN_DELAY` do base-ui, que é 600: se o default do wrapper
      // desaparecer, o valor que assume o lugar é esse, e a story reprova em
      // vez de continuar verde medindo "abriu em algum momento".
      await expect(openedAfter).toBeLessThan(TOOLTIP_DEFAULT_DELAY * 2);
      await expect(balaoDe(trigger)).toHaveAttribute("role", "tooltip");
    });
  },
};

export const Focused: Story = {
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
      await userEvent.hover(trigger);
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
    });

    await step("Levar o ponteiro até o balão não fecha nada", async () => {
      const balao = balaoDe(trigger)!;
      // `pointerEventsCheck: 0` porque a folha compartilhada deixa o balão
      // `pointer-events: none` — quem segura a abertura é a área de tolerância
      // entre gatilho e balão, calculada por coordenada, não por hover no nó.
      await userEvent.hover(balao, { pointerEventsCheck: 0 });
      await wait(200);
      await expect(balaoDe(trigger)).not.toBeNull();
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
