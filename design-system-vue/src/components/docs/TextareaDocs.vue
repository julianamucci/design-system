<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

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
import componentTranslations from '@shared/content/textarea/translations.json';

// ─── i18n ─────────────────────────────────────────────────────────────────────
// IMPORTANTE: locale vem de useTranslation — NUNCA de useLocaleStore/Pinia
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
  componentSlug: 'textarea',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
  aiIntent: tContent('seo.aiIntent') as 'informational' | 'navigational',
  breadcrumb: [
    { name: 'Components', item: '/components' },
    { name: tContent('category'), item: '/components/form' },
    { name: tContent('title') },
  ],
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'textarea',
    locale: newLocale as 'pt-BR' | 'en' | 'es',
    page_title: tContent('seo.title'),
  });
}, { immediate: true });

// ─── Analytics — section view ─────────────────────────────────────────────────

// ─── Demo state ────────────────────────────────────────────────────────────────

const demoDescription = ref('');
const demoBio = ref('');
const demoMax = 500;

// Compositions demo state
const compCounterValue = ref('');
const compFormValue = ref('');
const compFormResult = ref('');
function handleCompFormSubmit() {
  compFormResult.value = compFormValue.value
    ? `Feedback enviado (${compFormValue.value.length} caracteres).`
    : 'Digite um feedback antes de enviar.';
}

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
    component_name: 'textarea',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";`;

const codeDefault = `<div class="space-y-1.5">
  <Label :for="'description'">Descrição</Label>
  <Textarea
    id="description"
    placeholder="ex: Descreva o produto..."
    class="resize-y min-h-[120px]"
  />
</div>`;

const codeWithCounter = `<div class="space-y-1.5">
  <Label :for="'description'">Descrição</Label>
  <Textarea
    id="description"
    v-model="value"
    :maxlength="500"
    placeholder="ex: Descreva o produto..."
    class="resize-y min-h-[120px]"
  />
  <div class="flex justify-between text-xs text-muted-foreground">
    <span>Descreva com clareza.</span>
    <span
      aria-live="polite"
      :aria-label="\`\${value.length} de 500 caracteres usados\`"
    >
      {{ value.length }}/500
    </span>
  </div>
</div>`;

const codeNoResize = `<div class="space-y-1.5">
  <Label :for="'message'">Mensagem</Label>
  <Textarea
    id="message"
    placeholder="Digite sua mensagem..."
    class="resize-none min-h-[120px]"
  />
</div>`;

const codeCustomizationTokens = `/* Altura mínima customizada */
[data-slot="textarea"] {
  min-height: 180px;
}

/* Borda colorida quando inválido + foco */
[data-slot="textarea"][aria-invalid="true"]:focus-visible {
  --ring-color: hsl(var(--destructive));
}`;

const interfaceCode = `interface TextareaProps {
  modelValue?: string | number;   // controlado (v-model)
  defaultValue?: string | number; // não-controlado
  placeholder?: string;
  maxlength?: number;
  rows?: number;
  disabled?: boolean;
  readonly?: boolean;
  class?: string;
  // Emits
  'onUpdate:modelValue'?: (value: string | number) => void;
}`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
  tContent('anatomy.item4'),
]);

