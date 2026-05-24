<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { sanitizeHtml } from '@/lib/sanitize-html';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import componentTranslations from '@shared/content/hover-card/translations.json';
import uiTranslations from '@/i18n/ui.json';

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

const { t: tContent, locale } = useTranslation(componentTranslations);
const { t: tNav } = useTranslation(uiTranslations);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

const priorityKeyMap: Record<string, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

function localPriority(raw: string): string {
  return priorityKeyMap[raw] ?? raw;
}

// ─── SEO & GEO ────────────────────────────────────────────────────────────────

useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: 'hover-card',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
  aiIntent: tContent('seo.aiIntent'),
  breadcrumb: [
    { name: 'Components', item: '/components' },
    { name: 'Overlay', item: '/components/overlay' },
    { name: 'HoverCard' },
  ],
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'hover-card',
    locale: newLocale as 'pt-BR' | 'en' | 'es',
    page_title: `${tContent('title')} · Design System`,
  });
}, { immediate: true });

// ─── Analytics — section view ─────────────────────────────────────────────────

// ─── Navigation groups ────────────────────────────────────────────────────────

const navGroups = computed(() => [
  {
    label: tContent('nav.overview'),
    sections: [
      { id: 'demonstracao', label: tContent('nav.demonstration') },
      { id: 'anatomia',     label: tContent('nav.anatomy')       },
      { id: 'quando-usar',  label: tContent('nav.usage')         },
      { id: 'do-dont',      label: tContent('nav.doDont')        },
    ],
  },
  {
    label: tContent('nav.techRef'),
    sections: [
      { id: 'importacao',   label: tContent('nav.import')        },
      { id: 'variantes',    label: tContent('nav.variants')      },
      { id: 'composicoes',  label: tContent('nav.compositions')  },
      { id: 'estados',      label: tContent('nav.states')        },
      { id: 'propriedades', label: tContent('nav.props')    },
      { id: 'tokens',       label: tContent('nav.tokens')   },
    ],
  },
  {
    label: tContent('nav.context'),
    sections: [
      { id: 'acessibilidade', label: tContent('nav.accessibility') },
      { id: 'relacionados',   label: tContent('nav.related')       },
      { id: 'notas',          label: tContent('nav.notes')         },
    ],
  },
  {
    label: tContent('nav.quality'),
    sections: [
      { id: 'analytics', label: tContent('nav.analytics') },
      { id: 'testes',    label: tContent('nav.testes')    },
    ],
  },
]);

const allSectionIds = computed(() => navGroups.value.flatMap((g) => g.sections.map((s) => s.id)));



