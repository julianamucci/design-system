import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import DOMPurify from 'dompurify';
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
import { ChevronDown, createElement } from 'lucide';
import uiTranslations from '@/i18n/ui.json';
import tableTranslations from '@shared/content/table/translations.json';
import { toPlainText } from '@/lib/strip-html';

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

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria. O
// `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
function screenReaderItems(): string[] {
  const locale = getLocale();
  return Object.entries(
    (tableTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  )
    .filter(([k]) => k !== 'title')
    .map(([, v]) => v);
}
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

/**
 * Os índices `itemN` de uma seção do dicionário, em ordem.
 *
 * Contar à mão envelhece em silêncio: `testes.functional` tinha SETE itens
 * escritos nos três idiomas e a página publicava seis; `testes.visual`, seis e
 * cinco. Os últimos existiam, eram traduzidos, e não chegavam à tela. Cravar
 * `[1..7]` no lugar de `[1..6]` repetiria o defeito na próxima entrada, então a
 * lista sai do próprio dicionário e passa a acompanhar quem escreve o conteúdo.
 */
function itemIndices(path: string): number[] {
  const locale = getLocale();
  const section = path
    .split('.')
    .reduce<unknown>(
      (node, key) =>
        node && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined,
      (tableTranslations as Record<string, unknown>)[locale],
    );
  if (!section || typeof section !== 'object') return [];
  return Object.keys(section)
    .map((key) => /^item(\d+)$/.exec(key))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b);
}

/**
 * Rótulo de coluna por CAMINHO POR EXTENSO, nunca interpolado.
 *
 * A varredura que compara as cinco demonstrações procura a string literal
 * `demonstration.labels.<chave>` no arquivo. Chave montada em template literal
 * não aparece para ela — foi assim que esta página constava lendo 19 dos 26
 * rótulos: `method` só existia dentro de um `t(\`…${key}\`)`. O mapa mantém o
 * laço sobre colunas e devolve a chave ao alcance de quem mede.
 */
const columnLabel = {
  invoice: () => t('demonstration.labels.invoice'),
  status:  () => t('demonstration.labels.status'),
  method:  () => t('demonstration.labels.method'),
  amount:  () => t('demonstration.labels.amount'),
  actions: () => t('demonstration.labels.actions'),
  details: () => t('demonstration.labels.detailsColumn'),
} as const;

// O identificador da fatura também é conteúdo traduzido — idêntico nos três
// idiomas porque é número de documento, o que é esperado e não redundância.
// Cravá-lo aqui tirava cinco chaves do dicionário da varredura.
const invoices = [
  { id: () => t('demonstration.labels.inv001'), status: () => t('demonstration.labels.paid'),     method: () => t('demonstration.labels.creditCard'),   amount: () => t('demonstration.labels.amount001') },
  { id: () => t('demonstration.labels.inv002'), status: () => t('demonstration.labels.pending'),  method: () => t('demonstration.labels.bankTransfer'), amount: () => t('demonstration.labels.amount002') },
  { id: () => t('demonstration.labels.inv003'), status: () => t('demonstration.labels.canceled'), method: () => t('demonstration.labels.pix'),          amount: () => t('demonstration.labels.amount003') },
  { id: () => t('demonstration.labels.inv004'), status: () => t('demonstration.labels.paid'),     method: () => t('demonstration.labels.creditCard'),   amount: () => t('demonstration.labels.amount004') },
  { id: () => t('demonstration.labels.inv005'), status: () => t('demonstration.labels.pending'),  method: () => t('demonstration.labels.bankTransfer'), amount: () => t('demonstration.labels.amount005') },
];

/**
 * Sequência dos `id` de linha de detalhe.
 *
 * Módulo, e não seção: a página remonta todas as seções a cada troca de idioma
 * e de conteúdo, e um contador reiniciado repetiria `id` de linha que ainda
 * está no documento — `aria-controls` passaria a apontar para a primeira
 * ocorrência, que é a da árvore antiga.
 */
let detailSeq = 0;

/**
 * Um par de linhas do exemplo de linha expansível: a de dados e a irmã revelada.
 *
 * A forma sai da story `WithExpandableRows` de `table-variants.stories.ts`, em
 * escala menor. Os quatro contratos que ela prova, e que a prévia precisa
 * manter:
 *
 * 1. **`aria-expanded` mora no BOTÃO, nunca na `<tr>`** — a linha já usa
 *    `data-state` para a seleção, e os dois estados coexistem. Quem faz a linha
 *    reagir é a folha compartilhada, por `tbody tr:has([aria-expanded="true"])`.
 * 2. **A revelada é IRMÃ, sempre no DOM, escondida por `hidden`** — o `id` dela
 *    é o alvo do `aria-controls`, e alvo que some deixa o atributo apontando
 *    para nada. O `colspan` cobre as colunas de dado MAIS a do disclosure.
 * 3. **O nome acessível é o do REGISTRO e não muda ao alternar** — quem anuncia
 *    o estado é o `aria-expanded`.
 * 4. **A ordem de foco sai do DOM** — a linha revelada vem logo depois da de
 *    dados, então o botão que ela contém é o próximo ponto de tabulação depois
 *    do controle, sem `tabindex` nenhum.
 */
