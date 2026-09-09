<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import uiTranslations from '@/i18n/ui.json';
import componentTranslations from '@shared/content/context-menu/translations.json';
import { AREA_CLICK_DIREITO } from '@shared/primitives/context-menu-area';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuSeparator,
  ContextMenuLabel,
  ContextMenuShortcut,
} from '@/components/ui/context-menu';
import { Button } from '@/components/ui/button';

import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.vue';
import DocsPageLayout    from '@/components/docs/shared/sections/DocsPageLayout.vue';
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

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation({ ...uiTranslations, ...componentTranslations });

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

// A moldura tracejada da área vem da constante COMPARTILHADA. Esta página
// escrevia a cadeia à mão em treze lugares, e com `nds-w-full nds-max-w-xs` no
// lugar de `nds-w-xs` — a divergência que a constante existe justamente para
// impedir (o docblock dela registra a rodada em que as cinco stacks desenhavam
// molduras diferentes).
const areaClasse = AREA_CLICK_DIREITO;

// A MESMA área, sem a dica visual: mesmo tamanho, mesmo recheio, mesmo texto
// atenuado — só sem moldura e sem cursor. É o lado do "evite" do par 3, e ela
// existe porque a legenda daquele par contrapõe área COM dica e área SEM. Com o
// tracejado dos dois lados só o rótulo mudava, e o par não ilustrava nada.
// Vanilla é a referência: `makePlainArea` em `ContextMenuDocs.ts`.
const areaSemDicaClasse =
  'nds-cluster nds-w-xs nds-p-8 nds-rounded-md nds-text-body nds-text-muted-foreground';

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
 * erro, sem aviso, nos três idiomas de uma vez. Foi o que aconteceu com o nono
 * critério de acessibilidade deste componente, o do item desabilitado que
 * continua no percurso do teclado.
 *
 * Trocar 8 por 9 não resolveria: o total cravado É o defeito, e ele volta no
 * item seguinte.
 */
function stringsFromDict(
  t: (key: string, defaultValue?: string) => string,
  base: string,
  prefix = 'item',
): string[] {
  const out: string[] = [];
  for (let i = 1; ; i++) {
    const value = t(`${base}.${prefix}${i}`, '');
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
  t: (key: string, defaultValue?: string) => string,
  base: string,
  fields: readonly K[],
): Array<Record<K, string>> {
  const out: Array<Record<K, string>> = [];
  for (let i = 1; ; i++) {
    if (!t(`${base}.item${i}.${fields[0]}`, '')) break;
    out.push(
      Object.fromEntries(
        fields.map(field => [field, t(`${base}.item${i}.${field}`, '')]),
      ) as Record<K, string>,
    );
  }
  return out;
}

/**
 * Nível WCAG e ferramenta de cada critério de acessibilidade, por índice.
 * Ficam aqui, e não no conteúdo compartilhado, porque são IDENTIFICADORES
 * (número de critério, nome do verificador) e identificador não se traduz.
 * Item novo que chegue além da lista cai no par padrão em vez de sumir.
 */
const a11yTestLevels = [
  'WCAG 2.2 AA',
  'WCAG 4.1.2',
  'WCAG 4.1.2',
  'WCAG 4.1.2',
  'WCAG 4.1.2',
  'WCAG 4.1.2',
  'WCAG 2.1.1',
  'WCAG 1.4.3',
  'WCAG 2.1.1',
];
const a11yTestHow = [
  'axe-core',
  'Inspeção DOM',
  'Inspeção DOM',
  'Inspeção DOM',
  'Inspeção DOM',
  'Inspeção DOM',
  'Teste de teclado',
  'Contrast checker',
  'Teste de teclado',
];

// ─── SEO & GEO ────────────────────────────────────────────────────────────────

useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: 'context-menu',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'context-menu',
    locale: newLocale,
    page_title: tContent('seo.title'),
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

const allSectionIds = computed(() => navGroups.value.flatMap(g => g.sections.map(s => s.id)));

const { activeId: activeSection } = useActiveSection(allSectionIds, (id) => {
  track('docs_section_viewed', {
    section_id: id,
    component_name: 'context-menu',
    locale: locale.value,
  });
});

// ─── Analytics — demo events ──────────────────────────────────────────────────

function handleDemoMenuOpenChange(open: boolean) {
  if (!open) return;
  track('menu_open', {
    component: 'context_menu',
    location: 'docs_demo',
    menu: 'demo',
  });
}

// O `label` do payload é IDENTIFICADOR, nunca o rótulo traduzido: texto
// localizado partiria o mesmo evento em um valor por idioma no GA4 — "Editar",
// "Edit" e "Editar" chegariam como três ações diferentes.
function handleDemoMenuItemSelect(label: string) {
  track('menu_item_click', {
    label,
    menu: 'demo',
    location: 'docs_demo',
  });
}
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";`;

const codeImportWithSub = `import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";`;

const codeImportWithCheckbox = `import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuLabel,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";`;

const codeDefault = `<ContextMenu>
  <ContextMenuTrigger>Clique com o botão direito</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>
      Editar
      <ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem>Duplicar</ContextMenuItem>
    <ContextMenuItem>Compartilhar</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`;

const codeDestructive = `<ContextMenu>
  <ContextMenuTrigger>Clique com o botão direito</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Editar</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive">
      Excluir
      <ContextMenuShortcut>Delete</ContextMenuShortcut>
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`;

const codeLabel = `<ContextMenuLabel inset>Arquivo</ContextMenuLabel>
<ContextMenuItem inset>Editar</ContextMenuItem>`;

const codeCustomizationTokens = `/* Em globals.css — personalizar tokens do menu */
:root {
  --popover: 0 0% 100%;
  --popover-foreground: 222 47% 11%;
  --accent: 210 40% 96%;
  --accent-foreground: 222 47% 11%;
}

.dark {
  --popover: 222 47% 11%;
  --popover-foreground: 210 40% 98%;
  --accent: 217 33% 17%;
  --accent-foreground: 210 40% 98%;
}`;

const interfaceCode = `// ContextMenuItem
interface ContextMenuItemProps {
  variant?: 'default' | 'destructive';
  inset?: boolean;
  disabled?: boolean;
  class?: string;
}

// ContextMenuContent
interface ContextMenuContentProps {
  align?: 'start' | 'center' | 'end';
  alignOffset?: number;
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  class?: string;
}

// ContextMenuCheckboxItem
interface ContextMenuCheckboxItemProps {
  checked?: boolean;
  inset?: boolean;
  disabled?: boolean;
  class?: string;
}

// ContextMenuRadioItem
interface ContextMenuRadioItemProps {
  value: string;
  inset?: boolean;
  disabled?: boolean;
  class?: string;
}

// ContextMenuLabel
interface ContextMenuLabelProps {
  inset?: boolean;
  class?: string;
}`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => stringsFromDict(tContent, 'anatomy'));

