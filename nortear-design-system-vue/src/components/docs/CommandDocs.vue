<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';

import DocsPageLayout    from '@/components/docs/shared/sections/DocsPageLayout.vue';
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

import uiTranslations from '@/i18n/ui.json';
import commandTranslations from '@shared/content/command/translations.json';
import { toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(commandTranslations);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
// O `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
const screenReaderItems = computed(() =>
  Object.entries(
    (commandTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >)[locale.value]?.accessibility?.screenReader ?? {},
  )
    .filter(([key]) => key !== 'title')
    .map(([, value]) => value),
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function localPriority(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

// ─── SEO ──────────────────────────────────────────────────────────────────────

useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: 'command',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'command',
    locale: newLocale,
    page_title: `${tContent('title')} · Design System`,
  });
}, { immediate: true });

// ─── Navigation groups ────────────────────────────────────────────────────────

const navGroups = computed(() => [
  {
    label: tNav('nav.overview'),
    sections: [
      { id: 'demonstracao', label: tNav('nav.demonstration') },
      { id: 'anatomia',     label: tNav('nav.anatomy')      },
      { id: 'quando-usar',  label: tNav('nav.usage')        },
      { id: 'do-dont',      label: tNav('nav.doDont')       },
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
    component_name: 'command',
    locale: locale.value,
  });
});

// ─── Demonstrações: dados ─────────────────────────────────────────────────────

/** Seção da página de onde o gesto saiu (guideline 07). */
type DocsLocation = 'docs_demo' | 'docs_variantes' | 'docs_do_dont';

/** As duas montagens da paleta — é o que separa as séries no GA4. */
type Pattern = 'inline' | 'palette';

/** Chave estável do grupo — é ela que vai ao GA4, nunca o cabeçalho traduzido. */
type GroupKey = 'components' | 'utils';

interface DemoItem { value: string; label: string; shortcut?: string }
interface DemoBlock { key: GroupKey; heading: string; items: DemoItem[] }

// A demonstração inline e a paleta usam os MESMOS comandos (contrato da docs
// page nas cinco stacks): Componentes com Button e Input, Utilitários com
// Separator. A paleta acrescenta os atalhos.
const demoBlocks = computed<DemoBlock[]>(() => [
  {
    key: 'components',
    heading: tContent('demonstration.labels.groupComponents'),
    items: [
      { value: 'button', label: tContent('demonstration.labels.itemButton') },
      { value: 'input',  label: tContent('demonstration.labels.itemInput')  },
    ],
  },
  {
    key: 'utils',
    heading: tContent('demonstration.labels.groupUtils'),
    items: [
      { value: 'separator', label: tContent('demonstration.labels.itemSeparator') },
    ],
  },
]);

const paletteBlocks = computed<DemoBlock[]>(() => {
  const shortcuts: Record<string, string> = { button: 'Ctrl+B', input: 'Ctrl+I' };
  return demoBlocks.value.map((block) => ({
    ...block,
    items: block.items.map((item) => ({ ...item, shortcut: shortcuts[item.value] })),
  }));
});

// Os nomes de componente e de utilitário não se traduzem; os cabeçalhos, sim.
const groupedBlocks = computed<DemoBlock[]>(() => [
  {
    key: 'components',
    heading: tContent('demonstration.labels.groupComponents'),
    items: [
      { value: 'button',    label: 'Button'    },
      { value: 'input',     label: 'Input'     },
      { value: 'badge',     label: 'Badge'     },
      { value: 'separator', label: 'Separator' },
    ],
  },
  {
    key: 'utils',
    heading: tContent('demonstration.labels.groupUtils'),
    items: [
      { value: 'cn',      label: 'cn()'      },
      { value: 'clsx',    label: 'clsx()'    },
      { value: 'twmerge', label: 'twMerge()' },
    ],
  },
]);

// Par 1 do Do & Don't: os dois lados JÁ nascem com a mesma busca sem
// correspondência — o que muda é haver ou não uma frase para ler.
const DO_DONT_SEARCH = 'xyz';

const doDontItems = computed<DemoItem[]>(() => [
  { value: 'button', label: tContent('demonstration.labels.itemButton') },
  { value: 'input',  label: tContent('demonstration.labels.itemInput')  },
]);

