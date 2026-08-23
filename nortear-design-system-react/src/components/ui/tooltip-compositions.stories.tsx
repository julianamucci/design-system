import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect, waitFor } from "storybook/test";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { balaoDe } from "./tooltip.fixtures";
import { Button } from "./button";
import { Save, Trash2, Share2 } from "lucide-react";
import {
  barTooltipShortcutSource,
  iconsTooltipBarSource,
  tooltipLadosSource,
  tooltipSource,
} from "./tooltip.source";

// As composições que o conteúdo compartilhado documenta. Todas repetem a mesma
// regra: o Tooltip acrescenta contexto a um elemento que JÁ se explica sozinho —
// nunca é o único portador da informação.

/**
 * De que lado o balão nasceu.
 *
 * Divergência de lib, registrada e não "alinhada": o `@base-ui/react` publica
 * `data-side` no POSICIONADOR (`.nds-tooltip-positioner`), enquanto reka-ui,
 * bits-ui, radix-ng e a factory do Vanilla publicam no próprio balão.
 */
function sideOf(balao: HTMLElement | null): string | null {
  return balao?.closest("[data-side]")?.getAttribute("data-side") ?? null;
}

const meta = {
  title: "UI/Tooltip/Compositions",
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
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: tooltipSource },
      description: {
        component:
          "Barra de ações icon-only, botão de ação rápida com atalho e os quatro lados de posicionamento.",
      },
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  minHeight: 200,
  position: "relative",
};

export const IconBarToolbar: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Toolbar de ações icon-only — cada Button tem aria-label próprio (mobile sem hover) e Tooltip complementar com a mesma label.",
      },
      // Três gatilhos numa barra: a repetição é a lição, não o balão sozinho.
      source: { transform: iconsTooltipBarSource },
    },
  },
  render: () => (
    <div
      style={wrapperStyle}
      className="nds-cluster nds-rounded-md nds-border-default nds-p-1 nds-bg-card"
      data-align="center"
      data-spacing="xs"
    >
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

      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="ghost" size="icon" aria-label="Compartilhar">
              <Share2 aria-hidden="true" />
            </Button>
          )}
        />
        <TooltipContent>Compartilhar</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="ghost" size="icon" aria-label="Excluir">
              <Trash2 aria-hidden="true" />
            </Button>
          )}
        />
        <TooltipContent>Excluir</TooltipContent>
      </Tooltip>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await step("Todos os botões têm aria-label próprio", async () => {
      const buttons = canvasElement.querySelectorAll("button[aria-label]");
      await expect(buttons.length).toBe(3);
      await expect(buttons[0]).toHaveAttribute("aria-label", "Salvar");
      await expect(buttons[1]).toHaveAttribute("aria-label", "Compartilhar");
      await expect(buttons[2]).toHaveAttribute("aria-label", "Excluir");
    });
  },
};

export const WithKeyboardShortcut: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Botão de ação rápida com hotkey — o aria-label sozinho já diz o que o botão faz; o Tooltip acrescenta a tecla, que é conveniência.",
      },
      // O par de <kbd> dentro do balão é composição, não argumento.
      source: { transform: barTooltipShortcutSource },
    },
  },
  render: () => (
    <div style={wrapperStyle} className="nds-cluster" data-align="center" data-spacing="xs">
      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="ghost" size="icon" aria-label="Salvar">
              <Save aria-hidden="true" />
            </Button>
          )}
        />
        <TooltipContent side="bottom">
          <span>Salvar</span>
          <kbd className="nds-kbd" data-slot="kbd">Ctrl</kbd>
          <kbd className="nds-kbd" data-slot="kbd">S</kbd>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Salvar" });

    await step("O nome acessível é do botão; o atalho é o extra", async () => {
      await expect(trigger).toHaveAttribute("aria-label", "Salvar");
      trigger.blur();
      trigger.focus();
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      await expect(balaoDe(trigger)!.querySelectorAll("kbd").length).toBe(2);
    });
  },
};

export const PlacementSides: Story = {
  parameters: {
    covers: ["visual.item3"],
    docs: {
      description: {
        story:
          "Quatro tooltips abertos lado a lado mostrando side=top/right/bottom/left. O auto-flip por colisão pode trocar o lado quando falta espaço.",
      },
      // Os quatro lados juntos: um `side` sozinho prometeria o que não garante.
      source: { transform: tooltipLadosSource },
    },
  },
  render: () => (
    <div
      className="nds-grid nds-p-8"
      data-spacing="xl"
      data-cols="2"
      style={{ contain: "layout", minHeight: 280, position: "relative" }}
    >
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Tooltip key={side} defaultOpen>
          <TooltipTrigger
            render={(props) => (
              <Button {...props} variant="outline" aria-label={side}>
                {side}
              </Button>
            )}
          />
          <TooltipContent side={side}>Tooltip {side}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  ),
  play: async ({ step }) => {
    const oposto: Record<string, string> = {
      top: "bottom", bottom: "top", left: "right", right: "left",
    };
    const baloes = () =>
      Array.from(
        document.querySelectorAll<HTMLElement>('[data-slot="tooltip-content"]'),
      );

    await step("Os quatro balões abrem ao mesmo tempo", async () => {
      await waitFor(async () => {
        await expect(baloes().length).toBe(4);
      });
    });

    await step("Cada balão nasce do lado pedido, ou do oposto quando falta espaço", async () => {
      for (const side of ["top", "right", "bottom", "left"]) {
        // O texto identifica o balão sem depender do gatilho: aqui o que
        // interessa é de onde ele nasceu, não a ponte de acessibilidade.
        const balao = baloes().find((b) => b.textContent?.includes(`Tooltip ${side}`));
        await expect(balao).toBeTruthy();
        // Esperar o `data-side`, e não só o elemento: o balão entra no DOM
        // antes de o posicionador medir, e nesse intervalo o atributo é nulo.
        await waitFor(async () => {
          await expect(sideOf(balao!)).toBeTruthy();
        });
        // O auto-flip por colisão é comportamento documentado: perto da borda o
        // balão troca para o lado oposto em vez de sair da tela.
        await expect([side, oposto[side]]).toContain(sideOf(balao!));
      }
    });
  },
};
