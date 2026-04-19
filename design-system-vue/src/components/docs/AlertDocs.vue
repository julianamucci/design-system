<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-vue-next';
import DocsNav from '@/components/docs/shared/DocsNav.vue';
import uiTranslations from '@/i18n/ui.json';
import alertTranslations from '@shared/content/alert/translations.json';

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
const { t: tContent, locale } = useTranslation(alertTranslations);

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
  componentSlug: 'alert',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'alert',
    locale: newLocale,
    page_title: `${tContent('title')} · Design System`,
  });
}, { immediate: true });

// ─── Analytics — section view ─────────────────────────────────────────────────

const activeSection = ref('demonstracao');

function handleSectionChange(id: string) {
  activeSection.value = id;
  track('docs_section_viewed', {
    section_id: id,
    component_name: 'alert',
    locale: locale.value,
  });
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

// ─── IntersectionObserver ─────────────────────────────────────────────────────

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) { handleSectionChange(entry.target.id); break; }
      }
    },
    { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
  );
  allSectionIds.value.forEach((id) => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
  onUnmounted(() => observer.disconnect());
});

// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";`;
const codeImportWithIcon = `import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-vue-next";`;

const codeDefault = `<Alert>
  <Info aria-hidden="true" class="h-4 w-4" />
  <AlertTitle>Atenção</AlertTitle>
  <AlertDescription>
    Suas alterações serão aplicadas na próxima sessão.
  </AlertDescription>
</Alert>`;

const codeDestructive = `<Alert variant="destructive">
  <AlertCircle aria-hidden="true" class="h-4 w-4" />
  <AlertTitle>Erro ao salvar</AlertTitle>
  <AlertDescription>
    Não foi possível salvar. Verifique sua conexão e tente novamente.
  </AlertDescription>
</Alert>`;

const codeSuccess = `<Alert class="bg-success/10 text-success border-success/30">
  <CheckCircle2 aria-hidden="true" class="h-4 w-4" />
  <AlertTitle>Perfil atualizado</AlertTitle>
  <AlertDescription>
    Suas informações foram salvas com sucesso.
  </AlertDescription>
</Alert>`;

const codeWarning = `<Alert class="bg-warning/10 text-warning border-warning/30">
  <TriangleAlert aria-hidden="true" class="h-4 w-4" />
  <AlertTitle>Assinatura expirando</AlertTitle>
  <AlertDescription>
    Sua assinatura expira em 3 dias. Renove para evitar interrupções.
  </AlertDescription>
</Alert>`;

const codeWithoutTitle = `<Alert>
  <Info aria-hidden="true" class="h-4 w-4" />
  <AlertDescription>
    Suas alterações serão aplicadas na próxima sessão.
  </AlertDescription>
</Alert>`;

const codeCustomizationTokens = `/* Em globals.css — definir tokens semânticos */
:root {
  --success: 142 76% 36%;
  --warning: 38 92% 50%;
}

.dark {
  --success: 142 69% 58%;
  --warning: 48 96% 53%;
}`;

const interfaceCode = `// Alert
interface AlertProps {
  variant?: 'default' | 'destructive';
  class?: string;
}

// AlertTitle / AlertDescription aceitam atributos HTML nativos`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
  tContent('anatomy.item4'),
]);

const variantItems = computed(() => [
  { name: 'default',     description: tContent('variants.items.default'),                code: codeDefault      },
  { name: 'destructive', description: stripHtml(tContent('variants.items.destructive')), code: codeDestructive  },
  { name: 'success',     description: stripHtml(tContent('variants.items.success')),     code: codeSuccess      },
  { name: 'warning',     description: stripHtml(tContent('variants.items.warning')),     code: codeWarning      },
  { name: tContent('states.withoutTitle.label'), description: tContent('states.withoutTitle.behavior'), code: codeWithoutTitle },
]);

