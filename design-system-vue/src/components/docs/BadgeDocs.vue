<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { Badge } from '@/components/ui/badge';
import { Check, Bell } from 'lucide-vue-next';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import badgeTranslations from '@shared/content/badge/translations.json';

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
const { t: tContent, locale } = useTranslation(badgeTranslations);

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
  componentSlug: 'badge',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'badge',
    locale: newLocale,
    page_title: `${tContent('title')} · Design System`,
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
    component_name: 'badge',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import { Badge } from "@/components/ui/badge";`;
const codeImportWithIcon = `import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-vue-next";`;

const codeDefault = `<Badge>Novo</Badge>`;
const codeSecondary = `<Badge variant="secondary">Beta</Badge>`;
const codeDestructive = `<Badge variant="destructive">Urgente</Badge>`;
const codeOutline = `<Badge variant="outline">Rascunho</Badge>`;

const codeCustomizationTokens = `/* Em globals.css — personalizar tokens semânticos */
:root {
  --primary: 221 83% 53%;
  --primary-foreground: 0 0% 100%;
  --secondary: 210 40% 96%;
  --destructive: 0 84% 60%;
}

.dark {
  --primary: 217 91% 60%;
  --secondary: 217 33% 18%;
}`;

const interfaceCode = `// Badge
interface BadgeProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  class?: string;
}

// Badge aceita todos os HTMLAttributes<HTMLDivElement>`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
  tContent('anatomy.item4'),
]);

const variantItems = computed(() => [
  { name: 'default',     description: stripHtml(tContent('variants.items.default')),     code: codeDefault     },
  { name: 'secondary',   description: stripHtml(tContent('variants.items.secondary')),   code: codeSecondary   },
  { name: 'destructive', description: stripHtml(tContent('variants.items.destructive')), code: codeDestructive },
  { name: 'outline',     description: stripHtml(tContent('variants.items.outline')),     code: codeOutline     },
]);

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.withIcon.name'),
    description: tContent('variants.compositions.withIcon.description'),
    useWhen: tContent('variants.compositions.withIcon.use'),
    code: `<Badge>\n  <Check class="h-3 w-3" aria-hidden="true" />\n  Ativo\n</Badge>`,
  },
  {
    name: tContent('variants.compositions.count.name'),
    description: tContent('variants.compositions.count.description'),
    useWhen: tContent('variants.compositions.count.use'),
    code: `<span role="status" aria-label="12 notificações não lidas" class="inline-flex items-center gap-2">\n  <Bell class="h-5 w-5" aria-hidden="true" />\n  <Badge variant="destructive">12</Badge>\n</span>`,
  },
  {
    name: tContent('variants.compositions.asLink.name'),
    description: tContent('variants.compositions.asLink.description'),
    useWhen: tContent('variants.compositions.asLink.use'),
    code: `<a href="#design" aria-label="Ver todos os itens da categoria Design" class="inline-flex">\n  <Badge variant="secondary">Design</Badge>\n</a>`,
  },
  {
    name: tContent('variants.compositions.asTrigger.name'),
    description: tContent('variants.compositions.asTrigger.description'),
    useWhen: tContent('variants.compositions.asTrigger.use'),
    code: `<button type="button" aria-label="Filtrar por React" class="inline-flex bg-transparent p-0 border-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus:outline-none rounded-md">\n  <Badge variant="outline">React</Badge>\n</button>`,
  },
]);

