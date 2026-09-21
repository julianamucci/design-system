<script setup lang="ts">
import { computed, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import type { MenubarCloseReason } from '@/components/ui/menubar';
import {
  menubarSnippet,
  type MenubarSnippetAction,
  type MenubarSnippetEntry,
  type MenubarSnippetMenu,
} from '@/components/ui/menubar/menubar.source';
import MenubarPreview from '@/components/docs/MenubarPreview.vue';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import componentTranslations from '@shared/content/menubar/translations.json';
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
 * Citar índice por índice trava a lista no tamanho de hoje: o conteúdo
 * compartilhado ganha um item e ele simplesmente não existe para quem lê — sem
 * erro, sem aviso, nos três idiomas de uma vez. Foi o que aconteceu aqui: a
 * página parava no nono critério funcional e no sétimo de acessibilidade, com o
 * conteúdo já em dezesseis e oito.
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

// ─── Analytics — barras vivas ─────────────────────────────────────────────────

// Demonstração, Variantes e Do & Don't renderizam a barra VIVA, e abrir,
// escolher e fechar ali é tão real quanto num app — por isso as três seções
// disparam os três eventos, cada uma com a SUA `location`, que vem do CHAMADOR.
// Até 2026-09-11 esta página não rastreava nada, e a tabela de analytics
// prometia dois eventos — abertura de menu e atalho invocado — que não
// existiam.
//
// `menu` e `label` são IDENTIFICADORES em inglês, nunca o rótulo traduzido:
// "Salvar", "Save" e "Guardar" chegariam ao GA4 como três ações. Numa barra de
// um menu só, `menu` é o id da prévia; numa barra de vários, o id da prévia
// seguido do `value` do menu — que aqui é a chave do gatilho em
// `demonstration.labels` (`demo-file`, `pair1-do-edit`). `label` é a chave do
// item, em kebab-case.
type DocsLocation = 'docs_demo' | 'docs_variantes' | 'docs_do_dont';

/**
 * Os dois ouvintes de UMA barra. A barra desta stack emite o NOVO valor — o
 * menu aberto, ou `''` — e, quando um menu fecha, o motivo (`escape`, `overlay`
 * ou `api`). Quem guarda qual menu estava aberto é o ouvinte: fechar é sair do
 * valor anterior, e passar ao vizinho é fechar um e abrir o outro. O `?? 'api'`
 * só cobre o tipo: a barra sempre manda o motivo ao fechar.
 *
 * A escolha chega com o `value` do menu em que o item mora e o `value` da
 * entrada — o id estável, nunca o rótulo traduzido. Marcar e escolher rádio
 * também chegam aqui, e não fecham (C10).
 */
function trackMenubar(preview: string, location: DocsLocation, multiple: boolean) {
  let current = '';
  const menuId = (value: string) => (multiple ? `${preview}-${value}` : preview);
  return {
    valueChange(value: string, reason?: MenubarCloseReason) {
      if (value === current) return;
      if (current) {
        track('menubar_close', {
          component: 'menubar',
          menu: menuId(current),
          reason: reason ?? 'api',
          location,
        });
      }
      current = value;
      if (value) track('menubar_open', { component: 'menubar', menu: menuId(value), location });
    },
    select(menu: string, label: string) {
      track('menubar_item_select', { component: 'menubar', menu: menuId(menu), label, location });
    },
  };
}

// Criados uma vez: o template recebe as FUNÇÕES, e cada par guarda o estado da
// SUA barra.
const tracked = {
  demo:           trackMenubar('demo', 'docs_demo', true),
  pair1Do:        trackMenubar('pair1-do', 'docs_do_dont', true),
  pair1Dont:      trackMenubar('pair1-dont', 'docs_do_dont', false),
  pair2Do:        trackMenubar('pair2-do', 'docs_do_dont', false),
  pair2Dont:      trackMenubar('pair2-dont', 'docs_do_dont', false),
  default:        trackMenubar('default', 'docs_variantes', false),
  destructive:    trackMenubar('destructive', 'docs_variantes', false),
  withShortcuts:  trackMenubar('with-shortcuts', 'docs_variantes', false),
  withCheckbox:   trackMenubar('with-checkbox', 'docs_variantes', false),
  withRadio:      trackMenubar('with-radio', 'docs_variantes', false),
  editorComplete: trackMenubar('editor-complete', 'docs_variantes', true),
};

// ─── As barras como dado ──────────────────────────────────────────────────────
//
// Toda barra viva desta página é uma LISTA de menus, e é a mesma lista que
// imprime o código do card de Variantes (`menubarSnippet`) — o código mostra o
// que a prévia desenha, no idioma de quem lê e com o estado com que ela abre.
// Até 2026-09-11 cada card levava um literal de código em português nos três
// idiomas, sem os `ref` das marcações e da escolha única que ele ligava.
//
// O `value` de cada menu é a chave do gatilho (`file`, `edit`…), e é ele que
// compõe o `menu` do evento numa barra de vários menus. O `value` de cada
// entrada é o id ESTÁVEL: o `label` do evento de escolha e, nas marcações e na
// escolha única, o nome do `ref` no código.

const bars = computed(() => {
  const action = (
    label: string,
    value: string,
    extra: Pick<MenubarSnippetAction, 'shortcut' | 'destructive'> = {},
  ): MenubarSnippetAction => ({ kind: 'item', label, value, ...extra });
  const separator: MenubarSnippetEntry = { kind: 'separator' };

  const file = tContent('demonstration.labels.file');
  const edit = tContent('demonstration.labels.edit');
  const view = tContent('demonstration.labels.view');
  const appearance = tContent('demonstration.labels.appearance');

  const newShortcut = { shortcut: tContent('demonstration.labels.newShortcut') };
  const openShortcut = { shortcut: tContent('demonstration.labels.openShortcut') };
  const saveShortcut = { shortcut: tContent('demonstration.labels.saveShortcut') };
  const quitShortcut = { shortcut: tContent('demonstration.labels.quitShortcut') };
  const undoShortcut = { shortcut: tContent('demonstration.labels.undoShortcut') };
  const redoShortcut = { shortcut: tContent('demonstration.labels.redoShortcut') };
  const copyShortcut = { shortcut: tContent('demonstration.labels.copyShortcut') };
  const pasteShortcut = { shortcut: tContent('demonstration.labels.pasteShortcut') };
  const fullScreenShortcut = { shortcut: tContent('demonstration.labels.fullScreenShortcut') };

  const newLabel = tContent('demonstration.labels.new');
  const openLabel = tContent('demonstration.labels.open');
  const saveLabel = tContent('demonstration.labels.save');
  const quitLabel = tContent('demonstration.labels.quit');
  const undoLabel = tContent('demonstration.labels.undo');
  const redoLabel = tContent('demonstration.labels.redo');
  const copyLabel = tContent('demonstration.labels.copy');
  const pasteLabel = tContent('demonstration.labels.paste');
  const fullScreenLabel = tContent('demonstration.labels.fullScreen');
  const darkModeLabel = tContent('demonstration.labels.darkMode');
  const showRulerLabel = tContent('demonstration.labels.showRuler');
  const pdf = action(tContent('demonstration.labels.pdf'), 'pdf');

  return {
    // UMA barra, quatro menus — a do vanilla, que é a referência.
    demo: [
      {
        value: 'file',
        trigger: file,
        entries: [
          action(newLabel, 'new', newShortcut),
          action(openLabel, 'open', openShortcut),
          action(saveLabel, 'save', saveShortcut),
          separator,
          {
            kind: 'submenu',
            label: tContent('demonstration.labels.export'),
            items: [pdf, action(tContent('demonstration.labels.csv'), 'csv')],
          },
          separator,
          action(quitLabel, 'quit', quitShortcut),
        ],
      },
      {
        value: 'edit',
        trigger: edit,
        entries: [
          action(undoLabel, 'undo', undoShortcut),
          action(redoLabel, 'redo', redoShortcut),
          separator,
          action(tContent('demonstration.labels.cut'), 'cut', { shortcut: tContent('demonstration.labels.cutShortcut') }),
          action(copyLabel, 'copy', copyShortcut),
          action(pasteLabel, 'paste', pasteShortcut),
        ],
      },
      {
        value: 'view',
        trigger: view,
        entries: [
          // O rótulo mora DENTRO do grupo: é o que faz dele o nome do grupo.
          {
            kind: 'group',
            label: appearance,
            items: [
              { kind: 'checkbox', label: darkModeLabel, value: 'dark-mode', checked: false },
              { kind: 'checkbox', label: showRulerLabel, value: 'show-ruler', checked: true },
            ],
          },
          separator,
          action(fullScreenLabel, 'full-screen', fullScreenShortcut),
        ],
      },
      {
        value: 'tools',
        trigger: tContent('demonstration.labels.tools'),
        entries: [
          action(tContent('demonstration.labels.find'), 'find', { shortcut: tContent('demonstration.labels.findShortcut') }),
          action(tContent('demonstration.labels.replace'), 'replace', { shortcut: tContent('demonstration.labels.replaceShortcut') }),
          separator,
          {
            kind: 'radio-group',
            value: 'theme',
            selected: 'system-theme',
            options: [
              { label: tContent('demonstration.labels.lightTheme'), value: 'light-theme' },
              { label: tContent('demonstration.labels.darkTheme'), value: 'dark-theme' },
              { label: tContent('demonstration.labels.systemTheme'), value: 'system-theme' },
            ],
          },
        ],
      },
    ],
    // Três menus de três itens: a regra de uso pede de três a dez por menu.
    pair1Do: [
      {
        value: 'file',
        trigger: file,
        entries: [action(newLabel, 'new'), action(openLabel, 'open'), action(saveLabel, 'save')],
      },
      {
        value: 'edit',
        trigger: edit,
        entries: [action(undoLabel, 'undo'), action(copyLabel, 'copy'), action(pasteLabel, 'paste')],
      },
      {
        value: 'view',
        trigger: view,
        entries: [
          action(tContent('demonstration.labels.zoom'), 'zoom'),
          action(fullScreenLabel, 'full-screen'),
          action(showRulerLabel, 'show-ruler'),
        ],
      },
    ],
    // Uma barra para uma ação só: o que a legenda condena.
    pair1Dont: [
      {
        value: 'menu',
        trigger: tContent('demonstration.labels.menu'),
        entries: [action(tContent('demonstration.labels.singleAction'), 'single-action')],
      },
    ],
    pair2Do: [
      {
        value: 'file',
        trigger: file,
        entries: [action(saveLabel, 'save', saveShortcut), action(openLabel, 'open', openShortcut)],
      },
    ],
    // Submenu dentro de submenu, vivo: o nível a mais que a legenda condena.
    pair2Dont: [
      {
        value: 'file',
        trigger: file,
        entries: [
          {
            kind: 'submenu',
            label: tContent('demonstration.labels.export'),
            items: [{ kind: 'submenu', label: tContent('demonstration.labels.format'), items: [pdf] }],
          },
        ],
      },
    ],
    default: [
      {
        value: 'file',
        trigger: file,
        entries: [action(newLabel, 'new', newShortcut), action(saveLabel, 'save', saveShortcut)],
      },
    ],
    destructive: [
      {
        value: 'file',
        trigger: file,
        entries: [
          action(saveLabel, 'save'),
          separator,
          action(tContent('demonstration.labels.deleteFile'), 'delete-file', { destructive: true }),
        ],
      },
    ],
    withShortcuts: [
      {
        value: 'edit',
        trigger: edit,
        entries: [
          action(undoLabel, 'undo', undoShortcut),
          action(redoLabel, 'redo', redoShortcut),
          separator,
          action(copyLabel, 'copy', copyShortcut),
          action(pasteLabel, 'paste', pasteShortcut),
        ],
      },
    ],
    // Itens de marcação de verdade, com o indicador do componente — nunca glifo
    // no texto.
    withCheckbox: [
      {
        value: 'view',
        trigger: view,
        entries: [
          {
            kind: 'group',
            label: tContent('demonstration.labels.panels'),
            items: [
              { kind: 'checkbox', label: tContent('demonstration.labels.sidebar'), value: 'sidebar', checked: true },
              { kind: 'checkbox', label: tContent('demonstration.labels.grid'), value: 'grid', checked: false },
              { kind: 'checkbox', label: tContent('demonstration.labels.ruler'), value: 'ruler', checked: false },
            ],
          },
        ],
      },
    ],
    withRadio: [
      {
        value: 'theme',
        trigger: tContent('demonstration.labels.theme'),
        entries: [
          {
            kind: 'radio-group',
            label: appearance,
            value: 'theme',
            selected: 'dark',
            options: [
              { label: tContent('demonstration.labels.light'), value: 'light' },
              { label: tContent('demonstration.labels.dark'), value: 'dark' },
              { label: tContent('demonstration.labels.system'), value: 'system' },
            ],
          },
        ],
      },
    ],
    editorComplete: [
      {
        value: 'file',
        trigger: file,
        entries: [
          action(newLabel, 'new', newShortcut),
          action(openLabel, 'open', openShortcut),
          action(saveLabel, 'save', saveShortcut),
          separator,
          action(quitLabel, 'quit', quitShortcut),
        ],
      },
      {
        value: 'edit',
        trigger: edit,
        entries: [action(undoLabel, 'undo', undoShortcut), action(redoLabel, 'redo', redoShortcut)],
      },
      {
        value: 'view',
        trigger: view,
        entries: [
          { kind: 'group', label: appearance, items: [action(darkModeLabel, 'dark-mode')] },
          separator,
          action(fullScreenLabel, 'full-screen', fullScreenShortcut),
        ],
      },
      {
        value: 'help',
        trigger: tContent('demonstration.labels.help'),
        entries: [
          action(tContent('demonstration.labels.documentation'), 'documentation'),
          action(tContent('demonstration.labels.about'), 'about'),
        ],
      },
    ],
  } satisfies Record<string, MenubarSnippetMenu[]>;
});

/** O código de um card: o trecho que a MESMA lista da prévia imprime. */
function barCode(menus: MenubarSnippetMenu[]): string {
  return menubarSnippet({ menus });
}

// ─── SEO & GEO ────────────────────────────────────────────────────────────────

useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: 'menubar',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
  breadcrumb: [
    { name: 'Components', item: '/components' },
    { name: tContent('category'), item: '/components/navigation' },
    { name: tContent('title') },
  ],
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'menubar',
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
      { id: 'variantes',    label: tNav('nav.variants')     },
      { id: 'estados',      label: tNav('nav.states')       },
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
    component_name: 'menubar',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";`;

// O código de cada card de Variantes NÃO mora aqui: sai de `menubarSnippet` com
// a mesma lista que monta a prévia (`barCode`), no idioma da página.

// A API desta stack: o menu aberto liga por `v-model` na barra (`modelValue`),
// e o `@update:modelValue` traz o motivo quando um menu fecha. `loop` nasce
// ligado no wrapper, como o conteúdo promete.
const interfaceCode = `// Menubar (root)
interface MenubarRootProps {
  modelValue?: string;   // v-model: the open menu, '' when closed
  defaultValue?: string;
  loop?: boolean;        // default: true
}
// @update:modelValue → (value: string, reason?: 'escape' | 'overlay' | 'api')

// MenubarMenu
interface MenubarMenuProps {
  value: string;
}

// MenubarContent
interface MenubarContentProps {
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  alignOffset?: number;
}

// MenubarItem
interface MenubarItemProps {
  variant?: 'default' | 'destructive';
  inset?: boolean;
  disabled?: boolean;
}
// @select → (event: Event)

// MenubarCheckboxItem
interface MenubarCheckboxItemProps {
  checked?: boolean | 'indeterminate'; // v-model:checked
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
  { trackId: 'default', name: tContent('variants.items.default'),     description: stripHtml(tContent('variants.styles.default')),     code: barCode(bars.value.default) },
  { trackId: 'destructive', name: tContent('variants.items.destructive'), description: stripHtml(tContent('variants.styles.destructive')), code: barCode(bars.value.destructive) },
  {
    trackId: 'withShortcuts',
    name: tContent('variants.items.withShortcuts.name'),
    description: tContent('variants.items.withShortcuts.description'),
    useWhen: tContent('variants.items.withShortcuts.use'),
    code: barCode(bars.value.withShortcuts),
  },
  {
    trackId: 'withCheckbox',
    name: tContent('variants.items.withCheckbox.name'),
    description: tContent('variants.items.withCheckbox.description'),
    useWhen: tContent('variants.items.withCheckbox.use'),
    code: barCode(bars.value.withCheckbox),
  },
  {
    trackId: 'withRadio',
    name: tContent('variants.items.withRadio.name'),
    description: tContent('variants.items.withRadio.description'),
    useWhen: tContent('variants.items.withRadio.use'),
    code: barCode(bars.value.withRadio),
  },
  {
    trackId: 'editorComplete',
    name: tContent('variants.items.editorComplete.name'),
    description: tContent('variants.items.editorComplete.description'),
    useWhen: tContent('variants.items.editorComplete.use'),
    code: barCode(bars.value.editorComplete),
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

// Os nomes que se escrevem nesta stack: a barra liga o menu aberto por
// `v-model` (`modelValue`), e o evento traz o motivo do fechamento como segundo
// argumento — o tipo do conteúdo compartilhado não o tem. A tabela dizia
// `value` e `@update:value`, que a barra ignora em silêncio.
const menubarPropItems = computed(() => [
  { name: 'modelValue',         type: tContent('props.table.value.type'),          defaultValue: tContent('props.table.value.default'),          required: tContent('props.table.value.required'),          description: toPlainText(tContent('props.table.value.description'))          },
  { name: '@update:modelValue', type: "(value: string, reason?: 'escape' | 'overlay' | 'api') => void", defaultValue: tContent('props.table.onValueChange.default'),  required: tContent('props.table.onValueChange.required'),  description: toPlainText(tContent('props.table.onValueChange.description'))  },
  { name: 'defaultValue',       type: tContent('props.table.defaultValue.type'),   defaultValue: tContent('props.table.defaultValue.default'),   required: tContent('props.table.defaultValue.required'),   description: toPlainText(tContent('props.table.defaultValue.description'))   },
  { name: 'loop',               type: tContent('props.table.loop.type'),           defaultValue: tContent('props.table.loop.default'),           required: tContent('props.table.loop.required'),           description: toPlainText(tContent('props.table.loop.description'))           },
  { name: 'side',               type: tContent('props.table.side.type'),           defaultValue: tContent('props.table.side.default'),           required: tContent('props.table.side.required'),           description: toPlainText(tContent('props.table.side.description'))           },
  { name: 'align',              type: tContent('props.table.align.type'),          defaultValue: tContent('props.table.align.default'),          required: tContent('props.table.align.required'),          description: toPlainText(tContent('props.table.align.description'))          },
]);

const tokenRows = computed(() => [
  { token: '--background',         value: tContent('tokens.table.menubarBg.class'),     description: tContent('tokens.table.menubarBg.part')     },
  { token: '--border',             value: tContent('tokens.table.menubarBorder.class'), description: tContent('tokens.table.menubarBorder.part') },
  { token: '--accent',             value: tContent('tokens.table.triggerHover.class'),  description: tContent('tokens.table.triggerHover.part')  },
  { token: '--accent-foreground',  value: tContent('tokens.table.triggerText.class'),   description: tContent('tokens.table.triggerText.part')   },
  { token: '--radius-sm',          value: tContent('tokens.table.triggerRadius.class'), description: tContent('tokens.table.triggerRadius.part') },
  { token: '--elevation-xs',       value: tContent('tokens.table.elevation.class'),     description: tContent('tokens.table.elevation.part')     },
  { token: '--popover',            value: tContent('tokens.table.contentBg.class'),     description: tContent('tokens.table.contentBg.part')     },
  { token: '--border',             value: tContent('tokens.table.contentBorder.class'), description: tContent('tokens.table.contentBorder.part') },
  // `--radius`, não `--radius-lg`: o painel lê o token base, e `--radius-lg`
  // é derivado dele — sobrescrever o derivado não muda arredondamento algum.
  { token: '--radius',             value: tContent('tokens.table.rounded.class'),       description: tContent('tokens.table.rounded.part')       },
  { token: '--accent',              value: tContent('tokens.table.itemHover.class'),     description: tContent('tokens.table.itemHover.part')     },
  { token: '--destructive',        value: tContent('tokens.table.destructive.class'),   description: tContent('tokens.table.destructive.part')   },
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
  { key: 'Tab',           description: toPlainText(tContent('accessibility.keyboard.tab'))              },
  { key: 'Arrow Left / Arrow Right',         description: toPlainText(tContent('accessibility.keyboard.arrowsHorizontal')) },
  { key: 'Arrow Up / Arrow Down',         description: toPlainText(tContent('accessibility.keyboard.arrowsVertical'))   },
  { key: 'Enter / Space', description: toPlainText(tContent('accessibility.keyboard.enter'))            },
  { key: 'Escape',        description: toPlainText(tContent('accessibility.keyboard.escape'))           },
  { key: 'Home / End',    description: toPlainText(tContent('accessibility.keyboard.homeEnd'))          },
  { key: 'A–Z',           description: toPlainText(tContent('accessibility.keyboard.typeahead'))        },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.navigationMenu.name'), description: toPlainText(tContent('related.items.navigationMenu.description')), path: '?path=/docs/components-navigation-navigationmenu--docs' },
  { name: tContent('related.items.dropdownMenu.name'),   description: toPlainText(tContent('related.items.dropdownMenu.description')),   path: '?path=/docs/components-navigation-dropdownmenu--docs'   },
  { name: tContent('related.items.sidebar.name'),        description: toPlainText(tContent('related.items.sidebar.description')),        path: '?path=/docs/components-layout-sidebar--docs'        },
  { name: tContent('related.items.command.name'),        description: toPlainText(tContent('related.items.command.description')),        path: '?path=/docs/components-overlay-command--docs'        },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
  { title: '', content: tContent('notes.item5') },
  { title: '', content: tContent('notes.item6') },
]);

// A tabela sai do conteúdo compartilhado, como a do ContextMenu. As linhas que
// moravam aqui ensinavam dois eventos que nenhum código disparava e que o tipo
// não tinha.
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
// axe) e identificador não se traduz. A coluna dizia "DevTools attribute" e
// "Manual review" — frase em inglês, igual nos três idiomas; agora diz a
// consulta ou a regra que mede o critério. Item novo além da lista cai no par
// padrão em vez de sumir.
const a11yTestLevels = ['AA', '1.3.1 · A', '4.1.2 · A', '4.1.2 · A', '4.1.2 · A', '2.4.3 · A', '1.4.3 · AA', '2.1.1 · A'];
const a11yTestHow = [
  'axe-core',
  "getByRole('menubar')",
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
    component-slug="menubar"
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
      Uma barra, quatro menus — a do vanilla, que é a referência. Os gatilhos são
      as chaves `file` … `tools`; até 2026-09-11 eram as LEGENDAS antigas ("Menu
      Arquivo (com submenu)"), e a barra anunciava como nome de menu uma frase
      sobre a demonstração.
    -->
    <DocsDemonstration>
      <div
        class="nds-w-full nds-min-h-80"
        style="contain: layout"
      >
        <MenubarPreview
          :menus="bars.demo"
          @update:model-value="tracked.demo.valueChange"
          @select="tracked.demo.select"
        />
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
          { element: tContent('usage.uxWriting.table.item.name'), rules: tContent('usage.uxWriting.table.item.format'), do: tContent('usage.uxWriting.table.item.good'), dont: tContent('usage.uxWriting.table.item.bad') },
          { element: tContent('usage.uxWriting.table.shortcut.name'), rules: tContent('usage.uxWriting.table.shortcut.format'), do: tContent('usage.uxWriting.table.shortcut.good'), dont: tContent('usage.uxWriting.table.shortcut.bad') },
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
          <!-- Três menus de três itens cada: a regra de uso pede de três a dez. -->
          <MenubarPreview
            :menus="bars.pair1Do"
            @update:model-value="tracked.pair1Do.valueChange"
            @select="tracked.pair1Do.select"
          />
        </div>
      </template>
      <template #dont-preview-0>
        <div
          style="contain: layout"
          class="nds-w-full nds-min-h-20"
        >
          <MenubarPreview
            :menus="bars.pair1Dont"
            @update:model-value="tracked.pair1Dont.valueChange"
            @select="tracked.pair1Dont.select"
          />
        </div>
      </template>
      <template #do-preview-1>
        <div
          style="contain: layout"
          class="nds-w-full nds-min-h-60"
        >
          <MenubarPreview
            :menus="bars.pair2Do"
            @update:model-value="tracked.pair2Do.valueChange"
            @select="tracked.pair2Do.select"
          />
        </div>
      </template>
      <template #dont-preview-1>
        <div
          style="contain: layout"
          class="nds-w-full nds-min-h-60"
        >
          <!-- Submenu dentro de submenu, vivo: o nível a mais que a legenda condena. -->
          <MenubarPreview
            :menus="bars.pair2Dont"
            @update:model-value="tracked.pair2Dont.valueChange"
            @select="tracked.pair2Dont.select"
          />
        </div>
      </template>
    </DocsDoDont>

    <!-- ── Importação ───────────────────────────────────────────── -->
    <DocsImport
      :code="codeImportBasic"
      component-slug="menubar"
    />

    <!-- ── Variantes ────────────────────────────────────────────── -->
    <!--
      As barras nascem FECHADAS, como no vanilla: com `default-value` cada prévia
      abria o seu painel ao carregar a página, e seis menus abertos de uma vez
      disputavam a tela sem ninguém ter pedido nenhum. Cada prévia recebe a MESMA
      lista que imprime o código do card (`barCode` em `variantItems`).
    -->
    <DocsCompositions
      id="variantes"
      :items="variantItems"
      :use-when-label="tNav('common.useWhen')"
      component-slug="menubar"
    >
      <template #variant-preview-0>
        <div
          style="contain: layout"
          class="nds-w-full nds-min-h-60"
        >
          <MenubarPreview
            :menus="bars.default"
            @update:model-value="tracked.default.valueChange"
            @select="tracked.default.select"
          />
        </div>
      </template>
      <template #variant-preview-1>
        <div
          style="contain: layout"
          class="nds-w-full nds-min-h-60"
        >
          <MenubarPreview
            :menus="bars.destructive"
            @update:model-value="tracked.destructive.valueChange"
            @select="tracked.destructive.select"
          />
        </div>
      </template>
      <template #variant-preview-2>
        <div
          style="contain: layout"
          class="nds-w-full nds-min-h-60"
        >
          <MenubarPreview
            :menus="bars.withShortcuts"
            @update:model-value="tracked.withShortcuts.valueChange"
            @select="tracked.withShortcuts.select"
          />
        </div>
      </template>
      <template #variant-preview-3>
        <div
          style="contain: layout"
          class="nds-w-full nds-min-h-60"
        >
          <MenubarPreview
            :menus="bars.withCheckbox"
            @update:model-value="tracked.withCheckbox.valueChange"
            @select="tracked.withCheckbox.select"
          />
        </div>
      </template>
      <template #variant-preview-4>
        <div
          style="contain: layout"
          class="nds-w-full nds-min-h-60"
        >
          <MenubarPreview
            :menus="bars.withRadio"
            @update:model-value="tracked.withRadio.valueChange"
            @select="tracked.withRadio.select"
          />
        </div>
      </template>
      <template #variant-preview-5>
        <div
          style="contain: layout"
          class="nds-w-full nds-min-h-60"
        >
          <MenubarPreview
            :menus="bars.editorComplete"
            @update:model-value="tracked.editorComplete.valueChange"
            @select="tracked.editorComplete.select"
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
        { title: 'Menubar', cols: propCols, items: menubarPropItems },
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
      component-slug="menubar"
    />

    <!-- ── Notas ────────────────────────────────────────────────── -->
    <DocsNotes
      :items="noteItems"
      component-slug="menubar"
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
