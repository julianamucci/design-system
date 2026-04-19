<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ChevronRight, Download, Loader2 } from 'lucide-vue-next';
import DocsNav from '@/components/docs/shared/DocsNav.vue';
import uiTranslations from '@/i18n/ui.json';
import buttonTranslations from '@shared/content/button/translations.json';

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
const { t: tContent, locale } = useTranslation(buttonTranslations);

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
  componentSlug: 'button',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'button',
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
    component_name: 'button',
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
      { id: 'tamanhos',     label: tNav('nav.sizes')    },
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

const codeImportBasic = `import { Button } from "@/components/ui/button";`;
const codeImportWithIcon = `import { Button } from "@/components/ui/button";
import { Plus } from "lucide-vue-next";`;

const codeDefault = `<Button>Salvar</Button>`;
const codeDestructive = `<Button variant="destructive">Excluir conta</Button>`;
const codeOutline = `<Button variant="outline">Cancelar</Button>`;
const codeSecondary = `<Button variant="secondary">Ver detalhes</Button>`;
const codeGhost = `<Button variant="ghost">Fechar</Button>`;
const codeLink = `<Button variant="link">Saiba mais</Button>`;

const codeSizeDefault = `<Button>Padrão</Button>`;
const codeSizeSm = `<Button size="sm">Pequeno</Button>`;
const codeSizeLg = `<Button size="lg">Grande</Button>`;
const codeSizeIcon = `<Button size="icon" aria-label="Adicionar">
  <Plus aria-hidden="true" />
</Button>`;
const codeSizeIconSm = `<Button size="icon-sm" aria-label="Adicionar">
  <Plus aria-hidden="true" />
</Button>`;
const codeSizeIconLg = `<Button size="icon-lg" aria-label="Adicionar">
  <Plus aria-hidden="true" />
</Button>`;

const codeCustomizationTokens = `/* Em globals.css — sobrescrever tokens de cor */
:root {
  --primary: 221 83% 53%;
  --primary-foreground: 0 0% 100%;
  --radius: 0.5rem;
}

.dark {
  --primary: 217 91% 60%;
}`;

