<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { toast } from 'vue-sonner';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import sonnerTranslations from '@shared/content/sonner/translations.json';

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

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(sonnerTranslations);

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
  componentSlug: 'sonner',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'sonner',
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
      { id: 'anatomia',     label: tNav('nav.anatomy')       },
      { id: 'quando-usar',  label: tNav('nav.usage')         },
      { id: 'do-dont',      label: tNav('nav.doDont')        },
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
    component_name: 'sonner',
    locale: locale.value,
  });
});
// ─── Toast actions (demonstração) ─────────────────────────────────────────────

function fireDefault()  { toast(tContent('demonstration.labels.default')); }
function fireSuccess()  { toast.success(tContent('demonstration.labels.success')); }
function fireError()    { toast.error(tContent('demonstration.labels.error')); }
function fireWarning()  { toast.warning(tContent('demonstration.labels.warning')); }
function fireInfo()     { toast.info(tContent('demonstration.labels.info')); }
function fireLoading()  { toast.loading(tContent('demonstration.labels.loading')); }

function fireWithDescription() {
  toast.success(tContent('demonstration.labels.withDescription'), {
    description: tContent('demonstration.labels.withDescriptionDesc'),
  });
}

function fireWithAction() {
  toast(tContent('demonstration.labels.withAction'), {
    action: {
      label: tContent('demonstration.labels.withActionLabel'),
      onClick: () => {
        track('toast_action_click', {
          label: tContent('demonstration.labels.withActionLabel'),
          component: 'toast',
          location: 'sonner-docs-demonstration',
        });
      },
    },
  });
}

function firePromise() {
  const promise = new Promise<void>((resolve) => setTimeout(resolve, 2000));
  toast.promise(promise, {
    loading: tContent('demonstration.labels.promiseLoading'),
    success: tContent('demonstration.labels.promise'),
    error: tContent('demonstration.labels.promiseError'),
  });
}

function firePersistent() {
  toast.error(tContent('demonstration.labels.persistent'), {
    duration: Infinity,
    dismissible: true,
  });
}

// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImport = `import { Toaster } from "@/components/ui/sonner";
import { toast } from "vue-sonner";`;

const codeSetup = `<!-- App.vue — adicionar uma vez no root -->
<Toaster position="top-right" :rich-colors="true" />`;

const codeVariantDefault  = `toast("Código copiado.")`;
const codeVariantSuccess  = `toast.success("Alterações salvas.")`;
const codeVariantError    = `toast.error("Não foi possível salvar. Tente novamente.")`;
const codeVariantWarning  = `toast.warning("Sua sessão expira em 5 minutos.")`;
const codeVariantInfo     = `toast.info("Nova versão disponível.")`;

const codeWithDescription = `toast.success("Preferências atualizadas.", {
  description: "Suas configurações foram salvas e entrarão em vigor na próxima sessão.",
})`;

const codeWithAction = `toast("Item excluído.", {
  action: {
    label: "Desfazer",
    onClick: () => { /* lógica de reversão */ },
  },
})`;

const codePromise = `const promise = fetch("/api/upload");
toast.promise(promise, {
  loading: "Enviando arquivo...",
  success: "Arquivo enviado com sucesso.",
  error: "Erro ao enviar. Tente novamente.",
})`;

const codePersistent = `toast.error("Falha crítica no servidor.", {
  duration: Infinity,
  dismissible: true,
})`;

const codeCustomizationTokens = `/* Em globals.css */
:root {
  --normal-bg: var(--popover);
  --normal-text: var(--popover-foreground);
  --normal-border: var(--border);
  --border-radius: var(--radius);
}`;

const interfaceCode = `interface ToasterProps {
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  richColors?: boolean;
  expand?: boolean;
  duration?: number;
  theme?: 'light' | 'dark' | 'system';
  icons?: Record<string, Component>;
  toastOptions?: ToastOptions;
}`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
  tContent('anatomy.item4'),
  tContent('anatomy.item5'),
  tContent('anatomy.item6'),
  tContent('anatomy.item7'),
]);

const variantItems = computed(() => [
  { name: 'default',  description: stripHtml(tContent('variants.items.default')),  code: codeVariantDefault  },
  { name: 'success',  description: stripHtml(tContent('variants.items.success')),  code: codeVariantSuccess  },
  { name: 'error',    description: stripHtml(tContent('variants.items.error')),    code: codeVariantError    },
  { name: 'warning',  description: stripHtml(tContent('variants.items.warning')),  code: codeVariantWarning  },
  { name: 'info',     description: stripHtml(tContent('variants.items.info')),     code: codeVariantInfo     },
]);

const stateItems = computed(() => [
  {
    label:    tContent('states.items.withDescription.label'),
    trigger:  'toast.success(title, { description })',
    behavior: tContent('states.items.withDescription.description'),
  },
  {
    label:    tContent('states.items.withAction.label'),
    trigger:  'toast(title, { action: { label, onClick } })',
    behavior: stripHtml(tContent('states.items.withAction.description')),
  },
  {
    label:    tContent('states.items.promise.label'),
    trigger:  'toast.promise(promise, { loading, success, error })',
    behavior: tContent('states.items.promise.description'),
  },
  {
    label:    tContent('states.items.persistent.label'),
    trigger:  'toast.error(title, { duration: Infinity })',
    behavior: stripHtml(tContent('states.items.persistent.description')),
  },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const toasterPropItems = computed(() => [
  { name: 'position',     type: 'string',    defaultValue: '"bottom-right"', required: 'Não', description: stripHtml(tContent('props.table.position'))     },
  { name: 'richColors',   type: 'boolean',   defaultValue: 'false',          required: 'Não', description: tContent('props.table.richColors')              },
  { name: 'expand',       type: 'boolean',   defaultValue: 'false',          required: 'Não', description: tContent('props.table.expand')                  },
  { name: 'duration',     type: 'number',    defaultValue: '4000',           required: 'Não', description: tContent('props.table.duration')                },
  { name: 'theme',        type: 'string',    defaultValue: '"system"',       required: 'Não', description: stripHtml(tContent('props.table.theme'))        },
  { name: 'icons',        type: 'object',    defaultValue: '—',              required: 'Não', description: tContent('props.table.icons')                   },
  { name: 'toastOptions', type: 'object',    defaultValue: '—',              required: 'Não', description: stripHtml(tContent('props.table.toastOptions')) },
]);

const tokenRows = computed(() => [
  { token: '--normal-bg',     value: 'var(--popover)',            description: tContent('tokens.table.normalBg')     },
  { token: '--normal-text',   value: 'var(--popover-foreground)', description: tContent('tokens.table.normalText')   },
  { token: '--normal-border', value: 'var(--border)',             description: tContent('tokens.table.normalBorder') },
  { token: '--border-radius', value: 'var(--radius)',             description: tContent('tokens.table.borderRadius') },
]);

const accessibilityItems = computed(() => [
  tContent('accessibility.item1'),
  tContent('accessibility.item2'),
  tContent('accessibility.item3'),
  tContent('accessibility.item4'),
  tContent('accessibility.item5'),
]);

const keyboardItems = computed(() => [
  { key: 'Tab',    description: tContent('accessibility.keyboard.tab')         },
  { key: 'Enter',  description: tContent('accessibility.keyboard.enter')       },
  { key: 'Escape', description: tContent('accessibility.keyboard.escape')      },
  { key: '—',      description: tContent('accessibility.keyboard.noKeyboard')  },
]);

const relatedItems = computed(() => [
  { name: 'Alert',        description: tContent('related.alert'),        path: '?path=/docs/ui-alert--docs'        },
  { name: 'AlertDialog',  description: tContent('related.alertDialog'),  path: '?path=/docs/ui-alertdialog--docs'  },
  { name: 'Badge',        description: tContent('related.badge'),        path: '?path=/docs/ui-badge--docs'        },
  { name: 'Progress',     description: tContent('related.progress'),     path: '?path=/docs/ui-progress--docs'     },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
  { title: '', content: tContent('notes.item5') },
]);

const analyticsItems = computed(() => [
  { event: tContent('analytics.table.actionClick'),    trigger: tContent('analytics.table.actionClickTrigger'),    payload: tContent('analytics.table.actionClickPayload')    },
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
  { action: tContent('testes.functional.item7.action'), result: tContent('testes.functional.item7.result'), priority: localPriority(tContent('testes.functional.item7.priority')) },
]);

const a11yTestItems = computed(() => [
  { criterion: tContent('testes.accessibility.item1.criterion'), level: tContent('testes.accessibility.item1.level'), how: tContent('testes.accessibility.item1.how') },
  { criterion: tContent('testes.accessibility.item2.criterion'), level: tContent('testes.accessibility.item2.level'), how: tContent('testes.accessibility.item2.how') },
  { criterion: tContent('testes.accessibility.item3.criterion'), level: tContent('testes.accessibility.item3.level'), how: tContent('testes.accessibility.item3.how') },
  { criterion: tContent('testes.accessibility.item4.criterion'), level: tContent('testes.accessibility.item4.level'), how: tContent('testes.accessibility.item4.how') },
]);

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
        install-note="npx shadcn-vue@latest add sonner"
      />
    </template>

    <!-- ── Demonstração ───────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div style="contain: layout; position: relative; min-height: 120px;">
        <Toaster position="top-right" :rich-colors="true" />
        <div class="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" @click="fireDefault">{{ tContent('demonstration.labels.triggerDefault') }}</Button>
          <Button variant="outline" size="sm" @click="fireSuccess">{{ tContent('demonstration.labels.triggerSuccess') }}</Button>
          <Button variant="outline" size="sm" @click="fireError">{{ tContent('demonstration.labels.triggerError') }}</Button>
          <Button variant="outline" size="sm" @click="fireWarning">{{ tContent('demonstration.labels.triggerWarning') }}</Button>
          <Button variant="outline" size="sm" @click="fireInfo">{{ tContent('demonstration.labels.triggerInfo') }}</Button>
          <Button variant="outline" size="sm" @click="fireLoading">{{ tContent('demonstration.labels.triggerLoading') }}</Button>
          <Button variant="outline" size="sm" @click="fireWithDescription">{{ tContent('demonstration.labels.triggerWithDescription') }}</Button>
          <Button variant="outline" size="sm" @click="fireWithAction">{{ tContent('demonstration.labels.triggerWithAction') }}</Button>
          <Button variant="outline" size="sm" @click="firePromise">{{ tContent('demonstration.labels.triggerPromise') }}</Button>
          <Button variant="outline" size="sm" @click="firePersistent">{{ tContent('demonstration.labels.triggerPersistent') }}</Button>
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
      :ux-writing="{
        title: tContent('usage.uxWriting.title'),
        cols: {
          element: tContent('usage.uxWriting.table.element'),
          rules: tContent('usage.uxWriting.table.rules'),
          do: tContent('usage.uxWriting.table.correct'),
          dont: tContent('usage.uxWriting.table.avoid'),
        },
        items: [
          { element: tContent('usage.uxWriting.table.title.name'), rules: tContent('usage.uxWriting.table.title.format'), do: tContent('usage.uxWriting.table.title.good'), dont: tContent('usage.uxWriting.table.title.bad') },
          { element: tContent('usage.uxWriting.table.description.name'), rules: tContent('usage.uxWriting.table.description.format'), do: tContent('usage.uxWriting.table.description.good'), dont: tContent('usage.uxWriting.table.description.bad') },
          { element: tContent('usage.uxWriting.table.action.name'), rules: tContent('usage.uxWriting.table.action.format'), do: tContent('usage.uxWriting.table.action.good'), dont: tContent('usage.uxWriting.table.action.bad') },
          { element: tContent('usage.uxWriting.table.error.name'), rules: tContent('usage.uxWriting.table.error.format'), do: tContent('usage.uxWriting.table.error.good'), dont: tContent('usage.uxWriting.table.error.bad') },
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
      ]"
    >
      <template #do-preview-0>
        <div style="contain: layout; position: relative; min-height: 80px;" class="w-full">
          <Toaster position="top-right" :rich-colors="true" />
          <Button variant="outline" size="sm" @click="fireSuccess">{{ tContent('demonstration.labels.triggerSuccess') }}</Button>
        </div>
      </template>
      <template #dont-preview-0>
        <div style="contain: layout; position: relative; min-height: 80px;" class="w-full">
          <Toaster position="top-right" :rich-colors="true" />
          <Button variant="outline" size="sm" @click="fireError">{{ tContent('demonstration.labels.triggerError') }}</Button>
        </div>
      </template>
      <template #do-preview-1>
        <div style="contain: layout; position: relative; min-height: 80px;" class="w-full">
          <Toaster position="top-right" :rich-colors="true" />
          <Button variant="outline" size="sm" @click="firePromise">{{ tContent('demonstration.labels.triggerPromise') }}</Button>
        </div>
      </template>
      <template #dont-preview-1>
        <div style="contain: layout; position: relative; min-height: 80px;" class="w-full">
          <Toaster position="top-right" :rich-colors="true" />
          <Button variant="outline" size="sm" @click="fireError">{{ tContent('demonstration.labels.triggerError') }}</Button>
        </div>
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :code="codeImport"
      :secondary-code="codeSetup"
    />

    <!-- ── Variantes ──────────────────────────────────────────────── -->
    <DocsVariants :title="tContent('variants.title')" :items="variantItems">
      <template #variant-preview-0>
        <div style="contain: layout; position: relative; min-height: 80px;" class="w-full">
          <Toaster position="top-right" :rich-colors="true" />
          <Button variant="outline" size="sm" @click="fireDefault">{{ tContent('demonstration.labels.triggerDefault') }}</Button>
        </div>
      </template>
      <template #variant-preview-1>
        <div style="contain: layout; position: relative; min-height: 80px;" class="w-full">
          <Toaster position="top-right" :rich-colors="true" />
          <Button variant="outline" size="sm" @click="fireSuccess">{{ tContent('demonstration.labels.triggerSuccess') }}</Button>
        </div>
      </template>
      <template #variant-preview-2>
        <div style="contain: layout; position: relative; min-height: 80px;" class="w-full">
          <Toaster position="top-right" :rich-colors="true" />
          <Button variant="outline" size="sm" @click="fireError">{{ tContent('demonstration.labels.triggerError') }}</Button>
        </div>
      </template>
      <template #variant-preview-3>
        <div style="contain: layout; position: relative; min-height: 80px;" class="w-full">
          <Toaster position="top-right" :rich-colors="true" />
          <Button variant="outline" size="sm" @click="fireWarning">{{ tContent('demonstration.labels.triggerWarning') }}</Button>
        </div>
      </template>
      <template #variant-preview-4>
        <div style="contain: layout; position: relative; min-height: 80px;" class="w-full">
          <Toaster position="top-right" :rich-colors="true" />
          <Button variant="outline" size="sm" @click="fireInfo">{{ tContent('demonstration.labels.triggerInfo') }}</Button>
        </div>
      </template>
    </DocsVariants>

    <!-- ── Composições (States) ───────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{ state: tNav('nav.states'), trigger: 'API', behavior: tNav('nav.overview') }"
      :items="stateItems"
    />

    <!-- ── Propriedades ───────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: tContent('props.toasterTitle'), cols: propCols, items: toasterPropItems },
      ]"
      :interface-code="interfaceCode"
    />

    <!-- ── Tokens ─────────────────────────────────────────────────── -->
    <DocsTokens
      :title="tContent('tokens.title')"
      :cols="{
        token: tContent('tokens.table.token'),
        value: tContent('tokens.table.value'),
        description: tContent('tokens.table.description'),
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
      :keyboard-title="tContent('accessibility.keyboardTitle')"
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
