<script setup lang="ts">
import { computed, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import type { DropdownMenuCloseReason } from '@/components/ui/dropdown-menu';
import {
  dropdownMenuSnippet,
  type DropdownMenuSnippetAction,
  type DropdownMenuSnippetEntry,
} from '@/components/ui/dropdown-menu/dropdown-menu.source';
import DropdownMenuPreview from '@/components/docs/DropdownMenuPreview.vue';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import componentTranslations from '@shared/content/dropdown-menu/translations.json';
import uiTranslations from '@/i18n/ui.json';

import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.vue';
import DocsDemonstration from '@/components/docs/shared/sections/DocsDemonstration.vue';
import DocsAnatomy       from '@/components/docs/shared/sections/DocsAnatomy.vue';
import DocsWhenToUse     from '@/components/docs/shared/sections/DocsWhenToUse.vue';
import DocsDoDont        from '@/components/docs/shared/sections/DocsDoDont.vue';
import DocsImport        from '@/components/docs/shared/sections/DocsImport.vue';
import DocsCompositions  from '@/components/docs/shared/sections/DocsCompositions.vue';
import DocsStates        from '@/components/docs/shared/sections/DocsStates.vue';
import DocsProps         from '@/components/docs/shared/sections/DocsProps.vue';
import DocsTokens        from '@/components/docs/shared/sections/DocsTokens.vue';
import DocsAccessibility from '@/components/docs/shared/sections/DocsAccessibility.vue';
import DocsRelated       from '@/components/docs/shared/sections/DocsRelated.vue';
import DocsNotes         from '@/components/docs/shared/sections/DocsNotes.vue';
import DocsAnalytics     from '@/components/docs/shared/sections/DocsAnalytics.vue';
import DocsTestes        from '@/components/docs/shared/sections/DocsTestes.vue';
import { stripHtml, toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tContent, locale } = useTranslation(componentTranslations);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
// O `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
const screenReaderItems = computed(() =>
  Object.entries(
    (componentTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >)[locale.value]?.accessibility?.screenReader ?? {},
  )
    .filter(([key]) => key !== 'title')
    .map(([, value]) => value),
);
const { t: tNav } = useTranslation(uiTranslations);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function localPriority(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

/**
 * Varre `base.item1`, `base.item2`, … enquanto existirem no conteúdo.
 *
 * Contar à mão (`[1, 2, 3].map(...)`) trava a lista no tamanho de hoje: o
 * conteúdo compartilhado ganha um item e ele simplesmente não existe para quem
 * lê — sem erro, sem aviso, nos três idiomas de uma vez. Foi o que aconteceu
 * com o sétimo critério de acessibilidade deste componente, e de novo com os
 * critérios funcionais: a página parava no oitavo e o conteúdo já tinha catorze.
 */
function stringsFromDict(
  t: (key: string, defaultValue?: string) => string,
  base: string,
): string[] {
  const out: string[] = [];
  for (let i = 1; ; i++) {
    const value = t(`${base}.item${i}`, '');
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
  t: (key: string, defaultValue?: string) => string,
  base: string,
  fields: readonly K[],
): Array<Record<K, string>> {
  const out: Array<Record<K, string>> = [];
  for (let i = 1; ; i++) {
    if (!t(`${base}.item${i}.${fields[0]}`, '')) break;
    out.push(
      Object.fromEntries(
        fields.map((field) => [field, t(`${base}.item${i}.${field}`, '')]),
      ) as Record<K, string>,
    );
  }
  return out;
}

// ─── Analytics — menus vivos ──────────────────────────────────────────────────

// Demonstração, Variantes e Do & Don't renderizam o componente VIVO, e abrir,
// escolher e fechar ali é tão real quanto num app — por isso as três seções
// disparam os três eventos, cada uma com a SUA `location`, que vem do CHAMADOR.
//
// `menu` e `label` são IDENTIFICADORES em inglês, nunca o rótulo traduzido:
// texto localizado partiria o mesmo evento em um valor por idioma no GA4 —
// "Configurações", "Settings" e "Configuración" chegariam como três ações.
// `menu` é o id da prévia; na Demonstração, que tem quatro menus, o id da
// prévia seguido da chave do gatilho (`demo-account`, `demo-columns`…).
// `label` é a chave do item em `demonstration.labels`, em kebab-case.
type DocsLocation = 'docs_demo' | 'docs_variantes' | 'docs_do_dont';

/**
 * Os dois ouvintes de UMA prévia: abrir e fechar, e escolher um item.
 *
 * O fechamento leva o motivo que a raiz desta stack entrega em `update:open`
 * (`escape`, `overlay` ou `api`). O `?? 'api'` só cobre o tipo: a raiz sempre o
 * manda ao fechar. A escolha leva o `value` da entrada — o id estável que a
 * lista de entradas carrega, e não o rótulo traduzido. Marcar e escolher rádio
 * também chegam aqui, e não fecham (C10).
 */
function trackMenu(menu: string, location: DocsLocation) {
  return {
    openChange(open: boolean, reason?: DropdownMenuCloseReason) {
      if (open) {
        track('dropdown_menu_open', { component: 'dropdown-menu', menu, location });
        return;
      }
      track('dropdown_menu_close', {
        component: 'dropdown-menu',
        menu,
        reason: reason ?? 'api',
        location,
      });
    },
    select(label: string) {
      track('dropdown_menu_item_select', { component: 'dropdown-menu', menu, label, location });
    },
  };
}

// Um par de ouvintes por prévia, criado uma vez: o template recebe as FUNÇÕES,
// e não uma chamada que as devolveria a cada evento sem nunca executá-las.
const tracked = {
  demoAccount:       trackMenu('demo-account', 'docs_demo'),
  demoColumns:       trackMenu('demo-columns', 'docs_demo'),
  demoTheme:         trackMenu('demo-theme', 'docs_demo'),
  demoFile:          trackMenu('demo-file', 'docs_demo'),
  pair1Do:           trackMenu('pair1-do', 'docs_do_dont'),
  pair1Dont:         trackMenu('pair1-dont', 'docs_do_dont'),
  pair2Do:           trackMenu('pair2-do', 'docs_do_dont'),
  pair2Dont:         trackMenu('pair2-dont', 'docs_do_dont'),
  default:           trackMenu('default', 'docs_variantes'),
  destructive:       trackMenu('destructive', 'docs_variantes'),
  withLabel:         trackMenu('with-label', 'docs_variantes'),
  withCheckboxItems: trackMenu('with-checkbox-items', 'docs_variantes'),
  withRadioGroup:    trackMenu('with-radio-group', 'docs_variantes'),
  withShortcuts:     trackMenu('with-shortcuts', 'docs_variantes'),
};

/** Os dez itens planos do "evite" do par 1 — o número da legenda. */
const PAIR1_DONT_ACTIONS = 10;

// ─── Os menus como dado ───────────────────────────────────────────────────────
//
// Toda prévia viva desta página é uma LISTA de entradas, e é a mesma lista que
// imprime o código do card de Variantes (`dropdownMenuSnippet`) — o código
// mostra o que a prévia desenha, no idioma de quem lê e com o estado com que
// ela abre. Até 2026-09-11 cada card levava um literal de código em português
// nos três idiomas, sem os `ref` das marcações que ele ligava.
//
// O `value` de cada entrada é o id ESTÁVEL: o `label` do evento de escolha e,
// nas marcações e na escolha única, o nome do `ref` no código.

type MenuData = { trigger: string; entries: DropdownMenuSnippetEntry[] };

const menus = computed(() => {
  const action = (
    label: string,
    value: string,
    extra: Pick<DropdownMenuSnippetAction, 'shortcut' | 'destructive'> = {},
  ): DropdownMenuSnippetAction => ({ kind: 'item', label, value, ...extra });
  const separator: DropdownMenuSnippetEntry = { kind: 'separator' };

  const account = tContent('demonstration.labels.account');
  const profile = action(tContent('demonstration.labels.profile'), 'profile');
  const settings = action(tContent('demonstration.labels.settings'), 'settings');
  const logout = action(tContent('demonstration.labels.logout'), 'logout');
  const rename = action(tContent('demonstration.labels.rename'), 'rename');
  const deleteAccount = action(tContent('demonstration.labels.deleteAccount'), 'delete-account');
  // `Group` em volta do rótulo é o que faz o rótulo NOMEAR o bloco: o primitivo
  // liga o `aria-labelledby` do grupo ao texto do `Label`. Um `Label` solto
  // rotula visualmente e não nomeia nada.
  const accountGroup: DropdownMenuSnippetEntry = { kind: 'group', label: account, items: [profile, settings] };
  const supportGroup: DropdownMenuSnippetEntry = {
    kind: 'group',
    label: tContent('demonstration.labels.support'),
    items: [action(tContent('demonstration.labels.documentation'), 'documentation'), logout],
  };
  const actionLabel = tContent('demonstration.labels.action');

  return {
    // Grupo nomeado, divisor e a saída destrutiva — a anatomia do componente.
    account: {
      trigger: account,
      entries: [accountGroup, separator, { ...logout, destructive: true }],
    },
    columns: {
      trigger: tContent('demonstration.labels.columns'),
      entries: [
        {
          kind: 'group',
          label: tContent('demonstration.labels.visibleColumns'),
          items: [
            { kind: 'checkbox', label: tContent('demonstration.labels.columnName'), value: 'column-name', checked: true },
            { kind: 'checkbox', label: tContent('demonstration.labels.columnEmail'), value: 'column-email', checked: false },
            { kind: 'checkbox', label: tContent('demonstration.labels.columnRole'), value: 'column-role', checked: false },
          ],
        },
      ],
    },
    // UM grupo só, o de escolha única, com o rótulo DENTRO dele: fora, o grupo
    // fica sem nome acessível e o rótulo vira texto solto no meio do menu.
    theme: {
      trigger: tContent('demonstration.labels.theme'),
      entries: [
        {
          kind: 'radio-group',
          label: tContent('demonstration.labels.appearance'),
          value: 'theme',
          selected: 'light',
          options: [
            { label: tContent('demonstration.labels.light'), value: 'light' },
            { label: tContent('demonstration.labels.dark'), value: 'dark' },
            { label: tContent('demonstration.labels.system'), value: 'system' },
          ],
        },
      ],
    },
    // O sub-gatilho não tem ação própria: ele abre o painel filho, e é lá que
    // estão os itens que a pessoa veio escolher.
    file: {
      trigger: tContent('demonstration.labels.file'),
      entries: [
        rename,
        {
          kind: 'submenu',
          label: tContent('demonstration.labels.export'),
          items: [
            action(tContent('demonstration.labels.pdf'), 'pdf'),
            action(tContent('demonstration.labels.csv'), 'csv'),
          ],
        },
      ],
    },
    // Dois grupos rotulados e o separador entre eles.
    accountSupport: {
      trigger: account,
      entries: [accountGroup, separator, supportGroup],
    },
    // Dez itens planos, que é o número da legenda: com sete a lista ainda
    // parece curta, e o "vira lista de scroll" não aparece. O número vai no
    // texto e no id (`action-1` … `action-10`): o conteúdo não interpola, e o
    // rótulo é um só.
    actions: {
      trigger: tContent('demonstration.labels.menu'),
      entries: Array.from({ length: PAIR1_DONT_ACTIONS }, (_, i) =>
        action(`${actionLabel} ${i + 1}`, `action-${i + 1}`),
      ),
    },
    destructive: {
      trigger: account,
      entries: [rename, separator, { ...deleteAccount, destructive: true }],
    },
    // Os mesmos itens do "faça" do par 2, sem a variante: é só ela que muda.
    destructivePlain: {
      trigger: account,
      entries: [rename, separator, deleteAccount],
    },
    shortcuts: {
      trigger: tContent('demonstration.labels.edit'),
      entries: [
        action(tContent('demonstration.labels.undo'), 'undo', { shortcut: tContent('demonstration.labels.undoShortcut') }),
        action(tContent('demonstration.labels.copy'), 'copy', { shortcut: tContent('demonstration.labels.copyShortcut') }),
        separator,
        action(tContent('demonstration.labels.paste'), 'paste', { shortcut: tContent('demonstration.labels.pasteShortcut') }),
      ],
    },
  } satisfies Record<string, MenuData>;
});

/** O código de um card: o trecho que a MESMA lista da prévia imprime. */
function menuCode(menu: MenuData): string {
  return dropdownMenuSnippet({ triggerLabel: menu.trigger, entries: menu.entries });
}

// ─── SEO & GEO ────────────────────────────────────────────────────────────────

useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: 'dropdown-menu',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
  breadcrumb: [
    { name: 'Components', item: '/components' },
    { name: 'Overlay', item: '/components/overlay' },
    { name: 'DropdownMenu' },
  ],
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'dropdown-menu',
    locale: newLocale as 'pt-BR' | 'en' | 'es',
    page_title: `${tContent('title')} · Design System`,
  });
}, { immediate: true });

