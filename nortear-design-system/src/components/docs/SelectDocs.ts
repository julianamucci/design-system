import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createSelect } from '@/components/ui/select';
import uiTranslations from '@/i18n/ui.json';
import selectTranslations from '@shared/content/select/translations.json';

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
const { t, subscribe } = createTranslation(selectTranslations as Record<string, unknown>);

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

/**
 * Constrói um <select> nativo (factory custom Nortear = wrapper de <select>)
 * com label associado via `for/id`. Usa createElement + textContent — sem XSS.
 */
function buildLabeledSelect(opts: {
  id: string;
  labelText: string;
  name: string;
  items: { value: string; label: string; disabled?: boolean }[];
  placeholder: string;
  defaultValue?: string;
  disabled?: boolean;
  ariaInvalid?: boolean;
  onValueChange?: (value: string) => void;
}): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-stack';
  wrap.dataset.spacing = 'xs';

  const label = document.createElement('label');
  label.htmlFor = opts.id;
  label.className = 'nds-text-body nds-font-semibold';
  label.textContent = opts.labelText;

  const select = createSelect({
    items: opts.items,
    placeholder: opts.placeholder,
    defaultValue: opts.defaultValue,
    disabled: opts.disabled,
    onValueChange: opts.onValueChange,
  });
  select.id = opts.id;
  select.name = opts.name;
  if (opts.ariaInvalid) {
    select.setAttribute('aria-invalid', 'true');
    select.classList.add('nds-border-destructive');
    select.style.boxShadow = '0 0 0 3px rgb(from var(--destructive) r g b / 0.2)';
  }

  wrap.append(label, select);
  return wrap;
}

/**
 * Variante com <optgroup> — usa o <select> nativo subjacente.
 * Como createSelect só aceita items planos, criamos um <select> diretamente aqui,
 * reaproveitando classes/dataset equivalentes do factory.
 */
function buildLabeledSelectWithGroups(opts: {
  id: string;
  labelText: string;
  name: string;
  placeholder: string;
  groups: { label: string; items: { value: string; label: string }[] }[];
}): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-stack';
  wrap.dataset.spacing = 'xs';

  const label = document.createElement('label');
  label.htmlFor = opts.id;
  label.className = 'nds-text-body nds-font-semibold';
  label.textContent = opts.labelText;

  const select = document.createElement('select');
  select.className = 'select';
  select.dataset.slot = 'select';
  select.id = opts.id;
  select.name = opts.name;

  // Placeholder: option vazia, disabled+selected+hidden
  const ph = document.createElement('option');
  ph.value = '';
  ph.textContent = opts.placeholder;
  ph.disabled = true;
  ph.selected = true;
  ph.hidden = true;
  select.appendChild(ph);

  opts.groups.forEach((g) => {
    const og = document.createElement('optgroup');
    og.label = g.label;
    g.items.forEach((it) => {
      const opt = document.createElement('option');
      opt.value = it.value;
      opt.textContent = it.label;
      og.appendChild(opt);
    });
    select.appendChild(og);
  });

  wrap.append(label, select);
  return wrap;
}

// ─── createSelectDocs ─────────────────────────────────────────────────────────

