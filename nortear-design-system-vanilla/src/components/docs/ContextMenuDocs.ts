import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import {
  createContextMenu,
  type ContextMenuCloseReason,
  type ContextMenuItemDef,
  type ContextMenuOptions,
} from '@/components/ui/context-menu';
import { contextMenuEntriesFrom, contextMenuSnippet } from '@/components/ui/context-menu.source';
import { createButton } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import contextMenuTranslations from '@shared/content/context-menu/translations.json';
import { toPlainText } from '@/lib/strip-html';
import { AREA_CLICK_DIREITO } from '@shared/primitives/context-menu-area';

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

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria. O
// `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
function screenReaderItems(): string[] {
  const locale = getLocale();
  return Object.entries(
    (contextMenuTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  )
    .filter(([k]) => k !== 'title')
    .map(([, v]) => v);
}
// Opções que só esta stack tem.
//
// `trigger`, `items`, `onClose`, `radioValue`, `type` e o `items` do submenu são
// a API da FÁBRICA — as outras stacks compõem peças e não têm linha para elas no
// conteúdo compartilhado. Ficam no override, e não em texto fixo na tabela:
// presas em pt-BR apareciam em português nas versões en e es da página.
const { t, subscribe } = createTranslation(contextMenuTranslations as Record<string, unknown>, {
  'pt-BR': {
    'props.items.trigger': 'Elemento que captura o gesto — clique direito, tecla de menu ou Shift+F10 sobre ele. A fábrica lhe dá parada de tabulação se ele não tiver.',
    'props.items.items': 'Lista de itens, separadores, rótulos e submenus do menu.',
    'props.items.onClose': 'Disparado a cada fechamento, antes do callback de mudança, com o motivo: escape, overlay (clique fora ou Tab) ou api (item escolhido).',
    'props.items.radioValue': 'Valor corrente do grupo de escolha única — ele vive no menu, não em cada item.',
    'props.items.type': 'Tipo do item. "submenu" exige a lista de itens; "radio" exige o valor.',
    'props.items.subItems': 'Itens do submenu, quando o tipo é "submenu".',
  },
  en: {
    'props.items.trigger': 'Element that captures the gesture — right-click, the menu key or Shift+F10 on it. The factory gives it a tab stop if it has none.',
    'props.items.items': 'List of items, separators, labels and submenus in the menu.',
    'props.items.onClose': 'Fired on every close, before the change callback, with the reason: escape, overlay (click outside or Tab) or api (item chosen).',
    'props.items.radioValue': 'Current value of the single-choice group — it lives in the menu, not in each item.',
    'props.items.type': 'Item type. "submenu" requires the item list; "radio" requires the value.',
    'props.items.subItems': 'Submenu items, when the type is "submenu".',
  },
  es: {
    'props.items.trigger': 'Elemento que captura el gesto — clic derecho, tecla de menú o Shift+F10 sobre él. La fábrica le da una parada de tabulación si no la tiene.',
    'props.items.items': 'Lista de ítems, separadores, rótulos y submenús del menú.',
    'props.items.onClose': 'Se dispara en cada cierre, antes del callback de cambio, con el motivo: escape, overlay (clic fuera o Tab) o api (ítem elegido).',
    'props.items.radioValue': 'Valor actual del grupo de selección única — vive en el menú, no en cada ítem.',
    'props.items.type': 'Tipo del ítem. "submenu" exige la lista de ítems; "radio" exige el valor.',
    'props.items.subItems': 'Ítems del submenú, cuando el tipo es "submenu".',
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high:   'common.high',
  medium: 'common.medium',
  low:    'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

// Nível WCAG e forma de verificar cada critério de acessibilidade, por índice —
// a MESMA lista nas cinco stacks. São identificadores (número de critério,
// consulta da suíte, regra do axe), e identificador não se traduz: por isso
// ficam aqui e não no conteúdo compartilhado. Item além da lista cai no par
// padrão em vez de sumir.
const A11Y_TEST_LEVELS = [
  'AA',
  '4.1.2 · A',
  '4.1.2 · A',
  '4.1.2 · A',
  '4.1.2 · A',
  '4.1.2 · A',
  '2.1.1 · A',
  '1.4.3 · AA',
  '2.1.1 · A',
];
const A11Y_TEST_HOW = [
  'axe-core',
  "getByRole('menu')",
  "getAllByRole('menuitem')",
  "getAllByRole('menuitemcheckbox') · aria-checked",
  "getAllByRole('menuitemradio') · aria-checked",
  'aria-disabled',
  'Escape · document.activeElement',
  'axe-core · color-contrast',
  'ArrowDown · document.activeElement',
];

/**
 * Varre `base.item1`, `base.item2`, … enquanto existirem no conteúdo.
 *
 * Contar à mão (`[1, 2, 3].map(...)`) trava a lista no tamanho de hoje: o
 * conteúdo compartilhado ganha um item e ele simplesmente não existe para quem
 * lê — sem erro, sem aviso, nos três idiomas de uma vez. Foi o que aconteceu com
 * o nono critério de acessibilidade deste componente, o que registra que a seta
 * POUSA no item desabilitado em vez de pulá-lo.
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
 * A mesma varredura para a lista cujo item é um OBJETO — cenário, critério
 * funcional, story de regressão visual. O primeiro campo é quem decide se o
 * item existe, e os demais acompanham.
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

/**
 * A moldura tracejada é o único sinal de "clique com o botão direito aqui", e a
 * mesma classe vale nas stories e nas cinco docs pages. `nds-border-default` traz
 * largura e cor; `nds-border-dashed` só troca `border-style` — as duas juntas, ou
 * a moldura sai sólida.
 *
 * O que era `style` inline (altura de 120px, largura máxima e `border-style`)
 * virou classe: altura cravada num bloco de texto não cresce com a fonte do
 * navegador (WCAG 1.4.4), e o `nds-p-8` entrega o mesmo quadro sem cravá-la.
 * `user-select: none` já vem de `.nds-context-menu-trigger`, que a factory aplica.
 */
function makeTriggerArea(label: string): HTMLElement {
  const el = document.createElement('div');
  el.className = AREA_CLICK_DIREITO;
  el.dataset.align = 'center';
  el.dataset.justify = 'center';
  el.textContent = label;
  return el;
}

// ─── Rastreamento das prévias vivas ───────────────────────────────────────────

/**
 * Onde cada prévia viva mora — o `location` dos três eventos é a SEÇÃO da
 * página onde o menu está (guideline 07), nunca o texto dela.
 */
type PreviewLocation = 'docs_demo' | 'docs_variantes' | 'docs_do_dont';

/**
 * Pendura o `context_menu_item_select` em cada item escolhível — ação, marcação
 * e rádio, dentro de submenu também. O `label` do evento é o `value` do item,
 * que é ESTÁVEL: rótulo traduzido parte o mesmo evento em um valor por idioma
 * no GA4 — "Excluir", "Delete" e "Eliminar" viram três linhas de uma ação só.
 */
function withItemTracking(
  defs: ContextMenuItemDef[],
  menu: string,
  location: PreviewLocation,
): ContextMenuItemDef[] {
  return defs.map((def) => {
    const type = def.type ?? 'item';
    if (type === 'submenu') {
      return { ...def, items: withItemTracking(def.items ?? [], menu, location) };
    }
    if (type === 'separator' || type === 'label' || !def.value) return def;
    const label = def.value;
    return {
      ...def,
      onClick: () => {
        def.onClick?.();
        track('context_menu_item_select', { component: 'context-menu', label, menu, location });
      },
    };
  });
}

/**
 * A abertura e o fechamento de uma prévia VIVA, para espalhar nas opções da
 * fábrica.
 *
 * Toda prévia desta página rastreia — demonstração, Variantes e Do & Don't. Até
 * 2026-09-10 só a demonstração o fazia, e as treze prévias das outras duas
 * seções abriam, escolhiam e fechavam sem deixar rastro. `menu` é o id estável
 * de cada prévia (`demo`, `with-checkbox`, `pair1-do`…), e o fechamento leva o
 * motivo que só a fábrica conhece: `escape`, `overlay` (clique fora ou Tab) ou
 * `api` (item escolhido).
 */
function menuTracking(
  menu: string,
  location: PreviewLocation,
): Pick<ContextMenuOptions, 'onOpenChange' | 'onClose'> {
  return {
    onOpenChange: (open) => {
      if (open) track('context_menu_open', { component: 'context-menu', menu, location });
    },
    onClose: (reason: ContextMenuCloseReason) => {
      track('context_menu_close', { component: 'context-menu', menu, reason, location });
    },
  };
}

// ─── Itens das prévias ────────────────────────────────────────────────────────
//
// Rótulo do conteúdo compartilhado, nunca literal — é ele que faz as cinco
// stacks mostrarem o mesmo menu nos três idiomas —, e `value` estável, que é o
// que o evento de escolha manda. Uma função por item, e não uma constante,
// porque o rótulo é lido no idioma do MOMENTO em que a prévia é montada.

function itemEdit(extra: Partial<ContextMenuItemDef> = {}): ContextMenuItemDef {
  return { type: 'item', label: t('demonstration.labels.edit'), value: 'edit', ...extra };
}

function itemDuplicate(extra: Partial<ContextMenuItemDef> = {}): ContextMenuItemDef {
  return { type: 'item', label: t('demonstration.labels.duplicate'), value: 'duplicate', ...extra };
}

function itemDelete(extra: Partial<ContextMenuItemDef> = {}): ContextMenuItemDef {
  return { type: 'item', label: t('demonstration.labels.delete'), value: 'delete', ...extra };
}

/** "Compartilhar" é SUBMENU nas cinco stacks, com os dois destinos dentro. */
function itemShare(): ContextMenuItemDef {
  return {
    type: 'submenu',
    label: t('demonstration.labels.share'),
    value: 'share',
    items: [
      { type: 'item', label: t('demonstration.labels.shareEmail'), value: 'share-email' },
      { type: 'item', label: t('demonstration.labels.shareLink'), value: 'share-link' },
    ],
  };
}

const SEPARATOR: ContextMenuItemDef = { type: 'separator' };

function buildDemoMenu(): HTMLElement {
  // Os ATALHOS entram porque a demonstração é o mesmo exemplo nas cinco: sem
  // eles esta era a única que não mostrava a coluna de atalho, e o
  // `demonstration_labels_divergent` mediu a diferença pelo rótulo que faltava
  // (`deleteShortcut`).
  return createContextMenu({
    trigger: makeTriggerArea(t('demonstration.labels.triggerLabel')),
    items: withItemTracking(
      [
        itemEdit({ shortcut: t('demonstration.labels.editShortcut') }),
        itemDuplicate(),
        itemShare(),
        SEPARATOR,
        itemDelete({ shortcut: t('demonstration.labels.deleteShortcut'), variant: 'destructive' }),
      ],
      'demo',
      'docs_demo',
    ),
    ...menuTracking('demo', 'docs_demo'),
  });
}

/**
 * A mesma área, SEM nenhuma dica de que o gesto existe: sem contorno tracejado,
 * sem cursor próprio e sem linha de ajuda. É o lado "evite" do par 3 do Do &
 * Don't, e a legenda dele fala exatamente disso.
 *
 * Ela monta o COMPONENTE, e não um desenho: era um `<div>` à mão, que ensina
 * markup que o design system não emite (guideline 08 §15). Sem `opacity`
 * também — o esmaecimento levava o texto a 1.52:1 (axe: color-contrast), e o
 * próprio texto já comunica a ausência.
 */
function makePlainArea(label: string): HTMLElement {
  const el = document.createElement('div');
  el.className = 'nds-cluster nds-w-xs nds-p-8 nds-rounded-md nds-text-body nds-text-muted-foreground';
  el.dataset.align = 'center';
  el.dataset.justify = 'center';
  el.textContent = label;
  return el;
}

/**
 * Prévia que monta o COMPONENTE de verdade, centrada no card.
 *
 * Antes da passada de 2026-09-02 as prévias desenhavam painel, item, separador
 * e indicador à mão, com dimensões e cor cravadas em `style` inline e
 * `<li role="menuitem">` SOLTO, fora de qualquer `role="menu"` — órfão para o
 * leitor de tela. Marcação, escolha única, submenu, atalho, recuo e variante
 * destrutiva são tipos de item da fábrica, não markup de quem consome.
 */
function buildMenuPreview(options: {
  items: ContextMenuItemDef[];
  menu: string;
  location: PreviewLocation;
  radioValue?: string;
  trigger?: HTMLElement;
}): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-cluster nds-w-full';
  wrap.dataset.align = 'center';
  wrap.dataset.justify = 'center';
  wrap.appendChild(
    createContextMenu({
      trigger: options.trigger ?? makeTriggerArea(t('demonstration.labels.triggerLabel')),
      items: withItemTracking(options.items, options.menu, options.location),
      radioValue: options.radioValue,
      ...menuTracking(options.menu, options.location),
    }),
  );
  return wrap;
}

/**
 * Os sete cards de Variantes, pela CHAVE do conteúdo compartilhado.
 *
 * A mesma lista monta a prévia e imprime o código (`contextMenuEntriesFrom`), e
 * é isso que impede os dois de divergirem: até 2026-09-10 cada card tinha um
 * literal de código ao lado da prévia, e três deles envelheceram sozinhos — o
 * de marcação com os estados trocados, o de escolha única com "Zoom" na tela e
 * "Layout" no código, e o padrão mostrando um menu no código e nenhum na prévia
 * (a área sem fábrica abria o menu NATIVO do navegador).
 */
type VariantKey =
  | 'default'
  | 'destructive'
  | 'label'
  | 'withCheckbox'
  | 'withRadio'
  | 'withSubmenu'
  | 'withShortcuts';

function variantMenu(key: VariantKey): { items: ContextMenuItemDef[]; radioValue?: string } {
  switch (key) {
    case 'default':
      return { items: [itemEdit(), itemDuplicate()] };
    case 'destructive':
      return { items: [itemEdit(), SEPARATOR, itemDelete({ variant: 'destructive' })] };
    case 'label':
      return {
        items: [
          { type: 'label', label: t('demonstration.labels.groupActions'), inset: true },
          itemEdit({ inset: true }),
          itemDuplicate({ inset: true }),
        ],
      };
    case 'withCheckbox':
      return {
        items: [
          { type: 'label', label: t('demonstration.labels.groupView') },
          { type: 'checkbox', label: t('demonstration.labels.showGrid'), value: 'show-grid', checked: false },
          { type: 'checkbox', label: t('demonstration.labels.showRulers'), value: 'show-rulers', checked: true },
        ],
      };
    case 'withRadio':
      return {
        radioValue: 'layout-grid',
        items: [
          { type: 'label', label: t('demonstration.labels.groupLayout') },
          { type: 'radio', label: t('demonstration.labels.layoutGrid'), value: 'layout-grid' },
          { type: 'radio', label: t('demonstration.labels.layoutList'), value: 'layout-list' },
          { type: 'radio', label: t('demonstration.labels.layoutColumns'), value: 'layout-columns' },
        ],
      };
    case 'withSubmenu':
      return { items: [itemEdit(), itemDuplicate(), itemShare()] };
    case 'withShortcuts':
      return {
        items: [
          itemEdit({ shortcut: t('demonstration.labels.editShortcut') }),
          itemDuplicate({ shortcut: t('demonstration.labels.duplicateShortcut') }),
          SEPARATOR,
          itemDelete({ shortcut: t('demonstration.labels.deleteShortcut'), variant: 'destructive' }),
        ],
      };
  }
}

/** A chave do card em kebab — é o `menu` dos eventos (`with-checkbox`…). */
function variantMenuId(key: VariantKey): string {
  return key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function variantPreview(key: VariantKey): HTMLElement {
  return buildMenuPreview({
    ...variantMenu(key),
    menu: variantMenuId(key),
    location: 'docs_variantes',
  });
}

function variantCode(key: VariantKey): string {
  const { items, radioValue } = variantMenu(key);
  return contextMenuSnippet({
    triggerLabel: t('demonstration.labels.triggerLabel'),
    items: contextMenuEntriesFrom(items),
    radioValue,
  });
}

// ─── createContextMenuDocs ────────────────────────────────────────────────────

export function createContextMenuDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'context-menu',
      // O resumo e as entidades para os mecanismos de IA existiam no conteúdo
      // compartilhado e não chegavam a lugar nenhum: a página não os passava.
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
    });
    track('docs_page_view', {
      component_name: 'context-menu',
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
  const root       = pageLayout.root;
  const headerSlot = pageLayout.headerSlot;
  const main       = pageLayout.main;

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

  // ── Section order ─────────────────────────────────────────────────────────

  const sectionOrder = [
    'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
    'importacao', 'variantes', 'estados', 'propriedades', 'tokens',
    'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
  ] as const;
  type SectionId = typeof sectionOrder[number];

  const sectionEls: Record<SectionId, HTMLElement> = {} as Record<SectionId, HTMLElement>;

  function buildSection(id: SectionId): HTMLElement {
    switch (id) {

      // ── 1. Demonstração ──────────────────────────────────────────────────
      case 'demonstracao':
        return createDocsDemonstration({
          title: t('demonstration.title'),
          demoFactory: () => {
            const wrap = document.createElement('div');
            wrap.className = 'nds-cluster nds-p-8';
            wrap.dataset.align = 'center';
            wrap.dataset.justify = 'center';
            wrap.classList.add('nds-min-h-50');
            wrap.appendChild(buildDemoMenu());
            return wrap;
          },
        });

      // ── 2. Anatomia ──────────────────────────────────────────────────────
      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: stringsFromDict(t, 'anatomy'),
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      // ── 3. Quando Usar ───────────────────────────────────────────────────
      case 'quando-usar':
        return createDocsWhenToUse({
          title: t('usage.title'),
          guidelines: {
            title: t('usage.guidelines.title'),
            items: stringsFromDict(t, 'usage.guidelines'),
          },
          scenarios: {
            title: t('usage.scenarios.title'),
            cols: {
              scenario:    t('usage.scenarios.cols.scenario'),
              use:         t('usage.scenarios.cols.use'),
              alternative: t('usage.scenarios.cols.alternative'),
            },
            items: entriesFromDict(t, 'usage.scenarios', ['s', 'u', 'a']),
          },
          do: {
            title: t('usage.do.title'),
            items: stringsFromDict(t, 'usage.do'),
          },
          dont: {
            title: t('usage.dont.title'),
            items: stringsFromDict(t, 'usage.dont'),
          },
        });

      // ── 4. Do & Don't ────────────────────────────────────────────────────
      //
      // Cada par muda UMA coisa entre os dois lados, e é a coisa de que a
      // legenda fala; o resto é igual, para que a diferença se leia sozinha.
      case 'do-dont':
        return createDocsDoDont({
          title: t('doDont.title'),
          pairs: [
            {
              doLabel:      tNav('common.do'),
              dontLabel:    tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair1.do')),
              dontCaption: toPlainText(t('doDont.pair1.dont')),
              // O MESMO menu nos dois lados; o que muda é a alternativa
              // visível. Até 2026-09-10 o lado "evite" mostrava outro menu, só
              // com Excluir — e aí a diferença entre os dois deixava de ser a
              // alternativa, que é o assunto do par.
              doPreviewFactory: () => {
                const wrap = buildMenuPreview({
                  items: [itemEdit(), itemDelete({ variant: 'destructive' })],
                  menu: 'pair1-do',
                  location: 'docs_do_dont',
                });
                wrap.dataset.spacing = 'sm';
                wrap.appendChild(
                  createButton({ variant: 'outline', size: 'sm', label: t('demonstration.labels.edit') }),
                );
                return wrap;
              },
              dontPreviewFactory: () =>
                buildMenuPreview({
                  items: [itemEdit(), itemDelete({ variant: 'destructive' })],
                  menu: 'pair1-dont',
                  location: 'docs_do_dont',
                }),
            },
            {
              doLabel:      tNav('common.do'),
              dontLabel:    tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              // A mesma ação destrutiva nos dois lados. À esquerda, na variante
              // destrutiva e separada por uma linha; à direita, na variante
              // padrão e no meio da lista — é o que a legenda descreve. O lado
              // "evite" era um submenu aninhado, que é assunto de `notes.tip3`
              // e não deste par.
              doPreviewFactory: () =>
                buildMenuPreview({
                  items: [itemEdit(), itemDuplicate(), SEPARATOR, itemDelete({ variant: 'destructive' })],
                  menu: 'pair2-do',
                  location: 'docs_do_dont',
                }),
              dontPreviewFactory: () =>
                buildMenuPreview({
                  items: [itemEdit(), itemDelete(), itemDuplicate()],
                  menu: 'pair2-dont',
                  location: 'docs_do_dont',
                }),
            },
            {
              doLabel:      tNav('common.do'),
              dontLabel:    tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair3.do')),
              dontCaption: toPlainText(t('doDont.pair3.dont')),
              // Os dois lados montam o MESMO menu; o que os separa é a DICA
              // VISUAL, que é o assunto da legenda deste par. À esquerda, a
              // moldura tracejada da constante compartilhada e a linha que diz o
              // gesto; à direita, a mesma área sem contorno e sem aviso — o menu
              // existe e ninguém tem como saber.
              doPreviewFactory: () =>
                buildMenuPreview({
                  items: [itemEdit(), itemDuplicate()],
                  menu: 'pair3-do',
                  location: 'docs_do_dont',
                }),
              dontPreviewFactory: () =>
                buildMenuPreview({
                  items: [itemEdit(), itemDuplicate()],
                  menu: 'pair3-dont',
                  location: 'docs_do_dont',
                  trigger: makePlainArea(t('demonstration.labels.areaNoHint')),
                }),
            },
          ],
        });

      // ── 5. Importação ────────────────────────────────────────────────────
      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('import.basic'),
          code: `import { createContextMenu } from '@/components/ui/context-menu';`,
          secondaryDescription: t('import.withCheckbox'),
          secondaryCode: `// Marcação e escolha única são TIPOS de item — a fábrica emite os papéis,
// o aria-checked e o indicador. Não há markup a montar à mão.
createContextMenu({
  trigger,
  radioValue: 'grid',
  items: [
    { type: 'checkbox', label: 'Mostrar grade', value: 'grade', checked: true },
    { type: 'separator' },
    { type: 'radio', label: 'Grade', value: 'grid' },
    { type: 'radio', label: 'Lista', value: 'list' },
  ],
});`,
        });

      // ── 6. Variantes ─────────────────────────────────────────────────────
      //
      // Sete cards, e o `name`/`trackId` de cada um é a CHAVE do conteúdo — é
      // ela que vira o `snippet_id` do toggle de código e o `menu` dos eventos
      // da prévia. Nome traduzido ali partiria o mesmo card em três valores no
      // GA4. Prévia e código saem da mesma lista (`variantMenu`).
      case 'variantes':
        return createDocsCompositions({
          id: 'variantes',
          title: t('variants.title'),
          note: t('variants.note'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'context-menu',
          items: [
            {
              name: 'default',
              description: t('variants.items.default'),
              code: variantCode('default'),
              previewFactory: () => variantPreview('default'),
            },
            {
              name: 'destructive',
              description: t('variants.items.destructive'),
              code: variantCode('destructive'),
              previewFactory: () => variantPreview('destructive'),
            },
            {
              name: 'label',
              description: t('variants.items.label'),
              code: variantCode('label'),
              previewFactory: () => variantPreview('label'),
            },
            {
              name: t('variants.items.withCheckbox.name'),
              trackId: 'withCheckbox',
              description: t('variants.items.withCheckbox.description'),
              useWhen: t('variants.items.withCheckbox.use'),
              code: variantCode('withCheckbox'),
              previewFactory: () => variantPreview('withCheckbox'),
            },
            {
              name: t('variants.items.withRadio.name'),
              trackId: 'withRadio',
              description: t('variants.items.withRadio.description'),
              useWhen: t('variants.items.withRadio.use'),
              code: variantCode('withRadio'),
              previewFactory: () => variantPreview('withRadio'),
            },
            {
              name: t('variants.items.withSubmenu.name'),
              trackId: 'withSubmenu',
              description: t('variants.items.withSubmenu.description'),
              useWhen: t('variants.items.withSubmenu.use'),
              code: variantCode('withSubmenu'),
              previewFactory: () => variantPreview('withSubmenu'),
            },
            {
              name: t('variants.items.withShortcuts.name'),
              trackId: 'withShortcuts',
              description: t('variants.items.withShortcuts.description'),
              useWhen: t('variants.items.withShortcuts.use'),
              code: variantCode('withShortcuts'),
              previewFactory: () => variantPreview('withShortcuts'),
            },
          ],
        });

      // ── 7. Estados ───────────────────────────────────────────────────────
      case 'estados':
        return createDocsStates({
          title: t('states.title'),
          cols: {
            state:    t('states.cols.state'),
            trigger: toPlainText(t('states.cols.trigger')),
            behavior: toPlainText(t('states.cols.behavior')),
          },
          items: [
            { label: t('states.closed.label'),  trigger: toPlainText(t('states.closed.trigger')),  behavior: toPlainText(t('states.closed.behavior'))},
            { label: t('states.open.label'),     trigger: toPlainText(t('states.open.trigger')),    behavior: toPlainText(t('states.open.behavior'))},
            { label: t('states.focused.label'),  trigger: toPlainText(t('states.focused.trigger')), behavior: toPlainText(t('states.focused.behavior'))},
            { label: t('states.disabled.label'), trigger: toPlainText(t('states.disabled.trigger')),behavior: toPlainText(t('states.disabled.behavior'))},
            { label: t('states.checked.label'),  trigger: toPlainText(t('states.checked.trigger')), behavior: toPlainText(t('states.checked.behavior'))},
            // O estado misto é da fábrica desde a revisão de 2026-09-02
            // (`indeterminate`), e a tabela não o listava.
            { label: t('states.mixed.label'),    trigger: toPlainText(t('states.mixed.trigger')),   behavior: toPlainText(t('states.mixed.behavior'))},
            { label: t('states.subOpen.label'),  trigger: toPlainText(t('states.subOpen.trigger')), behavior: toPlainText(t('states.subOpen.behavior'))},
          ],
        });

      // ── 8. Propriedades ──────────────────────────────────────────────────
      case 'propriedades': {
        // A tipagem abaixo é a da fábrica, conferida linha a linha contra
        // `components/ui/context-menu.ts`. A versão anterior parava em
        // `'item' | 'separator' | 'label'` e omitia marcação, escolha única,
        // submenu, atalho, recuo e variante — a página prometia MENOS do que o
        // componente entrega.
        const interfaceCode = `// createContextMenu(options)
export type ContextMenuItemDef = {
  type?:           'item' | 'separator' | 'label' | 'checkbox' | 'radio' | 'submenu';
  value?:          string;
  label?:          string;
  disabled?:       boolean;
  inset?:          boolean;
  variant?:        'default' | 'destructive';
  shortcut?:       string;
  checked?:        boolean;
  indeterminate?:  boolean;
  items?:          ContextMenuItemDef[];
  onClick?:              () => void;
  onCheckedChange?:      (checked: boolean) => void;
  onIndeterminateChange?: (indeterminate: boolean) => void;
};

export type ContextMenuCloseReason = 'escape' | 'overlay' | 'api';

export type ContextMenuOptions = {
  trigger:        HTMLElement;
  items:          ContextMenuItemDef[];
  onOpenChange?:  (open: boolean) => void;
  onClose?:       (reason: ContextMenuCloseReason) => void;
  radioValue?:    string;
  onRadioChange?: (value: string) => void;
  class?:         string;
};`;

        const propsCols = {
          prop:        t('props.table.prop'),
          type:        t('props.table.type'),
          default:     t('props.table.default'),
          required:    t('props.table.required'),
          description: t('props.table.description'),
        };

        // "Sim"/"Não" do vocabulário comum da página, e não literal: a coluna
        // saía em português nos três idiomas.
        const yes = tNav('common.yes');
        const no = tNav('common.no');

        // Toda descrição sai de `props.items.*`: as genéricas do conteúdo
        // compartilhado, e as que só esta fábrica tem do override no topo do
        // arquivo, nos três idiomas. Nenhuma fica cravada em pt-BR na tabela.
        return createDocsProps({
          title: t('props.title'),
          tables: [
            {
              title: t('props.rootTitle'),
              cols: propsCols,
              items: [
                { name: 'trigger',       type: 'HTMLElement',             defaultValue: '—', required: yes, description: toPlainText(t('props.items.trigger')) },
                { name: 'items',         type: 'ContextMenuItemDef[]',    defaultValue: '—', required: yes, description: toPlainText(t('props.items.items')) },
                { name: 'onOpenChange',  type: '(open: boolean) => void', defaultValue: '—', required: no,  description: toPlainText(t('props.items.onOpenChange')) },
                { name: 'onClose',       type: "(reason: 'escape' | 'overlay' | 'api') => void", defaultValue: '—', required: no, description: toPlainText(t('props.items.onClose')) },
                { name: 'radioValue',    type: 'string',                  defaultValue: '—', required: no,  description: toPlainText(t('props.items.radioValue')) },
                { name: 'onRadioChange', type: '(value: string) => void', defaultValue: '—', required: no,  description: toPlainText(t('props.items.onValueChange')) },
                { name: 'class',         type: 'string',                  defaultValue: '—', required: no,  description: toPlainText(t('props.items.class')) },
              ],
            },
            {
              title: t('props.itemTitle'),
              cols: propsCols,
              items: [
                { name: 'type',          type: '"item" | "separator" | "label" | "checkbox" | "radio" | "submenu"', defaultValue: '"item"', required: no, description: toPlainText(t('props.items.type')) },
                { name: 'label',         type: 'string',                       defaultValue: '—',         required: no, description: toPlainText(t('props.items.label')) },
                { name: 'value',         type: 'string',                       defaultValue: '—',         required: no, description: toPlainText(t('props.items.value')) },
                { name: 'disabled',      type: 'boolean',                      defaultValue: 'false',     required: no, description: toPlainText(t('props.items.disabled')) },
                { name: 'inset',         type: 'boolean',                      defaultValue: 'false',     required: no, description: toPlainText(t('props.items.inset')) },
                { name: 'variant',       type: '"default" | "destructive"',    defaultValue: '"default"', required: no, description: toPlainText(t('props.items.variant')) },
                { name: 'shortcut',      type: 'string',                       defaultValue: '—',         required: no, description: toPlainText(t('props.items.shortcut')) },
                { name: 'checked',       type: 'boolean',                      defaultValue: 'false',     required: no, description: toPlainText(t('props.items.checked')) },
                { name: 'indeterminate', type: 'boolean',                      defaultValue: 'false',     required: no, description: toPlainText(t('props.items.indeterminate')) },
                { name: 'items',         type: 'ContextMenuItemDef[]',         defaultValue: '—',         required: no, description: toPlainText(t('props.items.subItems')) },
                { name: 'onClick',       type: '() => void',                   defaultValue: '—',         required: no, description: toPlainText(t('props.items.onSelect')) },
                { name: 'onCheckedChange', type: '(checked: boolean) => void', defaultValue: '—',         required: no, description: toPlainText(t('props.items.onCheckedChange')) },
                { name: 'onIndeterminateChange', type: '(indeterminate: boolean) => void', defaultValue: '—', required: no, description: toPlainText(t('props.items.onIndeterminateChange')) },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: t('props.extensibility'),
        });
      }

      // ── 9. Tokens ────────────────────────────────────────────────────────
      case 'tokens': {
        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token:       t('tokens.table.token'),
            value:       t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            // A coluna do meio é "Classe .nds-*" e trazia nome de utilitária do
            // Tailwind — vocabulário morto desde a migração. Cada linha aponta
            // agora o seletor que o CSS realmente usa, e cada token foi medido
            // no navegador: só `--elevation-md` muda a sombra (`--shadow-md` não
            // move nada aqui), o separador é `--muted` e não `--border`, o raio
            // do item é `--radius-sm` e a camada é `--z-popover` — `z-50` era
            // nome de utilitária, não token.
            { token: '--popover',            value: '.nds-dropdown-menu-content',    description: t('tokens.table.popoverBg')        },
            { token: '--popover-foreground', value: '.nds-dropdown-menu-content',    description: t('tokens.table.popoverFg')        },
            { token: '--accent',             value: '.nds-dropdown-menu-item',       description: t('tokens.table.accentBg')         },
            { token: '--accent-foreground',  value: '.nds-dropdown-menu-item',       description: t('tokens.table.accentFg')         },
            { token: '--destructive',        value: '[data-variant="destructive"]',  description: t('tokens.table.destructive')      },
            { token: '--destructive',        value: '.nds-dropdown-menu-item[data-variant="destructive"]:focus', description: t('tokens.table.destructiveFocus') },
            { token: '--muted-foreground',   value: '.nds-dropdown-menu-shortcut',   description: t('tokens.table.mutedFg')          },
            { token: '--muted-foreground',   value: '.nds-dropdown-menu-label',      description: t('tokens.table.mutedFgLabel')     },
            { token: '--muted',              value: '.nds-dropdown-menu-separator',  description: t('tokens.table.border')           },
            { token: '--border',             value: '.nds-dropdown-menu-content',    description: t('tokens.table.popupBorder')      },
            { token: '--elevation-md',       value: '.nds-dropdown-menu-content',    description: t('tokens.table.shadow')           },
            { token: '--radius',             value: '.nds-dropdown-menu-content',    description: t('tokens.table.radius')           },
            { token: '--radius-sm',          value: '.nds-dropdown-menu-item',       description: t('tokens.table.radiusItem')       },
            { token: '--z-popover',          value: '.nds-dropdown-menu-positioner', description: t('tokens.table.zIndex')           },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          // Do conteúdo compartilhado, e não literal: o trecho que morava aqui
          // sobrescrevia os tokens do documento inteiro com os valores de uma
          // paleta que não é a do design system.
          customizationCode: t('tokens.customizationCode'),
        });
      }

      // ── 10. Acessibilidade ───────────────────────────────────────────────
      case 'acessibilidade':
        return createDocsAccessibility({
          screenReaderTitle: tNav('common.screenReader'),
          screenReaderItems: screenReaderItems(),
          title: t('accessibility.title'),
          summary: t('accessibility.summary'),
          items: [
            t('accessibility.warning'),
            t('accessibility.aria.roleMenu'),
            t('accessibility.aria.roleMenuItem'),
            t('accessibility.aria.roleMenuitemCheckbox'),
            t('accessibility.aria.roleMenuitemRadio'),
            t('accessibility.aria.ariaChecked'),
            t('accessibility.aria.ariaDisabled'),
            t('accessibility.aria.ariaHaspopup'),
            t('accessibility.aria.ariaExpanded'),
          ],
          // Chave PLANA do conteúdo, a mesma nas cinco stacks — cada uma lia o
          // título de um lugar diferente.
          keyboardTitle: t('accessibility.keyboardTitle'),
          keyboardItems: [
            { key: 'Right-click / Menu / Shift+F10', description: t('accessibility.keyboard.rightClick') },
            { key: 'Arrow Down',  description: t('accessibility.keyboard.arrowDown')  },
            { key: 'Arrow Up',    description: t('accessibility.keyboard.arrowUp')    },
            { key: 'Arrow Right', description: t('accessibility.keyboard.arrowRight') },
            { key: 'Arrow Left',  description: t('accessibility.keyboard.arrowLeft')  },
            { key: 'Home / End',  description: t('accessibility.keyboard.homeEnd')    },
            { key: 'A–Z',         description: t('accessibility.keyboard.typeahead')  },
            { key: 'Enter',       description: t('accessibility.keyboard.enter')      },
            { key: 'Space',       description: t('accessibility.keyboard.space')      },
            { key: 'Esc',         description: t('accessibility.keyboard.escape')     },
            { key: 'Tab',         description: t('accessibility.keyboard.tab')        },
          ],
        });

      // ── 11. Relacionados ─────────────────────────────────────────────────
      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: 'DropdownMenu', description: toPlainText(t('related.dropdownMenu')), path: '?path=/docs/components-overlay-dropdownmenu--docs'  },
            { name: 'Menubar',      description: toPlainText(t('related.menubar')),      path: '?path=/docs/components-navigation-menubar--docs'       },
            { name: 'Dialog',       description: toPlainText(t('related.dialog')),       path: '?path=/docs/components-overlay-dialog--docs'        },
            { name: 'AlertDialog',  description: toPlainText(t('related.alertDialog')),  path: '?path=/docs/components-overlay-alertdialog--docs'   },
            { name: 'Tooltip',      description: toPlainText(t('related.tooltip')),      path: '?path=/docs/components-overlay-tooltip--docs'       },
          ],
        });

      // ── 12. Notas ────────────────────────────────────────────────────────
      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [
            { title: '', content: t('notes.tip1') },
            { title: '', content: t('notes.tip2') },
            { title: '', content: t('notes.tip3') },
            { title: '', content: t('notes.tip4') },
            { title: '', content: t('notes.tip5') },
          ],
        });

      // ── 13. Analytics ────────────────────────────────────────────────────
      case 'analytics':
        return createDocsAnalytics({
          title: t('analytics.title'),
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

      // ── 14. Testes ───────────────────────────────────────────────────────
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
            items: entriesFromDict(t, 'testes.functional', ['action', 'result', 'priority'])
              .map(entry => ({ ...entry, priority: priorityLabel(entry.priority) })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            cols: {
              criterion: tNav('common.criterion'),
              level:     'WCAG',
              how:       tNav('common.howToVerify'),
            },
            items: stringsFromDict(t, 'testes.accessibility').map((criterion, i) => ({
              criterion,
              level:     A11Y_TEST_LEVELS[i] ?? 'AA',
              how:       A11Y_TEST_HOW[i] ?? 'axe-core',
            })),
          },
          visual: {
            title: t('testes.visual.title'),
            cols: {
              story:    tNav('common.storyState'),
              priority: tNav('common.priority'),
            },
            items: entriesFromDict(t, 'testes.visual', ['story', 'priority'])
              .map(entry => ({ ...entry, priority: priorityLabel(entry.priority) })),
          },
        });
      }
    }
  }

  // ── Render all sections ────────────────────────────────────────────────────

  function renderAllSections() {
    for (const id of sectionOrder) {
      const fresh    = buildSection(id);
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

  // ── IntersectionObserver ──────────────────────────────────────────────────

  let activeSectionObserver: { disconnect: () => void } | null = null;

  function attachObserver() {
    activeSectionObserver?.disconnect();
    activeSectionObserver = createActiveSectionObserver(
      sectionOrder as unknown as string[],
      (id) => sectionEls[id as keyof typeof sectionEls] ?? null,
      (id) => updateActiveNav(id),
      (id) => track('docs_section_viewed', {
        section_id: id,
        component_name: 'context-menu',
        locale: getLocale(),
      }),
    );
  }
  cleanups.push(() => activeSectionObserver?.disconnect());

  // ── Initial render ─────────────────────────────────────────────────────────

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
