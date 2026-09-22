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
import { stripHtml, toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria. O
// `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
function screenReaderItems(): string[] {
  const locale = getLocale();
  return Object.entries(
    (dataTableTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  )
    .filter(([k]) => k !== 'title')
    .map(([, v]) => v);
}
const { t, subscribe } = createTranslation(dataTableTranslations as Record<string, unknown>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Nome acessível de uma tabela da página.
 *
 * A legenda é o nome da tabela para o leitor de tela. Meia dúzia de tabelas com
 * a mesma legenda é, na lista de tabelas, meia dúzia de tabelas sem nome — por
 * isso o nome base do conteúdo ganha um sufixo por preview.
 */
function captionFor(suffix: string): string {
  return `${t('demonstration.labels.caption')} — ${toPlainText(suffix)}`;
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

type InvoiceStatus = 'paid' | 'pending' | 'canceled';

type InvoiceMethod = 'pix' | 'bankSlip' | 'creditCard' | 'debitCard' | 'transfer';

type Invoice = {
  id: string;
  customer: string;
  status: InvoiceStatus;
  method: InvoiceMethod;
  amount: number;
};

/**
 * Chaveado pela CHAVE do status, nunca pelo texto traduzido.
 *
 * Por texto, o mapa tinha de ser reeditado a cada tradução e uma tradução sem
 * entrada caía calada na variante padrão — foi o que aconteceu com o cancelado
 * em espanhol, que ficou de fora e vinha como `default`. Com a chave estável,
 * traduzir deixa de tocar no mapa e o compilador cobra todo estado novo.
 */
const STATUS_VARIANT: Record<InvoiceStatus, 'default' | 'warning' | 'destructive'> = {
  paid: 'default',
  // Pendência tem variante própria desde que a `secondary` saiu: `warning`
  // diz o que o estado é, e não só que ele é menos importante que o pago.
  pending: 'warning',
  canceled: 'destructive',
};

/**
 * Caminho LITERAL por estado, e não `demonstration.labels.${status}`.
 *
 * A chave interpolada funciona e é invisível: some da busca de quem procura
 * onde um rótulo é usado, e some do portão `demonstration_labels_divergent`,
 * que passou a acusar a stack de REFERÊNCIA de não usar três rótulos que ela
 * usa. É a mesma razão pela qual snippet interpolado não entra em conteúdo
 * compartilhado.
 */
const STATUS_LABEL_KEY: Record<InvoiceStatus, string> = {
  paid: 'demonstration.labels.paid',
  pending: 'demonstration.labels.pending',
  canceled: 'demonstration.labels.canceled',
};

function statusLabel(status: InvoiceStatus): string {
  return t(STATUS_LABEL_KEY[status]);
}

/** Mesma regra do status: o dado guarda a CHAVE, a tradução fica na borda. */
const METHOD_LABEL_KEY: Record<InvoiceMethod, string> = {
  pix: 'demonstration.labels.methodPix',
  bankSlip: 'demonstration.labels.methodBankSlip',
  creditCard: 'demonstration.labels.methodCreditCard',
  debitCard: 'demonstration.labels.methodDebitCard',
  transfer: 'demonstration.labels.methodTransfer',
};

function methodLabel(method: InvoiceMethod): string {
  return t(METHOD_LABEL_KEY[method]);
}

/**
 * A linha guarda a CHAVE do meio de pagamento, não o texto traduzido.
 *
 * Com o rótulo assado na linha, a tabela ficava no idioma em que a fixture foi
 * montada — e trocar de idioma sem remontar o dado deixava a coluna em
 * português no meio de uma página em inglês. A tradução acontece no acessor da
 * coluna, que é também o que faz a busca livre e a ordenação varrerem o texto
 * que está na tela.
 */
function demoInvoices(): Invoice[] {
  return [
    { id: 'INV-001', customer: 'Ana Souza',    status: 'paid',     method: 'pix',        amount: 250 },
    { id: 'INV-002', customer: 'Bruno Lima',   status: 'pending',  method: 'bankSlip',   amount: 150 },
    { id: 'INV-003', customer: 'Carla Mendes', status: 'canceled', method: 'creditCard', amount: 350 },
    { id: 'INV-004', customer: 'Diego Faria',  status: 'paid',     method: 'debitCard',  amount: 450 },
    { id: 'INV-005', customer: 'Eva Oliveira', status: 'pending',  method: 'transfer',   amount: 200 },
  ];
}

/**
 * Rótulos da interface da tabela, montados a partir do conteúdo compartilhado.
 *
 * Sem eles o rodapé cai nos padrões do componente, que são pt-BR — "Linhas por
 * página", "Página X de Y", "Primeira página" — e ficava fixo assim em `en` e
 * `es`. Um objeto só para os treze exemplos da página; cada caminho vai por
 * extenso, pela mesma razão do `STATUS_LABEL_KEY`.
 */
function demoLabels() {
  return {
    columns: t('demonstration.labels.columns'),
    rowsPerPage: t('demonstration.labels.rowsPerPage'),
    page: t('demonstration.labels.page'),
    pageOf: t('demonstration.labels.of'),
    firstPage: t('demonstration.labels.firstPage'),
    prevPage: t('demonstration.labels.prevPage'),
    nextPage: t('demonstration.labels.nextPage'),
    lastPage: t('demonstration.labels.lastPage'),
  };
}

/**
 * Caminho LITERAL por variante — mesma razão do `STATUS_LABEL_KEY`: caminho
 * montado em tempo de execução some da busca de quem procura onde um texto é
 * usado, e some do portão que compara os conjuntos de chaves das cinco stacks.
 */
type FlagVariant =
  | 'globalFilter' | 'columnFilters' | 'selection' | 'visibility'
  | 'resize' | 'reorder' | 'pagination';

/**
 * As sete bandeiras, com nome e descrição.
 *
 * Até 2026-09-22 este mapa apontava para `variants.items.<flag>` direto,
 * porque a chave era uma STRING com a descrição — enquanto as três variantes
 * nomeadas ao lado já eram objeto. Formas misturadas no mesmo mapa do
 * conteúdo, e o efeito aqui era o nome do card virar a chave camelCase crua.
 */
const FLAG_VARIANT_KEY: Record<FlagVariant, { name: string; description: string }> = {
  globalFilter:  { name: 'variants.items.globalFilter.name',  description: 'variants.items.globalFilter.description' },
  columnFilters: { name: 'variants.items.columnFilters.name', description: 'variants.items.columnFilters.description' },
  selection:     { name: 'variants.items.selection.name',     description: 'variants.items.selection.description' },
  visibility:    { name: 'variants.items.visibility.name',    description: 'variants.items.visibility.description' },
  resize:        { name: 'variants.items.resize.name',        description: 'variants.items.resize.description' },
  reorder:       { name: 'variants.items.reorder.name',       description: 'variants.items.reorder.description' },
  pagination:    { name: 'variants.items.pagination.name',    description: 'variants.items.pagination.description' },
};

type NamedVariant = 'editableSheet' | 'virtualizedLog' | 'pinnedKey';

const NAMED_VARIANT_KEY: Record<NamedVariant, { name: string; description: string; use: string }> = {
  editableSheet: {
    name:        'variants.items.editableSheet.name',
    description: 'variants.items.editableSheet.description',
    use:         'variants.items.editableSheet.use',
  },
  virtualizedLog: {
    name:        'variants.items.virtualizedLog.name',
    description: 'variants.items.virtualizedLog.description',
    use:         'variants.items.virtualizedLog.use',
  },
  pinnedKey: {
    name:        'variants.items.pinnedKey.name',
    description: 'variants.items.pinnedKey.description',
    use:         'variants.items.pinnedKey.use',
  },
};

type Composition = 'selectionWithActions';

const COMPOSITION_KEY: Record<Composition, { name: string; description: string; use: string }> = {
  selectionWithActions: {
    name:        'variants.compositions.selectionWithActions.name',
    description: 'variants.compositions.selectionWithActions.description',
    use:         'variants.compositions.selectionWithActions.use',
  },
};

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
      id: 'status',
      // O valor da célula é o RÓTULO e o dado da linha é a CHAVE: busca e
      // ordenação seguem o que está escrito na tela, enquanto a variante do
      // selo continua saindo de um valor que nenhuma tradução move.
      accessorFn: (row: Invoice) => statusLabel(row.status),
      header: t('demonstration.labels.status'),
      size: 130,
      meta: {
        headerLabel: t('demonstration.labels.status'),
        renderCell: (ctx: { value: unknown; row: unknown }) => createBadge({
          variant: STATUS_VARIANT[(ctx.row as Invoice).status],
          text: ctx.value as string,
        }),
      },
    },
    {
      id: 'method',
      // Igual ao status: o acessor devolve o RÓTULO para que busca e ordenação
      // sigam o texto da tela, e a linha continua guardando a chave.
      accessorFn: (row: Invoice) => methodLabel(row.method),
      header: t('demonstration.labels.method'),
      size: 180,
      meta: { headerLabel: t('demonstration.labels.method') },
    },
    {
      accessorKey: 'amount',
      header: t('demonstration.labels.amount'),
      size: 130,
      meta: {
        headerLabel: t('demonstration.labels.amount'),
        // Coluna de número alinha à direita na célula E no cabeçalho, e a
        // célula ganha figura tabular (guideline 20) — quem aplica é o
        // primitivo, então aqui não se repete `nds-tabular-nums`.
        numeric: true,
        renderCell: (ctx: { value: unknown }) => {
          const s = document.createElement('span');
          s.className = 'nds-font-medium';
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
          componentSlug: 'data-table',
          demoFactory: () => createDataTable<Invoice>({
            caption: captionFor(tNav('nav.demonstration')),
            columns: demoColumns(),
            data: demoInvoices(),
            enableRowSelection: true,
            enableGlobalFilter: true,
            enableColumnVisibility: true,
            globalFilterPlaceholder: t('demonstration.labels.search'),
            labels: demoLabels(),
            emptyMessage: t('demonstration.labels.noResults'),
          }),
        });

      case 'anatomia':
        return createDocsAnatomy({
          items: [
            t('anatomy.item1'), t('anatomy.item2'), t('anatomy.item3'),
            t('anatomy.item4'), t('anatomy.item5'), t('anatomy.item6'),
          ],
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      case 'quando-usar':
        return createDocsWhenToUse({
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
              s: toPlainText(t(`usage.scenarios.item${i}.s`)),
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
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair1.do')),
              dontCaption: toPlainText(t('doDont.pair1.dont')),
              doPreviewFactory: () => {
                const t2 = createDataTable<Invoice>({
                  caption: captionFor(t('doDont.pair1.do')),
                  columns: demoColumns(),
                  data: demoInvoices().slice(0, 3),
                  labels: demoLabels(),
                  enableColumnVisibility: false,
                  enablePagination: false,
                  globalFilterPlaceholder: t('demonstration.labels.search'),
                });
                return t2;
              },
              dontPreviewFactory: () => createDataTable<Invoice>({
                caption: captionFor(t('doDont.pair1.dont')),
                columns: demoColumns(),
                data: demoInvoices().slice(0, 3),
                labels: demoLabels(),
                enableColumnVisibility: false,
                enablePagination: false,
                globalFilterPlaceholder: 'Buscar...',
              }),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: () => createDataTable<Invoice>({
                caption: captionFor(t('doDont.pair2.do')),
                columns: demoColumns(),
                data: demoInvoices(),
                labels: demoLabels(),
                virtualized: true,
                maxHeight: '200px',
                enableColumnVisibility: false,
                enableGlobalFilter: false,
              }),
              dontPreviewFactory: () => createDataTable<Invoice>({
                caption: captionFor(t('doDont.pair2.dont')),
                columns: demoColumns(),
                data: demoInvoices(),
                labels: demoLabels(),
                enableColumnVisibility: false,
                enableGlobalFilter: false,
                pageSize: 5,
              }),
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          componentSlug: 'data-table',
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
        return createDocsCompositions({
          id: 'variantes',
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'data-table',
          items: [
            ...(Object.keys(FLAG_VARIANT_KEY) as FlagVariant[]).map((key) => ({
              name: t(FLAG_VARIANT_KEY[key].name),
              // O `name` é texto TRADUZIDO e por isso não pode ser o id: o
              // `DocsVariants` compõe `data-track-id` como
              // `{slug}:code:{trackId ?? name}`, e sem esta linha o mesmo botão
              // emitiria um `snippet_id` por idioma no GA4.
              trackId: key,
              description: stripHtml(t(FLAG_VARIANT_KEY[key].description)),
              code: `createDataTable({ columns, data, enable${key.charAt(0).toUpperCase() + key.slice(1)}: true })`,
              previewFactory: () => {
                const flag: Record<string, Partial<Parameters<typeof createDataTable<Invoice>>[0]>> = {
                  globalFilter: { enableGlobalFilter: true, enableColumnVisibility: false, enablePagination: false },
                  columnFilters: { enableColumnFilters: true, enableColumnVisibility: false, enablePagination: false, enableGlobalFilter: false },
                  selection: { enableRowSelection: true, enableColumnVisibility: false, enablePagination: false, enableGlobalFilter: false },
                  visibility: { enableColumnVisibility: true, enablePagination: false, enableGlobalFilter: false },
                  resize: { enableColumnResizing: true, enableColumnVisibility: false, enablePagination: false, enableGlobalFilter: false },
                  reorder: { enableColumnOrdering: true, enableColumnVisibility: false, enablePagination: false, enableGlobalFilter: false },
                  pagination: { enablePagination: true, pageSize: 3, enableColumnVisibility: false, enableGlobalFilter: false },
                };
                return createDataTable<Invoice>({
                  caption: captionFor(t(FLAG_VARIANT_KEY[key].name)),
                  columns: demoColumns(),
                  data: demoInvoices(),
                  labels: demoLabels(),
                  ...(flag[key] ?? {}),
                });
              },
            })),
            ...(Object.keys(NAMED_VARIANT_KEY) as NamedVariant[]).map((key) => ({
              name: t(NAMED_VARIANT_KEY[key].name),
              trackId: key,
              description: stripHtml(t(NAMED_VARIANT_KEY[key].description)),
              useWhen: t(NAMED_VARIANT_KEY[key].use),
              code: `createDataTable({ /* ${key} */ })`,
              previewFactory: () => {
                const arranjo: Record<string, Partial<Parameters<typeof createDataTable<Invoice>>[0]>> = {
                  editableSheet: { enableColumnFilters: true, enableGlobalFilter: false, enableColumnVisibility: false, enablePagination: false },
                  virtualizedLog: { virtualized: true, maxHeight: '180px', enableGlobalFilter: false, enableColumnVisibility: false },
                  pinnedKey: { enableColumnPinning: true, enableGlobalFilter: false, enableColumnVisibility: false, enablePagination: false },
                };
                return createDataTable<Invoice>({
                  caption: captionFor(t(NAMED_VARIANT_KEY[key].name)),
                  columns: demoColumns(),
                  data: demoInvoices(),
                  labels: demoLabels(),
                  ...(arranjo[key] ?? {}),
                });
              },
            })),
          ],
        });

      case 'composicoes':
        return createDocsCompositions({
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'data-table',
          items: (Object.keys(COMPOSITION_KEY) as Composition[]).map((key) => ({
            trackId: key,
            name: t(COMPOSITION_KEY[key].name),
            description: stripHtml(t(COMPOSITION_KEY[key].description)),
            useWhen: t(COMPOSITION_KEY[key].use),
            code: `createDataTable({ /* ${key} */ })`,
            previewFactory: () => {
              const variants: Record<string, Partial<Parameters<typeof createDataTable<Invoice>>[0]>> = {
                selectionWithActions: { enableRowSelection: true, enableGlobalFilter: false, enableColumnVisibility: false, enablePagination: false },
              };
              return createDataTable<Invoice>({
                caption: captionFor(t(COMPOSITION_KEY[key].name)),
                columns: demoColumns(),
                data: demoInvoices(),
                labels: demoLabels(),
                ...(variants[key] ?? {}),
              });
            },
          })),
        });

      case 'estados':
        return createDocsStates({
          cols: {
            state: t('states.cols.state'),
            trigger: toPlainText(t('states.cols.trigger')),
            behavior: toPlainText(t('states.cols.behavior')),
          },
          items: ['empty', 'sorted', 'filtered', 'selected', 'editing', 'resizing', 'virtualized'].map(key => ({
            label: t(`states.${key}.label`),
            trigger: toPlainText(t(`states.${key}.trigger`)),
            behavior: toPlainText(t(`states.${key}.behavior`)),
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
  caption?: string;
  labels?: Partial<DataTableLabels>;
  rowKey?: (row: TData, index: number) => string;
  rowLabel?: (row: TData) => string;
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
          tables: [
            {
              title: t('props.containerTitle'),
              cols: propsCols,
              items: [
                { name: 'columns',                 type: 'ColumnDef<TData>[]',                  defaultValue: '—',              required: YES, description: toPlainText(t('props.table.columns')) },
                { name: 'data',                    type: 'TData[]',                              defaultValue: '—',              required: YES, description: toPlainText(t('props.table.data')) },
                { name: 'enableGlobalFilter',      type: 'boolean',                              defaultValue: 'true',           required: NO,  description: toPlainText(t('props.table.enableGlobalFilter')) },
                { name: 'globalFilterPlaceholder', type: 'string',                               defaultValue: '"Buscar..."',    required: NO,  description: toPlainText(t('props.table.globalFilterPlaceholder')) },
                { name: 'enableRowSelection',      type: 'boolean',                              defaultValue: 'false',          required: NO,  description: toPlainText(t('props.table.enableRowSelection')) },
                { name: 'enableColumnVisibility',  type: 'boolean',                              defaultValue: 'true',           required: NO,  description: toPlainText(t('props.table.enableColumnVisibility')) },
                { name: 'enableColumnFilters',     type: 'boolean',                              defaultValue: 'false',          required: NO,  description: toPlainText(t('props.table.enableColumnFilters')) },
                { name: 'enableColumnResizing',    type: 'boolean',                              defaultValue: 'false',          required: NO,  description: toPlainText(t('props.table.enableColumnResizing')) },
                { name: 'enableColumnOrdering',    type: 'boolean',                              defaultValue: 'false',          required: NO,  description: toPlainText(t('props.table.enableColumnOrdering')) },
                { name: 'enableColumnPinning',     type: 'boolean',                              defaultValue: 'false',          required: NO,  description: toPlainText(t('props.table.enableColumnPinning')) },
                { name: 'enablePagination',        type: 'boolean',                              defaultValue: 'true',           required: NO,  description: toPlainText(t('props.table.enablePagination')) },
                { name: 'virtualized',             type: 'boolean',                              defaultValue: 'false',          required: NO,  description: toPlainText(t('props.table.virtualized')) },
                { name: 'virtualRowHeight',        type: 'number',                               defaultValue: '36',             required: NO,  description: toPlainText(t('props.table.virtualRowHeight')) },
                { name: 'maxHeight',               type: 'string',                               defaultValue: '"480px"',        required: NO,  description: toPlainText(t('props.table.maxHeight')) },
                { name: 'pageSize',                type: 'number',                               defaultValue: '10',             required: NO,  description: toPlainText(t('props.table.pageSize')) },
                { name: 'pageSizeOptions',         type: 'number[]',                             defaultValue: '[10,20,50,100]', required: NO,  description: toPlainText(t('props.table.pageSizeOptions')) },
                { name: 'emptyMessage',            type: 'string',                               defaultValue: '"Sem resultados."', required: NO, description: toPlainText(t('props.table.emptyMessage')) },
                { name: 'caption',                 type: 'string',                               defaultValue: '—',              required: NO,  description: toPlainText(t('props.table.caption')) },
                { name: 'labels',                  type: 'Partial<DataTableLabels>',             defaultValue: '—',              required: NO,  description: toPlainText(t('props.table.labels')) },
                { name: 'rowKey',                  type: '(row: TData, index: number) => string', defaultValue: '—',             required: NO,  description: toPlainText(t('props.table.rowKey')) },
                { name: 'rowLabel',                type: '(row: TData) => string',               defaultValue: '—',              required: NO,  description: toPlainText(t('props.table.rowLabel')) },
                { name: 'onCellEdit',              type: '(rowIndex, columnId, value) => void',  defaultValue: '—',              required: NO,  description: toPlainText(t('props.table.onCellEdit')) },
                { name: 'onTableReady',            type: '(table: Table<TData>) => void',        defaultValue: '—',              required: NO,  description: toPlainText(t('props.table.onTableReady')) },
              ],
            },
            {
              title: t('props.tooltipTitle'),
              cols: propsCols,
              items: [
                { name: 'meta.filter',     type: '{ type: "text" | "select"; options?: string[] }', defaultValue: '—', required: NO, description: toPlainText(t('props.table.metaFilter')) },
                { name: 'meta.editable',   type: 'boolean',                                          defaultValue: '—', required: NO, description: toPlainText(t('props.table.metaEditable')) },
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
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--border',           value: toPlainText(t('tokens.table.border')),          description: t('tokens.table.borderPart') },
            { token: '--muted',            value: toPlainText(t('tokens.table.muted')),           description: t('tokens.table.mutedPart') },
            { token: '--muted-foreground', value: toPlainText(t('tokens.table.mutedForeground')), description: t('tokens.table.mutedForegroundPart') },
            { token: '--primary',          value: toPlainText(t('tokens.table.primary')),         description: t('tokens.table.primaryPart') },
            { token: '--background',       value: toPlainText(t('tokens.table.background')),      description: t('tokens.table.backgroundPart') },
            { token: '--ring',             value: toPlainText(t('tokens.table.ring')),            description: t('tokens.table.ringPart') },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode,
        });
      }

      case 'acessibilidade':
        return createDocsAccessibility({
          screenReaderTitle: tNav('common.screenReader'),
          screenReaderItems: screenReaderItems(),
          summary: stripHtml(t('accessibility.summary')),
          items: [1, 2, 3, 4, 5, 6].map(i => stripHtml(t(`accessibility.item${i}`))),
          keyboardTitle: t('accessibility.keyboardTitle'),
          keyboardItems: [
            { key: 'Tab',    description: t('accessibility.keyboard.tab') },
            { key: 'Enter',  description: t('accessibility.keyboard.enter') },
            { key: 'Space',  description: t('accessibility.keyboard.space') },
            { key: 'Escape', description: t('accessibility.keyboard.escape') },
            { key: 'Arrow Up / Arrow Down',    description: toPlainText(t('accessibility.keyboard.arrowKeys')) },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          componentSlug: 'data-table',
          items: [
            { name: 'Table',        description: toPlainText(t('related.table')),        path: '?path=/docs/components-tables-table--docs' },
            { name: 'Chart',        description: toPlainText(t('related.chart')),        path: '?path=/docs/components-display-chart--docs' },
            { name: 'Pagination',   description: toPlainText(t('related.pagination')),   path: '?path=/docs/components-navigation-pagination--docs' },
            { name: 'Checkbox',     description: toPlainText(t('related.checkbox')),     path: '?path=/docs/components-form-checkbox--docs' },
            { name: 'Input',        description: toPlainText(t('related.input')),        path: '?path=/docs/components-form-input--docs' },
            { name: 'DropdownMenu', description: toPlainText(t('related.dropdownMenu')), path: '?path=/docs/components-navigation-dropdownmenu--docs' },
          ],
        });

      case 'notas':
        return createDocsNotes({
          componentSlug: 'data-table',
          items: [1, 2, 3, 4, 5, 6].map(i => ({ title: '', content: t(`notes.tip${i}`) })),
        });

      case 'analytics':
        return createDocsAnalytics({
          cols: {
            event: t('analytics.table.event'),
            trigger: toPlainText(t('analytics.table.trigger')),
            payload: t('analytics.table.payload'),
          },
          items: [
            { event: t('analytics.table.pageView'),      trigger: toPlainText(t('analytics.table.pageViewTrigger')),      payload: t('analytics.table.pageViewPayload') },
            { event: t('analytics.table.sectionViewed'), trigger: toPlainText(t('analytics.table.sectionViewedTrigger')), payload: t('analytics.table.sectionViewedPayload') },
            { event: t('analytics.table.langSwitch'),    trigger: toPlainText(t('analytics.table.langSwitchTrigger')),    payload: t('analytics.table.langSwitchPayload') },
          ],
        });

      case 'testes':
        return createDocsTestes({
          functional: {
            title: t('testes.functional.title'),
            cols: {
              action: tNav('common.userAction'),
              result: tNav('common.expectedResult'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => ({
              action: t(`testes.functional.item${i}.action`),
              result: t(`testes.functional.item${i}.result`),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
            items: [1, 2, 3, 4, 5, 6].map(i => ({
              criterion: t(`testes.accessibility.item${i}.criterion`),
              level: t(`testes.accessibility.item${i}.level`),
              how: toPlainText(t(`testes.accessibility.item${i}.how`)),
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