// ─── Analytics — section view ─────────────────────────────────────────────────

// ─── Navigation groups ────────────────────────────────────────────────────────

const navGroups = computed(() => [
  {
    label: tNav('nav.overview'),
    sections: [
      { id: 'demonstracao', label: tNav('nav.demonstration') },
      { id: 'anatomia',     label: tNav('nav.anatomy')       },
      { id: 'quando-usar',  label: tNav('nav.usage')         },
      { id: 'do-dont',      label: tNav('nav.doDont')        },
    ],
  },
  {
    label: tNav('nav.techRef'),
    sections: [
      { id: 'importacao',   label: tNav('nav.import')   },
      { id: 'variantes',    label: tNav('nav.variants') },
      { id: 'estados',      label: tNav('nav.states')   },
      { id: 'propriedades', label: tNav('nav.props')    },
      { id: 'tokens',       label: tNav('nav.tokens')   },
    ],
  },
  {
    label: tNav('nav.context'),
    sections: [
      { id: 'acessibilidade', label: tNav('nav.accessibility') },
      { id: 'relacionados',   label: tNav('nav.related')       },
      { id: 'notas',          label: tNav('nav.notes')         },
    ],
  },
  {
    label: tNav('nav.quality'),
    sections: [
      { id: 'analytics', label: tNav('nav.analytics') },
      { id: 'testes',    label: tNav('nav.testes')    },
    ],
  },
]);

