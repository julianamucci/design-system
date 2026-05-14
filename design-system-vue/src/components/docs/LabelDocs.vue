<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import LanguageSwitcher from '@/components/product/LanguageSwitcher.vue';
import DocsPageLayout    from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import labelTranslations from '@shared/content/label/translations.json';

import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.vue';
import DocsDemonstration from '@/components/docs/shared/sections/DocsDemonstration.vue';
import DocsAnatomy       from '@/components/docs/shared/sections/DocsAnatomy.vue';
import DocsWhenToUse     from '@/components/docs/shared/sections/DocsWhenToUse.vue';
import DocsDoDont        from '@/components/docs/shared/sections/DocsDoDont.vue';
import DocsImport        from '@/components/docs/shared/sections/DocsImport.vue';
import DocsVariants      from '@/components/docs/shared/sections/DocsVariants.vue';
import DocsStates        from '@/components/docs/shared/sections/DocsStates.vue';
import DocsProps         from '@/components/docs/shared/sections/DocsProps.vue';
import DocsTokens        from '@/components/docs/shared/sections/DocsTokens.vue';
import DocsAccessibility from '@/components/docs/shared/sections/DocsAccessibility.vue';
import DocsRelated       from '@/components/docs/shared/sections/DocsRelated.vue';
import DocsNotes         from '@/components/docs/shared/sections/DocsNotes.vue';
import DocsAnalytics     from '@/components/docs/shared/sections/DocsAnalytics.vue';
import DocsTestes        from '@/components/docs/shared/sections/DocsTestes.vue';

// ─── i18n ─────────────────────────────────────────────────────────────────────

// locale vem de useTranslation, NUNCA de useLocaleStore ou Pinia
const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(labelTranslations);

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
  componentSlug: 'label',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'label',
    locale: newLocale,
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
    component_name: 'label',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import { Label } from "@/components/ui/label";`;

const codeDefault = `<Label for="nome">Nome completo</Label>
<input id="nome" type="text" />`;

const codeRequired = `<Label for="email">
  Email profissional
  <span class="text-destructive" aria-hidden="true">*</span>
</Label>
<input id="email" type="email" aria-required="true" />`;

const codeDisabled = `<!-- peer-disabled: Label e Input devem ser siblings no DOM -->
<Label for="cpf">CPF</Label>
<input id="cpf" type="text" class="peer" disabled />`;

const codeCustomization = `<!-- Personalização via class -->
<Label for="field" class="text-muted-foreground">
  Rótulo secundário
