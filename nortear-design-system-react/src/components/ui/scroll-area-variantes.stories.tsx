import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import { ScrollArea, ScrollBar } from "./scroll-area";

const meta = {
  title: "UI/ScrollArea/Variantes",
  tags: ["layout"],
  component: ScrollArea,
  parameters: {
    layout: "centered",
    controls: { disable: true },
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

export const Vertical: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Scroll vertical apenas — container pai com h-[300px], ScrollArea com h-full w-full. Lista longa rola sem mover a página.",
      },
    },
  },
  render: () => (
    <div className="" style={{ height: "300px", width: "320px" }}>
      <ScrollArea className="nds-w-full nds-rounded-md nds-border-default" style={{ height: "100%" }}>
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
    const canvas = within(canvasElement);
    await step("Apenas a scrollbar vertical é renderizada", async () => {
      const bars = canvasElement.querySelectorAll(
        '[data-slot="scroll-area-scrollbar"][data-orientation="vertical"]'
      );
      await expect(bars.length).toBeGreaterThanOrEqual(1);
    });
    void canvas;
  },
};

export const Horizontal: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Scroll horizontal apenas — container pai com w-[500px], conteúdo com flex w-max + whitespace-nowrap e <ScrollBar orientation="horizontal" />.',
      },
    },
  },
  render: () => (
    <div className="" style={{ height: "160px", width: "500px" }}>
      <ScrollArea className="nds-w-full nds-whitespace-nowrap nds-rounded-md nds-border-default" style={{ height: "100%" }}>
        <div className="nds-cluster" style={{width: "max-content", padding: "0.75rem" }} data-spacing="sm" >
          {cards.map((n) => (
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
  ),
  play: async ({ canvasElement, step }) => {
    await step("Scrollbar horizontal explícita é renderizada", async () => {
      const bars = canvasElement.querySelectorAll(
        '[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]'
      );
      await expect(bars.length).toBeGreaterThanOrEqual(1);
    });
  },
};

export const Both: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Scroll bidirecional — tabela ampla dentro de container 500x260; renderiza ScrollBar vertical (automática) + horizontal explícita + Corner.",
      },
    },
  },
  render: () => (
    <div className="" style={{ height: "260px", width: "500px" }}>
      <ScrollArea className="nds-w-full nds-rounded-md nds-border-default" style={{ height: "100%" }}>
        <table className="border-collapse nds-text-caption" style={{ width: "max-content" }}>
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
    await step("Ambas scrollbars (vertical e horizontal) presentes", async () => {
      const v = canvasElement.querySelectorAll(
        '[data-slot="scroll-area-scrollbar"][data-orientation="vertical"]'
      );
      const h = canvasElement.querySelectorAll(
        '[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]'
      );
      await expect(v.length).toBeGreaterThanOrEqual(1);
      await expect(h.length).toBeGreaterThanOrEqual(1);
    });
  },
};