const allSectionIds = computed(() => navGroups.value.flatMap((g) => g.sections.map((s) => s.id)));

const { activeId: activeSection } = useActiveSection(allSectionIds, (id) => {
  track('docs_section_viewed', {
    section_id: id,
    component_name: 'dropdown-menu',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";`;

// O código de cada card de Variantes NÃO mora aqui: sai de `dropdownMenuSnippet`
// com a mesma lista que monta a prévia (`menuCode`), no idioma da página.

// A API desta stack: `@update:open` traz o motivo do fechamento como segundo
// argumento, e o item de marcação liga por `v-model` (o `modelValue` da peça).
const interfaceCode = `// DropdownMenu (root)
interface DropdownMenuRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  modal?: boolean;
}
// @update:open → (open: boolean, reason?: 'escape' | 'overlay' | 'api')

// DropdownMenuContent
interface DropdownMenuContentProps {
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  alignOffset?: number;
}

// DropdownMenuItem
interface DropdownMenuItemProps {
  variant?: 'default' | 'destructive';
  inset?: boolean;
  disabled?: boolean;
}
// @select → (event: Event)

// DropdownMenuCheckboxItem
interface DropdownMenuCheckboxItemProps {
  modelValue?: boolean | 'indeterminate'; // v-model
  disabled?: boolean;
}`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyStructure = computed(() => tContent('anatomy.structureCode'));

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
  tContent('anatomy.item4'),
  tContent('anatomy.item5'),
  tContent('anatomy.item6'),
  tContent('anatomy.item7'),
  tContent('anatomy.item8'),
  tContent('anatomy.item9'),
]);

// A ordem é a dos slots `variant-preview-{i}` do template.
const variantItems = computed(() => [
  { trackId: 'default', name: tContent('variants.items.default'),     description: stripHtml(tContent('variants.styles.default')),     code: menuCode(menus.value.account) },
  { trackId: 'destructive', name: tContent('variants.items.destructive'), description: stripHtml(tContent('variants.styles.destructive')), code: menuCode(menus.value.destructive) },
  {
    trackId: 'withLabel',
    name: tContent('variants.items.withLabel.name'),
    description: tContent('variants.items.withLabel.description'),
    useWhen: tContent('variants.items.withLabel.use'),
    code: menuCode(menus.value.accountSupport),
  },
  {
    trackId: 'withCheckboxItems',
    name: tContent('variants.items.withCheckboxItems.name'),
    description: tContent('variants.items.withCheckboxItems.description'),
    useWhen: tContent('variants.items.withCheckboxItems.use'),
    code: menuCode(menus.value.columns),
  },
  {
    trackId: 'withRadioGroup',
    name: tContent('variants.items.withRadioGroup.name'),
    description: tContent('variants.items.withRadioGroup.description'),
    useWhen: tContent('variants.items.withRadioGroup.use'),
    code: menuCode(menus.value.theme),
  },
  {
    trackId: 'withShortcuts',
    name: tContent('variants.items.withShortcuts.name'),
    description: tContent('variants.items.withShortcuts.description'),
    useWhen: tContent('variants.items.withShortcuts.use'),
    code: menuCode(menus.value.shortcuts),
  },
]);

const stateItems = computed(() => [
  { label: tContent('states.closed.label'),   trigger: toPlainText(tContent('states.closed.trigger')),   behavior: toPlainText(tContent('states.closed.behavior')) },
  { label: tContent('states.open.label'),     trigger: toPlainText(tContent('states.open.trigger')),     behavior: toPlainText(tContent('states.open.behavior')) },
  { label: tContent('states.disabled.label'), trigger: toPlainText(tContent('states.disabled.trigger')), behavior: toPlainText(tContent('states.disabled.behavior')) },
  { label: tContent('states.checked.label'),  trigger: toPlainText(tContent('states.checked.trigger')),  behavior: toPlainText(tContent('states.checked.behavior')) },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const dropdownPropItems = computed(() => [
  { name: 'open',          type: tContent('props.table.open.type'),         defaultValue: tContent('props.table.open.default'),         required: tContent('props.table.open.required'),         description: toPlainText(tContent('props.table.open.description'))         },
  // O evento com o nome que se escreve nesta stack, e com o motivo que a raiz
  // entrega no fechamento — o tipo do conteúdo compartilhado não o tem.
  { name: '@update:open', type: "(open: boolean, reason?: 'escape' | 'overlay' | 'api') => void", defaultValue: tContent('props.table.onOpenChange.default'), required: tContent('props.table.onOpenChange.required'), description: toPlainText(tContent('props.table.onOpenChange.description')) },
  { name: 'defaultOpen',   type: tContent('props.table.defaultOpen.type'),  defaultValue: tContent('props.table.defaultOpen.default'),  required: tContent('props.table.defaultOpen.required'),  description: toPlainText(tContent('props.table.defaultOpen.description'))  },
  { name: 'modal',         type: tContent('props.table.modal.type'),        defaultValue: tContent('props.table.modal.default'),        required: tContent('props.table.modal.required'),        description: toPlainText(tContent('props.table.modal.description'))        },
  { name: 'side',          type: tContent('props.table.side.type'),         defaultValue: tContent('props.table.side.default'),         required: tContent('props.table.side.required'),         description: toPlainText(tContent('props.table.side.description'))         },
  { name: 'align',         type: tContent('props.table.align.type'),        defaultValue: tContent('props.table.align.default'),        required: tContent('props.table.align.required'),        description: toPlainText(tContent('props.table.align.description'))        },
]);

const tokenRows = computed(() => [
  { token: '--popover',            value: tContent('tokens.table.background.class'),  description: tContent('tokens.table.background.part')  },
  { token: '--popover-foreground', value: tContent('tokens.table.foreground.class'),  description: tContent('tokens.table.foreground.part')  },
  { token: '--border',             value: tContent('tokens.table.border.class'),      description: tContent('tokens.table.border.part')      },
  { token: '--elevation-md',             value: tContent('tokens.table.shadow.class'),      description: tContent('tokens.table.shadow.part')      },
  { token: '--radius',          value: tContent('tokens.table.rounded.class'),     description: tContent('tokens.table.rounded.part')     },
  { token: '--accent',             value: tContent('tokens.table.itemHover.class'),   description: tContent('tokens.table.itemHover.part')   },
  { token: '--destructive',        value: tContent('tokens.table.destructive.class'), description: tContent('tokens.table.destructive.part') },
]);

const accessibilityItems = computed(() => [
  tContent('accessibility.items.item1'),
  tContent('accessibility.items.item2'),
  tContent('accessibility.items.item3'),
  tContent('accessibility.items.item4'),
  tContent('accessibility.items.item5'),
  tContent('accessibility.items.item6'),
]);

const keyboardItems = computed(() => [
  { key: 'Tab',                  description: toPlainText(tContent('accessibility.keyboard.tab'))       },
  { key: 'Arrow Up / Arrow Down / Arrow Left / Arrow Right',        description: toPlainText(tContent('accessibility.keyboard.arrows'))    },
  { key: 'Enter / Space',        description: toPlainText(tContent('accessibility.keyboard.enter'))     },
  { key: 'Escape',               description: toPlainText(tContent('accessibility.keyboard.escape'))    },
  { key: 'Home / End',           description: toPlainText(tContent('accessibility.keyboard.homeEnd'))   },
  { key: 'A–Z',                  description: toPlainText(tContent('accessibility.keyboard.typeahead')) },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.contextMenu.name'), description: toPlainText(tContent('related.items.contextMenu.description')), path: '?path=/docs/components-overlay-contextmenu--docs' },
  { name: tContent('related.items.menubar.name'),     description: toPlainText(tContent('related.items.menubar.description')),     path: '?path=/docs/components-navigation-menubar--docs'     },
  { name: tContent('related.items.command.name'),     description: toPlainText(tContent('related.items.command.description')),     path: '?path=/docs/components-overlay-command--docs'     },
  { name: tContent('related.items.popover.name'),     description: toPlainText(tContent('related.items.popover.description')),     path: '?path=/docs/components-overlay-popover--docs'     },
  { name: tContent('related.items.select.name'),      description: toPlainText(tContent('related.items.select.description')),      path: '?path=/docs/components-form-select--docs'      },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
  { title: '', content: tContent('notes.item5') },
]);

// A tabela sai do conteúdo compartilhado, como a do ContextMenu: linha cravada
// aqui ensinava um payload que o código já não mandava.
const analyticsItems = computed(() => [
  { event: tContent('analytics.table.menuOpen'),      trigger: toPlainText(tContent('analytics.table.menuOpenTrigger')),      payload: tContent('analytics.table.menuOpenPayload')      },
  { event: tContent('analytics.table.itemClick'),     trigger: toPlainText(tContent('analytics.table.itemClickTrigger')),     payload: tContent('analytics.table.itemClickPayload')     },
  { event: tContent('analytics.table.close'),         trigger: toPlainText(tContent('analytics.table.closeTrigger')),         payload: tContent('analytics.table.closePayload')         },
  { event: tContent('analytics.table.pageView'),      trigger: toPlainText(tContent('analytics.table.pageViewTrigger')),      payload: tContent('analytics.table.pageViewPayload')      },
  { event: tContent('analytics.table.sectionViewed'), trigger: toPlainText(tContent('analytics.table.sectionViewedTrigger')), payload: tContent('analytics.table.sectionViewedPayload') },
  { event: tContent('analytics.table.langSwitch'),    trigger: toPlainText(tContent('analytics.table.langSwitchTrigger')),    payload: tContent('analytics.table.langSwitchPayload')    },
]);

const functionalTestItems = computed(() =>
  entriesFromDict(tContent, 'testes.functional', ['action', 'result', 'priority']).map((entry) => ({
    action: toPlainText(entry.action),
    result: toPlainText(entry.result),
    priority: localPriority(entry.priority),
  })),
);

// Nível WCAG e forma de verificar ficam aqui, e não no conteúdo compartilhado,
// porque são IDENTIFICADORES (número de critério, consulta da suíte, regra do
// axe) e identificador não se traduz. A coluna "como verificar" dizia "DOM
// inspection" e "Keyboard test" — frase em inglês, igual nos três idiomas; agora
// diz a consulta ou a regra que de fato mede o critério, como no ContextMenu.
// Item novo além da lista cai no par padrão em vez de sumir.
const a11yTestLevels = ['AA', '4.1.2 · A', '4.1.2 · A', '4.1.2 · A', '2.4.3 · A', '1.4.3 · AA', '2.1.1 · A'];
const a11yTestHow = [
  'axe-core',
  'aria-haspopup · aria-expanded',
  "getByRole('menu')",
  "getAllByRole('menuitem' | 'menuitemcheckbox' | 'menuitemradio')",
  'Escape · document.activeElement',
  'axe-core · color-contrast',
  'ArrowDown · document.activeElement',
];

const a11yTestItems = computed(() =>
  stringsFromDict(tContent, 'testes.accessibility').map((criterion, i) => ({
    criterion: toPlainText(criterion),
    level: a11yTestLevels[i] ?? 'AA',
    how: a11yTestHow[i] ?? 'axe-core',
  })),
);

const visualTestItems = computed(() =>
  entriesFromDict(tContent, 'testes.visual', ['story', 'priority']).map((entry) => ({
    story: entry.story,
    priority: localPriority(entry.priority),
  })),
);

const a11yCritCols = computed(() => ({
  criterion: tNav('common.criterion'),
  level: 'WCAG',
  how: tNav('common.howToVerify'),
}));
</script>

<template>
  <DocsPageLayout
    :nav-groups="navGroups"
    :active-section="activeSection"
    component-slug="dropdown-menu"
  >
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
      />
    </template>

    <!-- ── Demonstração ─────────────────────────────────────────── -->
    <!--
      Quatro células, cada uma com a legenda do conteúdo compartilhado em cima e
      o menu embaixo — a forma do vanilla, que é a referência. A legenda diz o
      que a célula DEMONSTRA; o gatilho diz o que o menu É. Até 2026-09-11 esta
      página usava a legenda como texto do gatilho ("Menu de ações"), e o gatilho
      mentia sobre o que abria.
    -->
    <DocsDemonstration>
      <div
        class="nds-grid nds-w-full nds-min-h-40"
        data-spacing="md"
        style="contain: layout; --grid-min: 9rem"
      >
        <div
          class="nds-stack nds-min-h-20"
          data-spacing="sm"
          style="contain: layout"
        >
          <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">
            {{ tContent('demonstration.labels.basic') }}
          </p>
          <DropdownMenuPreview
            :trigger="menus.account.trigger"
            :entries="menus.account.entries"
            @update:open="tracked.demoAccount.openChange"
            @select="tracked.demoAccount.select"
          />
        </div>

        <div
          class="nds-stack nds-min-h-20"
          data-spacing="sm"
          style="contain: layout"
        >
          <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">
            {{ tContent('demonstration.labels.withCheckbox') }}
          </p>
          <DropdownMenuPreview
            :trigger="menus.columns.trigger"
            :entries="menus.columns.entries"
            @update:open="tracked.demoColumns.openChange"
            @select="tracked.demoColumns.select"
          />
        </div>

        <div
          class="nds-stack nds-min-h-20"
          data-spacing="sm"
          style="contain: layout"
        >
          <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">
            {{ tContent('demonstration.labels.withRadio') }}
          </p>
          <DropdownMenuPreview
            :trigger="menus.theme.trigger"
            :entries="menus.theme.entries"
            @update:open="tracked.demoTheme.openChange"
            @select="tracked.demoTheme.select"
          />
        </div>

        <div
          class="nds-stack nds-min-h-20"
          data-spacing="sm"
          style="contain: layout"
        >
          <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">
            {{ tContent('demonstration.labels.withSubmenu') }}
          </p>
          <DropdownMenuPreview
            :trigger="menus.file.trigger"
            :entries="menus.file.entries"
            @update:open="tracked.demoFile.openChange"
            @select="tracked.demoFile.select"
          />
        </div>
      </div>
    </DocsDemonstration>

    <!-- ── Anatomia ─────────────────────────────────────────────── -->
    <DocsAnatomy
      :items="anatomyItems"
      :structure-label="tContent('anatomy.structureLabel')"
      :structure-code="anatomyStructure"
    />

    <!-- ── Quando Usar ──────────────────────────────────────────── -->
    <DocsWhenToUse
      :guidelines="{
        title: tContent('usage.guidelines.title'),
        items: [
          stripHtml(tContent('usage.guidelines.item1')),
          stripHtml(tContent('usage.guidelines.item2')),
          stripHtml(tContent('usage.guidelines.item3')),
          stripHtml(tContent('usage.guidelines.item4')),
          stripHtml(tContent('usage.guidelines.item5')),
        ],
      }"
      :scenarios="{
        title: tContent('usage.scenarios.title'),
        cols: {
          scenario: tContent('usage.scenarios.cols.scenario'),
          use: tContent('usage.scenarios.cols.use'),
          alternative: tContent('usage.scenarios.cols.alternative'),
        },
        items: [
          { s: tContent('usage.scenarios.item1.s'), u: tContent('usage.scenarios.item1.u'), a: tContent('usage.scenarios.item1.a') },
          { s: tContent('usage.scenarios.item2.s'), u: tContent('usage.scenarios.item2.u'), a: tContent('usage.scenarios.item2.a') },
          { s: tContent('usage.scenarios.item3.s'), u: tContent('usage.scenarios.item3.u'), a: tContent('usage.scenarios.item3.a') },
          { s: tContent('usage.scenarios.item4.s'), u: tContent('usage.scenarios.item4.u'), a: tContent('usage.scenarios.item4.a') },
          { s: tContent('usage.scenarios.item5.s'), u: tContent('usage.scenarios.item5.u'), a: tContent('usage.scenarios.item5.a') },
        ],
      }"
      :ux-writing="{
        title: tContent('usage.uxWriting.title'),
        cols: {
          element: tContent('usage.uxWriting.table.element'),
          rules: tContent('usage.uxWriting.table.rules'),
          do: tContent('usage.uxWriting.table.correct'),
          dont: tContent('usage.uxWriting.table.avoid'),
        },
        items: [
          { element: tContent('usage.uxWriting.table.trigger.name'), rules: tContent('usage.uxWriting.table.trigger.format'), do: tContent('usage.uxWriting.table.trigger.good'), dont: tContent('usage.uxWriting.table.trigger.bad') },
          { element: tContent('usage.uxWriting.table.label.name'), rules: tContent('usage.uxWriting.table.label.format'), do: tContent('usage.uxWriting.table.label.good'), dont: tContent('usage.uxWriting.table.label.bad') },
          { element: tContent('usage.uxWriting.table.item.name'), rules: tContent('usage.uxWriting.table.item.format'), do: tContent('usage.uxWriting.table.item.good'), dont: tContent('usage.uxWriting.table.item.bad') },
          { element: tContent('usage.uxWriting.table.destructive.name'), rules: tContent('usage.uxWriting.table.destructive.format'), do: tContent('usage.uxWriting.table.destructive.good'), dont: tContent('usage.uxWriting.table.destructive.bad') },
        ],
      }"
      :do="{
        title: tContent('usage.do.title'),
        items: [
          tContent('usage.do.item1'),
          tContent('usage.do.item2'),
          tContent('usage.do.item3'),
          tContent('usage.do.item4'),
        ],
      }"
      :dont="{
        title: tContent('usage.dont.title'),
        items: [
          tContent('usage.dont.item1'),
          tContent('usage.dont.item2'),
          tContent('usage.dont.item3'),
          tContent('usage.dont.item4'),
        ],
      }"
    />

    <!-- ── Do & Don't ───────────────────────────────────────────── -->
    <DocsDoDont
      :pairs="[
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair1.do')), dontCaption: toPlainText(tContent('doDont.pair1.dont')) },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair2.do')), dontCaption: toPlainText(tContent('doDont.pair2.dont')) },
      ]"
    >
      <template #do-preview-0>
        <div
          style="contain: layout"
          class="nds-w-full nds-min-h-60"
        >
          <!-- Dois grupos rotulados e o separador entre eles: o que a legenda diz. -->
          <DropdownMenuPreview
            :trigger="menus.accountSupport.trigger"
            :entries="menus.accountSupport.entries"
            size="sm"
            @update:open="tracked.pair1Do.openChange"
            @select="tracked.pair1Do.select"
          />
        </div>
      </template>
      <template #dont-preview-0>
        <div
          style="contain: layout"
          class="nds-w-full nds-min-h-60"
        >
          <!-- Dez itens planos, sem grupo nem separador: a lista que vira rolagem. -->
          <DropdownMenuPreview
            :trigger="menus.actions.trigger"
            :entries="menus.actions.entries"
            size="sm"
            @update:open="tracked.pair1Dont.openChange"
            @select="tracked.pair1Dont.select"
          />
        </div>
      </template>
      <template #do-preview-1>
        <div
          style="contain: layout"
          class="nds-w-full nds-min-h-50"
        >
          <DropdownMenuPreview
            :trigger="menus.destructive.trigger"
            :entries="menus.destructive.entries"
            size="sm"
            @update:open="tracked.pair2Do.openChange"
            @select="tracked.pair2Do.select"
          />
        </div>
      </template>
      <template #dont-preview-1>
        <div
          style="contain: layout"
          class="nds-w-full nds-min-h-50"
        >
          <!-- Os mesmos itens do "faça", sem a variante: é só ela que muda. -->
          <DropdownMenuPreview
            :trigger="menus.destructivePlain.trigger"
            :entries="menus.destructivePlain.entries"
            size="sm"
            @update:open="tracked.pair2Dont.openChange"
            @select="tracked.pair2Dont.select"
          />
        </div>
      </template>
    </DocsDoDont>

    <!-- ── Importação ───────────────────────────────────────────── -->
    <DocsImport
      :code="codeImportBasic"
    />

    <!-- ── Variantes ────────────────────────────────────────────── -->
    <!--
      Cada prévia recebe a MESMA lista que imprime o código do card (`menuCode`
      em `variantItems`): o que se copia é o que se vê, no idioma da página.
    -->
    <DocsCompositions
      id="variantes"
      :items="variantItems"
      :use-when-label="tNav('common.useWhen')"
      component-slug="dropdown-menu"
    >
      <template #variant-preview-0>
        <div
          style="contain: layout"
          class="nds-w-full nds-min-h-60"
        >
          <!-- Os itens da célula `demo-account`: o item neutro, com o destrutivo ao lado para contraste. -->
          <DropdownMenuPreview
            :trigger="menus.account.trigger"
            :entries="menus.account.entries"
            size="sm"
            @update:open="tracked.default.openChange"
            @select="tracked.default.select"
          />
        </div>
      </template>
      <template #variant-preview-1>
        <div
          style="contain: layout"
          class="nds-w-full nds-min-h-50"
        >
          <DropdownMenuPreview
            :trigger="menus.destructive.trigger"
            :entries="menus.destructive.entries"
            size="sm"
            @update:open="tracked.destructive.openChange"
            @select="tracked.destructive.select"
          />
        </div>
      </template>
      <template #variant-preview-2>
        <div
          style="contain: layout"
          class="nds-w-full nds-min-h-60"
        >
          <DropdownMenuPreview
            :trigger="menus.accountSupport.trigger"
            :entries="menus.accountSupport.entries"
            size="sm"
            @update:open="tracked.withLabel.openChange"
            @select="tracked.withLabel.select"
          />
        </div>
      </template>
      <template #variant-preview-3>
        <div
          style="contain: layout"
          class="nds-w-full nds-min-h-50"
        >
          <DropdownMenuPreview
            :trigger="menus.columns.trigger"
            :entries="menus.columns.entries"
            size="sm"
            @update:open="tracked.withCheckboxItems.openChange"
            @select="tracked.withCheckboxItems.select"
          />
        </div>
      </template>
      <template #variant-preview-4>
        <div
          style="contain: layout"
          class="nds-w-full nds-min-h-50"
        >
          <DropdownMenuPreview
            :trigger="menus.theme.trigger"
            :entries="menus.theme.entries"
            size="sm"
            @update:open="tracked.withRadioGroup.openChange"
            @select="tracked.withRadioGroup.select"
          />
        </div>
      </template>
      <template #variant-preview-5>
        <div
          style="contain: layout"
          class="nds-w-full nds-min-h-60"
        >
          <DropdownMenuPreview
            :trigger="menus.shortcuts.trigger"
            :entries="menus.shortcuts.entries"
            size="sm"
            @update:open="tracked.withShortcuts.openChange"
            @select="tracked.withShortcuts.select"
          />
        </div>
      </template>
    </DocsCompositions>

    <!-- ── Estados ──────────────────────────────────────────────── -->
    <DocsStates
      :cols="{
        state: tContent('states.cols.state'),
        trigger: toPlainText(tContent('states.cols.trigger')),
        behavior: toPlainText(tContent('states.cols.behavior')),
      }"
      :items="stateItems"
    />

    <!-- ── Propriedades ─────────────────────────────────────────── -->
    <DocsProps
      :tables="[
        { title: 'DropdownMenu', cols: propCols, items: dropdownPropItems },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-code="tContent('props.extensibilityCode')"
    />

    <!-- ── Tokens ───────────────────────────────────────────────── -->
    <DocsTokens
      :cols="{
        token: tContent('tokens.table.token'),
        value: tContent('tokens.table.class'),
        description: tContent('tokens.table.part'),
      }"
      :items="tokenRows"
      :customization-title="tContent('tokens.customizationTitle')"
      :customization-code="tContent('tokens.customizationCode')"
    />

    <!-- ── Acessibilidade ───────────────────────────────────────── -->
    <DocsAccessibility
      :screen-reader-title="tNav('common.screenReader')"
      :screen-reader-items="screenReaderItems"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-title="tContent('accessibility.keyboard.title')"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ─────────────────────────────────────────── -->
    <DocsRelated
      :items="relatedItems"
    />

    <!-- ── Notas ────────────────────────────────────────────────── -->
    <DocsNotes
      :items="noteItems"
    />

    <!-- ── Analytics ────────────────────────────────────────────── -->
    <DocsAnalytics
      :cols="{
        event: tContent('analytics.table.event'),
        trigger: toPlainText(tContent('analytics.table.trigger')),
        payload: tContent('analytics.table.payload'),
      }"
      :items="analyticsItems"
    />

    <!-- ── Testes ───────────────────────────────────────────────── -->
    <DocsTestes
      :functional="{
        title: tContent('testes.functional.title'),
        cols: { action: tNav('common.userAction'), result: tNav('common.expectedResult'), priority: tNav('common.priority') },
        items: functionalTestItems,
      }"
      :accessibility="{
        title: tContent('testes.accessibility.title'),
        cols: a11yCritCols,
        items: a11yTestItems,
      }"
      :visual="{
        title: tContent('testes.visual.title'),
        cols: { story: tNav('common.storyState'), priority: tNav('common.priority') },
        items: visualTestItems,
      }"
    />
  </DocsPageLayout>
</template>
