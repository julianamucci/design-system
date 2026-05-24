<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Info, AlertTriangle, CheckCircle2 } from 'lucide-vue-next';
import { Badge } from '@/components/ui/badge';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import accordionTranslations from '@shared/content/accordion/translations.json';

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

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(accordionTranslations);

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
  componentSlug: 'accordion',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'accordion',
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
      { id: 'modos',        label: tNav('nav.variants') },
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
    component_name: 'accordion',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImport = `import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";`;

const codeSingle = `<Accordion type="single" :collapsible="true" default-value="item-1" class="w-full">
  <AccordionItem value="item-1">
    <AccordionTrigger>Como faço para redefinir minha senha?</AccordionTrigger>
    <AccordionContent>
      Acesse a tela de login e clique em "Esqueci minha senha".
    </AccordionContent>
  </AccordionItem>
</Accordion>`;

const codeMultiple = `<Accordion type="multiple" class="w-full">
  <AccordionItem value="especificacoes">
    <AccordionTrigger>Especificações técnicas</AccordionTrigger>
    <AccordionContent>CPU: Intel Core i7-12700, RAM: 16GB DDR5</AccordionContent>
  </AccordionItem>
  <AccordionItem value="garantia">
    <AccordionTrigger>Garantia e suporte</AccordionTrigger>
    <AccordionContent>24 meses de garantia de fábrica.</AccordionContent>
  </AccordionItem>
</Accordion>`;

const codeControlled = `<script setup lang="ts">
import { ref } from 'vue';
const openItem = ref('item-1');
<\/script>

<Accordion type="single" :collapsible="true" :value="openItem" @update:model-value="openItem = $event">
  <AccordionItem value="item-1">
    <AccordionTrigger>Item 1 — controlado</AccordionTrigger>
    <AccordionContent>Estado gerenciado externamente.</AccordionContent>
  </AccordionItem>
</Accordion>`;

const codeCustomization = `/* Aumentar separador entre itens */
.my-accordion .accordion-item {
  border-bottom-width: 2px;
  border-color: hsl(var(--border) / 60%);
}`;

const interfaceCode = `interface AccordionProps {
  type: 'single' | 'multiple';
  collapsible?: boolean;
  defaultValue?: string | string[];
  value?: string | string[];
  class?: string;
}`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
  tContent('anatomy.item4'),
]);

type TranslationLocale = typeof accordionTranslations;
type LocaleKey = keyof TranslationLocale;

function getPropItems(tableKey: string) {
  return computed(() => {
    const loc = locale.value as LocaleKey;
    const table = (accordionTranslations as unknown as Record<string, Record<string, Record<string, Record<string, Record<string, string>>>>>)[loc]?.props?.[tableKey]?.items ?? {};
    return Object.values(table).map((v: any) => ({
      name: v.name,
      type: v.type,
      defaultValue: v.default,
      required: v.required,
      description: stripHtml(v.description),
    }));
  });
}

const accordionPropItems = getPropItems('accordion');
const itemPropItems = getPropItems('item');
const triggerPropItems = getPropItems('trigger');
const contentPropItems = getPropItems('content');

const propCols = computed(() => ({
  prop: tContent('props.accordion.prop'),
  type: tContent('props.accordion.type'),
  default: tContent('props.accordion.default'),
  required: tContent('props.accordion.required'),
  description: tContent('props.accordion.description'),
}));

const tokenRows = computed(() => {
  const loc = locale.value as LocaleKey;
  const items = (accordionTranslations as unknown as Record<string, Record<string, Record<string, Record<string, string>>>>)[loc]?.tokens?.items ?? {};
  return Object.values(items).map((v: any) => ({
    token: v.token,
    value: v.class,
    description: v.part,
  }));
});

const stateItems = computed(() => [
  { label: tContent('states.closed.label'),    trigger: '—',                      behavior: tContent('states.closed.description')              },
  { label: tContent('states.open.label'),      trigger: 'Click / Enter / Space',  behavior: tContent('states.open.description')                },
  { label: tContent('states.disabled.label'),  trigger: '—',                      behavior: stripHtml(tContent('states.disabled.description')) },
  { label: tContent('states.focused.label'),   trigger: 'Tab',                    behavior: tContent('states.focused.description')             },
]);

