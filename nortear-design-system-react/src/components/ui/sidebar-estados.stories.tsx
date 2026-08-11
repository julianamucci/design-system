import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, waitFor, within, expect } from "storybook/test";
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
  SidebarMenuSkeleton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "./sidebar";

// ─── Helper ───────────────────────────────────────────────────────────────────

interface SidebarStatePreviewProps {
  defaultOpen?: boolean;
  collapsible?: "offcanvas" | "icon" | "none";
  label?: string;
}

function SidebarStatePreview({
  defaultOpen = true,
  collapsible = "offcanvas",
  label = "Conteúdo principal",
}: SidebarStatePreviewProps) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <nav aria-label="Navegação principal">
        <Sidebar collapsible={collapsible}>
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
          <SidebarTrigger />
          <span className="nds-text-body nds-text-muted-foreground">{label}</span>
        </header>
        <div className="nds-p-6 nds-text-body nds-text-muted-foreground">
          Use o botão acima ou <kbd className="nds-font-mono nds-bg-muted nds-px-1 nds-rounded nds-text-caption">Ctrl+B</kbd> para alternar.
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function SidebarLoadingPreview() {
  return (
    <SidebarProvider defaultOpen>
      <nav aria-label="Navegação principal">
        <Sidebar collapsible="offcanvas">
          <SidebarHeader className="nds-p-2">
            <span className="nds-font-semibold nds-text-body nds-text-muted-foreground">Design System</span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Carregando...</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {[...Array(5)].map((_, i) => (
                    <SidebarMenuItem key={i}>
                      <SidebarMenuSkeleton showIcon />
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </nav>
      <SidebarInset>
        <header className="nds-cluster nds-p-4 nds-border-b" data-spacing="sm">
          <SidebarTrigger />
          <span className="nds-text-body nds-text-muted-foreground">Estado de carregamento</span>
        </header>
        <div className="nds-p-6 nds-text-body nds-text-muted-foreground">Navegação carregando via SidebarMenuSkeleton.</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
  title: "UI/Sidebar/States",
  tags: ["layout"],
  component: Sidebar,
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Estados da Sidebar: **expandida** (padrão), **recolhida icon** (collapsible=icon), **offcanvas** (sidebar fora da viewport) e **loading** (SidebarMenuSkeleton).",
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

export const Expanded: Story = {
  name: "State: expanded",
  render: () => <SidebarStatePreview defaultOpen={true} collapsible="offcanvas" label="Sidebar expandida (defaultOpen=true)" />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Sidebar está visível expandida", async () => {
      const sidebar = canvasElement.querySelector("[data-slot='sidebar']");
      await expect(sidebar).toBeInTheDocument();
      await expect(sidebar).toHaveAttribute("data-state", "expanded");
    });

    await step("Item ativo tem aria-current=page", async () => {
      const activeBtn = canvas.getByRole("button", { current: "page" });
      await expect(activeBtn).toBeInTheDocument();
    });
  },
};

export const CollapsedIcon: Story = {
  name: "State: collapsed (icon mode)",
  parameters: { covers: ["functional.item4", "functional.item7", "visual.item2"] },
  render: () => <SidebarStatePreview defaultOpen={false} collapsible="icon" label="Sidebar icon mode (collapsible=icon, defaultOpen=false)" />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const raiz = () => canvasElement.querySelector<HTMLElement>("[data-slot='sidebar']")!;

    await step("A barra nasce recolhida em ícones", async () => {
      await expect(raiz()).toHaveAttribute("data-state", "collapsed");
      await expect(raiz()).toHaveAttribute("data-collapsible", "icon");
    });

    await step("O painel estreita para a largura de ícone", async () => {
      // Mede o pixel declarado, e não o atributo: a regra que estreita é
      // `[data-collapsible="icon"] .nds-sidebar-panel { width: … }`. Usa o
      // computado porque abaixo de 48rem o painel é `display: none`.
      const painel = raiz().querySelector<HTMLElement>(".nds-sidebar-panel")!;
      const emRem = parseFloat(getComputedStyle(raiz()).getPropertyValue("--sidebar-width-icon"));
      const px = emRem * parseFloat(getComputedStyle(document.documentElement).fontSize);
      await expect(Math.round(parseFloat(getComputedStyle(painel).width))).toBe(Math.round(px));
    });

    await step("O ponteiro sobre o item abre o balão com o nome da seção", async () => {
      // Sem rótulo visível, o balão é o que resta para quem usa ponteiro — e
      // ele só pode aparecer enquanto a barra está recolhida. O timeout maior é
      // pelo atraso de abertura do tooltip, que é do componente e não do teste.
      const item = canvas.getByRole("button", { current: "page" });
      await userEvent.hover(item);
      await waitFor(
        async () => {
          const balao = document.querySelector<HTMLElement>("[data-slot='tooltip-content']");
          await expect(balao).not.toBeNull();
          await expect(balao!.textContent?.trim()).toBe("Dashboard");
        },
        { timeout: 3000 },
      );
      // Devolve o DOM ao estado de entrada para o replay.
      await userEvent.unhover(item);
      await waitFor(
        () => expect(document.querySelector("[data-slot='tooltip-content']")).toBeNull(),
        { timeout: 3000 },
      );
    });

    await step("O gatilho expande — e recolhe de volta", async () => {
      // Par idempotente: uma inversão só faria a segunda rodada do painel
      // Interactions afirmar o oposto.
      const gatilho = canvas.getByRole("button", { name: /toggle sidebar/i });
      await userEvent.click(gatilho);
      await waitFor(() => expect(raiz()).toHaveAttribute("data-state", "expanded"));
      await userEvent.click(gatilho);
      await waitFor(() => expect(raiz()).toHaveAttribute("data-state", "collapsed"));
    });
  },
};

export const Offcanvas: Story = {
  name: "State: offcanvas (hidden)",
  render: () => <SidebarStatePreview defaultOpen={false} collapsible="offcanvas" label="Sidebar offcanvas (colapsada fora da viewport)" />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const raiz = () => canvasElement.querySelector<HTMLElement>("[data-slot='sidebar']")!;

    await step("Recolhida em offcanvas, o vão do fluxo zera", async () => {
      await expect(raiz()).toHaveAttribute("data-state", "collapsed");
      await expect(raiz()).toHaveAttribute("data-collapsible", "offcanvas");

      const vao = raiz().querySelector<HTMLElement>(".nds-sidebar-gap-inner")!;
      await expect(Math.round(parseFloat(getComputedStyle(vao).width))).toBe(0);
    });

    await step("O gatilho abre — e fecha de volta", async () => {
      const gatilho = canvas.getByRole("button", { name: /toggle sidebar/i });
      await userEvent.click(gatilho);
      await waitFor(() => expect(raiz()).toHaveAttribute("data-state", "expanded"));
      await userEvent.click(gatilho);
      await waitFor(() => expect(raiz()).toHaveAttribute("data-state", "collapsed"));
    });
  },
};

