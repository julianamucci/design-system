<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableEmpty,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ArrowUpDown, Search } from 'lucide-vue-next';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import tableTranslations from '@shared/content/table/translations.json';

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
const { t: tContent, locale } = useTranslation(tableTranslations);

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
  componentSlug: 'table',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'table',
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
    component_name: 'table',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableEmpty,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";`;

const codeBasic = `<Table>
  <TableCaption>Lista de faturas recentes</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col">Status</TableHead>
      <TableHead scope="col" class="text-right">Valor</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell class="font-medium">#INV-001</TableCell>
      <TableCell>Pago</TableCell>
      <TableCell class="text-right">R$ 250,00</TableCell>
    </TableRow>
  </TableBody>
</Table>`;

const codeWithFooter = `<Table>
  <TableCaption>Lista de faturas recentes</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col" class="text-right">Valor</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>#INV-001</TableCell>
      <TableCell class="text-right">R$ 250,00</TableCell>
    </TableRow>
  </TableBody>
  <TableFooter>
    <TableRow>
      <TableCell>Total</TableCell>
      <TableCell class="text-right">R$ 250,00</TableCell>
    </TableRow>
  </TableFooter>
</Table>`;

const codeWithSrOnlyCaption = `<Table>
  <TableCaption class="sr-only">Lista de faturas recentes</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col" class="text-right">Valor</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>#INV-001</TableCell>
      <TableCell class="text-right">R$ 250,00</TableCell>
    </TableRow>
  </TableBody>
</Table>`;

const codeWithActions = `<Table>
  <TableCaption>Lista de faturas recentes</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col" class="text-right">Ações</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>#INV-001</TableCell>
      <TableCell class="text-right">
        <Button variant="ghost" size="sm" aria-label="Ações para fatura #INV-001">
          Ações
        </Button>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>`;

const codeEmpty = `<Table>
  <TableCaption>Lista de faturas recentes</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col">Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableEmpty :colspan="2">
      Nenhuma fatura encontrada.
    </TableEmpty>
  </TableBody>
</Table>`;

const codeCustomizationTokens = `/* Em globals.css — ajustar tokens para customizar a tabela */
:root {
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
}

.dark {
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
}`;

const interfaceCode = `// Table
interface TableProps {
  class?: string;
}

// TableHead — scope obrigatório
interface TableHeadProps {
  scope?: 'col' | 'row' | 'colgroup' | 'rowgroup';
  class?: string;
}

// TableCell
interface TableCellProps {
  colSpan?: number;
  rowSpan?: number;
  class?: string;
}

// TableRow
interface TableRowProps {
  'data-state'?: 'selected';
  class?: string;
}

// TableEmpty (Vue extra)
interface TableEmptyProps {
  colspan?: number;
  class?: string;
}`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
  tContent('anatomy.item4'),
  tContent('anatomy.item5'),
  tContent('anatomy.item6'),
  tContent('anatomy.item7'),
  tContent('anatomy.item8'),
]);

const variantItems = computed(() => [
  { name: tContent('variants.basic.label'),           description: tContent('variants.basic.description'),           code: codeBasic           },
  { name: tContent('variants.withFooter.label'),      description: tContent('variants.withFooter.description'),      code: codeWithFooter      },
  { name: tContent('variants.withSrOnlyCaption.label'), description: tContent('variants.withSrOnlyCaption.description'), code: codeWithSrOnlyCaption },
  { name: tContent('variants.withInlineActions.label'), description: tContent('variants.withInlineActions.description'), code: codeWithActions   },
  { name: tContent('variants.withEmptyState.label'),  description: tContent('variants.withEmptyState.description'),  code: codeEmpty           },
]);

const codeCompFilterableToolbar = `<div class="flex flex-col gap-3">
  <div class="flex items-center gap-2">
    <Input v-model="search" placeholder="Filtrar faturas..." />
    <Button variant="outline">Status</Button>
  </div>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead scope="col">Fatura</TableHead>
        <TableHead scope="col">Status</TableHead>
        <TableHead scope="col" class="text-right">Valor</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="invoice in filtered" :key="invoice.id">
        <TableCell>{{ invoice.id }}</TableCell>
        <TableCell>{{ invoice.status }}</TableCell>
        <TableCell class="text-right">{{ invoice.amount }}</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>`;

