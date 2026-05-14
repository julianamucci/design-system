import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createInput } from '@/components/ui/input';
import uiTranslations from '@/i18n/ui.json';
import inputTranslations from '@shared/content/input/translations.json';

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
  createDocsPageLayout,
} from '@/components/docs/shared/sections';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);
const { t, subscribe } = createTranslation(inputTranslations as Record<string, unknown>);

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

function buildDemoInput(opts: {
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  ariaInvalid?: boolean;
  labelText?: string;
  errorText?: string;
}): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'flex flex-col gap-1.5 w-full';

  if (opts.labelText) {
    const label = document.createElement('label');
    label.className = 'text-sm font-medium text-foreground';
    label.textContent = opts.labelText;
    wrapper.appendChild(label);
  }

  const input = createInput({
    type: opts.type ?? 'text',
    placeholder: opts.placeholder,
    disabled: opts.disabled,
  });

  if (opts.ariaInvalid) {
    input.setAttribute('aria-invalid', 'true');
  }

  wrapper.appendChild(input);

  if (opts.errorText) {
    const error = document.createElement('p');
    error.className = 'text-xs text-destructive';
    error.textContent = opts.errorText;
    wrapper.appendChild(error);
  }

  return wrapper;
}

// ─── createInputDocs ──────────────────────────────────────────────────────────

