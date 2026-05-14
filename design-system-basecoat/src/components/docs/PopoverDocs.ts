import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createPopover } from '@/components/ui/popover';
import { createButton } from '@/components/ui/button';
import { createInput } from '@/components/ui/input';
import { createLabel } from '@/components/ui/label';
import uiTranslations from '@/i18n/ui.json';
import popoverTranslations from '@shared/content/popover/translations.json';

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
const { t, subscribe } = createTranslation(popoverTranslations as Record<string, unknown>);

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

// ─── Demo builders ────────────────────────────────────────────────────────────

function buildDefaultPopover(): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: t('demonstration.labels.trigger') });

  const content = document.createElement('div');
  content.className = 'space-y-2';

  const p = document.createElement('p');
  p.className = 'text-sm text-muted-foreground';
  p.textContent = t('demonstration.labels.description');
  content.appendChild(p);

  return createPopover({ trigger, content, side: 'bottom', align: 'center' });
}

function buildWithTitlePopover(): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: t('demonstration.labels.trigger') });

  const content = document.createElement('div');
  content.className = 'space-y-3';

  const header = document.createElement('div');
  header.className = 'space-y-1';
  const title = document.createElement('h4');
  title.className = 'text-sm font-medium leading-none';
  title.textContent = t('demonstration.labels.title');
  const desc = document.createElement('p');
  desc.className = 'text-xs text-muted-foreground';
  desc.textContent = t('demonstration.labels.description');
  header.append(title, desc);

  const actions = document.createElement('div');
  actions.className = 'flex justify-end gap-2';
  const cancel = createButton({ variant: 'ghost', size: 'sm', label: t('demonstration.labels.cancel') });
  const save = createButton({ variant: 'default', size: 'sm', label: t('demonstration.labels.save') });
  actions.append(cancel, save);

  content.append(header, actions);

  return createPopover({ trigger, content, side: 'bottom', align: 'start' });
}

function buildFormPopover(): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: t('demonstration.labels.form.trigger') });

  const content = document.createElement('form');
  content.className = 'space-y-3';
  content.addEventListener('submit', (e) => e.preventDefault());

  const nameRow = document.createElement('div');
  nameRow.className = 'space-y-1';
  const nameLabel = createLabel({ text: t('demonstration.labels.form.name'), htmlFor: 'popover-demo-name' });
  const nameInput = createInput({ id: 'popover-demo-name', placeholder: t('demonstration.labels.form.name') });
  nameRow.append(nameLabel, nameInput);

  const emailRow = document.createElement('div');
  emailRow.className = 'space-y-1';
  const emailLabel = createLabel({ text: t('demonstration.labels.form.email'), htmlFor: 'popover-demo-email' });
  const emailInput = createInput({ id: 'popover-demo-email', type: 'email', placeholder: 'name@example.com' });
  emailRow.append(emailLabel, emailInput);

  const submit = createButton({ variant: 'default', size: 'sm', label: t('demonstration.labels.form.submit'), type: 'submit' });

  content.append(nameRow, emailRow, submit);

  return createPopover({ trigger, content, side: 'bottom', align: 'start' });
}

// ─── createPopoverDocs ────────────────────────────────────────────────────────

