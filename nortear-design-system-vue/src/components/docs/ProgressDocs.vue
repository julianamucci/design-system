<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { Progress } from '@/components/ui/progress';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import componentTranslations from '@shared/content/progress/translations.json';

import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.vue';
import DocsDemonstration from '@/components/docs/shared/sections/DocsDemonstration.vue';
import DocsAnatomy       from '@/components/docs/shared/sections/DocsAnatomy.vue';
import DocsWhenToUse     from '@/components/docs/shared/sections/DocsWhenToUse.vue';
import DocsDoDont        from '@/components/docs/shared/sections/DocsDoDont.vue';
import DocsImport        from '@/components/docs/shared/sections/DocsImport.vue';
import DocsVariants      from '@/components/docs/shared/sections/DocsVariants.vue';
import DocsStates        from '@/components/docs/shared/sections/DocsStates.vue';
import DocsProps         from '@/components/docs/shared/sections/DocsProps.vue';
import DocsTokens        from '@/components/docs/shared/sections/DocsTokens.vue';
import DocsAccessibility from '@/components/docs/shared/sections/DocsAccessibility.vue';
import DocsRelated       from '@/components/docs/shared/sections/DocsRelated.vue';
import DocsNotes         from '@/components/docs/shared/sections/DocsNotes.vue';
import DocsAnalytics     from '@/components/docs/shared/sections/DocsAnalytics.vue';
import DocsTestes        from '@/components/docs/shared/sections/DocsTestes.vue';
import { stripHtml, toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(componentTranslations);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
const screenReaderItems = computed(() =>
  Object.values(
    (componentTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >)[locale.value]?.accessibility?.screenReader ?? {},
  ),
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  componentSlug: 'progress',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
  breadcrumb: [
    { name: 'Components', item: '/components' },
    { name: tContent('category'), item: '/components/feedback' },
    { name: tContent('title') },
  ],
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'progress',
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
    component_name: 'progress',
    locale: locale.value,
  });
});

// ─── Demo animation (uploading file) ──────────────────────────────────────────

const demoValue = ref(0);
let demoTimer: ReturnType<typeof setInterval> | null = null;
// Rastreia marcos apenas no primeiro ciclo da animação — a demo reinicia em
// loop e re-emitir marcos a cada ciclo geraria spam (mesmo exemplo da Vanilla).
let demoFirstCycleDone = false;

onMounted(() => {
  demoTimer = setInterval(() => {
    demoValue.value = demoValue.value >= 100 ? 0 : demoValue.value + 5;
    const pct = demoValue.value;
    if (!demoFirstCycleDone && (pct === 25 || pct === 50 || pct === 75 || pct === 100)) {
      track('task_progress', { component: 'progress', task: 'upload', percent: pct, location: 'docs_demo' });
      if (pct === 100) {
        track('task_complete', { component: 'progress', task: 'upload', location: 'docs_demo' });
        demoFirstCycleDone = true;
      }
    }
  }, 400);
});

onUnmounted(() => {
  if (demoTimer) { clearInterval(demoTimer); demoTimer = null; }
});

// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import { Progress } from "@/components/ui/progress";`;

const codeDeterminate = `<Progress :model-value="50" aria-label="Progresso do upload" />`;

const codeWithLabel = `<div class="nds-stack" data-spacing="xs">
  <div class="nds-cluster nds-text-body" data-justify="between">
    <span class="nds-text-foreground">Enviando arquivo</span>
    <span class="nds-text-muted-foreground" style="font-variant-numeric: tabular-nums;">42%</span>
  </div>
  <Progress :model-value="42" aria-label="Progresso do upload" />
</div>`;

const codeSemantic = `<Progress :model-value="100" data-variant="success" aria-label="Sincronização concluída" />
<Progress :model-value="92" data-variant="destructive" aria-label="Espaço quase esgotado" />`;

const interfaceCode = `// Progress (Vue)
interface ProgressProps {
  modelValue?: number | null;  // 0–100; null = indeterminate
  max?: number;                // default 100
  getValueLabel?: (value: number | null | undefined, max: number) => string | undefined;
  getValueText?:  (value: number | null | undefined, max: number) => string | undefined;
  'data-variant'?: 'success' | 'destructive';
  class?: string;
}`;

