import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createCheckbox } from '@/components/ui/checkbox';
import uiTranslations from '@/i18n/ui.json';
import checkboxTranslations from '@shared/content/checkbox/translations.json';

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
const { t, subscribe } = createTranslation(checkboxTranslations as Record<string, unknown>);

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

function buildCheckboxWithLabel(opts: {
  checked?: boolean;
  disabled?: boolean;
  id?: string;
  ariaInvalid?: boolean;
  labelText?: string;
  descText?: string;
}): HTMLElement {
  const { checked = false, disabled = false, id = `cb-${Math.random().toString(36).slice(2, 7)}`, ariaInvalid = false, labelText, descText } = opts;

  const wrapper = document.createElement('div');
  wrapper.className = 'nds-cluster';
  wrapper.dataset.spacing = 'xs';

  const cb = createCheckbox({ checked, disabled, id });
  if (ariaInvalid) cb.setAttribute('aria-invalid', 'true');

  if (labelText) {
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = labelText;
    label.className = 'nds-text-body nds-font-medium nds-leading-none' + (disabled ? ' nds-cursor-default' : ' nds-cursor-pointer');
    if (disabled) label.style.opacity = '0.7';
    wrapper.append(cb, label);
  } else {
    wrapper.append(cb);
  }

  if (descText) {
    wrapper.className = 'nds-cluster';
    wrapper.dataset.spacing = 'xs';
    wrapper.dataset.align = 'start';
    const textGroup = document.createElement('div');
    textGroup.className = 'nds-stack';
    textGroup.dataset.spacing = 'xs';
    const label = wrapper.querySelector('label');
    if (label) {
      textGroup.appendChild(label.cloneNode(true));
      wrapper.removeChild(label);
    }
    const desc = document.createElement('p');
    desc.className = 'nds-text-body nds-text-muted-foreground';
    desc.textContent = descText;
    textGroup.appendChild(desc);
    wrapper.append(textGroup);
  }

  return wrapper;
}

// ─── createCheckboxDocs ───────────────────────────────────────────────────────

