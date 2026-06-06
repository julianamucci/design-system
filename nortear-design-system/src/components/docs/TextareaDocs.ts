import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createTextarea } from '@/components/ui/textarea';
import { createButton } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import textareaTranslations from '@shared/content/textarea/translations.json';

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
const { t, subscribe } = createTranslation(textareaTranslations as Record<string, unknown>);

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

interface FieldOpts {
  id: string;
  labelText: string;
  placeholder?: string;
  helpText?: string;
  value?: string;
  disabled?: boolean;
  readOnly?: boolean;
  ariaInvalid?: boolean;
  errorText?: string;
  maxLength?: number;
  resize?: 'y' | 'none' | 'free';
  rows?: number;
  trackName?: string;
}

function buildField(opts: FieldOpts): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'nds-stack nds-w-full nds-max-w-md';
  wrapper.dataset.spacing = 'xs';

  const label = document.createElement('label');
  label.htmlFor = opts.id;
  label.className = 'nds-text-body nds-font-medium nds-text-foreground';
  label.textContent = opts.labelText;
  wrapper.appendChild(label);

  const resizeClass =
    opts.resize === 'none' ? 'resize-none' :
    opts.resize === 'free' ? 'resize' :
    'resize-y';

  const textarea = createTextarea({
    id: opts.id,
    placeholder: opts.placeholder,
    disabled: opts.disabled,
    value: opts.value,
    rows: opts.rows,
    class: `${resizeClass} min-h-[120px]`,
  });

  if (opts.readOnly) textarea.readOnly = true;
  if (opts.ariaInvalid) textarea.setAttribute('aria-invalid', 'true');
  if (opts.maxLength !== undefined) textarea.maxLength = opts.maxLength;

  wrapper.appendChild(textarea);

  // Help + counter row
  const hasCounter = opts.maxLength !== undefined;
  const hasHelp = !!opts.helpText;

  if (hasCounter || hasHelp) {
    const row = document.createElement('div');
    row.className = 'nds-cluster nds-text-caption nds-text-muted-foreground';
    row.dataset.justify = 'between';
    row.dataset.spacing = 'sm';
    row.style.alignItems = 'flex-start';

    const helpSpan = document.createElement('span');
    if (hasHelp) helpSpan.textContent = opts.helpText!;
    row.appendChild(helpSpan);

    if (hasCounter) {
      const counter = document.createElement('span');
      counter.setAttribute('aria-live', 'polite');
      const initial = textarea.value.length;
      const max = opts.maxLength!;
      counter.textContent = `${initial}/${max}`;
      counter.setAttribute('aria-label', `${initial} de ${max} caracteres usados`);
      counter.className = 'tabular-nums nds-shrink-0';
      row.appendChild(counter);

      textarea.addEventListener('input', () => {
        const len = textarea.value.length;
        counter.textContent = `${len}/${max}`;
        counter.setAttribute('aria-label', `${len} de ${max} caracteres usados`);
      });
    }

    wrapper.appendChild(row);
  }

  if (opts.errorText) {
    const err = document.createElement('p');
    err.id = `${opts.id}-error`;
    err.className = 'nds-text-caption nds-text-destructive';
    err.textContent = opts.errorText;
    textarea.setAttribute('aria-describedby', `${opts.id}-error`);
    wrapper.appendChild(err);
  }

  if (opts.trackName) {
    textarea.addEventListener('blur', () => {
      if (textarea.value.length > 0) {
        track('field_blur', {
          component: 'textarea',
          field_name: opts.trackName!,
          location: 'docs-demo',
        });
      }
    });
  }

  return wrapper;
}

// ─── createTextareaDocs ───────────────────────────────────────────────────────

