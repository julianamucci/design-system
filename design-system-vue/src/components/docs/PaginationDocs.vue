<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import componentTranslations from '@shared/content/pagination/translations.json';

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

const { t: tContent, locale } = useTranslation(componentTranslations);
const { t: tNav } = useTranslation(uiTranslations);

// ─── Locale-aware column labels ───────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

const priorityKeyMap: Record<string, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

function localPriority(raw: string): string {
  return priorityKeyMap[raw] ?? raw;
}

// ─── SEO & GEO ────────────────────────────────────────────────────────────────

useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: 'pagination',
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
    component_name: 'pagination',
    locale: newLocale as 'pt-BR' | 'en' | 'es',
    page_title: `${tContent('title')} · Design System`,
  });
}, { immediate: true });

// ─── Analytics — section view ─────────────────────────────────────────────────

// ─── Navigation groups ────────────────────────────────────────────────────────

const navGroups = computed(() => [
  {
    label: tContent('nav.overview'),
    sections: [
      { id: 'demonstracao', label: tContent('nav.demonstration') },
      { id: 'anatomia',     label: tContent('nav.anatomy')       },
      { id: 'quando-usar',  label: tContent('nav.usage')         },
      { id: 'do-dont',      label: tContent('nav.doDont')        },
    ],
  },
  {
    label: tContent('nav.techRef'),
    sections: [
      { id: 'importacao',   label: tContent('nav.import')   },
      { id: 'variantes',    label: tContent('nav.variants') },
      { id: 'composicoes',  label: tNav('nav.compositions') },
      { id: 'estados',      label: tContent('nav.states')   },
      { id: 'propriedades', label: tContent('nav.props')    },
      { id: 'tokens',       label: tContent('nav.tokens')   },
    ],
  },
  {
    label: tContent('nav.context'),
    sections: [
      { id: 'acessibilidade', label: tContent('nav.accessibility') },
      { id: 'relacionados',   label: tContent('nav.related')       },
      { id: 'notas',          label: tContent('nav.notes')         },
    ],
  },
  {
    label: tContent('nav.quality'),
    sections: [
      { id: 'analytics', label: tContent('nav.analytics') },
      { id: 'testes',    label: tContent('nav.testes')    },
    ],
  },
]);

const allSectionIds = computed(() => navGroups.value.flatMap((g) => g.sections.map((s) => s.id)));



