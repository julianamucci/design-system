<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { Separator } from '@/components/ui/separator';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import separatorTranslations from '@shared/content/separator/translations.json';

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
const { t: tContent, locale } = useTranslation(separatorTranslations);

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
  componentSlug: 'separator',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'separator',
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
    component_name: 'separator',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import { Separator } from "@/components/ui/separator";`;

const codeHorizontal = `<Separator orientation="horizontal" />`;

const codeVertical = `<div class="flex h-5 items-center gap-3">
  <span>Início</span>
  <Separator orientation="vertical" />
  <span>Docs</span>
</div>`;

const codeCustomization = `/* Override de cor para tema customizado */
.theme-custom [data-slot='separator'] {
  background-color: hsl(var(--accent) / 0.4);
}`;

const interfaceCode = `// Separator
interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical'; // default: 'horizontal'
  decorative?: boolean;                    // default: true
  class?: string;
}`;

const anatomyStructure = computed(() => tContent('anatomy.structureCode'));

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
]);

const variantItems = computed(() => [
  { name: tContent('variants.items.horizontal'), description: stripHtml(tContent('variants.styles.horizontal')), code: codeHorizontal },
  { name: tContent('variants.items.vertical'),   description: stripHtml(tContent('variants.styles.vertical')),   code: codeVertical   },
]);

const stateItems = computed(() => [
  {
    label: tContent('states.items.decorative'),
    trigger: 'decorative={true}',
    behavior: stripHtml(tContent('states.descriptions.decorative')),
  },
  {
    label: tContent('states.items.semantic'),
    trigger: 'decorative={false}',
    behavior: stripHtml(tContent('states.descriptions.semantic')),
  },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const separatorPropItems = computed(() => [
  { name: 'orientation', type: tContent('props.table.orientation.type'),  defaultValue: tContent('props.table.orientation.default'),  required: tContent('props.table.orientation.required'),  description: stripHtml(tContent('props.table.orientation.description')) },
  { name: 'decorative',  type: tContent('props.table.decorative.type'),   defaultValue: tContent('props.table.decorative.default'),   required: tContent('props.table.decorative.required'),   description: stripHtml(tContent('props.table.decorative.description'))  },
  { name: 'class',       type: tContent('props.table.className.type'),    defaultValue: tContent('props.table.className.default'),    required: tContent('props.table.className.required'),    description: stripHtml(tContent('props.table.className.description'))    },
]);

const tokenRows = computed(() => [
  { token: '--border', value: tContent('tokens.table.background.class'),       description: tContent('tokens.table.background.part')       },
  { token: '—',        value: tContent('tokens.table.heightHorizontal.class'), description: tContent('tokens.table.heightHorizontal.part') },
  { token: '—',        value: tContent('tokens.table.widthHorizontal.class'),  description: tContent('tokens.table.widthHorizontal.part')  },
  { token: '—',        value: tContent('tokens.table.widthVertical.class'),    description: tContent('tokens.table.widthVertical.part')    },
  { token: '—',        value: tContent('tokens.table.heightVertical.class'),   description: tContent('tokens.table.heightVertical.part')   },
]);

const accessibilityItems = computed(() => [
  tContent('accessibility.items.item1'),
  tContent('accessibility.items.item2'),
  tContent('accessibility.items.item3'),
  tContent('accessibility.items.item4'),
  tContent('accessibility.items.item5'),
]);

const keyboardItems = computed(() => [
  { key: '—',   description: tContent('accessibility.keyboard.noKeyboard')  },
  { key: 'Tab', description: tContent('accessibility.keyboard.description') },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.card.name'),           description: tContent('related.items.card.description'),           path: '?path=/docs/ui-card--docs'           },
  { name: tContent('related.items.sheet.name'),          description: tContent('related.items.sheet.description'),          path: '?path=/docs/ui-sheet--docs'          },
  { name: tContent('related.items.sidebar.name'),        description: tContent('related.items.sidebar.description'),        path: '?path=/docs/ui-sidebar--docs'        },
  { name: tContent('related.items.navigationMenu.name'), description: tContent('related.items.navigationMenu.description'), path: '?path=/docs/ui-navigationmenu--docs' },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
]);

const analyticsItems = computed(() => [
  { event: '—', trigger: tContent('analytics.description'), payload: '—' },
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
  <DocsPageLayout :nav-groups="navGroups" :active-section="activeSection">
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
        install-note="npx shadcn-vue@latest add separator"
      />
    </template>

    <!-- ── Demonstração ───────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div class="space-y-2">
          <div class="rounded-md border p-4 space-y-3">
            <div class="text-sm font-medium">Header</div>
            <Separator orientation="horizontal" />
            <div class="text-xs text-muted-foreground">Conteúdo separado por divisor horizontal.</div>
          </div>
          <p class="text-xs text-muted-foreground">{{ tContent('demonstration.labels.horizontal') }}</p>
        </div>

        <div class="space-y-2">
          <div class="flex h-10 items-center gap-3 rounded-md border px-3 text-sm">
            <span>Início</span>
            <Separator orientation="vertical" />
            <span>Docs</span>
            <Separator orientation="vertical" />
            <span>Sobre</span>
          </div>
          <p class="text-xs text-muted-foreground">{{ tContent('demonstration.labels.vertical') }}</p>
        </div>

        <div class="space-y-2">
          <div class="rounded-md border p-3 space-y-2 text-sm">
            <div class="font-medium text-xs uppercase text-muted-foreground">Categoria A</div>
            <div>Item 1</div>
            <div>Item 2</div>
            <Separator orientation="horizontal" />
            <div class="font-medium text-xs uppercase text-muted-foreground">Categoria B</div>
            <div>Item 3</div>
            <div>Item 4</div>
          </div>
          <p class="text-xs text-muted-foreground">{{ tContent('demonstration.labels.inMenu') }}</p>
        </div>

        <div class="space-y-2">
          <div class="rounded-md border bg-card text-card-foreground">
            <div class="p-4 text-sm font-medium">Card title</div>
            <Separator orientation="horizontal" />
            <div class="p-4 text-sm text-muted-foreground">Conteúdo do card abaixo do separator.</div>
            <Separator orientation="horizontal" />
            <div class="p-4 text-xs text-muted-foreground">Footer do card.</div>
          </div>
          <p class="text-xs text-muted-foreground">{{ tContent('demonstration.labels.inCard') }}</p>
        </div>
      </div>
    </DocsDemonstration>

    <!-- ── Anatomia ───────────────────────────────────────────────── -->
    <DocsAnatomy
      :title="tContent('anatomy.title')"
      :items="anatomyItems"
      :structure-code="anatomyStructure"
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
        <div class="w-full rounded-md border p-3 space-y-2 text-sm">
          <div class="font-medium">Grupo A</div>
          <Separator orientation="horizontal" />
          <div class="font-medium">Grupo B</div>
        </div>
      </template>
      <template #dont-preview-0>
        <div class="w-full rounded-md border p-3 space-y-3 text-sm">
          <div>Item 1</div>
          <Separator orientation="horizontal" />
          <div>Item 2</div>
          <Separator orientation="horizontal" />
          <div>Item 3</div>
        </div>
      </template>
      <template #do-preview-1>
        <div class="flex h-10 w-full items-center gap-3 rounded-md border px-3 text-sm">
          <span>Início</span>
          <Separator orientation="vertical" />
          <span>Sobre</span>
        </div>
      </template>
      <template #dont-preview-1>
        <div class="w-full rounded-md border p-3 text-sm">
          <span>Início</span>
          <Separator orientation="vertical" />
          <span>Sobre</span>
        </div>
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :code="codeImportBasic"
    />

    <!-- ── Variantes ──────────────────────────────────────────────── -->
    <DocsVariants :title="tContent('variants.title')" :items="variantItems">
      <template #variant-preview-0>
        <div class="w-full space-y-3 text-sm">
          <div>Conteúdo acima</div>
          <Separator orientation="horizontal" />
          <div>Conteúdo abaixo</div>
        </div>
      </template>
      <template #variant-preview-1>
        <div class="flex h-10 w-full items-center gap-3 text-sm">
          <span>A</span>
          <Separator orientation="vertical" />
          <span>B</span>
          <Separator orientation="vertical" />
          <span>C</span>
        </div>
      </template>
    </DocsVariants>

    <!-- ── Estados ─────────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{
        state: tContent('props.table.prop'),
        trigger: tContent('usage.scenarios.cols.scenario'),
        behavior: tContent('usage.scenarios.cols.use'),
      }"
      :items="stateItems"
    />

    <!-- ── Propriedades ───────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: 'Separator', cols: propCols, items: separatorPropItems },
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