const codeCompSortableHeaders = `<Table>
  <TableHeader>
    <TableRow>
      <TableHead scope="col" aria-sort="ascending">
        <Button variant="ghost" size="sm" class="-ml-2">
          Fatura
          <ArrowUpDown class="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      </TableHead>
      <TableHead scope="col" aria-sort="none">
        <Button variant="ghost" size="sm" class="-ml-2">
          Valor
          <ArrowUpDown class="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      </TableHead>
    </TableRow>
  </TableHeader>
  <TableBody><!-- linhas --></TableBody>
</Table>`;

const codeCompSelectableRows = `<Table>
  <TableHeader>
    <TableRow>
      <TableHead scope="col" class="w-10">
        <Checkbox aria-label="Selecionar todas as linhas" />
      </TableHead>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col">Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow v-for="invoice in invoices" :key="invoice.id" :data-state="selected.has(invoice.id) ? 'selected' : undefined">
      <TableCell>
        <Checkbox :model-value="selected.has(invoice.id)" @update:model-value="toggle(invoice.id)" :aria-label="\`Selecionar fatura \${invoice.id}\`" />
      </TableCell>
      <TableCell>{{ invoice.id }}</TableCell>
      <TableCell>{{ invoice.status }}</TableCell>
    </TableRow>
  </TableBody>
</Table>`;

const codeCompWithPagination = `<div class="flex flex-col gap-3">
  <Table><!-- linhas --></Table>
  <Pagination>
    <PaginationContent>
      <PaginationItem>
        <PaginationPrevious href="#" />
      </PaginationItem>
      <PaginationItem>
        <PaginationLink href="#" is-active>1</PaginationLink>
      </PaginationItem>
      <PaginationItem>
        <PaginationLink href="#">2</PaginationLink>
      </PaginationItem>
      <PaginationItem>
        <PaginationNext href="#" />
      </PaginationItem>
    </PaginationContent>
  </Pagination>
</div>`;

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.filterableToolbar.name'),
    description: tContent('variants.compositions.filterableToolbar.description'),
    useWhen: tContent('variants.compositions.filterableToolbar.use'),
    code: codeCompFilterableToolbar,
  },
  {
    name: tContent('variants.compositions.sortableHeaders.name'),
    description: tContent('variants.compositions.sortableHeaders.description'),
    useWhen: tContent('variants.compositions.sortableHeaders.use'),
    code: codeCompSortableHeaders,
  },
  {
    name: tContent('variants.compositions.selectableRows.name'),
    description: tContent('variants.compositions.selectableRows.description'),
    useWhen: tContent('variants.compositions.selectableRows.use'),
    code: codeCompSelectableRows,
  },
  {
    name: tContent('variants.compositions.withPagination.name'),
    description: tContent('variants.compositions.withPagination.description'),
    useWhen: tContent('variants.compositions.withPagination.use'),
    code: codeCompWithPagination,
  },
]);

const stateItems = computed(() => [
  {
    label:    tContent('states.empty.label'),
    trigger:  stripHtml(tContent('states.empty.trigger')),
    behavior: tContent('states.empty.behavior'),
  },
  {
    label:    tContent('states.selected.label'),
    trigger:  stripHtml(tContent('states.selected.trigger')),
    behavior: tContent('states.selected.behavior'),
  },
  {
    label:    tContent('states.loading.label'),
    trigger:  stripHtml(tContent('states.loading.trigger')),
    behavior: tContent('states.loading.behavior'),
  },
]);

