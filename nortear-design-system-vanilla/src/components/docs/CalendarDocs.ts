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
import { stripHtml, toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
function screenReaderItems(): string[] {
  const locale = getLocale();
  return Object.values(
    (calendarTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  );
}
const { t, subscribe } = createTranslation(calendarTranslations as Record<string, unknown>);

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
 * Hoje. As demos da docs page abrem no mês corrente com o dia de hoje marcado —
 * é o que se espera ao abrir um calendário, e é o que o React e o Svelte já
 * faziam. As STORIES seguem em data fixa: lá o Chromatic fotografa, e um
 * calendário preso ao relógio geraria diferença visual todo dia.
 */
function referenceDate(): Date {
  return new Date();
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
                onSelect: (value) => {
                  // A demo é de seleção única, então o valor é sempre uma data;
                  // a guarda existe porque a assinatura agora cobre os dois
                  // modos, e um intervalo aqui seria evento sem data.
                  if (!(value instanceof Date)) return;
                  track('field_change', {
                    component: 'calendar',
                    field_name: 'date',
                    value: value.toISOString().slice(0, 10),
                    location: 'docs_demo',
                  });
                },
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
              doCaption: toPlainText(t('doDont.pair1.do')),
              dontCaption: toPlainText(t('doDont.pair1.dont')),
              doPreviewFactory: () =>
                createCalendar({ locale: 'pt-BR', value: referenceDate() }),
              dontPreviewFactory: () =>
                // sem opacity no calendário: o dim rebaixava os <th> de dia da
                // semana (muted-foreground) para 3.69:1 — o card destructive-soft
                // já sinaliza o don't (axe: color-contrast)
                createCalendar({ locale: 'pt-BR', value: referenceDate() }),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: () =>
                createCalendar({ locale: 'pt-BR',
                  value: referenceDate(),
                  disabled: (d) => d < new Date(2026, 3, 1),
                }),
              dontPreviewFactory: () =>
                createCalendar({ locale: 'pt-BR', value: new Date(2020, 0, 15) }),
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
        const codeMultiple = `const el = createCalendar({
  mode: 'multiple',
  locale: 'pt-BR',
  value: [new Date(2026, 3, 8), new Date(2026, 3, 12)],
  onSelect: (datas) => console.log(datas),
});`;
        const codeRange = `const el = createCalendar({
  mode: 'range',
  locale: 'pt-BR',
  value: { from: new Date(2026, 3, 10), to: new Date(2026, 3, 18) },
  onSelect: (intervalo) => console.log(intervalo),
});`;
        const codeCaptionDropdown = `const el = createCalendar({
  locale: 'pt-BR',
  captionLayout: 'dropdown',
  value: new Date(),
});`;
        const codeNumberOfMonths = `const el = createCalendar({
  locale: 'pt-BR',
  numberOfMonths: 2,
  value: new Date(),
});`;
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
});`;

        return createDocsCompositions({
          id: 'variantes',
          title: t('variants.visualTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'calendar',
          items: [
            {
              name: 'single',
              description: stripHtml(t('variants.items.single')),
              code: codeSingle,
              previewFactory: () =>
                createCalendar({ locale: 'pt-BR', value: referenceDate() }),
            },
            {
              name: 'multiple',
              description: stripHtml(t('variants.items.multiple')),
              code: codeMultiple,
              previewFactory: () => {
                const base = referenceDate();
                return createCalendar({
                  mode: 'multiple',
                  locale: 'pt-BR',
                  value: [
                    new Date(base.getFullYear(), base.getMonth(), 8),
                    new Date(base.getFullYear(), base.getMonth(), 12),
                    new Date(base.getFullYear(), base.getMonth(), 16),
                  ],
                });
              },
            },
            {
              name: 'range',
              description: stripHtml(t('variants.items.range')),
              code: codeRange,
              previewFactory: () => {
                const base = referenceDate();
                return createCalendar({
                  mode: 'range',
                  locale: 'pt-BR',
                  value: {
                    from: new Date(base.getFullYear(), base.getMonth(), 10),
                    to: new Date(base.getFullYear(), base.getMonth(), 18),
                  },
                });
              },
            },
            {
              name: 'captionDropdown',
              description: stripHtml(t('variants.items.captionDropdown')),
              code: codeCaptionDropdown,
              previewFactory: () =>
                createCalendar({
                  locale: 'pt-BR',
                  captionLayout: 'dropdown',
                  value: referenceDate(),
                }),
            },
            {
              name: 'numberOfMonths',
              description: stripHtml(t('variants.items.numberOfMonths')),
              code: codeNumberOfMonths,
              previewFactory: () =>
                createCalendar({
                  locale: 'pt-BR',
                  numberOfMonths: 2,
                  value: referenceDate(),
                }),
            },
            {
              name: stripHtml(t('variants.items.inlineBordered.name')),
              description: stripHtml(t('variants.items.inlineBordered.description')),
              useWhen: stripHtml(t('variants.items.inlineBordered.use')),
              trackId: 'inlineBordered',
              code: codeInlineBordered,
              previewFactory: () =>
                createCalendar({
                  locale: 'pt-BR',
                  value: referenceDate(),
                  class: 'nds-rounded-md nds-border-default',
                }),
            },
            {
              name: stripHtml(t('variants.items.disabledPast.name')),
              description: stripHtml(t('variants.items.disabledPast.description')),
              useWhen: stripHtml(t('variants.items.disabledPast.use')),
              trackId: 'disabledPast',
              code: codeDisabledPast,
              previewFactory: () => {
                const anchor = referenceDate();
                return createCalendar({
                  locale: 'pt-BR',
                  value: anchor,
                  disabled: (d) =>
                    d < new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate()),
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
            trigger: toPlainText(t('states.cols.trigger')),
            behavior: toPlainText(t('states.cols.behavior')),
          },
          items: [
            {
              label: t('states.default.label'),
              trigger: toPlainText(t('states.default.trigger')),
              behavior: toPlainText(t('states.default.behavior')),
            },
            {
              label: t('states.selected.label'),
              trigger: toPlainText(t('states.selected.trigger')),
              behavior: toPlainText(t('states.selected.behavior')),
            },
            {
              label: t('states.disabled.label'),
              trigger: toPlainText(t('states.disabled.trigger')),
              behavior: toPlainText(t('states.disabled.behavior')),
            },
            {
              label: t('states.today.label'),
              trigger: toPlainText(t('states.today.trigger')),
              behavior: toPlainText(t('states.today.behavior')),
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
                  description: toPlainText(t('props.table.onSelect')),
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
            { token: '--muted-foreground', value: 'nds-text-muted-foreground', description: t('tokens.table.mutedForeground') },
            { token: '--foreground', value: 'text-foreground', description: t('tokens.table.foreground') },
            { token: '--ring', value: 'nds-focus-ring', description: t('tokens.table.ring') },
            { token: '--nds-cell-size', value: '2rem', description: toPlainText(t('tokens.table.cellSize')) },
            { token: '--nds-cell-radius', value: 'var(--radius-md)', description: toPlainText(t('tokens.table.cellRadius')) },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode: t('tokens.customizationCode'),
        });
      }

      case 'acessibilidade':
        return createDocsAccessibility({
          screenReaderTitle: tNav('common.screenReader'),
          screenReaderItems: screenReaderItems(),
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
            { key: 'Tab', description: toPlainText(t('accessibility.keyboard.tab')) },
            { key: 'Enter / Space', description: toPlainText(t('accessibility.keyboard.enter')) },
            { key: 'Arrow Up / Arrow Down / Arrow Left / Arrow Right', description: toPlainText(t('accessibility.keyboard.arrows')) },
            { key: 'Page Up / Page Down', description: toPlainText(t('accessibility.keyboard.pageUpDown')) },
            { key: 'Home / End', description: toPlainText(t('accessibility.keyboard.homeEnd')) },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: 'Popover', description: toPlainText(t('related.popover')), path: '?path=/docs/ui-popover--docs' },
            { name: 'Input', description: toPlainText(t('related.input')), path: '?path=/docs/ui-input--docs' },
            { name: 'Button', description: toPlainText(t('related.datePicker')), path: '?path=/docs/ui-button--docs' },
            { name: 'Form', description: toPlainText(t('related.form')), path: '?path=/docs/ui-form--docs' },
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
            trigger: toPlainText(t('analytics.table.trigger')),
            payload: t('analytics.table.payload'),
          },
          items: [
            {
              event: t('analytics.table.fieldChange'),
              trigger: toPlainText(t('analytics.table.fieldChangeTrigger')),
              payload: t('analytics.table.fieldChangePayload'),
            },
            {
              event: t('analytics.table.dialogOpen'),
              trigger: toPlainText(t('analytics.table.dialogOpenTrigger')),
              payload: t('analytics.table.dialogOpenPayload'),
            },
            {
              event: t('analytics.table.pageView'),
              trigger: toPlainText(t('analytics.table.pageViewTrigger')),
              payload: t('analytics.table.pageViewPayload'),
            },
            {
              event: t('analytics.table.sectionViewed'),
              trigger: toPlainText(t('analytics.table.sectionViewedTrigger')),
              payload: t('analytics.table.sectionViewedPayload'),
            },
            {
              event: t('analytics.table.langSwitch'),
              trigger: toPlainText(t('analytics.table.langSwitchTrigger')),
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
              result: toPlainText(t(`testes.functional.item${i}.result`)),
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
              criterion: toPlainText(t(`testes.accessibility.item${i}.criterion`)),
              level: t(`testes.accessibility.item${i}.level`),
              how: toPlainText(t(`testes.accessibility.item${i}.how`)),
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
