<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { Switch } from '@/components/ui/switch';
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

import uiTranslations     from '@/i18n/ui.json';
import componentTranslations from '@shared/content/switch/translations.json';

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
  componentSlug: 'switch',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
  aiIntent: tContent('seo.aiIntent'),
  breadcrumb: [
    { name: 'Components', item: '/components' },
    { name: tContent('category'), item: '/components/form' },
    { name: tContent('title') },
  ],
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'switch',
    locale: newLocale as 'pt-BR' | 'en' | 'es',
    page_title: tContent('seo.title'),
  });
}, { immediate: true });

// ─── Analytics — section view ─────────────────────────────────────────────────

// ─── Demo state (efeito imediato) ─────────────────────────────────────────────

const demoNotifications = ref(false);
const demoMarketing = ref(true);
const demoDarkMode = ref(false);
const demoSm = ref(false);

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
    component_name: 'switch',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";`;

const codeDefault = `<div class="flex items-center space-x-2">
  <Switch id="notifications" :model-value="enabled" @update:model-value="setEnabled" />
  <Label :for="'notifications'">Receber notificações por email</Label>
</div>`;

const codeWithDescription = `<div class="flex items-center justify-between">
  <div class="space-y-0.5">
    <Label :for="'marketing'">Emails de marketing</Label>
    <p class="text-sm text-muted-foreground">
      Receba novidades e promoções da plataforma.
    </p>
  </div>
  <Switch id="marketing" :model-value="marketing" @update:model-value="setMarketing" />
</div>`;

const codeSm = `<div class="flex items-center space-x-2">
  <Switch id="compact" size="sm" :model-value="value" @update:model-value="setValue" />
  <Label :for="'compact'" class="text-xs">Tamanho compacto</Label>
</div>`;

const codeCustomizationTokens = `/* Em globals.css — sobrescrever tokens semânticos */
:root {
  --primary: 142 76% 36%;
  --input: 214.3 31.8% 91.4%;
  --ring: 142 76% 36%;
}

.dark {
  --primary: 142 69% 58%;
  --input: 217.2 32.6% 17.5%;
}`;

const interfaceCode = `interface SwitchProps {
  modelValue?: boolean;        // controlado (v-model)
  defaultValue?: boolean;      // não-controlado
  disabled?: boolean;
  required?: boolean;
  name?: string;
  value?: string;
  id?: string;
  size?: 'default' | 'sm';
  class?: string;
  // Emits
  'onUpdate:modelValue'?: (value: boolean) => void;
}`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
]);

const variantItems = computed(() => [
  { name: stripHtml(tContent('variants.items.default')),         description: stripHtml(tContent('variants.styles.default')),         code: codeDefault         },
  { name: stripHtml(tContent('variants.items.withDescription')), description: stripHtml(tContent('variants.styles.withDescription')), code: codeWithDescription },
  { name: stripHtml(tContent('variants.items.sm')),              description: stripHtml(tContent('variants.styles.sm')),              code: codeSm              },
]);

const codeCompWithLabel = `<div class="flex items-center space-x-2">
  <Switch id="sw-email" />
  <Label for="sw-email" class="text-sm font-medium leading-none cursor-pointer">
    Receber notificações por email
  </Label>
</div>`;

const codeCompWithDescription = `<div class="flex items-center justify-between rounded-lg border p-3 w-80">
  <div class="flex flex-col gap-0.5 pr-3">
    <Label for="sw-marketing">Emails de marketing</Label>
    <p class="text-sm text-muted-foreground">
      Receba novidades e promoções da plataforma.
    </p>
  </div>
  <Switch id="sw-marketing" :checked="true" />
</div>`;

const codeCompSettingsList = `<div class="space-y-2 w-96">
  <h4 class="text-sm font-medium">Preferências de notificação</h4>
  <div class="flex items-center justify-between rounded-lg border p-3">
    <div class="flex flex-col gap-0.5 pr-3">
      <Label for="pref-email">Receber novidades por email</Label>
      <p class="text-sm text-muted-foreground">Resumo semanal sobre o produto.</p>
    </div>
    <Switch id="pref-email" :checked="true" />
  </div>
  <div class="flex items-center justify-between rounded-lg border p-3">
    <div class="flex flex-col gap-0.5 pr-3">
      <Label for="pref-push">Receber notificações push</Label>
      <p class="text-sm text-muted-foreground">Alertas no dispositivo em tempo real.</p>
    </div>
    <Switch id="pref-push" />
  </div>
  <div class="flex items-center justify-between rounded-lg border p-3">
    <div class="flex flex-col gap-0.5 pr-3">
      <Label for="pref-sms">Alertas por SMS</Label>
      <p class="text-sm text-muted-foreground">Eventos críticos via mensagem de texto.</p>
    </div>
    <Switch id="pref-sms" />
  </div>
</div>`;

