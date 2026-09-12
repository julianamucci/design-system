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
import { TOOLTIP_DEFAULT_DELAY } from "./tooltip";
import { balaoDe } from "./tooltip.fixtures";
import {
  sidebarLoadingSource,
  sidebarExpandidaSource,
  sidebarMovelSource,
  iconsSidebarRecolhidaSource,
  sidebarRecolhidaOffcanvasSource,
  sidebarNoRecolhimentoSource,
  sidebarSource,
} from "./sidebar.source";

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Atraso de abertura que o `@base-ui/react` aplica quando NINGUÉM declara um —
 * o `OPEN_DELAY` de `tooltip/utils/constants.js`.
 *
 * Escrito aqui para ser o TETO da medição, e não para ser usado: é o valor que
 * assumiria o lugar se o `TooltipProvider` da casa saísse do `SidebarProvider`,
 * e foi o que o trilho desta stack fez até 2026-09-12 sem ninguém ter escolhido.
 * Uma asserção que só perguntasse "abriu?" ficaria verde com ele de volta.
 */
const LIB_OPEN_DELAY = 600;

/** Pausa explícita — só onde a asserção é "continua assim depois de X". */
function wait(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

/**
 * Instante em que o balão do item apareceu, por relógio.
 *
 * Laço de relógio, e não `waitFor`: o que se afirma é TEMPO, e um prazo de
 * `waitFor` diria "apareceu em algum momento" — exatamente o que não distingue
 * 300 ms de 600. E o laço só LÊ (`aria-describedby` + `getElementById`): um
 * `waitFor` cuja condição TOCA o DOM reagenda a si mesmo por observador de
 * mutação, o prazo nunca chega e o arquivo morre sem resultado nem falha.
 *
 * Passo de 10 ms porque a medição é de borda — granularidade grossa comeria a
 * margem entre o padrão da casa e o da biblioteca.
 */
async function bubbleShownAt(trigger: HTMLElement, budget: number): Promise<number> {
  const deadline = performance.now() + budget;
  while (performance.now() < deadline) {
    if (balaoDe(trigger) !== null) {
      return performance.now();
    }
    await wait(10);
  }
  return Number.POSITIVE_INFINITY;
}

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
  title: "Components/Layout/Sidebar/States",
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
      source: { transform: iconsSidebarRecolhidaSource },
    },
  },
  render: () => <SidebarStatePreview defaultOpen={false} collapsible="icon" label="Sidebar icon mode (collapsible=icon, defaultOpen=false)" />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = () => canvasElement.querySelector<HTMLElement>("[data-slot='sidebar']")!;

    await step("A barra nasce recolhida em ícones", async () => {
      await expect(root()).toHaveAttribute("data-state", "collapsed");
      await expect(root()).toHaveAttribute("data-collapsible", "icon");
    });

    await step("O painel estreita para a largura de ícone", async () => {
      // Mede o pixel declarado, e não o atributo: a regra que estreita é
      // `[data-collapsible="icon"] .nds-sidebar-panel { width: … }`. Usa o
      // computado porque abaixo de 48rem o painel é `display: none`.
      const panel = root().querySelector<HTMLElement>(".nds-sidebar-panel")!;
      const emRem = parseFloat(getComputedStyle(root()).getPropertyValue("--sidebar-width-icon"));
      const px = emRem * parseFloat(getComputedStyle(document.documentElement).fontSize);
      await expect(Math.round(parseFloat(getComputedStyle(panel).width))).toBe(Math.round(px));
    });

    await step("O ponteiro sobre o item abre o balão com o nome da seção", async () => {
      // Sem rótulo visível, o balão é o que resta para quem usa ponteiro — e
      // ele só pode aparecer enquanto a barra está recolhida.
      //
      // A medição do atraso vem PRIMEIRO, antes de qualquer outro balão desta
      // story: o provedor monta um grupo de espera, e dentro dele o segundo
      // balão abre na hora. Medir depois de um vizinho mediria a cortesia do
      // grupo, não o atraso.
      const item = canvas.getByRole("button", { current: "page" });
      const start = performance.now();
      await userEvent.hover(item);

      // Passar o mouse não acende. Se o provedor da casa sumisse do
      // `SidebarProvider` o atraso não cairia a zero — cairia para o da
      // biblioteca —, mas se alguém declarasse `delay={0}` por atalho, o balão
      // já estaria aqui.
      await expect(balaoDe(item)).toBeNull();
      await wait(TOOLTIP_DEFAULT_DELAY / 2);
      await expect(balaoDe(item)).toBeNull();

      const openedAfter = (await bubbleShownAt(item, LIB_OPEN_DELAY * 4)) - start;
      // O teto é o atraso da BIBLIOTECA. Sem o `TooltipProvider` da casa dentro
      // do `SidebarProvider`, o gatilho do base-ui cai no `OPEN_DELAY` de 600 e
      // esta linha reprova — que é a diferença entre afirmar "abriu" e afirmar
      // "abriu no atraso que esta casa escolheu".
      await expect(openedAfter).toBeLessThan(LIB_OPEN_DELAY);
      await expect(balaoDe(item)).toHaveAttribute("role", "tooltip");
      await expect(balaoDe(item)!.textContent?.trim()).toBe("Dashboard");

      // Devolve o DOM ao estado de entrada para o replay.
      await userEvent.unhover(item);
      await waitFor(
        () => expect(document.querySelector("[data-slot='tooltip-content']")).toBeNull(),
        { timeout: 3000 },
      );
    });

    await step("Pelo teclado o balão abre na hora — a espera é só do ponteiro", async () => {
      // WCAG 1.4.13: quem chega por teclado não tem como "parar em cima", então
      // prender o foco ao atraso do ponteiro esconderia o nome do destino de
      // quem mais precisa dele — no trilho recolhido não há rótulo visível.
      //
      // O Tab de verdade é o que põe o navegador em modalidade de teclado: o
      // `useFocus` do base-ui só abre para foco que casa `:focus-visible`, e
      // depois do hover acima um `focus()` cru não casaria.
      const item = canvas.getByRole("button", { current: "page" });
      await userEvent.tab();
      const start = performance.now();
      item.focus();
      await expect(item).toHaveFocus();

      const openedAfter = (await bubbleShownAt(item, LIB_OPEN_DELAY * 4)) - start;
      // Teto é o atraso do PONTEIRO: se o foco passar a esperar qualquer coisa
      // parecida com ele, reprova.
      await expect(openedAfter).toBeLessThan(TOOLTIP_DEFAULT_DELAY);

      item.blur();
      await waitFor(
        () => expect(document.querySelector("[data-slot='tooltip-content']")).toBeNull(),
        { timeout: 3000 },
      );
    });

    await step("O gatilho expande — e recolhe de volta", async () => {
      // Par idempotente: uma inversão só faria a segunda rodada do painel
      // Interactions afirmar o oposto.
      const trigger = canvas.getByRole("button", { name: /alternar barra lateral/i });
      await userEvent.click(trigger);
      await waitFor(() => expect(root()).toHaveAttribute("data-state", "expanded"));
      await userEvent.click(trigger);
      await waitFor(() => expect(root()).toHaveAttribute("data-state", "collapsed"));
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
    const root = () => canvasElement.querySelector<HTMLElement>("[data-slot='sidebar']")!;

    await step("Recolhida em offcanvas, o vão do fluxo zera", async () => {
      await expect(root()).toHaveAttribute("data-state", "collapsed");
      await expect(root()).toHaveAttribute("data-collapsible", "offcanvas");

      const vao = root().querySelector<HTMLElement>(".nds-sidebar-gap-inner")!;
      await expect(Math.round(parseFloat(getComputedStyle(vao).width))).toBe(0);
    });

    await step("O gatilho abre — e fecha de volta", async () => {
      const trigger = canvas.getByRole("button", { name: /alternar barra lateral/i });
      await userEvent.click(trigger);
      await waitFor(() => expect(root()).toHaveAttribute("data-state", "expanded"));
      await userEvent.click(trigger);
      await waitFor(() => expect(root()).toHaveAttribute("data-state", "collapsed"));
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
      source: { transform: sidebarNoRecolhimentoSource },
    },
  },
  render: () => <SidebarStatePreview defaultOpen={true} collapsible="none" label="Sidebar fixa (collapsible=none)" />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Sem recolhimento não há estado de recolhimento", async () => {
      const root = canvasElement.querySelector<HTMLElement>("[data-slot='sidebar']")!;
      await expect(root).toHaveClass("nds-sidebar-static");
      await expect(root).not.toHaveAttribute("data-state");
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
      source: { transform: sidebarLoadingSource },
    },
  },
  render: () => <SidebarLoadingPreview />,
  play: async ({ canvasElement, step }) => {
    await step("Cada item de menu vira um placeholder", async () => {
      const skeletons = canvasElement.querySelectorAll("[data-slot='sidebar-menu-skeleton']");
      await expect(skeletons.length).toBe(5);
    });

    await step("showIcon monta o quadrado do ícone à esquerda do texto", async () => {
      const first = canvasElement.querySelector<HTMLElement>(
        "[data-slot='sidebar-menu-skeleton']",
      )!;
      const icone = first.querySelector<HTMLElement>(".nds-sidebar-menu-skeleton-icon")!;
      const text = first.querySelector<HTMLElement>(".nds-sidebar-menu-skeleton-text")!;
      await expect(icone).not.toBeNull();
      await expect(icone.getBoundingClientRect().left).toBeLessThan(
        text.getBoundingClientRect().left,
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
    const trigger = () => canvas.getByRole("button", { name: /alternar barra lateral/i });
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
      await userEvent.click(trigger());
      await waitFor(() => expect(gaveta()).not.toBeNull());
    });

    await step("A gaveta é um diálogo modal COM nome", async () => {
      // Sem nome o leitor de tela anuncia "diálogo" e mais nada; sem
      // `aria-modal` ele continua oferecendo a página de baixo, que está
      // coberta. O par título/descrição é sr-only: existe para quem ouve.
      const dialogo = gaveta()!;
      await expect(dialogo).toHaveAttribute("role", "dialog");
      await expect(dialogo).toHaveAttribute("aria-modal", "true");
      const labelledBy = dialogo.getAttribute("aria-labelledby");
      await expect(labelledBy).toBeTruthy();
      // Nome em português por padrão: era "Sidebar", cravado no componente.
      await expect(document.getElementById(labelledBy!)?.textContent?.trim()).toBe(
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
      await waitFor(() => expect(document.activeElement).toBe(trigger()));
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
      await userEvent.click(trigger());
      // `waitForPortal` gateia na opacidade computada: `toBeVisible()` do
      // jest-dom só reprova em opacidade exatamente 0, e a gaveta entra com
      // animação — sem o gate, a foto poderia sair no meio do fade.
      const panel = await waitForPortal("dialog", { name: /barra lateral/i });
      await expect(panel).toBeVisible();
      await expect(panel).toBe(gaveta());
    });
  },
};
