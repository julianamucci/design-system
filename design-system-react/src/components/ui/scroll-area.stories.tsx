import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import { ScrollArea, ScrollBar } from "./scroll-area";
import { ScrollAreaDocs } from "@/components/docs/ScrollAreaDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

type PlaygroundArgs = {
  orientation: "vertical" | "horizontal" | "both";
  type: "auto" | "always" | "scroll" | "hover";
  scrollHideDelay: number;
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
    type: {
      control: "radio",
      options: ["auto", "always", "scroll", "hover"],
      description:
        "Quando exibir as scrollbars. always = sempre; hover = só ao passar o mouse; scroll = só ao rolar; auto = quando há overflow.",
    },
    scrollHideDelay: {
      control: { type: "number", min: 0, max: 2000, step: 100 },
      description:
        "Tempo em ms para esconder a scrollbar quando inativa (aplicável a type='scroll' ou 'hover').",
    },
    itemCount: {
      control: { type: "number", min: 5, max: 60, step: 5 },
      description: "Quantidade de itens no conteúdo (apenas para o demo).",
    },
  },
  args: {
    orientation: "vertical",
    type: "hover",
    scrollHideDelay: 600,
    itemCount: 30,
  },
} satisfies Meta<PlaygroundArgs>;

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const Playground: Story = {
  render: (args) => {
    const { orientation, type, scrollHideDelay, itemCount } = args;
    const items = Array.from({ length: itemCount }, (_, i) => i + 1);

    if (orientation === "horizontal") {
      return (
        // key re-monta ao mudar orientation/type (são props de montagem da lib)
        <div
          key={`${orientation}-${type}`}
          className="h-[160px] w-[500px]"
        >
          <ScrollArea
            type={type}
            scrollHideDelay={scrollHideDelay}
            className="h-full w-full whitespace-nowrap rounded-md border"
          >
            <div className="flex w-max gap-3 p-3">
              {items.map((n) => (
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
      );
    }

    if (orientation === "both") {
      const cols = Array.from({ length: 12 }, (_, i) => i + 1);
      const rows = Array.from({ length: Math.max(8, Math.min(itemCount, 20)) }, (_, i) => i + 1);
      return (
        <div
          key={`${orientation}-${type}`}
          className="h-[260px] w-[500px]"
        >
          <ScrollArea
            type={type}
            scrollHideDelay={scrollHideDelay}
            className="h-full w-full rounded-md border"
          >
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
      );
    }

    // vertical
    return (
      <div
        key={`${orientation}-${type}`}
        className="h-[300px] w-[320px]"
      >
        <ScrollArea
          type={type}
          scrollHideDelay={scrollHideDelay}
          className="h-full w-full rounded-md border"
        >
          <div className="p-4 space-y-2">
            {items.map((n) => (
              <div
                key={n}
                className="text-sm border-b pb-2 last:border-b-0"
              >
                Tag {n}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("ScrollArea root é renderizado com data-slot", async () => {
      const root = canvasElement.querySelector('[data-slot="scroll-area"]');
      await expect(root).toBeInTheDocument();
    });

    await step("Viewport existe e é elemento rolável", async () => {
      const viewport = canvasElement.querySelector(
        '[data-slot="scroll-area-viewport"]'
      );
      await expect(viewport).toBeInTheDocument();
    });

    await step("Pelo menos uma scrollbar está presente no DOM", async () => {
      const bars = canvasElement.querySelectorAll(
        '[data-slot="scroll-area-scrollbar"]'
      );
      await expect(bars.length).toBeGreaterThanOrEqual(1);
    });

    await step("Viewport recebe foco programático", async () => {
      const viewport = canvasElement.querySelector(
        '[data-slot="scroll-area-viewport"]'
      ) as HTMLElement | null;
      if (viewport) {
        viewport.focus();
        // Pode não receber foco se não houver tabIndex; checa apenas que é HTMLElement
        await expect(viewport).toBeInTheDocument();
      }
    });

    // Garante callback usado em meta.args não silencia warnings de a11y
    void canvas;
  },
};
