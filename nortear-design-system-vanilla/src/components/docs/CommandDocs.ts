import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createCommand } from '@/components/ui/command';
import { createButton } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import commandTranslations from '@shared/content/command/translations.json';

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
    (commandTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  );
}
const { t, subscribe } = createTranslation(commandTranslations as Record<string, unknown>);

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
 * Gatilho da paleta — o botão REAL, e não um `<div>` que se parece com um.
 *
 * A medida do gatilho sai de `.nds-button`, que é a folha do design system.
 * Antes o bloco era um `<div>` com `padding` cravado no `style`: a declaração
 * vencia a folha e saía do tema, da densidade e da escala de tipo — e, pior,
 * ensinava a construir um controle sem papel de botão, que o teclado não
 * alcança. As outras stacks já usam o botão do sistema aqui.
 */
function buildPaletteTrigger(withShortcut: boolean): HTMLElement {
  const trigger = createButton({
    variant: 'outline',
    class: 'nds-cluster nds-w-full',
  });
  trigger.dataset.spacing = 'xs';
  trigger.dataset.justify = 'between';

  // Lupa decorativa, montada por `createElementNS` e não por `innerHTML`:
  // conteúdo estático não precisa de parser de HTML (guideline 09).
  const NS = 'http://www.w3.org/2000/svg';
  const lupa = document.createElementNS(NS, 'svg');
  lupa.setAttribute('xmlns', NS);
  lupa.setAttribute('viewBox', '0 0 24 24');
  lupa.setAttribute('fill', 'none');
  lupa.setAttribute('stroke', 'currentColor');
  lupa.setAttribute('stroke-width', '2');
  lupa.setAttribute('stroke-linecap', 'round');
  lupa.setAttribute('stroke-linejoin', 'round');
  lupa.setAttribute('aria-hidden', 'true');
  const aro = document.createElementNS(NS, 'circle');
  aro.setAttribute('cx', '11');
  aro.setAttribute('cy', '11');
  aro.setAttribute('r', '8');
  const cabo = document.createElementNS(NS, 'path');
  cabo.setAttribute('d', 'm21 21-4.3-4.3');
  lupa.append(aro, cabo);
  trigger.appendChild(lupa);

  const label = document.createElement('span');
  label.className = 'nds-flex-1';
  label.textContent = t('demonstration.labels.openPalette');
  trigger.appendChild(label);

  if (withShortcut) {
    const tecla = document.createElement('kbd');
    tecla.className = 'nds-kbd';
    tecla.textContent = t('demonstration.labels.shortcutKey');
    trigger.appendChild(tecla);
  }

  return trigger;
}

function buildDemoCommand(placeholder: string, withGroups = true): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-w-full nds-max-w-sm nds-border-default nds-rounded-md nds-shadow-md';
  const items = withGroups
    ? [
        { value: 'button',    label: t('demonstration.labels.itemButton'),    group: t('demonstration.labels.groupComponents') },
        { value: 'input',     label: t('demonstration.labels.itemInput'),     group: t('demonstration.labels.groupComponents') },
        { value: 'separator', label: t('demonstration.labels.itemSeparator'), group: t('demonstration.labels.groupComponents') },
        { value: 'cn',        label: 'cn()',   group: t('demonstration.labels.groupUtils') },
        { value: 'clsx',      label: 'clsx()', group: t('demonstration.labels.groupUtils') },
      ]
    : [
        { value: 'button',    label: t('demonstration.labels.itemButton')    },
        { value: 'input',     label: t('demonstration.labels.itemInput')     },
        { value: 'separator', label: t('demonstration.labels.itemSeparator') },
      ];
  wrap.appendChild(
    createCommand({
      placeholder,
      emptyMessage: t('demonstration.labels.emptyMessage'),
      items,
      onSelect: (value) => {
        const item = items.find((i) => i.value === value);
        track('command_item_select', {
          label: item?.label ?? value,
          group: (item as { group?: string } | undefined)?.group ?? '',
          pattern: 'inline',
        });
      },
    })
  );
  return wrap;
}

/**
 * A paleta já com uma busca sem correspondência — o estado que o par de
 * Do & Don't compara. `emptyMessage: ''` é o lado errado: a região viva
 * continua lá, sem nada para anunciar nem para ler.
 */
