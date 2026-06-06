import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createSwitch } from '@/components/ui/switch';
import { createButton } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import switchTranslations from '@shared/content/switch/translations.json';

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
const { t, subscribe } = createTranslation(switchTranslations as Record<string, unknown>);

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

function buildSwitchRow(opts: {
  id: string;
  labelText: string;
  checked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (v: boolean) => void;
  ariaInvalid?: boolean;
}): HTMLElement {
  const { id, labelText, checked = false, disabled = false, onCheckedChange, ariaInvalid } = opts;

  const row = document.createElement('div');
  row.className = 'nds-cluster';
  row.dataset.spacing = 'sm';

  const sw = createSwitch({ id, checked, disabled, onCheckedChange });
  if (ariaInvalid) sw.setAttribute('aria-invalid', 'true');

  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = labelText;
  label.className =
    'nds-text-body nds-font-medium nds-leading-none ' +
    (disabled ? 'nds-cursor-default' : 'nds-cursor-pointer');
  if (disabled) label.style.opacity = '0.7';

  // Toggle via label click (button + label htmlFor já é nativo,
  // mas como o root é <button>, garantimos o comportamento)
  if (!disabled) {
    label.addEventListener('click', (e) => {
      // O htmlFor de <label> para <button> não dispara click automaticamente em todos os browsers.
      e.preventDefault();
      sw.click();
    });
  }

  row.append(sw, label);
  return row;
}

function buildSwitchPanel(opts: {
  id: string;
  labelText: string;
  descText: string;
  checked?: boolean;
  onCheckedChange?: (v: boolean) => void;
}): HTMLElement {
  const { id, labelText, descText, checked = false, onCheckedChange } = opts;

  const panel = document.createElement('div');
  panel.className = 'nds-cluster nds-rounded-lg nds-border-default nds-p-2';
  panel.dataset.justify = 'between';
  panel.style.width = '20rem';

  const textGroup = document.createElement('div');
  textGroup.className = 'nds-stack';
  textGroup.dataset.spacing = 'xs';
  textGroup.style.paddingRight = 'var(--spacing-2)';

  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = labelText;
  label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';

  const desc = document.createElement('p');
  desc.className = 'nds-text-body nds-text-muted-foreground';
  desc.textContent = descText;

  textGroup.append(label, desc);

  const sw = createSwitch({ id, checked, onCheckedChange });

  // Permite clicar no label para alternar
  label.addEventListener('click', (e) => {
    e.preventDefault();
    sw.click();
  });

  panel.append(textGroup, sw);
  return panel;
}

// ─── createSwitchDocs ─────────────────────────────────────────────────────────