const variantItems = computed(() => [
  { name: stripHtml(tContent('variants.items.default')),     description: stripHtml(tContent('variants.styles.default')),     code: codeDefault     },
  { name: stripHtml(tContent('variants.items.withCounter')), description: stripHtml(tContent('variants.styles.withCounter')), code: codeWithCounter },
  { name: stripHtml(tContent('variants.items.noResize')),    description: stripHtml(tContent('variants.styles.noResize')),    code: codeNoResize    },
]);

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.withLabel.name'),
    description: tContent('variants.compositions.withLabel.description'),
    useWhen: tContent('variants.compositions.withLabel.use'),
    code: `<div class="flex flex-col gap-1.5 w-full max-w-md">\n  <Label for="ta-label">Descrição</Label>\n  <Textarea\n    id="ta-label"\n    class="resize-y min-h-[120px]"\n    placeholder="ex: Descreva o produto..."\n  />\n</div>`,
  },
  {
    name: tContent('variants.compositions.withHint.name'),
    description: tContent('variants.compositions.withHint.description'),
    useWhen: tContent('variants.compositions.withHint.use'),
    code: `<div class="flex flex-col gap-1.5 w-full max-w-md">\n  <Label for="ta-hint">Descrição</Label>\n  <Textarea\n    id="ta-hint"\n    class="resize-y min-h-[120px]"\n    placeholder="ex: Descreva o produto..."\n  />\n  <p class="text-xs text-muted-foreground">\n    Descreva o produto com clareza, destacando os principais atributos.\n  </p>\n</div>`,
  },
  {
    name: tContent('variants.compositions.withCounter.name'),
    description: tContent('variants.compositions.withCounter.description'),
    useWhen: tContent('variants.compositions.withCounter.use'),
    code: `<script setup>\nimport { ref } from 'vue';\nconst value = ref('');\n<\/script>\n\n<template>\n  <div class="flex flex-col gap-1.5 w-full max-w-md">\n    <Label for="ta-counter">Descrição</Label>\n    <Textarea\n      id="ta-counter"\n      v-model="value"\n      :maxlength="500"\n      class="resize-y min-h-[120px]"\n      placeholder="ex: Descreva o produto..."\n    />\n    <div class="flex justify-between items-start gap-3 text-xs text-muted-foreground">\n      <span>Descreva com clareza.</span>\n      <span\n        class="tabular-nums shrink-0"\n        aria-live="polite"\n        :aria-label="\`\${value.length} de 500 caracteres usados\`"\n      >\n        {{ value.length }}/500\n      </span>\n    </div>\n  </div>\n</template>`,
  },
  {
    name: tContent('variants.compositions.withError.name'),
    description: tContent('variants.compositions.withError.description'),
    useWhen: tContent('variants.compositions.withError.use'),
    code: `<div class="flex flex-col gap-1.5 w-full max-w-md">\n  <Label for="ta-error">Descrição</Label>\n  <Textarea\n    id="ta-error"\n    aria-invalid="true"\n    aria-describedby="ta-error-error"\n    class="resize-y min-h-[120px]"\n    placeholder="ex: Descreva o produto..."\n  />\n  <p class="text-xs text-destructive" id="ta-error-error">\n    A descrição é obrigatória e deve ter pelo menos 20 caracteres.\n  </p>\n</div>`,
  },
  {
    name: tContent('variants.compositions.inForm.name'),
    description: tContent('variants.compositions.inForm.description'),
    useWhen: tContent('variants.compositions.inForm.use'),
    code: `<script setup>\nimport { ref } from 'vue';\nconst value = ref('');\nconst result = ref('');\nfunction onSubmit() {\n  result.value = value.value\n    ? \`Feedback enviado (\${value.value.length} caracteres).\`\n    : 'Digite um feedback antes de enviar.';\n}\n<\/script>\n\n<template>\n  <form class="flex flex-col gap-4 w-full max-w-md" aria-label="Formulário de feedback" @submit.prevent="onSubmit">\n    <div class="flex flex-col gap-1.5">\n      <Label for="ta-form">Feedback</Label>\n      <Textarea\n        id="ta-form"\n        name="feedback"\n        v-model="value"\n        :maxlength="500"\n        class="resize-y min-h-[120px]"\n        placeholder="O que poderíamos melhorar?"\n      />\n      <div class="flex justify-end text-xs text-muted-foreground">\n        <span\n          class="tabular-nums"\n          aria-live="polite"\n          :aria-label="\`\${value.length} de 500 caracteres usados\`"\n        >\n          {{ value.length }}/500\n        </span>\n      </div>\n    </div>\n    <Button type="submit">Enviar</Button>\n    <p aria-live="polite" class="text-xs text-muted-foreground">{{ result }}</p>\n  </form>\n</template>`,
  },
]);