const interfaceCode = `interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';
  asChild?: boolean;
  disabled?: boolean;
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
  { name: 'default',     description: stripHtml(tContent('variants.items.default')),     code: codeDefault     },
  { name: 'destructive', description: stripHtml(tContent('variants.items.destructive')), code: codeDestructive },
  { name: 'outline',     description: stripHtml(tContent('variants.items.outline')),     code: codeOutline     },
  { name: 'secondary',   description: stripHtml(tContent('variants.items.secondary')),   code: codeSecondary   },
  { name: 'ghost',       description: stripHtml(tContent('variants.items.ghost')),       code: codeGhost       },
  { name: 'link',        description: stripHtml(tContent('variants.items.link')),        code: codeLink        },
]);

const sizeItems = computed(() => [
  { name: 'default',  description: stripHtml(tContent('variants.sizes.default')),  code: codeSizeDefault  },
  { name: 'sm',       description: stripHtml(tContent('variants.sizes.sm')),       code: codeSizeSm       },
  { name: 'lg',       description: stripHtml(tContent('variants.sizes.lg')),       code: codeSizeLg       },
  { name: 'icon',     description: stripHtml(tContent('variants.sizes.icon')),     code: codeSizeIcon     },
  { name: 'icon-sm',  description: stripHtml(tContent('variants.sizes.iconSm')),   code: codeSizeIconSm   },
  { name: 'icon-lg',  description: stripHtml(tContent('variants.sizes.iconLg')),   code: codeSizeIconLg   },
]);

const stateItems = computed(() => [
  { label: tContent('states.default.label'),      trigger: tContent('states.default.trigger'),      behavior: tContent('states.default.behavior')      },
  { label: tContent('states.hover.label'),        trigger: tContent('states.hover.trigger'),        behavior: tContent('states.hover.behavior')        },
  { label: tContent('states.focusVisible.label'), trigger: tContent('states.focusVisible.trigger'), behavior: tContent('states.focusVisible.behavior') },
  { label: tContent('states.disabled.label'),     trigger: tContent('states.disabled.trigger'),     behavior: tContent('states.disabled.behavior')     },
  { label: tContent('states.loading.label'),      trigger: tContent('states.loading.trigger'),      behavior: tContent('states.loading.behavior')      },
  { label: tContent('states.invalid.label'),      trigger: tContent('states.invalid.trigger'),      behavior: tContent('states.invalid.behavior')      },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'), type: tContent('props.table.type'),
  default: tContent('props.table.default'), required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const buttonPropItems = computed(() => [
  { name: 'variant',  type: '"default" | "destructive" | "outline" | "secondary" | "ghost" | "link"', defaultValue: '"default"', required: 'Não', description: stripHtml(tContent('props.table.variant')) },
  { name: 'size',     type: '"default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg"',               defaultValue: '"default"', required: 'Não', description: stripHtml(tContent('props.table.size')) },
  { name: 'asChild',  type: 'boolean',                                                                defaultValue: 'false',     required: 'Não', description: stripHtml(tContent('props.table.asChild')) },
  { name: 'disabled', type: 'boolean',                                                                defaultValue: 'false',     required: 'Não', description: stripHtml(tContent('props.table.disabled')) },
  { name: 'type',     type: '"button" | "submit" | "reset"',                                          defaultValue: '"button"',  required: 'Não', description: stripHtml(tContent('props.table.type')) },
  { name: '@click',   type: '(event: MouseEvent) => void',                                            defaultValue: '—',         required: 'Não', description: stripHtml(tContent('props.table.onClick')) },
  { name: 'class',    type: 'string',                                                                 defaultValue: '—',         required: 'Não', description: stripHtml(tContent('props.table.className')) },
]);

const tokenRows = computed(() => [
  { token: '--primary',            value: 'bg-primary',            description: tContent('tokens.table.primary')            },
  { token: '--primary-foreground', value: 'text-primary-foreground', description: tContent('tokens.table.primaryForeground') },
  { token: '--secondary',          value: 'bg-secondary',          description: tContent('tokens.table.secondary')          },
  { token: '--destructive',        value: 'bg-destructive',        description: tContent('tokens.table.destructive')        },
  { token: '--border',             value: 'border',                description: tContent('tokens.table.border')             },
  { token: '--accent',             value: 'bg-accent',             description: tContent('tokens.table.accent')             },
  { token: '--ring',               value: 'focus-visible:ring-ring/50', description: tContent('tokens.table.ring')          },
  { token: '--radius',             value: 'rounded-md',            description: tContent('tokens.table.radius')             },
]);

const accessibilityItems = computed(() => [
  tContent('accessibility.item1'), tContent('accessibility.item2'),
  tContent('accessibility.item3'), tContent('accessibility.item4'), tContent('accessibility.item5'),
]);

const keyboardItems = computed(() => [
  { key: 'Tab',    description: tContent('accessibility.keyboard.tab')    },
  { key: 'Enter',  description: tContent('accessibility.keyboard.enter')  },
  { key: 'Space',  description: tContent('accessibility.keyboard.space')  },
  { key: 'Escape', description: tContent('accessibility.keyboard.escape') },
]);

const relatedItems = computed(() => [
  { name: 'Toggle',      description: tContent('related.toggle'),      path: '?path=/docs/ui-toggle--docs'      },
  { name: 'Switch',      description: tContent('related.switch'),      path: '?path=/docs/ui-switch--docs'      },
  { name: 'Link',        description: tContent('related.link'),        path: '?path=/docs/foundations-link--docs' },
  { name: 'Form',        description: tContent('related.form'),        path: '?path=/docs/ui-form--docs'        },
  { name: 'Dialog',      description: tContent('related.dialog'),      path: '?path=/docs/ui-dialog--docs'      },
  { name: 'AlertDialog', description: tContent('related.alertDialog'), path: '?path=/docs/ui-alertdialog--docs' },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.tip1') },
  { title: '', content: tContent('notes.tip2') },
  { title: '', content: tContent('notes.tip3') },
]);

const analyticsItems = computed(() => [
  { event: tContent('analytics.table.click'),         trigger: tContent('analytics.table.clickTrigger'),         payload: tContent('analytics.table.clickPayload')         },
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
  { criterion: tContent('testes.accessibility.item5.criterion'), level: tContent('testes.accessibility.item5.level'), how: tContent('testes.accessibility.item5.how') },
]);

const visualTestItems = computed(() => [
  { story: tContent('testes.visual.item1.story'), priority: localPriority(tContent('testes.visual.item1.priority')) },
  { story: tContent('testes.visual.item2.story'), priority: localPriority(tContent('testes.visual.item2.priority')) },
  { story: tContent('testes.visual.item3.story'), priority: localPriority(tContent('testes.visual.item3.priority')) },
  { story: tContent('testes.visual.item4.story'), priority: localPriority(tContent('testes.visual.item4.priority')) },
  { story: tContent('testes.visual.item5.story'), priority: localPriority(tContent('testes.visual.item5.priority')) },
]);

function handleDemoClick(variant: string) {
  track('button_click', {
    component: 'button',
    variant,
    location: 'docs_demonstration',
  });
}
</script>

<template>
  <div class="ds-docs p-8 max-w-5xl mx-auto">

    <DocsHeader
      :title="tContent('title')"
      :description="tContent('description')"
      :category="tContent('category')"
      :type="tContent('type')"
      install-note="npx shadcn-vue@latest add button"
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
          <div class="flex flex-wrap gap-3">
            <Button @click="handleDemoClick('default')">
              {{ tContent('demonstration.labels.primary') }}
            </Button>
            <Button variant="destructive" @click="handleDemoClick('destructive')">
              {{ tContent('demonstration.labels.destructive') }}
            </Button>
            <Button variant="outline" @click="handleDemoClick('outline')">
              {{ tContent('demonstration.labels.outline') }}
            </Button>
            <Button variant="secondary" @click="handleDemoClick('secondary')">
              {{ tContent('demonstration.labels.secondary') }}
            </Button>
            <Button variant="ghost" @click="handleDemoClick('ghost')">
              {{ tContent('demonstration.labels.ghost') }}
            </Button>
            <Button variant="link" @click="handleDemoClick('link')">
              {{ tContent('demonstration.labels.link') }}
            </Button>
            <Button @click="handleDemoClick('withIcon')">
              <Plus aria-hidden="true" />
              {{ tContent('demonstration.labels.withIcon') }}
            </Button>
            <Button size="icon" :aria-label="tContent('demonstration.labels.iconOnly')" @click="handleDemoClick('iconOnly')">
              <Plus aria-hidden="true" />
            </Button>
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
              { element: tContent('usage.uxWriting.table.primary.name'),     rules: tContent('usage.uxWriting.table.primary.format'),     do: tContent('usage.uxWriting.table.primary.good'),     dont: tContent('usage.uxWriting.table.primary.bad') },
              { element: tContent('usage.uxWriting.table.destructive.name'), rules: tContent('usage.uxWriting.table.destructive.format'), do: tContent('usage.uxWriting.table.destructive.good'), dont: tContent('usage.uxWriting.table.destructive.bad') },
              { element: tContent('usage.uxWriting.table.cancel.name'),      rules: tContent('usage.uxWriting.table.cancel.format'),      do: tContent('usage.uxWriting.table.cancel.good'),      dont: tContent('usage.uxWriting.table.cancel.bad') },
            ],
          }"
          :do="{ title: tContent('usage.do.title'), items: [tContent('usage.do.item1'), tContent('usage.do.item2'), tContent('usage.do.item3'), tContent('usage.do.item4')] }"
          :dont="{ title: tContent('usage.dont.title'), items: [tContent('usage.dont.item1'), tContent('usage.dont.item2'), tContent('usage.dont.item3'), tContent('usage.dont.item4')] }"
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
            <Button>Salvar alterações</Button>
          </template>
          <template #dont-preview-0>
            <Button>Clique aqui</Button>
          </template>
          <template #do-preview-1>
            <div class="flex gap-2">
              <Button variant="outline">Cancelar</Button>
              <Button>Confirmar</Button>
            </div>
          </template>
          <template #dont-preview-1>
            <div class="flex gap-2">
              <Button>Cancelar</Button>
              <Button>Confirmar</Button>
            </div>
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
          <template #variant-preview-0><Button>{{ tContent('demonstration.labels.primary') }}</Button></template>
          <template #variant-preview-1><Button variant="destructive">{{ tContent('demonstration.labels.destructive') }}</Button></template>
          <template #variant-preview-2><Button variant="outline">{{ tContent('demonstration.labels.outline') }}</Button></template>
          <template #variant-preview-3><Button variant="secondary">{{ tContent('demonstration.labels.secondary') }}</Button></template>
          <template #variant-preview-4><Button variant="ghost">{{ tContent('demonstration.labels.ghost') }}</Button></template>
          <template #variant-preview-5><Button variant="link">{{ tContent('demonstration.labels.link') }}</Button></template>
        </DocsVariants>

        <!-- ── Tamanhos ──────────────────────────────────────────────── -->
        <DocsVariants :title="tContent('variants.sizesTitle')" :items="sizeItems" id="tamanhos">
          <template #variant-preview-0><Button>Padrão</Button></template>
          <template #variant-preview-1><Button size="sm">Pequeno</Button></template>
          <template #variant-preview-2><Button size="lg">Grande</Button></template>
          <template #variant-preview-3>
            <Button size="icon" aria-label="Adicionar">
              <Plus aria-hidden="true" />
            </Button>
          </template>
          <template #variant-preview-4>
            <Button size="icon-sm" aria-label="Adicionar">
              <Plus aria-hidden="true" />
            </Button>
          </template>
          <template #variant-preview-5>
            <Button size="icon-lg" aria-label="Adicionar">
              <Plus aria-hidden="true" />
            </Button>
          </template>
        </DocsVariants>

        <!-- ── Estados ───────────────────────────────────────────────── -->
        <DocsStates
          :title="tContent('states.title')"
          :cols="{ state: tContent('states.cols.state'), trigger: tContent('states.cols.trigger'), behavior: tContent('states.cols.behavior') }"
          :items="stateItems"
        />

        <!-- ── Propriedades ───────────────────────────────────────────── -->
        <DocsProps
          :title="tContent('props.title')"
          :tables="[
            { title: tContent('props.buttonTitle'), cols: propCols, items: buttonPropItems },
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
