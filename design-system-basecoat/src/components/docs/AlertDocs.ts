import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation, setLocale } from '@/lib/i18n';
import { createAlert, createAlertIcon, createAlertTitle, createAlertDescription, type AlertIconType, type AlertVariant } from '@/components/ui/alert';
import uiTranslations from '@/i18n/ui.json';
import alertTranslations from '@shared/content/alert/translations.json';

import {
  createDocsHeader,
  createDocsDemonstration,
  createDocsAnatomy,
  createDocsWhenToUse,
  createDocsDoDont,
  createDocsImport,
  createDocsVariants,
  createDocsStates,
  createDocsProps,
  createDocsTokens,
  createDocsAccessibility,
  createDocsRelated,
  createDocsNotes,
  createDocsAnalytics,
  createDocsTestes,
} from '@/components/docs/shared/sections';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);
const { t, subscribe } = createTranslation(alertTranslations as Record<string, unknown>);

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

function buildAlert(
  variant: AlertVariant,
  className: string,
  icon: AlertIconType | null,
  titleKey: string | null,
  descKey: string,
  extraClass = '',
): HTMLElement {
  const el = createAlert({ variant, className: [className, extraClass].filter(Boolean).join(' ') });
  if (icon) el.appendChild(createAlertIcon(icon));
  if (titleKey) el.appendChild(createAlertTitle({ text: stripHtml(t(titleKey)) }));
  el.appendChild(createAlertDescription({ text: stripHtml(t(descKey)) }));
  return el;
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
  cleanups.push(subscribe(() => { cleanupSeo(); cleanupSeo = updateSeo(); }));

  // ── Header slot (created by createDocsHeader on each update) ────────────

  const headerSlot = document.createElement('div');

  type Locale = 'pt-BR' | 'en' | 'es';
  const localeDefs: { value: Locale; label: string; ariaLabel: string }[] = [
    { value: 'pt-BR', label: 'PT', ariaLabel: 'Português' },
    { value: 'en',    label: 'EN', ariaLabel: 'English'   },
    { value: 'es',    label: 'ES', ariaLabel: 'Español'   },
  ];

  function createLanguageSwitcher(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border/40';
    const current = getLocale();
    localeDefs.forEach(({ value, label, ariaLabel }) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.locale = value;
      b.setAttribute('aria-label', ariaLabel);
      b.textContent = label;
      const active = value === current;
      b.className = active
        ? 'h-6 px-2 text-[10px] font-bold rounded bg-secondary text-secondary-foreground shadow-sm transition-all'
        : 'h-6 px-2 text-[10px] font-bold rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all';
      b.setAttribute('aria-pressed', String(active));
      b.addEventListener('click', () => {
        const prev = getLocale();
        if (prev === value) return;
        track('language_switched', { previous_language: prev, new_language: value });
        setLocale(value);
      });
      wrap.appendChild(b);
    });
    return wrap;
  }

  function renderHeader() {
    const header = createDocsHeader({
      title: t('title'),
      description: t('description'),
      category: t('category'),
      type: t('type'),
      installNote: 'npx shadcn@latest add alert',
    });
    const topRow = header.firstElementChild as HTMLElement | null;
    if (topRow) topRow.appendChild(createLanguageSwitcher());
    headerSlot.replaceChildren(header);
  }

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

  // ── Sections (rebuilt on locale change) ───────────────────────────────────

  const sectionOrder = [
    'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
    'importacao', 'variantes', 'estados', 'propriedades', 'tokens',
    'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
  ] as const;
  type SectionId = typeof sectionOrder[number];

  const sectionEls: Record<SectionId, HTMLElement> = {} as Record<SectionId, HTMLElement>;

  function buildSection(id: SectionId): HTMLElement {
    switch (id) {
      case 'demonstracao':
        return createDocsDemonstration({
          title: t('demonstration.title'),
          demoFactory: () => {
            const wrap = document.createElement('div');
            wrap.className = 'w-full space-y-3';
            wrap.append(
              buildAlert('default', '', 'info', 'demonstration.labels.infoTitle', 'demonstration.labels.infoDesc'),
              buildAlert('destructive', '', 'error', 'demonstration.labels.errorTitle', 'demonstration.labels.errorDesc'),
              buildAlert('default', 'bg-success/10 text-success border-success/30', 'success', 'demonstration.labels.successTitle', 'demonstration.labels.successDesc'),
              buildAlert('default', 'bg-warning/10 text-warning border-warning/30', 'warning', 'demonstration.labels.warningTitle', 'demonstration.labels.warningDesc'),
            );
            return wrap;
          },
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [t('anatomy.item1'), t('anatomy.item2'), t('anatomy.item3'), t('anatomy.item4')],
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
            ],
          },
          scenarios: {
            title: t('usage.scenarios.title'),
            cols: {
              scenario: t('usage.scenarios.cols.scenario'),
              use: t('usage.scenarios.cols.use'),
              alternative: t('usage.scenarios.cols.alternative'),
            },
            items: [1, 2, 3, 4].map(i => ({
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
            items: ['title', 'description', 'error', 'warning'].map(key => ({
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
                const el = createAlert({ variant: 'default' });
                el.appendChild(createAlertIcon('info'));
                el.appendChild(createAlertTitle({ text: 'Erro ao salvar' }));
                el.appendChild(createAlertDescription({ text: 'Não foi possível salvar. Verifique sua conexão.' }));
                return el;
              },
              dontPreviewFactory: () => {
                const el = createAlert({ variant: 'default' });
                el.appendChild(createAlertDescription({ text: 'Salvo!' }));
                return el;
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: () => {
                const el = createAlert({ variant: 'destructive' });
                el.appendChild(createAlertIcon('error'));
                el.appendChild(createAlertTitle({ text: 'Erro ao salvar' }));
                el.appendChild(createAlertDescription({ text: 'Verifique sua conexão.' }));
                return el;
              },
              dontPreviewFactory: () => {
                const el = createAlert({ variant: 'destructive' });
                el.appendChild(createAlertTitle({ text: 'Erro ao salvar' }));
                el.appendChild(createAlertDescription({ text: 'Verifique sua conexão.' }));
                return el;
              },
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('import.basic'),
          code: `import { createAlert, createAlertIcon, createAlertTitle, createAlertDescription } from '@/components/ui/alert';`,
          secondaryDescription: t('import.withIcon'),
          secondaryCode: `import { createAlertIcon } from '@/components/ui/alert';\n// createAlertIcon('info' | 'error' | 'success' | 'warning')`,
        });

      case 'variantes': {
        const codeDefault = `const alert = createAlert({ variant: 'default' });\nalert.appendChild(createAlertIcon('info'));\nalert.appendChild(createAlertTitle({ text: 'Atenção' }));\nalert.appendChild(createAlertDescription({ text: 'Suas alterações serão aplicadas na próxima sessão.' }));`;
        const codeDestructive = `const alert = createAlert({ variant: 'destructive' });\nalert.appendChild(createAlertIcon('error'));\nalert.appendChild(createAlertTitle({ text: 'Erro ao salvar' }));\nalert.appendChild(createAlertDescription({ text: 'Não foi possível salvar. Verifique sua conexão e tente novamente.' }));`;
        const codeSuccess = `const alert = createAlert({ variant: 'default', className: 'bg-success/10 text-success border-success/30' });\nalert.appendChild(createAlertIcon('success'));\nalert.appendChild(createAlertTitle({ text: 'Perfil atualizado' }));\nalert.appendChild(createAlertDescription({ text: 'Suas informações foram salvas com sucesso.' }));`;
        const codeWarning = `const alert = createAlert({ variant: 'default', className: 'bg-warning/10 text-warning border-warning/30' });\nalert.appendChild(createAlertIcon('warning'));\nalert.appendChild(createAlertTitle({ text: 'Assinatura expirando' }));\nalert.appendChild(createAlertDescription({ text: 'Sua assinatura expira em 3 dias. Renove para evitar interrupções.' }));`;
        const codeWithoutTitle = `const alert = createAlert({ variant: 'default' });\nalert.appendChild(createAlertIcon('info'));\nalert.appendChild(createAlertDescription({ text: 'Suas alterações serão aplicadas na próxima sessão.' }));`;

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              name: 'default',
              description: stripHtml(t('variants.items.default')),
              code: codeDefault,
              previewFactory: () => buildAlert('default', 'w-full', 'info', 'demonstration.labels.infoTitle', 'demonstration.labels.infoDesc'),
            },
            {
              name: 'destructive',
              description: stripHtml(t('variants.items.destructive')),
              code: codeDestructive,
              previewFactory: () => buildAlert('destructive', 'w-full', 'error', 'demonstration.labels.errorTitle', 'demonstration.labels.errorDesc'),
            },
            {
              name: 'success',
              description: stripHtml(t('variants.items.success')),
              code: codeSuccess,
              previewFactory: () => buildAlert('default', 'w-full bg-success/10 text-success border-success/30', 'success', 'demonstration.labels.successTitle', 'demonstration.labels.successDesc'),
            },
            {
              name: 'warning',
              description: stripHtml(t('variants.items.warning')),
              code: codeWarning,
              previewFactory: () => buildAlert('default', 'w-full bg-warning/10 text-warning border-warning/30', 'warning', 'demonstration.labels.warningTitle', 'demonstration.labels.warningDesc'),
            },
            {
              name: t('states.withoutTitle.label'),
              description: t('states.withoutTitle.behavior'),
              code: codeWithoutTitle,
              previewFactory: () => buildAlert('default', 'w-full', 'info', null, 'demonstration.labels.infoDesc'),
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
            { label: t('states.complete.label'),      trigger: stripHtml(t('states.complete.trigger')),      behavior: t('states.complete.behavior') },
            { label: t('states.withoutTitle.label'),  trigger: stripHtml(t('states.withoutTitle.trigger')),  behavior: t('states.withoutTitle.behavior') },
            { label: t('states.withoutIcon.label'),   trigger: t('states.withoutIcon.trigger'),              behavior: t('states.withoutIcon.behavior') },
            { label: t('states.dynamicInsert.label'), trigger: t('states.dynamicInsert.trigger'),            behavior: stripHtml(t('states.dynamicInsert.behavior')) },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createAlert(options)
export interface AlertOptions {
  variant?: 'default' | 'destructive';
  className?: string;
}

// createAlertTitle(options), createAlertDescription(options)
export interface AlertTitleOptions {
  text?: string;
  className?: string;
}`;

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
              title: t('props.alertTitle'),
              cols: propsCols,
              items: [
                { name: 'variant',   type: '"default" | "destructive"', defaultValue: '"default"', required: 'Não', description: stripHtml(t('props.table.variant')) },
                { name: 'className', type: 'string',                    defaultValue: '—',         required: 'Não', description: t('props.table.className') },
              ],
            },
            {
              title: t('props.alertTitleTitle'),
              cols: propsCols,
              items: [
                { name: 'text',      type: 'string', defaultValue: '—', required: 'Não', description: t('props.table.children') },
                { name: 'className', type: 'string', defaultValue: '—', required: 'Não', description: t('props.table.className') },
              ],
            },
            {
              title: t('props.alertDescTitle'),
              cols: propsCols,
              items: [
                { name: 'text',      type: 'string', defaultValue: '—', required: 'Não', description: t('props.table.children') },
                { name: 'className', type: 'string', defaultValue: '—', required: 'Não', description: t('props.table.className') },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: t('props.extensibility'),
        });
      }

      case 'tokens': {
        const customizationCode = `/* Em styles.css — definir tokens semânticos */
:root {
  --success: 142 76% 36%;
  --warning: 38 92% 50%;
}

.dark {
  --success: 142 69% 58%;
  --warning: 48 96% 53%;
}`;

        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--background',  value: 'bg-background',                                        description: t('tokens.table.background') },
            { token: '--foreground',  value: 'text-foreground',                                      description: t('tokens.table.foreground') },
            { token: '--border',      value: 'border',                                               description: t('tokens.table.border') },
            { token: '--destructive', value: 'border-destructive/50',                                description: t('tokens.table.destructiveBorder') },
            { token: '--destructive', value: 'text-destructive',                                     description: t('tokens.table.destructiveText') },
            { token: '--success',     value: 'bg-success/10 text-success border-success/30',         description: t('tokens.table.success') },
            { token: '--warning',     value: 'bg-warning/10 text-warning border-warning/30',         description: t('tokens.table.warning') },
            { token: '--radius',      value: 'rounded-lg',                                           description: t('tokens.table.radius') },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode,
        });
      }

      case 'acessibilidade':
        return createDocsAccessibility({
          title: t('accessibility.title'),
          summary: t('accessibility.summary'),
          items: [
            t('accessibility.item1'),
            t('accessibility.item2'),
            t('accessibility.item3'),
            t('accessibility.item4'),
            t('accessibility.item5'),
          ],
          keyboardTitle: t('accessibility.keyboardTitle'),
          keyboardItems: [
            { key: 'Tab',   description: t('accessibility.keyboard.tab') },
            { key: 'Enter', description: t('accessibility.keyboard.enter') },
            { key: '—',     description: t('accessibility.keyboard.noKeyboard') },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: 'Sonner',      description: t('related.sonner'),      path: '?path=/docs/ui-sonner--docs' },
            { name: 'AlertDialog', description: t('related.alertDialog'), path: '?path=/docs/ui-alertdialog--docs' },
            { name: 'Badge',       description: t('related.badge'),       path: '?path=/docs/ui-badge--docs' },
            { name: 'Progress',    description: t('related.progress'),    path: '?path=/docs/ui-progress--docs' },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [
            { title: '', content: t('notes.tip1') },
            { title: '', content: t('notes.tip2') },
            { title: '', content: t('notes.tip3') },
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
            { event: t('analytics.table.dismiss'),       trigger: t('analytics.table.dismissTrigger'),       payload: t('analytics.table.dismissPayload') },
            { event: t('analytics.table.pageView'),      trigger: t('analytics.table.pageViewTrigger'),      payload: t('analytics.table.pageViewPayload') },
            { event: t('analytics.table.sectionViewed'), trigger: t('analytics.table.sectionViewedTrigger'), payload: t('analytics.table.sectionViewedPayload') },
            { event: t('analytics.table.langSwitch'),    trigger: t('analytics.table.langSwitchTrigger'),    payload: t('analytics.table.langSwitchPayload') },
          ],
        });

      case 'testes': {
        const locale = getLocale();
        const criterionLabel = locale === 'en' ? 'Criterion' : locale === 'es' ? 'Criterio' : 'Critério';
        const howLabel       = locale === 'en' ? 'How to verify' : locale === 'es' ? 'Cómo verificar' : 'Como verificar';

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
            cols: { criterion: criterionLabel, level: 'WCAG', how: howLabel },
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
            items: [1, 2, 3, 4].map(i => ({
              story: t(`testes.visual.item${i}.story`),
              priority: priorityLabel(t(`testes.visual.item${i}.priority`)),
            })),
          },
        });
      }
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

  let observer: IntersectionObserver | null = null;

  function attachObserver() {
    observer?.disconnect();
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          updateActiveNav(id);
          track('docs_section_viewed', { section_id: id, component_name: 'alert', locale: getLocale() });
          break;
        }
      }
    }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

    for (const id of sectionOrder) {
      const el = sectionEls[id];
      if (el) observer.observe(el);
    }
  }
  cleanups.push(() => observer?.disconnect());

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

  root.append(headerSlot, layout);

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