function buildExpandableRow(
  tbody: HTMLTableSectionElement,
  invoice: (typeof invoices)[number],
  selected = false,
): void {
  const detailId = `table-docs-row-detail-${++detailSeq}`;
  const invoiceId = invoice.id();

  const row = createTableRow();
  if (selected) row.setAttribute('data-state', 'selected');

  const controlCell = createTableCell('');
  const toggle = createButton({
    variant: 'ghost',
    size: 'icon-sm',
    'aria-label': `${t('demonstration.labels.detailsLabel')} ${invoiceId}`,
  });
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', detailId);
  // Sem classe de tamanho: `.nds-button > svg` já dimensiona o ícone dentro do
  // botão. `nds-chevron` é a rotação global do disclosure, e ela casa com
  // `[aria-expanded="true"]` — o mesmo atributo que a folha da tabela lê.
  const chevron = createElement(ChevronDown);
  chevron.setAttribute('aria-hidden', 'true');
  chevron.classList.add('nds-chevron');
  toggle.appendChild(chevron);
  controlCell.appendChild(toggle);
  row.appendChild(controlCell);

  row.appendChild(createTableCell(invoiceId));
  row.appendChild(createTableCell(invoice.status()));
  row.appendChild(createTableCell(invoice.amount()));
  tbody.appendChild(row);

  const detailRow = createTableRow();
  detailRow.id = detailId;
  detailRow.hidden = true;
  const detailCell = createTableCell('');
  // Três colunas de dado mais a do disclosure.
  detailCell.setAttribute('colspan', '4');

  const stack = document.createElement('div');
  stack.className = 'nds-stack';
  stack.dataset.spacing = 'sm';
  const description = document.createElement('p');
  description.className = 'nds-text-muted-foreground';
  description.textContent = t('demonstration.labels.detailText');
  // Um controle dentro do detalhe: é ele que torna visível que o conteúdo
  // revelado entra na tabulação logo depois do disclosure — e sai dela quando a
  // linha fecha, pelo mesmo `hidden`.
  const receipt = createButton({
    variant: 'outline',
    size: 'sm',
    label: t('demonstration.labels.receipt'),
    'aria-label': `${t('demonstration.labels.receiptLabel')} ${invoiceId}`,
  });
  stack.append(description, receipt);
  detailCell.appendChild(stack);
  detailRow.appendChild(detailCell);
  tbody.appendChild(detailRow);

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    detailRow.hidden = open;
  });
}

