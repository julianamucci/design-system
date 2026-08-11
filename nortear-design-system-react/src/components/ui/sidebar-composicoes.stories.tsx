import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, waitFor, within, expect } from "storybook/test";
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
          <SidebarHeader className="nds-p-2">
            <span className="nds-font-semibold nds-text-body nds-text-muted-foreground">Design System</span>
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
        <header className="nds-cluster nds-p-4 nds-border-b" data-spacing="sm">
          <SidebarTrigger className="nds-lg-hidden" />
          <span className="nds-text-body nds-text-muted-foreground">Com grupos, badges e group action</span>
        </header>
        <div className="nds-p-6 nds-text-body nds-text-muted-foreground">Sidebar com múltiplos grupos, SidebarMenuBadge e SidebarGroupAction.</div>
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
                    <SidebarMenuButton
                      tooltip="Componentes"
                      aria-expanded={componentsOpen}
                      onClick={() => setComponentsOpen((v) => !v)}
                    >
                      <Blocks aria-hidden="true" />
                      <span>Componentes</span>
                      {/* `.nds-chevron` já gira sob [aria-expanded="true"]: a
                          rotação sai do estado no DOM, não de classe condicional. */}
                      <ChevronRight aria-hidden="true" className="nds-spacer-start nds-chevron" />
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
        <header className="nds-cluster nds-p-4 nds-border-b" data-spacing="sm">
          <SidebarTrigger />
          <span className="nds-text-body nds-text-muted-foreground">Com submenu e SidebarMenuAction</span>
        </header>
        <div className="nds-p-6 nds-text-body nds-text-muted-foreground">SidebarMenuSub com subitens aninhados + SidebarMenuAction com showOnHover.</div>
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
          <SidebarHeader className="nds-p-2" data-spacing="sm">
            <span className="nds-font-semibold nds-text-body nds-text-muted-foreground">Design System</span>
            <SidebarInput
              type="search"
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
                    <li className="nds-px-2 nds-py-2 nds-text-caption nds-text-muted-foreground">
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
        <header className="nds-cluster nds-p-4 nds-border-b" data-spacing="sm">
          <SidebarTrigger className="nds-lg-hidden" />
          <span className="nds-text-body nds-text-muted-foreground">Com SidebarInput para busca</span>
        </header>
        <div className="nds-p-6 nds-text-body nds-text-muted-foreground">SidebarInput filtra os itens de menu em tempo real.</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
  title: "UI/Sidebar/Compositions",
  tags: ["layout"],
  component: Sidebar,
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes comuns da Sidebar: com grupos e badges, com submenu aninhado (SidebarMenuSub) e com campo de busca (SidebarInput).",
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

export const WithNavGroups: Story = {
  name: "With nav groups",
  parameters: { covers: ["accessibility.item6"] },
  render: () => <SidebarWithNavGroups />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Os grupos são separados por um separador", async () => {
      await expect(canvasElement.querySelectorAll("[data-slot='sidebar-group']").length).toBe(2);
      await expect(canvasElement.querySelector("[data-slot='sidebar-separator']")).not.toBeNull();
    });

    await step("A ação do grupo tem nome — o \"+\" sozinho não diz nada", async () => {
      const acao = canvas.getByRole("button", { name: "Adicionar notificação" });
      await expect(acao).toHaveAttribute("data-slot", "sidebar-group-action");
      await expect(acao.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    });

    await step("O contador é texto de apoio, não o item de menu", async () => {
      const badges = canvasElement.querySelectorAll("[data-slot='sidebar-menu-badge']");
      await expect(Array.from(badges).map((b) => b.textContent?.trim())).toEqual(["12", "3"]);
    });

    await step("O Tab alcança os itens e as ações — nenhuma parada sem nome", async () => {
      const primeiro = canvas.getByRole("button", { current: "page" });
      primeiro.focus();
      const alcancados: string[] = [];
      for (let i = 0; i < 5; i++) {
        await userEvent.tab();
        const ativo = document.activeElement as HTMLElement | null;
        if (!ativo) continue;
        // `aria-label` ANTES do texto: onde ele existe, é ele que vence no
        // cálculo do nome acessível.
        alcancados.push(ativo.getAttribute("aria-label") ?? ativo.textContent?.trim() ?? "");
      }
      await expect(alcancados).toContain("Adicionar notificação");
      await expect(alcancados).not.toContain("");
      // Devolve o foco ao ponto de partida para o replay.
      primeiro.blur();
    });
  },
};

export const WithSubmenu: Story = {
  name: "With nested submenu",
  render: () => <SidebarWithSubMenu />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const pai = () => canvas.getByRole("button", { name: /componentes/i });

    // Par idempotente: só clica quando o estado atual não é o desejado, então o
    // replay do painel Interactions (que roda no MESMO DOM) chega ao mesmo fim.
    const definir = async (aberto: boolean) => {
      const alvo = pai();
      if (alvo.getAttribute("aria-expanded") !== String(aberto)) await userEvent.click(alvo);
      await waitFor(() => expect(pai()).toHaveAttribute("aria-expanded", String(aberto)));
    };

    await step("O submenu é uma lista aninhada de verdade", async () => {
      const sub = canvasElement.querySelector<HTMLElement>("[data-slot='sidebar-menu-sub']")!;
      await expect(sub.tagName).toBe("UL");
      await expect(sub.closest("[data-slot='sidebar-menu-item']")).not.toBeNull();
      await expect(sub.querySelectorAll("[data-slot='sidebar-menu-sub-item']").length).toBe(4);
    });

    await step("A ação do item tem nome próprio, separado do item", async () => {
      const acao = canvas.getByRole("button", { name: "Mais opções de configurações" });
      await expect(acao).toHaveAttribute("data-slot", "sidebar-menu-action");
    });

    await step("Fechar recolhe o submenu, e reabrir o traz de volta", async () => {
      // Sem `aria-expanded` a chevron gira só para quem vê: quem ouve não
      // recebe aviso nenhum de que há um nível abaixo, nem de que ele abriu.
      await definir(false);
      await expect(canvasElement.querySelector("[data-slot='sidebar-menu-sub']")).toBeNull();

      await definir(true);
      await expect(canvasElement.querySelector("[data-slot='sidebar-menu-sub']")).not.toBeNull();
    });
  },
};

export const WithSearch: Story = {
  name: "With SidebarInput (search)",
  render: () => <SidebarWithSearch />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const busca = () => canvas.getByRole("searchbox", { name: "Buscar na navegação" });

    await step("O campo de busca tem nome — o placeholder some ao digitar", async () => {
      await expect(busca()).toHaveAttribute("data-slot", "sidebar-input");
      await expect(busca().closest("[data-slot='sidebar-header']")).not.toBeNull();
    });

    await step("Digitar filtra os itens, e o rótulo do grupo conta quantos sobraram", async () => {
      // Par idempotente: digita, confere, limpa e confere o estado de entrada.
      await userEvent.clear(busca());
      await expect(canvasElement.querySelectorAll("[data-slot='sidebar-menu-item']").length).toBe(6);

      await userEvent.type(busca(), "tok");
      await waitFor(async () => {
        await expect(canvasElement.querySelectorAll("[data-slot='sidebar-menu-item']").length).toBe(1);
      });
      await expect(canvas.getByText("Resultados (1)")).toBeInTheDocument();

      await userEvent.clear(busca());
      await waitFor(async () => {
        await expect(canvasElement.querySelectorAll("[data-slot='sidebar-menu-item']").length).toBe(6);
      });
    });
  },
};