// Tabela de tokens — cada linha é uma declaração de
// `docs/shared/styles/nds/progress.css`. O token é o mesmo nas cinco stacks; a
// classe e a aplicação vêm do conteúdo compartilhado.
const TOKEN_ROWS = [
  { token: '--primary',           key: 'track' },
  { token: '--primary',           key: 'indicator' },
  { token: '--success',           key: 'success' },
  { token: '--destructive',       key: 'destructive' },
  { token: '--spacing-2',         key: 'height' },
  { token: '--radius-full',       key: 'radius' },
  { token: '--muted-foreground',  key: 'value' },
  { token: '--text-control',      key: 'label' },
  { token: '--duration-base',     key: 'motion' },
  { token: '--duration-stately',  key: 'motionIndeterminate' },
] as const;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
  tContent('anatomy.item4'),
  tContent('anatomy.item5'),
]);

const variantItems = computed(() => [
  { name: tContent('variants.items.determinate'),   description: stripHtml(tContent('variants.styles.determinate')),   code: codeDeterminate   },
  { name: tContent('variants.items.withLabel'),     description: stripHtml(tContent('variants.styles.withLabel')),     code: codeWithLabel     },
  { name: tContent('variants.items.semantic'),      description: stripHtml(tContent('variants.styles.semantic')),      code: codeSemantic      },
]);

