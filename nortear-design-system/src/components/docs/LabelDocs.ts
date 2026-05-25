import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createLabel } from '@/components/ui/label';
import { createInput } from '@/components/ui/input';
import { createCheckbox } from '@/components/ui/checkbox';
import uiTranslations from '@/i18n/ui.json';
import labelTranslations from '@shared/content/label/translations.json';

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
  createDocsAnalytics,  // section container — não inline HTML
  createDocsTestes,
  createDocsPageLayout,
} from '@/components/docs/shared/sections';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);
const { t, subscribe } = createTranslation(labelTranslations as Record<string, unknown>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

function buildLabelWithInput(labelText: string, inputId: string, opts: { required?: boolean; disabled?: boolean } = {}): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'nds-stack nds-w-full nds-max-w-xs';
  wrapper.dataset.spacing = 'xs';

  if (opts.disabled) {
    // peer-disabled pattern: input (with peer class) BEFORE label
    const input = createInput({ id: inputId, placeholder: labelText, disabled: true });
    input.classList.add('peer');

    const label = createLabel({
      text: labelText,
      htmlFor: inputId,
      className: 'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed',
    });

    wrapper.append(input, label);
  } else {
    const label = createLabel({ htmlFor: inputId });

    if (opts.required) {
      const textNode = document.createTextNode(labelText);
      const asterisk = document.createElement('span');
      asterisk.setAttribute('aria-hidden', 'true');
      asterisk.className = 'nds-text-destructive';
      asterisk.style.marginLeft = 'var(--spacing-0-5)';
      asterisk.textContent = '*';
      label.append(textNode, asterisk);
    } else {
      label.textContent = labelText;
    }

    const input = createInput({ id: inputId, placeholder: '…' });
    if (opts.required) input.setAttribute('aria-required', 'true');

    wrapper.append(label, input);
  }

  return wrapper;
}

// ─── createLabelDocs ──────────────────────────────────────────────────────────

