<script setup lang="ts">
import { computed, watch, h, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import dtTranslations from '@shared/content/data-table/translations.json';

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
const { t: tContent, locale } = useTranslation(dtTranslations);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function stripHtml(html: string): string {
  return String(html ?? '').replace(/<[^>]*>/g, '');
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
  componentSlug: 'data-table',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
  aiIntent: tContent('seo.aiIntent') as 'informational',
  breadcrumb: [
    { name: 'Components', item: '/components' },
    { name: tContent('category'), item: '/components/display' },
    { name: tContent('title') },
  ],
})));

// ─── Analytics — page view ────────────────────────────────────────────────────
watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'data-table',
    locale: newLocale,
    page_title: `${tContent('title')} · Design System`,
  });
}, { immediate: true });

// ─── Navigation ───────────────────────────────────────────────────────────────
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
    component_name: 'data-table',
    locale: locale.value,
  });
});

// ─── Demo data ────────────────────────────────────────────────────────────────
type Invoice = {
  id: string;
  customer: string;
  status: 'Pago' | 'Pendente' | 'Cancelado';
  method: string;
  amount: number;
};

const demoData = ref<Invoice[]>([
  { id: 'INV-001', customer: 'Ana Souza',    status: 'Pago',      method: 'Cartão de crédito', amount: 250 },
  { id: 'INV-002', customer: 'Bruno Lima',   status: 'Pendente',  method: 'Boleto bancário',   amount: 150 },
  { id: 'INV-003', customer: 'Carla Mendes', status: 'Cancelado', method: 'Pix',               amount: 350 },
  { id: 'INV-004', customer: 'Diego Faria',  status: 'Pago',      method: 'Cartão de débito',  amount: 450 },
  { id: 'INV-005', customer: 'Eva Oliveira', status: 'Pendente',  method: 'Transferência',     amount: 200 },
]);

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const statusVariant: Record<Invoice['status'], 'default' | 'secondary' | 'destructive'> = {
  Pago: 'default',
  Pendente: 'secondary',
  Cancelado: 'destructive',
};

const demoColumns = computed<DataTableColumn<Invoice>[]>(() => [
  { accessorKey: 'id', header: tContent('demonstration.labels.invoice'), size: 110 },
  { accessorKey: 'customer', header: tContent('demonstration.labels.customer'), size: 200 },
  {
    accessorKey: 'status',
    header: tContent('demonstration.labels.status'),
    size: 140,
    cell: ({ row }) =>
      h(Badge, { variant: statusVariant[row.original.status] }, () => row.original.status),
  },
  { accessorKey: 'method', header: tContent('demonstration.labels.method'), size: 200 },
  {
    accessorKey: 'amount',
    header: tContent('demonstration.labels.amount'),
    size: 130,
    cell: ({ row }) =>
      h('span', { class: 'font-medium tabular-nums' }, currency.format(row.original.amount)),
  },
]);

// ─── Code snippets ────────────────────────────────────────────────────────────
const codeImportBasic = `import { DataTable } from '@/components/ui/data-table';
import type { DataTableColumn } from '@/components/ui/data-table';`;

const codeImportWithMeta = `import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import type { CellContext } from '@tanstack/vue-table';`;

const interfaceCode = `interface DataTableProps<TData> {
  columns: DataTableColumn<TData>[];
  data: TData[];
  enableGlobalFilter?: boolean;
  globalFilterPlaceholder?: string;
  enableRowSelection?: boolean;
  enableColumnVisibility?: boolean;
  enableColumnFilters?: boolean;
  enableColumnResizing?: boolean;
  enableColumnOrdering?: boolean;
  enableColumnPinning?: boolean;
  enablePagination?: boolean;
  virtualized?: boolean;
  virtualRowHeight?: number;
  maxHeight?: string;
  pageSize?: number;
  pageSizeOptions?: number[];
  emptyMessage?: string;
}

// Emits
// @table-ready  → (table: Table<TData>)
// @cell-edit    → (rowIndex: number, columnId: string, value: unknown)

// ColumnDef meta
interface ColumnMeta<TData, TValue> {
  filter?: { type: 'text' | 'select'; options?: string[]; placeholder?: string };
  editable?: boolean;
}`;