const modeItems = computed(() => [
  { name: tContent('variants.single.label'),      description: stripHtml(tContent('variants.single.description')),      code: codeSingle      },
  { name: tContent('variants.multiple.label'),    description: stripHtml(tContent('variants.multiple.description')),    code: codeMultiple    },
  { name: tContent('variants.controlled.label'),  description: stripHtml(tContent('variants.controlled.description')),  code: codeControlled  },
  { name: tContent('variants.defaultOpen.label'), description: stripHtml(tContent('variants.defaultOpen.description')), code: codeSingle      },
]);

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.iconTrigger.name'),
    description: tContent('variants.compositions.iconTrigger.description'),
    useWhen: tContent('variants.compositions.iconTrigger.use'),
    code: `<Accordion type="single" :collapsible="true" class="w-full max-w-lg">
  <AccordionItem value="info">
    <AccordionTrigger>
      <Info class="h-4 w-4" aria-hidden="true" />
      Informações gerais
    </AccordionTrigger>
    <AccordionContent>Detalhes sobre a conta e preferências.</AccordionContent>
  </AccordionItem>
</Accordion>`,
  },
  {
    name: tContent('variants.compositions.badgeTrigger.name'),
    description: tContent('variants.compositions.badgeTrigger.description'),
    useWhen: tContent('variants.compositions.badgeTrigger.use'),
    code: `<Accordion type="single" :collapsible="true" class="w-full max-w-lg">
  <AccordionItem value="novo">
    <AccordionTrigger>
      Novidades da versão
      <Badge>Novo</Badge>
    </AccordionTrigger>
    <AccordionContent>Lista das funcionalidades adicionadas nesta release.</AccordionContent>
  </AccordionItem>
</Accordion>`,
  },
  {
    name: tContent('variants.compositions.richContent.name'),
    description: tContent('variants.compositions.richContent.description'),
    useWhen: tContent('variants.compositions.richContent.use'),
    code: `<Accordion type="multiple" class="w-full max-w-lg">
  <AccordionItem value="specs">
    <AccordionTrigger>Especificações</AccordionTrigger>
    <AccordionContent>
      <table class="w-full text-sm">
        <tr><td>CPU</td><td>Intel i7</td></tr>
        <tr><td>RAM</td><td>16GB</td></tr>
      </table>
    </AccordionContent>
  </AccordionItem>
</Accordion>`,
  },
  {
    name: tContent('variants.compositions.faq.name'),
    description: tContent('variants.compositions.faq.description'),
    useWhen: tContent('variants.compositions.faq.use'),
    code: `<h2>Perguntas frequentes</h2>
<Accordion type="single" :collapsible="true" class="w-full max-w-lg">
  <AccordionItem value="senha">
    <AccordionTrigger>Como faço para redefinir minha senha?</AccordionTrigger>
    <AccordionContent>Acesse a tela de login e clique em "Esqueci minha senha".</AccordionContent>
  </AccordionItem>
</Accordion>`,
  },
]);

const keyboardItems = computed(() => [
  { key: 'Tab',        description: tContent('accessibility.keyboard.tab')       },
  { key: 'Shift+Tab',  description: tContent('accessibility.keyboard.shiftTab')  },
  { key: 'Enter',      description: tContent('accessibility.keyboard.enter')     },
  { key: 'Space',      description: tContent('accessibility.keyboard.space')     },
  { key: '↓',          description: tContent('accessibility.keyboard.arrowDown') },
  { key: '↑',          description: tContent('accessibility.keyboard.arrowUp')   },
]);

const accessibilityItems = computed(() => [
  tContent('accessibility.aria.ariaExpanded'),
  tContent('accessibility.aria.ariaControls'),
  tContent('accessibility.aria.role'),
  tContent('accessibility.aria.ariaLabelledBy'),
]);

