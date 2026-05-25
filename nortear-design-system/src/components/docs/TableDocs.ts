import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import {
  createTable,
  createTableHeader,
  createTableBody,
  createTableFooter,
  createTableRow,
  createTableHead,
  createTableCell,
  createTableCaption,
} from '@/components/ui/table';
import { createButton } from '@/components/ui/button';
import { createCheckbox } from '@/components/ui/checkbox';
import { createInput } from '@/components/ui/input';
import { createPagination } from '@/components/ui/pagination';
import uiTranslations from '@/i18n/ui.json';
import tableTranslations from '@shared/content/table/translations.json';

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
const { t, subscribe } = createTranslation(tableTranslations as Record<string, unknown>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

const invoices = [
  { id: '#INV-001', status: () => t('demonstration.labels.paid'),    method: () => t('demonstration.labels.creditCard'), amount: () => t('demonstration.labels.amount001') },
  { id: '#INV-002', status: () => t('demonstration.labels.pending'),  method: () => t('demonstration.labels.bankTransfer'), amount: () => t('demonstration.labels.amount002') },
  { id: '#INV-003', status: () => t('demonstration.labels.canceled'), method: () => t('demonstration.labels.pix'),          amount: () => t('demonstration.labels.amount003') },
  { id: '#INV-004', status: () => t('demonstration.labels.paid'),     method: () => t('demonstration.labels.creditCard'),   amount: () => t('demonstration.labels.amount004') },
  { id: '#INV-005', status: () => t('demonstration.labels.pending'),  method: () => t('demonstration.labels.bankTransfer'), amount: () => t('demonstration.labels.amount005') },
];

function buildDemoTable(): HTMLElement {
  const { wrapper, table } = createTable();

  table.appendChild(createTableCaption(t('demonstration.labels.caption')));

  const thead = createTableHeader();
  const headerRow = createTableRow();
  for (const key of ['invoice', 'status', 'method', 'amount'] as const) {
    const th = createTableHead(t(`demonstration.labels.${key}`));
    th.setAttribute('scope', 'col');
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = createTableBody();
  for (const inv of invoices) {
    const tr = createTableRow();
    tr.appendChild(createTableCell(inv.id));
    tr.appendChild(createTableCell(inv.status()));
    tr.appendChild(createTableCell(inv.method()));
    tr.appendChild(createTableCell(inv.amount()));
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  const tfoot = createTableFooter();
  const footerRow = createTableRow();
  const totalLabel = createTableCell(t('demonstration.labels.total'));
  totalLabel.setAttribute('colspan', '3');
  footerRow.appendChild(totalLabel);
  footerRow.appendChild(createTableCell(t('demonstration.labels.totalAmount')));
  tfoot.appendChild(footerRow);
  table.appendChild(tfoot);

  return wrapper;
}

// ─── createTableDocs ──────────────────────────────────────────────────────────

export function createTableDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'table',
    });
    track('docs_page_view', { component_name: 'table', locale, page_title: `${t('title')} · Design System` });
    return cleanup;
  }
  let cleanupSeo = updateSeo();
  cleanups.push(() => cleanupSeo());
  cleanups.push(subscribe(() => { cleanupSeo(); cleanupSeo = updateSeo(); }));

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
      installNote: 'npx shadcn@latest add table',
    });
    headerSlot.replaceChildren(header);
  }

  function buildSidebar() {
    pageLayout.rebuildNav(buildNavGroups());
  }

  function updateActiveNav(activeId: string) {
    pageLayout.setActiveSection(activeId);
  }

  // ── Sections ──────────────────────────────────────────────────────────────

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
          demoFactory: () => buildDemoTable(),
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [
            t('anatomy.item1'),
            t('anatomy.item2'),
            t('anatomy.item3'),
            t('anatomy.item4'),
            t('anatomy.item5'),
            t('anatomy.item6'),
            t('anatomy.item7'),
            t('anatomy.item8'),
          ],
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      case 'quando-usar':
        return createDocsWhenToUse({
          title: t('usage.title'),
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [
              t('usage.guidelines.item1'),
              t('usage.guidelines.item2'),
              t('usage.guidelines.item3'),
              t('usage.guidelines.item4'),
              t('usage.guidelines.item5'),
            ],
          },
          scenarios: {
            title: t('usage.scenarios.title'),
            cols: {
              scenario: t('usage.scenarios.cols.scenario'),
              use: t('usage.scenarios.cols.use'),
              alternative: t('usage.scenarios.cols.alternative'),
            },
            items: [1, 2, 3, 4, 5].map(i => ({
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
            items: ['caption', 'head', 'emptyState', 'actionLabel'].map(key => ({
              element: t(`usage.uxWriting.table.${key}.name`),
              rules: t(`usage.uxWriting.table.${key}.format`),
              do: t(`usage.uxWriting.table.${key}.good`),
              dont: t(`usage.uxWriting.table.${key}.bad`),
            })),
          },
          do: {
            title: t('usage.do.title'),
            items: [
              t('usage.do.item1'),
              t('usage.do.item2'),
              t('usage.do.item3'),
              t('usage.do.item4'),
            ],
          },
          dont: {
            title: t('usage.dont.title'),
            items: [
              t('usage.dont.item1'),
              t('usage.dont.item2'),
              t('usage.dont.item3'),
            ],
          },
        });

      case 'do-dont':
        return createDocsDoDont({
          title: t('doDont.title'),
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair1.do'),
              dontCaption: t('doDont.pair1.dont'),
              doPreviewFactory: () => {
                const { wrapper, table } = createTable();
                table.appendChild(createTableCaption('Lista de faturas recentes'));
                const thead = createTableHeader();
                const tr = createTableRow();
                for (const col of ['Fatura', 'Valor']) {
                  const th = createTableHead(col);
                  th.setAttribute('scope', 'col');
                  tr.appendChild(th);
                }
                thead.appendChild(tr);
                table.appendChild(thead);
                const tbody = createTableBody();
                const row = createTableRow();
                row.appendChild(createTableCell('#INV-001'));
                row.appendChild(createTableCell('R$ 250,00'));
                tbody.appendChild(row);
                table.appendChild(tbody);
                return wrapper;
              },
              dontPreviewFactory: () => {
                const { wrapper, table } = createTable();
                const thead = createTableHeader();
                const tr = createTableRow();
                for (const col of ['Fatura', 'Valor']) {
                  const th = createTableHead(col);
                  tr.appendChild(th);
                }
                thead.appendChild(tr);
                table.appendChild(thead);
                const tbody = createTableBody();
                const row = createTableRow();
                row.appendChild(createTableCell('#INV-001'));
                row.appendChild(createTableCell('R$ 250,00'));
                tbody.appendChild(row);
                table.appendChild(tbody);
                return wrapper;
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: () => {
                const { wrapper, table } = createTable();
                table.appendChild(createTableCaption('Faturas'));
                const thead = createTableHeader();
                const tr = createTableRow();
                const th = createTableHead('Fatura');
                th.setAttribute('scope', 'col');
                tr.appendChild(th);
                thead.appendChild(tr);
                table.appendChild(thead);
                const tbody = createTableBody();
                const emptyRow = createTableRow();
                const emptyCell = createTableCell('Nenhuma fatura encontrada.', 'nds-text-muted-foreground');
                emptyCell.style.height = '4rem';
                emptyCell.style.textAlign = 'center';
                emptyCell.setAttribute('colspan', '1');
                emptyRow.appendChild(emptyCell);
                tbody.appendChild(emptyRow);
                table.appendChild(tbody);
                return wrapper;
              },
              dontPreviewFactory: () => {
                const { wrapper, table } = createTable();
                table.appendChild(createTableCaption('Faturas'));
                const thead = createTableHeader();
                const tr = createTableRow();
                const th = createTableHead('Fatura');
                th.setAttribute('scope', 'col');
                tr.appendChild(th);
                thead.appendChild(tr);
                table.appendChild(thead);
                table.appendChild(createTableBody());
                return wrapper;
              },
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          code: `import {\n  createTable,\n  createTableHeader,\n  createTableBody,\n  createTableFooter,\n  createTableRow,\n  createTableHead,\n  createTableCell,\n  createTableCaption,\n} from '@/components/ui/table';`,
        });

      case 'variantes': {
        const codeBasica = `const { wrapper, table } = createTable();\ntable.appendChild(createTableCaption('Lista de faturas recentes'));\n\nconst thead = createTableHeader();\nconst headerRow = createTableRow();\nfor (const col of ['Fatura', 'Status', 'Método', 'Valor']) {\n  const th = createTableHead(col);\n  th.setAttribute('scope', 'col');\n  headerRow.appendChild(th);\n}\nthead.appendChild(headerRow);\ntable.appendChild(thead);\n\nconst tbody = createTableBody();\nfor (const inv of invoices) {\n  const tr = createTableRow();\n  tr.appendChild(createTableCell(inv.id));\n  tr.appendChild(createTableCell(inv.status));\n  tr.appendChild(createTableCell(inv.method));\n  tr.appendChild(createTableCell(inv.amount));\n  tbody.appendChild(tr);\n}\ntable.appendChild(tbody);`;

        const codeRodape = `const tfoot = createTableFooter();\nconst footerRow = createTableRow();\nconst totalLabel = createTableCell('Total');\ntotalLabel.setAttribute('colspan', '3');\nfooterRow.appendChild(totalLabel);\nfooterRow.appendChild(createTableCell('R$ 1.250,00'));\ntfoot.appendChild(footerRow);\ntable.appendChild(tfoot);`;

        const codeSrOnly = `table.appendChild(createTableCaption('Lista de faturas recentes', 'sr-only'));`;

        const codeAcoes = `const actionCell = createTableCell('');\nconst btn = createButton({\n  variant: 'ghost',\n  label: '...',\n  ariaLabel: \`Ações para fatura \${inv.id}\`,\n});\nactionCell.appendChild(btn);\ntr.appendChild(actionCell);`;

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              name: t('variants.basic.label'),
              description: sanitizeHtml(t('variants.basic.description')),
              code: codeBasica,
              previewFactory: () => {
                const { wrapper, table } = createTable();
                table.appendChild(createTableCaption(t('demonstration.labels.caption')));
                const thead = createTableHeader();
                const tr = createTableRow();
                for (const key of ['invoice', 'status', 'method', 'amount'] as const) {
                  const th = createTableHead(t(`demonstration.labels.${key}`));
                  th.setAttribute('scope', 'col');
                  tr.appendChild(th);
                }
                thead.appendChild(tr);
                table.appendChild(thead);
                const tbody = createTableBody();
                for (const inv of invoices.slice(0, 3)) {
                  const row = createTableRow();
                  row.appendChild(createTableCell(inv.id));
                  row.appendChild(createTableCell(inv.status()));
                  row.appendChild(createTableCell(inv.method()));
                  row.appendChild(createTableCell(inv.amount()));
                  tbody.appendChild(row);
                }
                table.appendChild(tbody);
                return wrapper;
              },
            },
            {
              name: t('variants.withFooter.label'),
              description: sanitizeHtml(t('variants.withFooter.description')),
              code: codeRodape,
              previewFactory: () => {
                const { wrapper, table } = createTable();
                table.appendChild(createTableCaption(t('demonstration.labels.caption')));
                const thead = createTableHeader();
                const tr = createTableRow();
                for (const key of ['invoice', 'status', 'method', 'amount'] as const) {
                  const th = createTableHead(t(`demonstration.labels.${key}`));
                  th.setAttribute('scope', 'col');
                  tr.appendChild(th);
                }
                thead.appendChild(tr);
                table.appendChild(thead);
                const tbody = createTableBody();
                for (const inv of invoices.slice(0, 3)) {
                  const row = createTableRow();
                  row.appendChild(createTableCell(inv.id));
                  row.appendChild(createTableCell(inv.status()));
                  row.appendChild(createTableCell(inv.method()));
                  row.appendChild(createTableCell(inv.amount()));
                  tbody.appendChild(row);
                }
                table.appendChild(tbody);
                const tfoot = createTableFooter();
                const footerRow = createTableRow();
                const totalLabel = createTableCell(t('demonstration.labels.total'));
                totalLabel.setAttribute('colspan', '3');
                footerRow.appendChild(totalLabel);
                footerRow.appendChild(createTableCell(t('demonstration.labels.totalAmount')));
                tfoot.appendChild(footerRow);
                table.appendChild(tfoot);
                return wrapper;
              },
            },
            {
              name: t('variants.withSrOnlyCaption.label'),
              description: sanitizeHtml(t('variants.withSrOnlyCaption.description')),
              code: codeSrOnly,
              previewFactory: () => {
                const { wrapper, table } = createTable();
                table.appendChild(createTableCaption(t('demonstration.labels.caption'), 'sr-only'));
                const thead = createTableHeader();
                const tr = createTableRow();
                for (const key of ['invoice', 'status', 'method', 'amount'] as const) {
                  const th = createTableHead(t(`demonstration.labels.${key}`));
                  th.setAttribute('scope', 'col');
                  tr.appendChild(th);
                }
                thead.appendChild(tr);
                table.appendChild(thead);
                const tbody = createTableBody();
                for (const inv of invoices.slice(0, 3)) {
                  const row = createTableRow();
                  row.appendChild(createTableCell(inv.id));
                  row.appendChild(createTableCell(inv.status()));
                  row.appendChild(createTableCell(inv.method()));
                  row.appendChild(createTableCell(inv.amount()));
                  tbody.appendChild(row);
                }
                table.appendChild(tbody);
                return wrapper;
              },
            },
            {
              name: t('variants.withInlineActions.label'),
              description: sanitizeHtml(t('variants.withInlineActions.description')),
              code: codeAcoes,
              previewFactory: () => {
                const { wrapper, table } = createTable();
                table.appendChild(createTableCaption(t('demonstration.labels.caption')));
                const thead = createTableHeader();
                const tr = createTableRow();
                for (const key of ['invoice', 'status', 'method', 'amount', 'actions'] as const) {
                  const th = createTableHead(t(`demonstration.labels.${key}`));
                  th.setAttribute('scope', 'col');
                  tr.appendChild(th);
                }
                thead.appendChild(tr);
                table.appendChild(thead);
                const tbody = createTableBody();
                for (const inv of invoices.slice(0, 3)) {
                  const row = createTableRow();
                  row.appendChild(createTableCell(inv.id));
                  row.appendChild(createTableCell(inv.status()));
                  row.appendChild(createTableCell(inv.method()));
                  row.appendChild(createTableCell(inv.amount()));
                  const actionCell = createTableCell('');
                  const btn = document.createElement('button');
                  btn.className = 'btn btn-ghost btn-sm';
                  btn.textContent = '...';
                  btn.setAttribute('aria-label', `${t('demonstration.labels.actionsLabel')} ${inv.id}`);
                  actionCell.appendChild(btn);
                  row.appendChild(actionCell);
                  tbody.appendChild(row);
                }
                table.appendChild(tbody);
                return wrapper;
              },
            },
          ],
        });
      }

      case 'composicoes': {
        const codeFilterableToolbar = `const container = document.createElement('div');
container.className = 'nds-stack';
container.dataset.spacing = 'sm';

const toolbar = document.createElement('div');
toolbar.className = 'nds-cluster';
toolbar.dataset.spacing = 'xs';

const input = createInput({ placeholder: 'Filtrar faturas...' });
toolbar.appendChild(input);

const filterBtn = createButton({ variant: 'outline', label: 'Status' });
toolbar.appendChild(filterBtn);

container.appendChild(toolbar);

const { wrapper, table } = createTable();
// ... cabeçalho + corpo filtrado
container.appendChild(wrapper);`;

        const codeSortableHeaders = `const th = createTableHead('');
th.setAttribute('scope', 'col');
th.setAttribute('aria-sort', 'ascending');

const sortBtn = createButton({ variant: 'ghost', size: 'sm', label: 'Fatura' });
// adicione ícone chevron via SVG/innerHTML com aria-hidden="true"
th.appendChild(sortBtn);`;

        const codeSelectableRows = `// Cabeçalho com checkbox mestre
const headRow = createTableRow();
const masterCell = createTableHead('');
masterCell.setAttribute('scope', 'col');
masterCell.appendChild(createCheckbox({ 'aria-label': 'Selecionar todas as linhas' }));
headRow.appendChild(masterCell);
// ...demais headers

// Linha selecionável
const tr = createTableRow();
tr.dataset.state = 'selected';
const cell = createTableCell('');
cell.appendChild(createCheckbox({ checked: true, 'aria-label': \`Selecionar fatura \${inv.id}\` }));
tr.appendChild(cell);`;

        const codeWithPagination = `const container = document.createElement('div');
container.className = 'nds-stack';
container.dataset.spacing = 'sm';

const { wrapper, table } = createTable();
// ... popula table
container.appendChild(wrapper);

const pagination = createPagination({
  total: 5,
  current: 1,
  onPageChange: (page) => render(page),
});
container.appendChild(pagination);`;

        function buildFilterableToolbarPreview(): HTMLElement {
          const container = document.createElement('div');
          container.className = 'nds-stack nds-w-full';
          container.dataset.spacing = 'sm';

          const toolbar = document.createElement('div');
          toolbar.className = 'nds-cluster';
          toolbar.dataset.spacing = 'xs';
          const input = createInput({ placeholder: 'Filtrar faturas...', class: 'nds-max-w-sm' });
          toolbar.appendChild(input);
          const filterBtn = createButton({ variant: 'outline', label: 'Status' });
          toolbar.appendChild(filterBtn);
          container.appendChild(toolbar);

          const { wrapper, table } = createTable();
          table.appendChild(createTableCaption(t('demonstration.labels.caption'), 'sr-only'));
          const thead = createTableHeader();
          const headerRow = createTableRow();
          for (const key of ['invoice', 'status', 'amount'] as const) {
            const th = createTableHead(t(`demonstration.labels.${key}`));
            th.setAttribute('scope', 'col');
            headerRow.appendChild(th);
          }
          thead.appendChild(headerRow);
          table.appendChild(thead);
          const tbody = createTableBody();
          for (const inv of invoices.slice(0, 2)) {
            const row = createTableRow();
            row.appendChild(createTableCell(inv.id));
            row.appendChild(createTableCell(inv.status()));
            row.appendChild(createTableCell(inv.amount()));
            tbody.appendChild(row);
          }
          table.appendChild(tbody);
          container.appendChild(wrapper);
          return container;
        }

        function buildSortableHeadersPreview(): HTMLElement {
          const { wrapper, table } = createTable();
          table.appendChild(createTableCaption(t('demonstration.labels.caption'), 'sr-only'));
          const thead = createTableHeader();
          const headerRow = createTableRow();
          const colDefs: Array<{ label: string; sort: 'ascending' | 'none' }> = [
            { label: t('demonstration.labels.invoice'), sort: 'ascending' },
            { label: t('demonstration.labels.status'), sort: 'none' },
            { label: t('demonstration.labels.amount'), sort: 'none' },
          ];
          for (const col of colDefs) {
            const th = createTableHead('');
            th.setAttribute('scope', 'col');
            th.setAttribute('aria-sort', col.sort);
            const btn = createButton({ variant: 'ghost', size: 'sm', label: col.label });
            btn.style.marginLeft = '-0.5rem';
            btn.style.height = '2rem';
            th.appendChild(btn);
            headerRow.appendChild(th);
          }
          thead.appendChild(headerRow);
          table.appendChild(thead);
          const tbody = createTableBody();
          for (const inv of invoices.slice(0, 2)) {
            const row = createTableRow();
            row.appendChild(createTableCell(inv.id));
            row.appendChild(createTableCell(inv.status()));
            row.appendChild(createTableCell(inv.amount()));
            tbody.appendChild(row);
          }
          table.appendChild(tbody);
          return wrapper;
        }

        function buildSelectableRowsPreview(): HTMLElement {
          const { wrapper, table } = createTable();
          table.appendChild(createTableCaption(t('demonstration.labels.caption'), 'sr-only'));
          const thead = createTableHeader();
          const headerRow = createTableRow();
          const masterCell = createTableHead('');
          masterCell.setAttribute('scope', 'col');
          masterCell.style.width = '2.5rem';
          masterCell.appendChild(createCheckbox({ 'aria-label': 'Selecionar todas as linhas' }));
          headerRow.appendChild(masterCell);
          for (const key of ['invoice', 'status', 'amount'] as const) {
            const th = createTableHead(t(`demonstration.labels.${key}`));
            th.setAttribute('scope', 'col');
            headerRow.appendChild(th);
          }
          thead.appendChild(headerRow);
          table.appendChild(thead);
          const tbody = createTableBody();
          invoices.slice(0, 3).forEach((inv, i) => {
            const row = createTableRow();
            if (i === 0) row.dataset.state = 'selected';
            const cb = createTableCell('');
            cb.appendChild(createCheckbox({ checked: i === 0, 'aria-label': `Selecionar fatura ${inv.id}` }));
            row.appendChild(cb);
            row.appendChild(createTableCell(inv.id));
            row.appendChild(createTableCell(inv.status()));
            row.appendChild(createTableCell(inv.amount()));
            tbody.appendChild(row);
          });
          table.appendChild(tbody);
          return wrapper;
        }

        function buildWithPaginationPreview(): HTMLElement {
          const container = document.createElement('div');
          container.className = 'nds-stack nds-w-full';
          container.dataset.spacing = 'sm';
          const { wrapper, table } = createTable();
          table.appendChild(createTableCaption(t('demonstration.labels.caption'), 'sr-only'));
          const thead = createTableHeader();
          const headerRow = createTableRow();
          for (const key of ['invoice', 'status', 'amount'] as const) {
            const th = createTableHead(t(`demonstration.labels.${key}`));
            th.setAttribute('scope', 'col');
            headerRow.appendChild(th);
          }
          thead.appendChild(headerRow);
          table.appendChild(thead);
          const tbody = createTableBody();
          for (const inv of invoices.slice(0, 2)) {
            const row = createTableRow();
            row.appendChild(createTableCell(inv.id));
            row.appendChild(createTableCell(inv.status()));
            row.appendChild(createTableCell(inv.amount()));
            tbody.appendChild(row);
          }
          table.appendChild(tbody);
          container.appendChild(wrapper);
          container.appendChild(createPagination({ total: 5, current: 1, onPageChange: () => {} }));
          return container;
        }

        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'table',
          items: [
            {
              name: t('variants.compositions.filterableToolbar.name'),
              description: sanitizeHtml(t('variants.compositions.filterableToolbar.description')),
              useWhen: sanitizeHtml(t('variants.compositions.filterableToolbar.use')),
              code: codeFilterableToolbar,
              previewFactory: buildFilterableToolbarPreview,
            },
            {
              name: t('variants.compositions.sortableHeaders.name'),
              description: sanitizeHtml(t('variants.compositions.sortableHeaders.description')),
              useWhen: sanitizeHtml(t('variants.compositions.sortableHeaders.use')),
              code: codeSortableHeaders,
              previewFactory: buildSortableHeadersPreview,
            },
            {
              name: t('variants.compositions.selectableRows.name'),
              description: sanitizeHtml(t('variants.compositions.selectableRows.description')),
              useWhen: sanitizeHtml(t('variants.compositions.selectableRows.use')),
              code: codeSelectableRows,
              previewFactory: buildSelectableRowsPreview,
            },
            {
              name: t('variants.compositions.withPagination.name'),
              description: sanitizeHtml(t('variants.compositions.withPagination.description')),
              useWhen: sanitizeHtml(t('variants.compositions.withPagination.use')),
              code: codeWithPagination,
              previewFactory: buildWithPaginationPreview,
            },
          ],
        });
      }

      case 'estados':
        return createDocsStates({
          title: t('states.title'),
          cols: {
            state: t('states.cols.state'),
            trigger: t('states.cols.trigger'),
            behavior: t('states.cols.behavior'),
          },
          items: [
            {
              label: t('states.empty.label'),
              trigger: t('states.empty.trigger'),
              behavior: sanitizeHtml(t('states.empty.behavior')),
            },
            {
              label: t('states.selected.label'),
              trigger: sanitizeHtml(t('states.selected.trigger')),
              behavior: sanitizeHtml(t('states.selected.behavior')),
            },
            {
              label: t('states.loading.label'),
              trigger: sanitizeHtml(t('states.loading.trigger')),
              behavior: sanitizeHtml(t('states.loading.behavior')),
            },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createTable(extraClass?)
// Retorna { wrapper: HTMLDivElement, table: HTMLTableElement }
createTable(extraClass?: string): { wrapper: HTMLDivElement; table: HTMLTableElement }

// createTableHeader / createTableBody / createTableFooter
createTableHeader(extraClass?: string): HTMLTableSectionElement
createTableBody(extraClass?: string): HTMLTableSectionElement
createTableFooter(extraClass?: string): HTMLTableSectionElement

// createTableRow
createTableRow(extraClass?: string): HTMLTableRowElement

// createTableHead — adicione scope="col" manualmente
createTableHead(text: string, extraClass?: string): HTMLTableCellElement

// createTableCell
createTableCell(text: string, extraClass?: string): HTMLTableCellElement

// createTableCaption
createTableCaption(text: string, extraClass?: string): HTMLTableCaptionElement`;

        const propsCols = {
          prop: t('props.table.prop'),
          type: t('props.table.type'),
          default: t('props.table.default'),
          required: t('props.table.required'),
          description: t('props.table.description'),
        };

        return createDocsProps({
          title: t('props.title'),
          tables: [
            {
              title: t('props.tableTitle'),
              cols: propsCols,
              items: [
                { name: 'extraClass', type: 'string', defaultValue: '—', required: 'Não', description: t('props.items.className') },
              ],
            },
            {
              title: t('props.tableHeadTitle'),
              cols: propsCols,
              items: [
                { name: 'text',       type: 'string', defaultValue: '—', required: 'Sim', description: t('props.items.children') },
                { name: 'extraClass', type: 'string', defaultValue: '—', required: 'Não', description: t('props.items.className') },
                { name: 'scope',      type: '"col"',  defaultValue: '—', required: 'Sim', description: sanitizeHtml(t('props.items.scope')) },
              ],
            },
            {
              title: t('props.tableCellTitle'),
              cols: propsCols,
              items: [
                { name: 'text',       type: 'string', defaultValue: '—', required: 'Sim', description: t('props.items.children') },
                { name: 'extraClass', type: 'string', defaultValue: '—', required: 'Não', description: t('props.items.className') },
                { name: 'colSpan',    type: 'number', defaultValue: '—', required: 'Não', description: t('props.items.colSpan') },
                { name: 'rowSpan',    type: 'number', defaultValue: '—', required: 'Não', description: t('props.items.rowSpan') },
              ],
            },
            {
              title: t('props.tableRowTitle'),
              cols: propsCols,
              items: [
                { name: 'extraClass',  type: 'string',    defaultValue: '—', required: 'Não', description: t('props.items.className') },
                { name: 'data-state',  type: '"selected"', defaultValue: '—', required: 'Não', description: sanitizeHtml(t('props.items.dataState')) },
              ],
            },
            {
              title: t('props.tableCaptionTitle'),
              cols: propsCols,
              items: [
                { name: 'text',       type: 'string', defaultValue: '—', required: 'Sim', description: t('props.items.children') },
                { name: 'extraClass', type: 'string', defaultValue: '—', required: 'Não', description: t('props.items.className') },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: sanitizeHtml(t('props.extensibility')),
        });
      }

      case 'tokens': {
        const customizationCode = `/* Em styles.css — ajustar tokens semânticos */\n:root {\n  --muted: 210 40% 96%;\n  --muted-foreground: 215 16% 47%;\n  --border: 214 32% 91%;\n}\n\n.dark {\n  --muted: 217 33% 17%;\n  --muted-foreground: 215 20% 65%;\n  --border: 217 33% 17%;\n}`;

        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.part'),
            description: t('tokens.table.description'),
          },
          items: [
            { token: 'border-b',                        value: 'TableHeader / TableBody rows', description: sanitizeHtml(t('tokens.items.borderB')) },
            { token: 'bg-muted/50',                     value: 'TableFooter / TableRow hover', description: sanitizeHtml(t('tokens.items.bgMuted')) },
            { token: 'data-[state=selected]:bg-muted',  value: 'TableRow selected',            description: sanitizeHtml(t('tokens.items.bgMutedSelected')) },
            { token: 'text-muted-foreground',           value: 'TableCaption / empty state',   description: sanitizeHtml(t('tokens.items.textMuted')) },
            { token: 'font-medium',                     value: 'TableHead / TableFooter',      description: sanitizeHtml(t('tokens.items.fontMedium')) },
            { token: 'h-10',                            value: 'TableHead',                    description: sanitizeHtml(t('tokens.items.h10')) },
            { token: 'p-2',                             value: 'TableCell',                    description: sanitizeHtml(t('tokens.items.p2')) },
            { token: 'caption-bottom',                  value: 'TableCaption',                 description: sanitizeHtml(t('tokens.items.captionBottom')) },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode,
        });
      }

      case 'acessibilidade':
        return createDocsAccessibility({
          title: t('accessibility.title'),
          summary: sanitizeHtml(t('accessibility.summary')),
          items: [
            sanitizeHtml(t('accessibility.aria.scope')),
            sanitizeHtml(t('accessibility.aria.caption')),
            sanitizeHtml(t('accessibility.aria.ariaLabel')),
            sanitizeHtml(t('accessibility.aria.ariaSort')),
            sanitizeHtml(t('accessibility.aria.tabIndex')),
          ],
          keyboardTitle: t('accessibility.title'),
          keyboardItems: [
            { key: 'Tab',   description: t('accessibility.keyboard.tab') },
            { key: 'Enter', description: t('accessibility.keyboard.enter') },
            { key: 'Space', description: t('accessibility.keyboard.space') },
            { key: '—',     description: t('accessibility.keyboard.noKeyboard') },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: 'Badge',        description: t('related.badge'),        path: '?path=/docs/ui-badge--docs' },
            { name: 'Skeleton',     description: t('related.skeleton'),     path: '?path=/docs/ui-skeleton--docs' },
            { name: 'Pagination',   description: t('related.pagination'),   path: '?path=/docs/ui-pagination--docs' },
            { name: 'DropdownMenu', description: t('related.dropdownMenu'), path: '?path=/docs/ui-dropdown-menu--docs' },
            { name: 'Avatar',       description: t('related.avatar'),       path: '?path=/docs/ui-avatar--docs' },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [
            { title: '', content: sanitizeHtml(t('notes.tip1')) },
            { title: '', content: sanitizeHtml(t('notes.tip2')) },
            { title: '', content: sanitizeHtml(t('notes.tip3')) },
            { title: '', content: sanitizeHtml(t('notes.tip4')) },
            { title: '', content: sanitizeHtml(t('notes.tip5')) },
          ],
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
            items: [1, 2, 3, 4, 5, 6].map(i => ({
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
            items: [1, 2, 3, 4, 5].map(i => ({
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

  // ── IntersectionObserver ─────────────────────────────────────────────────

  let activeSectionObserver: { disconnect: () => void } | null = null;

  function attachObserver() {
    activeSectionObserver?.disconnect();
    activeSectionObserver = createActiveSectionObserver(
      sectionOrder as unknown as string[],
      (id) => sectionEls[id as keyof typeof sectionEls] ?? null,
      (id) => updateActiveNav(id),
      (id) => track('docs_section_viewed', {
        section_id: id,
        component_name: 'table',
        locale: getLocale(),
      }),
    );
  }
  cleanups.push(() => activeSectionObserver?.disconnect());

  // ── Initial render ────────────────────────────────────────────────────────

  renderHeader();
  buildSidebar();
  renderAllSections();

  cleanups.push(subscribe(() => {
    renderHeader();
    buildSidebar();
    renderAllSections();
  }));
  cleanups.push(onLocaleChange(() => {
    renderHeader();
    buildSidebar();
    renderAllSections();
  }));

  // ── Cleanup on disconnect ────────────────────────────────────────────────

  const mo = new MutationObserver(() => {
    if (!document.body.contains(root)) {
      cleanups.forEach(fn => fn());
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return root;
}
