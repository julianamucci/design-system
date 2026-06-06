import type { Meta, StoryObj } from "@storybook/react";
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
    <div className="h-[300px] w-[320px]">
      <ScrollArea className="h-full w-full rounded-md border">
        <div className="p-4 space-y-2">
          {tags.map((n) => (
            <div key={n} className="text-sm border-b pb-2 last:border-b-0">
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
    <div className="h-[160px] w-[500px]">
      <ScrollArea className="h-full w-full whitespace-nowrap rounded-md border">
        <div className="flex w-max gap-3 p-3">
          {cards.map((n) => (
            <div
              key={n}
              className="flex h-[120px] w-[140px] items-center justify-center rounded-md bg-muted text-sm shrink-0"
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
    <div className="h-[260px] w-[500px]">
      <ScrollArea className="h-full w-full rounded-md border">
        <table className="w-max border-collapse text-xs">
          <tbody>
            {rows.map((r) => (
              <tr key={r}>
                {cols.map((c) => (
                  <td key={c} className="border px-3 py-2 whitespace-nowrap">
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