const { activeId: activeSection } = useActiveSection(allSectionIds, (id) => {
  track('docs_section_viewed', {
    section_id: id,
    component_name: 'hover-card',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";`;

const codeDefault = `<HoverCard>
  <HoverCardTrigger as-child>
    <a href="/users/joana">@joana</a>
  </HoverCardTrigger>
  <HoverCardContent>
    <!-- conteúdo -->
  </HoverCardContent>
</HoverCard>`;

const codeWithDelay = `<HoverCard :open-delay="500" :close-delay="200">
  <HoverCardTrigger as-child>
    <a href="/link">@joana</a>
  </HoverCardTrigger>
  <HoverCardContent>...</HoverCardContent>
</HoverCard>`;

const interfaceCode = `// HoverCard (reka-ui)
interface HoverCardRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  openDelay?: number;   // default 700ms
  closeDelay?: number;  // default 300ms
}

interface HoverCardContentProps {
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  alignOffset?: number;
}`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyStructure = computed(() => tContent('anatomy.structureCode'));

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
]);

const variantItems = computed(() => [
  { name: tContent('variants.items.default'),   description: stripHtml(tContent('variants.styles.default')),   code: codeDefault   },
  { name: tContent('variants.items.withDelay'), description: stripHtml(tContent('variants.styles.withDelay')), code: codeWithDelay },
]);

const codeCompUserProfile = `<HoverCard :open-delay="500" :close-delay="200">
  <HoverCardTrigger as-child>
    <a href="/users/joana">@joana</a>
  </HoverCardTrigger>
  <HoverCardContent>
    <div class="flex gap-3">
      <Avatar>
        <AvatarImage src="/joana.jpg" alt="" />
        <AvatarFallback>JS</AvatarFallback>
      </Avatar>
      <div class="flex flex-col">
        <p class="font-medium text-sm">Joana Silva</p>
        <p class="text-xs text-muted-foreground">Designer · 142 seguidores</p>
      </div>
    </div>
  </HoverCardContent>
</HoverCard>`;

const codeCompLinkPreview = `<HoverCard :open-delay="500" :close-delay="200">
  <HoverCardTrigger as-child>
    <a href="https://design-system.dev">design-system.dev</a>
  </HoverCardTrigger>
  <HoverCardContent>
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2 text-xs text-muted-foreground">
        <span class="inline-flex h-4 w-4 items-center justify-center rounded bg-muted">D</span>
        <span>design-system.dev</span>
      </div>
      <p class="font-medium">Guia de overlays acessíveis</p>
    </div>
  </HoverCardContent>
</HoverCard>`;

const codeCompDefinition = `<HoverCard :open-delay="400" :close-delay="150">
  <HoverCardTrigger as-child>
    <button type="button" class="underline decoration-dotted underline-offset-4">
      WCAG 2.1 AA
    </button>
  </HoverCardTrigger>
  <HoverCardContent>
    <p class="font-medium text-sm">WCAG 2.1 AA</p>
    <p class="text-xs text-muted-foreground">
      Web Content Accessibility Guidelines 2.1 — nível AA.
    </p>
  </HoverCardContent>
</HoverCard>`;

const codeCompMetric = `<HoverCard :open-delay="400" :close-delay="150">
  <HoverCardTrigger as-child>
    <button type="button" class="underline decoration-dotted underline-offset-4">
      LCP 1.8s
    </button>
  </HoverCardTrigger>
  <HoverCardContent>
    <div class="flex items-baseline justify-between gap-2">
      <p class="text-sm font-medium">Largest Contentful Paint</p>
      <span class="text-xs font-medium text-emerald-600">1.8s</span>
    </div>
    <p class="text-xs text-muted-foreground">
      Tempo até o maior elemento visível. Bom: &lt;2.5s · Ruim: &gt;4s.
    </p>
  </HoverCardContent>
</HoverCard>`;

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.userProfile.name'),
    description: tContent('variants.compositions.userProfile.description'),
    useWhen: tContent('variants.compositions.userProfile.use'),
    code: codeCompUserProfile,
  },
  {
    name: tContent('variants.compositions.linkPreview.name'),
    description: tContent('variants.compositions.linkPreview.description'),
    useWhen: tContent('variants.compositions.linkPreview.use'),
    code: codeCompLinkPreview,
  },
  {
    name: tContent('variants.compositions.definitionTooltip.name'),
    description: tContent('variants.compositions.definitionTooltip.description'),
    useWhen: tContent('variants.compositions.definitionTooltip.use'),
    code: codeCompDefinition,
  },
  {
    name: tContent('variants.compositions.metricExplainer.name'),
    description: tContent('variants.compositions.metricExplainer.description'),
    useWhen: tContent('variants.compositions.metricExplainer.use'),
    code: codeCompMetric,
  },
]);