const stateItems = computed(() => [
  { label: tContent('states.complete.label'),      trigger: stripHtml(tContent('states.complete.trigger')),      behavior: tContent('states.complete.behavior')                     },
  { label: tContent('states.withoutTitle.label'),  trigger: stripHtml(tContent('states.withoutTitle.trigger')),  behavior: tContent('states.withoutTitle.behavior')                 },
  { label: tContent('states.withoutIcon.label'),   trigger: tContent('states.withoutIcon.trigger'),              behavior: tContent('states.withoutIcon.behavior')                  },
  { label: tContent('states.dynamicInsert.label'), trigger: tContent('states.dynamicInsert.trigger'),            behavior: stripHtml(tContent('states.dynamicInsert.behavior'))    },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'), type: tContent('props.table.type'),
  default: tContent('props.table.default'), required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const alertPropItems = computed(() => [
  { name: 'variant', type: '"default" | "destructive"', defaultValue: '"default"', required: 'Não', description: stripHtml(tContent('props.table.variant'))  },
  { name: 'class',   type: 'string',                    defaultValue: '—',         required: 'Não', description: tContent('props.table.className')             },
]);

const slotPropItems = computed(() => [
  { name: 'default slot', type: 'VNode', defaultValue: '—', required: 'Sim', description: tContent('props.table.children') },
]);

const tokenRows = computed(() => [
  { token: '--background',  value: 'bg-background',                                description: tContent('tokens.table.background')        },
  { token: '--foreground',  value: 'text-foreground',                              description: tContent('tokens.table.foreground')        },
  { token: '--border',      value: 'border',                                       description: tContent('tokens.table.border')            },
  { token: '--destructive', value: 'border-destructive/50',                        description: tContent('tokens.table.destructiveBorder') },
  { token: '--destructive', value: 'text-destructive',                             description: tContent('tokens.table.destructiveText')   },
  { token: '--success',     value: 'bg-success/10 text-success border-success/30', description: tContent('tokens.table.success')           },
  { token: '--warning',     value: 'bg-warning/10 text-warning border-warning/30', description: tContent('tokens.table.warning')           },
  { token: '--radius',      value: 'rounded-lg',                                   description: tContent('tokens.table.radius')            },
]);

const accessibilityItems = computed(() => [
  tContent('accessibility.item1'), tContent('accessibility.item2'),
  tContent('accessibility.item3'), tContent('accessibility.item4'), tContent('accessibility.item5'),
]);

const keyboardItems = computed(() => [
  { key: 'Tab',   description: tContent('accessibility.keyboard.tab')        },
  { key: 'Enter', description: tContent('accessibility.keyboard.enter')      },
  { key: '—',     description: tContent('accessibility.keyboard.noKeyboard') },
]);

const relatedItems = computed(() => [
  { name: 'Sonner',      description: tContent('related.sonner'),      path: '?path=/docs/ui-sonner--docs'      },
  { name: 'AlertDialog', description: tContent('related.alertDialog'), path: '?path=/docs/ui-alertdialog--docs' },
  { name: 'Badge',       description: tContent('related.badge'),       path: '?path=/docs/ui-badge--docs'       },
  { name: 'Progress',    description: tContent('related.progress'),    path: '?path=/docs/ui-progress--docs'    },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.tip1') },
  { title: '', content: tContent('notes.tip2') },
  { title: '', content: tContent('notes.tip3') },
]);

const analyticsItems = computed(() => [
  { event: tContent('analytics.table.dismiss'),       trigger: tContent('analytics.table.dismissTrigger'),       payload: tContent('analytics.table.dismissPayload')       },
  { event: tContent('analytics.table.pageView'),      trigger: tContent('analytics.table.pageViewTrigger'),      payload: tContent('analytics.table.pageViewPayload')      },
  { event: tContent('analytics.table.sectionViewed'), trigger: tContent('analytics.table.sectionViewedTrigger'), payload: tContent('analytics.table.sectionViewedPayload') },
  { event: tContent('analytics.table.langSwitch'),    trigger: tContent('analytics.table.langSwitchTrigger'),    payload: tContent('analytics.table.langSwitchPayload')    },
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
]);

const visualTestItems = computed(() => [
  { story: tContent('testes.visual.item1.story'), priority: localPriority(tContent('testes.visual.item1.priority')) },
  { story: tContent('testes.visual.item2.story'), priority: localPriority(tContent('testes.visual.item2.priority')) },
  { story: tContent('testes.visual.item3.story'), priority: localPriority(tContent('testes.visual.item3.priority')) },
  { story: tContent('testes.visual.item4.story'), priority: localPriority(tContent('testes.visual.item4.priority')) },
]);
</script>

<template>
  <div class="ds-docs p-8 max-w-5xl mx-auto">

    <DocsHeader
      :title="tContent('title')"
      :description="tContent('description')"
      :category="tContent('category')"
      :type="tContent('type')"
      install-note="npx shadcn-vue@latest add alert"
    />

    <div class="flex gap-16 items-start">
      <nav
        aria-label="Navegação das seções do componente"
        class="sticky top-8 w-52 shrink-0 self-start space-y-5"
      >
        <DocsNav
          :groups="navGroups"
          :active-section="activeSection"
          @navigate="(id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })"
        />
      </nav>

      <div class="ds-docs flex-1 min-w-0 space-y-12">

        <!-- ── Demonstração ───────────────────────────────────────────── -->
        <DocsDemonstration :title="tContent('demonstration.title')">
          <div class="w-full space-y-3">
            <Alert>
              <Info class="h-4 w-4" aria-hidden="true" />
              <AlertTitle>{{ tContent('demonstration.labels.infoTitle') }}</AlertTitle>
              <AlertDescription>{{ tContent('demonstration.labels.infoDesc') }}</AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertCircle class="h-4 w-4" aria-hidden="true" />
              <AlertTitle>{{ tContent('demonstration.labels.errorTitle') }}</AlertTitle>
              <AlertDescription>{{ tContent('demonstration.labels.errorDesc') }}</AlertDescription>
            </Alert>
            <Alert class="bg-success/10 text-success border-success/30">
              <CheckCircle2 class="h-4 w-4" aria-hidden="true" />
              <AlertTitle>{{ tContent('demonstration.labels.successTitle') }}</AlertTitle>
              <AlertDescription>{{ tContent('demonstration.labels.successDesc') }}</AlertDescription>
            </Alert>
            <Alert class="bg-warning/10 text-warning border-warning/30">
              <TriangleAlert class="h-4 w-4" aria-hidden="true" />
              <AlertTitle>{{ tContent('demonstration.labels.warningTitle') }}</AlertTitle>
              <AlertDescription>{{ tContent('demonstration.labels.warningDesc') }}</AlertDescription>
            </Alert>
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
            items: [tContent('usage.guidelines.item1'), tContent('usage.guidelines.item2'), tContent('usage.guidelines.item3'), tContent('usage.guidelines.item4')],
          }"
          :scenarios="{
            title: tContent('usage.scenarios.title'),
            cols: { scenario: tContent('usage.scenarios.cols.scenario'), use: tContent('usage.scenarios.cols.use'), alternative: tContent('usage.scenarios.cols.alternative') },
            items: [
              { s: tContent('usage.scenarios.item1.s'), u: tContent('usage.scenarios.item1.u'), a: tContent('usage.scenarios.item1.a') },
              { s: tContent('usage.scenarios.item2.s'), u: tContent('usage.scenarios.item2.u'), a: tContent('usage.scenarios.item2.a') },
              { s: tContent('usage.scenarios.item3.s'), u: tContent('usage.scenarios.item3.u'), a: tContent('usage.scenarios.item3.a') },
              { s: tContent('usage.scenarios.item4.s'), u: tContent('usage.scenarios.item4.u'), a: tContent('usage.scenarios.item4.a') },
            ],
          }"
          :ux-writing="{
            title: tContent('usage.uxWriting.title'),
            cols: { element: tContent('usage.uxWriting.table.element'), rules: tContent('usage.uxWriting.table.rules'), do: tContent('usage.uxWriting.table.correct'), dont: tContent('usage.uxWriting.table.avoid') },
            items: [
              { element: tContent('usage.uxWriting.table.title.name'), rules: tContent('usage.uxWriting.table.title.format'), do: tContent('usage.uxWriting.table.title.good'), dont: tContent('usage.uxWriting.table.title.bad') },
              { element: tContent('usage.uxWriting.table.description.name'), rules: tContent('usage.uxWriting.table.description.format'), do: tContent('usage.uxWriting.table.description.good'), dont: tContent('usage.uxWriting.table.description.bad') },
              { element: tContent('usage.uxWriting.table.error.name'), rules: tContent('usage.uxWriting.table.error.format'), do: tContent('usage.uxWriting.table.error.good'), dont: tContent('usage.uxWriting.table.error.bad') },
              { element: tContent('usage.uxWriting.table.warning.name'), rules: tContent('usage.uxWriting.table.warning.format'), do: tContent('usage.uxWriting.table.warning.good'), dont: tContent('usage.uxWriting.table.warning.bad') },
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
            <Alert>
              <AlertCircle class="h-4 w-4" aria-hidden="true" />
              <AlertTitle>Erro ao salvar</AlertTitle>
              <AlertDescription>Não foi possível salvar. Verifique sua conexão.</AlertDescription>
            </Alert>
          </template>
          <template #dont-preview-0>
            <Alert><AlertDescription>Salvo!</AlertDescription></Alert>
          </template>
          <template #do-preview-1>
            <Alert variant="destructive">
              <AlertCircle class="h-4 w-4" aria-hidden="true" />
              <AlertTitle>Erro ao salvar</AlertTitle>
              <AlertDescription>Verifique sua conexão.</AlertDescription>
            </Alert>
          </template>
          <template #dont-preview-1>
            <Alert variant="destructive">
              <AlertTitle>Erro ao salvar</AlertTitle>
              <AlertDescription>Verifique sua conexão.</AlertDescription>
            </Alert>
          </template>
        </DocsDoDont>

        <!-- ── Importação ─────────────────────────────────────────────── -->
        <DocsImport
          :title="tContent('import.title')"
          :description="tContent('import.basic')"
          :code="codeImportBasic"
          :secondary-description="tContent('import.withIcon')"
          :secondary-code="codeImportWithIcon"
        />

        <!-- ── Variantes ──────────────────────────────────────────────── -->
        <DocsVariants :title="tContent('variants.title')" :items="variantItems">
          <template #variant-preview-0>
            <Alert class="w-full">
              <Info class="h-4 w-4" aria-hidden="true" />
              <AlertTitle>{{ tContent('demonstration.labels.infoTitle') }}</AlertTitle>
              <AlertDescription>{{ tContent('demonstration.labels.infoDesc') }}</AlertDescription>
            </Alert>
          </template>
          <template #variant-preview-1>
            <Alert variant="destructive" class="w-full">
              <AlertCircle class="h-4 w-4" aria-hidden="true" />
              <AlertTitle>{{ tContent('demonstration.labels.errorTitle') }}</AlertTitle>
              <AlertDescription>{{ tContent('demonstration.labels.errorDesc') }}</AlertDescription>
            </Alert>
          </template>
          <template #variant-preview-2>
            <Alert class="w-full bg-success/10 text-success border-success/30">
              <CheckCircle2 class="h-4 w-4" aria-hidden="true" />
              <AlertTitle>{{ tContent('demonstration.labels.successTitle') }}</AlertTitle>
              <AlertDescription>{{ tContent('demonstration.labels.successDesc') }}</AlertDescription>
            </Alert>
          </template>
          <template #variant-preview-3>
            <Alert class="w-full bg-warning/10 text-warning border-warning/30">
              <TriangleAlert class="h-4 w-4" aria-hidden="true" />
              <AlertTitle>{{ tContent('demonstration.labels.warningTitle') }}</AlertTitle>
              <AlertDescription>{{ tContent('demonstration.labels.warningDesc') }}</AlertDescription>
            </Alert>
          </template>
          <template #variant-preview-4>
            <Alert class="w-full">
              <Info class="h-4 w-4" aria-hidden="true" />
              <AlertDescription>{{ tContent('demonstration.labels.infoDesc') }}</AlertDescription>
            </Alert>
          </template>
        </DocsVariants>

        <!-- ── Configurações (States) ──────────────────────────────────── -->
        <DocsStates
          :title="tContent('states.title')"
          :cols="{ state: tContent('states.cols.state'), trigger: tContent('states.cols.trigger'), behavior: tContent('states.cols.behavior') }"
          :items="stateItems"
        />

        <!-- ── Propriedades ───────────────────────────────────────────── -->
        <DocsProps
          :title="tContent('props.title')"
          :tables="[
            { title: tContent('props.alertTitle'),      cols: propCols, items: alertPropItems },
            { title: tContent('props.alertTitleTitle'), cols: propCols, items: slotPropItems  },
            { title: tContent('props.alertDescTitle'),  cols: propCols, items: slotPropItems  },
          ]"
          :interface-code="interfaceCode"
          :extensibility-title="tContent('props.extensibilityTitle')"
          :extensibility-notes="tContent('props.extensibility')"
        />

        <!-- ── Tokens ─────────────────────────────────────────────────── -->
        <DocsTokens
          :title="tContent('tokens.title')"
          :cols="{ token: tContent('tokens.table.token'), value: tContent('tokens.table.class'), description: tContent('tokens.table.part') }"
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
          :cols="{ event: tContent('analytics.table.event'), trigger: tContent('analytics.table.trigger'), payload: tContent('analytics.table.payload') }"
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

      </div>
    </div>
  </div>
</template>
