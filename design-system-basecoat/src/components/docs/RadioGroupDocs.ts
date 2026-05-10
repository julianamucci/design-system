import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { createRadioGroup } from '@/components/ui/radio-group';
import uiTranslations from '@/i18n/ui.json';
import radioGroupTranslations from '@shared/content/radio-group/translations.json';

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
const { t, subscribe } = createTranslation(radioGroupTranslations as Record<string, unknown>);

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

function buildRadioGroupWithLegend(opts: {
  name: string;
  legendText: string;
  items: { value: string; label: string; disabled?: boolean }[];
  defaultValue?: string;
  ariaInvalid?: boolean;
  horizontal?: boolean;
  idPrefix?: string;
}): HTMLElement {
  const { name, legendText, items, defaultValue, ariaInvalid, horizontal, idPrefix = name } = opts;

  const wrap = document.createElement('div');
  wrap.className = 'flex flex-col gap-2';

  const legend = document.createElement('p');
  const legendId = `${idPrefix}-legend`;
  legend.id = legendId;
  legend.className = 'text-sm font-semibold';
  legend.textContent = legendText;

  const group = createRadioGroup({
    name,
    defaultValue,
    items,
    ...(horizontal ? { class: 'grid-flow-col auto-cols-max gap-6' } : {}),
  });
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-labelledby', legendId);
  if (ariaInvalid) {
    group.setAttribute('aria-invalid', 'true');
    group.querySelectorAll<HTMLButtonElement>('[data-slot="radio-group-item"]').forEach((btn) => {
      btn.setAttribute('aria-invalid', 'true');
      btn.classList.add('border-destructive', 'ring-destructive/20');
    });
  }

  wrap.append(legend, group);
  return wrap;
}

// ─── createRadioGroupDocs ─────────────────────────────────────────────────────

