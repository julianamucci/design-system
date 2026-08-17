<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

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

import uiTranslations       from '@/i18n/ui.json';
import checkboxTranslations from '@shared/content/checkbox/translations.json';
import { stripHtml, toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────
// IMPORTANT: locale comes from useTranslation — NEVER from useLocaleStore/Pinia
const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(checkboxTranslations);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
const screenReaderItems = computed(() =>
  Object.values(
    (checkboxTranslations as unknown as Record<
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

// ─── SEO & GEO ────────────────────────────────────────────────────────────────

useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: 'checkbox',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'checkbox',
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
    component_name: 'checkbox',
    locale: locale.value,
  });
});

// ─── Analytics — demo events ──────────────────────────────────────────────────

function handleDemoCheckboxChange(fieldName: string, value: boolean | 'indeterminate') {
  track('field_change', {
    component: 'checkbox',
    field_name: fieldName,
    value: String(value),
    location: 'docs_demo',
  });
}
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import { Checkbox } from "@/components/ui/checkbox";`;

const codeDefault = `<div class="nds-cluster" data-spacing="xs">
  <Checkbox id="terms" />
  <label for="terms" class="nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer">
    Aceito os termos e condições
  </label>
</div>`;

const codeWithLabel = `<div class="nds-cluster" data-spacing="xs">
  <Checkbox id="newsletter" />
  <label
    for="newsletter"
    class="nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer"
  >
    Receber novidades por email
  </label>
</div>`;

const codeWithDescription = `<div class="nds-cluster" data-spacing="xs" data-align="start">
  <Checkbox id="newsletter" style="margin-top: 0.125rem" aria-describedby="newsletter-desc" />
  <div class="nds-stack" data-spacing="xs">
    <label for="newsletter" class="nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer">
      Receber novidades por email
    </label>
    <p id="newsletter-desc" class="nds-text-body">
      Enviaremos atualizações mensais sobre o produto.
    </p>
  </div>
</div>`;

const codeCustomizationTokens = `/* Em globals.css — sobrescrever tokens de cor */
:root {
  --primary: 221 83% 53%;
  --primary-foreground: 0 0% 100%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221 83% 53%;
}

