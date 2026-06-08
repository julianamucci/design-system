import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import { useState } from "react";
import {
  LayoutDashboard,
  Blocks,
  Coins,
  Settings,
  User,
  Bell,
  ChevronRight,
  Plus,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "./sidebar";

// ─── Composição 1: Grupos de navegação ────────────────────────────────────────

function SidebarWithNavGroups() {
  return (
    <SidebarProvider defaultOpen>
      <nav aria-label="Navegação principal">
        <Sidebar collapsible="offcanvas">
          <SidebarHeader className="p-3">
            <span className="font-semibold text-sm text-sidebar-foreground">Design System</span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Aplicação</SidebarGroupLabel>
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
                    <SidebarMenuBadge>12</SidebarMenuBadge>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Tokens">
                      <Coins aria-hidden="true" />
                      <span>Tokens</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Sistema</SidebarGroupLabel>
              <SidebarGroupAction aria-label="Adicionar notificação">
                <Plus aria-hidden="true" />
              </SidebarGroupAction>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Notificações">
                      <Bell aria-hidden="true" />
                      <span>Notificações</span>
                    </SidebarMenuButton>
                    <SidebarMenuBadge>3</SidebarMenuBadge>
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
        <header className="flex items-center gap-2 p-4 border-b border-border">
          <SidebarTrigger className="lg:hidden" />
          <span className="text-sm text-muted-foreground">Com grupos, badges e group action</span>
        </header>
        <div className="p-6 text-sm text-muted-foreground">Sidebar com múltiplos grupos, SidebarMenuBadge e SidebarGroupAction.</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// ─── Composição 2: Com submenu ────────────────────────────────────────────────

function SidebarWithSubMenu() {
  const [componentsOpen, setComponentsOpen] = useState(true);

  return (
    <SidebarProvider defaultOpen>
      <nav aria-label="Navegação principal">
        <Sidebar collapsible="icon">
          <SidebarHeader className="p-3">
            <span className="font-semibold text-sm text-sidebar-foreground">Design System</span>
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
                    <SidebarMenuButton
                      tooltip="Componentes"
                      onClick={() => setComponentsOpen((v) => !v)}
                    >
                      <Blocks aria-hidden="true" />
                      <span>Componentes</span>
                      <ChevronRight
                        aria-hidden="true"
                        className={`ml-auto transition-transform ${componentsOpen ? "rotate-90" : ""}`}
                      />
                    </SidebarMenuButton>
                    {componentsOpen && (
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton isActive>
                            <span>Button</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton>
                            <span>Input</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton>
                            <span>Select</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton>
                            <span>Sidebar</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    )}
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
                    <SidebarMenuAction showOnHover aria-label="Mais opções de configurações">
                      <ChevronRight aria-hidden="true" />
                    </SidebarMenuAction>
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
        <header className="flex items-center gap-2 p-4 border-b border-border">
          <SidebarTrigger />
          <span className="text-sm text-muted-foreground">Com submenu e SidebarMenuAction</span>
        </header>
        <div className="p-6 text-sm text-muted-foreground">SidebarMenuSub com subitens aninhados + SidebarMenuAction com showOnHover.</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// ─── Composição 3: Com busca ──────────────────────────────────────────────────

function SidebarWithSearch() {
  const [query, setQuery] = useState("");

  const items = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: Blocks, label: "Componentes" },
    { icon: Coins, label: "Tokens" },
    { icon: Bell, label: "Notificações" },
    { icon: Settings, label: "Configuracoes" },
    { icon: User, label: "Perfil" },
  ];

  const filtered = query
    ? items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  return (
    <SidebarProvider defaultOpen>
      <nav aria-label="Navegação principal">
        <Sidebar collapsible="offcanvas">
          <SidebarHeader className="p-3 gap-2">
            <span className="font-semibold text-sm text-sidebar-foreground">Design System</span>
            <SidebarInput
              placeholder="Buscar..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar na navegação"
            />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>
                {query ? `Resultados (${filtered.length})` : "Navegação"}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filtered.map(({ icon: Icon, label }) => (
                    <SidebarMenuItem key={label}>
                      <SidebarMenuButton tooltip={label} isActive={label === "Dashboard"}>
                        <Icon aria-hidden="true" />
                        <span>{label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  {filtered.length === 0 && (
                    <li className="px-2 py-3 text-xs text-sidebar-foreground/60">
                      Nenhum item encontrado.
                    </li>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </nav>
      <SidebarInset>
        <header className="flex items-center gap-2 p-4 border-b border-border">
          <SidebarTrigger className="lg:hidden" />
          <span className="text-sm text-muted-foreground">Com SidebarInput para busca</span>
        </header>
        <div className="p-6 text-sm text-muted-foreground">SidebarInput filtra os itens de menu em tempo real.</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
  title: "UI/Sidebar/Composicoes",
  tags: ["layout"],
  component: Sidebar,
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes comuns da Sidebar: com grupos e badges, com submenu aninhado (SidebarMenuSub) e com campo de busca (SidebarInput).",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-[400px] flex">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const ComGruposNavegacao: Story = {
  name: "Com grupos de navegação",
  render: () => <SidebarWithNavGroups />,
  play: async ({ canvasElement, step }) => {
    await step("Sidebar renderiza com data-slot=sidebar", async () => {
      const sidebar = canvasElement.querySelector("[data-slot='sidebar']");
      await expect(sidebar).toBeInTheDocument();
    });
    await step("nav com aria-label está presente", async () => {
      const nav = within(canvasElement).getByRole("navigation", { name: /navegação principal/i });
      await expect(nav).toBeInTheDocument();
    });
  },
};

export const ComSubMenu: Story = {
  name: "Com submenu aninhado",
  render: () => <SidebarWithSubMenu />,
  play: async ({ canvasElement, step }) => {
    await step("Sidebar renderiza com data-slot=sidebar", async () => {
      const sidebar = canvasElement.querySelector("[data-slot='sidebar']");
      await expect(sidebar).toBeInTheDocument();
    });
    await step("nav com aria-label está presente", async () => {
      const nav = within(canvasElement).getByRole("navigation", { name: /navegação principal/i });
      await expect(nav).toBeInTheDocument();
    });
  },
};

export const ComBusca: Story = {
  name: "Com SidebarInput (busca)",
  render: () => <SidebarWithSearch />,
  play: async ({ canvasElement, step }) => {
    await step("Sidebar renderiza com data-slot=sidebar", async () => {
      const sidebar = canvasElement.querySelector("[data-slot='sidebar']");
      await expect(sidebar).toBeInTheDocument();
    });
    await step("nav com aria-label está presente", async () => {
      const nav = within(canvasElement).getByRole("navigation", { name: /navegação principal/i });
      await expect(nav).toBeInTheDocument();
    });
  },
};
