import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import { waitForPortal } from "@/lib/wait-for-portal";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

const meta = {
  title: "UI/Sheet/Composicoes",
  tags: ["disclosure"],
  component: Sheet,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes reais do Sheet em fluxos de produto: filtros avançados, navegação secundária e painel inferior mobile.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ contain: "layout", minHeight: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FiltersPanel: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Sheet à direita com filtros avançados em formulário. Title nomeia a ação, Description orienta o uso, Footer com Cancelar + Aplicar.",
      },
    },
  },
  render: () => {
    const title = "Filtros avançados";
    return (
      <Sheet defaultOpen>
        <SheetTrigger render={<Button variant="outline" />}>
          Abrir filtros
        </SheetTrigger>
        <SheetContent side="right" className="nds-sm-w-420" style={{ width: "400px" }}>
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>
              Refine os resultados por categoria, preço e disponibilidade.
            </SheetDescription>
          </SheetHeader>
          <form
            className="nds-grid nds-px-4" data-spacing="md"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <div className="nds-stack" data-spacing="sm">
              <Label htmlFor="filter-category">Categoria</Label>
              <Input id="filter-category" defaultValue="Eletrônicos" />
            </div>
            <div className="nds-stack" data-spacing="sm">
              <Label htmlFor="filter-min">Preço mínimo</Label>
              <Input id="filter-min" type="number" defaultValue="100" />
            </div>
            <div className="nds-stack" data-spacing="sm">
              <Label htmlFor="filter-max">Preço máximo</Label>
              <Input id="filter-max" type="number" defaultValue="2000" />
            </div>
          </form>
          <SheetFooter>
            <SheetClose render={<Button type="button" variant="outline" />}>
              Cancelar
            </SheetClose>
            <Button>Aplicar filtros</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  },
  play: async () => {
    const dialog = await waitForPortal("dialog");
    await expect(dialog).toHaveAccessibleName(/Filtros avançados/i);
    const input = within(dialog).getByLabelText(/Categoria/i);
    await expect(input).toBeVisible();
  },
};

export const SecondaryNavigation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Sheet à esquerda como menu de navegação secundária — itens clicáveis dentro do painel, sem Footer.",
      },
    },
  },
  render: () => {
    const title = "Navegação";
    return (
      <Sheet defaultOpen>
        <SheetTrigger render={<Button variant="outline" />}>
          Abrir menu
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>
              Acesse as seções principais do aplicativo.
            </SheetDescription>
          </SheetHeader>
          <nav className="nds-stack nds-px-4" data-spacing="xs" aria-label="Seções">
            {["Dashboard", "Projetos", "Equipe", "Configuracoes"].map(
              (label) => (
                <Button
                  key={label}
                  variant="ghost"
                  className="" data-justify="start"
                >
                  {label}
                </Button>
              )
            )}
          </nav>
        </SheetContent>
      </Sheet>
    );
  },
  play: async () => {
    const dialog = await waitForPortal("dialog");
    await expect(dialog).toHaveAttribute("data-side", "left");
    const nav = within(dialog).getByRole("navigation");
    await expect(nav).toBeVisible();
  },
};

export const BottomPanel: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Sheet inferior — equivalente visual ao Drawer mobile, mas sem gesture. Para swipe nativo em mobile, use Drawer.",
      },
    },
  },
  render: () => {
    const title = "Ações rápidas";
    return (
      <Sheet defaultOpen>
        <SheetTrigger render={<Button variant="outline" />}>
          Abrir ações
        </SheetTrigger>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>
              Escolha uma das ações disponíveis para este item.
            </SheetDescription>
          </SheetHeader>
          <div className="nds-cluster nds-px-4" data-spacing="sm" style={{ flexWrap: "wrap" }}>
            <Button variant="outline">Compartilhar</Button>
            <Button variant="outline">Duplicar</Button>
            <Button variant="destructive">Excluir</Button>
          </div>
          <SheetFooter>
            <SheetClose render={<Button variant="outline" />}>
              Fechar
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  },
  play: async () => {
    const dialog = await waitForPortal("dialog");
    await expect(dialog).toHaveAttribute("data-side", "bottom");
  },
};
