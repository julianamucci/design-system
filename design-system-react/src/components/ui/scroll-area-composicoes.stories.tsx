import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import { ScrollArea, ScrollBar } from "./scroll-area";
import { Separator } from "./separator";

const meta = {
  title: "UI/ScrollArea/Composicoes",
  tags: ["layout"],
  component: ScrollArea,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes típicas: TagList (lista com Separator), CardCarousel (cards horizontais), DataMatrix (tabela bidirecional) e SidebarMenu (navegação rolável de sidebar).",
      },
    },
  },
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const tags = Array.from({ length: 30 }, (_, i) => `v1.0.${i}`);

export const TagList: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Lista vertical com Separator entre itens — padrão clássico shadcn para tags, versões ou changelog.",
      },
    },
  },
  render: () => (
    <div className="h-[300px] w-[280px]">
      <ScrollArea className="h-full w-full rounded-md border">
        <div className="p-4">
          <h4 className="mb-3 text-sm font-medium leading-none">Tags</h4>
          {tags.map((tag, i) => (
            <div key={tag}>
              <div className="text-sm py-1">{tag}</div>
              {i < tags.length - 1 && <Separator className="my-1" />}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Lista renderiza heading 'Tags' dentro do viewport", async () => {
      await expect(canvas.getByText("Tags")).toBeInTheDocument();
    });
  },
};

export const CardCarousel: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Carrossel horizontal de cards — w-[500px] no container, flex w-max no conteúdo, ScrollBar horizontal explícita. Cada card mantém largura fixa com shrink-0.",
      },
    },
  },
  render: () => (
    <div className="h-[200px] w-[500px]">
      <ScrollArea className="h-full w-full whitespace-nowrap rounded-md border">
        <div className="flex w-max gap-4 p-4">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
            <figure key={n} className="shrink-0">
              <div className="flex h-[140px] w-[160px] items-center justify-center rounded-md bg-muted text-sm">
                Imagem {n}
              </div>
              <figcaption className="pt-2 text-xs text-muted-foreground">
                Foto {n} — autor {n}
              </figcaption>
            </figure>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await step("Scrollbar horizontal está presente", async () => {
      const h = canvasElement.querySelectorAll(
        '[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]'
      );
      await expect(h.length).toBeGreaterThanOrEqual(1);
    });
  },
};

export const DataMatrix: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Matriz de dados ampla — tabela 15×15 dentro de ScrollArea 500×280. Scroll bidirecional automático + Corner no canto inferior direito.",
      },
    },
  },
  render: () => {
    const rows = Array.from({ length: 15 }, (_, i) => i + 1);
    const cols = Array.from({ length: 15 }, (_, i) => i + 1);
    return (
      <div className="h-[280px] w-[500px]">
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
    );
  },
  play: async ({ canvasElement, step }) => {
    await step("Ambas scrollbars presentes (bidirecional)", async () => {
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

export const SidebarMenu: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Menu lateral rolável — h-[320px] simula sidebar fixa; ScrollArea isola o scroll da navegação sem mover a página.",
      },
    },
  },
  render: () => {
    const sections = [
      { name: "Componentes", items: ["Button", "Input", "Select", "Checkbox", "Radio", "Switch"] },
      { name: "Layout", items: ["Card", "Resizable", "ScrollArea", "Separator", "AspectRatio"] },
      { name: "Overlay", items: ["Dialog", "Sheet", "Popover", "Tooltip", "DropdownMenu"] },
      { name: "Feedback", items: ["Alert", "Toast", "Sonner", "Progress", "Skeleton"] },
    ];
    return (
      <div className="h-[320px] w-[240px]">
        <ScrollArea className="h-full w-full rounded-md border">
          <nav aria-label="Sidebar" className="p-3">
            {sections.map((sec) => (
              <div key={sec.name} className="mb-4">
                <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  {sec.name}
                </div>
                <ul className="space-y-1">
                  {sec.items.map((item) => (
                    <li key={item}>
                      <a
                        href={`#${item.toLowerCase()}`}
                        className="block rounded-md px-2 py-1 text-sm hover:bg-muted focus-visible:bg-muted outline-none"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </ScrollArea>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Navegação tem aria-label", async () => {
      const nav = canvas.getByRole("navigation", { name: "Sidebar" });
      await expect(nav).toBeInTheDocument();
    });
    await step("Links são focáveis", async () => {
      const links = canvas.getAllByRole("link");
      await expect(links.length).toBeGreaterThan(0);
    });
  },
};
