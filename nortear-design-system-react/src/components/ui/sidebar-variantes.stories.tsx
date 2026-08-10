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
    docs: {
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

export const VariantSidebar: Story = {
  render: () => <SidebarPreview variant="sidebar" />,
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

export const VariantFloating: Story = {
  render: () => <SidebarPreview variant="floating" />,
  play: async ({ canvasElement, step }) => {
    await step("Sidebar floating renderiza com data-slot=sidebar", async () => {
      const sidebar = canvasElement.querySelector("[data-slot='sidebar']");
      await expect(sidebar).toBeInTheDocument();
    });
    await step("nav com aria-label está presente", async () => {
      const nav = within(canvasElement).getByRole("navigation", { name: /navegação principal/i });
      await expect(nav).toBeInTheDocument();
    });
  },
};

export const VariantInset: Story = {
  render: () => <SidebarPreview variant="inset" />,
  play: async ({ canvasElement, step }) => {
    await step("Sidebar inset renderiza com data-slot=sidebar", async () => {
      const sidebar = canvasElement.querySelector("[data-slot='sidebar']");
      await expect(sidebar).toBeInTheDocument();
    });
    await step("nav com aria-label está presente", async () => {
      const nav = within(canvasElement).getByRole("navigation", { name: /navegação principal/i });
      await expect(nav).toBeInTheDocument();
    });
  },
};

export const CollapsibleOffcanvas: Story = {
  render: () => <SidebarPreview variant="sidebar" collapsible="offcanvas" />,
  play: async ({ canvasElement, step }) => {
    await step("Sidebar offcanvas renderiza com data-slot=sidebar", async () => {
      const sidebar = canvasElement.querySelector("[data-slot='sidebar']");
      await expect(sidebar).toBeInTheDocument();
    });
  },
};

export const CollapsibleIcon: Story = {
  render: () => <SidebarPreview variant="sidebar" collapsible="icon" />,
  play: async ({ canvasElement, step }) => {
    await step("Sidebar icon renderiza com data-slot=sidebar", async () => {
      const sidebar = canvasElement.querySelector("[data-slot='sidebar']");
      await expect(sidebar).toBeInTheDocument();
    });
  },
};

export const CollapsibleNone: Story = {
  render: () => <SidebarPreview variant="sidebar" collapsible="none" />,
  play: async ({ canvasElement, step }) => {
    await step("Sidebar none renderiza com data-slot=sidebar", async () => {
      const sidebar = canvasElement.querySelector("[data-slot='sidebar']");
      await expect(sidebar).toBeInTheDocument();
    });
  },
};

export const SideLeft: Story = {
  render: () => <SidebarPreview variant="sidebar" side="left" />,
  play: async ({ canvasElement, step }) => {
    await step("Sidebar left renderiza com data-slot=sidebar", async () => {
      const sidebar = canvasElement.querySelector("[data-slot='sidebar']");
      await expect(sidebar).toBeInTheDocument();
    });
  },
};

export const SideRight: Story = {
  render: () => <SidebarPreview variant="sidebar" side="right" />,
  play: async ({ canvasElement, step }) => {
    await step("Sidebar right renderiza com data-slot=sidebar", async () => {
      const sidebar = canvasElement.querySelector("[data-slot='sidebar']");
      await expect(sidebar).toBeInTheDocument();
    });
  },
};