export function createPopoverDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────
  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'popover',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/overlay' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'popover',
      locale,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  }
  let cleanupSeo = updateSeo();
  cleanups.push(() => cleanupSeo());
  cleanups.push(subscribe(() => { cleanupSeo(); cleanupSeo = updateSeo(); }));

  // ── Nav groups ────────────────────────────────────────────────────────────
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
      installNote: 'npx shadcn@latest add popover',
    });
    headerSlot.replaceChildren(header);
  }
  function buildSidebar() { pageLayout.rebuildNav(buildNavGroups()); }
  function updateActiveNav(id: string) { pageLayout.setActiveSection(id); }

  // ── Sections ──────────────────────────────────────────────────────────────
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
            wrap.style.contain = 'layout';
            wrap.className = 'grid grid-cols-1 sm:grid-cols-3 gap-6 w-full min-h-[180px]';

            const cells: Array<{ labelKey: string; build: () => HTMLElement }> = [
              { labelKey: 'variants.items.default',   build: buildDefaultPopover   },
              { labelKey: 'variants.items.withTitle', build: buildWithTitlePopover },
              { labelKey: 'variants.items.form',      build: buildFormPopover      },
            ];

            for (const cell of cells) {
              const col = document.createElement('div');
              col.className = 'space-y-2';
              col.style.contain = 'layout';
              col.style.position = 'relative';
              col.style.minHeight = '120px';

              const label = document.createElement('p');
              label.className = 'text-xs font-medium text-muted-foreground';
              label.textContent = t(cell.labelKey);

              col.appendChild(label);
              col.appendChild(cell.build());
              wrap.appendChild(col);
            }

            return wrap;
          },
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [1, 2, 3, 4, 5, 6].map(i => sanitizeHtml(t(`anatomy.item${i}`))),
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

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
            items: ['title', 'description', 'trigger'].map(key => ({
              element: t(`usage.uxWriting.table.${key}.name`),
              rules: t(`usage.uxWriting.table.${key}.format`),
              do: t(`usage.uxWriting.table.${key}.good`),
              dont: t(`usage.uxWriting.table.${key}.bad`),
            })),
          },
          do: {
            title: t('usage.do.title'),
            items: [1, 2, 3, 4].map(i => t(`usage.do.item${i}`)),
          },
          dont: {
            title: t('usage.dont.title'),
            items: [1, 2, 3, 4].map(i => stripHtml(t(`usage.dont.item${i}`))),
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
              doPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'text-sm space-y-1';
                const title = document.createElement('div');
                title.className = 'font-medium';
                title.textContent = t('demonstration.labels.title');
                const desc = document.createElement('div');
                desc.className = 'text-xs text-muted-foreground';
                desc.textContent = '+ PopoverTitle anunciado pelo SR';
                wrap.append(title, desc);
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'text-sm';
                const note = document.createElement('div');
                note.className = 'text-xs text-muted-foreground italic';
                note.textContent = 'sem título — SR sem contexto';
                wrap.append(note);
                return wrap;
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: () => {
                const code = document.createElement('div');
                code.className = 'text-sm font-mono';
                code.textContent = '"Editar perfil"';
                return code;
              },
              dontPreviewFactory: () => {
                const code = document.createElement('div');
                code.className = 'text-sm font-mono';
                code.textContent = '"Clique aqui"';
                return code;
              },
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          code: `import { createPopover } from '@/components/ui/popover';`,
        });

      case 'variantes': {
        const codeDefault = `const trigger = createButton({ variant: 'outline', label: 'Abrir popover' });

const content = document.createElement('div');
content.textContent = 'Ajuste a aparência do conteúdo.';

createPopover({ trigger, content, side: 'bottom', align: 'center' });`;

        const codeWithTitle = `const trigger = createButton({ variant: 'outline', label: 'Abrir popover' });

const content = document.createElement('div');
const title = document.createElement('h4');
title.className = 'text-sm font-medium';
title.textContent = 'Configurações de exibição';
const desc = document.createElement('p');
desc.className = 'text-xs text-muted-foreground';
desc.textContent = 'Ajuste a aparência do conteúdo.';
content.append(title, desc);

createPopover({ trigger, content });`;

        const codeForm = `const trigger = createButton({ variant: 'outline', label: 'Editar perfil' });

const form = document.createElement('form');
// ... Inputs + submit button
createPopover({ trigger, content: form });`;

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              name: t('variants.items.default'),
              description: stripHtml(t('variants.styles.default')),
              code: codeDefault,
              previewFactory: () => buildDefaultPopover(),
            },
            {
              name: t('variants.items.withTitle'),
              description: stripHtml(t('variants.styles.withTitle')),
              code: codeWithTitle,
              previewFactory: () => buildWithTitlePopover(),
            },
            {
              name: t('variants.items.form'),
              description: stripHtml(t('variants.styles.form')),
              code: codeForm,
              previewFactory: () => buildFormPopover(),
            },
          ],
        });
      }

      case 'estados': {
        const locale = getLocale();
        const cols = locale === 'en'
          ? { state: 'State',  trigger: 'Trigger', behavior: 'Behavior' }
          : locale === 'es'
          ? { state: 'Estado', trigger: 'Disparo', behavior: 'Comportamiento' }
          : { state: 'Estado', trigger: 'Disparo', behavior: 'Comportamento' };

        return createDocsStates({
          title: t('states.title'),
          cols,
          items: [
            { label: t('states.items.closed'),        trigger: 'estado inicial',                       behavior: stripHtml(t('states.descriptions.closed'))        },
            { label: t('states.items.open'),          trigger: 'click no trigger',                     behavior: stripHtml(t('states.descriptions.open'))          },
            { label: t('states.items.transitioning'), trigger: 'animação de entrada/saída',            behavior: stripHtml(t('states.descriptions.transitioning')) },
            { label: t('states.items.focused'),       trigger: 'tab em elemento interno',              behavior: stripHtml(t('states.descriptions.focused'))       },
          ],
        });
      }

      case 'propriedades': {
        const interfaceCode = `// createPopover(options) — factory custom Basecoat
export type PopoverSide = 'top' | 'bottom' | 'left' | 'right';
export type PopoverAlign = 'start' | 'center' | 'end';

export type PopoverOptions = {
  trigger: HTMLElement;
  content: HTMLElement | string;
  side?: PopoverSide;
  align?: PopoverAlign;
  onOpenChange?: (open: boolean) => void;
  class?: string;
};

export function createPopover(options: PopoverOptions): HTMLElement;`;

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
              title: 'createPopover(options)',
              cols: propsCols,
              items: [
                { name: 'trigger',      type: 'HTMLElement',                         defaultValue: '—',         required: 'Sim', description: 'Elemento que abre o popover ao clicar (geralmente Button).' },
                { name: 'content',      type: 'HTMLElement | string',                defaultValue: '—',         required: 'Sim', description: 'Conteúdo do painel. String é renderizada via textContent.' },
                { name: 'side',         type: "'top' | 'bottom' | 'left' | 'right'", defaultValue: "'bottom'",  required: 'Não', description: stripHtml(t('props.table.side.description')) + ' NOTA: factory Basecoat não faz auto-flip por colisão.' },
                { name: 'align',        type: "'start' | 'center' | 'end'",          defaultValue: "'center'",  required: 'Não', description: stripHtml(t('props.table.align.description')) },
                { name: 'onOpenChange', type: '(open: boolean) => void',             defaultValue: '—',         required: 'Não', description: stripHtml(t('props.table.onOpenChange.description')) },
                { name: 'class',        type: 'string',                              defaultValue: '—',         required: 'Não', description: 'Classes adicionais aplicadas ao painel flutuante.' },
                { name: 'open',         type: 'boolean',                             defaultValue: '—',         required: 'Não', description: stripHtml(t('props.table.open.description')) + ' NOTA: factory Basecoat só suporta estado uncontrolled — observe via onOpenChange.' },
                { name: 'modal',        type: 'boolean',                             defaultValue: 'false',     required: 'Não', description: stripHtml(t('props.table.modal.description')) + ' NOTA: factory Basecoat não implementa focus trap nem scroll lock.' },
                { name: 'sideOffset',   type: 'number',                              defaultValue: '8',         required: 'Não', description: stripHtml(t('props.table.sideOffset.description')) + ' NOTA: factory Basecoat usa gap fixo (8px).' },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: t('props.extensibilityCode'),
        });
      }

      case 'tokens':
        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--popover',             value: t('tokens.table.popover.class'),            description: t('tokens.table.popover.part')            },
            { token: '--popover-foreground',  value: t('tokens.table.popoverForeground.class'),  description: t('tokens.table.popoverForeground.part')  },
            { token: '--muted-foreground',    value: t('tokens.table.mutedForeground.class'),    description: t('tokens.table.mutedForeground.part')    },
            { token: '--border',              value: t('tokens.table.border.class'),             description: t('tokens.table.border.part')             },
            { token: '--shadow',              value: t('tokens.table.shadow.class'),             description: t('tokens.table.shadow.part')             },
            { token: '--ring',                value: t('tokens.table.ring.class'),               description: t('tokens.table.ring.part')               },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode: t('tokens.customizationCode'),
        });

      case 'acessibilidade':
        return createDocsAccessibility({
          title: t('accessibility.title'),
          summary: t('accessibility.summary'),
          items: [1, 2, 3, 4, 5, 6].map(i => sanitizeHtml(t(`accessibility.items.item${i}`))),
          keyboardTitle: t('accessibility.keyboard.title'),
          keyboardItems: [
            { key: 'Tab',       description: stripHtml(t('accessibility.keyboard.tab'))      },
            { key: 'Shift+Tab', description: stripHtml(t('accessibility.keyboard.shiftTab')) },
            { key: 'Esc',       description: stripHtml(t('accessibility.keyboard.escape'))   },
            { key: 'Enter',     description: stripHtml(t('accessibility.keyboard.enter'))    },
            { key: 'Space',     description: stripHtml(t('accessibility.keyboard.space'))    },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.tooltip.name'),      description: t('related.items.tooltip.description'),      path: '?path=/docs/ui-tooltip--docs'      },
            { name: t('related.items.dropdownMenu.name'), description: t('related.items.dropdownMenu.description'), path: '?path=/docs/ui-dropdownmenu--docs' },
            { name: t('related.items.dialog.name'),       description: t('related.items.dialog.description'),       path: '?path=/docs/ui-dialog--docs'       },
            { name: t('related.items.hoverCard.name'),    description: t('related.items.hoverCard.description'),    path: '?path=/docs/ui-hovercard--docs'    },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [1, 2, 3, 4].map(i => ({ title: '', content: sanitizeHtml(t(`notes.item${i}`)) })),
        });

      case 'analytics':
        return createDocsAnalytics({
          title: t('analytics.title'),
          cols: {
            event: tNav('analytics.table.event') || 'Evento',
            trigger: tNav('analytics.table.trigger') || 'Gatilho',
            payload: tNav('analytics.table.payload') || 'Payload',
          },
          items: [
            {
              event: 'popover_open',
              trigger: stripHtml(t('analytics.table.popover_open.trigger')),
              payload: stripHtml(t('analytics.table.popover_open.payload')),
            },
            {
              event: 'popover_close',
              trigger: stripHtml(t('analytics.table.popover_close.trigger')),
              payload: stripHtml(t('analytics.table.popover_close.payload')),
            },
          ],
        });

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
            items: [1, 2, 3, 4].map(i => ({
              action: t(`testes.functional.item${i}.action`),
              result: t(`testes.functional.item${i}.result`),
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
              criterion: t(`testes.accessibility.item${i}`),
              level: 'AA',
              how: 'axe-core / manual',
            })),
          },
          visual: {
            title: t('testes.visual.title'),
            cols: {
              story: tNav('common.storyState'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4].map(i => ({
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
      if (existing && existing.parentNode) existing.replaceWith(fresh);
      else main.appendChild(fresh);
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
        component_name: 'popover',
        locale: getLocale(),
      }),
    );
  }
  cleanups.push(() => activeSectionObserver?.disconnect());

  // ── Initial render ────────────────────────────────────────────────────────
  renderHeader();
  buildSidebar();
  renderAllSections();

  cleanups.push(subscribe(() => { renderHeader(); buildSidebar(); renderAllSections(); }));
  cleanups.push(onLocaleChange(() => { renderHeader(); buildSidebar(); renderAllSections(); }));

  // ── Cleanup on disconnect ─────────────────────────────────────────────────
  const mo = new MutationObserver(() => {
    if (!document.body.contains(root)) {
      cleanups.forEach(fn => fn());
      // Also remove any leaked popover panels
      document.querySelectorAll('[data-slot="popover-content"]').forEach((n) => n.remove());
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return root;
}
