import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import uiTranslations from '@/i18n/ui.json';
import sonnerTranslations from '@shared/content/sonner/translations.json';
import { toast, injectToastStyles } from '@/components/ui/toast-utils';

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);
const { t, subscribe } = createTranslation(sonnerTranslations as Record<string, unknown>);

type Locale = 'pt-BR' | 'en' | 'es';

export function createSonnerDocs(): HTMLElement {
  injectToastStyles();
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
      componentSlug: 'sonner',
    });
    track('docs_page_view', { component_name: 'sonner', locale, page_title: `${t('title')} · Design System` });
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
  installBadge.innerHTML = `<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono border border-border/50">npx shadcn@latest add sonner</code>`;

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
  main.className = 'flex-1 space-y-12';
  layout.append(sidebar, main);

  // ── Sections ──────────────────────────────────────────────────────────────

  const secDemo = document.createElement('section');
  secDemo.id = 'demonstracao';
  const h2Demo = document.createElement('h2');
  h2Demo.className = 'text-xl font-semibold mb-4';
  const demoWrap = document.createElement('div');
  secDemo.append(h2Demo, demoWrap);

  const secAnatomia = document.createElement('section');
  secAnatomia.id = 'anatomia';
  const h2Anatomia = document.createElement('h2');
  h2Anatomia.className = 'text-xl font-semibold mb-4';
  const anatomiaContent = document.createElement('div');
  anatomiaContent.className = 'rounded-lg border border-border p-6 bg-card/30';
  secAnatomia.append(h2Anatomia, anatomiaContent);

  const secWhen = document.createElement('section');
  secWhen.id = 'quando-usar';
  const h2When = document.createElement('h2');
  h2When.className = 'text-xl font-semibold mb-4';
  const whenContent = document.createElement('div');
  whenContent.className = 'border rounded-xl p-6 shadow-sm space-y-6';
  secWhen.append(h2When, whenContent);

  const secDoDont = document.createElement('section');
  secDoDont.id = 'do-dont';
  const h2DoDont = document.createElement('h2');
  h2DoDont.className = 'text-xl font-semibold mb-4';
  const doDontContent = document.createElement('div');
  doDontContent.className = 'rounded-lg border border-border p-6 bg-card/30 space-y-8';
  secDoDont.append(h2DoDont, doDontContent);

  const secImport = document.createElement('section');
  secImport.id = 'importacao';
  const h2Import = document.createElement('h2');
  h2Import.className = 'text-xl font-semibold mb-4';
  const importContent = document.createElement('div');
  importContent.className = 'rounded-lg border border-border p-6 bg-card/30 space-y-4';
  secImport.append(h2Import, importContent);

  const secExamples = document.createElement('section');
  secExamples.id = 'exemplos';
  const h2Examples = document.createElement('h2');
  h2Examples.className = 'text-xl font-semibold mb-4';
  const examplesContent = document.createElement('div');
  examplesContent.className = 'space-y-8';
  secExamples.append(h2Examples, examplesContent);

  const secVariants = document.createElement('section');
  secVariants.id = 'variantes';
  const h2Variants = document.createElement('h2');
  h2Variants.className = 'text-xl font-semibold mb-6';
  const variantsContent = document.createElement('div');
  variantsContent.className = 'space-y-12';
  secVariants.append(h2Variants, variantsContent);

  const secStates = document.createElement('section');
  secStates.id = 'estados';
  const h2States = document.createElement('h2');
  h2States.className = 'text-xl font-semibold mb-4';
  const statesContent = document.createElement('div');
  statesContent.className = 'border rounded-xl overflow-x-auto p-4 shadow-sm';
  secStates.append(h2States, statesContent);

  const secProps = document.createElement('section');
  secProps.id = 'propriedades';
  const h2Props = document.createElement('h2');
  h2Props.className = 'text-xl font-semibold mb-4';
  const propsContent = document.createElement('div');
  propsContent.className = 'space-y-6';
  secProps.append(h2Props, propsContent);

  const secTokens = document.createElement('section');
  secTokens.id = 'tokens';
  const h2Tokens = document.createElement('h2');
  h2Tokens.className = 'text-xl font-semibold mb-4';
  const tokensContent = document.createElement('div');
  tokensContent.className = 'border rounded-xl overflow-x-auto p-4 shadow-sm';
  secTokens.append(h2Tokens, tokensContent);

  const secA11y = document.createElement('section');
  secA11y.id = 'acessibilidade';
  const h2A11y = document.createElement('h2');
  h2A11y.className = 'text-xl font-semibold mb-4 text-primary flex items-center gap-2';
  const a11yContent = document.createElement('div');
  a11yContent.className = 'space-y-6';
  secA11y.append(h2A11y, a11yContent);

  const secRelated = document.createElement('section');
  secRelated.id = 'relacionados';
  const h2Related = document.createElement('h2');
  h2Related.className = 'text-xl font-semibold mb-4';
  const relatedContent = document.createElement('div');
  relatedContent.className = 'grid grid-cols-1 sm:grid-cols-2 gap-4';
  secRelated.append(h2Related, relatedContent);

  const secNotes = document.createElement('section');
  secNotes.id = 'notas';
  const h2Notes = document.createElement('h2');
  h2Notes.className = 'text-xl font-semibold mb-4';
  const notesContent = document.createElement('div');
  notesContent.className = 'space-y-4';
  secNotes.append(h2Notes, notesContent);

  const secAnalytics = document.createElement('section');
  secAnalytics.id = 'analytics';
  const h2Analytics = document.createElement('h2');
  h2Analytics.className = 'text-xl font-semibold mb-6 flex items-center gap-2';
  const analyticsContent = document.createElement('div');
  analyticsContent.className = 'space-y-4';
  secAnalytics.append(h2Analytics, analyticsContent);

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

  const TOAST_TYPES = ['default', 'success', 'error', 'warning', 'info', 'loading'] as const;
  const POSITIONS = ['top-right', 'top-center', 'top-left', 'bottom-right', 'bottom-center', 'bottom-left'] as const;

  const TYPE_COLORS: Record<string, string> = {
    default: 'bg-muted/50 border-border',
    success: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
    warning: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800',
    info: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
    loading: 'bg-muted/50 border-border',
  };

  function rerenderTexts() {
    badgeCategory.textContent = t('category');
    badgeType.textContent = t('type');
    h1.textContent = t('title');
    desc.textContent = t('description');

    buildSidebar();

    // Demonstração
    h2Demo.textContent = t('demonstration.title');
    demoWrap.innerHTML = '';
    demoWrap.className = 'rounded-lg border border-border p-6 bg-card/30';
    const demoInner = document.createElement('div');
    demoInner.className = 'flex flex-wrap gap-3';

    const BTN = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all h-9 px-4 py-2';
    const BTN_DEFAULT = `${BTN} bg-primary text-primary-foreground hover:bg-primary/90`;
    const BTN_OUTLINE = `${BTN} border bg-background hover:bg-accent hover:text-accent-foreground`;
    const BTN_DESTRUCTIVE = `${BTN} bg-destructive text-white hover:bg-destructive/90`;

    const demoOpts = { richColors: true, closeButton: true, position: 'top-right' as const };

    TOAST_TYPES.forEach(type => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = type === 'error' ? BTN_DESTRUCTIVE : type === 'default' ? BTN_OUTLINE : BTN_DEFAULT;
      b.textContent = t(`demonstration.labels.${type}`);
      b.addEventListener('click', () => {
        track('toast_demo_triggered', { toast_type: type, locale: getLocale() });
        if (type === 'default') toast(t('demonstration.labels.default'), demoOpts);
        else toast[type](t(`demonstration.labels.${type}`), demoOpts);
      });
      demoInner.appendChild(b);
    });

    const dismissBtn = document.createElement('button');
    dismissBtn.type = 'button';
    dismissBtn.className = BTN_OUTLINE;
    dismissBtn.textContent = t('demonstration.labels.dismiss');
    dismissBtn.addEventListener('click', () => toast.dismiss());
    demoInner.appendChild(dismissBtn);

    demoWrap.appendChild(demoInner);

    // Anatomia
    h2Anatomia.textContent = t('anatomy.title');
    anatomiaContent.innerHTML = `
      <ol class="space-y-3 text-sm list-none p-0 m-0">
        ${[1, 2, 3, 4, 5, 6, 7].map(i => `<li class="flex gap-3 list-none">
          <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">${i}</span>
          <span>${sanitizeHtml(t(`anatomy.item${i}`))}</span>
        </li>`).join('')}
      </ol>
      <div class="rounded-lg bg-muted/50 border border-border/40 px-4 pt-3 pb-4 mt-4">
        <p class="text-xs text-muted-foreground mb-2">${sanitizeHtml(t('anatomy.structureLabel'))}</p>
        <pre class="text-xs font-mono leading-relaxed">${sanitizeHtml(t('anatomy.structureCode'))}</pre>
      </div>`;

    // Quando usar
    h2When.textContent = t('usage.title');
    whenContent.innerHTML = `
      <div class="bg-muted/30 rounded-lg p-4 space-y-3">
        <h3 class="font-medium text-sm">${sanitizeHtml(t('usage.guidelines.title'))}</h3>
        <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
          ${[1, 2, 3, 4, 5].map(i => `<li>${sanitizeHtml(t(`usage.guidelines.item${i}`))}</li>`).join('')}
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
                <th class="p-3 border-r border-border font-semibold text-green-700 dark:text-green-400">${sanitizeHtml(t('uxWriting.table.correct'))}</th>
                <th class="p-3 font-semibold text-red-700 dark:text-red-400">${sanitizeHtml(t('uxWriting.table.avoid'))}</th>
              </tr>
            </thead>
            <tbody>
              ${['title', 'description', 'action', 'error'].map(key => `<tr class="border-b border-border last:border-0 hover:bg-muted/5">
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
    h2DoDont.textContent = t('doDont.title');
    doDontContent.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-3">
          <div class="flex items-center gap-2 text-green-600"><span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span><span class="text-sm font-semibold uppercase tracking-wider">${sanitizeHtml(tNav('common.do'))}</span></div>
          <div class="border border-green-200 dark:border-green-900/50 rounded-xl p-6 bg-green-50/50 dark:bg-green-950/10">
            <div class="bg-background border rounded-lg p-3 shadow-sm flex items-start gap-3 max-w-xs">
              <span class="text-green-500 text-lg mt-0.5">✓</span>
              <div><p class="text-sm font-medium">Item salvo</p><p class="text-xs text-muted-foreground">As alterações foram aplicadas.</p></div>
            </div>
          </div>
          <p class="text-sm text-muted-foreground italic px-1">${sanitizeHtml(t('doDont.pair1.do'))}</p>
        </div>
        <div class="space-y-3">
          <div class="flex items-center gap-2 text-red-600"><span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span><span class="text-sm font-semibold uppercase tracking-wider">${sanitizeHtml(tNav('common.dont'))}</span></div>
          <div class="border border-red-200 dark:border-red-900/50 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/10">
            <div class="bg-background border rounded-lg p-3 shadow-sm max-w-xs"><p class="text-sm font-medium">Sucesso!</p></div>
          </div>
          <p class="text-sm text-muted-foreground italic px-1">${sanitizeHtml(t('doDont.pair1.dont'))}</p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div class="space-y-3">
          <div class="flex items-center gap-2 text-green-600"><span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span><span class="text-sm font-semibold uppercase tracking-wider">${sanitizeHtml(tNav('common.do'))}</span></div>
          <div class="border border-green-200 dark:border-green-900/50 rounded-xl p-6 bg-green-50/50 dark:bg-green-950/10">
            <div class="bg-background border border-red-200 dark:border-red-800 rounded-lg p-3 shadow-sm max-w-xs">
              <p class="text-sm font-medium text-red-600">Falha ao salvar</p>
              <p class="text-xs text-muted-foreground">Verifique sua conexão e tente novamente.</p>
              <button class="mt-2 text-xs font-medium text-primary hover:underline">Tentar novamente</button>
            </div>
          </div>
          <p class="text-sm text-muted-foreground italic px-1">${sanitizeHtml(t('doDont.pair2.do'))}</p>
        </div>
        <div class="space-y-3">
          <div class="flex items-center gap-2 text-red-600"><span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span><span class="text-sm font-semibold uppercase tracking-wider">${sanitizeHtml(tNav('common.dont'))}</span></div>
          <div class="border border-red-200 dark:border-red-900/50 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/10">
            <div class="bg-background border rounded-lg p-3 shadow-sm max-w-xs"><p class="text-sm font-medium">Erro 500</p></div>
          </div>
          <p class="text-sm text-muted-foreground italic px-1">${sanitizeHtml(t('doDont.pair2.dont'))}</p>
        </div>
      </div>`;

    // Importação
    h2Import.textContent = t('import.title');
    importContent.innerHTML = `
      <div>
        <p class="text-sm text-muted-foreground mb-3">${sanitizeHtml(t('import.basic'))}</p>
        <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">import { Toaster } from '@/components/ui/sonner';</code></div>
      </div>
      <div>
        <p class="text-sm text-muted-foreground mb-3">${sanitizeHtml(t('import.usage'))}</p>
        <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">import { toast } from 'sonner';</code></div>
      </div>`;

    // Exemplos
    h2Examples.textContent = t('examples.title');
    examplesContent.innerHTML = `
      <div class="space-y-3">
        <h3 class="text-sm font-medium">${sanitizeHtml(t('examples.basic'))}</h3>
        <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">toast("Item salvo com sucesso")</code></div>
      </div>
      <div class="space-y-3">
        <h3 class="text-sm font-medium">${sanitizeHtml(t('examples.types'))}</h3>
        <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">toast.success("Salvo com sucesso")