export const Fixed: Story = {
  name: "State: fixed (collapsible=none)",
  parameters: { covers: ["functional.item5"] },
  render: () => <SidebarStatePreview defaultOpen={true} collapsible="none" label="Sidebar fixa (collapsible=none)" />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Sem recolhimento não há estado de recolhimento", async () => {
      const raiz = canvasElement.querySelector<HTMLElement>("[data-slot='sidebar']")!;
      await expect(raiz).toHaveClass("nds-sidebar-static");
      await expect(raiz).not.toHaveAttribute("data-state");
      // Sem painel fixo, o conteúdo é a própria coluna — nada de reservar vão.
      await expect(canvasElement.querySelector(".nds-sidebar-gap-inner")).toBeNull();
    });

    await step("A navegação continua inteira e acessível", async () => {
      await expect(canvas.getByRole("navigation", { name: /navegação principal/i })).toBeInTheDocument();
      await expect(canvas.getByRole("button", { current: "page" })).toHaveTextContent("Dashboard");
    });
  },
};

export const Loading: Story = {
  name: "State: loading (SidebarMenuSkeleton)",
  parameters: { covers: ["functional.item9"] },
  render: () => <SidebarLoadingPreview />,
  play: async ({ canvasElement, step }) => {
    await step("Cada item de menu vira um placeholder", async () => {
      const skeletons = canvasElement.querySelectorAll("[data-slot='sidebar-menu-skeleton']");
      await expect(skeletons.length).toBe(5);
    });

    await step("showIcon monta o quadrado do ícone à esquerda do texto", async () => {
      const primeiro = canvasElement.querySelector<HTMLElement>(
        "[data-slot='sidebar-menu-skeleton']",
      )!;
      const icone = primeiro.querySelector<HTMLElement>(".nds-sidebar-menu-skeleton-icon")!;
      const texto = primeiro.querySelector<HTMLElement>(".nds-sidebar-menu-skeleton-text")!;
      await expect(icone).not.toBeNull();
      await expect(icone.getBoundingClientRect().left).toBeLessThan(
        texto.getBoundingClientRect().left,
      );
    });
  },
};

/**
 * DÍVIDA DECLARADA: `functional.item3` pede a virada para o overlay em viewport
 * estreita. Nesta stack o corte vem de uma media query global, sem ponto de
 * injeção — o parâmetro `viewport` redimensiona o iframe no Storybook e no
 * Chromatic (é o que esta story fotografa), mas não no runner headless, onde
 * nenhum passo consegue forçar a virada. Por isso só o item visual é declarado.
 */
export const Mobile: Story = {
  name: "State: mobile (Sheet overlay)",
  parameters: {
    viewport: { defaultViewport: "mobile1" },
    covers: ["visual.item5"],
    coversNotApplicable: {
      "functional.item3":
        "a virada para o overlay depende de media query global sem ponto de injeção nesta stack; nenhum passo a força de forma determinística",
    },
  },
  render: () => <SidebarStatePreview defaultOpen={false} collapsible="offcanvas" label="Mobile — abre como Sheet overlay" />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("A navegação e o gatilho existem em qualquer largura", async () => {
      // O que vale nas duas larguras: a barra tem nome de marco e há um único
      // controle de abertura. O resto do cenário é a foto do Chromatic.
      await expect(canvas.getByRole("navigation", { name: /navegação principal/i })).toBeInTheDocument();
      await expect(canvas.getByRole("button", { name: /toggle sidebar/i })).toBeInTheDocument();
    });
  },
};