// ─── Analytics — seleção ──────────────────────────────────────────────────────

// `label` é o VALOR do comando e `group` a chave do grupo: texto traduzido
// partiria o mesmo evento em três séries no GA4, uma por idioma.
function trackSelect(value: string, group: GroupKey, pattern: Pattern, location: DocsLocation) {
  track('command_item_select', {
    component: 'command',
    label: value,
    group,
    pattern,
    location,
  });
}

// ─── Paleta: abrir, escolher, Ctrl+K ──────────────────────────────────────────

// A paleta de verdade é uma só, a da demonstração: o card de Variantes a
// desenha aberta na página, sem Dialog, e o gatilho dele não abre nada.
const paletteOpen = ref(false);

function openPalette(trigger: 'keyboard' | 'button') {
  // Só ABRE: aberta, o atalho e o gatilho não fazem nada — nem fecham.
  if (paletteOpen.value) return;
  paletteOpen.value = true;
  track('command_palette_open', { component: 'command', trigger, location: 'docs_demo' });
}

function selectInPalette(value: string, group: GroupKey) {
  paletteOpen.value = false;
  trackSelect(value, group, 'palette', 'docs_demo');
}

// A demonstração exibe a dica do atalho, então a página responde a ela. Dica que
// a página não honra é promessa falsa na frente de quem está aprendendo o
// componente. O ouvinte vive enquanto a página está montada.
function onGlobalKeydown(event: KeyboardEvent) {
  if (event.key.toLowerCase() !== 'k' || !(event.ctrlKey || event.metaKey)) return;
  // Sem isto o navegador leva o atalho para a barra de endereço.
  event.preventDefault();
  openPalette('keyboard');
}

onMounted(() => window.addEventListener('keydown', onGlobalKeydown));
onUnmounted(() => window.removeEventListener('keydown', onGlobalKeydown));

// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";`;

const codeImportWithDialog = `import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";`;

// CommandEmpty fica FORA do CommandList: ele é uma região viva (role="status"),
// e região viva não é filha permitida de role="listbox".
const codeInline = `<Command>
  <CommandInput placeholder="Buscar componente..." />
  <CommandList>
    <CommandGroup heading="Componentes">
      <CommandItem value="button" @select="runCommand('button')">Button</CommandItem>
      <CommandItem value="input" @select="runCommand('input')">Input</CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Utilitários">
      <CommandItem value="separator" @select="runCommand('separator')">Separator</CommandItem>
    </CommandGroup>
  </CommandList>
  <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
</Command>`;

const codePalette = `<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

const open = ref(false);

// Atalho global: registrado por quem consome, e removido junto com a tela.
function onKeydown(event: KeyboardEvent) {
  if (event.key.toLowerCase() !== "k" || !(event.ctrlKey || event.metaKey)) return;
  event.preventDefault();
  open.value = true;
}
onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => window.removeEventListener("keydown", onKeydown));

function runCommand(value: string) {
  // roda o comando escolhido, e a paleta fecha
  open.value = false;
}
<\/script>

<Button variant="outline" @click="open = true">
  Buscar
  <kbd class="nds-kbd">Ctrl+K</kbd>
</Button>

<CommandDialog v-model:open="open" title="Command Palette" description="Busque por um comando ou ação...">
  <CommandInput placeholder="Buscar componente..." />
  <CommandList>
    <CommandGroup heading="Componentes">
      <CommandItem value="button" @select="runCommand('button')">
        Button
        <CommandShortcut>Ctrl+B</CommandShortcut>
      </CommandItem>
      <CommandItem value="input" @select="runCommand('input')">
        Input
        <CommandShortcut>Ctrl+I</CommandShortcut>
      </CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Utilitários">
      <CommandItem value="separator" @select="runCommand('separator')">Separator</CommandItem>
    </CommandGroup>
  </CommandList>
  <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
</CommandDialog>`;

