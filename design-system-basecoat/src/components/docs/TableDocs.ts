import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import {
  createTable, createTableHeader, createTableBody, createTableFooter,
  createTableRow, createTableHead, createTableCell, createTableCaption,
} from '@/components/ui/table';
import uiTranslations from '@/i18n/ui.json';
import tableTranslations from '@shared/content/table/translations.json';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);
const { t, subscribe } = createTranslation(tableTranslations as Record<string, unknown>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INVOICES = [
  { invoice: 'INV001', status: 'paid',    method: 'creditCard',   amount: 'R$ 250,00' },
  { invoice: 'INV002', status: 'pending', method: 'paypal',       amount: 'R$ 150,00' },
  { invoice: 'INV003', status: 'unpaid',  method: 'bankTransfer', amount: 'R$ 350,00' },
  { invoice: 'INV004', status: 'paid',    method: 'creditCard',   amount: 'R$ 450,00' },
  { invoice: 'INV005', status: 'paid',    method: 'paypal',       amount: 'R$ 550,00' },
];

function buildDemoTable(): HTMLElement {
  const { wrapper, table } = createTable();
  table.appendChild(createTableCaption(t('demonstration.labels.caption')));

  const thead = createTableHeader();
  const trHead = createTableRow();
  const headCols = [
    { key: 'invoice', extra: 'w-[100px]' },
    { key: 'status',  extra: '' },
    { key: 'method',  extra: '' },
    { key: 'amount',  extra: 'text-right' },
  ];
  headCols.forEach(({ key, extra }) => {
    const th = createTableHead(t(`demonstration.labels.${key}`), extra);
    th.setAttribute('scope', 'col');
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);

  const tbody = createTableBody();
  INVOICES.forEach((row) => {
    const tr = createTableRow();
    tr.appendChild(createTableCell(row.invoice, 'font-medium'));
    tr.appendChild(createTableCell(t(`demonstration.labels.${row.status}`)));
    tr.appendChild(createTableCell(t(`demonstration.labels.${row.method}`)));
    tr.appendChild(createTableCell(row.amount, 'text-right'));
    tbody.appendChild(tr);
  });

  const tfoot = createTableFooter();
  const trFoot = createTableRow();
  const tdTotal = createTableCell(t('demonstration.labels.total'));
  tdTotal.setAttribute('colspan', '3');
  trFoot.appendChild(tdTotal);
  trFoot.appendChild(createTableCell('R$ 1.750,00', 'text-right'));
  tfoot.appendChild(trFoot);

  table.appendChild(thead);
  table.appendChild(tbody);
  table.appendChild(tfoot);
  return wrapper;
}

function buildMiniTable(options: { caption?: boolean; footer?: boolean; selected?: boolean; empty?: boolean }): HTMLElement {
  const { wrapper, table } = createTable();
  if (options.caption) table.appendChild(createTableCaption(t('demonstration.labels.caption')));

  const thead = createTableHeader();
  const trHead = createTableRow();
  ['invoice', 'status', 'amount'].forEach((key, i) => {
    const th = createTableHead(t(`demonstration.labels.${key}`), i === 2 ? 'text-right' : '');
    th.setAttribute('scope', 'col');
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);

  const tbody = createTableBody();
  if (options.empty) {
    const tr = createTableRow();
    const td = createTableCell('Nenhuma fatura encontrada. Crie a primeira.', 'text-center text-muted-foreground py-8');
    td.setAttribute('colspan', '3');
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    const rows = [
      { invoice: 'INV001', status: 'paid',    amount: 'R$ 250,00' },
      { invoice: 'INV002', status: 'pending', amount: 'R$ 150,00' },
      { invoice: 'INV003', status: 'paid',    amount: 'R$ 350,00' },
    ];
    rows.forEach((row, i) => {
      const tr = createTableRow();
      if (options.selected && i === 1) tr.setAttribute('data-state', 'selected');
      tr.appendChild(createTableCell(row.invoice, 'font-medium'));
      tr.appendChild(createTableCell(t(`demonstration.labels.${row.status}`)));
      tr.appendChild(createTableCell(row.amount, 'text-right'));
      tbody.appendChild(tr);
    });
  }
  table.appendChild(tbody);

  if (options.footer) {
    const tfoot = createTableFooter();
    const trFoot = createTableRow();
    const tdTotal = createTableCell(t('demonstration.labels.total'));
    tdTotal.setAttribute('colspan', '2');
    trFoot.appendChild(tdTotal);
    trFoot.appendChild(createTableCell('R$ 750,00', 'text-right'));
    tfoot.appendChild(trFoot);
    table.appendChild(tfoot);
  }

  return wrapper;
}

// ─── createTableDocs ──────────────────────────────────────────────────────────

export function createTableDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  const root = document.createElement('div');
  root.className = 'ds-docs p-8 max-w-5xl mx-auto';

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: `${t('title')} — ${t('category')}`,
      description: t('seo.description'),
      locale,
      componentSlug: 'table',
    });
    track('docs_page_view', { component_name: 'table', locale, page_title: `${t('title')} · Design System` });
    return cleanup;
  }
  let cleanupSeo = updateSeo();
  cleanups.push(() => cleanupSeo());
  const unsubSeo = subscribe(() => { cleanupSeo(); cleanupSeo = updateSeo(); });
  cleanups.push(unsubSeo);

  // ── Header ───────────────────────────────────────────────────────────────

  const header = document.createElement('header');
  header.className = 'mb-12 border-b pb-8 border-border/50';

  const topRow = document.createElement('div');
  topRow.className = 'flex items-center justify-between mb-4';

  const badgeRow = document.createElement('div');
  badgeRow.className = 'flex items-center gap-2';

  const badgeCategory = document.createElement('span');
  badgeCategory.className = 'inline-flex items-center rounded-md border border-primary/10 bg-primary/5 px-2 py-0 text-xs font-medium text-primary';

  const badgeType = document.createElement('span');
  badgeType.className = 'inline-flex items-center rounded-md border border-border px-2 py-0 text-xs font-normal text-muted-foreground';
  badgeRow.append(badgeCategory, badgeType);

  // Language switcher
  type Locale = 'pt-BR' | 'en' | 'es';
  const switcherWrapper = document.createElement('div');
  switcherWrapper.className = 'flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border/40';
  const localeDefs: { value: Locale; label: string; ariaLabel: string }[] = [
    { value: 'pt-BR', label: 'PT', ariaLabel: 'Português' },
    { value: 'en',    label: 'EN', ariaLabel: 'English'   },
    { value: 'es',    label: 'ES', ariaLabel: 'Español'   },
  ];
  const langButtons: HTMLButtonElement[] = [];

  function updateLangButtons() {
    const current = getLocale();
    langButtons.forEach(b => {
      const active = b.dataset.locale === current;
      b.className = active
        ? 'h-6 px-2 text-[10px] font-bold rounded bg-secondary text-secondary-foreground shadow-sm transition-all'
        : 'h-6 px-2 text-[10px] font-bold rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all';
      b.setAttribute('aria-pressed', String(active));
    });
  }

  localeDefs.forEach(({ value, label, ariaLabel }) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.locale = value;
    b.setAttribute('aria-label', ariaLabel);
    b.textContent = label;
    b.addEventListener('click', () => {
      const prev = getLocale();
      if (prev === value) return;
      track('language_switched', { previous_language: prev, new_language: value });
      import('@/lib/i18n').then(({ setLocale }) => setLocale(value as Locale));
    });
    langButtons.push(b);
    switcherWrapper.appendChild(b);
  });
  updateLangButtons();
  cleanups.push(onLocaleChange(updateLangButtons));

  topRow.append(badgeRow, switcherWrapper);

  const h1 = document.createElement('h1');
  h1.className = 'text-4xl font-bold tracking-tight text-foreground';

  const desc = document.createElement('p');
  desc.className = 'text-muted-foreground text-lg max-w-3xl leading-relaxed';

  const installBadge = document.createElement('div');
  installBadge.className = 'mt-6 flex items-center gap-3 text-sm text-muted-foreground/80';
  installBadge.innerHTML = `<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono border border-border/50">npx shadcn@latest add table</code>`;

  header.append(topRow, h1, desc, installBadge);

  // ── Layout: sidebar + content ────────────────────────────────────────────

  const layout = document.createElement('div');
  layout.className = 'flex gap-16 items-start';

  const sidebar = document.createElement('nav');
  sidebar.setAttribute('aria-label', 'Navegação das seções do componente');
  sidebar.className = 'sticky top-8 w-52 shrink-0 self-start space-y-5';

  const NAV_GROUPS = () => [
    { labelKey: 'nav.overview', sections: [
      { id: 'demonstracao', labelKey: 'nav.demonstration' },
      { id: 'anatomia',     labelKey: 'nav.anatomy'       },
      { id: 'quando-usar',  labelKey: 'nav.usage'         },
      { id: 'do-dont',      labelKey: 'nav.doDont'        },
    ]},
    { labelKey: 'nav.techRef', sections: [
      { id: 'importacao',   labelKey: 'nav.import'   },
      { id: 'exemplos',     labelKey: 'nav.examples' },
      { id: 'variantes',    labelKey: 'nav.variants' },
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

  const sidebarNavItems: { el: HTMLButtonElement; id: string }[] = [];

  function buildSidebar() {
    sidebar.innerHTML = '';
    NAV_GROUPS().forEach(group => {
      const groupDiv = document.createElement('div');
      const groupLabel = document.createElement('p');
      groupLabel.className = 'text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground mb-1 px-2';
      groupLabel.textContent = tNav(group.labelKey);
      const ul = document.createElement('ul');
      ul.className = 'list-none p-0 m-0 space-y-0.5';
      group.sections.forEach(({ id, labelKey }) => {
        const li = document.createElement('li');
        li.className = 'list-none';
        const navBtn = document.createElement('button');
        navBtn.type = 'button';
        navBtn.className = 'w-full text-left text-sm px-2 py-1 rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50';
        navBtn.textContent = tNav(labelKey);
        navBtn.addEventListener('click', () => {
          root.querySelector(`#${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        sidebarNavItems.push({ el: navBtn, id });
        li.appendChild(navBtn);
        ul.appendChild(li);
      });
      groupDiv.append(groupLabel, ul);
      sidebar.appendChild(groupDiv);
    });
  }
  buildSidebar();

  function updateActiveNav(activeId: string) {
    sidebarNavItems.forEach(({ el, id }) => {
      el.className = id === activeId
        ? 'w-full text-left text-sm px-2 py-1 rounded-md transition-colors font-semibold text-foreground bg-muted'
        : 'w-full text-left text-sm px-2 py-1 rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50';
    });
  }

  const main = document.createElement('div');
  main.className = 'flex-1 min-w-0 space-y-12';
  layout.append(sidebar, main);

  // ── Sections (shell) ─────────────────────────────────────────────────────

  function makeSection(id: string): { section: HTMLElement; h2: HTMLHeadingElement; content: HTMLDivElement } {
    const section = document.createElement('section');
    section.id = id;
    const h2 = document.createElement('h2');
    h2.className = 'text-xl font-semibold mb-4';
    const content = document.createElement('div');
    section.append(h2, content);
    return { section, h2, content };
  }

  const demo     = makeSection('demonstracao');
  const anatomy  = makeSection('anatomia');
  const when     = makeSection('quando-usar');
  const doDont   = makeSection('do-dont');
  const imp      = makeSection('importacao');
  const examples = makeSection('exemplos');
  const variants = makeSection('variantes');
  const states   = makeSection('estados');
  const props    = makeSection('propriedades');
  const tokens   = makeSection('tokens');
  const a11y     = makeSection('acessibilidade');
  const related  = makeSection('relacionados');
  const notes    = makeSection('notas');
  const analytics = makeSection('analytics');
  const tests    = makeSection('testes');

  main.append(
    demo.section, anatomy.section, when.section, doDont.section, imp.section, examples.section,
    variants.section, states.section, props.section, tokens.section, a11y.section, related.section,
    notes.section, analytics.section, tests.section,
  );

  root.append(header, layout);

  // ── Reactive render ───────────────────────────────────────────────────────

  function rerenderTexts() {
    // Header
    badgeCategory.textContent = t('category');
    badgeType.textContent = t('type');
    h1.textContent = t('title');
    desc.textContent = t('description');

    // Sidebar
    buildSidebar();

    // Demonstração
    demo.h2.textContent = t('demonstration.title');
    demo.content.innerHTML = '';
    demo.content.className = 'rounded-lg border border-border p-6 bg-card/30';
    demo.content.appendChild(buildDemoTable());

    // Anatomia
    anatomy.h2.textContent = t('anatomy.title');
    anatomy.content.className = 'rounded-lg border border-border p-6 bg-card/30';
    anatomy.content.innerHTML = `
      <ol class="space-y-3 text-sm list-none p-0 m-0">
        ${[1, 2, 3, 4, 5, 6, 7, 8].map(i => `<li class="flex gap-3 list-none">
          <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">${i}</span>
          <span>${sanitizeHtml(t(`anatomy.item${i}`))}</span>
        </li>`).join('')}
      </ol>
      <div class="rounded-lg bg-muted/50 border border-border/40 px-4 pt-3 pb-4 mt-4">
        <p class="text-xs text-muted-foreground mb-2">${sanitizeHtml(t('anatomy.structureLabel'))}</p>
        <pre class="text-xs font-mono leading-relaxed">${sanitizeHtml(t('anatomy.structureCode'))}</pre>
      </div>`;

    // Quando usar
    when.h2.textContent = t('usage.title');
    when.content.className = 'border rounded-xl p-6 shadow-sm space-y-6';
    when.content.innerHTML = `
      <div class="bg-muted/30 rounded-lg p-4 space-y-3">
        <h3 class="font-medium text-sm">${sanitizeHtml(t('usage.guidelines.title'))}</h3>
        <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
          ${[1, 2, 3, 4].map(i => `<li>${sanitizeHtml(t(`usage.guidelines.item${i}`))}</li>`).join('')}
        </ul>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="border-b border-border text-left bg-muted/50 font-medium">
              <th class="p-3 border-r border-border">${sanitizeHtml(t('usage.scenarios.cols.scenario'))}</th>
              <th class="p-3 border-r border-border">${sanitizeHtml(t('usage.scenarios.cols.use'))}</th>
              <th class="p-3">${sanitizeHtml(t('usage.scenarios.cols.alternative'))}</th>
            </tr>
          </thead>
          <tbody>
            ${[1, 2, 3, 4, 5].map(i => `<tr class="border-b border-border hover:bg-muted/5">
              <td class="p-3 border-r border-border">${sanitizeHtml(t(`usage.scenarios.item${i}.s`))}</td>
              <td class="p-3 border-r border-border font-medium text-primary">${sanitizeHtml(t(`usage.scenarios.item${i}.u`))}</td>
              <td class="p-3 text-muted-foreground">${sanitizeHtml(t(`usage.scenarios.item${i}.a`))}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="space-y-3">
        <h3 class="font-medium text-sm">${sanitizeHtml(t('uxWriting.title'))}</h3>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="border-b border-border bg-muted/70 text-left">
                <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(t('uxWriting.table.element'))}</th>
                <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(t('uxWriting.table.rules'))}</th>
                <th class="p-3 border-r border-border font-semibold text-green-700 dark:text-green-400"><span class="flex items-center gap-1.5"><span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>${sanitizeHtml(t('uxWriting.table.correct'))}</span></th>
                <th class="p-3 font-semibold text-red-700 dark:text-red-400"><span class="flex items-center gap-1.5"><span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>${sanitizeHtml(t('uxWriting.table.avoid'))}</span></th>
              </tr>
            </thead>
            <tbody>
              ${['caption', 'header', 'empty'].map(key => `<tr class="border-b border-border last:border-0 hover:bg-muted/5">
                <td class="p-3 border-r border-border font-medium">${sanitizeHtml(t(`uxWriting.table.${key}.name`))}</td>
                <td class="p-3 border-r border-border">${sanitizeHtml(t(`uxWriting.table.${key}.format`))}</td>
                <td class="p-3 border-r border-border font-medium text-green-600 dark:text-green-500">${sanitizeHtml(t(`uxWriting.table.${key}.good`))}</td>
                <td class="p-3 font-medium text-red-600 dark:text-red-500">${sanitizeHtml(t(`uxWriting.table.${key}.bad`))}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-card border rounded-xl p-4 shadow-sm">
          <h3 class="mb-3 text-sm font-semibold text-green-600 flex items-center gap-2"><span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>${sanitizeHtml(t('usage.do.title'))}</h3>
          <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            ${[1, 2, 3, 4].map(i => `<li>${sanitizeHtml(t(`usage.do.item${i}`))}</li>`).join('')}
          </ul>
        </div>
        <div class="bg-card border rounded-xl p-4 shadow-sm">
          <h3 class="mb-3 text-sm font-semibold text-red-600 flex items-center gap-2"><span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>${sanitizeHtml(t('usage.dont.title'))}</h3>
          <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            ${[1, 2, 3].map(i => `<li>${sanitizeHtml(t(`usage.dont.item${i}`))}</li>`).join('')}
          </ul>
        </div>
      </div>`;

    // Do/Don't
    doDont.h2.textContent = t('doDont.title');
    doDont.content.className = 'rounded-lg border border-border p-6 bg-card/30 space-y-8';
    doDont.content.innerHTML = '';

    // Pair 1: with/without <th>
    const pair1 = document.createElement('div');
    pair1.className = 'grid grid-cols-1 md:grid-cols-2 gap-6';
    const pair1Do = document.createElement('div');
    pair1Do.className = 'space-y-3';
    pair1Do.innerHTML = `
      <div class="flex items-center gap-2 text-green-600"><span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span><span class="text-sm font-semibold uppercase">${sanitizeHtml(tNav('common.do'))}</span></div>
      <div class="border border-green-200 dark:border-green-900/50 rounded-xl p-6 bg-green-50/50 dark:bg-green-950/10"></div>
      <p class="text-sm text-muted-foreground italic px-1">${sanitizeHtml(t('doDont.pair1.do'))}</p>`;
    pair1Do.querySelector('div.border')?.appendChild(buildMiniTable({}));

    const pair1Dont = document.createElement('div');
    pair1Dont.className = 'space-y-3';
    pair1Dont.innerHTML = `
      <div class="flex items-center gap-2 text-red-600"><span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span><span class="text-sm font-semibold uppercase">${sanitizeHtml(tNav('common.dont'))}</span></div>
      <div class="border border-red-200 dark:border-red-900/50 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/10">
        <table class="w-full text-sm caption-bottom">
          <tbody>
            <tr class="border-b"><td class="p-2 font-bold">Fatura</td><td class="p-2 font-bold">Status</td><td class="p-2 font-bold text-right">Valor</td></tr>
            <tr class="border-b"><td class="p-2">INV001</td><td class="p-2">Pago</td><td class="p-2 text-right">R$ 250,00</td></tr>
          </tbody>
        </table>
      </div>
      <p class="text-sm text-muted-foreground italic px-1">${sanitizeHtml(t('doDont.pair1.dont'))}</p>`;

    pair1.append(pair1Do, pair1Dont);

    // Pair 2: caption + wrapper vs nothing
    const pair2 = document.createElement('div');
    pair2.className = 'grid grid-cols-1 md:grid-cols-2 gap-6';
    const pair2Do = document.createElement('div');
    pair2Do.className = 'space-y-3';
    pair2Do.innerHTML = `
      <div class="flex items-center gap-2 text-green-600"><span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span><span class="text-sm font-semibold uppercase">${sanitizeHtml(tNav('common.do'))}</span></div>
      <div class="border border-green-200 dark:border-green-900/50 rounded-xl p-6 bg-green-50/50 dark:bg-green-950/10"></div>
      <p class="text-sm text-muted-foreground italic px-1">${sanitizeHtml(t('doDont.pair2.do'))}</p>`;
    pair2Do.querySelector('div.border')?.appendChild(buildMiniTable({ caption: true }));

    const pair2Dont = document.createElement('div');
    pair2Dont.className = 'space-y-3';
    pair2Dont.innerHTML = `
      <div class="flex items-center gap-2 text-red-600"><span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span><span class="text-sm font-semibold uppercase">${sanitizeHtml(tNav('common.dont'))}</span></div>
      <div class="border border-red-200 dark:border-red-900/50 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/10">
        <table class="w-full text-sm">
          <thead><tr class="border-b"><th class="p-2 text-left">Fatura</th><th class="p-2 text-left">Status</th><th class="p-2 text-right">Valor</th></tr></thead>
          <tbody>
            <tr class="border-b"><td class="p-2">INV001</td><td class="p-2">Pago</td><td class="p-2 text-right">R$ 250,00</td></tr>
            <tr><td class="p-2">INV002</td><td class="p-2">Pendente</td><td class="p-2 text-right">R$ 150,00</td></tr>
          </tbody>
        </table>
      </div>
      <p class="text-sm text-muted-foreground italic px-1">${sanitizeHtml(t('doDont.pair2.dont'))}</p>`;

    pair2.append(pair2Do, pair2Dont);
    doDont.content.append(pair1, pair2);

    // Importação
    imp.h2.textContent = t('import.title');
    imp.content.className = 'rounded-lg border border-border p-6 bg-card/30 space-y-4';
    imp.content.innerHTML = `
      <div>
        <p class="text-sm text-muted-foreground mb-3">${sanitizeHtml(t('import.basic'))}</p>
        <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">import {
  createTable,
  createTableHeader,
  createTableBody,
  createTableFooter,
  createTableRow,
  createTableHead,
  createTableCell,
  createTableCaption,
} from '@/components/ui/table';</code></div>
      </div>
      <div>
        <p class="text-sm text-muted-foreground mb-3">${sanitizeHtml(t('import.full'))}</p>
        <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">const { wrapper, table } = createTable();
table.appendChild(createTableCaption('Faturas recentes.'));

const thead = createTableHeader();
const trHead = createTableRow();
['Fatura', 'Status', 'Valor'].forEach((label) =&gt; {
  const th = createTableHead(label);
  th.setAttribute('scope', 'col');
  trHead.appendChild(th);
});
thead.appendChild(trHead);
table.appendChild(thead);</code></div>
      </div>`;

    // Exemplos
    examples.h2.textContent = t('examples.title');
    examples.content.className = 'space-y-8';
    examples.content.innerHTML = '';

    const exBasic = document.createElement('div');
    exBasic.className = 'space-y-3';
    exBasic.innerHTML = `
      <h3 class="text-sm font-medium">${sanitizeHtml(t('examples.basic'))}</h3>
      <div class="rounded-lg border border-border p-6 bg-card/30"></div>
      <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">const { wrapper, table } = createTable();
const thead = createTableHeader();
// ... preencher thead e tbody
table.appendChild(thead);
table.appendChild(tbody);</code></div>`;
    exBasic.querySelector('div.border')?.appendChild(buildMiniTable({}));

    const exCaption = document.createElement('div');
    exCaption.className = 'space-y-3';
    exCaption.innerHTML = `
      <h3 class="text-sm font-medium">${sanitizeHtml(t('examples.withCaption'))}</h3>
      <div class="rounded-lg border border-border p-6 bg-card/30"></div>
      <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">table.appendChild(createTableCaption('Faturas recentes.'));
// ... thead, tbody

const tfoot = createTableFooter();
const tdTotal = createTableCell('Total');
tdTotal.setAttribute('colspan', '2');
// ...</code></div>`;
    exCaption.querySelector('div.border')?.appendChild(buildMiniTable({ caption: true, footer: true }));

    const exSelection = document.createElement('div');
    exSelection.className = 'space-y-3';
    exSelection.innerHTML = `
      <h3 class="text-sm font-medium">${sanitizeHtml(t('examples.withSelection'))}</h3>
      <div class="rounded-lg border border-border p-6 bg-card/30"></div>
      <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">const tr = createTableRow();
if (isSelected) tr.setAttribute('data-state', 'selected');
// ... preencher células</code></div>`;
    exSelection.querySelector('div.border')?.appendChild(buildMiniTable({ selected: true }));

    const exEmpty = document.createElement('div');
    exEmpty.className = 'space-y-3';
    exEmpty.innerHTML = `
      <h3 class="text-sm font-medium">${sanitizeHtml(t('examples.empty'))}</h3>
      <div class="rounded-lg border border-border p-6 bg-card/30"></div>
      <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">const tr = createTableRow();
const td = createTableCell('Nenhuma fatura...', 'text-center py-8');
td.setAttribute('colspan', '3');
tr.appendChild(td);
tbody.appendChild(tr);</code></div>`;
    exEmpty.querySelector('div.border')?.appendChild(buildMiniTable({ empty: true }));

    examples.content.append(exBasic, exCaption, exSelection, exEmpty);

    // Variantes (compositions + densities)
    variants.h2.textContent = t('variants.title');
    variants.content.className = 'space-y-12';
    variants.content.innerHTML = '';

    // Compositions grid
    const compSection = document.createElement('div');
    compSection.innerHTML = `<h3 class="text-sm font-semibold text-muted-foreground mb-6 px-1">${sanitizeHtml(t('variants.visualTitle'))}</h3>`;
    const compGrid = document.createElement('div');
    compGrid.className = 'grid grid-cols-1 sm:grid-cols-2 gap-4';
    const COMP_ITEMS: { key: 'basic' | 'withCaption' | 'withFooter' | 'empty'; opts: { caption?: boolean; footer?: boolean; empty?: boolean } }[] = [
      { key: 'basic',       opts: {} },
      { key: 'withCaption', opts: { caption: true } },
      { key: 'withFooter',  opts: { footer: true } },
      { key: 'empty',       opts: { empty: true } },
    ];
    COMP_ITEMS.forEach(({ key, opts }) => {
      const card = document.createElement('div');
      card.className = 'border border-border/60 rounded-xl overflow-hidden bg-card/50 flex flex-col hover:border-primary/30 hover:shadow-sm transition-all';
      card.innerHTML = `
        <div class="flex-1 flex items-center justify-center p-6 bg-muted/5 min-h-[180px]"></div>
        <div class="p-4 border-t border-border/40 bg-muted/10 space-y-1">
          <p class="text-[11px] uppercase font-mono text-primary font-bold tracking-wider px-1.5 py-0.5 bg-primary/5 rounded-sm inline-block mb-1">${key}</p>
          <p class="text-xs text-muted-foreground leading-relaxed">${sanitizeHtml(t(`variants.items.${key}`))}</p>
        </div>`;
      card.querySelector('div.flex-1')?.appendChild(buildMiniTable(opts));
      compGrid.appendChild(card);
    });
    compSection.appendChild(compGrid);

    // Densities grid
    const densitySection = document.createElement('div');
    densitySection.innerHTML = `<h3 class="text-sm font-semibold text-muted-foreground mb-6 px-1">${sanitizeHtml(t('variants.sizeTitle'))}</h3>`;
    const densityGrid = document.createElement('div');
    densityGrid.className = 'grid grid-cols-1 md:grid-cols-3 gap-4';

    const DENSITIES: { key: 'compact' | 'default' | 'comfortable'; headExtra: string; cellExtra: string }[] = [
      { key: 'compact',     headExtra: 'h-8',  cellExtra: 'py-1' },
      { key: 'default',     headExtra: '',     cellExtra: '' },
      { key: 'comfortable', headExtra: 'h-12', cellExtra: 'py-4' },
    ];
    DENSITIES.forEach(({ key, headExtra, cellExtra }) => {
      const card = document.createElement('div');
      card.className = 'border border-border/60 rounded-xl overflow-hidden bg-card/50 flex flex-col hover:border-primary/30 hover:shadow-sm transition-all';
      card.innerHTML = `
        <div class="flex-1 flex items-center justify-center p-4 bg-muted/5 min-h-[160px]"></div>
        <div class="p-3 border-t border-border/40 bg-muted/10 space-y-1">
          <p class="text-[11px] uppercase font-mono text-primary font-bold block">${key}</p>
          <p class="text-xs text-muted-foreground">${sanitizeHtml(t(`variants.sizes.${key}`))}</p>
          <p class="text-xs text-muted-foreground/70 italic">${sanitizeHtml(t(`variants.sizes.${key}Use`))}</p>
        </div>`;

      // Build mini-table with density variations
      const { wrapper, table } = createTable();
      const thead = createTableHeader();
      const trHead = createTableRow();
      ['Fatura', 'Status'].forEach((label) => {
        const th = createTableHead(label, headExtra);
        th.setAttribute('scope', 'col');
        trHead.appendChild(th);
      });
      thead.appendChild(trHead);
      table.appendChild(thead);

      const tbody = createTableBody();
      [['INV001', 'Pago'], ['INV002', 'Pendente'], ['INV003', 'Pago']].forEach((cells) => {
        const tr = createTableRow();
        cells.forEach((text, i) => {
          tr.appendChild(createTableCell(text, `${cellExtra} ${i === 0 ? 'font-medium' : ''}`.trim()));
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);

      card.querySelector('div.flex-1')?.appendChild(wrapper);
      densityGrid.appendChild(card);
    });
    densitySection.appendChild(densityGrid);

    variants.content.append(compSection, densitySection);

    // Estados
    states.h2.textContent = t('states.title');
    states.content.className = 'border rounded-xl overflow-x-auto p-4 shadow-sm';
    states.content.innerHTML = `<table class="w-full border-collapse text-sm" style="margin:0">
      <thead><tr class="border-b border-border text-left bg-muted/50">
        <th class="p-3 border-r border-border font-medium">${sanitizeHtml(t('states.table.state'))}</th>
        <th class="p-3 border-r border-border font-medium">${sanitizeHtml(t('states.table.visual'))}</th>
        <th class="p-3 font-medium">${sanitizeHtml(t('states.table.trigger'))}</th>
      </tr></thead>
      <tbody>
        <tr class="border-b border-border hover:bg-muted/5"><td class="p-3 border-r border-border font-medium">Default</td><td class="p-3 border-r border-border text-muted-foreground italic">${sanitizeHtml(t('states.table.initial'))}</td><td class="p-3 text-muted-foreground">—</td></tr>
        <tr class="border-b border-border hover:bg-muted/5"><td class="p-3 border-r border-border font-medium">Hover</td><td class="p-3 border-r border-border text-muted-foreground">${sanitizeHtml(t('states.table.hover'))}</td><td class="p-3 text-muted-foreground">${sanitizeHtml(t('states.table.hoverTrigger'))}</td></tr>
        <tr class="border-b border-border hover:bg-muted/5"><td class="p-3 border-r border-border font-medium">Selected</td><td class="p-3 border-r border-border text-muted-foreground">${sanitizeHtml(t('states.table.selected'))}</td><td class="p-3 text-muted-foreground">${sanitizeHtml(t('states.table.selectedTrigger'))}</td></tr>
        <tr class="border-b border-border hover:bg-muted/5"><td class="p-3 border-r border-border font-medium">Empty</td><td class="p-3 border-r border-border text-muted-foreground">${sanitizeHtml(t('states.table.empty'))}</td><td class="p-3 text-muted-foreground">${sanitizeHtml(t('states.table.emptyTrigger'))}</td></tr>
        <tr class="hover:bg-muted/5"><td class="p-3 border-r border-border font-medium">Scroll</td><td class="p-3 border-r border-border text-muted-foreground">${sanitizeHtml(t('states.table.scroll'))}</td><td class="p-3 text-muted-foreground">${sanitizeHtml(t('states.table.scrollTrigger'))}</td></tr>
      </tbody></table>`;

    // Propriedades
    props.h2.textContent = t('props.title');
    props.content.className = 'space-y-6';
    props.content.innerHTML = `
      <div>
        <h3 class="font-medium text-sm mb-3">${sanitizeHtml(t('props.interface'))}</h3>
        <div class="bg-muted p-4 rounded-lg font-mono text-xs border overflow-x-auto whitespace-pre leading-relaxed"><code>// Assinaturas das fábricas
function createTable(extraClass?: string): { wrapper: HTMLDivElement; table: HTMLTableElement }
function createTableHeader(extraClass?: string): HTMLTableSectionElement
function createTableBody(extraClass?: string): HTMLTableSectionElement
function createTableFooter(extraClass?: string): HTMLTableSectionElement
function createTableRow(extraClass?: string): HTMLTableRowElement
function createTableHead(text: string, extraClass?: string): HTMLTableCellElement
function createTableCell(text: string, extraClass?: string): HTMLTableCellElement
function createTableCaption(text: string, extraClass?: string): HTMLTableCaptionElement</code></div>
      </div>
      <div class="border rounded-xl overflow-x-auto p-4 shadow-sm">
        <table class="w-full border-collapse text-sm" style="margin:0">
          <thead class="bg-muted/50 border-b text-left"><tr>
            <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(t('props.table.prop'))}</th>
            <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(t('props.table.type'))}</th>
            <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(t('props.table.default'))}</th>
            <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(t('props.table.required'))}</th>
            <th class="p-3 font-semibold">${sanitizeHtml(t('props.table.description'))}</th>
          </tr></thead>
          <tbody>
            <tr class="border-b hover:bg-muted/5"><td class="p-3 border-r border-border font-mono font-bold text-primary">extraClass</td><td class="p-3 border-r border-border font-mono text-muted-foreground">string</td><td class="p-3 border-r border-border font-mono">—</td><td class="p-3 border-r border-border text-muted-foreground">Não</td><td class="p-3 text-muted-foreground">${sanitizeHtml(t('props.table.className'))}</td></tr>
            <tr class="border-b hover:bg-muted/5"><td class="p-3 border-r border-border font-mono font-bold text-primary">text</td><td class="p-3 border-r border-border font-mono text-muted-foreground">string</td><td class="p-3 border-r border-border font-mono">—</td><td class="p-3 border-r border-border text-muted-foreground">Sim</td><td class="p-3 text-muted-foreground">${sanitizeHtml(t('props.table.children'))}</td></tr>
            <tr class="border-b hover:bg-muted/5"><td class="p-3 border-r border-border font-mono font-bold text-primary">colspan</td><td class="p-3 border-r border-border font-mono text-muted-foreground">number (HTML attr)</td><td class="p-3 border-r border-border font-mono">—</td><td class="p-3 border-r border-border text-muted-foreground">Não</td><td class="p-3 text-muted-foreground">${sanitizeHtml(t('props.table.colSpan'))}</td></tr>
            <tr class="border-b hover:bg-muted/5"><td class="p-3 border-r border-border font-mono font-bold text-primary">rowspan</td><td class="p-3 border-r border-border font-mono text-muted-foreground">number (HTML attr)</td><td class="p-3 border-r border-border font-mono">—</td><td class="p-3 border-r border-border text-muted-foreground">Não</td><td class="p-3 text-muted-foreground">${sanitizeHtml(t('props.table.rowSpan'))}</td></tr>
            <tr class="border-b hover:bg-muted/5"><td class="p-3 border-r border-border font-mono font-bold text-primary">scope</td><td class="p-3 border-r border-border font-mono text-muted-foreground">"col" | "row"</td><td class="p-3 border-r border-border font-mono">—</td><td class="p-3 border-r border-border text-muted-foreground">Recom.</td><td class="p-3 text-muted-foreground">${sanitizeHtml(t('props.table.scope'))}</td></tr>
            <tr class="hover:bg-muted/5"><td class="p-3 border-r border-border font-mono font-bold text-primary">data-state</td><td class="p-3 border-r border-border font-mono text-muted-foreground">"selected"</td><td class="p-3 border-r border-border font-mono">—</td><td class="p-3 border-r border-border text-muted-foreground">Não</td><td class="p-3 text-muted-foreground">${sanitizeHtml(t('props.table.dataState'))}</td></tr>
          </tbody>
        </table>
      </div>
      <div class="space-y-3">
        <h3 class="font-medium text-sm">${sanitizeHtml(t('props.extensibilityTitle'))}</h3>
        <div class="space-y-3">
          <p class="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4 border">${sanitizeHtml(t('props.extensibility.classNameNote'))}</p>
          <p class="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4 border">${sanitizeHtml(t('props.extensibility.spreadNote'))}</p>
        </div>
      </div>`;

    // Tokens
    tokens.h2.textContent = t('tokens.title');
    tokens.content.className = 'space-y-6';
    tokens.content.innerHTML = `
      <div class="border rounded-xl overflow-x-auto p-4 shadow-sm">
        <table class="w-full border-collapse text-sm" style="margin:0">
          <thead><tr class="border-b border-border bg-muted/50 text-left">
            <th class="p-3 border-r border-border font-medium">${sanitizeHtml(t('tokens.table.token'))}</th>
            <th class="p-3 border-r border-border font-medium">${sanitizeHtml(t('tokens.table.class'))}</th>
            <th class="p-3 font-medium">${sanitizeHtml(t('tokens.table.part'))}</th>
          </tr></thead>
          <tbody>
            <tr class="border-b hover:bg-muted/5"><td class="p-3 border-r border-border font-mono text-primary font-medium"><code>--border</code></td><td class="p-3 border-r border-border font-mono text-primary"><code>border-b</code></td><td class="p-3 text-muted-foreground">${sanitizeHtml(t('tokens.table.border'))}</td></tr>
            <tr class="border-b hover:bg-muted/5"><td class="p-3 border-r border-border font-mono text-primary font-medium"><code>--muted</code></td><td class="p-3 border-r border-border font-mono text-primary"><code>bg-muted / bg-muted/50</code></td><td class="p-3 text-muted-foreground">${sanitizeHtml(t('tokens.table.muted'))}</td></tr>
            <tr class="border-b hover:bg-muted/5"><td class="p-3 border-r border-border font-mono text-primary font-medium"><code>--muted-foreground</code></td><td class="p-3 border-r border-border font-mono text-primary"><code>text-muted-foreground</code></td><td class="p-3 text-muted-foreground">${sanitizeHtml(t('tokens.table.mutedForeground'))}</td></tr>
            <tr class="border-b hover:bg-muted/5"><td class="p-3 border-r border-border font-mono text-primary font-medium"><code>--foreground</code></td><td class="p-3 border-r border-border font-mono text-primary"><code>text-foreground</code></td><td class="p-3 text-muted-foreground">${sanitizeHtml(t('tokens.table.foreground'))}</td></tr>
            <tr class="border-b hover:bg-muted/5"><td class="p-3 border-r border-border font-mono text-primary font-medium"><code>--background</code></td><td class="p-3 border-r border-border font-mono text-primary"><code>bg-background</code></td><td class="p-3 text-muted-foreground">${sanitizeHtml(t('tokens.table.background'))}</td></tr>
            <tr class="hover:bg-muted/5"><td class="p-3 border-r border-border font-mono text-primary font-medium"><code>--radius</code></td><td class="p-3 border-r border-border font-mono text-primary"><code>rounded-md</code></td><td class="p-3 text-muted-foreground">${sanitizeHtml(t('tokens.table.radius'))}</td></tr>
          </tbody>
        </table>
      </div>
      <div class="space-y-2">
        <h3 class="font-medium text-sm">${sanitizeHtml(t('tokens.customizationTitle'))}</h3>
        <div class="bg-muted p-4 rounded-lg font-mono text-xs border overflow-x-auto whitespace-pre leading-relaxed"><code>/* Em globals.css ou theme-custom.css */
html.meu-tema {
  --muted: 210 40% 96%;          /* Hover das linhas */
  --muted-foreground: 215 16% 47%; /* Texto do header */
  --border: 214 32% 91%;          /* Borda das linhas */
}
html.meu-tema.dark {
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;
  --border: 217 33% 17%;
}</code></div>
      </div>`;

    // Acessibilidade
    a11y.h2.textContent = t('accessibility.title');
    a11y.content.className = 'border rounded-xl p-6 shadow-sm space-y-6';
    a11y.content.innerHTML = `
      <ul class="space-y-3 text-sm text-muted-foreground list-disc pl-5">
        ${[1, 2, 3, 4, 5].map(i => `<li>${sanitizeHtml(t(`accessibility.item${i}`))}</li>`).join('')}
      </ul>
      <div class="space-y-4">
        <h3 class="font-medium text-sm">${sanitizeHtml(t('accessibility.keyboardTitle'))}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          ${['tab', 'arrows', 'enter'].map(k => `<div class="bg-muted/30 border rounded-xl p-4"><code class="text-[10px] bg-muted px-2 py-0.5 rounded-md uppercase font-bold text-primary border border-border/60 block mb-2">${k === 'arrows' ? 'arrows' : k}</code><p class="text-xs text-muted-foreground leading-relaxed">${sanitizeHtml(t(`accessibility.keyboard.${k}`))}</p></div>`).join('')}
        </div>
      </div>`;

    // Relacionados
    related.h2.textContent = t('related.title');
    related.content.className = 'grid grid-cols-1 sm:grid-cols-2 gap-4';
    const relatedData = [
      { name: 'Card',       desc: t('related.card'),       path: '?path=/docs/ui-card--docs' },
      { name: 'DataTable',  desc: t('related.dataTable'),  path: '?path=/docs/ui-datatable--docs' },
      { name: 'Pagination', desc: t('related.pagination'), path: '?path=/docs/ui-pagination--docs' },
      { name: 'Checkbox',   desc: t('related.checkbox'),   path: '?path=/docs/ui-checkbox--docs' },
      { name: 'Badge',      desc: t('related.badge'),      path: '?path=/docs/ui-badge--docs' },
    ];
    related.content.innerHTML = relatedData.map(item => `<div role="link" tabindex="0" data-path="${item.path}" class="border rounded-xl p-4 bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer group"><h4 class="text-sm font-semibold mb-1 group-hover:text-primary transition-colors">${sanitizeHtml(item.name)}</h4><p class="text-xs text-muted-foreground">${sanitizeHtml(item.desc)}</p></div>`).join('');
    related.content.querySelectorAll<HTMLElement>('[data-path]').forEach(el => {
      const path = el.dataset.path!;
      const navigate = () => { (window.top ?? window).location.href = path; };
      el.addEventListener('click', navigate);
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter') navigate(); });
    });

    // Notas
    notes.h2.textContent = t('notes.title');
    notes.content.className = 'space-y-4';
    notes.content.innerHTML = `
      <div class="p-4 bg-primary/5 border-l-4 border-primary rounded-r-lg"><p class="text-sm text-muted-foreground">${sanitizeHtml(t('notes.tip1'))}</p></div>
      <div class="p-4 bg-orange-500/5 border-l-4 border-orange-500 rounded-r-lg"><p class="text-sm text-muted-foreground">${sanitizeHtml(t('notes.tip2'))}</p></div>`;

    // Analytics
    analytics.h2.textContent = t('analytics.title');
    analytics.content.className = 'space-y-4';
    analytics.content.innerHTML = `
      <p class="text-sm text-muted-foreground">${sanitizeHtml(t('analytics.description'))}</p>
      <div class="border rounded-xl overflow-x-auto p-4 shadow-sm">
        <table class="w-full border-collapse text-sm" style="margin:0">
          <thead><tr class="bg-muted/50 border-b text-left">
            <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(t('analytics.table.event'))}</th>
            <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(t('analytics.table.trigger'))}</th>
            <th class="p-3 font-semibold">${sanitizeHtml(t('analytics.table.payload'))}</th>
          </tr></thead>
          <tbody>
            ${['pageView', 'sectionViewed', 'langSwitch'].map(key => `<tr class="border-b last:border-0 hover:bg-muted/5"><td class="p-3 border-r border-border font-mono text-primary font-bold">${sanitizeHtml(t(`analytics.table.${key}`))}</td><td class="p-3 border-r border-border">${sanitizeHtml(t(`analytics.table.${key}Trigger`))}</td><td class="p-3 font-mono text-muted-foreground">${sanitizeHtml(t(`analytics.table.${key}Payload`))}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>`;

    // Testes
    tests.h2.textContent = t('testes.title');
    tests.h2.className = 'text-xl font-semibold mb-6';
    tests.content.className = 'space-y-8';

    const priorityBadge = (p: string) => p === 'high'
      ? `<span class="inline-flex items-center rounded-md border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-[11px] font-medium text-orange-600 h-5">${sanitizeHtml(tNav('common.high'))}</span>`
      : `<span class="inline-flex items-center rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 h-5">${sanitizeHtml(tNav('common.medium'))}</span>`;

    tests.content.innerHTML = `
      <div>
        <h3 class="font-semibold text-sm mb-1">${sanitizeHtml(t('testes.functional.title'))}</h3>
        <p class="text-xs text-muted-foreground mb-4">${sanitizeHtml(t('testes.functional.description'))}</p>
        <div class="border rounded-xl overflow-x-auto p-4 shadow-sm">
          <table class="w-full border-collapse text-sm">
            <thead class="bg-muted/50 border-b text-left"><tr>
              <th class="p-4 border-r border-border font-semibold">${sanitizeHtml(tNav('common.userAction'))}</th>
              <th class="p-4 border-r border-border font-semibold">${sanitizeHtml(tNav('common.expectedResult'))}</th>
              <th class="p-4 font-semibold w-24">${sanitizeHtml(tNav('common.priority'))}</th>
            </tr></thead>
            <tbody>
              ${[1, 2, 3, 4, 5, 6].map(i => `<tr class="border-b last:border-0 hover:bg-muted/5">
                <td class="p-4 border-r border-border font-medium">${sanitizeHtml(t(`testes.functional.item${i}.action`))}</td>
                <td class="p-4 border-r border-border text-muted-foreground">${sanitizeHtml(t(`testes.functional.item${i}.result`))}</td>
                <td class="p-4">${priorityBadge(t(`testes.functional.item${i}.priority`))}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <h3 class="font-semibold text-sm mb-1">${sanitizeHtml(t('testes.accessibility.title'))}</h3>
        <p class="text-xs text-muted-foreground mb-4">${sanitizeHtml(t('testes.accessibility.description'))}</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${[1, 2, 3, 4, 5, 6].map(i => `<div class="flex gap-3 items-start p-3 bg-muted/10 rounded-lg border border-border/40"><div class="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5"><span class="text-[10px] text-primary font-bold italic">axe</span></div><span class="text-xs text-muted-foreground leading-relaxed">${sanitizeHtml(t(`testes.accessibility.item${i}`))}</span></div>`).join('')}
        </div>
      </div>
      <div>
        <h3 class="font-semibold text-sm mb-1">${sanitizeHtml(t('testes.visual.title'))}</h3>
        <p class="text-xs text-muted-foreground mb-4">${sanitizeHtml(t('testes.visual.description'))}</p>
        <div class="border rounded-xl overflow-x-auto p-4 shadow-sm">
          <table class="w-full border-collapse text-sm">
            <thead class="bg-muted/50 border-b text-left"><tr>
              <th class="p-4 border-r border-border font-semibold">${sanitizeHtml(tNav('common.storyState'))}</th>
              <th class="p-4 border-r border-border font-semibold text-center w-32">${sanitizeHtml(tNav('common.themeLight'))}</th>
              <th class="p-4 border-r border-border font-semibold text-center w-32">${sanitizeHtml(tNav('common.themeDark'))}</th>
              <th class="p-4 font-semibold w-24">${sanitizeHtml(tNav('common.priority'))}</th>
            </tr></thead>
            <tbody>
              ${[1, 2, 3, 4, 5, 6, 7].map(i => `<tr class="border-b last:border-0 hover:bg-muted/5">
                <td class="p-4 border-r border-border font-medium">${sanitizeHtml(t(`testes.visual.item${i}.story`))}</td>
                <td class="p-4 border-r border-border text-center text-emerald-600 font-medium">${sanitizeHtml(t('testes.visual.required'))}</td>
                <td class="p-4 border-r border-border text-center text-emerald-600 font-medium">${sanitizeHtml(t('testes.visual.required'))}</td>
                <td class="p-4">${priorityBadge(t(`testes.visual.item${i}.priority`))}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  rerenderTexts();
  cleanups.push(subscribe(rerenderTexts));

  // ── IntersectionObserver ──────────────────────────────────────────────────

  const ALL_SECTION_IDS = [
    'demonstracao', 'anatomia', 'quando-usar', 'do-dont', 'importacao', 'exemplos',
    'variantes', 'estados', 'propriedades', 'tokens', 'acessibilidade',
    'relacionados', 'notas', 'analytics', 'testes',
  ];

  let sectionObserver: IntersectionObserver | null = null;

  function setupObservers() {
    sectionObserver?.disconnect();
    sectionObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          updateActiveNav(entry.target.id);
          track('docs_section_viewed', { section_id: entry.target.id, component_name: 'table', locale: getLocale() });
          break;
        }
      }
    }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });
    ALL_SECTION_IDS.forEach(id => {
      const el = root.querySelector<HTMLElement>(`#${id}`);
      if (el) sectionObserver!.observe(el);
    });
  }

  const attachObserver = new MutationObserver(() => {
    if (root.isConnected) {
      setupObservers();
      attachObserver.disconnect();
    }
  });
  attachObserver.observe(document.body, { childList: true, subtree: true });

  const detachObserver = new MutationObserver(() => {
    if (!root.isConnected) {
      cleanups.forEach(fn => fn());
      sectionObserver?.disconnect();
      detachObserver.disconnect();
    }
  });
  setTimeout(() => {
    if (root.parentElement) {
      detachObserver.observe(root.parentElement, { childList: true });
    }
  }, 0);

  return root;
}
