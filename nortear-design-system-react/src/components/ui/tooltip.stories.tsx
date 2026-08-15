import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect, userEvent, waitFor, fn } from "storybook/test";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { Button } from "./button";
import { Save } from "lucide-react";
import { TooltipDocs } from "@/components/docs/TooltipDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

/** O balão vive num portal no `body` — o caminho até ele é o aria-describedby. */
function balaoDe(gatilho: HTMLElement): HTMLElement | null {
  const id = gatilho.getAttribute("aria-describedby");
  return id ? document.getElementById(id) : null;
}

/**
 * De que lado o balão nasceu.
 *
 * Divergência de lib, registrada e não "alinhada": o `@base-ui/react` publica
 * `data-side` no POSICIONADOR (`.nds-tooltip-positioner`), enquanto reka-ui,
 * bits-ui, radix-ng e a factory do Vanilla publicam no próprio balão. Subir
 * até o `[data-side]` mais próximo lê o gancho onde quer que ele esteja.
 */
function ladoDe(balao: HTMLElement | null): string | null {
  return balao?.closest("[data-side]")?.getAttribute("data-side") ?? null;
}

const meta = {
  title: "UI/Tooltip",
  component: Tooltip,
  tags: ["autodocs", "overlay"],
  decorators: [
    (Story) => (
      <TooltipProvider delay={0}>
        <Story />
      </TooltipProvider>
    ),
  ],
  parameters: {
    layout: "centered",
    docs: { page: withAutoDocsTab(TooltipDocs) },
  },
  argTypes: {
    side: {
      control: { type: "radio" },
      options: ["top", "bottom", "left", "right"],
      description: "Lado preferido de abertura do Content (auto-flip on collision).",
      table: { type: { summary: '"top" | "right" | "bottom" | "left"' }, defaultValue: { summary: '"top"' } },
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
    defaultOpen: {
      control: "boolean",
      description: "Estado inicial em modo não-controlado.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    // Espião de callback. Sem entrada aqui a prop ficaria fora da aba API
    // Reference (rule `arg_without_argtype`); `control: false` porque o valor é
    // uma função, não algo que se escolhe no painel.
    onOpenChange: {
      control: false,
      description: "Disparado a cada abertura ou fechamento, com o novo estado.",
      table: { type: { summary: "(open: boolean) => void" } },
    },
  } as Meta<typeof Tooltip>["argTypes"],
  args: {
    side: "top",
    align: "center",
    sideOffset: 4,
    defaultOpen: false,
    onOpenChange: fn(),
  } as Meta<typeof Tooltip>["args"],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item2", "functional.item3",
      "accessibility.item1", "accessibility.item3",
      "accessibility.item4", "accessibility.item5",
    ],
  },
  render: (args) => {
    const { side, align, sideOffset, defaultOpen, onOpenChange } =
      args as typeof args & {
        side?: "top" | "bottom" | "left" | "right";
        align?: "start" | "center" | "end";
        sideOffset?: number;
      };
    return (
      <div style={{ contain: "layout", minHeight: 150, position: "relative" }}>
        <Tooltip
          key={String(defaultOpen)}
          defaultOpen={defaultOpen}
          // Só o valor: o `eventDetails` do base-ui carrega o evento nativo, e
          // a aba Actions estoura SecurityError ao serializar `event.view`.
          onOpenChange={(open) =>
            (onOpenChange as unknown as ((aberto: boolean) => void) | undefined)?.(open)
          }
        >
          <TooltipTrigger
            render={(props) => (
              <Button {...props} variant="ghost" size="icon" aria-label="Salvar">
                <Save aria-hidden="true" />
              </Button>
            )}
          />
          <TooltipContent side={side} align={align} sideOffset={sideOffset}>
            Salvar (Ctrl+S)
          </TooltipContent>
        </Tooltip>
      </div>
    );
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole("button", { name: /Salvar/i });
    const espiao = args.onOpenChange as ReturnType<typeof fn>;

    await step("O gatilho é um botão nativo, alcançável por teclado", async () => {
      // A raiz do base-ui não tem elemento próprio (é só contexto), então o
      // `data-slot="tooltip"` que o Vanilla põe no wrapper não existe aqui — e
      // o `data-slot` do gatilho é o do Button, que vence por ser escrito
      // depois do spread. O que o contrato cobra em todas as stacks é o
      // `data-slot="tooltip-content"` no balão, verificado abaixo.
      await expect(gatilho.tagName).toBe("BUTTON");
      await expect(gatilho).toBeVisible();
    });

    await step("O gatilho icon-only tem nome acessível próprio", async () => {
      // O Tooltip é complementar: em touch não há hover, e sem o aria-label o
      // botão ficaria anônimo para quem não usa mouse.
      await expect(gatilho).toHaveAttribute("aria-label", "Salvar");
    });

    await step("Fechado, não há describedby apontando para o vazio", async () => {
      // `aria-describedby` para um id ausente é violação de
      // `aria-valid-attr-value` — o mesmo axe que roda no addon-a11y da story.
      if (!args.defaultOpen) {
        await expect(gatilho.getAttribute("aria-describedby")).toBeNull();
      }
    });

    await step("Focar pelo teclado abre o balão", async () => {
      // `blur()` antes do `focus()`: no replay o gatilho já está focado (o
      // Escape do último passo não tira o foco), e `focus()` num elemento já
      // focado não dispara evento nenhum — o balão nunca reabriria.
      const chamadasAntes = espiao.mock.calls.length;
      gatilho.blur();
      gatilho.focus();
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
      await expect(espiao.mock.calls.length).toBeGreaterThan(chamadasAntes);
    });

    await step("Aberto, o balão é um role=tooltip ligado ao gatilho", async () => {
      const balao = balaoDe(gatilho)!;
      await expect(balao).toHaveAttribute("role", "tooltip");
      await expect(balao).toHaveAttribute("data-slot", "tooltip-content");
      await expect(balao.textContent).toContain("Salvar (Ctrl+S)");
      // O balão nasce no portal, no <body> — fora do canvas da story.
      await expect(canvasElement.contains(balao)).toBe(false);
      await waitFor(async () => {
        await expect(balao).toBeVisible();
      });
    });

    await step("O lado pedido chega ao balão como data-side", async () => {
      // É o gancho que o CSS compartilhado lê. Auto-flip por colisão pode
      // devolver o lado oposto quando falta espaço — comportamento, não defeito.
      const oposto = { top: "bottom", bottom: "top", left: "right", right: "left" } as const;
      const lado = (args as { side?: keyof typeof oposto }).side ?? "top";
      await waitFor(async () => {
        await expect(ladoDe(balaoDe(gatilho))).toBeTruthy();
      });
      await expect([lado, oposto[lado]]).toContain(ladoDe(balaoDe(gatilho)));
    });

    await step("Escape fecha e o foco fica onde estava", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).toBeNull();
      });
      await expect(gatilho).toHaveFocus();
      await expect(gatilho.getAttribute("aria-describedby")).toBeNull();
    });
  },
};
