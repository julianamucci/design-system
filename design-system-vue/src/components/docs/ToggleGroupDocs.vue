<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Bold, Italic, Underline,
  LayoutGrid, List, Eye,
} from 'lucide-vue-next';

import DocsPageLayout    from '@/components/docs/shared/sections/DocsPageLayout.vue';
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

import uiTranslations        from '@/i18n/ui.json';
import componentTranslations from '@shared/content/toggle-group/translations.json';

// ─── i18n ─────────────────────────────────────────────────────────────────────
// IMPORTANT: locale comes from useTranslation — NEVER from useLocaleStore/Pinia
const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(componentTranslations);

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
  componentSlug: 'toggle-group',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
  aiIntent: tContent('seo.aiIntent') as 'informational' | 'navigational',
  breadcrumb: [
    { name: 'Components', item: '/components' },
    { name: tContent('category'), item: '/components/form' },
    { name: tContent('title') },
  ],
})));

// ─── Analytics — page view (reactive to locale) ───────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'toggle-group',
    locale: newLocale as 'pt-BR' | 'en' | 'es',
    page_title: tContent('seo.title'),
  });
}, { immediate: true });

// ─── Analytics — section view ─────────────────────────────────────────────────

// ─── Demo state ───────────────────────────────────────────────────────────────

const demoAlignment = ref<string>('left');
const demoFormatting = ref<string[]>(['bold']);
const demoView = ref<string>('grid');

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
      { id: 'importacao',   label: tNav('nav.import')    },
      { id: 'variantes',    label: tNav('nav.variants')  },
      { id: 'composicoes',  label: tNav('nav.compositions') },
      { id: 'estados',      label: tNav('nav.states')    },
      { id: 'propriedades', label: tNav('nav.props')     },
      { id: 'tokens',       label: tNav('nav.tokens')    },
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
    component_name: 'toggle-group',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-vue-next";`;

const codeSingle = `<ToggleGroup
  type="single"
  :model-value="alignment"
  @update:model-value="(v) => alignment = v"
  aria-label="Alinhamento do texto"
>
  <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
    <AlignLeft aria-hidden="true" />
  </ToggleGroupItem>
  <ToggleGroupItem value="center" aria-label="Centralizar">
    <AlignCenter aria-hidden="true" />
  </ToggleGroupItem>
  <ToggleGroupItem value="right" aria-label="Alinhar à direita">
    <AlignRight aria-hidden="true" />
  </ToggleGroupItem>
</ToggleGroup>`;

const codeMultiple = `<ToggleGroup
  type="multiple"
  :model-value="formats"
  @update:model-value="(v) => formats = v"
  aria-label="Formatação"
>
  <ToggleGroupItem value="bold" aria-label="Negrito">
    <Bold aria-hidden="true" />
  </ToggleGroupItem>
  <ToggleGroupItem value="italic" aria-label="Itálico">
    <Italic aria-hidden="true" />
  </ToggleGroupItem>
  <ToggleGroupItem value="underline" aria-label="Sublinhado">
    <Underline aria-hidden="true" />
  </ToggleGroupItem>
</ToggleGroup>`;

const codeVertical = `<ToggleGroup
  type="single"
  orientation="vertical"
  default-value="grid"
  aria-label="Modo de visualização"
>
  <ToggleGroupItem value="grid" aria-label="Grade">
    <LayoutGrid aria-hidden="true" />
  </ToggleGroupItem>
  <ToggleGroupItem value="list" aria-label="Lista">
    <List aria-hidden="true" />
  </ToggleGroupItem>
</ToggleGroup>`;

const codeCustomizationTokens = `/* Spacing customizado entre itens */
[data-slot="toggle-group"] {
  --gap: 2;
}

/* Cor customizada do estado selecionado */
.toggle-group-brand [data-state="on"] {
  @apply bg-blue-500 text-white;
}`;