function emptyBuildDemo(emptyMessage: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-w-full nds-max-w-sm nds-border-default nds-rounded-md';
  wrap.appendChild(
    createCommand({
      placeholder: t('demonstration.labels.searchPlaceholder'),
      emptyMessage,
      items: [
        { value: 'button', label: t('demonstration.labels.itemButton') },
        { value: 'input',  label: t('demonstration.labels.itemInput')  },
      ],
    })
  );

  const inp = wrap.querySelector('input');
  if (inp) {
    inp.value = 'xyz';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
  }
  return wrap;
}

// ─── createCommandDocs ────────────────────────────────────────────────────────

export function createCommandDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'command',
    });
    track('docs_page_view', {
      component_name: 'command',
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
    {
      labelKey: 'nav.overview',
      sections: [
        { id: 'demonstracao', labelKey: 'nav.demonstration' },
        { id: 'anatomia',     labelKey: 'nav.anatomy'       },
        { id: 'quando-usar',  labelKey: 'nav.usage'         },
        { id: 'do-dont',      labelKey: 'nav.doDont'        },
      ],
    },
    {
      labelKey: 'nav.techRef',
      sections: [
        { id: 'importacao',   labelKey: 'nav.import'   },
        { id: 'variantes',    labelKey: 'nav.variants' },
        { id: 'estados',      labelKey: 'nav.states'   },
        { id: 'propriedades', labelKey: 'nav.props'    },
        { id: 'tokens',       labelKey: 'nav.tokens'   },
      ],
    },
    {
      labelKey: 'nav.context',
      sections: [
        { id: 'acessibilidade', labelKey: 'nav.accessibility' },
        { id: 'relacionados',   labelKey: 'nav.related'       },
        { id: 'notas',          labelKey: 'nav.notes'         },
      ],
    },
    {
      labelKey: 'nav.quality',
      sections: [
        { id: 'analytics', labelKey: 'nav.analytics' },
        { id: 'testes',    labelKey: 'nav.testes'    },
      ],
    },
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
    'importacao', 'variantes', 'estados', 'propriedades', 'tokens',
    'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
  ] as const;
  type SectionId = typeof sectionOrder[number];

  const sectionEls: Record<SectionId, HTMLElement> = {} as Record<SectionId, HTMLElement>;

  function buildSection(id: SectionId): HTMLElement {
    switch (id) {

      // ─── 1. Demonstração ───────────────────────────────────────────────
      case 'demonstracao':
        return createDocsDemonstration({
          title: t('demonstration.title'),
          demoFactory: () => buildDemoCommand(t('demonstration.labels.searchPlaceholder'), true),
        });

      // ─── 2. Anatomia ───────────────────────────────────────────────────
      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => t(`anatomy.item${i}`)),
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      // ─── 3. Quando Usar ────────────────────────────────────────────────
      case 'quando-usar':
        return createDocsWhenToUse({
          title: t('usage.title'),
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [1, 2, 3, 4, 5].map(i => t(`usage.guidelines.item${i}`)),
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
            items: [1, 2, 3].map(i => t(`usage.do.item${i}`)),
          },
          dont: {
            title: t('usage.dont.title'),
            items: [1, 2, 3].map(i => t(`usage.dont.item${i}`)),
          },
        });

      // ─── 4. Do & Don't ─────────────────────────────────────────────────
      case 'do-dont':
        return createDocsDoDont({
          title: t('doDont.title'),
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair1.do')),
              dontCaption: toPlainText(t('doDont.pair1.dont')),
              // Os dois lados mostram a MESMA busca sem correspondência: o que
              // muda é haver ou não uma frase para ler. Antes o lado errado
              // exibia a mensagem padrão da factory e desmentia a própria
              // legenda ("omitir CommandEmpty").
              doPreviewFactory: () => emptyBuildDemo(t('demonstration.labels.emptyMessage')),
              dontPreviewFactory: () => emptyBuildDemo(''),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: () => {
                const outer = document.createElement('div');
                outer.className = 'nds-stack nds-p-2';
                outer.dataset.spacing = 'xs';
                outer.style.alignItems = 'flex-start';
                outer.appendChild(buildPaletteTrigger(true));
                return outer;
              },
              dontPreviewFactory: () => {
                const outer = document.createElement('div');
                outer.className = 'nds-stack nds-p-2';
                outer.dataset.spacing = 'xs';
                outer.style.alignItems = 'flex-start';
                // Sem dica de atalho: o gatilho não conta que a paleta existe.
                outer.appendChild(buildPaletteTrigger(false));
                return outer;
              },
            },
          ],
        });

      // ─── 5. Importação ─────────────────────────────────────────────────
      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('import.basic'),
          code: `import { createCommand } from '@/components/ui/command';`,
          secondaryDescription: t('import.withDialog'),
          secondaryCode: `// Padrão command palette — combine Command com Dialog nativo\nimport { createCommand } from '@/components/ui/command';\nimport { createDialog } from '@/components/ui/dialog';`,
        });

      // ─── 6. Variantes (Padrões de Uso) ─────────────────────────────────
      case 'variantes': {
        const codeInline = `const cmd = createCommand({\n  placeholder: 'Buscar componente...',\n  emptyMessage: 'Nenhum resultado encontrado.',\n  items: [\n    { value: 'button', label: 'Button', group: 'Componentes' },\n    { value: 'input',  label: 'Input',  group: 'Componentes' },\n  ],\n  onSelect: (value) => console.log('selected:', value),\n});`;
        const codePalette = `// Command dentro de Dialog para command palette\nconst cmd = createCommand({\n  placeholder: 'Buscar comando ou ação...',\n  emptyMessage: 'Nenhum resultado encontrado.',\n  items: [\n    { value: 'button', label: 'Button', group: 'Componentes', shortcut: 'Ctrl+B' },\n    // O traço quebra a sequência: o que vem antes e o que vem depois passam\n    // a contar como blocos distintos, e é a fronteira que o CSS desenha.\n    { type: 'separator' },\n    { value: 'novo', label: 'Novo arquivo', group: 'Ações', shortcut: 'Ctrl+N' },\n  ],\n  onSelect: (value) => {\n    executeAction(value);\n    closeDialog();\n  },\n});\n\n// Atalho global Cmd+K\nwindow.addEventListener('keydown', (e) => {\n  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {\n    e.preventDefault();\n    openDialog();\n  }\n});`;

        const codeWithGroups = `const wrap = document.createElement('div');
wrap.className = 'nds-w-sm nds-border-default nds-rounded-md nds-shadow-md';
wrap.appendChild(
  createCommand({
    placeholder: 'Buscar componente...',
    emptyMessage: 'Nenhum resultado encontrado.',
    items: [
      { value: 'button',    label: 'Button',    group: 'Componentes' },
      { value: 'input',     label: 'Input',     group: 'Componentes' },
      { value: 'badge',     label: 'Badge',     group: 'Componentes' },
      { value: 'separator', label: 'Separator', group: 'Componentes' },
      { value: 'cn',        label: 'cn()',       group: 'Utilitários' },
      { value: 'clsx',      label: 'clsx()',     group: 'Utilitários' },
      { value: 'twmerge',   label: 'twMerge()',  group: 'Utilitários' },
    ],
  })
);`;

        return createDocsCompositions({
          id: 'variantes',
          title: t('variants.title'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'command',
          items: [
            {
              name: 'inline',
              description: stripHtml(t('variants.items.inline')),
              code: codeInline,
              previewFactory: () => buildDemoCommand(t('demonstration.labels.searchPlaceholder'), true),
            },
            {
              name: 'palette',
              description: stripHtml(t('variants.items.palette')),
              code: codePalette,
              previewFactory: () => {
                const outer = document.createElement('div');
                outer.className = 'nds-stack nds-p-2';
                outer.dataset.spacing = 'xs';
                outer.style.alignItems = 'flex-start';
                outer.appendChild(buildPaletteTrigger(true));
                const dialog = document.createElement('div');
                dialog.className = 'nds-w-full nds-max-w-sm nds-border-default nds-rounded-md nds-shadow-md';
                dialog.appendChild(
                  createCommand({
                    placeholder: t('demonstration.labels.dialogDescription'),
                    emptyMessage: t('demonstration.labels.emptyMessage'),
                    items: [
                      { value: 'button', label: t('demonstration.labels.itemButton'), group: t('demonstration.labels.groupComponents'), shortcut: 'Ctrl+B' },
                      { value: 'input',  label: t('demonstration.labels.itemInput'),  group: t('demonstration.labels.groupComponents'), shortcut: 'Ctrl+I' },
                      // O traço fecha o bloco de componentes e abre o de utilitários.
                      { type: 'separator' },
                      { value: 'cn', label: 'cn()', group: t('demonstration.labels.groupUtils') },
                    ],
                  })
                );
                outer.appendChild(dialog);
                return outer;
              },
            },
            {
              name: stripHtml(t('variants.items.withGroups.name')),
              description: stripHtml(t('variants.items.withGroups.description')),
              useWhen: stripHtml(t('variants.items.withGroups.use')),
              trackId: 'withGroups',
              code: codeWithGroups,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-w-sm nds-border-default nds-rounded-md nds-shadow-md';
                wrap.appendChild(
                  createCommand({
                    placeholder: t('demonstration.labels.searchPlaceholder'),
                    emptyMessage: t('demonstration.labels.emptyMessage'),
                    items: [
                      { value: 'button',    label: 'Button',    group: t('demonstration.labels.groupComponents') },
                      { value: 'input',     label: 'Input',     group: t('demonstration.labels.groupComponents') },
                      { value: 'badge',     label: 'Badge',     group: t('demonstration.labels.groupComponents') },
                      { value: 'separator', label: 'Separator', group: t('demonstration.labels.groupComponents') },
                      { value: 'cn',        label: 'cn()',       group: t('demonstration.labels.groupUtils') },
                      { value: 'clsx',      label: 'clsx()',     group: t('demonstration.labels.groupUtils') },
                      { value: 'twmerge',   label: 'twMerge()',  group: t('demonstration.labels.groupUtils') },
                    ],
                  })
                );
                return wrap;
              },
            },
          ],
        });
      }

      // ─── 7. Estados ────────────────────────────────────────────────────
      case 'estados':
        return createDocsStates({
          title: t('states.title'),
          cols: {
            state:    t('states.cols.state'),
            trigger: toPlainText(t('states.cols.trigger')),
            behavior: toPlainText(t('states.cols.behavior')),
          },
          items: [
            {
              label:    t('states.empty.label'),
              trigger:  toPlainText(t('states.empty.trigger')),
              behavior: toPlainText(t('states.empty.behavior')),
            },
            {
              label:    t('states.selected.label'),
              trigger:  toPlainText(t('states.selected.trigger')),
              behavior: toPlainText(t('states.selected.behavior')),
            },
            {
              label:    t('states.disabled.label'),
              trigger:  toPlainText(t('states.disabled.trigger')),
              behavior: toPlainText(t('states.disabled.behavior')),
            },
            {
              label:    t('states.loading.label'),
              trigger:  toPlainText(t('states.loading.trigger')),
              behavior: toPlainText(t('states.loading.behavior')),
            },
            {
              label:    t('states.longList.label'),
              trigger:  toPlainText(t('states.longList.trigger')),
              behavior: toPlainText(t('states.longList.behavior')),
            },
          ],
        });

      // ─── 8. Propriedades ───────────────────────────────────────────────
      case 'propriedades': {
        const interfaceCode = `// CommandOptions
export type CommandOptions = {
  placeholder?: string;
  emptyMessage?: string;
  items: CommandEntry[];
  onSelect?: (value: string) => void;
  class?: string;
};

// A lista aceita comandos e traços, em união discriminada por \`type\`.
export type CommandEntry = CommandItem | CommandSeparator;

// CommandItem
export type CommandItem = {
  type?: 'item';        // ausente vale por 'item'
  value: string;
  label: string;
  group?: string;
  disabled?: boolean;
  checked?: boolean;
  shortcut?: string;
};

// Traço entre dois blocos de comandos.
export type CommandSeparator = { type: 'separator' };`;

        const propsCols = {
          prop:        t('props.table.prop'),
          type:        t('props.table.type'),
          default:     t('props.table.default'),
          required:    t('props.table.required'),
          description: t('props.table.description'),
        };

        return createDocsProps({
          title: t('props.title'),
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: t('props.extensibility'),
          tables: [
            {
              title: t('props.commandTitle'),
              cols: propsCols,
              items: [
                { name: 'placeholder',  type: 'string',                 defaultValue: '"Search…"',           required: 'Não', description: toPlainText(t('props.table.inputPlaceholder')) },
                { name: 'emptyMessage', type: 'string',                 defaultValue: '"No results found."', required: 'Não', description: 'Frase anunciada pela região viva quando a busca não encontra nada.' },
                { name: 'items',        type: 'CommandEntry[]',         defaultValue: '—',                   required: 'Sim', description: 'Comandos e traços, na ordem em que aparecem. O traço é uma quebra na sequência: os comandos de um lado e os do outro passam a contar como blocos distintos.' },
                { name: 'onSelect',     type: '(value: string) => void', defaultValue: '—',                  required: 'Não', description: toPlainText(t('props.table.itemOnSelect')) },
                { name: 'class',        type: 'string',                 defaultValue: '—',                   required: 'Não', description: toPlainText(t('props.table.className')) },
              ],
            },
            {
              title: t('props.commandItemTitle'),
              cols: propsCols,
              items: [
                { name: 'type',     type: "'item' | 'separator'", defaultValue: "'item'", required: 'Não', description: 'Discriminante da lista. Com `separator`, a entrada é só o traço e não leva rótulo nem valor. Um traço cujos vizinhos sumiram no filtro desaparece com eles, porque não sobrou fronteira para marcar.' },
                { name: 'value',    type: 'string',  defaultValue: '—',     required: 'Sim', description: toPlainText(t('props.table.itemValue'))    },
                { name: 'label',    type: 'string',  defaultValue: '—',     required: 'Sim', description: 'Texto exibido no item.'                  },
                { name: 'group',    type: 'string',  defaultValue: '—',     required: 'Não', description: 'Nome do grupo para agrupar itens.'        },
                { name: 'disabled', type: 'boolean', defaultValue: 'false', required: 'Não', description: toPlainText(t('props.table.itemDisabled'))  },
                { name: 'checked',  type: 'boolean', defaultValue: '—',     required: 'Não', description: 'Estado de marcação. Sem valor, o item não é marcável e não ganha a marca à direita.' },
                { name: 'shortcut', type: 'string',  defaultValue: '—',     required: 'Não', description: 'Atalho exibido à direita. Entra no nome acessível do item e esconde a marca.' },
              ],
            },
          ],
        });
      }

      // ─── 9. Tokens ─────────────────────────────────────────────────────
      case 'tokens': {
        const customizationCode = `/* Em styles.css — sobrescrever tokens semânticos */
:root {
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
}

.dark {
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
}`;

        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token:       t('tokens.table.token'),
            value:       t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          // A coluna do meio traz o SELETOR REAL da folha compartilhada
          // (`docs/shared/styles/nds/command.css`). Antes trazia `bg-accent`,
          // `rounded-md / rounded-sm` e companhia — vocabulário do framework
          // que saiu do projeto, que não casa com nada no CSS de hoje.
          items: [
            { token: '--popover',            value: '.nds-command',                                description: toPlainText(t('tokens.table.popoverBg'))   },
            { token: '--popover-foreground', value: '.nds-command',                                description: toPlainText(t('tokens.table.popoverFg'))   },
            { token: '--muted-foreground',   value: '.nds-command-group-heading',                  description: toPlainText(t('tokens.table.mutedFg'))     },
            { token: '--border',             value: '.nds-command-input-wrapper',                  description: toPlainText(t('tokens.table.inputBorder')) },
            { token: '--accent',             value: '.nds-command-item[aria-selected="true"]',     description: toPlainText(t('tokens.table.selectedBg'))  },
            { token: '--accent-foreground',  value: '.nds-command-item[aria-selected="true"]',     description: toPlainText(t('tokens.table.selectedFg'))  },
            { token: '--border',             value: '.nds-command-separator',                      description: toPlainText(t('tokens.table.border'))      },
            { token: '--radius',             value: '.nds-command · .nds-command-item',            description: toPlainText(t('tokens.table.radius'))      },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode,
        });
      }

      // ─── 10. Acessibilidade ────────────────────────────────────────────
      case 'acessibilidade':
        return createDocsAccessibility({
          screenReaderTitle: tNav('common.screenReader'),
          screenReaderItems: screenReaderItems(),
          title: t('accessibility.title'),
          summary: t('accessibility.summary'),
          items: [1, 2, 3].map(i => t(`accessibility.item${i}`)),
          keyboardTitle: tNav('common.keyboardNav') || 'Navegação por teclado',
          keyboardItems: [
            { key: 'Arrow Down',      description: toPlainText(t('accessibility.keyboard.arrowDown')) },
            { key: 'Arrow Up',      description: toPlainText(t('accessibility.keyboard.arrowUp'))   },
            { key: 'Enter',  description: toPlainText(t('accessibility.keyboard.enter'))      },
            { key: 'Escape', description: toPlainText(t('accessibility.keyboard.escape'))     },
            { key: 'Tab',    description: toPlainText(t('accessibility.keyboard.tab'))        },
            { key: 'Ctrl+K',    description: toPlainText(t('accessibility.keyboard.cmdK'))       },
          ],
        });

      // ─── 11. Relacionados ──────────────────────────────────────────────
      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: 'Select',       description: toPlainText(t('related.select')),       path: '?path=/docs/components-form-select--docs'        },
            { name: 'DropdownMenu', description: toPlainText(t('related.dropdownMenu')), path: '?path=/docs/components-overlay-dropdownmenu--docs'  },
            { name: 'Dialog',       description: toPlainText(t('related.dialog')),       path: '?path=/docs/components-overlay-dialog--docs'        },
          ],
        });

      // ─── 12. Notas ─────────────────────────────────────────────────────
      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [
            { title: '', content: t('notes.tip1') },
            { title: '', content: t('notes.tip2') },
            { title: '', content: t('notes.tip3') },
          ],
        });

      // ─── 13. Analytics ─────────────────────────────────────────────────
      case 'analytics':
        return createDocsAnalytics({
          title: t('analytics.title'),
          cols: {
            event:   t('analytics.table.event'),
            trigger: toPlainText(t('analytics.table.trigger')),
            payload: t('analytics.table.payload'),
          },
          items: [
            {
              event:   t('analytics.table.itemSelect'),
              trigger: toPlainText(t('analytics.table.itemSelectTrigger')),
              payload: t('analytics.table.itemSelectPayload'),
            },
            {
              event:   t('analytics.table.paletteOpen'),
              trigger: toPlainText(t('analytics.table.paletteOpenTrigger')),
              payload: t('analytics.table.paletteOpenPayload'),
            },
            {
              event:   t('analytics.table.pageView'),
              trigger: toPlainText(t('analytics.table.pageViewTrigger')),
              payload: t('analytics.table.pageViewPayload'),
            },
            {
              event:   t('analytics.table.sectionViewed'),
              trigger: toPlainText(t('analytics.table.sectionViewedTrigger')),
              payload: t('analytics.table.sectionViewedPayload'),
            },
            {
              event:   t('analytics.table.langSwitch'),
              trigger: toPlainText(t('analytics.table.langSwitchTrigger')),
              payload: t('analytics.table.langSwitchPayload'),
            },
          ],
        });

      // ─── 14. Testes ────────────────────────────────────────────────────
      case 'testes': {
        return createDocsTestes({
          title: t('testes.title'),
          functional: {
            title: t('testes.functional.title'),
            cols: {
              action:   tNav('common.userAction'),
              result:   tNav('common.expectedResult'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4, 5, 6].map(i => ({
              action:   t(`testes.functional.item${i}.action`),
              result:   t(`testes.functional.item${i}.result`),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            cols: {
              criterion: tNav('common.criterion'),
              level:     'WCAG',
              how:       tNav('common.howToVerify'),
            },
            items: [1, 2, 3, 4].map(i => ({
              criterion: t(`testes.accessibility.item${i}`),
              level:     'AA',
              how:       'axe-core / manual',
            })),
          },
          visual: {
            title: t('testes.visual.title'),
            cols: {
              story:    tNav('common.storyState'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4].map(i => ({
              story:    t(`testes.visual.item${i}.story`),
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
        component_name: 'command',
        locale: getLocale(),
      }),
    );
  }
  cleanups.push(() => activeSectionObserver?.disconnect());

  // ── Initial render ────────────────────────────────────────────────────────

  renderHeader();
  buildSidebar();
  renderAllSections();

  cleanups.push(
    subscribe(() => {
      renderHeader();
      buildSidebar();
      renderAllSections();
    })
  );
  cleanups.push(
    onLocaleChange(() => {
      renderHeader();
      buildSidebar();
      renderAllSections();
    })
  );

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