export function createSelectDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'select',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/form' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', { component_name: 'select', locale, page_title: `${t('title')} · Design System` });
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
      installNote: 'npx shadcn@latest add select',
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
            wrap.className = 'nds-stack';
            wrap.dataset.spacing = 'lg';
            wrap.style.width = '20rem';

            const stateField = buildLabeledSelect({
              id: 'demo-state',
              labelText: t('demonstration.labels.stateLabel'),
              name: 'state',
              placeholder: t('demonstration.labels.placeholder'),
              items: [
                { value: 'sp', label: t('demonstration.labels.sp') },
                { value: 'rj', label: t('demonstration.labels.rj') },
                { value: 'mg', label: t('demonstration.labels.mg') },
                { value: 'rs', label: t('demonstration.labels.rs') },
              ],
              onValueChange: (value) => {
                const labelMap: Record<string, string> = {
                  sp: t('demonstration.labels.sp'),
                  rj: t('demonstration.labels.rj'),
                  mg: t('demonstration.labels.mg'),
                  rs: t('demonstration.labels.rs'),
                };
                track('field_change', {
                  component: 'select',
                  field_name: 'state',
                  value,
                  location: 'docs-demo',
                });
                void labelMap;
              },
            });
            wrap.appendChild(stateField);

            const regionField = buildLabeledSelectWithGroups({
              id: 'demo-region',
              labelText: t('demonstration.labels.regionLabel'),
              name: 'region',
              placeholder: t('demonstration.labels.placeholder'),
              groups: [
                {
                  label: t('demonstration.labels.groupSoutheast'),
                  items: [
                    { value: 'sp', label: t('demonstration.labels.sp') },
                    { value: 'rj', label: t('demonstration.labels.rj') },
                    { value: 'mg', label: t('demonstration.labels.mg') },
                    { value: 'es', label: t('demonstration.labels.es') },
                  ],
                },
                {
                  label: t('demonstration.labels.groupSouth'),
                  items: [
                    { value: 'rs', label: t('demonstration.labels.rs') },
                    { value: 'sc', label: t('demonstration.labels.sc') },
                    { value: 'pr', label: t('demonstration.labels.pr') },
                  ],
                },
              ],
            });
            wrap.appendChild(regionField);

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
        const buildDoConsistent = () =>
          buildLabeledSelect({
            id: 'dodont-do-consistent',
            labelText: t('demonstration.labels.stateLabel'),
            name: 'dodont-do',
            placeholder: t('demonstration.labels.placeholder'),
            items: [
              { value: 'sp', label: t('demonstration.labels.sp') },
              { value: 'rj', label: t('demonstration.labels.rj') },
              { value: 'mg', label: t('demonstration.labels.mg') },
            ],
          });
        const buildDontMixed = () =>
          buildLabeledSelect({
            id: 'dodont-dont-mixed',
            labelText: t('demonstration.labels.stateLabel'),
            name: 'dodont-dont',
            placeholder: t('demonstration.labels.placeholder'),
            items: [
              { value: 'sp', label: 'SP' },
              { value: 'rj', label: t('demonstration.labels.rj') },
              { value: 'mg', label: 'MG' },
            ],
          });

        const buildDoGroups = () =>
          buildLabeledSelectWithGroups({
            id: 'dodont-do-groups',
            labelText: t('demonstration.labels.regionLabel'),
            name: 'dodont-do-groups',
            placeholder: t('demonstration.labels.placeholder'),
            groups: [
              {
                label: t('demonstration.labels.groupSoutheast'),
                items: [
                  { value: 'sp', label: t('demonstration.labels.sp') },
                  { value: 'rj', label: t('demonstration.labels.rj') },
                ],
              },
              {
                label: t('demonstration.labels.groupSouth'),
                items: [
                  { value: 'rs', label: t('demonstration.labels.rs') },
                  { value: 'sc', label: t('demonstration.labels.sc') },
                ],
              },
            ],
          });
        const buildDontSoloGroup = () =>
          buildLabeledSelectWithGroups({
            id: 'dodont-dont-solo-group',
            labelText: t('demonstration.labels.regionLabel'),
            name: 'dodont-dont-solo',
            placeholder: t('demonstration.labels.placeholder'),
            groups: [
              {
                label: t('demonstration.labels.groupSoutheast'),
                items: [{ value: 'sp', label: t('demonstration.labels.sp') }],
              },
              {
                label: t('demonstration.labels.groupSouth'),
                items: [
                  { value: 'rs', label: t('demonstration.labels.rs') },
                  { value: 'sc', label: t('demonstration.labels.sc') },
                ],
              },
            ],
          });

        return createDocsDoDont({
          title: t('doDont.title'),
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair1.do'),
              dontCaption: t('doDont.pair1.dont'),
              doPreviewFactory: buildDoConsistent,
              dontPreviewFactory: buildDontMixed,
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: buildDoGroups,
              dontPreviewFactory: buildDontSoloGroup,
            },
          ],
        });
      }

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: 'Importação do factory custom (Nortear):',
          code: `import { createSelect, type SelectOptions, type SelectItem } from '@/components/ui/select';`,
          secondaryDescription: 'Uso básico:',
          secondaryCode: `const select = createSelect({
  placeholder: 'Selecione...',
  items: [
    { value: 'sp', label: 'São Paulo' },
    { value: 'rj', label: 'Rio de Janeiro' },
    { value: 'mg', label: 'Minas Gerais' },
  ],
  onValueChange: (value) => console.log('selected:', value),
});

// Associe a um <label> externo via id
select.id = 'state';
select.name = 'state';`,
        });

      case 'variantes': {
        return createDocsVariants({
          id: 'variantes',
          title: t('variants.title'),
          componentSlug: 'select',
          items: [
            {
              name: stripHtml(t('variants.items.default')),
              description: stripHtml(t('variants.styles.default')),
              code: `createSelect({ placeholder: 'Selecione...', items });`,
              previewFactory: () =>
                buildLabeledSelect({
                  id: 'v-default',
                  labelText: t('demonstration.labels.stateLabel'),
                  name: 'v-default',
                  placeholder: t('demonstration.labels.placeholder'),
                  items: [
                    { value: 'sp', label: t('demonstration.labels.sp') },
                    { value: 'rj', label: t('demonstration.labels.rj') },
                    { value: 'mg', label: t('demonstration.labels.mg') },
                  ],
                }),
            },
            {
              name: stripHtml(t('variants.items.withGroups')),
              description: stripHtml(t('variants.styles.withGroups')),
              code: `// O factory createSelect só aceita items planos.\n// Para grupos, monte o <select> + <optgroup> diretamente.\nconst select = document.createElement('select');\nselect.className = 'select';\n// ...preencha com <optgroup label="..."> + <option>`,
              previewFactory: () =>
                buildLabeledSelectWithGroups({
                  id: 'v-groups',
                  labelText: t('demonstration.labels.regionLabel'),
                  name: 'v-groups',
                  placeholder: t('demonstration.labels.placeholder'),
                  groups: [
                    {
                      label: t('demonstration.labels.groupSoutheast'),
                      items: [
                        { value: 'sp', label: t('demonstration.labels.sp') },
                        { value: 'rj', label: t('demonstration.labels.rj') },
                      ],
                    },
                    {
                      label: t('demonstration.labels.groupSouth'),
                      items: [
                        { value: 'rs', label: t('demonstration.labels.rs') },
                        { value: 'sc', label: t('demonstration.labels.sc') },
                      ],
                    },
                  ],
                }),
            },
            {
              name: stripHtml(t('variants.items.withIcon')),
              description:
                stripHtml(t('variants.styles.withIcon')) +
                ' NOTA: o factory `createSelect` (Nortear) é um wrapper do `<select>` nativo — o HTML não permite ícones inline em `<option>`. Para essa variante, recomendamos `Combobox` ou um componente custom.',
              code: `// Indisponível com <select> nativo — use Combobox ou implementação custom.`,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-stack';
                wrap.dataset.spacing = 'xs';
                wrap.style.width = '20rem';
                const note = document.createElement('p');
                note.className = 'nds-text-body nds-text-muted-foreground nds-italic';
                note.textContent =
                  'Limitação do HTML <select> nativo — ícones inline em <option> não são suportados pelo navegador. Para essa necessidade, use Combobox.';
                wrap.appendChild(note);
                return wrap;
              },
            },
          ],
        });
      }

      case 'composicoes':
        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'select',
          items: [
            {
              name: stripHtml(t('variants.compositions.states.name')),
              description: stripHtml(t('variants.compositions.states.description')),
              useWhen: stripHtml(t('variants.compositions.states.use')),
              code: `const wrap = document.createElement('div');
wrap.className = 'nds-stack';
wrap.dataset.spacing = 'xs';
wrap.style.width = '20rem';

const label = document.createElement('label');
label.htmlFor = 'state';
label.className = 'nds-text-body nds-font-semibold';
label.textContent = 'Estado';

const select = createSelect({
  placeholder: 'Selecione...',
  items: [
    { value: 'sp', label: 'São Paulo' },
    { value: 'rj', label: 'Rio de Janeiro' },
    { value: 'mg', label: 'Minas Gerais' },
    { value: 'rs', label: 'Rio Grande do Sul' },
  ],
});
select.id = 'state';

wrap.append(label, select);`,
              previewFactory: () =>
                buildLabeledSelect({
                  id: 'comp-state',
                  labelText: t('demonstration.labels.stateLabel'),
                  name: 'comp-state',
                  placeholder: t('demonstration.labels.placeholder'),
                  items: [
                    { value: 'sp', label: t('demonstration.labels.sp') },
                    { value: 'rj', label: t('demonstration.labels.rj') },
                    { value: 'mg', label: t('demonstration.labels.mg') },
                    { value: 'rs', label: t('demonstration.labels.rs') },
                  ],
                }),
            },
            {
              name: stripHtml(t('variants.compositions.regionGroups.name')),
              description: stripHtml(t('variants.compositions.regionGroups.description')),
              useWhen: stripHtml(t('variants.compositions.regionGroups.use')),
              code: `// O factory createSelect só aceita items planos.
// Para grupos, monte <select> + <optgroup> manualmente.
const select = document.createElement('select');
select.className = 'select';
select.id = 'region';

const groups = [
  { label: 'Sudeste', items: [
    { value: 'sp', label: 'São Paulo' },
    { value: 'rj', label: 'Rio de Janeiro' },
  ]},
  { label: 'Sul', items: [
    { value: 'rs', label: 'Rio Grande do Sul' },
    { value: 'sc', label: 'Santa Catarina' },
  ]},
];

groups.forEach((g) => {
  const og = document.createElement('optgroup');
  og.label = g.label;
  g.items.forEach((it) => {
    const opt = document.createElement('option');
    opt.value = it.value;
    opt.textContent = it.label;
    og.appendChild(opt);
  });
  select.appendChild(og);
});`,
              previewFactory: () =>
                buildLabeledSelectWithGroups({
                  id: 'comp-region',
                  labelText: t('demonstration.labels.regionLabel'),
                  name: 'comp-region',
                  placeholder: t('demonstration.labels.placeholder'),
                  groups: [
                    {
                      label: t('demonstration.labels.groupSoutheast'),
                      items: [
                        { value: 'sp', label: t('demonstration.labels.sp') },
                        { value: 'rj', label: t('demonstration.labels.rj') },
                        { value: 'mg', label: t('demonstration.labels.mg') },
                        { value: 'es', label: t('demonstration.labels.es') },
                      ],
                    },
                    {
                      label: t('demonstration.labels.groupSouth'),
                      items: [
                        { value: 'rs', label: t('demonstration.labels.rs') },
                        { value: 'sc', label: t('demonstration.labels.sc') },
                        { value: 'pr', label: t('demonstration.labels.pr') },
                      ],
                    },
                  ],
                }),
            },
            {
              name: stripHtml(t('variants.compositions.inForm.name')),
              description: stripHtml(t('variants.compositions.inForm.description')),
              useWhen: stripHtml(t('variants.compositions.inForm.use')),
              code: `const form = document.createElement('form');
form.className = 'nds-stack nds-border-default nds-rounded-lg';
form.dataset.spacing = 'md';
form.style.cssText = 'width:20rem;padding:1rem;';

const field = document.createElement('div');
field.className = 'nds-stack';
field.dataset.spacing = 'xs';

const label = document.createElement('label');
label.htmlFor = 'form-state';
label.className = 'nds-text-body nds-font-semibold';
label.textContent = 'Estado';

const select = createSelect({
  placeholder: 'Selecione...',
  items: [
    { value: 'sp', label: 'São Paulo' },
    { value: 'rj', label: 'Rio de Janeiro' },
    { value: 'mg', label: 'Minas Gerais' },
  ],
});
select.id = 'form-state';
select.name = 'state';
select.required = true;

field.append(label, select);
form.appendChild(field);

const submit = document.createElement('button');
submit.type = 'submit';
submit.className = 'btn btn-primary self-end';
submit.textContent = 'Continuar';
form.appendChild(submit);

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(form);
  console.log('Estado:', data.get('state'));
});`,
              previewFactory: () => {
                const form = document.createElement('form');
                form.className = 'nds-stack nds-border-default nds-rounded-lg';
                form.dataset.spacing = 'md';
                form.style.cssText = 'width:20rem;padding:1rem;';
                form.noValidate = true;

                const field = document.createElement('div');
                field.className = 'nds-stack';
                field.dataset.spacing = 'xs';

                const label = document.createElement('label');
                label.htmlFor = 'comp-form-state';
                label.className = 'nds-text-body nds-font-semibold';
                label.textContent = t('demonstration.labels.stateLabel');

                const select = createSelect({
                  placeholder: t('demonstration.labels.placeholder'),
                  items: [
                    { value: 'sp', label: t('demonstration.labels.sp') },
                    { value: 'rj', label: t('demonstration.labels.rj') },
                    { value: 'mg', label: t('demonstration.labels.mg') },
                  ],
                });
                select.id = 'comp-form-state';
                select.name = 'state';

                field.append(label, select);
                form.appendChild(field);

                const submit = document.createElement('button');
                submit.type = 'submit';
                submit.className = 'nds-rounded-md nds-bg-primary nds-text-body nds-font-medium';
                submit.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;align-self:flex-end;padding:0.375rem 0.75rem;color:var(--primary-foreground);';
                submit.textContent = 'Continuar';
                form.appendChild(submit);

                form.addEventListener('submit', (e) => {
                  e.preventDefault();
                });

                return form;
              },
            },
          ],
        });

      case 'estados':
        return createDocsStates({
          title: t('states.title'),
          cols: {
            state: 'Estado',
            trigger: 'Quando ocorre',
            behavior: 'Comportamento',
          },
          items: [
            { label: t('states.items.default'),  trigger: '—',                                   behavior: stripHtml(t('states.descriptions.default'))  },
            { label: t('states.items.open'),     trigger: 'Click ou Enter no trigger',           behavior: stripHtml(t('states.descriptions.open')) + ' (no Nortear o popup nativo é controlado pelo navegador).' },
            { label: t('states.items.selected'), trigger: 'Usuário escolhe uma opção',           behavior: stripHtml(t('states.descriptions.selected')) },
            { label: t('states.items.hover'),    trigger: 'pointer sobre item',                  behavior: stripHtml(t('states.descriptions.hover'))    },
            { label: t('states.items.focus'),    trigger: 'Tab até o trigger',                   behavior: stripHtml(t('states.descriptions.focus'))    },
            { label: t('states.items.disabled'), trigger: 'options.disabled === true',           behavior: stripHtml(t('states.descriptions.disabled')) },
            { label: t('states.items.invalid'),  trigger: 'aria-invalid="true" no <select>',     behavior: stripHtml(t('states.descriptions.invalid'))  },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createSelect(options)
export type SelectItem = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectOptions = {
  items: SelectItem[];
  placeholder?: string;
  defaultValue?: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  class?: string;
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
              title: 'createSelect(options) — Nortear',
              cols: propsCols,
              items: [
                { name: 'items',         type: 'SelectItem[]',                  defaultValue: '—',          required: 'Sim', description: 'Lista plana de opções. Cada item: { value, label, disabled? }.' },
                { name: 'placeholder',   type: 'string',                        defaultValue: '—',          required: 'Não', description: stripHtml(t('props.table.placeholder.description')) + ' Renderizado como `<option>` disabled+hidden no topo.' },
                { name: 'defaultValue',  type: 'string',                        defaultValue: '—',          required: 'Não', description: stripHtml(t('props.table.defaultValue.description')) + ' Não há prop `value` controlada — o factory é não-controlado.' },
                { name: 'disabled',      type: 'boolean',                       defaultValue: 'false',      required: 'Não', description: stripHtml(t('props.table.disabled.description')) },
                { name: 'onValueChange', type: '(value: string) => void',       defaultValue: '—',          required: 'Não', description: stripHtml(t('props.table.onValueChange.description')) },
                { name: 'class',         type: 'string',                        defaultValue: '—',          required: 'Não', description: 'Classes .nds-* adicionais no `<select>` raiz.' },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: 'Divergências da factory custom (Nortear)',
          extensibilityNotes:
            'O factory custom é um **wrapper fino do `<select>` HTML nativo** — diverge das libs upstream em vários pontos: (1) é estritamente não-controlado (sem prop `value`); use `defaultValue` + `onValueChange`. (2) Não suporta agrupamento via API — para grupos, monte `<select>` + `<optgroup>` manualmente. (3) Não suporta ícones em `<option>` (limitação do HTML nativo). (4) Não há prop `name` no factory — atribua via `select.name = "..."` no DOM retornado. (5) Não há prop `size` (default/sm) — aplique via `class` do tema. (6) O dropdown é o nativo do navegador: role/aria-expanded/listbox/option são gerenciados automaticamente, **não** documentados via atributos manuais. (7) Sem portal, sem type-ahead customizado (o navegador já oferece) e sem Check icon de seleção (use o highlight nativo do `<option>`).',
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
            { token: '--input',              value: stripHtml(t('tokens.table.input.class')),              description: stripHtml(t('tokens.table.input.part')) },
            { token: '--popover',            value: stripHtml(t('tokens.table.popover.class')),            description: stripHtml(t('tokens.table.popover.part')) },
            { token: '--popover-foreground', value: stripHtml(t('tokens.table.popoverForeground.class')),  description: stripHtml(t('tokens.table.popoverForeground.part')) },
            { token: '--accent',             value: stripHtml(t('tokens.table.accent.class')),             description: stripHtml(t('tokens.table.accent.part')) },
            { token: '--accent-foreground',  value: stripHtml(t('tokens.table.accentForeground.class')),   description: stripHtml(t('tokens.table.accentForeground.part')) },
            { token: '--ring',               value: stripHtml(t('tokens.table.ring.class')),               description: stripHtml(t('tokens.table.ring.part')) },
            { token: '--destructive',        value: stripHtml(t('tokens.table.destructive.class')),        description: stripHtml(t('tokens.table.destructive.part')) },
            { token: '--muted-foreground',   value: stripHtml(t('tokens.table.mutedForeground.class')),    description: stripHtml(t('tokens.table.mutedForeground.part')) },
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
            { key: 'Tab',        description: t('accessibility.keyboard.tab')        },
            { key: 'Enter',      description: t('accessibility.keyboard.enter')      },
            { key: 'Space',      description: t('accessibility.keyboard.space')      },
            { key: 'ArrowDown',  description: t('accessibility.keyboard.arrowDown')  },
            { key: 'ArrowUp',    description: t('accessibility.keyboard.arrowUp')    },
            { key: 'Home',       description: t('accessibility.keyboard.home')       },
            { key: 'End',        description: t('accessibility.keyboard.end')        },
            { key: 'Escape',     description: t('accessibility.keyboard.escape')     },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.combobox.name'),     description: stripHtml(t('related.items.combobox.description')),     path: '?path=/docs/ui-combobox--docs'     },
            { name: t('related.items.radioGroup.name'),   description: stripHtml(t('related.items.radioGroup.description')),   path: '?path=/docs/ui-radiogroup--docs'   },
            { name: t('related.items.dropdownMenu.name'), description: stripHtml(t('related.items.dropdownMenu.description')), path: '?path=/docs/ui-dropdownmenu--docs' },
            { name: t('related.items.form.name'),         description: stripHtml(t('related.items.form.description')),         path: '?path=/docs/ui-form--docs'         },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [
            { title: '', content: sanitizeHtml(t('notes.item1')) },
            { title: '', content: sanitizeHtml(t('notes.item2') + ' <strong>Nortear</strong>: o factory é um wrapper de <code>&lt;select&gt;</code> nativo — não há portal customizado; o dropdown é o popup nativo do navegador.') },
            { title: '', content: sanitizeHtml(t('notes.item3') + ' <strong>Nortear</strong>: type-ahead é gerenciado pelo próprio <code>&lt;select&gt;</code> do navegador.') },
            { title: '', content: sanitizeHtml(t('notes.item4')) },
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
            { event: 'option_select',        trigger: t('analytics.table.option_select.trigger'), payload: t('analytics.table.option_select.payload') },
            { event: 'docs_page_view',       trigger: 'Carregamento da docs page',                payload: '{ component_name, locale, page_title }' },
            { event: 'docs_section_viewed',  trigger: 'Seção visível no viewport',                payload: '{ section_id, component_name, locale }' },
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
              how: '—',
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
        component_name: 'select',
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