const interfaceCode = `interface ToggleGroupProps {
  type: 'single' | 'multiple';        // OBRIGATÓRIO
  modelValue?: string | string[];     // controlado (string single, array multiple)
  defaultValue?: string | string[];   // não-controlado inicial
  disabled?: boolean;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  spacing?: number;                   // 0 = segmented (default)
  class?: string;
  // Emits
  'onUpdate:modelValue'?: (value: string | string[]) => void;
}

interface ToggleGroupItemProps {
  value: string;                      // OBRIGATÓRIO, único no grupo
  disabled?: boolean;
  'aria-label'?: string;              // OBRIGATÓRIO em icon-only
  class?: string;
}`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
  tContent('anatomy.item4'),
]);

const variantItems = computed(() => [
  { name: stripHtml(tContent('variants.items.single')),   description: stripHtml(tContent('variants.styles.single')),   code: codeSingle   },
  { name: stripHtml(tContent('variants.items.multiple')), description: stripHtml(tContent('variants.styles.multiple')), code: codeMultiple },
  { name: stripHtml(tContent('variants.items.vertical')), description: stripHtml(tContent('variants.styles.vertical')), code: codeVertical },
]);

const codeAlignmentBar = `<ToggleGroup type="single" variant="outline" default-value="left" aria-label="Alinhamento do texto">
  <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
    <AlignLeft aria-hidden="true" />
  </ToggleGroupItem>
  <ToggleGroupItem value="center" aria-label="Centralizar">
    <AlignCenter aria-hidden="true" />
  </ToggleGroupItem>
  <ToggleGroupItem value="right" aria-label="Alinhar à direita">
    <AlignRight aria-hidden="true" />
  </ToggleGroupItem>
</ToggleGroup>`;

const codeFormattingBar = `<ToggleGroup type="multiple" variant="outline" :default-value="['bold']" aria-label="Formatação">
  <ToggleGroupItem value="bold" aria-label="Negrito">
    <Bold aria-hidden="true" />
  </ToggleGroupItem>
  <ToggleGroupItem value="italic" aria-label="Itálico">
    <Italic aria-hidden="true" />
  </ToggleGroupItem>
  <ToggleGroupItem value="underline" aria-label="Sublinhado">
    <Underline aria-hidden="true" />
  </ToggleGroupItem>
</ToggleGroup>`;

const codeViewMode = `<ToggleGroup type="single" variant="outline" default-value="grid" orientation="vertical" aria-label="Modo de visualização">
  <ToggleGroupItem value="grid">
    <LayoutGrid aria-hidden="true" />
    Grade
  </ToggleGroupItem>
  <ToggleGroupItem value="list">
    <List aria-hidden="true" />
    Lista
  </ToggleGroupItem>
</ToggleGroup>`;

const codeDisabledItem = `<ToggleGroup type="single" variant="outline" default-value="left" aria-label="Alinhamento do texto">
  <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
    <AlignLeft aria-hidden="true" />
  </ToggleGroupItem>
  <ToggleGroupItem value="center" :disabled="true" aria-label="Centralizar (indisponível)">
    <AlignCenter aria-hidden="true" />
  </ToggleGroupItem>
  <ToggleGroupItem value="right" aria-label="Alinhar à direita">
    <AlignRight aria-hidden="true" />
  </ToggleGroupItem>
</ToggleGroup>`;

const codeFilterWithText = `<div class="flex flex-col gap-2 w-72">
  <span>Filtros de exibição</span>
  <ToggleGroup type="multiple" variant="outline" :default-value="['compact']" aria-label="Filtros de exibição">
    <ToggleGroupItem value="hidden">
      <Eye aria-hidden="true" />
      Ocultos
    </ToggleGroupItem>
    <ToggleGroupItem value="compact">
      <List aria-hidden="true" />
      Compacto
    </ToggleGroupItem>
  </ToggleGroup>
</div>`;

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.alignmentBar.name'),
    description: tContent('variants.compositions.alignmentBar.description'),
    useWhen: tContent('variants.compositions.alignmentBar.use'),
    code: codeAlignmentBar,
  },
  {
    name: tContent('variants.compositions.formattingBar.name'),
    description: tContent('variants.compositions.formattingBar.description'),
    useWhen: tContent('variants.compositions.formattingBar.use'),
    code: codeFormattingBar,
  },
  {
    name: tContent('variants.compositions.viewMode.name'),
    description: tContent('variants.compositions.viewMode.description'),
    useWhen: tContent('variants.compositions.viewMode.use'),
    code: codeViewMode,
  },
  {
    name: tContent('variants.compositions.disabledItem.name'),
    description: tContent('variants.compositions.disabledItem.description'),
    useWhen: tContent('variants.compositions.disabledItem.use'),
    code: codeDisabledItem,
  },
  {
    name: tContent('variants.compositions.filterWithText.name'),
    description: tContent('variants.compositions.filterWithText.description'),
    useWhen: tContent('variants.compositions.filterWithText.use'),
    code: codeFilterWithText,
  },
]);