export function createInputDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'input',
    });
    track('docs_page_view', { component_name: 'input', locale, page_title: `${t('title')} · Design System` });
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
      installNote: 'npx shadcn@latest add input',
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
            wrap.className = 'w-full space-y-4 max-w-sm';

            wrap.appendChild(buildDemoInput({
              type: 'text',
              labelText: t('demonstration.labels.defaultLabel'),
              placeholder: t('demonstration.labels.defaultPlaceholder'),
            }));
            wrap.appendChild(buildDemoInput({
              type: 'email',
              labelText: t('demonstration.labels.emailLabel'),
              placeholder: t('demonstration.labels.emailPlaceholder'),
            }));
            wrap.appendChild(buildDemoInput({
              type: 'password',
              labelText: t('demonstration.labels.passwordLabel'),
              placeholder: t('demonstration.labels.passwordPlaceholder'),
            }));
            wrap.appendChild(buildDemoInput({
              type: 'text',
              labelText: t('demonstration.labels.disabledLabel'),
              placeholder: t('demonstration.labels.disabledPlaceholder'),
              disabled: true,
            }));
            wrap.appendChild(buildDemoInput({
              type: 'email',
              labelText: t('demonstration.labels.errorLabel'),
              placeholder: t('demonstration.labels.errorPlaceholder'),
              ariaInvalid: true,
              errorText: t('demonstration.labels.errorMessage'),
            }));

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
              t('usage.guidelines.item5'),
            ],
          },
          scenarios: {
            title: t('usage.scenarios.title'),
            cols: {
              scenario: t('usage.scenarios.cols.scenario'),
              use: t('usage.scenarios.cols.use'),
              alternative: t('usage.scenarios.cols.alternative'),
            },
            items: [1, 2, 3, 4, 5, 6].map(i => ({
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
                const wrapper = document.createElement('div');
                wrapper.className = 'flex flex-col gap-1.5 w-full';
                const label = document.createElement('label');
                label.className = 'text-sm font-medium text-foreground';
                label.textContent = 'Email';
                const input = createInput({ type: 'email', placeholder: 'ex: joao@empresa.com' });
                wrapper.appendChild(label);
                wrapper.appendChild(input);
                return wrapper;
              },
              dontPreviewFactory: () => {
                const wrapper = document.createElement('div');
                wrapper.className = 'flex flex-col gap-1.5 w-full';
                const label = document.createElement('label');
                label.className = 'text-sm font-medium text-foreground';
                label.textContent = 'Email';
                const input = createInput({ type: 'email', placeholder: 'Digite seu email' });
                wrapper.appendChild(label);
                wrapper.appendChild(input);
                return wrapper;
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: () => {
                const wrapper = document.createElement('div');
                wrapper.className = 'flex flex-col gap-1.5 w-full';
                const label = document.createElement('label');
                label.className = 'text-sm font-medium text-foreground';
                label.textContent = 'Email';
                const input = createInput({ type: 'email', placeholder: 'ex: joao@empresa.com' });
                wrapper.appendChild(label);
                wrapper.appendChild(input);
                return wrapper;
              },
              dontPreviewFactory: () => {
                const wrapper = document.createElement('div');
                wrapper.className = 'flex flex-col gap-1.5 w-full';
                const label = document.createElement('label');
                label.className = 'text-sm font-medium text-foreground';
                label.textContent = 'Email';
                const input = createInput({ type: 'text', placeholder: 'ex: joao@empresa.com' });
                wrapper.appendChild(label);
                wrapper.appendChild(input);
                return wrapper;
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair3.do'),
              dontCaption: t('doDont.pair3.dont'),
              doPreviewFactory: () => {
                const wrapper = document.createElement('div');
                wrapper.className = 'flex flex-col gap-1.5 w-full';
                const label = document.createElement('label');
                label.className = 'text-sm font-medium text-foreground';
                label.textContent = 'Nome completo';
                const input = createInput({ type: 'text', placeholder: 'ex: João da Silva' });
                wrapper.appendChild(label);
                wrapper.appendChild(input);
                return wrapper;
              },
              dontPreviewFactory: () => {
                return createInput({ type: 'text', placeholder: 'Nome completo' });
              },
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('import.basic'),
          code: `import { createInput } from '@/components/ui/input';`,
        });

      case 'variantes': {
        const codeText = `const input = createInput({ type: 'text', placeholder: 'ex: João da Silva' });`;
        const codeEmail = `const input = createInput({ type: 'email', placeholder: 'ex: joao@empresa.com' });`;
        const codePassword = `const input = createInput({ type: 'password', placeholder: 'Mínimo 8 caracteres' });`;
        const codeNumber = `const input = createInput({ type: 'number', placeholder: '0' });`;
        const codeFile = `const input = createInput({ type: 'file' });`;

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              name: 'text',
              description: stripHtml(t('variants.types.text')),
              code: codeText,
              previewFactory: () => createInput({ type: 'text', placeholder: 'ex: João da Silva' }),
            },
            {
              name: 'email',
              description: stripHtml(t('variants.types.email')),
              code: codeEmail,
              previewFactory: () => createInput({ type: 'email', placeholder: 'ex: joao@empresa.com' }),
            },
            {
              name: 'password',
              description: stripHtml(t('variants.types.password')),
              code: codePassword,
              previewFactory: () => createInput({ type: 'password', placeholder: 'Mínimo 8 caracteres' }),
            },
            {
              name: 'number',
              description: stripHtml(t('variants.types.number')),
              code: codeNumber,
              previewFactory: () => createInput({ type: 'number', placeholder: '0' }),
            },
            {
              name: 'file',
              description: stripHtml(t('variants.types.file')),
              code: codeFile,
              previewFactory: () => createInput({ type: 'file' }),
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
            { label: t('states.default.label'), trigger: stripHtml(t('states.default.trigger')), behavior: t('states.default.behavior') },
            { label: t('states.focus.label'),   trigger: stripHtml(t('states.focus.trigger')),   behavior: t('states.focus.behavior') },
            { label: t('states.disabled.label'),trigger: stripHtml(t('states.disabled.trigger')),behavior: t('states.disabled.behavior') },
            { label: t('states.error.label'),   trigger: stripHtml(t('states.error.trigger')),   behavior: t('states.error.behavior') },
            { label: t('states.file.label'),    trigger: stripHtml(t('states.file.trigger')),    behavior: t('states.file.behavior') },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createInput(options)
export type InputOptions = {
  type?: string;         // HTML input type ('text' | 'email' | 'password' | 'number' | 'file' | ...)
  placeholder?: string; // Texto de exemplo do formato esperado
  disabled?: boolean;   // Desabilita o campo
  value?: string;       // Valor inicial
  class?: string;       // Classes adicionais
  id?: string;          // ID do elemento
  name?: string;        // name do campo
};`;

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
              title: t('props.inputTitle'),
              cols: propsCols,
              items: [
                { name: 'type',        type: 'string',  defaultValue: '"text"', required: 'Não', description: stripHtml(t('props.table.type_prop')) },
                { name: 'placeholder', type: 'string',  defaultValue: '—',     required: 'Não', description: t('props.table.placeholder') },
                { name: 'disabled',    type: 'boolean', defaultValue: 'false', required: 'Não', description: t('props.table.disabled') },
                { name: 'value',       type: 'string',  defaultValue: '—',     required: 'Não', description: 'Valor inicial do campo.' },
                { name: 'class',       type: 'string',  defaultValue: '—',     required: 'Não', description: t('props.table.className') },
                { name: 'id',          type: 'string',  defaultValue: '—',     required: 'Não', description: 'ID do elemento input.' },
                { name: 'name',        type: 'string',  defaultValue: '—',     required: 'Não', description: 'Atributo name do input para uso em formulários.' },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: 'O Input Basecoat aceita todos os atributos HTML nativos do input via setAttribute() após a criação. Use a prop class para customizações pontuais com tokens do projeto.',
        });
      }

      case 'tokens': {
        const customizationCode = `/* Em styles.css — sobrescrever tokens do input */
:root {
  --height-default: 2.5rem;   /* altura padrão do input */
  --radius-input: 0.375rem;   /* border-radius do input */
  --input: 214 32% 91%;       /* cor da borda padrão */
  --ring: 222 84% 5%;         /* cor do ring de foco */
  --destructive: 0 84% 60%;   /* cor da borda de erro */
}`;

        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--height-default', value: 'h-(--height-default)', description: t('tokens.table.height') },
            { token: '--radius-input',   value: 'rounded-(--radius-input)', description: t('tokens.table.radius') },
            { token: '--input',          value: 'border-input',          description: t('tokens.table.border') },
            { token: '--ring',           value: 'ring-ring',             description: t('tokens.table.ring') },
            { token: '--destructive',    value: 'border-destructive',    description: t('tokens.table.borderError') },
            { token: '--destructive',    value: 'ring-destructive/20',   description: t('tokens.table.ringError') },
            { token: '--input',          value: 'bg-input/50',           description: t('tokens.table.bgDisabled') },
            { token: '--muted-foreground', value: 'text-muted-foreground', description: t('tokens.table.placeholder') },
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
          keyboardTitle: tNav('common.keyboard'),
          keyboardItems: [
            { key: 'Tab',       description: t('accessibility.keyboard.tab') },
            { key: 'Shift+Tab', description: t('accessibility.keyboard.shiftTab') },
            { key: 'Typing',    description: t('accessibility.keyboard.typing') },
            { key: 'Escape',    description: t('accessibility.keyboard.escape') },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: 'Textarea',  description: t('related.textarea'),  path: '?path=/docs/ui-textarea--docs' },
            { name: 'InputOTP',  description: t('related.inputOTP'),  path: '?path=/docs/ui-inputotp--docs' },
            { name: 'Select',    description: t('related.select'),    path: '?path=/docs/ui-select--docs' },
            { name: 'Form',      description: t('related.form'),      path: '?path=/docs/ui-form--docs' },
            { name: 'Label',     description: t('related.label'),     path: '?path=/docs/ui-label--docs' },
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
            { title: '', content: t('notes.tip5') },
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
            { event: t('analytics.table.fieldFocus'),    trigger: t('analytics.table.fieldFocusTrigger'),    payload: t('analytics.table.fieldFocusPayload') },
            { event: t('analytics.table.fieldBlur'),     trigger: t('analytics.table.fieldBlurTrigger'),     payload: t('analytics.table.fieldBlurPayload') },
            { event: t('analytics.table.fieldError'),    trigger: t('analytics.table.fieldErrorTrigger'),    payload: t('analytics.table.fieldErrorPayload') },
            { event: t('analytics.table.pageView'),      trigger: t('analytics.table.pageViewTrigger'),      payload: t('analytics.table.pageViewPayload') },
            { event: t('analytics.table.sectionViewed'), trigger: t('analytics.table.sectionViewedTrigger'), payload: t('analytics.table.sectionViewedPayload') },
            { event: t('analytics.table.langSwitch'),    trigger: t('analytics.table.langSwitchTrigger'),    payload: t('analytics.table.langSwitchPayload') },
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
            items: [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({
              action: t(`testes.functional.item${i}.action`),
              result: t(`testes.functional.item${i}.result`),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
            items: [1, 2, 3, 4, 5].map(i => ({
              criterion: t(`testes.accessibility.item${i}`),
              level: 'AA',
              how: 'axe-core + manual',
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
        component_name: 'input',
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