const usageGuidelines = computed(() => ({
  title: tContent('usage.guidelines.title'),
  items: stringsFromDict(tContent, 'usage.guidelines'),
}));

const usageScenarios = computed(() => ({
  title: tContent('usage.scenarios.title'),
  cols: {
    scenario: tContent('usage.scenarios.cols.scenario'),
    use: tContent('usage.scenarios.cols.use'),
    alternative: tContent('usage.scenarios.cols.alternative'),
  },
  items: entriesFromDict(tContent, 'usage.scenarios', ['s', 'u', 'a']),
}));

const usageDo = computed(() => ({
  title: tContent('usage.do.title'),
  items: stringsFromDict(tContent, 'usage.do'),
}));

const usageDont = computed(() => ({
  title: tContent('usage.dont.title'),
  items: stringsFromDict(tContent, 'usage.dont'),
}));

const variantItems = computed(() => [
  { name: 'default',      description: stripHtml(tContent('variants.items.default')),      code: codeDefault       },
  { name: 'destructive',  description: stripHtml(tContent('variants.items.destructive')),  code: codeDestructive   },
  { name: 'Label',        description: stripHtml(tContent('variants.items.label')),         code: codeLabel         },
  {
    trackId: 'withCheckbox',
    name: tContent('variants.items.withCheckbox.name'),
    description: tContent('variants.items.withCheckbox.description'),
    useWhen: tContent('variants.items.withCheckbox.use'),
    code: codeCompositionCheckbox,
  },
  {
    trackId: 'withRadio',
    name: tContent('variants.items.withRadio.name'),
    description: tContent('variants.items.withRadio.description'),
    useWhen: tContent('variants.items.withRadio.use'),
    code: codeCompositionRadio,
  },
  {
    trackId: 'withSubmenu',
    name: tContent('variants.items.withSubmenu.name'),
    description: tContent('variants.items.withSubmenu.description'),
    useWhen: tContent('variants.items.withSubmenu.use'),
    code: codeCompositionSubmenu,
  },
  {
    trackId: 'withShortcuts',
    name: tContent('variants.items.withShortcuts.name'),
    description: tContent('variants.items.withShortcuts.description'),
    useWhen: tContent('variants.items.withShortcuts.use'),
    code: codeCompositionShortcuts,
  },
]);

