import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { createAlert, createAlertTitle, createAlertDescription } from '@/components/ui/alert';
import uiTranslations from '@/i18n/ui.json';
import alertTranslations from '@shared/content/alert/translations.json';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);
const { t, subscribe } = createTranslation(alertTranslations as Record<string, unknown>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '');
}

function priorityLabel(raw: string): string {
  const keyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };
  return tNav(keyMap[raw] ?? 'common.high');
}

function priorityColor(raw: string): string {
  if (raw === 'high')   return 'text-destructive font-medium';
  if (raw === 'medium') return 'text-yellow-600 font-medium';
  return 'text-muted-foreground';
}

function infoSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
}

function errorSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
}

function successSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
}

function warningSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`;
}

function buildAlertHtml(variant: 'default' | 'destructive' | string, extraClass: string, svgFn: () => string, titleKey: string, descKey: string): string {
  const variantClass = variant === 'destructive' ? 'alert alert-destructive' : 'alert';
  const cls = [variantClass, extraClass].filter(Boolean).join(' ');
  return `<div role="alert" class="${cls}">${svgFn()}<h5 class="mb-1 font-medium leading-none tracking-tight">${sanitizeHtml(t(titleKey))}</h5><div class="text-sm">${sanitizeHtml(t(descKey))}</div></div>`;
}

// ─── createAlertDocs ──────────────────────────────────────────────────────────

export function createAlertDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  const root = document.createElement('div');
  root.className = 'ds-docs p-8 max-w-5xl mx-auto';

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'alert',
    });
    track('docs_page_view', { component_name: 'alert', locale, page_title: `${t('title')} · Design System` });
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
  installBadge.innerHTML = `<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono border border-border/50">shadcn/ui</code>`;

  header.append(topRow, h1, desc, installBadge);

  // ── Layout ───────────────────────────────────────────────────────────────

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

  // ── Sections ──────────────────────────────────────────────────────────────

  const secDemo      = createSection('demonstracao');
  const secAnatomia  = createSection('anatomia');
  const secWhen      = createSection('quando-usar');
  const secDoDont    = createSection('do-dont');
  const secImport    = createSection('importacao');
  const secExamples  = createSection('exemplos');
  const secVariants  = createSection('variantes');
  const secStates    = createSection('estados');
  const secProps     = createSection('propriedades');
  const secTokens    = createSection('tokens');
  const secA11y      = createSection('acessibilidade');
  const secRelated   = createSection('relacionados');
  const secNotes     = createSection('notas');
  const secAnalytics = createSection('analytics');
  const secTestes    = createSection('testes');

  main.append(
    secDemo.el, secAnatomia.el, secWhen.el, secDoDont.el,
    secImport.el, secExamples.el, secVariants.el, secStates.el, secProps.el, secTokens.el,
    secA11y.el, secRelated.el, secNotes.el, secAnalytics.el, secTestes.el,
  );

  // ── IntersectionObserver ─────────────────────────────────────────────────

  const allIds = NAV_GROUPS().flatMap(g => g.sections.map(s => s.id));
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        updateActiveNav(id);
        track('docs_section_viewed', { section_id: id, component_name: 'alert', locale: getLocale() });
        break;
      }
    }
  }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

  Promise.resolve().then(() => {
    allIds.forEach(id => {
      const el = root.querySelector(`#${id}`);
      if (el) observer.observe(el as HTMLElement);
    });
  });
  cleanups.push(() => observer.disconnect());

  // ── Update function ───────────────────────────────────────────────────────

  function update() {
    // Header
    badgeCategory.textContent = t('category');
    badgeType.textContent     = t('type');
    h1.textContent            = t('title');
    desc.textContent          = t('description');
    updateLangButtons();
    buildSidebar();

    // Demonstração
    secDemo.h2.textContent = t('demonstration.title');
    secDemo.content.innerHTML = `
      <div class="flex items-center justify-center p-10 mt-6 border rounded-xl bg-background shadow-sm">
        <div class="space-y-3 w-full max-w-lg">
          ${buildAlertHtml('default', '', infoSvg, 'demonstration.labels.infoTitle', 'demonstration.labels.infoDesc')}
          ${buildAlertHtml('destructive', '', errorSvg, 'demonstration.labels.errorTitle', 'demonstration.labels.errorDesc')}
        </div>
      </div>`;

    // Anatomia
    secAnatomia.h2.textContent = t('anatomy.title');
    secAnatomia.content.innerHTML = `
      <ol class="space-y-2 mb-6 list-none p-0 m-0">
        ${[1,2,3,4].map(i => `
          <li class="flex gap-3 items-start list-none">
            <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">${i}</span>
            <span class="text-sm text-muted-foreground leading-relaxed">${sanitizeHtml(t(`anatomy.item${i}`))}</span>
          </li>`).join('')}
      </ol>
      <div class="rounded-lg bg-muted/50 border border-border/40 px-4 pt-3 pb-4 overflow-x-auto">
        <p class="text-xs text-muted-foreground mb-2">${sanitizeHtml(t('anatomy.structureLabel'))}</p>
        <pre class="text-xs font-mono leading-relaxed">${sanitizeHtml(t('anatomy.structureCode'))}</pre>
      </div>`;

    // Quando usar
    secWhen.h2.textContent = t('usage.title');
    secWhen.content.innerHTML = `
      <div class="border rounded-xl p-6 shadow-sm space-y-6">
        <div class="bg-muted/30 rounded-lg p-4 space-y-3">
          <h3 class="font-medium text-sm">${sanitizeHtml(t('usage.guidelines.title'))}</h3>
          <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            ${[1,2,3,4].map(i => `<li>${sanitizeHtml(t(`usage.guidelines.item${i}`))}</li>`).join('')}
          </ul>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-sm">
            <thead><tr class="border-b border-border text-left bg-muted/50 font-medium">
              <th class="p-3 border-r border-border">${sanitizeHtml(t('usage.scenarios.cols.scenario'))}</th>
              <th class="p-3 border-r border-border">${sanitizeHtml(t('usage.scenarios.cols.use'))}</th>
              <th class="p-3">${sanitizeHtml(t('usage.scenarios.cols.alternative'))}</th>
            </tr></thead>
            <tbody>${[1,2,3,4].map(i => `<tr class="border-b border-border hover:bg-muted/5">
              <td class="p-3 border-r border-border">${sanitizeHtml(t(`usage.scenarios.item${i}.s`))}</td>
              <td class="p-3 border-r border-border font-medium text-primary">${sanitizeHtml(t(`usage.scenarios.item${i}.u`))}</td>
              <td class="p-3 text-muted-foreground">${sanitizeHtml(t(`usage.scenarios.item${i}.a`))}</td>
            </tr>`).join('')}</tbody>
          </table>
        </div>
        <div class="space-y-3">
          <h3 class="font-medium text-sm">${sanitizeHtml(t('usage.uxWriting.title'))}</h3>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-sm">
              <thead><tr class="border-b border-border bg-muted/70 text-left">
                <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(t('usage.uxWriting.table.element'))}</th>
                <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(t('usage.uxWriting.table.rules'))}</th>
                <th class="p-3 border-r border-border font-semibold text-green-700">${sanitizeHtml(t('usage.uxWriting.table.correct'))}</th>
                <th class="p-3 font-semibold text-red-700">${sanitizeHtml(t('usage.uxWriting.table.avoid'))}</th>
              </tr></thead>
              <tbody>${['title', 'description', 'error', 'warning'].map(key => `<tr class="border-b border-border last:border-0">
                <td class="p-3 border-r border-border font-medium">${sanitizeHtml(t(`usage.uxWriting.table.${key}.name`))}</td>
                <td class="p-3 border-r border-border text-muted-foreground">${sanitizeHtml(t(`usage.uxWriting.table.${key}.format`))}</td>
                <td class="p-3 border-r border-border text-green-600">${sanitizeHtml(t(`usage.uxWriting.table.${key}.good`))}</td>
                <td class="p-3 text-red-600">${sanitizeHtml(t(`usage.uxWriting.table.${key}.bad`))}</td>
              </tr>`).join('')}</tbody>
            </table>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-card border border-emerald-200 rounded-xl p-4 shadow-sm">
            <h3 class="font-medium text-sm text-emerald-700 mb-2">${sanitizeHtml(t('usage.do.title'))}</h3>
            <ul class="space-y-2 list-none p-0 m-0">
              ${[1,2,3,4].map(i => `<li class="flex gap-2 items-start text-sm text-muted-foreground list-none"><span class="text-emerald-600 font-bold">✓</span>${sanitizeHtml(t(`usage.do.item${i}`))}</li>`).join('')}
            </ul>
          </div>
          <div class="bg-card border border-red-200 rounded-xl p-4 shadow-sm">
            <h3 class="font-medium text-sm text-red-700 mb-2">${sanitizeHtml(t('usage.dont.title'))}</h3>
            <ul class="space-y-2 list-none p-0 m-0">
              ${[1,2,3].map(i => `<li class="flex gap-2 items-start text-sm text-muted-foreground list-none"><span class="text-destructive font-bold">✗</span>${sanitizeHtml(t(`usage.dont.item${i}`))}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>`;

    // Do & Don't
    secDoDont.h2.textContent = t('doDont.title');
    secDoDont.content.innerHTML = `
      <div class="flex items-center justify-center p-10 mt-6 border rounded-xl bg-background shadow-sm">
        <div class="space-y-8 w-full">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-green-600">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-xs font-bold flex-shrink-0">✓</span>
                <span class="text-sm font-semibold uppercase tracking-wider">${sanitizeHtml(tNav('common.do'))}</span>
              </div>
              <div class="border border-green-200 rounded-xl p-6 bg-green-50/50">
                ${buildAlertHtml('default', '', infoSvg, 'demonstration.labels.infoTitle', 'demonstration.labels.infoDesc')}
              </div>
              <p class="text-sm text-muted-foreground italic px-1">${sanitizeHtml(t('doDont.pair1.do'))}</p>
            </div>
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-red-600">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-xs font-bold flex-shrink-0">✗</span>
                <span class="text-sm font-semibold uppercase tracking-wider">${sanitizeHtml(tNav('common.dont'))}</span>
              </div>
              <div class="border border-red-200 rounded-xl p-6 bg-red-50/50">
                ${buildAlertHtml('destructive', '', infoSvg, 'demonstration.labels.infoTitle', 'demonstration.labels.infoDesc')}
              </div>
              <p class="text-sm text-muted-foreground italic px-1">${sanitizeHtml(t('doDont.pair1.dont'))}</p>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-green-600">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-xs font-bold flex-shrink-0">✓</span>
                <span class="text-sm font-semibold uppercase tracking-wider">${sanitizeHtml(tNav('common.do'))}</span>
              </div>
              <div class="border border-green-200 rounded-xl p-6 bg-green-50/50">
                ${buildAlertHtml('default', 'bg-success/10 text-success border-success/30', successSvg, 'demonstration.labels.successTitle', 'demonstration.labels.successDesc')}
              </div>
              <p class="text-sm text-muted-foreground italic px-1">${sanitizeHtml(t('doDont.pair2.do'))}</p>
            </div>
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-red-600">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-xs font-bold flex-shrink-0">✗</span>
                <span class="text-sm font-semibold uppercase tracking-wider">${sanitizeHtml(tNav('common.dont'))}</span>
              </div>
              <div class="border border-red-200 rounded-xl p-6 bg-red-50/50">
                ${buildAlertHtml('default', 'bg-green-100 text-green-900 border-green-300', infoSvg, 'demonstration.labels.successTitle', 'demonstration.labels.successDesc')}
              </div>
              <p class="text-sm text-muted-foreground italic px-1">${sanitizeHtml(t('doDont.pair2.dont'))}</p>
            </div>
          </div>
        </div>
      </div>`;

    // Importação
    secImport.h2.textContent = t('import.title');
    secImport.content.innerHTML = `
      <p class="text-sm text-muted-foreground mb-3">${sanitizeHtml(t('import.basic'))}</p>
      <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto mb-4">
        <code class="whitespace-pre">import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';</code>
      </div>
      <p class="text-sm text-muted-foreground mb-3">${sanitizeHtml(t('import.withIcon'))}</p>
      <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
        <code class="whitespace-pre">import { createIcons, Info } from 'lucide';</code>
      </div>`;

    // Exemplos
    secExamples.h2.textContent = t('examples.title');
    const examplesData = [
      { key: 'default',      fn: () => buildAlertHtml('default', '', infoSvg, 'demonstration.labels.infoTitle', 'demonstration.labels.infoDesc') },
      { key: 'destructive',  fn: () => buildAlertHtml('destructive', '', errorSvg, 'demonstration.labels.errorTitle', 'demonstration.labels.errorDesc') },
      { key: 'success',      fn: () => buildAlertHtml('default', 'bg-success/10 text-success border-success/30', successSvg, 'demonstration.labels.successTitle', 'demonstration.labels.successDesc') },
      { key: 'warning',      fn: () => buildAlertHtml('default', 'bg-warning/10 text-warning border-warning/30', warningSvg, 'demonstration.labels.warningTitle', 'demonstration.labels.warningDesc') },
      { key: 'withoutTitle', fn: () => `<div role="alert" class="alert">${infoSvg()}<div class="text-sm">${sanitizeHtml(t('demonstration.labels.infoDesc'))}</div></div>` },
    ] as const;
    secExamples.content.innerHTML = `<div class="space-y-6">
      ${examplesData.map(({ key, fn }) => `
        <div>
          <h3 class="font-medium text-sm mb-2">${sanitizeHtml(t(`examples.${key}`))}</h3>
          <div class="rounded-lg border border-border">
            <div class="flex items-center justify-center p-8 border-b border-border bg-muted/5">
              <div class="w-full max-w-md">${fn()}</div>
            </div>
          </div>
        </div>`).join('')}
    </div>`;

    // Variantes
    secVariants.h2.textContent = t('variants.title');
    const variantData = [
      { key: 'default',     fn: () => buildAlertHtml('default', '', infoSvg, 'demonstration.labels.infoTitle', 'demonstration.labels.infoDesc') },
      { key: 'destructive', fn: () => buildAlertHtml('destructive', '', errorSvg, 'demonstration.labels.errorTitle', 'demonstration.labels.errorDesc') },
      { key: 'success',     fn: () => buildAlertHtml('default', 'bg-success/10 text-success border-success/30', successSvg, 'demonstration.labels.successTitle', 'demonstration.labels.successDesc') },
      { key: 'warning',     fn: () => buildAlertHtml('default', 'bg-warning/10 text-warning border-warning/30', warningSvg, 'demonstration.labels.warningTitle', 'demonstration.labels.warningDesc') },
    ] as const;
    secVariants.content.innerHTML = `
      <p class="text-sm text-muted-foreground mb-4">${sanitizeHtml(t('variants.visualTitle'))}</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        ${variantData.map(({ key, fn }) => `
          <div class="rounded-xl border border-border p-4 space-y-3 shadow-sm">
            <div class="p-4 bg-muted/20 rounded-lg">${fn()}</div>
            <p class="font-medium text-sm font-mono">${key}</p>
            <p class="text-xs text-muted-foreground">${sanitizeHtml(t(`variants.items.${key}`))}</p>
          </div>`).join('')}
      </div>
      <p class="text-xs text-muted-foreground mt-4 bg-muted/30 rounded-lg p-3">${sanitizeHtml(t('variants.note'))}</p>`;

    // Estados
    secStates.h2.textContent = t('states.title');
    const stateKeys = ['complete', 'withoutTitle', 'withoutIcon', 'dynamicInsert'] as const;
    secStates.content.innerHTML = `
      <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-border bg-muted/50 text-left">
            <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(t('states.cols.state'))}</th>
            <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(t('states.cols.trigger'))}</th>
            <th class="p-3 font-semibold">${sanitizeHtml(t('states.cols.behavior'))}</th>
          </tr></thead>
          <tbody>${stateKeys.map(key => `<tr class="border-b border-border last:border-0 hover:bg-muted/5">
            <td class="p-3 border-r border-border font-medium">${sanitizeHtml(t(`states.${key}.label`))}</td>
            <td class="p-3 border-r border-border text-muted-foreground">${stripHtml(t(`states.${key}.trigger`))}</td>
            <td class="p-3 text-muted-foreground">${stripHtml(t(`states.${key}.behavior`))}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>`;

    // Propriedades
    secProps.h2.textContent = t('props.title');
    const propRows = [
      { name: 'variant',  type: '"default" | "destructive"', def: '"default"', req: 'Não', key: 'variant'   },
      { name: 'class',    type: 'string',                    def: '—',         req: 'Não', key: 'className'  },
      { name: 'children', type: 'HTMLElement | string',      def: '—',         req: 'Não', key: 'children'   },
    ];
    secProps.content.innerHTML = `
      <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto mb-4">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-border bg-muted/50 text-left">
            <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(t('props.table.prop'))}</th>
            <th class="p-3 border-r border-border font-semibold">Tipo</th>
            <th class="p-3 border-r border-border font-semibold">Padrão</th>
            <th class="p-3 border-r border-border font-semibold">Obrig.</th>
            <th class="p-3 font-semibold">Descrição</th>
          </tr></thead>
          <tbody>${propRows.map(row => `<tr class="border-b border-border last:border-0">
            <td class="p-3 border-r border-border font-mono font-bold text-primary text-xs">${row.name}</td>
            <td class="p-3 border-r border-border font-mono text-muted-foreground text-xs">${row.type}</td>
            <td class="p-3 border-r border-border font-mono text-xs">${row.def}</td>
            <td class="p-3 border-r border-border text-xs">${row.req}</td>
            <td class="p-3 text-xs text-muted-foreground">${sanitizeHtml(t(`props.table.${row.key}`))}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
      <div class="bg-muted p-4 rounded-lg font-mono text-xs border overflow-x-auto mb-4">
        <code class="whitespace-pre">${sanitizeHtml(t('props.interface'))}</code>
      </div>
      <div class="bg-muted/30 rounded-lg p-4 text-sm">
        <p class="font-medium mb-1">${sanitizeHtml(t('props.extensibilityTitle'))}</p>
        <p class="text-muted-foreground">${sanitizeHtml(t('props.extensibility'))}</p>
      </div>`;

    // Tokens
    secTokens.h2.textContent = t('tokens.title');
    const tokenRows = [
      { token: '--background',  key: 'background'       },
      { token: '--foreground',  key: 'foreground'        },
      { token: '--border',      key: 'border'            },
      { token: '--destructive', key: 'destructiveBorder' },
      { token: '--success',     key: 'success'           },
      { token: '--warning',     key: 'warning'           },
      { token: '--radius',      key: 'radius'            },
    ];
    secTokens.content.innerHTML = `
      <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto mb-4">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-border bg-muted/50 text-left">
            <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(t('tokens.table.token'))}</th>
            <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(t('tokens.table.class'))}</th>
            <th class="p-3 font-semibold">${sanitizeHtml(t('tokens.table.part'))}</th>
          </tr></thead>
          <tbody>${tokenRows.map(row => `<tr class="border-b border-border last:border-0">
            <td class="p-3 border-r border-border font-mono text-primary text-xs">${row.token}</td>
            <td class="p-3 border-r border-border font-mono text-muted-foreground text-xs">${row.token}</td>
            <td class="p-3 text-xs text-muted-foreground">${sanitizeHtml(t(`tokens.table.${row.key}`))}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
      <p class="text-sm font-medium mb-2">${sanitizeHtml(t('tokens.customizationTitle'))}</p>
      <div class="bg-muted p-4 rounded-lg font-mono text-xs border overflow-x-auto">
        <code class="whitespace-pre">.dark [data-slot="alert"] {\n  /* override tokens per theme */\n}</code>
      </div>`;

    // Acessibilidade
    secA11y.h2.textContent = t('accessibility.title');
    const kbdKeys = ['tab', 'enter', 'noKeyboard'] as const;
    const ariaKeys = ['role', 'ariaLive', 'ariaLiveAssertive', 'ariaHidden'] as const;
    secA11y.content.innerHTML = `
      <p class="text-sm text-muted-foreground mb-4">${sanitizeHtml(t('accessibility.summary'))}</p>
      <ul class="space-y-2 list-none p-0 m-0 mb-6">
        ${[1,2,3,4,5].map(i => `<li class="flex gap-2 items-start text-sm list-none"><span class="text-primary mt-0.5">•</span>${sanitizeHtml(t(`accessibility.item${i}`))}</li>`).join('')}
      </ul>
      <h3 class="font-medium text-sm mb-3">${sanitizeHtml(t('accessibility.keyboardTitle'))}</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        ${kbdKeys.map(key => `<div class="flex gap-3 items-start rounded-lg border border-border p-3">
          <kbd class="bg-muted border border-border rounded px-1.5 py-0.5 text-xs font-mono shrink-0">${key === 'noKeyboard' ? '—' : key.charAt(0).toUpperCase() + key.slice(1)}</kbd>
          <p class="text-xs text-muted-foreground">${sanitizeHtml(t(`accessibility.keyboard.${key}`))}</p>
        </div>`).join('')}
      </div>
      <h3 class="font-medium text-sm mb-3">ARIA</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        ${ariaKeys.map(key => `<div class="flex gap-3 items-start rounded-lg border border-border p-3">
          <code class="bg-muted border border-border rounded px-1.5 py-0.5 text-xs font-mono shrink-0 text-primary">${key}</code>
          <p class="text-xs text-muted-foreground">${sanitizeHtml(t(`accessibility.aria.${key}`))}</p>
        </div>`).join('')}
      </div>`;

    // Relacionados
    secRelated.h2.textContent = t('related.title');
    const relatedItems = [
      { name: 'Sonner',      key: 'sonner',      path: '?path=/docs/ui-sonner--docs'      },
      { name: 'AlertDialog', key: 'alertDialog', path: '?path=/docs/ui-alertdialog--docs' },
      { name: 'Badge',       key: 'badge',       path: '?path=/docs/ui-badge--docs'       },
      { name: 'Progress',    key: 'progress',    path: '?path=/docs/ui-progress--docs'    },
    ];
    secRelated.content.innerHTML = `<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      ${relatedItems.map(item => `
        <button type="button" data-path="${item.path}" class="text-left rounded-xl border border-border p-4 hover:border-primary/50 hover:bg-muted/30 transition-colors group">
          <p class="font-semibold text-sm group-hover:text-primary transition-colors">${item.name}</p>
          <p class="text-xs text-muted-foreground mt-0.5">${sanitizeHtml(t(`related.${item.key}`))}</p>
        </button>`).join('')}
    </div>`;
    secRelated.content.querySelectorAll('button[data-path]').forEach(btn => {
      btn.addEventListener('click', () => {
        const path = (btn as HTMLElement).dataset.path ?? '';
        (window.top ?? window).location.href = path;
      });
    });

    // Notas
    secNotes.h2.textContent = t('notes.title');
    secNotes.content.innerHTML = `<div class="space-y-3">
      ${[1,2,3].map(i => `<div class="bg-muted/30 rounded-lg border-l-4 border-primary/40 p-4">
        <p class="text-sm text-muted-foreground">${sanitizeHtml(t(`notes.tip${i}`))}</p>
      </div>`).join('')}
    </div>`;

    // Analytics
    secAnalytics.h2.textContent = t('analytics.title');
    const analyticsKeys = ['pageView', 'sectionViewed', 'langSwitch', 'dismiss'] as const;
    secAnalytics.content.innerHTML = `
      <p class="text-sm text-muted-foreground mb-4">${sanitizeHtml(t('analytics.description'))}</p>
      <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-border bg-muted/50 text-left">
            <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(t('analytics.table.event'))}</th>
            <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(t('analytics.table.trigger'))}</th>
            <th class="p-3 font-semibold">${sanitizeHtml(t('analytics.table.payload'))}</th>
          </tr></thead>
          <tbody>${analyticsKeys.map(key => `<tr class="border-b border-border last:border-0">
            <td class="p-3 border-r border-border font-mono text-primary text-xs">${sanitizeHtml(t(`analytics.table.${key}`))}</td>
            <td class="p-3 border-r border-border text-xs text-muted-foreground">${sanitizeHtml(t(`analytics.table.${key}Trigger`))}</td>
            <td class="p-3 font-mono text-xs text-muted-foreground">${sanitizeHtml(t(`analytics.table.${key}Payload`))}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>`;

    // Testes
    secTestes.h2.textContent = t('testes.title');
    secTestes.content.innerHTML = `
      <h3 class="text-base font-medium mb-3">${sanitizeHtml(t('testes.functional.title'))}</h3>
      <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto mb-6">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-border">
            <th class="text-left p-3 text-muted-foreground font-medium">${sanitizeHtml(tNav('common.userAction'))}</th>
            <th class="text-left p-3 text-muted-foreground font-medium">${sanitizeHtml(tNav('common.expectedResult'))}</th>
            <th class="text-left p-3 text-muted-foreground font-medium">${sanitizeHtml(tNav('common.priority'))}</th>
          </tr></thead>
          <tbody>${[1,2,3,4,5,6].map(i => `<tr class="border-b border-border/50 last:border-0">
            <td class="p-3 text-xs">${sanitizeHtml(t(`testes.functional.item${i}.action`))}</td>
            <td class="p-3 text-xs text-muted-foreground">${sanitizeHtml(t(`testes.functional.item${i}.result`))}</td>
            <td class="p-3 text-xs ${priorityColor(t(`testes.functional.item${i}.priority`))}">${priorityLabel(t(`testes.functional.item${i}.priority`))}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
      <h3 class="text-base font-medium mb-3">${sanitizeHtml(t('testes.accessibility.title'))}</h3>
      <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto mb-6">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-border">
            <th class="text-left p-3 text-muted-foreground font-medium">${getLocale() === 'en' ? 'Criterion' : getLocale() === 'es' ? 'Criterio' : 'Critério'}</th>
            <th class="text-left p-3 text-muted-foreground font-medium">WCAG</th>
            <th class="text-left p-3 text-muted-foreground font-medium">${getLocale() === 'en' ? 'How to verify' : getLocale() === 'es' ? 'Cómo verificar' : 'Como verificar'}</th>
          </tr></thead>
          <tbody>${[1,2,3,4].map(i => `<tr class="border-b border-border/50 last:border-0">
            <td class="p-3 text-xs">${sanitizeHtml(t(`testes.accessibility.item${i}.criterion`))}</td>
            <td class="p-3">
              <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700">${sanitizeHtml(t(`testes.accessibility.item${i}.level`))}</span>
            </td>
            <td class="p-3 text-xs text-muted-foreground">${sanitizeHtml(t(`testes.accessibility.item${i}.how`))}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
      <h3 class="text-base font-medium mb-3">${sanitizeHtml(t('testes.visual.title'))}</h3>
      <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-border">
            <th class="text-left p-3 text-muted-foreground font-medium">${sanitizeHtml(tNav('common.storyState'))}</th>
            <th class="text-left p-3 text-muted-foreground font-medium">${sanitizeHtml(tNav('common.priority'))}</th>
          </tr></thead>
          <tbody>${[1,2,3,4].map(i => `<tr class="border-b border-border/50 last:border-0">
            <td class="p-3 text-xs">${sanitizeHtml(t(`testes.visual.item${i}.story`))}</td>
            <td class="p-3 text-xs ${priorityColor(t(`testes.visual.item${i}.priority`))}">${priorityLabel(t(`testes.visual.item${i}.priority`))}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>`;
  }

  update();

  const unsubUpdate = subscribe(update);
  cleanups.push(unsubUpdate);
  cleanups.push(onLocaleChange(() => { buildSidebar(); update(); }));

  root.append(header, layout);

  // cleanup on disconnect
  const mo = new MutationObserver(() => {
    if (!document.body.contains(root)) {
      cleanups.forEach(fn => fn());
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return root;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createSection(id: string): { el: HTMLElement; h2: HTMLHeadingElement; content: HTMLElement } {
  const el = document.createElement('section');
  el.id = id;
  const h2 = document.createElement('h2');
  h2.className = 'text-xl font-semibold mb-4';
  const content = document.createElement('div');
  el.append(h2, content);
  return { el, h2, content };
}
