import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { createButton } from '@/components/ui/button';
import { createAlertDialog } from '@/components/ui/alert-dialog';
import uiTranslations from '@/i18n/ui.json';
import alertDialogTranslations from '@shared/content/alert-dialog/translations.json';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);
const { t, subscribe } = createTranslation(alertDialogTranslations as Record<string, unknown>);

// ─── createAlertDialogDocs ────────────────────────────────────────────────────

export function createAlertDialogDocs(): HTMLElement {
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
      componentSlug: 'alert-dialog',
    });
    track('docs_page_view', { component_name: 'alert-dialog', locale, page_title: `${t('title')} · Design System` });
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

  header.append(topRow, h1, desc);

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

  const secDemo     = createSection('demonstracao');
  const secAnatomia = createSection('anatomia');
  const secWhen     = createSection('quando-usar');
  const secDoDont   = createSection('do-dont');
  const secImport   = createSection('importacao');
  const secExamples = createSection('exemplos');
  const secVariants = createSection('variantes');
  const secStates   = createSection('estados');
  const secProps    = createSection('propriedades');
  const secTokens   = createSection('tokens');
  const secA11y     = createSection('acessibilidade');
  const secRelated  = createSection('relacionados');
  const secNotes    = createSection('notas');
  const secAnalytics = createSection('analytics');
  const secTestes   = createSection('testes');

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
        track('docs_section_viewed', { section_id: id, component_name: 'alert-dialog', locale: getLocale() });
        break;
      }
    }
  }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

  // Observe after mount via microtask
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
    secDemo.content.innerHTML = '';
    const demoRow = document.createElement('div');
    demoRow.className = 'rounded-lg border border-border p-6 bg-card/30';
    const demoFlex = document.createElement('div');
    demoFlex.className = 'flex flex-wrap gap-4 justify-center';

    const trigger1 = createButton({ label: t('demonstration.labels.trigger'), variant: 'destructive' });
    const cancel1  = createButton({ label: t('demonstration.labels.cancel') });
    const action1  = createButton({ label: t('demonstration.labels.confirm'), variant: 'destructive' });
    demoFlex.appendChild(createAlertDialog({ trigger: trigger1, title: t('demonstration.labels.title'), description: t('demonstration.labels.description'), cancelButton: cancel1, actionButton: action1 }));

    const trigger2 = createButton({ label: t('demonstration.labels.triggerNeutral') });
    const cancel2  = createButton({ label: t('demonstration.labels.cancel') });
    const action2  = createButton({ label: t('demonstration.labels.confirmNeutral') });
    demoFlex.appendChild(createAlertDialog({ trigger: trigger2, title: t('demonstration.labels.titleNeutral'), description: t('demonstration.labels.descriptionNeutral'), cancelButton: cancel2, actionButton: action2 }));

    demoRow.appendChild(demoFlex);
    secDemo.content.appendChild(demoRow);

    // Anatomia
    secAnatomia.h2.textContent = t('anatomy.title');
    secAnatomia.content.innerHTML = `
      <ol class="space-y-2 mb-6 list-none p-0 m-0">
        ${[1,2,3,4,5,6,7,8,9].map(i => `
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
            <tbody>${[1,2,3,4,5].map(i => `<tr class="border-b border-border hover:bg-muted/5">
              <td class="p-3 border-r border-border">${sanitizeHtml(t(`usage.scenarios.item${i}.s`))}</td>
              <td class="p-3 border-r border-border font-medium text-primary">${sanitizeHtml(t(`usage.scenarios.item${i}.u`))}</td>
              <td class="p-3 text-muted-foreground">${sanitizeHtml(t(`usage.scenarios.item${i}.a`))}</td>
            </tr>`).join('')}</tbody>
          </table>
        </div>
        <div class="space-y-3">
          <h3 class="font-medium text-sm">${sanitizeHtml(t('uxWriting.title'))}</h3>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-sm">
              <thead><tr class="border-b border-border bg-muted/70 text-left">
                <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(t('uxWriting.table.element'))}</th>
                <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(t('uxWriting.table.rules'))}</th>
                <th class="p-3 border-r border-border font-semibold text-green-700 dark:text-green-400">${sanitizeHtml(t('uxWriting.table.correct'))}</th>
                <th class="p-3 font-semibold text-red-700 dark:text-red-400">${sanitizeHtml(t('uxWriting.table.avoid'))}</th>
              </tr></thead>
              <tbody>${['title', 'description', 'action'].map(key => `<tr class="border-b border-border last:border-0">
                <td class="p-3 border-r border-border font-medium">${sanitizeHtml(t(`uxWriting.table.${key}.name`))}</td>
                <td class="p-3 border-r border-border text-muted-foreground">${sanitizeHtml(t(`uxWriting.table.${key}.format`))}</td>
                <td class="p-3 border-r border-border text-green-600 dark:text-green-500">${sanitizeHtml(t(`uxWriting.table.${key}.good`))}</td>
                <td class="p-3 text-red-600 dark:text-red-500">${sanitizeHtml(t(`uxWriting.table.${key}.bad`))}</td>
              </tr>`).join('')}</tbody>
            </table>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-card border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 shadow-sm">
            <h3 class="font-medium text-sm text-emerald-700 dark:text-emerald-400 mb-2">${sanitizeHtml(t('usage.do.title'))}</h3>
            <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
              ${[1,2,3].map(i => `<li>${sanitizeHtml(t(`usage.do.item${i}`))}</li>`).join('')}
            </ul>
          </div>
          <div class="bg-card border border-red-200 dark:border-red-800 rounded-xl p-4 shadow-sm">
            <h3 class="font-medium text-sm text-red-700 dark:text-red-400 mb-2">${sanitizeHtml(t('usage.dont.title'))}</h3>
            <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
              ${[1,2,3].map(i => `<li>${sanitizeHtml(t(`usage.dont.item${i}`))}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>`;

    // Do/Don't
    secDoDont.h2.textContent = t('doDont.title');

    const cancelLbl = t('demonstration.labels.cancel');
    const confirmLbl = t('demonstration.labels.confirm');
    const demoTitle = t('demonstration.labels.title');
    const demoDesc  = t('demonstration.labels.description');

    const pairRow = (
      doLabel: string, dontLabel: string,
      doBox: string, dontBox: string,
      doText: string, dontText: string
    ) => `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-3">
          <div class="flex items-center gap-2 text-green-600">
            <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 text-xs font-bold flex-shrink-0">✓</span>
            <span class="text-sm font-semibold uppercase tracking-wider">${sanitizeHtml(doLabel)}</span>
          </div>
          <div class="border border-green-200 rounded-xl p-6 bg-green-50/50">${doBox}</div>
          <p class="text-sm text-muted-foreground italic px-1">${sanitizeHtml(doText)}</p>
        </div>
        <div class="space-y-3">
          <div class="flex items-center gap-2 text-red-600">
            <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 text-xs font-bold flex-shrink-0">✗</span>
            <span class="text-sm font-semibold uppercase tracking-wider">${sanitizeHtml(dontLabel)}</span>
          </div>
          <div class="border border-red-200 rounded-xl p-6 bg-red-50/50">${dontBox}</div>
          <p class="text-sm text-muted-foreground italic px-1">${sanitizeHtml(dontText)}</p>
        </div>
      </div>`;

    const doLbl   = tNav('common.do');
    const dontLbl = tNav('common.dont');

    secDoDont.content.innerHTML = `
      <div class="flex items-center justify-center p-10 mt-6 border rounded-xl bg-background shadow-sm">
      <div class="space-y-8 w-full">
        ${pairRow(
          doLbl, dontLbl,
          `<div class="flex gap-2 justify-end">
            <button class="inline-flex items-center justify-center h-8 px-3 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent">${sanitizeHtml(cancelLbl)}</button>
            <button class="inline-flex items-center justify-center h-8 px-3 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90">${sanitizeHtml(confirmLbl)}</button>
          </div>`,
          `<div class="flex gap-2 justify-end">
            <button class="inline-flex items-center justify-center h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">OK</button>
          </div>`,
          t('doDont.pair1.do'),
          t('doDont.pair1.dont')
        )}
        ${pairRow(
          doLbl, dontLbl,
          `<div class="space-y-1">
            <p class="text-sm font-semibold">${sanitizeHtml(demoTitle)}</p>
            <p class="text-xs text-muted-foreground">${sanitizeHtml(demoDesc)}</p>
          </div>`,
          `<div class="space-y-1">
            <p class="text-sm font-semibold">Tem certeza?</p>
            <p class="text-xs text-muted-foreground">Isso vai apagar TUDO!</p>
          </div>`,
          t('doDont.pair2.do'),
          t('doDont.pair2.dont')
        )}
      </div>
      </div>`;

    // Importação
    secImport.h2.textContent = t('import.title');
    secImport.content.innerHTML = `
      <p class="text-sm text-muted-foreground mb-3">${sanitizeHtml(t('import.basic'))}</p>
      <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
        <code class="whitespace-pre">import { createAlertDialog } from '@/components/ui/alert-dialog';</code>
      </div>`;

    // Exemplos
    secExamples.h2.textContent = t('examples.title');
    secExamples.content.innerHTML = '';
    const exDiv = document.createElement('div');
    exDiv.className = 'space-y-8';

    const ex1Title = document.createElement('h3');
    ex1Title.className = 'text-base font-medium mb-3';
    ex1Title.textContent = t('examples.basic');
    const ex1Demo = document.createElement('div');
    ex1Demo.className = 'flex justify-center p-6 border rounded-t-lg bg-muted/20';
    const t1 = createButton({ label: t('demonstration.labels.triggerDestructive'), variant: 'destructive' });
    const c1 = createButton({ label: t('demonstration.labels.cancel') });
    const a1 = createButton({ label: t('demonstration.labels.confirm'), variant: 'destructive' });
    ex1Demo.appendChild(createAlertDialog({ trigger: t1, title: t('demonstration.labels.titleDestructive'), description: t('demonstration.labels.descriptionDestructive'), cancelButton: c1, actionButton: a1 }));
    const ex1Code = document.createElement('div');
    ex1Code.className = 'bg-muted p-4 rounded-b-lg font-mono text-sm border border-t-0 overflow-x-auto';
    ex1Code.innerHTML = `<code class="whitespace-pre">const trigger = createButton({ label: 'Excluir item', variant: 'destructive' });
const cancel = createButton({ label: 'Cancelar' });
const action = createButton({ label: 'Excluir', variant: 'destructive' });
const dialog = createAlertDialog({ trigger, title: 'Excluir item', description: '...', cancelButton: cancel, actionButton: action });
document.body.appendChild(dialog);</code>`;
    exDiv.append(ex1Title, ex1Demo, ex1Code);
    secExamples.content.appendChild(exDiv);

    // Variantes
    secVariants.h2.textContent = t('variants.title');
    secVariants.content.innerHTML = `
      <p class="text-sm text-muted-foreground mb-4">${sanitizeHtml(t('variants.visualTitle'))}</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4" id="variant-cards"></div>`;

    const variantCards = secVariants.content.querySelector('#variant-cards') as HTMLElement;
    (['destructive', 'neutral'] as const).forEach(key => {
      const card = document.createElement('div');
      card.className = 'rounded-lg border border-border p-4 bg-muted/20 space-y-3';
      const keyP = document.createElement('p');
      keyP.className = 'text-xs font-mono font-medium text-muted-foreground';
      keyP.textContent = key;
      const descP = document.createElement('p');
      descP.className = 'text-sm text-muted-foreground';
      descP.textContent = t(`variants.items.${key}`);
      const vTrigger = key === 'destructive'
        ? createButton({ label: t('demonstration.labels.triggerDestructive'), variant: 'destructive' })
        : createButton({ label: t('demonstration.labels.triggerNeutral') });
      const vCancel = createButton({ label: t('demonstration.labels.cancel') });
      const vAction = key === 'destructive'
        ? createButton({ label: t('demonstration.labels.confirm'), variant: 'destructive' })
        : createButton({ label: t('demonstration.labels.confirmNeutral') });
      const vTitle = key === 'destructive' ? t('demonstration.labels.titleDestructive') : t('demonstration.labels.titleNeutral');
      const vDesc = key === 'destructive' ? t('demonstration.labels.descriptionDestructive') : t('demonstration.labels.descriptionNeutral');
      card.append(keyP, descP, createAlertDialog({ trigger: vTrigger, title: vTitle, description: vDesc, cancelButton: vCancel, actionButton: vAction }));
      variantCards.appendChild(card);
    });

    // Estados
    secStates.h2.textContent = t('states.title');
    secStates.content.innerHTML = `
      <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-border">
            <th class="text-left p-3 text-muted-foreground font-medium">${sanitizeHtml(t('states.table.state'))}</th>
            <th class="text-left p-3 text-muted-foreground font-medium">${sanitizeHtml(t('states.table.visual'))}</th>
            <th class="text-left p-3 text-muted-foreground font-medium">${sanitizeHtml(t('states.table.trigger'))}</th>
          </tr></thead>
          <tbody>
            <tr class="border-b border-border/50">
              <td class="p-3 border-r border-border font-medium">Fechado</td>
              <td class="p-3 border-r border-border text-muted-foreground">${sanitizeHtml(t('states.closed'))}</td>
              <td class="p-3 text-muted-foreground">${sanitizeHtml(t('states.closedTrigger'))}</td>
            </tr>
            <tr>
              <td class="p-3 border-r border-border font-medium">Aberto</td>
              <td class="p-3 border-r border-border text-muted-foreground">${sanitizeHtml(t('states.open'))}</td>
              <td class="p-3 text-muted-foreground">${sanitizeHtml(t('states.openTrigger'))}</td>
            </tr>
          </tbody>
        </table>
      </div>`;

    // Propriedades
    secProps.h2.textContent = t('props.title');
    const PROP_ROWS = [
      { name: 'trigger',          type: 'HTMLElement',             def: '—',         req: 'Sim', key: 'open'         },
      { name: 'title',            type: 'string',                  def: '—',         req: 'Sim', key: 'defaultOpen'  },
      { name: 'description',      type: 'string',                  def: 'undefined', req: 'Não', key: 'onOpenChange' },
      { name: 'cancelButton',     type: 'HTMLElement',             def: '—',         req: 'Sim', key: 'asChild'      },
      { name: 'actionButton',     type: 'HTMLElement',             def: '—',         req: 'Sim', key: 'className'    },
      { name: 'onOpenChange',     type: '(open: boolean) => void', def: 'undefined', req: 'Não', key: 'onOpenChange' },
    ];
    secProps.content.innerHTML = `
      <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-border">
            <th class="text-left p-3 text-muted-foreground font-medium">Prop</th>
            <th class="text-left p-3 text-muted-foreground font-medium">Tipo</th>
            <th class="text-left p-3 text-muted-foreground font-medium">Padrão</th>
            <th class="text-left p-3 text-muted-foreground font-medium">Obrigatório</th>
          </tr></thead>
          <tbody>${PROP_ROWS.map(row => `<tr class="border-b border-border/50 last:border-0">
            <td class="p-3 font-mono text-xs">${sanitizeHtml(row.name)}</td>
            <td class="p-3 font-mono text-xs text-muted-foreground">${sanitizeHtml(row.type)}</td>
            <td class="p-3 font-mono text-xs text-muted-foreground">${sanitizeHtml(row.def)}</td>
            <td class="p-3 text-muted-foreground">${sanitizeHtml(row.req)}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>`;

    // Tokens
    secTokens.h2.textContent = t('tokens.title');
    const TOKEN_ROWS = [
      { token: '--background',       cls: 'bg-background',         key: 'background'      },
      { token: '--border',           cls: 'border-border',         key: 'border'          },
      { token: '--foreground',       cls: 'text-foreground',       key: 'foreground'      },
      { token: '--muted-foreground', cls: 'text-muted-foreground', key: 'mutedForeground' },
      { token: '--primary',          cls: 'bg-primary',            key: 'primary'         },
      { token: '--destructive',      cls: 'bg-destructive',        key: 'destructive'     },
      { token: '--radius',           cls: 'rounded-lg',            key: 'radius'          },
      { token: '--ring',             cls: 'ring-ring',             key: 'ring'            },
    ];
    secTokens.content.innerHTML = `
      <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto mb-6">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-border">
            <th class="text-left p-3 text-muted-foreground font-medium">${sanitizeHtml(t('tokens.table.token'))}</th>
            <th class="text-left p-3 text-muted-foreground font-medium">${sanitizeHtml(t('tokens.table.class'))}</th>
            <th class="text-left p-3 text-muted-foreground font-medium">${sanitizeHtml(t('tokens.table.part'))}</th>
          </tr></thead>
          <tbody>${TOKEN_ROWS.map(row => `<tr class="border-b border-border/50 last:border-0">
            <td class="p-3 font-mono text-xs">${sanitizeHtml(row.token)}</td>
            <td class="p-3 font-mono text-xs text-muted-foreground">${sanitizeHtml(row.cls)}</td>
            <td class="p-3 text-muted-foreground">${sanitizeHtml(t(`tokens.rows.${row.key}`))}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>`;

    // Acessibilidade
    secA11y.h2.textContent = t('accessibility.title');
    const KEYBOARD_KEYS = ['tab', 'enter', 'space', 'escape'];
    const ARIA_KEYS = ['role', 'labelledby', 'describedby', 'modal'];
    const KEY_LABELS: Record<string, string> = { tab: 'Tab', enter: 'Enter', space: 'Space', escape: 'Escape' };
    secA11y.content.innerHTML = `
      <p class="text-sm text-muted-foreground mb-4">${sanitizeHtml(t('accessibility.summary'))}</p>
      <ul class="space-y-2 mb-8 list-none p-0 m-0">
        ${[1,2,3,4,5].map(i => `<li class="flex gap-2 items-start list-none">
          <span class="text-primary font-bold mt-0.5">→</span>
          <span class="text-sm text-muted-foreground">${sanitizeHtml(t(`accessibility.item${i}`))}</span>
        </li>`).join('')}
      </ul>
      <h3 class="text-base font-medium mb-3">${sanitizeHtml(t('accessibility.keyboardTitle'))}</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        ${KEYBOARD_KEYS.map(k => `<div class="flex items-start gap-3 rounded-lg border border-border p-3 bg-muted/20">
          <kbd class="flex-shrink-0 px-2 py-0.5 rounded border border-border bg-background font-mono text-xs font-semibold">${sanitizeHtml(KEY_LABELS[k])}</kbd>
          <span class="text-sm text-muted-foreground">${sanitizeHtml(t(`accessibility.keyboard.${k}`))}</span>
        </div>`).join('')}
      </div>
      <h3 class="text-base font-medium mb-3">${sanitizeHtml(t('accessibility.ariaTitle'))}</h3>
      <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-border">
            <th class="text-left p-3 text-muted-foreground font-medium">Atributo</th>
            <th class="text-left p-3 text-muted-foreground font-medium">Descrição</th>
          </tr></thead>
          <tbody>${ARIA_KEYS.map(k => `<tr class="border-b border-border/50 last:border-0">
            <td class="p-3 font-mono text-xs">${sanitizeHtml(t(`accessibility.aria.${k}`))}</td>
            <td class="p-3 text-muted-foreground">${sanitizeHtml(t(`accessibility.aria.${k}`))}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>`;

    // Relacionados
    secRelated.h2.textContent = t('related.title');
    const RELATED = [
      { name: 'Dialog', key: 'dialog', path: '?path=/docs/ui-dialog--docs' },
      { name: 'Drawer', key: 'drawer', path: '?path=/docs/ui-drawer--docs' },
      { name: 'Sonner', key: 'sonner', path: '?path=/docs/ui-sonner--docs' },
      { name: 'Button', key: 'button', path: '?path=/docs/ui-button--docs' },
    ];
    secRelated.content.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        ${RELATED.map(item => `<button type="button"
          class="text-left rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
          data-path="${sanitizeHtml(item.path)}">
          <p class="font-medium text-sm mb-1">${sanitizeHtml(item.name)}</p>
          <p class="text-xs text-muted-foreground">${sanitizeHtml(t(`related.${item.key}`))}</p>
        </button>`).join('')}
      </div>`;
    secRelated.content.querySelectorAll('button[data-path]').forEach(btn => {
      (btn as HTMLButtonElement).addEventListener('click', () => {
        (window.top ?? window).location.href = (btn as HTMLButtonElement).dataset.path!;
      });
    });

    // Notas
    secNotes.h2.textContent = t('notes.title');
    secNotes.content.innerHTML = `
      <div class="space-y-3">
        ${['tip1', 'tip2'].map(key => `<div class="rounded-lg border border-border bg-muted/20 p-4">
          <p class="text-sm text-muted-foreground">${sanitizeHtml(t(`notes.${key}`))}</p>
        </div>`).join('')}
      </div>`;

    // Analytics
    secAnalytics.h2.textContent = t('analytics.title');
    const ANALYTICS_ROWS = [
      { e: 'pageView',      tr: 'pageViewTrigger',      pl: 'pageViewPayload'      },
      { e: 'sectionViewed', tr: 'sectionViewedTrigger', pl: 'sectionViewedPayload' },
      { e: 'langSwitch',    tr: 'langSwitchTrigger',    pl: 'langSwitchPayload'    },
      { e: 'open',          tr: 'openTrigger',          pl: 'openPayload'          },
      { e: 'confirm',       tr: 'confirmTrigger',       pl: 'confirmPayload'       },
      { e: 'cancel',        tr: 'cancelTrigger',        pl: 'cancelPayload'        },
    ];
    secAnalytics.content.innerHTML = `
      <p class="text-sm text-muted-foreground mb-4">${sanitizeHtml(t('analytics.description'))}</p>
      <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-border">
            <th class="text-left p-3 text-muted-foreground font-medium">${sanitizeHtml(t('analytics.table.event'))}</th>
            <th class="text-left p-3 text-muted-foreground font-medium">${sanitizeHtml(t('analytics.table.trigger'))}</th>
            <th class="text-left p-3 text-muted-foreground font-medium">${sanitizeHtml(t('analytics.table.payload'))}</th>
          </tr></thead>
          <tbody>${ANALYTICS_ROWS.map(row => `<tr class="border-b border-border/50 last:border-0">
            <td class="p-3 font-mono text-xs">${sanitizeHtml(t(`analytics.table.${row.e}`))}</td>
            <td class="p-3 text-muted-foreground">${sanitizeHtml(t(`analytics.table.${row.tr}`))}</td>
            <td class="p-3 font-mono text-xs text-muted-foreground">${sanitizeHtml(t(`analytics.table.${row.pl}`))}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>`;

    // Testes
    secTestes.h2.textContent = t('testes.title');
    secTestes.content.innerHTML = `
      <h3 class="text-base font-medium mb-3">${sanitizeHtml(t('testes.functional.title'))}</h3>
      <p class="text-sm text-muted-foreground mb-4">${sanitizeHtml(t('testes.functional.description'))}</p>
      <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto mb-8">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-border">
            <th class="text-left p-3 text-muted-foreground font-medium">Ação</th>
            <th class="text-left p-3 text-muted-foreground font-medium">Resultado esperado</th>
            <th class="text-left p-3 text-muted-foreground font-medium">Prioridade</th>
          </tr></thead>
          <tbody>${[1,2,3,4,5,6].map(i => `<tr class="border-b border-border/50 last:border-0">
            <td class="p-3">${sanitizeHtml(t(`testes.functional.item${i}.action`))}</td>
            <td class="p-3 text-muted-foreground">${sanitizeHtml(t(`testes.functional.item${i}.result`))}</td>
            <td class="p-3 ${t(`testes.functional.item${i}.priority`) === 'high' ? 'text-destructive font-medium' : 'text-muted-foreground'}">${sanitizeHtml(t(`testes.functional.item${i}.priority`))}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
      <h3 class="text-base font-medium mb-3">${sanitizeHtml(t('testes.accessibility.title'))}</h3>
      <p class="text-sm text-muted-foreground mb-4">${sanitizeHtml(t('testes.accessibility.description'))}</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        ${[1,2,3,4,5,6].map(i => `<div class="rounded-lg border border-border p-3 bg-muted/20 flex gap-2 items-start">
          <span class="text-emerald-500 font-bold mt-0.5">✓</span>
          <span class="text-sm text-muted-foreground">${sanitizeHtml(t(`testes.accessibility.item${i}`))}</span>
        </div>`).join('')}
      </div>
      <h3 class="text-base font-medium mb-3">${sanitizeHtml(t('testes.visual.title'))}</h3>
      <p class="text-sm text-muted-foreground mb-4">${sanitizeHtml(t('testes.visual.description'))}</p>
      <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-border">
            <th class="text-left p-3 text-muted-foreground font-medium">Story</th>
            <th class="text-left p-3 text-muted-foreground font-medium">${sanitizeHtml(t('testes.visual.required'))}</th>
          </tr></thead>
          <tbody>${[1,2,3,4,5].map(i => `<tr class="border-b border-border/50 last:border-0">
            <td class="p-3">${sanitizeHtml(t(`testes.visual.item${i}.story`))}</td>
            <td class="p-3 ${t(`testes.visual.item${i}.priority`) === 'high' ? 'text-destructive font-medium' : 'text-muted-foreground'}">${sanitizeHtml(t(`testes.visual.item${i}.priority`))}</td>
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
