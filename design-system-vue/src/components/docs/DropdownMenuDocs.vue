<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import {
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
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import componentTranslations from '@shared/content/dropdown-menu/translations.json';

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
  componentSlug: 'dropdown-menu',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
  aiIntent: tContent('seo.aiIntent'),
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
      { id: 'variantes',    label: tContent('nav.variants') },
      { id: 'composicoes',  label: tContent('nav.compositions') },
      { id: 'estados',      label: tContent('nav.states')   },
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

const codeDefault = `<DropdownMenu>
  <DropdownMenuTrigger as-child>
    <Button variant="outline">Abrir menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Editar</DropdownMenuItem>
    <DropdownMenuItem>Duplicar</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`;

const codeDestructive = `<DropdownMenu>
  <DropdownMenuTrigger as-child>
    <Button variant="outline">Conta</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Perfil</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive">Excluir conta</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`;

const interfaceCode = `// DropdownMenu (root)
interface DropdownMenuRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  modal?: boolean;
}

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

// ─── Compositions ─────────────────────────────────────────────────────────────

const codeCompWithLabel = `<DropdownMenu>
  <DropdownMenuTrigger as-child>
    <Button variant="outline">Conta</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Conta</DropdownMenuLabel>
    <DropdownMenuItem>Perfil</DropdownMenuItem>
    <DropdownMenuItem>Configurações</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuLabel>Suporte</DropdownMenuLabel>
    <DropdownMenuItem>Documentação</DropdownMenuItem>
    <DropdownMenuItem>Sair</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`;

const codeCompCheckbox = `<DropdownMenu>
  <DropdownMenuTrigger as-child>
    <Button variant="outline">Colunas</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
    <DropdownMenuCheckboxItem v-model:checked="showName">Nome</DropdownMenuCheckboxItem>
    <DropdownMenuCheckboxItem v-model:checked="showEmail">E-mail</DropdownMenuCheckboxItem>
    <DropdownMenuCheckboxItem v-model:checked="showRole">Cargo</DropdownMenuCheckboxItem>
  </DropdownMenuContent>
</DropdownMenu>`;

const codeCompRadio = `<DropdownMenu>
  <DropdownMenuTrigger as-child>
    <Button variant="outline">Tema</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Aparência</DropdownMenuLabel>
    <DropdownMenuRadioGroup v-model="theme">
      <DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="dark">Escuro</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="system">Sistema</DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  </DropdownMenuContent>
</DropdownMenu>`;

const codeCompShortcuts = `<DropdownMenu>
  <DropdownMenuTrigger as-child>
    <Button variant="outline">Editar</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>
      Desfazer <DropdownMenuShortcut>⌘Z</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuItem>
      Refazer <DropdownMenuShortcut>⇧⌘Z</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>
      Copiar <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuItem>
      Colar <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`;

const compShowName = ref(true);
const compShowEmail = ref(true);
const compShowRole = ref(false);
const compTheme = ref('system');

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.withLabel.name'),
    description: tContent('variants.compositions.withLabel.description'),
    useWhen: tContent('variants.compositions.withLabel.use'),
    code: codeCompWithLabel,
  },
  {
    name: tContent('variants.compositions.withCheckboxItems.name'),
    description: tContent('variants.compositions.withCheckboxItems.description'),
    useWhen: tContent('variants.compositions.withCheckboxItems.use'),
    code: codeCompCheckbox,
  },
  {
    name: tContent('variants.compositions.withRadioGroup.name'),
    description: tContent('variants.compositions.withRadioGroup.description'),
    useWhen: tContent('variants.compositions.withRadioGroup.use'),
    code: codeCompRadio,
  },
  {
    name: tContent('variants.compositions.withShortcuts.name'),
    description: tContent('variants.compositions.withShortcuts.description'),
    useWhen: tContent('variants.compositions.withShortcuts.use'),
    code: codeCompShortcuts,
  },
]);

const stateItems = computed(() => [
  { label: tContent('states.items.closed'),   trigger: '—',           behavior: stripHtml(tContent('states.descriptions.closed'))   },
  { label: tContent('states.items.open'),     trigger: 'defaultOpen', behavior: stripHtml(tContent('states.descriptions.open'))     },
  { label: tContent('states.items.disabled'), trigger: 'disabled',    behavior: stripHtml(tContent('states.descriptions.disabled')) },
  { label: tContent('states.items.checked'),  trigger: 'checked',     behavior: stripHtml(tContent('states.descriptions.checked'))  },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const dropdownPropItems = computed(() => [
  { name: 'open',          type: tContent('props.table.open.type'),         defaultValue: tContent('props.table.open.default'),         required: tContent('props.table.open.required'),         description: stripHtml(tContent('props.table.open.description'))         },
  { name: 'onUpdate:open', type: tContent('props.table.onOpenChange.type'), defaultValue: tContent('props.table.onOpenChange.default'), required: tContent('props.table.onOpenChange.required'), description: stripHtml(tContent('props.table.onOpenChange.description')) },
  { name: 'defaultOpen',   type: tContent('props.table.defaultOpen.type'),  defaultValue: tContent('props.table.defaultOpen.default'),  required: tContent('props.table.defaultOpen.required'),  description: stripHtml(tContent('props.table.defaultOpen.description'))  },
  { name: 'modal',         type: tContent('props.table.modal.type'),        defaultValue: tContent('props.table.modal.default'),        required: tContent('props.table.modal.required'),        description: stripHtml(tContent('props.table.modal.description'))        },
  { name: 'side',          type: tContent('props.table.side.type'),         defaultValue: tContent('props.table.side.default'),         required: tContent('props.table.side.required'),         description: stripHtml(tContent('props.table.side.description'))         },
  { name: 'align',         type: tContent('props.table.align.type'),        defaultValue: tContent('props.table.align.default'),        required: tContent('props.table.align.required'),        description: stripHtml(tContent('props.table.align.description'))        },
]);

const tokenRows = computed(() => [
  { token: '--popover',            value: tContent('tokens.table.background.class'),  description: tContent('tokens.table.background.part')  },
  { token: '--popover-foreground', value: tContent('tokens.table.foreground.class'),  description: tContent('tokens.table.foreground.part')  },
  { token: '--border',             value: tContent('tokens.table.border.class'),      description: tContent('tokens.table.border.part')      },
  { token: '--shadow',             value: tContent('tokens.table.shadow.class'),      description: tContent('tokens.table.shadow.part')      },
  { token: '--radius-lg',          value: tContent('tokens.table.rounded.class'),     description: tContent('tokens.table.rounded.part')     },
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
  { key: 'Tab',                  description: stripHtml(tContent('accessibility.keyboard.tab'))       },
  { key: '↑ / ↓ / ← / →',        description: stripHtml(tContent('accessibility.keyboard.arrows'))    },
  { key: 'Enter / Space',        description: stripHtml(tContent('accessibility.keyboard.enter'))     },
  { key: 'Escape',               description: stripHtml(tContent('accessibility.keyboard.escape'))    },
  { key: 'Home / End',           description: stripHtml(tContent('accessibility.keyboard.homeEnd'))   },
  { key: 'A–Z',                  description: stripHtml(tContent('accessibility.keyboard.typeahead')) },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.contextMenu.name'), description: tContent('related.items.contextMenu.description'), path: '?path=/docs/ui-contextmenu--docs' },
  { name: tContent('related.items.menubar.name'),     description: tContent('related.items.menubar.description'),     path: '?path=/docs/ui-menubar--docs'     },
  { name: tContent('related.items.command.name'),     description: tContent('related.items.command.description'),     path: '?path=/docs/ui-command--docs'     },
  { name: tContent('related.items.popover.name'),     description: tContent('related.items.popover.description'),     path: '?path=/docs/ui-popover--docs'     },
  { name: tContent('related.items.select.name'),      description: tContent('related.items.select.description'),      path: '?path=/docs/ui-select--docs'      },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
  { title: '', content: tContent('notes.item5') },
]);

const analyticsItems = computed(() => [
  { event: 'dropdown_menu_open',        trigger: '@update:open(true)',  payload: "{ component: 'dropdown-menu', location, label }" },
  { event: 'dropdown_menu_close',       trigger: '@update:open(false)', payload: "{ component: 'dropdown-menu', location, label }" },
  { event: 'dropdown_menu_item_select', trigger: '@select em Item',     payload: "{ component: 'dropdown-menu', location, label }" },
]);

const functionalTestItems = computed(() => [1, 2, 3, 4, 5, 6, 7].map((i) => ({
  action: stripHtml(tContent(`testes.functional.item${i}.action`)),
  result: stripHtml(tContent(`testes.functional.item${i}.result`)),
  priority: localPriority(tContent(`testes.functional.item${i}.priority`)),
})));

const a11yTestItems = computed(() => [1, 2, 3, 4, 5, 6].map((i) => ({
  criterion: tContent(`testes.accessibility.item${i}`),
  level: 'AA',
  how: tContent(`testes.accessibility.item${i}`),
})));

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
  <DocsPageLayout :nav-groups="navGroups" :active-section="activeSection" component-slug="dropdown-menu">
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
        install-note="npx shadcn-vue@latest add dropdown-menu"
      />
    </template>

    <!-- ── Demonstração ─────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div class="flex flex-wrap items-center justify-center gap-4 w-full" style="contain: layout">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline">{{ tContent('demonstration.labels.basic') }}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuLabel>Conta</DropdownMenuLabel>
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configurações</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
          { element: tContent('usage.uxWriting.table.label.name'),       rules: tContent('usage.uxWriting.table.label.format'),       do: tContent('usage.uxWriting.table.label.good'),       dont: tContent('usage.uxWriting.table.label.bad')       },
          { element: tContent('usage.uxWriting.table.item.name'),        rules: tContent('usage.uxWriting.table.item.format'),        do: tContent('usage.uxWriting.table.item.good'),        dont: tContent('usage.uxWriting.table.item.bad')        },
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
        <div style="contain: layout; min-height: 220px;" class="w-full">
          <DropdownMenu :default-open="true" :modal="false">
            <DropdownMenuContent side="bottom" align="start">
              <DropdownMenuLabel>Conta</DropdownMenuLabel>
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Configurações</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Workspace</DropdownMenuLabel>
              <DropdownMenuItem>Convidar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </template>
      <template #dont-preview-0>
        <div style="contain: layout; min-height: 220px;" class="w-full">
          <DropdownMenu :default-open="true" :modal="false">
            <DropdownMenuContent side="bottom" align="start">
              <DropdownMenuItem>Item 1</DropdownMenuItem>
              <DropdownMenuItem>Item 2</DropdownMenuItem>
              <DropdownMenuItem>Item 3</DropdownMenuItem>
              <DropdownMenuItem>Item 4</DropdownMenuItem>
              <DropdownMenuItem>Item 5</DropdownMenuItem>
              <DropdownMenuItem>Item 6</DropdownMenuItem>
              <DropdownMenuItem>Item 7</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </template>
      <template #do-preview-1>
        <div style="contain: layout; min-height: 200px;" class="w-full">
          <DropdownMenu :default-open="true" :modal="false">
            <DropdownMenuContent side="bottom" align="start">
              <DropdownMenuItem>Editar</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Excluir conta</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </template>
      <template #dont-preview-1>
        <div style="contain: layout; min-height: 200px;" class="w-full">
          <DropdownMenu :default-open="true" :modal="false">
            <DropdownMenuContent side="bottom" align="start">
              <DropdownMenuItem>Editar</DropdownMenuItem>
              <DropdownMenuItem>Excluir conta</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
        <div style="contain: layout; min-height: 200px;" class="w-full">
          <DropdownMenu :default-open="true" :modal="false">
            <DropdownMenuContent side="bottom" align="start">
              <DropdownMenuItem>Editar</DropdownMenuItem>
              <DropdownMenuItem>Duplicar</DropdownMenuItem>
              <DropdownMenuItem>Compartilhar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </template>
      <template #variant-preview-1>
        <div style="contain: layout; min-height: 200px;" class="w-full">
          <DropdownMenu :default-open="true" :modal="false">
            <DropdownMenuContent side="bottom" align="start">
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Excluir conta</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </template>
    </DocsVariants>

    <!-- ── Composições ──────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      use-when-label="Quando usar"
      component-slug="dropdown-menu"
      :items="compositionItems"
    >
      <template #variant-preview-0>
        <div style="contain: layout; min-height: 240px;" class="w-full">
          <DropdownMenu :default-open="true" :modal="false">
            <DropdownMenuTrigger as-child>
              <Button variant="outline" size="sm">Conta</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="start">
              <DropdownMenuLabel>Conta</DropdownMenuLabel>
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Configurações</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Suporte</DropdownMenuLabel>
              <DropdownMenuItem>Documentação</DropdownMenuItem>
              <DropdownMenuItem>Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </template>
      <template #variant-preview-1>
        <div style="contain: layout; min-height: 200px;" class="w-full">
          <DropdownMenu :default-open="true" :modal="false">
            <DropdownMenuTrigger as-child>
              <Button variant="outline" size="sm">Colunas</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="start">
              <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
              <DropdownMenuCheckboxItem v-model:checked="compShowName">Nome</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem v-model:checked="compShowEmail">E-mail</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem v-model:checked="compShowRole">Cargo</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </template>
      <template #variant-preview-2>
        <div style="contain: layout; min-height: 200px;" class="w-full">
          <DropdownMenu :default-open="true" :modal="false">
            <DropdownMenuTrigger as-child>
              <Button variant="outline" size="sm">Tema</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="start">
              <DropdownMenuLabel>Aparência</DropdownMenuLabel>
              <DropdownMenuRadioGroup v-model="compTheme">
                <DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">Escuro</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">Sistema</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </template>
      <template #variant-preview-3>
        <div style="contain: layout; min-height: 220px;" class="w-full">
          <DropdownMenu :default-open="true" :modal="false">
            <DropdownMenuTrigger as-child>
              <Button variant="outline" size="sm">Editar</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="start">
              <DropdownMenuItem>
                Desfazer
                <DropdownMenuShortcut>⌘Z</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                Refazer
                <DropdownMenuShortcut>⇧⌘Z</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Copiar
                <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                Colar
                <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
        { title: 'DropdownMenu', cols: propCols, items: dropdownPropItems },
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