const stateItems = computed(() => [
  { label: tContent('states.default.label'),       trigger: toPlainText(tContent('states.default.trigger')),       behavior: toPlainText(tContent('states.default.behavior')) },
  { label: tContent('states.loading.label'),       trigger: toPlainText(tContent('states.loading.trigger')),       behavior: toPlainText(tContent('states.loading.behavior')) },
  { label: tContent('states.complete.label'),      trigger: toPlainText(tContent('states.complete.trigger')),      behavior: toPlainText(tContent('states.complete.behavior')) },
  { label: tContent('states.indeterminate.label'), trigger: toPlainText(tContent('states.indeterminate.trigger')), behavior: toPlainText(tContent('states.indeterminate.behavior')) },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const progressPropItems = computed(() => [
  { name: 'modelValue',       type: tContent('props.table.value.type'),            defaultValue: tContent('props.table.value.default'),            required: tContent('props.table.value.required'),            description: toPlainText(tContent('props.table.value.description')) },
  { name: 'max',              type: tContent('props.table.max.type'),              defaultValue: tContent('props.table.max.default'),              required: tContent('props.table.max.required'),              description: toPlainText(tContent('props.table.max.description')) },
  { name: 'getValueLabel',    type: '(value, max) => string | undefined',          defaultValue: '—',                                              required: tContent('props.table.getAriaValueText.required'),    description: toPlainText(tContent('props.table.getAriaValueText.description')) },
  { name: 'data-variant',     type: tContent('props.table.variant.type'),          defaultValue: tContent('props.table.variant.default'),          required: tContent('props.table.variant.required'),          description: toPlainText(tContent('props.table.variant.description')) },
  { name: 'class',            type: tContent('props.table.className.type'),        defaultValue: tContent('props.table.className.default'),        required: tContent('props.table.className.required'),        description: toPlainText(tContent('props.table.className.description')) },
  { name: 'aria-label',       type: 'string',                                       defaultValue: '—',                                              required: 'Sim',                                                 description: stripHtml(tContent('accessibility.aria.label')) },
]);

const tokenRows = computed(() =>
  TOKEN_ROWS.map(({ token, key }) => ({
    token,
    value: tContent(`tokens.table.${key}.class`),
    description: tContent(`tokens.table.${key}.part`),
  })),
);

const accessibilityItems = computed(() => [
  tContent('accessibility.items.item1'),
  tContent('accessibility.items.item2'),
  tContent('accessibility.items.item3'),
  tContent('accessibility.items.item4'),
  tContent('accessibility.items.item5'),
  tContent('accessibility.items.item6'),
]);

const keyboardItems = computed(() => [
  { key: '—', description: tContent('accessibility.keyboard.noInteraction') },
  { key: '—', description: tContent('accessibility.keyboard.container')     },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.skeleton.name'), description: toPlainText(tContent('related.items.skeleton.description')), path: '?path=/docs/ui-skeleton--docs' },
  { name: tContent('related.items.spinner.name'),  description: toPlainText(tContent('related.items.spinner.description')),  path: '?path=/docs/ui-spinner--docs'  },
  { name: tContent('related.items.alert.name'),    description: toPlainText(tContent('related.items.alert.description')),    path: '?path=/docs/ui-alert--docs'    },
  { name: tContent('related.items.sonner.name'),   description: toPlainText(tContent('related.items.sonner.description')),   path: '?path=/docs/ui-sonner--docs'   },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
]);

const analyticsItems = computed(() => [
  { event: 'task_progress', trigger: toPlainText(tContent('analytics.table.task_progress.trigger')), payload: tContent('analytics.table.task_progress.payload') },
  { event: 'task_complete', trigger: toPlainText(tContent('analytics.table.task_complete.trigger')), payload: tContent('analytics.table.task_complete.payload') },
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
  { criterion: tContent('testes.accessibility.item1'), level: 'AA', how: tContent('testes.accessibility.item1') },
  { criterion: tContent('testes.accessibility.item2'), level: 'AA', how: tContent('testes.accessibility.item2') },
  { criterion: tContent('testes.accessibility.item3'), level: 'AA', how: tContent('testes.accessibility.item3') },
  { criterion: tContent('testes.accessibility.item4'), level: 'AA', how: tContent('testes.accessibility.item4') },
  { criterion: tContent('testes.accessibility.item5'), level: 'AA', how: tContent('testes.accessibility.item5') },
]);

const visualTestItems = computed(() => [
  { story: tContent('testes.visual.item1.story'), priority: localPriority(tContent('testes.visual.item1.priority')) },
  { story: tContent('testes.visual.item2.story'), priority: localPriority(tContent('testes.visual.item2.priority')) },
  { story: tContent('testes.visual.item3.story'), priority: localPriority(tContent('testes.visual.item3.priority')) },
  { story: tContent('testes.visual.item4.story'), priority: localPriority(tContent('testes.visual.item4.priority')) },
]);
</script>

<template>
  <DocsPageLayout
    :nav-groups="navGroups"
    :active-section="activeSection"
    component-slug="progress"
  >
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
      />
    </template>

    <!-- ── Demonstração ───────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div
        class="nds-grid nds-w-full"
        data-cols="2"
        data-spacing="lg"
      >
        <!-- Upload animado -->
        <div
          class="nds-stack nds-p-4 nds-border-default nds-rounded-md"
          data-spacing="sm"
        >
          <div
            class="nds-cluster nds-text-body"
            data-justify="between"
          >
            <span class="nds-text-foreground">{{ tContent('demonstration.labels.upload') }}</span>
            <span
              class="nds-text-muted-foreground"
              style="font-variant-numeric: tabular-nums;"
              aria-live="polite"
            >{{ demoValue }}{{ tContent('demonstration.labels.percent') }}</span>
          </div>
          <Progress
            :model-value="demoValue"
            :aria-label="tContent('demonstration.labels.upload')"
          />
        </div>

        <!-- Estados estáticos -->
        <div
          class="nds-stack nds-p-4 nds-border-default nds-rounded-md"
          style="--stack-gap: var(--spacing-3);"
        >
          <div
            class="nds-stack"
            data-spacing="xs"
          >
            <div class="nds-text-body nds-text-muted-foreground">
              value=0
            </div>
            <Progress
              :model-value="0"
              :aria-label="tContent('demonstration.labels.loading')"
            />
          </div>
          <div
            class="nds-stack"
            data-spacing="xs"
          >
            <div class="nds-text-body nds-text-muted-foreground">
              value=50
            </div>
            <Progress
              :model-value="50"
              :aria-label="tContent('demonstration.labels.loading')"
            />
          </div>
          <div
            class="nds-stack"
            data-spacing="xs"
          >
            <div class="nds-text-body nds-text-muted-foreground">
              value=100
            </div>
            <Progress
              :model-value="100"
              :aria-label="tContent('demonstration.labels.complete')"
            />
          </div>
        </div>

        <!-- Indeterminate -->
        <div
          class="nds-stack nds-p-4 nds-border-default nds-rounded-md"
          data-spacing="sm"
        >
          <div class="nds-text-body">
            {{ tContent('demonstration.labels.indeterminate') }}
          </div>
          <Progress
            :model-value="null"
            :aria-label="tContent('demonstration.labels.indeterminate')"
          />
        </div>

        <!-- Cor customizada -->
        <div
          class="nds-stack nds-p-4 nds-border-default nds-rounded-md"
          data-spacing="sm"
        >
          <div
            class="nds-cluster nds-text-body"
            data-justify="between"
          >
            <span class="nds-text-foreground">{{ tContent('demonstration.labels.upload') }}</span>
            <span
              class="nds-text-muted-foreground"
              style="font-variant-numeric: tabular-nums;"
            >75%</span>
          </div>
          <Progress
            :model-value="75"
            data-variant="success"
            :aria-label="tContent('demonstration.labels.upload')"
          />
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
          { element: tContent('usage.uxWriting.table.label.name'), rules: tContent('usage.uxWriting.table.label.format'), do: tContent('usage.uxWriting.table.label.good'), dont: tContent('usage.uxWriting.table.label.bad') },
          { element: tContent('usage.uxWriting.table.value.name'), rules: tContent('usage.uxWriting.table.value.format'), do: tContent('usage.uxWriting.table.value.good'), dont: tContent('usage.uxWriting.table.value.bad') },
          { element: tContent('usage.uxWriting.table.ariaLabel.name'), rules: tContent('usage.uxWriting.table.ariaLabel.format'), do: tContent('usage.uxWriting.table.ariaLabel.good'), dont: tContent('usage.uxWriting.table.ariaLabel.bad') },
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
    />

    <!-- ── Do & Don't ─────────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="[
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair1.do')), dontCaption: toPlainText(tContent('doDont.pair1.dont')) },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair2.do')), dontCaption: toPlainText(tContent('doDont.pair2.dont')) },
      ]"
    >
      <template #do-preview-0>
        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <div
            class="nds-cluster nds-text-body"
            data-justify="between"
          >
            <span class="nds-text-foreground">Enviando arquivo</span>
            <span
              class="nds-text-muted-foreground"
              style="font-variant-numeric: tabular-nums;"
            >42%</span>
          </div>
          <Progress
            :model-value="42"
            aria-label="Progresso do upload"
          />
        </div>
      </template>
      <template #dont-preview-0>
        <div class="nds-w-full">
          <Progress
            :model-value="42"
            aria-label="Barra"
          />
        </div>
      </template>
      <template #do-preview-1>
        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <div
            class="nds-cluster nds-text-body"
            data-justify="between"
          >
            <span class="nds-text-foreground">Enviando</span>
            <span
              class="nds-text-muted-foreground"
              style="font-variant-numeric: tabular-nums;"
              aria-live="polite"
            >50%</span>
          </div>
          <Progress
            :model-value="50"
            aria-label="Progresso do upload"
          />
        </div>
      </template>
      <template #dont-preview-1>
        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <div
            class="nds-cluster nds-text-body"
            data-justify="between"
          >
            <span class="nds-text-foreground">Enviando</span>
            <span
              class="nds-text-muted-foreground"
              style="font-variant-numeric: tabular-nums;"
              aria-live="assertive"
            >51%</span>
          </div>
          <Progress
            :model-value="51"
            aria-label="Progresso do upload"
          />
        </div>
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :code="codeImportBasic"
    />

    <!-- ── Variantes ──────────────────────────────────────────────── -->
    <DocsVariants
      :title="tContent('variants.title')"
      :items="variantItems"
    >
      <template #variant-preview-0>
        <div class="nds-w-full">
          <Progress
            :model-value="50"
            aria-label="Progresso de exemplo"
          />
        </div>
      </template>
      <template #variant-preview-1>
        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <div
            class="nds-cluster nds-text-body"
            data-justify="between"
          >
            <span class="nds-text-foreground">Enviando arquivo</span>
            <span
              class="nds-text-muted-foreground"
              style="font-variant-numeric: tabular-nums;"
            >42%</span>
          </div>
          <Progress
            :model-value="42"
            aria-label="Progresso do upload"
          />
        </div>
      </template>
      <template #variant-preview-2>
        <div
          class="nds-stack nds-w-full"
          data-spacing="sm"
        >
          <Progress
            :model-value="100"
            data-variant="success"
            aria-label="Sincronização concluída"
          />
          <Progress
            :model-value="92"
            data-variant="destructive"
            aria-label="Espaço de armazenamento quase esgotado"
          />
        </div>
      </template>
    </DocsVariants>

    <!-- ── Estados ─────────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{
        state: tContent('states.cols.state'),
        trigger: toPlainText(tContent('states.cols.trigger')),
        behavior: toPlainText(tContent('states.cols.behavior')),
      }"
      :items="stateItems"
    />

    <!-- ── Propriedades ───────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: 'Progress', cols: propCols, items: progressPropItems },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="tContent('props.extensibilityCode')"
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
      :customization-code="tContent('tokens.customizationCode')"
    />

    <!-- ── Acessibilidade ─────────────────────────────────────────── -->
    <DocsAccessibility
      :screen-reader-title="tNav('common.screenReader')"
      :screen-reader-items="screenReaderItems"
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-title="tContent('accessibility.keyboard.title')"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ───────────────────────────────────────────── -->
    <DocsRelated
      :title="tContent('related.title')"
      :items="relatedItems"
    />

    <!-- ── Notas ──────────────────────────────────────────────────── -->
    <DocsNotes
      :title="tContent('notes.title')"
      :items="noteItems"
    />

    <!-- ── Analytics ─────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :cols="{
        event: tContent('analytics.table.event'),
        trigger: toPlainText(tContent('analytics.table.trigger')),
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
