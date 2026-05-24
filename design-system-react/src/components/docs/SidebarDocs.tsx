import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Blocks,
  Coins,
  Settings,
  User,
  Bell,
  Search,
  ChevronDown,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { useActiveSection } from "@/lib/use-active-section";
import { LanguageSwitcher } from "@/components/product/LanguageSwitcher";
import uiTranslations from "@/i18n/ui.json";
import sidebarTranslations from "@shared/content/sidebar/translations.json";

import { DocsHeader }        from "@/components/docs/shared/sections/DocsHeader";
import { DocsPageLayout }    from "@/components/docs/shared/sections/DocsPageLayout";
import { DocsDemonstration } from "@/components/docs/shared/sections/DocsDemonstration";
import { DocsAnatomy }       from "@/components/docs/shared/sections/DocsAnatomy";
import { DocsWhenToUse }     from "@/components/docs/shared/sections/DocsWhenToUse";
import { DocsDoDont }        from "@/components/docs/shared/sections/DocsDoDont";
import { DocsImport }        from "@/components/docs/shared/sections/DocsImport";
import { DocsVariants }      from "@/components/docs/shared/sections/DocsVariants";
import { DocsCompositions }  from "@/components/docs/shared/sections/DocsCompositions";
import { DocsStates }        from "@/components/docs/shared/sections/DocsStates";
import { DocsProps }         from "@/components/docs/shared/sections/DocsProps";
import { DocsTokens }        from "@/components/docs/shared/sections/DocsTokens";
import { DocsAccessibility } from "@/components/docs/shared/sections/DocsAccessibility";
import { DocsRelated }       from "@/components/docs/shared/sections/DocsRelated";
import { DocsNotes }         from "@/components/docs/shared/sections/DocsNotes";
import { DocsAnalytics }     from "@/components/docs/shared/sections/DocsAnalytics";
import { DocsTestes }        from "@/components/docs/shared/sections/DocsTestes";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

const priorityKeyMap: Record<string, string> = {
  high: "common.high",
  medium: "common.medium",
  low: "common.low",
};

// ─── Nav ─────────────────────────────────────────────────────────────────────

const getNavGroups = (t: (key: string) => string) => [
  {
    label: t("nav.overview"),
    sections: [
      { id: "demonstracao", label: t("nav.demonstration") },
      { id: "anatomia",     label: t("nav.anatomy") },
      { id: "quando-usar",  label: t("nav.usage") },
      { id: "do-dont",      label: t("nav.doDont") },
    ],
  },
  {
    label: t("nav.techRef"),
    sections: [
      { id: "importacao",   label: t("nav.import") },
      { id: "variantes",    label: t("nav.variants") },
      { id: "composicoes",  label: t("nav.compositions") },
      { id: "estados",      label: t("nav.states") },
      { id: "propriedades", label: t("nav.props") },
      { id: "tokens",       label: t("nav.tokens") },
    ],
  },
  {
    label: t("nav.context"),
    sections: [
      { id: "acessibilidade", label: t("nav.accessibility") },
      { id: "relacionados",   label: t("nav.related") },
      { id: "notas",          label: t("nav.notes") },
    ],
  },
  {
    label: t("nav.quality"),
    sections: [
      { id: "analytics", label: t("nav.analytics") },
      { id: "testes",    label: t("nav.testes") },
    ],
  },
];


// ─── Sidebar Demo Preview ─────────────────────────────────────────────────────

function SidebarDemoPreview({
  variant = "sidebar",
  collapsible = "offcanvas",
  side = "left",
  defaultOpen = true,
}: {
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  side?: "left" | "right";
  defaultOpen?: boolean;
}) {
  return (
    <div className="min-h-[300px] flex w-full overflow-hidden rounded-lg border border-border" style={{ contain: "layout" }}>
      <SidebarProvider defaultOpen={defaultOpen}>
        <nav aria-label="Navegação principal">
          <Sidebar variant={variant} collapsible={collapsible} side={side}>
            <SidebarHeader className="p-3">
              <span className="font-semibold text-xs text-sidebar-foreground">Design System</span>
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
          <header className="flex items-center gap-2 p-3 border-b border-border">
            <SidebarTrigger />
            <span className="text-xs text-muted-foreground">Conteúdo</span>
          </header>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

// ─── Composition previews ─────────────────────────────────────────────────────

function CompositionWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[260px] flex w-full overflow-hidden rounded-lg border border-border" style={{ contain: "layout" }}>
      {children}
    </div>
  );
}

