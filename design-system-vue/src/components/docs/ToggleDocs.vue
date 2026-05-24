<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { Toggle } from '@/components/ui/toggle';
import { Bold, Italic, Underline, List, Eye, LayoutGrid } from 'lucide-vue-next';

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

import uiTranslations        from '@/i18n/ui.json';
import componentTranslations from '@shared/content/toggle/translations.json';

// ─── i18n ─────────────────────────────────────────────────────────────────────
// IMPORTANT: locale comes from useTranslation — NEVER from useLocaleStore/Pinia
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
  componentSlug: 'toggle',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
  aiIntent: tContent('seo.aiIntent') as 'informational' | 'navigational',
  breadcrumb: [
    { name: 'Components', item: '/components' },
    { name: tContent('category'), item: '/components/form' },
    { name: tContent('title') },
  ],
})));

// ─── Analytics — page view (reactive to locale) ───────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'toggle',
    locale: newLocale as 'pt-BR' | 'en' | 'es',
    page_title: tContent('seo.title'),
  });
}, { immediate: true });

// ─── Analytics — section view ─────────────────────────────────────────────────

// ─── Demo state ───────────────────────────────────────────────────────────────

const demoBold = ref(false);
const demoItalic = ref(true);
const demoUnderline = ref(false);
const demoShowHidden = ref(false);
const demoCompact = ref(true);

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
      { id: 'importacao',   label: tNav('nav.import')    },
      { id: 'variantes',    label: tNav('nav.variants')  },
      { id: 'composicoes',  label: tNav('nav.compositions') },
      { id: 'estados',      label: tNav('nav.states')    },
      { id: 'propriedades', label: tNav('nav.props')     },
      { id: 'tokens',       label: tNav('nav.tokens')    },
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
    component_name: 'toggle',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import { Toggle } from "@/components/ui/toggle";
import { Bold } from "lucide-vue-next";`;

const codeDefault = `<Toggle
  :model-value="isBold"
  @update:model-value="(v) => isBold = v"
  aria-label="Negrito"
>
  <Bold aria-hidden="true" />
</Toggle>`;

const codeOutline = `<Toggle variant="outline" aria-label="Itálico">
  <Italic aria-hidden="true" />
</Toggle>`;

const codeWithLabel = `<Toggle variant="outline">
  <Eye aria-hidden="true" />
  Mostrar ocultos
</Toggle>`;

const codeCustomizationTokens = `/* Override de cor do estado ativo */
.toggle-brand[data-state="on"] {
  @apply bg-blue-500 text-white;
}

/* Override de tamanho via tokens */
[data-slot="toggle"][data-size="default"] {
  --height-default: 2.5rem;
}`;

const interfaceCode = `interface ToggleProps {
  modelValue?: boolean;        // estado controlado (v-model)
  defaultValue?: boolean;      // estado inicial não-controlado
  disabled?: boolean;
  name?: string;
  required?: boolean;
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  class?: string;
  // Emits
  'onUpdate:modelValue'?: (value: boolean) => void;
}`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
]);

const variantItems = computed(() => [
  { name: stripHtml(tContent('variants.items.default')),   description: stripHtml(tContent('variants.styles.default')),   code: codeDefault   },
  { name: stripHtml(tContent('variants.items.outline')),   description: stripHtml(tContent('variants.styles.outline')),   code: codeOutline   },
  { name: stripHtml(tContent('variants.items.withLabel')), description: stripHtml(tContent('variants.styles.withLabel')), code: codeWithLabel },
]);

const codeToolbar = `<div role="group" aria-label="Formatação de texto" class="flex items-center gap-1 rounded-md border border-input p-1">
  <Toggle aria-label="Negrito" :model-value="true"><Bold class="h-4 w-4" aria-hidden="true" /></Toggle>
  <Toggle aria-label="Itálico"><Italic class="h-4 w-4" aria-hidden="true" /></Toggle>
  <Toggle aria-label="Sublinhado"><Underline class="h-4 w-4" aria-hidden="true" /></Toggle>
</div>`;

const codeFilterWithLabel = `<Toggle variant="outline">
  <Eye class="h-4 w-4" aria-hidden="true" />
  Mostrar ocultos
