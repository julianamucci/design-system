import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import DOMPurify from 'dompurify';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import {
  createDropdownMenu,
  type DropdownMenuCloseReason,
  type DropdownMenuItemDef,
  type DropdownMenuOptions,
} from '@/components/ui/dropdown-menu';
import {
  dropdownMenuSnippet,
  type DropdownMenuSnippetItem,
} from '@/components/ui/dropdown-menu.source';
import { createButton } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import dropdownMenuTranslations from '@shared/content/dropdown-menu/translations.json';

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
import { text } from '@/lib/story-source';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria. O
// `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
function screenReaderItems(): string[] {
  const locale = getLocale();
  return Object.entries(
    (dropdownMenuTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  )
    .filter(([k]) => k !== 'title')
    .map(([, v]) => v);
}
// Opções que só esta stack tem.
//
// `trigger`, `items`, `onClose`, `class` e `sideOffset` são a API da FÁBRICA —
// as outras stacks compõem peças e não têm linha para elas no conteúdo
// compartilhado —, e o mesmo vale para o que só a fábrica faz com `open`,
// `modal`, `side` e `align`. Ficam no override, nos três idiomas, como no
// ContextMenu desta stack: presas em pt-BR na tabela, apareciam em português
// nas versões en e es da página.
const { t, subscribe } = createTranslation(dropdownMenuTranslations as Record<string, unknown>, {
  'pt-BR': {
    'props.factory.trigger': 'Elemento que abre o menu ao receber clique.',
    'props.factory.items': 'Lista de itens, separadores, rótulos, alternadores, escolha única e submenus.',
    'props.factory.onClose': 'Motivo do fechamento, uma vez por fechamento e antes do callback de mudança: escape, overlay (clique fora, Tab ou clique no gatilho) ou api (item escolhido ou fechamento por código). Sair da página não é fechamento e não dispara.',
    'props.factory.class': 'Classes adicionais aplicadas ao painel.',
    'props.factory.sideOffset': 'Vão entre gatilho e menu, em px.',
    'props.factory.openControlled': 'Definida, o menu passa ao modo controlado: clique, Escape, Tab e clique fora só anunciam a intenção pelo callback de mudança, e quem move o menu é setOpen().',
    'props.factory.modalDetail': 'Com true, o clique de fora dispensa o menu sem chegar ao que está embaixo e a página não rola; com false, o clique também acerta o alvo.',
    'props.factory.sideMarkup': 'Sai no markup como data-side.',
    'props.factory.alignMarkup': 'Sai no markup como data-align.',
    'import.factoryOptions': 'Posição, modalidade e abertura por código:',
  },
  en: {
    'props.factory.trigger': 'Element that opens the menu when clicked.',
    'props.factory.items': 'List of items, separators, labels, toggles, single-choice items and submenus.',
    'props.factory.onClose': 'Close reason, once per close and before the change callback: escape, overlay (click outside, Tab or click on the trigger) or api (item chosen or close from code). Leaving the page is not a close and does not fire it.',
    'props.factory.class': 'Additional classes applied to the panel.',
    'props.factory.sideOffset': 'Gap between trigger and menu, in px.',
    'props.factory.openControlled': 'When set, the menu becomes controlled: click, Escape, Tab and click outside only announce the intent through the change callback, and setOpen() is what moves the menu.',
    'props.factory.modalDetail': 'With true, a click outside dismisses the menu without reaching what is underneath and the page does not scroll; with false, the click also hits its target.',
    'props.factory.sideMarkup': 'Shown in the markup as data-side.',
    'props.factory.alignMarkup': 'Shown in the markup as data-align.',
    'import.factoryOptions': 'Position, modality and opening from code:',
  },
  es: {
    'props.factory.trigger': 'Elemento que abre el menú al recibir un clic.',
    'props.factory.items': 'Lista de ítems, separadores, rótulos, alternadores, selección única y submenús.',
    'props.factory.onClose': 'Motivo del cierre, una vez por cierre y antes del callback de cambio: escape, overlay (clic fuera, Tab o clic en el disparador) o api (ítem elegido o cierre por código). Salir de la página no es un cierre y no lo dispara.',
    'props.factory.class': 'Clases adicionales aplicadas al panel.',
    'props.factory.sideOffset': 'Espacio entre el disparador y el menú, en px.',
    'props.factory.openControlled': 'Definida, el menú pasa al modo controlado: clic, Escape, Tab y clic fuera solo anuncian la intención por el callback de cambio, y quien mueve el menú es setOpen().',
    'props.factory.modalDetail': 'Con true, el clic fuera descarta el menú sin llegar a lo que está debajo y la página no se desplaza; con false, el clic también alcanza su destino.',
    'props.factory.sideMarkup': 'Aparece en el markup como data-side.',
    'props.factory.alignMarkup': 'Aparece en el markup como data-align.',
    'import.factoryOptions': 'Posición, modalidad y apertura por código:',
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
 * Contar à mão (`[1, 2, 3].map(...)`) trava a lista no tamanho de hoje: o
 * conteúdo compartilhado ganha um item e ele simplesmente não existe para quem
 * lê — sem erro, sem aviso, nos três idiomas de uma vez. Foi o que aconteceu com
 * o sétimo critério de acessibilidade deste componente, e de novo com os seis
 * critérios funcionais da família de menus (F9–F14), que a lista cravada em
 * oito escondia.
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

// ─── Rastreamento das prévias vivas ───────────────────────────────────────────

/**
 * Onde cada prévia viva mora — o `location` dos três eventos é a SEÇÃO da
 * página onde o menu está (guideline 07), nunca o texto dela. Vem sempre de
 * quem CHAMA: um valor fixo dentro do helper era o que fazia as prévias de
 * Variantes dizerem que vinham da demonstração.
 */
type PreviewLocation = 'docs_demo' | 'docs_variantes' | 'docs_do_dont';

/**
 * Pendura o `dropdown_menu_item_select` em cada item escolhível — ação,
 * marcação e rádio, dentro de submenu também. O `label` do evento é o `value`
 * do item, que é a chave de `demonstration.labels.*` em kebab (`column-email`,
 * `delete-account`): ESTÁVEL, enquanto o rótulo traduzido partiria o mesmo
 * evento em um valor por idioma no GA4.
 *
 * Marcar e escolher rádio também escolhem — o evento sai —, mas não fecham o
 * menu: o fechamento seguinte leva o motivo de quem de fato fechou.
 */
function withItemTracking(
  defs: DropdownMenuItemDef[],
  menu: string,
  location: PreviewLocation,
): DropdownMenuItemDef[] {
  return defs.map((def) => {
    const type = def.type ?? 'item';
    if (type === 'submenu') {
      return { ...def, items: withItemTracking(def.items ?? [], menu, location) };
    }
    if (type === 'radio-group') {
      // A escolha única rastreia pelo `onClick` da OPÇÃO, e não pelo
      // `onValueChange` do grupo: este não dispara quando a opção escolhida já
      // era a marcada, e o `dropdown_menu_item_select` sumiria justo no gesto
      // de confirmar. É a mesma leitura do Menubar.
      return {
        ...def,
        options: (def.options ?? []).map((option) => ({
          ...option,
          onClick: () => {
            option.onClick?.();
            track('dropdown_menu_item_select', {
              component: 'dropdown-menu',
              menu,
              label: option.value,
              location,
            });
          },
        })),
      };
    }
    if (type === 'separator' || type === 'label' || !def.value) return def;
    const label = def.value;
    return {
      ...def,
      onClick: () => {
        def.onClick?.();
        track('dropdown_menu_item_select', { component: 'dropdown-menu', menu, label, location });
      },
    };
  });
}

/**
 * A abertura e o fechamento de uma prévia VIVA, para espalhar nas opções da
 * fábrica.
 *
 * Toda prévia desta página rastreia — demonstração, Do & Don't e Variantes. Até
 * 2026-09-11 só a demonstração o fazia, com o `location` cravado nela, e o
 * cartão `default` de Variantes dizia que vinha da demonstração. `menu` é o id
 * estável da prévia (`demo-account`, `pair1-do`, `with-checkbox-items`), e o
 * fechamento leva o motivo que só a fábrica conhece: `escape`, `overlay`
 * (clique fora, Tab ou clique no gatilho) ou `api` (item escolhido).
 */
function menuTracking(
  menu: string,
  location: PreviewLocation,
): Pick<DropdownMenuOptions, 'onOpenChange' | 'onClose'> {
  return {
    onOpenChange: (open) => {
      if (open) track('dropdown_menu_open', { component: 'dropdown-menu', menu, location });
    },
    onClose: (reason: DropdownMenuCloseReason) => {
      track('dropdown_menu_close', { component: 'dropdown-menu', menu, reason, location });
    },
  };
}

// ─── Itens das prévias ────────────────────────────────────────────────────────
//
// Rótulo do conteúdo compartilhado, nunca literal — é ele que faz as cinco
// stacks mostrarem o mesmo menu nos três idiomas —, e `value` estável, que é o
// que o evento de escolha manda. Uma função por lista, e não uma constante,
// porque o rótulo é lido no idioma do MOMENTO em que a prévia é montada.

const SEPARATOR: DropdownMenuItemDef = { type: 'separator' };

/**
 * O menu de conta — a célula `basic` da demonstração e o cartão `default`.
 *
 * "Sair" é DESTRUTIVO: a anatomia compartilhada e as outras quatro stacks já o
 * marcavam, e esta, que é a referência, era a única que não.
 */
function accountItems(): DropdownMenuItemDef[] {
  return [
    // O rótulo nomeia o grupo que ele encabeça — e por isso diz de que bloco se
    // trata, não o que a seção da página está demonstrando. A legenda da célula
    // é quem diz o que se demonstra.
    { type: 'label', label: t('demonstration.labels.account') },
    { type: 'item', label: t('demonstration.labels.profile'), value: 'profile' },
    { type: 'item', label: t('demonstration.labels.settings'), value: 'settings' },
    SEPARATOR,
    { type: 'item', label: t('demonstration.labels.logout'), value: 'logout', variant: 'destructive' },
  ];
}

/** Dois grupos rotulados — o cartão `withLabel` e o lado "faça" do par 1. */
function groupedAccountItems(): DropdownMenuItemDef[] {
  return [
    { type: 'label', label: t('demonstration.labels.account') },
    { type: 'item', label: t('demonstration.labels.profile'), value: 'profile' },
    { type: 'item', label: t('demonstration.labels.settings'), value: 'settings' },
    SEPARATOR,
    { type: 'label', label: t('demonstration.labels.support') },
    { type: 'item', label: t('demonstration.labels.documentation'), value: 'documentation' },
    { type: 'item', label: t('demonstration.labels.logout'), value: 'logout' },
  ];
}

/** Alternadores independentes — `withCheckbox` e o cartão `withCheckboxItems`. */
function columnsItems(): DropdownMenuItemDef[] {
  return [
    { type: 'label', label: t('demonstration.labels.visibleColumns') },
    { type: 'checkbox', label: t('demonstration.labels.columnName'), value: 'column-name', checked: true },
    { type: 'checkbox', label: t('demonstration.labels.columnEmail'), value: 'column-email', checked: false },
    { type: 'checkbox', label: t('demonstration.labels.columnRole'), value: 'column-role', checked: false },
  ];
}

/** Escolha única — `withRadio` e o cartão `withRadioGroup`. */
function themeItems(): DropdownMenuItemDef[] {
  return [
    { type: 'label', label: t('demonstration.labels.appearance') },
    {
      // D16: a escolha única é UMA entrada, com as opções e o valor escolhido
      // dentro dela — e o rótulo acima nomeia esse bloco. Até 2026-09-18 eram
      // itens `radio` soltos amarrados por um `group`, e o grupo não tinha
      // nome porque não era um elemento.
      type: 'radio-group',
      value: 'light',
      options: [
        { value: 'light', label: t('demonstration.labels.light') },
        { value: 'dark', label: t('demonstration.labels.dark') },
        { value: 'system', label: t('demonstration.labels.system') },
      ],
    },
  ];
}

/** Hierarquia em dois níveis — o exemplo de `withSubmenu`. */
function fileItems(): DropdownMenuItemDef[] {
  return [
    { type: 'item', label: t('demonstration.labels.rename'), value: 'rename' },
    {
      // O sub-gatilho não tem ação própria: ele abre o painel filho, e é lá
      // que estão os itens que a pessoa veio escolher.
      type: 'submenu',
      label: t('demonstration.labels.export'),
      value: 'export',
      items: [
        { type: 'item', label: t('demonstration.labels.pdf'), value: 'pdf' },
        { type: 'item', label: t('demonstration.labels.csv'), value: 'csv' },
      ],
    },
  ];
}

/**
 * Renomear, separador e a ação irreversível. O par 2 do Do & Don't muda UMA
 * coisa entre os dois lados — a variante destrutiva —, e é disso que a legenda
 * fala.
 */
function renameDeleteItems(destructive: boolean): DropdownMenuItemDef[] {
  return [
    { type: 'item', label: t('demonstration.labels.rename'), value: 'rename' },
    SEPARATOR,
    {
      type: 'item',
      label: t('demonstration.labels.deleteAccount'),
      value: 'delete-account',
      variant: destructive ? 'destructive' : 'default',
    },
  ];
}

/**
 * Dez ações sem grupo — o lado "evite" do par 1. O número entra no código
 * porque o i18n não interpola; o id do item leva o mesmo número.
 */
function actionItems(): DropdownMenuItemDef[] {
  return Array.from({ length: 10 }, (_, i) => ({
    type: 'item' as const,
    label: `${t('demonstration.labels.action')} ${i + 1}`,
    value: `action-${i + 1}`,
  }));
}

/** Itens com atalho — o cartão `withShortcuts`. */
function shortcutItems(): DropdownMenuItemDef[] {
  return [
    { type: 'item', label: t('demonstration.labels.undo'), value: 'undo', shortcut: t('demonstration.labels.undoShortcut') },
    { type: 'item', label: t('demonstration.labels.copy'), value: 'copy', shortcut: t('demonstration.labels.copyShortcut') },
    SEPARATOR,
    { type: 'item', label: t('demonstration.labels.paste'), value: 'paste', shortcut: t('demonstration.labels.pasteShortcut') },
  ];
}

/**
 * Uma prévia VIVA: o componente de verdade, com gatilho, portal e teclado.
 *
 * Até 2026-09-11 cinco dos seis cartões de Variantes eram painéis ESTÁTICOS —
 * um `<ul role="menu">` desenhado à mão, sem gatilho, sem teclado e sem
 * evento —, que é imitação (guideline 08 §15): o cartão mostrava uma aparência
 * sem o mecanismo que a produz. A prévia agora abre como o componente abre.
 */
function buildMenuPreview(options: {
  trigger: string;
  items: DropdownMenuItemDef[];
  menu: string;
  location: PreviewLocation;
}): HTMLElement {
  return createDropdownMenu({
    trigger: createButton({ variant: 'outline', label: options.trigger }),
    items: withItemTracking(options.items, options.menu, options.location),
    ...menuTracking(options.menu, options.location),
  });
}

/** A prévia centrada no cartão — o painel abre em portal, o cartão guarda o gatilho. */
function centered(child: HTMLElement): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-cluster nds-w-full';
  wrap.dataset.align = 'center';
  wrap.dataset.justify = 'center';
  wrap.appendChild(child);
  return wrap;
}

/** A lista da prévia no formato do snippet — sem os callbacks de rastreio. */
function snippetItems(defs: DropdownMenuItemDef[]): DropdownMenuSnippetItem[] {
  return defs.map((def) => ({
    type: def.type,
    label: def.label,
    value: def.value,
    variant: def.variant,
    shortcut: def.shortcut,
    inset: def.inset,
    checked: def.checked,
    indeterminate: def.indeterminate,
    disabled: def.disabled,
    // As opções da escolha única entram sem o `onClick` de rastreio, pelo mesmo
    // motivo dos itens: o snippet não imprime função.
    options: def.options?.map((o) => ({ value: o.value, label: o.label, disabled: o.disabled })),
    items: def.items ? snippetItems(def.items) : undefined,
  }));
}

/**
 * Uma célula da Demonstração: a legenda do conteúdo compartilhado em cima, o
 * menu embaixo.
 *
 * A legenda é o que amarra a célula ao `demonstration.labels.*` — é por ela que
 * o portão `demonstration_labels_divergent` enxerga que as cinco stacks mostram
 * o mesmo exemplo. Ela é LEGENDA, não texto do gatilho: o gatilho diz o nome do
 * menu (`account`, `columns`, `theme`, `file`).
 */
function buildDemoCell(caption: string, menu: HTMLElement): HTMLElement {
  const cell = document.createElement('div');
  cell.className = 'nds-stack nds-min-h-20';
  cell.dataset.spacing = 'sm';
  // Mecânica de layout: o painel vive num portal, e `contain` segura o reflow
  // da célula quando ele abre.
  cell.style.contain = 'layout';

  const text = document.createElement('p');
  text.className = 'nds-text-caption nds-font-medium nds-text-muted-foreground';
  text.textContent = caption;

  cell.append(text, menu);
  return cell;
}

/**
 * Os seis cartões de Variantes, pela CHAVE do conteúdo compartilhado. A mesma
 * lista monta a prévia e imprime o código (`dropdownMenuSnippet`), e é isso que
 * impede os dois de divergirem: até 2026-09-11 cada cartão tinha um literal de
 * código ao lado de uma prévia estática, e o `destructive` mostrava "Excluir" na
 * tela e "Excluir conta" no código.
 */
type VariantKey =
  | 'default'
  | 'destructive'
  | 'withLabel'
  | 'withCheckboxItems'
  | 'withRadioGroup'
  | 'withShortcuts';

function variantMenu(key: VariantKey): { trigger: string; items: DropdownMenuItemDef[] } {
  switch (key) {
    case 'default':
      return { trigger: t('demonstration.labels.account'), items: accountItems() };
    case 'destructive':
      return { trigger: t('demonstration.labels.account'), items: renameDeleteItems(true) };
    case 'withLabel':
      return { trigger: t('demonstration.labels.account'), items: groupedAccountItems() };
    case 'withCheckboxItems':
      return { trigger: t('demonstration.labels.columns'), items: columnsItems() };
    case 'withRadioGroup':
      return { trigger: t('demonstration.labels.theme'), items: themeItems() };
    case 'withShortcuts':
      return { trigger: t('demonstration.labels.edit'), items: shortcutItems() };
  }
}

/** A chave do cartão em kebab — é o `menu` dos eventos (`with-checkbox-items`…). */
function variantMenuId(key: VariantKey): string {
  return key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/**
 * A prévia de um cartão. A seção vem de quem CHAMA, mesmo que hoje só
 * Variantes chame: o valor cravado aqui dentro era a forma exata que o portão
 * `location_so_da_demo` condena — o helper decidindo de onde o clique veio.
 */
function variantPreview(key: VariantKey, location: PreviewLocation): HTMLElement {
  return centered(
    buildMenuPreview({ ...variantMenu(key), menu: variantMenuId(key), location }),
  );
}

function variantCode(key: VariantKey): string {
  const { trigger, items } = variantMenu(key);
  return dropdownMenuSnippet({ triggerLabel: trigger, items: snippetItems(items) });
}

// ─── createDropdownMenuDocs ───────────────────────────────────────────────────

export function createDropdownMenuDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────
  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'dropdown-menu',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/navigation' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'dropdown-menu',
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
          demoFactory: () => {
            const wrap = document.createElement('div');
            wrap.style.contain = 'layout';
            // Degrau da escada `.nds-min-h-*` em vez de altura cravada: inline
            // vence a folha e levaria o andaime para fora do tema e da densidade.
            wrap.className = 'nds-grid nds-w-full nds-min-h-40';
            wrap.dataset.spacing = 'md';
            // Custom property, e não medida cravada: a grade decide quantas
            // colunas cabem a partir dela.
            wrap.style.setProperty('--grid-min', '9rem');
            // Quatro menus numa prévia só: o `menu` de cada um é o id da prévia
            // mais a chave do rótulo do GATILHO — `demo` sozinho daria o mesmo
            // nome aos quatro, e abrir e fechar deixariam de se distinguir.
            wrap.append(
              buildDemoCell(
                t('demonstration.labels.basic'),
                buildMenuPreview({
                  trigger: t('demonstration.labels.account'),
                  items: accountItems(),
                  menu: 'demo-account',
                  location: 'docs_demo',
                }),
              ),
              buildDemoCell(
                t('demonstration.labels.withCheckbox'),
                buildMenuPreview({
                  trigger: t('demonstration.labels.columns'),
                  items: columnsItems(),
                  menu: 'demo-columns',
                  location: 'docs_demo',
                }),
              ),
              buildDemoCell(
                t('demonstration.labels.withRadio'),
                buildMenuPreview({
                  trigger: t('demonstration.labels.theme'),
                  items: themeItems(),
                  menu: 'demo-theme',
                  location: 'docs_demo',
                }),
              ),
              buildDemoCell(
                t('demonstration.labels.withSubmenu'),
                buildMenuPreview({
                  trigger: t('demonstration.labels.file'),
                  items: fileItems(),
                  menu: 'demo-file',
                  location: 'docs_demo',
                }),
              ),
            );
            return wrap;
          },
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
            items: ['trigger', 'label', 'item', 'destructive'].map(key => ({
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

      case 'do-dont':
        return createDocsDoDont({
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair1.do')),
              dontCaption: toPlainText(t('doDont.pair1.dont')),
              // DOIS grupos rotulados, como diz a legenda ("Items agrupados e
              // Separator entre grupos"). O lado "faça" tinha um grupo só, e o
              // separador não separava grupo nenhum.
              doPreviewFactory: () =>
                buildMenuPreview({
                  trigger: t('demonstration.labels.account'),
                  items: groupedAccountItems(),
                  menu: 'pair1-do',
                  location: 'docs_do_dont',
                }),
              dontPreviewFactory: () =>
                buildMenuPreview({
                  trigger: t('demonstration.labels.menu'),
                  items: actionItems(),
                  menu: 'pair1-dont',
                  location: 'docs_do_dont',
                }),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              // Componente VIVO nos dois lados, como o par acima. Era um painel
              // imitado, e a imitação não prova o que a legenda afirma: quem
              // pinta o texto de perigo é o `data-variant` que a FÁBRICA põe no
              // item, e um `<li>` montado à mão poderia acertar a cor por outro
              // caminho sem que o mecanismo real estivesse de pé.
              doPreviewFactory: () =>
                buildMenuPreview({
                  trigger: t('demonstration.labels.account'),
                  items: renameDeleteItems(true),
                  menu: 'pair2-do',
                  location: 'docs_do_dont',
                }),
              dontPreviewFactory: () =>
                buildMenuPreview({
                  trigger: t('demonstration.labels.account'),
                  items: renameDeleteItems(false),
                  menu: 'pair2-dont',
                  location: 'docs_do_dont',
                }),
            },
          ],
        });

      // O código exibido está na língua de quem lê: os rótulos saem do conteúdo,
      // e os comentários em português que explicavam cada opção saíram — quem
      // explica é a tabela de Propriedades, nos três idiomas.
      case 'importacao':
        return createDocsImport({
          code: `import { createDropdownMenu } from '@/components/ui/dropdown-menu';
import { createButton } from '@/components/ui/button';`,
          secondaryDescription: t('import.factoryOptions'),
          secondaryCode: `const menu = createDropdownMenu({
  trigger: createButton({ variant: 'outline', label: ${text(t('demonstration.labels.file'))} }),
  items: [{ type: 'item', label: ${text(t('demonstration.labels.rename'))}, value: 'rename' }],
  side: 'right',
  align: 'end',
  sideOffset: 4,
  modal: true,
  defaultOpen: false,
  onOpenChange: (open) => console.log(open),
  onClose: (reason) => console.log(reason),
});

menu.open();
menu.toggle();
menu.setOpen(false);`,
        });

      // Seis cartões, e cada um é o componente VIVO — gatilho, portal, teclado e
      // evento. O `trackId` é a CHAVE do conteúdo: é ela que vira o
      // `snippet_id` do toggle de código, e em kebab o `menu` dos eventos da
      // prévia. Prévia e código saem da mesma lista (`variantMenu`).
      case 'variantes':
        return createDocsCompositions({
          id: 'variantes',
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'dropdown-menu',
          items: [
            {
              trackId: 'default',
              name: t('variants.items.default'),
              description: stripHtml(t('variants.styles.default')),
              code: variantCode('default'),
              previewFactory: () => variantPreview('default', 'docs_variantes'),
            },
            {
              trackId: 'destructive',
              name: t('variants.items.destructive'),
              description: stripHtml(t('variants.styles.destructive')),
              code: variantCode('destructive'),
              previewFactory: () => variantPreview('destructive', 'docs_variantes'),
            },
            {
              name: t('variants.items.withLabel.name'),
              trackId: 'withLabel',
              description: stripHtml(t('variants.items.withLabel.description')),
              useWhen: stripHtml(t('variants.items.withLabel.use')),
              code: variantCode('withLabel'),
              previewFactory: () => variantPreview('withLabel', 'docs_variantes'),
            },
            {
              name: t('variants.items.withCheckboxItems.name'),
              trackId: 'withCheckboxItems',
              description: stripHtml(t('variants.items.withCheckboxItems.description')),
              useWhen: stripHtml(t('variants.items.withCheckboxItems.use')),
              code: variantCode('withCheckboxItems'),
              previewFactory: () => variantPreview('withCheckboxItems', 'docs_variantes'),
            },
            {
              name: t('variants.items.withRadioGroup.name'),
              trackId: 'withRadioGroup',
              description: stripHtml(t('variants.items.withRadioGroup.description')),
              useWhen: stripHtml(t('variants.items.withRadioGroup.use')),
              code: variantCode('withRadioGroup'),
              previewFactory: () => variantPreview('withRadioGroup', 'docs_variantes'),
            },
            {
              name: t('variants.items.withShortcuts.name'),
              trackId: 'withShortcuts',
              description: stripHtml(t('variants.items.withShortcuts.description')),
              useWhen: stripHtml(t('variants.items.withShortcuts.use')),
              code: variantCode('withShortcuts'),
              previewFactory: () => variantPreview('withShortcuts', 'docs_variantes'),
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

      case 'propriedades': {
        const interfaceCode = `// createDropdownMenu(options)
export type DropdownMenuRadioOption = {
  value: string;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
};

export type DropdownMenuItemDef = {
  type?: 'item' | 'separator' | 'label' | 'checkbox' | 'radio-group' | 'submenu';
  value?: string;             // radio-group: o valor escolhido
  label?: string;
  disabled?: boolean;
  variant?: 'default' | 'destructive';
  shortcut?: string;
  inset?: boolean;            // item | label | submenu
  checked?: boolean;          // checkbox
  indeterminate?: boolean;    // checkbox
  options?: DropdownMenuRadioOption[]; // radio-group
  items?: DropdownMenuItemDef[];       // submenu
  onClick?: () => void;
  onCheckedChange?: (checked: boolean) => void;
  onIndeterminateChange?: (indeterminate: boolean) => void;
  onValueChange?: (value: string) => void; // radio-group
};

export type DropdownMenuCloseReason = 'escape' | 'overlay' | 'api';

export type DropdownMenuOptions = {
  trigger: HTMLElement;
  items: DropdownMenuItemDef[];
  side?: 'top' | 'bottom' | 'left' | 'right';   // 'bottom'
  align?: 'start' | 'center' | 'end';           // 'start'
  sideOffset?: number;                          // 4
  modal?: boolean;                              // true
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: (reason: DropdownMenuCloseReason) => void;
  class?: string;
};

export type DropdownMenuElement = DestroyableElement & {
  open: () => void;
  close: () => void;
  toggle: () => void;
  setOpen: (open: boolean) => void;
};

export function createDropdownMenu(options: DropdownMenuOptions): DropdownMenuElement;`;

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
        const both = (shared: string, factory: string) =>
          `${toPlainText(t(shared))} ${toPlainText(t(factory))}`;

        return createDocsProps({
          tables: [
            {
              title: 'createDropdownMenu(options)',
              cols: propsCols,
              items: [
                { name: 'trigger',      type: 'HTMLElement',                 defaultValue: '—',     required: yes, description: toPlainText(t('props.factory.trigger')) },
                { name: 'items',        type: 'DropdownMenuItemDef[]',       defaultValue: '—',     required: yes, description: toPlainText(t('props.factory.items')) },
                { name: 'onOpenChange', type: '(open: boolean) => void',     defaultValue: '—',     required: no,  description: toPlainText(t('props.table.onOpenChange.description')) },
                { name: 'onClose',      type: "(reason: 'escape' | 'overlay' | 'api') => void", defaultValue: '—', required: no, description: toPlainText(t('props.factory.onClose')) },
                { name: 'class',        type: 'string',                      defaultValue: '—',     required: no,  description: toPlainText(t('props.factory.class')) },
                { name: 'open',         type: 'boolean',                     defaultValue: '—',     required: no,  description: both('props.table.open.description', 'props.factory.openControlled') },
                { name: 'defaultOpen',  type: 'boolean',                     defaultValue: 'false', required: no,  description: toPlainText(t('props.table.defaultOpen.description')) },
                { name: 'modal',        type: 'boolean',                     defaultValue: 'true',  required: no,  description: both('props.table.modal.description', 'props.factory.modalDetail') },
                { name: 'side',         type: "'top' | 'bottom' | 'left' | 'right'", defaultValue: "'bottom'", required: no, description: both('props.table.side.description', 'props.factory.sideMarkup') },
                { name: 'align',        type: "'start' | 'center' | 'end'",  defaultValue: "'start'", required: no, description: both('props.table.align.description', 'props.factory.alignMarkup') },
                { name: 'sideOffset',   type: 'number',                      defaultValue: '4',     required: no,  description: toPlainText(t('props.factory.sideOffset')) },
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
            { token: '--popover',            value: t('tokens.table.background.class'),  description: t('tokens.table.background.part')  },
            { token: '--popover-foreground', value: t('tokens.table.foreground.class'),  description: t('tokens.table.foreground.part')  },
            { token: '--border',             value: t('tokens.table.border.class'),      description: t('tokens.table.border.part')      },
            { token: '--elevation-md',          value: t('tokens.table.shadow.class'),      description: t('tokens.table.shadow.part')      },
            { token: '--radius',             value: t('tokens.table.rounded.class'),     description: t('tokens.table.rounded.part')     },
            { token: '--accent',             value: t('tokens.table.itemHover.class'),   description: t('tokens.table.itemHover.part')   },
            { token: '--destructive',        value: t('tokens.table.destructive.class'), description: t('tokens.table.destructive.part') },
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
            { key: 'Tab',          description: t('accessibility.keyboard.tab')      },
            { key: 'Arrow Up / Arrow Down / Arrow Left / Arrow Right',      description: t('accessibility.keyboard.arrows')   },
            { key: 'Enter/Space',  description: t('accessibility.keyboard.enter')    },
            { key: 'Esc',          description: t('accessibility.keyboard.escape')   },
            { key: 'Home/End',     description: t('accessibility.keyboard.homeEnd')  },
            { key: 'A–Z',          description: t('accessibility.keyboard.typeahead')},
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          items: [
            { name: t('related.items.contextMenu.name'), description: toPlainText(t('related.items.contextMenu.description')), path: '?path=/docs/components-navigation-contextmenu--docs' },
            { name: t('related.items.menubar.name'),     description: toPlainText(t('related.items.menubar.description')),     path: '?path=/docs/components-navigation-menubar--docs'     },
            { name: t('related.items.command.name'),     description: toPlainText(t('related.items.command.description')),     path: '?path=/docs/components-overlay-command--docs'     },
            { name: t('related.items.popover.name'),     description: toPlainText(t('related.items.popover.description')),     path: '?path=/docs/components-overlay-popover--docs'     },
            { name: t('related.items.select.name'),      description: toPlainText(t('related.items.select.description')),      path: '?path=/docs/components-form-select--docs'      },
          ],
        });

      case 'notas':
        return createDocsNotes({
          items: [1, 2, 3, 4, 5].map(i => ({ title: '', content: DOMPurify.sanitize(t(`notes.item${i}`)) })),
        });

      // A tabela sai do CONTEÚDO, como a do Context Menu — irmão da mesma
      // folha e do mesmo PRD. As três linhas cravadas aqui ensinavam o payload
      // antigo (`label` no lugar de `menu`, sem `reason`) depois que o tipo e o
      // conteúdo já tinham mudado.
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

      // As três listas saem do conteúdo por varredura: a funcional estava
      // cravada em oito e escondia os seis critérios novos da família (F9–F14).
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
        component_name: 'dropdown-menu',
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
