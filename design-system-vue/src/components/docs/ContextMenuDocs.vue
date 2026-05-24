<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { Badge } from '@/components/ui/badge';
import LanguageSwitcher from '@/components/product/LanguageSwitcher.vue';
import uiTranslations from '@/i18n/ui.json';
import componentTranslations from '@shared/content/context-menu/translations.json';
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

import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.vue';
import DocsPageLayout    from '@/components/docs/shared/sections/DocsPageLayout.vue';
import DocsDemonstration from '@/components/docs/shared/sections/DocsDemonstration.vue';
import DocsAnatomy       from '@/components/docs/shared/sections/DocsAnatomy.vue';
import DocsWhenToUse     from '@/components/docs/shared/sections/DocsWhenToUse.vue';
import DocsDoDont        from '@/components/docs/shared/sections/DocsDoDont.vue';
import DocsImport        from '@/components/docs/shared/sections/DocsImport.vue';
import DocsVariants      from '@/components/docs/shared/sections/DocsVariants.vue';
import DocsCompositions  from '@/components/docs/shared/sections/DocsCompositions.vue';
import DocsStates        from '@/components/docs/shared/sections/DocsStates.vue';
import DocsProps         from '@/components/docs/shared/sections/DocsProps.vue';
import DocsTokens        from '@/components/docs/shared/sections/DocsTokens.vue';
import DocsAccessibility from '@/components/docs/shared/sections/DocsAccessibility.vue';
import DocsRelated       from '@/components/docs/shared/sections/DocsRelated.vue';
import DocsNotes         from '@/components/docs/shared/sections/DocsNotes.vue';
import DocsAnalytics     from '@/components/docs/shared/sections/DocsAnalytics.vue';
import DocsTestes        from '@/components/docs/shared/sections/DocsTestes.vue';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation({ ...uiTranslations, ...componentTranslations });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function localPriority(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

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
      { id: 'composicoes',  label: tNav('nav.compositions') },
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
  <ContextMenuContent class="w-52">
    <ContextMenuItem>
      Editar
      <ContextMenuShortcut>⌘E</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem>Duplicar</ContextMenuItem>
    <ContextMenuItem>Compartilhar</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`;

const codeDestructive = `<ContextMenu>
  <ContextMenuTrigger>Clique com o botão direito</ContextMenuTrigger>
  <ContextMenuContent class="w-52">
    <ContextMenuItem>Editar</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive">
      Excluir
      <ContextMenuShortcut>⌫</ContextMenuShortcut>
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`;

const codeCheckboxItem = `<ContextMenuCheckboxItem
  :checked="showGrid"
  @update:checked="showGrid = $event"
>
  Mostrar grade
</ContextMenuCheckboxItem>`;

const codeRadioGroup = `<ContextMenuRadioGroup
  :model-value="layout"
  @update:model-value="layout = $event"
>
  <ContextMenuRadioItem value="grid">Grade</ContextMenuRadioItem>
  <ContextMenuRadioItem value="list">Lista</ContextMenuRadioItem>
</ContextMenuRadioGroup>`;

const codeSubTrigger = `<ContextMenuSub>
  <ContextMenuSubTrigger>Compartilhar</ContextMenuSubTrigger>
  <ContextMenuSubContent class="w-40">
    <ContextMenuItem>Por e-mail</ContextMenuItem>
    <ContextMenuItem>Por link</ContextMenuItem>
  </ContextMenuSubContent>
</ContextMenuSub>`;

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
  tContent('anatomy.item10'),
  tContent('anatomy.item11'),
]);

const variantItems = computed(() => [
  { name: 'default',      description: stripHtml(tContent('variants.items.default')),      code: codeDefault       },
  { name: 'destructive',  description: stripHtml(tContent('variants.items.destructive')),  code: codeDestructive   },
  { name: 'CheckboxItem', description: stripHtml(tContent('variants.checkboxItem')),        code: codeCheckboxItem  },
  { name: 'RadioItem',    description: stripHtml(tContent('variants.radioItem')),           code: codeRadioGroup    },
  { name: 'SubTrigger',   description: stripHtml(tContent('variants.subTrigger')),          code: codeSubTrigger    },
  { name: 'Label',        description: stripHtml(tContent('variants.label')),               code: codeLabel         },
]);

const stateItems = computed(() => [
  { label: tContent('states.closed.label'),   trigger: tContent('states.closed.trigger'),   behavior: tContent('states.closed.behavior')   },
  { label: tContent('states.open.label'),     trigger: tContent('states.open.trigger'),     behavior: tContent('states.open.behavior')     },
  { label: tContent('states.focused.label'),  trigger: stripHtml(tContent('states.focused.trigger')),  behavior: tContent('states.focused.behavior')  },
  { label: tContent('states.disabled.label'), trigger: stripHtml(tContent('states.disabled.trigger')), behavior: tContent('states.disabled.behavior') },
  { label: tContent('states.checked.label'),  trigger: stripHtml(tContent('states.checked.trigger')),  behavior: tContent('states.checked.behavior')  },
  { label: tContent('states.subOpen.label'),  trigger: tContent('states.subOpen.trigger'),  behavior: tContent('states.subOpen.behavior')  },
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

const tokenRows = computed(() => [
  { token: '--popover',             value: 'bg-popover',           description: tContent('tokens.table.popoverBg')        },
  { token: '--popover-foreground',  value: 'text-popover-foreground', description: tContent('tokens.table.popoverFg')     },
  { token: '--accent',              value: 'bg-accent',            description: tContent('tokens.table.accentBg')         },
  { token: '--accent-foreground',   value: 'text-accent-foreground', description: tContent('tokens.table.accentFg')       },
  { token: '--destructive',         value: 'text-destructive',     description: tContent('tokens.table.destructive')      },
  { token: '--destructive',         value: 'bg-destructive/10',    description: tContent('tokens.table.destructiveFocus') },
  { token: '--muted-foreground',    value: 'text-muted-foreground', description: tContent('tokens.table.mutedFg')         },
  { token: '--border',              value: 'bg-border',            description: tContent('tokens.table.border')           },
  { token: '--shadow',              value: 'shadow-md',            description: tContent('tokens.table.shadow')           },
  { token: '--radius',              value: 'rounded-md',           description: tContent('tokens.table.radius')           },
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
  { key: 'Right Click',  description: tContent('accessibility.keyboard.rightClick') },
  { key: '↓',            description: tContent('accessibility.keyboard.arrowDown')  },
  { key: '↑',            description: tContent('accessibility.keyboard.arrowUp')    },
  { key: '→',            description: tContent('accessibility.keyboard.arrowRight') },
  { key: '←',            description: tContent('accessibility.keyboard.arrowLeft')  },
  { key: 'Enter',        description: tContent('accessibility.keyboard.enter')      },
  { key: 'Space',        description: tContent('accessibility.keyboard.space')      },
  { key: 'Esc',          description: tContent('accessibility.keyboard.escape')     },
  { key: 'Tab',          description: tContent('accessibility.keyboard.tab')        },
]);

const relatedItems = computed(() => [
  { name: 'DropdownMenu', description: tContent('related.dropdownMenu'), path: '?path=/docs/ui-dropdownmenu--docs' },
  { name: 'Menubar',      description: tContent('related.menubar'),      path: '?path=/docs/ui-menubar--docs'      },
  { name: 'Dialog',       description: tContent('related.dialog'),       path: '?path=/docs/ui-dialog--docs'       },
  { name: 'AlertDialog',  description: tContent('related.alertDialog'),  path: '?path=/docs/ui-alertdialog--docs'  },
  { name: 'Tooltip',      description: tContent('related.tooltip'),      path: '?path=/docs/ui-tooltip--docs'      },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.tip1') },
  { title: '', content: tContent('notes.tip2') },
  { title: '', content: tContent('notes.tip3') },
  { title: '', content: tContent('notes.tip4') },
  { title: '', content: tContent('notes.tip5') },
]);

const analyticsItems = computed(() => [
  { event: tContent('analytics.table.menuOpen'),     trigger: tContent('analytics.table.menuOpenTrigger'),     payload: tContent('analytics.table.menuOpenPayload')     },
  { event: tContent('analytics.table.itemClick'),    trigger: tContent('analytics.table.itemClickTrigger'),    payload: tContent('analytics.table.itemClickPayload')    },
  { event: tContent('analytics.table.pageView'),     trigger: tContent('analytics.table.pageViewTrigger'),     payload: tContent('analytics.table.pageViewPayload')     },
  { event: tContent('analytics.table.sectionViewed'), trigger: tContent('analytics.table.sectionViewedTrigger'), payload: tContent('analytics.table.sectionViewedPayload') },
  { event: tContent('analytics.table.langSwitch'),   trigger: tContent('analytics.table.langSwitchTrigger'),   payload: tContent('analytics.table.langSwitchPayload')   },
]);

const a11yCritCols = computed(() => ({
  criterion: tNav('common.criterion'),
  level: 'WCAG',
  how: tNav('common.howToVerify'),
}));

const functionalTestItems = computed(() => [
  { action: tContent('testes.functional.item1.action'),  result: tContent('testes.functional.item1.result'),  priority: localPriority(tContent('testes.functional.item1.priority'))  },
  { action: tContent('testes.functional.item2.action'),  result: tContent('testes.functional.item2.result'),  priority: localPriority(tContent('testes.functional.item2.priority'))  },
  { action: tContent('testes.functional.item3.action'),  result: tContent('testes.functional.item3.result'),  priority: localPriority(tContent('testes.functional.item3.priority'))  },
  { action: tContent('testes.functional.item4.action'),  result: tContent('testes.functional.item4.result'),  priority: localPriority(tContent('testes.functional.item4.priority'))  },
  { action: tContent('testes.functional.item5.action'),  result: tContent('testes.functional.item5.result'),  priority: localPriority(tContent('testes.functional.item5.priority'))  },
  { action: tContent('testes.functional.item6.action'),  result: tContent('testes.functional.item6.result'),  priority: localPriority(tContent('testes.functional.item6.priority'))  },
  { action: tContent('testes.functional.item7.action'),  result: tContent('testes.functional.item7.result'),  priority: localPriority(tContent('testes.functional.item7.priority'))  },
  { action: tContent('testes.functional.item8.action'),  result: tContent('testes.functional.item8.result'),  priority: localPriority(tContent('testes.functional.item8.priority'))  },
  { action: tContent('testes.functional.item9.action'),  result: tContent('testes.functional.item9.result'),  priority: localPriority(tContent('testes.functional.item9.priority'))  },
  { action: tContent('testes.functional.item10.action'), result: tContent('testes.functional.item10.result'), priority: localPriority(tContent('testes.functional.item10.priority')) },
]);

const a11yTestItems = computed(() => [
  { criterion: tContent('testes.accessibility.item1'), level: 'WCAG 2.1 AA', how: 'axe-core'        },
  { criterion: tContent('testes.accessibility.item2'), level: 'WCAG 4.1.2',  how: 'Inspeção DOM'    },
  { criterion: tContent('testes.accessibility.item3'), level: 'WCAG 4.1.2',  how: 'Inspeção DOM'    },
  { criterion: tContent('testes.accessibility.item4'), level: 'WCAG 4.1.2',  how: 'Inspeção DOM'    },
  { criterion: tContent('testes.accessibility.item5'), level: 'WCAG 4.1.2',  how: 'Inspeção DOM'    },
  { criterion: tContent('testes.accessibility.item6'), level: 'WCAG 4.1.2',  how: 'Inspeção DOM'    },
  { criterion: tContent('testes.accessibility.item7'), level: 'WCAG 2.1.1',  how: 'Teste de teclado' },
  { criterion: tContent('testes.accessibility.item8'), level: 'WCAG 1.4.3',  how: 'Contrast checker' },
]);

const visualTestItems = computed(() => [
  { story: tContent('testes.visual.item1.story'), priority: localPriority(tContent('testes.visual.item1.priority')) },
  { story: tContent('testes.visual.item2.story'), priority: localPriority(tContent('testes.visual.item2.priority')) },
  { story: tContent('testes.visual.item3.story'), priority: localPriority(tContent('testes.visual.item3.priority')) },
  { story: tContent('testes.visual.item4.story'), priority: localPriority(tContent('testes.visual.item4.priority')) },
  { story: tContent('testes.visual.item5.story'), priority: localPriority(tContent('testes.visual.item5.priority')) },
  { story: tContent('testes.visual.item6.story'), priority: localPriority(tContent('testes.visual.item6.priority')) },
]);

// ─── Demo state ───────────────────────────────────────────────────────────────
const demoShowGrid = ref(true);
const demoLayout   = ref('grid');

// Composições — state
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
      <ContextMenuShortcut>⌘E</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem>
      Duplicar
      <ContextMenuShortcut>⌘D</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive">
      Excluir
      <ContextMenuShortcut>⌫</ContextMenuShortcut>
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`;

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.withCheckbox.name'),
    description: tContent('variants.compositions.withCheckbox.description'),
    useWhen: tContent('variants.compositions.withCheckbox.use'),
    code: codeCompositionCheckbox,
  },
  {
    name: tContent('variants.compositions.withRadio.name'),
    description: tContent('variants.compositions.withRadio.description'),
    useWhen: tContent('variants.compositions.withRadio.use'),
    code: codeCompositionRadio,
  },
  {
    name: tContent('variants.compositions.withSubmenu.name'),
    description: tContent('variants.compositions.withSubmenu.description'),
    useWhen: tContent('variants.compositions.withSubmenu.use'),
    code: codeCompositionSubmenu,
  },
  {
    name: tContent('variants.compositions.withShortcuts.name'),
    description: tContent('variants.compositions.withShortcuts.description'),
    useWhen: tContent('variants.compositions.withShortcuts.use'),
    code: codeCompositionShortcuts,
  },
]);
</script>

