<script setup lang="ts">
import { computed, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import componentTranslations from '@shared/content/skeleton/translations.json';

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
  componentSlug: 'skeleton',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'skeleton',
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
    component_name: 'skeleton',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import { Skeleton } from "@/components/ui/skeleton";`;

const codeRectangle = `<Skeleton style="height: 5rem; width: 100%" aria-hidden="true" />`;

const codeCircle = `<Skeleton class="nds-rounded-full" style="height: 3rem; width: 3rem" aria-hidden="true" />`;

const codeLine = `<Skeleton style="height: 1rem; width: 200px" aria-hidden="true" />`;

const interfaceCode = `// Skeleton
interface SkeletonProps {
  class?: string;
  // Aceita qualquer prop nativa de div (style, id, data-*, aria-hidden)
}`;

const anatomyStructure = computed(() => tContent('anatomy.structureCode'));

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
]);

const variantItems = computed(() => [
  { name: tContent('variants.items.rectangle'), description: stripHtml(tContent('variants.styles.rectangle')), code: codeRectangle },
  { name: tContent('variants.items.circle'),    description: stripHtml(tContent('variants.styles.circle')),    code: codeCircle    },
  { name: tContent('variants.items.line'),      description: stripHtml(tContent('variants.styles.line')),      code: codeLine      },
]);

const stateItems = computed(() => [
  { label: tContent('states.default.label'),       trigger: tContent('states.default.trigger'),       behavior: stripHtml(tContent('states.default.behavior')) },
  { label: tContent('states.motionReduced.label'), trigger: tContent('states.motionReduced.trigger'), behavior: stripHtml(tContent('states.motionReduced.behavior')) },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const skeletonPropItems = computed(() => [
  { name: 'class',       type: tContent('props.table.className.type'),  defaultValue: tContent('props.table.className.default'),  required: tContent('props.table.className.required'),  description: stripHtml(tContent('props.table.className.description')) },
  { name: 'aria-hidden', type: tContent('props.table.ariaHidden.type'), defaultValue: tContent('props.table.ariaHidden.default'), required: tContent('props.table.ariaHidden.required'), description: stripHtml(tContent('props.table.ariaHidden.description')) },
  { name: '...rest',     type: tContent('props.table.rest.type'),       defaultValue: tContent('props.table.rest.default'),       required: tContent('props.table.rest.required'),       description: stripHtml(tContent('props.table.rest.description')) },
]);

const tokenRows = computed(() => [
  { token: '--muted',    value: tContent('tokens.table.background.class'),   description: tContent('tokens.table.background.part')   },
  { token: '—',          value: tContent('tokens.table.rounded.class'),      description: tContent('tokens.table.rounded.part')      },
  { token: '—',          value: tContent('tokens.table.animation.class'),    description: tContent('tokens.table.animation.part')    },
  { token: '—',          value: tContent('tokens.table.motionReduce.class'), description: tContent('tokens.table.motionReduce.part') },
]);

const accessibilityItems = computed(() => [
  tContent('accessibility.items.item1'),
  tContent('accessibility.items.item2'),
  tContent('accessibility.items.item3'),
  tContent('accessibility.items.item4'),
  tContent('accessibility.items.item5'),
]);

const keyboardItems = computed(() => [
  { key: '—', description: tContent('accessibility.keyboard.noKeyboard')  },
  { key: '—', description: tContent('accessibility.keyboard.description') },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.progress.name'),    description: tContent('related.items.progress.description'),    path: '?path=/docs/ui-progress--docs'     },
  { name: tContent('related.items.spinner.name'),     description: tContent('related.items.spinner.description'),     path: '?path=/docs/ui-spinner--docs'      },
  { name: tContent('related.items.aspectRatio.name'), description: tContent('related.items.aspectRatio.description'), path: '?path=/docs/ui-aspectratio--docs'  },
  { name: tContent('related.items.card.name'),        description: tContent('related.items.card.description'),        path: '?path=/docs/ui-card--docs'         },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
  { title: '', content: tContent('notes.item5') },
]);

const analyticsItems = computed(() => [
  { event: '—', trigger: stripHtml(tContent('analytics.description')), payload: '—' },
]);

const a11yCritCols = computed(() => ({
  criterion: tNav('common.criterion'),
  level: 'WCAG',
  how: tNav('common.howToVerify'),
}));

const functionalTestItems = computed(() => [
  { action: stripHtml(tContent('testes.functional.item1.action')), result: stripHtml(tContent('testes.functional.item1.result')), priority: localPriority(tContent('testes.functional.item1.priority')) },
  { action: stripHtml(tContent('testes.functional.item2.action')), result: stripHtml(tContent('testes.functional.item2.result')), priority: localPriority(tContent('testes.functional.item2.priority')) },
  { action: stripHtml(tContent('testes.functional.item3.action')), result: stripHtml(tContent('testes.functional.item3.result')), priority: localPriority(tContent('testes.functional.item3.priority')) },
  { action: stripHtml(tContent('testes.functional.item4.action')), result: stripHtml(tContent('testes.functional.item4.result')), priority: localPriority(tContent('testes.functional.item4.priority')) },
  { action: stripHtml(tContent('testes.functional.item5.action')), result: stripHtml(tContent('testes.functional.item5.result')), priority: localPriority(tContent('testes.functional.item5.priority')) },
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
  { story: tContent('testes.visual.item5.story'), priority: localPriority(tContent('testes.visual.item5.priority')) },
]);
</script>

<template>
  <DocsPageLayout
    :nav-groups="navGroups"
    :active-section="activeSection"
    component-slug="skeleton"
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
        data-min="16rem"
      >
        <!-- Card de perfil -->
        <div
          class="nds-stack"
          data-spacing="sm"
        >
          <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">
            {{ tContent('demonstration.labels.card') }}
          </p>
          <div
            aria-busy="true"
            :aria-label="tContent('demonstration.labels.card')"
            class="nds-cluster nds-p-4 nds-border-default nds-rounded-md"
            data-spacing="md"
            data-align="center"
          >
            <Skeleton
              class="nds-rounded-full nds-motion-reduce-none"
              style="height: 3rem; width: 3rem"
              :aria-hidden="true"
            />
            <div
              class="nds-stack nds-flex-1"
              data-spacing="sm"
            >
              <Skeleton
                class="nds-motion-reduce-none"
                style="height: 1rem; width: 70%"
                :aria-hidden="true"
              />
              <Skeleton
                class="nds-motion-reduce-none"
                style="height: 1rem; width: 50%"
                :aria-hidden="true"
              />
            </div>
          </div>
        </div>

        <!-- Lista -->
        <div
          class="nds-stack"
          data-spacing="sm"
        >
          <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">
            {{ tContent('demonstration.labels.list') }}
          </p>
          <div
            aria-busy="true"
            :aria-label="tContent('demonstration.labels.list')"
            class="nds-stack nds-p-4 nds-border-default nds-rounded-md"
            data-spacing="sm"
          >
            <div
              v-for="i in 5"
              :key="i"
              class="nds-cluster"
              data-spacing="sm"
              data-align="center"
            >
              <Skeleton
                class="nds-rounded-md nds-motion-reduce-none"
                style="height: 2rem; width: 2rem"
                :aria-hidden="true"
              />
              <div
                class="nds-flex-1 nds-stack"
                data-spacing="xs"
              >
                <Skeleton
                  class="nds-motion-reduce-none"
                  style="height: 0.75rem; width: 60%"
                  :aria-hidden="true"
                />
                <Skeleton
                  class="nds-motion-reduce-none"
                  style="height: 0.75rem; width: 40%"
                  :aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Imagem em AspectRatio -->
        <div
          class="nds-stack"
          data-spacing="sm"
        >
          <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">
            {{ tContent('demonstration.labels.image') }}
          </p>
          <div
            aria-busy="true"
            :aria-label="tContent('demonstration.labels.image')"
          >
            <AspectRatio :ratio="16 / 9">
              <Skeleton
                class="nds-motion-reduce-none"
                style="height: 100%; width: 100%"
                :aria-hidden="true"
              />
            </AspectRatio>
          </div>
        </div>

        <!-- Parágrafo -->
        <div
          class="nds-stack"
          data-spacing="sm"
        >
          <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">
            {{ tContent('demonstration.labels.paragraph') }}
          </p>
          <div
            aria-busy="true"
            :aria-label="tContent('demonstration.labels.paragraph')"
            class="nds-stack nds-p-4 nds-border-default nds-rounded-md"
            data-spacing="sm"
          >
            <Skeleton
              class="nds-motion-reduce-none"
              style="height: 1rem; width: 100%"
              :aria-hidden="true"
            />
            <Skeleton
              class="nds-motion-reduce-none"
              style="height: 1rem; width: 90%"
              :aria-hidden="true"
            />
            <Skeleton
              class="nds-motion-reduce-none"
              style="height: 1rem; width: 60%"
              :aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </DocsDemonstration>

    <!-- ── Anatomia ───────────────────────────────────────────────── -->
    <DocsAnatomy
      :title="tContent('anatomy.title')"
      :items="anatomyItems"
      :structure-code="anatomyStructure"
      :structure-label="tContent('anatomy.structureLabel')"
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
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: tContent('doDont.pair1.do'), dontCaption: tContent('doDont.pair1.dont') },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: tContent('doDont.pair2.do'), dontCaption: tContent('doDont.pair2.dont') },
      ]"
    >
      <template #do-preview-0>
        <div
          aria-busy="true"
          aria-label="Carregando texto"
          class="nds-w-full nds-stack"
          data-spacing="sm"
        >
          <Skeleton
            class="nds-motion-reduce-none"
            style="height: 1rem; width: 100%"
            :aria-hidden="true"
          />
          <Skeleton
            class="nds-motion-reduce-none"
            style="height: 1rem; width: 70%"
            :aria-hidden="true"
          />
        </div>
      </template>
      <template #dont-preview-0>
        <div class="nds-w-full">
          <Skeleton
            class="nds-motion-reduce-none"
            style="height: 0.5rem; width: 3rem"
            :aria-hidden="true"
          />
        </div>
      </template>
      <template #do-preview-1>
        <div
          aria-busy="true"
          aria-label="Carregando avatar e texto"
          class="nds-cluster nds-w-full"
          data-spacing="sm"
          data-align="center"
        >
          <Skeleton
            class="nds-rounded-full nds-motion-reduce-none"
            style="height: 2.5rem; width: 2.5rem"
            :aria-hidden="true"
          />
          <Skeleton
            class="nds-motion-reduce-none"
            style="height: 1rem; width: 160px"
            :aria-hidden="true"
          />
        </div>
      </template>
      <template #dont-preview-1>
        <div
          class="nds-cluster nds-w-full"
          data-spacing="sm"
          data-align="center"
        >
          <Skeleton
            class="nds-rounded-full nds-motion-reduce-none"
            style="height: 2.5rem; width: 2.5rem"
          />
          <Skeleton
            class="nds-motion-reduce-none"
            style="height: 1rem; width: 160px"
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
        <div
          aria-busy="true"
          aria-label="Carregando bloco"
          style="width: 12rem"
        >
          <Skeleton
            class="nds-motion-reduce-none"
            style="height: 5rem; width: 100%"
            :aria-hidden="true"
          />
        </div>
      </template>
      <template #variant-preview-1>
        <div
          aria-busy="true"
          aria-label="Carregando avatar"
        >
          <Skeleton
            class="nds-rounded-full nds-motion-reduce-none"
            style="height: 3rem; width: 3rem"
            :aria-hidden="true"
          />
        </div>
      </template>
      <template #variant-preview-2>
        <div
          aria-busy="true"
          aria-label="Carregando linha de texto"
        >
          <Skeleton
            class="nds-motion-reduce-none"
            style="height: 1rem; width: 200px"
            :aria-hidden="true"
          />
        </div>
      </template>
    </DocsVariants>

    <!-- ── Estados ─────────────────────────────────────────────────── -->
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
        { title: 'Skeleton', cols: propCols, items: skeletonPropItems },
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
        event: 'Evento',
        trigger: 'Quando dispara',
        payload: 'Payload',
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
