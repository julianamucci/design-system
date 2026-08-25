import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import DOMPurify from 'dompurify';
import { createActiveSectionObserver } from '@/lib/use-active-section';
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
    (radioGroupTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  );
}
const { t, subscribe } = createTranslation(radioGroupTranslations as Record<string, unknown>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
}): HTMLElement {
  const { name, legendText, items, defaultValue, ariaInvalid, horizontal } = opts;

  // `orientation` já é o contrato: a factory vira `aria-orientation`, e
  // `.nds-radio-group[aria-orientation="horizontal"]` traz o grid em coluna com
  // `gap: var(--spacing-6)`. Cravar as três declarações inline duplicava a folha
  // — e sem o atributo o leitor de tela anunciava o grupo como vertical.
  //
  // A legenda também é da factory: um `<legend>` dentro do próprio `<fieldset>`,
  // e não um `<p>` do lado de fora amarrado por `aria-labelledby` à mão.
  const group = createRadioGroup({
    name,
    legend: legendText,
    defaultValue,
    items,
    orientation: horizontal ? 'horizontal' : undefined,
  });
  if (ariaInvalid) {
    group.setAttribute('aria-invalid', 'true');
    group.querySelectorAll<HTMLButtonElement>('[data-slot="radio-group-item"]').forEach((btn) => {
      // A borda vermelha é da folha: `.nds-radio-item[aria-invalid="true"]` pinta
      // `border-color` sozinha. Classe extra aqui só duplicaria a regra.
      btn.setAttribute('aria-invalid', 'true');
    });
  }

  return group;
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
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/form' },
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
            wrap.dataset.spacing = 'lg';

            // Vertical — Forma de pagamento
            const payment = buildRadioGroupWithLegend({
              name: 'demo-payment',
              legendText: t('demonstration.labels.groupLabel'),
              items: [
                { value: 'card',    label: t('demonstration.labels.card')    },
                { value: 'pix',     label: t('demonstration.labels.pix')     },
                { value: 'boleto',  label: t('demonstration.labels.boleto')  },
              ],
            });
            const wireRadioTracking = (root: HTMLElement, name: string) => {
              let previousValue = '';
              const group = root.querySelector('[role="radiogroup"]') as HTMLElement | null;
              group?.querySelectorAll<HTMLButtonElement>('[data-slot="radio-group-item"]').forEach((btn) => {
                btn.addEventListener('click', () => {
                  if (btn.getAttribute('aria-checked') === 'true') {
                    const value = btn.dataset.value ?? '';
                    if (value === previousValue) return;
                    track('radio_change', {
                      component: 'radio_group',
                      name,
                      value,
                      previous_value: previousValue || undefined,
                      location: 'docs_demo',
                    });
                    previousValue = value;
                  }
                });
              });
            };

            wireRadioTracking(payment, 'payment');
            wrap.appendChild(payment);

            // Horizontal — Forma de entrega
            const delivery = buildRadioGroupWithLegend({
              name: 'demo-delivery',
              legendText: t('demonstration.labels.deliveryLabel'),
              items: [
                { value: 'standard', label: t('demonstration.labels.standard') },
                { value: 'express',  label: t('demonstration.labels.express')  },
                { value: 'pickup',   label: t('demonstration.labels.pickup')   },
              ],
              horizontal: true,
            });
            wireRadioTracking(delivery, 'delivery');
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
            legendText: 'Forma de pagamento',
            items: [
              { value: 'card', label: 'Cartão de crédito' },
              { value: 'pix',  label: 'Pix' },
            ],
          });
        const buildDontUnlabeled = () =>
          // Don't: sem `legend` — o grupo fica sem nome e as opções soltas.
          createRadioGroup({
            name: 'dodont-dont',
            items: [
              { value: 'card', label: 'Cartão' },
              { value: 'pix',  label: 'Pix' },
            ],
          });
        const buildDoNoPreselect = () =>
          buildRadioGroupWithLegend({
            name: 'dodont-no-preselect',
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
              doCaption: toPlainText(t('doDont.pair1.do')),
              dontCaption: toPlainText(t('doDont.pair1.dont')),
              doPreviewFactory: buildDoLabeled,
              dontPreviewFactory: buildDontUnlabeled,
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: buildDoNoPreselect,
              dontPreviewFactory: buildDontPreselect,
            },
          ],
        });
      }

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: 'Importação do factory custom (Nortear):',
          code: `import { createRadioGroup, type RadioGroupOptions, type RadioGroupItem } from '@/components/ui/radio-group';`,
          secondaryDescription: 'Uso básico:',
          secondaryCode: `const group = createRadioGroup({
  name: 'payment',
  // A pergunta do grupo, visível na <legend> do fieldset.
  legend: 'Forma de pagamento',
  items: [
    { value: 'card',   label: 'Cartão de crédito' },
    { value: 'pix',    label: 'Pix' },
    { value: 'boleto', label: 'Boleto bancário' },
  ],
  onValueChange: (value) => console.log('selected:', value),
});`,
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
              code: `createRadioGroup({ name: 'payment', legend: 'Forma de pagamento', items });`,
              previewFactory: () =>
                buildRadioGroupWithLegend({
                  name: 'v-vertical',
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
              code: `createRadioGroup({\n  name: 'delivery',\n  legend: 'Forma de entrega',\n  orientation: 'horizontal',\n  items,\n});`,
              previewFactory: () =>
                buildRadioGroupWithLegend({
                  name: 'v-horizontal',
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
              code: `// Factory não expõe \`description\` por item — composição manual:\nconst group = createRadioGroup({\n  name: 'delivery',\n  legend: 'Forma de entrega',\n  items,\n});\n// percorra as .nds-radio-row e injete <p> de descrição ao lado do <label>`,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-stack';
                wrap.dataset.spacing = 'sm';

                const items = [
                  { value: 'standard', label: t('demonstration.labels.standard'), description: 'Entrega em 5 dias úteis.' },
                  { value: 'express',  label: t('demonstration.labels.express'),  description: 'Receba em 1 dia útil.'   },
                  { value: 'pickup',   label: t('demonstration.labels.pickup'),   description: 'Disponível em 2h.'        },
                ];

                const base = createRadioGroup({
                  name: 'v-with-desc',
                  legend: t('demonstration.labels.deliveryLabel'),
                  items: items.map(i => ({ value: i.value, label: i.label })),
                });

                const lines = Array.from(base.querySelectorAll<HTMLElement>('.nds-radio-row'));
                items.forEach((item, idx) => {
                  const row = lines[idx];
                  if (!row) return;
                  row.style.alignItems = 'flex-start';
                  const label = row.querySelector('label');
                  if (label) {
                    const tg = document.createElement('div');
                    tg.className = 'nds-stack';
                    tg.dataset.spacing = 'xs';
                    label.replaceWith(tg);
                    label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';
                    const desc = document.createElement('p');
                    desc.className = 'nds-text-body';
                    desc.textContent = item.description;
                    tg.append(label, desc);
                  }
                });

                wrap.appendChild(base);
                return wrap;
              },
            },
          ],
        });
      }

      case 'composicoes': {
        const buildInForm = () => {
          const form = document.createElement('form');
          form.className = 'nds-stack nds-p-4 nds-border-default nds-rounded-lg nds-w-sm';
          form.dataset.spacing = 'md';
          form.noValidate = true;

          // O `<fieldset>` com `<legend>` nativo é o do próprio grupo — não há
          // um segundo agrupamento em volta só para carregar a legenda.
          const group = createRadioGroup({
            name: 'payment',
            legend: 'Forma de pagamento',
            items: [
              { value: 'card', label: 'Cartão de crédito' },
              { value: 'pix', label: 'Pix' },
              { value: 'boleto', label: 'Boleto bancário' },
            ],
          });
          form.appendChild(group);

          const submit = document.createElement('button');
          submit.type = 'submit';
          submit.className = 'btn btn-primary';
          submit.style.alignSelf = 'flex-end';
          submit.textContent = 'Continuar';
          form.appendChild(submit);

          const out = document.createElement('p');
          out.className = 'nds-text-body';
          out.dataset.testid = 'form-output';
          form.appendChild(out);

          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = new FormData(form);
            out.textContent = `Selecionado: ${data.get('payment') ?? '(nenhum)'}`;
          });

          return form;
        };

        const codeInForm = `const form = document.createElement('form');
form.className = 'nds-stack nds-p-4 nds-border-default nds-rounded-lg';

// A factory já emite o <fieldset> com <legend> — não embrulhe num segundo.
const group = createRadioGroup({
  name: 'payment',
  legend: 'Forma de pagamento',
  items: [
    { value: 'card', label: 'Cartão de crédito' },
    { value: 'pix', label: 'Pix' },
    { value: 'boleto', label: 'Boleto bancário' },
  ],
});
form.appendChild(group);

const submit = document.createElement('button');
submit.type = 'submit';
submit.className = 'btn btn-primary self-end';
submit.textContent = 'Continuar';
form.appendChild(submit);

const out = document.createElement('p');
out.className = 'nds-text-body';
out.dataset.testid = 'form-output';
form.appendChild(out);

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(form);
  out.textContent = \`Selecionado: \${data.get('payment') ?? '(nenhum)'}\`;
});`;

        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'radio-group',
          items: [
            {
              name: t('variants.compositions.inForm.name'),
              description: t('variants.compositions.inForm.description'),
              useWhen: t('variants.compositions.inForm.use'),
              code: codeInForm,
              previewFactory: buildInForm,
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
            { label: t('states.default.label'),  trigger: toPlainText(t('states.default.trigger')),  behavior: toPlainText(t('states.default.behavior')) },
            { label: t('states.checked.label'),  trigger: toPlainText(t('states.checked.trigger')),  behavior: toPlainText(t('states.checked.behavior')) },
            { label: t('states.hover.label'),    trigger: toPlainText(t('states.hover.trigger')),    behavior: toPlainText(t('states.hover.behavior')) },
            { label: t('states.focus.label'),    trigger: toPlainText(t('states.focus.trigger')),    behavior: toPlainText(t('states.focus.behavior')) },
            { label: t('states.disabled.label'), trigger: toPlainText(t('states.disabled.trigger')), behavior: toPlainText(t('states.disabled.behavior')) },
            { label: t('states.invalid.label'),  trigger: toPlainText(t('states.invalid.trigger')),  behavior: toPlainText(t('states.invalid.behavior')) },
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
  /** Pergunta do grupo, VISÍVEL, num <legend> — a forma preferida de nomear. */
  legend?: string;
  /** Nome invisível, para quando a pergunta já está dita por um título ao lado. */
  'aria-label'?: string;
  disabled?: boolean;
  orientation?: 'vertical' | 'horizontal';
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
              title: 'createRadioGroup(options) — Nortear',
              cols: propsCols,
              items: [
                { name: 'name',          type: 'string',                            defaultValue: '—',      required: 'Sim', description: toPlainText(t('props.table.name.description')) + ' Obrigatório no Nortear (não-controlado, participa do `FormData`).' },
                { name: 'items',         type: 'RadioGroupItem[]',                  defaultValue: '—',      required: 'Sim', description: 'Lista de itens. Cada item: { value, label, disabled? }.' },
                { name: 'defaultValue',  type: 'string',                            defaultValue: '—',      required: 'Não', description: toPlainText(t('props.table.defaultValue.description')) + ' Não há prop `value` controlada — o factory é não-controlado.' },
                { name: 'legend',        type: 'string',                            defaultValue: '—',      required: 'Sim*', description: '*Nome do grupo, VISÍVEL, num `<legend>` dentro do `<fieldset>`. É a forma preferida: quem vê as opções também lê a pergunta que elas respondem.' },
                { name: 'aria-label',    type: 'string',                            defaultValue: '—',      required: 'Sim*', description: '*Alternativa a `legend` quando a pergunta já está dita por um título próximo. Ignorado se `legend` for passado — dois nomes no mesmo elemento é o defeito, não a solução.' },
                { name: 'disabled',      type: 'boolean',                           defaultValue: 'false',  required: 'Não', description: 'Trava o grupo inteiro; cada item herda. `items[i].disabled` trava só um.' },
                { name: 'orientation',   type: '"vertical" | "horizontal"',         defaultValue: '"vertical"', required: 'Não', description: 'Direção da navegação por setas. Vira `aria-orientation`, que é também o gancho do layout em linha.' },
                { name: 'onValueChange', type: '(value: string) => void',           defaultValue: '—',      required: 'Não', description: toPlainText(t('props.table.onValueChange.description')) },
                { name: 'class',         type: 'string',                            defaultValue: '—',      required: 'Não', description: 'Classes .nds-* adicionais no `<fieldset>` raiz.' },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: 'Divergências da factory custom (Nortear)',
          extensibilityNotes:
            'O factory custom diverge das libs upstream nos seguintes pontos: (1) é estritamente não-controlado — não aceita prop `value`; use `defaultValue` + `onValueChange`. (2) Não expõe campo `description` por item — componha o layout manualmente. (3) O grupo é um `<fieldset>` de verdade, então o nome preferido é a `<legend>` da opção `legend`, e não um rótulo invisível. Em todos os outros pontos (ARIA, navegação por setas, role) o comportamento é equivalente às libs upstream.',
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
            { token: '--background',  value: toPlainText(t('tokens.table.background.class')),  description: toPlainText(t('tokens.table.background.part')) },
            { token: '--primary',     value: toPlainText(t('tokens.table.primary.class')),     description: toPlainText(t('tokens.table.primary.part')) },
            { token: '--ring',        value: toPlainText(t('tokens.table.ring.class')),        description: toPlainText(t('tokens.table.ring.part')) },
            { token: '--destructive', value: toPlainText(t('tokens.table.destructive.class')), description: toPlainText(t('tokens.table.destructive.part')) },
            { token: '--foreground',  value: toPlainText(t('tokens.table.foreground.class')),  description: toPlainText(t('tokens.table.foreground.part')) },
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
            { key: 'Tab',         description: t('accessibility.keyboard.tab')        },
            { key: 'Arrow Down',   description: t('accessibility.keyboard.arrowDown')  },
            { key: 'Arrow Up',     description: t('accessibility.keyboard.arrowUp')    },
            { key: 'Arrow Right',  description: t('accessibility.keyboard.arrowRight') },
            { key: 'Arrow Left',   description: t('accessibility.keyboard.arrowLeft')  },
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
            { title: '', content: DOMPurify.sanitize(t('notes.item1')) },
            { title: '', content: DOMPurify.sanitize(t('notes.item2')) },
            { title: '', content: DOMPurify.sanitize(t('notes.item3')) },
            { title: '', content: DOMPurify.sanitize(t('notes.item4')) },
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
            { event: 'radio_change',         trigger: toPlainText(t('analytics.table.radio_change.trigger')), payload: t('analytics.table.radio_change.payload') },
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
        component_name: 'radio-group',
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
