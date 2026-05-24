<script lang="ts">
  import {
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
    SidebarMenuBadge,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
    SidebarInput,
    SidebarTrigger,
    SidebarInset,
    SidebarRail,
    SidebarSeparator,
  } from '@/components/ui/sidebar';
  import { LayoutDashboard, Box, Blocks, Coins, Palette, Settings, User, Bell, Search, ChevronDown } from 'lucide-svelte';

  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import { sanitizeHtml } from '@/lib/sanitize-html';

  import uiTranslations from '@/i18n/ui.json';
  import sidebarTranslations from '@shared/content/sidebar/translations.json';

  import DocsPageLayout    from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.svelte';
  import DocsDemonstration from '@/components/docs/shared/sections/DocsDemonstration.svelte';
  import DocsAnatomy       from '@/components/docs/shared/sections/DocsAnatomy.svelte';
  import DocsWhenToUse     from '@/components/docs/shared/sections/DocsWhenToUse.svelte';
  import DocsDoDont        from '@/components/docs/shared/sections/DocsDoDont.svelte';
  import DocsImport        from '@/components/docs/shared/sections/DocsImport.svelte';
  import DocsVariants      from '@/components/docs/shared/sections/DocsVariants.svelte';
  import DocsCompositions  from '@/components/docs/shared/sections/DocsCompositions.svelte';
  import DocsStates        from '@/components/docs/shared/sections/DocsStates.svelte';
  import DocsProps         from '@/components/docs/shared/sections/DocsProps.svelte';
  import DocsTokens        from '@/components/docs/shared/sections/DocsTokens.svelte';
  import DocsAccessibility from '@/components/docs/shared/sections/DocsAccessibility.svelte';
  import DocsRelated       from '@/components/docs/shared/sections/DocsRelated.svelte';
  import DocsNotes         from '@/components/docs/shared/sections/DocsNotes.svelte';
  import DocsAnalytics     from '@/components/docs/shared/sections/DocsAnalytics.svelte';
  import DocsTestes        from '@/components/docs/shared/sections/DocsTestes.svelte';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(sidebarTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'sidebar',
    });
    track('docs_page_view', {
      component_name: 'sidebar',
      locale: l,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

  // ─── Active section ──────────────────────────────────────────────────────────


  const NAV_GROUPS = $derived.by(() => {
    const tNav = $tNavStore;
    return [
      { label: tNav('nav.overview'), sections: [
        { id: 'demonstracao', label: tNav('nav.demonstration') },
        { id: 'anatomia',     label: tNav('nav.anatomy')       },
        { id: 'quando-usar',  label: tNav('nav.usage')         },
        { id: 'do-dont',      label: tNav('nav.doDont')        },
      ]},
      { label: tNav('nav.techRef'), sections: [
        { id: 'importacao',   label: tNav('nav.import')   },
        { id: 'variantes',    label: tNav('nav.variants')     },
        { id: 'composicoes',  label: tNav('nav.compositions') },
        { id: 'estados',      label: tNav('nav.states')       },
        { id: 'propriedades', label: tNav('nav.props')    },
        { id: 'tokens',       label: tNav('nav.tokens')   },
      ]},
      { label: tNav('nav.context'), sections: [
        { id: 'acessibilidade', label: tNav('nav.accessibility') },
        { id: 'relacionados',   label: tNav('nav.related')       },
        { id: 'notas',          label: tNav('nav.notes')         },
      ]},
      { label: tNav('nav.quality'), sections: [
        { id: 'analytics', label: tNav('nav.analytics') },
        { id: 'testes',    label: tNav('nav.testes')    },
      ]},
    ];
  });

  const sectionIds = NAV_GROUPS.flatMap(g => g.sections.map(s => s.id));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'sidebar', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Composição: estado do sub-menu ──────────────────────────────────────────
  let subOpen = $state(false);

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function stripHtml(s: string) {
    return s.replace(/<[^>]*>/g, '');
  }

  const priorityKeyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };

  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── Navigation items for demos ──────────────────────────────────────────────

  const navItems = [
    { icon: LayoutDashboard, label: 'demonstration.labels.dashboard', isActive: true  },
    { icon: Box,             label: 'demonstration.labels.components', isActive: false },
    { icon: Palette,         label: 'demonstration.labels.tokens',    isActive: false },
    { icon: Settings,        label: 'demonstration.labels.settings',  isActive: false },
    { icon: User,            label: 'demonstration.labels.profile',   isActive: false },
  ];

  // ─── Code strings ─────────────────────────────────────────────────────────────

  const codeImportBasic = `import * as Sidebar from '@/components/ui/sidebar';`;

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
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';`;

  const codeVariantSidebar = `<SidebarProvider>
  <nav aria-label="Navegação principal">
    <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton isActive aria-current="page">
              <Icon aria-hidden="true" />
              <span>Dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  </nav>
  <SidebarInset>
    <SidebarTrigger />
  </SidebarInset>
</SidebarProvider>`;

  const codeVariantFloating = `<Sidebar variant="floating" collapsible="offcanvas">
  {/* ... */}
</Sidebar>`;

  const codeVariantInset = `<Sidebar variant="inset" collapsible="offcanvas">
  {/* ... */}
</Sidebar>`;

  const codeCollapsibleIcon = `<Sidebar collapsible="icon">
  <!-- Labels ocultos; tooltips ao hover -->
  <SidebarMenuButton tooltip="Dashboard">
    <LayoutDashboard aria-hidden="true" />
    <span>Dashboard</span>
  </SidebarMenuButton>
</Sidebar>`;

  const codeCollapsibleNone = `<Sidebar collapsible="none">
  <!-- Sidebar sempre visível, sem toggle -->
</Sidebar>`;

  const codeSideRight = `<Sidebar side="right">
  <!-- Sidebar posicionada na direita -->
</Sidebar>`;

  const codeCustomizationTokens = `/* globals.css — personalizar tokens da sidebar */
:root {
  --sidebar: oklch(0.98 0 0);
  --sidebar-foreground: oklch(0.15 0 0);
  --sidebar-primary: oklch(0.4 0.15 250);
  --sidebar-accent: oklch(0.94 0 0);
  --sidebar-border: oklch(0.9 0 0);
  --sidebar-width: 18rem;
  --sidebar-width-icon: 3.5rem;
}

.dark {
  --sidebar: oklch(0.15 0 0);
  --sidebar-foreground: oklch(0.95 0 0);
  --sidebar-accent: oklch(0.2 0 0);
  --sidebar-border: oklch(0.25 0 0);
}`;

  const interfaceCode = `// SidebarProvider
interface SidebarProviderProps {
  open?: boolean;           // estado controlado
  onOpenChange?: (open: boolean) => void;
  class?: string;
  children?: Snippet;
}

// Sidebar
interface SidebarProps {
  side?: 'left' | 'right';
  variant?: 'sidebar' | 'floating' | 'inset';
  collapsible?: 'offcanvas' | 'icon' | 'none';
  class?: string;
  children?: Snippet;
}

// SidebarMenuButton
interface SidebarMenuButtonProps {
  isActive?: boolean;
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  tooltip?: string | object;
}`;
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="sidebar">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npx shadcn-svelte@latest add sidebar"
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <div class="w-full min-h-[400px] border rounded-lg overflow-hidden" style="contain: layout">
        <SidebarProvider defaultOpen={true}>
          <nav aria-label={$tStore('demonstration.labels.mainNav')}>
            <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
              <SidebarHeader class="px-4 py-3 border-b border-sidebar-border">
                <span class="font-semibold text-sm text-sidebar-foreground">Design System</span>
              </SidebarHeader>
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupLabel>{$tStore('demonstration.labels.mainNav')}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {#each navItems as item}
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            isActive={item.isActive}
                            tooltip={$tStore(item.label)}
                            aria-current={item.isActive ? 'page' : undefined}
                          >
                            <item.icon aria-hidden="true" />
                            <span>{$tStore(item.label)}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      {/each}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
              <SidebarFooter class="px-4 py-3 border-t border-sidebar-border">
                <span class="text-xs text-sidebar-foreground/60">{$tStore('demonstration.labels.profile')}</span>
              </SidebarFooter>
              <SidebarRail />
            </Sidebar>
          </nav>
          <SidebarInset class="flex flex-col flex-1 min-w-0">
            <header class="flex h-12 items-center gap-2 border-b px-4">
              <SidebarTrigger />
              <span class="text-sm font-medium text-muted-foreground">Dashboard</span>
            </header>
            <main id="main-content" tabindex="-1" class="flex-1 p-6">
              <p class="text-sm text-muted-foreground">{$tStore('description')}</p>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    {/snippet}
  </DocsDemonstration>

  <!-- ── Anatomia ───────────────────────────────────────────────── -->
  <DocsAnatomy
    title={$tStore('anatomy.title')}
    items={[
      $tStore('anatomy.item1'),
      $tStore('anatomy.item2'),
      $tStore('anatomy.item3'),
      $tStore('anatomy.item4'),
      $tStore('anatomy.item5'),
      $tStore('anatomy.item6'),
      $tStore('anatomy.item7'),
      $tStore('anatomy.item8'),
      $tStore('anatomy.item9'),
      $tStore('anatomy.item10'),
      $tStore('anatomy.item11'),
      $tStore('anatomy.item12'),
      $tStore('anatomy.item13'),
      $tStore('anatomy.item14'),
      $tStore('anatomy.item15'),
      $tStore('anatomy.item16'),
    ]}
    structureLabel={$tStore('anatomy.structureLabel')}
    structureCode={$tStore('anatomy.structureCode')}
  />

  <!-- ── Quando Usar ────────────────────────────────────────────── -->
  <DocsWhenToUse
    title={$tStore('usage.title')}
    guidelines={{
      title: $tStore('usage.guidelines.title'),
      items: [
        $tStore('usage.guidelines.item1'),
        $tStore('usage.guidelines.item2'),
        $tStore('usage.guidelines.item3'),
        $tStore('usage.guidelines.item4'),
        $tStore('usage.guidelines.item5'),
      ],
    }}
    scenarios={{
      title: $tStore('usage.scenarios.title'),
      cols: {
        scenario: $tStore('usage.scenarios.cols.scenario'),
        use: $tStore('usage.scenarios.cols.use'),
        alternative: $tStore('usage.scenarios.cols.alternative'),
      },
      items: [
        { s: $tStore('usage.scenarios.item1.s'), u: $tStore('usage.scenarios.item1.u'), a: $tStore('usage.scenarios.item1.a') },
        { s: $tStore('usage.scenarios.item2.s'), u: $tStore('usage.scenarios.item2.u'), a: $tStore('usage.scenarios.item2.a') },
        { s: $tStore('usage.scenarios.item3.s'), u: $tStore('usage.scenarios.item3.u'), a: $tStore('usage.scenarios.item3.a') },
        { s: $tStore('usage.scenarios.item4.s'), u: $tStore('usage.scenarios.item4.u'), a: $tStore('usage.scenarios.item4.a') },
        { s: $tStore('usage.scenarios.item5.s'), u: $tStore('usage.scenarios.item5.u'), a: $tStore('usage.scenarios.item5.a') },
      ],
    }}
    do={{
      title: $tStore('usage.do.title'),
      items: [
        $tStore('usage.do.item1'),
        $tStore('usage.do.item2'),
        $tStore('usage.do.item3'),
        $tStore('usage.do.item4'),
      ],
    }}
    dont={{
      title: $tStore('usage.dont.title'),
      items: [
        $tStore('usage.dont.item1'),
        $tStore('usage.dont.item2'),
        $tStore('usage.dont.item3'),
      ],
    }}
  />

  <!-- ── Do & Don't ─────────────────────────────────────────────── -->
  <DocsDoDont
    title={$tStore('doDont.title')}
    pairs={[
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: $tStore('doDont.pair1.do'),
        dontCaption: $tStore('doDont.pair1.dont'),
        doPreview: doPair1,
        dontPreview: dontPair1,
      },
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: $tStore('doDont.pair2.do'),
        dontCaption: $tStore('doDont.pair2.dont'),
        doPreview: doPair2,
        dontPreview: dontPair2,
      },
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: $tStore('doDont.pair3.do'),
        dontCaption: $tStore('doDont.pair3.dont'),
        doPreview: doPair3,
        dontPreview: dontPair3,
      },
    ]}
  />

  {#snippet doPair1()}
    <div class="w-full min-h-[200px] border rounded-lg overflow-hidden text-xs" style="contain: layout">
      <SidebarProvider defaultOpen={true}>
        <nav aria-label="Navegação principal">
          <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
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
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </nav>
        <SidebarInset class="flex-1 p-3">
          <SidebarTrigger />
        </SidebarInset>
      </SidebarProvider>
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <div class="w-full min-h-[200px] border rounded-lg overflow-hidden p-3 text-xs text-muted-foreground">
      <div class="border-r h-full p-2 float-left w-32">
        <div class="font-medium text-foreground">Dashboard</div>
        <div>Componentes</div>
        <div>Tokens</div>
      </div>
      <p class="ml-36 text-xs">Estado open replicado manualmente fora do SidebarProvider</p>
    </div>
  {/snippet}

  {#snippet doPair2()}
    <div class="w-full border rounded-lg overflow-hidden text-xs">
      <SidebarProvider defaultOpen={true}>
        <nav aria-label="Navegação principal">
          <Sidebar side="left" variant="sidebar" collapsible="icon">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive
                        aria-current="page"
                        tooltip="Dashboard"
                      >
                        <LayoutDashboard aria-hidden="true" />
                        <span>Dashboard</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </nav>
        <SidebarInset class="flex-1 p-2 min-h-[120px]">
          <p class="text-xs text-muted-foreground">aria-current + tooltip no modo icon</p>
        </SidebarInset>
      </SidebarProvider>
    </div>
  {/snippet}
  {#snippet dontPair2()}
    <div class="w-full border rounded-lg overflow-hidden text-xs">
      <SidebarProvider defaultOpen={true}>
        <nav aria-label="Navegação principal">
          <Sidebar side="left" variant="sidebar" collapsible="icon">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive>
                        <LayoutDashboard />
                        <span>Dashboard</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </nav>
        <SidebarInset class="flex-1 p-2 min-h-[120px]">
          <p class="text-xs text-muted-foreground">Sem tooltip — inacessível no modo colapsado</p>
        </SidebarInset>
      </SidebarProvider>
    </div>
  {/snippet}

  {#snippet doPair3()}
    <div class="w-full border rounded-lg overflow-hidden text-xs">
      <SidebarProvider defaultOpen={true}>
        <nav aria-label="Navegação principal">
          <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Dashboard">
                    <LayoutDashboard aria-hidden="true" />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
            <SidebarRail />
          </Sidebar>
        </nav>
        <SidebarInset class="flex flex-col flex-1 min-w-0 min-h-[120px]">
          <header class="flex h-10 items-center gap-2 border-b px-3">
            <SidebarTrigger class="lg:hidden" />
            <span class="text-xs text-muted-foreground">SidebarRail no desktop, Trigger no mobile</span>
          </header>
        </SidebarInset>
      </SidebarProvider>
    </div>
  {/snippet}
  {#snippet dontPair3()}
    <div class="w-full border rounded-lg overflow-hidden text-xs">
      <SidebarProvider defaultOpen={true}>
        <nav aria-label="Navegação principal">
          <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <LayoutDashboard aria-hidden="true" />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
        </nav>
        <SidebarInset class="flex flex-col flex-1 min-w-0 min-h-[120px]">
          <header class="flex h-10 items-center gap-2 border-b px-3">
            <SidebarTrigger />
            <span class="text-xs text-muted-foreground">SidebarTrigger no desktop — ocupa espaço</span>
          </header>
        </SidebarInset>
      </SidebarProvider>
    </div>
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    description={$tStore('import.basic')}
    code={codeImportBasic}
    secondaryDescription={$tStore('import.withSubcomponents')}
    secondaryCode={codeImportFull}
  />

  <!-- ── Variantes ──────────────────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    items={[
      { name: 'sidebar',    description: $tStore('variants.sidebar'),    code: codeVariantSidebar,   preview: variantSidebar   },
      { name: 'floating',   description: $tStore('variants.floating'),   code: codeVariantFloating,  preview: variantFloating  },
      { name: 'inset',      description: $tStore('variants.inset'),      code: codeVariantInset,     preview: variantInset     },
      { name: 'icon',       description: $tStore('variants.icon'),       code: codeCollapsibleIcon,  preview: variantIcon      },
      { name: 'none',       description: $tStore('variants.none'),       code: codeCollapsibleNone,  preview: variantNone      },
      { name: 'right',      description: $tStore('variants.right'),      code: codeSideRight,        preview: variantRight     },
    ]}
  />

  {#snippet variantSidebar()}
    <div class="w-full min-h-[220px] border rounded-lg overflow-hidden" style="contain: layout">
      <SidebarProvider defaultOpen={true}>
        <nav aria-label="Navegação principal">
          <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {#each navItems.slice(0, 3) as item}
                      <SidebarMenuItem>
                        <SidebarMenuButton isActive={item.isActive} tooltip={$tStore(item.label)}>
                          <item.icon aria-hidden="true" />
                          <span>{$tStore(item.label)}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    {/each}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarRail />
          </Sidebar>
        </nav>
        <SidebarInset class="flex-1 min-h-[220px] flex items-center justify-center">
          <span class="text-xs text-muted-foreground">variant="sidebar"</span>
        </SidebarInset>
      </SidebarProvider>
    </div>
  {/snippet}

  {#snippet variantFloating()}
    <div class="w-full min-h-[220px] border rounded-lg overflow-hidden" style="contain: layout">
      <SidebarProvider defaultOpen={true}>
        <nav aria-label="Navegação principal">
          <Sidebar side="left" variant="floating" collapsible="offcanvas">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {#each navItems.slice(0, 3) as item}
                      <SidebarMenuItem>
                        <SidebarMenuButton isActive={item.isActive} tooltip={$tStore(item.label)}>
                          <item.icon aria-hidden="true" />
                          <span>{$tStore(item.label)}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    {/each}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </nav>
        <SidebarInset class="flex-1 min-h-[220px] flex items-center justify-center">
          <span class="text-xs text-muted-foreground">variant="floating"</span>
        </SidebarInset>
      </SidebarProvider>
    </div>
  {/snippet}

  {#snippet variantInset()}
    <div class="w-full min-h-[220px] border rounded-lg overflow-hidden" style="contain: layout">
      <SidebarProvider defaultOpen={true}>
        <nav aria-label="Navegação principal">
          <Sidebar side="left" variant="inset" collapsible="offcanvas">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {#each navItems.slice(0, 3) as item}
                      <SidebarMenuItem>
                        <SidebarMenuButton isActive={item.isActive} tooltip={$tStore(item.label)}>
                          <item.icon aria-hidden="true" />
                          <span>{$tStore(item.label)}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    {/each}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </nav>
        <SidebarInset class="flex-1 min-h-[220px] flex items-center justify-center">
          <span class="text-xs text-muted-foreground">variant="inset"</span>
        </SidebarInset>
      </SidebarProvider>
    </div>
  {/snippet}

  {#snippet variantIcon()}
    <div class="w-full min-h-[220px] border rounded-lg overflow-hidden" style="contain: layout">
      <SidebarProvider defaultOpen={false}>
        <nav aria-label="Navegação principal">
          <Sidebar side="left" variant="sidebar" collapsible="icon">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {#each navItems.slice(0, 3) as item}
                      <SidebarMenuItem>
                        <SidebarMenuButton isActive={item.isActive} tooltip={$tStore(item.label)}>
                          <item.icon aria-hidden="true" />
                          <span>{$tStore(item.label)}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    {/each}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarRail />
          </Sidebar>
        </nav>
        <SidebarInset class="flex-1 min-h-[220px] flex items-center justify-center">
          <span class="text-xs text-muted-foreground">collapsible="icon"</span>
        </SidebarInset>
      </SidebarProvider>
    </div>
  {/snippet}

  {#snippet variantNone()}
    <div class="w-full min-h-[220px] border rounded-lg overflow-hidden" style="contain: layout">
      <SidebarProvider defaultOpen={true}>
        <nav aria-label="Navegação principal">
          <Sidebar side="left" variant="sidebar" collapsible="none">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {#each navItems.slice(0, 3) as item}
                      <SidebarMenuItem>
                        <SidebarMenuButton isActive={item.isActive}>
                          <item.icon aria-hidden="true" />
                          <span>{$tStore(item.label)}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    {/each}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </nav>
        <SidebarInset class="flex-1 min-h-[220px] flex items-center justify-center">
          <span class="text-xs text-muted-foreground">collapsible="none"</span>
        </SidebarInset>
      </SidebarProvider>
    </div>
  {/snippet}

  {#snippet variantRight()}
    <div class="w-full min-h-[220px] border rounded-lg overflow-hidden" style="contain: layout">
      <SidebarProvider defaultOpen={true}>
        <SidebarInset class="flex-1 min-h-[220px] flex items-center justify-center">
          <span class="text-xs text-muted-foreground">side="right"</span>
        </SidebarInset>
        <nav aria-label="Navegação principal">
          <Sidebar side="right" variant="sidebar" collapsible="offcanvas">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {#each navItems.slice(0, 3) as item}
                      <SidebarMenuItem>
                        <SidebarMenuButton isActive={item.isActive} tooltip={$tStore(item.label)}>
                          <item.icon aria-hidden="true" />
                          <span>{$tStore(item.label)}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    {/each}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarRail />
          </Sidebar>
        </nav>
      </SidebarProvider>
    </div>
  {/snippet}

  <!-- ── Composições ─────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="sidebar"
    items={[
      {
        name: $tStore('variants.compositions.withGroups.name'),
        description: $tStore('variants.compositions.withGroups.description'),
        useWhen: $tStore('variants.compositions.withGroups.use'),
        code: `<Sidebar variant="sidebar" collapsible="offcanvas">
  <SidebarHeader><!-- logo --></SidebarHeader>
  <SidebarContent>
    <SidebarGroup>
      <SidebarGroupLabel>Principal</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton isActive aria-current="page">
              <LayoutDashboard aria-hidden="true" /><span>Dashboard</span>
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
            <SidebarMenuButton><Bell aria-hidden="true" /><span>Notificações</span></SidebarMenuButton>
            <SidebarMenuBadge>5</SidebarMenuBadge>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  </SidebarContent>
</Sidebar>`,
        preview: compWithGroups,
      },
      {
        name: $tStore('variants.compositions.withSubMenu.name'),
        description: $tStore('variants.compositions.withSubMenu.description'),
        useWhen: $tStore('variants.compositions.withSubMenu.use'),
        code: `<script>
  let open = $state(false);
</script>

<SidebarMenuItem>
  <SidebarMenuButton aria-expanded={open} onclick={() => open = !open}>
    <Blocks aria-hidden="true" />
    <span>Componentes</span>
    <ChevronDown aria-hidden="true" class={open ? 'rotate-180' : ''} />
  </SidebarMenuButton>
  {#if open}
    <SidebarMenuSub>
      <SidebarMenuSubItem>
        <SidebarMenuSubButton>Alert</SidebarMenuSubButton>
      </SidebarMenuSubItem>
    </SidebarMenuSub>
  {/if}
</SidebarMenuItem>`,
        preview: compWithSubMenu,
      },
      {
        name: $tStore('variants.compositions.withSearch.name'),
        description: $tStore('variants.compositions.withSearch.description'),
        useWhen: $tStore('variants.compositions.withSearch.use'),
        code: `<SidebarHeader class="gap-2">
  <span class="font-semibold">Design System</span>
  <div class="relative">
    <Search aria-hidden="true" class="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-sidebar-foreground/60" />
    <SidebarInput
      type="search"
      placeholder="Buscar..."
      aria-label="Buscar navegação"
      class="pl-7"
    />
  </div>
</SidebarHeader>`,
        preview: compWithSearch,
      },
      {
        name: $tStore('variants.compositions.withBadges.name'),
        description: $tStore('variants.compositions.withBadges.description'),
        useWhen: $tStore('variants.compositions.withBadges.use'),
        code: `<SidebarMenuItem>
  <SidebarMenuButton aria-label="Notificações (12 não lidas)">
    <Bell aria-hidden="true" />
    <span>Notificações</span>
  </SidebarMenuButton>
  <SidebarMenuBadge>12</SidebarMenuBadge>
</SidebarMenuItem>`,
        preview: compWithBadges,
      },
    ]}
  />

  {#snippet compWithGroups()}
    <div class="w-full min-h-[260px] border rounded-lg overflow-hidden" style="contain: layout">
      <SidebarProvider defaultOpen={true}>
        <nav aria-label="Navegação principal">
          <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
            <SidebarHeader class="p-3 text-sm font-semibold text-sidebar-foreground">Design System</SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Principal</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive size="sm">
                        <LayoutDashboard aria-hidden="true" /><span>Dashboard</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton size="sm">
                        <Blocks aria-hidden="true" /><span>Componentes</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton size="sm">
                        <Coins aria-hidden="true" /><span>Tokens</span>
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
                      <SidebarMenuButton size="sm">
                        <Settings aria-hidden="true" /><span>Configurações</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton size="sm">
                        <Bell aria-hidden="true" /><span>Notificações</span>
                      </SidebarMenuButton>
                      <SidebarMenuBadge>5</SidebarMenuBadge>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton size="sm">
                        <User aria-hidden="true" /><span>Perfil</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarRail />
          </Sidebar>
        </nav>
        <SidebarInset class="flex-1 flex items-center justify-center">
          <span class="text-xs text-muted-foreground">Dashboard</span>
        </SidebarInset>
      </SidebarProvider>
    </div>
  {/snippet}

  {#snippet compWithSubMenu()}
    <div class="w-full min-h-[260px] border rounded-lg overflow-hidden" style="contain: layout">
      <SidebarProvider defaultOpen={true}>
        <nav aria-label="Navegação principal">
          <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
            <SidebarHeader class="p-3 text-sm font-semibold text-sidebar-foreground">Design System</SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Componentes</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive size="sm">
                        <LayoutDashboard aria-hidden="true" /><span>Dashboard</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        size="sm"
                        aria-expanded={subOpen}
                        onclick={() => (subOpen = !subOpen)}
                      >
                        <Blocks aria-hidden="true" />
                        <span>Componentes</span>
                        <ChevronDown aria-hidden="true" class={['ml-auto transition-transform', subOpen ? 'rotate-180' : ''].join(' ')} />
                      </SidebarMenuButton>
                      {#if subOpen}
                        <SidebarMenuSub>
                          {#each ['Alert','Button','Card','Dialog'] as name}
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton>{name}</SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          {/each}
                        </SidebarMenuSub>
                      {/if}
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton size="sm">
                        <Coins aria-hidden="true" /><span>Tokens</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton size="sm">
                    <Settings aria-hidden="true" /><span>Configurações</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </Sidebar>
        </nav>
        <SidebarInset class="flex-1 flex items-center justify-center">
          <span class="text-xs text-muted-foreground">Clique em "Componentes"</span>
        </SidebarInset>
      </SidebarProvider>
    </div>
  {/snippet}

  {#snippet compWithSearch()}
    <div class="w-full min-h-[260px] border rounded-lg overflow-hidden" style="contain: layout">
      <SidebarProvider defaultOpen={true}>
        <nav aria-label="Navegação principal">
          <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
            <SidebarHeader class="gap-2 p-3">
              <span class="text-sm font-semibold text-sidebar-foreground">Design System</span>
              <div class="relative">
                <Search aria-hidden="true" class="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-sidebar-foreground/60 pointer-events-none" />
                <SidebarInput type="search" placeholder="Buscar..." aria-label="Buscar navegação" class="pl-7 h-8 text-xs" />
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Navegação</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive size="sm">
                        <LayoutDashboard aria-hidden="true" /><span>Dashboard</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton size="sm"><Blocks aria-hidden="true" /><span>Componentes</span></SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton size="sm"><Coins aria-hidden="true" /><span>Tokens</span></SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton size="sm"><Settings aria-hidden="true" /><span>Configurações</span></SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </nav>
        <SidebarInset class="flex-1 flex items-center justify-center">
          <span class="text-xs text-muted-foreground">Busca no header</span>
        </SidebarInset>
      </SidebarProvider>
    </div>
  {/snippet}

  {#snippet compWithBadges()}
    <div class="w-full min-h-[260px] border rounded-lg overflow-hidden" style="contain: layout">
      <SidebarProvider defaultOpen={true}>
        <nav aria-label="Navegação principal">
          <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
            <SidebarHeader class="p-3 text-sm font-semibold text-sidebar-foreground">App</SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive size="sm">
                        <LayoutDashboard aria-hidden="true" /><span>Dashboard</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton size="sm" aria-label="Notificações (12 não lidas)">
                        <Bell aria-hidden="true" /><span>Notificações</span>
                      </SidebarMenuButton>
                      <SidebarMenuBadge>12</SidebarMenuBadge>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton size="sm" aria-label="Componentes (3 atualizações)">
                        <Blocks aria-hidden="true" /><span>Componentes</span>
                      </SidebarMenuButton>
                      <SidebarMenuBadge>3</SidebarMenuBadge>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton size="sm"><Settings aria-hidden="true" /><span>Configurações</span></SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </nav>
        <SidebarInset class="flex-1 flex items-center justify-center">
          <span class="text-xs text-muted-foreground">Inbox</span>
        </SidebarInset>
      </SidebarProvider>
    </div>
  {/snippet}

  <!-- ── Estados ────────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('states.cols.state'),
      trigger: $tStore('states.cols.trigger'),
      behavior: $tStore('states.cols.behavior'),
    }}
    items={[
      { label: $tStore('states.expanded.label'),  trigger: stripHtml($tStore('states.expanded.trigger')),  behavior: $tStore('states.expanded.behavior')  },
      { label: $tStore('states.collapsed.label'), trigger: stripHtml($tStore('states.collapsed.trigger')), behavior: $tStore('states.collapsed.behavior') },
      { label: $tStore('states.offcanvas.label'), trigger: stripHtml($tStore('states.offcanvas.trigger')), behavior: $tStore('states.offcanvas.behavior') },
      { label: $tStore('states.mobile.label'),    trigger: stripHtml($tStore('states.mobile.trigger')),    behavior: $tStore('states.mobile.behavior')    },
      { label: $tStore('states.hidden.label'),    trigger: stripHtml($tStore('states.hidden.trigger')),    behavior: $tStore('states.hidden.behavior')    },
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        title: $tStore('props.providerTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'defaultOpen',  type: 'boolean',    defaultValue: 'true',      required: 'Não', description: stripHtml($tStore('props.provider.defaultOpen'))  },
          { name: 'open',         type: 'boolean',    defaultValue: '—',         required: 'Não', description: stripHtml($tStore('props.provider.open'))          },
          { name: 'onOpenChange', type: '(v: boolean) => void', defaultValue: '—', required: 'Não', description: stripHtml($tStore('props.provider.onOpenChange')) },
          { name: 'children',     type: 'Snippet',    defaultValue: '—',         required: 'Sim', description: stripHtml($tStore('props.provider.children'))      },
        ],
      },
      {
        title: $tStore('props.sidebarTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'side',        type: '"left" | "right"',                  defaultValue: '"left"',      required: 'Não', description: stripHtml($tStore('props.sidebar.side'))        },
          { name: 'variant',     type: '"sidebar" | "floating" | "inset"',  defaultValue: '"sidebar"',   required: 'Não', description: stripHtml($tStore('props.sidebar.variant'))     },
          { name: 'collapsible', type: '"offcanvas" | "icon" | "none"',     defaultValue: '"offcanvas"', required: 'Não', description: stripHtml($tStore('props.sidebar.collapsible')) },
        ],
      },
      {
        title: $tStore('props.menuButtonTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'isActive', type: 'boolean',               defaultValue: 'false',     required: 'Não', description: stripHtml($tStore('props.menuButton.isActive')) },
          { name: 'variant',  type: '"default" | "outline"', defaultValue: '"default"', required: 'Não', description: stripHtml($tStore('props.menuButton.variant'))  },
          { name: 'size',     type: '"default" | "sm" | "lg"', defaultValue: '"default"', required: 'Não', description: stripHtml($tStore('props.menuButton.size'))   },
          { name: 'tooltip',  type: 'string | object',        defaultValue: '—',         required: 'Não', description: stripHtml($tStore('props.menuButton.tooltip')) },
        ],
      },
      {
        title: $tStore('props.menuSkeletonTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'showIcon', type: 'boolean', defaultValue: 'false', required: 'Não', description: stripHtml($tStore('props.menuSkeleton.showIcon')) },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityNotes={$tStore('props.extensibility')}
  />

  <!-- ── Tokens ─────────────────────────────────────────────────── -->
  <DocsTokens
    title={$tStore('tokens.title')}
    cols={{
      token: $tStore('tokens.table.token'),
      value: $tStore('tokens.table.class'),
      description: $tStore('tokens.table.part'),
    }}
    items={[
      { token: '--sidebar',               value: 'bg-sidebar',               description: $tStore('tokens.sidebarBg')         },
      { token: '--sidebar-foreground',    value: 'text-sidebar-foreground',  description: $tStore('tokens.sidebarFg')         },
      { token: '--sidebar-border',        value: 'border-sidebar-border',    description: $tStore('tokens.sidebarBorder')     },
      { token: '--sidebar-accent',        value: 'bg-sidebar-accent',        description: $tStore('tokens.sidebarAccent')     },
      { token: '--sidebar-accent-foreground', value: 'text-sidebar-accent-foreground', description: $tStore('tokens.sidebarAccentFg') },
      { token: '--sidebar-ring',          value: 'ring-sidebar-ring',        description: $tStore('tokens.sidebarRing')       },
      { token: '--sidebar-width',         value: '—',                        description: $tStore('tokens.sidebarWidth')      },
      { token: '--sidebar-width-icon',    value: '—',                        description: $tStore('tokens.sidebarWidthIcon')  },
      { token: '--sidebar-width-mobile',  value: '—',                        description: $tStore('tokens.sidebarWidthMobile') },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={codeCustomizationTokens}
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
    title={$tStore('accessibility.title')}
    summary={$tStore('accessibility.summary')}
    items={[
      $tStore('accessibility.item1'),
      $tStore('accessibility.item2'),
      $tStore('accessibility.item3'),
      $tStore('accessibility.item4'),
      $tStore('accessibility.item5'),
      $tStore('accessibility.item6'),
      $tStore('accessibility.item7'),
    ]}
    keyboardTitle="Atalhos de Teclado"
    keyboardItems={[
      { key: 'Tab',       description: $tStore('accessibility.keyboard.tab')       },
      { key: 'Shift+Tab', description: $tStore('accessibility.keyboard.shiftTab')  },
      { key: 'Enter',     description: $tStore('accessibility.keyboard.enter')     },
      { key: 'Space',     description: $tStore('accessibility.keyboard.space')     },
      { key: 'Escape',    description: $tStore('accessibility.keyboard.escape')    },
      { key: 'Ctrl+B',    description: $tStore('accessibility.keyboard.ctrlB')     },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: 'NavigationMenu', description: $tStore('related.navigationMenu'), path: '?path=/docs/ui-navigationmenu--docs' },
      { name: 'Tabs',           description: $tStore('related.tabs'),           path: '?path=/docs/ui-tabs--docs'           },
      { name: 'Sheet',          description: $tStore('related.sheet'),          path: '?path=/docs/ui-sheet--docs'          },
      { name: 'Accordion',      description: $tStore('related.accordion'),      path: '?path=/docs/ui-accordion--docs'      },
      { name: 'Tooltip',        description: $tStore('related.tooltip'),        path: '?path=/docs/ui-tooltip--docs'        },
      { name: 'Separator',      description: $tStore('related.separator'),      path: '?path=/docs/ui-separator--docs'      },
      { name: 'Skeleton',       description: $tStore('related.skeleton'),       path: '?path=/docs/ui-skeleton--docs'       },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    items={[
      { title: '', content: $tStore('notes.tip1') },
      { title: '', content: $tStore('notes.tip2') },
      { title: '', content: $tStore('notes.tip3') },
      { title: '', content: $tStore('notes.tip4') },
      { title: '', content: $tStore('notes.tip5') },
    ]}
  />

  <!-- ── Analytics ─────────────────────────────────────────────── -->
  <DocsAnalytics
    title={$tStore('analytics.title')}
    cols={{
      event: $tStore('analytics.table.event'),
      trigger: $tStore('analytics.table.trigger'),
      payload: $tStore('analytics.table.payload'),
    }}
    items={[
      { event: $tStore('analytics.table.navClick'),      trigger: $tStore('analytics.table.navClickTrigger'),      payload: $tStore('analytics.table.navClickPayload')      },
      { event: $tStore('analytics.table.toggleOpen'),    trigger: $tStore('analytics.table.toggleOpenTrigger'),    payload: $tStore('analytics.table.togglePayload')        },
      { event: $tStore('analytics.table.pageView'),      trigger: $tStore('analytics.table.pageViewTrigger'),      payload: $tStore('analytics.table.pageViewPayload')      },
      { event: $tStore('analytics.table.sectionViewed'), trigger: $tStore('analytics.table.sectionViewedTrigger'), payload: $tStore('analytics.table.sectionViewedPayload') },
      { event: $tStore('analytics.table.langSwitch'),    trigger: $tStore('analytics.table.langSwitchTrigger'),    payload: $tStore('analytics.table.langSwitchPayload')    },
    ]}
  />

  <!-- ── Testes ─────────────────────────────────────────────────── -->
  <DocsTestes
    title={$tStore('testes.title')}
    functional={{
      title: $tStore('testes.functional.title'),
      cols: {
        action: $tNavStore('common.userAction'),
        result: $tNavStore('common.expectedResult'),
        priority: $tNavStore('common.priority'),
      },
      items: [
        { action: $tStore('testes.functional.item1.action'), result: $tStore('testes.functional.item1.result'), priority: localPriority($tStore('testes.functional.item1.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item2.action'), result: $tStore('testes.functional.item2.result'), priority: localPriority($tStore('testes.functional.item2.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item3.action'), result: $tStore('testes.functional.item3.result'), priority: localPriority($tStore('testes.functional.item3.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item4.action'), result: $tStore('testes.functional.item4.result'), priority: localPriority($tStore('testes.functional.item4.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item5.action'), result: $tStore('testes.functional.item5.result'), priority: localPriority($tStore('testes.functional.item5.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item6.action'), result: $tStore('testes.functional.item6.result'), priority: localPriority($tStore('testes.functional.item6.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item7.action'), result: $tStore('testes.functional.item7.result'), priority: localPriority($tStore('testes.functional.item7.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item8.action'), result: $tStore('testes.functional.item8.result'), priority: localPriority($tStore('testes.functional.item8.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item9.action'), result: $tStore('testes.functional.item9.result'), priority: localPriority($tStore('testes.functional.item9.priority'), $tNavStore) },
      ],
    }}
    accessibility={{
      title: $tStore('testes.accessibility.title'),
      cols: {
        criterion: $tNavStore('common.criterion'),
        level: 'WCAG',
        how: $tNavStore('common.howToVerify'),
      },
      items: [
        { criterion: $tStore('testes.accessibility.item1.criterion'), level: $tStore('testes.accessibility.item1.level'), how: $tStore('testes.accessibility.item1.how') },
        { criterion: $tStore('testes.accessibility.item2.criterion'), level: $tStore('testes.accessibility.item2.level'), how: $tStore('testes.accessibility.item2.how') },
        { criterion: $tStore('testes.accessibility.item3.criterion'), level: $tStore('testes.accessibility.item3.level'), how: $tStore('testes.accessibility.item3.how') },
        { criterion: $tStore('testes.accessibility.item4.criterion'), level: $tStore('testes.accessibility.item4.level'), how: $tStore('testes.accessibility.item4.how') },
        { criterion: $tStore('testes.accessibility.item5.criterion'), level: $tStore('testes.accessibility.item5.level'), how: $tStore('testes.accessibility.item5.how') },
        { criterion: $tStore('testes.accessibility.item6.criterion'), level: $tStore('testes.accessibility.item6.level'), how: $tStore('testes.accessibility.item6.how') },
      ],
    }}
    visual={{
      title: $tStore('testes.visual.title'),
      cols: {
        story: $tNavStore('common.storyState'),
        priority: $tNavStore('common.priority'),
      },
      items: [
        { story: $tStore('testes.visual.item1.story'), priority: localPriority($tStore('testes.visual.item1.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item2.story'), priority: localPriority($tStore('testes.visual.item2.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item3.story'), priority: localPriority($tStore('testes.visual.item3.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item4.story'), priority: localPriority($tStore('testes.visual.item4.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item5.story'), priority: localPriority($tStore('testes.visual.item5.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item6.story'), priority: localPriority($tStore('testes.visual.item6.priority'), $tNavStore) },
      ],
    }}
  />
</DocsPageLayout>