const stateCols = computed(() => ({
  state: locale.value === 'en' ? 'State' : 'Estado',
  trigger: locale.value === 'en' ? 'Trigger' : locale.value === 'es' ? 'Disparador' : 'Disparo',
  behavior:
    locale.value === 'en'
      ? 'Behavior'
      : locale.value === 'es'
      ? 'Comportamiento'
      : 'Comportamento',
}));

const stateItems = computed(() => [
  { label: tContent('states.items.default'),  trigger: '—', behavior: tContent('states.descriptions.default')  },
  { label: tContent('states.items.focus'),    trigger: '—', behavior: tContent('states.descriptions.focus')    },
  { label: tContent('states.items.filled'),   trigger: '—', behavior: tContent('states.descriptions.filled')   },
  { label: tContent('states.items.disabled'), trigger: '—', behavior: tContent('states.descriptions.disabled') },
  { label: tContent('states.items.invalid'),  trigger: '—', behavior: tContent('states.descriptions.invalid')  },
  { label: tContent('states.items.readonly'), trigger: '—', behavior: tContent('states.descriptions.readonly') },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const textareaPropItems = computed(() => [
  { name: 'modelValue',   type: tContent('props.table.value.type'),        defaultValue: tContent('props.table.value.default'),        required: tContent('props.table.value.required'),        description: stripHtml(tContent('props.table.value.description'))        },
  { name: 'defaultValue', type: tContent('props.table.defaultValue.type'), defaultValue: tContent('props.table.defaultValue.default'), required: tContent('props.table.defaultValue.required'), description: stripHtml(tContent('props.table.defaultValue.description')) },
  { name: 'placeholder',  type: tContent('props.table.placeholder.type'),  defaultValue: tContent('props.table.placeholder.default'),  required: tContent('props.table.placeholder.required'),  description: stripHtml(tContent('props.table.placeholder.description'))  },
  { name: 'maxlength',    type: tContent('props.table.maxLength.type'),    defaultValue: tContent('props.table.maxLength.default'),    required: tContent('props.table.maxLength.required'),    description: stripHtml(tContent('props.table.maxLength.description'))    },
  { name: 'rows',         type: tContent('props.table.rows.type'),         defaultValue: tContent('props.table.rows.default'),         required: tContent('props.table.rows.required'),         description: stripHtml(tContent('props.table.rows.description'))         },
  { name: 'disabled',     type: tContent('props.table.disabled.type'),     defaultValue: tContent('props.table.disabled.default'),     required: tContent('props.table.disabled.required'),     description: stripHtml(tContent('props.table.disabled.description'))     },
  { name: 'readonly',     type: tContent('props.table.readOnly.type'),     defaultValue: tContent('props.table.readOnly.default'),     required: tContent('props.table.readOnly.required'),     description: stripHtml(tContent('props.table.readOnly.description'))     },
  { name: 'class',        type: tContent('props.table.className.type'),    defaultValue: tContent('props.table.className.default'),    required: tContent('props.table.className.required'),    description: stripHtml(tContent('props.table.className.description'))    },
]);

const tokenRows = computed(() => [
  { token: '--input',            value: tContent('tokens.table.input.class'),           description: tContent('tokens.table.input.part')           },
  { token: '--background',       value: tContent('tokens.table.background.class'),      description: tContent('tokens.table.background.part')      },
  { token: '--foreground',       value: tContent('tokens.table.foreground.class'),      description: tContent('tokens.table.foreground.part')      },
  { token: '--muted-foreground', value: tContent('tokens.table.mutedForeground.class'), description: tContent('tokens.table.mutedForeground.part') },
  { token: '--ring',             value: tContent('tokens.table.ring.class'),            description: tContent('tokens.table.ring.part')            },
  { token: '--destructive',      value: tContent('tokens.table.destructive.class'),     description: tContent('tokens.table.destructive.part')     },
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
  { key: 'Tab',         description: tContent('accessibility.keyboard.tab')       },
  { key: 'Shift+Tab',   description: tContent('accessibility.keyboard.shiftTab')  },
  { key: 'Enter',       description: tContent('accessibility.keyboard.enter')     },
  { key: 'Shift+Enter', description: tContent('accessibility.keyboard.shiftEnter') },
  { key: 'Esc',         description: tContent('accessibility.keyboard.esc')       },
]);

const relatedItems = computed(() => [
  { name: 'Input',    description: tContent('related.items.input.description'),    path: '?path=/docs/ui-input--docs'    },
  { name: 'Label',    description: tContent('related.items.label.description'),    path: '?path=/docs/ui-label--docs'    },
  { name: 'Form',     description: tContent('related.items.form.description'),     path: '?path=/docs/ui-form--docs'     },
  { name: 'InputOTP', description: tContent('related.items.inputOTP.description'), path: '?path=/docs/ui-inputotp--docs' },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
]);

const analyticsItems = computed(() => [
  { event: 'field_blur', trigger: tContent('analytics.table.field_blur.trigger'), payload: tContent('analytics.table.field_blur.payload') },
  { event: 'docs_page_view', trigger: locale.value === 'en' ? 'Page mount per locale' : locale.value === 'es' ? 'Montaje de página por locale' : 'Mount da página por locale', payload: '{ component_name: "textarea", locale, page_title }' },
  { event: 'docs_section_viewed', trigger: locale.value === 'en' ? 'Section enters viewport' : locale.value === 'es' ? 'La sección entra al viewport' : 'Seção entra no viewport', payload: '{ component_name: "textarea", section_id, locale }' },
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
  { criterion: tContent('testes.accessibility.item1'), level: 'WCAG 2.1 AA', how: 'axe-core' },
  { criterion: tContent('testes.accessibility.item2'), level: 'WCAG 1.4.3',  how: 'Contrast Analyzer' },
  { criterion: tContent('testes.accessibility.item3'), level: 'WCAG 2.4.7',  how: 'focus-ring' },
  { criterion: tContent('testes.accessibility.item4'), level: 'WCAG 1.3.1',  how: 'getByLabelText' },
  { criterion: tContent('testes.accessibility.item5'), level: 'WCAG 3.3.1',  how: 'aria-invalid' },
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
  <DocsPageLayout :nav-groups="navGroups" :active-section="activeSection" component-slug="textarea">
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
        install-note="npx shadcn-vue@latest add textarea"
      />
    </template>

    <!-- ── Demonstração ─────────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div class="flex flex-col gap-6 w-full max-w-md">
        <div class="space-y-1.5">
          <Label :for="'demo-description'">{{ tContent('demonstration.labels.descriptionLabel') }}</Label>
          <Textarea
            id="demo-description"
            :model-value="demoDescription"
            @update:model-value="(v) => demoDescription = String(v)"
            :maxlength="demoMax"
            :placeholder="tContent('demonstration.labels.descriptionPlaceholder')"
            class="resize-y min-h-[120px]"
          />
          <div class="flex justify-between text-xs text-muted-foreground">
            <span>{{ tContent('demonstration.labels.descriptionHelp') }}</span>
            <span
              aria-live="polite"
              :aria-label="`${demoDescription.length} de ${demoMax} caracteres usados`"
            >
              {{ demoDescription.length }}/{{ demoMax }}
            </span>
          </div>
        </div>

        <div class="space-y-1.5">
          <Label :for="'demo-bio'">{{ tContent('demonstration.labels.bioLabel') }}</Label>
          <Textarea
            id="demo-bio"
            :model-value="demoBio"
            @update:model-value="(v) => demoBio = String(v)"
            :placeholder="tContent('demonstration.labels.bioPlaceholder')"
            class="resize-y min-h-[120px]"
          />
        </div>

        <div class="space-y-1.5">
          <Label :for="'demo-feedback'">{{ tContent('demonstration.labels.feedbackLabel') }}</Label>
          <Textarea
            id="demo-feedback"
            :placeholder="tContent('demonstration.labels.feedbackPlaceholder')"
            class="resize-none min-h-[120px]"
          />
        </div>
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
            element: tContent('usage.uxWriting.table.label.name'),
            rules: tContent('usage.uxWriting.table.label.format'),
            do: tContent('usage.uxWriting.table.label.good'),
            dont: tContent('usage.uxWriting.table.label.bad'),
          },
          {
            element: tContent('usage.uxWriting.table.placeholder.name'),
            rules: tContent('usage.uxWriting.table.placeholder.format'),
            do: tContent('usage.uxWriting.table.placeholder.good'),
            dont: tContent('usage.uxWriting.table.placeholder.bad'),
          },
          {
            element: tContent('usage.uxWriting.table.counter.name'),
            rules: tContent('usage.uxWriting.table.counter.format'),
            do: tContent('usage.uxWriting.table.counter.good'),
            dont: tContent('usage.uxWriting.table.counter.bad'),
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
      <!-- Pair 1: maxlength com contador vs sem contador -->
      <template #do-preview-0>
        <div class="space-y-1.5 w-full max-w-xs">
          <Label :for="'dodont-do-1'">Descrição</Label>
          <Textarea id="dodont-do-1" :maxlength="500" placeholder="ex: Descreva o produto..." class="resize-y min-h-[100px]" />
          <div class="flex justify-end text-xs text-muted-foreground">
            <span aria-live="polite" aria-label="0 de 500 caracteres usados">0/500</span>
          </div>
        </div>
      </template>
      <template #dont-preview-0>
        <div class="space-y-1.5 w-full max-w-xs">
          <Label :for="'dodont-dont-1'">Descrição</Label>
          <Textarea id="dodont-dont-1" :maxlength="500" placeholder="ex: Descreva o produto..." class="resize-y min-h-[100px]" />
        </div>
      </template>

      <!-- Pair 2: resize-y vs resize livre -->
      <template #do-preview-1>
        <div class="space-y-1.5 w-full max-w-xs">
          <Label :for="'dodont-do-2'">Biografia</Label>
          <Textarea id="dodont-do-2" placeholder="Conte um pouco sobre você..." class="resize-y min-h-[100px]" />
        </div>
      </template>
      <template #dont-preview-1>
        <div class="space-y-1.5 w-full max-w-xs">
          <Label :for="'dodont-dont-2'">Biografia</Label>
          <Textarea id="dodont-dont-2" placeholder="Conte um pouco sobre você..." class="resize min-h-[100px]" />
        </div>
      </template>
    </DocsDoDont>

    <!-- ── Importação ───────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :code="codeImportBasic"
      component-slug="textarea"
    />

    <!-- ── Variantes ────────────────────────────────────────────────── -->
    <DocsVariants :title="tContent('variants.title')" :items="variantItems" component-slug="textarea">
      <!-- default -->
      <template #variant-preview-0>
        <div class="space-y-1.5 w-full max-w-xs">
          <Label :for="'variant-default'">Descrição</Label>
          <Textarea id="variant-default" placeholder="ex: Descreva o produto..." class="resize-y min-h-[100px]" />
        </div>
      </template>

      <!-- withCounter -->
      <template #variant-preview-1>
        <div class="space-y-1.5 w-full max-w-xs">
          <Label :for="'variant-counter'">Descrição</Label>
          <Textarea id="variant-counter" :maxlength="500" placeholder="ex: Descreva o produto..." class="resize-y min-h-[100px]" />
          <div class="flex justify-end text-xs text-muted-foreground">
            <span aria-live="polite" aria-label="0 de 500 caracteres usados">0/500</span>
          </div>
        </div>
      </template>

      <!-- noResize -->
      <template #variant-preview-2>
        <div class="space-y-1.5 w-full max-w-xs">
          <Label :for="'variant-noresize'">Mensagem</Label>
          <Textarea id="variant-noresize" placeholder="Digite sua mensagem..." class="resize-none min-h-[100px]" />
        </div>
      </template>
    </DocsVariants>

    <!-- ── Composições ─────────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="textarea"
      :items="compositionItems"
    >
      <!-- 0: withLabel -->
      <template #variant-preview-0>
        <div class="flex flex-col gap-1.5 w-full max-w-md">
          <Label :for="'ta-label'">Descrição</Label>
          <Textarea id="ta-label" class="resize-y min-h-[120px]" placeholder="ex: Descreva o produto..." />
        </div>
      </template>

      <!-- 1: withHint -->
      <template #variant-preview-1>
        <div class="flex flex-col gap-1.5 w-full max-w-md">
          <Label :for="'ta-hint'">Descrição</Label>
          <Textarea id="ta-hint" class="resize-y min-h-[120px]" placeholder="ex: Descreva o produto..." />
          <p class="text-xs text-muted-foreground">
            Descreva o produto com clareza, destacando os principais atributos.
          </p>
        </div>
      </template>

      <!-- 2: withCounter -->
      <template #variant-preview-2>
        <div class="flex flex-col gap-1.5 w-full max-w-md">
          <Label :for="'ta-counter'">Descrição</Label>
          <Textarea
            id="ta-counter"
            :model-value="compCounterValue"
            @update:model-value="(v) => compCounterValue = String(v)"
            :maxlength="500"
            class="resize-y min-h-[120px]"
            placeholder="ex: Descreva o produto..."
          />
          <div class="flex justify-between items-start gap-3 text-xs text-muted-foreground">
            <span>Descreva com clareza.</span>
            <span
              class="tabular-nums shrink-0"
              aria-live="polite"
              :aria-label="`${compCounterValue.length} de 500 caracteres usados`"
            >
              {{ compCounterValue.length }}/500
            </span>
          </div>
        </div>
      </template>

      <!-- 3: withError -->
      <template #variant-preview-3>
        <div class="flex flex-col gap-1.5 w-full max-w-md">
          <Label :for="'ta-error'">Descrição</Label>
          <Textarea
            id="ta-error"
            aria-invalid="true"
            aria-describedby="ta-error-error"
            class="resize-y min-h-[120px]"
            placeholder="ex: Descreva o produto..."
          />
          <p class="text-xs text-destructive" id="ta-error-error">
            A descrição é obrigatória e deve ter pelo menos 20 caracteres.
          </p>
        </div>
      </template>

      <!-- 4: inForm -->
      <template #variant-preview-4>
        <form
          class="flex flex-col gap-4 w-full max-w-md"
          aria-label="Formulário de feedback"
          @submit.prevent="handleCompFormSubmit"
        >
          <div class="flex flex-col gap-1.5">
            <Label :for="'ta-form'">Feedback</Label>
            <Textarea
              id="ta-form"
              name="feedback"
              :model-value="compFormValue"
              @update:model-value="(v) => compFormValue = String(v)"
              :maxlength="500"
              class="resize-y min-h-[120px]"
              placeholder="O que poderíamos melhorar?"
            />
            <div class="flex justify-end text-xs text-muted-foreground">
              <span
                class="tabular-nums"
                aria-live="polite"
                :aria-label="`${compFormValue.length} de 500 caracteres usados`"
              >
                {{ compFormValue.length }}/500
              </span>
            </div>
          </div>
          <Button type="submit">Enviar</Button>
          <p aria-live="polite" class="text-xs text-muted-foreground">{{ compFormResult }}</p>
        </form>
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
        {
          title: 'Textarea',
          cols: propCols,
          items: textareaPropItems,
        },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-code="tContent('props.extensibilityCode')"
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
    <DocsRelated
      :title="tContent('related.title')"
      :items="relatedItems"
      component-slug="textarea"
    />

    <!-- ── Notas ────────────────────────────────────────────────────── -->
    <DocsNotes
      :title="tContent('notes.title')"
      :items="noteItems"
      component-slug="textarea"
    />

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