export function createRadioGroupDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'radio-group',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/formulario' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', { component_name: 'radio-group', locale, page_title: `${t('title')} · Design System` });
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
      installNote: 'npx shadcn@latest add radio-group',
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
            wrap.className = 'flex flex-col gap-6';

            // Vertical — Forma de pagamento
            const payment = buildRadioGroupWithLegend({
              name: 'demo-payment',
              idPrefix: 'demo-payment',
              legendText: t('demonstration.labels.groupLabel'),
              items: [
                { value: 'card',    label: t('demonstration.labels.card')    },
                { value: 'pix',     label: t('demonstration.labels.pix')     },
                { value: 'boleto',  label: t('demonstration.labels.boleto')  },
              ],
            });
            const paymentGroup = payment.querySelector('[role="radiogroup"]') as HTMLElement | null;
            paymentGroup?.querySelectorAll<HTMLButtonElement>('[data-slot="radio-group-item"]').forEach((btn) => {
              btn.addEventListener('click', () => {
                if (btn.getAttribute('aria-checked') === 'true') {
                  track('field_change', {
                    component: 'radio_group',
                    field_name: 'payment',
                    value: btn.dataset.value ?? '',
                    location: 'docs-demo',
                  });
                }
              });
            });
            wrap.appendChild(payment);

            // Horizontal — Forma de entrega
            const delivery = buildRadioGroupWithLegend({
              name: 'demo-delivery',
              idPrefix: 'demo-delivery',
              legendText: t('demonstration.labels.deliveryLabel'),
              items: [
                { value: 'standard', label: t('demonstration.labels.standard') },
                { value: 'express',  label: t('demonstration.labels.express')  },
                { value: 'pickup',   label: t('demonstration.labels.pickup')   },
              ],
              horizontal: true,
            });
            wrap.appendChild(delivery);

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
        const buildDoLabeled = () =>
          buildRadioGroupWithLegend({
            name: 'dodont-do',
            idPrefix: 'dodont-do',
            legendText: 'Forma de pagamento',
            items: [
              { value: 'card', label: 'Cartão de crédito' },
              { value: 'pix',  label: 'Pix' },
            ],
          });
        const buildDontUnlabeled = () => {
          // Sem legend/aria-labelledby — radios "soltos"
          const group = createRadioGroup({
            name: 'dodont-dont',
            items: [
              { value: 'card', label: 'Cartão' },
              { value: 'pix',  label: 'Pix' },
            ],
          });
          group.removeAttribute('aria-labelledby');
          return group;
        };
        const buildDoNoPreselect = () =>
          buildRadioGroupWithLegend({
            name: 'dodont-no-preselect',
            idPrefix: 'dodont-no-preselect',
            legendText: 'Forma de pagamento',
            items: [
              { value: 'card', label: 'Cartão de crédito' },
              { value: 'pix',  label: 'Pix' },
              { value: 'boleto', label: 'Boleto bancário' },
            ],
          });
        const buildDontPreselect = () =>
          buildRadioGroupWithLegend({
            name: 'dodont-preselect',
            idPrefix: 'dodont-preselect',
            legendText: 'Forma de pagamento',
            defaultValue: 'card',
            items: [
              { value: 'card', label: 'Cartão de crédito' },
              { value: 'pix',  label: 'Pix' },
              { value: 'boleto', label: 'Boleto bancário' },
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
              doPreviewFactory: buildDoLabeled,
              dontPreviewFactory: buildDontUnlabeled,
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: buildDoNoPreselect,
              dontPreviewFactory: buildDontPreselect,
            },
          ],
        });
      }

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: 'Importação do factory custom (Basecoat):',
          code: `import { createRadioGroup, type RadioGroupOptions, type RadioGroupItem } from '@/components/ui/radio-group';`,
          secondaryDescription: 'Uso básico:',
          secondaryCode: `const group = createRadioGroup({
  name: 'payment',
  items: [
    { value: 'card',   label: 'Cartão de crédito' },
    { value: 'pix',    label: 'Pix' },
    { value: 'boleto', label: 'Boleto bancário' },
  ],
  onValueChange: (value) => console.log('selected:', value),
});

// Associe um legend externo via aria-labelledby
group.setAttribute('role', 'radiogroup');
group.setAttribute('aria-labelledby', 'payment-legend');`,
        });

      case 'variantes': {
        return createDocsVariants({
          id: 'variantes',
          title: t('variants.title'),
          componentSlug: 'radio-group',
          items: [
            {
              name: stripHtml(t('variants.items.vertical')),
              description: stripHtml(t('variants.styles.vertical')),
              code: `createRadioGroup({ name: 'payment', items });`,
              previewFactory: () =>
                buildRadioGroupWithLegend({
                  name: 'v-vertical',
                  idPrefix: 'v-vertical',
                  legendText: t('demonstration.labels.groupLabel'),
                  items: [
                    { value: 'card', label: t('demonstration.labels.card') },
                    { value: 'pix',  label: t('demonstration.labels.pix') },
                    { value: 'boleto', label: t('demonstration.labels.boleto') },
                  ],
                }),
            },
            {
              name: stripHtml(t('variants.items.horizontal')),
              description: stripHtml(t('variants.styles.horizontal')),
              code: `createRadioGroup({ name: 'delivery', items, class: 'grid-flow-col auto-cols-max gap-6' });`,
              previewFactory: () =>
                buildRadioGroupWithLegend({
                  name: 'v-horizontal',
                  idPrefix: 'v-horizontal',
                  legendText: t('demonstration.labels.deliveryLabel'),
                  horizontal: true,
                  items: [
                    { value: 'standard', label: t('demonstration.labels.standard') },
                    { value: 'express',  label: t('demonstration.labels.express') },
                    { value: 'pickup',   label: t('demonstration.labels.pickup') },
                  ],
                }),
            },
            {
              name: stripHtml(t('variants.items.withDescription')),
              description: stripHtml(t('variants.styles.withDescription')),
              code: `// Factory não expõe \`description\` por item — composição manual:\nconst group = createRadioGroup({ name: 'delivery', items });\n// percorra group.children e injete <p> de descrição ao lado do <label>`,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'flex flex-col gap-2';
                const legend = document.createElement('p');
                legend.id = 'v-desc-legend';
                legend.className = 'text-sm font-semibold';
                legend.textContent = t('demonstration.labels.deliveryLabel');

                const items = [
                  { value: 'standard', label: t('demonstration.labels.standard'), description: 'Entrega em 5 dias úteis.' },
                  { value: 'express',  label: t('demonstration.labels.express'),  description: 'Receba em 1 dia útil.'   },
                  { value: 'pickup',   label: t('demonstration.labels.pickup'),   description: 'Disponível em 2h.'        },
                ];

                const base = createRadioGroup({
                  name: 'v-with-desc',
                  items: items.map(i => ({ value: i.value, label: i.label })),
                });
                base.setAttribute('role', 'radiogroup');
                base.setAttribute('aria-labelledby', 'v-desc-legend');

                items.forEach((item, idx) => {
                  const row = base.children[idx] as HTMLElement;
                  if (!row) return;
                  row.classList.remove('items-center');
                  row.classList.add('items-start');
                  const label = row.querySelector('label');
                  if (label) {
                    const tg = document.createElement('div');
                    tg.className = 'flex flex-col gap-1';
                    label.replaceWith(tg);
                    label.className = 'text-sm font-medium leading-none cursor-pointer';
                    const desc = document.createElement('p');
                    desc.className = 'text-sm text-muted-foreground';
                    desc.textContent = item.description;
                    tg.append(label, desc);
                  }
                });

                wrap.append(legend, base);
                return wrap;
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
            { label: t('states.items.checked'),  trigger: 'value === defaultValue ou click',          behavior: stripHtml(t('states.descriptions.checked'))  },
            { label: t('states.items.hover'),    trigger: 'pointer sobre o item',                     behavior: stripHtml(t('states.descriptions.hover'))    },
            { label: t('states.items.focus'),    trigger: 'Tab ou navegação por setas',               behavior: stripHtml(t('states.descriptions.focus'))    },
            { label: t('states.items.disabled'), trigger: 'item.disabled === true',                    behavior: stripHtml(t('states.descriptions.disabled')) },
            { label: t('states.items.invalid'),  trigger: 'aria-invalid="true" no grupo ou item',     behavior: stripHtml(t('states.descriptions.invalid'))  },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createRadioGroup(options)
export type RadioGroupItem = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type RadioGroupOptions = {
  name: string;
  items: RadioGroupItem[];
  defaultValue?: string;
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
              title: 'createRadioGroup(options) — Basecoat',
              cols: propsCols,
              items: [
                { name: 'name',          type: 'string',                            defaultValue: '—',      required: 'Sim', description: stripHtml(t('props.table.name.description')) + ' Obrigatório no Basecoat (não-controlado, participa do `FormData`).' },
                { name: 'items',         type: 'RadioGroupItem[]',                  defaultValue: '—',      required: 'Sim', description: 'Lista de itens. Cada item: { value, label, disabled? }.' },
                { name: 'defaultValue',  type: 'string',                            defaultValue: '—',      required: 'Não', description: stripHtml(t('props.table.defaultValue.description')) + ' Não há prop `value` controlada — o factory é não-controlado.' },
                { name: 'onValueChange', type: '(value: string) => void',           defaultValue: '—',      required: 'Não', description: stripHtml(t('props.table.onValueChange.description')) },
                { name: 'class',         type: 'string',                            defaultValue: '—',      required: 'Não', description: 'Classes Tailwind adicionais no `<fieldset>` raiz.' },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: 'Divergências da factory custom (Basecoat)',
          extensibilityNotes:
            'O factory custom diverge das libs upstream nos seguintes pontos: (1) é estritamente não-controlado — não aceita prop `value`; use `defaultValue` + `onValueChange`. (2) Não expõe prop `disabled` no grupo — desabilite item-a-item via `items[i].disabled`. (3) Não expõe prop `orientation` — aplique `grid-flow-col auto-cols-max gap-6` via `class` para layout horizontal. (4) Não expõe campo `description` por item — componha o layout manualmente. Em todos os outros pontos (ARIA, navegação por setas, role) o comportamento é equivalente às libs upstream.',
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
            { token: '--input',              value: stripHtml(t('tokens.table.input.class')),             description: stripHtml(t('tokens.table.input.part')) },
            { token: '--primary',            value: stripHtml(t('tokens.table.primary.class')),           description: stripHtml(t('tokens.table.primary.part')) },
            { token: '--primary-foreground', value: stripHtml(t('tokens.table.primaryForeground.class')), description: stripHtml(t('tokens.table.primaryForeground.part')) },
            { token: '--ring',               value: stripHtml(t('tokens.table.ring.class')),              description: stripHtml(t('tokens.table.ring.part')) },
            { token: '--destructive',        value: stripHtml(t('tokens.table.destructive.class')),       description: stripHtml(t('tokens.table.destructive.part')) },
            { token: '--foreground',         value: stripHtml(t('tokens.table.foreground.class')),        description: stripHtml(t('tokens.table.foreground.part')) },
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
            { key: 'ArrowDown',   description: t('accessibility.keyboard.arrowDown')  },
            { key: 'ArrowUp',     description: t('accessibility.keyboard.arrowUp')    },
            { key: 'ArrowRight',  description: t('accessibility.keyboard.arrowRight') },
            { key: 'ArrowLeft',   description: t('accessibility.keyboard.arrowLeft')  },
            { key: 'Space',       description: t('accessibility.keyboard.space')      },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.checkbox.name'), description: stripHtml(t('related.items.checkbox.description')), path: '?path=/docs/ui-checkbox--docs' },
            { name: t('related.items.switch.name'),   description: stripHtml(t('related.items.switch.description')),   path: '?path=/docs/ui-switch--docs'   },
            { name: t('related.items.select.name'),   description: stripHtml(t('related.items.select.description')),   path: '?path=/docs/ui-select--docs'   },
            { name: t('related.items.form.name'),     description: stripHtml(t('related.items.form.description')),     path: '?path=/docs/ui-form--docs'     },
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
            { event: 'radio_change',         trigger: t('analytics.table.radio_change.trigger'), payload: t('analytics.table.radio_change.payload') },
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

  let observer: IntersectionObserver | null = null;

  function attachObserver() {
    observer?.disconnect();
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          updateActiveNav(id);
          track('docs_section_viewed', { section_id: id, component_name: 'radio-group', locale: getLocale() });
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
