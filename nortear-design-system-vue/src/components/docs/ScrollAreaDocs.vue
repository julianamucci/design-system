<script setup lang="ts">
import { computed, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import scrollAreaTranslations from '@shared/content/scroll-area/translations.json';

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
const { t: tContent, locale } = useTranslation(scrollAreaTranslations);

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
  componentSlug: 'scroll-area',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
  breadcrumb: [
    { name: 'Components', item: '/components' },
    { name: tContent('category'), item: '/components/layout' },
    { name: tContent('title') },
  ],
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'scroll-area',
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

const allSectionIds = computed(() => navGroups.value.flatMap((g) => g.sections.map((s) => s.id)));



const { activeId: activeSection } = useActiveSection(allSectionIds, (id) => {
  track('docs_section_viewed', {
    section_id: id,
    component_name: 'scroll-area',
    locale: locale.value,
  });
});
// ─── Demo data ────────────────────────────────────────────────────────────────

const verticalTags = Array.from({ length: 30 }, (_, i) => `Tag ${i + 1}`);
const horizontalCards = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, title: `Card ${i + 1}` }));
const matrixCols = Array.from({ length: 10 }, (_, i) => `C${i + 1}`);
const matrixRows = Array.from({ length: 12 }, (_, i) => `R${i + 1}`);

// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";`;

const codeVertical = `<div class="nds-overflow-hidden nds-rounded-md nds-border-default" style="height: 300px; width: 280px">
  <ScrollArea class="nds-w-full" style="height: 100%">
    <div class="nds-p-4">
      <div v-for="tag in tags" :key="tag" class="nds-text-body">{{ tag }}</div>
    </div>
  </ScrollArea>
</div>`;

const codeHorizontal = `<div class="nds-overflow-hidden nds-rounded-md nds-border-default" style="width: 500px; height: 180px">
  <ScrollArea class="nds-w-full nds-whitespace-nowrap" style="height: 100%">
    <div class="nds-cluster nds-p-4" data-spacing="md" style="width: max-content">
      <figure v-for="card in cards" :key="card.id" class="nds-shrink-0 nds-rounded-md nds-border-default nds-p-4" style="width: 160px">
        {{ card.title }}
      </figure>
    </div>
    <ScrollBar orientation="horizontal" />
  </ScrollArea>
</div>`;

const codeBoth = `<div class="nds-overflow-hidden nds-rounded-md nds-border-default" style="width: 500px; height: 280px">
  <ScrollArea class="nds-w-full" style="height: 100%">
    <table class="nds-border-collapse">
      <!-- linhas/colunas que excedem o viewport -->
    </table>
    <ScrollBar orientation="horizontal" />
  </ScrollArea>
</div>`;

const codeCustomizationTokens = `/* Espessura customizada da scrollbar */
[data-slot="scroll-area-scrollbar"] {
  --scrollbar-size: 8px;
}
[data-slot="scroll-area-scrollbar"][data-orientation="vertical"] {
  width: var(--scrollbar-size);
}
[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"] {
  height: var(--scrollbar-size);
}`;

const interfaceCode = `// ScrollArea — props principais (reka-ui ScrollAreaRoot)
interface ScrollAreaProps {
  type?: 'auto' | 'always' | 'scroll' | 'hover'; // default 'hover'
  scrollHideDelay?: number; // default 600
  dir?: 'ltr' | 'rtl';
  class?: string;
}

// ScrollBar
interface ScrollBarProps {
  orientation?: 'vertical' | 'horizontal'; // default 'vertical'
  class?: string;
}`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
  tContent('anatomy.item4'),
  tContent('anatomy.item5'),
]);

const variantItems = computed(() => [
  { name: tContent('variants.items.vertical'),   description: stripHtml(tContent('variants.styles.vertical')),   code: codeVertical   },
  { name: tContent('variants.items.horizontal'), description: stripHtml(tContent('variants.styles.horizontal')), code: codeHorizontal },
  { name: tContent('variants.items.both'),       description: stripHtml(tContent('variants.styles.both')),       code: codeBoth       },
]);

