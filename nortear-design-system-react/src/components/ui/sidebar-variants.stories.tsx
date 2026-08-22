import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import {
  LayoutDashboard,
  Blocks,
  Coins,
  Settings,
  User,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "./sidebar";
import {
  sidebarSideDireitoSource,
  sidebarSideEsquerdoSource,
  sidebarRecolhivelIconSource,
  sidebarRecolhivelOffcanvasSource,
  sidebarNoRecolhimentoSource,
  sidebarSource,
  sidebarVariantEncaixadaSource,
  sidebarVariantFlutuanteSource,
  sidebarVariantDefaultSource,
} from "./sidebar.source";

// ─── Helper ───────────────────────────────────────────────────────────────────

interface SidebarPreviewProps {
  variant: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  side?: "left" | "right";
}

function SidebarPreview({ variant, collapsible = "offcanvas", side = "left" }: SidebarPreviewProps) {
  return (
    <SidebarProvider defaultOpen>
      <nav aria-label="Navegação principal">
        <Sidebar variant={variant} collapsible={collapsible} side={side}>
          <SidebarHeader className="nds-p-2">
            <span className="nds-font-semibold nds-text-body nds-text-muted-foreground">Design System</span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive tooltip="Dashboard" aria-current="page">
                      <LayoutDashboard aria-hidden="true" />
                      <span>Dashboard</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Componentes">
                      <Blocks aria-hidden="true" />
                      <span>Componentes</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Tokens">
                      <Coins aria-hidden="true" />
                      <span>Tokens</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Configuracoes">
                      <Settings aria-hidden="true" />
                      <span>Configuracoes</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Perfil">
                  <User aria-hidden="true" />
                  <span>Perfil</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
      </nav>
      <SidebarInset>
        <header className="nds-cluster nds-p-4 nds-border-b" data-spacing="sm">
          <SidebarTrigger className="nds-lg-hidden" />
          <span className="nds-text-body nds-font-medium">
            variant=&quot;{variant}&quot;{collapsible !== "offcanvas" ? ` collapsible="${collapsible}"` : ""}
            {side !== "left" ? ` side="${side}"` : ""}
          </span>
        </header>
        <div className="nds-p-6 nds-text-body nds-text-muted-foreground">Conteúdo principal</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
  title: "UI/Sidebar/Variants",
  tags: ["layout"],
  component: Sidebar,
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: sidebarSource },
      description: {
        component:
          "Variantes visuais da Sidebar: **sidebar** (padrão colada à borda), **floating** (com sombra e border-radius) e **inset** (conteúdo com container arredondado adjacente). Além das variantes de `side`: **left** e **right**.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="nds-cluster nds-min-h-100">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Stories ──────────────────────────────────────────────────────────────────

const rootOf = (el: HTMLElement) => el.querySelector<HTMLElement>("[data-slot='sidebar']")!;

export const VariantSidebar: Story = {
  parameters: {
    docs: {
      // A variante é afirmada no `render`, sem control. Numa galeria, o
      // snippet que não a nomeia deixa quem lê sem saber qual das três vê.
      source: { transform: sidebarVariantDefaultSource },
    },
  },
  render: () => <SidebarPreview variant="sidebar" />,
  play: async ({ canvasElement, step }) => {
    await step("A variante padrão não arredonda o painel interno", async () => {
      const raiz = rootOf(canvasElement);
      await expect(raiz).toHaveAttribute("data-variant", "sidebar");
      const interno = raiz.querySelector<HTMLElement>(".nds-sidebar-inner")!;
      await expect(parseFloat(getComputedStyle(interno).borderTopLeftRadius)).toBe(0);
    });
  },
};

export const VariantFloating: Story = {
  parameters: {
    covers: ["functional.item8", "visual.item3"],
    docs: {
      // `variant="floating"` vive só no `render` — nenhum control o descreve
      // neste arquivo.
      source: { transform: sidebarVariantFlutuanteSource },
    },
  },
  render: () => <SidebarPreview variant="floating" />,
  play: async ({ canvasElement, step }) => {
    await step("floating ganha borda, cantos e sombra no painel interno", async () => {
      // Afirma o pixel, e não só o atributo: a regra é
      // `[data-variant="floating"] .nds-sidebar-inner`, e um atributo no lugar
      // errado passaria despercebido.
      const raiz = rootOf(canvasElement);
      await expect(raiz).toHaveAttribute("data-variant", "floating");

      const interno = raiz.querySelector<HTMLElement>(".nds-sidebar-inner")!;
      const estilo = getComputedStyle(interno);
      await expect(parseFloat(estilo.borderTopLeftRadius)).toBeGreaterThan(0);
      await expect(parseFloat(estilo.borderTopWidth)).toBeGreaterThan(0);
      await expect(estilo.boxShadow).not.toBe("none");
    });
  },
};

export const VariantInset: Story = {
  parameters: {
    covers: ["visual.item4"],
    docs: {
      // A variante encaixada depende de a barra e o conteúdo serem IRMÃOS, e
      // o snippet precisa mostrar os dois lado a lado.
      source: { transform: sidebarVariantEncaixadaSource },
    },
  },
  render: () => <SidebarPreview variant="inset" />,
  play: async ({ canvasElement, step }) => {
    await step("inset marca a variante que arredonda o conteúdo adjacente", async () => {
      const raiz = rootOf(canvasElement);
      await expect(raiz).toHaveAttribute("data-variant", "inset");
      // A regra que arredonda o conteúdo é `[data-variant="inset"] ~ .nds-sidebar-inset`
      // — depende de a barra e o conteúdo serem irmãos, e é isso que se perde
      // primeiro quando alguém envolve um dos dois.
      await expect(canvasElement.querySelector(".nds-sidebar-inset")).not.toBeNull();
    });
  },
};

export const CollapsibleOffcanvas: Story = {
  parameters: {
    docs: {
      // O modo de recolhimento é o assunto da story e é afirmado no `render`.
      source: { transform: sidebarRecolhivelOffcanvasSource },
    },
  },
  render: () => <SidebarPreview variant="sidebar" collapsible="offcanvas" />,
  play: async ({ canvasElement, step }) => {
    await step("Aberta, o modo de recolhimento ainda não marca nada", async () => {
      // `data-collapsible` só existe enquanto está recolhida — se fosse fixo,
      // a barra nasceria encolhida.
      const raiz = rootOf(canvasElement);
      await expect(raiz).toHaveAttribute("data-state", "expanded");
      await expect(raiz.getAttribute("data-collapsible")).toBe("");
    });
  },
};

export const CollapsibleIcon: Story = {
  parameters: {
    docs: {
      // `collapsible="icon"` vem do `render`, e é ele que torna o `tooltip` de
      // cada destino obrigatório em vez de enfeite.
      source: { transform: sidebarRecolhivelIconSource },
    },
  },
  render: () => <SidebarPreview variant="sidebar" collapsible="icon" />,
  play: async ({ canvasElement, step }) => {
    await step("Aberta, o modo icon não estreita o painel", async () => {
      const raiz = rootOf(canvasElement);
      await expect(raiz).toHaveAttribute("data-state", "expanded");
      const painel = raiz.querySelector<HTMLElement>(".nds-sidebar-panel")!;
      const full = parseFloat(getComputedStyle(raiz).getPropertyValue("--sidebar-width"));
      const rootFonte = parseFloat(getComputedStyle(document.documentElement).fontSize);
      await expect(Math.round(parseFloat(getComputedStyle(painel).width))).toBe(
        Math.round(full * rootFonte),
      );
    });
  },
};

export const CollapsibleNone: Story = {
  parameters: {
    docs: {
      // A AUSÊNCIA do gatilho é parte do caso: sem recolhimento não há o que
      // alternar, e o botão prometeria uma ação inexistente.
      source: { transform: sidebarNoRecolhimentoSource },
    },
  },
  render: () => <SidebarPreview variant="sidebar" collapsible="none" />,
  play: async ({ canvasElement, step }) => {
    await step("Sem recolhimento não há painel fixo nem vão reservado", async () => {
      const raiz = rootOf(canvasElement);
      await expect(raiz).toHaveClass("nds-sidebar-static");
      await expect(raiz).not.toHaveAttribute("data-state");
      await expect(canvasElement.querySelector(".nds-sidebar-gap-inner")).toBeNull();
    });
  },
};

export const SideLeft: Story = {
  parameters: {
    docs: {
      // O lado é afirmado no `render`, e numa galeria de lados o snippet tem
      // de nomeá-lo mesmo quando é o padrão.
      source: { transform: sidebarSideEsquerdoSource },
    },
  },
  render: () => <SidebarPreview variant="sidebar" side="left" />,
  play: async ({ canvasElement, step }) => {
    await step("O painel encosta na esquerda", async () => {
      const raiz = rootOf(canvasElement);
      await expect(raiz).toHaveAttribute("data-side", "left");
      const painel = raiz.querySelector<HTMLElement>(".nds-sidebar-panel")!;
      await expect(getComputedStyle(painel).left).toBe("0px");
    });
  },
};

export const SideRight: Story = {
  parameters: {
    covers: ["visual.item6"],
    docs: {
      // `side="right"` vive só no `render`; é ele que vira painel e faixa de
      // arrasto ao mesmo tempo.
      source: { transform: sidebarSideDireitoSource },
    },
  },
  render: () => <SidebarPreview variant="sidebar" side="right" />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("O painel encosta na direita", async () => {
      const raiz = rootOf(canvasElement);
      await expect(raiz).toHaveAttribute("data-side", "right");
      // Medida, não atributo: a regra que posiciona é
      // `[data-side="right"] .nds-sidebar-panel { right: 0 }`.
      const painel = raiz.querySelector<HTMLElement>(".nds-sidebar-panel")!;
      await expect(getComputedStyle(painel).right).toBe("0px");
    });

    await step("Trocar de lado não mexe na navegação", async () => {
      await expect(canvas.getByRole("navigation", { name: /navegação principal/i })).toBeInTheDocument();
    });
  },
};