</Toggle>`;

const codeSizes = `<div class="flex items-center gap-3">
  <Toggle variant="outline" size="sm" aria-label="Negrito (sm)"><Bold class="h-4 w-4" aria-hidden="true" /></Toggle>
  <Toggle variant="outline" aria-label="Negrito (default)"><Bold class="h-4 w-4" aria-hidden="true" /></Toggle>
  <Toggle variant="outline" size="lg" aria-label="Negrito (lg)"><Bold class="h-4 w-4" aria-hidden="true" /></Toggle>
</div>`;

const codeFilterList = `<div class="flex flex-col gap-2 w-72">
  <span class="text-sm font-medium">Filtros de exibição</span>
  <div class="flex flex-wrap gap-2">
    <Toggle variant="outline">
      <Eye class="h-4 w-4" aria-hidden="true" />
      Mostrar ocultos
    </Toggle>
    <Toggle variant="outline" :model-value="true">
      <List class="h-4 w-4" aria-hidden="true" />
      Visão compacta
    </Toggle>
  </div>
</div>`;

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.toolbar.name'),
    description: tContent('variants.compositions.toolbar.description'),
    useWhen: tContent('variants.compositions.toolbar.use'),
    code: codeToolbar,
  },
  {
    name: tContent('variants.compositions.filterWithLabel.name'),
    description: tContent('variants.compositions.filterWithLabel.description'),
    useWhen: tContent('variants.compositions.filterWithLabel.use'),
    code: codeFilterWithLabel,
  },
  {
    name: tContent('variants.compositions.sizes.name'),
    description: tContent('variants.compositions.sizes.description'),
    useWhen: tContent('variants.compositions.sizes.use'),
    code: codeSizes,
  },
  {
    name: tContent('variants.compositions.filterList.name'),
    description: tContent('variants.compositions.filterList.description'),
    useWhen: tContent('variants.compositions.filterList.use'),
    code: codeFilterList,
  },
]);

const stateItems = computed(() => [
  { label: tContent('states.items.off'),      trigger: '—', behavior: tContent('states.descriptions.off')      },
  { label: tContent('states.items.on'),       trigger: '—', behavior: tContent('states.descriptions.on')       },
  { label: tContent('states.items.hover'),    trigger: '—', behavior: tContent('states.descriptions.hover')    },
  { label: tContent('states.items.focus'),    trigger: '—', behavior: tContent('states.descriptions.focus')    },
  { label: tContent('states.items.disabled'), trigger: '—', behavior: tContent('states.descriptions.disabled') },
  { label: tContent('states.items.invalid'),  trigger: '—', behavior: tContent('states.descriptions.invalid')  },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const togglePropItems = computed(() => [
  { name: 'modelValue',         type: 'boolean',                       defaultValue: '—',         required: tContent('props.table.pressed.required'),        description: stripHtml(tContent('props.table.pressed.description'))        },
  { name: 'defaultValue',       type: 'boolean',                       defaultValue: 'false',     required: tContent('props.table.defaultPressed.required'), description: stripHtml(tContent('props.table.defaultPressed.description')) },
  { name: '@update:modelValue', type: '(value: boolean) => void',      defaultValue: '—',         required: tContent('props.table.onPressedChange.required'), description: stripHtml(tContent('props.table.onPressedChange.description')) },
  { name: 'disabled',           type: 'boolean',                       defaultValue: 'false',     required: tContent('props.table.disabled.required'),       description: stripHtml(tContent('props.table.disabled.description'))       },
  { name: 'variant',            type: '"default" | "outline"',         defaultValue: '"default"', required: tContent('props.table.variant.required'),        description: stripHtml(tContent('props.table.variant.description'))        },
  { name: 'size',               type: '"default" | "sm" | "lg"',       defaultValue: '"default"', required: tContent('props.table.size.required'),           description: stripHtml(tContent('props.table.size.description'))           },
  { name: 'class',              type: 'string',                        defaultValue: '—',         required: tContent('props.table.className.required'),      description: stripHtml(tContent('props.table.className.description'))      },
]);

const tokenRows = computed(() => [
  { token: '--muted',       value: tContent('tokens.table.muted.class'),       description: tContent('tokens.table.muted.part')       },
  { token: '--foreground',  value: tContent('tokens.table.foreground.class'),  description: tContent('tokens.table.foreground.part')  },
  { token: '--input',       value: tContent('tokens.table.input.class'),       description: tContent('tokens.table.input.part')       },
  { token: '--ring',        value: tContent('tokens.table.ring.class'),        description: tContent('tokens.table.ring.part')        },
  { token: '--destructive', value: tContent('tokens.table.destructive.class'), description: tContent('tokens.table.destructive.part') },
  { token: '--radius-button', value: tContent('tokens.table.radius.class'),    description: tContent('tokens.table.radius.part')      },
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
  { key: 'Tab',   description: tContent('accessibility.keyboard.tab')   },
  { key: 'Space', description: tContent('accessibility.keyboard.space') },
  { key: 'Enter', description: tContent('accessibility.keyboard.enter') },
]);

const relatedItems = computed(() => [
  { name: 'ToggleGroup', description: tContent('related.items.toggleGroup.description'), path: '?path=/docs/ui-togglegroup--docs' },
  { name: 'Switch',      description: tContent('related.items.switch.description'),      path: '?path=/docs/ui-switch--docs'      },
  { name: 'Checkbox',    description: tContent('related.items.checkbox.description'),    path: '?path=/docs/ui-checkbox--docs'    },
  { name: 'Button',      description: tContent('related.items.button.description'),      path: '?path=/docs/ui-button--docs'      },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
]);

const analyticsItems = computed(() => [
  { event: 'field_change', trigger: tContent('analytics.table.field_change.trigger'), payload: tContent('analytics.table.field_change.payload') },
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
]);

const a11yTestItems = computed(() => [
  { criterion: tContent('testes.accessibility.item1'), level: 'WCAG 2.1', how: '—' },
  { criterion: tContent('testes.accessibility.item2'), level: 'WCAG 2.1', how: '—' },
  { criterion: tContent('testes.accessibility.item3'), level: 'WCAG 2.1', how: '—' },
  { criterion: tContent('testes.accessibility.item4'), level: 'WCAG 2.1', how: '—' },
  { criterion: tContent('testes.accessibility.item5'), level: 'WCAG 2.1', how: '—' },
]);

const visualTestItems = computed(() => [
  { story: tContent('testes.visual.item1.story'), priority: localPriority(tContent('testes.visual.item1.priority')) },
  { story: tContent('testes.visual.item2.story'), priority: localPriority(tContent('testes.visual.item2.priority')) },
  { story: tContent('testes.visual.item3.story'), priority: localPriority(tContent('testes.visual.item3.priority')) },
  { story: tContent('testes.visual.item4.story'), priority: localPriority(tContent('testes.visual.item4.priority')) },
]);
</script>

<template>
  <DocsPageLayout :nav-groups="navGroups" :active-section="activeSection" component-slug="toggle">
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
        install-note="npx shadcn-vue@latest add toggle"
      />
    </template>

    <!-- ── Demonstração ─────────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div class="flex flex-col gap-6 w-full max-w-md">
        <!-- Barra de formatação icon-only -->
        <div class="flex items-center gap-1 rounded-md border p-1">
          <Toggle
            :model-value="demoBold"
            @update:model-value="(v: boolean) => demoBold = v"
            :aria-label="tContent('demonstration.labels.bold')"
          >
            <Bold aria-hidden="true" />
          </Toggle>
          <Toggle
            :model-value="demoItalic"
            @update:model-value="(v: boolean) => demoItalic = v"
            :aria-label="tContent('demonstration.labels.italic')"
          >
            <Italic aria-hidden="true" />
          </Toggle>
          <Toggle
            :model-value="demoUnderline"
            @update:model-value="(v: boolean) => demoUnderline = v"
            :aria-label="tContent('demonstration.labels.underline')"
          >
            <Underline aria-hidden="true" />
          </Toggle>
        </div>

        <!-- Toggle com label visível -->
        <div class="flex items-center gap-2">
          <Toggle
            variant="outline"
            :model-value="demoShowHidden"
            @update:model-value="(v: boolean) => demoShowHidden = v"
          >
            <Eye aria-hidden="true" />
            {{ tContent('demonstration.labels.showHidden') }}
          </Toggle>
          <Toggle
            variant="outline"
            :model-value="demoCompact"
            @update:model-value="(v: boolean) => demoCompact = v"
          >
            <LayoutGrid aria-hidden="true" />
            {{ tContent('demonstration.labels.compactView') }}
          </Toggle>
        </div>
      </div>
    </DocsDemonstration>

    <!-- ── Anatomia ─────────────────────────────────────────────────── -->
    <DocsAnatomy
      :title="tContent('anatomy.title')"
      :items="anatomyItems"
      :structure-label="tContent('anatomy.structureLabel')"
      :structure-code="tContent('anatomy.structureCode')"
    />

    <!-- ── Quando Usar ──────────────────────────────────────────────── -->
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
          tContent('usage.dont.item4'),
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
          {
            element: tContent('usage.uxWriting.table.ariaLabel.name'),
            rules: tContent('usage.uxWriting.table.ariaLabel.format'),
            do: tContent('usage.uxWriting.table.ariaLabel.good'),
            dont: tContent('usage.uxWriting.table.ariaLabel.bad'),
          },
          {
            element: tContent('usage.uxWriting.table.label.name'),
            rules: tContent('usage.uxWriting.table.label.format'),
            do: tContent('usage.uxWriting.table.label.good'),
            dont: tContent('usage.uxWriting.table.label.bad'),
          },
          {
            element: tContent('usage.uxWriting.table.icon.name'),
            rules: tContent('usage.uxWriting.table.icon.format'),
            do: tContent('usage.uxWriting.table.icon.good'),
            dont: tContent('usage.uxWriting.table.icon.bad'),
          },
        ],
      }"
    />

    <!-- ── Do & Don't ───────────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="[
        {
          doLabel: tNav('common.do'),
          dontLabel: tNav('common.dont'),
          doCaption: tContent('doDont.pair1.do'),
          dontCaption: tContent('doDont.pair1.dont'),
        },
        {
          doLabel: tNav('common.do'),
          dontLabel: tNav('common.dont'),
          doCaption: tContent('doDont.pair2.do'),
          dontCaption: tContent('doDont.pair2.dont'),
        },
      ]"
    >
      <!-- Pair 1: aria-label descritivo vs genérico -->
      <template #do-preview-0>
        <Toggle aria-label="Negrito">
          <Bold aria-hidden="true" />
        </Toggle>
      </template>
      <template #dont-preview-0>
        <Toggle aria-label="Botão B">
          <Bold aria-hidden="true" />
        </Toggle>
      </template>

      <!-- Pair 2: ToggleGroup vs múltiplos Toggle soltos -->
      <template #do-preview-1>
        <div class="flex items-center gap-1 rounded-md border p-1">
          <Toggle aria-label="Negrito"><Bold aria-hidden="true" /></Toggle>
          <Toggle aria-label="Itálico"><Italic aria-hidden="true" /></Toggle>
          <Toggle aria-label="Sublinhado"><Underline aria-hidden="true" /></Toggle>
        </div>
      </template>
      <template #dont-preview-1>
        <div class="flex items-center gap-3">
          <Toggle aria-label="Negrito"><Bold aria-hidden="true" /></Toggle>
          <Toggle aria-label="Itálico"><Italic aria-hidden="true" /></Toggle>
          <Toggle aria-label="Sublinhado"><Underline aria-hidden="true" /></Toggle>
        </div>
      </template>
    </DocsDoDont>

    <!-- ── Importação ───────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :code="codeImportBasic"
    />

    <!-- ── Variantes ────────────────────────────────────────────────── -->
    <DocsVariants :title="tContent('variants.title')" :items="variantItems" component-slug="toggle">
      <!-- default -->
      <template #variant-preview-0>
        <Toggle aria-label="Negrito">
          <Bold aria-hidden="true" />
        </Toggle>
      </template>

      <!-- outline -->
      <template #variant-preview-1>
        <Toggle variant="outline" aria-label="Itálico">
          <Italic aria-hidden="true" />
        </Toggle>
      </template>

      <!-- withLabel -->
      <template #variant-preview-2>
        <Toggle variant="outline">
          <Eye aria-hidden="true" />
          Mostrar ocultos
        </Toggle>
      </template>
    </DocsVariants>

    <!-- ── Composições ──────────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="toggle"
      :items="compositionItems"
    >
      <template #variant-preview-0>
        <div role="group" aria-label="Formatação de texto" class="flex items-center gap-1 rounded-md border border-input p-1">
          <Toggle aria-label="Negrito" :model-value="true">
            <Bold class="h-4 w-4" aria-hidden="true" />
          </Toggle>
          <Toggle aria-label="Itálico">
            <Italic class="h-4 w-4" aria-hidden="true" />
          </Toggle>
          <Toggle aria-label="Sublinhado">
            <Underline class="h-4 w-4" aria-hidden="true" />
          </Toggle>
        </div>
      </template>
      <template #variant-preview-1>
        <Toggle variant="outline">
          <Eye class="h-4 w-4" aria-hidden="true" />
          Mostrar ocultos
        </Toggle>
      </template>
      <template #variant-preview-2>
        <div class="flex items-center gap-3">
          <Toggle variant="outline" size="sm" aria-label="Negrito (sm)">
            <Bold class="h-4 w-4" aria-hidden="true" />
          </Toggle>
          <Toggle variant="outline" aria-label="Negrito (default)">
            <Bold class="h-4 w-4" aria-hidden="true" />
          </Toggle>
          <Toggle variant="outline" size="lg" aria-label="Negrito (lg)">
            <Bold class="h-4 w-4" aria-hidden="true" />
          </Toggle>
        </div>
      </template>
      <template #variant-preview-3>
        <div class="flex flex-col gap-2 w-72">
          <span class="text-sm font-medium">Filtros de exibição</span>
          <div class="flex flex-wrap gap-2">
            <Toggle variant="outline">
              <Eye class="h-4 w-4" aria-hidden="true" />
              Mostrar ocultos
            </Toggle>
            <Toggle variant="outline" :model-value="true">
              <List class="h-4 w-4" aria-hidden="true" />
              Visão compacta
            </Toggle>
          </div>
        </div>
      </template>
    </DocsCompositions>

    <!-- ── Estados ──────────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{
        state: 'Estado',
        trigger: 'Trigger',
        behavior: 'Comportamento',
      }"
      :items="stateItems"
    />

    <!-- ── Propriedades ─────────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        {
          title: 'Toggle',
          cols: propCols,
          items: togglePropItems,
        },
      ]"
      :interface-code="interfaceCode"
    />

    <!-- ── Tokens ────────────────────────────────────────────────────── -->
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

    <!-- ── Acessibilidade ───────────────────────────────────────────── -->
    <DocsAccessibility
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ─────────────────────────────────────────────── -->
    <DocsRelated :title="tContent('related.title')" :items="relatedItems" />

    <!-- ── Notas ────────────────────────────────────────────────────── -->
    <DocsNotes :title="tContent('notes.title')" :items="noteItems" />

    <!-- ── Analytics ────────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :cols="{
        event: tContent('analytics.table.event'),
        trigger: tContent('analytics.table.trigger'),
        payload: tContent('analytics.table.payload'),
      }"
      :items="analyticsItems"
    />

    <!-- ── Testes ────────────────────────────────────────────────────── -->
    <DocsTestes
      :title="tContent('testes.title')"
      :functional="{
        title: tContent('testes.functional.title'),
        cols: {
          action: tNav('common.userAction'),
          result: tNav('common.expectedResult'),
          priority: tNav('common.priority'),
        },
        items: functionalTestItems,
      }"
      :accessibility="{
        title: tContent('testes.accessibility.title'),
        cols: a11yCritCols,
        items: a11yTestItems,
      }"
      :visual="{
        title: tContent('testes.visual.title'),
        cols: {
          story: tNav('common.storyState'),
          priority: tNav('common.priority'),
        },
        items: visualTestItems,
      }"
    />
  </DocsPageLayout>
</template>
