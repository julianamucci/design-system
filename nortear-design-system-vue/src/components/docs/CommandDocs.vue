<script setup lang="ts">
import { computed, ref, watch } from 'vue';
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
import { stripHtml, toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(commandTranslations);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
const screenReaderItems = computed(() =>
  Object.values(
    (commandTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >)[locale.value]?.accessibility?.screenReader ?? {},
  ),
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
// ─── Analytics — inline demo ──────────────────────────────────────────────────

function handleInlineSelect(label: string, group: string) {
  track('command_item_select', {
    label,
    group,
    pattern: 'inline',
  });
}

// ─── Demo: Command Palette state ──────────────────────────────────────────────

const paletteOpen = ref(false);

function openPalette() {
  track('command_palette_open', { trigger: 'button' });
  paletteOpen.value = true;
}

const paletteItemMeta: Record<string, { label: string; group: string }> = {
  button: { label: 'Button', group: 'components' },
  input: { label: 'Input', group: 'components' },
  separator: { label: 'Separator', group: 'utils' },
};

function paletteSelect(value: string) {
  paletteOpen.value = false;
  const meta = paletteItemMeta[value];
  track('command_item_select', {
    label: meta?.label ?? value,
    group: meta?.group ?? 'components',
    pattern: 'palette',
  });
}

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
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";`;

// CommandEmpty fica FORA do CommandList: ele é uma região viva (role="status"),
// e região viva não é filha permitida de role="listbox".
const codeInline = `<Command>
  <CommandInput placeholder="Buscar componente..." />
  <CommandList>
    <CommandGroup heading="Componentes">
      <CommandItem value="button">Button</CommandItem>
      <CommandItem value="input">Input</CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Utilitários">
      <CommandItem value="badge">Badge</CommandItem>
    </CommandGroup>
  </CommandList>
  <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
</Command>`;

const codePalette = `<script setup>
const open = ref(false);
<\/script>

<CommandDialog v-model:open="open" title="Command Palette" description="Busque por um comando ou ação...">
  <CommandInput placeholder="Buscar componente..." />
  <CommandList>
    <CommandGroup heading="Ações">
      <CommandItem value="salvar" @select="() => open = false">
        Salvar
        <CommandShortcut>⌘S</CommandShortcut>
      </CommandItem>
    </CommandGroup>
  </CommandList>
  <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
</CommandDialog>`;

const codeCustomizationTokens = `/* Em globals.css */
:root {
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 47.4% 11.2%;
  --muted-foreground: 215.4 16.3% 46.9%;
}

.dark {
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
}`;

const interfaceCode = `// Command (Root)
interface CommandProps extends ListboxRootProps {
  class?: string;
}

// CommandInput
interface CommandInputProps {
  placeholder?: string;
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

// ─── Compositions code strings ───────────────────────────────────────────────

const codeCompWithGroups = `<Command>
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

const variantItems = computed(() => [
  { name: 'inline',   description: stripHtml(tContent('variants.items.inline')),   code: codeInline   },
  { name: 'palette',  description: stripHtml(tContent('variants.items.palette')),  code: codePalette  },
  {
    name: tContent('variants.items.withGroups.name'),
    description: tContent('variants.items.withGroups.description'),
    useWhen: tContent('variants.items.withGroups.use'),
    code: codeCompWithGroups,
  },
]);

const stateItems = computed(() => [
  {
    label: tContent('states.empty.label'),
    trigger: toPlainText(tContent('states.empty.trigger')),
    behavior: toPlainText(tContent('states.empty.behavior')),
  },
  {
    label: tContent('states.selected.label'),
    trigger: toPlainText(tContent('states.selected.trigger')),
    behavior: toPlainText(tContent('states.selected.behavior')),
  },
  {
    label: tContent('states.disabled.label'),
    trigger: toPlainText(tContent('states.disabled.trigger')),
    behavior: toPlainText(tContent('states.disabled.behavior')),
  },
  {
    label: tContent('states.loading.label'),
    trigger: toPlainText(tContent('states.loading.trigger')),
    behavior: toPlainText(tContent('states.loading.behavior')),
  },
  {
    label: tContent('states.longList.label'),
    trigger: toPlainText(tContent('states.longList.trigger')),
    behavior: toPlainText(tContent('states.longList.behavior')),
  },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const commandPropItems = computed(() => [
  { name: 'filter',        type: '(value, search, keywords?) => number', defaultValue: 'built-in fuzzy', required: 'Não', description: toPlainText(tContent('props.table.commandFilter'))         },
  { name: 'modelValue',    type: 'string',                                defaultValue: '""',             required: 'Não', description: toPlainText(tContent('props.table.commandValue'))           },
  { name: 'onUpdate:modelValue', type: '(value: string) => void',        defaultValue: '—',             required: 'Não', description: toPlainText(tContent('props.table.commandOnValueChange'))   },
  { name: 'class',         type: 'string',                                defaultValue: '—',             required: 'Não', description: toPlainText(tContent('props.table.className'))              },
]);

const commandInputPropItems = computed(() => [
  { name: 'placeholder', type: 'string', defaultValue: '—', required: 'Não', description: toPlainText(tContent('props.table.inputPlaceholder')) },
  { name: 'class',       type: 'string', defaultValue: '—', required: 'Não', description: toPlainText(tContent('props.table.className'))        },
]);

const commandItemPropItems = computed(() => [
  { name: 'value',    type: 'string',              defaultValue: '—',     required: 'Sim', description: toPlainText(tContent('props.table.itemValue'))    },
  { name: 'checked',  type: 'boolean',             defaultValue: '—',     required: 'Não', description: toPlainText(tContent('states.selected.behavior')) },
  { name: 'disabled', type: 'boolean',             defaultValue: 'false', required: 'Não', description: toPlainText(tContent('props.table.itemDisabled')) },
  { name: 'onSelect', type: '() => void',          defaultValue: '—',     required: 'Não', description: toPlainText(tContent('props.table.itemOnSelect')) },
  { name: 'class',    type: 'string',              defaultValue: '—',     required: 'Não', description: toPlainText(tContent('props.table.className'))    },
]);

const commandDialogPropItems = computed(() => [
  { name: 'open',            type: 'boolean',    defaultValue: '—',                        required: 'Não', description: toPlainText(tContent('props.table.commandValue'))              },
  { name: 'title',           type: 'string',     defaultValue: '"Command Palette"',        required: 'Não', description: toPlainText(tContent('props.table.dialogTitle'))               },
  { name: 'description',     type: 'string',     defaultValue: '"Search for a command..."', required: 'Não', description: toPlainText(tContent('props.table.dialogDescription'))         },
  { name: 'showCloseButton', type: 'boolean',    defaultValue: 'false',                    required: 'Não', description: toPlainText(tContent('props.table.dialogShowCloseButton'))     },
  { name: 'class',           type: 'string',     defaultValue: '—',                        required: 'Não', description: toPlainText(tContent('props.table.className'))                 },
]);

// A coluna do meio traz SELETOR REAL, lido de `docs/shared/styles/nds/command.css`.
// O que morava aqui (`bg-popover`, `data-selected:bg-muted`, `rounded-xl`) era
// vocabulário do framework que saiu do projeto: classe que não existe em lugar
// nenhum, e customização que ninguém consegue reproduzir.
const tokenRows = computed(() => [
  { token: '--popover',            value: '.nds-command',                              description: toPlainText(tContent('tokens.table.popoverBg'))  },
  { token: '--popover-foreground', value: '.nds-command',                              description: toPlainText(tContent('tokens.table.popoverFg'))  },
  { token: '--muted-foreground',   value: '.nds-command-group-heading',                description: toPlainText(tContent('tokens.table.mutedFg'))    },
  { token: '--border',             value: '.nds-command-input-wrapper',                description: toPlainText(tContent('tokens.table.inputBorder')) },
  { token: '--accent',             value: '.nds-command-item[aria-selected="true"]',   description: toPlainText(tContent('tokens.table.selectedBg'))  },
  { token: '--accent-foreground',  value: '.nds-command-item[aria-selected="true"]',   description: toPlainText(tContent('tokens.table.selectedFg'))  },
  { token: '--border',             value: '.nds-command-separator',                    description: toPlainText(tContent('tokens.table.border'))      },
  { token: '--radius',             value: '.nds-command · .nds-command-item',          description: toPlainText(tContent('tokens.table.radius'))      },
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
  { key: '⌘K',         description: toPlainText(tContent('accessibility.keyboard.cmdK'))      },
]);

const relatedItems = computed(() => [
  { name: 'Select',       description: toPlainText(tContent('related.select')),       path: '?path=/docs/primitives-form-select--docs'       },
  { name: 'DropdownMenu', description: toPlainText(tContent('related.dropdownMenu')), path: '?path=/docs/primitives-overlay-dropdownmenu--docs' },
  { name: 'Dialog',       description: toPlainText(tContent('related.dialog')),       path: '?path=/docs/primitives-overlay-dialog--docs'       },
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

const a11yTestItems = computed(() => [
  { criterion: tContent('testes.accessibility.item1'), level: 'WCAG 2.2', how: 'axe-core' },
  { criterion: tContent('testes.accessibility.item2'), level: 'WCAG 2.2', how: 'manual' },
  { criterion: tContent('testes.accessibility.item3'), level: 'WCAG 2.2', how: 'leitor de tela' },
  { criterion: tContent('testes.accessibility.item4'), level: 'WCAG 2.2', how: 'manual' },
]);

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
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div
        class="nds-w-full nds-stack"
        data-spacing="xl"
      >
        <!-- Demo 1: Inline -->
        <div
          class="nds-stack"
          data-spacing="sm"
        >
          <p class="nds-text-caption nds-font-medium nds-text-muted-foreground nds-uppercase nds-tracking-wider">
            Inline
          </p>
          <div class="nds-w-full nds-max-w-sm nds-border-default nds-rounded-md nds-shadow-md">
            <Command>
              <CommandInput :placeholder="tContent('demonstration.labels.searchPlaceholder')" />
              <CommandList>
                <CommandGroup :heading="tContent('demonstration.labels.groupComponents')">
                  <CommandItem
                    value="button"
                    @select="handleInlineSelect(tContent('demonstration.labels.itemButton'), 'components')"
                  >
                    {{ tContent('demonstration.labels.itemButton') }}
                  </CommandItem>
                  <CommandItem
                    value="input"
                    @select="handleInlineSelect(tContent('demonstration.labels.itemInput'), 'components')"
                  >
                    {{ tContent('demonstration.labels.itemInput') }}
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup :heading="tContent('demonstration.labels.groupUtils')">
                  <CommandItem
                    value="separator"
                    @select="handleInlineSelect(tContent('demonstration.labels.itemSeparator'), 'utils')"
                  >
                    {{ tContent('demonstration.labels.itemSeparator') }}
                  </CommandItem>
                </CommandGroup>
              </CommandList>
              <!-- Fora do CommandList: é uma região viva (role="status"), e
                   região viva não é filha permitida de role="listbox". -->
              <CommandEmpty>{{ tContent('demonstration.labels.emptyMessage') }}</CommandEmpty>
            </Command>
          </div>
        </div>

        <!-- Demo 3: Command Palette -->
        <div
          class="nds-stack"
          data-spacing="sm"
        >
          <p class="nds-text-caption nds-font-medium nds-text-muted-foreground nds-uppercase nds-tracking-wider">
            Command Palette
          </p>
          <div
            class="nds-cluster"
            data-align="center"
            data-spacing="md"
          >
            <Button
              variant="outline"
              @click="openPalette"
            >
              {{ tContent('demonstration.labels.openPalette') }}
            </Button>
            <span
              class="nds-cluster nds-text-body nds-text-muted-foreground"
              data-spacing="xs"
            >
              {{ tContent('demonstration.labels.shortcutHint') }}
              <kbd class="nds-kbd">{{ tContent('demonstration.labels.shortcutKey') }}</kbd>
            </span>
          </div>
          <CommandDialog
            v-model:open="paletteOpen"
            :title="tContent('demonstration.labels.dialogTitle')"
            :description="tContent('demonstration.labels.dialogDescription')"
          >
            <CommandInput :placeholder="tContent('demonstration.labels.searchPlaceholder')" />
            <CommandList>
              <CommandGroup :heading="tContent('demonstration.labels.groupComponents')">
                <CommandItem
                  value="button"
                  @select="paletteSelect('button')"
                >
                  {{ tContent('demonstration.labels.itemButton') }}
                  <CommandShortcut>⌘B</CommandShortcut>
                </CommandItem>
                <CommandItem
                  value="input"
                  @select="paletteSelect('input')"
                >
                  {{ tContent('demonstration.labels.itemInput') }}
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup :heading="tContent('demonstration.labels.groupUtils')">
                <CommandItem
                  value="separator"
                  @select="paletteSelect('separator')"
                >
                  {{ tContent('demonstration.labels.itemSeparator') }}
                </CommandItem>
              </CommandGroup>
            </CommandList>
            <CommandEmpty>{{ tContent('demonstration.labels.emptyMessage') }}</CommandEmpty>
          </CommandDialog>
        </div>
      </div>
    </DocsDemonstration>

    <!-- ── Anatomia ───────────────────────────────────────────────── -->
    <DocsAnatomy
      :title="tContent('anatomy.title')"
      :items="anatomyItems"
      :structure-label="tContent('anatomy.structureLabel')"
      :structure-code="tContent('anatomy.structureCode')"
    />

    <!-- ── Quando Usar ────────────────────────────────────────────── -->
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
      :title="tContent('doDont.title')"
      :pairs="[
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair1.do')), dontCaption: toPlainText(tContent('doDont.pair1.dont')) },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair2.do')), dontCaption: toPlainText(tContent('doDont.pair2.dont')) },
      ]"
    >
      <!-- Pair 1: CommandEmpty -->
      <template #do-preview-0>
        <div class="nds-w-full nds-max-w-sm nds-border-default nds-rounded-md">
          <Command>
            <CommandInput
              placeholder="zzz"
              model-value="zzz"
            />
            <CommandList>
              <CommandGroup heading="Componentes">
                <CommandItem value="button">
                  Button
                </CommandItem>
              </CommandGroup>
            </CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          </Command>
        </div>
      </template>
      <template #dont-preview-0>
        <div class="nds-w-full nds-max-w-sm nds-border-default nds-rounded-md">
          <Command>
            <CommandInput
              placeholder="zzz"
              model-value="zzz"
            />
            <CommandList>
              <CommandGroup heading="Componentes">
                <CommandItem value="button">
                  Button
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      </template>

      <!-- Pair 2: shortcut hint -->
      <template #do-preview-1>
        <div
          class="nds-cluster"
          data-align="center"
          data-spacing="sm"
        >
          <Button
            variant="outline"
            size="sm"
          >
            Buscar
          </Button>
          <span
            class="nds-cluster nds-text-body nds-text-muted-foreground"
            data-spacing="xs"
          >
            Pressione
            <kbd class="nds-kbd">⌘K</kbd>
          </span>
        </div>
      </template>
      <template #dont-preview-1>
        <Button
          variant="outline"
          size="sm"
        >
          Buscar
        </Button>
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :description="tContent('import.basic')"
      :code="codeImportBasic"
      :secondary-description="tContent('import.withDialog')"
      :secondary-code="codeImportWithDialog"
    />

    <!-- ── Variantes ──────────────────────────────────────────────── -->
    <DocsCompositions
      id="variantes"
      :title="tContent('variants.title')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="command"
      :items="variantItems"
      :note="tContent('variants.note')"
    >
      <!-- inline preview -->
      <template #variant-preview-0>
        <div class="nds-w-full nds-max-w-sm nds-border-default nds-rounded-md nds-shadow-md">
          <Command>
            <CommandInput placeholder="Buscar componente..." />
            <CommandList>
              <CommandGroup heading="Componentes">
                <CommandItem value="button">
                  Button
                </CommandItem>
                <CommandItem value="input">
                  Input
                </CommandItem>
              </CommandGroup>
            </CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          </Command>
        </div>
      </template>

      <!-- palette preview -->
      <template #variant-preview-1>
        <div
          class="nds-cluster"
          data-align="center"
          data-spacing="sm"
        >
          <Button
            variant="outline"
            size="sm"
          >
            Buscar
          </Button>
          <kbd class="nds-kbd">⌘K</kbd>
        </div>
      </template>

      <!-- withGroups preview -->
      <template #variant-preview-2>
        <div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
          <Command>
            <CommandInput placeholder="Buscar componente..." />
            <CommandList>
              <CommandGroup heading="Componentes">
                <CommandItem value="button">
                  Button
                </CommandItem>
                <CommandItem value="input">
                  Input
                </CommandItem>
                <CommandItem value="badge">
                  Badge
                </CommandItem>
                <CommandItem value="separator">
                  Separator
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Utilitários">
                <CommandItem value="cn">
                  cn()
                </CommandItem>
                <CommandItem value="clsx">
                  clsx()
                </CommandItem>
                <CommandItem value="twmerge">
                  twMerge()
                </CommandItem>
              </CommandGroup>
            </CommandList>
            <CommandEmpty>{{ tContent('demonstration.labels.emptyMessage') }}</CommandEmpty>
          </Command>
        </div>
      </template>
    </DocsCompositions>

    <!-- ── Estados ────────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{ state: tContent('states.cols.state'), trigger: toPlainText(tContent('states.cols.trigger')), behavior: toPlainText(tContent('states.cols.behavior'))}"
      :items="stateItems"
    />

    <!-- ── Propriedades ───────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
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
      :title="tContent('tokens.title')"
      :cols="{ token: tContent('tokens.table.token'), value: tContent('tokens.table.class'), description: tContent('tokens.table.part') }"
      :items="tokenRows"
      :customization-title="tContent('tokens.customizationTitle')"
      :customization-code="codeCustomizationTokens"
    />

    <!-- ── Acessibilidade ─────────────────────────────────────────── -->
    <DocsAccessibility
      :screen-reader-title="tNav('common.screenReader')"
      :screen-reader-items="screenReaderItems"
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ───────────────────────────────────────────── -->
    <DocsRelated
      :title="tContent('related.title')"
      :items="relatedItems"
    />

    <!-- ── Notas ──────────────────────────────────────────────────── -->
    <DocsNotes
      :title="tContent('notes.title')"
      :items="noteItems"
    />

    <!-- ── Analytics ─────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :description="tContent('analytics.description')"
      :cols="{ event: tContent('analytics.table.event'), trigger: toPlainText(tContent('analytics.table.trigger')), payload: tContent('analytics.table.payload') }"
      :items="analyticsItems"
    />

    <!-- ── Testes ─────────────────────────────────────────────────── -->
    <DocsTestes
      :title="tContent('testes.title')"
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