function PreviewWithGroups() {
  return (
    <CompositionWrap>
      <SidebarProvider defaultOpen={true}>
        <nav aria-label="Navegação principal">
          <Sidebar variant="sidebar" collapsible="offcanvas">
            <SidebarHeader className="p-3">
              <span className="font-semibold text-xs text-sidebar-foreground">Design System</span>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Principal</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive aria-current="page">
                        <LayoutDashboard aria-hidden="true" />
                        <span>Dashboard</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <Blocks aria-hidden="true" />
                        <span>Componentes</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <Coins aria-hidden="true" />
                        <span>Tokens</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              <SidebarSeparator />
              <SidebarGroup>
                <SidebarGroupLabel>Conta</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <Settings aria-hidden="true" />
                        <span>Configurações</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <Bell aria-hidden="true" />
                        <span>Notificações</span>
                      </SidebarMenuButton>
                      <SidebarMenuBadge>5</SidebarMenuBadge>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <User aria-hidden="true" />
                        <span>Perfil</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </nav>
        <SidebarInset>
          <header className="flex items-center gap-2 p-3 border-b border-border">
            <SidebarTrigger />
            <span className="text-xs text-muted-foreground">Dashboard</span>
          </header>
        </SidebarInset>
      </SidebarProvider>
    </CompositionWrap>
  );
}