const stateCols = computed(() => ({
  state: tNav('nav.states'),
  trigger: '—',
  behavior: tNav('common.expectedResult'),
}));

const stateItems = computed(() => [
  { label: tContent('states.items.default'),  trigger: '—', behavior: tContent('states.descriptions.default')  },
  { label: tContent('states.items.selected'), trigger: '—', behavior: tContent('states.descriptions.selected') },
  { label: tContent('states.items.hover'),    trigger: '—', behavior: tContent('states.descriptions.hover')    },
  { label: tContent('states.items.focus'),    trigger: '—', behavior: tContent('states.descriptions.focus')    },
  { label: tContent('states.items.disabled'), trigger: '—', behavior: tContent('states.descriptions.disabled') },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const groupPropItems = computed(() => [
  { name: 'type',               type: tContent('props.table.type_prop.type'),         defaultValue: tContent('props.table.type_prop.default'),     required: tContent('props.table.type_prop.required'),     description: stripHtml(tContent('props.table.type_prop.description'))     },
  { name: 'modelValue',         type: tContent('props.table.value.type'),             defaultValue: tContent('props.table.value.default'),         required: tContent('props.table.value.required'),         description: stripHtml(tContent('props.table.value.description'))         },
  { name: 'defaultValue',       type: tContent('props.table.defaultValue.type'),      defaultValue: tContent('props.table.defaultValue.default'),  required: tContent('props.table.defaultValue.required'),  description: stripHtml(tContent('props.table.defaultValue.description'))  },
  { name: '@update:modelValue', type: tContent('props.table.onValueChange.type'),     defaultValue: tContent('props.table.onValueChange.default'), required: tContent('props.table.onValueChange.required'), description: stripHtml(tContent('props.table.onValueChange.description')) },
  { name: 'disabled',           type: tContent('props.table.disabled.type'),          defaultValue: tContent('props.table.disabled.default'),      required: tContent('props.table.disabled.required'),      description: stripHtml(tContent('props.table.disabled.description'))      },
  { name: 'orientation',        type: tContent('props.table.orientation.type'),       defaultValue: tContent('props.table.orientation.default'),   required: tContent('props.table.orientation.required'),   description: stripHtml(tContent('props.table.orientation.description'))   },
  { name: 'variant',            type: tContent('props.table.variant.type'),           defaultValue: tContent('props.table.variant.default'),       required: tContent('props.table.variant.required'),       description: stripHtml(tContent('props.table.variant.description'))       },
  { name: 'size',               type: tContent('props.table.size.type'),              defaultValue: tContent('props.table.size.default'),          required: tContent('props.table.size.required'),          description: stripHtml(tContent('props.table.size.description'))          },
  { name: 'spacing',            type: tContent('props.table.spacing.type'),           defaultValue: tContent('props.table.spacing.default'),       required: tContent('props.table.spacing.required'),       description: stripHtml(tContent('props.table.spacing.description'))       },
]);

const itemPropItems = computed(() => [
  { name: 'value',      type: 'string',  defaultValue: '—',     required: 'Sim', description: 'Identificador único do item dentro do grupo.' },
  { name: 'disabled',   type: 'boolean', defaultValue: 'false', required: 'Não', description: 'Desabilita apenas este item.' },
  { name: 'aria-label', type: 'string',  defaultValue: '—',     required: 'Sim', description: 'Obrigatório em items icon-only — descreve a ação.' },
]);

const tokenRows = computed(() => [
  { token: '--muted',         value: tContent('tokens.table.muted.class'),       description: tContent('tokens.table.muted.part')       },
  { token: '--foreground',    value: tContent('tokens.table.foreground.class'),  description: tContent('tokens.table.foreground.part')  },
  { token: '--input',         value: tContent('tokens.table.input.class'),       description: tContent('tokens.table.input.part')       },
  { token: '--ring',          value: tContent('tokens.table.ring.class'),        description: tContent('tokens.table.ring.part')        },
  { token: '--destructive',   value: tContent('tokens.table.destructive.class'), description: tContent('tokens.table.destructive.part') },
  { token: '--radius-button', value: tContent('tokens.table.radius.class'),      description: tContent('tokens.table.radius.part')      },
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
  { key: 'Tab',         description: tContent('accessibility.keyboard.tab')        },
  { key: 'ArrowRight',  description: tContent('accessibility.keyboard.arrowRight') },
  { key: 'ArrowLeft',   description: tContent('accessibility.keyboard.arrowLeft')  },
  { key: 'ArrowDown',   description: tContent('accessibility.keyboard.arrowDown')  },
  { key: 'ArrowUp',     description: tContent('accessibility.keyboard.arrowUp')    },
  { key: 'Home',        description: tContent('accessibility.keyboard.home')       },
  { key: 'End',         description: tContent('accessibility.keyboard.end')        },
  { key: 'Space',       description: tContent('accessibility.keyboard.space')      },
  { key: 'Enter',       description: tContent('accessibility.keyboard.enter')      },
]);

const relatedItems = computed(() => [
  { name: 'Toggle',     description: tContent('related.items.toggle.description'),     path: '?path=/docs/ui-toggle--docs'     },
  { name: 'Tabs',       description: tContent('related.items.tabs.description'),       path: '?path=/docs/ui-tabs--docs'       },
  { name: 'RadioGroup', description: tContent('related.items.radioGroup.description'), path: '?path=/docs/ui-radiogroup--docs' },
  { name: 'Checkbox',   description: tContent('related.items.checkbox.description'),   path: '?path=/docs/ui-checkbox--docs'   },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
]);

const analyticsItems = computed(() => [
  { event: 'field_change', trigger: tContent('analytics.table.field_change.trigger'), payload: tContent('analytics.table.field_change.payload') },
  { event: 'docs_page_view', trigger: locale.value === 'en' ? 'Page mount per locale' : locale.value === 'es' ? 'Montaje de página por locale' : 'Mount da página por locale', payload: '{ component_name: "toggle-group", locale, page_title }' },
  { event: 'docs_section_viewed', trigger: locale.value === 'en' ? 'Section enters viewport' : locale.value === 'es' ? 'La sección entra al viewport' : 'Seção entra no viewport', payload: '{ component_name: "toggle-group", section_id, locale }' },
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
]);

const a11yTestItems = computed(() => [
  { criterion: tContent('testes.accessibility.item1'), level: 'WCAG 2.1', how: '—' },
  { criterion: tContent('testes.accessibility.item2'), level: 'WCAG 2.1', how: '—' },
  { criterion: tContent('testes.accessibility.item3'), level: 'WCAG 2.1', how: '—' },
  { criterion: tContent('testes.accessibility.item4'), level: 'WCAG 2.1', how: '—' },
  { criterion: tContent('testes.accessibility.item5'), level: 'WCAG 2.1', how: '—' },
]);

const visualTestItems = computed(() => [
  { story: tContent('testes.visual.item1.story'), priority: localPriority(tContent('testes.visual.item1.priority')) },
  { story: tContent('testes.visual.item2.story'), priority: localPriority(tContent('testes.visual.item2.priority')) },
  { story: tContent('testes.visual.item3.story'), priority: localPriority(tContent('testes.visual.item3.priority')) },
  { story: tContent('testes.visual.item4.story'), priority: localPriority(tContent('testes.visual.item4.priority')) },
  { story: tContent('testes.visual.item5.story'), priority: localPriority(tContent('testes.visual.item5.priority')) },
]);
</script>

<template>
  <DocsPageLayout :nav-groups="navGroups" :active-section="activeSection" component-slug="toggle-group">
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
        install-note="npx shadcn-vue@latest add toggle-group"
      />
    </template>

    <!-- ── Demonstração ─────────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div class="flex flex-col gap-6 w-full max-w-md">
        <!-- Single — alignment -->
        <ToggleGroup
          type="single"
          :model-value="demoAlignment"
          @update:model-value="(v) => demoAlignment = (v as string)"
          :aria-label="tContent('demonstration.labels.alignmentLabel')"
        >
          <ToggleGroupItem value="left" :aria-label="tContent('demonstration.labels.left')">
            <AlignLeft aria-hidden="true" />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" :aria-label="tContent('demonstration.labels.center')">
            <AlignCenter aria-hidden="true" />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" :aria-label="tContent('demonstration.labels.right')">
            <AlignRight aria-hidden="true" />
          </ToggleGroupItem>
          <ToggleGroupItem value="justify" :aria-label="tContent('demonstration.labels.justify')">
            <AlignJustify aria-hidden="true" />
          </ToggleGroupItem>
        </ToggleGroup>

        <!-- Multiple — formatting -->
        <ToggleGroup
          type="multiple"
          :model-value="demoFormatting"
          @update:model-value="(v) => demoFormatting = (v as string[])"
          :aria-label="tContent('demonstration.labels.formattingLabel')"
        >
          <ToggleGroupItem value="bold" :aria-label="tContent('demonstration.labels.bold')">
            <Bold aria-hidden="true" />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" :aria-label="tContent('demonstration.labels.italic')">
            <Italic aria-hidden="true" />
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" :aria-label="tContent('demonstration.labels.underline')">
            <Underline aria-hidden="true" />
          </ToggleGroupItem>
        </ToggleGroup>

        <!-- View mode -->
        <ToggleGroup
          type="single"
          variant="outline"
          :model-value="demoView"
          @update:model-value="(v) => demoView = (v as string)"
          :aria-label="tContent('demonstration.labels.viewLabel')"
        >
          <ToggleGroupItem value="grid" :aria-label="tContent('demonstration.labels.grid')">
            <LayoutGrid aria-hidden="true" />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" :aria-label="tContent('demonstration.labels.list')">
            <List aria-hidden="true" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </DocsDemonstration>

    <!-- ── Anatomia ─────────────────────────────────────────────────── -->
    <DocsAnatomy
      :title="tContent('anatomy.title')"
      :items="anatomyItems"
      :structure-label="tContent('anatomy.structureLabel')"
      :structure-code="tContent('anatomy.structureCode')"
    />

    <!-- ── Quando Usar ──────────────────────────────────────────────── -->
    <DocsWhenToUse
      :title="tContent('usage.title')"
      :guidelines="{
        title: tContent('usage.guidelines.title'),
        items: [
          tContent('usage.guidelines.item1'),
          tContent('usage.guidelines.item2'),
          tContent('usage.guidelines.item3'),
          tContent('usage.guidelines.item4'),
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
      :ux-writing="{
        title: tContent('usage.uxWriting.title'),
        cols: {
          element: tContent('usage.uxWriting.table.element'),
          rules: tContent('usage.uxWriting.table.rules'),
          do: tContent('usage.uxWriting.table.correct'),
          dont: tContent('usage.uxWriting.table.avoid'),
        },
        items: [
          {
            element: tContent('usage.uxWriting.table.groupLabel.name'),
            rules: tContent('usage.uxWriting.table.groupLabel.format'),
            do: tContent('usage.uxWriting.table.groupLabel.good'),
            dont: tContent('usage.uxWriting.table.groupLabel.bad'),
          },
          {
            element: tContent('usage.uxWriting.table.itemLabel.name'),
            rules: tContent('usage.uxWriting.table.itemLabel.format'),
            do: tContent('usage.uxWriting.table.itemLabel.good'),
            dont: tContent('usage.uxWriting.table.itemLabel.bad'),
          },
          {
            element: tContent('usage.uxWriting.table.order.name'),
            rules: tContent('usage.uxWriting.table.order.format'),
            do: tContent('usage.uxWriting.table.order.good'),
            dont: tContent('usage.uxWriting.table.order.bad'),
          },
        ],
      }"
    />

    <!-- ── Do & Don't ───────────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="[
        {
          doLabel: tNav('common.do'),
          dontLabel: tNav('common.dont'),
          doCaption: tContent('doDont.pair1.do'),
          dontCaption: tContent('doDont.pair1.dont'),
        },
        {
          doLabel: tNav('common.do'),
          dontLabel: tNav('common.dont'),
          doCaption: tContent('doDont.pair2.do'),
          dontCaption: tContent('doDont.pair2.dont'),
        },
      ]"
    >
      <!-- Pair 1: ToggleGroup vs múltiplos Toggles soltos -->
      <template #do-preview-0>
        <ToggleGroup type="multiple" aria-label="Formatação">
          <ToggleGroupItem value="bold" aria-label="Negrito"><Bold aria-hidden="true" /></ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Itálico"><Italic aria-hidden="true" /></ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="Sublinhado"><Underline aria-hidden="true" /></ToggleGroupItem>
        </ToggleGroup>
      </template>
      <template #dont-preview-0>
        <div class="flex items-center gap-3">
          <ToggleGroup type="single" aria-label="A"><ToggleGroupItem value="bold" aria-label="Negrito"><Bold aria-hidden="true" /></ToggleGroupItem></ToggleGroup>
          <ToggleGroup type="single" aria-label="B"><ToggleGroupItem value="italic" aria-label="Itálico"><Italic aria-hidden="true" /></ToggleGroupItem></ToggleGroup>
          <ToggleGroup type="single" aria-label="C"><ToggleGroupItem value="underline" aria-label="Sublinhado"><Underline aria-hidden="true" /></ToggleGroupItem></ToggleGroup>
        </div>
      </template>

      <!-- Pair 2: aria-label descritivo vs ausente/genérico -->
      <template #do-preview-1>
        <ToggleGroup type="single" default-value="left" aria-label="Alinhamento do texto">
          <ToggleGroupItem value="left" aria-label="Alinhar à esquerda"><AlignLeft aria-hidden="true" /></ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Centralizar"><AlignCenter aria-hidden="true" /></ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Alinhar à direita"><AlignRight aria-hidden="true" /></ToggleGroupItem>
        </ToggleGroup>
      </template>
      <template #dont-preview-1>
        <ToggleGroup type="single" default-value="left" aria-label="Grupo">
          <ToggleGroupItem value="left"><AlignLeft aria-hidden="true" /></ToggleGroupItem>
          <ToggleGroupItem value="center"><AlignCenter aria-hidden="true" /></ToggleGroupItem>
          <ToggleGroupItem value="right"><AlignRight aria-hidden="true" /></ToggleGroupItem>
        </ToggleGroup>
      </template>
    </DocsDoDont>

    <!-- ── Importação ───────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :code="codeImportBasic"
    />

    <!-- ── Variantes ────────────────────────────────────────────────── -->
    <DocsVariants :title="tContent('variants.title')" :items="variantItems" component-slug="toggle-group">
      <!-- single -->
      <template #variant-preview-0>
        <ToggleGroup type="single" default-value="center" aria-label="Alinhamento do texto">
          <ToggleGroupItem value="left" aria-label="Alinhar à esquerda"><AlignLeft aria-hidden="true" /></ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Centralizar"><AlignCenter aria-hidden="true" /></ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Alinhar à direita"><AlignRight aria-hidden="true" /></ToggleGroupItem>
        </ToggleGroup>
      </template>

      <!-- multiple -->
      <template #variant-preview-1>
        <ToggleGroup type="multiple" :default-value="['bold']" aria-label="Formatação">
          <ToggleGroupItem value="bold" aria-label="Negrito"><Bold aria-hidden="true" /></ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Itálico"><Italic aria-hidden="true" /></ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="Sublinhado"><Underline aria-hidden="true" /></ToggleGroupItem>
        </ToggleGroup>
      </template>

      <!-- vertical -->
      <template #variant-preview-2>
        <ToggleGroup type="single" orientation="vertical" variant="outline" default-value="grid" aria-label="Modo de visualização">
          <ToggleGroupItem value="grid" aria-label="Grade"><LayoutGrid aria-hidden="true" /></ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="Lista"><List aria-hidden="true" /></ToggleGroupItem>
        </ToggleGroup>
      </template>
    </DocsVariants>

    <!-- ── Composições ──────────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="toggle-group"
      :items="compositionItems"
    >
      <template #variant-preview-0>
        <ToggleGroup type="single" variant="outline" default-value="left" aria-label="Alinhamento do texto">
          <ToggleGroupItem value="left" aria-label="Alinhar à esquerda"><AlignLeft aria-hidden="true" /></ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Centralizar"><AlignCenter aria-hidden="true" /></ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Alinhar à direita"><AlignRight aria-hidden="true" /></ToggleGroupItem>
        </ToggleGroup>
      </template>
      <template #variant-preview-1>
        <ToggleGroup type="multiple" variant="outline" :default-value="['bold']" aria-label="Formatação">
          <ToggleGroupItem value="bold" aria-label="Negrito"><Bold aria-hidden="true" /></ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Itálico"><Italic aria-hidden="true" /></ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="Sublinhado"><Underline aria-hidden="true" /></ToggleGroupItem>
        </ToggleGroup>
      </template>
      <template #variant-preview-2>
        <ToggleGroup type="single" variant="outline" default-value="grid" orientation="vertical" aria-label="Modo de visualização">
          <ToggleGroupItem value="grid"><LayoutGrid aria-hidden="true" />Grade</ToggleGroupItem>
          <ToggleGroupItem value="list"><List aria-hidden="true" />Lista</ToggleGroupItem>
        </ToggleGroup>
      </template>
      <template #variant-preview-3>
        <ToggleGroup type="single" variant="outline" default-value="left" aria-label="Alinhamento do texto">
          <ToggleGroupItem value="left" aria-label="Alinhar à esquerda"><AlignLeft aria-hidden="true" /></ToggleGroupItem>
          <ToggleGroupItem value="center" :disabled="true" aria-label="Centralizar (indisponível)"><AlignCenter aria-hidden="true" /></ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Alinhar à direita"><AlignRight aria-hidden="true" /></ToggleGroupItem>
        </ToggleGroup>
      </template>
      <template #variant-preview-4>
        <div class="flex flex-col gap-2 w-72">
          <span>Filtros de exibição</span>
          <ToggleGroup type="multiple" variant="outline" :default-value="['compact']" aria-label="Filtros de exibição">
            <ToggleGroupItem value="hidden"><Eye aria-hidden="true" />Ocultos</ToggleGroupItem>
            <ToggleGroupItem value="compact"><List aria-hidden="true" />Compacto</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </template>
    </DocsCompositions>

    <!-- ── Estados ──────────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="stateCols"
      :items="stateItems"
    />

    <!-- ── Propriedades ─────────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: 'ToggleGroup',     cols: propCols, items: groupPropItems },
        { title: 'ToggleGroupItem', cols: propCols, items: itemPropItems  },
      ]"
      :interface-code="interfaceCode"
    />

    <!-- ── Tokens ────────────────────────────────────────────────────── -->
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

    <!-- ── Acessibilidade ───────────────────────────────────────────── -->
    <DocsAccessibility
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ─────────────────────────────────────────────── -->
    <DocsRelated :title="tContent('related.title')" :items="relatedItems" />

    <!-- ── Notas ────────────────────────────────────────────────────── -->
    <DocsNotes :title="tContent('notes.title')" :items="noteItems" />

    <!-- ── Analytics ────────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :cols="{
        event: tContent('analytics.table.event'),
        trigger: tContent('analytics.table.trigger'),
        payload: tContent('analytics.table.payload'),
      }"
      :items="analyticsItems"
    />

    <!-- ── Testes ────────────────────────────────────────────────────── -->
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
        cols: {
          story: tNav('common.storyState'),
          priority: tNav('common.priority'),
        },
        items: visualTestItems,
      }"
    />
  </DocsPageLayout>
</template>