const stateItems = computed(() => [
  { label: tContent('states.items.closed'),     trigger: 'defaultOpen={false}',     behavior: stripHtml(tContent('states.descriptions.closed'))     },
  { label: tContent('states.items.open'),       trigger: 'defaultOpen={true}',      behavior: stripHtml(tContent('states.descriptions.open'))       },
  { label: tContent('states.items.controlled'), trigger: 'open + onOpenChange',     behavior: stripHtml(tContent('states.descriptions.controlled')) },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const hoverCardPropItems = computed(() => [
  { name: 'open',          type: tContent('props.table.open.type'),         defaultValue: tContent('props.table.open.default'),         required: tContent('props.table.open.required'),         description: stripHtml(tContent('props.table.open.description'))         },
  { name: 'onUpdate:open', type: tContent('props.table.onOpenChange.type'), defaultValue: tContent('props.table.onOpenChange.default'), required: tContent('props.table.onOpenChange.required'), description: stripHtml(tContent('props.table.onOpenChange.description')) },
  { name: 'defaultOpen',   type: tContent('props.table.defaultOpen.type'),  defaultValue: tContent('props.table.defaultOpen.default'),  required: tContent('props.table.defaultOpen.required'),  description: stripHtml(tContent('props.table.defaultOpen.description'))  },
  { name: 'openDelay',     type: tContent('props.table.openDelay.type'),    defaultValue: tContent('props.table.openDelay.default'),    required: tContent('props.table.openDelay.required'),    description: stripHtml(tContent('props.table.openDelay.description'))    },
  { name: 'closeDelay',    type: tContent('props.table.closeDelay.type'),   defaultValue: tContent('props.table.closeDelay.default'),   required: tContent('props.table.closeDelay.required'),   description: stripHtml(tContent('props.table.closeDelay.description'))   },
  { name: 'side',          type: tContent('props.table.side.type'),         defaultValue: tContent('props.table.side.default'),         required: tContent('props.table.side.required'),         description: stripHtml(tContent('props.table.side.description'))         },
  { name: 'align',         type: tContent('props.table.align.type'),        defaultValue: tContent('props.table.align.default'),        required: tContent('props.table.align.required'),        description: stripHtml(tContent('props.table.align.description'))        },
]);

const tokenRows = computed(() => [
  { token: '--popover',            value: tContent('tokens.table.background.class'), description: tContent('tokens.table.background.part') },
  { token: '--popover-foreground', value: tContent('tokens.table.foreground.class'), description: tContent('tokens.table.foreground.part') },
  { token: '--foreground/10',      value: tContent('tokens.table.border.class'),     description: tContent('tokens.table.border.part')     },
  { token: 'shadow',               value: tContent('tokens.table.shadow.class'),     description: tContent('tokens.table.shadow.part')     },
  { token: '--radius',             value: tContent('tokens.table.rounded.class'),    description: tContent('tokens.table.rounded.part')    },
  { token: 'spacing',              value: tContent('tokens.table.padding.class'),    description: tContent('tokens.table.padding.part')    },
  { token: 'size',                 value: tContent('tokens.table.width.class'),      description: tContent('tokens.table.width.part')      },
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
  { key: 'Tab',       description: stripHtml(tContent('accessibility.keyboard.tab'))      },
  { key: 'Esc',       description: stripHtml(tContent('accessibility.keyboard.escape'))   },
  { key: 'Shift+Tab', description: stripHtml(tContent('accessibility.keyboard.shiftTab')) },
  { key: 'Enter',     description: stripHtml(tContent('accessibility.keyboard.enter'))    },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.tooltip.name'),      description: tContent('related.items.tooltip.description'),      path: '?path=/docs/ui-tooltip--docs'      },
  { name: tContent('related.items.popover.name'),      description: tContent('related.items.popover.description'),      path: '?path=/docs/ui-popover--docs'      },
  { name: tContent('related.items.dropdownMenu.name'), description: tContent('related.items.dropdownMenu.description'), path: '?path=/docs/ui-dropdownmenu--docs' },
  { name: tContent('related.items.card.name'),         description: tContent('related.items.card.description'),         path: '?path=/docs/ui-card--docs'         },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
  { title: '', content: tContent('notes.item5') },
]);

const analyticsItems = computed(() => [
  { event: 'hover_card_open / hover_card_close', trigger: stripHtml(tContent('analytics.description')), payload: "{ component: 'hover-card', location, label }" },
]);

const functionalTestItems = computed(() => [1, 2, 3, 4, 5, 6].map((i) => ({
  action: stripHtml(tContent(`testes.functional.item${i}.action`)),
  result: stripHtml(tContent(`testes.functional.item${i}.result`)),
  priority: localPriority(tContent(`testes.functional.item${i}.priority`)),
})));

const a11yTestItems = computed(() => [
  { criterion: tContent('testes.accessibility.item1'), level: 'AA',     how: 'axe-core'           },
  { criterion: tContent('testes.accessibility.item2'), level: '4.1.2',  how: 'DevTools a11y tree' },
  { criterion: tContent('testes.accessibility.item3'), level: '1.4.13', how: 'Keyboard test'      },
  { criterion: tContent('testes.accessibility.item4'), level: '1.4.13', how: 'Keyboard test'      },
  { criterion: tContent('testes.accessibility.item5'), level: '1.4.3',  how: 'Contrast checker'   },
  { criterion: tContent('testes.accessibility.item6'), level: 'AA',     how: 'Manual review'      },
]);

const visualTestItems = computed(() => [1, 2, 3, 4, 5].map((i) => ({
  story: tContent(`testes.visual.item${i}.story`),
  priority: localPriority(tContent(`testes.visual.item${i}.priority`)),
})));

const a11yCritCols = computed(() => ({
  criterion: 'Critério',
  level: 'WCAG',
  how: 'Como verificar',
}));
</script>

<template>
  <DocsPageLayout :nav-groups="navGroups" :active-section="activeSection" component-slug="hover-card">
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
        install-note="npx shadcn-vue@latest add hover-card"
      />
    </template>

    <!-- ── Demonstração ─────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
        <!-- User profile -->
        <div class="space-y-2" style="contain: layout; min-height: 100px; position: relative;">
          <p class="text-xs font-medium text-muted-foreground" v-html="sanitizeHtml(tContent('demonstration.labels.userProfile'))" />
          <HoverCard :open-delay="50" :close-delay="50" :default-open="true">
            <HoverCardTrigger as-child>
              <a href="#joana" class="text-primary underline-offset-4 hover:underline">@joana</a>
            </HoverCardTrigger>
            <HoverCardContent>
              <div class="flex gap-3">
                <Avatar>
                  <AvatarImage src="" alt="" />
                  <AvatarFallback>JS</AvatarFallback>
                </Avatar>
                <div class="flex flex-col">
                  <p class="font-medium text-sm">Joana Silva</p>
                  <p class="text-xs text-muted-foreground">Designer · 142 seguidores</p>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>

        <!-- Link preview -->
        <div class="space-y-2" style="contain: layout; min-height: 100px; position: relative;">
          <p class="text-xs font-medium text-muted-foreground" v-html="sanitizeHtml(tContent('demonstration.labels.linkPreview'))" />
          <HoverCard :open-delay="50" :close-delay="50" :default-open="true">
            <HoverCardTrigger as-child>
              <a href="#link" class="text-primary underline-offset-4 hover:underline">design-system.dev</a>
            </HoverCardTrigger>
            <HoverCardContent>
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-2 text-xs text-muted-foreground">
                  <span class="inline-flex h-4 w-4 items-center justify-center rounded bg-muted">D</span>
                  <span>design-system.dev</span>
                </div>
                <p class="font-medium">Guia de overlays acessíveis</p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>

        <!-- Definition -->
        <div class="space-y-2" style="contain: layout; min-height: 100px; position: relative;">
          <p class="text-xs font-medium text-muted-foreground" v-html="sanitizeHtml(tContent('demonstration.labels.definitionTooltip'))" />
          <HoverCard :open-delay="50" :close-delay="50" :default-open="true">
            <HoverCardTrigger as-child>
              <a href="#wcag" class="text-primary underline-offset-4 hover:underline">WCAG 2.1</a>
            </HoverCardTrigger>
            <HoverCardContent>
              <p class="font-medium text-sm">WCAG 2.1</p>
              <p class="text-xs text-muted-foreground">
                Web Content Accessibility Guidelines: padrão internacional de acessibilidade.
              </p>
            </HoverCardContent>
          </HoverCard>
        </div>

        <!-- Metric -->
        <div class="space-y-2" style="contain: layout; min-height: 100px; position: relative;">
          <p class="text-xs font-medium text-muted-foreground" v-html="sanitizeHtml(tContent('demonstration.labels.metricExplainer'))" />
          <HoverCard :open-delay="50" :close-delay="50" :default-open="true">
            <HoverCardTrigger as-child>
              <a href="#metric" class="text-primary underline-offset-4 hover:underline">3,42%</a>
            </HoverCardTrigger>
            <HoverCardContent>
              <p class="text-xs text-muted-foreground">Conversão (últimos 30d)</p>
              <p class="text-2xl font-semibold">3,42%</p>
              <p class="text-xs text-muted-foreground">Cliques no CTA / usuários únicos.</p>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>
    </DocsDemonstration>

    <!-- ── Anatomia ─────────────────────────────────────────────── -->
    <DocsAnatomy
      :title="tContent('anatomy.title')"
      :items="anatomyItems"
      :structure-label="tContent('anatomy.structureLabel')"
      :structure-code="anatomyStructure"
    />

    <!-- ── Quando Usar ──────────────────────────────────────────── -->
    <DocsWhenToUse
      :title="tContent('usage.title')"
      :guidelines="{
        title: tContent('usage.guidelines.title'),
        items: [
          stripHtml(tContent('usage.guidelines.item1')),
          stripHtml(tContent('usage.guidelines.item2')),
          stripHtml(tContent('usage.guidelines.item3')),
          stripHtml(tContent('usage.guidelines.item4')),
          stripHtml(tContent('usage.guidelines.item5')),
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
          { element: tContent('usage.uxWriting.table.content.name'), rules: tContent('usage.uxWriting.table.content.format'), do: tContent('usage.uxWriting.table.content.good'), dont: tContent('usage.uxWriting.table.content.bad') },
          { element: tContent('usage.uxWriting.table.delay.name'),   rules: tContent('usage.uxWriting.table.delay.format'),   do: tContent('usage.uxWriting.table.delay.good'),   dont: tContent('usage.uxWriting.table.delay.bad')   },
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

    <!-- ── Do & Don't ───────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="[
        { doLabel: 'Faça', dontLabel: 'Evite', doCaption: tContent('doDont.pair1.do'), dontCaption: tContent('doDont.pair1.dont') },
        { doLabel: 'Faça', dontLabel: 'Evite', doCaption: tContent('doDont.pair2.do'), dontCaption: tContent('doDont.pair2.dont') },
      ]"
    >
      <template #do-preview-0>
        <div style="contain: layout; min-height: 80px;" class="w-full">
          <div class="text-sm space-y-1">
            <div class="text-primary underline">@joana</div>
            <div class="text-xs text-muted-foreground">+ link para /users/joana</div>
          </div>
        </div>
      </template>
      <template #dont-preview-0>
        <div style="contain: layout; min-height: 80px;" class="w-full">
          <div class="text-sm">
            <div class="text-primary underline">@joana</div>
            <div class="text-xs text-muted-foreground italic">apenas hover (touch users perdem)</div>
          </div>
        </div>
      </template>
      <template #do-preview-1>
        <div style="contain: layout; min-height: 60px;" class="w-full">
          <div class="text-sm font-mono">openDelay={{ '{500}' }}</div>
        </div>
      </template>
      <template #dont-preview-1>
        <div style="contain: layout; min-height: 60px;" class="w-full">
          <div class="text-sm font-mono">openDelay={{ '{0}' }}</div>
        </div>
      </template>
    </DocsDoDont>

    <!-- ── Importação ───────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :code="codeImportBasic"
    />

    <!-- ── Variantes ────────────────────────────────────────────── -->
    <DocsVariants :title="tContent('variants.title')" :items="variantItems">
      <template #variant-preview-0>
        <div style="contain: layout; min-height: 60px;" class="w-full">
          <div class="text-xs font-mono text-muted-foreground">openDelay=700 / closeDelay=300</div>
        </div>
      </template>
      <template #variant-preview-1>
        <div style="contain: layout; min-height: 60px;" class="w-full">
          <div class="text-xs font-mono text-muted-foreground">openDelay=500 / closeDelay=200</div>
        </div>
      </template>
    </DocsVariants>

    <!-- ── Composições ──────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="hover-card"
      :items="compositionItems"
    >
      <template #variant-preview-0>
        <div style="contain: layout; min-height: 140px; position: relative;" class="w-full">
          <HoverCard :open-delay="50" :close-delay="50" :default-open="true">
            <HoverCardTrigger as-child>
              <a href="#joana" class="text-primary underline-offset-4 hover:underline">@joana</a>
            </HoverCardTrigger>
            <HoverCardContent>
              <div class="flex gap-3">
                <Avatar>
                  <AvatarImage src="" alt="" />
                  <AvatarFallback>JS</AvatarFallback>
                </Avatar>
                <div class="flex flex-col">
                  <p class="font-medium text-sm">Joana Silva</p>
                  <p class="text-xs text-muted-foreground">Designer · 142 seguidores</p>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      </template>
      <template #variant-preview-1>
        <div style="contain: layout; min-height: 140px; position: relative;" class="w-full">
          <HoverCard :open-delay="50" :close-delay="50" :default-open="true">
            <HoverCardTrigger as-child>
              <a href="#link" class="text-primary underline-offset-4 hover:underline">design-system.dev</a>
            </HoverCardTrigger>
            <HoverCardContent>
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-2 text-xs text-muted-foreground">
                  <span class="inline-flex h-4 w-4 items-center justify-center rounded bg-muted">D</span>
                  <span>design-system.dev</span>
                </div>
                <p class="font-medium">Guia de overlays acessíveis</p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      </template>
      <template #variant-preview-2>
        <div style="contain: layout; min-height: 140px; position: relative;" class="w-full">
          <HoverCard :open-delay="50" :close-delay="50" :default-open="true">
            <HoverCardTrigger as-child>
              <button
                type="button"
                class="bg-transparent border-0 p-0 text-primary text-sm font-medium underline decoration-dotted underline-offset-4 cursor-help"
              >
                WCAG 2.1 AA
              </button>
            </HoverCardTrigger>
            <HoverCardContent>
              <p class="font-medium text-sm">WCAG 2.1 AA</p>
              <p class="text-xs text-muted-foreground">
                Web Content Accessibility Guidelines 2.1 — nível AA. Contraste mínimo 4.5:1 e operação por teclado.
              </p>
            </HoverCardContent>
          </HoverCard>
        </div>
      </template>
      <template #variant-preview-3>
        <div style="contain: layout; min-height: 140px; position: relative;" class="w-full">
          <HoverCard :open-delay="50" :close-delay="50" :default-open="true">
            <HoverCardTrigger as-child>
              <button
                type="button"
                class="bg-transparent border-0 p-0 text-primary text-sm font-medium underline decoration-dotted underline-offset-4 cursor-help"
              >
                LCP 1.8s
              </button>
            </HoverCardTrigger>
            <HoverCardContent>
              <div class="flex items-baseline justify-between gap-2">
                <p class="text-sm font-medium">Largest Contentful Paint</p>
                <span class="text-xs font-medium text-emerald-600">1.8s</span>
              </div>
              <p class="text-xs text-muted-foreground">
                Tempo até o maior elemento visível ser renderizado. Bom: &lt;2.5s · Ruim: &gt;4s.
              </p>
            </HoverCardContent>
          </HoverCard>
        </div>
      </template>
    </DocsCompositions>

    <!-- ── Estados ──────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{
        state: tContent('props.table.prop'),
        trigger: tContent('usage.scenarios.cols.scenario'),
        behavior: tContent('usage.scenarios.cols.use'),
      }"
      :items="stateItems"
    />

    <!-- ── Propriedades ─────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: 'HoverCard', cols: propCols, items: hoverCardPropItems },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="tContent('props.extensibilityCode')"
    />

    <!-- ── Tokens ───────────────────────────────────────────────── -->
    <DocsTokens
      :title="tContent('tokens.title')"
      :cols="{
        token: tContent('tokens.table.token'),
        value: tContent('tokens.table.class'),
        description: tContent('tokens.table.part'),
      }"
      :items="tokenRows"
      :customization-title="tContent('tokens.customizationTitle')"
      :customization-code="tContent('tokens.customizationCode')"
    />

    <!-- ── Acessibilidade ───────────────────────────────────────── -->
    <DocsAccessibility
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-title="tContent('accessibility.keyboard.title')"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ─────────────────────────────────────────── -->
    <DocsRelated :title="tContent('related.title')" :items="relatedItems" />

    <!-- ── Notas ────────────────────────────────────────────────── -->
    <DocsNotes :title="tContent('notes.title')" :items="noteItems" />

    <!-- ── Analytics ────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :cols="{
        event: 'Evento',
        trigger: 'Quando dispara',
        payload: 'Payload',
      }"
      :items="analyticsItems"
    />

    <!-- ── Testes ───────────────────────────────────────────────── -->
    <DocsTestes
      :title="tContent('testes.title')"
      :functional="{
        title: tContent('testes.functional.title'),
        cols: { action: 'Ação', result: 'Resultado esperado', priority: 'Prioridade' },
        items: functionalTestItems,
      }"
      :accessibility="{
        title: tContent('testes.accessibility.title'),
        cols: a11yCritCols,
        items: a11yTestItems,
      }"
      :visual="{
        title: tContent('testes.visual.title'),
        cols: { story: 'Story', priority: 'Prioridade' },
        items: visualTestItems,
      }"
    />
  </DocsPageLayout>
</template>