const propCols = computed(() => ({
  prop:        tContent('props.table.prop'),
  type:        tContent('props.table.type'),
  default:     tContent('props.table.default'),
  required:    tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const tablePropItems = computed(() => [
  { name: 'class', type: 'string', defaultValue: '—', required: 'Não', description: tContent('props.items.className') },
]);

const tableHeadPropItems = computed(() => [
  { name: 'scope',  type: '"col" | "row" | "colgroup" | "rowgroup"', defaultValue: '—',  required: 'Sim', description: stripHtml(tContent('props.items.scope'))     },
  { name: 'class',  type: 'string',                                   defaultValue: '—',  required: 'Não', description: tContent('props.items.className')             },
]);

const tableCellPropItems = computed(() => [
  { name: 'colSpan', type: 'number', defaultValue: '—', required: 'Não', description: tContent('props.items.colSpan') },
  { name: 'rowSpan', type: 'number', defaultValue: '—', required: 'Não', description: tContent('props.items.rowSpan') },
  { name: 'class',   type: 'string', defaultValue: '—', required: 'Não', description: tContent('props.items.className') },
]);

const tableRowPropItems = computed(() => [
  { name: 'data-state', type: '"selected"', defaultValue: '—',  required: 'Não', description: stripHtml(tContent('props.items.dataState')) },
  { name: 'class',      type: 'string',     defaultValue: '—',  required: 'Não', description: tContent('props.items.className') },
]);

const tableEmptyPropItems = computed(() => [
  { name: 'colspan', type: 'number', defaultValue: '1', required: 'Não', description: tContent('props.items.colSpan') },
  { name: 'class',   type: 'string', defaultValue: '—', required: 'Não', description: tContent('props.items.className') },
]);

const tokenRows = computed(() => [
  { token: 'border-b',                       value: 'TableHeader / TableBody', description: stripHtml(tContent('tokens.items.borderB'))       },
  { token: 'bg-muted/50',                    value: 'TableFooter / TableRow',  description: stripHtml(tContent('tokens.items.bgMuted'))        },
  { token: 'data-[state=selected]:bg-muted', value: 'TableRow',               description: stripHtml(tContent('tokens.items.bgMutedSelected')) },
  { token: 'text-muted-foreground',          value: 'TableCaption',            description: stripHtml(tContent('tokens.items.textMuted'))       },
  { token: 'font-medium',                    value: 'TableHead / TableFooter', description: stripHtml(tContent('tokens.items.fontMedium'))      },
  { token: 'h-10',                           value: 'TableHead',               description: stripHtml(tContent('tokens.items.h10'))             },
  { token: 'p-2',                            value: 'TableCell',               description: stripHtml(tContent('tokens.items.p2'))              },
  { token: 'caption-bottom',                 value: 'TableCaption',            description: stripHtml(tContent('tokens.items.captionBottom'))   },
]);

const keyboardItems = computed(() => [
  { key: 'Tab',   description: tContent('accessibility.keyboard.tab')        },
  { key: 'Enter', description: tContent('accessibility.keyboard.enter')      },
  { key: 'Space', description: tContent('accessibility.keyboard.space')      },
  { key: '—',     description: tContent('accessibility.keyboard.noKeyboard') },
]);

const relatedItems = computed(() => [
  { name: 'Badge',        description: tContent('related.badge'),        path: '?path=/docs/ui-badge--docs'         },
  { name: 'Skeleton',     description: tContent('related.skeleton'),     path: '?path=/docs/ui-skeleton--docs'      },
  { name: 'Pagination',   description: tContent('related.pagination'),   path: '?path=/docs/ui-pagination--docs'    },
  { name: 'Avatar',       description: tContent('related.avatar'),       path: '?path=/docs/ui-avatar--docs'        },
  { name: 'DropdownMenu', description: tContent('related.dropdownMenu'), path: '?path=/docs/ui-dropdownmenu--docs'  },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.tip1') },
  { title: '', content: tContent('notes.tip2') },
  { title: '', content: tContent('notes.tip3') },
  { title: '', content: tContent('notes.tip4') },
  { title: '', content: tContent('notes.tip5') },
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
        install-note="npx shadcn-vue@latest add table"
      />
    </template>

    <!-- ── Demonstração ───────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div class="w-full">
        <Table>
          <TableCaption>{{ tContent('demonstration.labels.caption') }}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{{ tContent('demonstration.labels.invoice') }}</TableHead>
              <TableHead scope="col">{{ tContent('demonstration.labels.status') }}</TableHead>
              <TableHead scope="col">{{ tContent('demonstration.labels.method') }}</TableHead>
              <TableHead scope="col" class="text-right">{{ tContent('demonstration.labels.amount') }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell class="font-medium">{{ tContent('demonstration.labels.inv001') }}</TableCell>
              <TableCell>{{ tContent('demonstration.labels.paid') }}</TableCell>
              <TableCell>{{ tContent('demonstration.labels.creditCard') }}</TableCell>
              <TableCell class="text-right">{{ tContent('demonstration.labels.amount001') }}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell class="font-medium">{{ tContent('demonstration.labels.inv002') }}</TableCell>
              <TableCell>{{ tContent('demonstration.labels.pending') }}</TableCell>
              <TableCell>{{ tContent('demonstration.labels.bankTransfer') }}</TableCell>
              <TableCell class="text-right">{{ tContent('demonstration.labels.amount002') }}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell class="font-medium">{{ tContent('demonstration.labels.inv003') }}</TableCell>
              <TableCell>{{ tContent('demonstration.labels.canceled') }}</TableCell>
              <TableCell>{{ tContent('demonstration.labels.pix') }}</TableCell>
              <TableCell class="text-right">{{ tContent('demonstration.labels.amount003') }}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell class="font-medium">{{ tContent('demonstration.labels.inv004') }}</TableCell>
              <TableCell>{{ tContent('demonstration.labels.paid') }}</TableCell>
              <TableCell>{{ tContent('demonstration.labels.creditCard') }}</TableCell>
              <TableCell class="text-right">{{ tContent('demonstration.labels.amount004') }}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell class="font-medium">{{ tContent('demonstration.labels.inv005') }}</TableCell>
              <TableCell>{{ tContent('demonstration.labels.pending') }}</TableCell>
              <TableCell>{{ tContent('demonstration.labels.pix') }}</TableCell>
              <TableCell class="text-right">{{ tContent('demonstration.labels.amount005') }}</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell :col-span="3">{{ tContent('demonstration.labels.total') }}</TableCell>
              <TableCell class="text-right">{{ tContent('demonstration.labels.totalAmount') }}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
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
      :ux-writing="{
        title: tContent('usage.uxWriting.title'),
        cols: {
          element: tContent('usage.uxWriting.table.element'),
          rules: tContent('usage.uxWriting.table.rules'),
          do: tContent('usage.uxWriting.table.correct'),
          dont: tContent('usage.uxWriting.table.avoid'),
        },
        items: [
          { element: tContent('usage.uxWriting.table.caption.name'), rules: tContent('usage.uxWriting.table.caption.format'), do: tContent('usage.uxWriting.table.caption.good'), dont: tContent('usage.uxWriting.table.caption.bad') },
          { element: tContent('usage.uxWriting.table.head.name'),    rules: tContent('usage.uxWriting.table.head.format'),    do: tContent('usage.uxWriting.table.head.good'),    dont: tContent('usage.uxWriting.table.head.bad')    },
          { element: tContent('usage.uxWriting.table.emptyState.name'), rules: tContent('usage.uxWriting.table.emptyState.format'), do: tContent('usage.uxWriting.table.emptyState.good'), dont: tContent('usage.uxWriting.table.emptyState.bad') },
          { element: tContent('usage.uxWriting.table.actionLabel.name'), rules: tContent('usage.uxWriting.table.actionLabel.format'), do: tContent('usage.uxWriting.table.actionLabel.good'), dont: tContent('usage.uxWriting.table.actionLabel.bad') },
        ],
      }"
      :do="{ title: tContent('usage.do.title'), items: [tContent('usage.do.item1'), tContent('usage.do.item2'), tContent('usage.do.item3'), tContent('usage.do.item4')] }"
      :dont="{ title: tContent('usage.dont.title'), items: [tContent('usage.dont.item1'), tContent('usage.dont.item2'), tContent('usage.dont.item3')] }"
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
        <Table>
          <TableCaption>Lista de faturas recentes</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Fatura</TableHead>
              <TableHead scope="col" class="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>#INV-001</TableCell>
              <TableCell class="text-right">R$ 250,00</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </template>
      <template #dont-preview-0>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fatura</TableHead>
              <TableHead class="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>#INV-001</TableCell>
              <TableCell class="text-right">R$ 250,00</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </template>
      <template #do-preview-1>
        <Table>
          <TableCaption>Lista de faturas</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Fatura</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableEmpty :colspan="1">
              Nenhuma fatura encontrada.
            </TableEmpty>
          </TableBody>
        </Table>
      </template>
      <template #dont-preview-1>
        <Table>
          <TableCaption>Lista de faturas</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Fatura</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody />
        </Table>
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :code="codeImportBasic"
    />

    <!-- ── Variantes ──────────────────────────────────────────────── -->
    <DocsVariants :title="tContent('variants.title')" :items="variantItems">
      <!-- Básica -->
      <template #variant-preview-0>
        <Table>
          <TableCaption>Lista de faturas recentes</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Fatura</TableHead>
              <TableHead scope="col">Status</TableHead>
              <TableHead scope="col" class="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell class="font-medium">#INV-001</TableCell>
              <TableCell>Pago</TableCell>
              <TableCell class="text-right">R$ 250,00</TableCell>
            </TableRow>
            <TableRow>
              <TableCell class="font-medium">#INV-002</TableCell>
              <TableCell>Pendente</TableCell>
              <TableCell class="text-right">R$ 150,00</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </template>
      <!-- Com rodapé -->
      <template #variant-preview-1>
        <Table>
          <TableCaption>Lista de faturas recentes</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Fatura</TableHead>
              <TableHead scope="col" class="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell class="font-medium">#INV-001</TableCell>
              <TableCell class="text-right">R$ 250,00</TableCell>
            </TableRow>
            <TableRow>
              <TableCell class="font-medium">#INV-002</TableCell>
              <TableCell class="text-right">R$ 150,00</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
              <TableCell class="text-right">R$ 400,00</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </template>
      <!-- Caption sr-only -->
      <template #variant-preview-2>
        <div>
          <p class="text-sm font-semibold mb-3">Faturas recentes</p>
          <Table>
            <TableCaption class="sr-only">Lista de faturas recentes</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Fatura</TableHead>
                <TableHead scope="col" class="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell class="font-medium">#INV-001</TableCell>
                <TableCell class="text-right">R$ 250,00</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </template>
      <!-- Ações por linha -->
      <template #variant-preview-3>
        <Table>
          <TableCaption>Lista de faturas recentes</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Fatura</TableHead>
              <TableHead scope="col" class="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell class="font-medium">#INV-001</TableCell>
              <TableCell class="text-right">
                <Button variant="ghost" size="sm" :aria-label="`${tContent('demonstration.labels.actionsLabel')} #INV-001`">
                  {{ tContent('demonstration.labels.actions') }}
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell class="font-medium">#INV-002</TableCell>
              <TableCell class="text-right">
                <Button variant="ghost" size="sm" :aria-label="`${tContent('demonstration.labels.actionsLabel')} #INV-002`">
                  {{ tContent('demonstration.labels.actions') }}
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </template>
      <!-- Estado vazio -->
      <template #variant-preview-4>
        <Table>
          <TableCaption>Lista de faturas recentes</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Fatura</TableHead>
              <TableHead scope="col">Status</TableHead>
              <TableHead scope="col" class="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableEmpty :colspan="3">
              {{ tContent('demonstration.labels.emptyState') }}
            </TableEmpty>
          </TableBody>
        </Table>
      </template>
    </DocsVariants>

    <!-- ── Composições ────────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="table"
      :items="compositionItems"
    >
      <!-- Toolbar de filtros -->
      <template #variant-preview-0>
        <div class="w-full flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <div class="relative w-full max-w-sm">
              <Search class="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input placeholder="Filtrar faturas..." class="pl-8" />
            </div>
            <Button variant="outline">Status</Button>
          </div>
          <Table>
            <TableCaption class="sr-only">Lista de faturas filtráveis</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Fatura</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col" class="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell class="font-medium">#INV-001</TableCell>
                <TableCell>Pago</TableCell>
                <TableCell class="text-right">R$ 250,00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell class="font-medium">#INV-002</TableCell>
                <TableCell>Pendente</TableCell>
                <TableCell class="text-right">R$ 150,00</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </template>
      <!-- Cabeçalhos ordenáveis -->
      <template #variant-preview-1>
        <Table>
          <TableCaption class="sr-only">Faturas ordenáveis</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" aria-sort="ascending">
                <Button variant="ghost" size="sm" class="-ml-2 h-8">
                  Fatura
                  <ArrowUpDown class="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              </TableHead>
              <TableHead scope="col" aria-sort="none">
                <Button variant="ghost" size="sm" class="-ml-2 h-8">
                  Status
                  <ArrowUpDown class="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              </TableHead>
              <TableHead scope="col" aria-sort="none" class="text-right">
                <Button variant="ghost" size="sm" class="-ml-2 h-8">
                  Valor
                  <ArrowUpDown class="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell class="font-medium">#INV-001</TableCell>
              <TableCell>Pago</TableCell>
              <TableCell class="text-right">R$ 250,00</TableCell>
            </TableRow>
            <TableRow>
              <TableCell class="font-medium">#INV-002</TableCell>
              <TableCell>Pendente</TableCell>
              <TableCell class="text-right">R$ 150,00</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </template>
      <!-- Seleção de linhas -->
      <template #variant-preview-2>
        <Table>
          <TableCaption class="sr-only">Faturas com seleção</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" class="w-10">
                <Checkbox aria-label="Selecionar todas as linhas" />
              </TableHead>
              <TableHead scope="col">Fatura</TableHead>
              <TableHead scope="col">Status</TableHead>
              <TableHead scope="col" class="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow data-state="selected">
              <TableCell>
                <Checkbox :model-value="true" aria-label="Selecionar fatura #INV-001" />
              </TableCell>
              <TableCell class="font-medium">#INV-001</TableCell>
              <TableCell>Pago</TableCell>
              <TableCell class="text-right">R$ 250,00</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Checkbox aria-label="Selecionar fatura #INV-002" />
              </TableCell>
              <TableCell class="font-medium">#INV-002</TableCell>
              <TableCell>Pendente</TableCell>
              <TableCell class="text-right">R$ 150,00</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </template>
      <!-- Com paginação -->
      <template #variant-preview-3>
        <div class="w-full flex flex-col gap-3">
          <Table>
            <TableCaption class="sr-only">Faturas paginadas</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Fatura</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col" class="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell class="font-medium">#INV-001</TableCell>
                <TableCell>Pago</TableCell>
                <TableCell class="text-right">R$ 250,00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell class="font-medium">#INV-002</TableCell>
                <TableCell>Pendente</TableCell>
                <TableCell class="text-right">R$ 150,00</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" :is-active="true">1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">2</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </template>
    </DocsCompositions>

    <!-- ── Estados ────────────────────────────────────────────────── -->
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
        { title: tContent('props.tableTitle'),       cols: propCols, items: tablePropItems      },
        { title: tContent('props.tableHeadTitle'),   cols: propCols, items: tableHeadPropItems  },
        { title: tContent('props.tableCellTitle'),   cols: propCols, items: tableCellPropItems  },
        { title: tContent('props.tableRowTitle'),    cols: propCols, items: tableRowPropItems   },
        { title: 'TableEmpty',                       cols: propCols, items: tableEmptyPropItems },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="tContent('props.extensibility')"
    />

    <!-- ── Tokens ─────────────────────────────────────────────────── -->
    <DocsTokens
      :title="tContent('tokens.title')"
      :cols="{
        token: tContent('tokens.table.token'),
        value: tContent('tokens.table.part'),
        description: tContent('tokens.table.description'),
      }"
      :items="tokenRows"
      :customization-title="tContent('tokens.customizationTitle')"
      :customization-code="codeCustomizationTokens"
    />

    <!-- ── Acessibilidade ─────────────────────────────────────────── -->
    <DocsAccessibility
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :keyboard-title="tNav('nav.accessibility')"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ───────────────────────────────────────────── -->
    <DocsRelated :title="tContent('related.title')" :items="relatedItems" />

    <!-- ── Notas ──────────────────────────────────────────────────── -->
    <DocsNotes :title="tContent('notes.title')" :items="noteItems" />

    <!-- ── Analytics ─────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :description="tContent('analytics.description')"
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
