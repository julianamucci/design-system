import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createAccordion } from '@/components/ui/accordion';
import uiTranslations from '@/i18n/ui.json';
import accordionTranslations from '@shared/content/accordion/translations.json';

import { createDocsNav, type DocsNavHandle } from '@/components/docs/shared/DocsNav';
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
const { t, subscribe } = createTranslation(accordionTranslations as Record<string, unknown>);

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

function buildDemoAccordion(): HTMLElement {
  return createAccordion({
    type: 'single',
    collapsible: true,
    class: 'w-full max-w-lg',
    items: [
      {
        value: 'q1',
        trigger: t('demonstration.labels.q1'),
        content: t('demonstration.labels.a1'),
      },
      {
        value: 'q2',
        trigger: t('demonstration.labels.q2'),
        content: t('demonstration.labels.a2'),
      },
      {
        value: 'q3',
        trigger: t('demonstration.labels.q3'),
        content: t('demonstration.labels.a3'),
      },
      {
        value: 'q4',
        trigger: t('demonstration.labels.q4'),
        content: t('demonstration.labels.a4'),
      },
    ],
    onValueChange: (val) => {
      if (val) {
        track('accordion_expand', { component: 'accordion', location: 'docs_demonstration' });
      } else {
        track('accordion_collapse', { component: 'accordion', location: 'docs_demonstration' });
      }
    },
  });
}

function getTokenItems(): Array<{ token: string; value: string; description: string }> {
  type AT = typeof accordionTranslations;
  type LK = keyof AT;
  const locale = getLocale() as LK;
  const items = (accordionTranslations as Record<string, Record<string, Record<string, Record<string, string>>>>)[locale]?.tokens?.items ?? {};
  return Object.values(items).map(v => ({ token: v.token, value: v.class, description: v.part }));
}

function getPropItems(tableKey: string): Array<{ name: string; type: string; defaultValue: string; required: string; description: string }> {
  type AT = typeof accordionTranslations;
  type LK = keyof AT;
  const locale = getLocale() as LK;
  const items = (accordionTranslations as Record<string, Record<string, Record<string, Record<string, Record<string, string>>>>>)[locale]?.props?.[tableKey]?.items ?? {};
  return Object.values(items).map(v => ({
    name: v.name,
    type: v.type,
    defaultValue: v.default,
    required: v.required,
    description: stripHtml(v.description),
  }));
}

// ─── createAccordionDocs ──────────────────────────────────────────────────────

