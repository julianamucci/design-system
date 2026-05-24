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

// ─── i18n ─────────────────────────────────────────────────────────────────────
// IMPORTANT: locale comes from useTranslation — NEVER from useLocaleStore/Pinia
const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(checkboxTranslations);

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
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import { Checkbox } from "@/components/ui/checkbox";`;
const codeImportWithLabel = `import { Checkbox } from "@/components/ui/checkbox";
// Label é um elemento HTML nativo ou componente Label de @/components/ui/label`;

const codeDefault = `<div class="flex items-center gap-2">
  <Checkbox id="terms" />
  <label for="terms" class="text-sm font-medium leading-none">
    Aceito os termos e condições
  </label>
</div>`;

const codeChecked = `<div class="flex items-center gap-2">
  <Checkbox id="terms" :checked="true" />
  <label for="terms" class="text-sm font-medium leading-none">
    Aceito os termos e condições
  </label>
</div>`;

const codeWithLabel = `<div class="flex items-center gap-2">
  <Checkbox id="newsletter" />
  <label
    for="newsletter"
    class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
  >
    Receber novidades por email
  </label>
</div>`;

const codeWithDescription = `<div class="flex items-start gap-2">
  <Checkbox id="newsletter" class="mt-0.5" aria-describedby="newsletter-desc" />
  <div class="space-y-1">
    <label for="newsletter" class="text-sm font-medium leading-none">
      Receber novidades por email
    </label>
    <p id="newsletter-desc" class="text-sm text-muted-foreground">
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
  checked?: boolean | 'indeterminate';
  defaultChecked?: boolean;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  value?: string;
  class?: string;
  // Emits
  'onUpdate:checked'?: (value: boolean | 'indeterminate') => void;
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
  { name: 'checked',         description: stripHtml(tContent('variants.items.checked')),         code: codeChecked         },
  { name: 'withLabel',       description: stripHtml(tContent('variants.items.withLabel')),       code: codeWithLabel       },
  { name: 'withDescription', description: stripHtml(tContent('variants.items.withDescription')), code: codeWithDescription },
]);

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.withLabel.name'),
    description: stripHtml(tContent('variants.compositions.withLabel.description')),
    useWhen: stripHtml(tContent('variants.compositions.withLabel.use')),
    code: `<div class="flex items-center gap-2">\n  <Checkbox id="cb-tos" />\n  <Label for="cb-tos" class="text-sm font-medium leading-none cursor-pointer">\n    Aceito os termos e condições\n  </Label>\n</div>`,
  },
  {
    name: tContent('variants.compositions.withDescription.name'),
    description: stripHtml(tContent('variants.compositions.withDescription.description')),
    useWhen: stripHtml(tContent('variants.compositions.withDescription.use')),
    code: `<div class="flex gap-2 items-start">\n  <Checkbox id="cb-newsletter" class="mt-0.5" />\n  <div class="flex flex-col gap-1">\n    <Label for="cb-newsletter">Receber novidades por email</Label>\n    <p class="text-sm text-muted-foreground">\n      Enviaremos atualizações sobre novos recursos e melhorias do produto.\n    </p>\n  </div>\n</div>`,
  },
  {
    name: tContent('variants.compositions.fieldset.name'),
    description: stripHtml(tContent('variants.compositions.fieldset.description')),
    useWhen: stripHtml(tContent('variants.compositions.fieldset.use')),
    code: `<fieldset class="border rounded-lg p-4 space-y-3 w-72">\n  <legend class="text-sm font-semibold px-1">Notificações</legend>\n  <div class="flex items-center gap-2">\n    <Checkbox id="notif-email" />\n    <Label for="notif-email">Receber novidades por email</Label>\n  </div>\n  <div class="flex items-center gap-2">\n    <Checkbox id="notif-push" />\n    <Label for="notif-push">Receber notificações push</Label>\n  </div>\n  <div class="flex items-center gap-2">\n    <Checkbox id="notif-sms" />\n    <Label for="notif-sms">Alertas por SMS</Label>\n  </div>\n</fieldset>`,
  },
  {
    name: tContent('variants.compositions.selectAll.name'),
    description: stripHtml(tContent('variants.compositions.selectAll.description')),
    useWhen: stripHtml(tContent('variants.compositions.selectAll.use')),
    code: `<script setup lang="ts">\nimport { ref, computed } from 'vue';\nconst c1 = ref(true); const c2 = ref(false); const c3 = ref(true);\nconst all = computed<boolean | 'indeterminate'>({\n  get() {\n    const allChecked = c1.value && c2.value && c3.value;\n    const noneChecked = !c1.value && !c2.value && !c3.value;\n    if (allChecked) return true;\n    if (noneChecked) return false;\n    return 'indeterminate';\n  },\n  set(v) { const n = v === true; c1.value = n; c2.value = n; c3.value = n; },\n});\n<\/script>\n\n<template>\n  <div class="space-y-3 w-72">\n    <div class="flex items-center gap-2 pb-2 border-b">\n      <Checkbox id="cb-select-all" v-model:checked="all" />\n      <Label for="cb-select-all" class="text-sm font-semibold leading-none">\n        Selecionar todos os itens\n      </Label>\n    </div>\n    <div class="flex items-center gap-2 pl-2">\n      <Checkbox id="cb-item-1" v-model:checked="c1" />\n      <Label for="cb-item-1">Item 1</Label>\n    </div>\n    <!-- demais filhos -->\n  </div>\n<\/template>`,
  },
  {
    name: tContent('variants.compositions.inList.name'),
    description: stripHtml(tContent('variants.compositions.inList.description')),
    useWhen: stripHtml(tContent('variants.compositions.inList.use')),
    code: `<div class="space-y-2 w-80">\n  <p class="text-sm font-semibold mb-3">Preferências de contato</p>\n  <div class="flex items-center justify-between rounded-md border px-3 py-2">\n    <div class="flex items-center gap-2">\n      <Checkbox id="list-email" :checked="true" />\n      <Label for="list-email">Receber novidades por email</Label>\n    </div>\n  </div>\n  <!-- demais linhas -->\n</div>`,
  },
]);

const stateItems = computed(() => [
  { label: tContent('states.unchecked.label'),     trigger: tContent('states.unchecked.trigger'),     behavior: tContent('states.unchecked.behavior')     },
  { label: tContent('states.checked.label'),       trigger: tContent('states.checked.trigger'),       behavior: tContent('states.checked.behavior')       },
  { label: tContent('states.disabled.label'),      trigger: tContent('states.disabled.trigger'),      behavior: tContent('states.disabled.behavior')      },
  { label: tContent('states.error.label'),         trigger: tContent('states.error.trigger'),         behavior: tContent('states.error.behavior')         },
  { label: tContent('states.indeterminate.label'), trigger: tContent('states.indeterminate.trigger'), behavior: tContent('states.indeterminate.behavior') },
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
  { name: 'defaultChecked',      type: 'boolean',                      defaultValue: '—',         required: 'Não', description: stripHtml(tContent('props.items.defaultChecked'))     },
  { name: '@update:checked',     type: '(value: boolean | "indeterminate") => void', defaultValue: '—', required: 'Não', description: stripHtml(tContent('props.items.onCheckedChange')) },
  { name: 'disabled',            type: 'boolean',                      defaultValue: 'false',     required: 'Não', description: stripHtml(tContent('props.items.disabled'))           },
  { name: 'required',            type: 'boolean',                      defaultValue: 'false',     required: 'Não', description: stripHtml(tContent('props.items.required'))           },
  { name: 'name',                type: 'string',                       defaultValue: '—',         required: 'Não', description: stripHtml(tContent('props.items.name'))               },
  { name: 'value',               type: 'string',                       defaultValue: '"on"',      required: 'Não', description: stripHtml(tContent('props.items.value'))              },
  { name: 'class',               type: 'string',                       defaultValue: '—',         required: 'Não', description: stripHtml(tContent('props.items.className'))          },
]);

const tokenRows = computed(() => [
  { token: '--primary',            value: 'bg-primary',                 description: tContent('tokens.table.primary')            },
  { token: '--primary-foreground', value: 'text-primary-foreground',    description: tContent('tokens.table.primaryForeground')  },
  { token: '--input',              value: 'border-input',               description: tContent('tokens.table.input')              },
  { token: '--ring',               value: 'focus-visible:ring-ring/50', description: tContent('tokens.table.ring')               },
  { token: '--destructive',        value: 'aria-invalid:border-destructive', description: tContent('tokens.table.destructive')   },
  { token: '--border',             value: 'border',                     description: tContent('tokens.table.border')             },
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
  { name: 'Switch',     description: tContent('related.switch'),     path: '?path=/docs/ui-switch--docs'      },
  { name: 'RadioGroup', description: tContent('related.radioGroup'), path: '?path=/docs/ui-radiogroup--docs'  },
  { name: 'Form',       description: tContent('related.form'),       path: '?path=/docs/ui-form--docs'        },
  { name: 'Select',     description: tContent('related.select'),     path: '?path=/docs/ui-select--docs'      },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.tip1') },
  { title: '', content: tContent('notes.tip2') },
  { title: '', content: tContent('notes.tip3') },
  { title: '', content: tContent('notes.tip4') },
]);

const analyticsItems = computed(() => [
  { event: tContent('analytics.table.fieldChange'),    trigger: tContent('analytics.table.fieldChangeTrigger'),    payload: tContent('analytics.table.fieldChangePayload')    },
  { event: tContent('analytics.table.pageView'),       trigger: tContent('analytics.table.pageViewTrigger'),       payload: tContent('analytics.table.pageViewPayload')       },
  { event: tContent('analytics.table.sectionViewed'),  trigger: tContent('analytics.table.sectionViewedTrigger'),  payload: tContent('analytics.table.sectionViewedPayload')  },
  { event: tContent('analytics.table.langSwitch'),     trigger: tContent('analytics.table.langSwitchTrigger'),     payload: tContent('analytics.table.langSwitchPayload')     },
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
  { criterion: tContent('testes.accessibility.item1.criterion'), level: tContent('testes.accessibility.item1.level'), how: tContent('testes.accessibility.item1.how') },
  { criterion: tContent('testes.accessibility.item2.criterion'), level: tContent('testes.accessibility.item2.level'), how: tContent('testes.accessibility.item2.how') },
  { criterion: tContent('testes.accessibility.item3.criterion'), level: tContent('testes.accessibility.item3.level'), how: tContent('testes.accessibility.item3.how') },
  { criterion: tContent('testes.accessibility.item4.criterion'), level: tContent('testes.accessibility.item4.level'), how: tContent('testes.accessibility.item4.how') },
  { criterion: tContent('testes.accessibility.item5.criterion'), level: tContent('testes.accessibility.item5.level'), how: tContent('testes.accessibility.item5.how') },
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
  <DocsPageLayout :nav-groups="navGroups" :active-section="activeSection" component-slug="checkbox">
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
        install-note="npx shadcn-vue@latest add checkbox"
      />
    </template>

    <!-- ── Demonstração ─────────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div class="flex flex-wrap gap-6">
        <div class="flex items-center gap-2">
          <Checkbox id="demo-terms" />
          <label for="demo-terms" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {{ tContent('demonstration.labels.acceptTerms') }}
          </label>
        </div>
        <div class="flex items-center gap-2">
          <Checkbox id="demo-newsletter" :checked="true" />
          <label for="demo-newsletter" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {{ tContent('demonstration.labels.newsletter') }}
          </label>
        </div>
        <div class="flex items-center gap-2">
          <Checkbox id="demo-session" :disabled="true" />
          <label for="demo-session" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {{ tContent('demonstration.labels.rememberMe') }}
          </label>
        </div>
        <div class="flex items-start gap-2">
          <Checkbox id="demo-notif" class="mt-0.5" />
          <div class="space-y-1">
            <label for="demo-notif" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {{ tContent('demonstration.labels.notifications') }}
            </label>
            <p class="text-xs text-muted-foreground">
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
      <!-- Pair 1: label semântica vs label genérica -->
      <template #do-preview-0>
        <div class="flex items-center gap-2">
          <Checkbox id="dodont-do-1" />
          <label for="dodont-do-1" class="text-sm font-medium leading-none">
            Receber notificações por email
          </label>
        </div>
      </template>
      <template #dont-preview-0>
        <div class="flex items-center gap-2">
          <Checkbox id="dodont-dont-1" />
          <label for="dodont-dont-1" class="text-sm font-medium leading-none">
            Email
          </label>
        </div>
      </template>

      <!-- Pair 2: fieldset vs checkboxes soltos -->
      <template #do-preview-1>
        <fieldset class="space-y-2 border rounded-md p-3 w-full">
          <legend class="text-xs font-semibold px-1">Notificações</legend>
          <div class="flex items-center gap-2">
            <Checkbox id="dodont-do-2a" />
            <label for="dodont-do-2a" class="text-sm font-medium leading-none">Email</label>
          </div>
          <div class="flex items-center gap-2">
            <Checkbox id="dodont-do-2b" />
            <label for="dodont-do-2b" class="text-sm font-medium leading-none">Push</label>
          </div>
        </fieldset>
      </template>
      <template #dont-preview-1>
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <Checkbox id="dodont-dont-2a" />
            <label for="dodont-dont-2a" class="text-sm font-medium leading-none">Email</label>
          </div>
          <div class="flex items-center gap-2">
            <Checkbox id="dodont-dont-2b" />
            <label for="dodont-dont-2b" class="text-sm font-medium leading-none">Push</label>
          </div>
        </div>
      </template>
    </DocsDoDont>

    <!-- ── Importação ───────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :description="tContent('import.vue')"
      :code="codeImportBasic"
      :secondary-description="tContent('import.svelte')"
      :secondary-code="`import { Checkbox } from '@/components/ui/checkbox';`"
    />

    <!-- ── Variantes ────────────────────────────────────────────────── -->
    <DocsVariants :title="tContent('variants.title')" :items="variantItems" component-slug="checkbox">
      <!-- default: unchecked -->
      <template #variant-preview-0>
        <div class="flex items-center gap-2">
          <Checkbox id="variant-default" />
          <label for="variant-default" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Aceito os termos e condições
          </label>
        </div>
      </template>

      <!-- checked -->
      <template #variant-preview-1>
        <div class="flex items-center gap-2">
          <Checkbox id="variant-checked" :checked="true" />
          <label for="variant-checked" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Aceito os termos e condições
          </label>
        </div>
      </template>

      <!-- withLabel -->
      <template #variant-preview-2>
        <div class="flex items-center gap-2">
          <Checkbox id="variant-with-label" />
          <label for="variant-with-label" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Receber novidades por email
          </label>
        </div>
      </template>

      <!-- withDescription -->
      <template #variant-preview-3>
        <div class="flex items-start gap-2">
          <Checkbox id="variant-with-desc" class="mt-0.5" />
          <div class="space-y-1">
            <label for="variant-with-desc" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Receber novidades por email
            </label>
            <p class="text-sm text-muted-foreground">
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
      <!-- 0: withLabel -->
      <template #variant-preview-0>
        <div class="flex items-center gap-2">
          <Checkbox id="cb-tos" />
          <Label for="cb-tos" class="text-sm font-medium leading-none cursor-pointer">
            Aceito os termos e condições
          </Label>
        </div>
      </template>

      <!-- 1: withDescription -->
      <template #variant-preview-1>
        <div class="flex gap-2 items-start">
          <Checkbox id="cb-newsletter" class="mt-0.5" />
          <div class="flex flex-col gap-1">
            <Label for="cb-newsletter">Receber novidades por email</Label>
            <p class="text-sm text-muted-foreground">
              Enviaremos atualizações sobre novos recursos e melhorias do produto.
            </p>
          </div>
        </div>
      </template>

      <!-- 2: fieldset -->
      <template #variant-preview-2>
        <fieldset class="border rounded-lg p-4 space-y-3 w-72">
          <legend class="text-sm font-semibold px-1">Notificações</legend>
          <div class="flex items-center gap-2">
            <Checkbox id="notif-email" />
            <Label for="notif-email">Receber novidades por email</Label>
          </div>
          <div class="flex items-center gap-2">
            <Checkbox id="notif-push" />
            <Label for="notif-push">Receber notificações push</Label>
          </div>
          <div class="flex items-center gap-2">
            <Checkbox id="notif-sms" />
            <Label for="notif-sms">Alertas por SMS</Label>
          </div>
        </fieldset>
      </template>

      <!-- 3: selectAll -->
      <template #variant-preview-3>
        <div class="space-y-3 w-72">
          <div class="flex items-center gap-2 pb-2 border-b">
            <Checkbox id="cb-select-all" v-model:checked="selectAllValue" />
            <Label for="cb-select-all" class="text-sm font-semibold leading-none">
              Selecionar todos os itens
            </Label>
          </div>
          <div class="flex items-center gap-2 pl-2">
            <Checkbox id="cb-select-child-1" v-model:checked="selectAllChild1" />
            <Label for="cb-select-child-1">Receber novidades por email</Label>
          </div>
          <div class="flex items-center gap-2 pl-2">
            <Checkbox id="cb-select-child-2" v-model:checked="selectAllChild2" />
            <Label for="cb-select-child-2">Receber notificações push</Label>
          </div>
          <div class="flex items-center gap-2 pl-2">
            <Checkbox id="cb-select-child-3" v-model:checked="selectAllChild3" />
            <Label for="cb-select-child-3">Alertas por SMS</Label>
          </div>
        </div>
      </template>

      <!-- 4: inList -->
      <template #variant-preview-4>
        <div class="space-y-2 w-80">
          <p class="text-sm font-semibold mb-3">Preferências de contato</p>
          <div class="flex items-center justify-between rounded-md border px-3 py-2">
            <div class="flex items-center gap-2">
              <Checkbox id="list-email" v-model:checked="inListEmail" />
              <Label for="list-email">Receber novidades por email</Label>
            </div>
          </div>
          <div class="flex items-center justify-between rounded-md border px-3 py-2">
            <div class="flex items-center gap-2">
              <Checkbox id="list-push" v-model:checked="inListPush" />
              <Label for="list-push">Receber notificações push</Label>
            </div>
          </div>
          <div class="flex items-center justify-between rounded-md border px-3 py-2">
            <div class="flex items-center gap-2">
              <Checkbox id="list-sms" v-model:checked="inListSms" />
              <Label for="list-sms">Alertas por SMS</Label>
            </div>
          </div>
          <div class="flex items-center justify-between rounded-md border px-3 py-2">
            <div class="flex items-center gap-2">
              <Checkbox id="list-newsletter" v-model:checked="inListNewsletter" />
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
        trigger: tContent('states.cols.trigger'),
        behavior: tContent('states.cols.behavior'),
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
