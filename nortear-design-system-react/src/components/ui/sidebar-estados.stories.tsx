import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect } from "storybook/test";
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
  render: () => <SidebarStatePreview defaultOpen={false} collapsible="icon" label="Sidebar icon mode (collapsible=icon, defaultOpen=false)" />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Sidebar está em estado collapsed", async () => {
      const sidebar = canvasElement.querySelector("[data-slot='sidebar']");
      await expect(sidebar).toBeInTheDocument();
      await expect(sidebar).toHaveAttribute("data-state", "collapsed");
    });

    await step("SidebarTrigger está disponível para expandir", async () => {
      const trigger = canvas.getByRole("button", { name: /toggle sidebar/i });
      await expect(trigger).toBeInTheDocument();
      await userEvent.click(trigger);
    });

    await step("Após clicar, sidebar expande", async () => {
      const sidebar = canvasElement.querySelector("[data-slot='sidebar']");
      await expect(sidebar).toHaveAttribute("data-state", "expanded");
    });
  },
};

export const Offcanvas: Story = {
  name: "State: offcanvas (hidden)",
  render: () => <SidebarStatePreview defaultOpen={false} collapsible="offcanvas" label="Sidebar offcanvas (colapsada fora da viewport)" />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Sidebar está collapsed no modo offcanvas", async () => {
      const sidebar = canvasElement.querySelector("[data-slot='sidebar']");
      await expect(sidebar).toHaveAttribute("data-state", "collapsed");
      await expect(sidebar).toHaveAttribute("data-collapsible", "offcanvas");
    });

    await step("Clicar no trigger abre a sidebar", async () => {
      const trigger = canvas.getByRole("button", { name: /toggle sidebar/i });
      await userEvent.click(trigger);
    });

    await step("Sidebar agora está expandida", async () => {
      const sidebar = canvasElement.querySelector("[data-slot='sidebar']");
      await expect(sidebar).toHaveAttribute("data-state", "expanded");
    });
  },
};

export const Fixed: Story = {
  name: "State: fixed (collapsible=none)",
  render: () => <SidebarStatePreview defaultOpen={true} collapsible="none" label="Sidebar fixa (collapsible=none)" />,
  play: async ({ canvasElement, step }) => {
    await step("Sidebar sem data-state (collapsible=none)", async () => {
      const sidebar = canvasElement.querySelector("[data-slot='sidebar']");
      await expect(sidebar).toBeInTheDocument();
      // collapsible=none retorna div sem data-state
      await expect(sidebar).not.toHaveAttribute("data-state");
    });
  },
};

export const Loading: Story = {
  name: "State: loading (SidebarMenuSkeleton)",
  render: () => <SidebarLoadingPreview />,
  play: async ({ canvasElement, step }) => {
    await step("SidebarMenuSkeleton está presente", async () => {
      const skeletons = canvasElement.querySelectorAll("[data-sidebar='menu-skeleton']");
      await expect(skeletons.length).toBeGreaterThan(0);
    });
  },
};
