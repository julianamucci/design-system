<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/components/ui/menubar';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import componentTranslations from '@shared/content/menubar/translations.json';
import uiTranslations from '@/i18n/ui.json';

import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.vue';
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

const { t: tContent, locale } = useTranslation(componentTranslations);
const { t: tNav } = useTranslation(uiTranslations);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

const priorityKeyMap: Record<string, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

function localPriority(raw: string): string {
  return priorityKeyMap[raw] ?? raw;
}

// ─── SEO & GEO ────────────────────────────────────────────────────────────────

useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: 'menubar',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
  aiIntent: tContent('seo.aiIntent'),
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
    label: tContent('nav.overview'),
    sections: [
      { id: 'demonstracao', label: tContent('nav.demonstration') },
      { id: 'anatomia',     label: tContent('nav.anatomy')       },
      { id: 'quando-usar',  label: tContent('nav.usage')         },
      { id: 'do-dont',      label: tContent('nav.doDont')        },
    ],
  },
  {
    label: tContent('nav.techRef'),
    sections: [
      { id: 'importacao',   label: tContent('nav.import')   },
      { id: 'variantes',    label: tContent('nav.variants')     },
      { id: 'composicoes',  label: tContent('nav.compositions') },
      { id: 'estados',      label: tContent('nav.states')       },
      { id: 'propriedades', label: tContent('nav.props')    },
      { id: 'tokens',       label: tContent('nav.tokens')   },
    ],
  },
  {
    label: tContent('nav.context'),
    sections: [
      { id: 'acessibilidade', label: tContent('nav.accessibility') },
      { id: 'relacionados',   label: tContent('nav.related')       },
      { id: 'notas',          label: tContent('nav.notes')         },
    ],
  },
  {
    label: tContent('nav.quality'),
    sections: [
      { id: 'analytics', label: tContent('nav.analytics') },
      { id: 'testes',    label: tContent('nav.testes')    },
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
  MenubarItem,
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

const codeDefault = `<Menubar default-value="file">
  <MenubarMenu value="file">
    <MenubarTrigger>Arquivo</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Novo</MenubarItem>
      <MenubarItem>Abrir</MenubarItem>
      <MenubarItem>Salvar</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`;

const codeDestructive = `<Menubar default-value="file">
  <MenubarMenu value="file">
    <MenubarTrigger>Arquivo</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Salvar</MenubarItem>
      <MenubarSeparator />
      <MenubarItem variant="destructive">Excluir arquivo</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`;

const interfaceCode = `// Menubar (root)
interface MenubarRootProps {
  value?: string;
  defaultValue?: string;
  loop?: boolean;        // default true
}

// MenubarMenu
interface MenubarMenuProps {
  value: string;         // identificador único do menu
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

const variantItems = computed(() => [
  { name: tContent('variants.items.default'),     description: stripHtml(tContent('variants.styles.default')),     code: codeDefault },
  { name: tContent('variants.items.destructive'), description: stripHtml(tContent('variants.styles.destructive')), code: codeDestructive },
]);

const codeWithShortcuts = `<Menubar default-value="edit">
  <MenubarMenu value="edit">
    <MenubarTrigger>Editar</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Desfazer <MenubarShortcut>⌘Z</MenubarShortcut></MenubarItem>
      <MenubarItem>Refazer <MenubarShortcut>⇧⌘Z</MenubarShortcut></MenubarItem>
      <MenubarSeparator />
      <MenubarItem>Copiar <MenubarShortcut>⌘C</MenubarShortcut></MenubarItem>
      <MenubarItem>Colar <MenubarShortcut>⌘V</MenubarShortcut></MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`;

const codeWithCheckbox = `<Menubar default-value="view">
  <MenubarMenu value="view">
    <MenubarTrigger>Exibir</MenubarTrigger>
    <MenubarContent>
      <MenubarCheckboxItem :checked="showSidebar" @update:checked="showSidebar = $event">Sidebar</MenubarCheckboxItem>
      <MenubarCheckboxItem :checked="showGrid" @update:checked="showGrid = $event">Grid</MenubarCheckboxItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`;

const codeWithRadio = `<Menubar default-value="theme">
  <MenubarMenu value="theme">
    <MenubarTrigger>Tema</MenubarTrigger>
    <MenubarContent>
      <MenubarRadioGroup v-model="theme">
        <MenubarRadioItem value="light">Claro</MenubarRadioItem>
        <MenubarRadioItem value="dark">Escuro</MenubarRadioItem>
        <MenubarRadioItem value="system">Sistema</MenubarRadioItem>
      </MenubarRadioGroup>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`;

const codeEditorComplete = `<Menubar>
  <MenubarMenu value="file">
    <MenubarTrigger>Arquivo</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Novo <MenubarShortcut>⌘N</MenubarShortcut></MenubarItem>
      <MenubarItem>Abrir... <MenubarShortcut>⌘O</MenubarShortcut></MenubarItem>
      <MenubarItem>Salvar <MenubarShortcut>⌘S</MenubarShortcut></MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu value="edit">
    <MenubarTrigger>Editar</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Desfazer <MenubarShortcut>⌘Z</MenubarShortcut></MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu value="view">
    <MenubarTrigger>Exibir</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Tela cheia <MenubarShortcut>F11</MenubarShortcut></MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu value="help">
    <MenubarTrigger>Ajuda</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Sobre</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`;

const compShowSidebar = ref(true);
const compShowGrid = ref(false);
const compTheme = ref('system');

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.withShortcuts.name'),
    description: tContent('variants.compositions.withShortcuts.description'),
    useWhen: tContent('variants.compositions.withShortcuts.use'),
    code: codeWithShortcuts,
  },
  {
    name: tContent('variants.compositions.withCheckbox.name'),
    description: tContent('variants.compositions.withCheckbox.description'),
    useWhen: tContent('variants.compositions.withCheckbox.use'),
    code: codeWithCheckbox,
  },
  {
    name: tContent('variants.compositions.withRadio.name'),
    description: tContent('variants.compositions.withRadio.description'),
    useWhen: tContent('variants.compositions.withRadio.use'),
    code: codeWithRadio,
  },
  {
    name: tContent('variants.compositions.editorComplete.name'),
    description: tContent('variants.compositions.editorComplete.description'),
    useWhen: tContent('variants.compositions.editorComplete.use'),
    code: codeEditorComplete,
  },
]);

const stateItems = computed(() => [
  { label: tContent('states.items.closed'),   trigger: '—',              behavior: stripHtml(tContent('states.descriptions.closed'))   },
  { label: tContent('states.items.open'),     trigger: 'defaultValue',   behavior: stripHtml(tContent('states.descriptions.open'))     },
  { label: tContent('states.items.disabled'), trigger: 'disabled',       behavior: stripHtml(tContent('states.descriptions.disabled')) },
  { label: tContent('states.items.checked'),  trigger: 'checked',        behavior: stripHtml(tContent('states.descriptions.checked'))  },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const menubarPropItems = computed(() => [
  { name: 'value',           type: tContent('props.table.value.type'),          defaultValue: tContent('props.table.value.default'),          required: tContent('props.table.value.required'),          description: stripHtml(tContent('props.table.value.description'))          },
  { name: '@update:value',   type: tContent('props.table.onValueChange.type'),  defaultValue: tContent('props.table.onValueChange.default'),  required: tContent('props.table.onValueChange.required'),  description: stripHtml(tContent('props.table.onValueChange.description'))  },
  { name: 'defaultValue',    type: tContent('props.table.defaultValue.type'),   defaultValue: tContent('props.table.defaultValue.default'),   required: tContent('props.table.defaultValue.required'),   description: stripHtml(tContent('props.table.defaultValue.description'))   },
  { name: 'loop',            type: tContent('props.table.loop.type'),           defaultValue: tContent('props.table.loop.default'),           required: tContent('props.table.loop.required'),           description: stripHtml(tContent('props.table.loop.description'))           },
  { name: 'side',            type: tContent('props.table.side.type'),           defaultValue: tContent('props.table.side.default'),           required: tContent('props.table.side.required'),           description: stripHtml(tContent('props.table.side.description'))           },
  { name: 'align',           type: tContent('props.table.align.type'),          defaultValue: tContent('props.table.align.default'),          required: tContent('props.table.align.required'),          description: stripHtml(tContent('props.table.align.description'))          },
]);

const tokenRows = computed(() => [
  { token: '--background',         value: tContent('tokens.table.menubarBg.class'),     description: tContent('tokens.table.menubarBg.part')     },
  { token: '--border',             value: tContent('tokens.table.menubarBorder.class'), description: tContent('tokens.table.menubarBorder.part') },
  { token: '--accent',             value: tContent('tokens.table.triggerHover.class'),  description: tContent('tokens.table.triggerHover.part')  },
  { token: '--popover',            value: tContent('tokens.table.contentBg.class'),     description: tContent('tokens.table.contentBg.part')     },
  { token: '--foreground',         value: tContent('tokens.table.contentBorder.class'), description: tContent('tokens.table.contentBorder.part') },
  { token: '--radius-lg',          value: tContent('tokens.table.rounded.class'),       description: tContent('tokens.table.rounded.part')       },
  { token: '--accent (item)',      value: tContent('tokens.table.itemHover.class'),     description: tContent('tokens.table.itemHover.part')     },
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
  { key: 'Tab',           description: stripHtml(tContent('accessibility.keyboard.tab'))              },
  { key: '← / →',         description: stripHtml(tContent('accessibility.keyboard.arrowsHorizontal')) },
  { key: '↑ / ↓',         description: stripHtml(tContent('accessibility.keyboard.arrowsVertical'))   },
  { key: 'Enter / Space', description: stripHtml(tContent('accessibility.keyboard.enter'))            },
  { key: 'Escape',        description: stripHtml(tContent('accessibility.keyboard.escape'))           },
  { key: 'Home / End',    description: stripHtml(tContent('accessibility.keyboard.homeEnd'))          },
  { key: 'A–Z',           description: stripHtml(tContent('accessibility.keyboard.typeahead'))        },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.navigationMenu.name'), description: tContent('related.items.navigationMenu.description'), path: '?path=/docs/ui-navigationmenu--docs' },
  { name: tContent('related.items.dropdownMenu.name'),   description: tContent('related.items.dropdownMenu.description'),   path: '?path=/docs/ui-dropdownmenu--docs'   },
  { name: tContent('related.items.sidebar.name'),        description: tContent('related.items.sidebar.description'),        path: '?path=/docs/ui-sidebar--docs'        },
  { name: tContent('related.items.command.name'),        description: tContent('related.items.command.description'),        path: '?path=/docs/ui-command--docs'        },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
  { title: '', content: tContent('notes.item5') },
  { title: '', content: tContent('notes.item6') },
]);

const analyticsItems = computed(() => [
  { event: 'menubar_menu_open',        trigger: '@update:value(menu)',     payload: "{ component: 'menubar', menu, label }" },
  { event: 'menubar_item_select',      trigger: '@select em Item',         payload: "{ component: 'menubar', menu, label }" },
  { event: 'menubar_shortcut_invoke',  trigger: 'atalho registrado',       payload: "{ component: 'menubar', shortcut, label }" },
]);

const functionalTestItems = computed(() => [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
  action: stripHtml(tContent(`testes.functional.item${i}.action`)),
  result: stripHtml(tContent(`testes.functional.item${i}.result`)),
  priority: localPriority(tContent(`testes.functional.item${i}.priority`)),
})));

const a11yTestItems = computed(() => [
  { criterion: tContent('testes.accessibility.item1'), level: 'AA',     how: 'axe-core'           },
  { criterion: tContent('testes.accessibility.item2'), level: '1.3.1',  how: 'DevTools attribute' },
  { criterion: tContent('testes.accessibility.item3'), level: '4.1.2',  how: 'DevTools attribute' },
  { criterion: tContent('testes.accessibility.item4'), level: '4.1.2',  how: 'DevTools a11y tree' },
  { criterion: tContent('testes.accessibility.item5'), level: '4.1.2',  how: 'DevTools a11y tree' },
  { criterion: tContent('testes.accessibility.item6'), level: '2.4.3',  how: 'Manual review'      },
  { criterion: tContent('testes.accessibility.item7'), level: '1.4.3',  how: 'Contrast checker'   },
]);

const visualTestItems = computed(() => [1, 2, 3, 4, 5].map((i) => ({
  story: tContent(`testes.visual.item${i}.story`),
  priority: localPriority(tContent(`testes.visual.item${i}.priority`)),
})));

const a11yCritCols = computed(() => ({
  criterion: 'Critério',
  level: 'WCAG',
  how: 'Como verificar',
}));
</script>

<template>
  <DocsPageLayout :nav-groups="navGroups" :active-section="activeSection" component-slug="menubar">
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
        install-note="npx shadcn-vue@latest add menubar"
      />
    </template>

    <!-- ── Demonstração ─────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div class="w-full" style="contain: layout; min-height: 320px;">
        <Menubar>
          <MenubarMenu value="file">
            <MenubarTrigger>{{ stripHtml(tContent('demonstration.labels.fileMenu')) }}</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Novo <MenubarShortcut>⌘N</MenubarShortcut></MenubarItem>
              <MenubarItem>Abrir <MenubarShortcut>⌘O</MenubarShortcut></MenubarItem>
              <MenubarSeparator />
              <MenubarSub>
                <MenubarSubTrigger>Exportar</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>PDF</MenubarItem>
                  <MenubarItem>CSV</MenubarItem>
                  <MenubarItem>JSON</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu value="edit">
            <MenubarTrigger>{{ stripHtml(tContent('demonstration.labels.editMenu')) }}</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Desfazer <MenubarShortcut>⌘Z</MenubarShortcut></MenubarItem>
              <MenubarItem>Refazer <MenubarShortcut>⇧⌘Z</MenubarShortcut></MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Copiar <MenubarShortcut>⌘C</MenubarShortcut></MenubarItem>
              <MenubarItem>Colar <MenubarShortcut>⌘V</MenubarShortcut></MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu value="view">
            <MenubarTrigger>{{ stripHtml(tContent('demonstration.labels.viewMenu')) }}</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem :checked="true">Barra de status</MenubarCheckboxItem>
              <MenubarCheckboxItem :checked="false">Barra lateral</MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu value="tools">
            <MenubarTrigger>{{ stripHtml(tContent('demonstration.labels.toolsMenu')) }}</MenubarTrigger>
            <MenubarContent>
              <MenubarRadioGroup model-value="grid">
                <MenubarRadioItem value="list">Lista</MenubarRadioItem>
                <MenubarRadioItem value="grid">Grid</MenubarRadioItem>
                <MenubarRadioItem value="kanban">Kanban</MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    </DocsDemonstration>

    <!-- ── Anatomia ─────────────────────────────────────────────── -->
    <DocsAnatomy
      :title="tContent('anatomy.title')"
      :items="anatomyItems"
      :structure-label="tContent('anatomy.structureLabel')"
      :structure-code="anatomyStructure"
    />

    <!-- ── Quando Usar ──────────────────────────────────────────── -->
    <DocsWhenToUse
      :title="tContent('usage.title')"
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
          { element: tContent('usage.uxWriting.table.trigger.name'),     rules: tContent('usage.uxWriting.table.trigger.format'),     do: tContent('usage.uxWriting.table.trigger.good'),     dont: tContent('usage.uxWriting.table.trigger.bad')     },
          { element: tContent('usage.uxWriting.table.item.name'),        rules: tContent('usage.uxWriting.table.item.format'),        do: tContent('usage.uxWriting.table.item.good'),        dont: tContent('usage.uxWriting.table.item.bad')        },
          { element: tContent('usage.uxWriting.table.shortcut.name'),    rules: tContent('usage.uxWriting.table.shortcut.format'),    do: tContent('usage.uxWriting.table.shortcut.good'),    dont: tContent('usage.uxWriting.table.shortcut.bad')    },
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
      :title="tContent('doDont.title')"
      :pairs="[
        { doLabel: 'Faça', dontLabel: 'Evite', doCaption: tContent('doDont.pair1.do'), dontCaption: tContent('doDont.pair1.dont') },
        { doLabel: 'Faça', dontLabel: 'Evite', doCaption: tContent('doDont.pair2.do'), dontCaption: tContent('doDont.pair2.dont') },
      ]"
    >
      <template #do-preview-0>
        <div style="contain: layout; min-height: 80px;" class="w-full">
          <Menubar>
            <MenubarMenu value="file"><MenubarTrigger>Arquivo</MenubarTrigger><MenubarContent><MenubarItem>Novo</MenubarItem></MenubarContent></MenubarMenu>
            <MenubarMenu value="edit"><MenubarTrigger>Editar</MenubarTrigger><MenubarContent><MenubarItem>Copiar</MenubarItem></MenubarContent></MenubarMenu>
            <MenubarMenu value="view"><MenubarTrigger>Exibir</MenubarTrigger><MenubarContent><MenubarItem>Zoom</MenubarItem></MenubarContent></MenubarMenu>
          </Menubar>
        </div>
      </template>
      <template #dont-preview-0>
        <div style="contain: layout; min-height: 80px;" class="w-full">
          <Menubar>
            <MenubarMenu value="single"><MenubarTrigger>Menu</MenubarTrigger><MenubarContent><MenubarItem>Item</MenubarItem></MenubarContent></MenubarMenu>
          </Menubar>
        </div>
      </template>
      <template #do-preview-1>
        <div style="contain: layout; min-height: 220px;" class="w-full">
          <Menubar default-value="edit">
            <MenubarMenu value="edit">
              <MenubarTrigger>Editar</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>Salvar <MenubarShortcut>⌘S</MenubarShortcut></MenubarItem>
                <MenubarItem>Desfazer <MenubarShortcut>⌘Z</MenubarShortcut></MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>
      </template>
      <template #dont-preview-1>
        <div style="contain: layout; min-height: 220px;" class="w-full">
          <Menubar default-value="file">
            <MenubarMenu value="file">
              <MenubarTrigger>Arquivo</MenubarTrigger>
              <MenubarContent>
                <MenubarSub>
                  <MenubarSubTrigger>Exportar</MenubarSubTrigger>
                  <MenubarSubContent>
                    <MenubarSub>
                      <MenubarSubTrigger>Tipo</MenubarSubTrigger>
                      <MenubarSubContent>
                        <MenubarItem>PDF</MenubarItem>
                      </MenubarSubContent>
                    </MenubarSub>
                  </MenubarSubContent>
                </MenubarSub>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>
      </template>
    </DocsDoDont>

    <!-- ── Importação ───────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :code="codeImportBasic"
    />

    <!-- ── Variantes ────────────────────────────────────────────── -->
    <DocsVariants :title="tContent('variants.title')" :items="variantItems">
      <template #variant-preview-0>
        <div style="contain: layout; min-height: 220px;" class="w-full">
          <Menubar default-value="file">
            <MenubarMenu value="file">
              <MenubarTrigger>Arquivo</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>Novo</MenubarItem>
                <MenubarItem>Abrir</MenubarItem>
                <MenubarItem>Salvar</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>
      </template>
      <template #variant-preview-1>
        <div style="contain: layout; min-height: 220px;" class="w-full">
          <Menubar default-value="file">
            <MenubarMenu value="file">
              <MenubarTrigger>Arquivo</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>Salvar</MenubarItem>
                <MenubarSeparator />
                <MenubarItem variant="destructive">Excluir arquivo</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>
      </template>
    </DocsVariants>

    <!-- ── Composições ──────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="menubar"
      :items="compositionItems"
    >
      <template #variant-preview-0>
        <div style="contain: layout; min-height: 220px;" class="w-full">
          <Menubar default-value="edit">
            <MenubarMenu value="edit">
              <MenubarTrigger>Editar</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>Desfazer <MenubarShortcut>⌘Z</MenubarShortcut></MenubarItem>
                <MenubarItem>Refazer <MenubarShortcut>⇧⌘Z</MenubarShortcut></MenubarItem>
                <MenubarSeparator />
                <MenubarItem>Copiar <MenubarShortcut>⌘C</MenubarShortcut></MenubarItem>
                <MenubarItem>Colar <MenubarShortcut>⌘V</MenubarShortcut></MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>
      </template>
      <template #variant-preview-1>
        <div style="contain: layout; min-height: 220px;" class="w-full">
          <Menubar default-value="view">
            <MenubarMenu value="view">
              <MenubarTrigger>Exibir</MenubarTrigger>
              <MenubarContent>
                <MenubarCheckboxItem :checked="compShowSidebar" @update:checked="(v: boolean) => (compShowSidebar = v)">Sidebar</MenubarCheckboxItem>
                <MenubarCheckboxItem :checked="compShowGrid" @update:checked="(v: boolean) => (compShowGrid = v)">Grid</MenubarCheckboxItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>
      </template>
      <template #variant-preview-2>
        <div style="contain: layout; min-height: 220px;" class="w-full">
          <Menubar default-value="theme">
            <MenubarMenu value="theme">
              <MenubarTrigger>Tema</MenubarTrigger>
              <MenubarContent>
                <MenubarRadioGroup v-model="compTheme">
                  <MenubarRadioItem value="light">Claro</MenubarRadioItem>
                  <MenubarRadioItem value="dark">Escuro</MenubarRadioItem>
                  <MenubarRadioItem value="system">Sistema</MenubarRadioItem>
                </MenubarRadioGroup>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>
      </template>
      <template #variant-preview-3>
        <div style="contain: layout; min-height: 220px;" class="w-full">
          <Menubar>
            <MenubarMenu value="file">
              <MenubarTrigger>Arquivo</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>Novo <MenubarShortcut>⌘N</MenubarShortcut></MenubarItem>
                <MenubarItem>Abrir... <MenubarShortcut>⌘O</MenubarShortcut></MenubarItem>
                <MenubarItem>Salvar <MenubarShortcut>⌘S</MenubarShortcut></MenubarItem>
                <MenubarSeparator />
                <MenubarItem>Sair <MenubarShortcut>⌘Q</MenubarShortcut></MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu value="edit">
              <MenubarTrigger>Editar</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>Desfazer <MenubarShortcut>⌘Z</MenubarShortcut></MenubarItem>
                <MenubarItem>Refazer <MenubarShortcut>⇧⌘Z</MenubarShortcut></MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu value="view">
              <MenubarTrigger>Exibir</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>Modo escuro</MenubarItem>
                <MenubarItem>Tela cheia <MenubarShortcut>F11</MenubarShortcut></MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu value="help">
              <MenubarTrigger>Ajuda</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>Documentação</MenubarItem>
                <MenubarItem>Sobre</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>
      </template>
    </DocsCompositions>

    <!-- ── Estados ──────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{
        state: tContent('props.table.prop'),
        trigger: tContent('usage.scenarios.cols.scenario'),
        behavior: tContent('usage.scenarios.cols.use'),
      }"
      :items="stateItems"
    />

    <!-- ── Propriedades ─────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: 'Menubar', cols: propCols, items: menubarPropItems },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="tContent('props.extensibilityCode')"
    />

    <!-- ── Tokens ───────────────────────────────────────────────── -->
    <DocsTokens
      :title="tContent('tokens.title')"
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
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-title="tContent('accessibility.keyboard.title')"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ─────────────────────────────────────────── -->
    <DocsRelated :title="tContent('related.title')" :items="relatedItems" />

    <!-- ── Notas ────────────────────────────────────────────────── -->
    <DocsNotes :title="tContent('notes.title')" :items="noteItems" />

    <!-- ── Analytics ────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :cols="{
        event: 'Evento',
        trigger: 'Quando dispara',
        payload: 'Payload',
      }"
      :items="analyticsItems"
    />

    <!-- ── Testes ───────────────────────────────────────────────── -->
    <DocsTestes
      :title="tContent('testes.title')"
      :functional="{
        title: tContent('testes.functional.title'),
        cols: { action: 'Ação', result: 'Resultado esperado', priority: 'Prioridade' },
        items: functionalTestItems,
      }"
      :accessibility="{
        title: tContent('testes.accessibility.title'),
        cols: a11yCritCols,
        items: a11yTestItems,
      }"
      :visual="{
        title: tContent('testes.visual.title'),
        cols: { story: 'Story', priority: 'Prioridade' },
        items: visualTestItems,
      }"
    />
  </DocsPageLayout>
</template>
