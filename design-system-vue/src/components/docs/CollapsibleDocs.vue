<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Filter, Settings } from 'lucide-vue-next';

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

import uiTranslations from '@/i18n/ui.json';
import componentTranslations from '@shared/content/collapsible/translations.json';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation({ ...uiTranslations, ...componentTranslations });

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
  componentSlug: 'collapsible',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'collapsible',
    locale: newLocale,
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
      { id: 'variantes',    label: tNav('nav.variants') },
      { id: 'composicoes',  label: tNav('nav.compositions') },
      { id: 'estados',      label: tNav('nav.states')   },
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
    component_name: 'collapsible',
    locale: locale.value,
  });
});
// ─── Demo state (Controlled demo) ─────────────────────────────────────────────

const demoControlledOpen = ref(false);

// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";`;

const codeImportWithButton = `import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-vue-next";`;

const codeUncontrolled = `<Collapsible class="w-80 space-y-2">
  <CollapsibleTrigger class="flex w-full items-center justify-between rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
    Exibir filtros avançados
    <ChevronDown aria-hidden="true" class="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-180" />
  </CollapsibleTrigger>
  <CollapsibleContent class="space-y-2">
    <div class="rounded-md border border-input bg-muted px-4 py-2 text-sm">Filtro avançado 1</div>
    <div class="rounded-md border border-input bg-muted px-4 py-2 text-sm">Filtro avançado 2</div>
  </CollapsibleContent>
</Collapsible>`;

const codeControlled = `<script setup>
const isOpen = ref(false);
<\/script>

<template>
  <Collapsible :open="isOpen" @update:open="(v) => isOpen = v" class="w-80 space-y-2">
    <CollapsibleTrigger class="...">
      {{ isOpen ? 'Ocultar filtros avançados' : 'Exibir filtros avançados' }}
      <ChevronDown aria-hidden="true" class="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-180" />
    </CollapsibleTrigger>
    <CollapsibleContent class="space-y-2">
      <div class="rounded-md border border-input bg-muted px-4 py-2 text-sm">Filtro avançado 1</div>
    </CollapsibleContent>
  </Collapsible>
</template>`;

const codeCustomizationTokens = `/* Em globals.css — personalizar aparência do painel */
:root {
  --collapsible-border: var(--border);
  --collapsible-bg: var(--muted);
  --collapsible-radius: var(--radius);
}`;

const interfaceCode = `// Collapsible (Root) — CollapsibleRootProps de reka-ui
interface CollapsibleProps {
  open?: boolean;           // Modo controlado
  defaultOpen?: boolean;    // Modo não-controlado
  disabled?: boolean;       // Desabilita o trigger
  onOpenChange?: (open: boolean) => void;
}

// CollapsibleTrigger — CollapsibleTriggerProps de reka-ui
interface CollapsibleTriggerProps {
  asChild?: boolean;
}

// CollapsibleContent — CollapsibleContentProps de reka-ui
interface CollapsibleContentProps {
  forceMount?: boolean;
}`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
]);

const variantItems = computed(() => [
  {
    name: 'uncontrolled',
    description: stripHtml(tContent('variants.items.uncontrolled')),
    code: codeUncontrolled,
  },
  {
    name: 'controlled',
    description: stripHtml(tContent('variants.items.controlled')),
    code: codeControlled,
  },
]);

const codeCustomButton = `<Collapsible class="w-full max-w-sm">
  <CollapsibleTrigger class="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
    Exibir opções avançadas
  </CollapsibleTrigger>
  <CollapsibleContent class="mt-2 rounded-md border bg-muted/50 p-4 space-y-2">
    <p class="text-sm">Opção avançada 1</p>
    <p class="text-sm">Opção avançada 2</p>
    <p class="text-sm">Opção avançada 3</p>
  </CollapsibleContent>
</Collapsible>`;

const codeIconTrigger = `<Collapsible class="w-full max-w-sm">
  <CollapsibleTrigger class="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
    <span class="flex items-center gap-2">
      <Filter class="h-4 w-4" aria-hidden="true" />
      Filtros avançados
    </span>
  </CollapsibleTrigger>
  <CollapsibleContent class="mt-2 rounded-md border bg-muted/50 p-4 space-y-2">
    <p class="text-sm">Filtro por categoria</p>
    <p class="text-sm">Filtro por data</p>
    <p class="text-sm">Filtro por status</p>
  </CollapsibleContent>
</Collapsible>`;

