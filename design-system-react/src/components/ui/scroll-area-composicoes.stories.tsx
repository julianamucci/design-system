import type { Meta, StoryObj } from "@storybook/react-vite";
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
    <div className="" style={{ height: "300px", width: "280px" }}>
      <ScrollArea className="nds-w-full nds-rounded-md nds-border-default" style={{ height: "100%" }}>
        <div className="nds-p-4">
          <h4 className="mb-3 nds-text-body nds-font-medium" style={{ lineHeight: 1 }}>Tags</h4>
          {tags.map((tag, i) => (
            <div key={tag}>
              <div className="nds-text-body nds-py-1">{tag}</div>
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
    <div className="" style={{ height: "200px", width: "500px" }}>
      <ScrollArea className="nds-w-full nds-whitespace-nowrap nds-rounded-md nds-border-default" style={{ height: "100%" }}>
        <div className="nds-cluster nds-p-4" style={{ width: "max-content" }} data-spacing="md">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
            <figure key={n} className="nds-shrink-0">
              <div className="nds-cluster nds-rounded-md nds-bg-muted nds-text-body" data-align="center" data-justify="center" style={{ height: "140px", width: "160px" }}>
                Imagem {n}
              </div>
              <figcaption className="nds-text-caption nds-text-muted-foreground" style={{ paddingTop: "0.5rem" }}>
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
      <div className="" style={{ height: "280px", width: "500px" }}>
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
      <div className="" style={{ height: "320px", width: "240px" }}>
        <ScrollArea className="nds-w-full nds-rounded-md nds-border-default" style={{ height: "100%" }}>
          <nav aria-label="Sidebar" className="nds-p-2">
            {sections.map((sec) => (
              <div key={sec.name} className="nds-mb-4">
                <div className="nds-text-caption nds-font-medium nds-text-muted-foreground nds-mb-2 nds-uppercase nds-tracking-wide">
                  {sec.name}
                </div>
                <ul className="nds-stack" data-spacing="xs">
                  {sec.items.map((item) => (
                    <li key={item}>
                      <a
                        href={`#${item.toLowerCase()}`}
                        className="nds-block nds-rounded-md nds-px-2 nds-py-1 nds-text-body nds-hover-bg-muted-soft outline-none"
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
