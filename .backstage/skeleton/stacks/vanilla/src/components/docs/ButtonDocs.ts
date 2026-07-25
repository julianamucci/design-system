import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createButton, createButtonIcon, type ButtonVariant, type ButtonSize } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import buttonTranslations from '@shared/content/button/translations.json';

import { createDocsNav, type DocsNavHandle } from '@/components/docs/shared/DocsNav';
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
} from '@/components/docs/shared/sections';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);
const { t, subscribe } = createTranslation(buttonTranslations as Record<string, unknown>);

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

function buildDemoButton(variant: ButtonVariant, label: string, location: string): HTMLButtonElement {
  return createButton({
    variant,
    label,
    onClick: () => {
      track('button_click', { component: 'button', variant, label, location });
    },
  });
}

function buildIconButton(variant: ButtonVariant, size: ButtonSize, ariaLabel: string): HTMLButtonElement {
  const btn = createButton({ variant, size, ariaLabel });
  btn.appendChild(createButtonIcon('plus'));
  return btn;
}

// ─── createButtonDocs ─────────────────────────────────────────────────────────

export function createButtonDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  const root = document.createElement('div');
  root.className = 'ds-docs p-8 max-w-5xl mx-auto';

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'button',
    });
    track('docs_page_view', { component_name: 'button', locale, page_title: `${t('title')} · Design System` });
    return cleanup;
  }
  let cleanupSeo = updateSeo();
  cleanups.push(() => cleanupSeo());
  cleanups.push(subscribe(() => { cleanupSeo(); cleanupSeo = updateSeo(); }));

  // ── Header slot ──────────────────────────────────────────────────────────

  const headerSlot = document.createElement('div');

  function renderHeader() {
    const header = createDocsHeader({
      title: t('title'),
      description: t('description'),
      category: t('category'),
      type: t('type'),
      installNote: 'npx shadcn@latest add button',
    });
    headerSlot.replaceChildren(header);
  }

  // ── Layout ───────────────────────────────────────────────────────────────

  const layout = document.createElement('div');
  layout.className = 'flex gap-16 items-start';

  const sidebar = document.createElement('nav');
  sidebar.setAttribute('aria-label', 'Navegação das seções do componente');
  sidebar.className = 'sticky top-8 w-52 shrink-0 self-start space-y-5';

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
      { id: 'tamanhos',     labelKey: 'nav.sizes'    },
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

  let navHandle: DocsNavHandle | null = null;

  function buildSidebar() {
    const groups = NAV_GROUPS.map(g => ({
      label: tNav(g.labelKey),
      sections: g.sections.map(s => ({ id: s.id, label: tNav(s.labelKey) })),
    }));
    navHandle = createDocsNav({ groups });
    sidebar.replaceChildren(navHandle.element);
  }

  function updateActiveNav(activeId: string) {
    navHandle?.setActiveSection(activeId);
  }

  const main = document.createElement('div');
  main.className = 'flex-1 min-w-0 space-y-12';
  layout.append(sidebar, main);

  // ── Sections ─────────────────────────────────────────────────────────────

  const sectionOrder = [
    'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
    'importacao', 'variantes', 'tamanhos', 'estados', 'propriedades', 'tokens',
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
            wrap.className = 'flex flex-wrap items-center gap-3';
            wrap.append(
              buildDemoButton('default',     t('demonstration.labels.primary'),     'docs-demo'),
              buildDemoButton('secondary',   t('demonstration.labels.secondary'),   'docs-demo'),
              buildDemoButton('destructive', t('demonstration.labels.destructive'), 'docs-demo'),
              buildDemoButton('outline',     t('demonstration.labels.outline'),     'docs-demo'),
              buildDemoButton('ghost',       t('demonstration.labels.ghost'),       'docs-demo'),
              buildDemoButton('link',        t('demonstration.labels.link'),        'docs-demo'),
            );

            const withIcon = createButton({
              variant: 'default',
              onClick: () => track('button_click', { component: 'button', variant: 'default', label: 'with-icon', location: 'docs-demo' }),
            });
            withIcon.appendChild(createButtonIcon('plus'));
            const lbl = document.createElement('span');
            lbl.textContent = t('demonstration.labels.withIcon');
            withIcon.appendChild(lbl);
            wrap.appendChild(withIcon);

            const iconOnly = createButton({
              variant: 'destructive',
              size: 'icon',
              ariaLabel: t('demonstration.labels.iconOnly'),
              onClick: () => track('button_click', { component: 'button', variant: 'destructive', label: 'icon-only', location: 'docs-demo' }),
            });
            iconOnly.appendChild(createButtonIcon('trash'));
            wrap.appendChild(iconOnly);

            return wrap;
          },
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [t('anatomy.item1'), t('anatomy.item2'), t('anatomy.item3'), t('anatomy.item4')],
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
          uxWriting: {
            title: t('usage.uxWriting.title'),
            cols: {
              element: t('usage.uxWriting.table.element'),
              rules: t('usage.uxWriting.table.rules'),
              do: t('usage.uxWriting.table.correct'),
              dont: t('usage.uxWriting.table.avoid'),
            },
            items: ['label', 'ariaLabel', 'iconOnly', 'loading'].map(key => ({
              element: t(`usage.uxWriting.table.${key}.name`),
              rules: t(`usage.uxWriting.table.${key}.format`),
              do: t(`usage.uxWriting.table.${key}.good`),
              dont: t(`usage.uxWriting.table.${key}.bad`),
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

      case 'do-dont':
        return createDocsDoDont({
          title: t('doDont.title'),
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair1.do'),
              dontCaption: t('doDont.pair1.dont'),
              doPreviewFactory: () => createButton({ variant: 'default', label: 'Salvar' }),
              dontPreviewFactory: () => createButton({ variant: 'default', label: 'Clique aqui' }),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'flex gap-2';
                wrap.append(
                  createButton({ variant: 'outline', label: 'Cancelar' }),
                  createButton({ variant: 'default', label: 'Confirmar' }),
                );
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'flex gap-2';
                wrap.append(
                  createButton({ variant: 'default', label: 'Salvar' }),
                  createButton({ variant: 'default', label: 'Enviar' }),
                );
                return wrap;
              },
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('import.basic'),
          code: `import { createButton } from '@/components/ui/button';`,
          secondaryDescription: t('import.withIcon'),
          secondaryCode: `import { createButton, createButtonIcon } from '@/components/ui/button';\n\nconst btn = createButton({ label: 'Adicionar' });\nbtn.prepend(createButtonIcon('plus'));`,
        });

      case 'variantes': {
        const codeDefault     = `createButton({ variant: 'default', label: 'Salvar' });`;
        const codeDestructive = `createButton({ variant: 'destructive', label: 'Excluir' });`;
        const codeOutline     = `createButton({ variant: 'outline', label: 'Cancelar' });`;
        const codeSecondary   = `createButton({ variant: 'secondary', label: 'Ver mais' });`;
        const codeGhost       = `createButton({ variant: 'ghost', label: 'Editar' });`;
        const codeLink        = `createButton({ variant: 'link', label: 'Saiba mais' });`;

        return createDocsVariants({
          id: 'variantes',
          title: t('variants.title'),
          items: [
            {
              name: 'default',
              description: stripHtml(t('variants.items.default')),
              code: codeDefault,
              previewFactory: () => createButton({ variant: 'default', label: t('demonstration.labels.primary') }),
            },
            {
              name: 'destructive',
              description: stripHtml(t('variants.items.destructive')),
              code: codeDestructive,
              previewFactory: () => createButton({ variant: 'destructive', label: t('demonstration.labels.destructive') }),
            },
            {
              name: 'outline',
              description: stripHtml(t('variants.items.outline')),
              code: codeOutline,
              previewFactory: () => createButton({ variant: 'outline', label: t('demonstration.labels.outline') }),
            },
            {
              name: 'secondary',
              description: stripHtml(t('variants.items.secondary')),
              code: codeSecondary,
              previewFactory: () => createButton({ variant: 'secondary', label: t('demonstration.labels.secondary') }),
            },
            {
              name: 'ghost',
              description: stripHtml(t('variants.items.ghost')),
              code: codeGhost,
              previewFactory: () => createButton({ variant: 'ghost', label: t('demonstration.labels.ghost') }),
            },
            {
              name: 'link',
              description: stripHtml(t('variants.items.link')),
              code: codeLink,
              previewFactory: () => createButton({ variant: 'link', label: t('demonstration.labels.link') }),
            },
          ],
        });
      }

      case 'tamanhos': {
        return createDocsVariants({
          id: 'tamanhos',
          title: t('variants.sizesTitle'),
          items: [
            {
              name: 'default',
              description: stripHtml(t('variants.sizes.default')),
              code: `createButton({ size: 'default', label: 'Padrão' });`,
              previewFactory: () => createButton({ size: 'default', label: 'Padrão' }),
            },
            {
              name: 'sm',
              description: stripHtml(t('variants.sizes.sm')),
              code: `createButton({ size: 'sm', label: 'Pequeno' });`,
              previewFactory: () => createButton({ size: 'sm', label: 'Pequeno' }),
            },
            {
              name: 'lg',
              description: stripHtml(t('variants.sizes.lg')),
              code: `createButton({ size: 'lg', label: 'Grande' });`,
              previewFactory: () => createButton({ size: 'lg', label: 'Grande' }),
            },
            {
              name: 'icon',
              description: stripHtml(t('variants.sizes.icon')),
              code: `const btn = createButton({ size: 'icon', ariaLabel: 'Adicionar' });\nbtn.appendChild(createButtonIcon('plus'));`,
              previewFactory: () => buildIconButton('default', 'icon', 'Adicionar'),
            },
            {
              name: 'icon-sm',
              description: stripHtml(t('variants.sizes.icon-sm')),
              code: `const btn = createButton({ size: 'icon-sm', ariaLabel: 'Adicionar' });\nbtn.appendChild(createButtonIcon('plus'));`,
              previewFactory: () => buildIconButton('default', 'icon-sm', 'Adicionar'),
            },
            {
              name: 'icon-lg',
              description: stripHtml(t('variants.sizes.icon-lg')),
              code: `const btn = createButton({ size: 'icon-lg', ariaLabel: 'Adicionar' });\nbtn.appendChild(createButtonIcon('plus'));`,
              previewFactory: () => buildIconButton('default', 'icon-lg', 'Adicionar'),
            },
          ],
        });
      }

      case 'estados':
        return createDocsStates({
          title: t('states.title'),
          cols: {
            state: t('states.cols.state'),
            trigger: t('states.cols.trigger'),
            behavior: t('states.cols.behavior'),
          },
          items: [
            { label: t('states.default.label'),      trigger: t('states.default.trigger'),      behavior: t('states.default.behavior') },
            { label: t('states.hover.label'),        trigger: t('states.hover.trigger'),        behavior: stripHtml(t('states.hover.behavior')) },
            { label: t('states.focusVisible.label'), trigger: t('states.focusVisible.trigger'), behavior: stripHtml(t('states.focusVisible.behavior')) },
            { label: t('states.disabled.label'),     trigger: stripHtml(t('states.disabled.trigger')), behavior: stripHtml(t('states.disabled.behavior')) },
            { label: t('states.loading.label'),      trigger: stripHtml(t('states.loading.trigger')),  behavior: t('states.loading.behavior') },
            { label: t('states.invalid.label'),      trigger: stripHtml(t('states.invalid.trigger')),  behavior: stripHtml(t('states.invalid.behavior')) },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createButton(options)
export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type ButtonSize    = 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';

export interface ButtonOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label?: string;
  ariaLabel?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: MouseEvent) => void;
  class?: string;
  children?: HTMLElement | string;
}`;

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
              title: t('props.buttonTitle'),
              cols: propsCols,
              items: [
                { name: 'variant',   type: '"default" | "destructive" | "outline" | "secondary" | "ghost" | "link"', defaultValue: '"default"', required: 'Não', description: stripHtml(t('props.table.variant')) },
                { name: 'size',      type: '"default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg"',               defaultValue: '"default"', required: 'Não', description: t('props.table.size') },
                { name: 'label',     type: 'string',                                                                 defaultValue: '—',         required: 'Não', description: 'Texto visível do botão.' },
                { name: 'ariaLabel', type: 'string',                                                                 defaultValue: '—',         required: 'Condicional', description: 'Obrigatório em botões icon-only.' },
                { name: 'disabled',  type: 'boolean',                                                                defaultValue: 'false',     required: 'Não', description: stripHtml(t('props.table.disabled')) },
                { name: 'type',      type: '"button" | "submit" | "reset"',                                          defaultValue: '"button"',  required: 'Não', description: stripHtml(t('props.table.type')) },
                { name: 'onClick',   type: '(e: MouseEvent) => void',                                                defaultValue: '—',         required: 'Não', description: stripHtml(t('props.table.onClick')) },
                { name: 'class',     type: 'string',                                                                 defaultValue: '—',         required: 'Não', description: stripHtml(t('props.table.className')) },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: stripHtml(t('props.extensibility')),
        });
      }

      case 'tokens': {
        const customizationCode = `/* Em styles.css — sobrescrever tokens do tema */
:root {
  --primary: 222 47% 11%;
  --primary-foreground: 210 40% 98%;
  --destructive: 0 72% 51%;
  --ring: 222 47% 11%;
}

.dark {
  --primary: 210 40% 98%;
  --primary-foreground: 222 47% 11%;
}`;

        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--primary',             value: 'bg-primary text-primary-foreground', description: t('tokens.table.primary') },
            { token: '--primary-foreground',  value: 'text-primary-foreground',            description: t('tokens.table.primaryForeground') },
            { token: '--secondary',           value: 'bg-secondary',                       description: t('tokens.table.secondary') },
            { token: '--destructive',         value: 'bg-destructive',                     description: t('tokens.table.destructive') },
            { token: '--border',              value: 'border',                             description: t('tokens.table.border') },
            { token: '--accent',              value: 'hover:bg-accent',                    description: t('tokens.table.accent') },
            { token: '--ring',                value: 'focus-visible:ring-ring/50',         description: t('tokens.table.ring') },
            { token: '--radius',              value: 'rounded-md',                         description: t('tokens.table.radius') },
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
          keyboardTitle: t('accessibility.keyboardTitle'),
          keyboardItems: [
            { key: 'Tab',   description: t('accessibility.keyboard.tab') },
            { key: 'Enter', description: stripHtml(t('accessibility.keyboard.enter')) },
            { key: 'Space', description: stripHtml(t('accessibility.keyboard.space')) },
            { key: '—',     description: stripHtml(t('accessibility.keyboard.disabled')) },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: 'Toggle',      description: stripHtml(t('related.toggle')),      path: '?path=/docs/ui-toggle--docs' },
            { name: 'Switch',      description: t('related.switch'),                 path: '?path=/docs/ui-switch--docs' },
            { name: 'Link',        description: t('related.link'),                   path: '?path=/docs/foundations-typography--docs' },
            { name: 'Dialog',      description: t('related.dialog'),                 path: '?path=/docs/ui-dialog--docs' },
            { name: 'AlertDialog', description: t('related.alertDialog'),            path: '?path=/docs/ui-alertdialog--docs' },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [
            { title: '', content: t('notes.tip1') },
            { title: '', content: t('notes.tip2') },
            { title: '', content: t('notes.tip3') },
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
            { event: t('analytics.table.click'),         trigger: stripHtml(t('analytics.table.clickTrigger')),         payload: t('analytics.table.clickPayload') },
            { event: t('analytics.table.pageView'),      trigger: t('analytics.table.pageViewTrigger'),                 payload: t('analytics.table.pageViewPayload') },
            { event: t('analytics.table.sectionViewed'), trigger: t('analytics.table.sectionViewedTrigger'),            payload: t('analytics.table.sectionViewedPayload') },
            { event: t('analytics.table.langSwitch'),    trigger: t('analytics.table.langSwitchTrigger'),               payload: t('analytics.table.langSwitchPayload') },
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
            cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
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

  let observer: IntersectionObserver | null = null;

  function attachObserver() {
    observer?.disconnect();
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          updateActiveNav(id);
          track('docs_section_viewed', { section_id: id, component_name: 'button', locale: getLocale() });
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

  root.append(headerSlot, layout);

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
