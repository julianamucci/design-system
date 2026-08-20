import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, waitFor, within, expect } from "storybook/test";
import { waitForPortal } from "@/lib/wait-for-portal";
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
import {
  sidebarCarregandoSource,
  sidebarExpandidaSource,
  sidebarMovelSource,
  sidebarRecolhidaEmIconesSource,
  sidebarRecolhidaOffcanvasSource,
  sidebarSemRecolhimentoSource,
  sidebarSource,
} from "./sidebar.source";

// ─── Helper ───────────────────────────────────────────────────────────────────

interface SidebarStatePreviewProps {
  defaultOpen?: boolean;
  collapsible?: "offcanvas" | "icon" | "none";
  label?: string;
  /**
   * Repassado ao Provider para escolher o ramo (coluna ou gaveta) sem depender
   * da largura real da janela. É o que torna o caminho móvel exercitável.
   */
  mobileQuery?: string;
  /** Classe de quem compõe — precisa chegar ao painel nas duas larguras. */
  sidebarClassName?: string;
}

function SidebarStatePreview({
  defaultOpen = true,
  collapsible = "offcanvas",
  label = "Conteúdo principal",
  mobileQuery,
  sidebarClassName,
}: SidebarStatePreviewProps) {
  return (
    <SidebarProvider defaultOpen={defaultOpen} mobileQuery={mobileQuery}>
      <nav aria-label="Navegação principal">
        <Sidebar collapsible={collapsible} className={sidebarClassName}>
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
      source: { transform: sidebarSource },
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
  parameters: {
    docs: {
      // O estado inicial é afirmado no `render`, e escrevê-lo é o que distingue
      // esta story das vizinhas que nascem recolhidas.
      source: { transform: sidebarExpandidaSource },
    },
  },
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
  parameters: {
    covers: ["functional.item4", "functional.item7", "visual.item2"],
    docs: {
      // O par `defaultOpen={false}` + `collapsible="icon"` é o que faz a barra
      // nascer estreita em vez de fora da tela; nenhum control o descreve.
      source: { transform: sidebarRecolhidaEmIconesSource },
    },
  },
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
      const gatilho = canvas.getByRole("button", { name: /alternar barra lateral/i });
      await userEvent.click(gatilho);
      await waitFor(() => expect(raiz()).toHaveAttribute("data-state", "expanded"));
      await userEvent.click(gatilho);
      await waitFor(() => expect(raiz()).toHaveAttribute("data-state", "collapsed"));
    });
  },
};

export const Offcanvas: Story = {
  name: "State: offcanvas (hidden)",
  parameters: {
    docs: {
      // Nasce recolhida para fora da tela: o estado inicial vive no `render`, e
      // o gatilho é o único caminho de volta.
      source: { transform: sidebarRecolhidaOffcanvasSource },
    },
  },
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
      const gatilho = canvas.getByRole("button", { name: /alternar barra lateral/i });
      await userEvent.click(gatilho);
      await waitFor(() => expect(raiz()).toHaveAttribute("data-state", "expanded"));
      await userEvent.click(gatilho);
      await waitFor(() => expect(raiz()).toHaveAttribute("data-state", "collapsed"));
    });
  },
};

