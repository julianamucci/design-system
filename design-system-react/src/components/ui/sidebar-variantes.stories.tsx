import type { Meta, StoryObj } from "@storybook/react";
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
                    <SidebarMenuButton tooltip="Configurações">
                      <Settings aria-hidden="true" />
                      <span>Configurações</span>
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
          <span className="text-sm font-medium">
            variant=&quot;{variant}&quot;{collapsible !== "offcanvas" ? ` collapsible="${collapsible}"` : ""}
            {side !== "left" ? ` side="${side}"` : ""}
          </span>
        </header>
        <div className="p-6 text-sm text-muted-foreground">Conteúdo principal</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
  title: "UI/Sidebar/Variantes",
  component: Sidebar,
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Variantes visuais da Sidebar: **sidebar** (padrão colada à borda), **floating** (com sombra e border-radius) e **inset** (conteúdo com container arredondado adjacente). Além das variantes de `side`: **left** e **right**.",
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

export const VariantSidebar: Story = {
  name: "Variant: sidebar",
  render: () => <SidebarPreview variant="sidebar" />,
};

export const VariantFloating: Story = {
  name: "Variant: floating",
  render: () => <SidebarPreview variant="floating" />,
};

export const VariantInset: Story = {
  name: "Variant: inset",
  render: () => <SidebarPreview variant="inset" />,
};

export const CollapsibleOffcanvas: Story = {
  name: "Collapsible: offcanvas",
  render: () => <SidebarPreview variant="sidebar" collapsible="offcanvas" />,
};

export const CollapsibleIcon: Story = {
  name: "Collapsible: icon",
  render: () => <SidebarPreview variant="sidebar" collapsible="icon" />,
};

export const CollapsibleNone: Story = {
  name: "Collapsible: none",
  render: () => <SidebarPreview variant="sidebar" collapsible="none" />,
};

export const SideLeft: Story = {
  name: "Side: left",
  render: () => <SidebarPreview variant="sidebar" side="left" />,
};

export const SideRight: Story = {
  name: "Side: right",
  render: () => <SidebarPreview variant="sidebar" side="right" />,
};