const codeCustomizationTokens = `/* Em globals.css — sobrescreva tokens semânticos */
:root {
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --primary: 222 47% 11%;
}

.dark {
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;
}`;

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
  { name: 'enableGlobalFilter',     description: stripHtml(tContent('variants.items.globalFilter'))     },
  { name: 'enableColumnFilters',    description: stripHtml(tContent('variants.items.columnFilters'))    },
  { name: 'enableRowSelection',     description: stripHtml(tContent('variants.items.selection'))        },
  { name: 'enableColumnVisibility', description: stripHtml(tContent('variants.items.visibility'))       },
  { name: 'enableColumnResizing',   description: stripHtml(tContent('variants.items.resize'))           },
  { name: 'enableColumnOrdering',   description: stripHtml(tContent('variants.items.reorder'))          },
  { name: 'enableColumnPinning',    description: stripHtml(tContent('variants.items.pin'))              },
  { name: 'enablePagination',       description: stripHtml(tContent('variants.items.pagination'))       },
  { name: 'meta.editable',          description: stripHtml(tContent('variants.items.edit'))             },
  { name: 'virtualized',            description: stripHtml(tContent('variants.items.virtual'))          },
]);

const stateItems = computed(() => [
  { label: tContent('states.empty.label'),       trigger: stripHtml(tContent('states.empty.trigger')),       behavior: stripHtml(tContent('states.empty.behavior'))       },
  { label: tContent('states.sorted.label'),      trigger: tContent('states.sorted.trigger'),                 behavior: stripHtml(tContent('states.sorted.behavior'))      },
  { label: tContent('states.filtered.label'),    trigger: tContent('states.filtered.trigger'),               behavior: tContent('states.filtered.behavior')               },
  { label: tContent('states.selected.label'),    trigger: tContent('states.selected.trigger'),               behavior: stripHtml(tContent('states.selected.behavior'))    },
  { label: tContent('states.editing.label'),     trigger: stripHtml(tContent('states.editing.trigger')),     behavior: stripHtml(tContent('states.editing.behavior'))     },
  { label: tContent('states.resizing.label'),    trigger: tContent('states.resizing.trigger'),               behavior: stripHtml(tContent('states.resizing.behavior'))    },
  { label: tContent('states.virtualized.label'), trigger: stripHtml(tContent('states.virtualized.trigger')), behavior: tContent('states.virtualized.behavior')            },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const dataTablePropItems = computed(() => [
  { name: 'columns',                 type: 'DataTableColumn<TData>[]', defaultValue: '—',        required: 'Sim', description: stripHtml(tContent('props.table.columns'))               },
  { name: 'data',                    type: 'TData[]',                  defaultValue: '—',        required: 'Sim', description: stripHtml(tContent('props.table.data'))                  },
  { name: 'enableGlobalFilter',      type: 'boolean',                  defaultValue: 'true',     required: 'Não', description: tContent('props.table.enableGlobalFilter')              },
  { name: 'globalFilterPlaceholder', type: 'string',                   defaultValue: '"Buscar..."', required: 'Não', description: tContent('props.table.globalFilterPlaceholder')     },
  { name: 'enableRowSelection',      type: 'boolean',                  defaultValue: 'false',    required: 'Não', description: tContent('props.table.enableRowSelection')              },
  { name: 'enableColumnVisibility',  type: 'boolean',                  defaultValue: 'true',     required: 'Não', description: tContent('props.table.enableColumnVisibility')          },
  { name: 'enableColumnFilters',     type: 'boolean',                  defaultValue: 'false',    required: 'Não', description: tContent('props.table.enableColumnFilters')             },
  { name: 'enableColumnResizing',    type: 'boolean',                  defaultValue: 'false',    required: 'Não', description: stripHtml(tContent('props.table.enableColumnResizing')) },
  { name: 'enableColumnOrdering',    type: 'boolean',                  defaultValue: 'false',    required: 'Não', description: tContent('props.table.enableColumnOrdering')            },
  { name: 'enableColumnPinning',     type: 'boolean',                  defaultValue: 'false',    required: 'Não', description: tContent('props.table.enableColumnPinning')             },
  { name: 'enablePagination',        type: 'boolean',                  defaultValue: 'true',     required: 'Não', description: tContent('props.table.enablePagination')                },
  { name: 'virtualized',             type: 'boolean',                  defaultValue: 'false',    required: 'Não', description: tContent('props.table.virtualized')                     },
  { name: 'virtualRowHeight',        type: 'number',                   defaultValue: '36',       required: 'Não', description: tContent('props.table.virtualRowHeight')                },
  { name: 'maxHeight',               type: 'string',                   defaultValue: '"480px"',  required: 'Não', description: stripHtml(tContent('props.table.maxHeight'))            },
  { name: 'pageSize',                type: 'number',                   defaultValue: '10',       required: 'Não', description: tContent('props.table.pageSize')                        },
  { name: 'pageSizeOptions',         type: 'number[]',                 defaultValue: '[10,20,50,100]', required: 'Não', description: stripHtml(tContent('props.table.pageSizeOptions')) },
  { name: 'emptyMessage',            type: 'string',                   defaultValue: '"Sem resultados."', required: 'Não', description: tContent('props.table.emptyMessage')      },
]);

const emitsItems = computed(() => [
  { name: '@cell-edit',    type: '(rowIndex, columnId, value) => void', defaultValue: '—', required: 'Não', description: stripHtml(tContent('props.table.onCellEdit'))    },
  { name: '@table-ready',  type: '(table) => void',                     defaultValue: '—', required: 'Não', description: tContent('props.table.onTableReady')              },
]);

const columnMetaItems = computed(() => [
  { name: 'meta.filter',   type: '{ type: "text" | "select"; options?: string[]; placeholder?: string }', defaultValue: '—', required: 'Não', description: stripHtml(tContent('props.table.metaFilter')) },
  { name: 'meta.editable', type: 'boolean', defaultValue: 'false', required: 'Não', description: stripHtml(tContent('props.table.metaEditable')) },
]);

const tokenRows = computed(() => [
  { token: 'border-input',          value: stripHtml(tContent('tokens.table.border')),           description: tContent('tokens.table.borderPart')           },
  { token: 'bg-muted/50',           value: stripHtml(tContent('tokens.table.muted')),            description: tContent('tokens.table.mutedPart')            },
  { token: 'text-muted-foreground', value: stripHtml(tContent('tokens.table.mutedForeground')),  description: tContent('tokens.table.mutedForegroundPart')  },
  { token: 'text-primary',          value: stripHtml(tContent('tokens.table.primary')),          description: tContent('tokens.table.primaryPart')          },
  { token: 'bg-background',         value: stripHtml(tContent('tokens.table.background')),       description: tContent('tokens.table.backgroundPart')       },
  { token: 'ring-ring/50',          value: stripHtml(tContent('tokens.table.ring')),             description: tContent('tokens.table.ringPart')             },
]);

const accessibilityItems = computed(() => [
  tContent('accessibility.item1'),
  tContent('accessibility.item2'),
  tContent('accessibility.item3'),
  tContent('accessibility.item4'),
  tContent('accessibility.item5'),
  tContent('accessibility.item6'),
]);

const keyboardItems = computed(() => [
  { key: 'Tab',     description: tContent('accessibility.keyboard.tab')        },
  { key: 'Enter',   description: tContent('accessibility.keyboard.enter')      },
  { key: 'Espaço',  description: tContent('accessibility.keyboard.space')      },
  { key: 'Escape',  description: tContent('accessibility.keyboard.escape')     },
  { key: 'Setas',   description: tContent('accessibility.keyboard.arrowKeys')  },
]);

const relatedItems = computed(() => [
  { name: 'Table',        description: tContent('related.table'),        path: '?path=/docs/ui-table--docs'        },
  { name: 'Chart',        description: tContent('related.chart'),        path: '?path=/docs/ui-chart--docs'        },
  { name: 'Pagination',   description: tContent('related.pagination'),   path: '?path=/docs/ui-pagination--docs'   },
  { name: 'Checkbox',     description: tContent('related.checkbox'),     path: '?path=/docs/ui-checkbox--docs'     },
  { name: 'Input',        description: tContent('related.input'),        path: '?path=/docs/ui-input--docs'        },
  { name: 'DropdownMenu', description: tContent('related.dropdownMenu'), path: '?path=/docs/ui-dropdownmenu--docs' },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.tip1') },
  { title: '', content: tContent('notes.tip2') },
  { title: '', content: tContent('notes.tip3') },
  { title: '', content: tContent('notes.tip4') },
  { title: '', content: tContent('notes.tip5') },
  { title: '', content: tContent('notes.tip6') },
]);

const analyticsItems = computed(() => [
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
  { action: tContent('testes.functional.item7.action'), result: tContent('testes.functional.item7.result'), priority: localPriority(tContent('testes.functional.item7.priority')) },
  { action: tContent('testes.functional.item8.action'), result: tContent('testes.functional.item8.result'), priority: localPriority(tContent('testes.functional.item8.priority')) },
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
  { story: tContent('testes.visual.item5.story'), priority: localPriority(tContent('testes.visual.item5.priority')) },
  { story: tContent('testes.visual.item6.story'), priority: localPriority(tContent('testes.visual.item6.priority')) },
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
        install-note="npm install @tanstack/vue-table @tanstack/vue-virtual"
      />
    </template>

    <!-- ── Demonstração ──────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div class="w-full">
        <DataTable
          :columns="demoColumns"
          :data="demoData"
          :enable-row-selection="true"
          :global-filter-placeholder="tContent('demonstration.labels.search')"
        />
      </div>
    </DocsDemonstration>

    <!-- ── Anatomia ──────────────────────────────────────────────── -->
    <DocsAnatomy
      :title="tContent('anatomy.title')"
      :items="anatomyItems"
      :structure-label="tContent('anatomy.structureLabel')"
      :structure-code="tContent('anatomy.structureCode')"
    />

    <!-- ── Quando Usar ───────────────────────────────────────────── -->
    <DocsWhenToUse
      :title="tContent('usage.title')"
      :guidelines="{
        title: tContent('usage.guidelines.title'),
        items: [
          stripHtml(tContent('usage.guidelines.item1')),
          stripHtml(tContent('usage.guidelines.item2')),
          stripHtml(tContent('usage.guidelines.item3')),
          stripHtml(tContent('usage.guidelines.item4')),
          stripHtml(tContent('usage.guidelines.item5')),
          stripHtml(tContent('usage.guidelines.item6')),
        ],
      }"
      :scenarios="{
        title: tContent('usage.scenarios.title'),
        cols: { scenario: tContent('usage.scenarios.cols.scenario'), use: tContent('usage.scenarios.cols.use'), alternative: tContent('usage.scenarios.cols.alternative') },
        items: [
          { s: stripHtml(tContent('usage.scenarios.item1.s')), u: tContent('usage.scenarios.item1.u'), a: tContent('usage.scenarios.item1.a') },
          { s: tContent('usage.scenarios.item2.s'), u: tContent('usage.scenarios.item2.u'), a: tContent('usage.scenarios.item2.a') },
          { s: stripHtml(tContent('usage.scenarios.item3.s')), u: tContent('usage.scenarios.item3.u'), a: tContent('usage.scenarios.item3.a') },
          { s: tContent('usage.scenarios.item4.s'), u: tContent('usage.scenarios.item4.u'), a: tContent('usage.scenarios.item4.a') },
          { s: tContent('usage.scenarios.item5.s'), u: tContent('usage.scenarios.item5.u'), a: tContent('usage.scenarios.item5.a') },
          { s: tContent('usage.scenarios.item6.s'), u: tContent('usage.scenarios.item6.u'), a: tContent('usage.scenarios.item6.a') },
        ],
      }"
      :ux-writing="{
        title: tContent('usage.uxWriting.title'),
        cols: { element: tContent('usage.uxWriting.table.element'), rules: tContent('usage.uxWriting.table.rules'), do: tContent('usage.uxWriting.table.correct'), dont: tContent('usage.uxWriting.table.avoid') },
        items: [
          { element: tContent('usage.uxWriting.table.columnHeader.name'),      rules: tContent('usage.uxWriting.table.columnHeader.format'),      do: tContent('usage.uxWriting.table.columnHeader.good'),      dont: tContent('usage.uxWriting.table.columnHeader.bad')      },
          { element: tContent('usage.uxWriting.table.filterPlaceholder.name'), rules: tContent('usage.uxWriting.table.filterPlaceholder.format'), do: tContent('usage.uxWriting.table.filterPlaceholder.good'), dont: tContent('usage.uxWriting.table.filterPlaceholder.bad') },
          { element: tContent('usage.uxWriting.table.emptyState.name'),        rules: tContent('usage.uxWriting.table.emptyState.format'),        do: tContent('usage.uxWriting.table.emptyState.good'),        dont: tContent('usage.uxWriting.table.emptyState.bad')        },
          { element: tContent('usage.uxWriting.table.selectionLabel.name'),    rules: tContent('usage.uxWriting.table.selectionLabel.format'),    do: tContent('usage.uxWriting.table.selectionLabel.good'),    dont: tContent('usage.uxWriting.table.selectionLabel.bad')    },
        ],
      }"
      :do="{ title: tContent('usage.do.title'), items: [tContent('usage.do.item1'), tContent('usage.do.item2'), tContent('usage.do.item3'), tContent('usage.do.item4')] }"
      :dont="{ title: tContent('usage.dont.title'), items: [stripHtml(tContent('usage.dont.item1')), stripHtml(tContent('usage.dont.item2')), tContent('usage.dont.item3')] }"
    />

    <!-- ── Do & Don't ────────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="[
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: tContent('doDont.pair1.do'), dontCaption: stripHtml(tContent('doDont.pair1.dont')) },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: tContent('doDont.pair2.do'), dontCaption: tContent('doDont.pair2.dont') },
      ]"
    >
      <template #do-preview-0>
        <DataTable :columns="demoColumns" :data="demoData" :enable-row-selection="false" global-filter-placeholder="Buscar fatura, cliente ou método" />
      </template>
      <template #dont-preview-0>
        <DataTable :columns="demoColumns" :data="demoData" :enable-row-selection="false" global-filter-placeholder="Buscar..." />
      </template>
      <template #do-preview-1>
        <DataTable :columns="demoColumns" :data="demoData" :virtualized="true" max-height="240px" :enable-column-visibility="false" />
      </template>
      <template #dont-preview-1>
        <DataTable :columns="demoColumns" :data="demoData" :page-size="50" />
      </template>
    </DocsDoDont>

    <!-- ── Importação ────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :description="tContent('import.basic')"
      :code="codeImportBasic"
      :secondary-description="tContent('import.withMeta')"
      :secondary-code="codeImportWithMeta"
    />

    <!-- ── Recursos ──────────────────────────────────────────────── -->
    <DocsVariants :title="tContent('variants.title')" :items="variantItems" />

    <!-- ── Estados ───────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{ state: tContent('states.cols.state'), trigger: tContent('states.cols.trigger'), behavior: tContent('states.cols.behavior') }"
      :items="stateItems"
    />

    <!-- ── Propriedades ──────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: tContent('props.containerTitle'), cols: propCols, items: dataTablePropItems },
        { title: 'Emits',                          cols: propCols, items: emitsItems         },
        { title: tContent('props.tooltipTitle'),   cols: propCols, items: columnMetaItems    },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="tContent('props.extensibility')"
    />

    <!-- ── Tokens ────────────────────────────────────────────────── -->
    <DocsTokens
      :title="tContent('tokens.title')"
      :cols="{ token: tContent('tokens.table.token'), value: tContent('tokens.table.class'), description: tContent('tokens.table.part') }"
      :items="tokenRows"
      :customization-title="tContent('tokens.customizationTitle')"
      :customization-code="codeCustomizationTokens"
    />

    <!-- ── Acessibilidade ────────────────────────────────────────── -->
    <DocsAccessibility
      :title="tContent('accessibility.title')"
      :summary="stripHtml(tContent('accessibility.summary'))"
      :items="accessibilityItems"
      :keyboard-title="tContent('accessibility.keyboardTitle')"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ──────────────────────────────────────────── -->
    <DocsRelated :title="tContent('related.title')" :items="relatedItems" />

    <!-- ── Notas ─────────────────────────────────────────────────── -->
    <DocsNotes :title="tContent('notes.title')" :items="noteItems" />

    <!-- ── Analytics ────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :cols="{ event: tContent('analytics.table.event'), trigger: tContent('analytics.table.trigger'), payload: tContent('analytics.table.payload') }"
      :items="analyticsItems"
    />

    <!-- ── Testes ────────────────────────────────────────────────── -->
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
