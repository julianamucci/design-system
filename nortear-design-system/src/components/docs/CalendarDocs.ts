import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createCalendar } from '@/components/ui/calendar';
import uiTranslations from '@/i18n/ui.json';
import calendarTranslations from '@shared/content/calendar/translations.json';

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
const { t, subscribe } = createTranslation(calendarTranslations as Record<string, unknown>);

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

// Fixed reference date to keep previews stable across Chromatic builds.
function referenceDate(): Date {
  return new Date(2026, 3, 12); // 2026-04-12
}

function withDisabledWeekends(): (date: Date) => boolean {
  return (date) => {
    const d = date.getDay();
    return d === 0 || d === 6;
  };
}

// ─── createCalendarDocs ───────────────────────────────────────────────────────

export function createCalendarDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'calendar',
    });
    track('docs_page_view', {
      component_name: 'calendar',
      locale,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  }
  let cleanupSeo = updateSeo();
  cleanups.push(() => cleanupSeo());
  cleanups.push(
    subscribe(() => {
      cleanupSeo();
      cleanupSeo = updateSeo();
    }),
  );

  // ── Nav groups ───────────────────────────────────────────────────────────

  const NAV_GROUPS: { labelKey: string; sections: { id: string; labelKey: string }[] }[] = [
    {
      labelKey: 'nav.overview',
      sections: [
        { id: 'demonstracao', labelKey: 'nav.demonstration' },
        { id: 'anatomia', labelKey: 'nav.anatomy' },
        { id: 'quando-usar', labelKey: 'nav.usage' },
        { id: 'do-dont', labelKey: 'nav.doDont' },
      ],
    },
    {
      labelKey: 'nav.techRef',
      sections: [
        { id: 'importacao', labelKey: 'nav.import' },
        { id: 'variantes', labelKey: 'nav.variants' },
        { id: 'composicoes', labelKey: 'nav.compositions' },
        { id: 'estados', labelKey: 'nav.states' },
        { id: 'propriedades', labelKey: 'nav.props' },
        { id: 'tokens', labelKey: 'nav.tokens' },
      ],
    },
    {
      labelKey: 'nav.context',
      sections: [
        { id: 'acessibilidade', labelKey: 'nav.accessibility' },
        { id: 'relacionados', labelKey: 'nav.related' },
        { id: 'notas', labelKey: 'nav.notes' },
      ],
    },
    {
      labelKey: 'nav.quality',
      sections: [
        { id: 'analytics', labelKey: 'nav.analytics' },
        { id: 'testes', labelKey: 'nav.testes' },
      ],
    },
  ];

  function buildNavGroups() {
    return NAV_GROUPS.map((g) => ({
      label: tNav(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: tNav(s.labelKey) })),
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
      installNote: 'npx shadcn@latest add calendar',
    });
    headerSlot.replaceChildren(header);
  }

  function buildSidebar() {
    pageLayout.rebuildNav(buildNavGroups());
  }

  function updateActiveNav(activeId: string) {
    pageLayout.setActiveSection(activeId);
  }

  // ── Sections (rebuilt on locale change) ───────────────────────────────────

  const sectionOrder = [
    'demonstracao',
    'anatomia',
    'quando-usar',
    'do-dont',
    'importacao',
    'variantes',
    'composicoes',
    'estados',
    'propriedades',
    'tokens',
    'acessibilidade',
    'relacionados',
    'notas',
    'analytics',
    'testes',
  ] as const;
  type SectionId = (typeof sectionOrder)[number];

  const sectionEls: Record<SectionId, HTMLElement> = {} as Record<SectionId, HTMLElement>;

  function buildSection(id: SectionId): HTMLElement {
    switch (id) {
      case 'demonstracao':
        return createDocsDemonstration({
          title: t('demonstration.title'),
          demoFactory: () => {
            const wrap = document.createElement('div');
            wrap.className = 'nds-cluster nds-w-full';
            wrap.dataset.justify = 'center';
            wrap.appendChild(
              createCalendar({ locale: 'pt-BR',
                value: referenceDate(),
                class: 'nds-rounded-md nds-border-default',
              }),
            );
            return wrap;
          },
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
          ],
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      case 'quando-usar':
        return createDocsWhenToUse({
          title: t('usage.title'),
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [1, 2, 3, 4, 5].map((i) => t(`usage.guidelines.item${i}`)),
          },
          scenarios: {
            title: t('usage.scenarios.title'),
            cols: {
              scenario: t('usage.scenarios.cols.scenario'),
              use: t('usage.scenarios.cols.use'),
              alternative: t('usage.scenarios.cols.alternative'),
            },
            items: [1, 2, 3, 4, 5, 6].map((i) => ({
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
            items: ['label', 'trigger', 'disabled', 'srOnly'].map((key) => ({
              element: t(`usage.uxWriting.table.${key}.name`),
              rules: t(`usage.uxWriting.table.${key}.format`),
              do: t(`usage.uxWriting.table.${key}.good`),
              dont: t(`usage.uxWriting.table.${key}.bad`),
            })),
          },
          do: {
            title: t('usage.do.title'),
            items: [1, 2, 3, 4].map((i) => t(`usage.do.item${i}`)),
          },
          dont: {
            title: t('usage.dont.title'),
            items: [1, 2, 3, 4].map((i) => t(`usage.dont.item${i}`)),
          },
        });

      case 'do-dont':
        return createDocsDoDont({
          title: t('doDont.title'),
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: stripHtml(t('doDont.pair1.do')),
              dontCaption: stripHtml(t('doDont.pair1.dont')),
              doPreviewFactory: () =>
                createCalendar({ locale: 'pt-BR', value: referenceDate(), class: 'nds-rounded-md nds-border-default' }),
              dontPreviewFactory: () =>
                (() => { const c = createCalendar({ locale: 'pt-BR', value: referenceDate(), class: 'nds-rounded-md nds-border-default' }); c.style.opacity = '0.8'; return c; })(),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: stripHtml(t('doDont.pair2.do')),
              dontCaption: stripHtml(t('doDont.pair2.dont')),
              doPreviewFactory: () =>
                createCalendar({ locale: 'pt-BR',
                  value: referenceDate(),
                  disabled: (d) => d < new Date(2026, 3, 1),
                  class: 'nds-rounded-md nds-border-default',
                }),
              dontPreviewFactory: () =>
                createCalendar({ locale: 'pt-BR', value: new Date(2020, 0, 15), class: 'nds-rounded-md nds-border-default' }),
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('import.basic'),
          code: `import { createCalendar } from '@/components/ui/calendar';`,
          secondaryDescription: t('import.withLocale'),
          secondaryCode: `// Uso básico
const el = createCalendar({ locale: 'pt-BR',
  value: new Date(),
  onSelect: (date) => console.log(date),
});
document.body.appendChild(el);`,
        });

      case 'variantes': {
        const codeSingle = `const el = createCalendar({ locale: 'pt-BR',
  value: new Date(),
  onSelect: (date) => console.log(date),
});`;
        const codeDisabled = `const el = createCalendar({ locale: 'pt-BR',
  value: new Date(),
  disabled: (d) => d.getDay() === 0 || d.getDay() === 6,
});`;
        const codeCustomClass = `const el = createCalendar({ locale: 'pt-BR',
  value: new Date(),
  class: 'nds-rounded-md nds-border-default nds-shadow-sm',
});`;

        return createDocsVariants({
          title: t('variants.visualTitle'),
          items: [
            {
              name: 'single',
              description: stripHtml(t('variants.items.single')),
              code: codeSingle,
              previewFactory: () =>
                createCalendar({ locale: 'pt-BR', value: referenceDate(), class: 'nds-rounded-md nds-border-default' }),
            },
            {
              name: 'withDisabledDates',
              description: stripHtml(t('states.disabled.behavior')),
              code: codeDisabled,
              previewFactory: () =>
                createCalendar({ locale: 'pt-BR',
                  value: referenceDate(),
                  disabled: withDisabledWeekends(),
                  class: 'nds-rounded-md nds-border-default',
                }),
            },
            {
              name: 'customStyled',
              description: stripHtml(t('props.table.className')),
              code: codeCustomClass,
              previewFactory: () =>
                createCalendar({ locale: 'pt-BR',
                  value: referenceDate(),
                  class: 'nds-rounded-md nds-border-default nds-shadow-sm',
                }),
            },
          ],
        });
      }

      case 'composicoes': {
        const codeInlineBordered = `const el = createCalendar({
  locale: 'pt-BR',
  value: new Date(),
  class: 'nds-rounded-md nds-border-default',
});
document.body.appendChild(el);`;

        const codeDisabledPast = `const today = new Date();
const el = createCalendar({
  locale: 'pt-BR',
  value: today,
  disabled: (d) => d < new Date(today.getFullYear(), today.getMonth(), today.getDate()),
  class: 'nds-rounded-md nds-border-default',
});`;

        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'calendar',
          items: [
            {
              name: stripHtml(t('variants.compositions.inlineBordered.name')),
              description: stripHtml(t('variants.compositions.inlineBordered.description')),
              useWhen: stripHtml(t('variants.compositions.inlineBordered.use')),
              code: codeInlineBordered,
              previewFactory: () =>
                createCalendar({
                  locale: 'pt-BR',
                  value: referenceDate(),
                  class: 'nds-rounded-md nds-border-default',
                }),
            },
            {
              name: stripHtml(t('variants.compositions.disabledPast.name')),
              description: stripHtml(t('variants.compositions.disabledPast.description')),
              useWhen: stripHtml(t('variants.compositions.disabledPast.use')),
              code: codeDisabledPast,
              previewFactory: () => {
                const anchor = referenceDate();
                return createCalendar({
                  locale: 'pt-BR',
                  value: anchor,
                  disabled: (d) =>
                    d < new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate()),
                  class: 'nds-rounded-md nds-border-default',
                });
              },
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
              label: t('states.default.label'),
              trigger: stripHtml(t('states.default.trigger')),
              behavior: stripHtml(t('states.default.behavior')),
            },
            {
              label: t('states.selected.label'),
              trigger: stripHtml(t('states.selected.trigger')),
              behavior: stripHtml(t('states.selected.behavior')),
            },
            {
              label: t('states.disabled.label'),
              trigger: stripHtml(t('states.disabled.trigger')),
              behavior: stripHtml(t('states.disabled.behavior')),
            },
            {
              label: t('states.today.label'),
              trigger: stripHtml(t('states.today.trigger')),
              behavior: stripHtml(t('states.today.behavior')),
            },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// Nortear — implementação vanilla própria
export type CalendarOptions = {
  value?: Date;
  onSelect?: (date: Date) => void;
  disabled?: (date: Date) => boolean;
  class?: string;
};

export function createCalendar(options?: CalendarOptions): HTMLElement;`;

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
              title: t('props.calendarTitle'),
              cols: propsCols,
              items: [
                {
                  name: 'value',
                  type: 'Date',
                  defaultValue: '—',
                  required: 'Não',
                  description:
                    'Data inicialmente selecionada. Define também o mês em exibição ao montar.',
                },
                {
                  name: 'onSelect',
                  type: '(date: Date) => void',
                  defaultValue: '—',
                  required: 'Não',
                  description: stripHtml(t('props.table.onSelect')),
                },
                {
                  name: 'disabled',
                  type: '(date: Date) => boolean',
                  defaultValue: '—',
                  required: 'Não',
                  description:
                    'Função que recebe cada data e retorna true para bloquear. Na API vanilla é sempre uma função (sem suporte a Date | Date[] | Matcher).',
                },
                {
                  name: 'class',
                  type: 'string',
                  defaultValue: '—',
                  required: 'Não',
                  description: t('props.table.className'),
                },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes:
            'A implementação vanilla do Nortear é minimalista — não usa react-day-picker. Funcionalidades como mode="multiple"/"range", captionLayout="dropdown", showOutsideDays, numberOfMonths, showWeekNumber, classNames por slot e locale dinâmico não estão expostas pela factory atual. Para estes cenários, envolva a factory ou consuma diretamente a stack React/Vue/Svelte.',
        });
      }

      case 'tokens': {
        const customizationCode = `/* Em styles.css — customize os tokens usados pelo Calendar */
:root {
  --primary: 221 83% 53%;            /* fundo da data selecionada */
  --primary-foreground: 210 40% 98%;
  --accent: 210 40% 96%;             /* fundo de hoje e hover */
  --accent-foreground: 222 47% 11%;
  --muted-foreground: 215 16% 47%;   /* dias da semana */
  --ring: 221 83% 53%;               /* focus ring */
}`;

        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--primary', value: 'bg-primary text-primary-foreground', description: t('tokens.table.primary') },
            { token: '--accent', value: 'bg-accent text-accent-foreground', description: t('tokens.table.muted') },
            { token: '--muted-foreground', value: 'text-muted-foreground', description: t('tokens.table.mutedForeground') },
            { token: '--foreground', value: 'text-foreground', description: t('tokens.table.foreground') },
            { token: '--ring', value: 'focus-visible:ring-ring', description: t('tokens.table.ring') },
            { token: '--radius', value: 'rounded-md', description: stripHtml(t('tokens.table.cellRadius')) },
            { token: 'h-8 w-8', value: 'h-8 w-8', description: stripHtml(t('tokens.table.cellSize')) },
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
            t('accessibility.item6'),
          ],
          keyboardTitle: t('accessibility.keyboardTitle'),
          keyboardItems: [
            { key: 'Tab', description: stripHtml(t('accessibility.keyboard.tab')) },
            { key: 'Enter / Space', description: stripHtml(t('accessibility.keyboard.enter')) },
            { key: 'Arrow', description: stripHtml(t('accessibility.keyboard.arrows')) },
            { key: 'Page Up / Page Down', description: stripHtml(t('accessibility.keyboard.pageUpDown')) },
            { key: 'Home / End', description: stripHtml(t('accessibility.keyboard.homeEnd')) },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: 'Popover', description: t('related.popover'), path: '?path=/docs/ui-popover--docs' },
            { name: 'Input', description: t('related.input'), path: '?path=/docs/ui-input--docs' },
            { name: 'Button', description: t('related.datePicker'), path: '?path=/docs/ui-button--docs' },
            { name: 'Form', description: t('related.form'), path: '?path=/docs/ui-form--docs' },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [
            { title: '', content: t('notes.tip1') },
            { title: '', content: t('notes.tip2') },
            { title: '', content: t('notes.tip3') },
            { title: '', content: t('notes.tip4') },
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
            {
              event: t('analytics.table.fieldChange'),
              trigger: t('analytics.table.fieldChangeTrigger'),
              payload: t('analytics.table.fieldChangePayload'),
            },
            {
              event: t('analytics.table.dialogOpen'),
              trigger: t('analytics.table.dialogOpenTrigger'),
              payload: t('analytics.table.dialogOpenPayload'),
            },
            {
              event: t('analytics.table.pageView'),
              trigger: t('analytics.table.pageViewTrigger'),
              payload: t('analytics.table.pageViewPayload'),
            },
            {
              event: t('analytics.table.sectionViewed'),
              trigger: t('analytics.table.sectionViewedTrigger'),
              payload: t('analytics.table.sectionViewedPayload'),
            },
            {
              event: t('analytics.table.langSwitch'),
              trigger: t('analytics.table.langSwitchTrigger'),
              payload: t('analytics.table.langSwitchPayload'),
            },
          ],
        });

      case 'testes': {
        return createDocsTestes({
          title: t('testes.title'),
          functional: {
            title: t('testes.functional.title'),
            cols: {
              action: tNav('common.userAction'),
              result: tNav('common.expectedResult'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 4, 5, 6].map((i) => ({
              action: t(`testes.functional.item${i}.action`),
              result: stripHtml(t(`testes.functional.item${i}.result`)),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            cols: {
              criterion: tNav('common.criterion'),
              level: 'WCAG',
              how: tNav('common.howToVerify'),
            },
            items: [1, 2, 3, 4, 5, 6].map((i) => ({
              criterion: stripHtml(t(`testes.accessibility.item${i}.criterion`)),
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
            items: [1, 2, 3, 4, 5].map((i) => ({
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

  let activeSectionObserver: { disconnect: () => void } | null = null;

  function attachObserver() {
    activeSectionObserver?.disconnect();
    activeSectionObserver = createActiveSectionObserver(
      sectionOrder as unknown as string[],
      (id) => sectionEls[id as keyof typeof sectionEls] ?? null,
      (id) => updateActiveNav(id),
      (id) => track('docs_section_viewed', {
        section_id: id,
        component_name: 'calendar',
        locale: getLocale(),
      }),
    );
  }
  cleanups.push(() => activeSectionObserver?.disconnect());

  // ── Initial render ────────────────────────────────────────────────────────

  renderHeader();
  buildSidebar();
  renderAllSections();

  cleanups.push(
    subscribe(() => {
      renderHeader();
      buildSidebar();
      renderAllSections();
    }),
  );
  cleanups.push(
    onLocaleChange(() => {
      renderHeader();
      buildSidebar();
      renderAllSections();
    }),
  );

  // ── Cleanup on disconnect ────────────────────────────────────────────────

  const mo = new MutationObserver(() => {
    if (!document.body.contains(root)) {
      cleanups.forEach((fn) => fn());
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return root;
}
