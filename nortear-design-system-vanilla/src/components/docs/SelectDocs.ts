import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import DOMPurify from 'dompurify';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createSelect, type SelectItem } from '@/components/ui/select';
import { createButton } from '@/components/ui/button';
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
import { stripHtml, toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
function screenReaderItems(): string[] {
  const locale = getLocale();
  return Object.values(
    (selectTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  );
}
const { t, subscribe } = createTranslation(selectTranslations as Record<string, unknown>);

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
 * Traçados de ícone usados pela variante com ícone (lucide `mail`, `phone`,
 * `message-circle`). O envelope são dois traçados: reduzi-lo a um daria um
 * desenho diferente do que as outras stacks mostram.
 */
const ICONES = {
  email: [
    'm22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7',
    'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  ],
  telefone:
    'M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384',
  chat: 'M7.9 20A9 9 0 1 0 4 16.1L2 22Z',
};

/**
 * Canais de contato da variante com ícone.
 *
 * Os rótulos moram no código, e não no conteúdo compartilhado, porque é lá que as
 * outras stacks também os mantêm — o `translations.json` do select não declara
 * este exemplo. Trocar isso é decisão de conteúdo, e vale para as cinco de uma
 * vez, não só para esta.
 */
function canaisDeContato(): SelectItem[] {
  const locale = getLocale();
  const telefone = locale === 'en' ? 'Phone' : locale === 'es' ? 'Teléfono' : 'Telefone';
  return [
    { value: 'email', label: 'E-mail', icon: ICONES.email },
    { value: 'phone', label: telefone, icon: ICONES.telefone },
    { value: 'chat', label: 'Chat', icon: ICONES.chat },
  ];
}

/** Nome acessível do campo de canal — não há rótulo visível neste exemplo. */
function rotuloDeCanal(): string {
  const locale = getLocale();
  if (locale === 'en') return 'Select contact channel';
  if (locale === 'es') return 'Selecciona canal de contacto';
  return 'Selecionar canal de contato';
}

/**
 * Campo com rótulo externo associado por `for`/`id`.
 *
 * O nome acessível vem do `aria-label`, e não do `<label>`: o gatilho é um
 * `role="combobox"`, que não aceita nome vindo do próprio conteúdo — e o
 * conteúdo dele é justamente o valor exibido.
 *
 * Monta tudo por `createElement` + `textContent`, sem `innerHTML`: não há
 * caminho de injeção pelos rótulos.
 */
function buildLabeledSelect(opts: {
  id: string;
  labelText: string;
  name: string;
  items: SelectItem[];
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
    id: opts.id,
    name: opts.name,
    items: opts.items,
    placeholder: opts.placeholder,
    defaultValue: opts.defaultValue,
    disabled: opts.disabled,
    'aria-label': opts.labelText,
    // A borda e o anel do estado inválido vêm da folha compartilhada. A docs page
    // não pinta nada por fora: se ela pintasse, a regra do CSS poderia sumir sem
    // que a página mudasse de aparência.
    'aria-invalid': opts.ariaInvalid,
    onValueChange: opts.onValueChange,
  });

  wrap.append(label, select);
  return wrap;
}

/** Mesmo campo, com as opções reunidas em grupos nomeados por um cabeçalho. */
function buildLabeledSelectWithGroups(opts: {
  id: string;
  labelText: string;
  name: string;
  placeholder: string;
  groups: { label: string; items: { value: string; label: string }[] }[];
  onValueChange?: (value: string) => void;
}): HTMLElement {
  return buildLabeledSelect({
    id: opts.id,
    labelText: opts.labelText,
    name: opts.name,
    placeholder: opts.placeholder,
    onValueChange: opts.onValueChange,
    items: opts.groups.map((g) => ({ type: 'group', label: g.label, items: g.items })),
  });
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
                track('option_select', {
                  component: 'select',
                  field_name: 'state',
                  value,
                  label: labelMap[value],
                  location: 'docs_demo',
                });
              },
            });
            wrap.appendChild(stateField);

            // O rótulo do payload sai deste mapa, e não do texto renderizado: o
            // evento tem de carregar valor estável, senão a mesma escolha vira
            // três eventos diferentes no GA4, um por idioma.
            const regionLabels: Record<string, string> = {
              sp: t('demonstration.labels.sp'),
              rj: t('demonstration.labels.rj'),
              mg: t('demonstration.labels.mg'),
              es: t('demonstration.labels.es'),
              rs: t('demonstration.labels.rs'),
              sc: t('demonstration.labels.sc'),
              pr: t('demonstration.labels.pr'),
            };

            const regionField = buildLabeledSelectWithGroups({
              id: 'demo-region',
              labelText: t('demonstration.labels.regionLabel'),
              name: 'region',
              placeholder: t('demonstration.labels.placeholder'),
              onValueChange: (value) => {
                track('option_select', {
                  component: 'select',
                  field_name: 'region',
                  value,
                  label: regionLabels[value],
                  location: 'docs_demo',
                });
              },
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
              doCaption: toPlainText(t('doDont.pair1.do')),
              dontCaption: toPlainText(t('doDont.pair1.dont')),
              doPreviewFactory: buildDoConsistent,
              dontPreviewFactory: buildDontMixed,
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: buildDoGroups,
              dontPreviewFactory: buildDontSoloGroup,
            },
          ],
        });
      }

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: 'Importação da fábrica:',
          code: `import { createSelect, type SelectOptions, type SelectItem } from '@/components/ui/select';`,
          secondaryDescription: 'Uso básico:',
          secondaryCode: `const campo = createSelect({
  id: 'state',
  name: 'state',
  placeholder: 'Selecione...',
  // O nome acessível vem daqui: o gatilho é um combobox, e combobox não
  // aceita nome vindo do próprio conteúdo.
  'aria-label': 'Estado',
  items: [
    { value: 'sp', label: 'São Paulo' },
    { value: 'rj', label: 'Rio de Janeiro' },
    { value: 'mg', label: 'Minas Gerais' },
  ],
  onValueChange: (value) => console.log('escolhido:', value),
});

document.querySelector('#campo')?.append(campo);

// Ao desmontar a tela, solte os ouvintes de documento e o painel em portal.
// Chamar duas vezes não faz nada na segunda, e sair do documento já dispara.
campo.destroy();`,
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
              code: `createSelect({ placeholder: 'Selecione...', 'aria-label': 'Estado', items });`,
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
              code: `createSelect({\n  placeholder: 'Selecione...',\n  'aria-label': 'Região',\n  items: [\n    { type: 'group', label: 'Sudeste', items: [\n      { value: 'sp', label: 'São Paulo' },\n      { value: 'rj', label: 'Rio de Janeiro' },\n    ] },\n    { type: 'separator' },\n    { type: 'group', label: 'Sul', items: [\n      { value: 'rs', label: 'Rio Grande do Sul' },\n      { value: 'sc', label: 'Santa Catarina' },\n    ] },\n  ],\n});`,
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
              description: stripHtml(t('variants.styles.withIcon')),
              code: `createSelect({\n  placeholder: 'Selecione...',\n  'aria-label': 'Canal de contato',\n  items: [\n    // Um ou mais traçados 24×24. O desenho é decorativo: entra aria-hidden,\n    // e o nome acessível da opção continua sendo só o rótulo.\n    { value: 'email', label: 'E-mail', icon: ['m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7', 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'] },\n    { value: 'chat', label: 'Chat', icon: 'M7.9 20A9 9 0 1 0 4 16.1L2 22Z' },\n  ],\n});`,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-stack';
                wrap.dataset.spacing = 'xs';
                wrap.appendChild(
                  createSelect({
                    placeholder: t('demonstration.labels.placeholder'),
                    'aria-label': rotuloDeCanal(),
                    items: canaisDeContato(),
                  }),
                );
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

