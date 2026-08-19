import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { transbordo } from "@shared/testing/scroll-area-probe";
import { ScrollArea, ScrollBar } from "./scroll-area";

const meta = {
  title: "UI/ScrollArea/Variants",
  tags: ["layout"],
  component: ScrollArea,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Variantes de direção do ScrollArea: Vertical (lista longa em altura fixa), Horizontal (cards inline com ScrollBar horizontal) e Both (scroll bidirecional com 2 ScrollBars + Corner).",
      },
    },
  },
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const tags = Array.from({ length: 28 }, (_, i) => i + 1);
const cards = Array.from({ length: 10 }, (_, i) => i + 1);
const rows = Array.from({ length: 12 }, (_, i) => i + 1);
const cols = Array.from({ length: 12 }, (_, i) => i + 1);

/** Barras montadas no DOM, por eixo. */
function barras(raiz: HTMLElement, orientation: "vertical" | "horizontal") {
  return raiz.querySelectorAll(
    `[data-slot="scroll-area-scrollbar"][data-orientation="${orientation}"]`
  );
}

export const Vertical: Story = {
  parameters: {
    covers: ["visual.item1"],
    docs: {
      description: {
        story:
          "Scroll vertical apenas — container pai com altura fixa e ScrollArea ocupando toda a caixa. Lista longa rola sem mover a página.",
      },
    },
  },
  render: () => (
    <div style={{ width: "320px" }}>
      <ScrollArea size="xl" className="nds-w-full nds-rounded-md nds-border-default">
        <div className="nds-p-4" data-spacing="sm">
          {tags.map((n) => (
            <div key={n} className="nds-text-body nds-border-b nds-last-border-0" style={{ paddingBottom: "0.5rem" }}>
              Tag {n}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]'
    )!;

    await step("Rola só na vertical", async () => {
      // A direção nasce do conteúdo: afirmar a classe da barra provaria apenas
      // que alguém escreveu a classe. O que decide é qual eixo transborda.
      const eixos = transbordo(viewport);
      await expect(eixos.y).toBe(true);
      await expect(eixos.x).toBe(false);
    });

    await step("Só a barra vertical é montada", async () => {
      // A lib só monta a barra do eixo que transborda — barra horizontal aqui
      // seria trilha inerte ocupando espaço.
      await expect(barras(canvasElement, "vertical").length).toBe(1);
      await expect(barras(canvasElement, "horizontal").length).toBe(0);
    });
  },
};

export const Horizontal: Story = {
  parameters: {
    covers: ["visual.item2"],
    docs: {
      description: {
        story:
          "Scroll horizontal apenas — faixa de cards com largura de conteúdo, itens que não encolhem e ScrollBar horizontal explícita.",
      },
    },
  },
  render: () => (
    <div style={{ width: "500px" }}>
      <ScrollArea size="sm" className="nds-w-full nds-whitespace-nowrap nds-rounded-md nds-border-default">
        <div className="nds-cluster" style={{width: "max-content", padding: "0.75rem" }} data-spacing="sm">
          {cards.map((n) => (
            <div
              key={n}
              className="nds-cluster nds-rounded-md nds-bg-muted nds-text-body nds-shrink-0" data-align="center" data-justify="center" style={{ height: "120px", width: "140px" }}>
              Card {n}
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]'
    )!;

    await step("Rola só na horizontal", async () => {
      const eixos = transbordo(viewport);
      await expect(eixos.x).toBe(true);
      await expect(eixos.y).toBe(false);
    });

    await step("A barra horizontal é montada e o eixo responde", async () => {
      await expect(barras(canvasElement, "horizontal").length).toBe(1);
      viewport.scrollLeft = 0;
      viewport.scrollLeft = 60;
      await expect(viewport.scrollLeft).toBe(60);
    });
  },
};

export const Both: Story = {
  parameters: {
    covers: ["visual.item3"],
    docs: {
      description: {
        story:
          "Scroll bidirecional — tabela ampla dentro de container fixo; renderiza a barra vertical (automática), a horizontal explícita e o canto.",
      },
    },
  },
  render: () => (
    <div style={{ width: "500px" }}>
      <ScrollArea size="lg" className="nds-w-full nds-rounded-md nds-border-default">
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
  ),
  play: async ({ canvasElement, step }) => {
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]'
    )!;

    await step("Rola nos dois eixos", async () => {
      const eixos = transbordo(viewport);
      await expect(eixos.x).toBe(true);
      await expect(eixos.y).toBe(true);
    });

    await step("As duas barras são montadas", async () => {
      await expect(barras(canvasElement, "vertical").length).toBe(1);
      await expect(barras(canvasElement, "horizontal").length).toBe(1);
    });

    await step("Os dois eixos respondem", async () => {
      viewport.scrollTop = 0;
      viewport.scrollLeft = 0;
      viewport.scrollTop = 40;
      viewport.scrollLeft = 40;
      await expect(viewport.scrollTop).toBe(40);
      await expect(viewport.scrollLeft).toBe(40);
    });
  },
};