const stateItems = computed(() => [
  { label: tContent('states.closed.label'),   trigger: toPlainText(tContent('states.closed.trigger')),   behavior: toPlainText(tContent('states.closed.behavior'))},
  { label: tContent('states.open.label'),     trigger: toPlainText(tContent('states.open.trigger')),     behavior: toPlainText(tContent('states.open.behavior'))},
  { label: tContent('states.focused.label'),  trigger: toPlainText(tContent('states.focused.trigger')),  behavior: toPlainText(tContent('states.focused.behavior'))},
  { label: tContent('states.disabled.label'), trigger: toPlainText(tContent('states.disabled.trigger')), behavior: toPlainText(tContent('states.disabled.behavior'))},
  { label: tContent('states.checked.label'),  trigger: toPlainText(tContent('states.checked.trigger')),  behavior: toPlainText(tContent('states.checked.behavior'))},
  { label: tContent('states.subOpen.label'),  trigger: toPlainText(tContent('states.subOpen.trigger')),  behavior: toPlainText(tContent('states.subOpen.behavior'))},
]);

const propCols = computed(() => ({
  prop:        tContent('props.table.prop'),
  type:        tContent('props.table.type'),
  default:     tContent('props.table.default'),
  required:    tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const contentPropItems = computed(() => [
  { name: 'align',       type: '"start" | "center" | "end"', defaultValue: '"start"',  required: 'Não', description: stripHtml(tContent('props.items.align'))       },
  { name: 'alignOffset', type: 'number',                     defaultValue: '4',         required: 'Não', description: stripHtml(tContent('props.items.alignOffset')) },
  { name: 'side',        type: '"top" | "right" | "bottom" | "left"', defaultValue: '"right"', required: 'Não', description: stripHtml(tContent('props.items.side')) },
  { name: 'sideOffset',  type: 'number',                     defaultValue: '0',         required: 'Não', description: stripHtml(tContent('props.items.sideOffset'))  },
  { name: 'class',       type: 'string',                     defaultValue: '—',         required: 'Não', description: 'Classe CSS adicional.'                        },
]);

const itemPropItems = computed(() => [
  { name: 'variant',   type: '"default" | "destructive"', defaultValue: '"default"', required: 'Não',  description: stripHtml(tContent('props.items.variant'))   },
  { name: 'inset',     type: 'boolean',                   defaultValue: 'false',      required: 'Não',  description: stripHtml(tContent('props.items.inset'))     },
  { name: 'disabled',  type: 'boolean',                   defaultValue: 'false',      required: 'Não',  description: stripHtml(tContent('props.items.disabled'))  },
  { name: 'onSelect',  type: '() => void',                defaultValue: '—',          required: 'Não',  description: stripHtml(tContent('props.items.onSelect'))  },
]);

const checkboxItemPropItems = computed(() => [
  { name: 'checked',          type: 'boolean',    defaultValue: 'false', required: 'Não', description: stripHtml(tContent('props.items.checked'))          },
  { name: 'onCheckedChange',  type: '(v: boolean) => void', defaultValue: '—', required: 'Não', description: stripHtml(tContent('props.items.onCheckedChange')) },
  { name: 'inset',            type: 'boolean',    defaultValue: 'false', required: 'Não', description: stripHtml(tContent('props.items.inset'))            },
  { name: 'disabled',         type: 'boolean',    defaultValue: 'false', required: 'Não', description: stripHtml(tContent('props.items.disabled'))         },
]);

const radioGroupPropItems = computed(() => [
  { name: 'modelValue',      type: 'string',              defaultValue: '—', required: 'Não', description: 'Valor selecionado atual do grupo.'                            },
  { name: 'onValueChange',   type: '(v: string) => void', defaultValue: '—', required: 'Não', description: stripHtml(tContent('props.items.onValueChange')) },
]);

const radioItemPropItems = computed(() => [
  { name: 'value',    type: 'string',  defaultValue: '—',     required: 'Sim', description: stripHtml(tContent('props.items.value'))    },
  { name: 'inset',    type: 'boolean', defaultValue: 'false',  required: 'Não', description: stripHtml(tContent('props.items.inset'))    },
  { name: 'disabled', type: 'boolean', defaultValue: 'false',  required: 'Não', description: stripHtml(tContent('props.items.disabled')) },
]);

const labelPropItems = computed(() => [
  { name: 'inset', type: 'boolean', defaultValue: 'false', required: 'Não', description: stripHtml(tContent('props.items.inset')) },
]);

// A coluna do meio é "Classe .nds-*" e trazia nome de utilitária do Tailwind —
// vocabulário morto desde a migração. Cada linha aponta agora o seletor que o
// CSS realmente usa, e cada token foi medido no navegador: só `--elevation-md`
// muda a sombra (`--shadow` e `--shadow-md` não movem nada), o separador é
// `--muted` e não `--border`, e o raio do item é `--radius-sm`, não `--radius`.
const tokenRows = computed(() => [
  { token: '--popover',             value: '.nds-dropdown-menu-content',    description: tContent('tokens.table.popoverBg')        },
  { token: '--popover-foreground',  value: '.nds-dropdown-menu-content',    description: tContent('tokens.table.popoverFg')        },
  { token: '--accent',              value: '.nds-dropdown-menu-item',       description: tContent('tokens.table.accentBg')         },
  { token: '--accent-foreground',   value: '.nds-dropdown-menu-item',       description: tContent('tokens.table.accentFg')         },
  { token: '--destructive',         value: '[data-variant="destructive"]',  description: tContent('tokens.table.destructive')      },
  { token: '--destructive',         value: '.nds-dropdown-menu-item[data-variant="destructive"]:focus', description: tContent('tokens.table.destructiveFocus') },
  { token: '--muted-foreground',    value: '.nds-dropdown-menu-shortcut',   description: tContent('tokens.table.mutedFg')          },
  { token: '--muted-foreground',    value: '.nds-dropdown-menu-label',      description: tContent('tokens.table.mutedFgLabel')     },
  { token: '--muted',               value: '.nds-dropdown-menu-separator',  description: tContent('tokens.table.border')           },
  { token: '--border',              value: '.nds-dropdown-menu-content',    description: tContent('tokens.table.popupBorder')      },
  { token: '--elevation-md',        value: '.nds-dropdown-menu-content',    description: tContent('tokens.table.shadow')           },
  { token: '--radius',              value: '.nds-dropdown-menu-content',    description: tContent('tokens.table.radius')           },
  { token: '--radius-sm',           value: '.nds-dropdown-menu-item',       description: tContent('tokens.table.radiusItem')       },
  { token: '--z-popover',           value: '.nds-dropdown-menu-positioner', description: tContent('tokens.table.zIndex')           },
]);

const accessibilityItems = computed(() => [
  tContent('accessibility.warning'),
  tContent('accessibility.aria.roleMenu'),
  tContent('accessibility.aria.roleMenuItem'),
  tContent('accessibility.aria.roleMenuitemCheckbox'),
  tContent('accessibility.aria.roleMenuitemRadio'),
  tContent('accessibility.aria.ariaChecked'),
  tContent('accessibility.aria.ariaDisabled'),
  tContent('accessibility.aria.ariaHaspopup'),
  tContent('accessibility.aria.ariaExpanded'),
]);

const keyboardItems = computed(() => [
  { key: 'Right-click / Menu / Shift+F10', description: tContent('accessibility.keyboard.rightClick') },
  { key: 'Arrow Down',  description: tContent('accessibility.keyboard.arrowDown')  },
  { key: 'Arrow Up',    description: tContent('accessibility.keyboard.arrowUp')    },
  { key: 'Arrow Right', description: tContent('accessibility.keyboard.arrowRight') },
  { key: 'Arrow Left',  description: tContent('accessibility.keyboard.arrowLeft')  },
  { key: 'Home / End',  description: tContent('accessibility.keyboard.homeEnd')    },
  { key: 'A–Z',         description: tContent('accessibility.keyboard.typeahead')  },
  { key: 'Enter',       description: tContent('accessibility.keyboard.enter')      },
  { key: 'Space',       description: tContent('accessibility.keyboard.space')      },
  { key: 'Esc',         description: tContent('accessibility.keyboard.escape')     },
  { key: 'Tab',         description: tContent('accessibility.keyboard.tab')        },
]);

const relatedItems = computed(() => [
  { name: 'DropdownMenu', description: toPlainText(tContent('related.dropdownMenu')), path: '?path=/docs/components-overlay-dropdownmenu--docs' },
  { name: 'Menubar',      description: toPlainText(tContent('related.menubar')),      path: '?path=/docs/components-navigation-menubar--docs'      },
  { name: 'Dialog',       description: toPlainText(tContent('related.dialog')),       path: '?path=/docs/components-overlay-dialog--docs'       },
  { name: 'AlertDialog',  description: toPlainText(tContent('related.alertDialog')),  path: '?path=/docs/components-overlay-alertdialog--docs'  },
  { name: 'Tooltip',      description: toPlainText(tContent('related.tooltip')),      path: '?path=/docs/components-overlay-tooltip--docs'      },
]);

const noteItems = computed(() =>
  stringsFromDict(tContent, 'notes', 'tip').map(content => ({ title: '', content })),
);

const analyticsItems = computed(() => [
  { event: tContent('analytics.table.menuOpen'),     trigger: toPlainText(tContent('analytics.table.menuOpenTrigger')),     payload: tContent('analytics.table.menuOpenPayload')     },
  { event: tContent('analytics.table.itemClick'),    trigger: toPlainText(tContent('analytics.table.itemClickTrigger')),    payload: tContent('analytics.table.itemClickPayload')    },
  { event: tContent('analytics.table.pageView'),     trigger: toPlainText(tContent('analytics.table.pageViewTrigger')),     payload: tContent('analytics.table.pageViewPayload')     },
  { event: tContent('analytics.table.sectionViewed'), trigger: toPlainText(tContent('analytics.table.sectionViewedTrigger')), payload: tContent('analytics.table.sectionViewedPayload') },
  { event: tContent('analytics.table.langSwitch'),   trigger: toPlainText(tContent('analytics.table.langSwitchTrigger')),   payload: tContent('analytics.table.langSwitchPayload')   },
]);

const a11yCritCols = computed(() => ({
  criterion: tNav('common.criterion'),
  level: 'WCAG',
  how: tNav('common.howToVerify'),
}));

const functionalTestItems = computed(() =>
  entriesFromDict(tContent, 'testes.functional', ['action', 'result', 'priority']).map(entry => ({
    ...entry,
    priority: localPriority(entry.priority),
  })),
);

const a11yTestItems = computed(() =>
  stringsFromDict(tContent, 'testes.accessibility').map((criterion, i) => ({
    criterion,
    level: a11yTestLevels[i] ?? 'WCAG 2.2 AA',
    how: a11yTestHow[i] ?? 'axe-core',
  })),
);

const visualTestItems = computed(() =>
  entriesFromDict(tContent, 'testes.visual', ['story', 'priority']).map(entry => ({
    ...entry,
    priority: localPriority(entry.priority),
  })),
);

// ─── Composições — state ──────────────────────────────────────────────────────
const compShowGrid   = ref(true);
const compShowRulers = ref(false);
const compZoom       = ref('100');

// Composições — código
const codeCompositionCheckbox = `const showGrid = ref(true);
const showRulers = ref(false);

<ContextMenu>
  <ContextMenuTrigger>Clique com o botão direito</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuGroup>
      <ContextMenuLabel inset>Visualização</ContextMenuLabel>
      <ContextMenuCheckboxItem :checked="showGrid" @update:checked="showGrid = $event">
        Mostrar grade
      </ContextMenuCheckboxItem>
      <ContextMenuCheckboxItem :checked="showRulers" @update:checked="showRulers = $event">
        Mostrar réguas
      </ContextMenuCheckboxItem>
    </ContextMenuGroup>
  </ContextMenuContent>
</ContextMenu>`;

const codeCompositionRadio = `const zoom = ref('100');

<ContextMenu>
  <ContextMenuTrigger>Clique com o botão direito</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuGroup>
      <ContextMenuLabel inset>Zoom</ContextMenuLabel>
      <ContextMenuRadioGroup :model-value="zoom" @update:model-value="zoom = $event">
        <ContextMenuRadioItem value="75">75%</ContextMenuRadioItem>
        <ContextMenuRadioItem value="100">100%</ContextMenuRadioItem>
        <ContextMenuRadioItem value="150">150%</ContextMenuRadioItem>
      </ContextMenuRadioGroup>
    </ContextMenuGroup>
  </ContextMenuContent>
</ContextMenu>`;

const codeCompositionSubmenu = `<ContextMenu>
  <ContextMenuTrigger>Clique com o botão direito</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Editar</ContextMenuItem>
    <ContextMenuItem>Duplicar</ContextMenuItem>
    <ContextMenuSub>
      <ContextMenuSubTrigger>Compartilhar</ContextMenuSubTrigger>
      <ContextMenuSubContent>
        <ContextMenuItem>Por e-mail</ContextMenuItem>
        <ContextMenuItem>Por link</ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>
  </ContextMenuContent>
</ContextMenu>`;

const codeCompositionShortcuts = `<ContextMenu>
  <ContextMenuTrigger>Clique com o botão direito</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>
      Editar
      <ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem>
      Duplicar
      <ContextMenuShortcut>Ctrl+D</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive">
      Excluir
      <ContextMenuShortcut>Delete</ContextMenuShortcut>
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`;

</script>

<template>
  <DocsPageLayout
    :nav-groups="navGroups"
    :active-section="activeSection"
    component-slug="context-menu"
  >
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
      />
    </template>

    <!-- ── Demonstração ─────────────────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div
        class="nds-cluster nds-w-full nds-p-8"
        data-align="center"
        data-justify="center"
      >
        <ContextMenu @update:open="handleDemoMenuOpenChange">
          <ContextMenuTrigger
            :class="areaClasse"
            data-align="center"
            data-justify="center"
          >
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuGroup>
              <ContextMenuItem @select="handleDemoMenuItemSelect('edit')">
                {{ tContent('demonstration.labels.edit') }}
                <ContextMenuShortcut>{{ tContent('demonstration.labels.editShortcut') }}</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem @select="handleDemoMenuItemSelect('duplicate')">
                {{ tContent('demonstration.labels.duplicate') }}
              </ContextMenuItem>
              <ContextMenuSub>
                <ContextMenuSubTrigger>{{ tContent('demonstration.labels.share') }}</ContextMenuSubTrigger>
                <ContextMenuSubContent>
                  <ContextMenuItem @select="handleDemoMenuItemSelect('share-email')">
                    {{ tContent('demonstration.labels.shareEmail') }}
                  </ContextMenuItem>
                  <ContextMenuItem @select="handleDemoMenuItemSelect('share-link')">
                    {{ tContent('demonstration.labels.shareLink') }}
                  </ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
            </ContextMenuGroup>
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              @select="handleDemoMenuItemSelect('delete')"
            >
              {{ tContent('demonstration.labels.delete') }}
              <ContextMenuShortcut>{{ tContent('demonstration.labels.deleteShortcut') }}</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>
    </DocsDemonstration>

    <!-- ── Anatomia ─────────────────────────────────────────────────────────── -->
    <DocsAnatomy
      :title="tContent('anatomy.title')"
      :items="anatomyItems"
      :structure-label="tContent('anatomy.structureLabel')"
      :structure-code="tContent('anatomy.structureCode')"
    />

    <!-- ── Quando Usar ──────────────────────────────────────────────────────── -->
    <DocsWhenToUse
      :title="tContent('usage.title')"
      :guidelines="usageGuidelines"
      :scenarios="usageScenarios"
      :do="usageDo"
      :dont="usageDont"
    />

    <!-- ── Do & Don't ───────────────────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="[
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair1.do')), dontCaption: toPlainText(tContent('doDont.pair1.dont')) },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair2.do')), dontCaption: toPlainText(tContent('doDont.pair2.dont')) },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair3.do')), dontCaption: toPlainText(tContent('doDont.pair3.dont')) },
      ]"
    >
      <!--
        Par 1: alternativa explícita.

        A legenda promete "as mesmas ações também via botão visível", então o
        lado do faça DESENHA o botão — anunciá-lo por escrito ("+ botão
        visível") era contar, não mostrar. Os dois menus levam as mesmas ações;
        o que muda entre os lados é só o botão.
      -->
      <template #do-preview-0>
        <div
          class="nds-stack"
          data-spacing="sm"
          data-align="center"
        >
          <ContextMenu>
            <ContextMenuTrigger
              :class="areaClasse"
              data-align="center"
              data-justify="center"
            >
              {{ tContent('demonstration.labels.triggerLabel') }}
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem>{{ tContent('demonstration.labels.edit') }}</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem variant="destructive">
                {{ tContent('demonstration.labels.delete') }}
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
          <!-- A MESMA ação do menu, alcançável sem o botão direito. -->
          <Button
            variant="outline"
            size="sm"
          >
            {{ tContent('demonstration.labels.edit') }}
          </Button>
        </div>
      </template>
      <template #dont-preview-0>
        <ContextMenu>
          <ContextMenuTrigger
            :class="areaClasse"
            data-align="center"
            data-justify="center"
          >
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>{{ tContent('demonstration.labels.edit') }}</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive">
              {{ tContent('demonstration.labels.delete') }}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </template>

      <!--
        Par 2: item destrutivo separado.

        Todo rótulo sai do conteúdo compartilhado. O par desenhava seis literais
        em português — "Clique com direito", "Nível 1", "Ação" e afins — que
        ficam em português para quem lê a página em inglês ou espanhol, sem erro
        e sem aviso.
      -->
      <template #do-preview-1>
        <ContextMenu>
          <ContextMenuTrigger
            :class="areaClasse"
            data-align="center"
            data-justify="center"
          >
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>{{ tContent('demonstration.labels.edit') }}</ContextMenuItem>
            <ContextMenuItem>{{ tContent('demonstration.labels.duplicate') }}</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive">
              {{ tContent('demonstration.labels.delete') }}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </template>
      <!-- Submenu dentro de submenu — o anti-padrão que `notes.tip3` nomeia. -->
      <template #dont-preview-1>
        <ContextMenu>
          <ContextMenuTrigger
            :class="areaClasse"
            data-align="center"
            data-justify="center"
          >
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSub>
              <ContextMenuSubTrigger>{{ tContent('demonstration.labels.share') }}</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuSub>
                  <ContextMenuSubTrigger>{{ tContent('demonstration.labels.shareLink') }}</ContextMenuSubTrigger>
                  <ContextMenuSubContent>
                    <ContextMenuItem>{{ tContent('demonstration.labels.shareEmail') }}</ContextMenuItem>
                  </ContextMenuSubContent>
                </ContextMenuSub>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      </template>

      <!--
        Par 3: dica visual de que a área tem menu de contexto.

        As duas metades da legenda falam de DICA VISUAL, e é o contorno que faz
        a diferença: à esquerda a moldura tracejada da constante compartilhada
        mais a linha que diz o gesto; à direita a mesma área SEM moldura e sem
        aviso — o menu existe e ninguém tem como saber. Com o tracejado dos dois
        lados só o rótulo mudava, e o par não ilustrava a legenda que carrega.

        Os dois rótulos saem do conteúdo compartilhado. O lado do evite era um
        `<div>` desenhado à mão, com literal em português e a borda tracejada em
        `style` inline — além de imitação, desenhava justamente a dica que a
        legenda manda tirar.
      -->
      <template #do-preview-2>
        <ContextMenu>
          <ContextMenuTrigger
            :class="areaClasse"
            data-align="center"
            data-justify="center"
          >
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>{{ tContent('demonstration.labels.edit') }}</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive">
              {{ tContent('demonstration.labels.delete') }}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </template>
      <template #dont-preview-2>
        <ContextMenu>
          <ContextMenuTrigger
            :class="areaSemDicaClasse"
            data-align="center"
            data-justify="center"
          >
            {{ tContent('demonstration.labels.areaNoHint') }}
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>{{ tContent('demonstration.labels.edit') }}</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive">
              {{ tContent('demonstration.labels.delete') }}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </template>
    </DocsDoDont>

    <!-- ── Importação ───────────────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :description="tContent('import.basic')"
      :code="codeImportBasic"
      :secondary-description="tContent('import.withSub')"
      :secondary-code="codeImportWithSub"
    />

    <!-- ── Variantes ────────────────────────────────────────────────────────── -->
    <DocsCompositions
      id="variantes"
      :title="tContent('variants.title')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="context-menu"
      :items="variantItems"
    >
      <!-- default -->
      <template #variant-preview-0>
        <ContextMenu>
          <ContextMenuTrigger
            :class="areaClasse"
            data-align="center"
            data-justify="center"
          >
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>
              {{ tContent('demonstration.labels.edit') }}
              <ContextMenuShortcut>{{ tContent('demonstration.labels.editShortcut') }}</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>{{ tContent('demonstration.labels.duplicate') }}</ContextMenuItem>
            <ContextMenuItem>{{ tContent('demonstration.labels.share') }}</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </template>

      <!-- destructive -->
      <template #variant-preview-1>
        <ContextMenu>
          <ContextMenuTrigger
            :class="areaClasse"
            data-align="center"
            data-justify="center"
          >
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>{{ tContent('demonstration.labels.edit') }}</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive">
              {{ tContent('demonstration.labels.delete') }}
              <ContextMenuShortcut>{{ tContent('demonstration.labels.deleteShortcut') }}</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </template>

      <!-- Label inset -->
      <template #variant-preview-2>
        <ContextMenu>
          <ContextMenuTrigger
            :class="areaClasse"
            data-align="center"
            data-justify="center"
          >
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel inset>
              Arquivo
            </ContextMenuLabel>
            <ContextMenuSeparator />
            <ContextMenuItem inset>
              {{ tContent('demonstration.labels.edit') }}
            </ContextMenuItem>
            <ContextMenuItem inset>
              {{ tContent('demonstration.labels.duplicate') }}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </template>
      <!-- withCheckbox -->
      <template #variant-preview-3>
        <ContextMenu>
          <ContextMenuTrigger
            :class="areaClasse"
            data-align="center"
            data-justify="center"
          >
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuGroup>
              <ContextMenuLabel inset>
                Visualização
              </ContextMenuLabel>
              <ContextMenuCheckboxItem
                :checked="compShowGrid"
                @update:checked="compShowGrid = $event"
              >
                Mostrar grade
              </ContextMenuCheckboxItem>
              <ContextMenuCheckboxItem
                :checked="compShowRulers"
                @update:checked="compShowRulers = $event"
              >
                Mostrar réguas
              </ContextMenuCheckboxItem>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      </template>

      <!-- withRadio -->
      <template #variant-preview-4>
        <ContextMenu>
          <ContextMenuTrigger
            :class="areaClasse"
            data-align="center"
            data-justify="center"
          >
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuGroup>
              <ContextMenuLabel inset>
                Zoom
              </ContextMenuLabel>
              <ContextMenuRadioGroup
                :model-value="compZoom"
                @update:model-value="compZoom = $event as string"
              >
                <ContextMenuRadioItem value="75">
                  75%
                </ContextMenuRadioItem>
                <ContextMenuRadioItem value="100">
                  100%
                </ContextMenuRadioItem>
                <ContextMenuRadioItem value="150">
                  150%
                </ContextMenuRadioItem>
              </ContextMenuRadioGroup>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      </template>

      <!-- withSubmenu -->
      <template #variant-preview-5>
        <ContextMenu>
          <ContextMenuTrigger
            :class="areaClasse"
            data-align="center"
            data-justify="center"
          >
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>{{ tContent('demonstration.labels.edit') }}</ContextMenuItem>
            <ContextMenuItem>{{ tContent('demonstration.labels.duplicate') }}</ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>{{ tContent('demonstration.labels.share') }}</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem>{{ tContent('demonstration.labels.shareEmail') }}</ContextMenuItem>
                <ContextMenuItem>{{ tContent('demonstration.labels.shareLink') }}</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      </template>

      <!-- withShortcuts -->
      <template #variant-preview-6>
        <ContextMenu>
          <ContextMenuTrigger
            :class="areaClasse"
            data-align="center"
            data-justify="center"
          >
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>
              {{ tContent('demonstration.labels.edit') }}
              <ContextMenuShortcut>{{ tContent('demonstration.labels.editShortcut') }}</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              {{ tContent('demonstration.labels.duplicate') }}
              <ContextMenuShortcut>Ctrl+D</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive">
              {{ tContent('demonstration.labels.delete') }}
              <ContextMenuShortcut>{{ tContent('demonstration.labels.deleteShortcut') }}</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </template>
    </DocsCompositions>

    <!-- ── Estados ──────────────────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{
        state: tContent('states.cols.state'),
        trigger: toPlainText(tContent('states.cols.trigger')),
        behavior: toPlainText(tContent('states.cols.behavior')),
      }"
      :items="stateItems"
    />

    <!-- ── Propriedades ─────────────────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: tContent('props.contentTitle'), cols: propCols, items: contentPropItems },
        { title: tContent('props.itemTitle'), cols: propCols, items: itemPropItems },
        { title: tContent('props.checkboxItemTitle'), cols: propCols, items: checkboxItemPropItems },
        { title: tContent('props.radioGroupTitle'), cols: propCols, items: radioGroupPropItems },
        { title: tContent('props.radioItemTitle'), cols: propCols, items: radioItemPropItems },
        { title: tContent('props.labelTitle'), cols: propCols, items: labelPropItems },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="tContent('props.extensibility')"
    />

    <!-- ── Tokens ───────────────────────────────────────────────────────────── -->
    <DocsTokens
      :title="tContent('tokens.title')"
      :cols="{
        token: tContent('tokens.table.token'),
        value: tContent('tokens.table.class'),
        description: tContent('tokens.table.part'),
      }"
      :items="tokenRows"
      :customization-title="tContent('tokens.customizationTitle')"
      :customization-code="codeCustomizationTokens"
    />

    <!-- ── Acessibilidade ───────────────────────────────────────────────────── -->
    <DocsAccessibility
      :screen-reader-title="tNav('common.screenReader')"
      :screen-reader-items="screenReaderItems"
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-title="tNav('nav.accessibility')"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ─────────────────────────────────────────────────────── -->
    <DocsRelated
      :title="tContent('related.title')"
      :items="relatedItems"
    />

    <!-- ── Notas ────────────────────────────────────────────────────────────── -->
    <DocsNotes
      :title="tContent('notes.title')"
      :items="noteItems"
    />

    <!-- ── Analytics ────────────────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :cols="{
        event: tContent('analytics.table.event'),
        trigger: toPlainText(tContent('analytics.table.trigger')),
        payload: tContent('analytics.table.payload'),
      }"
      :items="analyticsItems"
    />

    <!-- ── Testes ────────────────────────────────────────────────────────────── -->
    <DocsTestes
      :title="tContent('testes.title')"
      :functional="{
        title: tContent('testes.functional.title'),
        cols: {
          action: tNav('common.userAction'),
          result: tNav('common.expectedResult'),
          priority: tNav('common.priority'),
        },
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
