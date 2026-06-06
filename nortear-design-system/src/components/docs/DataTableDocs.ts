import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createDataTable, type DataTableColumn } from '@/components/ui/data-table';
import { createBadge } from '@/components/ui/badge';
import uiTranslations from '@/i18n/ui.json';
import dataTableTranslations from '@shared/content/data-table/translations.json';

import {
  createDocsHeader,
  createDocsDemonstration,
  createDocsAnatomy,
  createDocsWhenToUse,
  createDocsDoDont,
  createDocsImport,
  createDocsVariants,
  createDocsCompositions,
  createDocsStates,
  createDocsProps,
  createDocsTokens,
  createDocsAccessibility,
  createDocsRelated,
  createDocsNotes,
  createDocsAnalytics,
  createDocsTestes,
  createDocsPageLayout,
} from '@/components/docs/shared/sections';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);
const { t, subscribe } = createTranslation(dataTableTranslations as Record<string, unknown>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '');
}

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

// ─── Demo data ────────────────────────────────────────────────────────────────

type Invoice = {
  id: string;
  customer: string;
  status: string;
  method: string;
  amount: number;
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  Pago: 'default', Paid: 'default', Pagado: 'default',
  Pendente: 'secondary', Pending: 'secondary', Pendiente: 'secondary',
  Cancelado: 'destructive', Canceled: 'destructive',
};

function demoInvoices(): Invoice[] {
  const paid = t('demonstration.labels.paid');
  const pending = t('demonstration.labels.pending');
  const canceled = t('demonstration.labels.canceled');
  return [
    { id: 'INV-001', customer: 'Ana Souza',    status: paid,     method: 'Pix',                amount: 250 },
    { id: 'INV-002', customer: 'Bruno Lima',   status: pending,  method: 'Boleto',             amount: 150 },
    { id: 'INV-003', customer: 'Carla Mendes', status: canceled, method: 'Cartão de crédito',  amount: 350 },
    { id: 'INV-004', customer: 'Diego Faria',  status: paid,     method: 'Cartão de débito',   amount: 450 },
    { id: 'INV-005', customer: 'Eva Oliveira', status: pending,  method: 'Transferência',      amount: 200 },
  ];
}

function getCurrencyFormatter(): Intl.NumberFormat {
  const locale = getLocale();
  if (locale === 'en') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  if (locale === 'es') return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
}

function demoColumns(): DataTableColumn<Invoice>[] {
  const fmt = getCurrencyFormatter();
  return [
    { accessorKey: 'id',       header: t('demonstration.labels.invoice'),  size: 110, meta: { headerLabel: t('demonstration.labels.invoice') } },
    { accessorKey: 'customer', header: t('demonstration.labels.customer'), size: 180, meta: { headerLabel: t('demonstration.labels.customer') } },
    {
      accessorKey: 'status',
      header: t('demonstration.labels.status'),
      size: 130,
      meta: {
        headerLabel: t('demonstration.labels.status'),
        renderCell: (ctx: { value: unknown }) => createBadge({
          variant: STATUS_VARIANT[ctx.value as string] ?? 'default',
          text: ctx.value as string,
        }),
      },
    },
    { accessorKey: 'method', header: t('demonstration.labels.method'), size: 180, meta: { headerLabel: t('demonstration.labels.method') } },
    {
      accessorKey: 'amount',
      header: t('demonstration.labels.amount'),
      size: 130,
      meta: {
        headerLabel: t('demonstration.labels.amount'),
        renderCell: (ctx: { value: unknown }) => {
          const s = document.createElement('span');
          s.className = 'nds-font-medium nds-tabular-nums';
          s.textContent = fmt.format(ctx.value as number);
          return s;
        },
      },
    },
  ];
}

// ─── createDataTableDocs ──────────────────────────────────────────────────────

