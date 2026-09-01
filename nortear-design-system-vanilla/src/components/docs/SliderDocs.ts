import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import DOMPurify from 'dompurify';
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
    (sliderTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  );
}
const { t, subscribe } = createTranslation(sliderTranslations as Record<string, unknown>);

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
 * Constrói um Slider rotulado:
 * - <label> textual (id) associado via aria-labelledby à alça
 * - <span aria-live="polite"> que mostra o valor textualmente
 * - `aria-label` vai direto na opção da factory, que o escreve na alça
 *
 * A alça é um <input type="range"> de verdade, então role="slider",
 * aria-valuenow/min/max e a navegação Arrow/Home/End/PgUp/PgDn vêm do navegador.
 */
function buildLabeledSlider(opts: {
  idPrefix: string;
  labelText: string;
  'aria-label': string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  disabled?: boolean;
  unit?: string;
  onValueChange?: (value: number) => void;
  onValueCommitted?: (value: number) => void;
}): HTMLElement {
  const {
    idPrefix,
    labelText,
    'aria-label': ariaLabel,
    min = 0,
    max = 100,
    step = 1,
    value = min,
    disabled = false,
    unit = '',
    onValueChange,
    onValueCommitted,
  } = opts;

  const wrap = document.createElement('div');
  wrap.className = 'nds-stack';
  wrap.dataset.spacing = 'xs';
  wrap.classList.add('nds-w-2xs');

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
    'aria-label': ariaLabel,
    onValueChange: (v) => {
      valueText.textContent = `${v}${unit}`;
      onValueChange?.(v);
    },
    onValueCommitted,
  });

  // O nome acessível já veio pela opção `aria-label`; aqui só se amarra o rótulo
  // visível e o texto de valor à alça.
  const input = slider.querySelector('input[type="range"]') as HTMLInputElement | null;
  if (input) {
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

            // `onValueCommitted` dispara uma vez por interação — ao soltar o
            // arrasto ou largar a tecla. É ele que alimenta a analítica; o
            // contínuo enviaria um evento por pixel.
            const trackCommitted = (fieldName: string, min: number, max: number) => (v: number) => {
              track('slider_change', {
                component: 'slider',
                field_name: fieldName,
                value: v,
                min,
                max,
                location: 'docs_demo',
              });
            };

            // Volume — single
            const volume = buildLabeledSlider({
              idPrefix: 'demo-volume',
              labelText: t('demonstration.labels.volume'),
              'aria-label': t('demonstration.labels.volume'),
              min: 0,
              max: 100,
              step: 1,
              value: 50,
              unit: '%',
              onValueCommitted: trackCommitted('volume', 0, 100),
            });
            wrap.appendChild(volume);

            // Brilho — single
            const brightness = buildLabeledSlider({
              idPrefix: 'demo-brightness',
              labelText: t('demonstration.labels.brightness'),
              'aria-label': t('demonstration.labels.brightness'),
              min: 0,
              max: 100,
              step: 5,
              value: 75,
              unit: '%',
              onValueCommitted: trackCommitted('brightness', 0, 100),
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
            'aria-label': t('demonstration.labels.volume'),
            min: 0,
            max: 100,
            value: 60,
            unit: '%',
          });
        const buildDontNoValue = () => {
          // Slider sem rótulo visível nem texto de valor ao lado — quem olha não
          // sabe onde está. O anti-padrão é visual: a alça continua nomeada por
          // `aria-label` (sem nome, o axe acusa a página inteira).
          return createSlider({
            min: 0,
            max: 100,
            value: 60,
            'aria-label': t('demonstration.labels.volume'),
          });
        };
        const buildDoAriaLabel = () =>
          buildLabeledSlider({
            idPrefix: 'dodont-do-aria',
            labelText: t('demonstration.labels.brightness'),
            'aria-label': t('demonstration.labels.brightness'),
            min: 0,
            max: 100,
            value: 80,
            unit: '%',
          });
        const buildDontGenericAria = () => {
          const wrap = buildLabeledSlider({
            idPrefix: 'dodont-dont-aria',
            labelText: 'Slider',
            'aria-label': 'Slider',
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
              doCaption: toPlainText(t('doDont.pair1.do')),
              dontCaption: toPlainText(t('doDont.pair1.dont')),
              doPreviewFactory: buildDoWithValue,
              dontPreviewFactory: buildDontNoValue,
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: buildDoAriaLabel,
              dontPreviewFactory: buildDontGenericAria,
            },
          ],
        });
      }

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: 'Importação da fábrica:',
          code: `import {
  createSlider,
  type SliderOptions,
  type SliderSingleOptions,
  type SliderRangeOptions,
} from '@/components/ui/slider';`,
          secondaryDescription: 'Uso básico — uma alça:',
          secondaryCode: `const slider = createSlider({
  min: 0,
  max: 100,
  step: 1,
  value: 50,
  'aria-label': 'Volume',
  onValueChange: (value) => console.log('arrastando:', value),
  onValueCommitted: (value) => console.log('soltou em:', value),
});

// Intervalo: o valor é um PAR, e os callbacks recebem um par de volta
const intervalo = createSlider({
  min: 0,
  max: 1000,
  step: 10,
  value: [100, 400],
  'aria-label': ['Preço mínimo', 'Preço máximo'],
  onValueCommitted: ([minimo, maximo]) => console.log(minimo, maximo),
});`,
        });

      case 'variantes': {
        return createDocsCompositions({
          id: 'variantes',
          title: t('variants.title'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'slider',
          items: [
            {
              trackId: 'single',
              name: stripHtml(t('variants.items.single')),
              description: stripHtml(t('variants.styles.single')),
              code: `createSlider({ min: 0, max: 100, value: 50, 'aria-label': 'Volume' });`,
              previewFactory: () =>
                buildLabeledSlider({
                  idPrefix: 'v-single',
                  labelText: t('demonstration.labels.volume'),
                  'aria-label': t('demonstration.labels.volume'),
                  min: 0,
                  max: 100,
                  value: 50,
                  unit: '%',
                }),
            },
            {
              trackId: 'range',
              name: stripHtml(t('variants.items.range')),
              description:
                stripHtml(t('variants.styles.range')) +
                ' O que pede as duas alças é a forma do valor: um par vira intervalo, e os callbacks passam a devolver um par.',
              code: `const intervalo = createSlider({
  min: 0, max: 1000, step: 10,
  value: [100, 400],
  'aria-label': ['Preço mínimo', 'Preço máximo'],
  onValueChange: ([minimo, maximo]) => { … },
});`,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-stack';
                wrap.dataset.spacing = 'xs';
                wrap.classList.add('nds-w-2xs');

                const row = document.createElement('div');
                row.className = 'nds-cluster';
                row.dataset.justify = 'between';
                const label = document.createElement('span');
                label.id = 'v-range-label';
                label.className = 'nds-text-body nds-font-medium';
                label.textContent = t('demonstration.labels.priceRange');
                const valueText = document.createElement('span');
                valueText.id = 'v-range-value';
                valueText.className = 'nds-text-body nds-text-muted-foreground';
                valueText.style.fontVariantNumeric = 'tabular-nums';
                valueText.setAttribute('aria-live', 'polite');
                const fmt = (par: number[]) => {
                  valueText.textContent = `R$ ${par[0]} — R$ ${par[1]}`;
                };
                fmt([100, 400]);
                row.append(label, valueText);

                // Uma chamada, duas alças: os extremos não se cruzam e cada um
                // carrega o próprio nome acessível.
                const intervalo = createSlider({
                  min: 0,
                  max: 1000,
                  step: 10,
                  value: [100, 400],
                  'aria-label': [
                    `${t('demonstration.labels.priceRange')} — mínimo`,
                    `${t('demonstration.labels.priceRange')} — máximo`,
                  ],
                  onValueChange: fmt,
                });

                wrap.append(row, intervalo);
                return wrap;
              },
            },
            {
              trackId: 'vertical',
              name: stripHtml(t('variants.items.vertical')),
              description: stripHtml(t('variants.styles.vertical')),
              code: `createSlider({
  orientation: 'vertical',
  min: 0, max: 100, value: 60,
  'aria-label': 'Volume',
});`,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-cluster';
                wrap.dataset.justify = 'center';
                // Em pé a alça anda no eixo vertical e o campo nativo declara
                // `aria-orientation="vertical"`, que é o que o leitor de tela
                // precisa para anunciar a direção certa das setas.
                wrap.appendChild(
                  createSlider({
                    orientation: 'vertical',
                    min: 0,
                    max: 100,
                    value: 60,
                    'aria-label': t('demonstration.labels.volume'),
                  }),
                );
                return wrap;
              },
            },
            {
              name: stripHtml(t('variants.items.brightness.name')),
              trackId: 'brightness',
              description: stripHtml(t('variants.items.brightness.description')),
              useWhen: stripHtml(t('variants.items.brightness.use')),
              code: `const slider = createSlider({
  min: 0, max: 100, step: 5, value: 75,
  onValueChange: (v) => { valueText.textContent = v + '%'; },
});`,
              previewFactory: () =>
                buildLabeledSlider({
                  idPrefix: 'v-brightness',
                  labelText: 'Brilho',
                  'aria-label': 'Brilho',
                  min: 0,
                  max: 100,
                  step: 5,
                  value: 75,
                  unit: '%',
                }),
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
              trackId: 'volume',
              name: stripHtml(t('variants.compositions.volume.name')),
              description: stripHtml(t('variants.compositions.volume.description')),
              useWhen: stripHtml(t('variants.compositions.volume.use')),
              code: `const slider = createSlider({
  min: 0, max: 100, value: 50,
  'aria-label': 'Volume',
  onValueChange: (v) => { valueText.textContent = v + '%'; },
});`,
              previewFactory: () =>
                buildLabeledSlider({
                  idPrefix: 'comp-volume',
                  labelText: 'Volume',
                  'aria-label': 'Volume',
                  min: 0,
                  max: 100,
                  value: 50,
                  unit: '%',
                }),
            },
            {
              trackId: 'form',
              name: stripHtml(t('variants.compositions.form.name')),
              description: stripHtml(t('variants.compositions.form.description')),
              useWhen: stripHtml(t('variants.compositions.form.use')),
              code: `// O contínuo pinta a tela; o commitado alimenta a analítica.
const slider = createSlider({
  min: 0, max: 100, value: 60,
  'aria-label': 'Volume',
  onValueChange: (v) => { valueText.textContent = v + '%'; },
  onValueCommitted: (v) => {
    track('slider_change', { component: 'slider', field_name: 'volume', value: v });
  },
});`,
              previewFactory: () => {
                const form = document.createElement('form');
                form.className = 'nds-stack';
                form.dataset.spacing = 'md';
                form.classList.add('nds-w-2xs');
                form.setAttribute('aria-label', 'Configurações de áudio');

                let lastCommitted = 60;

                const status = document.createElement('p');
                status.className = 'nds-text-caption nds-text-muted-foreground';
                status.setAttribute('aria-live', 'polite');
                status.textContent = 'Último valor confirmado: 60%';

                const slider = buildLabeledSlider({
                  idPrefix: 'comp-form-volume',
                  labelText: 'Volume',
                  'aria-label': 'Volume',
                  min: 0,
                  max: 100,
                  value: lastCommitted,
                  unit: '%',
                  onValueCommitted: (v) => {
                    lastCommitted = v;
                    status.textContent = `Último valor confirmado: ${v}%`;
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
            state: t('states.cols.state'),
            trigger: toPlainText(t('states.cols.trigger')),
            behavior: toPlainText(t('states.cols.behavior')),
          },
          items: [
            { label: t('states.default.label'),  trigger: toPlainText(t('states.default.trigger')),  behavior: toPlainText(t('states.default.behavior')) },
            { label: t('states.hover.label'),    trigger: toPlainText(t('states.hover.trigger')),    behavior: toPlainText(t('states.hover.behavior')) },
            { label: t('states.focus.label'),    trigger: toPlainText(t('states.focus.trigger')),    behavior: toPlainText(t('states.focus.behavior')) },
            { label: t('states.active.label'),   trigger: toPlainText(t('states.active.trigger')),   behavior: toPlainText(t('states.active.behavior')) },
            { label: t('states.disabled.label'), trigger: toPlainText(t('states.disabled.trigger')), behavior: toPlainText(t('states.disabled.behavior')) },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createSlider(options)
// A FORMA do valor escolhe o modo: número = uma alça, par = intervalo.
type SliderBaseOptions = {
  min?: number;          // default 0
  max?: number;          // default 100
  step?: number;         // default 1
  disabled?: boolean;    // default false
  orientation?: 'horizontal' | 'vertical';   // default 'horizontal'
  'aria-label'?: string | string[];             // par de nomes no intervalo
  class?: string;
};

export type SliderSingleOptions = SliderBaseOptions & {
  value?: number;                            // default min
  onValueChange?: (value: number) => void;
  onValueCommitted?: (value: number) => void;
};

export type SliderRangeOptions = SliderBaseOptions & {
  value: number[];                           // os dois extremos, em ordem
  onValueChange?: (value: number[]) => void;
  onValueCommitted?: (value: number[]) => void;
};

export type SliderOptions = SliderSingleOptions | SliderRangeOptions;

export function createSlider(options?: SliderSingleOptions): HTMLElement;
export function createSlider(options: SliderRangeOptions): HTMLElement;`;

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
              title: 'createSlider(options)',
              cols: propsCols,
              items: [
                { name: 'value',            type: 'number | number[]',                          defaultValue: 'min',          required: 'Não', description: 'Valor inicial. Um número cria uma alça; um par (`[min, max]`) cria o intervalo, e é a única declaração que o modo exige.' },
                { name: 'onValueChange',    type: '(value: number | number[]) => void',         defaultValue: '—',            required: 'Não', description: 'Avisado durante o arrasto e a cada tecla — um evento por movimento. Recebe um par quando o valor é um par.' },
                { name: 'onValueCommitted', type: '(value: number | number[]) => void',         defaultValue: '—',            required: 'Não', description: 'Avisado ao soltar o arrasto ou largar a tecla — um evento por interação. É o callback para analítica e envio de formulário.' },
                { name: 'orientation',      type: `'horizontal' | 'vertical'`,                  defaultValue: `'horizontal'`, required: 'Não', description: 'Direção do trilho. Em pé, a alça declara `aria-orientation="vertical"` para o leitor de tela.' },
                { name: 'ariaLabel',        type: 'string | string[]',                          defaultValue: '—',            required: 'Não', description: 'Nome acessível da alça. No intervalo, passe um par de nomes: um nome só repetido nas duas deixa quem ouve sem saber qual extremo está mexendo.' },
                { name: 'min',              type: 'number',                                     defaultValue: '0',            required: 'Não', description: toPlainText(t('props.table.min.description')) },
                { name: 'max',              type: 'number',                                     defaultValue: '100',          required: 'Não', description: toPlainText(t('props.table.max.description')) },
                { name: 'step',             type: 'number',                                     defaultValue: '1',            required: 'Não', description: toPlainText(t('props.table.step.description')) },
                { name: 'disabled',         type: 'boolean',                                    defaultValue: 'false',        required: 'Não', description: toPlainText(t('props.table.disabled.description')) },
                { name: 'class',            type: 'string',                                     defaultValue: '—',            required: 'Não', description: 'Classes .nds-* adicionais no `<div>` raiz.' },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: 'O que ainda diverge',
          extensibilityNotes:
            'O componente não tem modo controlado: <code>value</code> é o valor INICIAL e a partir daí quem manda é a interação. Não existe, portanto, uma opção <code>defaultValue</code> separada — ela seria o mesmo que <code>value</code>. Para refletir um valor vindo de fora, escreva no campo nativo interno. O resto do contrato vem pronto do navegador: <code>role="slider"</code>, <code>aria-valuenow</code>/<code>aria-valuemin</code>/<code>aria-valuemax</code> e a navegação por Arrow, Home, End, PageUp e PageDown.',
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
            { token: '--primary / 0.2', value: toPlainText(t('tokens.table.track.class')),           description: toPlainText(t('tokens.table.track.part')) },
            { token: '--primary',       value: toPlainText(t('tokens.table.range.class')),           description: toPlainText(t('tokens.table.range.part')) },
            { token: '--primary',       value: toPlainText(t('tokens.table.thumbBorder.class')),     description: toPlainText(t('tokens.table.thumbBorder.part')) },
            { token: '--background',    value: toPlainText(t('tokens.table.thumbBackground.class')), description: toPlainText(t('tokens.table.thumbBackground.part')) },
            { token: '--ring',          value: toPlainText(t('tokens.table.focusRing.class')),       description: toPlainText(t('tokens.table.focusRing.part')) },
            { token: '--radius-full',   value: toPlainText(t('tokens.table.radius.class')),          description: toPlainText(t('tokens.table.radius.part')) },
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
            { key: 'Tab',        description: toPlainText(t('accessibility.keyboard.tab'))        },
            { key: 'Arrow Right', description: toPlainText(t('accessibility.keyboard.arrowRight')) },
            { key: 'Arrow Left',  description: toPlainText(t('accessibility.keyboard.arrowLeft'))  },
            { key: 'Arrow Up',    description: toPlainText(t('accessibility.keyboard.arrowUp'))    },
            { key: 'Arrow Down',  description: toPlainText(t('accessibility.keyboard.arrowDown'))  },
            { key: 'Home',       description: toPlainText(t('accessibility.keyboard.home'))       },
            { key: 'End',        description: toPlainText(t('accessibility.keyboard.end'))        },
            { key: 'PageUp',     description: toPlainText(t('accessibility.keyboard.pageUp'))     },
            { key: 'PageDown',   description: toPlainText(t('accessibility.keyboard.pageDown'))   },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.input.name'),      description: stripHtml(t('related.items.input.description')),      path: '?path=/docs/primitives-form-input--docs'      },
            { name: t('related.items.switch.name'),     description: stripHtml(t('related.items.switch.description')),     path: '?path=/docs/primitives-form-switch--docs'     },
            { name: t('related.items.progress.name'),   description: stripHtml(t('related.items.progress.description')),   path: '?path=/docs/primitives-feedback-progress--docs'   },
            { name: t('related.items.radioGroup.name'), description: stripHtml(t('related.items.radioGroup.description')), path: '?path=/docs/primitives-form-radiogroup--docs' },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [
            { title: '', content: DOMPurify.sanitize(t('notes.item1')) },
            { title: '', content: DOMPurify.sanitize(t('notes.item2')) },
            { title: '', content: DOMPurify.sanitize(t('notes.item3')) },
            { title: '', content: DOMPurify.sanitize(t('notes.item4')) },
            {
              title: '',
              content: DOMPurify.sanitize(
                '<strong>Uma alça ou duas</strong> — o que separa os dois modos é a forma do valor: <code>value: 50</code> desenha uma alça, <code>value: [100, 400]</code> desenha o intervalo, e aí <code>onValueChange</code> e <code>onValueCommitted</code> passam a devolver um par. Cada alça é um <code>&lt;input type="range"&gt;</code> de verdade — parada de tabulação própria, nome próprio por <code>aria-label</code>, e os extremos não se cruzam. Para o ponteiro, a alça mais perto sobe: duas caixas sobrepostas disputariam o clique, e sem isso a de baixo ficaria inalcançável no meio do trilho.',
              ),
            },
            {
              title: '',
              content: DOMPurify.sanitize(
                '<strong>Dois callbacks, dois propósitos</strong> — <code>onValueChange</code> dispara a cada movimento e serve para pintar a tela; <code>onValueCommitted</code> dispara uma vez por interação, quando o arrasto é solto ou a tecla é largada, e é o que alimenta analítica e envio. Trocar um pelo outro enche o GA4 de um evento por pixel.',
              ),
            },
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
            { event: 'slider_change',        trigger: stripHtml(t('analytics.table.slider_change.trigger')) + ' (via onValueCommitted — um evento por interação)', payload: stripHtml(t('analytics.table.slider_change.payload')) },
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
              action: toPlainText(t(`testes.functional.item${i}.action`)),
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
            items: [1, 2, 3, 4, 5].map(i => ({
              criterion: toPlainText(t(`testes.accessibility.item${i}`)),
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
              story: toPlainText(t(`testes.visual.item${i}.story`)),
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
