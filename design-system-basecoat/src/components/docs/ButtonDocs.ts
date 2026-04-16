import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import uiTranslations from '@/i18n/ui.json';
import buttonTranslations from '@shared/content/button/translations.json';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);
const { t, subscribe } = createTranslation(buttonTranslations as Record<string, unknown>);

// ─── Button helper ────────────────────────────────────────────────────────────

const BTN_BASE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const BTN_VARIANTS: Record<string, string> = {
  default:     `${BTN_BASE} bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2`,
  outline:     `${BTN_BASE} border bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2`,
  secondary:   `${BTN_BASE} bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-4 py-2`,
  ghost:       `${BTN_BASE} hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2`,
  link:        `${BTN_BASE} text-primary underline-offset-4 hover:underline h-9 px-4 py-2`,
  destructive: `${BTN_BASE} bg-destructive text-white hover:bg-destructive/90 h-9 px-4 py-2`,
  sm:          `${BTN_BASE} bg-primary text-primary-foreground hover:bg-primary/90 h-8 rounded-md px-3`,
  lg:          `${BTN_BASE} bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-md px-6`,
  icon:        `${BTN_BASE} bg-primary text-primary-foreground hover:bg-primary/90 size-9`,
};

function btn(label: string, variant: keyof typeof BTN_VARIANTS = 'default', disabled = false): HTMLButtonElement {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = BTN_VARIANTS[variant];
  el.textContent = label;
  if (disabled) el.disabled = true;
  return el;
}

// ─── createButtonDocs ─────────────────────────────────────────────────────────

