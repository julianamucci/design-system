<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { User, Settings, Shield } from 'lucide-vue-next';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import tabsTranslations from '@shared/content/tabs/translations.json';

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
const { t: tContent, locale } = useTranslation(tabsTranslations);

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
  componentSlug: 'tabs',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
  aiIntent: tContent('seo.aiIntent') as 'informational' | 'navigational',
  breadcrumb: [
    { name: 'Components', item: '/components' },
    { name: tContent('category'), item: '/components/navigation' },
    { name: tContent('title') },
  ],
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'tabs',
    locale: newLocale as 'pt-BR' | 'en' | 'es',
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
    component_name: 'tabs',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImport = `import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";`;

const codeDefault = `<Tabs default-value="overview" class="w-full max-w-md">
  <TabsList aria-label="Seções do componente">
    <TabsTrigger value="overview">Visão geral</TabsTrigger>
    <TabsTrigger value="properties">Propriedades</TabsTrigger>
    <TabsTrigger value="examples">Exemplos</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">Conteúdo da visão geral</TabsContent>
  <TabsContent value="properties">Lista de propriedades</TabsContent>
  <TabsContent value="examples">Exemplos de uso</TabsContent>
</Tabs>`;

const codeLine = `<Tabs default-value="overview" class="w-full max-w-md">
  <TabsList variant="line" aria-label="Seções do componente">
    <TabsTrigger value="overview">Visão geral</TabsTrigger>
    <TabsTrigger value="properties">Propriedades</TabsTrigger>
    <TabsTrigger value="examples">Exemplos</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">Conteúdo da visão geral</TabsContent>
  <TabsContent value="properties">Lista de propriedades</TabsContent>
  <TabsContent value="examples">Exemplos de uso</TabsContent>
</Tabs>`;

const codeVertical = `<Tabs default-value="profile" orientation="vertical" class="w-full max-w-xl">
  <TabsList aria-label="Configurações da conta">
    <TabsTrigger value="profile">Perfil</TabsTrigger>
    <TabsTrigger value="account">Conta</TabsTrigger>
    <TabsTrigger value="security">Segurança</TabsTrigger>
  </TabsList>
  <TabsContent value="profile">Configurações do perfil</TabsContent>
  <TabsContent value="account">Configurações da conta</TabsContent>
  <TabsContent value="security">Configurações de segurança</TabsContent>
</Tabs>`;

const codeCustomization = `/* Altura customizada do TabsList */
[data-slot="tabs-list"] {
  height: 2.5rem;
}

/* Cor customizada da linha (variant line) */
.tabs-brand [data-slot="tabs-list"][data-variant="line"]
  [data-slot="tabs-trigger"]:after {
  background: hsl(220 90% 50%);
}`;

const interfaceCode = `// Tabs (root)
interface TabsProps {
  value?: string;
  defaultValue?: string;
  orientation?: 'horizontal' | 'vertical';
  activationMode?: 'automatic' | 'manual';
  class?: string;
}

// TabsList
interface TabsListProps {
  variant?: 'default' | 'line';
  class?: string;
}

// TabsTrigger / TabsContent
interface TabsTriggerProps { value: string; disabled?: boolean; class?: string; }
interface TabsContentProps { value: string; class?: string; }`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
  tContent('anatomy.item4'),
]);

const variantItems = computed(() => [
  { name: tContent('variants.items.default'),  description: stripHtml(tContent('variants.styles.default')),  code: codeDefault  },
  { name: tContent('variants.items.line'),     description: stripHtml(tContent('variants.styles.line')),     code: codeLine     },
  { name: tContent('variants.items.vertical'), description: stripHtml(tContent('variants.styles.vertical')), code: codeVertical },
]);

const codeIconTrigger = `<Tabs default-value="profile" class="w-full max-w-xl">
  <TabsList aria-label="Configurações">
    <TabsTrigger value="profile"><User aria-hidden="true" class="h-4 w-4" /> Perfil</TabsTrigger>
    <TabsTrigger value="account"><Settings aria-hidden="true" class="h-4 w-4" /> Conta</TabsTrigger>
    <TabsTrigger value="security"><Shield aria-hidden="true" class="h-4 w-4" /> Segurança</TabsTrigger>
  </TabsList>
  <TabsContent value="profile">Perfil</TabsContent>
  <TabsContent value="account">Conta</TabsContent>
  <TabsContent value="security">Segurança</TabsContent>
</Tabs>`;