export function createTextareaDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'textarea',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/form' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', { component_name: 'textarea', locale, page_title: `${t('title')} · Design System` });
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
      installNote: 'npx shadcn@latest add textarea',
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
            wrap.className = 'nds-stack nds-w-full';
            wrap.dataset.spacing = 'md';

            wrap.appendChild(buildField({
              id: 'demo-description',
              labelText: t('demonstration.labels.descriptionLabel'),
              placeholder: t('demonstration.labels.descriptionPlaceholder'),
              helpText: t('demonstration.labels.descriptionHelp'),
              maxLength: 500,
              trackName: 'description',
            }));

            wrap.appendChild(buildField({
              id: 'demo-bio',
              labelText: t('demonstration.labels.bioLabel'),
              placeholder: t('demonstration.labels.bioPlaceholder'),
              trackName: 'bio',
            }));

            wrap.appendChild(buildField({
              id: 'demo-feedback',
              labelText: t('demonstration.labels.feedbackLabel'),
              placeholder: t('demonstration.labels.feedbackPlaceholder'),
              resize: 'none',
              maxLength: 280,
              trackName: 'feedback',
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
            ],
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
              t('usage.dont.item4'),
            ],
          },
        });

      case 'do-dont': {
        return createDocsDoDont({
          title: t('doDont.title'),
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair1.do'),
              dontCaption: t('doDont.pair1.dont'),
              doPreviewFactory: () => buildField({
                id: 'dodont-do-counter',
                labelText: t('demonstration.labels.descriptionLabel'),
                placeholder: t('demonstration.labels.descriptionPlaceholder'),
                maxLength: 500,
              }),
              dontPreviewFactory: () => {
                // Sem contador apesar do maxLength
                const wrapper = document.createElement('div');
                wrapper.className = 'nds-stack nds-w-full nds-max-w-md';
  wrapper.dataset.spacing = 'xs';
                const label = document.createElement('label');
                label.htmlFor = 'dodont-dont-counter';
                label.className = 'nds-text-body nds-font-medium nds-text-foreground';
                label.textContent = t('demonstration.labels.descriptionLabel');
                const ta = createTextarea({
                  id: 'dodont-dont-counter',
                  placeholder: t('demonstration.labels.descriptionPlaceholder'),
                  class: 'resize-y min-h-[120px]',
                });
                ta.maxLength = 500;
                wrapper.append(label, ta);
                return wrapper;
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: () => buildField({
                id: 'dodont-do-resize',
                labelText: t('demonstration.labels.bioLabel'),
                placeholder: t('demonstration.labels.bioPlaceholder'),
                resize: 'y',
              }),
              dontPreviewFactory: () => buildField({
                id: 'dodont-dont-resize',
                labelText: t('demonstration.labels.bioLabel'),
                placeholder: t('demonstration.labels.bioPlaceholder'),
                resize: 'free',
              }),
            },
          ],
        });
      }

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: 'Importação do factory custom (Nortear):',
          code: `import { createTextarea, type TextareaOptions } from '@/components/ui/textarea';`,
          secondaryDescription: 'Uso básico com label + contador acessível:',
          secondaryCode: `const id = 'description';
const max = 500;

const label = document.createElement('label');
label.htmlFor = id;
label.textContent = 'Descrição';

const textarea = createTextarea({
  id,
  placeholder: 'ex: Descreva o produto...',
  class: 'resize-y min-h-[120px]',
});
textarea.maxLength = max;

const counter = document.createElement('span');
counter.setAttribute('aria-live', 'polite');
counter.setAttribute('aria-label', \`0 de \${max} caracteres usados\`);
counter.textContent = \`0/\${max}\`;

textarea.addEventListener('input', () => {
  const len = textarea.value.length;
  counter.textContent = \`\${len}/\${max}\`;
  counter.setAttribute('aria-label', \`\${len} de \${max} caracteres usados\`);
});`,
        });

      case 'variantes': {
        return createDocsVariants({
          id: 'variantes',
          title: t('variants.title'),
          componentSlug: 'textarea',
          items: [
            {
              name: stripHtml(t('variants.items.default')),
              description: stripHtml(t('variants.styles.default')),
              code: `const textarea = createTextarea({
  id: 'description',
  placeholder: 'ex: Descreva o produto...',
  class: 'resize-y min-h-[120px]',
});`,
              previewFactory: () => buildField({
                id: 'v-default',
                labelText: t('demonstration.labels.descriptionLabel'),
                placeholder: t('demonstration.labels.descriptionPlaceholder'),
              }),
            },
            {
              name: stripHtml(t('variants.items.withCounter')),
              description: stripHtml(t('variants.styles.withCounter')),
              code: `const textarea = createTextarea({
  id: 'description',
  placeholder: 'ex: Descreva o produto...',
  class: 'resize-y min-h-[120px]',
});
textarea.maxLength = 500;

// Contador acessível
const counter = document.createElement('span');
counter.setAttribute('aria-live', 'polite');
counter.setAttribute('aria-label', '0 de 500 caracteres usados');
counter.textContent = '0/500';

textarea.addEventListener('input', () => {
  const len = textarea.value.length;
  counter.textContent = \`\${len}/500\`;
  counter.setAttribute('aria-label', \`\${len} de 500 caracteres usados\`);
});`,
              previewFactory: () => buildField({
                id: 'v-counter',
                labelText: t('demonstration.labels.descriptionLabel'),
                placeholder: t('demonstration.labels.descriptionPlaceholder'),
                maxLength: 500,
              }),
            },
            {
              name: stripHtml(t('variants.items.noResize')),
              description: stripHtml(t('variants.styles.noResize')),
              code: `const textarea = createTextarea({
  id: 'feedback',
  placeholder: 'O que poderíamos melhorar?',
  class: 'resize-none min-h-[120px]',
});`,
              previewFactory: () => buildField({
                id: 'v-no-resize',
                labelText: t('demonstration.labels.feedbackLabel'),
                placeholder: t('demonstration.labels.feedbackPlaceholder'),
                resize: 'none',
              }),
            },
          ],
        });
      }

      case 'composicoes': {
        function createTextareaField(opts: {
          labelText: string;
          labelFor: string;
          textareaEl: HTMLTextAreaElement;
          hintText?: string;
          errorText?: string;
          maxLength?: number;
        }): HTMLElement {
          const wrapper = document.createElement('div');
          wrapper.className = 'nds-stack nds-w-full nds-max-w-md';
  wrapper.dataset.spacing = 'xs';

          const label = document.createElement('label');
          label.htmlFor = opts.labelFor;
          label.className = 'nds-text-body nds-font-medium nds-text-foreground';
          label.textContent = opts.labelText;

          opts.textareaEl.id = opts.labelFor;

          wrapper.appendChild(label);
          wrapper.appendChild(opts.textareaEl);

          const hasHint = !!opts.hintText;
          const hasCounter = opts.maxLength !== undefined;

          if (hasHint || hasCounter) {
            const row = document.createElement('div');
            row.className = 'nds-cluster nds-text-caption nds-text-muted-foreground';
    row.dataset.justify = 'between';
    row.dataset.spacing = 'sm';
    row.style.alignItems = 'flex-start';

            const hintSpan = document.createElement('span');
            if (hasHint) hintSpan.textContent = opts.hintText!;
            row.appendChild(hintSpan);

            if (hasCounter) {
              opts.textareaEl.maxLength = opts.maxLength!;
              const counter = document.createElement('span');
              const max = opts.maxLength!;
              counter.setAttribute('aria-live', 'polite');
              counter.setAttribute('aria-label', `0 de ${max} caracteres usados`);
              counter.className = 'tabular-nums nds-shrink-0';
              counter.textContent = `0/${max}`;
              opts.textareaEl.addEventListener('input', () => {
                const len = opts.textareaEl.value.length;
                counter.textContent = `${len}/${max}`;
                counter.setAttribute('aria-label', `${len} de ${max} caracteres usados`);
              });
              row.appendChild(counter);
            }

            wrapper.appendChild(row);
          }

          if (opts.errorText) {
            const error = document.createElement('p');
            error.className = 'nds-text-caption nds-text-destructive';
            error.id = `${opts.labelFor}-error`;
            error.textContent = opts.errorText;
            opts.textareaEl.setAttribute('aria-describedby', `${opts.labelFor}-error`);
            wrapper.appendChild(error);
          }

          return wrapper;
        }

        const codeWithLabel = `const textarea = createTextarea({
  placeholder: 'ex: Descreva o produto...',
  class: 'resize-y min-h-[120px]',
});

const wrapper = document.createElement('div');
wrapper.className = 'nds-stack nds-w-full nds-max-w-md';
wrapper.dataset.spacing = 'xs';

const label = document.createElement('label');
label.htmlFor = 'description';
label.textContent = 'Descrição';
textarea.id = 'description';

wrapper.append(label, textarea);`;

        const codeWithHint = `const textarea = createTextarea({
  placeholder: 'ex: Descreva o produto...',
  class: 'resize-y min-h-[120px]',
});

// ... label + textarea ...

const hint = document.createElement('span');
hint.className = 'nds-text-caption nds-text-muted-foreground';
hint.textContent = 'Descreva o produto com clareza, destacando os principais atributos.';
wrapper.appendChild(hint);`;

        const codeWithCounter = `const max = 500;
const textarea = createTextarea({
  placeholder: 'ex: Descreva o produto...',
  class: 'resize-y min-h-[120px]',
});
textarea.maxLength = max;

const counter = document.createElement('span');
counter.setAttribute('aria-live', 'polite');
counter.setAttribute('aria-label', \`0 de \${max} caracteres usados\`);
counter.textContent = \`0/\${max}\`;

textarea.addEventListener('input', () => {
  const len = textarea.value.length;
  counter.textContent = \`\${len}/\${max}\`;
  counter.setAttribute('aria-label', \`\${len} de \${max} caracteres usados\`);
});`;

        const codeWithError = `const textarea = createTextarea({
  placeholder: 'ex: Descreva o produto...',
  class: 'resize-y min-h-[120px]',
});
textarea.setAttribute('aria-invalid', 'true');

const error = document.createElement('p');
error.id = 'description-error';
error.className = 'nds-text-caption nds-text-destructive';
error.textContent = 'A descrição é obrigatória e deve ter pelo menos 20 caracteres.';
textarea.setAttribute('aria-describedby', 'description-error');`;

        const codeInForm = `const form = document.createElement('form');
form.className = 'nds-stack nds-w-full nds-max-w-md';
form.dataset.spacing = 'md';
form.setAttribute('aria-label', 'Formulário de feedback');

const textarea = createTextarea({
  name: 'feedback',
  placeholder: 'O que poderíamos melhorar?',
  class: 'resize-y min-h-[120px]',
});
textarea.maxLength = 280;

const submit = createButton({ label: 'Enviar', type: 'submit', variant: 'default' });

const result = document.createElement('p');
result.setAttribute('aria-live', 'polite');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(form);
  result.textContent = \`Enviado: feedback="\${String(data.get('feedback') ?? '')}"\`;
});`;

        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'textarea',
          items: [
            {
              name: t('variants.compositions.withLabel.name'),
              description: t('variants.compositions.withLabel.description'),
              useWhen: t('variants.compositions.withLabel.use'),
              code: codeWithLabel,
              previewFactory: () => {
                const ta = createTextarea({
                  placeholder: 'ex: Descreva o produto...',
                  class: 'resize-y min-h-[120px]',
                });
                return createTextareaField({
                  labelText: 'Descrição',
                  labelFor: 'comp-label',
                  textareaEl: ta,
                });
              },
            },
            {
              name: t('variants.compositions.withHint.name'),
              description: t('variants.compositions.withHint.description'),
              useWhen: t('variants.compositions.withHint.use'),
              code: codeWithHint,
              previewFactory: () => {
                const ta = createTextarea({
                  placeholder: 'ex: Descreva o produto...',
                  class: 'resize-y min-h-[120px]',
                });
                return createTextareaField({
                  labelText: 'Descrição',
                  labelFor: 'comp-hint',
                  textareaEl: ta,
                  hintText: 'Descreva o produto com clareza, destacando os principais atributos.',
                });
              },
            },
            {
              name: t('variants.compositions.withCounter.name'),
              description: t('variants.compositions.withCounter.description'),
              useWhen: t('variants.compositions.withCounter.use'),
              code: codeWithCounter,
              previewFactory: () => {
                const ta = createTextarea({
                  placeholder: 'ex: Descreva o produto em até 500 caracteres...',
                  class: 'resize-y min-h-[120px]',
                });
                return createTextareaField({
                  labelText: 'Descrição',
                  labelFor: 'comp-counter',
                  textareaEl: ta,
                  hintText: 'Descreva o produto com clareza.',
                  maxLength: 500,
                });
              },
            },
            {
              name: t('variants.compositions.withError.name'),
              description: t('variants.compositions.withError.description'),
              useWhen: t('variants.compositions.withError.use'),
              code: codeWithError,
              previewFactory: () => {
                const ta = createTextarea({
                  placeholder: 'ex: Descreva o produto...',
                  class: 'resize-y min-h-[120px]',
                });
                ta.setAttribute('aria-invalid', 'true');
                return createTextareaField({
                  labelText: 'Descrição',
                  labelFor: 'comp-error',
                  textareaEl: ta,
                  errorText: 'A descrição é obrigatória e deve ter pelo menos 20 caracteres.',
                });
              },
            },
            {
              name: t('variants.compositions.inForm.name'),
              description: t('variants.compositions.inForm.description'),
              useWhen: t('variants.compositions.inForm.use'),
              code: codeInForm,
              previewFactory: () => {
                const form = document.createElement('form');
                form.className = 'nds-stack nds-w-full nds-max-w-md';
form.dataset.spacing = 'md';
                form.setAttribute('aria-label', 'Formulário de feedback');

                const textarea = createTextarea({
                  name: 'feedback',
                  placeholder: 'O que poderíamos melhorar?',
                  class: 'resize-y min-h-[120px]',
                });

                const field = createTextareaField({
                  labelText: 'Feedback',
                  labelFor: 'comp-form-feedback',
                  textareaEl: textarea,
                  hintText: 'Sua opinião nos ajuda a evoluir.',
                  maxLength: 280,
                });

                const submitBtn = createButton({
                  label: 'Enviar',
                  type: 'submit',
                  variant: 'default',
                });

                const result = document.createElement('p');
                result.className = 'nds-text-caption nds-text-muted-foreground';
                result.setAttribute('aria-live', 'polite');

                form.addEventListener('submit', (e) => {
                  e.preventDefault();
                  const data = new FormData(form);
                  result.textContent = `Enviado: feedback="${String(data.get('feedback') ?? '')}"`;
                });

                form.append(field, submitBtn, result);
                return form;
              },
            },
          ],
        });
      }

      case 'estados':
        return createDocsStates({
          title: t('states.title'),
          cols: {
            state: 'Estado',
            trigger: 'Quando ocorre',
            behavior: 'Comportamento',
          },
          items: [
            { label: t('states.items.default'),  trigger: '—',                                       behavior: stripHtml(t('states.descriptions.default'))  },
            { label: t('states.items.focus'),    trigger: 'Tab ou click no textarea',                behavior: stripHtml(t('states.descriptions.focus'))    },
            { label: t('states.items.filled'),   trigger: 'Usuário digita conteúdo',                 behavior: stripHtml(t('states.descriptions.filled'))   },
            { label: t('states.items.disabled'), trigger: 'options.disabled === true',               behavior: stripHtml(t('states.descriptions.disabled'))},
            { label: t('states.items.invalid'),  trigger: 'aria-invalid="true" no textarea',         behavior: stripHtml(t('states.descriptions.invalid')) },
            { label: t('states.items.readonly'), trigger: 'textarea.readOnly = true',                behavior: stripHtml(t('states.descriptions.readonly')) },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createTextarea(options) — Nortear
export type TextareaOptions = {
  placeholder?: string;
  disabled?: boolean;
  value?: string;
  rows?: number;
  class?: string;
  id?: string;
  name?: string;
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
              title: 'createTextarea(options) — Nortear',
              cols: propsCols,
              items: [
                {
                  name: 'placeholder',
                  type: 'string',
                  defaultValue: '—',
                  required: 'Não',
                  description: stripHtml(t('props.table.placeholder.description')),
                },
                {
                  name: 'value',
                  type: 'string',
                  defaultValue: '—',
                  required: 'Não',
                  description: 'Valor inicial não-controlado do textarea. Para atualizar após criação, atribua diretamente em `textarea.value`.',
                },
                {
                  name: 'rows',
                  type: 'number',
                  defaultValue: '—',
                  required: 'Não',
                  description: stripHtml(t('props.table.rows.description')),
                },
                {
                  name: 'disabled',
                  type: 'boolean',
                  defaultValue: 'false',
                  required: 'Não',
                  description: stripHtml(t('props.table.disabled.description')),
                },
                {
                  name: 'class',
                  type: 'string',
                  defaultValue: '—',
                  required: 'Não',
                  description: stripHtml(t('props.table.className.description')),
                },
                {
                  name: 'id',
                  type: 'string',
                  defaultValue: '—',
                  required: 'Recomendado',
                  description: 'ID do elemento — obrigatório para vincular com `<label htmlFor>` (acessibilidade).',
                },
                {
                  name: 'name',
                  type: 'string',
                  defaultValue: '—',
                  required: 'Condicional',
                  description: 'Atributo `name` para envio em `<form>` HTML nativo (FormData coleta automaticamente).',
                },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: 'Divergências da factory custom (Nortear)',
          extensibilityNotes:
            'O factory Nortear é um wrapper enxuto de `<textarea>` HTML nativo e diverge das libs upstream nos seguintes pontos: ' +
            '(1) Não há prop `onChange` — escute `addEventListener("input"|"change", ...)` diretamente no elemento retornado. ' +
            '(2) Não há prop `readOnly` no factory — atribua `textarea.readOnly = true` após criar. ' +
            '(3) Não há prop `maxLength` no factory — atribua `textarea.maxLength = 500` após criar. ' +
            '(4) Não há prop `aria-invalid` no factory — use `textarea.setAttribute("aria-invalid", "true")`. ' +
            '(5) Todos os atributos HTML nativos do `<textarea>` (autocomplete, spellcheck, wrap, minLength, etc) são aplicáveis via setAttribute() pós-criação.',
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
            { token: '--input',            value: stripHtml(t('tokens.table.input.class')),           description: stripHtml(t('tokens.table.input.part'))           },
            { token: '—',                  value: stripHtml(t('tokens.table.background.class')),      description: stripHtml(t('tokens.table.background.part'))      },
            { token: '--foreground',       value: stripHtml(t('tokens.table.foreground.class')),      description: stripHtml(t('tokens.table.foreground.part'))      },
            { token: '--muted-foreground', value: stripHtml(t('tokens.table.mutedForeground.class')), description: stripHtml(t('tokens.table.mutedForeground.part')) },
            { token: '--ring',             value: stripHtml(t('tokens.table.ring.class')),            description: stripHtml(t('tokens.table.ring.part'))            },
            { token: '--destructive',      value: stripHtml(t('tokens.table.destructive.class')),     description: stripHtml(t('tokens.table.destructive.part'))     },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode: t('tokens.customizationCode'),
        });
      }

      case 'acessibilidade':
        return createDocsAccessibility({
          title: t('accessibility.title'),
          summary: stripHtml(t('accessibility.summary')),
          items: [
            t('accessibility.items.item1'),
            t('accessibility.items.item2'),
            t('accessibility.items.item3'),
            t('accessibility.items.item4'),
            t('accessibility.items.item5'),
            t('accessibility.items.item6'),
          ],
          keyboardTitle: t('accessibility.keyboard.title'),
          keyboardItems: [
            { key: 'Tab',         description: t('accessibility.keyboard.tab')        },
            { key: 'Shift+Tab',   description: t('accessibility.keyboard.shiftTab')   },
            { key: 'Enter',       description: t('accessibility.keyboard.enter')      },
            { key: 'Shift+Enter', description: t('accessibility.keyboard.shiftEnter') },
            { key: 'Esc',         description: t('accessibility.keyboard.esc')        },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          componentSlug: 'textarea',
          items: [
            { name: t('related.items.input.name'),    description: stripHtml(t('related.items.input.description')),    path: '?path=/docs/ui-input--docs'    },
            { name: t('related.items.label.name'),    description: stripHtml(t('related.items.label.description')),    path: '?path=/docs/ui-label--docs'    },
            { name: t('related.items.form.name'),     description: stripHtml(t('related.items.form.description')),     path: '?path=/docs/ui-form--docs'     },
            { name: t('related.items.inputOTP.name'), description: stripHtml(t('related.items.inputOTP.description')), path: '?path=/docs/ui-inputotp--docs' },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [
            { title: '', content: sanitizeHtml(t('notes.item1')) },
            { title: '', content: sanitizeHtml(t('notes.item2')) },
            { title: '', content: sanitizeHtml(t('notes.item3')) },
            { title: '', content: sanitizeHtml(t('notes.item4')) },
            // Divergência idiomática Nortear
            { title: '', content: sanitizeHtml('<strong>Nortear</strong> — o factory custom é um wrapper enxuto de <code>&lt;textarea&gt;</code> e <em>não</em> expõe props <code>onChange</code>, <code>readOnly</code>, <code>maxLength</code> nem <code>aria-invalid</code>. Aplique todos via API DOM nativa após a criação (<code>addEventListener</code>, <code>textarea.readOnly = true</code>, <code>textarea.maxLength = 500</code>, <code>setAttribute</code>). Para contador acessível, escute o evento <code>input</code> e atualize um <code>&lt;span&gt;</code> com <code>aria-live=&quot;polite&quot;</code> + <code>aria-label</code>.') },
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
            { event: 'field_blur',          trigger: t('analytics.table.field_blur.trigger'), payload: t('analytics.table.field_blur.payload') },
            { event: 'docs_page_view',      trigger: 'Carregamento da docs page',              payload: '{ component_name, locale, page_title }' },
            { event: 'docs_section_viewed', trigger: 'Seção visível no viewport',              payload: '{ section_id, component_name, locale }' },
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
              action: stripHtml(t(`testes.functional.item${i}.action`)),
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
            items: [1, 2, 3, 4, 5].map(i => ({
              criterion: stripHtml(t(`testes.accessibility.item${i}`)),
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
              story: stripHtml(t(`testes.visual.item${i}.story`)),
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
        component_name: 'textarea',
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
