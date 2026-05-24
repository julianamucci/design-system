import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createCollapsible } from '@/components/ui/collapsible';
import uiTranslations from '@/i18n/ui.json';
import collapsibleTranslations from '@shared/content/collapsible/translations.json';

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
const { t, subscribe } = createTranslation(collapsibleTranslations as Record<string, unknown>);

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

// ─── Icon helpers (inline SVG, no lucide dep) ─────────────────────────────────

type IconNode = [string, Record<string, string>];

const FilterIcon: IconNode[] = [
  ['polygon', { points: '22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3' }],
];
const ChevronDownIcon: IconNode[] = [
  ['path', { d: 'm6 9 6 6 6-6' }],
];
const SettingsIcon: IconNode[] = [
  ['path', { d: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' }],
  ['circle', { cx: '12', cy: '12', r: '3' }],
];

function createIcon(nodes: IconNode[], extraClass = ''): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', `nds-icon nds-shrink-0${extraClass ? ' ' + extraClass : ''}`);
  for (const [tag, attrs] of nodes) {
    const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    svg.appendChild(child);
  }
  return svg;
}

function makeTriggerWithIcon(nodes: IconNode[], label: string): HTMLElement {
  const span = document.createElement('span');
  span.className = 'nds-cluster';
  span.dataset.spacing = 'sm';
  span.appendChild(createIcon(nodes));
  const text = document.createElement('span');
  text.textContent = label;
  span.appendChild(text);
  return span;
}

function makeContent(items: string[]): HTMLElement {
  const div = document.createElement('div');
  div.className = 'nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2';
  div.dataset.spacing = 'sm';
  for (const text of items) {
    const p = document.createElement('p');
    p.textContent = text;
    div.appendChild(p);
  }
  return div;
}

// ─── Demo factories ───────────────────────────────────────────────────────────

function buildDemoDefault(): HTMLElement {
  return createCollapsible({
    trigger: t('demonstration.labels.triggerClosed'),
    content: makeContent([
      t('demonstration.labels.advancedFilter1'),
      t('demonstration.labels.advancedFilter2'),
    ]),
    defaultOpen: false,
    class: 'nds-w-full nds-max-w-sm',
  });
}

function buildDemoDefaultOpen(): HTMLElement {
  return createCollapsible({
    trigger: t('demonstration.labels.triggerOpen'),
    content: makeContent([
      t('demonstration.labels.advancedFilter1'),
      t('demonstration.labels.advancedFilter2'),
    ]),
    defaultOpen: true,
    class: 'nds-w-full nds-max-w-sm',
  });
}

function buildDemoDisabled(): HTMLElement {
  return createCollapsible({
    trigger: t('demonstration.labels.triggerClosed'),
    content: makeContent([
      t('demonstration.labels.advancedFilter1'),
      t('demonstration.labels.advancedFilter2'),
    ]),
    disabled: true,
    class: 'nds-w-full nds-max-w-sm',
  });
}

// ─── createCollapsibleDocs ────────────────────────────────────────────────────

export function createCollapsibleDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'collapsible',
    });
    track('docs_page_view', { component_name: 'collapsible', locale, page_title: `${t('title')} · Design System` });
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
      installNote: 'npx shadcn@latest add collapsible',
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

      // ── Demonstração ───────────────────────────────────────────────────
      case 'demonstracao': {
        const demoWrapper = document.createElement('div');
        demoWrapper.className = 'nds-stack';
        demoWrapper.dataset.spacing = 'xl';

        // Demo 1: Default (uncontrolled, fechado)
        const block1 = document.createElement('div');
        block1.className = 'nds-stack';
        block1.dataset.spacing = 'sm';
        const label1 = document.createElement('p');
        label1.className = 'nds-text-body nds-font-medium nds-text-muted-foreground';
        label1.textContent = 'Padrão (não-controlado, fechado)';
        block1.appendChild(label1);
        block1.appendChild(buildDemoDefault());

        // Demo 2: defaultOpen=true
        const block2 = document.createElement('div');
        block2.className = 'nds-stack';
        block2.dataset.spacing = 'sm';
        const label2 = document.createElement('p');
        label2.className = 'nds-text-body nds-font-medium nds-text-muted-foreground';
        label2.textContent = 'Aberto por padrão (defaultOpen: true)';
        block2.appendChild(label2);
        block2.appendChild(buildDemoDefaultOpen());

        // Demo 3: Disabled
        const block3 = document.createElement('div');
        block3.className = 'nds-stack';
        block3.dataset.spacing = 'sm';
        const label3 = document.createElement('p');
        label3.className = 'nds-text-body nds-font-medium nds-text-muted-foreground';
        label3.textContent = 'Desabilitado';
        block3.appendChild(label3);
        block3.appendChild(buildDemoDisabled());

        demoWrapper.appendChild(block1);
        demoWrapper.appendChild(block2);
        demoWrapper.appendChild(block3);

        return createDocsDemonstration({
          title: t('demonstration.title'),
          demoFactory: () => demoWrapper,
        });
      }

      // ── Anatomia ───────────────────────────────────────────────────────
      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [
            sanitizeHtml(t('anatomy.item1')),
            sanitizeHtml(t('anatomy.item2')),
            sanitizeHtml(t('anatomy.item3')),
          ],
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      // ── Quando Usar ────────────────────────────────────────────────────
      case 'quando-usar':
        return createDocsWhenToUse({
          title: t('usage.title'),
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [1, 2, 3, 4].map(i => sanitizeHtml(t(`usage.guidelines.item${i}`))),
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
            items: [1, 2, 3, 4].map(i => t(`usage.do.item${i}`)),
          },
          dont: {
            title: t('usage.dont.title'),
            items: [1, 2, 3].map(i => sanitizeHtml(t(`usage.dont.item${i}`))),
          },
        });

      // ── Do & Don't ─────────────────────────────────────────────────────
      case 'do-dont':
        return createDocsDoDont({
          title: t('doDont.title'),
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair1.do'),
              dontCaption: t('doDont.pair1.dont'),
              doPreviewFactory: () => createCollapsible({
                trigger: 'Exibir filtros avançados',
                content: makeContent(['Filtro avançado 1', 'Filtro avançado 2']),
                class: 'nds-w-full nds-max-w-xs nds-text-body',
              }),
              dontPreviewFactory: () => createCollapsible({
                trigger: 'Ver mais',
                content: makeContent(['Conteúdo extra']),
                class: 'nds-w-full nds-max-w-xs nds-text-body',
              }),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: () => createCollapsible({
                trigger: 'Exibir detalhes adicionais',
                content: makeContent(['Detalhe 1', 'Detalhe 2']),
                class: 'nds-w-full nds-max-w-xs nds-text-body',
              }),
              dontPreviewFactory: () => {
                const wrapper = document.createElement('div');
                wrapper.className = 'nds-stack nds-w-full nds-max-w-xs';
                wrapper.dataset.spacing = 'sm';
                for (let i = 1; i <= 3; i++) {
                  wrapper.appendChild(createCollapsible({
                    trigger: `Seção ${i}`,
                    content: makeContent([`Conteúdo da seção ${i}`]),
                    class: 'nds-w-full nds-text-body',
                  }));
                }
                return wrapper;
              },
            },
          ],
        });

      // ── Importação ─────────────────────────────────────────────────────
      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('import.basic'),
          code: `import { createCollapsible } from '@/components/ui/collapsible';`,
        });

      // ── Variantes (Modos de Uso) ───────────────────────────────────────
      case 'variantes': {
        const codeUncontrolled = `createCollapsible({\n  trigger: 'Exibir filtros avançados',\n  content: contentEl,\n  defaultOpen: false,\n});`;
        const codeDefaultOpen = `createCollapsible({\n  trigger: 'Ocultar filtros avançados',\n  content: contentEl,\n  defaultOpen: true,\n});`;
        const codeControlled = `let open = false;\ncreateCollapsible({\n  trigger: 'Exibir filtros avançados',\n  content: contentEl,\n  defaultOpen: open,\n  onOpenChange: (next) => {\n    open = next;\n    // sincronizar com estado externo\n  },\n});`;

        return createDocsVariants({
          id: 'variantes',
          title: t('variants.title'),
          items: [
            {
              name: stripHtml(t('variants.items.uncontrolled')).slice(0, 40) + '…',
              description: stripHtml(t('variants.items.uncontrolled')),
              code: codeUncontrolled,
              previewFactory: () => createCollapsible({
                trigger: 'Exibir filtros avançados',
                content: makeContent(['Filtro avançado 1', 'Filtro avançado 2']),
                class: 'nds-w-full nds-max-w-sm nds-text-body',
              }),
            },
            {
              name: 'Aberto por padrão',
              description: 'defaultOpen: true — painel renderiza expandido na montagem.',
              code: codeDefaultOpen,
              previewFactory: () => createCollapsible({
                trigger: 'Ocultar filtros avançados',
                content: makeContent(['Filtro avançado 1', 'Filtro avançado 2']),
                defaultOpen: true,
                class: 'nds-w-full nds-max-w-sm nds-text-body',
              }),
            },
            {
              name: stripHtml(t('variants.items.controlled')).slice(0, 40) + '…',
              description: stripHtml(t('variants.items.controlled')),
              code: codeControlled,
              previewFactory: () => {
                let isOpen = false;
                return createCollapsible({
                  trigger: 'Exibir filtros avançados',
                  content: makeContent(['Filtro avançado 1 (controlado)', 'Filtro avançado 2 (controlado)']),
                  defaultOpen: isOpen,
                  onOpenChange: (next) => { isOpen = next; },
                  class: 'nds-w-full nds-max-w-sm nds-text-body',
                });
              },
            },
          ],
        });
      }

      // ── Composições ────────────────────────────────────────────────────
      case 'composicoes': {
        const codeCustomButton = `const btn = document.createElement('button');\nbtn.className = 'nds-cluster nds-rounded-md nds-border-default nds-bg-background nds-px-4 nds-py-2 nds-text-body nds-font-medium nds-shadow-sm nds-hover-bg-accent';\nbtn.dataset.spacing = 'sm';\nbtn.style.display = 'inline-flex';\nbtn.textContent = 'Exibir opções avançadas';\n\ncreateCollapsible({\n  trigger: btn,\n  content: contentEl,\n});`;
        const codeIconTrigger = `const trigger = document.createElement('span');\ntrigger.className = 'nds-cluster';\ntrigger.dataset.spacing = 'sm';\ntrigger.appendChild(filterIconSvg); // aria-hidden\nconst label = document.createElement('span');\nlabel.textContent = 'Filtros avançados';\ntrigger.appendChild(label);\n\ncreateCollapsible({ trigger, content: contentEl });`;
        const codeRotatingChevron = `const chevron = chevronDownSvg;\nchevron.classList.add('transition-transform', 'duration-200', '[[data-state=open]_&]:rotate-180');\n\nconst inner = document.createElement('span');\ninner.className = 'nds-cluster nds-w-full';\ninner.dataset.justify = 'between';\ninner.append(labelSpan, chevron);\n\nconst btn = document.createElement('button');\nbtn.className = 'nds-cluster nds-w-full nds-rounded-md nds-border-default nds-bg-background nds-px-4 nds-py-2 nds-text-body nds-font-medium nds-shadow-sm nds-hover-bg-accent';\nbtn.dataset.justify = 'between';\nbtn.appendChild(inner);\n\ncreateCollapsible({ trigger: btn, content: contentEl });`;
        const codeRichContent = `const trigger = makeTriggerWithIcon(SettingsIcon, 'Configurações do sistema');\n\nconst content = document.createElement('div');\ncontent.className = 'nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2';\ncontent.dataset.spacing = 'sm';\n// append note + checkbox labels…\n\ncreateCollapsible({ trigger, content });`;

        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'collapsible',
          items: [
            {
              name: t('variants.compositions.customButton.name'),
              description: t('variants.compositions.customButton.description'),
              useWhen: t('variants.compositions.customButton.use'),
              code: codeCustomButton,
              previewFactory: () => {
                const btn = document.createElement('button');
                btn.className =
                  'nds-cluster nds-rounded-md nds-border-default nds-bg-background nds-px-4 nds-py-2 nds-text-body nds-font-medium nds-shadow-sm nds-hover-bg-accent';
                btn.dataset.spacing = 'sm';
                btn.style.display = 'inline-flex';
                btn.textContent = 'Exibir opções avançadas';
                return createCollapsible({
                  trigger: btn,
                  content: makeContent(['Opção avançada 1', 'Opção avançada 2', 'Opção avançada 3']),
                  class: 'nds-w-full nds-max-w-sm',
                });
              },
            },
            {
              name: t('variants.compositions.iconTrigger.name'),
              description: t('variants.compositions.iconTrigger.description'),
              useWhen: t('variants.compositions.iconTrigger.use'),
              code: codeIconTrigger,
              previewFactory: () => {
                const triggerEl = makeTriggerWithIcon(FilterIcon, 'Filtros avançados');
                return createCollapsible({
                  trigger: triggerEl,
                  content: makeContent(['Filtro por categoria', 'Filtro por data', 'Filtro por status']),
                  class: 'nds-w-full nds-max-w-sm',
                });
              },
            },
            {
              name: t('variants.compositions.rotatingChevron.name'),
              description: t('variants.compositions.rotatingChevron.description'),
              useWhen: t('variants.compositions.rotatingChevron.use'),
              code: codeRotatingChevron,
              previewFactory: () => {
                const chevron = createIcon(
                  ChevronDownIcon,
                  'transition-transform duration-200 [[data-state=open]_&]:rotate-180',
                );
                const triggerEl = document.createElement('span');
                triggerEl.className = 'nds-cluster nds-w-full';
                triggerEl.dataset.justify = 'between';
                const label = document.createElement('span');
                label.textContent = 'Configurações avançadas';
                triggerEl.appendChild(label);
                triggerEl.appendChild(chevron);

                const btn = document.createElement('button');
                btn.className =
                  'nds-cluster nds-w-full nds-rounded-md nds-border-default nds-bg-background nds-px-4 nds-py-2 nds-text-body nds-font-medium nds-shadow-sm nds-hover-bg-accent';
                btn.dataset.justify = 'between';
                btn.appendChild(triggerEl);

                const content = document.createElement('div');
                content.className = 'nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2';
                content.dataset.spacing = 'sm';
                [
                  { key: 'Notificações', val: 'Ativadas' },
                  { key: 'Privacidade', val: 'Modo estrito' },
                ].forEach(({ key, val }) => {
                  const row = document.createElement('div');
                  row.className = 'nds-cluster';
                  row.dataset.justify = 'between';
                  const k = document.createElement('span');
                  k.className = 'nds-text-muted-foreground';
                  k.textContent = key;
                  const v = document.createElement('span');
                  v.className = 'nds-font-medium';
                  v.textContent = val;
                  row.appendChild(k);
                  row.appendChild(v);
                  content.appendChild(row);
                });

                return createCollapsible({
                  trigger: btn,
                  content,
                  class: 'nds-w-full nds-max-w-sm',
                });
              },
            },
            {
              name: t('variants.compositions.richContent.name'),
              description: t('variants.compositions.richContent.description'),
              useWhen: t('variants.compositions.richContent.use'),
              code: codeRichContent,
              previewFactory: () => {
                const triggerEl = makeTriggerWithIcon(SettingsIcon, 'Configurações do sistema');

                const content = document.createElement('div');
                content.className = 'nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2';
                content.dataset.spacing = 'sm';

                const note = document.createElement('p');
                note.className = 'nds-text-muted-foreground nds-text-caption';
                note.textContent = 'Altere as configurações abaixo com cuidado. As mudanças são aplicadas imediatamente.';
                content.appendChild(note);

                [
                  'Habilitar modo de depuração',
                  'Limpar cache ao sair',
                  'Exportar logs automaticamente',
                ].forEach((item) => {
                  const row = document.createElement('label');
                  row.className = 'nds-cluster nds-cursor-pointer';
                  row.dataset.spacing = 'sm';
                  const checkbox = document.createElement('input');
                  checkbox.type = 'checkbox';
                  checkbox.className = 'nds-icon nds-rounded-sm nds-border-default';
                  const text = document.createElement('span');
                  text.textContent = item;
                  row.appendChild(checkbox);
                  row.appendChild(text);
                  content.appendChild(row);
                });

                return createCollapsible({
                  trigger: triggerEl,
                  content,
                  class: 'nds-w-full nds-max-w-sm',
                });
              },
            },
          ],
        });
      }

      // ── Estados ────────────────────────────────────────────────────────
      case 'estados':
        return createDocsStates({
          title: t('states.title'),
          cols: {
            state: t('states.cols.state'),
            trigger: t('states.cols.trigger'),
            behavior: t('states.cols.behavior'),
          },
          items: [
            { label: t('states.closed.label'),      trigger: stripHtml(t('states.closed.trigger')),      behavior: t('states.closed.behavior')      },
            { label: t('states.open.label'),         trigger: stripHtml(t('states.open.trigger')),         behavior: t('states.open.behavior')         },
            { label: t('states.defaultOpen.label'),  trigger: stripHtml(t('states.defaultOpen.trigger')),  behavior: t('states.defaultOpen.behavior')  },
            { label: t('states.disabled.label'),     trigger: stripHtml(t('states.disabled.trigger')),     behavior: stripHtml(t('states.disabled.behavior'))     },
          ],
        });

      // ── Propriedades ───────────────────────────────────────────────────
      case 'propriedades': {
        const interfaceCode = `export type CollapsibleOptions = {\n  trigger: string | HTMLElement;    // botão ou elemento trigger\n  content: HTMLElement;             // painel expansível\n  defaultOpen?: boolean;            // estado inicial (padrão: false)\n  disabled?: boolean;               // desabilita o trigger\n  onOpenChange?: (open: boolean) => void; // callback de estado\n  class?: string;                   // classes adicionais no wrapper\n};`;

        const propCols = {
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
              title: t('props.collapsibleTitle'),
              cols: propCols,
              items: [
                { name: 'trigger',      type: 'string | HTMLElement', defaultValue: '—',     required: 'Sim', description: 'Texto ou elemento HTML usado como botão trigger.'           },
                { name: 'content',      type: 'HTMLElement',          defaultValue: '—',     required: 'Sim', description: 'Elemento HTML do painel expansível.'                        },
                { name: 'defaultOpen',  type: 'boolean',              defaultValue: 'false', required: 'Não', description: stripHtml(t('props.table.defaultOpen'))                      },
                { name: 'disabled',     type: 'boolean',              defaultValue: 'false', required: 'Não', description: t('props.table.disabled')                                   },
                { name: 'onOpenChange', type: '(open: boolean) => void', defaultValue: '—',  required: 'Não', description: stripHtml(t('props.table.onOpenChange'))                    },
                { name: 'class',        type: 'string',               defaultValue: '—',     required: 'Não', description: stripHtml(t('props.table.className'))                       },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: stripHtml(t('props.extensibility')),
        });
      }

      // ── Tokens ─────────────────────────────────────────────────────────
      case 'tokens':
        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--border',          value: 'border-border',             description: t('tokens.table.border')      },
            { token: '--muted',           value: 'bg-muted/50',               description: t('tokens.table.background')  },
            { token: '--radius',          value: 'rounded-md',                description: t('tokens.table.radius')      },
            { token: '--accent',          value: 'hover:bg-accent',           description: t('tokens.table.triggerHover')},
            { token: '--ring',            value: 'focus-visible:ring-ring',   description: t('tokens.table.triggerFocus')},
            { token: 'transition-all',    value: 'transition-all duration-200', description: t('tokens.table.transition') },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode: `/* Personalizar via CSS variables no tema */\n:root {\n  --radius: 0.5rem;\n  --border: oklch(...);\n  --muted: oklch(...);\n}`,
        });

      // ── Acessibilidade ─────────────────────────────────────────────────
      case 'acessibilidade':
        return createDocsAccessibility({
          title: t('accessibility.title'),
          summary: sanitizeHtml(t('accessibility.summary')),
          items: [
            sanitizeHtml(t('accessibility.item1')),
            sanitizeHtml(t('accessibility.item2')),
            sanitizeHtml(t('accessibility.item3')),
            sanitizeHtml(t('accessibility.item4')),
            sanitizeHtml(t('accessibility.item5')),
          ],
          keyboardTitle: t('accessibility.keyboardTitle'),
          keyboardItems: [
            { key: 'Tab',   description: t('accessibility.keyboard.tab')     },
            { key: 'Enter', description: t('accessibility.keyboard.enter')   },
            { key: 'Space', description: t('accessibility.keyboard.space')   },
            { key: '—',     description: t('accessibility.keyboard.noArrow') },
          ],
        });

      // ── Relacionados ───────────────────────────────────────────────────
      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: 'Accordion',  description: t('related.accordion'), path: '?path=/docs/ui-accordion--docs'  },
            { name: 'Sheet',      description: t('related.sheet'),     path: '?path=/docs/ui-sheet--docs'      },
            { name: 'Button',     description: t('related.button'),    path: '?path=/docs/ui-button--docs'     },
            { name: 'Tabs',       description: t('related.tabs'),      path: '?path=/docs/ui-tabs--docs'       },
          ],
        });

      // ── Notas ──────────────────────────────────────────────────────────
      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [
            { title: '', content: sanitizeHtml(t('notes.tip1')) },
            { title: '', content: sanitizeHtml(t('notes.tip2')) },
            { title: '', content: sanitizeHtml(t('notes.tip3')) },
          ],
        });

      // ── Analytics ──────────────────────────────────────────────────────
      case 'analytics':
        return createDocsAnalytics({
          title: t('analytics.title'),
          cols: {
            event: t('analytics.table.event'),
            trigger: t('analytics.table.trigger'),
            payload: t('analytics.table.payload'),
          },
          items: [
            { event: t('analytics.table.toggle'),    trigger: t('analytics.table.toggleTrigger'),    payload: t('analytics.table.togglePayload')    },
            { event: t('analytics.table.pageView'),  trigger: t('analytics.table.pageViewTrigger'),  payload: t('analytics.table.pageViewPayload')  },
            { event: t('analytics.table.sectionViewed'), trigger: t('analytics.table.sectionViewedTrigger'), payload: t('analytics.table.sectionViewedPayload') },
            { event: t('analytics.table.langSwitch'), trigger: t('analytics.table.langSwitchTrigger'), payload: t('analytics.table.langSwitchPayload') },
          ],
        });

      // ── Testes ─────────────────────────────────────────────────────────
      case 'testes':
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
            cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
            items: [1, 2, 3, 4, 5].map(i => ({
              criterion: stripHtml(t(`testes.accessibility.item${i}.criterion`)),
              level: t(`testes.accessibility.item${i}.level`),
              how: t(`testes.accessibility.item${i}.how`),
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
        component_name: 'collapsible',
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