export function createButtonDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  const root = document.createElement('div');
  root.className = 'ds-docs p-8 max-w-5xl mx-auto';

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: `${t('title')} — ${t('category')}`,
      description: t('description'),
      locale,
      componentSlug: 'button',
    });
    track('docs_page_view', { component_name: 'button', locale, page_title: `${t('title')} · Design System` });
    return cleanup;
  }
  let cleanupSeo = updateSeo();
  cleanups.push(() => cleanupSeo());
  const unsubSeo = subscribe(() => { cleanupSeo(); cleanupSeo = updateSeo(); });
  cleanups.push(unsubSeo);

  // ── Header ───────────────────────────────────────────────────────────────

  const header = document.createElement('header');
  header.className = 'mb-12 border-b pb-8 border-border/50';

  // top row: badges + language switcher
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
  installBadge.innerHTML = `<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono border border-border/50">npx shadcn@latest add button</code>`;

  header.append(topRow, h1, desc, installBadge);

  // ── Layout: sidebar + content ────────────────────────────────────────────

  const layout = document.createElement('div');
  layout.className = 'flex gap-16 items-start';

  // Sidebar
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

  // Main content
  const main = document.createElement('div');
  main.className = 'flex-1 space-y-12';
  layout.append(sidebar, main);

  // ── Sections ──────────────────────────────────────────────────────────────

  // --- Demonstração ---
  const secDemo = document.createElement('section');
  secDemo.id = 'demonstracao';
  const h2Demo = document.createElement('h2');
  h2Demo.className = 'text-xl font-semibold mb-4';
  const demoWrap = document.createElement('div');
  secDemo.append(h2Demo, demoWrap);

  // --- Anatomia ---
  const secAnatomia = document.createElement('section');
  secAnatomia.id = 'anatomia';
  const h2Anatomia = document.createElement('h2');
  h2Anatomia.className = 'text-xl font-semibold mb-4';
  const anatomiaContent = document.createElement('div');
  anatomiaContent.className = 'rounded-lg border border-border p-6 bg-card/30';
  secAnatomia.append(h2Anatomia, anatomiaContent);

  // --- Quando usar ---
  const secWhen = document.createElement('section');
  secWhen.id = 'quando-usar';
  const h2When = document.createElement('h2');
  h2When.className = 'text-xl font-semibold mb-4';
  const whenContent = document.createElement('div');
  whenContent.className = 'space-y-8';
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
  secImport.append(h2Import, importContent);

  // --- Exemplos ---
  const secExamples = document.createElement('section');
  secExamples.id = 'exemplos';
  const h2Examples = document.createElement('h2');
  h2Examples.className = 'text-xl font-semibold mb-4';
  const examplesContent = document.createElement('div');
  examplesContent.className = 'space-y-8';
  secExamples.append(h2Examples, examplesContent);

  // --- Variantes ---
  const secVariants = document.createElement('section');
  secVariants.id = 'variantes';
  const h2Variants = document.createElement('h2');
  h2Variants.className = 'text-xl font-semibold mb-6';
  const variantsContent = document.createElement('div');
  variantsContent.className = 'space-y-12';
  secVariants.append(h2Variants, variantsContent);

  // --- Estados ---
  const secStates = document.createElement('section');
  secStates.id = 'estados';
  const h2States = document.createElement('h2');
  h2States.className = 'text-xl font-semibold mb-4';
  const statesContent = document.createElement('div');
  statesContent.className = 'rounded-lg border border-border p-6 bg-card/30 overflow-x-auto';
  secStates.append(h2States, statesContent);

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
  tokensContent.className = 'border rounded-lg overflow-hidden shadow-sm';
  secTokens.append(h2Tokens, tokensContent);

  // --- Acessibilidade ---
  const secA11y = document.createElement('section');
  secA11y.id = 'acessibilidade';
  const h2A11y = document.createElement('h2');
  h2A11y.className = 'text-xl font-semibold mb-4 text-primary flex items-center gap-2';
  const a11yContent = document.createElement('div');
  a11yContent.className = 'space-y-6';
  secA11y.append(h2A11y, a11yContent);

  // --- Relacionados ---
  const secRelated = document.createElement('section');
  secRelated.id = 'relacionados';
  const h2Related = document.createElement('h2');
  h2Related.className = 'text-xl font-semibold mb-4';
  const relatedContent = document.createElement('div');
  relatedContent.className = 'grid grid-cols-1 sm:grid-cols-2 gap-4';
  secRelated.append(h2Related, relatedContent);

  // --- Notas ---
  const secNotes = document.createElement('section');
  secNotes.id = 'notas';
  const h2Notes = document.createElement('h2');
  h2Notes.className = 'text-xl font-semibold mb-4';
  const notesContent = document.createElement('div');
  notesContent.className = 'space-y-4';
  secNotes.append(h2Notes, notesContent);

  // --- Analytics ---
  const secAnalytics = document.createElement('section');
  secAnalytics.id = 'analytics';
  const h2Analytics = document.createElement('h2');
  h2Analytics.className = 'text-xl font-semibold mb-6 flex items-center gap-2';
  const analyticsContent = document.createElement('div');
  analyticsContent.className = 'space-y-4';
  secAnalytics.append(h2Analytics, analyticsContent);

  // --- Testes ---
  const secTests = document.createElement('section');
  secTests.id = 'testes';
  const h2Tests = document.createElement('h2');
  h2Tests.className = 'text-xl font-semibold mb-4 flex items-center gap-2';
  const testsContent = document.createElement('div');
  testsContent.className = 'space-y-8';
  secTests.append(h2Tests, testsContent);

  main.append(
    secDemo, secAnatomia, secWhen, secDoDont, secImport, secExamples,
    secVariants, secStates, secProps, secTokens, secA11y, secRelated,
    secNotes, secAnalytics, secTests,
  );

  root.append(header, layout);

  // ── Reactive render ───────────────────────────────────────────────────────

  function rerenderTexts() {
    // Header
    badgeCategory.textContent = t('category');
    badgeType.textContent = t('type');
    h1.textContent = t('title');
    desc.textContent = t('description');

    // Sidebar (rebuild labels)
    buildSidebar();

    // Demonstração
    h2Demo.textContent = t('demonstration.title');
    demoWrap.innerHTML = '';
    demoWrap.className = 'rounded-lg border border-border p-6 bg-card/30';
    const demoInner = document.createElement('div');
    demoInner.className = 'flex flex-wrap gap-3';
    demoInner.append(
      btn(t('demonstration.labels.save')),
      btn(t('demonstration.labels.cancel'), 'outline'),
      btn(t('demonstration.labels.delete'), 'destructive'),
    );
    demoWrap.appendChild(demoInner);

    // Anatomia
    h2Anatomia.textContent = t('anatomy.title');
    anatomiaContent.innerHTML = `<ol class="space-y-3 text-sm list-none p-0 m-0">
      ${[1, 2, 3].map(i => `<li class="flex gap-3 list-none">
        <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">${i}</span>
        <span>${sanitizeHtml(t(`anatomy.item${i}`))}</span>
      </li>`).join('')}
    </ol>`;

    // Quando usar
    h2When.textContent = t('usage.title');
    whenContent.innerHTML = `
      <div class="bg-muted/30 border p-4 rounded-lg space-y-3">
        <h4 class="font-medium text-sm">${t('usage.guidelines.title')}</h4>
        <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
          ${[1, 2, 3, 4].map(i => `<li>${sanitizeHtml(t(`usage.guidelines.item${i}`))}</li>`).join('')}
        </ul>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-card border rounded-xl p-4 shadow-sm">
          <h4 class="mb-3 text-sm font-semibold text-green-600">✓ ${t('usage.do.title')}</h4>
          <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            ${[1, 2, 3, 4].map(i => `<li>${t(`usage.do.item${i}`)}</li>`).join('')}
          </ul>
        </div>
        <div class="bg-card border rounded-xl p-4 shadow-sm">
          <h4 class="mb-3 text-sm font-semibold text-red-600">✗ ${t('usage.dont.title')}</h4>
          <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            ${[1, 2, 3].map(i => `<li>${sanitizeHtml(t(`usage.dont.item${i}`))}</li>`).join('')}
          </ul>
        </div>
      </div>`;

    // Do/Don't
    h2DoDont.textContent = t('doDont.title');
    doDontContent.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-3">
          <div class="flex items-center gap-2 text-green-600"><span class="font-bold text-lg">✓</span><span class="text-sm font-semibold uppercase">${tNav('common.do')}</span></div>
          <div class="border border-green-200 dark:border-green-900/50 rounded-xl p-6 bg-green-50/50 dark:bg-green-950/10 flex gap-2">
            <button class="${BTN_VARIANTS.default}">${t('demonstration.labels.save')}</button>
            <button class="${BTN_VARIANTS.outline}">${t('demonstration.labels.cancel')}</button>
          </div>
          <p class="text-sm text-muted-foreground italic px-1">${t('doDont.pair1.do')}</p>
        </div>
        <div class="space-y-3">
          <div class="flex items-center gap-2 text-red-600"><span class="font-bold text-lg">✗</span><span class="text-sm font-semibold uppercase">${tNav('common.dont')}</span></div>
          <div class="border border-red-200 dark:border-red-900/50 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/10 flex gap-2">
            <button class="${BTN_VARIANTS.default}">OK</button>
            <button class="${BTN_VARIANTS.default}">Click here</button>
          </div>
          <p class="text-sm text-muted-foreground italic px-1">${t('doDont.pair1.dont')}</p>
        </div>
      </div>`;

    // Importação
    h2Import.textContent = t('import.title');
    importContent.innerHTML = `
      <div>
        <p class="text-sm text-muted-foreground mb-3">${t('import.basic')}</p>
        <pre class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code>import { createButton } from '@/components/ui/button';</code></pre>
      </div>`;

    // Exemplos
    h2Examples.textContent = t('examples.title');
    examplesContent.innerHTML = `
      <div class="space-y-3">
        <h3 class="text-sm font-medium">${t('examples.basic')}</h3>
        <div class="rounded-lg border border-border p-6 bg-card/30">
          <button class="${BTN_VARIANTS.default}">${t('demonstration.labels.save')}</button>
        </div>
      </div>
      <div class="space-y-3">
        <h3 class="text-sm font-medium">${t('examples.disabled')}</h3>
        <div class="rounded-lg border border-border p-6 bg-card/30">
          <button disabled class="${BTN_VARIANTS.default} opacity-50 cursor-not-allowed pointer-events-none">${t('examples.disabled')}</button>
        </div>
      </div>`;

    // Variantes
    h2Variants.textContent = t('variants.title');
    const VARIANT_LIST = ['default', 'secondary', 'outline', 'ghost', 'link', 'destructive'] as const;
    const SIZE_LIST = [
      { key: 'sm', cls: 'sm' }, { key: 'default', cls: 'default' },
      { key: 'lg', cls: 'lg' }, { key: 'icon', cls: 'icon' },
    ] as const;
    variantsContent.innerHTML = `
      <div>
        <h3 class="text-sm font-semibold text-muted-foreground mb-6 px-1 border-l-2 border-primary/20 pl-3">${t('variants.visualTitle')}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          ${VARIANT_LIST.map(v => `
            <div class="border border-border/60 rounded-xl overflow-hidden bg-card/50 flex flex-col hover:border-primary/30 hover:shadow-sm transition-all">
              <div class="flex-1 flex items-center justify-center p-8 bg-muted/5 min-h-[140px]">
                <button class="${BTN_VARIANTS[v]}">${t('title')}</button>
              </div>
              <div class="p-4 border-t border-border/40 bg-muted/10 space-y-1">
                <p class="text-[10px] uppercase font-mono text-primary font-bold tracking-wider px-1.5 py-0.5 bg-primary/5 rounded-sm inline-block mb-1">${v}</p>
                <p class="text-xs text-muted-foreground leading-relaxed">${t(`variants.items.${v}`)}</p>
              </div>
            </div>`).join('')}
        </div>
      </div>
      <div>
        <h3 class="text-sm font-semibold text-muted-foreground mb-6 px-1 border-l-2 border-primary/20 pl-3">${t('variants.sizeTitle')}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          ${SIZE_LIST.map(({ key, cls }) => `
            <div class="border border-border/60 rounded-xl overflow-hidden bg-card/50 flex flex-col hover:border-primary/30 hover:shadow-sm transition-all">
              <div class="flex-1 flex items-center justify-center p-6 bg-muted/5 min-h-[100px]">
                <button class="${BTN_VARIANTS[cls]}">${key === 'icon' ? '✉' : t('title')}</button>
              </div>
              <div class="p-3 border-t border-border/40 bg-muted/10">
                <p class="text-[10px] uppercase font-mono text-primary font-bold block mb-1">${key}</p>
                <p class="text-[11px] text-muted-foreground">${t(`variants.sizes.${key}`)}</p>
              </div>
            </div>`).join('')}
        </div>
      </div>`;

    // Estados
    h2States.textContent = t('states.title');
    statesContent.innerHTML = `<table class="w-full border-collapse text-sm">
      <thead><tr class="border-b border-border text-left bg-muted/50">
        <th class="p-3 border-r border-border font-medium">${t('states.table.state')}</th>
        <th class="p-3 border-r border-border font-medium">${t('states.table.visual')}</th>
        <th class="p-3 font-medium">${t('states.table.trigger')}</th>
      </tr></thead>
      <tbody>
        <tr class="border-b border-border hover:bg-muted/5"><td class="p-3 border-r border-border font-medium">Default</td><td class="p-3 border-r border-border"><button class="${BTN_VARIANTS.sm}">${t('demonstration.labels.save')}</button></td><td class="p-3 text-muted-foreground">${t('states.table.initial')}</td></tr>
        <tr class="hover:bg-muted/5"><td class="p-3 border-r border-border font-medium">Disabled</td><td class="p-3 border-r border-border"><button disabled class="${BTN_VARIANTS.sm} opacity-50 cursor-not-allowed">${t('demonstration.labels.save')}</button></td><td class="p-3 text-muted-foreground">${t('states.table.disabled')}</td></tr>
      </tbody></table>`;

    // Propriedades
    h2Props.textContent = t('props.title');
    propsContent.innerHTML = `
      <div>
        <h3 class="font-medium text-sm mb-3">${t('props.interface')}</h3>
        <pre class="bg-muted p-4 rounded-lg font-mono text-xs border overflow-x-auto whitespace-pre leading-relaxed"><code>interface ButtonOptions {
  variant?: 'default'|'destructive'|'outline'|'secondary'|'ghost'|'link';
  size?: 'default'|'sm'|'lg'|'icon';
  disabled?: boolean;
  class?: string;
}</code></pre>
      </div>
      <div class="border rounded-lg overflow-hidden shadow-sm">
        <table class="w-full border-collapse text-sm">
          <thead class="bg-muted/50 border-b text-left"><tr>
            <th class="p-3 border-r border-border font-semibold">${t('props.table.prop')}</th>
            <th class="p-3 border-r border-border font-semibold">${t('props.table.type')}</th>
            <th class="p-3 border-r border-border font-semibold">${t('props.table.default')}</th>
            <th class="p-3 font-semibold">${t('props.table.description')}</th>
          </tr></thead>
          <tbody>
            <tr class="border-b hover:bg-muted/5"><td class="p-3 border-r border-border font-mono text-xs font-bold text-primary">variant</td><td class="p-3 border-r border-border font-mono text-[10px] text-muted-foreground">"default"|"destructive"|…</td><td class="p-3 border-r border-border font-mono text-[10px]">"default"</td><td class="p-3 text-xs text-muted-foreground">${t('props.table.variant')}</td></tr>
            <tr class="border-b hover:bg-muted/5"><td class="p-3 border-r border-border font-mono text-xs font-bold text-primary">size</td><td class="p-3 border-r border-border font-mono text-[10px] text-muted-foreground">"default"|"sm"|"lg"|"icon"</td><td class="p-3 border-r border-border font-mono text-[10px]">"default"</td><td class="p-3 text-xs text-muted-foreground">${t('props.table.size')}</td></tr>
            <tr class="hover:bg-muted/5"><td class="p-3 border-r border-border font-mono text-xs font-bold text-primary">disabled</td><td class="p-3 border-r border-border font-mono text-[10px] text-muted-foreground">boolean</td><td class="p-3 border-r border-border font-mono text-[10px]">false</td><td class="p-3 text-xs text-muted-foreground">${t('props.table.disabled')}</td></tr>
          </tbody>
        </table>
      </div>`;

    // Tokens
    h2Tokens.textContent = t('tokens.title');
    tokensContent.innerHTML = `<table class="w-full border-collapse text-sm">
      <thead><tr class="border-b border-border bg-muted/50 text-left">
        <th class="p-3 border-r border-border font-medium">${t('tokens.table.token')}</th>
        <th class="p-3 border-r border-border font-medium">${t('tokens.table.class')}</th>
        <th class="p-3 font-medium">${t('tokens.table.part')}</th>
      </tr></thead>
      <tbody>
        <tr class="border-b border-border hover:bg-muted/5"><td class="p-3 border-r border-border font-mono text-xs text-primary font-medium"><code>--primary</code></td><td class="p-3 border-r border-border font-mono text-xs text-primary"><code>bg-primary</code></td><td class="p-3 text-xs text-muted-foreground">${t('tokens.table.primary')}</td></tr>
        <tr class="hover:bg-muted/5"><td class="p-3 border-r border-border font-mono text-xs text-primary font-medium"><code>--radius</code></td><td class="p-3 border-r border-border font-mono text-xs text-primary"><code>rounded-md</code></td><td class="p-3 text-xs text-muted-foreground">${t('tokens.table.radius')}</td></tr>
      </tbody></table>`;

    // Acessibilidade
    h2A11y.innerHTML = `<span class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg">♿</span>${t('accessibility.title')}`;
    a11yContent.innerHTML = `
      <div class="bg-muted/30 border p-6 rounded-xl space-y-4">
        <h4 class="font-semibold text-sm">${t('accessibility.featuresTitle')}</h4>
        <ul class="grid grid-cols-1 sm:grid-cols-2 gap-4 list-none p-0 m-0">
          ${[1, 2, 3].map(i => `<li class="flex gap-3 text-sm text-muted-foreground bg-card p-3 rounded-lg border border-border/40 list-none"><span class="text-primary font-bold">✓</span><span>${sanitizeHtml(t(`accessibility.item${i}`))}</span></li>`).join('')}
        </ul>
      </div>
      <div class="space-y-4">
        <h4 class="font-semibold text-sm">⌨️ ${t('accessibility.keyboardTitle')}</h4>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          ${['tab', 'enter', 'space'].map(k => `<div class="bg-card border rounded-xl p-4 shadow-sm"><code class="text-[10px] bg-muted px-2 py-0.5 rounded-md uppercase font-bold text-primary border border-border/60 block mb-2">${k}</code><p class="text-xs text-muted-foreground italic">${t(`accessibility.keyboard.${k}`)}</p></div>`).join('')}
        </div>
      </div>`;

    // Relacionados
    h2Related.textContent = t('related.title');
    relatedContent.innerHTML = `
      <div class="border rounded-xl p-4 bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer"><h4 class="text-sm font-semibold mb-1">Toggle</h4><p class="text-xs text-muted-foreground">${t('related.toggle')}</p></div>
      <div class="border rounded-xl p-4 bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer"><h4 class="text-sm font-semibold mb-1">Dropdown Menu</h4><p class="text-xs text-muted-foreground">${t('related.dropdown')}</p></div>`;

    // Notas
    h2Notes.textContent = t('notes.title');
    notesContent.innerHTML = `
      <div class="p-4 bg-primary/5 border-l-4 border-primary rounded-r-lg"><p class="text-sm text-muted-foreground">${t('notes.tip1')}</p></div>
      <div class="p-4 bg-orange-500/5 border-l-4 border-orange-500 rounded-r-lg"><p class="text-sm text-muted-foreground">${t('notes.tip2')}</p></div>`;

    // Analytics
    h2Analytics.innerHTML = `<span class="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-lg">📊</span>${t('analytics.title')}`;
    analyticsContent.innerHTML = `
      <p class="text-sm text-muted-foreground">${t('analytics.description')}</p>
      <div class="border rounded-xl overflow-hidden shadow-sm">
        <table class="w-full border-collapse text-sm">
          <thead><tr class="bg-muted/50 border-b text-left">
            <th class="p-4 border-r border-border font-semibold w-1/4">${t('analytics.table.event')}</th>
            <th class="p-4 border-r border-border font-semibold w-1/4">${t('analytics.table.trigger')}</th>
            <th class="p-4 font-semibold">${t('analytics.table.payload')}</th>
          </tr></thead>
          <tbody><tr class="hover:bg-muted/5">
            <td class="p-4 border-r border-border font-mono text-xs text-primary font-bold">${t('analytics.table.click')}</td>
            <td class="p-4 border-r border-border text-xs">${t('analytics.table.clickTrigger')}</td>
            <td class="p-4 font-mono text-[11px] text-muted-foreground bg-muted/10">${t('analytics.table.clickPayload')}</td>
          </tr></tbody>
        </table>
      </div>`;

    // Testes
    h2Tests.innerHTML = `<span class="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-lg">🧪</span>${t('testes.title')}`;
    testsContent.innerHTML = `
      <div>
        <h3 class="font-semibold text-sm mb-4 text-muted-foreground">${t('testes.functional')}</h3>
        <div class="border rounded-xl overflow-hidden shadow-sm">
          <table class="w-full border-collapse text-sm">
            <thead class="bg-muted/50 border-b text-left"><tr>
              <th class="p-4 border-r border-border font-semibold">${tNav('common.userAction')}</th>
              <th class="p-4 border-r border-border font-semibold">${tNav('common.expectedResult')}</th>
              <th class="p-4 font-semibold w-24">${tNav('common.priority')}</th>
            </tr></thead>
            <tbody><tr class="hover:bg-muted/5">
              <td class="p-4 border-r border-border text-xs font-medium">${t('testes.action')}</td>
              <td class="p-4 border-r border-border text-xs text-muted-foreground">${t('testes.result')}</td>
              <td class="p-4"><span class="inline-flex items-center rounded-md border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-[9px] uppercase tracking-wider font-bold text-orange-600">${t('testes.priority')}</span></td>
            </tr></tbody>
          </table>
        </div>
      </div>
      <div>
        <h3 class="font-semibold text-sm mb-4 text-muted-foreground">${t('testes.accessibility')}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${[1, 2, 3, 4].map(i => `<div class="flex gap-3 items-start p-3 bg-muted/10 rounded-lg border border-border/40"><div class="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5"><span class="text-[10px] text-primary font-bold italic">axe</span></div><span class="text-xs text-muted-foreground">${t(`testes.a11yItem${i}`)}</span></div>`).join('')}
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

  let observers: IntersectionObserver[] = [];

  function setupObservers() {
    observers.forEach(o => o.disconnect());
    observers = [];
    ALL_SECTION_IDS.forEach(id => {
      const el = root.querySelector<HTMLElement>(`#${id}`);
      if (!el) return;
      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          updateActiveNav(id);
          track('docs_section_viewed', { section_id: id, component_name: 'button', locale: getLocale() });
        }
      }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });
      obs.observe(el);
      observers.push(obs);
    });
  }

  // Observe once attached to DOM
  const attachObserver = new MutationObserver(() => {
    if (root.isConnected) {
      setupObservers();
      attachObserver.disconnect();
    }
  });
  attachObserver.observe(document.body, { childList: true, subtree: true });

  // Cleanup on detach
  const detachObserver = new MutationObserver(() => {
    if (!root.isConnected) {
      cleanups.forEach(fn => fn());
      observers.forEach(o => o.disconnect());
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