export function createDataTableDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────
  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'data-table',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/display' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'data-table',
      locale,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  }
  let cleanupSeo = updateSeo();
  cleanups.push(() => cleanupSeo());

  // ── Nav groups ───────────────────────────────────────────────────────────
  const NAV_GROUPS: { labelKey: string; sections: { id: string; labelKey: string }[] }[] = [
    { labelKey: 'nav.overview', sections: [
      { id: 'demonstracao', labelKey: 'nav.demonstration' },
      { id: 'anatomia',     labelKey: 'nav.anatomy'       },
      { id: 'quando-usar',  labelKey: 'nav.usage'         },
      { id: 'do-dont',      labelKey: 'nav.doDont'        },
    ]},
    { labelKey: 'nav.techRef', sections: [
      { id: 'importacao',   labelKey: 'nav.import'   },
      { id: 'variantes',    labelKey: 'nav.variants' },
      { id: 'composicoes',  labelKey: 'nav.compositions' },
      { id: 'estados',      labelKey: 'nav.states'   },
      { id: 'propriedades', labelKey: 'nav.props'    },
      { id: 'tokens',       labelKey: 'nav.tokens'   },
    ]},
    { labelKey: 'nav.context', sections: [
      { id: 'acessibilidade', labelKey: 'nav.accessibility' },
      { id: 'relacionados',   labelKey: 'nav.related'       },
      { id: 'notas',          labelKey: 'nav.notes'         },
    ]},
    { labelKey: 'nav.quality', sections: [
      { id: 'analytics', labelKey: 'nav.analytics' },
      { id: 'testes',    labelKey: 'nav.testes'    },
    ]},
  ];

  function buildNavGroups() {
    return NAV_GROUPS.map(g => ({
      label: tNav(g.labelKey),
      sections: g.sections.map(s => ({ id: s.id, label: tNav(s.labelKey) })),
    }));
  }

  const pageLayout = createDocsPageLayout({ navGroups: buildNavGroups() });
  const root = pageLayout.root;
  const headerSlot = pageLayout.headerSlot;
  const main = pageLayout.main;

  function renderHeader() {
    const header = createDocsHeader({
      title: t('title'),
      description: t('description'),
      category: t('category'),
      type: t('type'),
      installNote: 'npm install @tanstack/table-core @tanstack/virtual-core',
    });
    headerSlot.replaceChildren(header);
  }

  function buildSidebar() {
    pageLayout.rebuildNav(buildNavGroups());
  }

  function updateActiveNav(activeId: string) {
    pageLayout.setActiveSection(activeId);
  }

  // ── Sections ─────────────────────────────────────────────────────────────
  const sectionOrder = [
    'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
    'importacao', 'variantes', 'composicoes', 'estados', 'propriedades', 'tokens',
    'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
  ] as const;
  type SectionId = typeof sectionOrder[number];

  const sectionEls: Record<SectionId, HTMLElement> = {} as Record<SectionId, HTMLElement>;

  function buildSection(id: SectionId): HTMLElement {
    switch (id) {
      case 'demonstracao':
        return createDocsDemonstration({
          title: t('demonstration.title'),
          componentSlug: 'data-table',
          demoFactory: () => createDataTable<Invoice>({
            columns: demoColumns(),
            data: demoInvoices(),
            enableRowSelection: true,
            enableGlobalFilter: true,
            enableColumnVisibility: true,
            globalFilterPlaceholder: t('demonstration.labels.search'),
            labels: {
              columns: t('demonstration.labels.columns'),
              rowsPerPage: t('demonstration.labels.rowsPerPage'),
              page: t('demonstration.labels.page'),
              pageOf: t('demonstration.labels.of'),
              firstPage: t('demonstration.labels.firstPage'),
              prevPage: t('demonstration.labels.prevPage'),
              nextPage: t('demonstration.labels.nextPage'),
              lastPage: t('demonstration.labels.lastPage'),
            },
            emptyMessage: t('demonstration.labels.noResults'),
          }),
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [
            t('anatomy.item1'), t('anatomy.item2'), t('anatomy.item3'),
            t('anatomy.item4'), t('anatomy.item5'), t('anatomy.item6'),
          ],
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      case 'quando-usar':
        return createDocsWhenToUse({
          title: t('usage.title'),
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [1, 2, 3, 4, 5, 6].map(i => t(`usage.guidelines.item${i}`)),
          },
          scenarios: {
            title: t('usage.scenarios.title'),
            cols: {
              scenario: t('usage.scenarios.cols.scenario'),
              use: t('usage.scenarios.cols.use'),
              alternative: t('usage.scenarios.cols.alternative'),
            },
            items: [1, 2, 3, 4, 5, 6].map(i => ({
              s: t(`usage.scenarios.item${i}.s`),
              u: t(`usage.scenarios.item${i}.u`),
              a: t(`usage.scenarios.item${i}.a`),
            })),
          },
          uxWriting: {
            title: t('usage.uxWriting.title'),
            cols: {
              element: t('usage.uxWriting.table.element'),
              rules: t('usage.uxWriting.table.rules'),
              do: t('usage.uxWriting.table.correct'),
              dont: t('usage.uxWriting.table.avoid'),
            },
            items: ['columnHeader', 'filterPlaceholder', 'emptyState', 'selectionLabel'].map(key => ({
              element: t(`usage.uxWriting.table.${key}.name`),
              rules: t(`usage.uxWriting.table.${key}.format`),
              do: t(`usage.uxWriting.table.${key}.good`),
              dont: t(`usage.uxWriting.table.${key}.bad`),
            })),
          },
          do: {
            title: t('usage.do.title'),
            items: [1, 2, 3, 4].map(i => t(`usage.do.item${i}`)),
          },
          dont: {
            title: t('usage.dont.title'),
            items: [1, 2, 3].map(i => t(`usage.dont.item${i}`)),
          },
        });

      case 'do-dont':
        return createDocsDoDont({
          title: t('doDont.title'),
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: stripHtml(t('doDont.pair1.do')),
              dontCaption: stripHtml(t('doDont.pair1.dont')),
              doPreviewFactory: () => {
                const t2 = createDataTable<Invoice>({
                  columns: demoColumns(),
                  data: demoInvoices().slice(0, 3),
                  enableColumnVisibility: false,
                  enablePagination: false,
                  globalFilterPlaceholder: t('demonstration.labels.search'),
                });
                return t2;
              },
              dontPreviewFactory: () => createDataTable<Invoice>({
                columns: demoColumns(),
                data: demoInvoices().slice(0, 3),
                enableColumnVisibility: false,
                enablePagination: false,
                globalFilterPlaceholder: 'Buscar...',
              }),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: stripHtml(t('doDont.pair2.do')),
              dontCaption: stripHtml(t('doDont.pair2.dont')),
              doPreviewFactory: () => createDataTable<Invoice>({
                columns: demoColumns(),
                data: demoInvoices(),
                virtualized: true,
                maxHeight: '200px',
                enableColumnVisibility: false,
                enableGlobalFilter: false,
              }),
              dontPreviewFactory: () => createDataTable<Invoice>({
                columns: demoColumns(),
                data: demoInvoices(),
                enableColumnVisibility: false,
                enableGlobalFilter: false,
                pageSize: 5,
              }),
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('import.basic'),
          code: `import { createDataTable, type DataTableColumn } from '@/components/ui/data-table';`,
          secondaryDescription: t('import.withMeta'),
          secondaryCode:
`const columns: DataTableColumn<Invoice>[] = [
  {
    accessorKey: 'status',
    header: 'Status',
    meta: {
      headerLabel: 'Status',
      filter: { type: 'select', options: ['Pago', 'Pendente'] },
      editable: true,
    },
  },
];`,
        });

      case 'variantes':
        return createDocsVariants({
          title: t('variants.title'),
          items: [
            'globalFilter', 'columnFilters', 'selection', 'visibility',
            'resize', 'reorder', 'pin', 'pagination', 'edit', 'virtual',
          ].map((key) => ({
            name: key,
            description: stripHtml(t(`variants.items.${key}`)),
            code: `createDataTable({ columns, data, enable${key.charAt(0).toUpperCase() + key.slice(1)}: true })`,
            previewFactory: () => {
              const flag: Record<string, Partial<Parameters<typeof createDataTable<Invoice>>[0]>> = {
                globalFilter: { enableGlobalFilter: true, enableColumnVisibility: false, enablePagination: false },
                columnFilters: { enableColumnFilters: true, enableColumnVisibility: false, enablePagination: false, enableGlobalFilter: false },
                selection: { enableRowSelection: true, enableColumnVisibility: false, enablePagination: false, enableGlobalFilter: false },
                visibility: { enableColumnVisibility: true, enablePagination: false, enableGlobalFilter: false },
                resize: { enableColumnResizing: true, enableColumnVisibility: false, enablePagination: false, enableGlobalFilter: false },
                reorder: { enableColumnOrdering: true, enableColumnVisibility: false, enablePagination: false, enableGlobalFilter: false },
                pin: { enableColumnPinning: true, enablePagination: false, enableGlobalFilter: false },
                pagination: { enablePagination: true, pageSize: 3, enableColumnVisibility: false, enableGlobalFilter: false },
                edit: { enableColumnVisibility: false, enablePagination: false, enableGlobalFilter: false },
                virtual: { virtualized: true, maxHeight: '160px', enableColumnVisibility: false, enableGlobalFilter: false },
              };
              return createDataTable<Invoice>({
                columns: demoColumns(),
                data: demoInvoices(),
                ...(flag[key] ?? {}),
              });
            },
          })),
        });

      case 'composicoes':
        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'data-table',
          items: ['selectionWithActions', 'editableSheet', 'virtualizedLog', 'pinnedKey'].map((key) => ({
            name: t(`variants.compositions.${key}.name`),
            description: stripHtml(t(`variants.compositions.${key}.description`)),
            useWhen: t(`variants.compositions.${key}.use`),
            code: `createDataTable({ /* ${key} */ })`,
            previewFactory: () => {
              const variants: Record<string, Partial<Parameters<typeof createDataTable<Invoice>>[0]>> = {
                selectionWithActions: { enableRowSelection: true, enableGlobalFilter: false, enableColumnVisibility: false, enablePagination: false },
                editableSheet: { enableColumnFilters: true, enableGlobalFilter: false, enableColumnVisibility: false, enablePagination: false },
                virtualizedLog: { virtualized: true, maxHeight: '180px', enableGlobalFilter: false, enableColumnVisibility: false },
                pinnedKey: { enableColumnPinning: true, enableGlobalFilter: false, enableColumnVisibility: false, enablePagination: false },
              };
              return createDataTable<Invoice>({
                columns: demoColumns(),
                data: demoInvoices(),
                ...(variants[key] ?? {}),
              });
            },
          })),
        });

      case 'estados':
        return createDocsStates({
          title: t('states.title'),
          cols: {
            state: t('states.cols.state'),
            trigger: t('states.cols.trigger'),
            behavior: t('states.cols.behavior'),
          },
          items: ['empty', 'sorted', 'filtered', 'selected', 'editing', 'resizing', 'virtualized'].map(key => ({
            label: t(`states.${key}.label`),
            trigger: stripHtml(t(`states.${key}.trigger`)),
            behavior: stripHtml(t(`states.${key}.behavior`)),
          })),
        });

      case 'propriedades': {
        const interfaceCode =
`export interface DataTableOptions<TData> {
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
  onTableReady?: (table: Table<TData>) => void;
  onCellEdit?: (rowIndex: number, columnId: string, value: unknown) => void;
}`;

        const propsCols = {
          prop: t('props.table.prop'),
          type: t('props.table.type'),
          default: t('props.table.default'),
          required: t('props.table.required'),
          description: t('props.table.description'),
        };

        const NO = 'pt-BR' === getLocale() ? 'Não' : (getLocale() === 'es' ? 'No' : 'No');
        const YES = getLocale() === 'pt-BR' ? 'Sim' : (getLocale() === 'es' ? 'Sí' : 'Yes');

        return createDocsProps({
          title: t('props.title'),
          tables: [
            {
              title: t('props.containerTitle'),
              cols: propsCols,
              items: [
                { name: 'columns',                 type: 'ColumnDef<TData>[]',                  defaultValue: '—',              required: YES, description: stripHtml(t('props.table.columns')) },
                { name: 'data',                    type: 'TData[]',                              defaultValue: '—',              required: YES, description: stripHtml(t('props.table.data')) },
                { name: 'enableGlobalFilter',      type: 'boolean',                              defaultValue: 'true',           required: NO,  description: stripHtml(t('props.table.enableGlobalFilter')) },
                { name: 'globalFilterPlaceholder', type: 'string',                               defaultValue: '"Buscar..."',    required: NO,  description: stripHtml(t('props.table.globalFilterPlaceholder')) },
                { name: 'enableRowSelection',      type: 'boolean',                              defaultValue: 'false',          required: NO,  description: stripHtml(t('props.table.enableRowSelection')) },
                { name: 'enableColumnVisibility',  type: 'boolean',                              defaultValue: 'true',           required: NO,  description: stripHtml(t('props.table.enableColumnVisibility')) },
                { name: 'enableColumnFilters',     type: 'boolean',                              defaultValue: 'false',          required: NO,  description: stripHtml(t('props.table.enableColumnFilters')) },
                { name: 'enableColumnResizing',    type: 'boolean',                              defaultValue: 'false',          required: NO,  description: stripHtml(t('props.table.enableColumnResizing')) },
                { name: 'enableColumnOrdering',    type: 'boolean',                              defaultValue: 'false',          required: NO,  description: stripHtml(t('props.table.enableColumnOrdering')) },
                { name: 'enableColumnPinning',     type: 'boolean',                              defaultValue: 'false',          required: NO,  description: stripHtml(t('props.table.enableColumnPinning')) },
                { name: 'enablePagination',        type: 'boolean',                              defaultValue: 'true',           required: NO,  description: stripHtml(t('props.table.enablePagination')) },
                { name: 'virtualized',             type: 'boolean',                              defaultValue: 'false',          required: NO,  description: stripHtml(t('props.table.virtualized')) },
                { name: 'virtualRowHeight',        type: 'number',                               defaultValue: '36',             required: NO,  description: stripHtml(t('props.table.virtualRowHeight')) },
                { name: 'maxHeight',               type: 'string',                               defaultValue: '"480px"',        required: NO,  description: stripHtml(t('props.table.maxHeight')) },
                { name: 'pageSize',                type: 'number',                               defaultValue: '10',             required: NO,  description: stripHtml(t('props.table.pageSize')) },
                { name: 'pageSizeOptions',         type: 'number[]',                             defaultValue: '[10,20,50,100]', required: NO,  description: stripHtml(t('props.table.pageSizeOptions')) },
                { name: 'emptyMessage',            type: 'string',                               defaultValue: '"Sem resultados."', required: NO, description: stripHtml(t('props.table.emptyMessage')) },
                { name: 'onCellEdit',              type: '(rowIndex, columnId, value) => void',  defaultValue: '—',              required: NO,  description: stripHtml(t('props.table.onCellEdit')) },
                { name: 'onTableReady',            type: '(table: Table<TData>) => void',        defaultValue: '—',              required: NO,  description: stripHtml(t('props.table.onTableReady')) },
              ],
            },
            {
              title: t('props.tooltipTitle'),
              cols: propsCols,
              items: [
                { name: 'meta.filter',     type: '{ type: "text" | "select"; options?: string[] }', defaultValue: '—', required: NO, description: stripHtml(t('props.table.metaFilter')) },
                { name: 'meta.editable',   type: 'boolean',                                          defaultValue: '—', required: NO, description: stripHtml(t('props.table.metaEditable')) },
                { name: 'meta.headerLabel', type: 'string',                                          defaultValue: '—', required: NO, description: 'Label legível usado em aria-labels (sort, filter, pin) — fallback é header se for string.' },
                { name: 'meta.renderCell', type: '({ value, row, rowIndex }) => string | HTMLElement', defaultValue: '—', required: NO, description: 'Renderiza conteúdo customizado da célula (badge, formatação, etc.).' },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: stripHtml(t('props.extensibility')),
        });
      }

      case 'tokens': {
        const customizationCode =
`/* themes/*.css */
:root {
  --border: 240 6% 90%;
  --muted: 240 5% 96%;
  --muted-foreground: 240 4% 46%;
  --primary: 222 47% 11%;
  --background: 0 0% 100%;
  --ring: 222 47% 11%;
}`;
        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--border',           value: stripHtml(t('tokens.table.border')),          description: t('tokens.table.borderPart') },
            { token: '--muted',            value: stripHtml(t('tokens.table.muted')),           description: t('tokens.table.mutedPart') },
            { token: '--muted-foreground', value: stripHtml(t('tokens.table.mutedForeground')), description: t('tokens.table.mutedForegroundPart') },
            { token: '--primary',          value: stripHtml(t('tokens.table.primary')),         description: t('tokens.table.primaryPart') },
            { token: '--background',       value: stripHtml(t('tokens.table.background')),      description: t('tokens.table.backgroundPart') },
            { token: '--ring',             value: stripHtml(t('tokens.table.ring')),            description: t('tokens.table.ringPart') },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode,
        });
      }

      case 'acessibilidade':
        return createDocsAccessibility({
          title: t('accessibility.title'),
          summary: stripHtml(t('accessibility.summary')),
          items: [1, 2, 3, 4, 5, 6].map(i => stripHtml(t(`accessibility.item${i}`))),
          keyboardTitle: t('accessibility.keyboardTitle'),
          keyboardItems: [
            { key: 'Tab',    description: t('accessibility.keyboard.tab') },
            { key: 'Enter',  description: t('accessibility.keyboard.enter') },
            { key: 'Space',  description: t('accessibility.keyboard.space') },
            { key: 'Escape', description: t('accessibility.keyboard.escape') },
            { key: '↑ ↓',    description: t('accessibility.keyboard.arrowKeys') },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: 'Table',        description: t('related.table'),        path: '?path=/docs/ui-table--docs' },
            { name: 'Chart',        description: t('related.chart'),        path: '?path=/docs/ui-chart--docs' },
            { name: 'Pagination',   description: t('related.pagination'),   path: '?path=/docs/ui-pagination--docs' },
            { name: 'Checkbox',     description: t('related.checkbox'),     path: '?path=/docs/ui-checkbox--docs' },
            { name: 'Input',        description: t('related.input'),        path: '?path=/docs/ui-input--docs' },
            { name: 'DropdownMenu', description: t('related.dropdownMenu'), path: '?path=/docs/ui-dropdownmenu--docs' },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [1, 2, 3, 4, 5, 6].map(i => ({ title: '', content: t(`notes.tip${i}`) })),
        });

      case 'analytics':
        return createDocsAnalytics({
          title: t('analytics.title'),
          cols: {
            event: t('analytics.table.event'),
            trigger: t('analytics.table.trigger'),
            payload: t('analytics.table.payload'),
          },
          items: [
            { event: t('analytics.table.pageView'),      trigger: t('analytics.table.pageViewTrigger'),      payload: t('analytics.table.pageViewPayload') },
            { event: t('analytics.table.sectionViewed'), trigger: t('analytics.table.sectionViewedTrigger'), payload: t('analytics.table.sectionViewedPayload') },
            { event: t('analytics.table.langSwitch'),    trigger: t('analytics.table.langSwitchTrigger'),    payload: t('analytics.table.langSwitchPayload') },
          ],
        });

      case 'testes':
        return createDocsTestes({
          title: t('testes.title'),
          functional: {
            title: t('testes.functional.title'),
            cols: {
              action: tNav('common.userAction'),
              result: tNav('common.expectedResult'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({
              action: t(`testes.functional.item${i}.action`),
              result: t(`testes.functional.item${i}.result`),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
            items: [1, 2, 3, 4].map(i => ({
              criterion: t(`testes.accessibility.item${i}.criterion`),
              level: t(`testes.accessibility.item${i}.level`),
              how: t(`testes.accessibility.item${i}.how`),
            })),
          },
          visual: {
            title: t('testes.visual.title'),
            cols: {
              story: tNav('common.storyState'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4, 5, 6].map(i => ({
              story: t(`testes.visual.item${i}.story`),
              priority: priorityLabel(t(`testes.visual.item${i}.priority`)),
            })),
          },
        });
    }
  }

  function renderAllSections() {
    for (const id of sectionOrder) {
      const fresh = buildSection(id);
      const existing = sectionEls[id];
      if (existing && existing.parentNode) {
        existing.replaceWith(fresh);
      } else {
        main.appendChild(fresh);
      }
      sectionEls[id] = fresh;
    }
    attachObserver();
  }

  // ── IntersectionObserver ────────────────────────────────────────────────
  let activeSectionObserver: { disconnect: () => void } | null = null;
  function attachObserver() {
    activeSectionObserver?.disconnect();
    activeSectionObserver = createActiveSectionObserver(
      sectionOrder as unknown as string[],
      (id) => sectionEls[id as keyof typeof sectionEls] ?? null,
      (id) => updateActiveNav(id),
      (id) => track('docs_section_viewed', {
        section_id: id,
        component_name: 'data-table',
        locale: getLocale(),
      }),
    );
  }
  cleanups.push(() => activeSectionObserver?.disconnect());

  // ── Initial render ──────────────────────────────────────────────────────
  renderHeader();
  buildSidebar();
  renderAllSections();

  cleanups.push(subscribe(() => {
    cleanupSeo();
    cleanupSeo = updateSeo();
    renderHeader();
    buildSidebar();
    renderAllSections();
  }));
  cleanups.push(onLocaleChange(() => {
    cleanupSeo();
    cleanupSeo = updateSeo();
    renderHeader();
    buildSidebar();
    renderAllSections();
  }));

  // ── Cleanup on disconnect ───────────────────────────────────────────────
  const mo = new MutationObserver(() => {
    if (!document.body.contains(root)) {
      cleanups.forEach(fn => fn());
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return root;
}
