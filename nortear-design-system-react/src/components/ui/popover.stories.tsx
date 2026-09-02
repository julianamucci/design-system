import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, waitFor, screen, fn } from "storybook/test";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./popover";
import { Button } from "./button";
import { popoverSource } from "./popover.source";
import { PopoverDocs } from "@/components/docs/PopoverDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "Primitives/Overlay/Popover",
  component: Popover,
  tags: ["autodocs", "overlay"],
  parameters: {
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

/** O painel mora em portal no body — `screen`, não `within(canvasElement)`. */
function panel(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-slot="popover-content"]');
}

/** Abre só se estiver fechado — a play REEXECUTA no mesmo DOM. */
async function open(trigger: HTMLElement): Promise<HTMLElement> {
  if (trigger.getAttribute("aria-expanded") !== "true") await userEvent.click(trigger);
  await waitFor(() => expect(screen.getByRole("dialog")).toBeVisible());
  return panel()!;
}

/** Fecha só se estiver aberto. */
async function close(trigger: HTMLElement): Promise<void> {
  if (trigger.getAttribute("aria-expanded") === "true") await userEvent.click(trigger);
  await waitFor(() => expect(panel()).toBeNull());
}

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item1", "functional.item2", "functional.item3",
      "accessibility.item4",
    ],
  },
  render: (args) => {
    const { side, align, sideOffset, defaultOpen, modal, onOpenChange } = args as typeof args & {
      side?: "top" | "bottom" | "left" | "right";
      align?: "start" | "center" | "end";
      sideOffset?: number;
      // O tipo da lib entrega `(open, eventDetails)`; o espião recebe SÓ o
      // valor. Dentro de `eventDetails` vem o evento nativo, e a aba Actions
      // estoura um SecurityError ao serializar o `Window` do iframe.
      onOpenChange?: (open: boolean) => void;
    };
    return (
      <div className={`nds-stack ${wrapperClass}`} style={wrapperStyle} data-spacing="md" data-align="center">
        <Popover
          key={`${String(defaultOpen)}-${String(modal)}`}
          defaultOpen={defaultOpen}
          modal={modal}
          onOpenChange={(open) => onOpenChange?.(open)}
        >
          <PopoverTrigger asChild>
            <Button variant="outline">Abrir popover</Button>
          </PopoverTrigger>
          <PopoverContent side={side} align={align} sideOffset={sideOffset}>
            <PopoverHeader>
              <PopoverTitle>Configuracoes de exibição</PopoverTitle>
              <PopoverDescription>
                Ajuste a aparência do conteúdo da página.
              </PopoverDescription>
            </PopoverHeader>
            <div className="nds-cluster" data-justify="end" data-spacing="sm">
              <Button variant="ghost" size="sm">Cancelar</Button>
              <Button size="sm">Salvar</Button>
            </div>
          </PopoverContent>
        </Popover>

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

    await step("O foco entra no painel ao abrir", async () => {
      // É o que separa popover de tooltip: o conteúdo é interativo, então o
      // foco precisa alcançá-lo sem caçar com Tab pela página inteira.
      await waitFor(() => expect(panel()!.contains(document.activeElement)).toBe(true));
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

    // A story termina ABERTA: é o estado que o axe varre e o Chromatic fotografa.
    await step("Estado final: painel aberto", async () => {
      await expect(await open(trigger)).toBeVisible();
    });
  },
};
