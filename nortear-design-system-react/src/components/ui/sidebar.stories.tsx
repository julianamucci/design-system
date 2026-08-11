import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, waitFor, within, expect } from "storybook/test";
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
  SidebarRail,
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
          {/* A faixa alterna a barra pela borda, com o ponteiro: é o par de
              desktop do gatilho. `tabIndex={-1}` de propósito — duas paradas
              de teclado para a mesma ação seria ruído. */}
          <SidebarRail />
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
  parameters: {
    covers: [
      "functional.item1", "functional.item2", "functional.item6",
      "accessibility.item1", "accessibility.item2", "accessibility.item3",
      "accessibility.item4", "accessibility.item5",
      "visual.item1",
    ],
  },
  render: (args) => (
    <SidebarStory
      key={`${args.side}-${args.variant}-${args.collapsible}`}
      side={args.side}
      variant={args.variant}
      collapsible={args.collapsible}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const raiz = () => canvasElement.querySelector<HTMLElement>("[data-slot='sidebar']")!;
    const gatilho = () => canvas.getByRole("button", { name: /toggle sidebar/i });

    await step("A navegação tem nome acessível", async () => {
      // Sem nome no <nav>, a barra é só "navegação" na lista de marcos do
      // leitor de tela — indistinguível de qualquer outra da página.
      await expect(canvas.getByRole("navigation", { name: /navegação principal/i })).toBeInTheDocument();
    });

    await step("O item ativo é anunciado como página atual", async () => {
      // `data-active` é para o CSS; quem não vê a cor precisa do aria-current.
      const ativo = canvas.getByRole("button", { current: "page" });
      await expect(ativo).toHaveAttribute("data-active", "true");
      await expect(ativo).toHaveTextContent("Dashboard");
    });

    await step("O ícone do item não é lido pelo leitor de tela", async () => {
      const icone = canvasElement.querySelector<SVGElement>(
        "[data-slot='sidebar-menu-button'] svg",
      )!;
      await expect(icone.getAttribute("aria-hidden")).toBe("true");
    });

    await step("O gatilho tem nome acessível", async () => {
      await expect(gatilho()).toBeInTheDocument();
    });

    await step("O gatilho alterna o estado — e volta", async () => {
      // Par idempotente: o painel Interactions reexecuta a play no mesmo DOM,
      // e uma única inversão faria a segunda rodada afirmar o oposto.
      const antes = raiz().getAttribute("data-state");
      await userEvent.click(gatilho());
      await waitFor(() => expect(raiz().getAttribute("data-state")).not.toBe(antes));
      await userEvent.click(gatilho());
      await waitFor(() => expect(raiz().getAttribute("data-state")).toBe(antes));
    });

    await step("Ctrl+B alterna de qualquer lugar da página", async () => {
      const antes = raiz().getAttribute("data-state");
      await userEvent.keyboard("{Control>}b{/Control}");
      await waitFor(() => expect(raiz().getAttribute("data-state")).not.toBe(antes));
      await userEvent.keyboard("{Control>}b{/Control}");
      await waitFor(() => expect(raiz().getAttribute("data-state")).toBe(antes));
    });

    await step("A faixa alterna sem duplicar o gatilho para quem não usa ponteiro", async () => {
      const faixa = canvasElement.querySelector<HTMLButtonElement>("[data-slot='sidebar-rail']")!;
      await expect(faixa.tabIndex).toBe(-1);
      // A faixa é o par de ponteiro do gatilho, e faz exatamente a mesma coisa.
      // Fora da ordem de tabulação E fora da árvore de acessibilidade: anunciada,
      // ela seria um segundo botão com o mesmo nome, para a mesma ação, sem foco.
      // A prova é o gatilho continuar sendo o único elemento com esse nome.
      await expect(faixa).toHaveAttribute("aria-hidden", "true");
      await expect(canvas.getAllByRole("button", { name: /toggle sidebar/i })).toHaveLength(1);

      const antes = raiz().getAttribute("data-state");
      faixa.click();
      await waitFor(() => expect(raiz().getAttribute("data-state")).not.toBe(antes));
      faixa.click();
      await waitFor(() => expect(raiz().getAttribute("data-state")).toBe(antes));
    });
  },
};