export function createSwitchDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'switch',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/form' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', { component_name: 'switch', locale, page_title: `${t('title')} · Design System` });
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
      installNote: 'npx shadcn@latest add switch',
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

            // 1) Switch simples (notificações)
            wrap.appendChild(buildSwitchRow({
              id: 'demo-notifications',
              labelText: t('demonstration.labels.notifications'),
              checked: true,
              onCheckedChange: (val) => {
                track('field_change', {
                  component: 'switch',
                  field_name: 'notifications',
                  value: String(val),
                  location: 'docs-demo',
                });
              },
            }));

            // 2) Switch em painel com descrição (marketing)
            wrap.appendChild(buildSwitchPanel({
              id: 'demo-marketing',
              labelText: t('demonstration.labels.marketing'),
              descText: t('demonstration.labels.marketingDesc'),
              checked: false,
              onCheckedChange: (val) => {
                track('field_change', {
                  component: 'switch',
                  field_name: 'marketing',
                  value: String(val),
                  location: 'docs-demo',
                });
              },
            }));

            // 3) Switch em painel (dark mode)
            wrap.appendChild(buildSwitchPanel({
              id: 'demo-dark-mode',
              labelText: t('demonstration.labels.darkMode'),
              descText: t('demonstration.labels.darkModeDesc'),
              checked: false,
              onCheckedChange: (val) => {
                track('field_change', {
                  component: 'switch',
                  field_name: 'dark_mode',
                  value: String(val),
                  location: 'docs-demo',
                });
              },
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
        const buildDoDescriptive = () => buildSwitchRow({
          id: 'dodont-do-desc',
          labelText: t('demonstration.labels.notifications'),
          checked: true,
        });
        const buildDontAmbiguous = () => buildSwitchRow({
          id: 'dodont-dont-amb',
          labelText: 'Notificações',
          checked: true,
        });
        const buildDoLinked = () => buildSwitchRow({
          id: 'dodont-do-linked',
          labelText: t('demonstration.labels.darkMode'),
          checked: false,
        });
        const buildDontLoose = () => {
          const row = document.createElement('div');
          row.className = 'nds-cluster';
          row.dataset.spacing = 'sm';
          // Switch SEM id e texto solto (sem <label htmlFor>)
          const sw = createSwitch({ checked: false });
          const span = document.createElement('span');
          span.textContent = t('demonstration.labels.darkMode');
          span.className = 'nds-text-body nds-font-medium nds-leading-none';
          row.append(sw, span);
          return row;
        };

        return createDocsDoDont({
          title: t('doDont.title'),
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair1.do'),
              dontCaption: t('doDont.pair1.dont'),
              doPreviewFactory: buildDoDescriptive,
              dontPreviewFactory: buildDontAmbiguous,
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: buildDoLinked,
              dontPreviewFactory: buildDontLoose,
            },
          ],
        });
      }

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: 'Importação do factory custom (Nortear):',
          code: `import { createSwitch, type SwitchOptions } from '@/components/ui/switch';`,
          secondaryDescription: 'Uso básico:',
          secondaryCode: `const sw = createSwitch({
  id: 'notifications',
  checked: false,
  onCheckedChange: (val) => console.log('checked:', val),
});

const label = document.createElement('label');
label.htmlFor = 'notifications';
label.textContent = 'Receber notificações por email';`,
        });

      case 'variantes': {
        return createDocsVariants({
          id: 'variantes',
          title: t('variants.title'),
          items: [
            {
              name: stripHtml(t('variants.items.default')),
              description: stripHtml(t('variants.styles.default')),
              code: `const sw = createSwitch({ id: 'notif', checked: false });
const label = document.createElement('label');
label.htmlFor = 'notif';
label.textContent = 'Receber notificações';`,
              previewFactory: () => buildSwitchRow({
                id: 'v-default',
                labelText: t('demonstration.labels.notifications'),
                checked: false,
              }),
            },
            {
              name: stripHtml(t('variants.items.withDescription')),
              description: stripHtml(t('variants.styles.withDescription')),
              code: `// Layout em painel: Label + descrição à esquerda · Switch à direita
const panel = document.createElement('div');
panel.className = 'nds-cluster nds-rounded-lg nds-border-default nds-p-3';
// ... textGroup com <label htmlFor="marketing"> + <p> de descrição
const sw = createSwitch({ id: 'marketing' });`,
              previewFactory: () => buildSwitchPanel({
                id: 'v-with-desc',
                labelText: t('demonstration.labels.marketing'),
                descText: t('demonstration.labels.marketingDesc'),
                checked: false,
              }),
            },
            {
              name: stripHtml(t('variants.items.sm')),
              description: stripHtml(t('variants.styles.sm')) +
                ' Nota: o factory Nortear não expõe prop `size` — aplicamos as classes do tamanho `sm` via `class` (`h-4 w-7` + thumb `h-3 w-3`).',
              code: `// Factory não expõe prop \`size\` — aplicamos as dimensões via class:
const sw = createSwitch({
  id: 'sm-switch',
  checked: true,
});
sw.style.height = '1rem'; sw.style.width = '1.75rem';
// ajuste manual do thumb (size sm)
const thumb = sw.querySelector('[data-slot="switch-thumb"]') as HTMLElement;
thumb.style.height = '0.75rem'; thumb.style.width = '0.75rem';`,
              previewFactory: () => {
                const row = document.createElement('div');
                row.className = 'nds-cluster';
                row.dataset.spacing = 'sm';

                const id = 'v-sm';
                const sw = createSwitch({ id, checked: true });
                sw.style.height = '1rem';
                sw.style.width = '1.75rem';
                const thumb = sw.querySelector('[data-slot="switch-thumb"]') as HTMLElement | null;
                if (thumb) {
                  thumb.style.height = '0.75rem';
                  thumb.style.width = '0.75rem';
                }

                const label = document.createElement('label');
                label.htmlFor = id;
                label.textContent = t('demonstration.labels.sm');
                label.className = 'nds-text-caption nds-font-medium nds-leading-none nds-cursor-pointer';
                label.addEventListener('click', (e) => { e.preventDefault(); sw.click(); });

                row.append(sw, label);
                return row;
              },
            },
          ],
        });
      }

      case 'composicoes':
        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'switch',
          items: [
            {
              name: t('variants.compositions.withLabel.name'),
              description: t('variants.compositions.withLabel.description'),
              useWhen: t('variants.compositions.withLabel.use'),
              code:
                `const row = document.createElement('div');\n` +
                `row.className = 'nds-cluster space-x-2';\n` +
                `const sw = createSwitch({ id: 'sw-email' });\n` +
                `const label = document.createElement('label');\n` +
                `label.htmlFor = 'sw-email';\n` +
                `label.textContent = 'Receber notificações por email';\n` +
                `label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';\n` +
                `label.addEventListener('click', (e) => { e.preventDefault(); sw.click(); });\n` +
                `row.append(sw, label);`,
              previewFactory: () => {
                const row = document.createElement('div');
                row.className = 'nds-cluster';
                row.dataset.spacing = 'sm';
                const sw = createSwitch({ id: 'comp-sw-email' });
                const label = document.createElement('label');
                label.htmlFor = 'comp-sw-email';
                label.textContent = 'Receber notificações por email';
                label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';
                label.addEventListener('click', (e) => { e.preventDefault(); sw.click(); });
                row.append(sw, label);
                return row;
              },
            },
            {
              name: t('variants.compositions.withDescription.name'),
              description: t('variants.compositions.withDescription.description'),
              useWhen: t('variants.compositions.withDescription.use'),
              code:
                `const panel = document.createElement('div');\n` +
                `panel.className = 'nds-cluster nds-rounded-lg nds-border-default nds-p-3';\n` +
                `const sw = createSwitch({ id: 'sw-marketing', checked: true });\n` +
                `const textGroup = document.createElement('div');\n` +
                `textGroup.className = 'nds-stack nds-pr-3';\n` +
                `const label = document.createElement('label');\n` +
                `label.htmlFor = 'sw-marketing';\n` +
                `label.textContent = 'Emails de marketing';\n` +
                `label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';\n` +
                `label.addEventListener('click', (e) => { e.preventDefault(); sw.click(); });\n` +
                `const desc = document.createElement('p');\n` +
                `desc.className = 'nds-text-body nds-text-muted-foreground';\n` +
                `desc.textContent = 'Receba novidades e promoções da plataforma.';\n` +
                `textGroup.append(label, desc);\n` +
                `panel.append(textGroup, sw);`,
              previewFactory: () => {
                const panel = document.createElement('div');
                panel.className = 'nds-cluster nds-rounded-lg nds-border-default nds-p-2';
                panel.dataset.justify = 'between';
                panel.style.width = '20rem';
                const id = 'comp-sw-marketing';
                const sw = createSwitch({ id, checked: true });
                const textGroup = document.createElement('div');
                textGroup.className = 'nds-stack';
                textGroup.dataset.spacing = 'xs';
                textGroup.style.paddingRight = 'var(--spacing-2)';
                const label = document.createElement('label');
                label.htmlFor = id;
                label.textContent = 'Emails de marketing';
                label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';
                label.addEventListener('click', (e) => { e.preventDefault(); sw.click(); });
                const desc = document.createElement('p');
                desc.className = 'nds-text-body nds-text-muted-foreground';
                desc.textContent = 'Receba novidades e promoções da plataforma.';
                textGroup.append(label, desc);
                panel.append(textGroup, sw);
                return panel;
              },
            },
            {
              name: t('variants.compositions.settingsList.name'),
              description: t('variants.compositions.settingsList.description'),
              useWhen: t('variants.compositions.settingsList.use'),
              code:
                `const wrapper = document.createElement('div');\n` +
                `wrapper.className = 'nds-stack';\n` +
                `wrapper.dataset.spacing = 'sm';\n` +
                `const title = document.createElement('p');\n` +
                `title.className = 'nds-text-body nds-font-semibold nds-mb-3';\n` +
                `title.textContent = 'Preferências de notificação';\n` +
                `wrapper.appendChild(title);\n` +
                `const options = [\n` +
                `  { id: 'pref-email', label: 'Receber novidades por email', desc: 'Resumo semanal sobre o produto.', checked: true },\n` +
                `  { id: 'pref-push',  label: 'Receber notificações push',   desc: 'Alertas no dispositivo em tempo real.', checked: false },\n` +
                `  { id: 'pref-sms',   label: 'Alertas por SMS',             desc: 'Eventos críticos via mensagem de texto.', checked: false },\n` +
                `];\n` +
                `options.forEach(({ id, label: labelText, desc: descText, checked }) => {\n` +
                `  const panel = document.createElement('div');\n` +
                `  panel.className = 'nds-cluster nds-rounded-lg nds-border-default nds-p-3';\n` +
                `  const sw = createSwitch({ id, checked });\n` +
                `  // ... textGroup com <label htmlFor=id> + <p> de descrição\n` +
                `  wrapper.appendChild(panel);\n` +
                `});`,
              previewFactory: () => {
                const wrapper = document.createElement('div');
                wrapper.className = 'nds-stack';
                wrapper.dataset.spacing = 'sm';
                wrapper.style.width = '24rem';
                const title = document.createElement('p');
                title.className = 'nds-text-body nds-font-semibold nds-mb-2';
                title.textContent = 'Preferências de notificação';
                wrapper.appendChild(title);
                const options = [
                  { id: 'comp-pref-email', label: 'Receber novidades por email', desc: 'Resumo semanal sobre o produto.', checked: true },
                  { id: 'comp-pref-push',  label: 'Receber notificações push',   desc: 'Alertas no dispositivo em tempo real.', checked: false },
                  { id: 'comp-pref-sms',   label: 'Alertas por SMS',             desc: 'Eventos críticos via mensagem de texto.', checked: false },
                ];
                options.forEach(({ id, label: labelText, desc: descText, checked }) => {
                  const panel = document.createElement('div');
                  panel.className = 'nds-cluster nds-rounded-lg nds-border-default nds-p-2';
                  panel.dataset.justify = 'between';
                  const sw = createSwitch({ id, checked });
                  const textGroup = document.createElement('div');
                  textGroup.className = 'nds-stack';
                textGroup.dataset.spacing = 'xs';
                textGroup.style.paddingRight = 'var(--spacing-2)';
                  const label = document.createElement('label');
                  label.htmlFor = id;
                  label.textContent = labelText;
                  label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';
                  label.addEventListener('click', (e) => { e.preventDefault(); sw.click(); });
                  const desc = document.createElement('p');
                  desc.className = 'nds-text-body nds-text-muted-foreground';
                  desc.textContent = descText;
                  textGroup.append(label, desc);
                  panel.append(textGroup, sw);
                  wrapper.appendChild(panel);
                });
                return wrapper;
              },
            },
            {
              name: t('variants.compositions.inForm.name'),
              description: t('variants.compositions.inForm.description'),
              useWhen: t('variants.compositions.inForm.use'),
              code:
                `// Divergência Nortear: factory não expõe prop \`name\`.\n` +
                `// Sincronize o estado em um <input type="hidden"> via onCheckedChange.\n` +
                `const form = document.createElement('form');\n` +
                `form.className = 'nds-stack';\n` +
                `form.addEventListener('submit', (e) => e.preventDefault());\n` +
                `const hidden = document.createElement('input');\n` +
                `hidden.type = 'hidden';\n` +
                `hidden.name = 'newsletter';\n` +
                `hidden.value = 'on';\n` +
                `const sw = createSwitch({\n` +
                `  id: 'sw-form-newsletter',\n` +
                `  checked: true,\n` +
                `  onCheckedChange: (val) => { hidden.value = val ? 'on' : 'off'; },\n` +
                `});\n` +
                `// row com sw + <label htmlFor="sw-form-newsletter">Aceitar newsletter semanal</label>\n` +
                `// form.append(row, hidden, createButton({ type: 'submit', label: 'Salvar preferências' }));`,
              previewFactory: () => {
                const form = document.createElement('form');
                form.className = 'nds-stack';
                form.dataset.spacing = 'sm';
                form.style.width = '20rem';
                form.addEventListener('submit', (e) => e.preventDefault());

                const row = document.createElement('div');
                row.className = 'nds-cluster';
                row.dataset.spacing = 'sm';

                const hidden = document.createElement('input');
                hidden.type = 'hidden';
                hidden.name = 'newsletter';
                hidden.value = 'on';

                const id = 'comp-sw-form-newsletter';
                const sw = createSwitch({
                  id,
                  checked: true,
                  onCheckedChange: (val) => { hidden.value = val ? 'on' : 'off'; },
                });

                const label = document.createElement('label');
                label.htmlFor = id;
                label.textContent = 'Aceitar newsletter semanal';
                label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';
                label.addEventListener('click', (e) => { e.preventDefault(); sw.click(); });

                row.append(sw, label);

                const submit = createButton({
                  type: 'submit',
                  label: 'Salvar preferências',
                });

                form.append(row, hidden, submit);
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
            { label: t('states.items.unchecked'), trigger: '—',                                 behavior: stripHtml(t('states.descriptions.unchecked')) },
            { label: t('states.items.checked'),   trigger: 'click ou Space/Enter',              behavior: stripHtml(t('states.descriptions.checked'))   },
            { label: t('states.items.hover'),     trigger: 'pointer sobre o Switch',            behavior: stripHtml(t('states.descriptions.hover'))     },
            { label: t('states.items.focus'),     trigger: 'Tab para o Switch',                 behavior: stripHtml(t('states.descriptions.focus'))     },
            { label: t('states.items.disabled'),  trigger: 'options.disabled === true',         behavior: stripHtml(t('states.descriptions.disabled')) },
            { label: t('states.items.invalid'),   trigger: 'aria-invalid="true" no Switch',     behavior: stripHtml(t('states.descriptions.invalid'))   },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createSwitch(options)
export type SwitchOptions = {
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
              title: 'createSwitch(options) — Nortear',
              cols: propsCols,
              items: [
                {
                  name: 'checked',
                  type: 'boolean',
                  defaultValue: 'false',
                  required: 'Não',
                  description: stripHtml(t('props.table.checked.description')) +
                    ' Nota: no Nortear, `checked` define apenas o estado inicial — o factory é não-controlado.',
                },
                {
                  name: 'disabled',
                  type: 'boolean',
                  defaultValue: 'false',
                  required: 'Não',
                  description: stripHtml(t('props.table.disabled.description')),
                },
                {
                  name: 'onCheckedChange',
                  type: '(checked: boolean) => void',
                  defaultValue: '—',
                  required: 'Não',
                  description: stripHtml(t('props.table.onCheckedChange.description')),
                },
                {
                  name: 'id',
                  type: 'string',
                  defaultValue: '—',
                  required: 'Recomendado',
                  description: stripHtml(t('props.table.id.description')),
                },
                {
                  name: 'class',
                  type: 'string',
                  defaultValue: '—',
                  required: 'Não',
                  description: 'Classes .nds-* adicionais no `<button role="switch">`.',
                },
                {
                  name: 'aria-label',
                  type: 'string',
                  defaultValue: '—',
                  required: 'Condicional',
                  description: 'Use apenas quando não houver `<label htmlFor>` visível associado ao `id` do Switch.',
                },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: 'Divergências da factory custom (Nortear)',
          extensibilityNotes:
            'O factory custom diverge das libs upstream nos seguintes pontos: (1) não expõe prop `size` — para o tamanho `sm`, aplique classes utilitárias via `class` (`h-4 w-7`) e ajuste o thumb (`h-3 w-3`). (2) Não expõe prop `defaultChecked` — use `checked` como estado inicial. (3) Não expõe prop `name` — para envio em formulário, sincronize o estado para um `<input type="hidden" name="...">` via `onCheckedChange`. (4) É não-controlado: o estado vive internamente; passe `checked` apenas como valor inicial e ouça `onCheckedChange` para reagir a mudanças.',
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
            { token: '--input',              value: stripHtml(t('tokens.table.input.class')),             description: stripHtml(t('tokens.table.input.part'))             },
            { token: '--primary',            value: stripHtml(t('tokens.table.primary.class')),           description: stripHtml(t('tokens.table.primary.part'))           },
            { token: '--background',         value: stripHtml(t('tokens.table.background.class')),        description: stripHtml(t('tokens.table.background.part'))        },
            { token: '--primary-foreground', value: stripHtml(t('tokens.table.primaryForeground.class')), description: stripHtml(t('tokens.table.primaryForeground.part')) },
            { token: '--ring',               value: stripHtml(t('tokens.table.ring.class')),              description: stripHtml(t('tokens.table.ring.part'))              },
            { token: '--destructive',        value: stripHtml(t('tokens.table.destructive.class')),       description: stripHtml(t('tokens.table.destructive.part'))       },
            { token: '--foreground',         value: stripHtml(t('tokens.table.foreground.class')),        description: stripHtml(t('tokens.table.foreground.part'))        },
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
            { key: 'Tab',   description: t('accessibility.keyboard.tab')   },
            { key: 'Space', description: t('accessibility.keyboard.space') },
            { key: 'Enter', description: t('accessibility.keyboard.enter') },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.checkbox.name'),   description: stripHtml(t('related.items.checkbox.description')),   path: '?path=/docs/ui-checkbox--docs'    },
            { name: t('related.items.toggle.name'),     description: stripHtml(t('related.items.toggle.description')),     path: '?path=/docs/ui-toggle--docs'      },
            { name: t('related.items.radioGroup.name'), description: stripHtml(t('related.items.radioGroup.description')), path: '?path=/docs/ui-radiogroup--docs'  },
            { name: t('related.items.form.name'),       description: stripHtml(t('related.items.form.description')),       path: '?path=/docs/ui-form--docs'        },
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
            { title: '', content: sanitizeHtml('<strong>Nortear</strong> — o factory custom não expõe prop <code>size</code>; o tamanho <code>sm</code> é alcançado via <code>class</code> (<code>h-4 w-7</code>) + ajuste do thumb. Também não há prop <code>name</code>; sincronize o estado em um <code>&lt;input type="hidden"&gt;</code> para envio em formulário.') },
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
            { event: 'field_change',         trigger: t('analytics.table.field_change.trigger'), payload: t('analytics.table.field_change.payload') },
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

  let activeSectionObserver: { disconnect: () => void } | null = null;

  function attachObserver() {
    activeSectionObserver?.disconnect();
    activeSectionObserver = createActiveSectionObserver(
      sectionOrder as unknown as string[],
      (id) => sectionEls[id as keyof typeof sectionEls] ?? null,
      (id) => updateActiveNav(id),
      (id) => track('docs_section_viewed', {
        section_id: id,
        component_name: 'switch',
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