const relatedItems = computed(() => [
  { name: tContent('related.collapsible.name'), description: tContent('related.collapsible.description'), path: `?path=/docs/${tContent('related.collapsible.href')}` },
  { name: tContent('related.tabs.name'),        description: tContent('related.tabs.description'),        path: `?path=/docs/${tContent('related.tabs.href')}`        },
  { name: tContent('related.sidebar.name'),     description: tContent('related.sidebar.description'),     path: `?path=/docs/${tContent('related.sidebar.href')}`     },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
  { title: '', content: tContent('notes.item5') },
]);

const analyticsItems = computed(() => [
  { event: tContent('analytics.events.expand.event'),   trigger: tContent('analytics.events.expand.trigger'),   payload: tContent('analytics.events.expand.payload')   },
  { event: tContent('analytics.events.collapse.event'), trigger: tContent('analytics.events.collapse.trigger'), payload: tContent('analytics.events.collapse.payload') },
]);

const functionalTestItems = computed(() => [1, 2, 3, 4, 5, 6].map(i => ({
  action:   tContent(`testes.functional.item${i}.action`),
  result:   tContent(`testes.functional.item${i}.result`),
  priority: localPriority(tContent(`testes.functional.item${i}.priority`)),
})));

const a11yTestItems = computed(() => [1, 2, 3, 4, 5].map(i => ({
  criterion: tContent(`testes.accessibility.item${i}.criterion`),
  level:     tContent(`testes.accessibility.item${i}.level`),
  how:       tContent(`testes.accessibility.item${i}.how`),
})));

const visualTestItems = computed(() => [1, 2, 3, 4, 5].map(i => ({
  story:    tContent(`testes.visual.item${i}.story`),
  priority: localPriority(tContent(`testes.visual.item${i}.priority`)),
})));

const a11yCritCols = computed(() => ({
  criterion: tNav('common.criterion'),
  level: 'WCAG',
  how: tNav('common.howToVerify'),
}));

// ─── Demo accordion tracking ──────────────────────────────────────────────────

const demoItems = computed(() => [
  { value: 'q1', q: tContent('demonstration.labels.q1'), a: tContent('demonstration.labels.a1') },
  { value: 'q2', q: tContent('demonstration.labels.q2'), a: tContent('demonstration.labels.a2') },
  { value: 'q3', q: tContent('demonstration.labels.q3'), a: tContent('demonstration.labels.a3') },
  { value: 'q4', q: tContent('demonstration.labels.q4'), a: tContent('demonstration.labels.a4') },
]);

function handleDemoTriggerClick(e: MouseEvent, label: string) {
  const target = e.currentTarget as HTMLElement;
  const isOpen = target.getAttribute('data-state') === 'closed';
  track(isOpen ? 'accordion_expand' : 'accordion_collapse', {
    component: 'accordion',
    label,
    location: 'docs_demonstration',
  });
}
</script>

