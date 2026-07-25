import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect } from "storybook/test";
import {
  LayoutDashboard,
  Blocks,
  Coins,
  Settings,
  User,
  Bell,
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
  SidebarSeparator,
  SidebarTrigger,
} from "./sidebar";
import { SidebarDocs } from "@/components/docs/SidebarDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

// ─── SidebarStory wrapper ─────────────────────────────────────────────────────

interface SidebarStoryProps {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  defaultOpen?: boolean;
}

function SidebarStory({ side, variant, collapsible, defaultOpen }: SidebarStoryProps) {
  return (
    <SidebarProvider defaultOpen={defaultOpen ?? true}>
      <nav aria-label="Navegação principal">
        <Sidebar side={side} variant={variant} collapsible={collapsible}>
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
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Notificações">
                      <Bell aria-hidden="true" />
                      <span>Notificações</span>
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
          <span className="nds-text-body nds-text-muted-foreground">Conteúdo principal</span>
        </header>
        <div className="nds-p-6">
          <p className="nds-text-body">
            Use os controles do painel para alterar <code>variant</code>, <code>collapsible</code> e <code>side</code>.
          </p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
  title: "UI/Sidebar",
  component: Sidebar,
  tags: ["autodocs", "layout"],
  parameters: {
    layout: "fullscreen",
    docs: { page: withAutoDocsTab(SidebarDocs) },
  },
  decorators: [
    (Story) => (
      <div className="nds-cluster nds-min-h-100">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    side: {
      control: "select",
      options: ["left", "right"],
      description: "Posição da sidebar",
    },
    variant: {
      control: "select",
      options: ["sidebar", "floating", "inset"],
      description: "Estilo visual da sidebar",
    },
    collapsible: {
      control: "select",
      options: ["offcanvas", "icon", "none"],
      description: "Comportamento ao recolher",
    },
  },
  args: {
    side: "left",
    variant: "sidebar",
    collapsible: "offcanvas",
  },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => (
    <SidebarStory
      side={args.side}
      variant={args.variant}
      collapsible={args.collapsible}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Sidebar está presente no DOM", async () => {
      const nav = canvas.getByRole("navigation", { name: /navegação principal/i });
      await expect(nav).toBeInTheDocument();
    });

    await step("Item ativo tem aria-current=page", async () => {
      const activeBtn = canvas.getByRole("button", { current: "page" });
      await expect(activeBtn).toBeInTheDocument();
    });

    await step("SidebarTrigger está acessível", async () => {
      const trigger = canvas.getByRole("button", { name: /toggle sidebar/i });
      await expect(trigger).toBeInTheDocument();
    });

    await step("Clicar no SidebarTrigger alterna sidebar", async () => {
      const wrapper = canvasElement.querySelector("[data-slot='sidebar-wrapper']");
      await expect(wrapper).toBeInTheDocument();
      const trigger = canvas.getByRole("button", { name: /toggle sidebar/i });
      await userEvent.click(trigger);
    });
  },
};