</Label>`;

const interfaceCode = `// Label (Vue)
interface LabelProps {
  for?: string;       // htmlFor no HTML nativo — associa ao campo pelo id
  class?: string;     // Classes Tailwind adicionais
  // Aceita todos os atributos HTML nativos do elemento <label>
}`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
]);

const variantItems = computed(() => [
  {
    name: tContent('variants.default.label'),
    description: stripHtml(tContent('variants.default.description')),
    code: codeDefault,
  },
]);

const stateItems = computed(() => [
  {
    label: tContent('states.default.label'),
    trigger: tContent('states.default.trigger'),
    behavior: tContent('states.default.behavior'),
  },
  {
    label: tContent('states.disabled.label'),
    trigger: stripHtml(tContent('states.disabled.trigger')),
    behavior: stripHtml(tContent('states.disabled.behavior')),
  },
  {
    label: tContent('states.required.label'),
    trigger: tContent('states.required.trigger'),
    behavior: stripHtml(tContent('states.required.behavior')),
  },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const labelPropItems = computed(() => [
  { name: 'for', type: 'string', defaultValue: '—', required: 'Não', description: stripHtml(tContent('props.table.htmlFor')) },
  { name: 'class', type: 'string', defaultValue: '—', required: 'Não', description: tContent('props.table.className') },
  { name: 'default slot', type: 'VNode', defaultValue: '—', required: 'Sim', description: tContent('props.table.children') },
]);

const tokenRows = computed(() => [
  { token: '--foreground',  value: 'text-foreground',  description: tContent('tokens.table.foreground')      },
  { token: '--foreground',  value: 'opacity-50',        description: tContent('tokens.table.foregroundMuted') },
  { token: '—',             value: 'text-sm',           description: tContent('tokens.table.fontSize')        },
  { token: '—',             value: 'font-medium',       description: tContent('tokens.table.fontWeight')      },
  { token: '—',             value: 'leading-none',      description: tContent('tokens.table.lineHeight')      },
  { token: '--destructive', value: 'text-destructive',  description: tContent('tokens.table.destructive')     },
]);

const accessibilityItems = computed(() => [
  tContent('accessibility.item1'),
  tContent('accessibility.item2'),
  tContent('accessibility.item3'),
  tContent('accessibility.item4'),
]);

const keyboardItems = computed(() => [
  { key: 'Tab',  description: tContent('accessibility.keyboard.tab')        },
  { key: '—',    description: tContent('accessibility.keyboard.noKeyboard') },
]);

const relatedItems = computed(() => [
  { name: 'Input',      description: tContent('related.input'),      path: '?path=/docs/ui-input--docs'      },
  { name: 'FormLabel',  description: tContent('related.formLabel'),  path: '?path=/docs/ui-formlabel--docs'  },
  { name: 'FormField',  description: tContent('related.formField'),  path: '?path=/docs/ui-formfield--docs'  },
  { name: 'Checkbox',   description: tContent('related.checkbox'),   path: '?path=/docs/ui-checkbox--docs'   },
  { name: 'RadioGroup', description: tContent('related.radioGroup'), path: '?path=/docs/ui-radiogroup--docs' },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.tip1') },
  { title: '', content: tContent('notes.tip2') },
  { title: '', content: tContent('notes.tip3') },
]);

const analyticsItems = computed(() => [
  {
    event: 'docs_page_view',
    trigger: 'Carregamento da página / troca de locale',
    payload: 'component_name, locale, page_title',
  },
  {
    event: 'docs_section_viewed',
    trigger: 'Seção entra no viewport (IntersectionObserver)',
    payload: 'section_id, component_name, locale',
  },
]);

const functionalTestItems = computed(() => [
  { action: tContent('testes.functional.item1.action'), result: tContent('testes.functional.item1.result'), priority: localPriority(tContent('testes.functional.item1.priority')) },
  { action: tContent('testes.functional.item2.action'), result: tContent('testes.functional.item2.result'), priority: localPriority(tContent('testes.functional.item2.priority')) },
  { action: tContent('testes.functional.item3.action'), result: tContent('testes.functional.item3.result'), priority: localPriority(tContent('testes.functional.item3.priority')) },
  { action: tContent('testes.functional.item4.action'), result: tContent('testes.functional.item4.result'), priority: localPriority(tContent('testes.functional.item4.priority')) },
]);

const a11yTestItems = computed(() => [
  { criterion: tContent('testes.accessibility.item1'), level: 'WCAG 2.1 AA', how: 'axe-core' },
  { criterion: tContent('testes.accessibility.item2'), level: 'WCAG 2.1 AA', how: 'getByLabelText()' },
  { criterion: tContent('testes.accessibility.item3'), level: 'WCAG 2.1 AA', how: 'DOM inspection' },
  { criterion: tContent('testes.accessibility.item4'), level: 'WCAG 1.4.3',  how: 'Contrast analyser' },
]);

const a11yCritCols = computed(() => ({
  criterion: tNav('common.criterion'),
  level: 'WCAG',
  how: tNav('common.howToVerify'),
}));

const visualTestItems = computed(() => [
  { story: tContent('testes.visual.item1.story'), priority: localPriority(tContent('testes.visual.item1.priority')) },
  { story: tContent('testes.visual.item2.story'), priority: localPriority(tContent('testes.visual.item2.priority')) },
  { story: tContent('testes.visual.item3.story'), priority: localPriority(tContent('testes.visual.item3.priority')) },
  { story: tContent('testes.visual.item4.story'), priority: localPriority(tContent('testes.visual.item4.priority')) },
]);
</script>

<template>
  <DocsPageLayout :nav-groups="navGroups" :active-section="activeSection">
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
        install-note="npx shadcn-vue@latest add label"
      />
    </template>

    <!-- ── Demonstração ───────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div class="flex flex-col gap-6 w-full max-w-sm">
        <!-- Default -->
        <div class="flex flex-col gap-2">
          <Label for="demo-default">{{ tContent('demonstration.labels.default') }}</Label>
          <Input id="demo-default" type="text" :placeholder="tContent('demonstration.labels.default')" />
        </div>

        <!-- Required -->
        <div class="flex flex-col gap-2">
          <Label for="demo-required">
            {{ tContent('demonstration.labels.required') }}
            <span class="text-destructive" aria-hidden="true">{{ tContent('demonstration.labels.requiredMarker') }}</span>
          </Label>
          <Input id="demo-required" type="email" :placeholder="tContent('demonstration.labels.required')" aria-required="true" />
        </div>

        <!-- Disabled -->
        <div class="flex flex-col gap-2">
          <Label for="demo-disabled">{{ tContent('demonstration.labels.disabled') }}</Label>
          <Input id="demo-disabled" type="text" class="peer" :placeholder="tContent('demonstration.labels.disabled')" disabled />
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
        ],
      }"
      :do="{ title: tContent('usage.do.title'), items: [tContent('usage.do.item1'), tContent('usage.do.item2'), tContent('usage.do.item3')] }"
      :dont="{ title: tContent('usage.dont.title'), items: [tContent('usage.dont.item1'), tContent('usage.dont.item2'), tContent('usage.dont.item3')] }"
    />

    <!-- ── Do & Don't ─────────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="[
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: tContent('doDont.pair1.do'), dontCaption: tContent('doDont.pair1.dont') },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: tContent('doDont.pair2.do'), dontCaption: tContent('doDont.pair2.dont') },
      ]"
    >
      <!-- Par 1 — com htmlFor vs. sem htmlFor -->
      <template #do-preview-0>
        <div class="flex flex-col gap-2 w-full max-w-xs">
          <Label for="do-input-1">Nome completo</Label>
          <Input id="do-input-1" type="text" placeholder="Digite seu nome" />
        </div>
      </template>
      <template #dont-preview-0>
        <div class="flex flex-col gap-2 w-full max-w-xs">
          <Label>Nome completo</Label>
          <Input type="text" placeholder="Digite seu nome" />
        </div>
      </template>

      <!-- Par 2 — texto nominal vs. instrução -->
      <template #do-preview-1>
        <div class="flex flex-col gap-2 w-full max-w-xs">
          <Label for="do-input-2">Email profissional</Label>
          <Input id="do-input-2" type="email" placeholder="voce@empresa.com" />
        </div>
      </template>
      <template #dont-preview-1>
        <div class="flex flex-col gap-2 w-full max-w-xs">
          <Label for="dont-input-2">Informe seu email profissional</Label>
          <Input id="dont-input-2" type="email" placeholder="voce@empresa.com" />
        </div>
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :code="codeImportBasic"
    />

    <!-- ── Variantes ──────────────────────────────────────────────── -->
    <DocsVariants :title="tContent('variants.title')" :items="variantItems">
      <template #variant-preview-0>
        <div class="flex flex-col gap-2 w-full max-w-xs">
          <Label for="variant-default">Nome completo</Label>
          <Input id="variant-default" type="text" placeholder="Digite seu nome" />
        </div>
      </template>
    </DocsVariants>

    <!-- ── Estados ───────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{
        state: tContent('states.cols.state'),
        trigger: tContent('states.cols.trigger'),
        behavior: tContent('states.cols.behavior'),
      }"
      :items="stateItems"
    />

    <!-- ── Propriedades ───────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: 'Label', cols: propCols, items: labelPropItems },
      ]"
      :interface-code="interfaceCode"
      :extensibility-notes="tContent('props.note')"
    />

    <!-- ── Tokens ─────────────────────────────────────────────────── -->
    <DocsTokens
      :title="tContent('tokens.title')"
      :cols="{
        token: tContent('tokens.table.token'),
        value: tContent('tokens.table.class'),
        description: tContent('tokens.table.part'),
      }"
      :items="tokenRows"
      customization-title="Personalização"
      :customization-code="codeCustomization"
    />

    <!-- ── Acessibilidade ─────────────────────────────────────────── -->
    <DocsAccessibility
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ───────────────────────────────────────────── -->
    <DocsRelated :title="tContent('related.title')" :items="relatedItems" />

    <!-- ── Notas ──────────────────────────────────────────────────── -->
    <DocsNotes :title="tContent('notes.title')" :items="noteItems" />

    <!-- ── Analytics ─────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :description="tContent('analytics.description')"
      :cols="{ event: 'Evento', trigger: 'Gatilho', payload: 'Payload' }"
      :items="analyticsItems"
    />

    <!-- ── Testes ─────────────────────────────────────────────────── -->
    <DocsTestes
      :title="tContent('testes.title')"
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
