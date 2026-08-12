import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect, userEvent } from "storybook/test";
import { transbordo } from "@shared/testing/scroll-area-probe";
import { ScrollArea, ScrollBar } from "./scroll-area";
import { ScrollAreaDocs } from "@/components/docs/ScrollAreaDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

type PlaygroundArgs = {
  orientation: "vertical" | "horizontal" | "both";
  itemCount: number;
};

const meta = {
  title: "UI/ScrollArea",
  component: ScrollArea as never,
  tags: ["autodocs", "layout"],
  parameters: {
    layout: "centered",
    docs: { page: withAutoDocsTab(ScrollAreaDocs) },
  },
  argTypes: {
    orientation: {
      control: "radio",
      options: ["vertical", "horizontal", "both"],
      description:
        "Direção do scroll do demo: vertical (lista), horizontal (cards inline) ou both (tabela).",
    },
    itemCount: {
      control: { type: "number", min: 5, max: 60, step: 5 },
      description: "Quantidade de itens no conteúdo (apenas para o demo).",
    },
  },
  args: {
    orientation: "vertical",
    itemCount: 30,
  },
} satisfies Meta<PlaygroundArgs>;

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item1",
      "functional.item3",
      "accessibility.item1",
      "accessibility.item5",
    ],
    // functional.item2 e accessibility.item2 dependem do pegador da barra: ele
    // existe nesta stack, mas só é medido quando a barra está montada. Ficam na
    // story AlwaysVisible, que é a que garante essa condição.
  },
  render: (args) => {
    const { orientation, itemCount } = args;
    const items = Array.from({ length: itemCount }, (_, i) => i + 1);

    if (orientation === "horizontal") {
      return (
        // key re-monta ao mudar a forma do conteúdo do exemplo
        <div
          key={orientation}
          style={{ height: "160px", width: "500px" }}
        >
          <ScrollArea
            className="nds-w-full nds-whitespace-nowrap nds-rounded-md nds-border-default" style={{ height: "100%" }}
          >
            <div className="nds-cluster" style={{width: "max-content", padding: "0.75rem" }} data-spacing="sm" >
              {items.map((n) => (
                <div
                  key={n}
                  className="nds-cluster nds-rounded-md nds-bg-muted nds-text-body nds-shrink-0" data-align="center" data-justify="center" style={{ height: "120px", width: "140px" }}
                >
                  Card {n}
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      );
    }

    if (orientation === "both") {
      const cols = Array.from({ length: 12 }, (_, i) => i + 1);
      const rows = Array.from({ length: Math.max(8, Math.min(itemCount, 20)) }, (_, i) => i + 1);
      return (
        <div
          key={orientation}
          style={{ height: "260px", width: "500px" }}
        >
          <ScrollArea
            className="nds-w-full nds-rounded-md nds-border-default" style={{ height: "100%" }}
          >
            <table className="nds-border-collapse nds-text-caption" style={{ width: "max-content" }}>
              <tbody>
                {rows.map((r) => (
                  <tr key={r}>
                    {cols.map((c) => (
                      <td key={c} className="nds-border-default nds-py-2 nds-whitespace-nowrap" style={{ paddingInline: "0.75rem" }}>
                        R{r}·C{c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      );
    }

    // vertical
    return (
      <div
        key={orientation}
        style={{ height: "300px", width: "320px" }}
      >
        <ScrollArea
          className="nds-w-full nds-rounded-md nds-border-default" style={{ height: "100%" }}
        >
          <div className="nds-p-4" data-spacing="sm">
            {items.map((n) => (
              <div
                key={n}
                className="nds-text-body nds-border-b nds-last-border-0" style={{ paddingBottom: "0.5rem" }}
              >
                Tag {n}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const raiz = canvasElement.querySelector<HTMLElement>('[data-slot="scroll-area"]')!;
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]'
    )!;

    await step("O markup é o mesmo das outras stacks", async () => {
      // Raiz e viewport são dois `<div>` com as classes do design system: é o
      // que faz o CSS compartilhado casar sem wrapper, com lib headless ou sem.
      await expect(raiz.tagName).toBe("DIV");
      await expect(raiz).toHaveClass("nds-scroll-area");
      await expect(viewport.tagName).toBe("DIV");
      await expect(viewport).toHaveClass("nds-scroll-area-viewport");
    });

    await step("A rolagem continua sendo a do navegador", async () => {
      // accessibility.item5: a lib estiliza a barra, não substitui o mecanismo.
      // Overflow rolável no eixo do exemplo é o que preserva roda, teclado e
      // inércia de toque no celular — nada disso é reimplementado em JS.
      //
      // Só o eixo que a story rola: a lib desliga o overflow do eixo sem barra,
      // e afirmar os dois seria afirmar detalhe de implementação de uma lib.
      const estilo = getComputedStyle(viewport);
      const eixo = args.orientation === "horizontal" ? estilo.overflowX : estilo.overflowY;
      await expect(["auto", "scroll"]).toContain(eixo);
      // `touch-action: none` no viewport mataria o gesto de arrastar no celular.
      await expect(estilo.touchAction).not.toBe("none");
    });

    await step("O viewport é alcançável por teclado", async () => {
      // functional.item3: setas e PageUp/PageDown são ação padrão do navegador
      // num elemento rolável COM foco. Evento sintético não dispara ação padrão,
      // então o que se afirma é o contrato que a habilita — e por Tab, não por
      // `.focus()`, porque interessa estar NA ordem de tabulação.
      await expect(viewport).toHaveAttribute("tabindex", "0");
      viewport.blur();
      let alcancado = false;
      for (let i = 0; i < 8 && !alcancado; i++) {
        await userEvent.tab();
        alcancado = document.activeElement === viewport;
      }
      await expect(alcancado).toBe(true);
    });

    await step("O conteúdo rola dentro do viewport, sem mover a página", async () => {
      // functional.item1. A página é o alvo real: rolagem que escapa para o
      // documento é o defeito clássico deste componente.
      const paginaAntes = document.scrollingElement?.scrollTop ?? 0;
      const eixo = args.orientation === "horizontal" ? "scrollLeft" : "scrollTop";
      const eixos = transbordo(viewport);
      await expect(eixo === "scrollLeft" ? eixos.x : eixos.y).toBe(true);

      // Cada passo estabelece a própria precondição: no replay o viewport chega
      // rolado da rodada anterior.
      viewport[eixo] = 0;
      viewport[eixo] = 40;
      await expect(viewport[eixo]).toBe(40);
      await expect(document.scrollingElement?.scrollTop ?? 0).toBe(paginaAntes);
    });

    await step("Nada do conteúdo é escondido de tecnologia assistiva", async () => {
      // O componente estiliza a caixa, não filtra conteúdo: item fora do campo
      // visível continua no DOM e continua anunciável.
      await expect(viewport.getAttribute("aria-hidden")).toBeNull();
      await expect(canvas.getAllByText(/^(Tag|Card|R\d+·C\d+)/).length).toBeGreaterThan(5);
    });
  },
};