function PreviewWithSubMenu() {
  const [open, setOpen] = useState(false);
  return (
    <CompositionWrap>
      <SidebarProvider defaultOpen={true}>
        <nav aria-label="Navegação principal">
          <Sidebar variant="sidebar" collapsible="offcanvas">
            <SidebarHeader className="p-3">
              <span className="font-semibold text-xs text-sidebar-foreground">Design System</span>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Componentes</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive aria-current="page">
                        <LayoutDashboard aria-hidden="true" />
                        <span>Dashboard</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        aria-expanded={open}
                        onClick={() => setOpen((v) => !v)}
                      >
                        <Blocks aria-hidden="true" />
                        <span>Componentes</span>
                        <ChevronDown
                          aria-hidden="true"
                          className={`ml-auto transition-transform ${open ? "rotate-180" : ""}`}
                        />
                      </SidebarMenuButton>
                      {open && (
                        <SidebarMenuSub>
                          {["Alert", "Button", "Card", "Dialog"].map((name) => (
                            <SidebarMenuSubItem key={name}>
                              <SidebarMenuSubButton>{name}</SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <Coins aria-hidden="true" />
                        <span>Tokens</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Settings aria-hidden="true" />
                    <span>Configurações</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </Sidebar>
        </nav>
        <SidebarInset>
          <header className="flex items-center gap-2 p-3 border-b border-border">
            <SidebarTrigger />
            <span className="text-xs text-muted-foreground">Clique em "Componentes"</span>
          </header>
        </SidebarInset>
      </SidebarProvider>
    </CompositionWrap>
  );
}

function PreviewWithSearch() {
  return (
    <CompositionWrap>
      <SidebarProvider defaultOpen={true}>
        <nav aria-label="Navegação principal">
          <Sidebar variant="sidebar" collapsible="offcanvas">
            <SidebarHeader className="gap-2 p-3">
              <span className="font-semibold text-xs text-sidebar-foreground">Design System</span>
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-sidebar-foreground/60 pointer-events-none"
                />
                <SidebarInput type="search" placeholder="Buscar..." aria-label="Buscar navegação" className="pl-7 h-8 text-xs" />
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Navegação</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive aria-current="page">
                        <LayoutDashboard aria-hidden="true" />
                        <span>Dashboard</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <Blocks aria-hidden="true" />
                        <span>Componentes</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <Coins aria-hidden="true" />
                        <span>Tokens</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <Settings aria-hidden="true" />
                        <span>Configurações</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </nav>
        <SidebarInset>
          <header className="flex items-center gap-2 p-3 border-b border-border">
            <SidebarTrigger />
            <span className="text-xs text-muted-foreground">Busca no header</span>
          </header>
        </SidebarInset>
      </SidebarProvider>
    </CompositionWrap>
  );
}

function PreviewWithBadges() {
  return (
    <CompositionWrap>
      <SidebarProvider defaultOpen={true}>
        <nav aria-label="Navegação principal">
          <Sidebar variant="sidebar" collapsible="offcanvas">
            <SidebarHeader className="p-3">
              <span className="font-semibold text-xs text-sidebar-foreground">App</span>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive aria-current="page">
                        <LayoutDashboard aria-hidden="true" />
                        <span>Dashboard</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton aria-label="Notificações (12 não lidas)">
                        <Bell aria-hidden="true" />
                        <span>Notificações</span>
                      </SidebarMenuButton>
                      <SidebarMenuBadge>12</SidebarMenuBadge>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton aria-label="Componentes (3 atualizações)">
                        <Blocks aria-hidden="true" />
                        <span>Componentes</span>
                      </SidebarMenuButton>
                      <SidebarMenuBadge>3</SidebarMenuBadge>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <Settings aria-hidden="true" />
                        <span>Configurações</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </nav>
        <SidebarInset>
          <header className="flex items-center gap-2 p-3 border-b border-border">
            <SidebarTrigger />
            <span className="text-xs text-muted-foreground">Inbox</span>
          </header>
        </SidebarInset>
      </SidebarProvider>
    </CompositionWrap>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function SidebarDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(sidebarTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "sidebar",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "sidebar",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "sidebar",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Code strings ───────────────────────────────────────────────────────────

  const codeImportBasic = `import { SidebarProvider, Sidebar, SidebarTrigger } from "@/components/ui/sidebar";`;

  const codeImportFull = `import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";`;

  const codeVariantSidebar = `<SidebarProvider>
  <nav aria-label="Navegação principal">
    <Sidebar variant="sidebar" collapsible="offcanvas">
      {/* conteúdo */}
    </Sidebar>
  </nav>
  <SidebarInset>
    <SidebarTrigger />
    {/* conteúdo principal */}
  </SidebarInset>
</SidebarProvider>`;

  const codeVariantFloating = `<SidebarProvider>
  <nav aria-label="Navegação principal">
    <Sidebar variant="floating" collapsible="offcanvas">
      {/* conteúdo */}
    </Sidebar>
  </nav>
  <SidebarInset>
    <SidebarTrigger />
    {/* conteúdo principal */}
  </SidebarInset>
</SidebarProvider>`;

  const codeVariantInset = `<SidebarProvider>
  <nav aria-label="Navegação principal">
    <Sidebar variant="inset" collapsible="offcanvas">
      {/* conteúdo */}
    </Sidebar>
  </nav>
  <SidebarInset>
    <SidebarTrigger />
    {/* conteúdo principal */}
  </SidebarInset>
</SidebarProvider>`;

  const codeCollapsibleIcon = `<Sidebar collapsible="icon">
  {/* Labels são ocultados; tooltips exibidos ao hover */}
  <SidebarMenuButton tooltip="Dashboard">
    <LayoutDashboard aria-hidden="true" />
    <span>Dashboard</span>
  </SidebarMenuButton>
</Sidebar>`;

  const codeCustomizationTokens = `/* globals.css — personalização via tokens CSS */
:root {
  --sidebar:                  hsl(220 14% 96%);
  --sidebar-foreground:       hsl(220 9% 20%);
  --sidebar-accent:           hsl(220 14% 90%);
  --sidebar-accent-foreground: hsl(220 9% 10%);
  --sidebar-border:           hsl(220 13% 88%);
  --sidebar-ring:             hsl(220 91% 54%);
  --sidebar-width:            16rem;
  --sidebar-width-icon:       3rem;
}

.dark {
  --sidebar:                  hsl(222 47% 11%);
  --sidebar-foreground:       hsl(213 31% 91%);
  --sidebar-accent:           hsl(217 33% 18%);
  --sidebar-accent-foreground: hsl(213 31% 91%);
  --sidebar-border:           hsl(216 34% 17%);
}`;

  const interfaceCode = `// SidebarProvider
interface SidebarProviderProps extends React.ComponentProps<"div"> {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Sidebar
interface SidebarProps extends React.ComponentProps<"div"> {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
}

// SidebarMenuButton
interface SidebarMenuButtonProps extends React.ComponentProps<"button">,
  VariantProps<typeof sidebarMenuButtonVariants> {
  isActive?: boolean;
  tooltip?: string | React.ComponentProps<typeof TooltipContent>;
  render?: React.ReactElement;
}`;

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      header={
        <DocsHeader
          title={tContent("title")}
          description={tContent("description")}
          category={tContent("category")}
          type={tContent("type")}
          installNote="npx shadcn@latest add sidebar"
          languageSwitcher={<LanguageSwitcher />}
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <SidebarDemoPreview variant="sidebar" collapsible="offcanvas" defaultOpen={true} />
      </DocsDemonstration>

      {/* ── Anatomia ──────────────────────────────────────────────── */}
      <DocsAnatomy
        title={tContent("anatomy.title")}
        items={[
          tContent("anatomy.item1"),
          tContent("anatomy.item2"),
          tContent("anatomy.item3"),
          tContent("anatomy.item4"),
          tContent("anatomy.item5"),
          tContent("anatomy.item6"),
          tContent("anatomy.item7"),
          tContent("anatomy.item8"),
          tContent("anatomy.item9"),
          tContent("anatomy.item10"),
          tContent("anatomy.item11"),
          tContent("anatomy.item12"),
          tContent("anatomy.item13"),
          tContent("anatomy.item14"),
          tContent("anatomy.item15"),
          tContent("anatomy.item16"),
        ]}
        structureLabel={tContent("anatomy.structureLabel")}
        structureCode={tContent("anatomy.structureCode")}
      />

      {/* ── Quando Usar ───────────────────────────────────────────── */}
      <DocsWhenToUse
        title={tContent("usage.title")}
        guidelines={{
          title: tContent("usage.guidelines.title"),
          items: [
            tContent("usage.guidelines.item1"),
            tContent("usage.guidelines.item2"),
            tContent("usage.guidelines.item3"),
            tContent("usage.guidelines.item4"),
            tContent("usage.guidelines.item5"),
          ],
        }}
        scenarios={{
          title: tContent("usage.scenarios.title"),
          cols: {
            scenario: tContent("usage.scenarios.cols.scenario"),
            use: tContent("usage.scenarios.cols.use"),
            alternative: tContent("usage.scenarios.cols.alternative"),
          },
          items: [
            { s: tContent("usage.scenarios.item1.s"), u: tContent("usage.scenarios.item1.u"), a: tContent("usage.scenarios.item1.a") },
            { s: tContent("usage.scenarios.item2.s"), u: tContent("usage.scenarios.item2.u"), a: tContent("usage.scenarios.item2.a") },
            { s: tContent("usage.scenarios.item3.s"), u: tContent("usage.scenarios.item3.u"), a: tContent("usage.scenarios.item3.a") },
            { s: tContent("usage.scenarios.item4.s"), u: tContent("usage.scenarios.item4.u"), a: tContent("usage.scenarios.item4.a") },
            { s: tContent("usage.scenarios.item5.s"), u: tContent("usage.scenarios.item5.u"), a: tContent("usage.scenarios.item5.a") },
          ],
        }}
        do={{
          title: tContent("usage.do.title"),
          items: [
            tContent("usage.do.item1"),
            tContent("usage.do.item2"),
            tContent("usage.do.item3"),
            tContent("usage.do.item4"),
          ],
        }}
        dont={{
          title: tContent("usage.dont.title"),
          items: [
            tContent("usage.dont.item1"),
            tContent("usage.dont.item2"),
            tContent("usage.dont.item3"),
          ],
        }}
      />

      {/* ── Do & Don't ────────────────────────────────────────────── */}
      <DocsDoDont
        title={tContent("doDont.title")}
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <SidebarDemoPreview variant="sidebar" collapsible="offcanvas" defaultOpen={true} />
            ),
            dontPreview: (
              <div className="min-h-[200px] flex items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-xs text-destructive text-center">
                  <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(tContent("doDont.pair1.dont")) }} />
                </p>
              </div>
            ),
            doCaption: tContent("doDont.pair1.do"),
            dontCaption: tContent("doDont.pair1.dont"),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div className="rounded-lg border border-border p-4 bg-muted/30 text-xs text-foreground font-mono">
                <code className="whitespace-pre">{`aria-current="page"\ntooltip="Dashboard"`}</code>
              </div>
            ),
            dontPreview: (
              <div className="rounded-lg border border-destructive/30 p-4 bg-destructive/5 text-xs text-destructive font-mono">
                <code className="whitespace-pre">{`// Ícone sem tooltip no modo icon\n<SidebarMenuButton>\n  <Icon />\n</SidebarMenuButton>`}</code>
              </div>
            ),
            doCaption: tContent("doDont.pair2.do"),
            dontCaption: tContent("doDont.pair2.dont"),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div className="rounded-lg border border-border p-4 bg-muted/30 text-xs text-foreground font-mono">
                <code className="whitespace-pre">{`// Trigger apenas em mobile\n<SidebarTrigger className="lg:hidden" />`}</code>
              </div>
            ),
            dontPreview: (
              <div className="rounded-lg border border-destructive/30 p-4 bg-destructive/5 text-xs text-destructive font-mono">
                <code className="whitespace-pre">{`// Trigger visível em desktop\n<SidebarTrigger />\n{/* ocupa espaço do conteúdo */}`}</code>
              </div>
            ),
            doCaption: tContent("doDont.pair3.do"),
            dontCaption: tContent("doDont.pair3.dont"),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport
        title={tContent("import.title")}
        description={tContent("import.basic")}
        code={codeImportBasic}
        secondaryDescription={tContent("import.withSubcomponents")}
        secondaryCode={codeImportFull}
      />

      {/* ── Variantes ─────────────────────────────────────────────── */}
      <DocsVariants
        title={tContent("variants.title")}
        items={[
          {
            name: `variant="sidebar"`,
            description: tContent("variants.sidebar"),
            code: codeVariantSidebar,
            preview: <SidebarDemoPreview variant="sidebar" collapsible="offcanvas" defaultOpen={true} />,
          },
          {
            name: `variant="floating"`,
            description: tContent("variants.floating"),
            code: codeVariantFloating,
            preview: <SidebarDemoPreview variant="floating" collapsible="offcanvas" defaultOpen={true} />,
          },
          {
            name: `variant="inset"`,
            description: tContent("variants.inset"),
            code: codeVariantInset,
            preview: <SidebarDemoPreview variant="inset" collapsible="offcanvas" defaultOpen={true} />,
          },
          {
            name: `collapsible="icon"`,
            description: tContent("variants.icon"),
            code: codeCollapsibleIcon,
            preview: <SidebarDemoPreview variant="sidebar" collapsible="icon" defaultOpen={false} />,
          },
          {
            name: `collapsible="none"`,
            description: tContent("variants.none"),
            code: `<Sidebar collapsible="none">{/* sempre visível */}</Sidebar>`,
            preview: <SidebarDemoPreview variant="sidebar" collapsible="none" defaultOpen={true} />,
          },
          {
            name: `side="right"`,
            description: tContent("variants.right"),
            code: `<Sidebar side="right">{/* sidebar na direita */}</Sidebar>`,
            preview: <SidebarDemoPreview variant="sidebar" collapsible="offcanvas" side="right" defaultOpen={true} />,
          },
        ]}
      />

      {/* ── Composições ───────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="sidebar"
        items={[
          {
            name: tContent("variants.compositions.withGroups.name"),
            description: tContent("variants.compositions.withGroups.description"),
            useWhen: tContent("variants.compositions.withGroups.use"),
            code: `<Sidebar variant="sidebar" collapsible="offcanvas">
  <SidebarHeader>{/* logo */}</SidebarHeader>
  <SidebarContent>
    <SidebarGroup>
      <SidebarGroupLabel>Principal</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton isActive aria-current="page">
              <LayoutDashboard aria-hidden="true" />
              <span>Dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {/* ... */}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
    <SidebarSeparator />
    <SidebarGroup>
      <SidebarGroupLabel>Conta</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Bell aria-hidden="true" />
              <span>Notificações</span>
            </SidebarMenuButton>
            <SidebarMenuBadge>5</SidebarMenuBadge>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  </SidebarContent>
</Sidebar>`,
            preview: <PreviewWithGroups />,
          },
          {
            name: tContent("variants.compositions.withSubMenu.name"),
            description: tContent("variants.compositions.withSubMenu.description"),
            useWhen: tContent("variants.compositions.withSubMenu.use"),
            code: `function ComponentsItem() {
  const [open, setOpen] = useState(false);
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
      >
        <Blocks aria-hidden="true" />
        <span>Componentes</span>
        <ChevronDown aria-hidden="true" className={open ? "rotate-180" : ""} />
      </SidebarMenuButton>
      {open && (
        <SidebarMenuSub>
          <SidebarMenuSubItem>
            <SidebarMenuSubButton>Alert</SidebarMenuSubButton>
          </SidebarMenuSubItem>
          {/* ... */}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}`,
            preview: <PreviewWithSubMenu />,
          },
          {
            name: tContent("variants.compositions.withSearch.name"),
            description: tContent("variants.compositions.withSearch.description"),
            useWhen: tContent("variants.compositions.withSearch.use"),
            code: `<SidebarHeader className="gap-2">
  <span className="font-semibold">Design System</span>
  <div className="relative">
    <Search aria-hidden="true" className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-sidebar-foreground/60" />
    <SidebarInput
      type="search"
      placeholder="Buscar..."
      aria-label="Buscar navegação"
      className="pl-7"
    />
  </div>
</SidebarHeader>`,
            preview: <PreviewWithSearch />,
          },
          {
            name: tContent("variants.compositions.withBadges.name"),
            description: tContent("variants.compositions.withBadges.description"),
            useWhen: tContent("variants.compositions.withBadges.use"),
            code: `<SidebarMenuItem>
  <SidebarMenuButton aria-label="Notificações (12 não lidas)">
    <Bell aria-hidden="true" />
    <span>Notificações</span>
  </SidebarMenuButton>
  <SidebarMenuBadge>12</SidebarMenuBadge>
</SidebarMenuItem>`,
            preview: <PreviewWithBadges />,
          },
        ]}
      />

      {/* ── Estados ───────────────────────────────────────────────── */}
      <DocsStates
        title={tContent("states.title")}
        cols={{
          state: tContent("states.cols.state"),
          trigger: tContent("states.cols.trigger"),
          behavior: tContent("states.cols.behavior"),
        }}
        items={[
          {
            label: tContent("states.expanded.label"),
            trigger: stripHtml(tContent("states.expanded.trigger")),
            behavior: tContent("states.expanded.behavior"),
          },
          {
            label: tContent("states.collapsed.label"),
            trigger: stripHtml(tContent("states.collapsed.trigger")),
            behavior: tContent("states.collapsed.behavior"),
          },
          {
            label: tContent("states.offcanvas.label"),
            trigger: stripHtml(tContent("states.offcanvas.trigger")),
            behavior: tContent("states.offcanvas.behavior"),
          },
          {
            label: tContent("states.mobile.label"),
            trigger: stripHtml(tContent("states.mobile.trigger")),
            behavior: tContent("states.mobile.behavior"),
          },
          {
            label: tContent("states.hidden.label"),
            trigger: stripHtml(tContent("states.hidden.trigger")),
            behavior: tContent("states.hidden.behavior"),
          },
        ]}
      />

      {/* ── Propriedades ──────────────────────────────────────────── */}
      <DocsProps
        title={tContent("props.title")}
        tables={[
          {
            title: tContent("props.providerTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              {
                name: "defaultOpen",
                type: "boolean",
                defaultValue: "true",
                required: "Não",
                description: tContent("props.provider.defaultOpen"),
              },
              {
                name: "open",
                type: "boolean",
                defaultValue: "—",
                required: "Não",
                description: stripHtml(tContent("props.provider.open")),
              },
              {
                name: "onOpenChange",
                type: "(open: boolean) => void",
                defaultValue: "—",
                required: "Não",
                description: tContent("props.provider.onOpenChange"),
              },
              {
                name: "children",
                type: "React.ReactNode",
                defaultValue: "—",
                required: "Sim",
                description: tContent("props.provider.children"),
              },
            ],
          },
          {
            title: tContent("props.sidebarTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              {
                name: "side",
                type: '"left" | "right"',
                defaultValue: '"left"',
                required: "Não",
                description: stripHtml(tContent("props.sidebar.side")),
              },
              {
                name: "variant",
                type: '"sidebar" | "floating" | "inset"',
                defaultValue: '"sidebar"',
                required: "Não",
                description: stripHtml(tContent("props.sidebar.variant")),
              },
              {
                name: "collapsible",
                type: '"offcanvas" | "icon" | "none"',
                defaultValue: '"offcanvas"',
                required: "Não",
                description: stripHtml(tContent("props.sidebar.collapsible")),
              },
            ],
          },
          {
            title: tContent("props.menuButtonTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              {
                name: "isActive",
                type: "boolean",
                defaultValue: "false",
                required: "Não",
                description: stripHtml(tContent("props.menuButton.isActive")),
              },
              {
                name: "variant",
                type: '"default" | "outline"',
                defaultValue: '"default"',
                required: "Não",
                description: stripHtml(tContent("props.menuButton.variant")),
              },
              {
                name: "size",
                type: '"default" | "sm" | "lg"',
                defaultValue: '"default"',
                required: "Não",
                description: stripHtml(tContent("props.menuButton.size")),
              },
              {
                name: "tooltip",
                type: "string | TooltipContent props",
                defaultValue: "—",
                required: "Não",
                description: stripHtml(tContent("props.menuButton.tooltip")),
              },
              {
                name: "render",
                type: "React.ReactElement",
                defaultValue: "—",
                required: "Não",
                description: stripHtml(tContent("props.menuButton.render")),
              },
            ],
          },
          {
            title: tContent("props.menuSubButtonTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              {
                name: "isActive",
                type: "boolean",
                defaultValue: "false",
                required: "Não",
                description: tContent("props.menuSubButton.isActive"),
              },
              {
                name: "size",
                type: '"sm" | "md"',
                defaultValue: '"md"',
                required: "Não",
                description: stripHtml(tContent("props.menuSubButton.size")),
              },
              {
                name: "render",
                type: "React.ReactElement",
                defaultValue: "—",
                required: "Não",
                description: stripHtml(tContent("props.menuSubButton.render")),
              },
            ],
          },
          {
            title: tContent("props.menuSkeletonTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              {
                name: "showIcon",
                type: "boolean",
                defaultValue: "false",
                required: "Não",
                description: tContent("props.menuSkeleton.showIcon"),
              },
            ],
          },
        ]}
        interfaceCode={interfaceCode}
        extensibilityTitle={tContent("props.extensibilityTitle")}
        extensibilityNotes={tContent("props.extensibility")}
      />

      {/* ── Tokens ────────────────────────────────────────────────── */}
      <DocsTokens
        title={tContent("tokens.title")}
        cols={{
          token: tContent("tokens.table.token"),
          value: tContent("tokens.table.class"),
          description: tContent("tokens.table.part"),
        }}
        items={[
          { token: "--sidebar", value: "bg-sidebar", description: tContent("tokens.sidebarBg") },
          { token: "--sidebar-foreground", value: "text-sidebar-foreground", description: tContent("tokens.sidebarFg") },
          { token: "--sidebar-border", value: "border-sidebar-border", description: tContent("tokens.sidebarBorder") },
          { token: "--sidebar-accent", value: "bg-sidebar-accent", description: tContent("tokens.sidebarAccent") },
          { token: "--sidebar-accent-foreground", value: "text-sidebar-accent-foreground", description: tContent("tokens.sidebarAccentFg") },
          { token: "--sidebar-ring", value: "ring-sidebar-ring", description: tContent("tokens.sidebarRing") },
          { token: "--sidebar-width", value: "w-(--sidebar-width)", description: tContent("tokens.sidebarWidth") },
          { token: "--sidebar-width-icon", value: "w-(--sidebar-width-icon)", description: tContent("tokens.sidebarWidthIcon") },
          { token: "--sidebar-width-mobile", value: "w-(--sidebar-width-mobile)", description: tContent("tokens.sidebarWidthMobile") },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={codeCustomizationTokens}
      />

      {/* ── Acessibilidade ────────────────────────────────────────── */}
      <DocsAccessibility
        title={tContent("accessibility.title")}
        summary={tContent("accessibility.summary")}
        items={[
          tContent("accessibility.item1"),
          tContent("accessibility.item2"),
          tContent("accessibility.item3"),
          tContent("accessibility.item4"),
          tContent("accessibility.item5"),
          tContent("accessibility.item6"),
          tContent("accessibility.item7"),
        ]}
        keyboardTitle="Navegação por teclado"
        keyboardItems={[
          { key: "Tab",       description: tContent("accessibility.keyboard.tab") },
          { key: "Shift+Tab", description: tContent("accessibility.keyboard.shiftTab") },
          { key: "Enter",     description: tContent("accessibility.keyboard.enter") },
          { key: "Space",     description: tContent("accessibility.keyboard.space") },
          { key: "Escape",    description: tContent("accessibility.keyboard.escape") },
          { key: "Ctrl+B",    description: tContent("accessibility.keyboard.ctrlB") },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        items={[
          {
            name: "NavigationMenu",
            description: tContent("related.navigationMenu"),
            path: "?path=/docs/ui-navigationmenu--docs",
          },
          {
            name: "Tabs",
            description: tContent("related.tabs"),
            path: "?path=/docs/ui-tabs--docs",
          },
          {
            name: "Sheet",
            description: tContent("related.sheet"),
            path: "?path=/docs/ui-sheet--docs",
          },
          {
            name: "Accordion",
            description: tContent("related.accordion"),
            path: "?path=/docs/ui-accordion--docs",
          },
          {
            name: "Tooltip",
            description: tContent("related.tooltip"),
            path: "?path=/docs/ui-tooltip--docs",
          },
          {
            name: "Separator",
            description: tContent("related.separator"),
            path: "?path=/docs/ui-separator--docs",
          },
          {
            name: "Skeleton",
            description: tContent("related.skeleton"),
            path: "?path=/docs/ui-skeleton--docs",
          },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        items={[
          { title: "", content: tContent("notes.tip1") },
          { title: "", content: tContent("notes.tip2") },
          { title: "", content: tContent("notes.tip3") },
          { title: "", content: tContent("notes.tip4") },
          { title: "", content: tContent("notes.tip5") },
        ]}
      />

      {/* ── Analytics ─────────────────────────────────────────────── */}
      <DocsAnalytics
        title={tContent("analytics.title")}
        cols={{
          event: tContent("analytics.table.event"),
          trigger: tContent("analytics.table.trigger"),
          payload: tContent("analytics.table.payload"),
        }}
        items={[
          {
            event: tContent("analytics.table.navClick"),
            trigger: tContent("analytics.table.navClickTrigger"),
            payload: tContent("analytics.table.navClickPayload"),
          },
          {
            event: tContent("analytics.table.toggleOpen"),
            trigger: tContent("analytics.table.toggleOpenTrigger"),
            payload: tContent("analytics.table.togglePayload"),
          },
          {
            event: tContent("analytics.table.pageView"),
            trigger: tContent("analytics.table.pageViewTrigger"),
            payload: tContent("analytics.table.pageViewPayload"),
          },
          {
            event: tContent("analytics.table.sectionViewed"),
            trigger: tContent("analytics.table.sectionViewedTrigger"),
            payload: tContent("analytics.table.sectionViewedPayload"),
          },
          {
            event: tContent("analytics.table.langSwitch"),
            trigger: tContent("analytics.table.langSwitchTrigger"),
            payload: tContent("analytics.table.langSwitchPayload"),
          },
        ]}
      />

      {/* ── Testes ────────────────────────────────────────────────── */}
      <DocsTestes
        title={tContent("testes.title")}
        functional={{
          title: tContent("testes.functional.title"),
          cols: {
            action: tNav("common.userAction"),
            result: tNav("common.expectedResult"),
            priority: tNav("common.priority"),
          },
          items: [
            {
              action: tContent("testes.functional.item1.action"),
              result: tContent("testes.functional.item1.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item1.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item2.action"),
              result: tContent("testes.functional.item2.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item2.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item3.action"),
              result: tContent("testes.functional.item3.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item3.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item4.action"),
              result: tContent("testes.functional.item4.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item4.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item5.action"),
              result: tContent("testes.functional.item5.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item5.priority")] ?? "common.medium"),
            },
            {
              action: tContent("testes.functional.item6.action"),
              result: tContent("testes.functional.item6.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item6.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item7.action"),
              result: tContent("testes.functional.item7.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item7.priority")] ?? "common.medium"),
            },
            {
              action: tContent("testes.functional.item8.action"),
              result: tContent("testes.functional.item8.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item8.priority")] ?? "common.medium"),
            },
            {
              action: tContent("testes.functional.item9.action"),
              result: tContent("testes.functional.item9.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item9.priority")] ?? "common.medium"),
            },
          ],
        }}
        accessibility={{
          title: tContent("testes.accessibility.title"),
          cols: {
            criterion: tNav("common.criterion"),
            level: "WCAG",
            how: tNav("common.howToVerify"),
          },
          items: [
            {
              criterion: tContent("testes.accessibility.item1.criterion"),
              level: tContent("testes.accessibility.item1.level"),
              how: tContent("testes.accessibility.item1.how"),
            },
            {
              criterion: tContent("testes.accessibility.item2.criterion"),
              level: tContent("testes.accessibility.item2.level"),
              how: tContent("testes.accessibility.item2.how"),
            },
            {
              criterion: tContent("testes.accessibility.item3.criterion"),
              level: tContent("testes.accessibility.item3.level"),
              how: tContent("testes.accessibility.item3.how"),
            },
            {
              criterion: tContent("testes.accessibility.item4.criterion"),
              level: tContent("testes.accessibility.item4.level"),
              how: tContent("testes.accessibility.item4.how"),
            },
            {
              criterion: tContent("testes.accessibility.item5.criterion"),
              level: tContent("testes.accessibility.item5.level"),
              how: tContent("testes.accessibility.item5.how"),
            },
            {
              criterion: tContent("testes.accessibility.item6.criterion"),
              level: tContent("testes.accessibility.item6.level"),
              how: tContent("testes.accessibility.item6.how"),
            },
          ],
        }}
        visual={{
          title: tContent("testes.visual.title"),
          cols: {
            story: tNav("common.storyState"),
            priority: tNav("common.priority"),
          },
          items: [
            { story: tContent("testes.visual.item1.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item1.priority")] ?? "common.high") },
            { story: tContent("testes.visual.item2.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item2.priority")] ?? "common.high") },
            { story: tContent("testes.visual.item3.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item3.priority")] ?? "common.high") },
            { story: tContent("testes.visual.item4.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item4.priority")] ?? "common.medium") },
            { story: tContent("testes.visual.item5.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item5.priority")] ?? "common.high") },
            { story: tContent("testes.visual.item6.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item6.priority")] ?? "common.medium") },
          ],
        }}
      />
    </DocsPageLayout>
  );
}