export function createLabelDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'label',
    });
    track('docs_page_view', { component_name: 'label', locale, page_title: `${t('title')} · Design System` });
    return cleanup;
  }
  let cleanupSeo = updateSeo();
  cleanups.push(() => cleanupSeo());
  cleanups.push(subscribe(() => { cleanupSeo(); cleanupSeo = updateSeo(); }));

  // ── Nav groups ───────────────────────────────────────────────────────────

  const NAV_GROUPS: { labelKey: string; sections: { id: string; labelKey: string }[] }[] = [
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

  function buildNavGroups() {
    return NAV_GROUPS.map(g => ({
      label: tNav(g.labelKey),
      sections: g.sections.map(s => ({ id: s.id, label: tNav(s.labelKey) })),
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
      installNote: 'npx shadcn@latest add label',
    });
    headerSlot.replaceChildren(header);
  }

  function buildSidebar() {
    pageLayout.rebuildNav(buildNavGroups());
  }

  function updateActiveNav(activeId: string) {
    pageLayout.setActiveSection(activeId);
  }

  // ── Sections ─────────────────────────────────────────────────────────────

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
            wrap.className = 'nds-stack nds-w-full';

            // Default label
            wrap.appendChild(buildLabelWithInput(t('demonstration.labels.default'), 'demo-default'));

            // Required label
            wrap.appendChild(buildLabelWithInput(t('demonstration.labels.required'), 'demo-required', { required: true }));

            // Disabled label (peer pattern)
            wrap.appendChild(buildLabelWithInput(t('demonstration.labels.disabled'), 'demo-disabled', { disabled: true }));

            return wrap;
          },
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [t('anatomy.item1'), t('anatomy.item2'), t('anatomy.item3')],
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
          do: {
            title: t('usage.do.title'),
            items: [
              t('usage.do.item1'),
              t('usage.do.item2'),
              t('usage.do.item3'),
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
                const wrap = document.createElement('div');
                wrap.className = 'nds-stack nds-w-full nds-max-w-xs';
                wrap.dataset.spacing = 'xs';
                const label = createLabel({ text: 'Email', htmlFor: 'dodont-do-1-input' });
                const input = createInput({ id: 'dodont-do-1-input', type: 'email', placeholder: 'seu@email.com' });
                wrap.append(label, input);
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-stack nds-w-full nds-max-w-xs';
                wrap.dataset.spacing = 'xs';
                // Label without htmlFor — no association
                const label = createLabel({ text: 'Email' });
                const input = createInput({ type: 'email', placeholder: 'seu@email.com' });
                wrap.append(label, input);
                return wrap;
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-stack nds-w-full nds-max-w-xs';
                wrap.dataset.spacing = 'xs';
                const label = createLabel({ text: 'Nome completo', htmlFor: 'dodont-do-2-input' });
                const input = createInput({ id: 'dodont-do-2-input', placeholder: 'Maria Silva' });
                wrap.append(label, input);
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-stack nds-w-full nds-max-w-xs';
                wrap.dataset.spacing = 'xs';
                const label = createLabel({ text: 'Informe seu nome completo', htmlFor: 'dodont-dont-2-input' });
                const input = createInput({ id: 'dodont-dont-2-input', placeholder: 'Informe seu nome completo' });
                wrap.append(label, input);
                return wrap;
              },
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          code: `import { createLabel } from '@/components/ui/label';`,
        });

      case 'variantes': {
        const codeDefault = `const label = createLabel({ text: 'Nome completo', htmlFor: 'nome' });\nconst input = createInput({ id: 'nome', type: 'text' });\nwrapper.append(label, input);`;
        const codeRequired = `const label = createLabel({ htmlFor: 'email' });\nconst textNode = document.createTextNode('Email profissional');\nconst asterisk = document.createElement('span');\nasterisk.setAttribute('aria-hidden', 'true');\nasterisk.className = 'nds-text-destructive';\nasterisk.style.marginLeft = 'var(--spacing-0-5)';\nasterisk.textContent = '*';\nlabel.append(textNode, asterisk);\nconst input = createInput({ id: 'email', type: 'email' });\ninput.setAttribute('aria-required', 'true');`;

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              name: t('variants.default.label'),
              description: sanitizeHtml(t('variants.default.description')),
              code: codeDefault,
              previewFactory: () => buildLabelWithInput('Nome completo', 'var-default-input'),
            },
            {
              name: t('states.required.label'),
              description: sanitizeHtml(t('states.required.behavior')),
              code: codeRequired,
              previewFactory: () => buildLabelWithInput('Email profissional', 'var-required-input', { required: true }),
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
              trigger: t('states.default.trigger'),
              behavior: t('states.default.behavior'),
            },
            {
              label: t('states.disabled.label'),
              trigger: sanitizeHtml(t('states.disabled.trigger')),
              behavior: sanitizeHtml(t('states.disabled.behavior')),
            },
            {
              label: t('states.required.label'),
              trigger: t('states.required.trigger'),
              behavior: sanitizeHtml(t('states.required.behavior')),
            },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `export interface LabelOptions {\n  text?: string;\n  /** The id of the form control this label describes. */\n  htmlFor?: string;\n  /** Additional CSS classes to append. */\n  className?: string;\n}\n\nexport function createLabel(options: LabelOptions = {}): HTMLLabelElement`;

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
              title: 'createLabel(options)',
              cols: propsCols,
              items: [
                { name: 'text',      type: 'string', defaultValue: '""',  required: 'Não', description: t('props.table.children') },
                { name: 'htmlFor',   type: 'string', defaultValue: '—',   required: 'Não', description: sanitizeHtml(t('props.table.htmlFor')) },
                { name: 'className', type: 'string', defaultValue: '—',   required: 'Não', description: t('props.table.className') },
              ],
            },
          ],
          interfaceCode,
          extensibilityNotes: sanitizeHtml(t('props.note')),
        });
      }

      case 'tokens': {
        const customizationCode = `/* Override label tokens */\n:root {\n  --foreground: 222.2 84% 4.9%;\n  --destructive: 0 84.2% 60.2%;\n}`;

        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--foreground',  value: 'text-foreground',   description: t('tokens.table.foreground') },
            { token: '--foreground',  value: 'opacity-50',        description: t('tokens.table.foregroundMuted') },
            { token: '—',             value: 'text-sm',           description: t('tokens.table.fontSize') },
            { token: '—',             value: 'font-medium',       description: t('tokens.table.fontWeight') },
            { token: '—',             value: 'leading-none',      description: t('tokens.table.lineHeight') },
            { token: '--destructive', value: 'text-destructive',  description: t('tokens.table.destructive') },
          ],
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
          ],
          keyboardTitle: t('accessibility.keyboard.title'),
          keyboardItems: [
            { key: 'Tab',  description: t('accessibility.keyboard.tab') },
            { key: '—',    description: t('accessibility.keyboard.noKeyboard') },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: 'Input',      description: t('related.input'),      path: '?path=/docs/ui-input--docs' },
            { name: 'Checkbox',   description: t('related.checkbox'),   path: '?path=/docs/ui-checkbox--docs' },
            { name: 'FormLabel',  description: t('related.formLabel'),  path: '?path=/docs/ui-form--docs' },
            { name: 'FormField',  description: t('related.formField'),  path: '?path=/docs/ui-form--docs' },
            { name: 'RadioGroup', description: t('related.radioGroup'), path: '?path=/docs/ui-radiogroup--docs' },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [
            { title: '', content: sanitizeHtml(t('notes.tip1')) },
            { title: '', content: sanitizeHtml(t('notes.tip2')) },
            { title: '', content: sanitizeHtml(t('notes.tip3')) },
          ],
        });

      case 'analytics':
        return createDocsAnalytics({
          title: t('analytics.title'),
          cols: {
            event: tNav('analytics.table.event') || 'Evento',
            trigger: tNav('analytics.table.trigger') || 'Gatilho',
            payload: tNav('analytics.table.payload') || 'Payload',
          },
          items: [
            {
              event: 'docs_page_view',
              trigger: t('analytics.description'),
              payload: "{ component_name: 'label', locale }",
            },
            {
              event: 'docs_section_viewed',
              trigger: 'Seção entra no viewport (IntersectionObserver)',
              payload: "{ section_id, component_name: 'label', locale }",
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
            items: [1, 2, 3, 4].map(i => ({
              action: t(`testes.functional.item${i}.action`),
              result: t(`testes.functional.item${i}.result`),
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
            items: [1, 2, 3, 4].map(i => ({
              criterion: t(`testes.accessibility.item${i}`),
              level: 'AA',
              how: '—',
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

  let activeSectionObserver: { disconnect: () => void } | null = null;

  function attachObserver() {
    activeSectionObserver?.disconnect();
    activeSectionObserver = createActiveSectionObserver(
      sectionOrder as unknown as string[],
      (id) => sectionEls[id as keyof typeof sectionEls] ?? null,
      (id) => updateActiveNav(id),
      (id) => track('docs_section_viewed', {
        section_id: id,
        component_name: 'label',
        locale: getLocale(),
      }),
    );
  }
  cleanups.push(() => activeSectionObserver?.disconnect());

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
