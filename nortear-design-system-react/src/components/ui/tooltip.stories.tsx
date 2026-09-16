import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect, userEvent, waitFor, fn } from "storybook/test";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { balaoDe, cabeNoLado, esperarLado, type Side } from "./tooltip.fixtures";
import { Button } from "./button";
import { Save } from "lucide-react";
import { TooltipDocs } from "@/components/docs/TooltipDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";
import { tooltipSource } from "./tooltip.source";

import { figmaDesign } from "@shared/figma/design-links";
const meta = {
  title: "Components/Overlay/Tooltip",
  component: Tooltip,
  tags: ["autodocs", "overlay"],
  decorators: [
    // Sem `delay={0}`: zero não é atraso, é a AUSÊNCIA dele, e um decorator que
    // o crava faz toda story do arquivo medir um componente que o design system
    // não entrega (D5 do PRD). Story que precisa do balão aberto na hora abre
    // por FOCO ou por `defaultOpen`, que não passam pela espera do ponteiro.
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
  parameters: {
    design: figmaDesign("tooltip"),
    layout: "centered",
    docs: { page: withAutoDocsTab(TooltipDocs), source: { transform: tooltipSource } },
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
      // Gatilho CENTRADO no palco, e não encostado no topo dele: a folga acima
      // passa a ser metade da janela em vez do resto de um palco de 200px, e é
      // o que permite afirmar o lado exato sem depender do tamanho da janela de
      // quem roda a suíte. Antes, o balão virava para `bottom` — corretamente —
      // porque sobravam ~38px para um balão de ~29px mais o vão.
      <div
        className="nds-cluster nds-min-h-50"
        data-align="center"
        data-justify="center"
        style={{ contain: "layout", position: "relative" }}
      >
        <Tooltip
          key={String(defaultOpen)}
          defaultOpen={defaultOpen}
          // Só o valor: o `eventDetails` do base-ui carrega o evento nativo, e
          // a aba Actions estoura SecurityError ao serializar `event.view`.
          onOpenChange={(open) =>
            (onOpenChange as unknown as ((isOpen: boolean) => void) | undefined)?.(open)
          }
        >
          <TooltipTrigger
            render={(props) => (
              <Button {...props} variant="outline" size="icon" aria-label="Salvar">
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
    const trigger = canvas.getByRole("button", { name: /Salvar/i });
    const spy = args.onOpenChange as ReturnType<typeof fn>;

    await step("O gatilho é um botão nativo, alcançável por teclado", async () => {
      // A raiz do base-ui não tem elemento próprio (é só contexto), então o
      // `data-slot="tooltip"` que o Vanilla põe no wrapper não existe aqui — e
      // o `data-slot` do gatilho é o do Button, que vence por ser escrito
      // depois do spread. O que o contrato cobra em todas as stacks é o
      // `data-slot="tooltip-content"` no balão, verificado abaixo.
      await expect(trigger.tagName).toBe("BUTTON");
      await expect(trigger).toBeVisible();
    });

    await step("O gatilho icon-only tem nome acessível próprio", async () => {
      // O Tooltip é complementar: em touch não há hover, e sem o aria-label o
      // botão ficaria anônimo para quem não usa mouse.
      await expect(trigger).toHaveAttribute("aria-label", "Salvar");
    });

    await step("Fechado, não há describedby apontando para o vazio", async () => {
      // `aria-describedby` para um id ausente é violação de
      // `aria-valid-attr-value` — o mesmo axe que roda no addon-a11y da story.
      if (!args.defaultOpen) {
        await expect(trigger.getAttribute("aria-describedby")).toBeNull();
      }
    });

    await step("Focar pelo teclado abre o balão", async () => {
      // `blur()` antes do `focus()`: no replay o gatilho já está focado (o
      // Escape do último passo não tira o foco), e `focus()` num elemento já
      // focado não dispara evento nenhum — o balão nunca reabriria.
      const callsBefore = spy.mock.calls.length;
      trigger.blur();
      trigger.focus();
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      await expect(spy.mock.calls.length).toBeGreaterThan(callsBefore);
    });

    await step("Aberto, o balão é um role=tooltip ligado ao gatilho", async () => {
      const balao = balaoDe(trigger)!;
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
      // É o gancho que o CSS compartilhado lê, e a asserção afirma o lado
      // EXATO. Aceitar `[side, oposto]` passava com ou sem reposicionamento —
      // asserção que não pode reprovar. Aqui não há colisão a provocar virada:
      // o palco tem folga nos quatro lados, então o lado pedido é o lado final.
      // Quem prova a virada é a story `Collision`, no arquivo de composições.
      const side = ((args as { side?: Side }).side ?? "top") as Side;
      const balao = balaoDe(trigger)!;
      // Esperar o VALOR, e não a existência do atributo: ele nasce com o lado
      // pedido e só assenta quando o posicionador mede, no quadro seguinte.
      const lado = await esperarLado(balao, side);
      // A PREMISSA antes do resultado: sem folga, o base-ui vira o balão e está
      // certo, e a story estaria medindo a janela do runner. Com os números na
      // mensagem — palco apertado reprova dizendo o que faltou, em vez de
      // voltar para `[lado, oposto]`, que passa de qualquer jeito.
      const { folga, preciso, viewport } = cabeNoLado(trigger, balao, side);
      await expect(
        folga,
        `sem folga em "${side}": ${Math.round(folga)}px livres para um balão que precisa de ${Math.round(preciso)}px (janela ${viewport}) — abra espaço em volta do gatilho`,
      ).toBeGreaterThanOrEqual(preciso);
      await expect(lado).toBe(side);
    });

    await step("Escape fecha e o foco fica onde estava", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(async () => {
        await expect(balaoDe(trigger)).toBeNull();
      });
      await expect(trigger).toHaveFocus();
      await expect(trigger.getAttribute("aria-describedby")).toBeNull();
    });
  },
};