const codeBadgeTrigger = `<Tabs default-value="inbox" class="w-full max-w-xl">
  <TabsList aria-label="Caixas de mensagem">
    <TabsTrigger value="inbox">Caixa de entrada <Badge>12</Badge></TabsTrigger>
    <TabsTrigger value="spam">Spam <Badge variant="destructive">3</Badge></TabsTrigger>
    <TabsTrigger value="trash">Lixeira</TabsTrigger>
  </TabsList>
  <TabsContent value="inbox">Caixa de entrada</TabsContent>
  <TabsContent value="spam">Spam</TabsContent>
  <TabsContent value="trash">Lixeira</TabsContent>
</Tabs>`;

const codeVerticalComp = `<Tabs default-value="profile" orientation="vertical" class="w-full max-w-2xl flex gap-4">
  <TabsList class="flex flex-col h-auto items-stretch shrink-0 min-w-[10rem]" aria-label="Configurações">
    <TabsTrigger value="profile">Perfil</TabsTrigger>
    <TabsTrigger value="account">Conta</TabsTrigger>
    <TabsTrigger value="security">Segurança</TabsTrigger>
  </TabsList>
  <TabsContent value="profile">Perfil</TabsContent>
  <TabsContent value="account">Conta</TabsContent>
  <TabsContent value="security">Segurança</TabsContent>
</Tabs>`;

const codeLineSubNav = `<Tabs default-value="all" class="w-full">
  <TabsList variant="line" class="border-b rounded-none bg-transparent w-full justify-start" aria-label="Filtros de listagem">
    <TabsTrigger value="all">Tudo</TabsTrigger>
    <TabsTrigger value="active">Ativos</TabsTrigger>
    <TabsTrigger value="archived">Arquivados</TabsTrigger>
  </TabsList>
  <TabsContent value="all">Tudo</TabsContent>
  <TabsContent value="active">Ativos</TabsContent>
  <TabsContent value="archived">Arquivados</TabsContent>
</Tabs>`;

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.iconTrigger.name'),
    description: tContent('variants.compositions.iconTrigger.description'),
    useWhen: tContent('variants.compositions.iconTrigger.use'),
    code: codeIconTrigger,
  },
  {
    name: tContent('variants.compositions.badgeTrigger.name'),
    description: tContent('variants.compositions.badgeTrigger.description'),
    useWhen: tContent('variants.compositions.badgeTrigger.use'),
    code: codeBadgeTrigger,
  },
  {
    name: tContent('variants.compositions.vertical.name'),
    description: tContent('variants.compositions.vertical.description'),
    useWhen: tContent('variants.compositions.vertical.use'),
    code: codeVerticalComp,
  },
  {
    name: tContent('variants.compositions.lineSubNav.name'),
    description: tContent('variants.compositions.lineSubNav.description'),
    useWhen: tContent('variants.compositions.lineSubNav.use'),
    code: codeLineSubNav,
  },
]);

const stateCols = computed(() => ({
  state: locale.value === 'en' ? 'State' : 'Estado',
  trigger: locale.value === 'en' ? 'Trigger' : locale.value === 'es' ? 'Disparador' : 'Disparo',
  behavior:
    locale.value === 'en'
      ? 'Behavior'
      : locale.value === 'es'
      ? 'Comportamiento'
      : 'Comportamento',
}));