const codeWithGroups = `<Command>
  <CommandInput placeholder="Buscar componente..." />
  <CommandList>
    <CommandGroup heading="Componentes">
      <CommandItem value="button">Button</CommandItem>
      <CommandItem value="input">Input</CommandItem>
      <CommandItem value="badge">Badge</CommandItem>
      <CommandItem value="separator">Separator</CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Utilitários">
      <CommandItem value="cn">cn()</CommandItem>
      <CommandItem value="clsx">clsx()</CommandItem>
      <CommandItem value="twmerge">twMerge()</CommandItem>
    </CommandGroup>
  </CommandList>
  <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
</Command>`;

const interfaceCode = `// Command (Root)
interface CommandProps extends ListboxRootProps {
  highlightOnHover?: boolean; // default: true — o ponteiro move o destaque
  class?: string;
}

// CommandInput
interface CommandInputProps extends ListboxFilterProps {
  placeholder?: string;    // nomeia o campo e a lista
  class?: string;
}

// CommandItem
interface CommandItemProps extends ListboxItemProps {
  checked?: boolean;       // vira data-checked; acende a marca à direita
  class?: string;
}

// CommandDialog
interface CommandDialogProps extends DialogRootProps {
  title?: string;          // default: "Command Palette"
  description?: string;    // default: "Search for a command to run..."
  showCloseButton?: boolean; // default: false
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
]);

// O `trackId` é a CHAVE da variante: é o que vai ao evento de cópia de código,
// e o nome exibido muda com o idioma.
const variantItems = computed(() => [
  {
    trackId: 'inline',
    name: tContent('variants.items.inline.name'),
    description: tContent('variants.items.inline.description'),
    code: codeInline,
  },
  {
    trackId: 'palette',
    name: tContent('variants.items.palette.name'),
    description: tContent('variants.items.palette.description'),
    code: codePalette,
  },
  {
    trackId: 'withGroups',
    name: tContent('variants.items.withGroups.name'),
    description: tContent('variants.items.withGroups.description'),
    useWhen: tContent('variants.items.withGroups.use'),
    code: codeWithGroups,
  },
]);

const stateItems = computed(() =>
  (['empty', 'highlighted', 'selected', 'disabled', 'loading', 'longList'] as const).map((key) => ({
    label: tContent(`states.${key}.label`),
    trigger: toPlainText(tContent(`states.${key}.trigger`)),
    behavior: toPlainText(tContent(`states.${key}.behavior`)),
  })),
);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

// O filtro desta stack não é substituível por prop: ele compara o rótulo do
// comando (sem o atalho) e o `value`. A linha `filter` que morava aqui
// documentava uma prop que o `Command` do Vue não tem.
const commandPropItems = computed(() => [
  { name: 'modelValue',  type: 'string',                                                 defaultValue: '""', required: tNav('common.no'), description: toPlainText(tContent('props.table.commandValue'))         },
  { name: 'onHighlight', type: '(payload: { ref: HTMLElement; value: string }) => void', defaultValue: '—',  required: tNav('common.no'), description: toPlainText(tContent('props.table.commandOnValueChange')) },
  { name: 'class',       type: 'string',                                                 defaultValue: '—',  required: tNav('common.no'), description: toPlainText(tContent('props.table.className'))            },
]);

const commandInputPropItems = computed(() => [
  { name: 'placeholder', type: 'string', defaultValue: '—', required: tNav('common.no'), description: toPlainText(tContent('props.table.inputPlaceholder')) },
  { name: 'class',       type: 'string', defaultValue: '—', required: tNav('common.no'), description: toPlainText(tContent('props.table.className'))        },
]);

const commandItemPropItems = computed(() => [
  { name: 'value',    type: 'string',                       defaultValue: '—',     required: tNav('common.yes'), description: toPlainText(tContent('props.table.itemValue'))    },
  { name: 'checked',  type: 'boolean',                      defaultValue: '—',     required: tNav('common.no'),  description: toPlainText(tContent('props.table.checked'))      },
  { name: 'disabled', type: 'boolean',                      defaultValue: 'false', required: tNav('common.no'),  description: toPlainText(tContent('props.table.itemDisabled')) },
  { name: 'onSelect', type: '(event: CustomEvent) => void', defaultValue: '—',     required: tNav('common.no'),  description: toPlainText(tContent('props.table.itemOnSelect')) },
  { name: 'class',    type: 'string',                       defaultValue: '—',     required: tNav('common.no'),  description: toPlainText(tContent('props.table.className'))    },
]);

const commandDialogPropItems = computed(() => [
  { name: 'open',            type: 'boolean',                 defaultValue: '—',                                required: tNav('common.no'), description: toPlainText(tContent('props.table.open'))                  },
  { name: 'onUpdate:open',   type: '(open: boolean) => void', defaultValue: '—',                                required: tNav('common.no'), description: toPlainText(tContent('props.table.onOpenChange'))          },
  { name: 'title',           type: 'string',                  defaultValue: '"Command Palette"',                required: tNav('common.no'), description: toPlainText(tContent('props.table.dialogTitle'))           },
  { name: 'description',     type: 'string',                  defaultValue: '"Search for a command to run..."', required: tNav('common.no'), description: toPlainText(tContent('props.table.dialogDescription'))     },
  { name: 'showCloseButton', type: 'boolean',                 defaultValue: 'false',                            required: tNav('common.no'), description: toPlainText(tContent('props.table.dialogShowCloseButton')) },
  { name: 'class',           type: 'string',                  defaultValue: '—',                                required: tNav('common.no'), description: toPlainText(tContent('props.table.className'))             },
]);

// A coluna do meio traz SELETOR REAL, lido de `docs/shared/styles/nds/command.css`.
// `--radius` é só da caixa da paleta: o comando usa `--radius-sm`, o raio
// aninhado (PRD, D10).
const tokenRows = computed(() => [
  { token: '--popover',            value: '.nds-command',                              description: toPlainText(tContent('tokens.table.popoverBg'))   },
  { token: '--popover-foreground', value: '.nds-command',                              description: toPlainText(tContent('tokens.table.popoverFg'))   },
  { token: '--foreground',         value: '.nds-command-group',                        description: toPlainText(tContent('tokens.table.groupFg'))     },
  { token: '--muted-foreground',   value: '.nds-command-group-heading',                description: toPlainText(tContent('tokens.table.mutedFg'))     },
  { token: '--border',             value: '.nds-command-input-wrapper',                description: toPlainText(tContent('tokens.table.inputBorder')) },
  { token: '--accent',             value: '.nds-command-item[aria-selected="true"]',   description: toPlainText(tContent('tokens.table.selectedBg'))  },
  { token: '--accent-foreground',  value: '.nds-command-item[aria-selected="true"]',   description: toPlainText(tContent('tokens.table.selectedFg'))  },
  { token: '--border',             value: '.nds-command-separator',                    description: toPlainText(tContent('tokens.table.border'))      },
  { token: '--radius',             value: '.nds-command',                              description: toPlainText(tContent('tokens.table.radius'))      },
  { token: '--radius-sm',          value: '.nds-command-item',                         description: toPlainText(tContent('tokens.table.radiusSm'))    },
]);

const accessibilityItems = computed(() => [
  tContent('accessibility.item1'),
  tContent('accessibility.item2'),
  tContent('accessibility.item3'),
]);

// A tabela de teclado escreve textNode: sem `toPlainText` o `<code>` de
// `enter` chegaria literal à tela. Vale para a linha inteira, não só para as
// que hoje trazem tag — o conteúdo é compartilhado e ganha markup sem aviso.
const keyboardItems = computed(() => [
  { key: 'Arrow Down', description: toPlainText(tContent('accessibility.keyboard.arrowDown')) },
  { key: 'Arrow Up',   description: toPlainText(tContent('accessibility.keyboard.arrowUp'))   },
  { key: 'Enter',      description: toPlainText(tContent('accessibility.keyboard.enter'))     },
  { key: 'Escape',     description: toPlainText(tContent('accessibility.keyboard.escape'))    },
  { key: 'Tab',        description: toPlainText(tContent('accessibility.keyboard.tab'))       },
  { key: 'Ctrl+K',     description: toPlainText(tContent('accessibility.keyboard.cmdK'))      },
]);

const relatedItems = computed(() => [
  { name: 'Select',       description: toPlainText(tContent('related.select')),       path: '?path=/docs/components-form-select--docs'       },
  { name: 'DropdownMenu', description: toPlainText(tContent('related.dropdownMenu')), path: '?path=/docs/components-navigation-dropdownmenu--docs' },
  { name: 'Dialog',       description: toPlainText(tContent('related.dialog')),       path: '?path=/docs/components-overlay-dialog--docs'       },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.tip1') },
  { title: '', content: tContent('notes.tip2') },
  { title: '', content: tContent('notes.tip3') },
]);

const analyticsItems = computed(() => [
  { event: tContent('analytics.table.itemSelect'),   trigger: toPlainText(tContent('analytics.table.itemSelectTrigger')),   payload: tContent('analytics.table.itemSelectPayload')   },
  { event: tContent('analytics.table.paletteOpen'),  trigger: toPlainText(tContent('analytics.table.paletteOpenTrigger')),  payload: tContent('analytics.table.paletteOpenPayload')  },
  { event: tContent('analytics.table.pageView'),     trigger: toPlainText(tContent('analytics.table.pageViewTrigger')),     payload: tContent('analytics.table.pageViewPayload')     },
  { event: tContent('analytics.table.sectionViewed'),trigger: toPlainText(tContent('analytics.table.sectionViewedTrigger')),payload: tContent('analytics.table.sectionViewedPayload') },
  { event: tContent('analytics.table.langSwitch'),   trigger: toPlainText(tContent('analytics.table.langSwitchTrigger')),   payload: tContent('analytics.table.langSwitchPayload')   },
]);

const a11yCritCols = computed(() => ({
  criterion: tNav('common.criterion'),
  level: 'WCAG',
  how: tNav('common.howToVerify'),
}));

const functionalTestItems = computed(() => [
  { action: tContent('testes.functional.item1.action'), result: tContent('testes.functional.item1.result'), priority: localPriority(tContent('testes.functional.item1.priority')) },
  { action: tContent('testes.functional.item2.action'), result: tContent('testes.functional.item2.result'), priority: localPriority(tContent('testes.functional.item2.priority')) },
  { action: tContent('testes.functional.item3.action'), result: tContent('testes.functional.item3.result'), priority: localPriority(tContent('testes.functional.item3.priority')) },
  { action: tContent('testes.functional.item4.action'), result: tContent('testes.functional.item4.result'), priority: localPriority(tContent('testes.functional.item4.priority')) },
  { action: tContent('testes.functional.item5.action'), result: tContent('testes.functional.item5.result'), priority: localPriority(tContent('testes.functional.item5.priority')) },
  { action: tContent('testes.functional.item6.action'), result: tContent('testes.functional.item6.result'), priority: localPriority(tContent('testes.functional.item6.priority')) },
]);

// Nível e método como na referência: o critério é AA, e cada linha se verifica
// pelo axe ou à mão — sem texto de idioma cravado na coluna.
const a11yTestItems = computed(() =>
  [1, 2, 3, 4].map((i) => ({
    criterion: tContent(`testes.accessibility.item${i}`),
    level: 'AA',
    how: 'axe-core / manual',
  })),
);

const visualTestItems = computed(() => [
  { story: tContent('testes.visual.item1.story'), priority: localPriority(tContent('testes.visual.item1.priority')) },
  { story: tContent('testes.visual.item2.story'), priority: localPriority(tContent('testes.visual.item2.priority')) },
  { story: tContent('testes.visual.item3.story'), priority: localPriority(tContent('testes.visual.item3.priority')) },
  { story: tContent('testes.visual.item4.story'), priority: localPriority(tContent('testes.visual.item4.priority')) },
]);
</script>

<template>
  <DocsPageLayout
    :nav-groups="navGroups"
    :active-section="activeSection"
    component-slug="command"
  >
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
      />
    </template>

    <!-- ── Demonstração ───────────────────────────────────────────── -->
    <DocsDemonstration>
      <div
        class="nds-w-full nds-stack"
        data-spacing="xl"
      >
        <!-- 1. Inline: sem ícone e sem atalho. -->
        <div class="nds-w-full nds-max-w-sm nds-border-default nds-rounded-md nds-shadow-md">
          <Command>
            <CommandInput :placeholder="tContent('demonstration.labels.searchPlaceholder')" />
            <CommandList>
              <template
                v-for="(block, index) in demoBlocks"
                :key="block.key"
              >
                <CommandSeparator v-if="index > 0" />
                <CommandGroup :heading="block.heading">
                  <CommandItem
                    v-for="item in block.items"
                    :key="item.value"
                    :value="item.value"
                    @select="trackSelect(item.value, block.key, 'inline', 'docs_demo')"
                  >
                    {{ item.label }}
                  </CommandItem>
                </CommandGroup>
              </template>
            </CommandList>
            <!-- Fora do CommandList: é uma região viva (role="status"), e
                 região viva não é filha permitida de role="listbox". -->
            <CommandEmpty>{{ tContent('demonstration.labels.emptyMessage') }}</CommandEmpty>
          </Command>
        </div>

        <!-- 2. Paleta real num Dialog. A dica mora DENTRO do gatilho, e o nome
             do botão sai do texto visível (WCAG 2.5.3) — sem aria-label. -->
        <div>
          <Button
            variant="outline"
            aria-haspopup="dialog"
            :aria-expanded="paletteOpen"
            @click="openPalette('button')"
          >
            {{ tContent('demonstration.labels.openPalette') }}
            <kbd class="nds-kbd">{{ tContent('demonstration.labels.shortcutKey') }}</kbd>
          </Button>
        </div>

        <CommandDialog
          v-model:open="paletteOpen"
          :title="tContent('demonstration.labels.dialogTitle')"
          :description="tContent('demonstration.labels.dialogDescription')"
        >
          <CommandInput :placeholder="tContent('demonstration.labels.searchPlaceholder')" />
          <CommandList>
            <template
              v-for="(block, index) in paletteBlocks"
              :key="block.key"
            >
              <CommandSeparator v-if="index > 0" />
              <CommandGroup :heading="block.heading">
                <CommandItem
                  v-for="item in block.items"
                  :key="item.value"
                  :value="item.value"
                  @select="selectInPalette(item.value, block.key)"
                >
                  {{ item.label }}
                  <CommandShortcut v-if="item.shortcut">
                    {{ item.shortcut }}
                  </CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </template>
          </CommandList>
          <CommandEmpty>{{ tContent('demonstration.labels.emptyMessage') }}</CommandEmpty>
        </CommandDialog>
      </div>
    </DocsDemonstration>

    <!-- ── Anatomia ───────────────────────────────────────────────── -->
    <DocsAnatomy
      :items="anatomyItems"
      :structure-label="tContent('anatomy.structureLabel')"
      :structure-code="tContent('anatomy.structureCode')"
    />

    <!-- ── Quando Usar ────────────────────────────────────────────── -->
    <DocsWhenToUse
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
      :do="{ title: tContent('usage.do.title'), items: [tContent('usage.do.item1'), tContent('usage.do.item2'), tContent('usage.do.item3')] }"
      :dont="{ title: tContent('usage.dont.title'), items: [tContent('usage.dont.item1'), tContent('usage.dont.item2'), tContent('usage.dont.item3')] }"
    />

    <!-- ── Do & Don't ─────────────────────────────────────────────── -->
    <DocsDoDont
      :pairs="[
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair1.do')), dontCaption: toPlainText(tContent('doDont.pair1.dont')) },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair2.do')), dontCaption: toPlainText(tContent('doDont.pair2.dont')) },
      ]"
    >
      <!-- Par 1: a MESMA busca sem correspondência dos dois lados — o "don't"
           omite o CommandEmpty e fica em branco. Apagada a busca, os dois
           lados são paletas de verdade, e a escolha é rastreada como as outras. -->
      <template #do-preview-0>
        <div class="nds-w-full nds-max-w-sm nds-border-default nds-rounded-md">
          <Command>
            <CommandInput
              :placeholder="tContent('demonstration.labels.searchPlaceholder')"
              :model-value="DO_DONT_SEARCH"
            />
            <CommandList>
              <CommandGroup>
                <CommandItem
                  v-for="item in doDontItems"
                  :key="item.value"
                  :value="item.value"
                  @select="trackSelect(item.value, 'components', 'inline', 'docs_do_dont')"
                >
                  {{ item.label }}
                </CommandItem>
              </CommandGroup>
            </CommandList>
            <CommandEmpty>{{ tContent('demonstration.labels.emptyMessage') }}</CommandEmpty>
          </Command>
        </div>
      </template>
      <template #dont-preview-0>
        <div class="nds-w-full nds-max-w-sm nds-border-default nds-rounded-md">
          <Command>
            <CommandInput
              :placeholder="tContent('demonstration.labels.searchPlaceholder')"
              :model-value="DO_DONT_SEARCH"
            />
            <CommandList>
              <CommandGroup>
                <CommandItem
                  v-for="item in doDontItems"
                  :key="item.value"
                  :value="item.value"
                  @select="trackSelect(item.value, 'components', 'inline', 'docs_do_dont')"
                >
                  {{ item.label }}
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      </template>

      <!-- Par 2: o mesmo gatilho, com e sem a dica do atalho dentro dele. -->
      <template #do-preview-1>
        <Button variant="outline">
          {{ tContent('demonstration.labels.openPalette') }}
          <kbd class="nds-kbd">{{ tContent('demonstration.labels.shortcutKey') }}</kbd>
        </Button>
      </template>
      <template #dont-preview-1>
        <Button variant="outline">
          {{ tContent('demonstration.labels.openPalette') }}
        </Button>
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :description="tContent('import.basic')"
      :code="codeImportBasic"
      :secondary-description="tContent('import.withDialog')"
      :secondary-code="codeImportWithDialog"
    />

    <!-- ── Variantes ──────────────────────────────────────────────── -->
    <DocsCompositions
      id="variantes"
      :use-when-label="tNav('common.useWhen')"
      component-slug="command"
      :items="variantItems"
      :note="tContent('variants.note')"
    >
      <!-- inline -->
      <template #variant-preview-0>
        <div class="nds-w-full nds-max-w-sm nds-border-default nds-rounded-md nds-shadow-md">
          <Command>
            <CommandInput :placeholder="tContent('demonstration.labels.searchPlaceholder')" />
            <CommandList>
              <template
                v-for="(block, index) in demoBlocks"
                :key="block.key"
              >
                <CommandSeparator v-if="index > 0" />
                <CommandGroup :heading="block.heading">
                  <CommandItem
                    v-for="item in block.items"
                    :key="item.value"
                    :value="item.value"
                    @select="trackSelect(item.value, block.key, 'inline', 'docs_variantes')"
                  >
                    {{ item.label }}
                  </CommandItem>
                </CommandGroup>
              </template>
            </CommandList>
            <CommandEmpty>{{ tContent('demonstration.labels.emptyMessage') }}</CommandEmpty>
          </Command>
        </div>
      </template>

      <!-- palette: retrato do padrão — o gatilho e, embaixo, o que ele abre,
           desenhado na página como fica dentro do Dialog. A paleta que abre de
           verdade é a da demonstração. O gatilho daqui não abre nada, e por
           isso não leva `aria-haspopup` nem `aria-expanded`: anunciaria um
           diálogo que não existe. -->
      <template #variant-preview-1>
        <div
          class="nds-stack nds-p-2"
          data-spacing="xs"
          data-align="start"
        >
          <Button variant="outline">
            {{ tContent('demonstration.labels.openPalette') }}
            <kbd class="nds-kbd">{{ tContent('demonstration.labels.shortcutKey') }}</kbd>
          </Button>
          <div class="nds-w-full nds-max-w-sm nds-border-default nds-rounded-md nds-shadow-md">
            <Command>
              <CommandInput :placeholder="tContent('demonstration.labels.searchPlaceholder')" />
              <CommandList>
                <template
                  v-for="(block, index) in paletteBlocks"
                  :key="block.key"
                >
                  <CommandSeparator v-if="index > 0" />
                  <CommandGroup :heading="block.heading">
                    <CommandItem
                      v-for="item in block.items"
                      :key="item.value"
                      :value="item.value"
                      @select="trackSelect(item.value, block.key, 'palette', 'docs_variantes')"
                    >
                      {{ item.label }}
                      <CommandShortcut v-if="item.shortcut">
                        {{ item.shortcut }}
                      </CommandShortcut>
                    </CommandItem>
                  </CommandGroup>
                </template>
              </CommandList>
              <CommandEmpty>{{ tContent('demonstration.labels.emptyMessage') }}</CommandEmpty>
            </Command>
          </div>
        </div>
      </template>

      <!-- withGroups -->
      <template #variant-preview-2>
        <div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
          <Command>
            <CommandInput :placeholder="tContent('demonstration.labels.searchPlaceholder')" />
            <CommandList>
              <template
                v-for="(block, index) in groupedBlocks"
                :key="block.key"
              >
                <CommandSeparator v-if="index > 0" />
                <CommandGroup :heading="block.heading">
                  <CommandItem
                    v-for="item in block.items"
                    :key="item.value"
                    :value="item.value"
                    @select="trackSelect(item.value, block.key, 'inline', 'docs_variantes')"
                  >
                    {{ item.label }}
                  </CommandItem>
                </CommandGroup>
              </template>
            </CommandList>
            <CommandEmpty>{{ tContent('demonstration.labels.emptyMessage') }}</CommandEmpty>
          </Command>
        </div>
      </template>
    </DocsCompositions>

    <!-- ── Estados ────────────────────────────────────────────────── -->
    <DocsStates
      :cols="{ state: tContent('states.cols.state'), trigger: toPlainText(tContent('states.cols.trigger')), behavior: toPlainText(tContent('states.cols.behavior'))}"
      :items="stateItems"
    />

    <!-- ── Propriedades ───────────────────────────────────────────── -->
    <DocsProps
      :tables="[
        { title: tContent('props.commandTitle'), cols: propCols, items: commandPropItems },
        { title: tContent('props.commandInputTitle'), cols: propCols, items: commandInputPropItems },
        { title: tContent('props.commandItemTitle'), cols: propCols, items: commandItemPropItems },
        { title: tContent('props.commandDialogTitle'),cols: propCols, items: commandDialogPropItems },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="tContent('props.extensibility')"
    />

    <!-- ── Tokens ─────────────────────────────────────────────────── -->
    <DocsTokens
      :cols="{ token: tContent('tokens.table.token'), value: tContent('tokens.table.class'), description: tContent('tokens.table.part') }"
      :items="tokenRows"
      :customization-title="tContent('tokens.customizationTitle')"
      :customization-code="tContent('tokens.customizationCode')"
    />

    <!-- ── Acessibilidade ─────────────────────────────────────────── -->
    <DocsAccessibility
      :screen-reader-title="tNav('common.screenReader')"
      :screen-reader-items="screenReaderItems"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-title="tNav('common.keyboardNav')"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ───────────────────────────────────────────── -->
    <DocsRelated
      :items="relatedItems"
    />

    <!-- ── Notas ──────────────────────────────────────────────────── -->
    <DocsNotes
      :items="noteItems"
    />

    <!-- ── Analytics ─────────────────────────────────────────────── -->
    <DocsAnalytics
      :cols="{ event: tContent('analytics.table.event'), trigger: toPlainText(tContent('analytics.table.trigger')), payload: tContent('analytics.table.payload') }"
      :items="analyticsItems"
    />

    <!-- ── Testes ─────────────────────────────────────────────────── -->
    <DocsTestes
      :functional="{
        title: tContent('testes.functional.title'),
        description: tContent('testes.functional.description'),
        cols: { action: tNav('common.userAction'), result: tNav('common.expectedResult'), priority: tNav('common.priority') },
        items: functionalTestItems,
      }"
      :accessibility="{
        title: tContent('testes.accessibility.title'),
        description: tContent('testes.accessibility.description'),
        cols: a11yCritCols,
        items: a11yTestItems,
      }"
      :visual="{
        title: tContent('testes.visual.title'),
        description: tContent('testes.visual.description'),
        cols: { story: tNav('common.storyState'), priority: tNav('common.priority') },
        items: visualTestItems,
      }"
    />
  </DocsPageLayout>
</template>
