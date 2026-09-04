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

const codeRectangle = `<Skeleton data-shape="fill" class="nds-docs-skeleton-media" />`;

const codeCircle = `<Skeleton data-shape="avatar" />`;

const codeLine = `<Skeleton data-shape="text" data-width="3-4" />`;

const interfaceCode = `// Skeleton — sem props próprias além de class.
// A caixa vem de atributo, e a folha de estilo continua dona das medidas.
interface SkeletonProps {
  class?: string;
  // data-shape: "text" | "heading" | "avatar" | "fill"
  // data-width: "full" | "3-4" | "2-3" | "1-2" | "1-3"
  // data-size:  "sm" | "lg"   (só na forma de avatar)
}`;

const anatomyStructure = computed(() => tContent('anatomy.structureCode'));

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
]);

const variantItems = computed(() => [
  { trackId: 'rectangle', name: tContent('variants.items.rectangle'), description: stripHtml(tContent('variants.styles.rectangle')), code: codeRectangle },
  { trackId: 'circle', name: tContent('variants.items.circle'),    description: stripHtml(tContent('variants.styles.circle')),    code: codeCircle    },
  { trackId: 'line', name: tContent('variants.items.line'),      description: stripHtml(tContent('variants.styles.line')),      code: codeLine      },
]);

const stateItems = computed(() => [
  { label: tContent('states.default.label'),       trigger: toPlainText(tContent('states.default.trigger')),       behavior: toPlainText(tContent('states.default.behavior')) },
  { label: tContent('states.motionReduced.label'), trigger: toPlainText(tContent('states.motionReduced.trigger')), behavior: toPlainText(tContent('states.motionReduced.behavior')) },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const skeletonPropItems = computed(() => [
  { name: 'class',       type: tContent('props.table.className.type'),  defaultValue: tContent('props.table.className.default'),  required: tContent('props.table.className.required'),  description: toPlainText(tContent('props.table.className.description')) },
  { name: 'data-shape',  type: tContent('props.table.dataShape.type'),  defaultValue: tContent('props.table.dataShape.default'),  required: tContent('props.table.dataShape.required'),  description: toPlainText(tContent('props.table.dataShape.description')) },
  { name: 'data-width',  type: tContent('props.table.dataWidth.type'),  defaultValue: tContent('props.table.dataWidth.default'),  required: tContent('props.table.dataWidth.required'),  description: toPlainText(tContent('props.table.dataWidth.description')) },
  { name: 'data-size',   type: tContent('props.table.dataSize.type'),   defaultValue: tContent('props.table.dataSize.default'),   required: tContent('props.table.dataSize.required'),   description: toPlainText(tContent('props.table.dataSize.description')) },
  { name: 'aria-hidden', type: tContent('props.table.ariaHidden.type'), defaultValue: tContent('props.table.ariaHidden.default'), required: tContent('props.table.ariaHidden.required'), description: toPlainText(tContent('props.table.ariaHidden.description')) },
  { name: '...rest',     type: tContent('props.table.rest.type'),       defaultValue: tContent('props.table.rest.default'),       required: tContent('props.table.rest.required'),       description: toPlainText(tContent('props.table.rest.description')) },
]);

const tokenRows = computed(() =>
  ['background', 'rounded', 'animation', 'size', 'motionReduce'].map((k) => ({
    token: tContent(`tokens.table.${k}.token`),
    value: tContent(`tokens.table.${k}.class`),
    description: tContent(`tokens.table.${k}.part`),
  })),
);

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
  { name: tContent('related.items.progress.name'),    description: toPlainText(tContent('related.items.progress.description')),    path: '?path=/docs/components-feedback-progress--docs'     },
  { name: tContent('related.items.aspectRatio.name'), description: toPlainText(tContent('related.items.aspectRatio.description')), path: '?path=/docs/components-layout-aspectratio--docs'  },
  { name: tContent('related.items.card.name'),        description: toPlainText(tContent('related.items.card.description')),        path: '?path=/docs/components-layout-card--docs'         },
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
  { action: toPlainText(tContent('testes.functional.item1.action')), result: toPlainText(tContent('testes.functional.item1.result')), priority: localPriority(tContent('testes.functional.item1.priority')) },
  { action: toPlainText(tContent('testes.functional.item2.action')), result: toPlainText(tContent('testes.functional.item2.result')), priority: localPriority(tContent('testes.functional.item2.priority')) },
  { action: toPlainText(tContent('testes.functional.item3.action')), result: toPlainText(tContent('testes.functional.item3.result')), priority: localPriority(tContent('testes.functional.item3.priority')) },
  { action: toPlainText(tContent('testes.functional.item4.action')), result: toPlainText(tContent('testes.functional.item4.result')), priority: localPriority(tContent('testes.functional.item4.priority')) },
  { action: toPlainText(tContent('testes.functional.item5.action')), result: toPlainText(tContent('testes.functional.item5.result')), priority: localPriority(tContent('testes.functional.item5.priority')) },
]);