<template>
  <DocsPageLayout :nav-groups="navGroups" :active-section="activeSection">
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
        install-note="npx shadcn-vue@latest add accordion"
      />
    </template>

        <!-- ── Demonstração ───────────────────────────────────────────── -->
        <DocsDemonstration :title="tContent('demonstration.title')">
          <Accordion type="single" :collapsible="true" class="w-full max-w-lg">
            <AccordionItem
              v-for="item in demoItems"
              :key="item.value"
              :value="item.value"
            >
              <AccordionTrigger @click="handleDemoTriggerClick($event, item.q)">
                {{ item.q }}
              </AccordionTrigger>
              <AccordionContent>{{ item.a }}</AccordionContent>
            </AccordionItem>
          </Accordion>
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
              { element: tContent('usage.uxWriting.table.trigger.name'), rules: tContent('usage.uxWriting.table.trigger.format'), do: tContent('usage.uxWriting.table.trigger.good'), dont: tContent('usage.uxWriting.table.trigger.bad') },
              { element: tContent('usage.uxWriting.table.triggerDoc.name'), rules: tContent('usage.uxWriting.table.triggerDoc.format'), do: tContent('usage.uxWriting.table.triggerDoc.good'), dont: tContent('usage.uxWriting.table.triggerDoc.bad') },
              { element: tContent('usage.uxWriting.table.content.name'), rules: tContent('usage.uxWriting.table.content.format'), do: tContent('usage.uxWriting.table.content.good'), dont: tContent('usage.uxWriting.table.content.bad') },
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
            <Accordion type="single" :collapsible="true" class="w-full max-w-xs text-sm">
              <AccordionItem value="faq">
                <AccordionTrigger>Como faço para redefinir minha senha?</AccordionTrigger>
                <AccordionContent>Acesse a tela de login e clique em "Esqueci minha senha".</AccordionContent>
              </AccordionItem>
            </Accordion>
          </template>
          <template #dont-preview-0>
            <Accordion type="single" :collapsible="true" class="w-full max-w-xs text-sm">
              <AccordionItem value="faq">
                <AccordionTrigger>Senha</AccordionTrigger>
                <AccordionContent>Informações sobre redefinição.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </template>
          <template #do-preview-1>
            <Accordion type="multiple" class="w-full max-w-xs text-sm">
              <AccordionItem value="s1">
                <AccordionTrigger>Especificações técnicas</AccordionTrigger>
                <AccordionContent>CPU, RAM, SSD.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="s2">
                <AccordionTrigger>Compatibilidade</AccordionTrigger>
                <AccordionContent>Windows 11, macOS, Linux.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </template>
          <template #dont-preview-1>
            <Accordion type="single" :collapsible="true" class="w-full max-w-xs text-sm">
              <AccordionItem value="s1">
                <AccordionTrigger>Expandir</AccordionTrigger>
                <AccordionContent>Conteúdo único.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </template>
        </DocsDoDont>

        <!-- ── Importação ─────────────────────────────────────────────── -->
        <DocsImport
          :title="tContent('import.title')"
          :description="tContent('import.note')"
          :code="codeImport"
        />

        <!-- ── Modos de Operação ──────────────────────────────────────── -->
        <DocsVariants id="modos" :title="tContent('variants.title')" :items="modeItems">
          <template #variant-preview-0>
            <Accordion type="single" :collapsible="true" default-value="item-1" class="w-full max-w-sm text-sm">
              <AccordionItem value="item-1">
                <AccordionTrigger>Pergunta 1</AccordionTrigger>
                <AccordionContent>Resposta objetiva em 1–2 linhas.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Pergunta 2</AccordionTrigger>
                <AccordionContent>Outro conteúdo aqui.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </template>
          <template #variant-preview-1>
            <Accordion type="multiple" class="w-full max-w-sm text-sm">
              <AccordionItem value="s1">
                <AccordionTrigger>Especificações técnicas</AccordionTrigger>
                <AccordionContent>CPU, RAM, SSD.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="s2">
                <AccordionTrigger>Compatibilidade</AccordionTrigger>
                <AccordionContent>Windows 11, macOS, Linux.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </template>
          <template #variant-preview-2>
            <Accordion type="single" :collapsible="true" default-value="item-1" class="w-full max-w-sm text-sm">
              <AccordionItem value="item-1">
                <AccordionTrigger>Item 1 — controlado</AccordionTrigger>
                <AccordionContent>Estado gerenciado externamente via value + onValueChange.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Item 2 — controlado</AccordionTrigger>
                <AccordionContent>Útil para sincronizar com URL ou outro estado.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </template>
          <template #variant-preview-3>
            <Accordion type="single" :collapsible="true" default-value="item-1" class="w-full max-w-sm text-sm">
              <AccordionItem value="item-1">
                <AccordionTrigger>Item aberto por padrão</AccordionTrigger>
                <AccordionContent>Este item inicia expandido via defaultValue.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Item fechado por padrão</AccordionTrigger>
                <AccordionContent>Este item inicia colapsado.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </template>
        </DocsVariants>

        <!-- ── Composições ─────────────────────────────────────────────── -->
        <DocsCompositions
          :title="tContent('variants.compositionsTitle')"
          :use-when-label="tNav('common.useWhen')"
          component-slug="accordion"
          :items="compositionItems"
        >
          <template #variant-preview-0>
            <Accordion type="single" :collapsible="true" class="w-full max-w-lg text-sm">
              <AccordionItem value="info">
                <AccordionTrigger>
                  <span class="flex items-center gap-2">
                    <Info class="h-4 w-4" aria-hidden="true" />
                    Informações gerais
                  </span>
                </AccordionTrigger>
                <AccordionContent>Detalhes sobre a conta e preferências.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="aviso">
                <AccordionTrigger>
                  <span class="flex items-center gap-2">
                    <AlertTriangle class="h-4 w-4" aria-hidden="true" />
                    Avisos importantes
                  </span>
                </AccordionTrigger>
                <AccordionContent>Pendências que requerem atenção do usuário.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="sucesso">
                <AccordionTrigger>
                  <span class="flex items-center gap-2">
                    <CheckCircle2 class="h-4 w-4" aria-hidden="true" />
                    Itens concluídos
                  </span>
                </AccordionTrigger>
                <AccordionContent>Lista de tarefas finalizadas com sucesso.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </template>
          <template #variant-preview-1>
            <Accordion type="single" :collapsible="true" class="w-full max-w-lg text-sm">
              <AccordionItem value="novo">
                <AccordionTrigger>
                  <span class="flex items-center gap-2">
                    Novidades da versão
                    <Badge>Novo</Badge>
                  </span>
                </AccordionTrigger>
                <AccordionContent>Lista das funcionalidades adicionadas nesta release.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="beta">
                <AccordionTrigger>
                  <span class="flex items-center gap-2">
                    Funcionalidades em teste
                    <Badge variant="secondary">Beta</Badge>
                  </span>
                </AccordionTrigger>
                <AccordionContent>Recursos disponíveis para usuários do programa beta.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </template>
          <template #variant-preview-2>
            <Accordion type="multiple" class="w-full max-w-lg text-sm">
              <AccordionItem value="specs">
                <AccordionTrigger>Especificações técnicas</AccordionTrigger>
                <AccordionContent>
                  <table class="w-full text-sm border-collapse">
                    <tbody>
                      <tr class="border-b"><td class="py-1 pr-4">CPU</td><td class="py-1">Intel Core i7-12700</td></tr>
                      <tr class="border-b"><td class="py-1 pr-4">RAM</td><td class="py-1">16GB DDR5</td></tr>
                      <tr><td class="py-1 pr-4">SSD</td><td class="py-1">512GB NVMe</td></tr>
                    </tbody>
                  </table>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="inclui">
                <AccordionTrigger>O que está incluso</AccordionTrigger>
                <AccordionContent>
                  <ul class="list-disc pl-5 space-y-1">
                    <li>Cabo de alimentação</li>
                    <li>Manual do usuário</li>
                    <li>Garantia de 24 meses</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </template>
          <template #variant-preview-3>
            <div class="w-full max-w-lg">
              <h2 class="text-lg font-semibold mb-3">Perguntas frequentes</h2>
              <Accordion type="single" :collapsible="true" class="w-full text-sm">
                <AccordionItem value="senha">
                  <AccordionTrigger>Como faço para redefinir minha senha?</AccordionTrigger>
                  <AccordionContent>Acesse a tela de login e clique em "Esqueci minha senha". Você receberá um link de redefinição no email cadastrado.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="pagamento">
                  <AccordionTrigger>Quais formas de pagamento são aceitas?</AccordionTrigger>
                  <AccordionContent>Aceitamos cartão de crédito, Pix e boleto bancário.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="cancelamento">
                  <AccordionTrigger>Como cancelo minha assinatura?</AccordionTrigger>
                  <AccordionContent>Você pode cancelar a qualquer momento em Configurações → Assinatura.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="dados">
                  <AccordionTrigger>Onde encontro meus dados de acesso?</AccordionTrigger>
                  <AccordionContent>Seus dados de acesso estão disponíveis em Configurações → Conta.</AccordionContent>
                </AccordionItem>
              </Accordion>
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
            { title: tContent('props.accordion.title'), cols: propCols, items: accordionPropItems },
            { title: tContent('props.item.title'),      cols: propCols, items: itemPropItems      },
            { title: tContent('props.trigger.title'),   cols: propCols, items: triggerPropItems   },
            { title: tContent('props.content.title'),   cols: propCols, items: contentPropItems   },
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
          :customization-code="codeCustomization"
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
  </DocsPageLayout>
</template>
