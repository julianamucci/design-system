import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect, userEvent } from "storybook/test";
import { transbordo } from "@shared/testing/scroll-area-probe";
import { ScrollArea, ScrollBar } from "./scroll-area";
import { Separator } from "./separator";

const meta = {
  title: "UI/ScrollArea/Compositions",
  tags: ["layout"],
  component: ScrollArea,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
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
          "Lista vertical com Separator entre itens — padrão clássico para tags, versões ou changelog.",
      },
    },
  },
  render: () => (
    <div style={{ width: "280px" }}>
      <ScrollArea size="xl" className="nds-w-full nds-rounded-md nds-border-default">
        <div className="nds-p-4">
          <h4 className="nds-mb-2 nds-text-body nds-font-medium" style={{ lineHeight: 1 }}>Tags</h4>
          {tags.map((tag, i) => (
            <div key={tag}>
              <div className="nds-text-body nds-py-1">{tag}</div>
              {i < tags.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]'
    )!;

    await step("A lista inteira está no DOM, dentro do viewport", async () => {
      const titulo = canvas.getByRole("heading", { name: "Tags" });
      await expect(viewport.contains(titulo)).toBe(true);
      await expect(canvas.getAllByText(/^v1\.0\.\d+$/).length).toBe(tags.length);
    });

    await step("A lista rola sem mover a página", async () => {
      await expect(transbordo(viewport).y).toBe(true);
      const paginaAntes = document.scrollingElement?.scrollTop ?? 0;
      viewport.scrollTop = 0;
      viewport.scrollTop = 120;
      await expect(viewport.scrollTop).toBe(120);
      await expect(document.scrollingElement?.scrollTop ?? 0).toBe(paginaAntes);
    });
  },
};

export const CardCarousel: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Carrossel horizontal de cards — conteúdo com largura de conteúdo e itens que não encolhem, com ScrollBar horizontal explícita.",
      },
    },
  },
  render: () => (
    <div style={{ width: "500px" }}>
      <ScrollArea size="md" className="nds-w-full nds-whitespace-nowrap nds-rounded-md nds-border-default">
        <div className="nds-cluster nds-p-4" style={{ width: "max-content" }} data-spacing="md">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
            <figure key={n} className="nds-shrink-0">
              <div className="nds-cluster nds-rounded-md nds-bg-muted nds-text-body" data-align="center" data-justify="center" style={{ height: "140px", width: "160px" }}>
                Imagem {n}
              </div>
              <figcaption className="nds-text-caption nds-text-muted-foreground nds-pt-2">
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
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]'
    )!;

    await step("A faixa transborda na horizontal e a barra correspondente é montada", async () => {
      await expect(transbordo(viewport).x).toBe(true);
      const h = canvasElement.querySelectorAll(
        '[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]'
      );
      await expect(h.length).toBe(1);
    });

    await step("O eixo horizontal responde", async () => {
      viewport.scrollLeft = 0;
      viewport.scrollLeft = 200;
      await expect(viewport.scrollLeft).toBe(200);
    });
  },
};

export const DataMatrix: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Matriz de dados ampla — tabela 15×15 dentro de um container fixo. Scroll bidirecional automático e canto no encontro das barras.",
      },
    },
  },
  render: () => {
    const rows = Array.from({ length: 15 }, (_, i) => i + 1);
    const cols = Array.from({ length: 15 }, (_, i) => i + 1);
    return (
      <div style={{ width: "500px" }}>
        <ScrollArea size="xl" className="nds-w-full nds-rounded-md nds-border-default">
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
  },
  play: async ({ canvasElement, step }) => {
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]'
    )!;

    await step("A tabela transborda nos dois eixos", async () => {
      const eixos = transbordo(viewport);
      await expect(eixos.x).toBe(true);
      await expect(eixos.y).toBe(true);
    });

    await step("As duas barras são montadas", async () => {
      const v = canvasElement.querySelectorAll(
        '[data-slot="scroll-area-scrollbar"][data-orientation="vertical"]'
      );
      const h = canvasElement.querySelectorAll(
        '[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]'
      );
      await expect(v.length).toBe(1);
      await expect(h.length).toBe(1);
    });
  },
};

export const SidebarMenu: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Menu lateral rolável — a área isola o scroll da navegação sem mover a página, e os links continuam alcançáveis por teclado.",
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
      <div style={{ width: "240px" }}>
        <ScrollArea size="xl" className="nds-w-full nds-rounded-md nds-border-default">
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
                        className="nds-block nds-rounded-md nds-px-2 nds-py-1 nds-text-body nds-hover-bg-muted-soft"
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
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]'
    )!;

    await step("A navegação tem nome acessível e mora dentro da área rolável", async () => {
      const nav = canvas.getByRole("navigation", { name: "Sidebar" });
      await expect(viewport.contains(nav)).toBe(true);
    });

    await step("Os links são alcançáveis por teclado, na ordem do documento", async () => {
      const links = canvas.getAllByRole("link");
      await expect(links.length).toBe(21);
      viewport.blur();
      viewport.focus();
      await userEvent.tab();
      await expect(document.activeElement).toBe(links[0]);
    });
  },
};