.dark {
  --primary: 217 91% 60%;
  --input: 217.2 32.6% 17.5%;
}`;

const interfaceCode = `interface CheckboxProps {
  checked?: boolean | 'indeterminate'; // alias do wrapper para defaultValue — estado inicial, não controlado
  defaultValue?: boolean | 'indeterminate';
  disabled?: boolean;
  required?: boolean;
  name?: string;
  value?: string | number;
  trueValue?: unknown;
  falseValue?: unknown;
  class?: string;
  // Emits
  'onUpdate:modelValue'?: (value: boolean | 'indeterminate') => void;
}`;

// ─── Reactive state — Select All preview ──────────────────────────────────────

const selectAllChild1 = ref(true);
const selectAllChild2 = ref(false);
const selectAllChild3 = ref(true);

const selectAllValue = computed<boolean | 'indeterminate'>({
  get() {
    const all = selectAllChild1.value && selectAllChild2.value && selectAllChild3.value;
    const none = !selectAllChild1.value && !selectAllChild2.value && !selectAllChild3.value;
    if (all) return true;
    if (none) return false;
    return 'indeterminate';
  },
  set(v) {
    const next = v === true;
    selectAllChild1.value = next;
    selectAllChild2.value = next;
    selectAllChild3.value = next;
  },
});

const inListEmail = ref(true);
const inListPush = ref(false);
const inListSms = ref(false);
const inListNewsletter = ref(true);

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
  tContent('anatomy.item4'),
]);

const variantItems = computed(() => [
  { name: 'default',         description: stripHtml(tContent('variants.items.default')),         code: codeDefault         },
  { name: 'withLabel',       description: stripHtml(tContent('variants.items.withLabel')),       code: codeWithLabel       },
  { name: 'withDescription', description: stripHtml(tContent('variants.items.withDescription')), code: codeWithDescription },
]);

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.fieldset.name'),
    description: stripHtml(tContent('variants.compositions.fieldset.description')),
    useWhen: stripHtml(tContent('variants.compositions.fieldset.use')),
    code: `<fieldset class="nds-border-default nds-rounded-lg nds-p-4 nds-stack" data-spacing="sm" style="width: 18rem">\n  <legend class="nds-text-body nds-font-semibold nds-px-1">Notificações</legend>\n  <div class="nds-cluster" data-spacing="xs">\n    <Checkbox id="notif-email" />\n    <Label for="notif-email">Receber novidades por email</Label>\n  </div>\n  <div class="nds-cluster" data-spacing="xs">\n    <Checkbox id="notif-push" />\n    <Label for="notif-push">Receber notificações push</Label>\n  </div>\n  <div class="nds-cluster" data-spacing="xs">\n    <Checkbox id="notif-sms" />\n    <Label for="notif-sms">Alertas por SMS</Label>\n  </div>\n</fieldset>`,
  },
  {
    name: tContent('variants.compositions.selectAll.name'),
    description: stripHtml(tContent('variants.compositions.selectAll.description')),
    useWhen: stripHtml(tContent('variants.compositions.selectAll.use')),
    code: `<script setup lang="ts">\nimport { ref, computed } from 'vue';\nconst c1 = ref(true); const c2 = ref(false); const c3 = ref(true);\nconst all = computed<boolean | 'indeterminate'>({\n  get() {\n    const allChecked = c1.value && c2.value && c3.value;\n    const noneChecked = !c1.value && !c2.value && !c3.value;\n    if (allChecked) return true;\n    if (noneChecked) return false;\n    return 'indeterminate';\n  },\n  set(v) { const n = v === true; c1.value = n; c2.value = n; c3.value = n; },\n});\n<\/script>\n\n<template>\n  <div class="nds-stack" data-spacing="sm" style="width: 18rem">\n    <div class="nds-cluster nds-border-b" data-spacing="xs" style="padding-bottom: 0.5rem">\n      <Checkbox id="cb-select-all" v-model:checked="all" />\n      <Label for="cb-select-all" class="nds-text-body nds-font-semibold nds-leading-none nds-cursor-pointer">\n        Selecionar todos os itens\n      </Label>\n    </div>\n    <div class="nds-cluster" data-spacing="xs" style="padding-left: 0.5rem">\n      <Checkbox id="cb-item-1" v-model:checked="c1" />\n      <Label for="cb-item-1">Item 1</Label>\n    </div>\n    <!-- demais filhos -->\n  </div>\n<\/template>`,
  },
  {
    name: tContent('variants.compositions.inList.name'),
    description: stripHtml(tContent('variants.compositions.inList.description')),
    useWhen: stripHtml(tContent('variants.compositions.inList.use')),
    code: `<div class="nds-stack" data-spacing="xs" style="width: 20rem">\n  <p class="nds-text-body nds-font-semibold nds-mb-2">Preferências de contato</p>\n  <div class="nds-cluster nds-rounded-md nds-border-default" data-justify="between" style="padding-inline: 0.75rem; padding-block: 0.5rem">\n    <div class="nds-cluster" data-spacing="xs">\n      <Checkbox id="list-email" :checked="true" />\n      <Label for="list-email">Receber novidades por email</Label>\n    </div>\n  </div>\n  <!-- demais linhas -->\n</div>`,
  },
]);

const stateItems = computed(() => [
  { label: tContent('states.unchecked.label'),     trigger: toPlainText(tContent('states.unchecked.trigger')),     behavior: toPlainText(tContent('states.unchecked.behavior'))},
  { label: tContent('states.checked.label'),       trigger: toPlainText(tContent('states.checked.trigger')),       behavior: toPlainText(tContent('states.checked.behavior'))},
  { label: tContent('states.disabled.label'),      trigger: toPlainText(tContent('states.disabled.trigger')),      behavior: toPlainText(tContent('states.disabled.behavior'))},
  { label: tContent('states.error.label'),         trigger: toPlainText(tContent('states.error.trigger')),         behavior: toPlainText(tContent('states.error.behavior'))},
  { label: tContent('states.indeterminate.label'), trigger: toPlainText(tContent('states.indeterminate.trigger')), behavior: toPlainText(tContent('states.indeterminate.behavior'))},
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const checkboxPropItems = computed(() => [
  { name: 'checked',             type: 'boolean | "indeterminate"',    defaultValue: '—',         required: 'Não', description: stripHtml(tContent('props.items.checked'))            },
  { name: 'defaultValue',        type: 'boolean | "indeterminate"',    defaultValue: 'false',     required: 'Não', description: stripHtml(tContent('props.items.defaultChecked'))     },
  { name: '@update:modelValue',  type: '(value: boolean | "indeterminate") => void', defaultValue: '—', required: 'Não', description: stripHtml(tContent('props.items.onCheckedChange')) },
  { name: 'disabled',            type: 'boolean',                      defaultValue: 'false',     required: 'Não', description: stripHtml(tContent('props.items.disabled'))           },
  { name: 'required',            type: 'boolean',                      defaultValue: 'false',     required: 'Não', description: stripHtml(tContent('props.items.required'))           },
  { name: 'name',                type: 'string',                       defaultValue: '—',         required: 'Não', description: stripHtml(tContent('props.items.name'))               },
  { name: 'value',               type: 'string',                       defaultValue: '"on"',      required: 'Não', description: stripHtml(tContent('props.items.value'))              },
  { name: 'class',               type: 'string',                       defaultValue: '—',         required: 'Não', description: stripHtml(tContent('props.items.className'))          },
]);

const tokenRows = computed(() => [
  { token: '--primary',            value: '.nds-checkbox[data-state="checked"]', description: tContent('tokens.table.primary')            },
  { token: '--primary-foreground', value: '.nds-checkbox-indicator',             description: tContent('tokens.table.primaryForeground')  },
  { token: '--input',              value: '.nds-checkbox',                       description: tContent('tokens.table.input')              },
  { token: '--ring',               value: '.nds-checkbox:focus-visible',         description: toPlainText(tContent('tokens.table.ring'))  },
  { token: '--destructive',        value: '.nds-checkbox[aria-invalid="true"]',  description: tContent('tokens.table.destructive')        },
  { token: '--border',             value: '.nds-checkbox',                       description: tContent('tokens.table.border')             },
]);

const accessibilityItems = computed(() => [
  tContent('accessibility.item1'),
  tContent('accessibility.item2'),
  tContent('accessibility.item3'),
  tContent('accessibility.item4'),
  tContent('accessibility.item5'),
]);

const keyboardItems = computed(() => [
  { key: 'Tab',       description: tContent('accessibility.keyboard.tab')      },
  { key: 'Space',     description: tContent('accessibility.keyboard.space')    },
  { key: 'Shift+Tab', description: tContent('accessibility.keyboard.shiftTab') },
]);

const relatedItems = computed(() => [
  { name: 'Switch',     description: toPlainText(tContent('related.switch')),     path: '?path=/docs/ui-switch--docs'      },
  { name: 'RadioGroup', description: toPlainText(tContent('related.radioGroup')), path: '?path=/docs/ui-radiogroup--docs'  },
  { name: 'Form',       description: toPlainText(tContent('related.form')),       path: '?path=/docs/ui-form--docs'        },
  { name: 'Select',     description: toPlainText(tContent('related.select')),     path: '?path=/docs/ui-select--docs'      },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.tip1') },
  { title: '', content: tContent('notes.tip2') },
  { title: '', content: tContent('notes.tip3') },
  { title: '', content: tContent('notes.tip4') },
]);

const analyticsItems = computed(() => [
  { event: tContent('analytics.table.fieldChange'),    trigger: toPlainText(tContent('analytics.table.fieldChangeTrigger')),    payload: tContent('analytics.table.fieldChangePayload')    },
  { event: tContent('analytics.table.pageView'),       trigger: toPlainText(tContent('analytics.table.pageViewTrigger')),       payload: tContent('analytics.table.pageViewPayload')       },
  { event: tContent('analytics.table.sectionViewed'),  trigger: toPlainText(tContent('analytics.table.sectionViewedTrigger')),  payload: tContent('analytics.table.sectionViewedPayload')  },
  { event: tContent('analytics.table.langSwitch'),     trigger: toPlainText(tContent('analytics.table.langSwitchTrigger')),     payload: tContent('analytics.table.langSwitchPayload')     },
]);

const a11yCritCols = computed(() => ({
  criterion: tNav('common.criterion'),
  level: 'WCAG',
  how: tNav('common.howToVerify'),
}));

const functionalTestItems = computed(() => [
  { action: toPlainText(tContent('testes.functional.item1.action')), result: toPlainText(tContent('testes.functional.item1.result')), priority: localPriority(tContent('testes.functional.item1.priority')) },
  { action: toPlainText(tContent('testes.functional.item2.action')), result: toPlainText(tContent('testes.functional.item2.result')), priority: localPriority(tContent('testes.functional.item2.priority')) },
  { action: toPlainText(tContent('testes.functional.item3.action')), result: toPlainText(tContent('testes.functional.item3.result')), priority: localPriority(tContent('testes.functional.item3.priority')) },
  { action: toPlainText(tContent('testes.functional.item4.action')), result: toPlainText(tContent('testes.functional.item4.result')), priority: localPriority(tContent('testes.functional.item4.priority')) },
  { action: toPlainText(tContent('testes.functional.item5.action')), result: toPlainText(tContent('testes.functional.item5.result')), priority: localPriority(tContent('testes.functional.item5.priority')) },
  { action: toPlainText(tContent('testes.functional.item6.action')), result: toPlainText(tContent('testes.functional.item6.result')), priority: localPriority(tContent('testes.functional.item6.priority')) },
  { action: toPlainText(tContent('testes.functional.item7.action')), result: toPlainText(tContent('testes.functional.item7.result')), priority: localPriority(tContent('testes.functional.item7.priority')) },
]);

const a11yTestItems = computed(() => [
  { criterion: tContent('testes.accessibility.item1.criterion'), level: tContent('testes.accessibility.item1.level'), how: tContent('testes.accessibility.item1.how') },
  { criterion: tContent('testes.accessibility.item2.criterion'), level: tContent('testes.accessibility.item2.level'), how: tContent('testes.accessibility.item2.how') },
  { criterion: tContent('testes.accessibility.item3.criterion'), level: tContent('testes.accessibility.item3.level'), how: tContent('testes.accessibility.item3.how') },
  { criterion: tContent('testes.accessibility.item4.criterion'), level: tContent('testes.accessibility.item4.level'), how: tContent('testes.accessibility.item4.how') },
  { criterion: tContent('testes.accessibility.item5.criterion'), level: tContent('testes.accessibility.item5.level'), how: tContent('testes.accessibility.item5.how') },
  { criterion: tContent('testes.accessibility.item6.criterion'), level: tContent('testes.accessibility.item6.level'), how: tContent('testes.accessibility.item6.how') },
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
  <DocsPageLayout
    :nav-groups="navGroups"
    :active-section="activeSection"
    component-slug="checkbox"
  >
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
      />
    </template>

    <!-- ── Demonstração ─────────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div
        class="nds-stack"
        data-spacing="sm"
      >
        <div
          class="nds-cluster"
          data-spacing="xs"
        >
          <Checkbox
            id="demo-terms"
            @update:model-value="(v) => handleDemoCheckboxChange('demo-terms', v)"
          />
          <label
            for="demo-terms"
            class="nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer"
          >
            {{ tContent('demonstration.labels.acceptTerms') }}
          </label>
        </div>
        <div
          class="nds-cluster"
          data-spacing="xs"
        >
          <Checkbox
            id="demo-newsletter"
            :checked="true"
            @update:model-value="(v) => handleDemoCheckboxChange('demo-newsletter', v)"
          />
          <label
            for="demo-newsletter"
            class="nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer"
          >
            {{ tContent('demonstration.labels.newsletter') }}
          </label>
        </div>
        <div
          class="nds-cluster"
          data-spacing="xs"
        >
          <Checkbox
            id="demo-session"
            :disabled="true"
          />
          <label
            for="demo-session"
            class="nds-text-body nds-font-medium nds-leading-none nds-cursor-default"
            style="opacity: 0.7"
          >
            {{ tContent('demonstration.labels.rememberMe') }}
          </label>
        </div>
        <div
          class="nds-cluster"
          data-spacing="xs"
          data-align="start"
        >
          <Checkbox
            id="demo-notif"
            style="margin-top: 0.125rem"
            @update:model-value="(v) => handleDemoCheckboxChange('demo-notif', v)"
          />
          <div
            class="nds-stack"
            data-spacing="xs"
          >
            <label
              for="demo-notif"
              class="nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer"
            >
              {{ tContent('demonstration.labels.notifications') }}
            </label>
            <p class="nds-text-body">
              Enviaremos atualizações mensais.
            </p>
          </div>
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
    />

    <!-- ── Do & Don't ───────────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="[
        {
          doLabel: tNav('common.do'),
          dontLabel: tNav('common.dont'),
          doCaption: toPlainText(tContent('doDont.pair1.do')),
          dontCaption: toPlainText(tContent('doDont.pair1.dont')),
        },
        {
          doLabel: tNav('common.do'),
          dontLabel: tNav('common.dont'),
          doCaption: toPlainText(tContent('doDont.pair2.do')),
          dontCaption: toPlainText(tContent('doDont.pair2.dont')),
        },
      ]"
    >
      <!-- Pair 1: label semântica vs label genérica -->
      <template #do-preview-0>
        <div
          class="nds-cluster"
          data-spacing="xs"
        >
          <Checkbox id="dodont-do-1" />
          <label
            for="dodont-do-1"
            class="nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer"
          >
            Receber notificações por email
          </label>
        </div>
      </template>
      <template #dont-preview-0>
        <div
          class="nds-cluster"
          data-spacing="xs"
        >
          <Checkbox id="dodont-dont-1" />
          <label
            for="dodont-dont-1"
            class="nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer"
          >
            Email
          </label>
        </div>
      </template>

      <!-- Pair 2: fieldset vs checkboxes soltos -->
      <template #do-preview-1>
        <fieldset
          class="nds-border-default nds-rounded-lg nds-stack nds-w-full"
          data-spacing="xs"
          style="padding: 0.75rem"
        >
          <legend class="nds-text-caption nds-font-semibold nds-px-1">
            Notificações
          </legend>
          <div
            class="nds-cluster"
            data-spacing="xs"
          >
            <Checkbox id="dodont-do-2a" />
            <label
              for="dodont-do-2a"
              class="nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer"
            >Email</label>
          </div>
          <div
            class="nds-cluster"
            data-spacing="xs"
          >
            <Checkbox id="dodont-do-2b" />
            <label
              for="dodont-do-2b"
              class="nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer"
            >Push</label>
          </div>
        </fieldset>
      </template>
      <template #dont-preview-1>
        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <div
            class="nds-cluster"
            data-spacing="xs"
          >
            <Checkbox id="dodont-dont-2a" />
            <label
              for="dodont-dont-2a"
              class="nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer"
            >Email</label>
          </div>
          <div
            class="nds-cluster"
            data-spacing="xs"
          >
            <Checkbox id="dodont-dont-2b" />
            <label
              for="dodont-dont-2b"
              class="nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer"
            >Push</label>
          </div>
        </div>
      </template>
    </DocsDoDont>

    <!-- ── Importação ───────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :description="tContent('import.vue')"
      :code="codeImportBasic"
    />

    <!-- ── Variantes ────────────────────────────────────────────────── -->
    <DocsVariants
      :title="tContent('variants.title')"
      :items="variantItems"
      component-slug="checkbox"
    >
      <!-- default: unchecked -->
      <template #variant-preview-0>
        <div
          class="nds-cluster"
          data-spacing="xs"
        >
          <Checkbox id="variant-default" />
          <label
            for="variant-default"
            class="nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer"
          >
            Aceito os termos e condições
          </label>
        </div>
      </template>

      <!-- withLabel -->
      <template #variant-preview-1>
        <div
          class="nds-cluster"
          data-spacing="xs"
        >
          <Checkbox id="variant-with-label" />
          <label
            for="variant-with-label"
            class="nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer"
          >
            Receber novidades por email
          </label>
        </div>
      </template>

      <!-- withDescription -->
      <template #variant-preview-2>
        <div
          class="nds-cluster"
          data-spacing="xs"
          data-align="start"
        >
          <Checkbox
            id="variant-with-desc"
            style="margin-top: 0.125rem"
          />
          <div
            class="nds-stack"
            data-spacing="xs"
          >
            <label
              for="variant-with-desc"
              class="nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer"
            >
              Receber novidades por email
            </label>
            <p class="nds-text-body">
              Enviaremos atualizações mensais sobre o produto.
            </p>
          </div>
        </div>
      </template>
    </DocsVariants>

    <!-- ── Composições ──────────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="checkbox"
      :items="compositionItems"
    >
      <!-- 0: fieldset -->
      <template #variant-preview-0>
        <fieldset
          class="nds-border-default nds-rounded-lg nds-p-4 nds-stack"
          data-spacing="sm"
          style="width: 18rem"
        >
          <legend class="nds-text-body nds-font-semibold nds-px-1">
            Notificações
          </legend>
          <div
            class="nds-cluster"
            data-spacing="xs"
          >
            <Checkbox id="notif-email" />
            <Label for="notif-email">Receber novidades por email</Label>
          </div>
          <div
            class="nds-cluster"
            data-spacing="xs"
          >
            <Checkbox id="notif-push" />
            <Label for="notif-push">Receber notificações push</Label>
          </div>
          <div
            class="nds-cluster"
            data-spacing="xs"
          >
            <Checkbox id="notif-sms" />
            <Label for="notif-sms">Alertas por SMS</Label>
          </div>
        </fieldset>
      </template>

      <!-- 1: selectAll -->
      <template #variant-preview-1>
        <div
          class="nds-stack"
          data-spacing="sm"
          style="width: 18rem"
        >
          <div
            class="nds-cluster nds-border-b"
            data-spacing="xs"
            style="padding-bottom: 0.5rem"
          >
            <Checkbox
              id="cb-select-all"
              v-model:checked="selectAllValue"
            />
            <Label
              for="cb-select-all"
              class="nds-text-body nds-font-semibold nds-leading-none nds-cursor-pointer"
            >
              Selecionar todos os itens
            </Label>
          </div>
          <div
            class="nds-cluster"
            data-spacing="xs"
            style="padding-left: 0.5rem"
          >
            <Checkbox
              id="cb-select-child-1"
              v-model:checked="selectAllChild1"
            />
            <Label for="cb-select-child-1">Receber novidades por email</Label>
          </div>
          <div
            class="nds-cluster"
            data-spacing="xs"
            style="padding-left: 0.5rem"
          >
            <Checkbox
              id="cb-select-child-2"
              v-model:checked="selectAllChild2"
            />
            <Label for="cb-select-child-2">Receber notificações push</Label>
          </div>
          <div
            class="nds-cluster"
            data-spacing="xs"
            style="padding-left: 0.5rem"
          >
            <Checkbox
              id="cb-select-child-3"
              v-model:checked="selectAllChild3"
            />
            <Label for="cb-select-child-3">Alertas por SMS</Label>
          </div>
        </div>
      </template>

      <!-- 2: inList -->
      <template #variant-preview-2>
        <div
          class="nds-stack"
          data-spacing="xs"
          style="width: 20rem"
        >
          <p class="nds-text-body nds-font-semibold nds-mb-2">
            Preferências de contato
          </p>
          <div
            class="nds-cluster nds-rounded-md nds-border-default"
            data-justify="between"
            style="padding-inline: 0.75rem; padding-block: 0.5rem"
          >
            <div
              class="nds-cluster"
              data-spacing="xs"
            >
              <Checkbox
                id="list-email"
                v-model:checked="inListEmail"
              />
              <Label for="list-email">Receber novidades por email</Label>
            </div>
          </div>
          <div
            class="nds-cluster nds-rounded-md nds-border-default"
            data-justify="between"
            style="padding-inline: 0.75rem; padding-block: 0.5rem"
          >
            <div
              class="nds-cluster"
              data-spacing="xs"
            >
              <Checkbox
                id="list-push"
                v-model:checked="inListPush"
              />
              <Label for="list-push">Receber notificações push</Label>
            </div>
          </div>
          <div
            class="nds-cluster nds-rounded-md nds-border-default"
            data-justify="between"
            style="padding-inline: 0.75rem; padding-block: 0.5rem"
          >
            <div
              class="nds-cluster"
              data-spacing="xs"
            >
              <Checkbox
                id="list-sms"
                v-model:checked="inListSms"
              />
              <Label for="list-sms">Alertas por SMS</Label>
            </div>
          </div>
          <div
            class="nds-cluster nds-rounded-md nds-border-default"
            data-justify="between"
            style="padding-inline: 0.75rem; padding-block: 0.5rem"
          >
            <div
              class="nds-cluster"
              data-spacing="xs"
            >
              <Checkbox
                id="list-newsletter"
                v-model:checked="inListNewsletter"
              />
              <Label for="list-newsletter">Newsletter semanal</Label>
            </div>
          </div>
        </div>
      </template>
    </DocsCompositions>

    <!-- ── Estados ──────────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{
        state: tContent('states.cols.state'),
        trigger: toPlainText(tContent('states.cols.trigger')),
        behavior: toPlainText(tContent('states.cols.behavior')),
      }"
      :items="stateItems"
    />

    <!-- ── Propriedades ─────────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        {
          title: tContent('props.vueTitle'),
          cols: propCols,
          items: checkboxPropItems,
        },
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
      :screen-reader-title="tNav('common.screenReader')"
      :screen-reader-items="screenReaderItems"
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ─────────────────────────────────────────────── -->
    <DocsRelated
      :title="tContent('related.title')"
      :items="relatedItems"
    />

    <!-- ── Notas ────────────────────────────────────────────────────── -->
    <DocsNotes
      :title="tContent('notes.title')"
      :items="noteItems"
    />

    <!-- ── Analytics ────────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :cols="{
        event: tContent('analytics.table.event'),
        trigger: toPlainText(tContent('analytics.table.trigger')),
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