const { activeId: activeSection } = useActiveSection(allSectionIds, (id) => {
  track('docs_section_viewed', {
    section_id: id,
    component_name: 'pagination',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";`;

const codeDefault = `<Pagination :total="50" :items-per-page="10" :default-page="1">
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink :is-active="true">1</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink>2</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink>3</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationNext />
    </PaginationItem>
  </PaginationContent>
</Pagination>`;

const codeActive = `<PaginationLink :is-active="page === current" :aria-label="\`Ir para página \${page}\`">
  {{ page }}
</PaginationLink>`;

const codeDirectional = `<PaginationPrevious />
<PaginationNext />`;

const codeWithEllipsis = `<Pagination :total="120" :items-per-page="10" :default-page="6" :sibling-count="1">
  <PaginationContent>
    <PaginationItem><PaginationPrevious /></PaginationItem>
    <PaginationItem><PaginationLink>1</PaginationLink></PaginationItem>
    <PaginationItem><PaginationEllipsis /></PaginationItem>
    <PaginationItem><PaginationLink>5</PaginationLink></PaginationItem>
    <PaginationItem><PaginationLink :is-active="true">6</PaginationLink></PaginationItem>
    <PaginationItem><PaginationLink>7</PaginationLink></PaginationItem>
    <PaginationItem><PaginationEllipsis /></PaginationItem>
    <PaginationItem><PaginationLink>12</PaginationLink></PaginationItem>
    <PaginationItem><PaginationNext /></PaginationItem>
  </PaginationContent>
</Pagination>`;

const interfaceCode = `// Pagination (root) — herda PaginationRootProps de reka-ui
interface PaginationProps {
  total: number;             // total de itens
  itemsPerPage: number;      // itens por página
  defaultPage?: number;      // página inicial (não-controlada)
  page?: number;             // página atual (controlada)
  siblingCount?: number;     // páginas vizinhas à atual (default 2)
  showEdges?: boolean;       // sempre mostra primeira/última
  disabled?: boolean;
  class?: string;
}

// PaginationLink
interface PaginationLinkProps {
  href?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';   // default 'icon'
  isActive?: boolean;                        // default false
  class?: string;
}

// PaginationPrevious / PaginationNext
interface PaginationDirectionalProps {
  size?: 'default' | 'sm' | 'lg' | 'icon';   // default 'default'
  class?: string;
}`;

const codeCustomizationTokens = `/* Override via CSS variables no escopo do componente */
[data-slot="pagination"] {
  --primary: 220 90% 50%;
}`;

// ─── Interactive composition state ────────────────────────────────────────────

const compInteractiveCurrent = ref(3);

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
  tContent('anatomy.item4'),
  tContent('anatomy.item5'),
  tContent('anatomy.item6'),
]);

const variantItems = computed(() => [
  { name: tContent('variants.items.default'),     description: stripHtml(tContent('variants.styles.default')),     code: codeDefault     },
  { name: tContent('variants.items.active'),      description: stripHtml(tContent('variants.styles.active')),      code: codeActive      },
  { name: tContent('variants.items.directional'), description: stripHtml(tContent('variants.styles.directional')), code: codeDirectional },
]);

const codeCompSimple = `<Pagination :total="50" :items-per-page="10" :default-page="1">
  <PaginationContent>
    <PaginationItem><PaginationPrevious /></PaginationItem>
    <PaginationItem><PaginationLink :is-active="true">1</PaginationLink></PaginationItem>
    <PaginationItem><PaginationLink>2</PaginationLink></PaginationItem>
    <PaginationItem><PaginationLink>3</PaginationLink></PaginationItem>
    <PaginationItem><PaginationLink>4</PaginationLink></PaginationItem>
    <PaginationItem><PaginationLink>5</PaginationLink></PaginationItem>
    <PaginationItem><PaginationNext /></PaginationItem>
  </PaginationContent>
</Pagination>`;

const codeCompEllipsis = `<Pagination :total="120" :items-per-page="10" :default-page="6">
  <PaginationContent>
    <PaginationItem><PaginationPrevious /></PaginationItem>
    <PaginationItem><PaginationLink>1</PaginationLink></PaginationItem>
    <PaginationItem><PaginationEllipsis /></PaginationItem>
    <PaginationItem><PaginationLink>5</PaginationLink></PaginationItem>
    <PaginationItem><PaginationLink :is-active="true">6</PaginationLink></PaginationItem>
    <PaginationItem><PaginationLink>7</PaginationLink></PaginationItem>
    <PaginationItem><PaginationEllipsis /></PaginationItem>
    <PaginationItem><PaginationLink>12</PaginationLink></PaginationItem>
    <PaginationItem><PaginationNext /></PaginationItem>
  </PaginationContent>
</Pagination>`;

const codeCompLastPage = `<Pagination :total="100" :items-per-page="10" :default-page="10">
  <PaginationContent>
    <PaginationItem><PaginationPrevious /></PaginationItem>
    <PaginationItem><PaginationLink>1</PaginationLink></PaginationItem>
    <PaginationItem><PaginationEllipsis /></PaginationItem>
    <PaginationItem><PaginationLink>9</PaginationLink></PaginationItem>
    <PaginationItem><PaginationLink :is-active="true">10</PaginationLink></PaginationItem>
    <PaginationItem><PaginationNext aria-disabled="true" /></PaginationItem>
  </PaginationContent>
</Pagination>`;

const codeCompInteractive = `const current = ref(3);

<Pagination :total="80" :items-per-page="10" :page="current">
  <PaginationContent>
    <PaginationItem v-for="n in 8" :key="n">
      <PaginationLink :is-active="n === current" @click="current = n">
        {{ n }}
      </PaginationLink>
    </PaginationItem>
  </PaginationContent>
</Pagination>
<p>Página {{ current }} de 8</p>`;

const compositionItems = computed(() => [
  { name: tContent('variants.compositions.simple.name'),       description: stripHtml(tContent('variants.compositions.simple.description')),       useWhen: tContent('variants.compositions.simple.use'),       code: codeCompSimple      },
  { name: tContent('variants.compositions.withEllipsis.name'), description: stripHtml(tContent('variants.compositions.withEllipsis.description')), useWhen: tContent('variants.compositions.withEllipsis.use'), code: codeCompEllipsis    },
  { name: tContent('variants.compositions.lastPage.name'),     description: stripHtml(tContent('variants.compositions.lastPage.description')),     useWhen: tContent('variants.compositions.lastPage.use'),     code: codeCompLastPage    },
  { name: tContent('variants.compositions.interactive.name'),  description: stripHtml(tContent('variants.compositions.interactive.description')),  useWhen: tContent('variants.compositions.interactive.use'),  code: codeCompInteractive },
]);

const stateItems = computed(() => [
  { label: tContent('states.items.default'),  trigger: '—',                 behavior: stripHtml(tContent('states.descriptions.default'))  },
  { label: tContent('states.items.hover'),    trigger: 'pointer hover',     behavior: stripHtml(tContent('states.descriptions.hover'))    },
  { label: tContent('states.items.active'),   trigger: 'isActive',          behavior: stripHtml(tContent('states.descriptions.active'))   },
  { label: tContent('states.items.disabled'), trigger: 'first/last page',   behavior: stripHtml(tContent('states.descriptions.disabled')) },
  { label: tContent('states.items.focus'),    trigger: 'Tab',               behavior: stripHtml(tContent('states.descriptions.focus'))    },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const linkPropItems = computed(() => [
  { name: 'isActive',  type: tContent('props.table.isActive.type'),  defaultValue: tContent('props.table.isActive.default'),  required: tContent('props.table.isActive.required'),  description: stripHtml(tContent('props.table.isActive.description'))  },
  { name: 'size',      type: tContent('props.table.size.type'),      defaultValue: tContent('props.table.size.default'),      required: tContent('props.table.size.required'),      description: stripHtml(tContent('props.table.size.description'))      },
  { name: 'href',      type: 'string',                                defaultValue: '—',                                       required: 'Não',                                        description: 'URL do link. Em SPA pode ser omitido — o componente dispara onClick.' },
  { name: 'class',     type: tContent('props.table.className.type'), defaultValue: tContent('props.table.className.default'), required: tContent('props.table.className.required'), description: stripHtml(tContent('props.table.className.description')) },
]);

const directionalPropItems = computed(() => [
  { name: 'text',  type: tContent('props.table.text.type'),  defaultValue: tContent('props.table.text.default'),  required: tContent('props.table.text.required'),  description: stripHtml(tContent('props.table.text.description'))  },
  { name: 'size',  type: tContent('props.table.size.type'),  defaultValue: '"default"',                            required: tContent('props.table.size.required'),  description: stripHtml(tContent('props.table.size.description'))  },
  { name: 'class', type: tContent('props.table.className.type'), defaultValue: tContent('props.table.className.default'), required: tContent('props.table.className.required'), description: stripHtml(tContent('props.table.className.description')) },
]);

const tokenRows = computed(() => [
  { token: '--background',         value: tContent('tokens.table.background.class'),        description: tContent('tokens.table.background.part')        },
  { token: '--foreground',         value: tContent('tokens.table.foreground.class'),        description: tContent('tokens.table.foreground.part')        },
  { token: '--accent',             value: tContent('tokens.table.accent.class'),            description: tContent('tokens.table.accent.part')            },
  { token: '--accent-foreground',  value: tContent('tokens.table.accentForeground.class'),  description: tContent('tokens.table.accentForeground.part')  },
  { token: '--border',             value: tContent('tokens.table.border.class'),            description: tContent('tokens.table.border.part')            },
  { token: '--ring',               value: tContent('tokens.table.ring.class'),              description: tContent('tokens.table.ring.part')              },
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
  { key: 'Tab',        description: tContent('accessibility.keyboard.tab')      },
  { key: 'Shift+Tab',  description: tContent('accessibility.keyboard.shiftTab') },
  { key: 'Enter',      description: tContent('accessibility.keyboard.enter')    },
  { key: 'Space',      description: tContent('accessibility.keyboard.space')    },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.breadcrumb.name'), description: tContent('related.items.breadcrumb.description'), path: '?path=/docs/ui-breadcrumb--docs' },
  { name: tContent('related.items.tabs.name'),       description: tContent('related.items.tabs.description'),       path: '?path=/docs/ui-tabs--docs'       },
  { name: tContent('related.items.button.name'),     description: tContent('related.items.button.description'),     path: '?path=/docs/ui-button--docs'     },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
]);

const analyticsItems = computed(() => [
  {
    event: 'page_change',
    trigger: tContent('analytics.table.page_change.trigger'),
    payload: tContent('analytics.table.page_change.payload'),
  },
]);

const functionalTestItems = computed(() => [1, 2, 3, 4].map((i) => ({
  action: stripHtml(tContent(`testes.functional.item${i}.action`)),
  result: stripHtml(tContent(`testes.functional.item${i}.result`)),
  priority: localPriority(tContent(`testes.functional.item${i}.priority`)),
})));

const a11yTestItems = computed(() => [
  { criterion: tContent('testes.accessibility.item1'), level: 'AA',    how: 'axe-core'         },
  { criterion: tContent('testes.accessibility.item2'), level: '1.4.3', how: 'Contrast checker' },
  { criterion: tContent('testes.accessibility.item3'), level: '2.4.7', how: 'Manual review'    },
  { criterion: tContent('testes.accessibility.item4'), level: '4.1.2', how: 'DevTools attribute' },
  { criterion: tContent('testes.accessibility.item5'), level: '4.1.2', how: 'DevTools attribute' },
]);

const visualTestItems = computed(() => [1, 2, 3, 4].map((i) => ({
  story: tContent(`testes.visual.item${i}.story`),
  priority: localPriority(tContent(`testes.visual.item${i}.priority`)),
})));

const a11yCritCols = computed(() => ({
  criterion: 'Critério',
  level: 'WCAG',
  how: 'Como verificar',
}));
</script>

<template>
  <DocsPageLayout :nav-groups="navGroups" :active-section="activeSection" component-slug="pagination">
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
        install-note="npx shadcn-vue@latest add pagination"
      />
    </template>

    <!-- ── Demonstração ─────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div class="w-full space-y-6">
        <Pagination :total="50" :items-per-page="10" :default-page="1">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious>
                <span class="hidden sm:block">{{ tContent('demonstration.labels.previous') }}</span>
              </PaginationPrevious>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink :is-active="true" :aria-label="`${tContent('demonstration.labels.page')} 1`">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink :aria-label="`${tContent('demonstration.labels.page')} 2`">2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink :aria-label="`${tContent('demonstration.labels.page')} 3`">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink :aria-label="`${tContent('demonstration.labels.page')} 4`">4</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink :aria-label="`${tContent('demonstration.labels.page')} 5`">5</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext>
                <span class="hidden sm:block">{{ tContent('demonstration.labels.next') }}</span>
              </PaginationNext>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </DocsDemonstration>

    <!-- ── Anatomia ─────────────────────────────────────────────── -->
    <DocsAnatomy
      :title="tContent('anatomy.title')"
      :items="anatomyItems"
      :structure-label="tContent('anatomy.structureLabel')"
      :structure-code="tContent('anatomy.structureCode')"
    />

    <!-- ── Quando Usar ──────────────────────────────────────────── -->
    <DocsWhenToUse
      :title="tContent('usage.title')"
      :guidelines="{
        title: tContent('usage.guidelines.title'),
        items: [
          stripHtml(tContent('usage.guidelines.item1')),
          stripHtml(tContent('usage.guidelines.item2')),
          stripHtml(tContent('usage.guidelines.item3')),
          stripHtml(tContent('usage.guidelines.item4')),
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
          { element: tContent('usage.uxWriting.table.previous.name'), rules: tContent('usage.uxWriting.table.previous.format'), do: tContent('usage.uxWriting.table.previous.good'), dont: tContent('usage.uxWriting.table.previous.bad') },
          { element: tContent('usage.uxWriting.table.next.name'),     rules: tContent('usage.uxWriting.table.next.format'),     do: tContent('usage.uxWriting.table.next.good'),     dont: tContent('usage.uxWriting.table.next.bad')     },
          { element: tContent('usage.uxWriting.table.page.name'),     rules: tContent('usage.uxWriting.table.page.format'),     do: tContent('usage.uxWriting.table.page.good'),     dont: tContent('usage.uxWriting.table.page.bad')     },
          { element: tContent('usage.uxWriting.table.ellipsis.name'), rules: tContent('usage.uxWriting.table.ellipsis.format'), do: tContent('usage.uxWriting.table.ellipsis.good'), dont: tContent('usage.uxWriting.table.ellipsis.bad') },
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
          stripHtml(tContent('usage.dont.item1')),
          stripHtml(tContent('usage.dont.item2')),
          stripHtml(tContent('usage.dont.item3')),
          stripHtml(tContent('usage.dont.item4')),
        ],
      }"
    />

    <!-- ── Do & Don't ───────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="[
        { doLabel: 'Faça', dontLabel: 'Evite', doCaption: tContent('doDont.pair1.do'), dontCaption: tContent('doDont.pair1.dont') },
        { doLabel: 'Faça', dontLabel: 'Evite', doCaption: tContent('doDont.pair2.do'), dontCaption: tContent('doDont.pair2.dont') },
      ]"
    >
      <template #do-preview-0>
        <Pagination :total="120" :items-per-page="10" :default-page="6" class="w-full">
          <PaginationContent>
            <PaginationItem><PaginationPrevious /></PaginationItem>
            <PaginationItem><PaginationLink :aria-label="`Ir para página 1`">1</PaginationLink></PaginationItem>
            <PaginationItem><PaginationEllipsis /></PaginationItem>
            <PaginationItem><PaginationLink :aria-label="`Ir para página 5`">5</PaginationLink></PaginationItem>
            <PaginationItem><PaginationLink :is-active="true" :aria-label="`Página atual, 6`">6</PaginationLink></PaginationItem>
            <PaginationItem><PaginationLink :aria-label="`Ir para página 7`">7</PaginationLink></PaginationItem>
            <PaginationItem><PaginationEllipsis /></PaginationItem>
            <PaginationItem><PaginationLink :aria-label="`Ir para página 12`">12</PaginationLink></PaginationItem>
            <PaginationItem><PaginationNext /></PaginationItem>
          </PaginationContent>
        </Pagination>
      </template>
      <template #dont-preview-0>
        <Pagination :total="120" :items-per-page="10" :default-page="6" class="w-full">
          <PaginationContent>
            <PaginationItem><PaginationPrevious /></PaginationItem>
            <PaginationItem v-for="n in 12" :key="n">
              <PaginationLink :is-active="n === 6">{{ n }}</PaginationLink>
            </PaginationItem>
            <PaginationItem><PaginationNext /></PaginationItem>
          </PaginationContent>
        </Pagination>
      </template>
      <template #do-preview-1>
        <Pagination :total="50" :items-per-page="10" :default-page="2" class="w-full">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious>
                <span class="hidden sm:block">Anterior</span>
              </PaginationPrevious>
            </PaginationItem>
            <PaginationItem><PaginationLink>1</PaginationLink></PaginationItem>
            <PaginationItem><PaginationLink :is-active="true">2</PaginationLink></PaginationItem>
            <PaginationItem><PaginationLink>3</PaginationLink></PaginationItem>
            <PaginationItem>
              <PaginationNext>
                <span class="hidden sm:block">Próxima</span>
              </PaginationNext>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </template>
      <template #dont-preview-1>
        <Pagination :total="50" :items-per-page="10" :default-page="2" class="w-full">
          <PaginationContent>
            <PaginationItem><PaginationPrevious><span>&lt;</span></PaginationPrevious></PaginationItem>
            <PaginationItem><PaginationLink>1</PaginationLink></PaginationItem>
            <PaginationItem><PaginationLink :is-active="true">2</PaginationLink></PaginationItem>
            <PaginationItem><PaginationLink>3</PaginationLink></PaginationItem>
            <PaginationItem><PaginationNext><span>&gt;</span></PaginationNext></PaginationItem>
          </PaginationContent>
        </Pagination>
      </template>
    </DocsDoDont>

    <!-- ── Importação ───────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :code="codeImportBasic"
    />

    <!-- ── Variantes ────────────────────────────────────────────── -->
    <DocsVariants :title="tContent('variants.title')" :items="variantItems">
      <template #variant-preview-0>
        <Pagination :total="50" :items-per-page="10" :default-page="1" class="w-full">
          <PaginationContent>
            <PaginationItem><PaginationPrevious /></PaginationItem>
            <PaginationItem><PaginationLink :is-active="true">1</PaginationLink></PaginationItem>
            <PaginationItem><PaginationLink>2</PaginationLink></PaginationItem>
            <PaginationItem><PaginationLink>3</PaginationLink></PaginationItem>
            <PaginationItem><PaginationNext /></PaginationItem>
          </PaginationContent>
        </Pagination>
      </template>
      <template #variant-preview-1>
        <Pagination :total="50" :items-per-page="10" :default-page="3" class="w-full">
          <PaginationContent>
            <PaginationItem><PaginationLink>1</PaginationLink></PaginationItem>
            <PaginationItem><PaginationLink>2</PaginationLink></PaginationItem>
            <PaginationItem><PaginationLink :is-active="true" :aria-label="`Página atual, 3`">3</PaginationLink></PaginationItem>
            <PaginationItem><PaginationLink>4</PaginationLink></PaginationItem>
            <PaginationItem><PaginationLink>5</PaginationLink></PaginationItem>
          </PaginationContent>
        </Pagination>
      </template>
      <template #variant-preview-2>
        <Pagination :total="50" :items-per-page="10" :default-page="2" class="w-full">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious>
                <span class="hidden sm:block">Anterior</span>
              </PaginationPrevious>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext>
                <span class="hidden sm:block">Próxima</span>
              </PaginationNext>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </template>
    </DocsVariants>

    <!-- ── Composições ──────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="pagination"
      :items="compositionItems"
    >
      <template #variant-preview-0>
        <Pagination :total="50" :items-per-page="10" :default-page="1" class="w-full">
          <PaginationContent>
            <PaginationItem><PaginationPrevious /></PaginationItem>
            <PaginationItem><PaginationLink :is-active="true" :aria-label="`Página atual, 1`">1</PaginationLink></PaginationItem>
            <PaginationItem><PaginationLink :aria-label="`Ir para página 2`">2</PaginationLink></PaginationItem>
            <PaginationItem><PaginationLink :aria-label="`Ir para página 3`">3</PaginationLink></PaginationItem>
            <PaginationItem><PaginationLink :aria-label="`Ir para página 4`">4</PaginationLink></PaginationItem>
            <PaginationItem><PaginationLink :aria-label="`Ir para página 5`">5</PaginationLink></PaginationItem>
            <PaginationItem><PaginationNext /></PaginationItem>
          </PaginationContent>
        </Pagination>
      </template>
      <template #variant-preview-1>
        <Pagination :total="120" :items-per-page="10" :default-page="6" class="w-full">
          <PaginationContent>
            <PaginationItem><PaginationPrevious /></PaginationItem>
            <PaginationItem><PaginationLink :aria-label="`Ir para página 1`">1</PaginationLink></PaginationItem>
            <PaginationItem><PaginationEllipsis /></PaginationItem>
            <PaginationItem><PaginationLink :aria-label="`Ir para página 5`">5</PaginationLink></PaginationItem>
            <PaginationItem><PaginationLink :is-active="true" :aria-label="`Página atual, 6`">6</PaginationLink></PaginationItem>
            <PaginationItem><PaginationLink :aria-label="`Ir para página 7`">7</PaginationLink></PaginationItem>
            <PaginationItem><PaginationEllipsis /></PaginationItem>
            <PaginationItem><PaginationLink :aria-label="`Ir para página 12`">12</PaginationLink></PaginationItem>
            <PaginationItem><PaginationNext /></PaginationItem>
          </PaginationContent>
        </Pagination>
      </template>
      <template #variant-preview-2>
        <Pagination :total="100" :items-per-page="10" :default-page="10" class="w-full">
          <PaginationContent>
            <PaginationItem><PaginationPrevious /></PaginationItem>
            <PaginationItem><PaginationLink :aria-label="`Ir para página 1`">1</PaginationLink></PaginationItem>
            <PaginationItem><PaginationEllipsis /></PaginationItem>
            <PaginationItem><PaginationLink :aria-label="`Ir para página 9`">9</PaginationLink></PaginationItem>
            <PaginationItem><PaginationLink :is-active="true" :aria-label="`Página atual, 10`">10</PaginationLink></PaginationItem>
            <PaginationItem>
              <PaginationNext aria-disabled="true" tabindex="-1" class="pointer-events-none opacity-50" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </template>
      <template #variant-preview-3>
        <div class="w-full space-y-3">
          <Pagination :total="80" :items-per-page="10" :page="compInteractiveCurrent" class="w-full">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  :aria-disabled="compInteractiveCurrent === 1"
                  :tabindex="compInteractiveCurrent === 1 ? -1 : 0"
                  :class="compInteractiveCurrent === 1 ? 'pointer-events-none opacity-50' : ''"
                  @click="compInteractiveCurrent = Math.max(1, compInteractiveCurrent - 1)"
                />
              </PaginationItem>
              <PaginationItem v-for="n in 8" :key="n">
                <PaginationLink
                  :is-active="n === compInteractiveCurrent"
                  :aria-label="n === compInteractiveCurrent ? `Página atual, ${n}` : `Ir para página ${n}`"
                  @click="compInteractiveCurrent = n"
                >
                  {{ n }}
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  :aria-disabled="compInteractiveCurrent === 8"
                  :tabindex="compInteractiveCurrent === 8 ? -1 : 0"
                  :class="compInteractiveCurrent === 8 ? 'pointer-events-none opacity-50' : ''"
                  @click="compInteractiveCurrent = Math.min(8, compInteractiveCurrent + 1)"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          <p class="text-sm text-muted-foreground text-center">Página {{ compInteractiveCurrent }} de 8</p>
        </div>
      </template>
    </DocsCompositions>

    <!-- ── Estados ──────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="stateCols"
      :items="stateItems"
    />

    <!-- ── Propriedades ─────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: 'PaginationLink',   cols: propCols, items: linkPropItems        },
        { title: 'PaginationPrevious / PaginationNext', cols: propCols, items: directionalPropItems },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="tContent('props.extensibilityCode')"
    />

    <!-- ── Tokens ───────────────────────────────────────────────── -->
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

    <!-- ── Acessibilidade ───────────────────────────────────────── -->
    <DocsAccessibility
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-title="tContent('accessibility.keyboard.title')"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ─────────────────────────────────────────── -->
    <DocsRelated :title="tContent('related.title')" :items="relatedItems" />

    <!-- ── Notas ────────────────────────────────────────────────── -->
    <DocsNotes :title="tContent('notes.title')" :items="noteItems" />

    <!-- ── Analytics ────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :cols="{
        event: tContent('analytics.table.event'),
        trigger: tContent('analytics.table.trigger'),
        payload: tContent('analytics.table.payload'),
      }"
      :items="analyticsItems"
    />

    <!-- ── Testes ───────────────────────────────────────────────── -->
    <DocsTestes
      :title="tContent('testes.title')"
      :functional="{
        title: tContent('testes.functional.title'),
        cols: { action: 'Ação', result: 'Resultado esperado', priority: 'Prioridade' },
        items: functionalTestItems,
      }"
      :accessibility="{
        title: tContent('testes.accessibility.title'),
        cols: a11yCritCols,
        items: a11yTestItems,
      }"
      :visual="{
        title: tContent('testes.visual.title'),
        cols: { story: 'Story', priority: 'Prioridade' },
        items: visualTestItems,
      }"
    />
  </DocsPageLayout>
</template>
