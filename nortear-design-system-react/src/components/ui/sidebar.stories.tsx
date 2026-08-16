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
  /** Ponto de virada entre coluna e gaveta — prop do Provider, não da barra. */
  mobileQuery?: string;
}

function SidebarStory({ side, variant, collapsible, defaultOpen, mobileQuery }: SidebarStoryProps) {
  return (
    <SidebarProvider defaultOpen={defaultOpen ?? true} mobileQuery={mobileQuery}>
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
      table: { type: { summary: '"left" | "right"' }, defaultValue: { summary: '"left"' } },
    },
    variant: {
      control: "select",
      options: ["sidebar", "floating", "inset"],
      description: "Estilo visual da sidebar",
      table: {
        type: { summary: '"sidebar" | "floating" | "inset"' },
        defaultValue: { summary: '"sidebar"' },
      },
    },
    collapsible: {
      control: "select",
      options: ["offcanvas", "icon", "none"],
      description: "Comportamento ao recolher",
      table: {
        type: { summary: '"offcanvas" | "icon" | "none"' },
        defaultValue: { summary: '"offcanvas"' },
      },
    },
    mobileQuery: {
      control: "text",
      description:
        "Ponto de virada entre coluna e gaveta sobreposta. Uma consulta sempre verdadeira, como (min-width: 0px), força a gaveta em qualquer largura.",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: '"(max-width: 767px)"' },
      },
    },
  },
  args: {
    side: "left",
    variant: "sidebar",
    collapsible: "offcanvas",
    mobileQuery: "(max-width: 767px)",
  },
  // O tipo é o do andaime, e não `typeof Sidebar`: `mobileQuery` é prop do
  // Provider, não da barra, e a aba API Reference precisa dela declarada.
} satisfies Meta<SidebarStoryProps>;

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
      key={`${args.side}-${args.variant}-${args.collapsible}-${args.mobileQuery}`}
      side={args.side}
      variant={args.variant}
      collapsible={args.collapsible}
      mobileQuery={args.mobileQuery}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const raiz = () => canvasElement.querySelector<HTMLElement>("[data-slot='sidebar']")!;
    const gatilho = () => canvas.getByRole("button", { name: /alternar barra lateral/i });

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

    await step("O gatilho tem nome acessível, e em português", async () => {
      // Nome EXATO, e não presença: o gatilho é só um ícone, e o nome dele é a
      // única coisa que quem usa leitor de tela recebe. Enquanto o texto era
      // "Toggle Sidebar", nenhuma asserção reprovava — a consulta por papel
      // casava o inglês tão bem quanto casaria qualquer outra coisa.
      await expect(gatilho()).toHaveAccessibleName("Alternar barra lateral");
      // A faixa repete a ação com o ponteiro, e a dica dela é o mesmo texto.
      const faixa = canvasElement.querySelector<HTMLButtonElement>("[data-slot='sidebar-rail']")!;
      await expect(faixa.title).toBe("Alternar barra lateral");
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
      await expect(canvas.getAllByRole("button", { name: /alternar barra lateral/i })).toHaveLength(1);

      const antes = raiz().getAttribute("data-state");
      faixa.click();
      await waitFor(() => expect(raiz().getAttribute("data-state")).not.toBe(antes));
      faixa.click();
      await waitFor(() => expect(raiz().getAttribute("data-state")).toBe(antes));
    });
  },
};