const stateItems = computed(() => [
  { label: tContent('states.items.default'),  trigger: '—',                       behavior: stripHtml(tContent('states.descriptions.default'))  },
  { label: tContent('states.items.active'),   trigger: 'Click / Arrow / Home/End', behavior: stripHtml(tContent('states.descriptions.active'))   },
  { label: tContent('states.items.hover'),    trigger: 'Mouse',                   behavior: stripHtml(tContent('states.descriptions.hover'))    },
  { label: tContent('states.items.focus'),    trigger: 'Tab',                     behavior: stripHtml(tContent('states.descriptions.focus'))    },
  { label: tContent('states.items.disabled'), trigger: '—',                       behavior: stripHtml(tContent('states.descriptions.disabled')) },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const tabsPropItems = computed(() => [
  { name: 'value',          type: tContent('props.table.value.type'),          defaultValue: tContent('props.table.value.default'),          required: tContent('props.table.value.required'),          description: stripHtml(tContent('props.table.value.description'))          },
  { name: 'defaultValue',   type: tContent('props.table.defaultValue.type'),   defaultValue: tContent('props.table.defaultValue.default'),   required: tContent('props.table.defaultValue.required'),   description: stripHtml(tContent('props.table.defaultValue.description'))   },
  { name: 'onValueChange',  type: tContent('props.table.onValueChange.type'),  defaultValue: tContent('props.table.onValueChange.default'),  required: tContent('props.table.onValueChange.required'),  description: stripHtml(tContent('props.table.onValueChange.description'))  },
  { name: 'orientation',    type: tContent('props.table.orientation.type'),    defaultValue: tContent('props.table.orientation.default'),    required: tContent('props.table.orientation.required'),    description: stripHtml(tContent('props.table.orientation.description'))    },
  { name: 'activationMode', type: tContent('props.table.activationMode.type'), defaultValue: tContent('props.table.activationMode.default'), required: tContent('props.table.activationMode.required'), description: stripHtml(tContent('props.table.activationMode.description')) },
  { name: 'class',          type: tContent('props.table.className.type'),      defaultValue: tContent('props.table.className.default'),      required: tContent('props.table.className.required'),      description: stripHtml(tContent('props.table.className.description'))      },
]);

const listPropItems = computed(() => [
  { name: 'variant', type: tContent('props.table.variant.type'),   defaultValue: tContent('props.table.variant.default'),   required: tContent('props.table.variant.required'),   description: stripHtml(tContent('props.table.variant.description'))   },
  { name: 'class',   type: tContent('props.table.className.type'), defaultValue: tContent('props.table.className.default'), required: tContent('props.table.className.required'), description: stripHtml(tContent('props.table.className.description')) },
]);

const triggerPropItems = computed(() => [
  { name: 'value',    type: 'string',  defaultValue: '—', required: tNav('common.yes') as string, description: stripHtml(tContent('anatomy.item3')) },
  { name: 'disabled', type: 'boolean', defaultValue: 'false', required: tContent('props.table.value.required'), description: tContent('states.descriptions.disabled').replace(/<[^>]*>/g, '') },
]);

const contentPropItems = computed(() => [
  { name: 'value', type: 'string', defaultValue: '—', required: tNav('common.yes') as string, description: stripHtml(tContent('anatomy.item4')) },
]);

const tokenRows = computed(() => [
  { token: '--muted',            value: tContent('tokens.table.muted.class'),           description: tContent('tokens.table.muted.part')           },
  { token: '--muted-foreground', value: tContent('tokens.table.mutedForeground.class'), description: tContent('tokens.table.mutedForeground.part') },
  { token: '--background',       value: tContent('tokens.table.background.class'),      description: tContent('tokens.table.background.part')      },
  { token: '--foreground',       value: tContent('tokens.table.foreground.class'),      description: tContent('tokens.table.foreground.part')      },
  { token: '--ring',             value: tContent('tokens.table.ring.class'),            description: tContent('tokens.table.ring.part')            },
  { token: '--border',           value: tContent('tokens.table.border.class'),          description: tContent('tokens.table.border.part')          },
]);

const accessibilityItems = computed(() => [
  tContent('accessibility.items.item1'),
  tContent('accessibility.items.item2'),
  tContent('accessibility.items.item3'),
  tContent('accessibility.items.item4'),
  tContent('accessibility.items.item5'),
  tContent('accessibility.items.item6'),
]);

const keyboardItems = computed(() => [
  { key: 'Tab',         description: tContent('accessibility.keyboard.tab')        },
  { key: '→',           description: tContent('accessibility.keyboard.arrowRight') },
  { key: '←',           description: tContent('accessibility.keyboard.arrowLeft')  },
  { key: '↓',           description: tContent('accessibility.keyboard.arrowDown')  },
  { key: '↑',           description: tContent('accessibility.keyboard.arrowUp')    },
  { key: 'Home',        description: tContent('accessibility.keyboard.home')       },
  { key: 'End',         description: tContent('accessibility.keyboard.end')        },
  { key: 'Enter',       description: stripHtml(tContent('accessibility.keyboard.enter')) },
  { key: 'Space',       description: stripHtml(tContent('accessibility.keyboard.space')) },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.stepper.name'),     description: tContent('related.items.stepper.description'),     path: '?path=/docs/ui-stepper--docs'      },
  { name: tContent('related.items.accordion.name'),   description: tContent('related.items.accordion.description'),   path: '?path=/docs/ui-accordion--docs'    },
  { name: tContent('related.items.sidebar.name'),     description: tContent('related.items.sidebar.description'),     path: '?path=/docs/ui-sidebar--docs'      },
  { name: tContent('related.items.toggleGroup.name'), description: tContent('related.items.toggleGroup.description'), path: '?path=/docs/ui-togglegroup--docs'  },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
]);

const analyticsItems = computed(() => [
  { event: 'tab_change', trigger: tContent('analytics.table.tab_change.trigger'), payload: tContent('analytics.table.tab_change.payload') },
]);

const a11yCritCols = computed(() => ({
  criterion: tNav('common.criterion'),
  level: 'WCAG',
  how: tNav('common.howToVerify'),
}));

const functionalTestItems = computed(() => [1, 2, 3, 4].map(i => ({
  action:   tContent(`testes.functional.item${i}.action`),
  result:   tContent(`testes.functional.item${i}.result`),
  priority: localPriority(tContent(`testes.functional.item${i}.priority`)),
})));

const a11yTestItems = computed(() => [1, 2, 3, 4, 5].map(i => ({
  criterion: tContent(`testes.accessibility.item${i}`),
  level: 'AA',
  how: '',
})));

const visualTestItems = computed(() => [1, 2, 3, 4].map(i => ({
  story:    tContent(`testes.visual.item${i}.story`),
  priority: localPriority(tContent(`testes.visual.item${i}.priority`)),
})));

// ─── Demo tab tracking ────────────────────────────────────────────────────────

const demoLabels = computed(() => ({
  overview: tContent('demonstration.labels.overview'),
  properties: tContent('demonstration.labels.properties'),
  examples: tContent('demonstration.labels.examples'),
  overviewContent: tContent('demonstration.labels.overviewContent'),
  propertiesContent: tContent('demonstration.labels.propertiesContent'),
  examplesContent: tContent('demonstration.labels.examplesContent'),
}));

function handleTabChange(value: string) {
  const labels: Record<string, string> = {
    overview: demoLabels.value.overview,
    properties: demoLabels.value.properties,
    examples: demoLabels.value.examples,
  };
  const order = ['overview', 'properties', 'examples'];
  track('tab_change', {
    component: 'tabs',
    label: labels[value] ?? value,
    index: order.indexOf(value),
    total: order.length,
    location: 'docs_demonstration',
  });
}
</script>

<template>
  <DocsPageLayout :nav-groups="navGroups" :active-section="activeSection">
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
        install-note="npx shadcn-vue@latest add tabs"
      />
    </template>

    <!-- ── Demonstração ───────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <Tabs
        default-value="overview"
        class="w-full max-w-md"
        @update:model-value="handleTabChange(String($event))"
      >
        <TabsList :aria-label="tContent('demonstration.title')">
          <TabsTrigger value="overview">{{ demoLabels.overview }}</TabsTrigger>
          <TabsTrigger value="properties">{{ demoLabels.properties }}</TabsTrigger>
          <TabsTrigger value="examples">{{ demoLabels.examples }}</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" class="pt-3 text-muted-foreground">
          {{ demoLabels.overviewContent }}
        </TabsContent>
        <TabsContent value="properties" class="pt-3 text-muted-foreground">
          {{ demoLabels.propertiesContent }}
        </TabsContent>
        <TabsContent value="examples" class="pt-3 text-muted-foreground">
          {{ demoLabels.examplesContent }}
        </TabsContent>
      </Tabs>
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
          { element: tContent('usage.uxWriting.table.trigger.name'),   rules: tContent('usage.uxWriting.table.trigger.format'),   do: tContent('usage.uxWriting.table.trigger.good'),   dont: tContent('usage.uxWriting.table.trigger.bad')   },
          { element: tContent('usage.uxWriting.table.ariaLabel.name'), rules: tContent('usage.uxWriting.table.ariaLabel.format'), do: tContent('usage.uxWriting.table.ariaLabel.good'), dont: tContent('usage.uxWriting.table.ariaLabel.bad') },
          { element: tContent('usage.uxWriting.table.order.name'),     rules: tContent('usage.uxWriting.table.order.format'),     do: tContent('usage.uxWriting.table.order.good'),     dont: tContent('usage.uxWriting.table.order.bad')     },
        ],
      }"
      :do="{ title: tContent('usage.do.title'), items: [tContent('usage.do.item1'), tContent('usage.do.item2'), tContent('usage.do.item3'), tContent('usage.do.item4')] }"
      :dont="{ title: tContent('usage.dont.title'), items: [tContent('usage.dont.item1'), tContent('usage.dont.item2'), tContent('usage.dont.item3'), tContent('usage.dont.item4')] }"
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
        <Tabs default-value="overview" class="w-full max-w-xs text-sm">
          <TabsList aria-label="Seções do componente">
            <TabsTrigger value="overview">Visão geral</TabsTrigger>
            <TabsTrigger value="properties">Propriedades</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" class="pt-2 text-muted-foreground">Conteúdo claro</TabsContent>
          <TabsContent value="properties" class="pt-2 text-muted-foreground">Lista de props</TabsContent>
        </Tabs>
      </template>
      <template #dont-preview-0>
        <Tabs default-value="t1" class="w-full max-w-xs text-sm">
          <TabsList aria-label="Tabs">
            <TabsTrigger value="t1">Aba 1</TabsTrigger>
            <TabsTrigger value="t2">Aba 2</TabsTrigger>
          </TabsList>
          <TabsContent value="t1" class="pt-2 text-muted-foreground">Conteúdo genérico</TabsContent>
          <TabsContent value="t2" class="pt-2 text-muted-foreground">Sem contexto</TabsContent>
        </Tabs>
      </template>
      <template #do-preview-1>
        <Tabs default-value="profile" class="w-full max-w-xs text-sm">
          <TabsList aria-label="Configurações da conta">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="account">Conta</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" class="pt-2 text-muted-foreground">Perfil</TabsContent>
          <TabsContent value="account" class="pt-2 text-muted-foreground">Conta</TabsContent>
        </Tabs>
      </template>
      <template #dont-preview-1>
        <Tabs default-value="profile" class="w-full max-w-xs text-sm">
          <TabsList>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="account">Conta</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" class="pt-2 text-muted-foreground">Sem aria-label</TabsContent>
          <TabsContent value="account" class="pt-2 text-muted-foreground">Sem contexto SR</TabsContent>
        </Tabs>
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :code="codeImport"
    />

    <!-- ── Variantes ──────────────────────────────────────────────── -->
    <DocsVariants :title="tContent('variants.title')" :items="variantItems">
      <template #variant-preview-0>
        <Tabs default-value="overview" class="w-full max-w-sm text-sm">
          <TabsList aria-label="Seções do componente">
            <TabsTrigger value="overview">Visão geral</TabsTrigger>
            <TabsTrigger value="properties">Propriedades</TabsTrigger>
            <TabsTrigger value="examples">Exemplos</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" class="pt-3 text-muted-foreground">Conteúdo da visão geral</TabsContent>
          <TabsContent value="properties" class="pt-3 text-muted-foreground">Lista de propriedades</TabsContent>
          <TabsContent value="examples" class="pt-3 text-muted-foreground">Exemplos de uso</TabsContent>
        </Tabs>
      </template>
      <template #variant-preview-1>
        <Tabs default-value="overview" class="w-full max-w-sm text-sm">
          <TabsList variant="line" aria-label="Seções do componente">
            <TabsTrigger value="overview">Visão geral</TabsTrigger>
            <TabsTrigger value="properties">Propriedades</TabsTrigger>
            <TabsTrigger value="examples">Exemplos</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" class="pt-3 text-muted-foreground">Conteúdo da visão geral</TabsContent>
          <TabsContent value="properties" class="pt-3 text-muted-foreground">Lista de propriedades</TabsContent>
          <TabsContent value="examples" class="pt-3 text-muted-foreground">Exemplos de uso</TabsContent>
        </Tabs>
      </template>
      <template #variant-preview-2>
        <Tabs default-value="profile" orientation="vertical" class="w-full max-w-md text-sm">
          <TabsList aria-label="Configurações da conta">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="account">Conta</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" class="pl-3 text-muted-foreground">Configurações do perfil</TabsContent>
          <TabsContent value="account" class="pl-3 text-muted-foreground">Configurações da conta</TabsContent>
          <TabsContent value="security" class="pl-3 text-muted-foreground">Configurações de segurança</TabsContent>
        </Tabs>
      </template>
    </DocsVariants>

    <!-- ── Composições ────────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="tabs"
      :items="compositionItems"
    >
      <template #variant-preview-0>
        <Tabs default-value="profile" class="w-full max-w-xl">
          <TabsList aria-label="Configurações">
            <TabsTrigger value="profile" class="gap-2"><User aria-hidden="true" class="h-4 w-4" /> Perfil</TabsTrigger>
            <TabsTrigger value="account" class="gap-2"><Settings aria-hidden="true" class="h-4 w-4" /> Conta</TabsTrigger>
            <TabsTrigger value="security" class="gap-2"><Shield aria-hidden="true" class="h-4 w-4" /> Segurança</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <div class="p-4 rounded-md border bg-card space-y-2">
              <h3 class="text-sm font-semibold">Perfil</h3>
              <p class="text-sm text-muted-foreground">Configurações, painéis administrativos, navegação por categorias reconhecíveis (Perfil, Conta, Segurança).</p>
            </div>
          </TabsContent>
          <TabsContent value="account">
            <div class="p-4 rounded-md border bg-card space-y-2">
              <h3 class="text-sm font-semibold">Conta</h3>
              <p class="text-sm text-muted-foreground">Configurações, painéis administrativos, navegação por categorias reconhecíveis (Perfil, Conta, Segurança).</p>
            </div>
          </TabsContent>
          <TabsContent value="security">
            <div class="p-4 rounded-md border bg-card space-y-2">
              <h3 class="text-sm font-semibold">Segurança</h3>
              <p class="text-sm text-muted-foreground">Configurações, painéis administrativos, navegação por categorias reconhecíveis (Perfil, Conta, Segurança).</p>
            </div>
          </TabsContent>
        </Tabs>
      </template>

      <template #variant-preview-1>
        <Tabs default-value="inbox" class="w-full max-w-xl">
          <TabsList aria-label="Caixas de mensagem">
            <TabsTrigger value="inbox" class="gap-2">Caixa de entrada <Badge>12</Badge></TabsTrigger>
            <TabsTrigger value="spam" class="gap-2">Spam <Badge variant="destructive">3</Badge></TabsTrigger>
            <TabsTrigger value="trash">Lixeira</TabsTrigger>
          </TabsList>
          <TabsContent value="inbox">
            <div class="p-4 rounded-md border bg-card space-y-2">
              <h3 class="text-sm font-semibold">Caixa de entrada</h3>
              <p class="text-sm text-muted-foreground">Caixas de mensagem, listas com contadores, abas que apresentam recursos beta.</p>
            </div>
          </TabsContent>
          <TabsContent value="spam">
            <div class="p-4 rounded-md border bg-card space-y-2">
              <h3 class="text-sm font-semibold">Spam</h3>
              <p class="text-sm text-muted-foreground">Caixas de mensagem, listas com contadores, abas que apresentam recursos beta.</p>
            </div>
          </TabsContent>
          <TabsContent value="trash">
            <div class="p-4 rounded-md border bg-card space-y-2">
              <h3 class="text-sm font-semibold">Lixeira</h3>
              <p class="text-sm text-muted-foreground">Caixas de mensagem, listas com contadores, abas que apresentam recursos beta.</p>
            </div>
          </TabsContent>
        </Tabs>
      </template>

      <template #variant-preview-2>
        <Tabs default-value="profile" orientation="vertical" class="w-full max-w-2xl flex gap-4">
          <TabsList class="flex flex-col h-auto items-stretch shrink-0 min-w-[10rem]" aria-label="Configurações">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="account">Conta</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
          </TabsList>
          <div class="flex-1">
            <TabsContent value="profile">
              <div class="p-4 rounded-md border bg-card space-y-2">
                <h3 class="text-sm font-semibold">Perfil</h3>
                <p class="text-sm text-muted-foreground">Configurações longas com muitas categorias (5+), painéis administrativos. Em telas estreitas, prefira o layout horizontal.</p>
              </div>
            </TabsContent>
            <TabsContent value="account">
              <div class="p-4 rounded-md border bg-card space-y-2">
                <h3 class="text-sm font-semibold">Conta</h3>
                <p class="text-sm text-muted-foreground">Configurações longas com muitas categorias (5+), painéis administrativos. Em telas estreitas, prefira o layout horizontal.</p>
              </div>
            </TabsContent>
            <TabsContent value="security">
              <div class="p-4 rounded-md border bg-card space-y-2">
                <h3 class="text-sm font-semibold">Segurança</h3>
                <p class="text-sm text-muted-foreground">Configurações longas com muitas categorias (5+), painéis administrativos. Em telas estreitas, prefira o layout horizontal.</p>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </template>

      <template #variant-preview-3>
        <Tabs default-value="all" class="w-full">
          <TabsList variant="line" class="border-b rounded-none bg-transparent w-full justify-start" aria-label="Filtros de listagem">
            <TabsTrigger value="all">Tudo</TabsTrigger>
            <TabsTrigger value="active">Ativos</TabsTrigger>
            <TabsTrigger value="archived">Arquivados</TabsTrigger>
          </TabsList>
          <TabsContent value="all" class="pt-3">
            <div class="text-sm text-muted-foreground p-3 rounded-md border bg-card">Filtros de listagem (Tudo / Ativos / Arquivados), sub-seções dentro de uma página onde o estilo default competiria com outros containers.</div>
          </TabsContent>
          <TabsContent value="active" class="pt-3">
            <div class="text-sm text-muted-foreground p-3 rounded-md border bg-card">Filtros de listagem (Tudo / Ativos / Arquivados), sub-seções dentro de uma página onde o estilo default competiria com outros containers.</div>
          </TabsContent>
          <TabsContent value="archived" class="pt-3">
            <div class="text-sm text-muted-foreground p-3 rounded-md border bg-card">Filtros de listagem (Tudo / Ativos / Arquivados), sub-seções dentro de uma página onde o estilo default competiria com outros containers.</div>
          </TabsContent>
        </Tabs>
      </template>
    </DocsCompositions>

    <!-- ── Estados ───────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="stateCols"
      :items="stateItems"
    />

    <!-- ── Propriedades ───────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: 'Tabs',         cols: propCols, items: tabsPropItems    },
        { title: 'TabsList',     cols: propCols, items: listPropItems    },
        { title: 'TabsTrigger',  cols: propCols, items: triggerPropItems },
        { title: 'TabsContent',  cols: propCols, items: contentPropItems },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="tContent('props.extensibilityCode')"
    />

    <!-- ── Tokens ─────────────────────────────────────────────────── -->
    <DocsTokens
      :title="tContent('tokens.title')"
      :cols="{ token: tContent('tokens.table.token'), value: tContent('tokens.table.class'), description: tContent('tokens.table.part') }"
      :items="tokenRows"
      :customization-title="tContent('tokens.customizationTitle')"
      :customization-code="codeCustomization"
    />

    <!-- ── Acessibilidade ─────────────────────────────────────────── -->
    <DocsAccessibility
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-title="tContent('accessibility.keyboard.title')"
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
