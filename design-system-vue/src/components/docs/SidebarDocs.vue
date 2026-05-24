<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { Badge } from '@/components/ui/badge';
import LanguageSwitcher from '@/components/product/LanguageSwitcher.vue';
import uiTranslations from '@/i18n/ui.json';
import componentTranslations from '@shared/content/sidebar/translations.json';

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
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { LayoutDashboard, Blocks, Palette, Settings, User, Bell, Search, ChevronDown } from 'lucide-vue-next';

import DocsPageLayout    from '@/components/docs/shared/sections/DocsPageLayout.vue';
import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.vue';
import DocsDemonstration from '@/components/docs/shared/sections/DocsDemonstration.vue';
import DocsAnatomy       from '@/components/docs/shared/sections/DocsAnatomy.vue';
import DocsWhenToUse     from '@/components/docs/shared/sections/DocsWhenToUse.vue';
import DocsDoDont        from '@/components/docs/shared/sections/DocsDoDont.vue';
import DocsImport        from '@/components/docs/shared/sections/DocsImport.vue';
import DocsVariants      from '@/components/docs/shared/sections/DocsVariants.vue';
import DocsCompositions  from '@/components/docs/shared/sections/DocsCompositions.vue';
import DocsStates        from '@/components/docs/shared/sections/DocsStates.vue';
import DocsProps         from '@/components/docs/shared/sections/DocsProps.vue';
import DocsTokens        from '@/components/docs/shared/sections/DocsTokens.vue';
import DocsAccessibility from '@/components/docs/shared/sections/DocsAccessibility.vue';
import DocsRelated       from '@/components/docs/shared/sections/DocsRelated.vue';
import DocsNotes         from '@/components/docs/shared/sections/DocsNotes.vue';
import DocsAnalytics     from '@/components/docs/shared/sections/DocsAnalytics.vue';
import DocsTestes        from '@/components/docs/shared/sections/DocsTestes.vue';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(componentTranslations);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function localPriority(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

// ─── SEO & GEO ────────────────────────────────────────────────────────────────

useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: 'sidebar',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'sidebar',
    locale: newLocale as 'pt-BR' | 'en' | 'es',
    page_title: tContent('seo.title'),
  });
}, { immediate: true });

// ─── Analytics — section view ─────────────────────────────────────────────────

// ─── Navigation groups ────────────────────────────────────────────────────────

const navGroups = computed(() => [
  {
    label: tNav('nav.overview'),
    sections: [
      { id: 'demonstracao', label: tNav('nav.demonstration') },
      { id: 'anatomia',     label: tNav('nav.anatomy')      },
      { id: 'quando-usar',  label: tNav('nav.usage')        },
      { id: 'do-dont',      label: tNav('nav.doDont')       },
    ],
  },
  {
    label: tNav('nav.techRef'),
    sections: [
      { id: 'importacao',   label: tNav('nav.import')   },
      { id: 'variantes',    label: tNav('nav.variants')     },
      { id: 'composicoes',  label: tNav('nav.compositions') },
      { id: 'estados',      label: tNav('nav.states')       },
      { id: 'propriedades', label: tNav('nav.props')    },
      { id: 'tokens',       label: tNav('nav.tokens')   },
    ],
  },
  {
    label: tNav('nav.context'),
    sections: [
      { id: 'acessibilidade', label: tNav('nav.accessibility') },
      { id: 'relacionados',   label: tNav('nav.related')       },
      { id: 'notas',          label: tNav('nav.notes')         },
    ],
  },
  {
    label: tNav('nav.quality'),
    sections: [
      { id: 'analytics', label: tNav('nav.analytics') },
      { id: 'testes',    label: tNav('nav.testes')    },
    ],
  },
]);

const allSectionIds = computed(() => navGroups.value.flatMap(g => g.sections.map(s => s.id)));



