import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
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
import { track } from "@/lib/analytics";

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

const trackOpen = (label: string, location: string) =>
  track("dialog_open", { component: "sheet", trigger_label: label, location });

const trackConfirm = (action: string, location: string) =>
  track("dialog_confirm", { component: "sheet", action, location });

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
    const location = "storybook:composicoes:filters";
    const title = "Filtros avançados";
    return (
      <Sheet defaultOpen onOpenChange={(o) => o && trackOpen(title, location)}>
        <SheetTrigger render={<Button variant="outline" />}>
          Abrir filtros
        </SheetTrigger>
        <SheetContent side="right" className="w-[400px] sm:w-[420px]">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>
              Refine os resultados por categoria, preço e disponibilidade.
            </SheetDescription>
          </SheetHeader>
          <form
            className="grid gap-4 px-4"
            onSubmit={(e) => {
              e.preventDefault();
              trackConfirm("Aplicar filtros", location);
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="filter-category">Categoria</Label>
              <Input id="filter-category" defaultValue="Eletrônicos" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="filter-min">Preço mínimo</Label>
              <Input id="filter-min" type="number" defaultValue="100" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="filter-max">Preço máximo</Label>
              <Input id="filter-max" type="number" defaultValue="2000" />
            </div>
          </form>
          <SheetFooter>
            <SheetClose render={<Button type="button" variant="outline" />}>
              Cancelar
            </SheetClose>
            <Button onClick={() => trackConfirm("Aplicar filtros", location)}>
              Aplicar filtros
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  },
  play: async () => {
    const body = within(document.body);
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
    const location = "storybook:composicoes:nav";
    const title = "Navegação";
    return (
      <Sheet defaultOpen onOpenChange={(o) => o && trackOpen(title, location)}>
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
          <nav className="flex flex-col gap-1 px-4" aria-label="Seções">
            {["Dashboard", "Projetos", "Equipe", "Configuracoes"].map(
              (label) => (
                <Button
                  key={label}
                  variant="ghost"
                  className="justify-start"
                  onClick={() =>
                    track("dialog_confirm", {
                      component: "sheet",
                      action: `nav:${label}`,
                      location,
                    })
                  }
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
    const body = within(document.body);
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
    const location = "storybook:composicoes:bottom";
    const title = "Ações rápidas";
    return (
      <Sheet defaultOpen onOpenChange={(o) => o && trackOpen(title, location)}>
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
          <div className="flex flex-wrap gap-2 px-4">
            <Button
              variant="outline"
              onClick={() => trackConfirm("Compartilhar", location)}
            >
              Compartilhar
            </Button>
            <Button
              variant="outline"
              onClick={() => trackConfirm("Duplicar", location)}
            >
              Duplicar
            </Button>
            <Button
              variant="destructive"
              onClick={() => trackConfirm("Excluir", location)}
            >
              Excluir
            </Button>
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
    const body = within(document.body);
    const dialog = await waitForPortal("dialog");
    await expect(dialog).toHaveAttribute("data-side", "bottom");
  },
};
