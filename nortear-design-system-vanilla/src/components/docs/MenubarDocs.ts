import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import DOMPurify from 'dompurify';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import {
  createMenubar,
  type MenubarCloseReason,
  type MenubarItem,
  type MenubarMenu,
} from '@/components/ui/menubar';
import { menubarSnippet, type MenubarItemSnippet } from '@/components/ui/menubar.source';
import uiTranslations from '@/i18n/ui.json';
import menubarTranslations from '@shared/content/menubar/translations.json';

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
// valores chegam ao container — o `t()` exige nome de chave e não serviria. O
// `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
function screenReaderItems(): string[] {
  const locale = getLocale();
  return Object.entries(
    (menubarTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  )
    .filter(([k]) => k !== 'title')
    .map(([, v]) => v);
}
// Opções que só esta stack tem.
//
// A lista de menus, os avisos POR MENU (`onOpenChange`/`onClose` em cada
// `MenubarMenu`), o `onClick` da opção de escolha única e o `defaultOpen` por
// índice são a API da FÁBRICA — as outras stacks compõem peças e não têm linha
// para elas no conteúdo compartilhado. Ficam no override, nos três idiomas, como
// no ContextMenu desta stack: presas em pt-BR na tabela, apareciam em português
// nas versões en e es da página.
const { t, subscribe } = createTranslation(menubarTranslations as Record<string, unknown>, {
  'pt-BR': {
    'props.factory.menus': 'Lista de menus: o rótulo do gatilho, os itens e os avisos de abrir e fechar de cada um.',
    'props.factory.class': 'Classes adicionais na raiz da barra.',
    'props.factory.defaultOpenIndex': 'Aqui é o índice do menu na lista.',
    'props.factory.menuOnOpenChange': 'Avisado quando este menu abre ou fecha. É por menu: trocar de menu com a barra aberta avisa o que fecha antes do que abre.',
    'props.factory.menuOnClose': 'Motivo do fechamento do menu, uma vez por fechamento e antes do callback de mudança: escape, overlay (clique fora, Tab, clique no gatilho aberto ou passagem ao menu vizinho) ou api (item escolhido). Sair da página não é fechamento e não dispara.',
    'props.factory.radioOptionOnClick': 'Avisado a cada escolha da opção, pelo ponteiro ou por Enter/Espaço — também quando ela já era a escolhida. A mudança de valor é o callback de mudança do grupo.',
  },
  en: {
    'props.factory.menus': 'List of menus: the trigger label, the items and the open and close callbacks of each one.',
    'props.factory.class': 'Additional classes on the bar root.',
    'props.factory.defaultOpenIndex': 'Here it is the index of the menu in the list.',
    'props.factory.menuOnOpenChange': 'Called when this menu opens or closes. It is per menu: switching menus with the bar open notifies the one closing before the one opening.',
    'props.factory.menuOnClose': 'Close reason of the menu, once per close and before the change callback: escape, overlay (click outside, Tab, click on the open trigger or moving to the next menu) or api (item chosen). Leaving the page is not a close and does not fire it.',
    'props.factory.radioOptionOnClick': 'Called on every choice of the option, by pointer or by Enter/Space — also when it was already the chosen one. The value change is the group change callback.',
  },
  es: {
    'props.factory.menus': 'Lista de menús: el rótulo del disparador, los ítems y los avisos de apertura y cierre de cada uno.',
    'props.factory.class': 'Clases adicionales en la raíz de la barra.',
    'props.factory.defaultOpenIndex': 'Aquí es el índice del menú en la lista.',
    'props.factory.menuOnOpenChange': 'Se avisa cuando este menú se abre o se cierra. Es por menú: cambiar de menú con la barra abierta avisa al que se cierra antes que al que se abre.',
    'props.factory.menuOnClose': 'Motivo del cierre del menú, una vez por cierre y antes del callback de cambio: escape, overlay (clic fuera, Tab, clic en el disparador abierto o paso al menú vecino) o api (ítem elegido). Salir de la página no es un cierre y no lo dispara.',
    'props.factory.radioOptionOnClick': 'Se avisa en cada elección de la opción, con el puntero o con Enter/Espacio — también cuando ya era la elegida. El cambio de valor es el callback de cambio del grupo.',
  },
});

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
 * Varre `base.item1`, `base.item2`, … enquanto existirem no conteúdo.
 *
 * As listas de `testes.*` estavam cravadas em nove critérios funcionais e sete
 * de acessibilidade, com dezesseis e oito no conteúdo: sete critérios — o Tab
 * que sai da barra, o clique fora, o rádio que não fecha, o atalho — não
 * existiam para quem lia esta página, e nada avisava.
 */
function stringsFromDict(
  translate: (key: string, defaultValue?: string) => string,
  base: string,
): string[] {
  const out: string[] = [];
  for (let i = 1; ; i++) {
    const value = translate(`${base}.item${i}`, '');
    if (!value) break;
    out.push(value);
  }
  return out;
}

/**
 * A mesma varredura para a lista cujo item é um OBJETO — critério funcional,
 * story de regressão visual. O primeiro campo é quem decide se o item existe, e
 * os demais acompanham.
 */
function entriesFromDict<K extends string>(
  translate: (key: string, defaultValue?: string) => string,
  base: string,
  fields: readonly K[],
): Array<Record<K, string>> {
  const out: Array<Record<K, string>> = [];
  for (let i = 1; ; i++) {
    if (!translate(`${base}.item${i}.${fields[0]}`, '')) break;
    out.push(
      Object.fromEntries(
        fields.map(field => [field, translate(`${base}.item${i}.${field}`, '')]),
      ) as Record<K, string>,
    );
  }
  return out;
}

// ─── Rótulos das prévias ──────────────────────────────────────────────────────
//
// Cada rótulo pela CHAVE LITERAL do conteúdo compartilhado — é ela que faz as
// cinco stacks mostrarem o mesmo menu nos três idiomas, e é pela chave escrita
// por inteiro que o `demonstration_labels_divergent` enxerga o conjunto. Até
// 2026-09-11 esta página não usava chave nenhuma: tudo era literal em português,
// e em inglês a barra continuava dizendo "Arquivo".
//
// Função, e não valor: o rótulo é lido no idioma do MOMENTO em que a prévia é
// montada. E a CHAVE é também o id estável dos eventos, em kebab: `showRuler`
// vira `show-ruler` no `label` do `menubar_item_select`, `file` vira o sufixo
// do `menu` numa barra de vários menus.

const LABELS = {
  file: () => t('demonstration.labels.file'),
  edit: () => t('demonstration.labels.edit'),
  view: () => t('demonstration.labels.view'),
  tools: () => t('demonstration.labels.tools'),
  help: () => t('demonstration.labels.help'),
  theme: () => t('demonstration.labels.theme'),
  menu: () => t('demonstration.labels.menu'),
  new: () => t('demonstration.labels.new'),
  open: () => t('demonstration.labels.open'),
  save: () => t('demonstration.labels.save'),
  export: () => t('demonstration.labels.export'),
  format: () => t('demonstration.labels.format'),
  pdf: () => t('demonstration.labels.pdf'),
  csv: () => t('demonstration.labels.csv'),
  quit: () => t('demonstration.labels.quit'),
  undo: () => t('demonstration.labels.undo'),
  redo: () => t('demonstration.labels.redo'),
  cut: () => t('demonstration.labels.cut'),
  copy: () => t('demonstration.labels.copy'),
  paste: () => t('demonstration.labels.paste'),
  appearance: () => t('demonstration.labels.appearance'),
  darkMode: () => t('demonstration.labels.darkMode'),
  showRuler: () => t('demonstration.labels.showRuler'),
  fullScreen: () => t('demonstration.labels.fullScreen'),
  find: () => t('demonstration.labels.find'),
  replace: () => t('demonstration.labels.replace'),
  lightTheme: () => t('demonstration.labels.lightTheme'),
  darkTheme: () => t('demonstration.labels.darkTheme'),
  systemTheme: () => t('demonstration.labels.systemTheme'),
  zoom: () => t('demonstration.labels.zoom'),
  singleAction: () => t('demonstration.labels.singleAction'),
  deleteFile: () => t('demonstration.labels.deleteFile'),
  panels: () => t('demonstration.labels.panels'),
  sidebar: () => t('demonstration.labels.sidebar'),
  grid: () => t('demonstration.labels.grid'),
  ruler: () => t('demonstration.labels.ruler'),
  light: () => t('demonstration.labels.light'),
  dark: () => t('demonstration.labels.dark'),
  system: () => t('demonstration.labels.system'),
  documentation: () => t('demonstration.labels.documentation'),
  about: () => t('demonstration.labels.about'),
  newShortcut: () => t('demonstration.labels.newShortcut'),
  openShortcut: () => t('demonstration.labels.openShortcut'),
  saveShortcut: () => t('demonstration.labels.saveShortcut'),
  quitShortcut: () => t('demonstration.labels.quitShortcut'),
  undoShortcut: () => t('demonstration.labels.undoShortcut'),
  redoShortcut: () => t('demonstration.labels.redoShortcut'),
  cutShortcut: () => t('demonstration.labels.cutShortcut'),
  copyShortcut: () => t('demonstration.labels.copyShortcut'),
  pasteShortcut: () => t('demonstration.labels.pasteShortcut'),
  fullScreenShortcut: () => t('demonstration.labels.fullScreenShortcut'),
  findShortcut: () => t('demonstration.labels.findShortcut'),
  replaceShortcut: () => t('demonstration.labels.replaceShortcut'),
} as const;

type LabelKey = keyof typeof LABELS;

/** A chave em kebab — o id estável dos eventos (`showRuler` → `show-ruler`). */
function kebab(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

// ─── Descrição das barras ─────────────────────────────────────────────────────
//
// Cada prévia é descrita UMA vez, por chave, e a mesma descrição monta a barra
// viva e imprime o código do cartão (`menubarSnippet`). Até 2026-09-11 o código
// de três cartões ensinava a montar item à mão sobre o painel ("o factory Nortear
// não tem CheckboxItem"), quando a fábrica já tinha os seis tipos de item — e a
// prévia do lado mostrava `✓` e `●` em texto, sem papel nem estado.

type ItemSpec =
  | { type: 'item'; key: LabelKey; shortcut?: LabelKey; variant?: 'destructive' }
  | { type: 'separator' }
  | { type: 'label'; key: LabelKey }
  | { type: 'checkbox'; key: LabelKey; checked?: boolean }
  | { type: 'radio-group'; options: LabelKey[]; value: LabelKey }
  | { type: 'submenu'; key: LabelKey; items: ItemSpec[] };

/** Um menu da barra: a chave do gatilho e os itens. */
type MenuSpec = { trigger: LabelKey; items: ItemSpec[] };

const item = (key: LabelKey, shortcut?: LabelKey, variant?: 'destructive'): ItemSpec =>
  ({ type: 'item', key, shortcut, variant });
const SEPARATOR: ItemSpec = { type: 'separator' };
const groupLabel = (key: LabelKey): ItemSpec => ({ type: 'label', key });
const checkbox = (key: LabelKey, checked = false): ItemSpec => ({ type: 'checkbox', key, checked });
const radioGroup = (options: LabelKey[], value: LabelKey): ItemSpec =>
  ({ type: 'radio-group', options, value });
const submenu = (key: LabelKey, items: ItemSpec[]): ItemSpec => ({ type: 'submenu', key, items });

/**
 * Os itens da fábrica, com a escolha rastreada. `select` recebe o id do item —
 * a chave em kebab —, e o rádio manda o valor da opção, que é a mesma chave.
 * Marcar e escolher rádio também escolhem, mas não fecham o menu: o fechamento
 * seguinte leva o motivo de quem de fato fechou.
 *
 * O rádio rastreia pelo `onClick` da OPÇÃO, e não pelo `onValueChange` do
 * grupo: este não dispara quando a opção escolhida já era a marcada, e o
 * `menubar_item_select` sumia justo no gesto de confirmar — o dropdown e o menu
 * de contexto mandam o evento a cada escolha.
 */
function toMenubarItems(specs: ItemSpec[], select: (label: string) => void): MenubarItem[] {
  return specs.map((spec): MenubarItem => {
    switch (spec.type) {
      case 'separator':
        return { type: 'separator' };
      case 'label':
        return { type: 'label', label: LABELS[spec.key]() };
      case 'checkbox':
        return {
          type: 'checkbox',
          label: LABELS[spec.key](),
          checked: spec.checked,
          onCheckedChange: () => select(kebab(spec.key)),
        };
      case 'radio-group':
        return {
          type: 'radio-group',
          value: kebab(spec.value),
          options: spec.options.map((key) => ({
            value: kebab(key),
            label: LABELS[key](),
            onClick: () => select(kebab(key)),
          })),
        };
      case 'submenu':
        return { type: 'submenu', label: LABELS[spec.key](), items: toMenubarItems(spec.items, select) };
      case 'item':
        return {
          label: LABELS[spec.key](),
          shortcut: spec.shortcut ? LABELS[spec.shortcut]() : undefined,
          variant: spec.variant,
          onClick: () => select(kebab(spec.key)),
        };
    }
  });
}

/** A mesma descrição no formato do snippet — sem os callbacks de rastreio. */
function toSnippetItems(specs: ItemSpec[]): MenubarItemSnippet[] {
  return specs.map((spec): MenubarItemSnippet => {
    switch (spec.type) {
      case 'separator':
        return { type: 'separator' };
      case 'label':
        return { type: 'label', label: LABELS[spec.key]() };
      case 'checkbox':
        return { type: 'checkbox', label: LABELS[spec.key](), checked: spec.checked };
      case 'radio-group':
        return {
          type: 'radio-group',
          value: kebab(spec.value),
          options: spec.options.map((key) => ({ value: kebab(key), label: LABELS[key]() })),
        };
      case 'submenu':
        return { type: 'submenu', label: LABELS[spec.key](), items: toSnippetItems(spec.items) };
      case 'item':
        return {
          label: LABELS[spec.key](),
          shortcut: spec.shortcut ? LABELS[spec.shortcut]() : undefined,
          variant: spec.variant,
        };
    }
  });
}

// ─── Rastreamento das barras vivas ────────────────────────────────────────────

/**
 * Onde cada prévia viva mora — o `location` dos três eventos é a SEÇÃO da
 * página onde a barra está (guideline 07). Vem sempre de quem CHAMA.
 */
type PreviewLocation = 'docs_demo' | 'docs_variantes' | 'docs_do_dont';

/**
 * Uma barra VIVA, com os três eventos da família em cada menu.
 *
 * Até 2026-09-11 esta página não rastreava nada: a fábrica não avisava abrir
 * nem fechar, e o conteúdo documentava `menubar_open`, `menubar_close` e
 * `menubar_item_select` que nenhuma prévia disparava. O `menu` de cada evento é
 * o id da prévia; numa barra de VÁRIOS menus, o id da prévia mais a chave do
 * gatilho em kebab (`demo-file`, `pair1-do-edit`) — sem o sufixo, os quatro
 * menus da demonstração seriam o mesmo menu no GA4.
 */
function buildBar(preview: string, menus: MenuSpec[], location: PreviewLocation): HTMLElement {
  return createMenubar(
    menus.map((spec): MenubarMenu => {
      const menu = menus.length > 1 ? `${preview}-${kebab(spec.trigger)}` : preview;
      return {
        label: LABELS[spec.trigger](),
        items: toMenubarItems(spec.items, (label) => {
          track('menubar_item_select', { component: 'menubar', menu, label, location });
        }),
        onOpenChange: (open) => {
          if (open) track('menubar_open', { component: 'menubar', menu, location });
        },
        onClose: (reason: MenubarCloseReason) => {
          track('menubar_close', { component: 'menubar', menu, reason, location });
        },
      };
    }),
  );
}

/** O código do cartão, da mesma descrição que montou a prévia. */
function barCode(menus: MenuSpec[]): string {
  return menubarSnippet({
    menus: menus.map((spec) => ({ label: LABELS[spec.trigger](), items: toSnippetItems(spec.items) })),
  });
}

/**
 * Moldura de prévia: a barra no alto e o espaço do painel aberto reservado
 * embaixo. O painel de topo é ancorado por CSS dentro da barra, e `contain`
 * segura o reflow; o recheio vem de classe (`nds-p-2`), não de `style`.
 */
function frame(child: HTMLElement, minHeightClass?: string): HTMLElement {
  const wrap = document.createElement('div');
  // Mecânica de layout, não valor de design.
  wrap.style.contain = 'layout';
  wrap.className = ['nds-cluster nds-w-full nds-p-2', minHeightClass].filter(Boolean).join(' ');
  wrap.dataset.align = 'start';
  wrap.dataset.justify = 'center';
  wrap.appendChild(child);
  return wrap;
}

// ─── As barras de cada seção ──────────────────────────────────────────────────

/** A demonstração: UMA barra, quatro menus, com os seis tipos de item. */
function demoMenus(): MenuSpec[] {
  return [
    {
      trigger: 'file',
      items: [
        item('new', 'newShortcut'),
        item('open', 'openShortcut'),
        item('save', 'saveShortcut'),
        SEPARATOR,
        submenu('export', [item('pdf'), item('csv')]),
        SEPARATOR,
        item('quit', 'quitShortcut'),
      ],
    },
    {
      trigger: 'edit',
      items: [
        item('undo', 'undoShortcut'),
        item('redo', 'redoShortcut'),
        SEPARATOR,
        item('cut', 'cutShortcut'),
        item('copy', 'copyShortcut'),
        item('paste', 'pasteShortcut'),
      ],
    },
    {
      trigger: 'view',
      items: [
        groupLabel('appearance'),
        checkbox('darkMode'),
        checkbox('showRuler', true),
        SEPARATOR,
        item('fullScreen', 'fullScreenShortcut'),
      ],
    },
    {
      trigger: 'tools',
      items: [
        item('find', 'findShortcut'),
        item('replace', 'replaceShortcut'),
        SEPARATOR,
        radioGroup(['lightTheme', 'darkTheme', 'systemTheme'], 'systemTheme'),
      ],
    },
  ];
}

/**
 * Os seis cartões de Variantes, pela CHAVE do conteúdo. A chave em kebab é o
 * `menu` dos eventos; no `editorComplete`, que tem quatro menus, soma-se a
 * chave de cada gatilho.
 */
type VariantKey =
  | 'default'
  | 'destructive'
  | 'withShortcuts'
  | 'withCheckbox'
  | 'withRadio'
  | 'editorComplete';

function variantMenus(key: VariantKey): MenuSpec[] {
  switch (key) {
    case 'default':
      return [{ trigger: 'file', items: [item('new', 'newShortcut'), item('save', 'saveShortcut')] }];
    case 'destructive':
      // A variante destrutiva é TIPO de item da fábrica (`variant`). O cartão
      // mostrava um `<div role="menu">` solto com um item estático, e o código
      // ao lado ensinava a montá-lo à mão "porque o factory não tem variant".
      return [{ trigger: 'file', items: [item('save'), SEPARATOR, item('deleteFile', undefined, 'destructive')] }];
    case 'withShortcuts':
      return [
        {
          trigger: 'edit',
          items: [
            item('undo', 'undoShortcut'),
            item('redo', 'redoShortcut'),
            SEPARATOR,
            item('copy', 'copyShortcut'),
            item('paste', 'pasteShortcut'),
          ],
        },
      ];
    case 'withCheckbox':
      return [
        {
          trigger: 'view',
          items: [groupLabel('panels'), checkbox('sidebar', true), checkbox('grid'), checkbox('ruler')],
        },
      ];
    case 'withRadio':
      return [
        {
          trigger: 'theme',
          items: [groupLabel('appearance'), radioGroup(['light', 'dark', 'system'], 'dark')],
        },
      ];
    case 'editorComplete':
      return [
        {
          trigger: 'file',
          items: [
            item('new', 'newShortcut'),
            item('open', 'openShortcut'),
            item('save', 'saveShortcut'),
            SEPARATOR,
            item('quit', 'quitShortcut'),
          ],
        },
        { trigger: 'edit', items: [item('undo', 'undoShortcut'), item('redo', 'redoShortcut')] },
        {
          trigger: 'view',
          items: [
            groupLabel('appearance'),
            item('darkMode'),
            SEPARATOR,
            item('fullScreen', 'fullScreenShortcut'),
          ],
        },
        { trigger: 'help', items: [item('documentation'), item('about')] },
      ];
  }
}

/**
 * A prévia de um cartão. A seção vem de quem CHAMA, mesmo que hoje só
 * Variantes chame: o valor cravado aqui dentro era a forma exata que o portão
 * `location_so_da_demo` condena — o helper decidindo de onde o clique veio.
 */
function variantPreview(
  key: VariantKey,
  location: PreviewLocation,
  minHeightClass = 'nds-min-h-60',
): HTMLElement {
  return frame(buildBar(kebab(key), variantMenus(key), location), minHeightClass);
}

// ─── createMenubarDocs ────────────────────────────────────────────────────────

export function createMenubarDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────
  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'menubar',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/navigation' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'menubar',
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
      { id: 'importacao',   labelKey: 'nav.import'        },
      { id: 'variantes',    labelKey: 'nav.variants'      },
      { id: 'estados',      labelKey: 'nav.states'        },
      { id: 'propriedades', labelKey: 'nav.props'         },
      { id: 'tokens',       labelKey: 'nav.tokens'        },
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
          demoFactory: () => frame(buildBar('demo', demoMenus(), 'docs_demo'), 'nds-min-h-50'),
        });

      case 'anatomia':
        return createDocsAnatomy({
          items: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => DOMPurify.sanitize(t(`anatomy.item${i}`))),
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      case 'quando-usar':
        return createDocsWhenToUse({
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [1, 2, 3, 4, 5].map(i => DOMPurify.sanitize(t(`usage.guidelines.item${i}`))),
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
            items: ['trigger', 'item', 'shortcut', 'destructive'].map(key => ({
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
            items: [1, 2, 3, 4].map(i => t(`usage.dont.item${i}`)),
          },
        });

      // Os quatro lados são barras VIVAS. O "evite" do par 2 era um parágrafo
      // em português cravado — "não-suportado pelo factory Nortear" —, porque a
      // fábrica não aninhava submenu em submenu. Aninha desde 2026-09-11 (a pilha
      // de níveis de `@/lib/submenu`), e o exemplo passa a mostrar o que a
      // legenda condena: dois níveis de submenu até chegar ao PDF.
      case 'do-dont':
        return createDocsDoDont({
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair1.do')),
              dontCaption: toPlainText(t('doDont.pair1.dont')),
              // TRÊS itens por menu: o lado "faça" não pode contrariar a regra
              // da própria página (`usage.guidelines.item3` pede de 3 a 10), e
              // com um item só cada menu era o mesmo defeito do lado "evite".
              // "Mostrar régua" entra como item de AÇÃO, não de marcação — o
              // assunto do par é a organização em categorias, e o texto do
              // conteúdo é o que decide.
              doPreviewFactory: () =>
                frame(
                  buildBar(
                    'pair1-do',
                    [
                      { trigger: 'file', items: [item('new'), item('open'), item('save')] },
                      { trigger: 'edit', items: [item('undo'), item('copy'), item('paste')] },
                      { trigger: 'view', items: [item('zoom'), item('fullScreen'), item('showRuler')] },
                    ],
                    'docs_do_dont',
                  ),
                  'nds-min-h-40',
                ),
              dontPreviewFactory: () =>
                frame(
                  buildBar('pair1-dont', [{ trigger: 'menu', items: [item('singleAction')] }], 'docs_do_dont'),
                ),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: () =>
                frame(
                  buildBar(
                    'pair2-do',
                    [{ trigger: 'file', items: [item('save', 'saveShortcut'), item('open', 'openShortcut')] }],
                    'docs_do_dont',
                  ),
                ),
              dontPreviewFactory: () =>
                frame(
                  buildBar(
                    'pair2-dont',
                    [{ trigger: 'file', items: [submenu('export', [submenu('format', [item('pdf')])])] }],
                    'docs_do_dont',
                  ),
                ),
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          code: `import { createMenubar } from '@/components/ui/menubar';`,
        });

      // Seis cartões, e cada um é a barra VIVA: prévia e código saem da mesma
      // descrição (`variantMenus`). O `trackId` é a CHAVE do conteúdo — o
      // `snippet_id` do toggle de código e, em kebab, o `menu` dos eventos.
      case 'variantes':
        return createDocsCompositions({
          id: 'variantes',
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'menubar',
          items: [
            {
              trackId: 'default',
              name: t('variants.items.default'),
              description: stripHtml(t('variants.styles.default')),
              code: barCode(variantMenus('default')),
              previewFactory: () => variantPreview('default', 'docs_variantes', 'nds-min-h-40'),
            },
            {
              trackId: 'destructive',
              name: t('variants.items.destructive'),
              description: stripHtml(t('variants.styles.destructive')),
              code: barCode(variantMenus('destructive')),
              previewFactory: () => variantPreview('destructive', 'docs_variantes', 'nds-min-h-40'),
            },
            {
              name: stripHtml(t('variants.items.withShortcuts.name')),
              trackId: 'withShortcuts',
              description: stripHtml(t('variants.items.withShortcuts.description')),
              useWhen: stripHtml(t('variants.items.withShortcuts.use')),
              code: barCode(variantMenus('withShortcuts')),
              previewFactory: () => variantPreview('withShortcuts', 'docs_variantes'),
            },
            {
              name: stripHtml(t('variants.items.withCheckbox.name')),
              trackId: 'withCheckbox',
              description: stripHtml(t('variants.items.withCheckbox.description')),
              useWhen: stripHtml(t('variants.items.withCheckbox.use')),
              code: barCode(variantMenus('withCheckbox')),
              previewFactory: () => variantPreview('withCheckbox', 'docs_variantes'),
            },
            {
              name: stripHtml(t('variants.items.withRadio.name')),
              trackId: 'withRadio',
              description: stripHtml(t('variants.items.withRadio.description')),
              useWhen: stripHtml(t('variants.items.withRadio.use')),
              code: barCode(variantMenus('withRadio')),
              previewFactory: () => variantPreview('withRadio', 'docs_variantes'),
            },
            {
              name: stripHtml(t('variants.items.editorComplete.name')),
              trackId: 'editorComplete',
              description: stripHtml(t('variants.items.editorComplete.description')),
              useWhen: stripHtml(t('variants.items.editorComplete.use')),
              code: barCode(variantMenus('editorComplete')),
              previewFactory: () => variantPreview('editorComplete', 'docs_variantes'),
            },
          ],
        });

      case 'estados':
        return createDocsStates({
          cols: {
            state: t('states.cols.state'),
            trigger: toPlainText(t('states.cols.trigger')),
            behavior: toPlainText(t('states.cols.behavior')),
          },
          items: [
            { label: t('states.closed.label'),   trigger: toPlainText(t('states.closed.trigger')),   behavior: toPlainText(t('states.closed.behavior')) },
            { label: t('states.open.label'),     trigger: toPlainText(t('states.open.trigger')),     behavior: toPlainText(t('states.open.behavior')) },
            { label: t('states.disabled.label'), trigger: toPlainText(t('states.disabled.trigger')), behavior: toPlainText(t('states.disabled.behavior')) },
            { label: t('states.checked.label'),  trigger: toPlainText(t('states.checked.trigger')),  behavior: toPlainText(t('states.checked.behavior')) },
          ],
        });

      // A interface e a tabela descrevem a fábrica COMO ELA É. As duas diziam
      // que ela não tinha `variant`, marcação, submenu, `loop` nem `side` — ela
      // tinha os cinco, e a tabela ensinava a contornar o que não faltava.
      case 'propriedades': {
        const interfaceCode = `// createMenubar(menus, options?)
export type MenubarItemType =
  | 'item' | 'separator' | 'label' | 'checkbox' | 'radio-group' | 'submenu';

export type MenubarItem = {
  type?: MenubarItemType;
  label?: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'destructive';
  inset?: boolean;
  checked?: boolean;                        // checkbox
  indeterminate?: boolean;                  // checkbox
  onCheckedChange?: (checked: boolean) => void;
  options?: MenubarRadioOption[];           // radio-group
  value?: string;                           // radio-group
  onValueChange?: (value: string) => void;  // radio-group
  items?: MenubarItem[];                    // submenu
};

export type MenubarRadioOption = {
  value: string;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
};

export type MenubarCloseReason = 'escape' | 'overlay' | 'api';

export type MenubarMenu = {
  label: string;
  items: MenubarItem[];
  onOpenChange?: (open: boolean) => void;
  onClose?: (reason: MenubarCloseReason) => void;
};

export function createMenubar(
  menus: MenubarMenu[],
  options?: {
    class?: string;
    loop?: boolean;                               // true
    defaultOpen?: number;
    side?: 'top' | 'bottom' | 'left' | 'right';   // 'bottom'
    align?: 'start' | 'center' | 'end';           // 'start'
  },
): DestroyableElement;`;

        const propsCols = {
          prop: t('props.table.prop'),
          type: t('props.table.type'),
          default: t('props.table.default'),
          required: t('props.table.required'),
          description: t('props.table.description'),
        };

        // "Sim"/"Não" do vocabulário comum da página, e toda descrição de
        // `t()`: as genéricas do conteúdo compartilhado, e as que só esta
        // fábrica tem do override no topo do arquivo. A tabela saía em
        // português nos três idiomas.
        const yes = tNav('common.yes');
        const no = tNav('common.no');

        return createDocsProps({
          tables: [
            {
              title: 'createMenubar(menus, options?)',
              cols: propsCols,
              items: [
                { name: 'menus',                type: 'MenubarMenu[]',                       defaultValue: '—',        required: yes, description: toPlainText(t('props.factory.menus')) },
                { name: 'options.class',        type: 'string',                              defaultValue: '—',        required: no,  description: toPlainText(t('props.factory.class')) },
                { name: 'options.loop',         type: 'boolean',                             defaultValue: 'true',     required: no,  description: toPlainText(t('props.table.loop.description')) },
                { name: 'options.defaultOpen',  type: 'number',                              defaultValue: '—',        required: no,  description: `${toPlainText(t('props.table.defaultValue.description'))} ${toPlainText(t('props.factory.defaultOpenIndex'))}` },
                { name: 'options.side',         type: "'top' | 'bottom' | 'left' | 'right'", defaultValue: "'bottom'", required: no,  description: toPlainText(t('props.table.side.description')) },
                { name: 'options.align',        type: "'start' | 'center' | 'end'",          defaultValue: "'start'",  required: no,  description: toPlainText(t('props.table.align.description')) },
                { name: 'MenubarMenu.onOpenChange', type: '(open: boolean) => void',         defaultValue: '—',        required: no,  description: toPlainText(t('props.factory.menuOnOpenChange')) },
                { name: 'MenubarMenu.onClose',  type: "(reason: 'escape' | 'overlay' | 'api') => void", defaultValue: '—', required: no, description: toPlainText(t('props.factory.menuOnClose')) },
                { name: 'MenubarRadioOption.onClick', type: '() => void',                    defaultValue: '—',        required: no,  description: toPlainText(t('props.factory.radioOptionOnClick')) },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityCode: t('props.extensibilityCode'),
        });
      }

      case 'tokens':
        return createDocsTokens({
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--background',         value: t('tokens.table.menubarBg.class'),     description: t('tokens.table.menubarBg.part')     },
            { token: '--border',             value: t('tokens.table.menubarBorder.class'), description: t('tokens.table.menubarBorder.part') },
            { token: '--accent',             value: t('tokens.table.triggerHover.class'),  description: t('tokens.table.triggerHover.part')  },
            { token: '--accent-foreground',  value: t('tokens.table.triggerText.class'),   description: t('tokens.table.triggerText.part')   },
            { token: '--radius-sm',          value: t('tokens.table.triggerRadius.class'), description: t('tokens.table.triggerRadius.part') },
            { token: '--elevation-xs',       value: t('tokens.table.elevation.class'),     description: t('tokens.table.elevation.part')     },
            { token: '--popover',            value: t('tokens.table.contentBg.class'),     description: t('tokens.table.contentBg.part')     },
            { token: '--border',             value: t('tokens.table.contentBorder.class'), description: t('tokens.table.contentBorder.part') },
            { token: '--radius',             value: t('tokens.table.rounded.class'),       description: t('tokens.table.rounded.part')       },
            { token: '--accent',             value: t('tokens.table.itemHover.class'),     description: t('tokens.table.itemHover.part')     },
            { token: '--destructive',        value: t('tokens.table.destructive.class'),   description: t('tokens.table.destructive.part')   },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode: t('tokens.customizationCode'),
        });

      case 'acessibilidade':
        return createDocsAccessibility({
          screenReaderTitle: tNav('common.screenReader'),
          screenReaderItems: screenReaderItems(),
          summary: t('accessibility.summary'),
          items: [1, 2, 3, 4, 5, 6].map(i => DOMPurify.sanitize(t(`accessibility.items.item${i}`))),
          keyboardTitle: t('accessibility.keyboard.title'),
          keyboardItems: [
            { key: 'Tab',         description: toPlainText(t('accessibility.keyboard.tab'))              },
            { key: 'Arrow Left / Arrow Right',       description: toPlainText(t('accessibility.keyboard.arrowsHorizontal')) },
            { key: 'Arrow Up / Arrow Down',       description: toPlainText(t('accessibility.keyboard.arrowsVertical'))   },
            { key: 'Enter/Space', description: toPlainText(t('accessibility.keyboard.enter'))            },
            { key: 'Esc',         description: toPlainText(t('accessibility.keyboard.escape'))           },
            { key: 'Home/End',    description: toPlainText(t('accessibility.keyboard.homeEnd'))          },
            { key: 'A–Z',         description: toPlainText(t('accessibility.keyboard.typeahead'))        },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          items: [
            { name: t('related.items.navigationMenu.name'), description: toPlainText(t('related.items.navigationMenu.description')), path: '?path=/docs/components-navigation-navigationmenu--docs' },
            { name: t('related.items.dropdownMenu.name'),   description: toPlainText(t('related.items.dropdownMenu.description')),   path: '?path=/docs/components-overlay-dropdownmenu--docs'   },
            { name: t('related.items.sidebar.name'),        description: toPlainText(t('related.items.sidebar.description')),        path: '?path=/docs/components-layout-sidebar--docs'        },
            { name: t('related.items.command.name'),        description: toPlainText(t('related.items.command.description')),        path: '?path=/docs/components-overlay-command--docs'        },
          ],
        });

      case 'notas':
        return createDocsNotes({
          items: [1, 2, 3, 4, 5, 6].map(i => ({ title: '', content: DOMPurify.sanitize(t(`notes.item${i}`)) })),
        });

      // A tabela sai do CONTEÚDO, como a do Context Menu. A cravada aqui ensinava
      // `menubar_menu_open` e `menubar_shortcut_invoke`, dois eventos que o tipo
      // nunca teve e que nenhuma prévia disparava.
      case 'analytics':
        return createDocsAnalytics({
          cols: {
            event:   t('analytics.table.event'),
            trigger: toPlainText(t('analytics.table.trigger')),
            payload: t('analytics.table.payload'),
          },
          items: [
            { event: t('analytics.table.menuOpen'),      trigger: toPlainText(t('analytics.table.menuOpenTrigger')),      payload: t('analytics.table.menuOpenPayload')      },
            { event: t('analytics.table.itemClick'),     trigger: toPlainText(t('analytics.table.itemClickTrigger')),     payload: t('analytics.table.itemClickPayload')     },
            { event: t('analytics.table.close'),         trigger: toPlainText(t('analytics.table.closeTrigger')),         payload: t('analytics.table.closePayload')         },
            { event: t('analytics.table.pageView'),      trigger: toPlainText(t('analytics.table.pageViewTrigger')),      payload: t('analytics.table.pageViewPayload')      },
            { event: t('analytics.table.sectionViewed'), trigger: toPlainText(t('analytics.table.sectionViewedTrigger')), payload: t('analytics.table.sectionViewedPayload') },
            { event: t('analytics.table.langSwitch'),    trigger: toPlainText(t('analytics.table.langSwitchTrigger')),    payload: t('analytics.table.langSwitchPayload')    },
          ],
        });

      case 'testes':
        return createDocsTestes({
          functional: {
            title: t('testes.functional.title'),
            cols: {
              action: tNav('common.userAction'),
              result: tNav('common.expectedResult'),
              priority: tNav('common.priority'),
            },
            items: entriesFromDict(t, 'testes.functional', ['action', 'result', 'priority'])
              .map(entry => ({ ...entry, priority: priorityLabel(entry.priority) })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            cols: {
              criterion: tNav('common.criterion'),
              level: 'WCAG',
              how: tNav('common.howToVerify'),
            },
            items: stringsFromDict(t, 'testes.accessibility').map(criterion => ({
              criterion,
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
            items: entriesFromDict(t, 'testes.visual', ['story', 'priority'])
              .map(entry => ({ ...entry, priority: priorityLabel(entry.priority) })),
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
        component_name: 'menubar',
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
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return root;
}
