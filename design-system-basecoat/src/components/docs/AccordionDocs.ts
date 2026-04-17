import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { createAccordion } from '@/components/ui/accordion';
import uiTranslations from '@/i18n/ui.json';
import accordionTranslations from '@shared/content/accordion/translations.json';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);
const { t, subscribe } = createTranslation(accordionTranslations as Record<string, unknown>);

// ─── createAccordionDocs ──────────────────────────────────────────────────────

export function createAccordionDocs(): HTMLElement {
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
      componentSlug: 'accordion',
    });
    track('docs_page_view', { component_name: 'accordion', locale, page_title: `${t('title')} · Design System` });
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
  installBadge.innerHTML = `<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono border border-border/50">npx shadcn@latest add accordion</code>`;

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
    sidebarNavItems.length = 0;
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

  // ── Sections ──────────────────────────────────────────────────────────────

  // --- Demonstração ---
  const secDemo = document.createElement('section');
  secDemo.id = 'demonstracao';
  const h2Demo = document.createElement('h2');
  h2Demo.className = 'text-xl font-semibold mb-4';
  const demoWrap = document.createElement('div');
  demoWrap.className = 'rounded-lg border border-border p-6 bg-card/30';
  secDemo.append(h2Demo, demoWrap);

  // --- Anatomia ---
  const secAnatomia = document.createElement('section');
  secAnatomia.id = 'anatomia';
  const h2Anatomia = document.createElement('h2');
  h2Anatomia.className = 'text-xl font-semibold mb-4';
  const anatomiaContent = document.createElement('div');
  anatomiaContent.className = 'rounded-lg border border-border p-6 bg-card/30 space-y-4';
  secAnatomia.append(h2Anatomia, anatomiaContent);

  // --- Quando usar ---
  const secWhen = document.createElement('section');
  secWhen.id = 'quando-usar';
  const h2When = document.createElement('h2');
  h2When.className = 'text-xl font-semibold mb-4';
  const whenContent = document.createElement('div');
  whenContent.className = 'border rounded-xl p-6 shadow-sm space-y-6';
  secWhen.append(h2When, whenContent);

  // --- Do/Don't ---
  const secDoDont = document.createElement('section');
  secDoDont.id = 'do-dont';
  const h2DoDont = document.createElement('h2');
  h2DoDont.className = 'text-xl font-semibold mb-4';
  const doDontContent = document.createElement('div');
  doDontContent.className = 'rounded-lg border border-border p-6 bg-card/30 space-y-8';
  secDoDont.append(h2DoDont, doDontContent);

  // --- Importação ---
  const secImport = document.createElement('section');
  secImport.id = 'importacao';
  const h2Import = document.createElement('h2');
  h2Import.className = 'text-xl font-semibold mb-4';
  const importContent = document.createElement('div');
  importContent.className = 'rounded-lg border border-border p-6 bg-card/30 space-y-4';
  importContent.innerHTML = `<div><p class="text-sm text-muted-foreground mb-3"></p><div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">import { createAccordion } from '@/components/ui/accordion';</code></div></div>`;
  secImport.append(h2Import, importContent);

  // --- Exemplos ---
  const secExemplos = document.createElement('section');
  secExemplos.id = 'exemplos';
  const h2Exemplos = document.createElement('h2');
  h2Exemplos.className = 'text-xl font-semibold mb-4';
  const exemplosContent = document.createElement('div');
  exemplosContent.className = 'space-y-8';
  secExemplos.append(h2Exemplos, exemplosContent);

  // --- Variantes (Modos) ---
  const secVariantes = document.createElement('section');
  secVariantes.id = 'variantes';
  const h2Variantes = document.createElement('h2');
  h2Variantes.className = 'text-xl font-semibold mb-4';
  const variantesContent = document.createElement('div');
  variantesContent.className = 'grid grid-cols-1 md:grid-cols-3 gap-4';
  secVariantes.append(h2Variantes, variantesContent);

  // --- Estados ---
  const secEstados = document.createElement('section');
  secEstados.id = 'estados';
  const h2Estados = document.createElement('h2');
  h2Estados.className = 'text-xl font-semibold mb-4';
  const estadosContent = document.createElement('div');
  estadosContent.className = 'rounded-lg border border-border p-6 bg-card/30';
  secEstados.append(h2Estados, estadosContent);

  // --- Propriedades ---
  const secProps = document.createElement('section');
  secProps.id = 'propriedades';
  const h2Props = document.createElement('h2');
  h2Props.className = 'text-xl font-semibold mb-4';
  const propsContent = document.createElement('div');
  propsContent.className = 'space-y-6';
  secProps.append(h2Props, propsContent);

  // --- Tokens ---
  const secTokens = document.createElement('section');
  secTokens.id = 'tokens';
  const h2Tokens = document.createElement('h2');
  h2Tokens.className = 'text-xl font-semibold mb-4';
  const tokensContent = document.createElement('div');
  tokensContent.className = 'rounded-lg border border-border p-6 bg-card/30 space-y-6';
  secTokens.append(h2Tokens, tokensContent);

  // --- Acessibilidade ---
  const secA11y = document.createElement('section');
  secA11y.id = 'acessibilidade';
  const h2A11y = document.createElement('h2');
  h2A11y.className = 'text-xl font-semibold mb-4';
  const a11yContent = document.createElement('div');
  a11yContent.className = 'rounded-lg border border-border p-6 bg-card/30 space-y-6';
  secA11y.append(h2A11y, a11yContent);

  // --- Relacionados ---
  const secRelated = document.createElement('section');
  secRelated.id = 'relacionados';
  const h2Related = document.createElement('h2');
  h2Related.className = 'text-xl font-semibold mb-4';
  const relatedContent = document.createElement('div');
  relatedContent.className = 'grid grid-cols-1 md:grid-cols-3 gap-4';
  secRelated.append(h2Related, relatedContent);

  // --- Notas ---
  const secNotas = document.createElement('section');
  secNotas.id = 'notas';
  const h2Notas = document.createElement('h2');
  h2Notas.className = 'text-xl font-semibold mb-4';
  const notasContent = document.createElement('div');
  notasContent.className = 'space-y-4';
  secNotas.append(h2Notas, notasContent);

  // --- Analytics ---
  const secAnalytics = document.createElement('section');
  secAnalytics.id = 'analytics';
  const h2Analytics = document.createElement('h2');
  h2Analytics.className = 'text-xl font-semibold mb-4';
  const analyticsContent = document.createElement('div');
  analyticsContent.className = 'rounded-lg border border-border p-6 bg-card/30';
  secAnalytics.append(h2Analytics, analyticsContent);

  // --- Testes ---
  const secTestes = document.createElement('section');
  secTestes.id = 'testes';
  const h2Testes = document.createElement('h2');
  h2Testes.className = 'text-xl font-semibold mb-4';
  const testesContent = document.createElement('div');
  testesContent.className = 'space-y-8';
  secTestes.append(h2Testes, testesContent);

  main.append(secDemo, secAnatomia, secWhen, secDoDont, secImport, secExemplos, secVariantes, secEstados, secProps, secTokens, secA11y, secRelated, secNotas, secAnalytics, secTestes);

  // ── updateContent ─────────────────────────────────────────────────────────

  function buildTable(headers: string[], rows: string[][]): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'overflow-x-auto';
    const table = document.createElement('table');
    table.className = 'w-full border-collapse text-sm';
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    tr.className = 'border-b border-border bg-muted/50 text-left';
    headers.forEach((h, i) => {
      const th = document.createElement('th');
      th.className = `p-3 font-semibold${i < headers.length - 1 ? ' border-r border-border' : ''}`;
      th.textContent = h;
      tr.appendChild(th);
    });
    thead.appendChild(tr);
    const tbody = document.createElement('tbody');
    rows.forEach(row => {
      const tr2 = document.createElement('tr');
      tr2.className = 'border-b border-border last:border-0 hover:bg-muted/5';
      row.forEach((cell, i) => {
        const td = document.createElement('td');
        td.className = `p-3${i < row.length - 1 ? ' border-r border-border' : ''} text-muted-foreground`;
        td.innerHTML = sanitizeHtml(cell);
        tr2.appendChild(td);
      });
      tbody.appendChild(tr2);
    });
    table.append(thead, tbody);
    wrap.appendChild(table);
    return wrap;
  }

  function updateContent() {
    // Header
    h1.textContent = t('title');
    desc.textContent = t('description');
    badgeCategory.textContent = t('category');
    badgeType.textContent = t('type');

    buildSidebar();

    // Demo
    h2Demo.textContent = t('demonstration.title');
    demoWrap.innerHTML = '';
    demoWrap.appendChild(createAccordion({
      type: 'single',
      collapsible: true,
      items: [
        { value: 'd1', trigger: t('demonstration.labels.trigger1'), content: t('demonstration.labels.content1') },
        { value: 'd2', trigger: t('demonstration.labels.trigger2'), content: t('demonstration.labels.content2') },
        { value: 'd3', trigger: t('demonstration.labels.trigger3'), content: t('demonstration.labels.content3') },
      ],
      class: 'max-w-lg',
    }));

    // Anatomia
    h2Anatomia.textContent = t('anatomy.title');
    anatomiaContent.innerHTML = '';
    const ol = document.createElement('ol');
    ol.className = 'space-y-3 text-sm list-none p-0 m-0';
    [1, 2, 3, 4].forEach(i => {
      const li = document.createElement('li');
      li.className = 'flex gap-3 list-none';
      li.innerHTML = `<span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">${i}</span><span>${sanitizeHtml(t(`anatomy.item${i}`))}</span>`;
      ol.appendChild(li);
    });
    const structureDiv = document.createElement('div');
    structureDiv.className = 'rounded-lg bg-muted/50 border border-border/40 px-4 pt-3 pb-4 mt-4';
    structureDiv.innerHTML = `<p class="text-xs text-muted-foreground mb-2">${sanitizeHtml(t('anatomy.structureLabel'))}</p><pre class="text-xs font-mono leading-relaxed">${sanitizeHtml(t('anatomy.structureCode'))}</pre>`;
    anatomiaContent.append(ol, structureDiv);

    // Quando usar
    h2When.textContent = t('usage.title');
    whenContent.innerHTML = '';
    const guidelinesDiv = document.createElement('div');
    guidelinesDiv.className = 'bg-muted/30 rounded-lg p-4 space-y-3';
    const guidelinesH3 = document.createElement('h3');
    guidelinesH3.className = 'font-medium text-sm';
    guidelinesH3.textContent = t('usage.guidelines.title');
    const guidelinesUl = document.createElement('ul');
    guidelinesUl.className = 'list-disc pl-5 space-y-2 text-sm text-muted-foreground';
    [1, 2, 3, 4].forEach(i => {
      const li = document.createElement('li');
      li.innerHTML = sanitizeHtml(t(`usage.guidelines.item${i}`));
      guidelinesUl.appendChild(li);
    });
    guidelinesDiv.append(guidelinesH3, guidelinesUl);

    const scenariosTable = buildTable(
      [t('usage.scenarios.cols.scenario'), t('usage.scenarios.cols.use'), t('usage.scenarios.cols.alternative')],
      [1, 2, 3, 4].map(i => [t(`usage.scenarios.item${i}.s`), t(`usage.scenarios.item${i}.u`), t(`usage.scenarios.item${i}.a`)])
    );

    const doDiv = document.createElement('div');
    doDiv.className = 'bg-card border rounded-xl p-4 shadow-sm';
    const doH3 = document.createElement('h3');
    doH3.className = 'mb-3 text-sm font-semibold text-green-600 flex items-center gap-2';
    doH3.innerHTML = `<span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 text-xs font-bold flex-shrink-0">✓</span>${sanitizeHtml(t('usage.do.title'))}`;
    const doUl = document.createElement('ul');
    doUl.className = 'list-disc pl-5 space-y-2 text-sm text-muted-foreground';
    [1, 2, 3, 4].forEach(i => {
      const li = document.createElement('li');
      li.textContent = t(`usage.do.item${i}`);
      doUl.appendChild(li);
    });
    doDiv.append(doH3, doUl);

    const dontDiv = document.createElement('div');
    dontDiv.className = 'bg-card border rounded-xl p-4 shadow-sm';
    const dontH3 = document.createElement('h3');
    dontH3.className = 'mb-3 text-sm font-semibold text-red-600 flex items-center gap-2';
    dontH3.innerHTML = `<span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 text-xs font-bold flex-shrink-0">✗</span>${sanitizeHtml(t('usage.dont.title'))}`;
    const dontUl = document.createElement('ul');
    dontUl.className = 'list-disc pl-5 space-y-2 text-sm text-muted-foreground';
    [1, 2, 3, 4].forEach(i => {
      const li = document.createElement('li');
      li.innerHTML = sanitizeHtml(t(`usage.dont.item${i}`));
      dontUl.appendChild(li);
    });
    dontDiv.append(dontH3, dontUl);

    const doDontGrid = document.createElement('div');
    doDontGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';
    doDontGrid.append(doDiv, dontDiv);
    whenContent.append(guidelinesDiv, scenariosTable, doDontGrid);

    // Do/Don't
    h2DoDont.textContent = t('doDont.title');
    doDontContent.innerHTML = '';
    [1, 2].forEach(pair => {
      const grid = document.createElement('div');
      grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-6';
      const doSide = document.createElement('div');
      doSide.className = 'space-y-3';
      doSide.innerHTML = `
        <div class="flex items-center gap-2 text-green-600">
          <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 text-xs font-bold flex-shrink-0">✓</span>
          <span class="text-sm font-semibold uppercase tracking-wider">${sanitizeHtml(tNav('common.do'))}</span>
        </div>
        <div class="border border-green-200 rounded-xl p-4 bg-green-50/50"></div>
        <p class="text-sm text-muted-foreground italic px-1">${sanitizeHtml(t(`doDont.pair${pair}.do`))}</p>
      `;
      const doExample = doSide.querySelector<HTMLDivElement>('.border-green-200')!;
      doExample.appendChild(createAccordion({
        type: 'single', collapsible: true,
        items: [{ value: `dd${pair}-1`, trigger: t('demonstration.labels.trigger1'), content: t('demonstration.labels.content1') }],
      }));

      const dontSide = document.createElement('div');
      dontSide.className = 'space-y-3';
      dontSide.innerHTML = `
        <div class="flex items-center gap-2 text-red-600">
          <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 text-xs font-bold flex-shrink-0">✗</span>
          <span class="text-sm font-semibold uppercase tracking-wider">${sanitizeHtml(tNav('common.dont'))}</span>
        </div>
        <div class="border border-red-200 rounded-xl p-4 bg-red-50/50 min-h-16 flex items-center">
          <p class="text-sm text-muted-foreground">${sanitizeHtml(t(`doDont.pair${pair}.dontExample`))}</p>
        </div>
        <p class="text-sm text-muted-foreground italic px-1">${sanitizeHtml(t(`doDont.pair${pair}.dont`))}</p>
      `;
      grid.append(doSide, dontSide);
      doDontContent.appendChild(grid);
    });

    // Import
    h2Import.textContent = t('import.title');
    const importP = importContent.querySelector('p');
    if (importP) importP.textContent = t('import.basic');

    // Exemplos
    h2Exemplos.textContent = t('examples.title');
    exemplosContent.innerHTML = '';
    const ex1 = document.createElement('div');
    ex1.className = 'space-y-3';
    const ex1H3 = document.createElement('h3');
    ex1H3.className = 'text-sm font-medium';
    ex1H3.textContent = t('examples.basic');
    const ex1Demo = document.createElement('div');
    ex1Demo.className = 'rounded-lg border border-border p-6 bg-card/30';
    ex1Demo.appendChild(createAccordion({
      type: 'single', collapsible: true,
      items: [{ value: 'e1', trigger: t('demonstration.labels.trigger1'), content: t('demonstration.labels.content1') }],
      class: 'max-w-md',
    }));
    const ex1Code = document.createElement('div');
    ex1Code.className = 'bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto';
    ex1Code.innerHTML = `<code class="whitespace-pre">const el = createAccordion({
  type: 'single', collapsible: true,
  items: [{ value: 'item-1', trigger: 'Título', content: 'Conteúdo.' }],
});</code>`;
    ex1.append(ex1H3, ex1Demo, ex1Code);
    exemplosContent.appendChild(ex1);

    // Variantes (Modos)
    h2Variantes.textContent = t('variants.title');
    variantesContent.innerHTML = '';
    (['single', 'multiple', 'controlled'] as const).forEach(key => {
      const card = document.createElement('div');
      card.className = 'rounded-lg border border-border p-4 bg-card/30 space-y-2';
      card.innerHTML = `
        <div><span class="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] font-mono text-muted-foreground">${sanitizeHtml(t(`variants.${key}.label`))}</span></div>
        <p class="text-sm text-muted-foreground">${sanitizeHtml(t(`variants.${key}.description`))}</p>
        <p class="text-xs text-muted-foreground/70">${sanitizeHtml(t(`variants.${key}.use`))}</p>
      `;
      variantesContent.appendChild(card);
    });

    // Estados
    h2Estados.textContent = t('states.title');
    estadosContent.innerHTML = '';
    estadosContent.appendChild(buildTable(
      [t('states.cols.state'), t('states.cols.trigger'), t('states.cols.behavior')],
      (['closed', 'open', 'disabled', 'defaultOpen'] as const).map(key => [
        sanitizeHtml(t(`states.${key}.label`)),
        t(`states.${key}.trigger`),
        t(`states.${key}.behavior`),
      ])
    ));

    // Propriedades
    h2Props.textContent = t('props.title');
    propsContent.innerHTML = '';
    const rootPropsHeader = document.createElement('h3');
    rootPropsHeader.className = 'text-sm font-semibold mb-3';
    rootPropsHeader.textContent = t('props.rootTitle');
    const rootPropsDiv = document.createElement('div');
    rootPropsDiv.className = 'rounded-lg border border-border p-4 shadow-sm overflow-x-auto';
    const rootPropRows: Array<{ name: string; type: string; def: string; descKey: string }> = [
      { name: 'type',          type: '"single" | "multiple"',             def: '—',     descKey: 'type_prop'     },
      { name: 'collapsible',   type: 'boolean',                            def: 'false', descKey: 'collapsible'   },
      { name: 'value',         type: 'string | string[]',                  def: '—',     descKey: 'value'         },
      { name: 'defaultValue',  type: 'string | string[]',                  def: '—',     descKey: 'defaultValue'  },
      { name: 'onValueChange', type: '(value: string | string[]) => void', def: '—',     descKey: 'onValueChange' },
      { name: 'className',     type: 'string',                             def: '—',     descKey: 'className'     },
    ];
    rootPropsDiv.appendChild(buildTable(
      [t('props.cols.prop'), t('props.cols.type'), t('props.cols.default'), t('props.cols.description')],
      rootPropRows.map(prop => [
        `<span class="font-mono text-xs text-primary">${prop.name}</span>`,
        `<span class="font-mono text-xs">${prop.type}</span>`,
        `<span class="font-mono text-xs">${prop.def}</span>`,
        sanitizeHtml(t(`props.table.${prop.descKey}`)),
      ])
    ));
    const itemPropsHeader = document.createElement('h3');
    itemPropsHeader.className = 'text-sm font-semibold mb-3 mt-4';
    itemPropsHeader.textContent = t('props.itemTitle');
    const itemPropsDiv = document.createElement('div');
    itemPropsDiv.className = 'rounded-lg border border-border p-4 shadow-sm overflow-x-auto';
    const itemPropRows: Array<{ name: string; type: string; def: string; descKey: string }> = [
      { name: 'value',     type: 'string',  def: '—',     descKey: 'value'    },
      { name: 'disabled',  type: 'boolean', def: 'false', descKey: 'disabled' },
      { name: 'className', type: 'string',  def: '—',     descKey: 'className'},
    ];
    itemPropsDiv.appendChild(buildTable(
      [t('props.cols.prop'), t('props.cols.type'), t('props.cols.default'), t('props.cols.description')],
      itemPropRows.map(prop => [
        `<span class="font-mono text-xs text-primary">${prop.name}</span>`,
        `<span class="font-mono text-xs">${prop.type}</span>`,
        `<span class="font-mono text-xs">${prop.def}</span>`,
        sanitizeHtml(t(`props.table.${prop.descKey}`)),
      ])
    ));
    propsContent.append(rootPropsHeader, rootPropsDiv, itemPropsHeader, itemPropsDiv);

    // Tokens
    h2Tokens.textContent = t('tokens.title');
    tokensContent.innerHTML = '';
    const tokenRows: Array<{ token: string; cls: string; descKey: string }> = [
      { token: '--border',           cls: 'border-border',         descKey: 'border'          },
      { token: '--foreground',        cls: 'text-foreground',       descKey: 'foreground'      },
      { token: '--muted-foreground',  cls: 'text-muted-foreground', descKey: 'mutedForeground' },
      { token: '--ring',              cls: 'ring-ring',             descKey: 'ring'            },
      { token: '--radius',            cls: 'rounded-md',            descKey: 'radius'          },
    ];
    tokensContent.appendChild(buildTable(
      [t('tokens.cols.token'), t('tokens.cols.description'), t('tokens.cols.usage')],
      tokenRows.map(row => [
        `<span class="font-mono text-xs text-primary">${row.token}</span>`,
        t(`tokens.table.${row.descKey}`),
        `<span class="font-mono text-xs">${row.cls}</span>`,
      ])
    ));

    // Acessibilidade
    h2A11y.textContent = t('accessibility.title');
    a11yContent.innerHTML = '';
    const a11ySummaryH3 = document.createElement('h3');
    a11ySummaryH3.className = 'text-sm font-semibold mb-3';
    a11ySummaryH3.textContent = t('accessibility.summary');
    const a11yList = document.createElement('ul');
    a11yList.className = 'space-y-2 text-sm text-muted-foreground list-none p-0 m-0';
    [1, 2, 3, 4, 5].forEach(i => {
      const li = document.createElement('li');
      li.className = 'flex gap-2 items-start list-none';
      li.innerHTML = `<span class="text-primary mt-0.5 flex-shrink-0">•</span><span>${sanitizeHtml(t(`accessibility.item${i}`))}</span>`;
      a11yList.appendChild(li);
    });
    const kbH3 = document.createElement('h3');
    kbH3.className = 'text-sm font-semibold mb-3 mt-4';
    kbH3.textContent = t('accessibility.keyboardTitle');
    const kbLabels: Record<string, string> = { tab: 'Tab', shiftTab: 'Shift+Tab', enter: 'Enter', space: 'Space' };
    const kbGrid = document.createElement('div');
    kbGrid.className = 'grid grid-cols-2 md:grid-cols-4 gap-3';
    (['tab', 'shiftTab', 'enter', 'space'] as const).forEach(key => {
      const card = document.createElement('div');
      card.className = 'rounded-lg border border-border p-3 bg-card/50 space-y-1';
      card.innerHTML = `<kbd class="inline-flex items-center rounded border border-border bg-muted px-2 py-0.5 text-xs font-mono font-semibold">${kbLabels[key]}</kbd><p class="text-xs text-muted-foreground">${sanitizeHtml(t(`accessibility.keyboard.${key}`))}</p>`;
      kbGrid.appendChild(card);
    });
    a11yContent.append(a11ySummaryH3, a11yList, kbH3, kbGrid);

    // Relacionados
    h2Related.textContent = t('related.title');
    relatedContent.innerHTML = '';
    [1, 2, 3].forEach(i => {
      const card = document.createElement('div');
      card.className = 'rounded-lg border border-border p-4 bg-card/30 hover:bg-card/60 transition-colors cursor-pointer group space-y-1';
      card.setAttribute('role', 'link');
      card.tabIndex = 0;
      card.innerHTML = `<p class="text-sm font-medium group-hover:text-primary transition-colors">${sanitizeHtml(t(`related.item${i}.name`))}</p><p class="text-xs text-muted-foreground">${sanitizeHtml(t(`related.item${i}.description`))}</p>`;
      card.addEventListener('click', () => { (window.top ?? window).location.href = t(`related.item${i}.path`); });
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') (window.top ?? window).location.href = t(`related.item${i}.path`); });
      relatedContent.appendChild(card);
    });

    // Notas
    h2Notas.textContent = t('notes.title');
    notasContent.innerHTML = '';
    const borderColors = ['border-primary/40', 'border-orange-400/40', 'border-blue-400/40'];
    const bgColors = ['bg-primary/5', 'bg-orange-500/5', 'bg-blue-500/5'];
    [1, 2, 3].forEach(i => {
      const callout = document.createElement('div');
      callout.className = `rounded-lg border p-4 ${borderColors[i - 1]} ${bgColors[i - 1]}`;
      callout.innerHTML = `<p class="text-sm font-semibold mb-1">${sanitizeHtml(t(`notes.tip${i}Title`))}</p><p class="text-sm text-muted-foreground">${sanitizeHtml(t(`notes.tip${i}`))}</p>`;
      notasContent.appendChild(callout);
    });

    // Analytics
    h2Analytics.textContent = t('analytics.title');
    analyticsContent.innerHTML = '';
    analyticsContent.appendChild(buildTable(
      [t('analytics.cols.event'), t('analytics.cols.trigger'), t('analytics.cols.payload')],
      (['toggle', 'pageView', 'sectionViewed', 'langSwitch'] as const).map(key => [
        `<span class="font-mono text-xs text-primary">${t(`analytics.table.${key}`)}</span>`,
        t(`analytics.table.${key}Trigger`),
        `<span class="font-mono text-xs">${t(`analytics.table.${key}Payload`)}</span>`,
      ])
    ));

    // Testes
    h2Testes.textContent = t('testes.title');
    testesContent.innerHTML = '';
    const funcH3 = document.createElement('h3');
    funcH3.className = 'text-sm font-semibold mb-3';
    funcH3.textContent = t('testes.functional.title');
    const funcCard = document.createElement('div');
    funcCard.className = 'rounded-lg border border-border p-4 shadow-sm overflow-x-auto';
    const funcTable = buildTable(
      [t('testes.cols.action'), t('testes.cols.result'), t('testes.cols.priority')],
      [1, 2, 3, 4, 5, 6].map(i => [
        t(`testes.functional.item${i}.action`),
        t(`testes.functional.item${i}.result`),
        `<span class="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide border-border text-muted-foreground bg-muted">${t(`testes.functional.item${i}.priority`)}</span>`,
      ])
    );
    const a11yTestH3 = document.createElement('h3');
    a11yTestH3.className = 'text-sm font-semibold mb-3 mt-6';
    a11yTestH3.textContent = t('testes.accessibility.title');
    const a11yTestGrid = document.createElement('div');
    a11yTestGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-3';
    [1, 2, 3, 4, 5, 6].forEach(i => {
      const card = document.createElement('div');
      card.className = 'rounded-lg border border-border p-3 bg-card/30 flex gap-2 items-start';
      card.innerHTML = `<span class="text-primary flex-shrink-0 mt-0.5">✓</span><p class="text-xs text-muted-foreground">${sanitizeHtml(t(`testes.accessibility.item${i}`))}</p>`;
      a11yTestGrid.appendChild(card);
    });
    const visualH3 = document.createElement('h3');
    visualH3.className = 'text-sm font-semibold mb-3 mt-6';
    visualH3.textContent = t('testes.visual.title');
    const visualCard = document.createElement('div');
    visualCard.className = 'rounded-lg border border-border p-4 shadow-sm overflow-x-auto';
    const visualTable = buildTable(
      [t('testes.cols.story'), t('testes.cols.priority')],
      [1, 2, 3, 4, 5, 6].map(i => [
        `<span class="font-mono text-xs">${t(`testes.visual.item${i}.story`)}</span>`,
        `<span class="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide border-border text-muted-foreground bg-muted">${t(`testes.visual.item${i}.priority`)}</span>`,
      ])
    );
    funcCard.appendChild(funcTable);
    visualCard.appendChild(visualTable);
    testesContent.append(funcH3, funcCard, a11yTestH3, a11yTestGrid, visualH3, visualCard);
  }

  updateContent();
  const unsubContent = subscribe(updateContent);
  cleanups.push(unsubContent);

  // ── IntersectionObserver ─────────────────────────────────────────────────

  const sectionIds = NAV_GROUPS().flatMap(g => g.sections.map(s => s.id));
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        updateActiveNav(entry.target.id);
        track('docs_section_viewed', { section_id: entry.target.id, component_name: 'accordion', locale: getLocale() });
        break;
      }
    }
  }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

  // Observe after DOM is ready
  requestAnimationFrame(() => {
    sectionIds.forEach(id => {
      const el = root.querySelector(`#${id}`);
      if (el) observer.observe(el);
    });
  });

  cleanups.push(() => observer.disconnect());

  // ── Cleanup on detach ──────────────────────────────────────────────────────

  const mutationObserver = new MutationObserver(() => {
    if (!document.body.contains(root)) {
      cleanups.forEach(fn => fn());
      mutationObserver.disconnect();
    }
  });
  mutationObserver.observe(document.body, { childList: true, subtree: true });

  root.append(header, layout);
  return root;
}