function buildDemoTable(): HTMLElement {
  const { wrapper, table } = createTable();

  table.appendChild(createTableCaption(t('demonstration.labels.caption')));

  const thead = createTableHeader();
  const headerRow = createTableRow();
  // O `scope` vem da FÁBRICA: `createTableHead` nasce em `scope="col"`. As
  // chamadas a `setAttribute('scope', 'col')` que esta página espalhava só
  // repetiam o default e faziam parecer que a responsabilidade era de quem
  // chama. Cabeçalho de LINHA continua passando `'row'` no terceiro parâmetro.
  for (const key of ['invoice', 'status', 'method', 'amount'] as const) {
    const th = createTableHead(columnLabel[key]());
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = createTableBody();
  for (const inv of invoices) {
    const tr = createTableRow();
    tr.appendChild(createTableCell(inv.id()));
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
          demoFactory: () => buildDemoTable(),
        });

      case 'anatomia':
        return createDocsAnatomy({
          items: itemIndices('anatomy').map(i => t(`anatomy.item${i}`)),
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      case 'quando-usar':
        return createDocsWhenToUse({
          guidelines: {
            title: t('usage.guidelines.title'),
            items: itemIndices('usage.guidelines').map(i => t(`usage.guidelines.item${i}`)),
          },
          scenarios: {
            title: t('usage.scenarios.title'),
            cols: {
              scenario: t('usage.scenarios.cols.scenario'),
              use: t('usage.scenarios.cols.use'),
              alternative: t('usage.scenarios.cols.alternative'),
            },
            items: itemIndices('usage.scenarios').map(i => ({
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
            items: itemIndices('usage.do').map(i => t(`usage.do.item${i}`)),
          },
          dont: {
            title: t('usage.dont.title'),
            items: itemIndices('usage.dont').map(i => t(`usage.dont.item${i}`)),
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
                const { wrapper, table } = createTable();
                table.appendChild(createTableCaption(t('demonstration.labels.caption')));
                const thead = createTableHeader();
                const tr = createTableRow();
                for (const col of [columnLabel.invoice(), columnLabel.amount()]) {
                  const th = createTableHead(col);
                  tr.appendChild(th);
                }
                thead.appendChild(tr);
                table.appendChild(thead);
                const tbody = createTableBody();
                const row = createTableRow();
                row.appendChild(createTableCell(t('demonstration.labels.inv001')));
                row.appendChild(createTableCell(t('demonstration.labels.amount001')));
                tbody.appendChild(row);
                table.appendChild(tbody);
                return wrapper;
              },
              dontPreviewFactory: () => {
                const { wrapper, table } = createTable();
                // Sem `createTableCaption`: a AUSÊNCIA da legenda é o defeito
                // que o par ilustra, e é a única diferença entre esta prévia e
                // a do lado — preservar. (O par ilustrava o `scope` ausente até
                // a fábrica passar a aplicá-lo por default, quando as duas
                // metades viraram a mesma tabela e o par parou de ensinar.)
                const thead = createTableHeader();
                const tr = createTableRow();
                for (const col of [columnLabel.invoice(), columnLabel.amount()]) {
                  const th = createTableHead(col);
                  tr.appendChild(th);
                }
                thead.appendChild(tr);
                table.appendChild(thead);
                const tbody = createTableBody();
                const row = createTableRow();
                row.appendChild(createTableCell(t('demonstration.labels.inv001')));
                row.appendChild(createTableCell(t('demonstration.labels.amount001')));
                tbody.appendChild(row);
                table.appendChild(tbody);
                return wrapper;
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: () => {
                const { wrapper, table } = createTable();
                table.appendChild(createTableCaption(t('demonstration.labels.caption')));
                const thead = createTableHeader();
                const tr = createTableRow();
                const th = createTableHead(columnLabel.invoice());
                tr.appendChild(th);
                thead.appendChild(tr);
                table.appendChild(thead);
                const tbody = createTableBody();
                const emptyRow = createTableRow();
                // `.nds-table-empty` é a classe que a folha declara para isto:
                // ela já traz `block-size`, `text-align: center` e a cor
                // esmaecida (D3 do PRD). Escrever altura e alinhamento em
                // `style` inline vencia a folha e levava o estado vazio para
                // fora do tema, da densidade e da escala tipográfica.
                const emptyCell = createTableCell(t('demonstration.labels.emptyState'), 'nds-table-empty');
                emptyCell.setAttribute('colspan', '1');
                emptyRow.appendChild(emptyCell);
                tbody.appendChild(emptyRow);
                table.appendChild(tbody);
                return wrapper;
              },
              dontPreviewFactory: () => {
                const { wrapper, table } = createTable();
                table.appendChild(createTableCaption(t('demonstration.labels.caption')));
                const thead = createTableHeader();
                const tr = createTableRow();
                const th = createTableHead(columnLabel.invoice());
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
          componentSlug: 'table',
          code: `import {\n  createTable,\n  createTableHeader,\n  createTableBody,\n  createTableFooter,\n  createTableRow,\n  createTableHead,\n  createTableCell,\n  createTableCaption,\n} from '@/components/ui/table';`,
        });

      case 'variantes': {
        const codeBasica = `const { wrapper, table } = createTable();\ntable.appendChild(createTableCaption('Lista de faturas recentes'));\n\nconst thead = createTableHeader();\nconst headerRow = createTableRow();\nfor (const col of ['Fatura', 'Status', 'Método', 'Valor']) {\n  const th = createTableHead(col);\n  th.setAttribute('scope', 'col');\n  headerRow.appendChild(th);\n}\nthead.appendChild(headerRow);\ntable.appendChild(thead);\n\nconst tbody = createTableBody();\nfor (const inv of invoices) {\n  const tr = createTableRow();\n  tr.appendChild(createTableCell(inv.id));\n  tr.appendChild(createTableCell(inv.status));\n  tr.appendChild(createTableCell(inv.method));\n  tr.appendChild(createTableCell(inv.amount));\n  tbody.appendChild(tr);\n}\ntable.appendChild(tbody);`;

        const codeFooter = `const tfoot = createTableFooter();\nconst footerRow = createTableRow();\nconst totalLabel = createTableCell('Total');\ntotalLabel.setAttribute('colspan', '3');\nfooterRow.appendChild(totalLabel);\nfooterRow.appendChild(createTableCell('R$ 1.250,00'));\ntfoot.appendChild(footerRow);\ntable.appendChild(tfoot);`;

        const codeSrOnly = `table.appendChild(createTableCaption('Lista de faturas recentes', 'nds-sr-only'));`;

        // O `label` é a reticência tipográfica `…` (U+2026), e não três pontos:
        // o snippet ensina o mesmo caractere que a prévia ao lado renderiza.
        const codeActions = `const actionCell = createTableCell('');\nconst btn = createButton({\n  variant: 'ghost',\n  size: 'sm',\n  label: '…',\n  'aria-label': \`Ações para fatura \${inv.id}\`,\n});\nactionCell.appendChild(btn);\ntr.appendChild(actionCell);`;

        const codeEmptyState = `const tbody = createTableBody();\nconst emptyRow = createTableRow();\n// \`nds-table-empty\` reserva a altura, centraliza e esmaece a mensagem.\nconst emptyCell = createTableCell('Nenhuma fatura encontrada.', 'nds-table-empty');\nemptyCell.setAttribute('colspan', '4');\nemptyRow.appendChild(emptyCell);\ntbody.appendChild(emptyRow);\ntable.appendChild(tbody);`;

        const codeExpandable = `// O estado vive no BOTÃO: a linha já usa \`data-state\` para a seleção.\nconst toggle = createButton({\n  variant: 'ghost',\n  size: 'icon-sm',\n  'aria-label': \`Detalhes da fatura \${inv.id}\`,\n});\ntoggle.setAttribute('aria-expanded', 'false');\ntoggle.setAttribute('aria-controls', detailId);\nconst chevron = createElement(ChevronDown);\nchevron.setAttribute('aria-hidden', 'true');\nchevron.classList.add('nds-chevron');\ntoggle.appendChild(chevron);\n\n// A linha revelada é IRMÃ, sempre no DOM, escondida por \`hidden\`.\nconst detailRow = createTableRow();\ndetailRow.id = detailId;\ndetailRow.hidden = true;\nconst detailCell = createTableCell('');\n// Colunas de dado MAIS a do disclosure.\ndetailCell.setAttribute('colspan', '4');\n\ntoggle.addEventListener('click', () => {\n  const open = toggle.getAttribute('aria-expanded') === 'true';\n  toggle.setAttribute('aria-expanded', String(!open));\n  detailRow.hidden = open;\n});`;

        return createDocsVariants({
          items: [
            {
              trackId: 'basic',
              name: t('variants.items.basic.label'),
              description: DOMPurify.sanitize(t('variants.items.basic.description')),
              code: codeBasica,
              previewFactory: () => {
                const { wrapper, table } = createTable();
                table.appendChild(createTableCaption(t('demonstration.labels.caption')));
                const thead = createTableHeader();
                const tr = createTableRow();
                for (const key of ['invoice', 'status', 'method', 'amount'] as const) {
                  const th = createTableHead(columnLabel[key]());
                  tr.appendChild(th);
                }
                thead.appendChild(tr);
                table.appendChild(thead);
                const tbody = createTableBody();
                for (const inv of invoices.slice(0, 3)) {
                  const row = createTableRow();
                  row.appendChild(createTableCell(inv.id()));
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
              trackId: 'withFooter',
              name: t('variants.items.withFooter.label'),
              description: DOMPurify.sanitize(t('variants.items.withFooter.description')),
              code: codeFooter,
              previewFactory: () => {
                const { wrapper, table } = createTable();
                table.appendChild(createTableCaption(t('demonstration.labels.caption')));
                const thead = createTableHeader();
                const tr = createTableRow();
                for (const key of ['invoice', 'status', 'method', 'amount'] as const) {
                  const th = createTableHead(columnLabel[key]());
                  tr.appendChild(th);
                }
                thead.appendChild(tr);
                table.appendChild(thead);
                const tbody = createTableBody();
                // As CINCO, e nao as tres primeiras: `totalAmount` e a soma das
                // cinco faturas. Com tres na tela, o total do rodape nao fechava
                // com o que estava acima dele — e rodape de total e justamente
                // o que esta variante existe para ensinar.
                for (const inv of invoices) {
                  const row = createTableRow();
                  row.appendChild(createTableCell(inv.id()));
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
              trackId: 'withSrOnlyCaption',
              name: t('variants.items.withSrOnlyCaption.label'),
              description: DOMPurify.sanitize(t('variants.items.withSrOnlyCaption.description')),
              code: codeSrOnly,
              previewFactory: () => {
                const { wrapper, table } = createTable();
                table.appendChild(createTableCaption(t('demonstration.labels.caption'), 'nds-sr-only'));
                const thead = createTableHeader();
                const tr = createTableRow();
                for (const key of ['invoice', 'status', 'method', 'amount'] as const) {
                  const th = createTableHead(columnLabel[key]());
                  tr.appendChild(th);
                }
                thead.appendChild(tr);
                table.appendChild(thead);
                const tbody = createTableBody();
                for (const inv of invoices.slice(0, 3)) {
                  const row = createTableRow();
                  row.appendChild(createTableCell(inv.id()));
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
              trackId: 'withInlineActions',
              name: t('variants.items.withInlineActions.label'),
              description: DOMPurify.sanitize(t('variants.items.withInlineActions.description')),
              code: codeActions,
              previewFactory: () => {
                const { wrapper, table } = createTable();
                table.appendChild(createTableCaption(t('demonstration.labels.caption')));
                const thead = createTableHeader();
                const tr = createTableRow();
                for (const key of ['invoice', 'status', 'method', 'amount', 'actions'] as const) {
                  const th = createTableHead(columnLabel[key]());
                  tr.appendChild(th);
                }
                thead.appendChild(tr);
                table.appendChild(thead);
                const tbody = createTableBody();
                for (const inv of invoices.slice(0, 3)) {
                  const row = createTableRow();
                  row.appendChild(createTableCell(inv.id()));
                  row.appendChild(createTableCell(inv.status()));
                  row.appendChild(createTableCell(inv.method()));
                  row.appendChild(createTableCell(inv.amount()));
                  const actionCell = createTableCell('');
                  // `btn btn-ghost btn-sm` não existe em `docs/shared/styles/nds/`:
                  // eram três classes sem uma única declaração, resíduo de antes
                  // da migração `.nds-*`. O botão aqui é o componente, que é o
                  // que o snippet ao lado já mostra.
                  const btn = createButton({
                    variant: 'ghost',
                    size: 'sm',
                    // `…` é a reticência tipográfica (U+2026), UM caractere — não
                    // os três pontos de `...`, que o leitor de tela soletra e a
                    // quebra de linha pode partir no meio.
                    label: '…',
                    'aria-label': `${t('demonstration.labels.actionsLabel')} ${inv.id()}`,
                  });
                  actionCell.appendChild(btn);
                  row.appendChild(actionCell);
                  tbody.appendChild(row);
                }
                table.appendChild(tbody);
                return wrapper;
              },
            },
            {
              trackId: 'withEmptyState',
              name: t('variants.items.withEmptyState.label'),
              description: DOMPurify.sanitize(t('variants.items.withEmptyState.description')),
              code: codeEmptyState,
              previewFactory: () => {
                const { wrapper, table } = createTable();
                table.appendChild(createTableCaption(t('demonstration.labels.caption')));
                const thead = createTableHeader();
                const tr = createTableRow();
                for (const key of ['invoice', 'status', 'method', 'amount'] as const) {
                  const th = createTableHead(columnLabel[key]());
                  tr.appendChild(th);
                }
                thead.appendChild(tr);
                table.appendChild(thead);
                const tbody = createTableBody();
                const emptyRow = createTableRow();
                // `.nds-table-empty` é a classe que a folha declara para isto:
                // ela já traz `block-size`, `text-align: center` e a cor
                // esmaecida (D3 do PRD). Altura e alinhamento em `style` inline
                // venceriam a folha e levariam o estado vazio para fora do
                // tema, da densidade e da escala tipográfica.
                const emptyCell = createTableCell(t('demonstration.labels.emptyState'), 'nds-table-empty');
                emptyCell.setAttribute('colspan', '4');
                emptyRow.appendChild(emptyCell);
                tbody.appendChild(emptyRow);
                table.appendChild(tbody);
                return wrapper;
              },
            },
            {
              trackId: 'withExpandableRows',
              name: t('variants.items.withExpandableRows.label'),
              description: DOMPurify.sanitize(t('variants.items.withExpandableRows.description')),
              code: codeExpandable,
              previewFactory: () => {
                const { wrapper, table } = createTable();
                table.appendChild(createTableCaption(t('demonstration.labels.caption')));
                const thead = createTableHeader();
                const tr = createTableRow();
                // A coluna do disclosure vem primeiro e TEM cabeçalho: o rótulo
                // sai da tela num `<span class="nds-sr-only">`, e não por classe
                // no próprio `<th>`, que desmontaria a grade.
                const thDetails = createTableHead('');
                const labelDetails = document.createElement('span');
                labelDetails.className = 'nds-sr-only';
                labelDetails.textContent = columnLabel.details();
                thDetails.appendChild(labelDetails);
                tr.appendChild(thDetails);
                for (const key of ['invoice', 'status', 'amount'] as const) {
                  const th = createTableHead(columnLabel[key]());
                  tr.appendChild(th);
                }
                thead.appendChild(tr);
                table.appendChild(thead);
                const tbody = createTableBody();
                // A segunda nasce MARCADA: aberta e selecionada ao mesmo tempo é
                // o caso que o `:not([data-state="selected"])` da folha protege,
                // e é o que esta prévia existe para deixar ver.
                invoices.slice(0, 3).forEach((inv, i) => buildExpandableRow(tbody, inv, i === 1));
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
toolbar.dataset.spacing = 'md';

// O nome acessível espelha a dica: a dica some ao digitar, o nome fica.
const input = createInput({
  placeholder: 'Filtrar faturas...',
  'aria-label': 'Filtrar faturas',
});
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
masterCell.appendChild(createCheckbox({ 'aria-label': 'Selecionar todas as faturas' }));
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
          toolbar.dataset.spacing = 'md';
          // O nome acessível espelha a dica, e as duas saem do dicionário: a
          // dica some ao digitar, o nome fica. Forma alinhada às outras quatro
          // e ao que o `data-table` já fazia.
          const filterLabel = t('demonstration.labels.filterLabel');
          const input = createInput({
            placeholder: filterLabel + '...',
            class: 'nds-max-w-sm',
          });
          // Por `setAttribute` e não por opção da fábrica: `InputOptions` não
          // aceita `aria-label`, enquanto `ButtonOptions` aceita. É lacuna da
          // fábrica de Input, não desta página — registrada para a passagem
          // daquele componente. O `data-table` resolve o seletor de linhas por
          // página do mesmo jeito, pela mesma razão.
          input.setAttribute('aria-label', filterLabel);
          toolbar.appendChild(input);
          // Mesma regra do `aria-label` ao lado, e o defeito era mais silencioso
          // aqui: `'Status'` cravado casa com pt-BR e com en, então só o leitor
          // em es via a divergência — o dicionário diz "Estado".
          const filterBtn = createButton({ variant: 'outline', label: columnLabel.status() });
          toolbar.appendChild(filterBtn);
          container.appendChild(toolbar);

          const { wrapper, table } = createTable();
          table.appendChild(createTableCaption(t('demonstration.labels.caption'), 'nds-sr-only'));
          const thead = createTableHeader();
          const headerRow = createTableRow();
          for (const key of ['invoice', 'status', 'amount'] as const) {
            const th = createTableHead(columnLabel[key]());
            headerRow.appendChild(th);
          }
          thead.appendChild(headerRow);
          table.appendChild(thead);
          const tbody = createTableBody();
          for (const inv of invoices.slice(0, 2)) {
            const row = createTableRow();
            row.appendChild(createTableCell(inv.id()));
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
          table.appendChild(createTableCaption(t('demonstration.labels.caption'), 'nds-sr-only'));
          const thead = createTableHeader();
          const headerRow = createTableRow();
          const colDefs: Array<{ label: string; sort: 'ascending' | 'none' }> = [
            { label: t('demonstration.labels.invoice'), sort: 'ascending' },
            { label: t('demonstration.labels.status'), sort: 'none' },
            { label: t('demonstration.labels.amount'), sort: 'none' },
          ];
          for (const col of colDefs) {
            const th = createTableHead('');
            th.setAttribute('aria-sort', col.sort);
            // Nem recuo negativo nem altura cravada: o `size: 'sm'` já dimensiona
            // o botão, e altura fixa em primitivo interativo impede o componente
            // de crescer com a fonte do navegador (WCAG 1.4.4). As outras quatro
            // stacks montam este mesmo cabeçalho sem nenhum dos dois.
            const btn = createButton({ variant: 'ghost', size: 'sm', label: col.label });
            th.appendChild(btn);
            headerRow.appendChild(th);
          }
          thead.appendChild(headerRow);
          table.appendChild(thead);
          const tbody = createTableBody();
          for (const inv of invoices.slice(0, 2)) {
            const row = createTableRow();
            row.appendChild(createTableCell(inv.id()));
            row.appendChild(createTableCell(inv.status()));
            row.appendChild(createTableCell(inv.amount()));
            tbody.appendChild(row);
          }
          table.appendChild(tbody);
          return wrapper;
        }

        function buildSelectableRowsPreview(): HTMLElement {
          const { wrapper, table } = createTable();
          table.appendChild(createTableCaption(t('demonstration.labels.caption'), 'nds-sr-only'));
          const thead = createTableHeader();
          const headerRow = createTableRow();
          const masterCell = createTableHead('');
          // A coluna de seleção não precisa de largura cravada: o `<th>` encolhe
          // para o checkbox sozinho, que é como as outras quatro stacks montam.
          // Nome acessível é TEXTO DE TELA: sai do dicionário como qualquer
          // outro, e não cravado em pt-BR. `selectAll` diz "todas as faturas" e
          // não "todas as linhas" — nomear o registro é mais útil que nomear a
          // grade para quem só ouve a página.
          masterCell.appendChild(createCheckbox({ 'aria-label': t('demonstration.labels.selectAll') }));
          headerRow.appendChild(masterCell);
          for (const key of ['invoice', 'status', 'amount'] as const) {
            const th = createTableHead(columnLabel[key]());
            headerRow.appendChild(th);
          }
          thead.appendChild(headerRow);
          table.appendChild(thead);
          const tbody = createTableBody();
          invoices.slice(0, 3).forEach((inv, i) => {
            const row = createTableRow();
            if (i === 0) row.dataset.state = 'selected';
            const cb = createTableCell('');
            // `selectRow` é PREFIXO, como `actionsLabel`: compõe com o id.
            cb.appendChild(createCheckbox({ checked: i === 0, 'aria-label': `${t('demonstration.labels.selectRow')} ${inv.id()}` }));
            row.appendChild(cb);
            row.appendChild(createTableCell(inv.id()));
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
          table.appendChild(createTableCaption(t('demonstration.labels.caption'), 'nds-sr-only'));
          const thead = createTableHeader();
          const headerRow = createTableRow();
          for (const key of ['invoice', 'status', 'amount'] as const) {
            const th = createTableHead(columnLabel[key]());
            headerRow.appendChild(th);
          }
          thead.appendChild(headerRow);
          table.appendChild(thead);
          const tbody = createTableBody();
          for (const inv of invoices.slice(0, 2)) {
            const row = createTableRow();
            row.appendChild(createTableCell(inv.id()));
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
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'table',
          items: [
            {
              trackId: 'filterableToolbar',
              name: t('variants.compositions.filterableToolbar.name'),
              description: DOMPurify.sanitize(t('variants.compositions.filterableToolbar.description')),
              useWhen: DOMPurify.sanitize(t('variants.compositions.filterableToolbar.use')),
              code: codeFilterableToolbar,
              previewFactory: buildFilterableToolbarPreview,
            },
            {
              trackId: 'sortableHeaders',
              name: t('variants.compositions.sortableHeaders.name'),
              description: DOMPurify.sanitize(t('variants.compositions.sortableHeaders.description')),
              useWhen: DOMPurify.sanitize(t('variants.compositions.sortableHeaders.use')),
              code: codeSortableHeaders,
              previewFactory: buildSortableHeadersPreview,
            },
            {
              trackId: 'selectableRows',
              name: t('variants.compositions.selectableRows.name'),
              description: DOMPurify.sanitize(t('variants.compositions.selectableRows.description')),
              useWhen: DOMPurify.sanitize(t('variants.compositions.selectableRows.use')),
              code: codeSelectableRows,
              previewFactory: buildSelectableRowsPreview,
            },
            {
              trackId: 'withPagination',
              name: t('variants.compositions.withPagination.name'),
              description: DOMPurify.sanitize(t('variants.compositions.withPagination.description')),
              useWhen: DOMPurify.sanitize(t('variants.compositions.withPagination.use')),
              code: codeWithPagination,
              previewFactory: buildWithPaginationPreview,
            },
          ],
        });
      }

      case 'estados':
        return createDocsStates({
          cols: {
            state: t('states.cols.state'),
            trigger: toPlainText(t('states.cols.trigger')),
            behavior: toPlainText(t('states.cols.behavior')),
          },
          items: [
            {
              label: t('states.empty.label'),
              trigger: toPlainText(t('states.empty.trigger')),
              behavior: toPlainText(t('states.empty.behavior')),
            },
            {
              label: t('states.selected.label'),
              trigger: toPlainText(t('states.selected.trigger')),
              behavior: toPlainText(t('states.selected.behavior')),
            },
            {
              label: t('states.loading.label'),
              trigger: toPlainText(t('states.loading.trigger')),
              behavior: toPlainText(t('states.loading.behavior')),
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

// createTableHead — o scope nasce em "col"; cabeçalho de linha passa "row"
createTableHead(
  text: string,
  extraClass?: string,
  scope?: 'col' | 'row' | 'colgroup' | 'rowgroup',
): HTMLTableCellElement

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
                { name: 'scope',      type: '"col"',  defaultValue: '—', required: 'Sim', description: DOMPurify.sanitize(t('props.items.scope')) },
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
                { name: 'data-state',  type: '"selected"', defaultValue: '—', required: 'Não', description: DOMPurify.sanitize(t('props.items.dataState')) },
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
          extensibilityNotes: DOMPurify.sanitize(t('props.extensibility')),
        });
      }

      case 'tokens': {
        const customizationCode = `/* Em styles.css — ajustar tokens semânticos */\n:root {\n  --muted: 210 40% 96%;\n  --muted-foreground: 215 16% 47%;\n  --border: 214 32% 91%;\n}\n\n.dark {\n  --muted: 217 33% 17%;\n  --muted-foreground: 215 20% 65%;\n  --border: 217 33% 17%;\n}`;

        return createDocsTokens({
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.part'),
            description: t('tokens.table.description'),
          },
          items: [
            { token: '--border',                        value: 'TableHeader / TableBody rows', description: DOMPurify.sanitize(t('tokens.items.borderB')) },
            { token: '--muted',                     value: 'TableFooter / TableRow hover', description: DOMPurify.sanitize(t('tokens.items.bgMuted')) },
            { token: '--muted',  value: 'TableRow selected',            description: DOMPurify.sanitize(t('tokens.items.bgMutedSelected')) },
            { token: '--muted-foreground',           value: 'TableCaption / empty state',   description: DOMPurify.sanitize(t('tokens.items.textMuted')) },
            { token: '--font-weight-medium',                     value: 'TableHead / TableFooter',      description: DOMPurify.sanitize(t('tokens.items.fontMedium')) },
            { token: '--spacing-10',                            value: 'TableHead',                    description: DOMPurify.sanitize(t('tokens.items.h10')) },
            { token: '--spacing-2',                             value: 'TableCell',                    description: DOMPurify.sanitize(t('tokens.items.p2')) },
            { token: 'caption-side',                  value: 'TableCaption',                 description: DOMPurify.sanitize(t('tokens.items.captionBottom')) },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode,
        });
      }

      case 'acessibilidade':
        return createDocsAccessibility({
          screenReaderTitle: tNav('common.screenReader'),
          screenReaderItems: screenReaderItems(),
          summary: DOMPurify.sanitize(t('accessibility.summary')),
          items: [
            DOMPurify.sanitize(t('accessibility.aria.scope')),
            DOMPurify.sanitize(t('accessibility.aria.caption')),
            DOMPurify.sanitize(t('accessibility.aria.ariaLabel')),
            DOMPurify.sanitize(t('accessibility.aria.ariaSort')),
            DOMPurify.sanitize(t('accessibility.aria.tabIndex')),
          ],
          keyboardTitle: tNav('nav.accessibility'),
          keyboardItems: [
            { key: 'Tab',   description: t('accessibility.keyboard.tab') },
            { key: 'Enter', description: t('accessibility.keyboard.enter') },
            { key: 'Space', description: t('accessibility.keyboard.space') },
            { key: '—',     description: t('accessibility.keyboard.noKeyboard') },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          componentSlug: 'table',
          items: [
            { name: 'Badge',        description: toPlainText(t('related.badge')),        path: '?path=/docs/components-feedback-badge--docs' },
            { name: 'Skeleton',     description: toPlainText(t('related.skeleton')),     path: '?path=/docs/components-feedback-skeleton--docs' },
            { name: 'Pagination',   description: toPlainText(t('related.pagination')),   path: '?path=/docs/components-navigation-pagination--docs' },
            { name: 'DropdownMenu', description: toPlainText(t('related.dropdownMenu')), path: '?path=/docs/components-navigation-dropdownmenu--docs' },
            { name: 'Avatar',       description: toPlainText(t('related.avatar')),       path: '?path=/docs/components-display-avatar--docs' },
          ],
        });

      case 'notas':
        return createDocsNotes({
          componentSlug: 'table',
          items: [
            { title: '', content: DOMPurify.sanitize(t('notes.tip1')) },
            { title: '', content: DOMPurify.sanitize(t('notes.tip2')) },
            { title: '', content: DOMPurify.sanitize(t('notes.tip3')) },
            { title: '', content: DOMPurify.sanitize(t('notes.tip4')) },
            { title: '', content: DOMPurify.sanitize(t('notes.tip5')) },
          ],
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
            items: itemIndices('testes.functional').map(i => ({
              action: t(`testes.functional.item${i}.action`),
              result: t(`testes.functional.item${i}.result`),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
            items: itemIndices('testes.accessibility').map(i => ({
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
            items: itemIndices('testes.visual').map(i => ({
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
