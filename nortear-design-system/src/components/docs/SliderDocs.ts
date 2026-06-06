import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createSlider } from '@/components/ui/slider';
import { createButton } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import sliderTranslations from '@shared/content/slider/translations.json';

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
const { t, subscribe } = createTranslation(sliderTranslations as Record<string, unknown>);

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
 * Constrói um Slider rotulado:
 * - <label> textual (id) associado via aria-labelledby ao input range nativo interno
 * - <span aria-live="polite"> que mostra o valor textualmente
 * - aria-label OBRIGATÓRIO no nativeInput (também aplicado, em adição ao labelledby)
 *
 * NOTA Nortear: o factory custom é wrapper de <input type="range"> nativo —
 * portanto ARIA (role="slider", aria-valuenow/min/max, navegação Arrow/Home/End/PgUp/PgDn)
 * é provido pelo browser. Não há suporte nativo a range (2 thumbs) nem orientação vertical
 * acessível — divergências documentadas em notes/DocsProps/composições.
 */
function buildLabeledSlider(opts: {
  idPrefix: string;
  labelText: string;
  ariaLabel: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  disabled?: boolean;
  unit?: string;
  onValueChange?: (value: number) => void;
}): HTMLElement {
  const {
    idPrefix,
    labelText,
    ariaLabel,
    min = 0,
    max = 100,
    step = 1,
    value = min,
    disabled = false,
    unit = '',
    onValueChange,
  } = opts;

  const wrap = document.createElement('div');
  wrap.className = 'nds-stack';
  wrap.dataset.spacing = 'xs';
  wrap.style.width = '18rem';

  const row = document.createElement('div');
  row.className = 'nds-cluster';
  row.dataset.justify = 'between';

  const label = document.createElement('label');
  label.id = `${idPrefix}-label`;
  label.className = 'nds-text-body nds-font-medium';
  label.textContent = labelText;

  const valueText = document.createElement('span');
  valueText.id = `${idPrefix}-value`;
  valueText.className = 'nds-text-body nds-text-muted-foreground';
  valueText.style.fontVariantNumeric = 'tabular-nums';
  valueText.setAttribute('aria-live', 'polite');
  valueText.textContent = `${value}${unit}`;

  row.append(label, valueText);

  const slider = createSlider({
    min,
    max,
    step,
    value,
    disabled,
    onValueChange: (v) => {
      valueText.textContent = `${v}${unit}`;
      onValueChange?.(v);
    },
  });

  // Aplica ARIA explicitamente — aria-label obrigatório
  const input = slider.querySelector('input[type="range"]') as HTMLInputElement | null;
  if (input) {
    input.setAttribute('aria-label', ariaLabel);
    input.setAttribute('aria-labelledby', `${idPrefix}-label`);
    input.setAttribute('aria-describedby', `${idPrefix}-value`);
    input.id = `${idPrefix}-input`;
  }

  wrap.append(row, slider);
  return wrap;
}

// ─── createSliderDocs ─────────────────────────────────────────────────────────