export const Fixed: Story = {
  name: "State: fixed (collapsible=none)",
  parameters: {
    covers: ["functional.item5"],
    docs: {
      // Sem recolhimento não há gatilho no snippet: a AUSÊNCIA dele é parte do
      // caso, e é a mesma composição da variante sem recolhimento.
      source: { transform: sidebarSemRecolhimentoSource },
    },
  },
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
  parameters: {
    covers: ["functional.item9"],
    docs: {
      // O placeholder toma o lugar do destino DENTRO do mesmo item de menu — é
      // uma peça diferente na mesma estrutura, e o meta não a imprimiria.
      source: { transform: sidebarCarregandoSource },
    },
  },
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
 * A virada para a gaveta vem de `mobileQuery`, e não do tamanho da janela:
 * redimensionar o navegador dentro do teste é lento e frágil, e a regra de
 * virada é exatamente a mesma. `(min-width: 0px)` é sempre verdadeira, então o
 * ramo móvel é garantido — inclusive no runner headless, onde o parâmetro
 * `viewport` não mexe na largura. O `viewport` fica para a foto do Chromatic.
 */
export const Mobile: Story = {
  name: "State: mobile (gaveta sobreposta)",
  parameters: {
    viewport: { defaultViewport: "mobile1" },
    covers: ["functional.item3", "visual.item5"],
    docs: {
      // A consulta sempre verdadeira e a classe de marcação são sondas do teste.
      // O snippet mostra o ponto de virada como PRODUTO: `mobileQuery` existe
      // para a aplicação escolher onde a coluna vira gaveta.
      source: { transform: sidebarMovelSource },
    },
  },
  render: () => (
    <SidebarStatePreview
      defaultOpen={false}
      collapsible="offcanvas"
      mobileQuery="(min-width: 0px)"
      sidebarClassName="story-sidebar-marca"
      label="Mobile — abre como gaveta sobreposta"
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = () => canvas.getByRole("button", { name: /alternar barra lateral/i });
    // A gaveta vive num portal no fim do <body>, fora do canvasElement.
    const gaveta = () =>
      document.querySelector<HTMLElement>("[data-slot='sidebar'][data-mobile='true']");

    await step("Precondição do replay: a gaveta começa fechada", async () => {
      // Cada passo estabelece a própria precondição; sem isto a segunda rodada
      // do painel Interactions entraria com a gaveta já aberta e afirmaria o
      // oposto do que a primeira afirmou.
      if (gaveta()) {
        await userEvent.keyboard("{Escape}");
        await waitFor(() => expect(gaveta()).toBeNull());
      }
    });

    await step("Fechada, não há diálogo nem coluna no fluxo", async () => {
      await expect(canvasElement.querySelector(".nds-sidebar-panel")).toBeNull();
      await expect(canvasElement.querySelector(".nds-sidebar-gap-inner")).toBeNull();
      await expect(document.querySelector("[role='dialog']")).toBeNull();
    });

    await step("O gatilho abre a gaveta", async () => {
      await userEvent.click(gatilho());
      await waitFor(() => expect(gaveta()).not.toBeNull());
    });

    await step("A gaveta é um diálogo modal COM nome", async () => {
      // Sem nome o leitor de tela anuncia "diálogo" e mais nada; sem
      // `aria-modal` ele continua oferecendo a página de baixo, que está
      // coberta. O par título/descrição é sr-only: existe para quem ouve.
      const dialogo = gaveta()!;
      await expect(dialogo).toHaveAttribute("role", "dialog");
      await expect(dialogo).toHaveAttribute("aria-modal", "true");
      const rotuladoPor = dialogo.getAttribute("aria-labelledby");
      await expect(rotuladoPor).toBeTruthy();
      // Nome em português por padrão: era "Sidebar", cravado no componente.
      await expect(document.getElementById(rotuladoPor!)?.textContent?.trim()).toBe(
        "Barra lateral",
      );
    });

    await step("A navegação inteira foi para dentro da gaveta, e só ali", async () => {
      // A contagem por ATRIBUTO prova que o conteúdo continua inteiro; a
      // consulta por PAPEL, no documento todo, prova que ele não é anunciado
      // duas vezes — se a coluna sobrevivesse ao lado da gaveta, seriam dois.
      const dialogo = gaveta()!;
      await expect(dialogo.querySelectorAll("[data-slot='sidebar-menu-item']").length).toBe(5);
      await expect(within(document.body).getAllByRole("button", { name: /dashboard/i })).toHaveLength(1);
      await expect(within(dialogo).getByRole("button", { current: "page" })).toHaveTextContent(
        "Dashboard",
      );
    });

    await step("A classe de quem compõe chega ao painel também aqui", async () => {
      // Na coluna ela pousa em `.nds-sidebar-panel`. Se sumisse na gaveta, o
      // estilo de quem consome desapareceria só em tela estreita — o tipo de
      // defeito que nenhuma story larga alcança.
      await expect(gaveta()).toHaveClass("nds-sidebar-mobile");
      await expect(gaveta()).toHaveClass("story-sidebar-marca");
    });

    await step("O foco entra no painel", async () => {
      await waitFor(() => expect(gaveta()!.contains(document.activeElement)).toBe(true));
    });

    await step("Escape fecha e devolve o foco ao gatilho", async () => {
      // Devolver o foco é trabalho de quem abriu. Sem isto o foco cai no
      // <body> e quem navega por teclado volta ao começo da página.
      // UM Escape, não dois: enquanto o balão do item abria escondido ao foco,
      // ele engolia o primeiro e a gaveta só fechava no segundo.
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(gaveta()).toBeNull());
      await waitFor(() => expect(document.activeElement).toBe(gatilho()));
    });

    await step("Ctrl+B alterna a mesma gaveta — e a devolve fechada", async () => {
      await userEvent.keyboard("{Control>}b{/Control}");
      await waitFor(() => expect(gaveta()).not.toBeNull());
      await userEvent.keyboard("{Control>}b{/Control}");
      await waitFor(() => expect(gaveta()).toBeNull());
    });

    await step("Termina ABERTA: é este o estado que a foto registra", async () => {
      // `visual.item5` promete "gaveta sobreposta ABERTA", e o Chromatic
      // fotografa o estado final da play. Enquanto ela terminava fechada, o
      // item estava coberto no papel e em foto nenhuma — a captura mostrava a
      // página sem barra.
      //
      // O replay continua honesto: o primeiro passo fecha o que encontrar
      // aberto, e os pares abrir/fechar acima já provaram que os cliques
      // acontecem NESTA rodada. Este passo prova só o estado final.
      await userEvent.click(gatilho());
      // `waitForPortal` gateia na opacidade computada: `toBeVisible()` do
      // jest-dom só reprova em opacidade exatamente 0, e a gaveta entra com
      // animação — sem o gate, a foto poderia sair no meio do fade.
      const painel = await waitForPortal("dialog", { name: /barra lateral/i });
      await expect(painel).toBeVisible();
      await expect(painel).toBe(gaveta());
    });
  },
};