const stateItems = computed(() => [
  { label: tContent('states.withIcon.label'),    trigger: stripHtml(tContent('states.withIcon.trigger')),    behavior: stripHtml(tContent('states.withIcon.behavior'))    },
  { label: tContent('states.countBadge.label'),  trigger: stripHtml(tContent('states.countBadge.trigger')),  behavior: stripHtml(tContent('states.countBadge.behavior'))  },
  { label: tContent('states.asLink.label'),      trigger: stripHtml(tContent('states.asLink.trigger')),      behavior: stripHtml(tContent('states.asLink.behavior'))      },
  { label: tContent('states.asTrigger.label'),   trigger: stripHtml(tContent('states.asTrigger.trigger')),   behavior: stripHtml(tContent('states.asTrigger.behavior'))   },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'), type: tContent('props.table.type'),
  default: tContent('props.table.default'), required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const badgePropItems = computed(() => [
  { name: 'variant',      type: '"default" | "secondary" | "destructive" | "outline"', defaultValue: '"default"', required: 'Não', description: stripHtml(tContent('props.table.variant'))  },
  { name: 'class',        type: 'string',                                              defaultValue: '—',         required: 'Não', description: stripHtml(tContent('props.table.className')) },
  { name: 'default slot', type: 'VNode',                                               defaultValue: '—',         required: 'Sim', description: stripHtml(tContent('props.table.children')) },
]);

const tokenRows = computed(() => [
  { token: '--primary',               value: 'bg-primary',                description: tContent('tokens.table.primary')             },
  { token: '--primary-foreground',    value: 'text-primary-foreground',   description: tContent('tokens.table.primaryForeground')   },
  { token: '--secondary',             value: 'bg-secondary',              description: tContent('tokens.table.secondary')           },
  { token: '--secondary-foreground',  value: 'text-secondary-foreground', description: tContent('tokens.table.secondaryForeground') },
  { token: '--destructive',           value: 'bg-destructive',            description: tContent('tokens.table.destructive')         },
  { token: '--destructive-foreground',value: 'text-destructive-foreground', description: tContent('tokens.table.destructiveForeground') },
  { token: '--foreground',            value: 'text-foreground',           description: tContent('tokens.table.foreground')          },
  { token: '--ring',                  value: 'focus:ring-ring',           description: tContent('tokens.table.ring')                },
  { token: '--background',            value: 'focus:ring-offset-background', description: tContent('tokens.table.background')      },
]);

const accessibilityItems = computed(() => [
  tContent('accessibility.item1'),
  tContent('accessibility.item2'),
  tContent('accessibility.item3'),
  tContent('accessibility.item4'),
  tContent('accessibility.item5'),
]);

const keyboardItems = computed(() => [
  { key: '—',     description: stripHtml(tContent('keyboard.noFocus'))          },
  { key: 'Tab',   description: stripHtml(tContent('keyboard.wrappedInButton'))  },
  { key: 'Enter', description: stripHtml(tContent('keyboard.wrappedInLink'))    },
]);

const relatedItems = computed(() => [
  { name: 'Alert',   description: tContent('related.alert'),  path: '?path=/docs/ui-alert--docs'   },
  { name: 'Button',  description: tContent('related.button'), path: '?path=/docs/ui-button--docs'  },
  { name: 'Chip',    description: tContent('related.chip'),   path: '?path=/docs/ui-chip--docs'    },
  { name: 'Tag',     description: tContent('related.tag'),    path: '?path=/docs/ui-tag--docs'     },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.tip1') },
  { title: '', content: tContent('notes.tip2') },
  { title: '', content: tContent('notes.tip3') },
]);

const analyticsItems = computed(() => [
  { event: tContent('analytics.table.click'),         trigger: tContent('analytics.table.clickTrigger'),         payload: tContent('analytics.table.clickPayload')         },
  { event: tContent('analytics.table.pageView'),      trigger: tContent('analytics.table.pageViewTrigger'),      payload: tContent('analytics.table.pageViewPayload')      },
  { event: tContent('analytics.table.sectionViewed'), trigger: tContent('analytics.table.sectionViewedTrigger'), payload: tContent('analytics.table.sectionViewedPayload') },
  { event: tContent('analytics.table.langSwitch'),    trigger: tContent('analytics.table.langSwitchTrigger'),    payload: tContent('analytics.table.langSwitchPayload')    },
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
]);

const visualTestItems = computed(() => [
  { story: tContent('testes.visual.item1.story'), priority: localPriority(tContent('testes.visual.item1.priority')) },
  { story: tContent('testes.visual.item2.story'), priority: localPriority(tContent('testes.visual.item2.priority')) },
  { story: tContent('testes.visual.item3.story'), priority: localPriority(tContent('testes.visual.item3.priority')) },
  { story: tContent('testes.visual.item4.story'), priority: localPriority(tContent('testes.visual.item4.priority')) },
]);
</script>

<template>
  <DocsPageLayout :nav-groups="navGroups" :active-section="activeSection">
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
        install-note="npx shadcn-vue@latest add badge"
      />
    </template>

    <!-- ── Demonstração ───────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div class="flex flex-wrap items-center gap-3">
        <Badge>{{ tContent('demonstration.labels.defaultLabel') }}</Badge>
        <Badge variant="secondary">{{ tContent('demonstration.labels.secondaryLabel') }}</Badge>
        <Badge variant="destructive">{{ tContent('demonstration.labels.destructiveLabel') }}</Badge>
        <Badge variant="outline">{{ tContent('demonstration.labels.outlineLabel') }}</Badge>
        <Badge variant="destructive">{{ tContent('demonstration.labels.countLabel') }}</Badge>
        <Badge>
          <Check class="h-3 w-3" aria-hidden="true" />
          {{ tContent('demonstration.labels.statusLabel') }}
        </Badge>
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
        ],
      }"
      :ux-writing="{
        title: tContent('usage.uxWriting.title'),
        cols: {
          element: tContent('usage.uxWriting.table.element'),
          rules: tContent('usage.uxWriting.table.rules'),
          do: tContent('usage.uxWriting.table.correct'),
          dont: tContent('usage.uxWriting.table.avoid'),
        },
        items: [
          { element: tContent('usage.uxWriting.table.label.name'),    rules: tContent('usage.uxWriting.table.label.format'),    do: tContent('usage.uxWriting.table.label.good'),    dont: tContent('usage.uxWriting.table.label.bad')    },
          { element: tContent('usage.uxWriting.table.status.name'),   rules: tContent('usage.uxWriting.table.status.format'),   do: tContent('usage.uxWriting.table.status.good'),   dont: tContent('usage.uxWriting.table.status.bad')   },
          { element: tContent('usage.uxWriting.table.count.name'),    rules: tContent('usage.uxWriting.table.count.format'),    do: tContent('usage.uxWriting.table.count.good'),    dont: tContent('usage.uxWriting.table.count.bad')    },
          { element: tContent('usage.uxWriting.table.category.name'), rules: tContent('usage.uxWriting.table.category.format'), do: tContent('usage.uxWriting.table.category.good'), dont: tContent('usage.uxWriting.table.category.bad') },
        ],
      }"
      :do="{
        title: tContent('usage.do.title'),
        items: [
          tContent('usage.do.item1'),
          tContent('usage.do.item2'),
          tContent('usage.do.item3'),
          tContent('usage.do.item4'),
        ],
      }"
      :dont="{
        title: tContent('usage.dont.title'),
        items: [
          tContent('usage.dont.item1'),
          tContent('usage.dont.item2'),
          tContent('usage.dont.item3'),
        ],
      }"
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
        <Badge>Novo</Badge>
      </template>
      <template #dont-preview-0>
        <Badge>Este item foi adicionado recentemente ao catálogo</Badge>
      </template>
      <template #do-preview-1>
        <Badge variant="destructive">Expirado</Badge>
      </template>
      <template #dont-preview-1>
        <Badge variant="destructive">Novidade</Badge>
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :description="tContent('import.basic')"
      :code="codeImportBasic"
      :secondary-description="tContent('import.withIcon')"
      :secondary-code="codeImportWithIcon"
    />

    <!-- ── Variantes ──────────────────────────────────────────────── -->
    <DocsVariants :title="tContent('variants.title')" :items="variantItems">
      <template #variant-preview-0>
        <Badge>{{ tContent('demonstration.labels.defaultLabel') }}</Badge>
      </template>
      <template #variant-preview-1>
        <Badge variant="secondary">{{ tContent('demonstration.labels.secondaryLabel') }}</Badge>
      </template>
      <template #variant-preview-2>
        <Badge variant="destructive">{{ tContent('demonstration.labels.destructiveLabel') }}</Badge>
      </template>
      <template #variant-preview-3>
        <Badge variant="outline">{{ tContent('demonstration.labels.outlineLabel') }}</Badge>
      </template>
    </DocsVariants>

    <!-- ── Composições ─────────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="badge"
      :items="compositionItems"
    >
      <template #variant-preview-0>
        <Badge>
          <Check class="h-3 w-3" aria-hidden="true" />
          Ativo
        </Badge>
      </template>
      <template #variant-preview-1>
        <span role="status" aria-label="12 notificações não lidas" class="inline-flex items-center gap-2">
          <Bell class="h-5 w-5" aria-hidden="true" />
          <Badge variant="destructive">12</Badge>
        </span>
      </template>
      <template #variant-preview-2>
        <a href="#design" aria-label="Ver todos os itens da categoria Design" class="inline-flex">
          <Badge variant="secondary">Design</Badge>
        </a>
      </template>
      <template #variant-preview-3>
        <button type="button" aria-label="Filtrar por React" class="inline-flex bg-transparent p-0 border-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus:outline-none rounded-md">
          <Badge variant="outline">React</Badge>
        </button>
      </template>
    </DocsCompositions>

    <!-- ── Configurações (States) ──────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{ state: tContent('states.cols.state'), trigger: tContent('states.cols.trigger'), behavior: tContent('states.cols.behavior') }"
      :items="stateItems"
    />

    <!-- ── Propriedades ───────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: tContent('props.badgeTitle'), cols: propCols, items: badgePropItems },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="tContent('props.extensibility')"
    />

    <!-- ── Tokens ─────────────────────────────────────────────────── -->
    <DocsTokens
      :title="tContent('tokens.title')"
      :cols="{ token: tContent('tokens.table.token'), value: tContent('tokens.table.class'), description: tContent('tokens.table.part') }"
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
      :cols="{ event: tContent('analytics.table.event'), trigger: tContent('analytics.table.trigger'), payload: tContent('analytics.table.payload') }"
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