export function createCheckboxDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'checkbox',
    });
    track('docs_page_view', { component_name: 'checkbox', locale, page_title: `${t('title')} · Design System` });
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
      installNote: 'npx shadcn@latest add checkbox',
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
            wrap.dataset.spacing = 'sm';

            const items = [
              { key: 'acceptTerms', checked: false },
              { key: 'newsletter',  checked: true  },
              { key: 'rememberMe',  checked: false },
            ] as const;

            items.forEach(({ key, checked }) => {
              const cbId = `demo-${key}`;
              const cb = createCheckbox({
                checked,
                id: cbId,
                onCheckedChange: (val) => {
                  track('field_change', { component: 'checkbox', field_name: key, value: String(val), location: 'docs-demo' });
                },
              });
              const label = document.createElement('label');
              label.htmlFor = cbId;
              label.textContent = t(`demonstration.labels.${key}`);
              label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';
              const row = document.createElement('div');
              row.className = 'nds-cluster';
              row.dataset.spacing = 'xs';
              row.append(cb, label);
              wrap.appendChild(row);
            });

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
        const buildLabeledCheckbox = (labelText: string, checked = false) => {
          const row = document.createElement('div');
          row.className = 'nds-cluster';
          row.dataset.spacing = 'xs';
          const id = `dodont-${Math.random().toString(36).slice(2, 7)}`;
          const cb = createCheckbox({ checked, id });
          const label = document.createElement('label');
          label.htmlFor = id;
          label.textContent = labelText;
          label.className = 'nds-text-body nds-font-medium nds-cursor-pointer';
          row.append(cb, label);
          return row;
        };

        const buildFieldset = (legendText: string, itemLabels: string[]) => {
          const fs = document.createElement('fieldset');
          fs.className = 'nds-border-default nds-rounded-lg nds-stack nds-w-full';
          fs.dataset.spacing = 'xs';
          fs.style.padding = '0.75rem';
          const legend = document.createElement('legend');
          legend.className = 'nds-text-caption nds-font-semibold nds-px-1';
          legend.textContent = legendText;
          fs.appendChild(legend);
          itemLabels.forEach(lbl => fs.appendChild(buildLabeledCheckbox(lbl)));
          return fs;
        };

        return createDocsDoDont({
          title: t('doDont.title'),
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair1.do'),
              dontCaption: t('doDont.pair1.dont'),
              doPreviewFactory: () => buildLabeledCheckbox('Receber notificações por email'),
              dontPreviewFactory: () => buildLabeledCheckbox('Email'),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: sanitizeHtml(t('doDont.pair2.do')),
              dontCaption: sanitizeHtml(t('doDont.pair2.dont')),
              doPreviewFactory: () => buildFieldset('Notificações', [
                'Receber novidades por email',
                'Receber notificações push',
              ]),
              dontPreviewFactory: () => {
                const loose = document.createElement('div');
                loose.className = 'nds-stack nds-w-full';
                loose.dataset.spacing = 'xs';
                loose.append(
                  buildLabeledCheckbox('Receber novidades por email'),
                  buildLabeledCheckbox('Receber notificações push'),
                );
                return loose;
              },
            },
          ],
        });
      }

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('import.basecoat'),
          code: `import { createCheckbox, type CheckboxOptions } from '@/components/ui/checkbox';`,
          secondaryDescription: 'Uso básico:',
          secondaryCode: `const cb = createCheckbox({ id: 'termos', checked: false });
const label = document.createElement('label');
label.htmlFor = 'termos';
label.textContent = 'Aceito os termos e condições';`,
        });

      case 'variantes': {
        const note = t('variants.note');
        return createDocsVariants({
          id: 'variantes',
          title: t('variants.title'),
          description: sanitizeHtml(note),
          items: [
            {
              name: 'default',
              description: stripHtml(t('variants.items.default')),
              code: `createCheckbox({ checked: false });`,
              previewFactory: () => buildCheckboxWithLabel({
                checked: false,
                id: 'v-default',
                labelText: t('demonstration.labels.acceptTerms'),
              }),
            },
            {
              name: 'checked',
              description: stripHtml(t('variants.items.checked')),
              code: `createCheckbox({ checked: true });`,
              previewFactory: () => buildCheckboxWithLabel({
                checked: true,
                id: 'v-checked',
                labelText: t('demonstration.labels.newsletter'),
              }),
            },
            {
              name: 'withLabel',
              description: stripHtml(t('variants.items.withLabel')),
              code: `const id = 'termos';\nconst cb = createCheckbox({ id });\nconst label = document.createElement('label');\nlabel.htmlFor = id;\nlabel.textContent = 'Aceito os termos e condições';`,
              previewFactory: () => buildCheckboxWithLabel({
                id: 'v-with-label',
                labelText: t('demonstration.labels.acceptTerms'),
              }),
            },
            {
              name: 'withDescription',
              description: stripHtml(t('variants.items.withDescription')),
              code: `const id = 'newsletter';\nconst cb = createCheckbox({ id });\n// label + description paragraph below`,
              previewFactory: () => {
                const outer = document.createElement('div');
                outer.className = 'nds-cluster';
                outer.dataset.spacing = 'xs';
                outer.dataset.align = 'start';
                const id = 'v-with-desc';
                const cb = createCheckbox({ id });
                const textGroup = document.createElement('div');
                textGroup.className = 'nds-stack';
                textGroup.dataset.spacing = 'xs';
                const label = document.createElement('label');
                label.htmlFor = id;
                label.textContent = t('demonstration.labels.newsletter');
                label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';
                const desc = document.createElement('p');
                desc.className = 'nds-text-body nds-text-muted-foreground';
                desc.textContent = 'Enviaremos atualizações sobre novos recursos do produto.';
                textGroup.append(label, desc);
                outer.append(cb, textGroup);
                return outer;
              },
            },
          ],
        });
      }

      case 'composicoes':
        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'checkbox',
          items: [
            {
              name: t('variants.compositions.withLabel.name'),
              description: t('variants.compositions.withLabel.description'),
              useWhen: t('variants.compositions.withLabel.use'),
              code:
                `const wrapper = document.createElement('div');\n` +
                `wrapper.className = 'nds-cluster';\n` +
                `wrapper.dataset.spacing = 'xs';\n` +
                `const cb = createCheckbox({ id: 'cb-tos' });\n` +
                `const label = document.createElement('label');\n` +
                `label.htmlFor = 'cb-tos';\n` +
                `label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';\n` +
                `label.textContent = 'Aceito os termos e condições';\n` +
                `wrapper.append(cb, label);`,
              previewFactory: () => {
                const wrapper = document.createElement('div');
                wrapper.className = 'nds-cluster';
                wrapper.dataset.spacing = 'xs';
                const cb = createCheckbox({ id: 'comp-cb-tos' });
                const label = document.createElement('label');
                label.htmlFor = 'comp-cb-tos';
                label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';
                label.textContent = 'Aceito os termos e condições';
                wrapper.append(cb, label);
                return wrapper;
              },
            },
            {
              name: t('variants.compositions.withDescription.name'),
              description: t('variants.compositions.withDescription.description'),
              useWhen: t('variants.compositions.withDescription.use'),
              code:
                `const wrapper = document.createElement('div');\n` +
                `wrapper.className = 'nds-cluster';\n` +
                `wrapper.dataset.spacing = 'xs';\n` +
                `wrapper.dataset.align = 'start';\n` +
                `const cb = createCheckbox({ id: 'cb-news' });\n` +
                `cb.style.marginTop = '0.125rem';\n` +
                `const textGroup = document.createElement('div');\n` +
                `textGroup.className = 'nds-stack';\n` +
                `textGroup.dataset.spacing = 'xs';\n` +
                `const label = document.createElement('label');\n` +
                `label.htmlFor = 'cb-news';\n` +
                `label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';\n` +
                `label.textContent = 'Receber novidades por email';\n` +
                `const desc = document.createElement('p');\n` +
                `desc.className = 'nds-text-body nds-text-muted-foreground';\n` +
                `desc.textContent = 'Enviaremos atualizações sobre novos recursos e melhorias do produto.';\n` +
                `textGroup.append(label, desc);\n` +
                `wrapper.append(cb, textGroup);`,
              previewFactory: () => {
                const wrapper = document.createElement('div');
                wrapper.className = 'nds-cluster';
                wrapper.dataset.spacing = 'xs';
                wrapper.dataset.align = 'start';
                const cb = createCheckbox({ id: 'comp-cb-news' });
                cb.style.marginTop = '0.125rem';
                const textGroup = document.createElement('div');
                textGroup.className = 'nds-stack';
                textGroup.dataset.spacing = 'xs';
                const label = document.createElement('label');
                label.htmlFor = 'comp-cb-news';
                label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';
                label.textContent = 'Receber novidades por email';
                const desc = document.createElement('p');
                desc.className = 'nds-text-body nds-text-muted-foreground';
                desc.textContent = 'Enviaremos atualizações sobre novos recursos e melhorias do produto.';
                textGroup.append(label, desc);
                wrapper.append(cb, textGroup);
                return wrapper;
              },
            },
            {
              name: t('variants.compositions.fieldset.name'),
              description: t('variants.compositions.fieldset.description'),
              useWhen: t('variants.compositions.fieldset.use'),
              code:
                `const fieldset = document.createElement('fieldset');\n` +
                `fieldset.className = 'nds-border-default nds-rounded-lg nds-p-4 nds-stack';\n` +
                `fieldset.dataset.spacing = 'sm';\n` +
                `fieldset.style.width = '18rem';\n` +
                `const legend = document.createElement('legend');\n` +
                `legend.className = 'nds-text-body nds-font-semibold nds-px-1';\n` +
                `legend.textContent = 'Notificações';\n` +
                `fieldset.appendChild(legend);\n` +
                `const items = [\n` +
                `  { id: 'notif-email', label: 'Receber novidades por email' },\n` +
                `  { id: 'notif-push',  label: 'Receber notificações push' },\n` +
                `  { id: 'notif-sms',   label: 'Alertas por SMS' },\n` +
                `];\n` +
                `items.forEach(({ id, label: labelText }) => {\n` +
                `  const row = document.createElement('div');\n` +
                `  row.className = 'nds-cluster';\n` +
                `  row.dataset.spacing = 'xs';\n` +
                `  const cb = createCheckbox({ id });\n` +
                `  const label = document.createElement('label');\n` +
                `  label.htmlFor = id;\n` +
                `  label.textContent = labelText;\n` +
                `  label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';\n` +
                `  row.append(cb, label);\n` +
                `  fieldset.appendChild(row);\n` +
                `});`,
              previewFactory: () => {
                const fieldset = document.createElement('fieldset');
                fieldset.className = 'nds-border-default nds-rounded-lg nds-p-4 nds-stack';
                fieldset.dataset.spacing = 'sm';
                fieldset.style.width = '18rem';
                const legend = document.createElement('legend');
                legend.className = 'nds-text-body nds-font-semibold nds-px-1';
                legend.textContent = 'Notificações';
                fieldset.appendChild(legend);
                const items = [
                  { id: 'comp-notif-email', label: 'Receber novidades por email' },
                  { id: 'comp-notif-push',  label: 'Receber notificações push' },
                  { id: 'comp-notif-sms',   label: 'Alertas por SMS' },
                ];
                items.forEach(({ id, label: labelText }) => {
                  const row = document.createElement('div');
                  row.className = 'nds-cluster';
                  row.dataset.spacing = 'xs';
                  const cb = createCheckbox({ id });
                  const label = document.createElement('label');
                  label.htmlFor = id;
                  label.textContent = labelText;
                  label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';
                  row.append(cb, label);
                  fieldset.appendChild(row);
                });
                return fieldset;
              },
            },
            {
              name: t('variants.compositions.selectAll.name'),
              description: t('variants.compositions.selectAll.description'),
              useWhen: t('variants.compositions.selectAll.use'),
              code:
                `const wrapper = document.createElement('div');\n` +
                `wrapper.className = 'nds-stack';\n` +
                `wrapper.dataset.spacing = 'sm';\n` +
                `wrapper.style.width = '18rem';\n` +
                `const allRow = document.createElement('div');\n` +
                `allRow.className = 'nds-cluster nds-border-b';\n` +
                `allRow.dataset.spacing = 'xs';\n` +
                `allRow.style.paddingBottom = '0.5rem';\n` +
                `const cbAll = createCheckbox({ id: 'cb-select-all' });\n` +
                `const labelAll = document.createElement('label');\n` +
                `labelAll.htmlFor = 'cb-select-all';\n` +
                `labelAll.textContent = 'Selecionar todos os itens';\n` +
                `labelAll.className = 'nds-text-body nds-font-semibold nds-leading-none nds-cursor-pointer';\n` +
                `allRow.append(cbAll, labelAll);\n` +
                `const items = [\n` +
                `  { id: 'item-1', label: 'Manter sessão ativa' },\n` +
                `  { id: 'item-2', label: 'Receber novidades por email' },\n` +
                `  { id: 'item-3', label: 'Receber notificações push' },\n` +
                `];\n` +
                `const childCheckboxes: HTMLElement[] = [];\n` +
                `const itemRows = items.map(({ id, label: labelText }) => {\n` +
                `  const row = document.createElement('div');\n` +
                `  row.className = 'nds-cluster';\n` +
                `  row.dataset.spacing = 'xs';\n` +
                `  row.style.paddingLeft = '0.5rem';\n` +
                `  const cb = createCheckbox({ id });\n` +
                `  childCheckboxes.push(cb);\n` +
                `  const label = document.createElement('label');\n` +
                `  label.htmlFor = id;\n` +
                `  label.textContent = labelText;\n` +
                `  label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';\n` +
                `  row.append(cb, label);\n` +
                `  return row;\n` +
                `});\n` +
                `cbAll.addEventListener('click', () => {\n` +
                `  const nextState = cbAll.getAttribute('aria-checked') === 'true';\n` +
                `  childCheckboxes.forEach((cb) => {\n` +
                `    const currentState = cb.getAttribute('aria-checked') === 'true';\n` +
                `    if (currentState !== nextState) cb.click();\n` +
                `  });\n` +
                `});\n` +
                `wrapper.append(allRow, ...itemRows);`,
              previewFactory: () => {
                const wrapper = document.createElement('div');
                wrapper.className = 'nds-stack';
                wrapper.dataset.spacing = 'sm';
                wrapper.style.width = '18rem';
                const allRow = document.createElement('div');
                allRow.className = 'nds-cluster nds-border-b';
                allRow.dataset.spacing = 'xs';
                allRow.style.paddingBottom = '0.5rem';
                const cbAll = createCheckbox({ id: 'comp-cb-select-all' });
                const labelAll = document.createElement('label');
                labelAll.htmlFor = 'comp-cb-select-all';
                labelAll.textContent = 'Selecionar todos os itens';
                labelAll.className = 'nds-text-body nds-font-semibold nds-leading-none nds-cursor-pointer';
                allRow.append(cbAll, labelAll);
                const items = [
                  { id: 'comp-item-1', label: 'Manter sessão ativa' },
                  { id: 'comp-item-2', label: 'Receber novidades por email' },
                  { id: 'comp-item-3', label: 'Receber notificações push' },
                ];
                const childCheckboxes: HTMLElement[] = [];
                const itemRows = items.map(({ id, label: labelText }) => {
                  const row = document.createElement('div');
                  row.className = 'nds-cluster';
                  row.dataset.spacing = 'xs';
                  row.style.paddingLeft = '0.5rem';
                  const cb = createCheckbox({ id });
                  childCheckboxes.push(cb);
                  const label = document.createElement('label');
                  label.htmlFor = id;
                  label.textContent = labelText;
                  label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';
                  row.append(cb, label);
                  return row;
                });
                cbAll.addEventListener('click', () => {
                  const nextState = cbAll.getAttribute('aria-checked') === 'true';
                  childCheckboxes.forEach((cb) => {
                    const currentState = cb.getAttribute('aria-checked') === 'true';
                    if (currentState !== nextState) cb.click();
                  });
                });
                wrapper.append(allRow, ...itemRows);
                return wrapper;
              },
            },
            {
              name: t('variants.compositions.inList.name'),
              description: t('variants.compositions.inList.description'),
              useWhen: t('variants.compositions.inList.use'),
              code:
                `const wrapper = document.createElement('div');\n` +
                `wrapper.className = 'nds-stack';\n` +
                `wrapper.dataset.spacing = 'xs';\n` +
                `wrapper.style.width = '20rem';\n` +
                `const title = document.createElement('p');\n` +
                `title.className = 'nds-text-body nds-font-semibold nds-mb-2';\n` +
                `title.textContent = 'Preferências de contato';\n` +
                `wrapper.appendChild(title);\n` +
                `const options = [\n` +
                `  { id: 'pref-email', label: 'Receber novidades por email', checked: true },\n` +
                `  { id: 'pref-push',  label: 'Receber notificações push',   checked: false },\n` +
                `  { id: 'pref-sms',   label: 'Alertas por SMS',             checked: false },\n` +
                `  { id: 'pref-news',  label: 'Newsletter semanal',          checked: true },\n` +
                `];\n` +
                `options.forEach(({ id, label: labelText, checked }) => {\n` +
                `  const row = document.createElement('div');\n` +
                `  row.className = 'nds-cluster nds-rounded-md nds-border-default';\n` +
                `  row.dataset.justify = 'between';\n` +
                `  row.style.paddingInline = '0.75rem';\n` +
                `  row.style.paddingBlock = '0.5rem';\n` +
                `  const leftSide = document.createElement('div');\n` +
                `  leftSide.className = 'nds-cluster';\n` +
                `  leftSide.dataset.spacing = 'xs';\n` +
                `  const cb = createCheckbox({ id, checked });\n` +
                `  const label = document.createElement('label');\n` +
                `  label.htmlFor = id;\n` +
                `  label.textContent = labelText;\n` +
                `  label.className = 'nds-text-body nds-font-medium nds-cursor-pointer';\n` +
                `  leftSide.append(cb, label);\n` +
                `  row.appendChild(leftSide);\n` +
                `  wrapper.appendChild(row);\n` +
                `});`,
              previewFactory: () => {
                const wrapper = document.createElement('div');
                wrapper.className = 'nds-stack';
                wrapper.dataset.spacing = 'xs';
                wrapper.style.width = '20rem';
                const title = document.createElement('p');
                title.className = 'nds-text-body nds-font-semibold nds-mb-2';
                title.textContent = 'Preferências de contato';
                wrapper.appendChild(title);
                const options = [
                  { id: 'comp-pref-email', label: 'Receber novidades por email', checked: true },
                  { id: 'comp-pref-push',  label: 'Receber notificações push',   checked: false },
                  { id: 'comp-pref-sms',   label: 'Alertas por SMS',             checked: false },
                  { id: 'comp-pref-news',  label: 'Newsletter semanal',          checked: true },
                ];
                options.forEach(({ id, label: labelText, checked }) => {
                  const row = document.createElement('div');
                  row.className = 'nds-cluster nds-rounded-md nds-border-default';
                  row.dataset.justify = 'between';
                  row.style.paddingInline = '0.75rem';
                  row.style.paddingBlock = '0.5rem';
                  const leftSide = document.createElement('div');
                  leftSide.className = 'nds-cluster';
                  leftSide.dataset.spacing = 'xs';
                  const cb = createCheckbox({ id, checked });
                  const label = document.createElement('label');
                  label.htmlFor = id;
                  label.textContent = labelText;
                  label.className = 'nds-text-body nds-font-medium nds-cursor-pointer';
                  leftSide.append(cb, label);
                  row.appendChild(leftSide);
                  wrapper.appendChild(row);
                });
                return wrapper;
              },
            },
          ],
        });

      case 'estados':
        return createDocsStates({
          title: t('states.title'),
          cols: {
            state: t('states.cols.state'),
            trigger: t('states.cols.trigger'),
            behavior: t('states.cols.behavior'),
          },
          items: [
            { label: t('states.unchecked.label'),     trigger: t('states.unchecked.trigger'),     behavior: stripHtml(t('states.unchecked.behavior')) },
            { label: t('states.checked.label'),       trigger: stripHtml(t('states.checked.trigger')),       behavior: stripHtml(t('states.checked.behavior')) },
            { label: t('states.indeterminate.label'), trigger: stripHtml(t('states.indeterminate.trigger')), behavior: stripHtml(t('states.indeterminate.behavior')) },
            { label: t('states.disabled.label'),      trigger: stripHtml(t('states.disabled.trigger')),      behavior: stripHtml(t('states.disabled.behavior')) },
            { label: t('states.error.label'),         trigger: stripHtml(t('states.error.trigger')),         behavior: stripHtml(t('states.error.behavior')) },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createCheckbox(options)
export type CheckboxOptions = {
  checked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  id?: string;
  class?: string;
  'aria-label'?: string;
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
              title: t('props.basecoatTitle'),
              cols: propsCols,
              items: [
                { name: 'checked',          type: 'boolean',                    defaultValue: 'false', required: 'Não', description: 'Estado inicial marcado.' },
                { name: 'disabled',         type: 'boolean',                    defaultValue: 'false', required: 'Não', description: stripHtml(t('props.items.disabled')) },
                { name: 'onCheckedChange',  type: '(checked: boolean) => void', defaultValue: '—',     required: 'Não', description: stripHtml(t('props.items.onCheckedChange')) },
                { name: 'id',               type: 'string',                     defaultValue: '—',     required: 'Não', description: stripHtml(t('props.items.basecoatId')) },
                { name: 'class',            type: 'string',                     defaultValue: '—',     required: 'Não', description: stripHtml(t('props.items.className')) },
                { name: 'aria-label',       type: 'string',                     defaultValue: '—',     required: 'Condicional', description: stripHtml(t('props.items.basecoatAriaLabel')) },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: 'Nota sobre o estado indeterminate',
          extensibilityNotes: 'O Nortear não suporta estado indeterminate. Use createCheckbox() apenas para checked/unchecked/disabled. O estado indeterminate está disponível exclusivamente no Svelte via prop bindable.',
        });
      }

      case 'tokens': {
        const customizationCode = `/* Em styles.css — sobrescrever tokens do tema */
:root {
  --primary: 222 47% 11%;
  --primary-foreground: 210 40% 98%;
  --input: 214 32% 91%;
  --ring: 222 47% 11%;
  --destructive: 0 72% 51%;
}

.dark {
  --primary: 210 40% 98%;
  --primary-foreground: 222 47% 11%;
  --input: 217 33% 17%;
}`;

        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--primary',            value: 'data-[state=checked]:bg-primary',         description: t('tokens.table.primary') },
            { token: '--primary-foreground', value: 'data-[state=checked]:text-primary-foreground', description: t('tokens.table.primaryForeground') },
            { token: '--input',              value: 'border-primary',                           description: t('tokens.table.input') },
            { token: '--ring',               value: 'focus-visible:ring-ring',                  description: t('tokens.table.ring') },
            { token: '--destructive',        value: 'aria-invalid:border-destructive',          description: t('tokens.table.destructive') },
            { token: '--border',             value: 'border',                                   description: t('tokens.table.border') },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode,
        });
      }

      case 'acessibilidade':
        return createDocsAccessibility({
          title: t('accessibility.title'),
          summary: stripHtml(t('accessibility.summary')),
          items: [
            t('accessibility.item1'),
            t('accessibility.item2'),
            t('accessibility.item3'),
            t('accessibility.item4'),
            t('accessibility.item5'),
          ],
          keyboardTitle: 'Navegação por teclado',
          keyboardItems: [
            { key: 'Tab',       description: t('accessibility.keyboard.tab') },
            { key: 'Space',     description: stripHtml(t('accessibility.keyboard.space')) },
            { key: 'Shift+Tab', description: t('accessibility.keyboard.shiftTab') },
            { key: '—',         description: stripHtml(t('accessibility.keyboard.disabled')) },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: 'Switch',     description: stripHtml(t('related.switch')),     path: '?path=/docs/ui-switch--docs'      },
            { name: 'RadioGroup', description: stripHtml(t('related.radioGroup')), path: '?path=/docs/ui-radiogroup--docs'  },
            { name: 'Form',       description: stripHtml(t('related.form')),       path: '?path=/docs/ui-form--docs'        },
            { name: 'Select',     description: stripHtml(t('related.select')),     path: '?path=/docs/ui-select--docs'      },
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
            { event: t('analytics.table.fieldChange'),    trigger: t('analytics.table.fieldChangeTrigger'),    payload: t('analytics.table.fieldChangePayload') },
            { event: t('analytics.table.pageView'),       trigger: t('analytics.table.pageViewTrigger'),       payload: t('analytics.table.pageViewPayload') },
            { event: t('analytics.table.sectionViewed'),  trigger: t('analytics.table.sectionViewedTrigger'),  payload: t('analytics.table.sectionViewedPayload') },
            { event: t('analytics.table.langSwitch'),     trigger: t('analytics.table.langSwitchTrigger'),     payload: t('analytics.table.langSwitchPayload') },
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
            items: [1, 2, 3, 4, 5, 6].map(i => ({
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
              criterion: stripHtml(t(`testes.accessibility.item${i}.criterion`)),
              level: t(`testes.accessibility.item${i}.level`),
              how: stripHtml(t(`testes.accessibility.item${i}.how`)),
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
        component_name: 'checkbox',
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