export function createAccordionDocs(): HTMLElement {
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
      componentSlug: 'accordion',
    });
    track('docs_page_view', { component_name: 'accordion', locale, page_title: `${t('title')} · Design System` });
    return cleanup;
  }
  let cleanupSeo = updateSeo();
  cleanups.push(() => cleanupSeo());
  cleanups.push(subscribe(() => { cleanupSeo(); cleanupSeo = updateSeo(); }));

  // ── Header slot ──────────────────────────────────────────────────────────

  const headerSlot = document.createElement('div');

  function renderHeader() {
    const header = createDocsHeader({
      title: t('title'),
      description: t('description'),
      category: t('category'),
      type: t('type'),
      installNote: 'npx shadcn@latest add accordion',
    });
    headerSlot.replaceChildren(header);
  }

  // ── Layout ───────────────────────────────────────────────────────────────

  const layout = document.createElement('div');
  layout.className = 'flex gap-16 items-start';

  const sidebar = document.createElement('nav');
  sidebar.setAttribute('aria-label', 'Navegação das seções do componente');
  sidebar.className = 'sticky top-8 w-52 shrink-0 self-start space-y-5';

  const NAV_GROUPS: { labelKey: string; sections: { id: string; labelKey: string }[] }[] = [
    { labelKey: 'nav.overview', sections: [
      { id: 'demonstracao', labelKey: 'nav.demonstration' },
      { id: 'anatomia',     labelKey: 'nav.anatomy'       },
      { id: 'quando-usar',  labelKey: 'nav.usage'         },
      { id: 'do-dont',      labelKey: 'nav.doDont'        },
    ]},
    { labelKey: 'nav.techRef', sections: [
      { id: 'importacao',   labelKey: 'nav.import'   },
      { id: 'modos',        labelKey: 'nav.variants' },
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

  let navHandle: DocsNavHandle | null = null;

  function buildSidebar() {
    const groups = NAV_GROUPS.map(g => ({
      label: tNav(g.labelKey),
      sections: g.sections.map(s => ({ id: s.id, label: tNav(s.labelKey) })),
    }));
    navHandle = createDocsNav({ groups });
    sidebar.replaceChildren(navHandle.element);
  }

  function updateActiveNav(activeId: string) {
    navHandle?.setActiveSection(activeId);
  }

  const main = document.createElement('div');
  main.className = 'flex-1 min-w-0 space-y-12';
  layout.append(sidebar, main);

  // ── Sections ─────────────────────────────────────────────────────────────

  const sectionOrder = [
    'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
    'importacao', 'modos', 'estados', 'propriedades', 'tokens',
    'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
  ] as const;
  type SectionId = typeof sectionOrder[number];

  const sectionEls: Record<SectionId, HTMLElement> = {} as Record<SectionId, HTMLElement>;

  function buildSection(id: SectionId): HTMLElement {
    switch (id) {
      case 'demonstracao':
        return createDocsDemonstration({
          title: t('demonstration.title'),
          demoFactory: buildDemoAccordion,
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
            items: [1, 2, 3, 4, 5].map(i => t(`usage.guidelines.item${i}`)),
          },
          scenarios: {
            title: t('usage.scenarios.title'),
            cols: {
              scenario: t('usage.scenarios.cols.scenario'),
              use: t('usage.scenarios.cols.use'),
              alternative: t('usage.scenarios.cols.alternative'),
            },
            items: [1, 2, 3, 4, 5].map(i => ({
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
            items: ['trigger', 'triggerDoc', 'content'].map(key => ({
              element: t(`usage.uxWriting.table.${key}.name`),
              rules: t(`usage.uxWriting.table.${key}.format`),
              do: t(`usage.uxWriting.table.${key}.good`),
              dont: t(`usage.uxWriting.table.${key}.bad`),
            })),
          },
          do: {
            title: t('usage.do.title'),
            items: [1, 2, 3, 4].map(i => t(`usage.do.item${i}`)),
          },
          dont: {
            title: t('usage.dont.title'),
            items: [1, 2, 3, 4].map(i => t(`usage.dont.item${i}`)),
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
              doPreviewFactory: () => createAccordion({
                type: 'single', collapsible: true, class: 'w-full max-w-xs text-sm',
                items: [{ value: 'faq', trigger: 'Como faço para redefinir minha senha?', content: 'Acesse a tela de login e clique em "Esqueci minha senha".' }],
              }),
              dontPreviewFactory: () => createAccordion({
                type: 'single', collapsible: true, class: 'w-full max-w-xs text-sm',
                items: [{ value: 'faq', trigger: 'Senha', content: 'Informações sobre redefinição.' }],
              }),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: () => createAccordion({
                type: 'multiple', class: 'w-full max-w-xs text-sm',
                items: [
                  { value: 's1', trigger: 'Especificações técnicas', content: 'CPU, RAM, SSD.' },
                  { value: 's2', trigger: 'Compatibilidade', content: 'Windows 11, macOS, Linux.' },
                ],
              }),
              dontPreviewFactory: () => createAccordion({
                type: 'single', collapsible: true, class: 'w-full max-w-xs text-sm',
                items: [{ value: 's1', trigger: 'Expandir', content: 'Conteúdo único.' }],
              }),
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('import.note'),
          code: `import { createAccordion } from '@/components/ui/accordion';`,
        });

      case 'modos': {
        const codeSingle = `createAccordion({\n  type: 'single',\n  collapsible: true,\n  items: [{ value: 'item-1', trigger: 'Pergunta', content: 'Resposta' }],\n});`;
        const codeMultiple = `createAccordion({\n  type: 'multiple',\n  items: [{ value: 's1', trigger: 'Especificações', content: 'CPU, RAM...' }],\n});`;
        const codeControlled = `createAccordion({\n  type: 'single',\n  collapsible: true,\n  defaultValue: 'item-1',\n  onValueChange: (val) => console.log(val),\n  items: [...],\n});`;

        return createDocsVariants({
          id: 'modos',
          title: t('variants.title'),
          items: [
            {
              name: t('variants.single.label'),
              description: stripHtml(t('variants.single.description')),
              code: codeSingle,
              previewFactory: () => createAccordion({
                type: 'single', collapsible: true, defaultValue: 'item-1', class: 'w-full max-w-sm text-sm',
                items: [
                  { value: 'item-1', trigger: 'Pergunta 1', content: 'Resposta objetiva em 1–2 linhas.' },
                  { value: 'item-2', trigger: 'Pergunta 2', content: 'Outro conteúdo aqui.' },
                ],
              }),
            },
            {
              name: t('variants.multiple.label'),
              description: stripHtml(t('variants.multiple.description')),
              code: codeMultiple,
              previewFactory: () => createAccordion({
                type: 'multiple', class: 'w-full max-w-sm text-sm',
                items: [
                  { value: 's1', trigger: 'Especificações técnicas', content: 'CPU, RAM, SSD.' },
                  { value: 's2', trigger: 'Compatibilidade', content: 'Windows 11, macOS, Linux.' },
                ],
              }),
            },
            {
              name: t('variants.controlled.label'),
              description: stripHtml(t('variants.controlled.description')),
              code: codeControlled,
              previewFactory: () => createAccordion({
                type: 'single', collapsible: true, defaultValue: 'item-1', class: 'w-full max-w-sm text-sm',
                items: [
                  { value: 'item-1', trigger: 'Item 1 — controlado', content: 'Estado gerenciado externamente.' },
                  { value: 'item-2', trigger: 'Item 2 — controlado', content: 'Útil para sincronizar com URL.' },
                ],
              }),
            },
            {
              name: t('variants.defaultOpen.label'),
              description: stripHtml(t('variants.defaultOpen.description')),
              code: codeSingle,
              previewFactory: () => createAccordion({
                type: 'single', collapsible: true, defaultValue: 'item-1', class: 'w-full max-w-sm text-sm',
                items: [
                  { value: 'item-1', trigger: 'Item aberto por padrão', content: 'Este item inicia expandido via defaultValue.' },
                  { value: 'item-2', trigger: 'Item fechado por padrão', content: 'Este item inicia colapsado.' },
                ],
              }),
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
            { label: t('states.closed.label'),   trigger: t('states.closed.description'),           behavior: t('states.closed.description')           },
            { label: t('states.open.label'),     trigger: t('states.open.description'),             behavior: t('states.open.description')             },
            { label: t('states.disabled.label'), trigger: stripHtml(t('states.disabled.description')), behavior: stripHtml(t('states.disabled.description')) },
            { label: t('states.focused.label'),  trigger: t('states.focused.description'),          behavior: t('states.focused.description')          },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `export type AccordionOptions = {
  type?: 'single' | 'multiple';
  collapsible?: boolean;
  defaultValue?: string | string[];
  items: Array<{ value: string; trigger: string; content: string; disabled?: boolean }>;
  class?: string;
  onValueChange?: (value: string | string[]) => void;
};`;

        const propsCols = {
          prop: t('props.accordion.prop'),
          type: t('props.accordion.type'),
          default: t('props.accordion.default'),
          required: t('props.accordion.required'),
          description: t('props.accordion.description'),
        };

        return createDocsProps({
          title: t('props.title'),
          tables: [
            { title: t('props.accordion.title'), cols: propsCols, items: getPropItems('accordion') },
            { title: t('props.item.title'),      cols: propsCols, items: getPropItems('item')      },
            { title: t('props.trigger.title'),   cols: propsCols, items: getPropItems('trigger')   },
            { title: t('props.content.title'),   cols: propsCols, items: getPropItems('content')   },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: stripHtml(t('props.extensibility')),
        });
      }

      case 'tokens': {
        const customizationCode = t('tokens.customizationCode');
        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: getTokenItems(),
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode,
        });
      }

      case 'acessibilidade':
        return createDocsAccessibility({
          title: t('accessibility.title'),
          summary: t('accessibility.summary'),
          items: [
            t('accessibility.aria.ariaExpanded'),
            t('accessibility.aria.ariaControls'),
            t('accessibility.aria.role'),
            t('accessibility.aria.ariaLabelledBy'),
          ],
          keyboardTitle: t('accessibility.keyboardTitle'),
          keyboardItems: [
            { key: 'Tab',       description: t('accessibility.keyboard.tab')       },
            { key: 'Shift+Tab', description: t('accessibility.keyboard.shiftTab')  },
            { key: 'Enter',     description: t('accessibility.keyboard.enter')     },
            { key: 'Space',     description: t('accessibility.keyboard.space')     },
            { key: '↓',         description: t('accessibility.keyboard.arrowDown') },
            { key: '↑',         description: t('accessibility.keyboard.arrowUp')   },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.collapsible.name'), description: t('related.collapsible.description'), path: `?path=/docs/${t('related.collapsible.href')}` },
            { name: t('related.tabs.name'),        description: t('related.tabs.description'),        path: `?path=/docs/${t('related.tabs.href')}`        },
            { name: t('related.sidebar.name'),     description: t('related.sidebar.description'),     path: `?path=/docs/${t('related.sidebar.href')}`     },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [1, 2, 3, 4, 5].map(i => ({ title: '', content: t(`notes.item${i}`) })),
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
            { event: t('analytics.events.expand.event'),   trigger: t('analytics.events.expand.trigger'),   payload: t('analytics.events.expand.payload')   },
            { event: t('analytics.events.collapse.event'), trigger: t('analytics.events.collapse.trigger'), payload: t('analytics.events.collapse.payload') },
          ],
        });

      case 'testes':
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
              action: stripHtml(t(`testes.functional.item${i}.action`)),
              result: stripHtml(t(`testes.functional.item${i}.result`)),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
            items: [1, 2, 3, 4, 5].map(i => ({
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
            items: [1, 2, 3, 4, 5].map(i => ({
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

  let observer: IntersectionObserver | null = null;

  function attachObserver() {
    observer?.disconnect();
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          updateActiveNav(id);
          track('docs_section_viewed', { section_id: id, component_name: 'accordion', locale: getLocale() });
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
