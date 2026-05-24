<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DocsPageLayout    from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations   from '@/i18n/ui.json';
import inputTranslations from '@shared/content/input/translations.json';

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

// IMPORTANTE: locale vem de useTranslation, NUNCA de useLocaleStore ou Pinia
const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(inputTranslations);

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  componentSlug: 'input',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'input',
    locale: newLocale as 'pt-BR' | 'en' | 'es',
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
    component_name: 'input',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import { Input } from "@/components/ui/input";`;

const codeDefault = `<Input type="text" placeholder="ex: João da Silva" />`;

const codeWithLabel = `<div class="space-y-1.5">
  <Label for="nome">Nome completo</Label>
  <Input id="nome" type="text" placeholder="ex: João da Silva" />
</div>`;

const codeEmail = `<Input type="email" placeholder="ex: joao@empresa.com" />`;

const codePassword = `<Input type="password" placeholder="Mínimo 8 caracteres" />`;

const codeNumber = `<Input type="number" placeholder="0" />`;

const codeDisabled = `<Input type="text" placeholder="Não disponível" disabled />`;

const codeError = `<Input type="email" aria-invalid="true" placeholder="ex: joao@empresa.com" />`;

const codeFile = `<Input type="file" />`;

const codeCustomizationTokens = `/* Em globals.css — sobrescrever tokens de tema */
:root {
  --height-default: 2.5rem;  /* altura do campo */
  --radius-input: 0.375rem;  /* border-radius */
}`;

const interfaceCode = `// Input
interface InputProps {
  type?: string;            // Tipo HTML do input (text, email, password...)
  placeholder?: string;     // Texto de exemplo do formato esperado
  disabled?: boolean;       // Desabilita o campo
  class?: string;           // Classes Tailwind adicionais
  modelValue?: string | number;
  defaultValue?: string | number;
}`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
  tContent('anatomy.item4'),
]);

const variantItems = computed(() => [
  { name: 'text',     description: tContent('variants.types.text'),     code: codeDefault   },
  { name: 'email',    description: tContent('variants.types.email'),    code: codeEmail     },
  { name: 'password', description: tContent('variants.types.password'), code: codePassword  },
  { name: 'number',   description: tContent('variants.types.number'),   code: codeNumber    },
  { name: 'file',     description: tContent('variants.types.file'),     code: codeFile      },
]);

const codeCompWithLabel = `<div class="flex flex-col gap-1.5 w-full max-w-sm">
  <Label for="input-nome">Nome completo</Label>
  <Input id="input-nome" type="text" placeholder="ex: João da Silva" />
</div>`;

const codeCompWithHint = `<div class="flex flex-col gap-1.5 w-full max-w-sm">
  <Label for="input-email">Email</Label>
  <Input id="input-email" type="email" placeholder="ex: joao@empresa.com" />
  <p class="text-xs text-muted-foreground">Usaremos este email para envio de notificações.</p>
</div>`;

const codeCompWithError = `<div class="flex flex-col gap-1.5 w-full max-w-sm">
  <Label for="input-email-error">Email</Label>
  <Input id="input-email-error" type="email" placeholder="ex: joao@empresa.com" aria-invalid="true" aria-describedby="input-email-error-error" />
  <p class="text-xs text-destructive" id="input-email-error-error">Email inválido. Use o formato nome@dominio.com</p>
</div>`;

const codeCompWithPrefix = `<div class="flex flex-col gap-1.5 w-full max-w-sm">
  <Label for="input-url">URL do site</Label>
  <div class="flex items-center rounded-md border border-input focus-within:ring-2 focus-within:ring-ring/50 overflow-hidden">
    <span class="flex items-center px-3 text-sm text-muted-foreground bg-muted border-r border-input shrink-0">https://</span>
    <Input class="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1" type="url" id="input-url" placeholder="meusite.com" />
  </div>