const codeCompInForm = `<form class="flex flex-col gap-3 w-80" @submit.prevent>
  <div class="flex items-center space-x-2">
    <Switch id="sw-form-newsletter" name="newsletter" :checked="true" />
    <Label for="sw-form-newsletter">Aceitar newsletter semanal</Label>
  </div>
  <Button type="submit">Salvar preferências</Button>
</form>`;

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.withLabel.name'),
    description: tContent('variants.compositions.withLabel.description'),
    useWhen: tContent('variants.compositions.withLabel.use'),
    code: codeCompWithLabel,
  },
  {
    name: tContent('variants.compositions.withDescription.name'),
    description: tContent('variants.compositions.withDescription.description'),
    useWhen: tContent('variants.compositions.withDescription.use'),
    code: codeCompWithDescription,
  },
  {
    name: tContent('variants.compositions.settingsList.name'),
    description: tContent('variants.compositions.settingsList.description'),
    useWhen: tContent('variants.compositions.settingsList.use'),
    code: codeCompSettingsList,
  },
  {
    name: tContent('variants.compositions.inForm.name'),
    description: tContent('variants.compositions.inForm.description'),
    useWhen: tContent('variants.compositions.inForm.use'),
    code: codeCompInForm,
  },
]);

const stateItems = computed(() => [
  { label: tContent('states.items.unchecked'), trigger: '—', behavior: tContent('states.descriptions.unchecked') },
  { label: tContent('states.items.checked'),   trigger: '—', behavior: tContent('states.descriptions.checked')   },
  { label: tContent('states.items.hover'),     trigger: '—', behavior: tContent('states.descriptions.hover')     },
  { label: tContent('states.items.focus'),     trigger: '—', behavior: tContent('states.descriptions.focus')     },
  { label: tContent('states.items.disabled'),  trigger: '—', behavior: tContent('states.descriptions.disabled')  },
  { label: tContent('states.items.invalid'),   trigger: '—', behavior: tContent('states.descriptions.invalid')   },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const switchPropItems = computed(() => [
  { name: 'modelValue',         type: 'boolean',                       defaultValue: '—',         required: tContent('props.table.checked.required'),         description: stripHtml(tContent('props.table.checked.description'))         },
  { name: 'defaultValue',       type: 'boolean',                       defaultValue: 'false',     required: tContent('props.table.defaultChecked.required'),  description: stripHtml(tContent('props.table.defaultChecked.description'))  },
  { name: '@update:modelValue', type: '(value: boolean) => void',      defaultValue: '—',         required: tContent('props.table.onCheckedChange.required'), description: stripHtml(tContent('props.table.onCheckedChange.description')) },
  { name: 'disabled',           type: 'boolean',                       defaultValue: 'false',     required: tContent('props.table.disabled.required'),        description: stripHtml(tContent('props.table.disabled.description'))        },
  { name: 'name',               type: 'string',                        defaultValue: '—',         required: tContent('props.table.name.required'),            description: stripHtml(tContent('props.table.name.description'))            },
  { name: 'size',               type: '"default" | "sm"',              defaultValue: '"default"', required: tContent('props.table.size.required'),            description: stripHtml(tContent('props.table.size.description'))            },
  { name: 'id',                 type: 'string',                        defaultValue: '—',         required: tContent('props.table.id.required'),              description: stripHtml(tContent('props.table.id.description'))              },
]);

const tokenRows = computed(() => [
  { token: '--input',              value: tContent('tokens.table.input.class'),              description: tContent('tokens.table.input.part')              },
  { token: '--primary',            value: tContent('tokens.table.primary.class'),            description: tContent('tokens.table.primary.part')            },
  { token: '--background',         value: tContent('tokens.table.background.class'),         description: tContent('tokens.table.background.part')         },
  { token: '--primary-foreground', value: tContent('tokens.table.primaryForeground.class'),  description: tContent('tokens.table.primaryForeground.part')  },
  { token: '--ring',               value: tContent('tokens.table.ring.class'),               description: tContent('tokens.table.ring.part')               },
  { token: '--destructive',        value: tContent('tokens.table.destructive.class'),        description: tContent('tokens.table.destructive.part')        },
  { token: '--foreground',         value: tContent('tokens.table.foreground.class'),         description: tContent('tokens.table.foreground.part')         },
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
  { key: 'Tab',   description: tContent('accessibility.keyboard.tab')   },
  { key: 'Space', description: tContent('accessibility.keyboard.space') },
  { key: 'Enter', description: tContent('accessibility.keyboard.enter') },
]);

const relatedItems = computed(() => [
  { name: 'Checkbox',   description: tContent('related.items.checkbox.description'),   path: '?path=/docs/ui-checkbox--docs'   },
  { name: 'Toggle',     description: tContent('related.items.toggle.description'),     path: '?path=/docs/ui-toggle--docs'     },
  { name: 'RadioGroup', description: tContent('related.items.radioGroup.description'), path: '?path=/docs/ui-radiogroup--docs' },
  { name: 'Form',       description: tContent('related.items.form.description'),       path: '?path=/docs/ui-form--docs'       },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
]);

const analyticsItems = computed(() => [
  { event: 'field_change', trigger: tContent('analytics.table.field_change.trigger'), payload: tContent('analytics.table.field_change.payload') },
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
]);
</script>

<template>
  <DocsPageLayout :nav-groups="navGroups" :active-section="activeSection" component-slug="switch">
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
        install-note="npx shadcn-vue@latest add switch"
      />
    </template>

    <!-- ── Demonstração ─────────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div class="flex flex-col gap-6 w-full max-w-md">
        <div class="flex items-center space-x-2">
          <Switch
            id="demo-notifications"
            :model-value="demoNotifications"
            @update:model-value="(v: boolean) => demoNotifications = v"
          />
          <Label :for="'demo-notifications'">{{ tContent('demonstration.labels.notifications') }}</Label>
        </div>

        <div class="flex items-center justify-between rounded-lg border p-4">
          <div class="space-y-0.5">
            <Label :for="'demo-marketing'">{{ tContent('demonstration.labels.marketing') }}</Label>
            <p class="text-sm text-muted-foreground">
              {{ tContent('demonstration.labels.marketingDesc') }}
            </p>
          </div>
          <Switch
            id="demo-marketing"
            :model-value="demoMarketing"
            @update:model-value="(v: boolean) => demoMarketing = v"
          />
        </div>

        <div class="flex items-center justify-between rounded-lg border p-4">
          <div class="space-y-0.5">
            <Label :for="'demo-darkmode'">{{ tContent('demonstration.labels.darkMode') }}</Label>
            <p class="text-sm text-muted-foreground">
              {{ tContent('demonstration.labels.darkModeDesc') }}
            </p>
          </div>
          <Switch
            id="demo-darkmode"
            :model-value="demoDarkMode"
            @update:model-value="(v: boolean) => demoDarkMode = v"
          />
        </div>

        <div class="flex items-center space-x-2">
          <Switch
            id="demo-sm"
            size="sm"
            :model-value="demoSm"
            @update:model-value="(v: boolean) => demoSm = v"
          />
          <Label :for="'demo-sm'" class="text-xs">
            {{ tContent('demonstration.labels.sm') }}
          </Label>
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
            element: tContent('usage.uxWriting.table.description.name'),
            rules: tContent('usage.uxWriting.table.description.format'),
            do: tContent('usage.uxWriting.table.description.good'),
            dont: tContent('usage.uxWriting.table.description.bad'),
          },
          {
            element: tContent('usage.uxWriting.table.panel.name'),
            rules: tContent('usage.uxWriting.table.panel.format'),
            do: tContent('usage.uxWriting.table.panel.good'),
            dont: tContent('usage.uxWriting.table.panel.bad'),
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
      <!-- Pair 1: label semântica vs label genérica -->
      <template #do-preview-0>
        <div class="flex items-center space-x-2">
          <Switch id="dodont-do-1" />
          <Label :for="'dodont-do-1'">Receber notificações</Label>
        </div>
      </template>
      <template #dont-preview-0>
        <div class="flex items-center space-x-2">
          <Switch id="dodont-dont-1" />
          <Label :for="'dodont-dont-1'">Notificações</Label>
        </div>
      </template>

      <!-- Pair 2: Label associado via htmlFor vs texto solto -->
      <template #do-preview-1>
        <div class="flex items-center space-x-2">
          <Switch id="dodont-do-2" />
          <Label :for="'dodont-do-2'">Modo escuro</Label>
        </div>
      </template>
      <template #dont-preview-1>
        <div class="flex items-center space-x-2">
          <Switch />
          <span class="text-sm">Modo escuro</span>
        </div>
      </template>
    </DocsDoDont>

    <!-- ── Importação ───────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :code="codeImportBasic"
    />

    <!-- ── Variantes ────────────────────────────────────────────────── -->
    <DocsVariants :title="tContent('variants.title')" :items="variantItems" component-slug="switch">
      <!-- default -->
      <template #variant-preview-0>
        <div class="flex items-center space-x-2">
          <Switch id="variant-default" />
          <Label :for="'variant-default'">Receber notificações por email</Label>
        </div>
      </template>

      <!-- withDescription -->
      <template #variant-preview-1>
        <div class="flex items-center justify-between rounded-lg border p-4 w-80">
          <div class="space-y-0.5">
            <Label :for="'variant-marketing'">Emails de marketing</Label>
            <p class="text-sm text-muted-foreground">
              Receba novidades e promoções da plataforma.
            </p>
          </div>
          <Switch id="variant-marketing" />
        </div>
      </template>

      <!-- sm -->
      <template #variant-preview-2>
        <div class="flex items-center space-x-2">
          <Switch id="variant-sm" size="sm" />
          <Label :for="'variant-sm'" class="text-xs">Tamanho compacto</Label>
        </div>
      </template>
    </DocsVariants>

    <!-- ── Composições ─────────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="switch"
      :items="compositionItems"
    >
      <!-- withLabel -->
      <template #variant-preview-0>
        <div class="flex items-center space-x-2">
          <Switch id="sw-email" />
          <Label :for="'sw-email'" class="text-sm font-medium leading-none cursor-pointer">
            Receber notificações por email
          </Label>
        </div>
      </template>

      <!-- withDescription -->
      <template #variant-preview-1>
        <div class="flex items-center justify-between rounded-lg border p-3 w-80">
          <div class="flex flex-col gap-0.5 pr-3">
            <Label :for="'sw-marketing'">Emails de marketing</Label>
            <p class="text-sm text-muted-foreground">
              Receba novidades e promoções da plataforma.
            </p>
          </div>
          <Switch id="sw-marketing" :model-value="true" />
        </div>
      </template>

      <!-- settingsList -->
      <template #variant-preview-2>
        <div class="space-y-2 w-96">
          <h4 class="text-sm font-medium">Preferências de notificação</h4>
          <div class="flex items-center justify-between rounded-lg border p-3">
            <div class="flex flex-col gap-0.5 pr-3">
              <Label :for="'pref-email'">Receber novidades por email</Label>
              <p class="text-sm text-muted-foreground">Resumo semanal sobre o produto.</p>
            </div>
            <Switch id="pref-email" :model-value="true" />
          </div>
          <div class="flex items-center justify-between rounded-lg border p-3">
            <div class="flex flex-col gap-0.5 pr-3">
              <Label :for="'pref-push'">Receber notificações push</Label>
              <p class="text-sm text-muted-foreground">Alertas no dispositivo em tempo real.</p>
            </div>
            <Switch id="pref-push" />
          </div>
          <div class="flex items-center justify-between rounded-lg border p-3">
            <div class="flex flex-col gap-0.5 pr-3">
              <Label :for="'pref-sms'">Alertas por SMS</Label>
              <p class="text-sm text-muted-foreground">Eventos críticos via mensagem de texto.</p>
            </div>
            <Switch id="pref-sms" />
          </div>
        </div>
      </template>

      <!-- inForm -->
      <template #variant-preview-3>
        <form class="flex flex-col gap-3 w-80" @submit.prevent>
          <div class="flex items-center space-x-2">
            <Switch id="sw-form-newsletter" name="newsletter" :model-value="true" />
            <Label :for="'sw-form-newsletter'">Aceitar newsletter semanal</Label>
          </div>
          <Button type="submit">Salvar preferências</Button>
        </form>
      </template>
    </DocsCompositions>

    <!-- ── Estados ──────────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{
        state: 'Estado',
        trigger: 'Trigger',
        behavior: 'Comportamento',
      }"
      :items="stateItems"
    />

    <!-- ── Propriedades ─────────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        {
          title: 'Switch',
          cols: propCols,
          items: switchPropItems,
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