const stateItems = computed(() => [
  { label: tContent('states.idle.label'),      trigger: tContent('states.idle.trigger'),      behavior: stripHtml(tContent('states.idle.behavior')) },
  { label: tContent('states.scrolling.label'), trigger: tContent('states.scrolling.trigger'), behavior: stripHtml(tContent('states.scrolling.behavior')) },
  { label: tContent('states.hover.label'),     trigger: tContent('states.hover.trigger'),     behavior: stripHtml(tContent('states.hover.behavior')) },
  { label: tContent('states.focus.label'),     trigger: tContent('states.focus.trigger'),     behavior: stripHtml(tContent('states.focus.behavior')) },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const scrollAreaPropItems = computed(() => [
  { name: 'type',            type: tContent('props.table.type_prop.type'),        defaultValue: tContent('props.table.type_prop.default'),        required: tContent('props.table.type_prop.required'),        description: stripHtml(tContent('props.table.type_prop.description'))        },
  { name: 'scrollHideDelay', type: tContent('props.table.scrollHideDelay.type'),  defaultValue: tContent('props.table.scrollHideDelay.default'),  required: tContent('props.table.scrollHideDelay.required'),  description: stripHtml(tContent('props.table.scrollHideDelay.description'))  },
  { name: 'class',           type: tContent('props.table.className.type'),        defaultValue: tContent('props.table.className.default'),        required: tContent('props.table.className.required'),        description: stripHtml(tContent('props.table.className.description'))        },
  { name: 'slot:default',    type: tContent('props.table.children.type'),         defaultValue: tContent('props.table.children.default'),         required: tContent('props.table.children.required'),         description: stripHtml(tContent('props.table.children.description'))         },
]);

const scrollBarPropItems = computed(() => [
  { name: 'orientation', type: tContent('props.table.orientation.type'), defaultValue: tContent('props.table.orientation.default'), required: tContent('props.table.orientation.required'), description: stripHtml(tContent('props.table.orientation.description')) },
  { name: 'class',       type: tContent('props.table.className.type'),   defaultValue: tContent('props.table.className.default'),   required: tContent('props.table.className.required'),   description: stripHtml(tContent('props.table.className.description'))   },
]);

const tokenRows = computed(() => [
  { token: '--border',                 value: tContent('tokens.table.border.class'),     description: tContent('tokens.table.border.part')     },
  { token: '--ring',                   value: tContent('tokens.table.ring.class'),       description: tContent('tokens.table.ring.part')       },
  { token: '--background',             value: tContent('tokens.table.background.class'), description: tContent('tokens.table.background.part') },
  { token: '--foreground',             value: tContent('tokens.table.foreground.class'), description: tContent('tokens.table.foreground.part') },
  { token: '--muted',                  value: tContent('tokens.table.muted.class'),      description: tContent('tokens.table.muted.part')      },
  { token: '--ring-offset-background', value: tContent('tokens.table.ringOffset.class'), description: tContent('tokens.table.ringOffset.part') },
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
  { key: 'Tab',        description: tContent('accessibility.keyboard.tab')        },
  { key: 'ArrowDown',  description: tContent('accessibility.keyboard.arrowDown')  },
  { key: 'ArrowUp',    description: tContent('accessibility.keyboard.arrowUp')    },
  { key: 'ArrowRight', description: tContent('accessibility.keyboard.arrowRight') },
  { key: 'ArrowLeft',  description: tContent('accessibility.keyboard.arrowLeft')  },
  { key: 'PageDown',   description: tContent('accessibility.keyboard.pageDown')   },
  { key: 'PageUp',     description: tContent('accessibility.keyboard.pageUp')     },
  { key: 'Home',       description: tContent('accessibility.keyboard.home')       },
  { key: 'End',        description: tContent('accessibility.keyboard.end')        },
]);

const relatedItems = computed(() => [
  { name: 'Resizable', description: tContent('related.items.resizable.description'), path: '?path=/docs/ui-resizable--docs' },
  { name: 'Sheet',     description: tContent('related.items.sheet.description'),     path: '?path=/docs/ui-sheet--docs'     },
  { name: 'Dialog',    description: tContent('related.items.dialog.description'),    path: '?path=/docs/ui-dialog--docs'    },
  { name: 'Command',   description: tContent('related.items.command.description'),   path: '?path=/docs/ui-command--docs'   },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
]);

const analyticsItems = computed(() => [
  { event: 'content_scroll', trigger: tContent('analytics.table.content_scroll.trigger'), payload: tContent('analytics.table.content_scroll.payload') },
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
  { criterion: tContent('testes.accessibility.item1'), level: '4.1.2',  how: tContent('testes.accessibility.description') },
  { criterion: tContent('testes.accessibility.item2'), level: '1.4.11', how: tContent('testes.accessibility.description') },
  { criterion: tContent('testes.accessibility.item3'), level: '2.4.7',  how: tContent('testes.accessibility.description') },
  { criterion: tContent('testes.accessibility.item4'), level: '2.1.1',  how: tContent('testes.accessibility.description') },
  { criterion: tContent('testes.accessibility.item5'), level: '1.4.10', how: tContent('testes.accessibility.description') },
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
        class="nds-stack nds-w-full"
        data-spacing="md"
      >
        <div
          class="nds-grid"
          data-cols="2"
        >
          <div>
            <p class="nds-mb-2 nds-text-caption nds-font-medium nds-text-muted-foreground">
              {{ tContent('demonstration.labels.verticalTitle') }}
            </p>
            <div
              class="nds-w-full nds-overflow-hidden nds-rounded-md nds-border-default"
              style="height: 260px"
            >
              <ScrollArea
                class="nds-w-full"
                style="height: 100%"
              >
                <div
                  class="nds-stack nds-p-4"
                  data-spacing="sm"
                >
                  <div
                    v-for="tag in verticalTags"
                    :key="tag"
                    class="nds-text-body nds-rounded-sm nds-border-default nds-px-2"
                    style="padding-block: 0.375rem"
                  >
                    {{ tag }}
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>
          <div>
            <p class="nds-mb-2 nds-text-caption nds-font-medium nds-text-muted-foreground">
              {{ tContent('demonstration.labels.horizontalTitle') }}
            </p>
            <div
              class="nds-w-full nds-overflow-hidden nds-rounded-md nds-border-default"
              style="height: 180px"
            >
              <ScrollArea
                class="nds-w-full nds-whitespace-nowrap"
                style="height: 100%"
              >
                <div
                  class="nds-cluster nds-p-4"
                  data-spacing="sm"
                  style="width: max-content"
                >
                  <figure
                    v-for="card in horizontalCards"
                    :key="card.id"
                    class="nds-shrink-0 nds-rounded-md nds-border-default nds-bg-muted"
                    style="width: 140px; padding: 0.75rem"
                  >
                    <div class="nds-text-body nds-font-medium">
                      {{ card.title }}
                    </div>
                  </figure>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </div>
        </div>
        <div>
          <p class="nds-mb-2 nds-text-caption nds-font-medium nds-text-muted-foreground">
            {{ tContent('demonstration.labels.bothTitle') }}
          </p>
          <div
            class="nds-w-full nds-overflow-hidden nds-rounded-md nds-border-default"
            style="height: 260px"
          >
            <ScrollArea
              class="nds-w-full"
              style="height: 100%"
            >
              <table class="nds-border-collapse nds-text-body">
                <thead>
                  <tr>
                    <th
                      class="nds-bg-background nds-border-default"
                      style="position: sticky; top: 0; z-index: 10; padding: 0.5rem 0.75rem; text-align: left"
                    >
                      #
                    </th>
                    <th
                      v-for="col in matrixCols"
                      :key="col"
                      class="nds-bg-background nds-border-default nds-whitespace-nowrap"
                      style="position: sticky; top: 0; z-index: 10; padding: 0.5rem 0.75rem; text-align: left"
                    >
                      {{ col }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in matrixRows"
                    :key="row"
                  >
                    <th
                      class="nds-border-default nds-whitespace-nowrap nds-bg-muted"
                      style="padding: 0.5rem 0.75rem; text-align: left"
                    >
                      {{ row }}
                    </th>
                    <td
                      v-for="col in matrixCols"
                      :key="col"
                      class="nds-border-default nds-whitespace-nowrap"
                      style="padding: 0.5rem 0.75rem"
                    >
                      {{ row }}-{{ col }}
                    </td>
                  </tr>
                </tbody>
              </table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
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
          { element: tContent('usage.uxWriting.table.container.name'), rules: tContent('usage.uxWriting.table.container.format'), do: tContent('usage.uxWriting.table.container.good'), dont: tContent('usage.uxWriting.table.container.bad') },
          { element: tContent('usage.uxWriting.table.scrollArea.name'), rules: tContent('usage.uxWriting.table.scrollArea.format'), do: tContent('usage.uxWriting.table.scrollArea.good'), dont: tContent('usage.uxWriting.table.scrollArea.bad') },
          { element: tContent('usage.uxWriting.table.orientation.name'), rules: tContent('usage.uxWriting.table.orientation.format'), do: tContent('usage.uxWriting.table.orientation.good'), dont: tContent('usage.uxWriting.table.orientation.bad') },
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
          class="nds-w-full nds-overflow-hidden nds-rounded-md nds-border-default"
          style="height: 180px"
        >
          <ScrollArea
            class="nds-w-full"
            style="height: 100%"
          >
            <div
              class="nds-stack"
              data-spacing="sm"
              style="padding: 0.75rem"
            >
              <div
                v-for="i in 18"
                :key="i"
                class="nds-text-caption nds-rounded-sm nds-border-default nds-px-2 nds-py-1"
              >
                Item {{ i }}
              </div>
            </div>
          </ScrollArea>
        </div>
      </template>
      <template #dont-preview-0>
        <div
          class="nds-w-full nds-rounded-md nds-border-default nds-stack"
          data-spacing="sm"
          style="padding: 0.75rem"
        >
          <div
            v-for="i in 6"
            :key="i"
            class="nds-text-caption nds-rounded-sm nds-border-default nds-px-2 nds-py-1"
          >
            Item {{ i }}
          </div>
          <p
            class="nds-text-muted-foreground"
            style="font-size: 10px"
          >
            Sem altura — conteúdo expande
          </p>
        </div>
      </template>
      <template #do-preview-1>
        <div
          class="nds-w-full nds-overflow-hidden nds-rounded-md nds-border-default"
          style="height: 180px"
        >
          <ScrollArea
            class="nds-w-full"
            style="height: 100%"
          >
            <div
              class="nds-stack"
              data-spacing="sm"
              style="padding: 0.75rem"
            >
              <div
                v-for="i in 14"
                :key="i"
                class="nds-text-caption nds-rounded-sm nds-border-default nds-px-2 nds-py-1"
              >
                Item {{ i }}
              </div>
            </div>
          </ScrollArea>
        </div>
      </template>
      <template #dont-preview-1>
        <div
          class="nds-w-full nds-overflow-hidden nds-rounded-md nds-border-default"
          style="height: 180px"
        >
          <ScrollArea
            class="nds-w-full"
            style="height: 100%"
          >
            <ScrollArea
              class="nds-w-full"
              style="height: 100px"
            >
              <div
                class="nds-stack"
                data-spacing="sm"
                style="padding: 0.75rem"
              >
                <div
                  v-for="i in 10"
                  :key="i"
                  class="nds-text-caption nds-rounded-sm nds-border-default nds-px-2 nds-py-1"
                >
                  Item {{ i }}
                </div>
              </div>
            </ScrollArea>
          </ScrollArea>
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
          class="nds-overflow-hidden nds-rounded-md nds-border-default"
          style="height: 200px; width: 260px"
        >
          <ScrollArea
            class="nds-w-full"
            style="height: 100%"
          >
            <div
              class="nds-stack"
              data-spacing="sm"
              style="padding: 0.75rem"
            >
              <div
                v-for="i in 20"
                :key="i"
                class="nds-text-caption nds-rounded-sm nds-border-default nds-px-2 nds-py-1"
              >
                {{ tContent('demonstration.labels.tag') }} {{ i }}
              </div>
            </div>
          </ScrollArea>
        </div>
      </template>
      <template #variant-preview-1>
        <div
          class="nds-overflow-hidden nds-rounded-md nds-border-default"
          style="height: 140px; width: 420px"
        >
          <ScrollArea
            class="nds-w-full nds-whitespace-nowrap"
            style="height: 100%"
          >
            <div
              class="nds-cluster"
              data-spacing="sm"
              style="width: max-content; padding: 0.75rem"
            >
              <figure
                v-for="i in 10"
                :key="i"
                class="nds-shrink-0 nds-rounded-md nds-border-default nds-bg-muted nds-text-caption"
                style="width: 120px; padding: 0.75rem"
              >
                Card {{ i }}
              </figure>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </template>
      <template #variant-preview-2>
        <div
          class="nds-overflow-hidden nds-rounded-md nds-border-default"
          style="height: 200px; width: 420px"
        >
          <ScrollArea
            class="nds-w-full"
            style="height: 100%"
          >
            <table class="nds-border-collapse nds-text-caption">
              <tbody>
                <tr
                  v-for="r in 12"
                  :key="r"
                >
                  <td
                    v-for="c in 10"
                    :key="c"
                    class="nds-border-default nds-whitespace-nowrap"
                    style="padding: 0.375rem 0.75rem"
                  >
                    R{{ r }}-C{{ c }}
                  </td>
                </tr>
              </tbody>
            </table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </template>
    </DocsVariants>

    <!-- ── Estados ──────────────────────────────────────────────── -->
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
        { title: 'ScrollArea', cols: propCols, items: scrollAreaPropItems },
        { title: 'ScrollBar', cols: propCols, items: scrollBarPropItems },
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
      :customization-code="codeCustomizationTokens"
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