export function createSliderDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'slider',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/form' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'slider',
      locale,
      page_title: `${t('title')} · Design System`,
    });
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
      installNote: 'npx shadcn@latest add slider',
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
            wrap.dataset.spacing = 'xl';

            // Volume — single
            const volume = buildLabeledSlider({
              idPrefix: 'demo-volume',
              labelText: t('demonstration.labels.volume'),
              ariaLabel: t('demonstration.labels.volume'),
              min: 0,
              max: 100,
              step: 1,
              value: 50,
              unit: '%',
              onValueChange: (v) => {
                track('field_change', {
                  component: 'slider',
                  field_name: 'volume',
                  value: String(v),
                  location: 'docs-demo',
                });
              },
            });
            wrap.appendChild(volume);

            // Brilho — single
            const brightness = buildLabeledSlider({
              idPrefix: 'demo-brightness',
              labelText: t('demonstration.labels.brightness'),
              ariaLabel: t('demonstration.labels.brightness'),
              min: 0,
              max: 100,
              step: 5,
              value: 75,
              unit: '%',
            });
            wrap.appendChild(brightness);

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
        const buildDoWithValue = () =>
          buildLabeledSlider({
            idPrefix: 'dodont-do-value',
            labelText: t('demonstration.labels.volume'),
            ariaLabel: t('demonstration.labels.volume'),
            min: 0,
            max: 100,
            value: 60,
            unit: '%',
          });
        const buildDontNoValue = () => {
          // Slider sem label nem texto de valor adjacente — usuário não sabe onde está
          return createSlider({ min: 0, max: 100, value: 60 });
        };
        const buildDoAriaLabel = () =>
          buildLabeledSlider({
            idPrefix: 'dodont-do-aria',
            labelText: t('demonstration.labels.brightness'),
            ariaLabel: t('demonstration.labels.brightness'),
            min: 0,
            max: 100,
            value: 80,
            unit: '%',
          });
        const buildDontGenericAria = () => {
          const wrap = buildLabeledSlider({
            idPrefix: 'dodont-dont-aria',
            labelText: 'Slider',
            ariaLabel: 'Slider',
            min: 0,
            max: 100,
            value: 80,
          });
          return wrap;
        };

        return createDocsDoDont({
          title: t('doDont.title'),
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair1.do'),
              dontCaption: t('doDont.pair1.dont'),
              doPreviewFactory: buildDoWithValue,
              dontPreviewFactory: buildDontNoValue,
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: buildDoAriaLabel,
              dontPreviewFactory: buildDontGenericAria,
            },
          ],
        });
      }

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: 'Importação do factory custom (Nortear):',
          code: `import { createSlider, type SliderOptions } from '@/components/ui/slider';`,
          secondaryDescription: 'Uso básico:',
          secondaryCode: `const slider = createSlider({
  min: 0,
  max: 100,
  step: 1,
  value: 50,
  onValueChange: (value) => console.log('value:', value),
});

// aria-label OBRIGATÓRIO no <input type="range"> interno
const input = slider.querySelector('input[type="range"]') as HTMLInputElement;
input.setAttribute('aria-label', 'Volume');`,
        });

      case 'variantes': {
        return createDocsVariants({
          id: 'variantes',
          title: t('variants.title'),
          componentSlug: 'slider',
          items: [
            {
              name: stripHtml(t('variants.items.single')),
              description: stripHtml(t('variants.styles.single')),
              code: `createSlider({ min: 0, max: 100, value: 50 });`,
              previewFactory: () =>
                buildLabeledSlider({
                  idPrefix: 'v-single',
                  labelText: t('demonstration.labels.volume'),
                  ariaLabel: t('demonstration.labels.volume'),
                  min: 0,
                  max: 100,
                  value: 50,
                  unit: '%',
                }),
            },
            {
              name: stripHtml(t('variants.items.range')),
              description:
                stripHtml(t('variants.styles.range')) +
                ' Não suportado pelo factory custom — composto manualmente com dois sliders adjacentes.',
              code: `// Factory não suporta 2 thumbs — composição com dois createSlider() adjacentes\nconst minSlider = createSlider({ min: 0, max: 1000, value: 100 });\nconst maxSlider = createSlider({ min: 0, max: 1000, value: 400 });`,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-stack';
  wrap.dataset.spacing = 'xs';
  wrap.style.width = '18rem';

                const row = document.createElement('div');
                row.className = 'nds-cluster';
  row.dataset.justify = 'between';
                const label = document.createElement('label');
                label.id = 'v-range-label';
                label.className = 'nds-text-body nds-font-medium';
                label.textContent = t('demonstration.labels.priceRange');
                const valueText = document.createElement('span');
                valueText.id = 'v-range-value';
                valueText.className = 'nds-text-body nds-text-muted-foreground';
  valueText.style.fontVariantNumeric = 'tabular-nums';
                valueText.setAttribute('aria-live', 'polite');
                let minV = 100;
                let maxV = 400;
                const fmt = () => {
                  valueText.textContent = `R$ ${minV} — R$ ${maxV}`;
                };
                fmt();
                row.append(label, valueText);

                const minSlider = createSlider({
                  min: 0,
                  max: 1000,
                  step: 10,
                  value: minV,
                  onValueChange: (v) => {
                    if (v > maxV) {
                      minV = maxV;
                      const i = minSlider.querySelector('input[type="range"]') as HTMLInputElement;
                      if (i) i.value = String(maxV);
                    } else {
                      minV = v;
                    }
                    fmt();
                  },
                });
                const minInput = minSlider.querySelector('input[type="range"]') as HTMLInputElement;
                if (minInput) {
                  minInput.setAttribute('aria-label', `${t('demonstration.labels.priceRange')} — min`);
                  minInput.setAttribute('aria-labelledby', 'v-range-label');
                }

                const maxSlider = createSlider({
                  min: 0,
                  max: 1000,
                  step: 10,
                  value: maxV,
                  onValueChange: (v) => {
                    if (v < minV) {
                      maxV = minV;
                      const i = maxSlider.querySelector('input[type="range"]') as HTMLInputElement;
                      if (i) i.value = String(minV);
                    } else {
                      maxV = v;
                    }
                    fmt();
                  },
                });
                const maxInput = maxSlider.querySelector('input[type="range"]') as HTMLInputElement;
                if (maxInput) {
                  maxInput.setAttribute('aria-label', `${t('demonstration.labels.priceRange')} — max`);
                  maxInput.setAttribute('aria-labelledby', 'v-range-label');
                }

                wrap.append(row, minSlider, maxSlider);
                return wrap;
              },
            },
            {
              name: stripHtml(t('variants.items.vertical')),
              description:
                stripHtml(t('variants.styles.vertical')) +
                ' Não suportado de forma acessível pelo <input type="range"> nativo — divergência documentada.',
              code: `// Não suportado — <input type=\"range\"> nativo não tem orientação vertical acessível.\n// Workaround visual via CSS rotate, mas ARIA não acompanha.`,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-stack';
                wrap.dataset.spacing = 'xs';
                wrap.style.alignItems = 'center';
                const note = document.createElement('p');
                note.className = 'nds-text-caption nds-text-muted-foreground nds-italic';
                note.style.maxWidth = '12rem';
                note.style.textAlign = 'center';
                note.textContent =
                  'Variante "vertical" não suportada de forma acessível no Nortear — use a versão horizontal.';
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
          componentSlug: 'slider',
          items: [
            {
              name: stripHtml(t('variants.compositions.volume.name')),
              description: stripHtml(t('variants.compositions.volume.description')),
              useWhen: stripHtml(t('variants.compositions.volume.use')),
              code: `const slider = createSlider({ min: 0, max: 100, value: 50,
  onValueChange: (v) => { valueText.textContent = v + '%'; },
});
const input = slider.querySelector('input[type="range"]');
input.setAttribute('aria-label', 'Volume');`,
              previewFactory: () =>
                buildLabeledSlider({
                  idPrefix: 'comp-volume',
                  labelText: 'Volume',
                  ariaLabel: 'Volume',
                  min: 0,
                  max: 100,
                  value: 50,
                  unit: '%',
                }),
            },
            {
              name: stripHtml(t('variants.compositions.brightness.name')),
              description: stripHtml(t('variants.compositions.brightness.description')),
              useWhen: stripHtml(t('variants.compositions.brightness.use')),
              code: `const slider = createSlider({
  min: 0, max: 100, step: 5, value: 75,
  onValueChange: (v) => { valueText.textContent = v + '%'; },
});`,
              previewFactory: () =>
                buildLabeledSlider({
                  idPrefix: 'comp-brightness',
                  labelText: 'Brilho',
                  ariaLabel: 'Brilho',
                  min: 0,
                  max: 100,
                  step: 5,
                  value: 75,
                  unit: '%',
                }),
            },
            {
              name: stripHtml(t('variants.compositions.priceRange.name')),
              description: stripHtml(t('variants.compositions.priceRange.description')),
              useWhen: stripHtml(t('variants.compositions.priceRange.use')),
              code: `// Factory custom nao suporta 2 thumbs — composicao manual com clamping mutuo
let minV = 100, maxV = 400;
const minSlider = createSlider({ min: 0, max: 1000, step: 10, value: minV,
  onValueChange: (v) => { if (v > maxV) v = maxV; minV = v; fmt(); },
});
const maxSlider = createSlider({ min: 0, max: 1000, step: 10, value: maxV,
  onValueChange: (v) => { if (v < minV) v = minV; maxV = v; fmt(); },
});`,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-stack';
  wrap.dataset.spacing = 'xs';
  wrap.style.width = '18rem';

                const row = document.createElement('div');
                row.className = 'nds-cluster';
  row.dataset.justify = 'between';
                const label = document.createElement('label');
                label.id = 'comp-range-label';
                label.className = 'nds-text-body nds-font-medium';
                label.textContent = 'Faixa de preço';
                const valueText = document.createElement('span');
                valueText.id = 'comp-range-value';
                valueText.className = 'nds-text-body nds-text-muted-foreground';
  valueText.style.fontVariantNumeric = 'tabular-nums';
                valueText.setAttribute('aria-live', 'polite');

                let minV = 100;
                let maxV = 400;
                const fmt = () => {
                  valueText.textContent = `R$ ${minV} — R$ ${maxV}`;
                };
                fmt();
                row.append(label, valueText);

                const minSlider = createSlider({
                  min: 0,
                  max: 1000,
                  step: 10,
                  value: minV,
                  onValueChange: (v) => {
                    if (v > maxV) {
                      minV = maxV;
                      const i = minSlider.querySelector('input[type="range"]') as HTMLInputElement;
                      if (i) i.value = String(maxV);
                    } else {
                      minV = v;
                    }
                    fmt();
                  },
                });
                const minInput = minSlider.querySelector('input[type="range"]') as HTMLInputElement | null;
                if (minInput) {
                  minInput.setAttribute('aria-label', 'Faixa de preço — mínimo');
                  minInput.setAttribute('aria-labelledby', 'comp-range-label');
                }

                const maxSlider = createSlider({
                  min: 0,
                  max: 1000,
                  step: 10,
                  value: maxV,
                  onValueChange: (v) => {
                    if (v < minV) {
                      maxV = minV;
                      const i = maxSlider.querySelector('input[type="range"]') as HTMLInputElement;
                      if (i) i.value = String(minV);
                    } else {
                      maxV = v;
                    }
                    fmt();
                  },
                });
                const maxInput = maxSlider.querySelector('input[type="range"]') as HTMLInputElement | null;
                if (maxInput) {
                  maxInput.setAttribute('aria-label', 'Faixa de preço — máximo');
                  maxInput.setAttribute('aria-labelledby', 'comp-range-label');
                }

                wrap.append(row, minSlider, maxSlider);
                return wrap;
              },
            },
            {
              name: stripHtml(t('variants.compositions.form.name')),
              description: stripHtml(t('variants.compositions.form.description')),
              useWhen: stripHtml(t('variants.compositions.form.use')),
              code: `// Factory nao expoe onValueCommitted — debounce manual de 300ms
let debounceId = null;
const slider = createSlider({ min: 0, max: 100, value: 60,
  onValueChange: (v) => {
    if (debounceId) clearTimeout(debounceId);
    debounceId = setTimeout(() => {
      track('slider_change', { component: 'slider', field_name: 'volume', value: v });
    }, 300);
  },
});`,
              previewFactory: () => {
                const form = document.createElement('form');
                form.className = 'nds-stack';
                form.dataset.spacing = 'md';
                form.style.width = '18rem';
                form.setAttribute('aria-label', 'Configurações de áudio');

                let debounceId: ReturnType<typeof setTimeout> | null = null;
                let lastCommitted = 60;

                const status = document.createElement('p');
                status.className = 'nds-text-caption nds-text-muted-foreground';
                status.setAttribute('aria-live', 'polite');
                status.textContent = 'Último commit: 60%';

                const slider = buildLabeledSlider({
                  idPrefix: 'comp-form-volume',
                  labelText: 'Volume',
                  ariaLabel: 'Volume',
                  min: 0,
                  max: 100,
                  value: lastCommitted,
                  unit: '%',
                  onValueChange: (v) => {
                    if (debounceId) clearTimeout(debounceId);
                    debounceId = setTimeout(() => {
                      lastCommitted = v;
                      status.textContent = `Último commit: ${v}%`;
                    }, 300);
                  },
                });

                const submit = createButton({
                  variant: 'default',
                  size: 'sm',
                  type: 'submit',
                  label: 'Salvar',
                  class: 'self-start',
                });

                form.addEventListener('submit', (e) => {
                  e.preventDefault();
                  lastCommitted = parseInt(
                    (slider.querySelector('input[type="range"]') as HTMLInputElement)?.value ?? '0',
                    10,
                  );
                  status.textContent = `Enviado: volume=${lastCommitted}%`;
                });

                form.append(slider, submit, status);
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
            { label: t('states.items.default'),  trigger: '—',                                  behavior: stripHtml(t('states.descriptions.default'))  },
            { label: t('states.items.hover'),    trigger: 'Pointer sobre o thumb',              behavior: stripHtml(t('states.descriptions.hover'))    },
            { label: t('states.items.focus'),    trigger: 'Tab — foco via teclado',             behavior: stripHtml(t('states.descriptions.focus'))    },
            { label: t('states.items.active'),   trigger: 'Durante o arrasto',                  behavior: stripHtml(t('states.descriptions.active'))   },
            { label: t('states.items.disabled'), trigger: 'disabled === true',                  behavior: stripHtml(t('states.descriptions.disabled')) },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createSlider(options) — Nortear
export type SliderOptions = {
  min?: number;          // default 0
  max?: number;          // default 100
  step?: number;         // default 1
  value?: number;        // default min — note: number, não number[]
  disabled?: boolean;    // default false
  onValueChange?: (value: number) => void;
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
              title: 'createSlider(options) — Nortear',
              cols: propsCols,
              items: [
                { name: 'value',         type: 'number',                       defaultValue: 'min',     required: 'Não', description: 'Valor inicial. NOTA Nortear: é `number` (não `number[]` como nas libs upstream) — sem suporte a range.' },
                { name: 'onValueChange', type: '(value: number) => void',      defaultValue: '—',       required: 'Não', description: 'Callback disparado durante o arrasto e em cada tecla. NOTA Nortear: não existe `onValueCommitted` separado — debounce ou ouça `change` no input nativo.' },
                { name: 'min',           type: 'number',                       defaultValue: '0',       required: 'Não', description: stripHtml(t('props.table.min.description')) },
                { name: 'max',           type: 'number',                       defaultValue: '100',     required: 'Não', description: stripHtml(t('props.table.max.description')) },
                { name: 'step',          type: 'number',                       defaultValue: '1',       required: 'Não', description: stripHtml(t('props.table.step.description')) },
                { name: 'disabled',      type: 'boolean',                      defaultValue: 'false',   required: 'Não', description: stripHtml(t('props.table.disabled.description')) },
                { name: 'class',         type: 'string',                       defaultValue: '—',      required: 'Não', description: 'Classes .nds-* adicionais no `<div>` raiz.' },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: 'Divergências da factory custom (Nortear)',
          extensibilityNotes:
            'O factory custom é um wrapper de <input type="range"> nativo e diverge das libs upstream nos seguintes pontos: (1) Sem suporte a range (2 thumbs) — `value` é `number`, não `number[]`. Componha 2 sliders adjacentes para selecionar min/max. (2) Sem prop `orientation` — <input type="range"> nativo não suporta orientação vertical acessível; use horizontal. (3) Sem prop `defaultValue` — use `value` (não-controlado por padrão). (4) Sem `onValueCommitted` — `onValueChange` dispara em cada tecla/passo do arrasto; debounce manualmente para evitar spam de analytics. (5) aria-label NÃO é prop — aplique manualmente no <input type="range"> interno após criação. Em todos os outros pontos (role="slider", aria-valuenow/min/max, navegação Arrow/Home/End/PgUp/PgDn) o comportamento é equivalente — provido pelo browser via input nativo.',
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
            { token: '--muted',            value: stripHtml(t('tokens.table.muted.class')),            description: stripHtml(t('tokens.table.muted.part')) },
            { token: '--primary',          value: stripHtml(t('tokens.table.primary.class')),          description: stripHtml(t('tokens.table.primary.part')) },
            { token: '--ring',             value: stripHtml(t('tokens.table.ring.class')),             description: stripHtml(t('tokens.table.ring.part')) },
            { token: '--background',       value: stripHtml(t('tokens.table.background.class')),       description: stripHtml(t('tokens.table.background.part')) },
            { token: '--foreground',       value: stripHtml(t('tokens.table.foreground.class')),       description: stripHtml(t('tokens.table.foreground.part')) },
            { token: '--muted-foreground', value: stripHtml(t('tokens.table.mutedForeground.class')),  description: stripHtml(t('tokens.table.mutedForeground.part')) },
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
            { key: 'Tab',        description: stripHtml(t('accessibility.keyboard.tab'))        },
            { key: 'ArrowRight', description: stripHtml(t('accessibility.keyboard.arrowRight')) },
            { key: 'ArrowLeft',  description: stripHtml(t('accessibility.keyboard.arrowLeft'))  },
            { key: 'ArrowUp',    description: stripHtml(t('accessibility.keyboard.arrowUp'))    },
            { key: 'ArrowDown',  description: stripHtml(t('accessibility.keyboard.arrowDown'))  },
            { key: 'Home',       description: stripHtml(t('accessibility.keyboard.home'))       },
            { key: 'End',        description: stripHtml(t('accessibility.keyboard.end'))        },
            { key: 'PageUp',     description: stripHtml(t('accessibility.keyboard.pageUp'))     },
            { key: 'PageDown',   description: stripHtml(t('accessibility.keyboard.pageDown'))   },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.input.name'),      description: stripHtml(t('related.items.input.description')),      path: '?path=/docs/ui-input--docs'      },
            { name: t('related.items.switch.name'),     description: stripHtml(t('related.items.switch.description')),     path: '?path=/docs/ui-switch--docs'     },
            { name: t('related.items.progress.name'),   description: stripHtml(t('related.items.progress.description')),   path: '?path=/docs/ui-progress--docs'   },
            { name: t('related.items.radioGroup.name'), description: stripHtml(t('related.items.radioGroup.description')), path: '?path=/docs/ui-radiogroup--docs' },
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
            {
              title: '',
              content: sanitizeHtml(
                '<strong>Divergências Nortear</strong> — o factory é wrapper de <code>&lt;input type="range"&gt;</code> nativo. Não suporta <strong>range (2 thumbs)</strong> nem <strong>orientação vertical</strong> acessível; <code>value</code> é <code>number</code> (não array). Não há <code>onValueCommitted</code> — use debounce sobre <code>onValueChange</code> para analytics. <code>aria-label</code> precisa ser aplicado manualmente no <code>&lt;input&gt;</code> interno.',
              ),
            },
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
            { event: 'slider_change',        trigger: stripHtml(t('analytics.table.slider_change.trigger')) + ' (Nortear: debounce manual sobre onValueChange)', payload: stripHtml(t('analytics.table.slider_change.payload')) },
            { event: 'docs_page_view',      trigger: 'Carregamento da docs page',  payload: '{ component_name, locale, page_title }' },
            { event: 'docs_section_viewed', trigger: 'Seção visível no viewport',  payload: '{ section_id, component_name, locale }' },
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
            items: [1, 2, 3, 4].map(i => ({
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
        component_name: 'slider',
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