const campo = createSelect({
  id: 'form-state',
  name: 'state',
  required: true,
  'aria-label': 'Estado',
  placeholder: 'Selecione...',
  items: [
    { value: 'sp', label: 'São Paulo' },
    { value: 'rj', label: 'Rio de Janeiro' },
    { value: 'mg', label: 'Minas Gerais' },
  ],
});

field.append(label, campo);
form.appendChild(field);

// A fábrica do design system, e não classes montadas à mão: fora dela o botão
// sai sem estilo e o contraste do texto fica entregue ao acaso do tema.
const submit = createButton({ type: 'submit', label: 'Continuar' });
submit.style.alignSelf = 'flex-end';
form.appendChild(submit);

form.addEventListener('submit', (e) => {
  e.preventDefault();
  // O campo escondido da fábrica carrega o valor: a serialização é nativa.
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
                  id: 'comp-form-state',
                  name: 'state',
                  required: true,
                  'aria-label': t('demonstration.labels.stateLabel'),
                  placeholder: t('demonstration.labels.placeholder'),
                  items: [
                    { value: 'sp', label: t('demonstration.labels.sp') },
                    { value: 'rj', label: t('demonstration.labels.rj') },
                    { value: 'mg', label: t('demonstration.labels.mg') },
                  ],
                });

                field.append(label, select);
                form.appendChild(field);

                const submit = createButton({ type: 'submit', label: 'Continuar' });
                submit.style.alignSelf = 'flex-end';
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
            state: t('states.cols.state'),
            trigger: toPlainText(t('states.cols.trigger')),
            behavior: toPlainText(t('states.cols.behavior')),
          },
          items: [
            { label: t('states.default.label'),  trigger: toPlainText(t('states.default.trigger')),  behavior: toPlainText(t('states.default.behavior')) },
            { label: t('states.open.label'),     trigger: toPlainText(t('states.open.trigger')),     behavior: toPlainText(t('states.open.behavior')) },
            { label: t('states.selected.label'), trigger: toPlainText(t('states.selected.trigger')), behavior: toPlainText(t('states.selected.behavior')) },
            { label: t('states.hover.label'),    trigger: toPlainText(t('states.hover.trigger')),    behavior: toPlainText(t('states.hover.behavior')) },
            { label: t('states.focus.label'),    trigger: toPlainText(t('states.focus.trigger')),    behavior: toPlainText(t('states.focus.behavior')) },
            { label: t('states.disabled.label'), trigger: toPlainText(t('states.disabled.trigger')), behavior: toPlainText(t('states.disabled.behavior')) },
            { label: t('states.invalid.label'),  trigger: toPlainText(t('states.invalid.trigger')),  behavior: toPlainText(t('states.invalid.behavior')) },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createSelect(options) → raiz com destroy()
export type SelectItem = {
  type?: 'item' | 'group' | 'separator';
  value?: string;
  label?: string;
  disabled?: boolean;
  icon?: string | string[];
  items?: SelectItem[];   // só em 'group'
};

export type SelectOptions = {
  items: SelectItem[];
  placeholder?: string;
  defaultValue?: string;
  disabled?: boolean;
  size?: 'default' | 'sm';
  name?: string;
  id?: string;
  required?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  listLabel?: string;
  onValueChange?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
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
              title: 'createSelect(options)',
              cols: propsCols,
              items: [
                { name: 'items',         type: 'SelectItem[]',            defaultValue: '—',           required: 'Sim', description: 'Opções da lista. Cada entrada é uma opção, um grupo com cabeçalho (`type: "group"`) ou uma linha separadora (`type: "separator"`).' },
                { name: 'placeholder',   type: 'string',                  defaultValue: '—',           required: 'Não', description: toPlainText(t('props.table.placeholder.description')) },
                { name: 'defaultValue',  type: 'string',                  defaultValue: '—',           required: 'Não', description: toPlainText(t('props.table.defaultValue.description')) + ' A fábrica é não-controlada: acompanhe a escolha pelo callback de mudança.' },
                { name: 'disabled',      type: 'boolean',                 defaultValue: 'false',       required: 'Não', description: toPlainText(t('props.table.disabled.description')) },
                { name: 'size',          type: '"default" | "sm"',        defaultValue: '"default"',   required: 'Não', description: toPlainText(t('props.table.size.description')) },
                { name: 'name',          type: 'string',                  defaultValue: '—',           required: 'Não', description: toPlainText(t('props.table.name.description')) + ' O valor viaja por um campo escondido dentro da raiz, que a serialização nativa enxerga.' },
                { name: 'id',            type: 'string',                  defaultValue: '—',           required: 'Não', description: 'Identificador do gatilho — é o alvo do `for` de um rótulo externo.' },
                { name: 'required',      type: 'boolean',                 defaultValue: 'false',       required: 'Não', description: 'Anuncia o campo como obrigatório. A exigência fica no gatilho, que é o elemento que o leitor de tela alcança.' },
                { name: 'aria-label',    type: 'string',                  defaultValue: '—',           required: 'Não', description: 'Nome acessível do campo. Obrigatório na prática: o papel de combobox não aceita nome vindo do próprio conteúdo, e o conteúdo do gatilho é o valor exibido.' },
                { name: 'aria-invalid',  type: 'boolean',                 defaultValue: 'false',       required: 'Não', description: 'Marca o campo como inválido. A borda e o anel vêm da folha compartilhada.' },
                { name: 'listLabel',     type: 'string',                  defaultValue: '"Opções"',    required: 'Não', description: 'Nome acessível da lista aberta.' },
                { name: 'onValueChange', type: '(value: string) => void', defaultValue: '—',           required: 'Não', description: toPlainText(t('props.table.onValueChange.description')) },
                { name: 'onOpenChange',  type: '(open: boolean) => void', defaultValue: '—',           required: 'Não', description: 'Avisado a cada abertura e fechamento da lista.' },
                { name: 'class',         type: 'string',                  defaultValue: '—',           required: 'Não', description: 'Classes .nds-* adicionais no gatilho — é ele que carrega a moldura do campo.' },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: 'Extensibilidade e limpeza',
          extensibilityNotes:
            'A fábrica devolve a **raiz** do campo, e não o gatilho: dentro dela ficam o gatilho e o campo escondido que serializa o valor. Dois pontos que a plataforma exige e nenhuma lib resolve por aqui: (1) a raiz aceita `destroy()`, **idempotente**, que solta o ouvinte de clique-fora registrado em `document` e remove o painel que vive em portal no fim do documento — ele também dispara sozinho quando a raiz sai do documento, então esquecer de chamá-lo não vaza; (2) a fábrica é **não-controlada** — passe `defaultValue` e acompanhe a escolha pelo callback de mudança. Para filtrar a lista por texto digitado, o caminho é `Combobox`, não este campo.',
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
            { token: '--input',              value: toPlainText(t('tokens.table.input.class')),              description: toPlainText(t('tokens.table.input.part')) },
            { token: '--popover',            value: toPlainText(t('tokens.table.popover.class')),            description: toPlainText(t('tokens.table.popover.part')) },
            { token: '--popover-foreground', value: toPlainText(t('tokens.table.popoverForeground.class')),  description: toPlainText(t('tokens.table.popoverForeground.part')) },
            { token: '--accent',             value: toPlainText(t('tokens.table.accent.class')),             description: toPlainText(t('tokens.table.accent.part')) },
            { token: '--accent-foreground',  value: toPlainText(t('tokens.table.accentForeground.class')),   description: toPlainText(t('tokens.table.accentForeground.part')) },
            { token: '--ring',               value: toPlainText(t('tokens.table.ring.class')),               description: toPlainText(t('tokens.table.ring.part')) },
            { token: '--destructive',        value: toPlainText(t('tokens.table.destructive.class')),        description: toPlainText(t('tokens.table.destructive.part')) },
            { token: '--muted-foreground',   value: toPlainText(t('tokens.table.mutedForeground.class')),    description: toPlainText(t('tokens.table.mutedForeground.part')) },
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
            { key: 'Tab',        description: t('accessibility.keyboard.tab')        },
            { key: 'Enter',      description: t('accessibility.keyboard.enter')      },
            { key: 'Space',      description: t('accessibility.keyboard.space')      },
            { key: 'Arrow Down',  description: t('accessibility.keyboard.arrowDown')  },
            { key: 'Arrow Up',    description: t('accessibility.keyboard.arrowUp')    },
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
            { title: '', content: DOMPurify.sanitize(t('notes.item1')) },
            { title: '', content: DOMPurify.sanitize(t('notes.item2') + ' A raiz aceita <code>destroy()</code>, e ele também dispara sozinho quando a raiz sai do documento — sem isso o painel em portal sobreviveria por cima da tela seguinte, junto com o ouvinte de clique-fora.') },
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
            { event: 'option_select',        trigger: toPlainText(t('analytics.table.option_select.trigger')), payload: t('analytics.table.option_select.payload') },
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
            items: [1, 2, 3, 4, 5].map(i => ({
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