const codeRotatingChevron = `<Collapsible class="w-full max-w-sm">
  <CollapsibleTrigger class="flex w-full items-center justify-between rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent">
    Configurações avançadas
    <ChevronDown aria-hidden="true" class="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-180" />
  </CollapsibleTrigger>
  <CollapsibleContent class="mt-2 rounded-md border bg-muted/50 p-4 space-y-2">
    <div class="flex justify-between text-sm"><span>Notificações</span><span>Ativadas</span></div>
    <div class="flex justify-between text-sm"><span>Privacidade</span><span>Modo estrito</span></div>
  </CollapsibleContent>
</Collapsible>`;

const codeRichContent = `<Collapsible class="w-full max-w-sm">
  <CollapsibleTrigger class="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
    <span class="flex items-center gap-2">
      <Settings class="h-4 w-4" aria-hidden="true" />
      Configurações do sistema
    </span>
  </CollapsibleTrigger>
  <CollapsibleContent class="mt-2 rounded-md border bg-muted/50 p-4 space-y-3">
    <p class="text-xs text-muted-foreground">Ajuste as preferências do sistema.</p>
    <label class="flex items-center gap-2 text-sm"><input type="checkbox" /> Modo escuro</label>
    <label class="flex items-center gap-2 text-sm"><input type="checkbox" /> Notificações push</label>
    <label class="flex items-center gap-2 text-sm"><input type="checkbox" /> Analytics</label>
  </CollapsibleContent>
</Collapsible>`;

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.customButton.name'),
    description: tContent('variants.compositions.customButton.description'),
    useWhen: tContent('variants.compositions.customButton.use'),
    code: codeCustomButton,
  },
  {
    name: tContent('variants.compositions.iconTrigger.name'),
    description: tContent('variants.compositions.iconTrigger.description'),
    useWhen: tContent('variants.compositions.iconTrigger.use'),
    code: codeIconTrigger,
  },
  {
    name: tContent('variants.compositions.rotatingChevron.name'),
    description: tContent('variants.compositions.rotatingChevron.description'),
    useWhen: tContent('variants.compositions.rotatingChevron.use'),
    code: codeRotatingChevron,
  },
  {
    name: tContent('variants.compositions.richContent.name'),
    description: tContent('variants.compositions.richContent.description'),
    useWhen: tContent('variants.compositions.richContent.use'),
    code: codeRichContent,
  },
]);