const a11yTestItems = computed(() => [
  { criterion: tContent('testes.accessibility.item1'), level: 'AA',    how: 'axe-core' },
  { criterion: tContent('testes.accessibility.item2'), level: '4.1.2', how: 'DevTools a11y tree' },
  { criterion: tContent('testes.accessibility.item3'), level: '4.1.2', how: 'DevTools a11y tree' },
  { criterion: tContent('testes.accessibility.item4'), level: '2.3.3', how: 'prefers-reduced-motion' },
  // Não é critério da WCAG: o esqueleto não transmite informação, então 1.4.3 e
  // 1.4.11 não se aplicam. O que se mede é luminância.
  { criterion: tContent('testes.accessibility.item5'), level: '—',     how: 'Medição de luminância' },
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
        style="--grid-min: 16rem"
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
            role="status"
            aria-busy="true"
            :aria-label="tContent('demonstration.labels.card')"
            class="nds-cluster nds-p-4 nds-border-default nds-rounded-md"
            data-spacing="md"
            data-align="center"
          >
            <Skeleton data-shape="avatar" />
            <div
              class="nds-stack nds-flex-1"
              data-spacing="sm"
            >
              <Skeleton
                data-shape="text"
                data-width="2-3"
              />
              <Skeleton
                data-shape="text"
                data-width="1-2"
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
            role="status"
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
                data-shape="avatar"
                data-size="sm"
              />
              <div
                class="nds-flex-1 nds-stack"
                data-spacing="xs"
              >
                <Skeleton
                  data-shape="text"
                  data-width="2-3"
                />
                <Skeleton
                  data-shape="text"
                  data-width="1-3"
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
            role="status"
            aria-busy="true"
            :aria-label="tContent('demonstration.labels.image')"
          >
            <AspectRatio :ratio="16 / 9">
              <Skeleton data-shape="fill" />
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
            role="status"
            aria-busy="true"
            :aria-label="tContent('demonstration.labels.paragraph')"
            class="nds-stack nds-p-4 nds-border-default nds-rounded-md"
            data-spacing="sm"
          >
            <Skeleton
              data-shape="text"
              data-width="full"
            />
            <Skeleton
              data-shape="text"
              data-width="3-4"
            />
            <Skeleton
              data-shape="text"
              data-width="1-2"
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
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair1.do')), dontCaption: toPlainText(tContent('doDont.pair1.dont')) },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair2.do')), dontCaption: toPlainText(tContent('doDont.pair2.dont')) },
      ]"
    >
      <template #do-preview-0>
        <div
          role="status"
          aria-busy="true"
          aria-label="Carregando texto"
          class="nds-w-full nds-stack"
          data-spacing="sm"
        >
          <Skeleton
            data-shape="heading"
            data-width="1-2"
          />
          <Skeleton
            data-shape="text"
            data-width="full"
          />
          <Skeleton
            data-shape="text"
            data-width="3-4"
          />
        </div>
      </template>
      <template #dont-preview-0>
        <div class="nds-w-full">
          <Skeleton
            data-shape="text"
            data-width="1-3"
          />
        </div>
      </template>
      <template #do-preview-1>
        <div
          role="status"
          aria-busy="true"
          aria-label="Carregando avatar e texto"
          class="nds-cluster nds-w-full"
          data-spacing="sm"
          data-align="center"
        >
          <Skeleton data-shape="avatar" />
          <div
            class="nds-stack nds-flex-1"
            data-spacing="xs"
          >
            <Skeleton
              data-shape="text"
              data-width="1-2"
            />
            <Skeleton
              data-shape="text"
              data-width="1-3"
            />
          </div>
        </div>
      </template>
      <template #dont-preview-1>
        <div
          class="nds-cluster nds-w-full"
          data-spacing="sm"
          data-align="center"
        >
          <Skeleton data-shape="avatar" />
          <div
            class="nds-stack nds-flex-1"
            data-spacing="xs"
          >
            <Skeleton
              data-shape="text"
              data-width="1-2"
            />
            <Skeleton
              data-shape="text"
              data-width="1-3"
            />
          </div>
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
          role="status"
          aria-busy="true"
          aria-label="Carregando bloco"
          class="nds-w-xs"
        >
          <Skeleton
            data-shape="fill"
            class="nds-docs-skeleton-media"
          />
        </div>
      </template>
      <template #variant-preview-1>
        <div
          role="status"
          aria-busy="true"
          aria-label="Carregando avatar"
        >
          <Skeleton data-shape="avatar" />
        </div>
      </template>
      <template #variant-preview-2>
        <div
          role="status"
          aria-busy="true"
          aria-label="Carregando linha de texto"
          class="nds-stack nds-w-xs"
          data-spacing="xs"
        >
          <Skeleton
            data-shape="text"
            data-width="3-4"
          />
          <Skeleton
            data-shape="text"
            data-width="1-2"
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
