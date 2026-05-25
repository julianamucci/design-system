import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createFormField, createFieldset } from '@/components/ui/form';
import { createInput } from '@/components/ui/input';
import { createTextarea } from '@/components/ui/textarea';
import uiTranslations from '@/i18n/ui.json';
import formTranslations from '@shared/content/form/translations.json';

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
const { t, subscribe } = createTranslation(formTranslations as Record<string, unknown>);

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

// ─── createFormDocs ───────────────────────────────────────────────────────────

export function createFormDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'form',
    });
    track('docs_page_view', { component_name: 'form', locale, page_title: `${t('title')} · Design System` });
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
      { id: 'composicoes',  labelKey: 'nav.compositions' },
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
      installNote: 'npx shadcn@latest add form',
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
    'importacao', 'variantes', 'composicoes', 'estados', 'propriedades', 'tokens',
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
            wrap.className = 'nds-stack nds-w-full nds-max-w-sm';

            wrap.appendChild(createFormField({
              label: t('demonstration.labels.nameLabel'),
              input: createInput({ type: 'text', placeholder: t('demonstration.labels.namePlaceholder') }),
              description: t('demonstration.labels.nameDescription'),
            }));

            wrap.appendChild(createFormField({
              label: t('demonstration.labels.emailLabel'),
              input: createInput({ type: 'email', placeholder: t('demonstration.labels.emailPlaceholder') }),
              description: t('demonstration.labels.emailDescription'),
            }));

            const pwdInput = createInput({ type: 'password', placeholder: t('demonstration.labels.passwordPlaceholder') });
            pwdInput.setAttribute('aria-invalid', 'true');
            wrap.appendChild(createFormField({
              label: t('demonstration.labels.passwordLabel'),
              input: pwdInput,
              error: t('demonstration.labels.passwordError'),
            }));

            wrap.appendChild(createFormField({
              label: t('demonstration.labels.bioLabel'),
              input: createTextarea({ placeholder: t('demonstration.labels.bioPlaceholder'), rows: 3 }),
              description: t('demonstration.labels.bioDescription'),
            }));

            wrap.appendChild(createFieldset({
              legend: t('demonstration.labels.groupLegend'),
              children: [
                createFormField({
                  label: t('demonstration.labels.streetLabel'),
                  input: createInput({ type: 'text', placeholder: t('demonstration.labels.streetPlaceholder') }),
                }),
                createFormField({
                  label: t('demonstration.labels.cityLabel'),
                  input: createInput({ type: 'text', placeholder: t('demonstration.labels.cityPlaceholder') }),
                }),
              ],
            }));

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
          ],
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
              doPreviewFactory: () => createFormField({
                label: 'Senha',
                input: createInput({ type: 'password', placeholder: 'Mínimo 8 caracteres' }),
                description: 'Use ao menos 8 caracteres com letras e números.',
              }),
              dontPreviewFactory: () => createInput({ type: 'password', placeholder: 'Senha' }),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: () => {
                const inp = createInput({ type: 'password', placeholder: 'Mínimo 8 caracteres' });
                inp.setAttribute('aria-invalid', 'true');
                return createFormField({
                  label: 'Senha',
                  input: inp,
                  error: 'A senha precisa ter pelo menos 8 caracteres.',
                });
              },
              dontPreviewFactory: () => {
                const inp = createInput({ type: 'password', placeholder: 'Mínimo 8 caracteres' });
                inp.setAttribute('aria-invalid', 'true');
                return createFormField({
                  label: 'Senha',
                  input: inp,
                  error: 'Campo inválido.',
                });
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair3.do'),
              dontCaption: t('doDont.pair3.dont'),
              doPreviewFactory: () => createFieldset({
                legend: 'Endereço',
                children: [
                  createFormField({ label: 'Rua',    input: createInput({ type: 'text', placeholder: 'ex: Av. Paulista, 1000' }) }),
                  createFormField({ label: 'Cidade', input: createInput({ type: 'text', placeholder: 'ex: São Paulo' }) }),
                ],
              }),
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-stack';
                wrap.appendChild(createFormField({ label: 'Rua',    input: createInput({ type: 'text', placeholder: 'ex: Av. Paulista, 1000' }) }));
                wrap.appendChild(createFormField({ label: 'Cidade', input: createInput({ type: 'text', placeholder: 'ex: São Paulo' }) }));
                return wrap;
              },
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('import.basic'),
          code: `import { createFormField, createFieldset } from '@/components/ui/form';`,
        });

      case 'variantes': {
        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              name: 'FormField',
              description: stripHtml(t('variants.note')),
              code: `const field = createFormField({\n  label: 'Email',\n  input: createInput({ type: 'email' }),\n});`,
              previewFactory: () => createFormField({
                label: 'Email',
                input: createInput({ type: 'email', placeholder: 'ex: joao@empresa.com' }),
              }),
            },
            {
              name: 'Fieldset',
              description: 'Agrupamento semântico com legend.',
              code: `const group = createFieldset({\n  legend: 'Endereço',\n  children: [field1, field2],\n});`,
              previewFactory: () => createFieldset({
                legend: 'Endereço',
                children: [
                  createFormField({ label: 'Rua',    input: createInput({ type: 'text', placeholder: 'ex: Av. Paulista, 1000' }) }),
                  createFormField({ label: 'Cidade', input: createInput({ type: 'text', placeholder: 'ex: São Paulo' }) }),
                ],
              }),
            },
          ],
        });
      }

      case 'composicoes': {
        const codeLabelOnly =
          `const field = createFormField({\n` +
          `  label: 'Nome completo',\n` +
          `  input: createInput({ type: 'text', placeholder: 'ex: João da Silva' }),\n` +
          `});`;

        const codeWithDescription =
          `const field = createFormField({\n` +
          `  label: 'Email',\n` +
          `  input: createInput({ type: 'email', placeholder: 'ex: joao@empresa.com' }),\n` +
          `  description: 'Usaremos apenas para contato.',\n` +
          `});`;

        const codeWithError =
          `const input = createInput({ type: 'password', placeholder: 'Mínimo 8 caracteres' });\n` +
          `input.setAttribute('aria-invalid', 'true');\n` +
          `const field = createFormField({\n` +
          `  label: 'Senha',\n` +
          `  input,\n` +
          `  error: 'A senha precisa ter pelo menos 8 caracteres.',\n` +
          `});`;

        const codeFieldset =
          `const group = createFieldset({\n` +
          `  legend: 'Endereço de entrega',\n` +
          `  children: [\n` +
          `    createFormField({ label: 'Rua',    input: createInput({ type: 'text' }) }),\n` +
          `    createFormField({ label: 'Cidade', input: createInput({ type: 'text' }) }),\n` +
          `  ],\n` +
          `});`;

        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'form',
          items: [
            {
              name: t('variants.compositions.labelOnly.name'),
              description: t('variants.compositions.labelOnly.description'),
              useWhen: t('variants.compositions.labelOnly.use'),
              code: codeLabelOnly,
              previewFactory: () => createFormField({
                label: 'Nome completo',
                input: createInput({ type: 'text', placeholder: 'ex: João da Silva' }),
              }),
            },
            {
              name: t('variants.compositions.withDescription.name'),
              description: t('variants.compositions.withDescription.description'),
              useWhen: t('variants.compositions.withDescription.use'),
              code: codeWithDescription,
              previewFactory: () => createFormField({
                label: 'Email',
                input: createInput({ type: 'email', placeholder: 'ex: joao@empresa.com' }),
                description: 'Usaremos apenas para contato.',
              }),
            },
            {
              name: t('variants.compositions.withError.name'),
              description: t('variants.compositions.withError.description'),
              useWhen: t('variants.compositions.withError.use'),
              code: codeWithError,
              previewFactory: () => {
                const inp = createInput({ type: 'password', placeholder: 'Mínimo 8 caracteres' });
                inp.setAttribute('aria-invalid', 'true');
                return createFormField({
                  label: 'Senha',
                  input: inp,
                  error: 'A senha precisa ter pelo menos 8 caracteres.',
                });
              },
            },
            {
              name: t('variants.compositions.fieldset.name'),
              description: t('variants.compositions.fieldset.description'),
              useWhen: t('variants.compositions.fieldset.use'),
              code: codeFieldset,
              previewFactory: () => createFieldset({
                legend: 'Endereço de entrega',
                children: [
                  createFormField({ label: 'Rua',    input: createInput({ type: 'text', placeholder: 'ex: Av. Paulista, 1000' }) }),
                  createFormField({ label: 'Cidade', input: createInput({ type: 'text', placeholder: 'ex: São Paulo' }) }),
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
            { label: t('states.default.label'),         trigger: stripHtml(t('states.default.trigger')),         behavior: t('states.default.behavior') },
            { label: t('states.withDescription.label'), trigger: stripHtml(t('states.withDescription.trigger')), behavior: t('states.withDescription.behavior') },
            { label: t('states.withError.label'),       trigger: stripHtml(t('states.withError.trigger')),       behavior: t('states.withError.behavior') },
            { label: t('states.disabled.label'),        trigger: stripHtml(t('states.disabled.trigger')),        behavior: t('states.disabled.behavior') },
            { label: t('states.fieldset.label'),        trigger: stripHtml(t('states.fieldset.trigger')),        behavior: t('states.fieldset.behavior') },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createFormField(options)
export type FormFieldOptions = {
  label?: string;       // Texto do rótulo
  input: HTMLElement;   // Controle (input, textarea, select, checkbox)
  description?: string; // Texto de apoio
  error?: string;       // Mensagem de erro (aria-live="polite")
  class?: string;       // Classes adicionais
};

// createFieldset(options)
export type FieldsetOptions = {
  legend?: string;          // Texto do <legend>
  children?: HTMLElement[]; // Campos dentro do agrupamento
  class?: string;           // Classes adicionais
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
              title: t('props.fieldTitle'),
              cols: propsCols,
              items: [
                { name: 'label',       type: 'string',      defaultValue: '—', required: 'Não', description: stripHtml(t('props.table.label')) },
                { name: 'input',       type: 'HTMLElement', defaultValue: '—', required: 'Sim', description: stripHtml(t('props.table.input')) },
                { name: 'description', type: 'string',      defaultValue: '—', required: 'Não', description: stripHtml(t('props.table.description_prop')) },
                { name: 'error',       type: 'string',      defaultValue: '—', required: 'Não', description: stripHtml(t('props.table.error')) },
                { name: 'class',       type: 'string',      defaultValue: '—', required: 'Não', description: stripHtml(t('props.table.className')) },
              ],
            },
            {
              title: t('props.fieldsetTitle'),
              cols: propsCols,
              items: [
                { name: 'legend',   type: 'string',          defaultValue: '—',  required: 'Não', description: stripHtml(t('props.table.legend')) },
                { name: 'children', type: 'HTMLElement[]',   defaultValue: '[]', required: 'Não', description: stripHtml(t('props.table.children')) },
                { name: 'class',    type: 'string',          defaultValue: '—',  required: 'Não', description: stripHtml(t('props.table.className')) },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: stripHtml(t('props.extensibility')),
        });
      }

      case 'tokens': {
        const customizationCode = `/* Em styles.css — sobrescrever tokens do form */
:root {
  --spacing-1-5: 0.375rem;     /* gap entre label, controle, descrição e erro */
  --spacing-4: 1rem;           /* gap entre campos dentro do fieldset */
  --foreground: 222 84% 5%;    /* cor do label e legend */
  --muted-foreground: 215 16% 47%; /* cor da descrição */
  --destructive: 0 84% 60%;    /* cor do erro */
  --font-weight-medium: 500;   /* peso do label */
}`;

        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--spacing-1-5',      value: '.nds-form-field',       description: t('tokens.table.fieldGap') },
            { token: '--foreground',       value: '.nds-form-label',       description: t('tokens.table.labelColor') },
            { token: '--font-weight-medium', value: '.nds-form-label',     description: t('tokens.table.labelWeight') },
            { token: '--muted-foreground', value: '.nds-form-description', description: t('tokens.table.descriptionColor') },
            { token: '--destructive',      value: '.nds-form-error',       description: t('tokens.table.errorColor') },
            { token: '--spacing-4',        value: '.nds-form-fieldset',    description: t('tokens.table.fieldsetGap') },
            { token: '--foreground',       value: '.nds-form-legend',      description: t('tokens.table.legendColor') },
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
            { name: 'Input',    description: t('related.input'),    path: '?path=/docs/ui-input--docs' },
            { name: 'Textarea', description: t('related.textarea'), path: '?path=/docs/ui-textarea--docs' },
            { name: 'Select',   description: t('related.select'),   path: '?path=/docs/ui-select--docs' },
            { name: 'Checkbox', description: t('related.checkbox'), path: '?path=/docs/ui-checkbox--docs' },
            { name: 'Label',    description: t('related.label'),    path: '?path=/docs/ui-label--docs' },
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
        component_name: 'form',
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