const stateItems = computed(() => [
  {
    label: tContent('states.closed.label'),
    trigger: stripHtml(tContent('states.closed.trigger')),
    behavior: tContent('states.closed.behavior'),
  },
  {
    label: tContent('states.open.label'),
    trigger: stripHtml(tContent('states.open.trigger')),
    behavior: tContent('states.open.behavior'),
  },
  {
    label: tContent('states.defaultOpen.label'),
    trigger: stripHtml(tContent('states.defaultOpen.trigger')),
    behavior: tContent('states.defaultOpen.behavior'),
  },
  {
    label: tContent('states.disabled.label'),
    trigger: stripHtml(tContent('states.disabled.trigger')),
    behavior: tContent('states.disabled.behavior'),
  },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const collapsiblePropItems = computed(() => [
  { name: 'open',          type: 'boolean',                       defaultValue: '—',       required: 'Não', description: stripHtml(tContent('props.table.open'))         },
  { name: 'defaultOpen',   type: 'boolean',                       defaultValue: 'false',   required: 'Não', description: tContent('props.table.defaultOpen')             },
  { name: 'disabled',      type: 'boolean',                       defaultValue: 'false',   required: 'Não', description: tContent('props.table.disabled')                },
  { name: 'onOpenChange',  type: '(open: boolean) => void',       defaultValue: '—',       required: 'Não', description: tContent('props.table.onOpenChange')            },
]);

const triggerPropItems = computed(() => [
  { name: 'asChild', type: 'boolean', defaultValue: 'false', required: 'Não', description: stripHtml(tContent('props.table.asChild')) },
]);

const contentPropItems = computed(() => [
  { name: 'class', type: 'string', defaultValue: '—', required: 'Não', description: tContent('props.table.className') },
]);

const tokenRows = computed(() => [
  { token: '--border',     value: 'border-input',       description: tContent('tokens.table.border')      },
  { token: '--muted',      value: 'bg-muted',           description: tContent('tokens.table.background')  },
  { token: '--radius',     value: 'rounded-md',         description: tContent('tokens.table.radius')      },
  { token: '--accent',     value: 'hover:bg-accent',    description: tContent('tokens.table.triggerHover') },
  { token: '--ring',       value: 'ring-ring',          description: tContent('tokens.table.triggerFocus') },
  { token: 'transition',   value: 'transition-all',     description: tContent('tokens.table.transition')  },
]);

const accessibilityItems = computed(() => [
  tContent('accessibility.item1'),
  tContent('accessibility.item2'),
  tContent('accessibility.item3'),
  tContent('accessibility.item4'),
  tContent('accessibility.item5'),
]);

const keyboardItems = computed(() => [
  { key: 'Tab',   description: tContent('accessibility.keyboard.tab')     },
  { key: 'Enter', description: tContent('accessibility.keyboard.enter')   },
  { key: 'Space', description: tContent('accessibility.keyboard.space')   },
  { key: '—',     description: tContent('accessibility.keyboard.noArrow') },
]);

const relatedItems = computed(() => [
  { name: 'Accordion', description: tContent('related.accordion'), path: '?path=/docs/ui-accordion--docs' },
  { name: 'Sheet',     description: tContent('related.sheet'),     path: '?path=/docs/ui-sheet--docs'     },
  { name: 'Button',    description: tContent('related.button'),    path: '?path=/docs/ui-button--docs'    },
  { name: 'Tabs',      description: tContent('related.tabs'),      path: '?path=/docs/ui-tabs--docs'      },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.tip1') },
  { title: '', content: tContent('notes.tip2') },
  { title: '', content: tContent('notes.tip3') },
]);

const analyticsItems = computed(() => [
  { event: tContent('analytics.table.toggle'),       trigger: tContent('analytics.table.toggleTrigger'),       payload: tContent('analytics.table.togglePayload')       },
  { event: tContent('analytics.table.pageView'),     trigger: tContent('analytics.table.pageViewTrigger'),     payload: tContent('analytics.table.pageViewPayload')     },
  { event: tContent('analytics.table.sectionViewed'), trigger: tContent('analytics.table.sectionViewedTrigger'), payload: tContent('analytics.table.sectionViewedPayload') },
  { event: tContent('analytics.table.langSwitch'),   trigger: tContent('analytics.table.langSwitchTrigger'),   payload: tContent('analytics.table.langSwitchPayload')   },
]);

const a11yCritCols = computed(() => ({
  criterion: tNav('common.criterion'),
  level: 'WCAG',
  how: tNav('common.howToVerify'),
}));

const functionalTestItems = computed(() => [
  { action: tContent('testes.functional.item1.action'), result: tContent('testes.functional.item1.result'), priority: localPriority(tContent('testes.functional.item1.priority')) },
  { action: tContent('testes.functional.item2.action'), result: tContent('testes.functional.item2.result'), priority: localPriority(tContent('testes.functional.item2.priority')) },
  { action: tContent('testes.functional.item3.action'), result: tContent('testes.functional.item3.result'), priority: localPriority(tContent('testes.functional.item3.priority')) },
  { action: tContent('testes.functional.item4.action'), result: tContent('testes.functional.item4.result'), priority: localPriority(tContent('testes.functional.item4.priority')) },
  { action: tContent('testes.functional.item5.action'), result: tContent('testes.functional.item5.result'), priority: localPriority(tContent('testes.functional.item5.priority')) },
  { action: tContent('testes.functional.item6.action'), result: tContent('testes.functional.item6.result'), priority: localPriority(tContent('testes.functional.item6.priority')) },
]);

const a11yTestItems = computed(() => [
  { criterion: tContent('testes.accessibility.item1.criterion'), level: tContent('testes.accessibility.item1.level'), how: tContent('testes.accessibility.item1.how') },
  { criterion: tContent('testes.accessibility.item2.criterion'), level: tContent('testes.accessibility.item2.level'), how: tContent('testes.accessibility.item2.how') },
  { criterion: tContent('testes.accessibility.item3.criterion'), level: tContent('testes.accessibility.item3.level'), how: tContent('testes.accessibility.item3.how') },
  { criterion: tContent('testes.accessibility.item4.criterion'), level: tContent('testes.accessibility.item4.level'), how: tContent('testes.accessibility.item4.how') },
  { criterion: tContent('testes.accessibility.item5.criterion'), level: tContent('testes.accessibility.item5.level'), how: tContent('testes.accessibility.item5.how') },
]);

const visualTestItems = computed(() => [
  { story: tContent('testes.visual.item1.story'), priority: localPriority(tContent('testes.visual.item1.priority')) },
  { story: tContent('testes.visual.item2.story'), priority: localPriority(tContent('testes.visual.item2.priority')) },
  { story: tContent('testes.visual.item3.story'), priority: localPriority(tContent('testes.visual.item3.priority')) },
  { story: tContent('testes.visual.item4.story'), priority: localPriority(tContent('testes.visual.item4.priority')) },
  { story: tContent('testes.visual.item5.story'), priority: localPriority(tContent('testes.visual.item5.priority')) },
]);
</script>

<template>
  <DocsPageLayout :nav-groups="navGroups" :active-section="activeSection" component-slug="collapsible">
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
        install-note="npx shadcn-vue@latest add collapsible"
      />
    </template>

    <!-- ── Demonstração ───────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div class="w-full max-w-sm space-y-6">

        <!-- Demo 1: Default (não-controlado) -->
        <div class="space-y-1">
          <p class="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Default (não-controlado)</p>
          <Collapsible class="space-y-2">
            <CollapsibleTrigger class="flex w-full items-center justify-between rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors">
              {{ tContent('demonstration.labels.triggerClosed') }}
              <ChevronDown
                aria-hidden="true"
                class="h-4 w-4 shrink-0 transition-transform [[data-state=open]_&]:rotate-180"
              />
            </CollapsibleTrigger>
            <CollapsibleContent class="space-y-2">
              <div class="rounded-md border border-input bg-muted px-4 py-2 text-sm">
                {{ tContent('demonstration.labels.advancedFilter1') }}
              </div>
              <div class="rounded-md border border-input bg-muted px-4 py-2 text-sm">
                {{ tContent('demonstration.labels.advancedFilter2') }}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <!-- Demo 2: Controlado -->
        <div class="space-y-1">
          <p class="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Controlado (v-model:open)</p>
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted-foreground">
                Estado: <strong>{{ demoControlledOpen ? 'aberto' : 'fechado' }}</strong>
              </span>
              <button
                class="rounded-md border border-input bg-background px-3 py-1 text-xs font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                @click="demoControlledOpen = !demoControlledOpen"
              >
                {{ demoControlledOpen ? 'Fechar' : 'Abrir' }}
              </button>
            </div>
            <Collapsible :open="demoControlledOpen" @update:open="(v) => demoControlledOpen = v" class="space-y-2">
              <CollapsibleTrigger class="flex w-full items-center justify-between rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors">
                {{ demoControlledOpen ? tContent('demonstration.labels.triggerOpen') : tContent('demonstration.labels.triggerClosed') }}
                <ChevronDown
                  aria-hidden="true"
                  class="h-4 w-4 shrink-0 transition-transform [[data-state=open]_&]:rotate-180"
                />
              </CollapsibleTrigger>
              <CollapsibleContent class="space-y-2">
                <div class="rounded-md border border-input bg-muted px-4 py-2 text-sm">
                  {{ tContent('demonstration.labels.advancedFilter1') }}
                </div>
                <div class="rounded-md border border-input bg-muted px-4 py-2 text-sm">
                  {{ tContent('demonstration.labels.advancedFilter2') }}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        <!-- Demo 3: Desabilitado -->
        <div class="space-y-1">
          <p class="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Desabilitado</p>
          <Collapsible disabled class="space-y-2">
            <CollapsibleTrigger
              disabled
              class="flex w-full items-center justify-between rounded-md border border-input bg-background px-4 py-2 text-sm font-medium opacity-50 cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {{ tContent('demonstration.labels.headerLabel') }}
              <ChevronDown aria-hidden="true" class="h-4 w-4 shrink-0" />
            </CollapsibleTrigger>
          </Collapsible>
        </div>

      </div>
    </DocsDemonstration>

    <!-- ── Anatomia ───────────────────────────────────────────────── -->
    <DocsAnatomy
      :title="tContent('anatomy.title')"
      :items="anatomyItems"
      :structure-label="tContent('anatomy.structureLabel')"
      :structure-code="tContent('anatomy.structureCode')"
    />

    <!-- ── Quando Usar ────────────────────────────────────────────── -->
    <DocsWhenToUse
      :title="tContent('usage.title')"
      :guidelines="{
        title: tContent('usage.guidelines.title'),
        items: [
          tContent('usage.guidelines.item1'),
          tContent('usage.guidelines.item2'),
          tContent('usage.guidelines.item3'),
          tContent('usage.guidelines.item4'),
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
          { s: tContent('usage.scenarios.item6.s'), u: tContent('usage.scenarios.item6.u'), a: tContent('usage.scenarios.item6.a') },
        ],
      }"
      :do="{ title: tContent('usage.do.title'), items: [tContent('usage.do.item1'), tContent('usage.do.item2'), tContent('usage.do.item3'), tContent('usage.do.item4')] }"
      :dont="{ title: tContent('usage.dont.title'), items: [tContent('usage.dont.item1'), tContent('usage.dont.item2'), tContent('usage.dont.item3')] }"
    />

    <!-- ── Do & Don't ─────────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="[
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: tContent('doDont.pair1.do'), dontCaption: tContent('doDont.pair1.dont') },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: tContent('doDont.pair2.do'), dontCaption: tContent('doDont.pair2.dont') },
      ]"
    >
      <template #do-preview-0>
        <Collapsible class="w-full space-y-2">
          <CollapsibleTrigger class="flex w-full items-center justify-between rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors">
            Exibir filtros avançados
            <ChevronDown aria-hidden="true" class="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-180" />
          </CollapsibleTrigger>
        </Collapsible>
      </template>
      <template #dont-preview-0>
        <Collapsible class="w-full space-y-2">
          <CollapsibleTrigger class="flex w-full items-center justify-between rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors">
            Ver mais
            <ChevronDown aria-hidden="true" class="h-4 w-4" />
          </CollapsibleTrigger>
        </Collapsible>
      </template>
      <template #do-preview-1>
        <Collapsible class="w-full space-y-2">
          <CollapsibleTrigger class="flex w-full items-center justify-between rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors">
            Filtros avançados
            <ChevronDown aria-hidden="true" class="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-180" />
          </CollapsibleTrigger>
        </Collapsible>
      </template>
      <template #dont-preview-1>
        <div class="w-full space-y-2">
          <Collapsible class="space-y-1">
            <CollapsibleTrigger class="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors">
              Seção 1 <ChevronDown aria-hidden="true" class="h-3 w-3" />
            </CollapsibleTrigger>
          </Collapsible>
          <Collapsible class="space-y-1">
            <CollapsibleTrigger class="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors">
              Seção 2 <ChevronDown aria-hidden="true" class="h-3 w-3" />
            </CollapsibleTrigger>
          </Collapsible>
          <Collapsible class="space-y-1">
            <CollapsibleTrigger class="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors">
              Seção 3 <ChevronDown aria-hidden="true" class="h-3 w-3" />
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :description="tContent('import.basic')"
      :code="codeImportBasic"
      :secondary-description="tContent('import.withButton')"
      :secondary-code="codeImportWithButton"
    />

    <!-- ── Variantes (Modos) ──────────────────────────────────────── -->
    <DocsVariants
      :title="tContent('variants.title')"
      :items="variantItems"
      component-slug="collapsible"
    >
      <template #variant-preview-0>
        <!-- Não-controlado -->
        <Collapsible class="w-full space-y-2">
          <CollapsibleTrigger class="flex w-full items-center justify-between rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors">
            {{ tContent('demonstration.labels.triggerClosed') }}
            <ChevronDown aria-hidden="true" class="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent class="space-y-2">
            <div class="rounded-md border border-input bg-muted px-4 py-2 text-sm">
              {{ tContent('demonstration.labels.advancedFilter1') }}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </template>
      <template #variant-preview-1>
        <!-- Controlado -->
        <Collapsible :open="true" class="w-full space-y-2">
          <CollapsibleTrigger class="flex w-full items-center justify-between rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors">
            {{ tContent('demonstration.labels.triggerOpen') }}
            <ChevronDown aria-hidden="true" class="h-4 w-4 rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent class="space-y-2">
            <div class="rounded-md border border-input bg-muted px-4 py-2 text-sm">
              {{ tContent('demonstration.labels.advancedFilter1') }}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </template>
    </DocsVariants>

    <!-- ── Composições ────────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="collapsible"
      :items="compositionItems"
    >
      <template #variant-preview-0>
        <Collapsible class="w-full max-w-sm">
          <CollapsibleTrigger class="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors">
            Exibir opções avançadas
          </CollapsibleTrigger>
          <CollapsibleContent class="mt-2 rounded-md border bg-muted/50 p-4 space-y-2">
            <p class="text-sm">Opção avançada 1</p>
            <p class="text-sm">Opção avançada 2</p>
            <p class="text-sm">Opção avançada 3</p>
          </CollapsibleContent>
        </Collapsible>
      </template>
      <template #variant-preview-1>
        <Collapsible class="w-full max-w-sm">
          <CollapsibleTrigger class="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors">
            <span class="flex items-center gap-2">
              <Filter class="h-4 w-4" aria-hidden="true" />
              Filtros avançados
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent class="mt-2 rounded-md border bg-muted/50 p-4 space-y-2">
            <p class="text-sm">Filtro por categoria</p>
            <p class="text-sm">Filtro por data</p>
            <p class="text-sm">Filtro por status</p>
          </CollapsibleContent>
        </Collapsible>
      </template>
      <template #variant-preview-2>
        <Collapsible class="w-full max-w-sm">
          <CollapsibleTrigger class="flex w-full items-center justify-between rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors">
            Configurações avançadas
            <ChevronDown aria-hidden="true" class="h-4 w-4 shrink-0 transition-transform [[data-state=open]_&]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent class="mt-2 rounded-md border bg-muted/50 p-4 space-y-2">
            <div class="flex justify-between text-sm"><span>Notificações</span><span>Ativadas</span></div>
            <div class="flex justify-between text-sm"><span>Privacidade</span><span>Modo estrito</span></div>
          </CollapsibleContent>
        </Collapsible>
      </template>
      <template #variant-preview-3>
        <Collapsible class="w-full max-w-sm">
          <CollapsibleTrigger class="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors">
            <span class="flex items-center gap-2">
              <Settings class="h-4 w-4" aria-hidden="true" />
              Configurações do sistema
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent class="mt-2 rounded-md border bg-muted/50 p-4 space-y-3">
            <p class="text-xs text-muted-foreground">Ajuste as preferências do sistema.</p>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" /> Modo escuro</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" /> Notificações push</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" /> Analytics</label>
          </CollapsibleContent>
        </Collapsible>
      </template>
    </DocsCompositions>

    <!-- ── Estados ────────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{
        state: tContent('states.cols.state'),
        trigger: tContent('states.cols.trigger'),
        behavior: tContent('states.cols.behavior'),
      }"
      :items="stateItems"
    />

    <!-- ── Propriedades ───────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: tContent('props.collapsibleTitle'), cols: propCols, items: collapsiblePropItems },
        { title: tContent('props.triggerTitle'),     cols: propCols, items: triggerPropItems     },
        { title: tContent('props.contentTitle'),     cols: propCols, items: contentPropItems     },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="tContent('props.extensibility')"
    />

    <!-- ── Tokens ─────────────────────────────────────────────────── -->
    <DocsTokens
      :title="tContent('tokens.title')"
      :cols="{
        token: tContent('tokens.table.token'),
        value: tContent('tokens.table.class'),
        description: tContent('tokens.table.part'),
      }"
      :items="tokenRows"
      :customization-title="tContent('tokens.customizationTitle')"
      :customization-code="codeCustomizationTokens"
    />

    <!-- ── Acessibilidade ─────────────────────────────────────────── -->
    <DocsAccessibility
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-title="tContent('accessibility.keyboardTitle')"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ───────────────────────────────────────────── -->
    <DocsRelated :title="tContent('related.title')" :items="relatedItems" />

    <!-- ── Notas ──────────────────────────────────────────────────── -->
    <DocsNotes :title="tContent('notes.title')" :items="noteItems" />

    <!-- ── Analytics ─────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :cols="{
        event: tContent('analytics.table.event'),
        trigger: tContent('analytics.table.trigger'),
        payload: tContent('analytics.table.payload'),
      }"
      :items="analyticsItems"
    />

    <!-- ── Testes ─────────────────────────────────────────────────── -->
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