const { activeId: activeSection } = useActiveSection(allSectionIds, (id) => {
  track('docs_section_viewed', {
    section_id: id,
    component_name: 'sidebar',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import { SidebarProvider, Sidebar, SidebarContent, SidebarInset } from "@/components/ui/sidebar";`;

const codeImportWithSubcomponents = `import {
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
  SidebarInset,
  SidebarTrigger,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";`;

const codeVariantSidebar = `<SidebarProvider>
  <nav aria-label="Navegação principal">
    <Sidebar variant="sidebar" collapsible="offcanvas">
      <SidebarContent><!-- ... --></SidebarContent>
      <SidebarRail />
    </Sidebar>
  </nav>
  <SidebarInset>
    <main id="main-content"><!-- conteúdo --></main>
  </SidebarInset>
</SidebarProvider>`;

const codeVariantFloating = `<Sidebar variant="floating" collapsible="offcanvas">
  <!-- Sidebar com borda arredondada e sombra -->
</Sidebar>`;

const codeVariantInset = `<Sidebar variant="inset" collapsible="offcanvas">
  <!-- Sidebar integrada com conteúdo em container arredondado -->
</Sidebar>`;

const codeCollapsibleIcon = `<Sidebar collapsible="icon">
  <!-- Labels ocultos no modo collapsed; tooltips ao hover -->
  <SidebarMenuButton tooltip="Dashboard">
    <LayoutDashboard aria-hidden="true" />
    <span>Dashboard</span>
  </SidebarMenuButton>
</Sidebar>`;

const codeCustomizationTokens = `/* Em globals.css */
:root {
  --sidebar: 0 0% 98%;
  --sidebar-foreground: 240 5.3% 26.1%;
  --sidebar-primary: 240 5.9% 10%;
  --sidebar-accent: 240 4.8% 95.9%;
  --sidebar-border: 220 13% 91%;
  --sidebar-width: 16rem;
  --sidebar-width-icon: 3rem;
}

.dark {
  --sidebar: 240 5.9% 10%;
  --sidebar-foreground: 240 4.8% 95.9%;
  --sidebar-border: 240 3.7% 15.9%;
}`;

const interfaceCode = `// SidebarProvider
interface SidebarProviderProps {
  defaultOpen?: boolean;
  open?: boolean;
  class?: string;
}

// Sidebar
interface SidebarProps {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  class?: string;
}

// SidebarMenuButton
interface SidebarMenuButtonProps {
  isActive?: boolean;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  tooltip?: string | TooltipContentProps;
  class?: string;
}

// useSidebar()
interface UseSidebarReturn {
  state: "expanded" | "collapsed";
  open: boolean;
  isMobile: boolean;
  toggleSidebar: () => void;
}`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => Array.from({ length: 16 }, (_, i) => tContent(`anatomy.item${i + 1}`)));

const codeCollapsibleNone = `<Sidebar collapsible="none">
  <!-- Sidebar sempre visível, sem toggle -->
</Sidebar>`;

const codeSideRight = `<Sidebar side="right">
  <!-- Sidebar posicionada na direita -->
</Sidebar>`;

const variantItems = computed(() => [
  { name: 'sidebar',   description: tContent('variants.sidebar'),   code: codeVariantSidebar   },
  { name: 'floating',  description: tContent('variants.floating'),  code: codeVariantFloating  },
  { name: 'inset',     description: tContent('variants.inset'),     code: codeVariantInset     },
  { name: 'icon',      description: tContent('variants.icon'),      code: codeCollapsibleIcon  },
  { name: 'none',      description: tContent('variants.none'),      code: codeCollapsibleNone  },
  { name: 'right',     description: tContent('variants.right'),     code: codeSideRight        },
]);

const stateItems = computed(() => [
  { label: tContent('states.expanded.label'),  trigger: stripHtml(tContent('states.expanded.trigger')),  behavior: tContent('states.expanded.behavior')  },
  { label: tContent('states.collapsed.label'), trigger: stripHtml(tContent('states.collapsed.trigger')), behavior: tContent('states.collapsed.behavior') },
  { label: tContent('states.offcanvas.label'), trigger: stripHtml(tContent('states.offcanvas.trigger')), behavior: tContent('states.offcanvas.behavior') },
  { label: tContent('states.mobile.label'),    trigger: stripHtml(tContent('states.mobile.trigger')),    behavior: tContent('states.mobile.behavior')    },
  { label: tContent('states.hidden.label'),    trigger: stripHtml(tContent('states.hidden.trigger')),    behavior: tContent('states.hidden.behavior')    },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const providerPropItems = computed(() => [
  { name: 'defaultOpen',   type: 'boolean',            defaultValue: 'true',      required: 'Não', description: tContent('props.provider.defaultOpen')   },
  { name: 'open',          type: 'boolean',            defaultValue: 'undefined', required: 'Não', description: stripHtml(tContent('props.provider.open'))          },
  { name: 'onOpenChange',  type: '(v: boolean) => void', defaultValue: '—',       required: 'Não', description: tContent('props.provider.onOpenChange')  },
]);

const sidebarPropItems = computed(() => [
  { name: 'side',        type: '"left" | "right"',                       defaultValue: '"left"',      required: 'Não', description: stripHtml(tContent('props.sidebar.side'))        },
  { name: 'variant',     type: '"sidebar" | "floating" | "inset"',       defaultValue: '"sidebar"',   required: 'Não', description: stripHtml(tContent('props.sidebar.variant'))     },
  { name: 'collapsible', type: '"offcanvas" | "icon" | "none"',          defaultValue: '"offcanvas"', required: 'Não', description: stripHtml(tContent('props.sidebar.collapsible')) },
]);

const menuButtonPropItems = computed(() => [
  { name: 'isActive', type: 'boolean',                            defaultValue: 'false',     required: 'Não', description: stripHtml(tContent('props.menuButton.isActive')) },
  { name: 'variant',  type: '"default" | "outline"',             defaultValue: '"default"', required: 'Não', description: stripHtml(tContent('props.menuButton.variant'))   },
  { name: 'size',     type: '"default" | "sm" | "lg"',           defaultValue: '"default"', required: 'Não', description: stripHtml(tContent('props.menuButton.size'))      },
  { name: 'tooltip',  type: 'string | TooltipContentProps',       defaultValue: '—',         required: 'Não', description: stripHtml(tContent('props.menuButton.tooltip'))   },
]);

const menuSubButtonPropItems = computed(() => [
  { name: 'isActive', type: 'boolean',        defaultValue: 'false',  required: 'Não', description: tContent('props.menuSubButton.isActive')              },
  { name: 'size',     type: '"sm" | "md"',    defaultValue: '"md"',   required: 'Não', description: stripHtml(tContent('props.menuSubButton.size'))       },
  { name: 'render',   type: 'Component',      defaultValue: '—',      required: 'Não', description: stripHtml(tContent('props.menuSubButton.render'))     },
]);

const menuSkeletonPropItems = computed(() => [
  { name: 'showIcon', type: 'boolean', defaultValue: 'false', required: 'Não', description: tContent('props.menuSkeleton.showIcon') },
]);

const tokenRows = computed(() => [
  { token: '--sidebar',                 value: 'bg-sidebar',                        description: tContent('tokens.sidebarBg')         },
  { token: '--sidebar-foreground',      value: 'text-sidebar-foreground',           description: tContent('tokens.sidebarFg')         },
  { token: '--sidebar-border',          value: 'border-sidebar-border',             description: tContent('tokens.sidebarBorder')     },
  { token: '--sidebar-accent',          value: 'bg-sidebar-accent',                 description: tContent('tokens.sidebarAccent')     },
  { token: '--sidebar-accent-foreground', value: 'text-sidebar-accent-foreground', description: tContent('tokens.sidebarAccentFg')   },
  { token: '--sidebar-ring',            value: 'ring-sidebar-ring',                 description: tContent('tokens.sidebarRing')       },
  { token: '--sidebar-width',           value: '—',                                 description: tContent('tokens.sidebarWidth')      },
  { token: '--sidebar-width-icon',      value: '—',                                 description: tContent('tokens.sidebarWidthIcon')  },
  { token: '--sidebar-width-mobile',    value: '—',                                 description: tContent('tokens.sidebarWidthMobile')},
]);

const accessibilityItems = computed(() => [
  tContent('accessibility.item1'), tContent('accessibility.item2'),
  tContent('accessibility.item3'), tContent('accessibility.item4'),
  tContent('accessibility.item5'), tContent('accessibility.item6'),
  tContent('accessibility.item7'),
]);

const keyboardItems = computed(() => [
  { key: 'Tab',          description: tContent('accessibility.keyboard.tab')       },
  { key: 'Shift+Tab',    description: tContent('accessibility.keyboard.shiftTab')  },
  { key: 'Enter',        description: tContent('accessibility.keyboard.enter')     },
  { key: 'Space',        description: tContent('accessibility.keyboard.space')     },
  { key: 'Escape',       description: tContent('accessibility.keyboard.escape')    },
  { key: 'Ctrl+B',       description: tContent('accessibility.keyboard.ctrlB')     },
]);

const relatedItems = computed(() => [
  { name: 'NavigationMenu', description: tContent('related.navigationMenu'), path: '?path=/docs/ui-navigationmenu--docs' },
  { name: 'Tabs',           description: tContent('related.tabs'),           path: '?path=/docs/ui-tabs--docs'           },
  { name: 'Sheet',          description: tContent('related.sheet'),          path: '?path=/docs/ui-sheet--docs'          },
  { name: 'Accordion',      description: tContent('related.accordion'),      path: '?path=/docs/ui-accordion--docs'      },
  { name: 'Tooltip',        description: tContent('related.tooltip'),        path: '?path=/docs/ui-tooltip--docs'        },
  { name: 'Separator',      description: tContent('related.separator'),      path: '?path=/docs/ui-separator--docs'      },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.tip1') },
  { title: '', content: tContent('notes.tip2') },
  { title: '', content: tContent('notes.tip3') },
  { title: '', content: tContent('notes.tip4') },
  { title: '', content: tContent('notes.tip5') },
]);

const analyticsItems = computed(() => [
  { event: tContent('analytics.table.navClick'),      trigger: tContent('analytics.table.navClickTrigger'),      payload: tContent('analytics.table.navClickPayload')      },
  { event: tContent('analytics.table.toggleOpen'),    trigger: tContent('analytics.table.toggleOpenTrigger'),    payload: tContent('analytics.table.togglePayload')        },
  { event: tContent('analytics.table.pageView'),      trigger: tContent('analytics.table.pageViewTrigger'),      payload: tContent('analytics.table.pageViewPayload')      },
  { event: tContent('analytics.table.sectionViewed'), trigger: tContent('analytics.table.sectionViewedTrigger'), payload: tContent('analytics.table.sectionViewedPayload') },
  { event: tContent('analytics.table.langSwitch'),    trigger: tContent('analytics.table.langSwitchTrigger'),    payload: tContent('analytics.table.langSwitchPayload')    },
]);

const a11yCritCols = computed(() => ({
  criterion: tNav('common.criterion'),
  level: 'WCAG',
  how: tNav('common.howToVerify'),
}));

const functionalTestItems = computed(() => Array.from({ length: 9 }, (_, i) => ({
  action:   tContent(`testes.functional.item${i + 1}.action`),
  result:   tContent(`testes.functional.item${i + 1}.result`),
  priority: localPriority(tContent(`testes.functional.item${i + 1}.priority`)),
})));

const a11yTestItems = computed(() => Array.from({ length: 6 }, (_, i) => ({
  criterion: tContent(`testes.accessibility.item${i + 1}.criterion`),
  level:     tContent(`testes.accessibility.item${i + 1}.level`),
  how:       tContent(`testes.accessibility.item${i + 1}.how`),
})));

const visualTestItems = computed(() => Array.from({ length: 6 }, (_, i) => ({
  story:    tContent(`testes.visual.item${i + 1}.story`),
  priority: localPriority(tContent(`testes.visual.item${i + 1}.priority`)),
})));

// ─── Composições ──────────────────────────────────────────────────────────────

const subMenuOpen = ref(false);
function toggleSubMenu() { subMenuOpen.value = !subMenuOpen.value; }

const codeCompositionWithGroups = `<Sidebar variant="sidebar" collapsible="offcanvas">
  <SidebarHeader><!-- logo --></SidebarHeader>
  <SidebarContent>
    <SidebarGroup>
      <SidebarGroupLabel>Principal</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton :isActive="true" aria-current="page">
              <LayoutDashboard aria-hidden="true" />
              <span>Dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <!-- ... -->
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
</Sidebar>`;

const codeCompositionWithSubMenu = `<` + `script setup>
const open = ref(false);
</` + `script>

<template>
  <SidebarMenuItem>
    <SidebarMenuButton :aria-expanded="open" @click="open = !open">
      <Blocks aria-hidden="true" />
      <span>Componentes</span>
      <ChevronDown aria-hidden="true" :class="open ? 'rotate-180' : ''" />
    </SidebarMenuButton>
    <SidebarMenuSub v-if="open">
      <SidebarMenuSubItem>
        <SidebarMenuSubButton>Alert</SidebarMenuSubButton>
      </SidebarMenuSubItem>
      <!-- ... -->
    </SidebarMenuSub>
  </SidebarMenuItem>
</template>`;

const codeCompositionWithSearch = `<SidebarHeader class="gap-2">
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
</SidebarHeader>`;

const codeCompositionWithBadges = `<SidebarMenuItem>
  <SidebarMenuButton aria-label="Notificações (12 não lidas)">
    <Bell aria-hidden="true" />
    <span>Notificações</span>
  </SidebarMenuButton>
  <SidebarMenuBadge>12</SidebarMenuBadge>
</SidebarMenuItem>`;

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.withGroups.name'),
    description: tContent('variants.compositions.withGroups.description'),
    useWhen: tContent('variants.compositions.withGroups.use'),
    code: codeCompositionWithGroups,
  },
  {
    name: tContent('variants.compositions.withSubMenu.name'),
    description: tContent('variants.compositions.withSubMenu.description'),
    useWhen: tContent('variants.compositions.withSubMenu.use'),
    code: codeCompositionWithSubMenu,
  },
  {
    name: tContent('variants.compositions.withSearch.name'),
    description: tContent('variants.compositions.withSearch.description'),
    useWhen: tContent('variants.compositions.withSearch.use'),
    code: codeCompositionWithSearch,
  },
  {
    name: tContent('variants.compositions.withBadges.name'),
    description: tContent('variants.compositions.withBadges.description'),
    useWhen: tContent('variants.compositions.withBadges.use'),
    code: codeCompositionWithBadges,
  },
]);
</script>

<template>
  <DocsPageLayout :nav-groups="navGroups" :active-section="activeSection" component-slug="sidebar">
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
        install-note="npx shadcn-vue@latest add sidebar"
      >
        <template #badges>
          <Badge variant="secondary" class="rounded-md bg-primary/5 text-primary border-primary/10 hover:bg-primary/5 font-medium px-2 py-0">
            {{ tContent('category') }}
          </Badge>
          <Badge variant="secondary" class="rounded-md bg-primary/5 text-primary border-primary/10 hover:bg-primary/5 font-medium px-2 py-0">
            {{ tContent('type') }}
          </Badge>
        </template>
        <template #language-switcher>
          <LanguageSwitcher />
        </template>
      </DocsHeader>
    </template>

    <!-- ── Demonstração ───────────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div class="w-full min-h-[400px] flex rounded-lg overflow-hidden border border-border" style="contain: layout">
        <SidebarProvider>
          <nav :aria-label="tContent('demonstration.labels.mainNav')">
            <Sidebar collapsible="offcanvas">
              <SidebarHeader class="p-4 font-semibold text-sidebar-foreground">Design System</SidebarHeader>
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupLabel>{{ tContent('demonstration.labels.mainNav') }}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton :isActive="true" :tooltip="tContent('demonstration.labels.dashboard')" aria-current="page">
                          <LayoutDashboard aria-hidden="true" />
                          <span>{{ tContent('demonstration.labels.dashboard') }}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton :tooltip="tContent('demonstration.labels.components')">
                          <Blocks aria-hidden="true" />
                          <span>{{ tContent('demonstration.labels.components') }}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton :tooltip="tContent('demonstration.labels.tokens')">
                          <Palette aria-hidden="true" />
                          <span>{{ tContent('demonstration.labels.tokens') }}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
                <SidebarSeparator />
                <SidebarGroup>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton :tooltip="tContent('demonstration.labels.settings')">
                          <Settings aria-hidden="true" />
                          <span>{{ tContent('demonstration.labels.settings') }}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
              <SidebarFooter class="p-2">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton :tooltip="tContent('demonstration.labels.profile')">
                      <User aria-hidden="true" />
                      <span>{{ tContent('demonstration.labels.profile') }}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarFooter>
              <SidebarRail />
            </Sidebar>
          </nav>
          <SidebarInset>
            <header class="flex h-12 items-center gap-2 px-4 border-b border-border">
              <SidebarTrigger />
              <span class="text-sm text-muted-foreground">{{ tContent('demonstration.labels.dashboard') }}</span>
            </header>
            <main id="main-content" class="p-4">
              <p class="text-sm text-muted-foreground">{{ tContent('description') }}</p>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </DocsDemonstration>

    <!-- ── Anatomia ───────────────────────────────────────────────────── -->
    <DocsAnatomy
      :title="tContent('anatomy.title')"
      :items="anatomyItems"
      :structure-label="tContent('anatomy.structureLabel')"
      :structure-code="tContent('anatomy.structureCode')"
    />

    <!-- ── Quando Usar ────────────────────────────────────────────────── -->
    <DocsWhenToUse
      :title="tContent('usage.title')"
      :guidelines="{
        title: tContent('usage.guidelines.title'),
        items: [
          tContent('usage.guidelines.item1'),
          tContent('usage.guidelines.item2'),
          tContent('usage.guidelines.item3'),
          tContent('usage.guidelines.item4'),
          tContent('usage.guidelines.item5'),
        ],
      }"
      :scenarios="{
        title: tContent('usage.scenarios.title'),
        cols: {
          scenario: tContent('usage.scenarios.cols.scenario'),
          use: tContent('usage.scenarios.cols.use'),
          alternative: tContent('usage.scenarios.cols.alternative'),
        },
        items: [
          { s: tContent('usage.scenarios.item1.s'), u: tContent('usage.scenarios.item1.u'), a: tContent('usage.scenarios.item1.a') },
          { s: tContent('usage.scenarios.item2.s'), u: tContent('usage.scenarios.item2.u'), a: tContent('usage.scenarios.item2.a') },
          { s: tContent('usage.scenarios.item3.s'), u: tContent('usage.scenarios.item3.u'), a: tContent('usage.scenarios.item3.a') },
          { s: tContent('usage.scenarios.item4.s'), u: tContent('usage.scenarios.item4.u'), a: tContent('usage.scenarios.item4.a') },
          { s: tContent('usage.scenarios.item5.s'), u: tContent('usage.scenarios.item5.u'), a: tContent('usage.scenarios.item5.a') },
        ],
      }"
      :do="{ title: tContent('usage.do.title'), items: [tContent('usage.do.item1'), tContent('usage.do.item2'), tContent('usage.do.item3'), tContent('usage.do.item4')] }"
      :dont="{ title: tContent('usage.dont.title'), items: [tContent('usage.dont.item1'), tContent('usage.dont.item2'), tContent('usage.dont.item3')] }"
    />

    <!-- ── Do & Don't ─────────────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="[
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: tContent('doDont.pair1.do'), dontCaption: tContent('doDont.pair1.dont') },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: tContent('doDont.pair2.do'), dontCaption: tContent('doDont.pair2.dont') },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: tContent('doDont.pair3.do'), dontCaption: tContent('doDont.pair3.dont') },
      ]"
    >
      <!-- Par 1: SidebarProvider na raiz -->
      <template #do-preview-0>
        <div class="w-full min-h-[180px] flex rounded overflow-hidden border border-border text-xs" style="contain: layout">
          <SidebarProvider>
            <nav aria-label="Navegação principal">
              <Sidebar collapsible="none" class="w-32">
                <SidebarHeader class="p-2 font-semibold text-sidebar-foreground text-xs">App</SidebarHeader>
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton :isActive="true" size="sm" aria-current="page">
                            <LayoutDashboard aria-hidden="true" /><span>Dashboard</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </Sidebar>
            </nav>
            <SidebarInset>
              <main id="main-content-do1" class="p-2 text-muted-foreground">Conteúdo</main>
            </SidebarInset>
          </SidebarProvider>
        </div>
      </template>
      <template #dont-preview-0>
        <div class="w-full min-h-[180px] flex rounded overflow-hidden border border-destructive/30 text-xs bg-destructive/5">
          <div class="w-32 bg-sidebar border-r border-border p-2">
            <p class="font-semibold text-sidebar-foreground">App</p>
            <p class="text-muted-foreground mt-2">Dashboard</p>
          </div>
          <div class="flex-1 p-2 text-muted-foreground">Estado replicado manualmente</div>
        </div>
      </template>

      <!-- Par 2: aria-current no item ativo -->
      <template #do-preview-1>
        <div class="w-full min-h-[120px] flex rounded overflow-hidden border border-border text-xs" style="contain: layout">
          <SidebarProvider>
            <nav aria-label="Navegação principal">
              <Sidebar collapsible="none" class="w-32">
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton :isActive="true" size="sm" :tooltip="'Dashboard'" aria-current="page">
                            <LayoutDashboard aria-hidden="true" /><span>Dashboard</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </Sidebar>
            </nav>
            <SidebarInset><main id="main-content-do2" class="p-2 text-xs text-muted-foreground">aria-current="page" + tooltip</main></SidebarInset>
          </SidebarProvider>
        </div>
      </template>
      <template #dont-preview-1>
        <div class="w-full min-h-[120px] flex rounded overflow-hidden border border-destructive/30 text-xs bg-destructive/5" style="contain: layout">
          <div class="w-32 bg-sidebar border-r border-border p-2">
            <div class="bg-sidebar-accent rounded p-1 text-sidebar-foreground">
              <LayoutDashboard class="inline-block mr-1 size-3" aria-hidden="true" />Dashboard
            </div>
          </div>
          <div class="flex-1 p-2 text-muted-foreground">Sem aria-current no item ativo</div>
        </div>
      </template>

      <!-- Par 3: SidebarTrigger só em mobile -->
      <template #do-preview-2>
        <div class="w-full min-h-[120px] flex rounded overflow-hidden border border-border text-xs" style="contain: layout">
          <SidebarProvider>
            <nav aria-label="Navegação principal">
              <Sidebar collapsible="none" class="w-32">
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton size="sm">
                            <Blocks aria-hidden="true" /><span>Componentes</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </Sidebar>
            </nav>
            <SidebarInset>
              <header class="flex h-8 items-center gap-2 px-2 border-b border-border">
                <SidebarTrigger class="lg:hidden size-5" />
                <span class="text-xs text-muted-foreground">Trigger só em mobile</span>
              </header>
              <main id="main-content-do3" class="p-2"></main>
            </SidebarInset>
          </SidebarProvider>
        </div>
      </template>
      <template #dont-preview-2>
        <div class="w-full min-h-[120px] flex rounded overflow-hidden border border-destructive/30 text-xs bg-destructive/5" style="contain: layout">
          <SidebarProvider>
            <nav aria-label="Navegação principal">
              <Sidebar collapsible="none" class="w-32">
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton size="sm">
                            <Blocks aria-hidden="true" /><span>Componentes</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </Sidebar>
            </nav>
            <SidebarInset>
              <header class="flex h-8 items-center gap-2 px-2 border-b border-border">
                <SidebarTrigger class="size-5" />
                <span class="text-xs text-muted-foreground">Trigger em desktop</span>
              </header>
              <main id="main-content-dont3" class="p-2"></main>
            </SidebarInset>
          </SidebarProvider>
        </div>
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :description="tContent('import.basic')"
      :code="codeImportBasic"
      :secondary-description="tContent('import.withSubcomponents')"
      :secondary-code="codeImportWithSubcomponents"
    />

    <!-- ── Variantes ──────────────────────────────────────────────────── -->
    <DocsVariants :title="tContent('variants.title')" :items="variantItems">
      <!-- variant: sidebar -->
      <template #variant-preview-0>
        <div class="w-full min-h-[200px] flex rounded overflow-hidden border border-border" style="contain: layout">
          <SidebarProvider>
            <nav aria-label="Navegação principal">
              <Sidebar variant="sidebar" collapsible="offcanvas">
                <SidebarHeader class="p-3 font-semibold text-sidebar-foreground text-sm">App</SidebarHeader>
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton :isActive="true" size="sm" aria-current="page">
                            <LayoutDashboard aria-hidden="true" /><span>Dashboard</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton size="sm">
                            <Blocks aria-hidden="true" /><span>Componentes</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
                <SidebarRail />
              </Sidebar>
            </nav>
            <SidebarInset>
              <main id="main-content-v1" class="p-3 text-xs text-muted-foreground">variant="sidebar"</main>
            </SidebarInset>
          </SidebarProvider>
        </div>
      </template>

      <!-- variant: floating -->
      <template #variant-preview-1>
        <div class="w-full min-h-[200px] flex rounded overflow-hidden border border-border" style="contain: layout">
          <SidebarProvider>
            <nav aria-label="Navegação principal">
              <Sidebar variant="floating" collapsible="offcanvas">
                <SidebarHeader class="p-3 font-semibold text-sidebar-foreground text-sm">App</SidebarHeader>
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton :isActive="true" size="sm" aria-current="page">
                            <LayoutDashboard aria-hidden="true" /><span>Dashboard</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton size="sm">
                            <Blocks aria-hidden="true" /><span>Componentes</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
                <SidebarRail />
              </Sidebar>
            </nav>
            <SidebarInset>
              <main id="main-content-v2" class="p-3 text-xs text-muted-foreground">variant="floating"</main>
            </SidebarInset>
          </SidebarProvider>
        </div>
      </template>

      <!-- variant: inset -->
      <template #variant-preview-2>
        <div class="w-full min-h-[200px] flex rounded overflow-hidden border border-border" style="contain: layout">
          <SidebarProvider>
            <nav aria-label="Navegação principal">
              <Sidebar variant="inset" collapsible="offcanvas">
                <SidebarHeader class="p-3 font-semibold text-sidebar-foreground text-sm">App</SidebarHeader>
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton :isActive="true" size="sm" aria-current="page">
                            <LayoutDashboard aria-hidden="true" /><span>Dashboard</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton size="sm">
                            <Blocks aria-hidden="true" /><span>Componentes</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
                <SidebarRail />
              </Sidebar>
            </nav>
            <SidebarInset>
              <main id="main-content-v3" class="p-3 text-xs text-muted-foreground">variant="inset"</main>
            </SidebarInset>
          </SidebarProvider>
        </div>
      </template>

      <!-- collapsible: icon -->
      <template #variant-preview-3>
        <div class="w-full min-h-[200px] flex rounded overflow-hidden border border-border" style="contain: layout">
          <SidebarProvider :default-open="false">
            <nav aria-label="Navegação principal">
              <Sidebar variant="sidebar" collapsible="icon">
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton :isActive="true" size="sm" tooltip="Dashboard" aria-current="page">
                            <LayoutDashboard aria-hidden="true" /><span>Dashboard</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton size="sm" tooltip="Componentes">
                            <Blocks aria-hidden="true" /><span>Componentes</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton size="sm" tooltip="Tokens">
                            <Palette aria-hidden="true" /><span>Tokens</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
                <SidebarRail />
              </Sidebar>
            </nav>
            <SidebarInset>
              <main id="main-content-v4" class="p-3 text-xs text-muted-foreground">collapsible="icon"</main>
            </SidebarInset>
          </SidebarProvider>
        </div>
      </template>

      <!-- collapsible: none -->
      <template #variant-preview-4>
        <div class="w-full min-h-[200px] flex rounded overflow-hidden border border-border" style="contain: layout">
          <SidebarProvider>
            <nav aria-label="Navegação principal">
              <Sidebar variant="sidebar" collapsible="none">
                <SidebarHeader class="p-3 font-semibold text-sidebar-foreground text-sm">App</SidebarHeader>
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton :isActive="true" size="sm" aria-current="page">
                            <LayoutDashboard aria-hidden="true" /><span>Dashboard</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton size="sm">
                            <Blocks aria-hidden="true" /><span>Componentes</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </Sidebar>
            </nav>
            <SidebarInset>
              <main id="main-content-v5" class="p-3 text-xs text-muted-foreground">collapsible="none"</main>
            </SidebarInset>
          </SidebarProvider>
        </div>
      </template>

      <!-- side: right -->
      <template #variant-preview-5>
        <div class="w-full min-h-[200px] flex rounded overflow-hidden border border-border" style="contain: layout">
          <SidebarProvider>
            <SidebarInset>
              <main id="main-content-v6" class="p-3 text-xs text-muted-foreground">side="right"</main>
            </SidebarInset>
            <nav aria-label="Navegação principal">
              <Sidebar variant="sidebar" collapsible="offcanvas" side="right">
                <SidebarHeader class="p-3 font-semibold text-sidebar-foreground text-sm">App</SidebarHeader>
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton :isActive="true" size="sm" aria-current="page">
                            <LayoutDashboard aria-hidden="true" /><span>Dashboard</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
                <SidebarRail />
              </Sidebar>
            </nav>
          </SidebarProvider>
        </div>
      </template>
    </DocsVariants>

    <!-- ── Composições ────────────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="sidebar"
      :items="compositionItems"
    >
      <!-- Com grupos de navegação -->
      <template #variant-preview-0>
        <div class="w-full min-h-[260px] flex rounded-lg overflow-hidden border border-border" style="contain: layout">
          <SidebarProvider>
            <nav aria-label="Navegação principal">
              <Sidebar variant="sidebar" collapsible="offcanvas">
                <SidebarHeader class="p-3 font-semibold text-sidebar-foreground text-sm">Design System</SidebarHeader>
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupLabel>Principal</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton :isActive="true" size="sm" aria-current="page">
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
                            <Palette aria-hidden="true" /><span>Tokens</span>
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
            <SidebarInset>
              <header class="flex h-10 items-center gap-2 px-3 border-b border-border">
                <SidebarTrigger /><span class="text-xs text-muted-foreground">Dashboard</span>
              </header>
            </SidebarInset>
          </SidebarProvider>
        </div>
      </template>

      <!-- Com sub-menu -->
      <template #variant-preview-1>
        <div class="w-full min-h-[260px] flex rounded-lg overflow-hidden border border-border" style="contain: layout">
          <SidebarProvider>
            <nav aria-label="Navegação principal">
              <Sidebar variant="sidebar" collapsible="offcanvas">
                <SidebarHeader class="p-3 font-semibold text-sidebar-foreground text-sm">Design System</SidebarHeader>
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupLabel>Componentes</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton :isActive="true" size="sm" aria-current="page">
                            <LayoutDashboard aria-hidden="true" /><span>Dashboard</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton size="sm" :aria-expanded="subMenuOpen" @click="toggleSubMenu">
                            <Blocks aria-hidden="true" />
                            <span>Componentes</span>
                            <ChevronDown aria-hidden="true" :class="['ml-auto transition-transform', subMenuOpen ? 'rotate-180' : '']" />
                          </SidebarMenuButton>
                          <SidebarMenuSub v-if="subMenuOpen">
                            <SidebarMenuSubItem v-for="name in ['Alert','Button','Card','Dialog']" :key="name">
                              <SidebarMenuSubButton>{{ name }}</SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          </SidebarMenuSub>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton size="sm">
                            <Palette aria-hidden="true" /><span>Tokens</span>
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
            <SidebarInset>
              <header class="flex h-10 items-center gap-2 px-3 border-b border-border">
                <SidebarTrigger /><span class="text-xs text-muted-foreground">Clique em "Componentes"</span>
              </header>
            </SidebarInset>
          </SidebarProvider>
        </div>
      </template>

      <!-- Com busca no header -->
      <template #variant-preview-2>
        <div class="w-full min-h-[260px] flex rounded-lg overflow-hidden border border-border" style="contain: layout">
          <SidebarProvider>
            <nav aria-label="Navegação principal">
              <Sidebar variant="sidebar" collapsible="offcanvas">
                <SidebarHeader class="gap-2 p-3">
                  <span class="font-semibold text-sm text-sidebar-foreground">Design System</span>
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
                          <SidebarMenuButton :isActive="true" size="sm" aria-current="page">
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
                            <Palette aria-hidden="true" /><span>Tokens</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton size="sm">
                            <Settings aria-hidden="true" /><span>Configurações</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </Sidebar>
            </nav>
            <SidebarInset>
              <header class="flex h-10 items-center gap-2 px-3 border-b border-border">
                <SidebarTrigger /><span class="text-xs text-muted-foreground">Busca no header</span>
              </header>
            </SidebarInset>
          </SidebarProvider>
        </div>
      </template>

      <!-- Com badges -->
      <template #variant-preview-3>
        <div class="w-full min-h-[260px] flex rounded-lg overflow-hidden border border-border" style="contain: layout">
          <SidebarProvider>
            <nav aria-label="Navegação principal">
              <Sidebar variant="sidebar" collapsible="offcanvas">
                <SidebarHeader class="p-3 font-semibold text-sidebar-foreground text-sm">App</SidebarHeader>
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton :isActive="true" size="sm" aria-current="page">
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
                          <SidebarMenuButton size="sm">
                            <Settings aria-hidden="true" /><span>Configurações</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </Sidebar>
            </nav>
            <SidebarInset>
              <header class="flex h-10 items-center gap-2 px-3 border-b border-border">
                <SidebarTrigger /><span class="text-xs text-muted-foreground">Inbox</span>
              </header>
            </SidebarInset>
          </SidebarProvider>
        </div>
      </template>
    </DocsCompositions>

    <!-- ── Estados ────────────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{ state: tContent('states.cols.state'), trigger: tContent('states.cols.trigger'), behavior: tContent('states.cols.behavior') }"
      :items="stateItems"
    />

    <!-- ── Propriedades ───────────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: tContent('props.providerTitle'),       cols: propCols, items: providerPropItems       },
        { title: tContent('props.sidebarTitle'),        cols: propCols, items: sidebarPropItems        },
        { title: tContent('props.menuButtonTitle'),     cols: propCols, items: menuButtonPropItems     },
        { title: tContent('props.menuSubButtonTitle'),  cols: propCols, items: menuSubButtonPropItems  },
        { title: tContent('props.menuSkeletonTitle'),   cols: propCols, items: menuSkeletonPropItems   },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="tContent('props.extensibility')"
    />

    <!-- ── Tokens ─────────────────────────────────────────────────────── -->
    <DocsTokens
      :title="tContent('tokens.title')"
      :cols="{ token: tContent('tokens.table.token'), value: tContent('tokens.table.class'), description: tContent('tokens.table.part') }"
      :items="tokenRows"
      :customization-title="tContent('tokens.customizationTitle')"
      :customization-code="codeCustomizationTokens"
    />

    <!-- ── Acessibilidade ─────────────────────────────────────────────── -->
    <DocsAccessibility
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ───────────────────────────────────────────────── -->
    <DocsRelated :title="tContent('related.title')" :items="relatedItems" />

    <!-- ── Notas ──────────────────────────────────────────────────────── -->
    <DocsNotes :title="tContent('notes.title')" :items="noteItems" />

    <!-- ── Analytics ─────────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :cols="{ event: tContent('analytics.table.event'), trigger: tContent('analytics.table.trigger'), payload: tContent('analytics.table.payload') }"
      :items="analyticsItems"
    />

    <!-- ── Testes ─────────────────────────────────────────────────────── -->
    <DocsTestes
      :title="tContent('testes.title')"
      :functional="{
        title: tContent('testes.functional.title'),
        cols: { action: tNav('common.userAction'), result: tNav('common.expectedResult'), priority: tNav('common.priority') },
        items: functionalTestItems,
      }"
      :accessibility="{
        title: tContent('testes.accessibility.title'),
        cols: a11yCritCols,
        items: a11yTestItems,
      }"
      :visual="{
        title: tContent('testes.visual.title'),
        cols: { story: tNav('common.storyState'), priority: tNav('common.priority') },
        items: visualTestItems,
      }"
    />
  </DocsPageLayout>
</template>
