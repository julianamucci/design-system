<script lang="ts">
  import DataTable from '@/components/ui/data-table/data-table.svelte';
  import type { DataTableColumn } from '@/components/ui/data-table';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsVariants, DocsStates, DocsProps, DocsTokens,
    DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes,
  } from '@/components/docs/shared/sections';
  import uiTranslations from '@/i18n/ui.json';
  import dataTableTranslations from '@shared/content/data-table/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(dataTableTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────
  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'data-table',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
    });
    track('docs_page_view', {
      component_name: 'data-table',
      locale: l,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

  // ─── Active section ──────────────────────────────────────────────────────
  const NAV_GROUPS = $derived.by(() => {
    const tNav = $tNavStore;
    return [
      { label: tNav('nav.overview'), sections: [
        { id: 'demonstracao', label: tNav('nav.demonstration') },
        { id: 'anatomia',     label: tNav('nav.anatomy')       },
        { id: 'quando-usar',  label: tNav('nav.usage')         },
        { id: 'do-dont',      label: tNav('nav.doDont')        },
      ]},
      { label: tNav('nav.techRef'), sections: [
        { id: 'importacao',   label: tNav('nav.import')   },
        { id: 'variantes',    label: tNav('nav.variants') },
        { id: 'estados',      label: tNav('nav.states')   },
        { id: 'propriedades', label: tNav('nav.props')    },
        { id: 'tokens',       label: tNav('nav.tokens')   },
      ]},
      { label: tNav('nav.context'), sections: [
        { id: 'acessibilidade', label: tNav('nav.accessibility') },
        { id: 'relacionados',   label: tNav('nav.related')       },
        { id: 'notas',          label: tNav('nav.notes')         },
      ]},
      { label: tNav('nav.quality'), sections: [
        { id: 'analytics', label: tNav('nav.analytics') },
        { id: 'testes',    label: tNav('nav.testes')    },
      ]},
    ];
  });

  const sectionIds = NAV_GROUPS.flatMap(g => g.sections.map(s => s.id));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'data-table', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────
  function stripHtml(s: string) { return s.replace(/<[^>]*>/g, ''); }

  const priorityKeyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };
  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── Demo data ───────────────────────────────────────────────────────────
  type Invoice = { id: string; customer: string; status: string; method: string; amount: number };
  const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  const demoData: Invoice[] = [
    { id: 'INV-001', customer: 'Ana Souza',    status: 'Pago',      method: 'Cartão de crédito', amount: 250 },
    { id: 'INV-002', customer: 'Bruno Lima',   status: 'Pendente',  method: 'Boleto bancário',   amount: 150 },
    { id: 'INV-003', customer: 'Carla Mendes', status: 'Cancelado', method: 'Pix',               amount: 350 },
    { id: 'INV-004', customer: 'Diego Faria',  status: 'Pago',      method: 'Cartão de débito',  amount: 450 },
    { id: 'INV-005', customer: 'Eva Oliveira', status: 'Pendente',  method: 'Transferência',     amount: 200 },
  ];

  const demoColumns: DataTableColumn<Invoice>[] = $derived([
    { accessorKey: 'id', header: $tStore('demonstration.labels.invoice'), size: 110 },
    { accessorKey: 'customer', header: $tStore('demonstration.labels.customer'), size: 200 },
    { accessorKey: 'status', header: $tStore('demonstration.labels.status'), size: 140 },
    { accessorKey: 'method', header: $tStore('demonstration.labels.method'), size: 200 },
    {
      accessorKey: 'amount',
      header: $tStore('demonstration.labels.amount'),
      size: 130,
      meta: { format: (v) => currency.format(Number(v)) },
    },
  ]);

  // ─── Code strings ────────────────────────────────────────────────────────
  const codeImportBasic = `import DataTable from '@/components/ui/data-table/data-table.svelte';
import type { DataTableColumn } from '@/components/ui/data-table';`;

  const codeImportWithMeta = `import DataTable from '@/components/ui/data-table/data-table.svelte';
import type { DataTableColumn } from '@/components/ui/data-table';

const columns: DataTableColumn<Invoice>[] = [
  { accessorKey: 'customer', header: 'Cliente', meta: { filter: { type: 'text' }, editable: true } },
];`;

  const interfaceCode = `export interface DataTableProps<TData> {
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
  class?: string;
  onTableReady?: (table: Table<TData>) => void;
  onCellEdit?: (rowIndex: number, columnId: string, value: unknown) => void;
}`;

  const codeCustomizationTokens = `/* Em globals.css — sobrescrever tokens reflete em todos os recursos */
:root {
  --primary: 222 47% 11%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --ring: 222 84% 5%;
}`;
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value}>
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npm install @tanstack/table-core @tanstack/svelte-virtual"
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')} componentSlug="data-table">
    {#snippet children()}
      <div class="w-full">
        <DataTable
          columns={demoColumns}
          data={demoData}
          enableRowSelection
          globalFilterPlaceholder={$tStore('demonstration.labels.search')}
        />
      </div>
    {/snippet}
  </DocsDemonstration>

  <!-- ── Anatomia ───────────────────────────────────────────────── -->
  <DocsAnatomy
    title={$tStore('anatomy.title')}
    items={[
      $tStore('anatomy.item1'),
      $tStore('anatomy.item2'),
      $tStore('anatomy.item3'),
      $tStore('anatomy.item4'),
      $tStore('anatomy.item5'),
      $tStore('anatomy.item6'),
    ]}
    structureLabel={$tStore('anatomy.structureLabel')}
    structureCode={$tStore('anatomy.structureCode')}
  />

  <!-- ── Quando Usar ────────────────────────────────────────────── -->
  <DocsWhenToUse
    title={$tStore('usage.title')}
    guidelines={{
      title: $tStore('usage.guidelines.title'),
      items: [
        $tStore('usage.guidelines.item1'),
        $tStore('usage.guidelines.item2'),
        $tStore('usage.guidelines.item3'),
        $tStore('usage.guidelines.item4'),
        $tStore('usage.guidelines.item5'),
        $tStore('usage.guidelines.item6'),
      ],
    }}
    scenarios={{
      title: $tStore('usage.scenarios.title'),
      cols: {
        scenario: $tStore('usage.scenarios.cols.scenario'),
        use: $tStore('usage.scenarios.cols.use'),
        alternative: $tStore('usage.scenarios.cols.alternative'),
      },
      items: [
        { s: $tStore('usage.scenarios.item1.s'), u: $tStore('usage.scenarios.item1.u'), a: $tStore('usage.scenarios.item1.a') },
        { s: $tStore('usage.scenarios.item2.s'), u: $tStore('usage.scenarios.item2.u'), a: $tStore('usage.scenarios.item2.a') },
        { s: $tStore('usage.scenarios.item3.s'), u: $tStore('usage.scenarios.item3.u'), a: $tStore('usage.scenarios.item3.a') },
        { s: $tStore('usage.scenarios.item4.s'), u: $tStore('usage.scenarios.item4.u'), a: $tStore('usage.scenarios.item4.a') },
        { s: $tStore('usage.scenarios.item5.s'), u: $tStore('usage.scenarios.item5.u'), a: $tStore('usage.scenarios.item5.a') },
        { s: $tStore('usage.scenarios.item6.s'), u: $tStore('usage.scenarios.item6.u'), a: $tStore('usage.scenarios.item6.a') },
      ],
    }}
    uxWriting={{
      title: $tStore('usage.uxWriting.title'),
      cols: {
        element: $tStore('usage.uxWriting.table.element'),
        rules: $tStore('usage.uxWriting.table.rules'),
        do: $tStore('usage.uxWriting.table.correct'),
        dont: $tStore('usage.uxWriting.table.avoid'),
      },
      items: [
        { element: $tStore('usage.uxWriting.table.columnHeader.name'),     rules: $tStore('usage.uxWriting.table.columnHeader.format'),     do: $tStore('usage.uxWriting.table.columnHeader.good'),     dont: $tStore('usage.uxWriting.table.columnHeader.bad') },
        { element: $tStore('usage.uxWriting.table.filterPlaceholder.name'), rules: $tStore('usage.uxWriting.table.filterPlaceholder.format'), do: $tStore('usage.uxWriting.table.filterPlaceholder.good'), dont: $tStore('usage.uxWriting.table.filterPlaceholder.bad') },
        { element: $tStore('usage.uxWriting.table.emptyState.name'),        rules: $tStore('usage.uxWriting.table.emptyState.format'),        do: $tStore('usage.uxWriting.table.emptyState.good'),        dont: $tStore('usage.uxWriting.table.emptyState.bad') },
        { element: $tStore('usage.uxWriting.table.selectionLabel.name'),    rules: $tStore('usage.uxWriting.table.selectionLabel.format'),    do: $tStore('usage.uxWriting.table.selectionLabel.good'),    dont: $tStore('usage.uxWriting.table.selectionLabel.bad') },
      ],
    }}
    do={{
      title: $tStore('usage.do.title'),
      items: [
        $tStore('usage.do.item1'),
        $tStore('usage.do.item2'),
        $tStore('usage.do.item3'),
        $tStore('usage.do.item4'),
      ],
    }}
    dont={{
      title: $tStore('usage.dont.title'),
      items: [
        $tStore('usage.dont.item1'),
        $tStore('usage.dont.item2'),
        $tStore('usage.dont.item3'),
      ],
    }}
  />

  <!-- ── Do & Don't ─────────────────────────────────────────────── -->
  <DocsDoDont
    title={$tStore('doDont.title')}
    pairs={[
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: stripHtml($tStore('doDont.pair1.do')),
        dontCaption: stripHtml($tStore('doDont.pair1.dont')),
        doPreview: doPair1,
        dontPreview: dontPair1,
      },
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: stripHtml($tStore('doDont.pair2.do')),
        dontCaption: stripHtml($tStore('doDont.pair2.dont')),
        doPreview: doPair2,
        dontPreview: dontPair2,
      },
    ]}
  />

  {#snippet doPair1()}
    <div class="text-sm text-muted-foreground">
      <code class="bg-muted px-1.5 py-0.5 rounded text-xs">globalFilterPlaceholder="Buscar fatura, cliente, método..."</code>
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <div class="text-sm text-muted-foreground">
      <code class="bg-muted px-1.5 py-0.5 rounded text-xs">globalFilterPlaceholder="Buscar..."</code>
    </div>
  {/snippet}
  {#snippet doPair2()}
    <div class="text-sm text-muted-foreground">
      <code class="bg-muted px-1.5 py-0.5 rounded text-xs">virtualized maxHeight="480px"</code>
    </div>
  {/snippet}
  {#snippet dontPair2()}
    <div class="text-sm text-muted-foreground">
      <code class="bg-muted px-1.5 py-0.5 rounded text-xs">enablePagination data={`{5000 linhas}`}</code>
    </div>
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    description={$tStore('import.basic')}
    code={codeImportBasic}
    secondaryDescription={$tStore('import.withMeta')}
    secondaryCode={codeImportWithMeta}
  />

  <!-- ── Recursos (Variantes) ───────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    items={[
      { name: 'enableGlobalFilter',    description: stripHtml($tStore('variants.items.globalFilter')),   code: '<DataTable enableGlobalFilter />',     preview: noPreview },
      { name: 'enableColumnFilters',   description: stripHtml($tStore('variants.items.columnFilters')),  code: '<DataTable enableColumnFilters />',    preview: noPreview },
      { name: 'enableRowSelection',    description: stripHtml($tStore('variants.items.selection')),      code: '<DataTable enableRowSelection />',     preview: noPreview },
      { name: 'enableColumnVisibility',description: stripHtml($tStore('variants.items.visibility')),     code: '<DataTable enableColumnVisibility />', preview: noPreview },
      { name: 'enableColumnResizing',  description: stripHtml($tStore('variants.items.resize')),         code: '<DataTable enableColumnResizing />',   preview: noPreview },
      { name: 'enableColumnOrdering',  description: stripHtml($tStore('variants.items.reorder')),        code: '<DataTable enableColumnOrdering />',   preview: noPreview },
      { name: 'enableColumnPinning',   description: stripHtml($tStore('variants.items.pin')),            code: '<DataTable enableColumnPinning />',    preview: noPreview },
      { name: 'enablePagination',      description: stripHtml($tStore('variants.items.pagination')),     code: '<DataTable enablePagination />',       preview: noPreview },
      { name: 'meta.editable',         description: stripHtml($tStore('variants.items.edit')),           code: 'meta: { editable: true }',             preview: noPreview },
      { name: 'virtualized',           description: stripHtml($tStore('variants.items.virtual')),        code: '<DataTable virtualized maxHeight="480px" />', preview: noPreview },
    ]}
  />

  {#snippet noPreview()}
    <span class="text-xs text-muted-foreground italic">Flag opcional — combine livremente conforme o caso de uso.</span>
  {/snippet}

  <!-- ── Estados ────────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('states.cols.state'),
      trigger: $tStore('states.cols.trigger'),
      behavior: $tStore('states.cols.behavior'),
    }}
    items={[
      { label: $tStore('states.empty.label'),       trigger: stripHtml($tStore('states.empty.trigger')),       behavior: stripHtml($tStore('states.empty.behavior'))       },
      { label: $tStore('states.sorted.label'),      trigger: $tStore('states.sorted.trigger'),                 behavior: stripHtml($tStore('states.sorted.behavior'))      },
      { label: $tStore('states.filtered.label'),    trigger: $tStore('states.filtered.trigger'),               behavior: $tStore('states.filtered.behavior')               },
      { label: $tStore('states.selected.label'),    trigger: $tStore('states.selected.trigger'),               behavior: stripHtml($tStore('states.selected.behavior'))    },
      { label: $tStore('states.editing.label'),     trigger: stripHtml($tStore('states.editing.trigger')),     behavior: stripHtml($tStore('states.editing.behavior'))     },
      { label: $tStore('states.resizing.label'),    trigger: $tStore('states.resizing.trigger'),               behavior: stripHtml($tStore('states.resizing.behavior'))    },
      { label: $tStore('states.virtualized.label'), trigger: stripHtml($tStore('states.virtualized.trigger')), behavior: $tStore('states.virtualized.behavior')            },
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        title: $tStore('props.containerTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'columns',                 type: 'ColumnDef<TData>[]',     defaultValue: '—',         required: 'Sim', description: stripHtml($tStore('props.table.columns')) },
          { name: 'data',                    type: 'TData[]',                defaultValue: '—',         required: 'Sim', description: stripHtml($tStore('props.table.data')) },
          { name: 'enableGlobalFilter',      type: 'boolean',                defaultValue: 'true',      required: 'Não', description: $tStore('props.table.enableGlobalFilter') },
          { name: 'globalFilterPlaceholder', type: 'string',                 defaultValue: '"Buscar..."', required: 'Não', description: $tStore('props.table.globalFilterPlaceholder') },
          { name: 'enableRowSelection',      type: 'boolean',                defaultValue: 'false',     required: 'Não', description: $tStore('props.table.enableRowSelection') },
          { name: 'enableColumnVisibility',  type: 'boolean',                defaultValue: 'true',      required: 'Não', description: $tStore('props.table.enableColumnVisibility') },
          { name: 'enableColumnFilters',     type: 'boolean',                defaultValue: 'false',     required: 'Não', description: stripHtml($tStore('props.table.enableColumnFilters')) },
          { name: 'enableColumnResizing',    type: 'boolean',                defaultValue: 'false',     required: 'Não', description: stripHtml($tStore('props.table.enableColumnResizing')) },
          { name: 'enableColumnOrdering',    type: 'boolean',                defaultValue: 'false',     required: 'Não', description: $tStore('props.table.enableColumnOrdering') },
          { name: 'enableColumnPinning',     type: 'boolean',                defaultValue: 'false',     required: 'Não', description: $tStore('props.table.enableColumnPinning') },
          { name: 'enablePagination',        type: 'boolean',                defaultValue: 'true',      required: 'Não', description: $tStore('props.table.enablePagination') },
          { name: 'virtualized',             type: 'boolean',                defaultValue: 'false',     required: 'Não', description: $tStore('props.table.virtualized') },
          { name: 'virtualRowHeight',        type: 'number',                 defaultValue: '36',        required: 'Não', description: $tStore('props.table.virtualRowHeight') },
          { name: 'maxHeight',               type: 'string',                 defaultValue: '"480px"',   required: 'Não', description: stripHtml($tStore('props.table.maxHeight')) },
          { name: 'pageSize',                type: 'number',                 defaultValue: '10',        required: 'Não', description: $tStore('props.table.pageSize') },
          { name: 'pageSizeOptions',         type: 'number[]',               defaultValue: '[10,20,50,100]', required: 'Não', description: stripHtml($tStore('props.table.pageSizeOptions')) },
          { name: 'emptyMessage',            type: 'string',                 defaultValue: '"Sem resultados."', required: 'Não', description: $tStore('props.table.emptyMessage') },
          { name: 'onCellEdit',              type: '(rowIndex, columnId, value) => void', defaultValue: '—', required: 'Não', description: stripHtml($tStore('props.table.onCellEdit')) },
          { name: 'onTableReady',            type: '(table: Table<TData>) => void',        defaultValue: '—', required: 'Não', description: $tStore('props.table.onTableReady') },
        ],
      },
      {
        title: $tStore('props.tooltipTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'meta.filter',   type: '{ type: "text" | "select"; options?: string[]; placeholder?: string }', defaultValue: '—', required: 'Não', description: stripHtml($tStore('props.table.metaFilter')) },
          { name: 'meta.editable', type: 'boolean', defaultValue: 'false', required: 'Não', description: stripHtml($tStore('props.table.metaEditable')) },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityNotes={stripHtml($tStore('props.extensibility'))}
  />

  <!-- ── Tokens ─────────────────────────────────────────────────── -->
  <DocsTokens
    title={$tStore('tokens.title')}
    cols={{
      token: $tStore('tokens.table.token'),
      value: $tStore('tokens.table.class'),
      description: $tStore('tokens.table.part'),
    }}
    items={[
      { token: '--border',           value: 'border-input',                description: stripHtml($tStore('tokens.table.borderPart'))          },
      { token: '--muted',            value: 'bg-muted/50',                 description: stripHtml($tStore('tokens.table.mutedPart'))           },
      { token: '--muted-foreground', value: 'text-muted-foreground',       description: stripHtml($tStore('tokens.table.mutedForegroundPart')) },
      { token: '--primary',          value: 'text-primary',                description: stripHtml($tStore('tokens.table.primaryPart'))         },
      { token: '--background',       value: 'bg-background',               description: stripHtml($tStore('tokens.table.backgroundPart'))      },
      { token: '--ring',             value: 'ring-ring/50',                description: stripHtml($tStore('tokens.table.ringPart'))            },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={codeCustomizationTokens}
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
    title={$tStore('accessibility.title')}
    summary={stripHtml($tStore('accessibility.summary'))}
    items={[
      $tStore('accessibility.item1'),
      $tStore('accessibility.item2'),
      $tStore('accessibility.item3'),
      $tStore('accessibility.item4'),
      $tStore('accessibility.item5'),
      $tStore('accessibility.item6'),
    ]}
    keyboardTitle={$tStore('accessibility.keyboardTitle')}
    keyboardItems={[
      { key: 'Tab',    description: $tStore('accessibility.keyboard.tab')       },
      { key: 'Enter',  description: $tStore('accessibility.keyboard.enter')     },
      { key: 'Space',  description: $tStore('accessibility.keyboard.space')     },
      { key: 'Escape', description: $tStore('accessibility.keyboard.escape')    },
      { key: '↑ ↓',    description: $tStore('accessibility.keyboard.arrowKeys') },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: 'Table',        description: $tStore('related.table'),        path: '?path=/docs/ui-table--docs'        },
      { name: 'Chart',        description: $tStore('related.chart'),        path: '?path=/docs/ui-chart--docs'        },
      { name: 'Pagination',   description: $tStore('related.pagination'),   path: '?path=/docs/ui-pagination--docs'   },
      { name: 'Checkbox',     description: $tStore('related.checkbox'),     path: '?path=/docs/ui-checkbox--docs'     },
      { name: 'Input',        description: $tStore('related.input'),        path: '?path=/docs/ui-input--docs'        },
      { name: 'DropdownMenu', description: $tStore('related.dropdownMenu'), path: '?path=/docs/ui-dropdownmenu--docs' },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    items={[
      { title: '', content: $tStore('notes.tip1') },
      { title: '', content: $tStore('notes.tip2') },
      { title: '', content: $tStore('notes.tip3') },
      { title: '', content: $tStore('notes.tip4') },
      { title: '', content: $tStore('notes.tip5') },
      { title: '', content: $tStore('notes.tip6') },
    ]}
  />

  <!-- ── Analytics ─────────────────────────────────────────────── -->
  <DocsAnalytics
    title={$tStore('analytics.title')}
    cols={{
      event: $tStore('analytics.table.event'),
      trigger: $tStore('analytics.table.trigger'),
      payload: $tStore('analytics.table.payload'),
    }}
    items={[
      { event: $tStore('analytics.table.pageView'),      trigger: $tStore('analytics.table.pageViewTrigger'),      payload: $tStore('analytics.table.pageViewPayload')      },
      { event: $tStore('analytics.table.sectionViewed'), trigger: $tStore('analytics.table.sectionViewedTrigger'), payload: $tStore('analytics.table.sectionViewedPayload') },
      { event: $tStore('analytics.table.langSwitch'),    trigger: $tStore('analytics.table.langSwitchTrigger'),    payload: $tStore('analytics.table.langSwitchPayload')    },
    ]}
  />

  <!-- ── Testes ─────────────────────────────────────────────────── -->
  <DocsTestes
    title={$tStore('testes.title')}
    functional={{
      title: $tStore('testes.functional.title'),
      cols: {
        action: $tNavStore('common.userAction'),
        result: $tNavStore('common.expectedResult'),
        priority: $tNavStore('common.priority'),
      },
      items: [
        { action: $tStore('testes.functional.item1.action'), result: $tStore('testes.functional.item1.result'), priority: localPriority($tStore('testes.functional.item1.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item2.action'), result: $tStore('testes.functional.item2.result'), priority: localPriority($tStore('testes.functional.item2.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item3.action'), result: $tStore('testes.functional.item3.result'), priority: localPriority($tStore('testes.functional.item3.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item4.action'), result: $tStore('testes.functional.item4.result'), priority: localPriority($tStore('testes.functional.item4.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item5.action'), result: $tStore('testes.functional.item5.result'), priority: localPriority($tStore('testes.functional.item5.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item6.action'), result: $tStore('testes.functional.item6.result'), priority: localPriority($tStore('testes.functional.item6.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item7.action'), result: $tStore('testes.functional.item7.result'), priority: localPriority($tStore('testes.functional.item7.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item8.action'), result: $tStore('testes.functional.item8.result'), priority: localPriority($tStore('testes.functional.item8.priority'), $tNavStore) },
      ],
    }}
    accessibility={{
      title: $tStore('testes.accessibility.title'),
      cols: {
        criterion: $tNavStore('common.criterion'),
        level: 'WCAG',
        how: $tNavStore('common.howToVerify'),
      },
      items: [
        { criterion: $tStore('testes.accessibility.item1.criterion'), level: $tStore('testes.accessibility.item1.level'), how: $tStore('testes.accessibility.item1.how') },
        { criterion: $tStore('testes.accessibility.item2.criterion'), level: $tStore('testes.accessibility.item2.level'), how: $tStore('testes.accessibility.item2.how') },
        { criterion: $tStore('testes.accessibility.item3.criterion'), level: $tStore('testes.accessibility.item3.level'), how: $tStore('testes.accessibility.item3.how') },
        { criterion: $tStore('testes.accessibility.item4.criterion'), level: $tStore('testes.accessibility.item4.level'), how: $tStore('testes.accessibility.item4.how') },
      ],
    }}
    visual={{
      title: $tStore('testes.visual.title'),
      cols: {
        story: $tNavStore('common.storyState'),
        priority: $tNavStore('common.priority'),
      },
      items: [
        { story: $tStore('testes.visual.item1.story'), priority: localPriority($tStore('testes.visual.item1.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item2.story'), priority: localPriority($tStore('testes.visual.item2.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item3.story'), priority: localPriority($tStore('testes.visual.item3.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item4.story'), priority: localPriority($tStore('testes.visual.item4.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item5.story'), priority: localPriority($tStore('testes.visual.item5.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item6.story'), priority: localPriority($tStore('testes.visual.item6.priority'), $tNavStore) },
      ],
    }}
  />
</DocsPageLayout>