toast.error("Falha ao salvar")
toast.warning("Conexão instável")
toast.info("Nova versão disponível")
toast.loading("Processando...")</code></div>
      </div>
      <div class="space-y-3">
        <h3 class="text-sm font-medium">${sanitizeHtml(t('examples.withAction'))}</h3>
        <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">toast("Item excluído", {
  action: {
    label: "Desfazer",
    onClick: () =&gt; handleUndo(),
  },
})</code></div>
      </div>
      <div class="space-y-3">
        <h3 class="text-sm font-medium">${sanitizeHtml(t('examples.withDescription'))}</h3>
        <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">toast("Relatório gerado", {
  description: "O arquivo estará disponível em instantes.",
})</code></div>
      </div>
      <div class="space-y-3">
        <h3 class="text-sm font-medium">${sanitizeHtml(t('examples.promise'))}</h3>
        <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">toast.promise(saveData(), {
  loading: "Salvando...",
  success: "Dados salvos!",
  error: "Erro ao salvar",
})</code></div>
      </div>
      <div class="space-y-3">
        <h3 class="text-sm font-medium">${sanitizeHtml(t('examples.custom'))}</h3>
        <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">&lt;Toaster position="bottom-center" richColors /&gt;</code></div>
      </div>`;

    // Variantes (tipos de toast)
    h2Variants.textContent = t('variants.title');
    const posClassMap: Record<string, string> = {
      'top-right': 'top-1 right-1', 'top-center': 'top-1 left-1/2 -translate-x-1/2', 'top-left': 'top-1 left-1',
      'bottom-right': 'bottom-1 right-1', 'bottom-center': 'bottom-1 left-1/2 -translate-x-1/2', 'bottom-left': 'bottom-1 left-1',
    };
    variantsContent.innerHTML = `
      <div>
        <h3 class="text-sm font-semibold text-muted-foreground mb-6 px-1">${sanitizeHtml(t('variants.typesTitle'))}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          ${TOAST_TYPES.map(type => `
            <div class="border border-border/60 rounded-xl overflow-hidden bg-card/50 flex flex-col transition-all hover:border-primary/30 hover:shadow-sm">
              <div class="flex-1 flex items-center justify-center p-8 bg-muted/5 min-h-[140px]">
                <div class="rounded-lg p-3 shadow-sm border max-w-[200px] w-full ${TYPE_COLORS[type]}">
                  <p class="text-sm font-medium">${type === 'default' ? 'Notificação' : type === 'loading' ? 'Processando...' : type}</p>
                </div>
              </div>
              <div class="p-4 border-t border-border/40 bg-muted/10 space-y-1">
                <p class="text-[11px] uppercase font-mono text-primary font-bold tracking-wider px-1.5 py-0.5 bg-primary/5 rounded-sm inline-block mb-1">${type}</p>
                <p class="text-xs text-muted-foreground leading-relaxed">${sanitizeHtml(t(`variants.items.${type}`))}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <div>
        <h3 class="text-sm font-semibold text-muted-foreground mb-6 px-1">${sanitizeHtml(t('variants.positionTitle'))}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          ${POSITIONS.map(pos => `
            <div class="border border-border/60 rounded-xl overflow-hidden bg-card/50 flex flex-col transition-all hover:border-primary/30 hover:shadow-sm">
              <div class="flex-1 flex items-center justify-center p-6 bg-muted/5 min-h-[100px]">
                <div class="w-24 h-16 border border-border/60 rounded-md relative bg-muted/20">
                  <div class="absolute w-8 h-2 bg-primary/60 rounded-sm ${posClassMap[pos]}"></div>
                </div>
              </div>
              <div class="p-3 border-t border-border/40 bg-muted/10 space-y-1">
                <p class="text-[11px] uppercase font-mono text-primary font-bold block">${sanitizeHtml(t(`variants.positions.${pos}`))}</p>
                <p class="text-xs text-muted-foreground/70 italic">${sanitizeHtml(t(`variants.positions.${pos}Use`))}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>`;

    // Estados
    h2States.textContent = t('states.title');
    statesContent.innerHTML = `
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr class="border-b border-border text-left bg-muted/50">
            <th class="p-3 border-r border-border font-medium">${sanitizeHtml(t('states.table.state'))}</th>
            <th class="p-3 border-r border-border font-medium">${sanitizeHtml(t('states.table.visual'))}</th>
            <th class="p-3 font-medium">${sanitizeHtml(t('states.table.trigger'))}</th>
          </tr>
        </thead>
        <tbody>
          ${[
            { state: 'Visible',     visual: t('states.table.visible'),    trigger: t('states.table.visibleTrigger') },
            { state: 'Expanded',    visual: t('states.table.expanded'),   trigger: t('states.table.expandedTrigger') },
            { state: 'Dismissing',  visual: t('states.table.dismissing'), trigger: t('states.table.dismissingTrigger') },
            { state: 'Action',      visual: t('states.table.action'),     trigger: t('states.table.actionTrigger') },
            { state: 'Rich Colors', visual: t('states.table.richColors'), trigger: t('states.table.richColorsTrigger') },
          ].map(row => `
            <tr class="border-b border-border hover:bg-muted/5 transition-colors">
              <td class="p-3 border-r border-border font-medium">${sanitizeHtml(row.state)}</td>
              <td class="p-3 border-r border-border text-muted-foreground">${sanitizeHtml(row.visual)}</td>
              <td class="p-3 text-muted-foreground">${sanitizeHtml(row.trigger)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;

    // Propriedades (duas tabelas)
    h2Props.textContent = t('props.title');

    const TOASTER_PROPS = [
      { name: 'position',              type: 'Position',              def: '"bottom-right"' },
      { name: 'theme',                 type: '"light" | "dark" | "system"', def: '"system"' },
      { name: 'richColors',            type: 'boolean',               def: 'false' },
      { name: 'expand',                type: 'boolean',               def: 'false' },
      { name: 'duration',              type: 'number',                def: '4000' },
      { name: 'closeButton',           type: 'boolean',               def: 'false' },
      { name: 'offset',                type: 'string | number',       def: '"32px"' },
      { name: 'visibleToasts',         type: 'number',                def: '3' },
      { name: 'toastOptions',          type: 'ToastOptions',          def: '{}' },
      { name: 'dir',                   type: '"ltr" | "rtl"',         def: '"ltr"' },
      { name: 'gap',                   type: 'number',                def: '14' },
      { name: 'pauseWhenPageIsHidden', type: 'boolean',               def: 'false' },
      { name: 'className',             type: 'string',                def: '—' },
    ];

    const TOAST_OPTIONS = [
      { name: 'description', type: 'string' },
      { name: 'action',      type: '{ label: string; onClick: () => void }' },
      { name: 'cancel',      type: '{ label: string; onClick: () => void }' },
      { name: 'duration',    type: 'number' },
      { name: 'id',          type: 'string | number' },
      { name: 'onDismiss',   type: '(toast: ExternalToast) => void' },
      { name: 'onAutoClose', type: '(toast: ExternalToast) => void' },
      { name: 'important',   type: 'boolean' },
    ];

    propsContent.innerHTML = `
      <div>
        <h3 class="font-medium text-sm mb-3">${sanitizeHtml(t('props.interface'))}</h3>
        <div class="bg-muted p-4 rounded-lg font-mono text-xs border overflow-x-auto whitespace-pre leading-relaxed">type ToasterProps = ComponentProps&lt;typeof Toaster&gt;

// Opções por toast
toast("Título", {
  description?: string
  action?: { label: string; onClick: () =&gt; void }
  cancel?: { label: string; onClick: () =&gt; void }
  duration?: number
  id?: string | number
  onDismiss?: (toast: ExternalToast) =&gt; void
  onAutoClose?: (toast: ExternalToast) =&gt; void
  important?: boolean
})</div>
      </div>
      <div>
        <h3 class="text-sm font-semibold text-muted-foreground mb-4 px-1">${sanitizeHtml(t('props.toasterTitle'))}</h3>
        <div class="border rounded-xl overflow-x-auto p-4 shadow-sm">
          <table class="w-full border-collapse text-sm" style="margin:0">
            <thead class="bg-muted/50 border-b text-left">
              <tr>
                <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(t('props.table.prop'))}</th>
                <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(t('props.table.type'))}</th>
                <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(t('props.table.default'))}</th>
                <th class="p-3 font-semibold">${sanitizeHtml(t('props.table.description'))}</th>
              </tr>
            </thead>
            <tbody>
              ${TOASTER_PROPS.map(prop => `
                <tr class="border-b last:border-0 hover:bg-muted/5">
                  <td class="p-3 border-r border-border font-mono font-bold text-primary">${prop.name}</td>
                  <td class="p-3 border-r border-border font-mono text-muted-foreground">${sanitizeHtml(prop.type)}</td>
                  <td class="p-3 border-r border-border font-mono">${prop.def}</td>
                  <td class="p-3 text-muted-foreground">${sanitizeHtml(t(`props.table.${prop.name}`))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <h3 class="text-sm font-semibold text-muted-foreground mb-4 px-1">${sanitizeHtml(t('props.toastTitle'))}</h3>
        <div class="border rounded-xl overflow-x-auto p-4 shadow-sm">
          <table class="w-full border-collapse text-sm" style="margin:0">
            <thead class="bg-muted/50 border-b text-left">
              <tr>
                <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(t('props.table.prop'))}</th>
                <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(t('props.table.type'))}</th>
                <th class="p-3 font-semibold">${sanitizeHtml(t('props.table.description'))}</th>
              </tr>
            </thead>
            <tbody>
              ${TOAST_OPTIONS.map(prop => `
                <tr class="border-b last:border-0 hover:bg-muted/5">
                  <td class="p-3 border-r border-border font-mono font-bold text-primary">${prop.name}</td>
                  <td class="p-3 border-r border-border font-mono text-muted-foreground">${sanitizeHtml(prop.type)}</td>
                  <td class="p-3 text-muted-foreground">${sanitizeHtml(t(`props.toastTable.${prop.name}`))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="space-y-3">
        <h3 class="font-medium text-sm">${sanitizeHtml(t('props.extensibilityTitle'))}</h3>
        <div class="space-y-3">
          ${['classNameNote', 'themeNote'].map(key => `
            <p class="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4 border">${sanitizeHtml(t(`props.extensibility.${key}`))}</p>
          `).join('')}
        </div>
      </div>`;

    // Tokens
    h2Tokens.textContent = t('tokens.title');
    const TOKEN_ROWS = [
      { token: '--background',         cls: 'bg-background',          partKey: 'background' },
      { token: '--foreground',         cls: 'text-foreground',         partKey: 'foreground' },
      { token: '--border',             cls: 'border-border',           partKey: 'border' },
      { token: '--primary',            cls: 'bg-primary',              partKey: 'primary' },
      { token: '--primary-foreground', cls: 'text-primary-foreground', partKey: 'primaryForeground' },
      { token: '--muted',              cls: 'bg-muted',                partKey: 'muted' },
      { token: '--muted-foreground',   cls: 'text-muted-foreground',   partKey: 'mutedForeground' },
      { token: '--destructive',        cls: 'bg-destructive',          partKey: 'destructive' },
      { token: '--radius',             cls: 'rounded-lg',              partKey: 'radius' },
    ];
    tokensContent.innerHTML = `
      <div class="border rounded-xl overflow-x-auto p-4 shadow-sm">
        <table class="w-full border-collapse text-sm" style="margin:0">
          <thead>
            <tr class="border-b border-border bg-muted/50 text-left">
              <th class="p-3 border-r border-border font-medium">${sanitizeHtml(t('tokens.table.token'))}</th>
              <th class="p-3 border-r border-border font-medium">${sanitizeHtml(t('tokens.table.class'))}</th>
              <th class="p-3 font-medium">${sanitizeHtml(t('tokens.table.part'))}</th>
            </tr>
          </thead>
          <tbody>
            ${TOKEN_ROWS.map(row => `
              <tr class="border-b last:border-0 hover:bg-muted/5 transition-colors">
                <td class="p-3 border-r border-border font-mono text-primary font-medium"><code>${row.token}</code></td>
                <td class="p-3 border-r border-border font-mono text-primary"><code>${row.cls}</code></td>
                <td class="p-3 text-muted-foreground">${sanitizeHtml(t(`tokens.table.${row.partKey}`))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="space-y-2">
        <h3 class="font-medium text-sm">${sanitizeHtml(t('tokens.customizationTitle'))}</h3>
        <div class="bg-muted p-4 rounded-lg font-mono text-xs border overflow-x-auto whitespace-pre leading-relaxed">/* Em globals.css ou theme-custom.css */
html.meu-tema {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --border: 214 32% 91%;
}
html.meu-tema.dark {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
  --border: 217 33% 18%;
}</div>
      </div>`;

    // Acessibilidade
    h2A11y.innerHTML = `<span>♿</span> ${sanitizeHtml(t('accessibility.title'))}`;
    a11yContent.innerHTML = `
      <div class="border rounded-xl p-6 shadow-sm space-y-6">
        <ul class="space-y-3 text-sm text-muted-foreground list-disc pl-5">
          ${[1, 2, 3, 4, 5].map(i => `<li>${sanitizeHtml(t(`accessibility.item${i}`))}</li>`).join('')}
        </ul>
        <div class="space-y-4">
          <h3 class="font-medium text-sm">${sanitizeHtml(t('accessibility.keyboardTitle'))}</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            ${['escape', 'tab', 'enter'].map(key => `
              <div class="bg-muted/30 border rounded-xl p-4">
                <code class="text-[10px] bg-muted px-2 py-0.5 rounded-md uppercase font-bold text-primary border border-border/60 block mb-2">${key}</code>
                <p class="text-xs text-muted-foreground leading-relaxed">${sanitizeHtml(t(`accessibility.keyboard.${key}`))}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </div>`;

    // Relacionados
    h2Related.textContent = t('related.title');
    relatedContent.innerHTML = `
      <div class="space-y-4">
        <h3 class="text-sm font-semibold text-muted-foreground">${sanitizeHtml(t('related.alternatives'))}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          ${[
            { name: 'AlertDialog', descKey: 'alertDialog', path: '?path=/docs/ui-alertdialog--docs' },
            { name: 'Alert',       descKey: 'alert',       path: '?path=/docs/ui-alert--docs' },
          ].map(item => `
            <div role="link" tabindex="0" onclick="(window.top||window).location.href='${item.path}'"
                 class="border rounded-xl p-4 bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer group">
              <h4 class="text-sm font-semibold mb-1 group-hover:text-primary transition-colors">${item.name}</h4>
              <p class="text-xs text-muted-foreground">${sanitizeHtml(t(`related.${item.descKey}`))}</p>
            </div>
          `).join('')}
        </div>
        <h3 class="text-sm font-semibold text-muted-foreground mt-6">${sanitizeHtml(t('related.usedWith'))}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          ${[
            { name: 'Form',   descKey: 'form',   path: '?path=/docs/ui-form--docs' },
            { name: 'Button', descKey: 'button', path: '?path=/docs/ui-button--docs' },
          ].map(item => `
            <div role="link" tabindex="0" onclick="(window.top||window).location.href='${item.path}'"
                 class="border rounded-xl p-4 bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer group">
              <h4 class="text-sm font-semibold mb-1 group-hover:text-primary transition-colors">${item.name}</h4>
              <p class="text-xs text-muted-foreground">${sanitizeHtml(t(`related.${item.descKey}`))}</p>
            </div>
          `).join('')}
        </div>
      </div>`;

    // Notas
    h2Notes.textContent = t('notes.title');
    notesContent.innerHTML = `
      <div class="space-y-4">
        <div class="p-4 bg-primary/5 border-l-4 border-primary rounded-r-lg">
          <p class="text-sm text-muted-foreground leading-relaxed">${sanitizeHtml(t('notes.tip1'))}</p>
        </div>
        <div class="p-4 bg-orange-500/5 border-l-4 border-orange-500 rounded-r-lg">
          <p class="text-sm text-muted-foreground leading-relaxed">${sanitizeHtml(t('notes.tip2'))}</p>
        </div>
        <div class="p-4 bg-red-500/5 border-l-4 border-red-500 rounded-r-lg">
          <p class="text-sm text-muted-foreground leading-relaxed">${sanitizeHtml(t('notes.tip3'))}</p>
        </div>
      </div>`;

    // Analytics
    h2Analytics.innerHTML = `<span>📊</span> ${sanitizeHtml(t('analytics.title'))}`;
    analyticsContent.innerHTML = `
      <div class="space-y-4">
        <p class="text-sm text-muted-foreground leading-relaxed">${sanitizeHtml(t('analytics.description'))}</p>
        <div class="border rounded-xl overflow-x-auto p-4 shadow-sm">
          <table class="w-full border-collapse text-sm" style="margin:0">
            <thead>
              <tr class="bg-muted/50 border-b text-left">
                <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(t('analytics.table.event'))}</th>
                <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(t('analytics.table.trigger'))}</th>
                <th class="p-3 font-semibold">${sanitizeHtml(t('analytics.table.payload'))}</th>
              </tr>
            </thead>
            <tbody>
              ${['pageView', 'sectionViewed', 'langSwitch', 'toastTriggered'].map(key => `
                <tr class="border-b last:border-0 hover:bg-muted/5">
                  <td class="p-3 border-r border-border font-mono text-primary font-bold">${sanitizeHtml(t(`analytics.table.${key}`))}</td>
                  <td class="p-3 border-r border-border">${sanitizeHtml(t(`analytics.table.${key}Trigger`))}</td>
                  <td class="p-3 font-mono text-muted-foreground">${sanitizeHtml(t(`analytics.table.${key}Payload`))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>`;

    // Testes
    h2Tests.innerHTML = `<span>🧪</span> ${sanitizeHtml(t('testes.title'))}`;
    testsContent.innerHTML = `
      <div>
        <h3 class="font-semibold text-sm mb-1">${sanitizeHtml(t('testes.functional.title'))}</h3>
        <p class="text-xs text-muted-foreground mb-4">${sanitizeHtml(t('testes.functional.description'))}</p>
        <div class="border rounded-xl overflow-x-auto p-4 shadow-sm">
          <table class="w-full border-collapse text-sm">
            <thead class="bg-muted/50 border-b text-left">
              <tr>
                <th class="p-4 border-r border-border font-semibold">${sanitizeHtml(tNav('common.userAction'))}</th>
                <th class="p-4 border-r border-border font-semibold">${sanitizeHtml(tNav('common.expectedResult'))}</th>
                <th class="p-4 font-semibold w-24">${sanitizeHtml(tNav('common.priority'))}</th>
              </tr>
            </thead>
            <tbody>
              ${[1, 2, 3, 4, 5, 6, 7, 8].map(i => {
                const p = t(`testes.functional.item${i}.priority`);
                const isHigh = p === 'high';
                const badgeClass = isHigh
                  ? 'bg-orange-500/10 text-orange-600 border-orange-500/20'
                  : 'bg-blue-500/10 text-blue-600 border-blue-500/20';
                const label = isHigh ? tNav('common.high') : tNav('common.medium');
                return `<tr class="border-b last:border-0 hover:bg-muted/5">
                  <td class="p-4 border-r border-border font-medium">${sanitizeHtml(t(`testes.functional.item${i}.action`))}</td>
                  <td class="p-4 border-r border-border text-muted-foreground">${sanitizeHtml(t(`testes.functional.item${i}.result`))}</td>
                  <td class="p-4"><span class="inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium h-5 ${badgeClass}">${sanitizeHtml(label)}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <h3 class="font-semibold text-sm mb-1">${sanitizeHtml(t('testes.accessibility.title'))}</h3>
        <p class="text-xs text-muted-foreground mb-4">${sanitizeHtml(t('testes.accessibility.description'))}</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${[1, 2, 3, 4, 5, 6].map(i => `
            <div class="flex gap-3 items-start p-4 bg-muted/10 rounded-lg border border-border/40">
              <div class="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span class="text-[10px] text-primary font-bold italic">axe</span>
              </div>
              <span class="text-xs text-muted-foreground leading-relaxed">${sanitizeHtml(t(`testes.accessibility.item${i}`))}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div>
        <h3 class="font-semibold text-sm mb-1">${sanitizeHtml(t('testes.visual.title'))}</h3>
        <p class="text-xs text-muted-foreground mb-4">${sanitizeHtml(t('testes.visual.description'))}</p>
        <div class="border rounded-xl overflow-x-auto p-4 shadow-sm">
          <table class="w-full border-collapse text-sm">
            <thead class="bg-muted/50 border-b text-left">
              <tr>
                <th class="p-4 border-r border-border font-semibold">${sanitizeHtml(tNav('common.storyState'))}</th>
                <th class="p-4 border-r border-border font-semibold text-center w-32">${sanitizeHtml(tNav('common.themeLight'))}</th>
                <th class="p-4 border-r border-border font-semibold text-center w-32">${sanitizeHtml(tNav('common.themeDark'))}</th>
                <th class="p-4 font-semibold w-24">${sanitizeHtml(tNav('common.priority'))}</th>
              </tr>
            </thead>
            <tbody>
              ${[1, 2, 3, 4, 5, 6, 7].map(i => {
                const p = t(`testes.visual.item${i}.priority`);
                const isHigh = p === 'high';
                const badgeClass = isHigh
                  ? 'bg-orange-500/10 text-orange-600 border-orange-500/20'
                  : 'bg-blue-500/10 text-blue-600 border-blue-500/20';
                const label = isHigh ? tNav('common.high') : tNav('common.medium');
                return `<tr class="border-b last:border-0 hover:bg-muted/5">
                  <td class="p-4 border-r border-border font-medium">${sanitizeHtml(t(`testes.visual.item${i}.story`))}</td>
                  <td class="p-4 border-r border-border text-center text-emerald-600 font-medium">${sanitizeHtml(t('testes.visual.required'))}</td>
                  <td class="p-4 border-r border-border text-center text-emerald-600 font-medium">${sanitizeHtml(t('testes.visual.required'))}</td>
                  <td class="p-4"><span class="inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium h-5 ${badgeClass}">${sanitizeHtml(label)}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  rerenderTexts();
  const unsubRender = subscribe(rerenderTexts);
  cleanups.push(unsubRender);

  // ── IntersectionObserver ───────────────────────────────────────────────────

  const sectionIds = [
    'demonstracao', 'anatomia', 'quando-usar', 'do-dont', 'importacao',
    'exemplos', 'variantes', 'estados', 'propriedades', 'tokens',
    'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
  ];

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          updateActiveNav(entry.target.id);
          track('docs_section_viewed', { component_name: 'sonner', section_id: entry.target.id, locale: getLocale() });
          break;
        }
      }
    },
    { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
  );

  requestAnimationFrame(() => {
    sectionIds.forEach(id => {
      const el = root.querySelector(`#${id}`);
      if (el) observer.observe(el);
    });
  });

  cleanups.push(() => observer.disconnect());

  // ── Cleanup on unmount ────────────────────────────────────────────────────

  const origRemove = root.remove.bind(root);
  root.remove = () => {
    cleanups.forEach(fn => fn());
    origRemove();
  };

  return root;
}