<template>
  <DocsPageLayout :nav-groups="navGroups" :active-section="activeSection" component-slug="context-menu">
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
        install-note="npx shadcn-vue@latest add context-menu"
      >
        <template #badges>
          <Badge
            variant="secondary"
            class="rounded-md bg-primary/5 text-primary border-primary/10 hover:bg-primary/5 font-medium px-2 py-0"
          >
            {{ tContent('category') }}
          </Badge>
          <Badge
            variant="secondary"
            class="rounded-md bg-primary/5 text-primary border-primary/10 hover:bg-primary/5 font-medium px-2 py-0"
          >
            {{ tContent('type') }}
          </Badge>
        </template>
        <template #language-switcher>
          <LanguageSwitcher />
        </template>
      </DocsHeader>
    </template>

    <!-- ── Demonstração ─────────────────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div class="flex items-center justify-center w-full py-8">
        <ContextMenu>
          <ContextMenuTrigger
            class="flex h-(--height-default) w-72 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground select-none cursor-default"
          >
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent class="w-52">
            <ContextMenuGroup>
              <ContextMenuItem>
                {{ tContent('demonstration.labels.edit') }}
                <ContextMenuShortcut>{{ tContent('demonstration.labels.editShortcut') }}</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem>{{ tContent('demonstration.labels.duplicate') }}</ContextMenuItem>
              <ContextMenuSub>
                <ContextMenuSubTrigger>{{ tContent('demonstration.labels.share') }}</ContextMenuSubTrigger>
                <ContextMenuSubContent class="w-40">
                  <ContextMenuItem>{{ tContent('demonstration.labels.shareEmail') }}</ContextMenuItem>
                  <ContextMenuItem>{{ tContent('demonstration.labels.shareLink') }}</ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
            </ContextMenuGroup>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive">
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
      :guidelines="{
        title: tContent('usage.guidelines.title'),
        items: [
          tContent('usage.guidelines.item1'),
          tContent('usage.guidelines.item2'),
          tContent('usage.guidelines.item3'),
          tContent('usage.guidelines.item4'),
          tContent('usage.guidelines.item5'),
        ],
      }"
      :scenarios="{
        title: tContent('usage.scenarios.title'),
        cols: {
          scenario:    tContent('usage.scenarios.cols.scenario'),
          use:         tContent('usage.scenarios.cols.use'),
          alternative: tContent('usage.scenarios.cols.alternative'),
        },
        items: [
          { s: tContent('usage.scenarios.item1.s'), u: tContent('usage.scenarios.item1.u'), a: tContent('usage.scenarios.item1.a') },
          { s: tContent('usage.scenarios.item2.s'), u: tContent('usage.scenarios.item2.u'), a: tContent('usage.scenarios.item2.a') },
          { s: tContent('usage.scenarios.item3.s'), u: tContent('usage.scenarios.item3.u'), a: tContent('usage.scenarios.item3.a') },
          { s: tContent('usage.scenarios.item4.s'), u: tContent('usage.scenarios.item4.u'), a: tContent('usage.scenarios.item4.a') },
        ],
      }"
      :do="{ title: tContent('usage.do.title'), items: [tContent('usage.do.item1'), tContent('usage.do.item2'), tContent('usage.do.item3'), tContent('usage.do.item4')] }"
      :dont="{ title: tContent('usage.dont.title'), items: [tContent('usage.dont.item1'), tContent('usage.dont.item2'), tContent('usage.dont.item3')] }"
    />

    <!-- ── Do & Don't ───────────────────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="[
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: tContent('doDont.pair1.do'), dontCaption: tContent('doDont.pair1.dont') },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: tContent('doDont.pair2.do'), dontCaption: tContent('doDont.pair2.dont') },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: tContent('doDont.pair3.do'), dontCaption: tContent('doDont.pair3.dont') },
      ]"
    >
      <!-- Par 1: alternativa explícita -->
      <template #do-preview-0>
        <div class="flex gap-2 items-center">
          <ContextMenu>
            <ContextMenuTrigger class="flex h-(--height-default) w-44 items-center justify-center rounded border border-dashed border-border text-xs text-muted-foreground select-none cursor-default">
              Área com menu
            </ContextMenuTrigger>
            <ContextMenuContent class="w-40">
              <ContextMenuItem>Editar</ContextMenuItem>
              <ContextMenuItem variant="destructive">Excluir</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
          <span class="text-xs text-muted-foreground">+ botão visível</span>
        </div>
      </template>
      <template #dont-preview-0>
        <ContextMenu>
          <ContextMenuTrigger class="flex h-(--height-default) w-44 items-center justify-center rounded border border-dashed border-border text-xs text-muted-foreground select-none cursor-default">
            Área (sem botão)
          </ContextMenuTrigger>
          <ContextMenuContent class="w-40">
            <ContextMenuItem variant="destructive">Excluir</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </template>

      <!-- Par 2: item destrutivo separado -->
      <template #do-preview-1>
        <ContextMenu>
          <ContextMenuTrigger class="flex h-(--height-default) w-44 items-center justify-center rounded border border-dashed border-border text-xs text-muted-foreground select-none cursor-default">
            Clique com direito
          </ContextMenuTrigger>
          <ContextMenuContent class="w-40">
            <ContextMenuItem>Editar</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive">Excluir</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </template>
      <template #dont-preview-1>
        <ContextMenu>
          <ContextMenuTrigger class="flex h-(--height-default) w-44 items-center justify-center rounded border border-dashed border-border text-xs text-muted-foreground select-none cursor-default">
            Clique com direito
          </ContextMenuTrigger>
          <ContextMenuContent class="w-40">
            <ContextMenuSub>
              <ContextMenuSubTrigger>Nível 1</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuSub>
                  <ContextMenuSubTrigger>Nível 2</ContextMenuSubTrigger>
                  <ContextMenuSubContent>
                    <ContextMenuItem>Ação</ContextMenuItem>
                  </ContextMenuSubContent>
                </ContextMenuSub>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      </template>

      <!-- Par 3: shortcut visual + listener separado -->
      <template #do-preview-2>
        <ContextMenu>
          <ContextMenuTrigger class="flex h-(--height-default) w-44 items-center justify-center rounded border border-dashed border-border text-xs text-muted-foreground select-none cursor-default">
            Clique com direito
          </ContextMenuTrigger>
          <ContextMenuContent class="w-40">
            <ContextMenuItem>
              Editar
              <ContextMenuShortcut>⌘E</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </template>
      <template #dont-preview-2>
        <div class="flex h-(--height-default) w-44 items-center justify-center rounded border border-dashed border-border text-xs text-muted-foreground select-none">
          <span>Sem dica visual</span>
        </div>
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
    <DocsVariants :title="tContent('variants.title')" :items="variantItems">
      <!-- default -->
      <template #variant-preview-0>
        <ContextMenu>
          <ContextMenuTrigger class="flex h-(--height-default) w-52 items-center justify-center rounded border border-dashed border-border text-xs text-muted-foreground select-none cursor-default">
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent class="w-48">
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
          <ContextMenuTrigger class="flex h-(--height-default) w-52 items-center justify-center rounded border border-dashed border-border text-xs text-muted-foreground select-none cursor-default">
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent class="w-48">
            <ContextMenuItem>{{ tContent('demonstration.labels.edit') }}</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive">
              {{ tContent('demonstration.labels.delete') }}
              <ContextMenuShortcut>{{ tContent('demonstration.labels.deleteShortcut') }}</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </template>

      <!-- CheckboxItem -->
      <template #variant-preview-2>
        <ContextMenu>
          <ContextMenuTrigger class="flex h-(--height-default) w-52 items-center justify-center rounded border border-dashed border-border text-xs text-muted-foreground select-none cursor-default">
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent class="w-48">
            <ContextMenuCheckboxItem :checked="demoShowGrid" @update:checked="demoShowGrid = $event">
              Mostrar grade
            </ContextMenuCheckboxItem>
          </ContextMenuContent>
        </ContextMenu>
      </template>

      <!-- RadioItem -->
      <template #variant-preview-3>
        <ContextMenu>
          <ContextMenuTrigger class="flex h-(--height-default) w-52 items-center justify-center rounded border border-dashed border-border text-xs text-muted-foreground select-none cursor-default">
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent class="w-48">
            <ContextMenuRadioGroup :model-value="demoLayout" @update:model-value="demoLayout = $event as string">
              <ContextMenuRadioItem value="grid">Grade</ContextMenuRadioItem>
              <ContextMenuRadioItem value="list">Lista</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuContent>
        </ContextMenu>
      </template>

      <!-- SubTrigger -->
      <template #variant-preview-4>
        <ContextMenu>
          <ContextMenuTrigger class="flex h-(--height-default) w-52 items-center justify-center rounded border border-dashed border-border text-xs text-muted-foreground select-none cursor-default">
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent class="w-48">
            <ContextMenuSub>
              <ContextMenuSubTrigger>{{ tContent('demonstration.labels.share') }}</ContextMenuSubTrigger>
              <ContextMenuSubContent class="w-40">
                <ContextMenuItem>{{ tContent('demonstration.labels.shareEmail') }}</ContextMenuItem>
                <ContextMenuItem>{{ tContent('demonstration.labels.shareLink') }}</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      </template>

      <!-- Label inset -->
      <template #variant-preview-5>
        <ContextMenu>
          <ContextMenuTrigger class="flex h-(--height-default) w-52 items-center justify-center rounded border border-dashed border-border text-xs text-muted-foreground select-none cursor-default">
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent class="w-48">
            <ContextMenuLabel inset>Arquivo</ContextMenuLabel>
            <ContextMenuSeparator />
            <ContextMenuItem inset>{{ tContent('demonstration.labels.edit') }}</ContextMenuItem>
            <ContextMenuItem inset>{{ tContent('demonstration.labels.duplicate') }}</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </template>
    </DocsVariants>

    <!-- ── Composições ──────────────────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="context-menu"
      :items="compositionItems"
    >
      <!-- withCheckbox -->
      <template #variant-preview-0>
        <ContextMenu>
          <ContextMenuTrigger class="flex h-(--height-default) w-52 items-center justify-center rounded border border-dashed border-border text-xs text-muted-foreground select-none cursor-default">
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent class="w-52">
            <ContextMenuGroup>
              <ContextMenuLabel inset>Visualização</ContextMenuLabel>
              <ContextMenuCheckboxItem :checked="compShowGrid" @update:checked="compShowGrid = $event">
                Mostrar grade
              </ContextMenuCheckboxItem>
              <ContextMenuCheckboxItem :checked="compShowRulers" @update:checked="compShowRulers = $event">
                Mostrar réguas
              </ContextMenuCheckboxItem>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      </template>

      <!-- withRadio -->
      <template #variant-preview-1>
        <ContextMenu>
          <ContextMenuTrigger class="flex h-(--height-default) w-52 items-center justify-center rounded border border-dashed border-border text-xs text-muted-foreground select-none cursor-default">
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent class="w-52">
            <ContextMenuGroup>
              <ContextMenuLabel inset>Zoom</ContextMenuLabel>
              <ContextMenuRadioGroup :model-value="compZoom" @update:model-value="compZoom = $event as string">
                <ContextMenuRadioItem value="75">75%</ContextMenuRadioItem>
                <ContextMenuRadioItem value="100">100%</ContextMenuRadioItem>
                <ContextMenuRadioItem value="150">150%</ContextMenuRadioItem>
              </ContextMenuRadioGroup>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      </template>

      <!-- withSubmenu -->
      <template #variant-preview-2>
        <ContextMenu>
          <ContextMenuTrigger class="flex h-(--height-default) w-52 items-center justify-center rounded border border-dashed border-border text-xs text-muted-foreground select-none cursor-default">
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent class="w-52">
            <ContextMenuItem>{{ tContent('demonstration.labels.edit') }}</ContextMenuItem>
            <ContextMenuItem>{{ tContent('demonstration.labels.duplicate') }}</ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>{{ tContent('demonstration.labels.share') }}</ContextMenuSubTrigger>
              <ContextMenuSubContent class="w-40">
                <ContextMenuItem>{{ tContent('demonstration.labels.shareEmail') }}</ContextMenuItem>
                <ContextMenuItem>{{ tContent('demonstration.labels.shareLink') }}</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      </template>

      <!-- withShortcuts -->
      <template #variant-preview-3>
        <ContextMenu>
          <ContextMenuTrigger class="flex h-(--height-default) w-52 items-center justify-center rounded border border-dashed border-border text-xs text-muted-foreground select-none cursor-default">
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent class="w-52">
            <ContextMenuItem>
              {{ tContent('demonstration.labels.edit') }}
              <ContextMenuShortcut>{{ tContent('demonstration.labels.editShortcut') }}</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              {{ tContent('demonstration.labels.duplicate') }}
              <ContextMenuShortcut>⌘D</ContextMenuShortcut>
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
        state:    tContent('states.cols.state'),
        trigger:  tContent('states.cols.trigger'),
        behavior: tContent('states.cols.behavior'),
      }"
      :items="stateItems"
    />

    <!-- ── Propriedades ─────────────────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: tContent('props.contentTitle'),       cols: propCols, items: contentPropItems       },
        { title: tContent('props.itemTitle'),          cols: propCols, items: itemPropItems           },
        { title: tContent('props.checkboxItemTitle'),  cols: propCols, items: checkboxItemPropItems   },
        { title: tContent('props.radioGroupTitle'),    cols: propCols, items: radioGroupPropItems     },
        { title: tContent('props.radioItemTitle'),     cols: propCols, items: radioItemPropItems      },
        { title: tContent('props.labelTitle'),         cols: propCols, items: labelPropItems          },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="tContent('props.extensibility')"
    />

    <!-- ── Tokens ───────────────────────────────────────────────────────────── -->
    <DocsTokens
      :title="tContent('tokens.title')"
      :cols="{
        token:       tContent('tokens.table.token'),
        value:       tContent('tokens.table.class'),
        description: tContent('tokens.table.part'),
      }"
      :items="tokenRows"
      :customization-title="tContent('tokens.customizationTitle')"
      :customization-code="codeCustomizationTokens"
    />

    <!-- ── Acessibilidade ───────────────────────────────────────────────────── -->
    <DocsAccessibility
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-title="tNav('nav.accessibility')"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ─────────────────────────────────────────────────────── -->
    <DocsRelated :title="tContent('related.title')" :items="relatedItems" />

    <!-- ── Notas ────────────────────────────────────────────────────────────── -->
    <DocsNotes :title="tContent('notes.title')" :items="noteItems" />

    <!-- ── Analytics ────────────────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :cols="{
        event:   tContent('analytics.table.event'),
        trigger: tContent('analytics.table.trigger'),
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
          action:   tNav('common.userAction'),
          result:   tNav('common.expectedResult'),
          priority: tNav('common.priority'),
        },
        items: functionalTestItems,
      }"
      :accessibility="{
        title: tContent('testes.accessibility.title'),
        cols:  a11yCritCols,
        items: a11yTestItems,
      }"
      :visual="{
        title: tContent('testes.visual.title'),
        cols:  { story: tNav('common.storyState'), priority: tNav('common.priority') },
        items: visualTestItems,
      }"
    />
  </DocsPageLayout>
</template>