</div>`;

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.withLabel.name'),
    description: tContent('variants.compositions.withLabel.description'),
    useWhen: tContent('variants.compositions.withLabel.use'),
    code: codeCompWithLabel,
  },
  {
    name: tContent('variants.compositions.withHint.name'),
    description: tContent('variants.compositions.withHint.description'),
    useWhen: tContent('variants.compositions.withHint.use'),
    code: codeCompWithHint,
  },
  {
    name: tContent('variants.compositions.withError.name'),
    description: tContent('variants.compositions.withError.description'),
    useWhen: tContent('variants.compositions.withError.use'),
    code: codeCompWithError,
  },
  {
    name: tContent('variants.compositions.withPrefix.name'),
    description: tContent('variants.compositions.withPrefix.description'),
    useWhen: tContent('variants.compositions.withPrefix.use'),
    code: codeCompWithPrefix,
  },
]);

const stateItems = computed(() => [
  { label: tContent('states.default.label'),  trigger: tContent('states.default.trigger'),  behavior: tContent('states.default.behavior')  },
  { label: tContent('states.focus.label'),    trigger: tContent('states.focus.trigger'),    behavior: tContent('states.focus.behavior')    },
  { label: tContent('states.disabled.label'), trigger: tContent('states.disabled.trigger'), behavior: tContent('states.disabled.behavior') },
  { label: tContent('states.error.label'),    trigger: tContent('states.error.trigger'),    behavior: tContent('states.error.behavior')    },
  { label: tContent('states.file.label'),     trigger: tContent('states.file.trigger'),     behavior: tContent('states.file.behavior')     },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const inputPropItems = computed(() => [
  { name: 'type',        type: 'string',                     defaultValue: '"text"', required: 'Não', description: tContent('props.table.type_prop')   },
  { name: 'placeholder', type: 'string',                     defaultValue: '—',      required: 'Não', description: tContent('props.table.placeholder')  },
  { name: 'disabled',    type: 'boolean',                    defaultValue: 'false',  required: 'Não', description: tContent('props.table.disabled')     },
  { name: 'class',       type: 'string',                     defaultValue: '—',      required: 'Não', description: tContent('props.table.className')    },
  { name: 'aria-invalid', type: '"true" | "false"',          defaultValue: '—',      required: 'Não', description: tContent('props.table.ariaInvalid')  },
  { name: 'autoComplete', type: 'string',                    defaultValue: '—',      required: 'Não', description: tContent('props.table.autoComplete') },
]);

const tokenRows = computed(() => [
  { token: '--height-default', value: 'h-(--height-default)',        description: tContent('tokens.table.height')       },
  { token: '--radius-input',   value: 'rounded-(--radius-input)',    description: tContent('tokens.table.radius')       },
  { token: '--border-input',   value: 'border-input',                description: tContent('tokens.table.border')       },
  { token: '--ring',           value: 'focus-visible:border-ring',   description: tContent('tokens.table.borderFocus')  },
  { token: '--ring',           value: 'focus-visible:ring-ring/50',  description: tContent('tokens.table.ring')         },
  { token: '--destructive',    value: 'aria-invalid:border-destructive', description: tContent('tokens.table.borderError') },
  { token: '--destructive',    value: 'aria-invalid:ring-destructive/20', description: tContent('tokens.table.ringError') },
  { token: '--input',          value: 'disabled:bg-input/50',        description: tContent('tokens.table.bgDisabled')   },
]);

const accessibilityItems = computed(() => [
  tContent('accessibility.item1'),
  tContent('accessibility.item2'),
  tContent('accessibility.item3'),
  tContent('accessibility.item4'),
  tContent('accessibility.item5'),
]);

const keyboardItems = computed(() => [
  { key: 'Tab',        description: tContent('accessibility.keyboard.tab')       },
  { key: 'Shift+Tab',  description: tContent('accessibility.keyboard.shiftTab')  },
  { key: 'Typing',     description: tContent('accessibility.keyboard.typing')    },
  { key: 'Escape',     description: tContent('accessibility.keyboard.escape')    },
]);

const relatedItems = computed(() => [
  { name: 'Textarea',  description: tContent('related.textarea'),  path: '?path=/docs/ui-textarea--docs'  },
  { name: 'InputOTP',  description: tContent('related.inputOTP'),  path: '?path=/docs/ui-inputotp--docs'  },
  { name: 'Select',    description: tContent('related.select'),    path: '?path=/docs/ui-select--docs'    },
  { name: 'Form',      description: tContent('related.form'),      path: '?path=/docs/ui-form--docs'      },
  { name: 'Label',     description: tContent('related.label'),     path: '?path=/docs/ui-label--docs'     },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.tip1') },
  { title: '', content: tContent('notes.tip2') },
  { title: '', content: tContent('notes.tip3') },
  { title: '', content: tContent('notes.tip4') },
  { title: '', content: tContent('notes.tip5') },
]);

const analyticsItems = computed(() => [
  { event: tContent('analytics.table.fieldFocus'),   trigger: tContent('analytics.table.fieldFocusTrigger'),   payload: tContent('analytics.table.fieldFocusPayload')   },
  { event: tContent('analytics.table.fieldBlur'),    trigger: tContent('analytics.table.fieldBlurTrigger'),    payload: tContent('analytics.table.fieldBlurPayload')    },
  { event: tContent('analytics.table.fieldError'),   trigger: tContent('analytics.table.fieldErrorTrigger'),   payload: tContent('analytics.table.fieldErrorPayload')   },
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
  { action: tContent('testes.functional.item1.action'), result: tContent('testes.functional.item1.result'), priority: localPriority(tContent('testes.functional.item1.priority')) },
  { action: tContent('testes.functional.item2.action'), result: tContent('testes.functional.item2.result'), priority: localPriority(tContent('testes.functional.item2.priority')) },
  { action: tContent('testes.functional.item3.action'), result: tContent('testes.functional.item3.result'), priority: localPriority(tContent('testes.functional.item3.priority')) },
  { action: tContent('testes.functional.item4.action'), result: tContent('testes.functional.item4.result'), priority: localPriority(tContent('testes.functional.item4.priority')) },
  { action: tContent('testes.functional.item5.action'), result: tContent('testes.functional.item5.result'), priority: localPriority(tContent('testes.functional.item5.priority')) },
  { action: tContent('testes.functional.item6.action'), result: tContent('testes.functional.item6.result'), priority: localPriority(tContent('testes.functional.item6.priority')) },
  { action: tContent('testes.functional.item7.action'), result: tContent('testes.functional.item7.result'), priority: localPriority(tContent('testes.functional.item7.priority')) },
  { action: tContent('testes.functional.item8.action'), result: tContent('testes.functional.item8.result'), priority: localPriority(tContent('testes.functional.item8.priority')) },
]);

const a11yTestItems = computed(() => [
  { criterion: tContent('testes.accessibility.item1'), level: 'WCAG 2.1 AA', how: 'axe-core' },
  { criterion: tContent('testes.accessibility.item2'), level: 'WCAG 2.1 AA', how: 'getByLabelText' },
  { criterion: tContent('testes.accessibility.item3'), level: 'WCAG 3.3.1',  how: 'aria-invalid' },
  { criterion: tContent('testes.accessibility.item4'), level: 'WCAG 1.3.1',  how: 'aria-describedby' },
  { criterion: tContent('testes.accessibility.item5'), level: 'WCAG 1.4.3',  how: 'Contrast Analyzer' },
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
  <DocsPageLayout :nav-groups="navGroups" :active-section="activeSection">
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
        install-note="npx shadcn-vue@latest add input"
      />
    </template>

    <!-- ── Demonstração ───────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div class="w-full max-w-sm space-y-4">
        <div class="space-y-1.5">
          <Label for="demo-nome">{{ tContent('demonstration.labels.defaultLabel') }}</Label>
          <Input id="demo-nome" type="text" :placeholder="tContent('demonstration.labels.defaultPlaceholder')" />
        </div>
        <div class="space-y-1.5">
          <Label for="demo-email">{{ tContent('demonstration.labels.emailLabel') }}</Label>
          <Input id="demo-email" type="email" :placeholder="tContent('demonstration.labels.emailPlaceholder')" />
        </div>
        <div class="space-y-1.5">
          <Label for="demo-senha">{{ tContent('demonstration.labels.passwordLabel') }}</Label>
          <Input id="demo-senha" type="password" :placeholder="tContent('demonstration.labels.passwordPlaceholder')" />
        </div>
        <div class="space-y-1.5">
          <Label for="demo-disabled">{{ tContent('demonstration.labels.disabledLabel') }}</Label>
          <Input id="demo-disabled" type="text" :placeholder="tContent('demonstration.labels.disabledPlaceholder')" disabled />
        </div>
        <div class="space-y-1.5">
          <Label for="demo-error">{{ tContent('demonstration.labels.errorLabel') }}</Label>
          <Input id="demo-error" type="email" :placeholder="tContent('demonstration.labels.errorPlaceholder')" aria-invalid="true" />
          <p class="text-sm text-destructive">{{ tContent('demonstration.labels.errorMessage') }}</p>
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
          { s: tContent('usage.scenarios.item6.s'), u: tContent('usage.scenarios.item6.u'), a: tContent('usage.scenarios.item6.a') },
        ],
      }"
      :do="{ title: tContent('usage.do.title'), items: [tContent('usage.do.item1'), tContent('usage.do.item2'), tContent('usage.do.item3'), tContent('usage.do.item4')] }"
      :dont="{ title: tContent('usage.dont.title'), items: [tContent('usage.dont.item1'), tContent('usage.dont.item2'), tContent('usage.dont.item3')] }"
    />

    <!-- ── Do & Don't ─────────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="[
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: tContent('doDont.pair1.do'), dontCaption: tContent('doDont.pair1.dont') },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: tContent('doDont.pair2.do'), dontCaption: tContent('doDont.pair2.dont') },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: tContent('doDont.pair3.do'), dontCaption: tContent('doDont.pair3.dont') },
      ]"
    >
      <!-- Par 1: placeholder como exemplo vs instrução -->
      <template #do-preview-0>
        <div class="space-y-1.5 w-full max-w-xs">
          <Label for="dodont-do-1">Email</Label>
          <Input id="dodont-do-1" type="email" placeholder="ex: joao@empresa.com" />
        </div>
      </template>
      <template #dont-preview-0>
        <div class="space-y-1.5 w-full max-w-xs">
          <Label for="dodont-dont-1">Email</Label>
          <Input id="dodont-dont-1" type="email" placeholder="Digite seu email" />
        </div>
      </template>

      <!-- Par 2: type=email vs type=text -->
      <template #do-preview-1>
        <div class="space-y-1.5 w-full max-w-xs">
          <Label for="dodont-do-2">Email</Label>
          <Input id="dodont-do-2" type="email" placeholder="ex: joao@empresa.com" />
        </div>
      </template>
      <template #dont-preview-1>
        <div class="space-y-1.5 w-full max-w-xs">
          <Label for="dodont-dont-2">Email</Label>
          <Input id="dodont-dont-2" type="text" placeholder="ex: joao@empresa.com" />
        </div>
      </template>

      <!-- Par 3: com label visível vs sem label -->
      <template #do-preview-2>
        <div class="space-y-1.5 w-full max-w-xs">
          <Label for="dodont-do-3">Nome completo</Label>
          <Input id="dodont-do-3" type="text" placeholder="ex: João da Silva" />
        </div>
      </template>
      <template #dont-preview-2>
        <div class="w-full max-w-xs">
          <Input type="text" placeholder="Nome completo" />
        </div>
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :description="tContent('import.basic')"
      :code="codeImportBasic"
      component-slug="input"
    />

    <!-- ── Variantes (Tipos) ──────────────────────────────────────── -->
    <DocsVariants :title="tContent('variants.title')" :items="variantItems" component-slug="input">
      <!-- text -->
      <template #variant-preview-0>
        <div class="w-full max-w-xs">
          <Input type="text" placeholder="ex: João da Silva" />
        </div>
      </template>
      <!-- email -->
      <template #variant-preview-1>
        <div class="w-full max-w-xs">
          <Input type="email" placeholder="ex: joao@empresa.com" />
        </div>
      </template>
      <!-- password -->
      <template #variant-preview-2>
        <div class="w-full max-w-xs">
          <Input type="password" placeholder="Mínimo 8 caracteres" />
        </div>
      </template>
      <!-- number -->
      <template #variant-preview-3>
        <div class="w-full max-w-xs">
          <Input type="number" placeholder="0" />
        </div>
      </template>
      <!-- file -->
      <template #variant-preview-4>
        <div class="w-full max-w-xs">
          <Input type="file" />
        </div>
      </template>
    </DocsVariants>

    <!-- ── Composições ─────────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="input"
      :items="compositionItems"
    >
      <template #variant-preview-0>
        <div class="flex flex-col gap-1.5 w-full max-w-sm">
          <Label for="input-nome">Nome completo</Label>
          <Input id="input-nome" type="text" placeholder="ex: João da Silva" />
        </div>
      </template>
      <template #variant-preview-1>
        <div class="flex flex-col gap-1.5 w-full max-w-sm">
          <Label for="input-email">Email</Label>
          <Input id="input-email" type="email" placeholder="ex: joao@empresa.com" />
          <p class="text-xs text-muted-foreground">Usaremos este email para envio de notificações.</p>
        </div>
      </template>
      <template #variant-preview-2>
        <div class="flex flex-col gap-1.5 w-full max-w-sm">
          <Label for="input-email-error">Email</Label>
          <Input id="input-email-error" type="email" placeholder="ex: joao@empresa.com" aria-invalid="true" aria-describedby="input-email-error-error" />
          <p class="text-xs text-destructive" id="input-email-error-error">Email inválido. Use o formato nome@dominio.com</p>
        </div>
      </template>
      <template #variant-preview-3>
        <div class="flex flex-col gap-1.5 w-full max-w-sm">
          <Label for="input-url">URL do site</Label>
          <div class="flex items-center rounded-md border border-input focus-within:ring-2 focus-within:ring-ring/50 overflow-hidden">
            <span class="flex items-center px-3 text-sm text-muted-foreground bg-muted border-r border-input shrink-0">https://</span>
            <Input class="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1" type="url" id="input-url" placeholder="meusite.com" />
          </div>
        </div>
      </template>
    </DocsCompositions>

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
        { title: tContent('props.inputTitle'), cols: propCols, items: inputPropItems },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="tContent('props.extensibility')"
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
      :customization-title="tContent('tokens.customizationTitle')"
      :customization-code="codeCustomizationTokens"
    />

    <!-- ── Acessibilidade ─────────────────────────────────────────── -->
    <DocsAccessibility
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-title="tNav('nav.accessibility')"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ───────────────────────────────────────────── -->
    <DocsRelated
      :title="tContent('related.title')"
      :items="relatedItems"
      component-slug="input"
    />

    <!-- ── Notas ──────────────────────────────────────────────────── -->
    <DocsNotes
      :title="tContent('notes.title')"
      :items="noteItems"
      component-slug="input"
    />

    <!-- ── Analytics ─────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :cols="{
        event: tContent('analytics.table.event'),
        trigger: tContent('analytics.table.trigger'),
        payload: tContent('analytics.table.payload'),
      }"
      :items="analyticsItems"
    />

    <!-- ── Testes ─────────────────────────────────────────────────── -->
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
