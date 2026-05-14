<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import aspectRatioTranslations from '@shared/content/aspect-ratio/translations.json';

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
const { t: tContent, locale } = useTranslation(aspectRatioTranslations);

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

// ─── Media URLs (demo) ────────────────────────────────────────────────────────

const imgLandscape = 'https://images.unsplash.com/photo-1535025183041-0991a977e25b?w=800&auto=format';
const imgProduct   = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format';
const imgAvatar    = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format';
const imgPortrait  = 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&auto=format';
const imgUltraWide = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format';

// ─── SEO & GEO ────────────────────────────────────────────────────────────────

useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: 'aspect-ratio',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'aspect-ratio',
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
    component_name: 'aspect-ratio',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import { AspectRatio } from "@/components/ui/aspect-ratio";`;

const codeSixteenNine = `<AspectRatio :ratio="16 / 9">
  <img src="/hero.jpg" alt="Paisagem" class="h-full w-full object-cover rounded-md" />
</AspectRatio>`;

const codeFourThree = `<AspectRatio :ratio="4 / 3">
  <img src="/product.jpg" alt="Foto do produto" class="h-full w-full object-cover rounded-md" />
</AspectRatio>`;

const codeSquare = `<AspectRatio :ratio="1">
  <img src="/avatar.jpg" alt="Foto de perfil" class="h-full w-full object-cover rounded-md" />
</AspectRatio>`;

const codeThreeFour = `<AspectRatio :ratio="3 / 4">
  <img src="/cover.jpg" alt="Capa vertical" class="h-full w-full object-cover rounded-md" />
</AspectRatio>`;

const codeUltraWide = `<AspectRatio :ratio="21 / 9">
  <img src="/pano.jpg" alt="Cabeçalho panorâmico" class="h-full w-full object-cover rounded-md" />
</AspectRatio>`;

const codeCustomizationTokens = `<!-- Tokens no FILHO, nunca no AspectRatio -->
<AspectRatio :ratio="16 / 9">
  <img
    src="/hero.jpg"
    alt="Paisagem"
    class="h-full w-full object-cover rounded-md border"
  />
</AspectRatio>`;

const interfaceCode = `// AspectRatio
interface AspectRatioProps {
  ratio?: number;   // largura / altura. Padrão: 1
  asChild?: boolean;
  class?: string;
}`;

const anatomyStructure = `<AspectRatio ratio={16 / 9}>          // 1. Root wrapper (padding-bottom calculado)
  <img                                 // 2. Slot (conteúdo filho)
    src="/hero.jpg"
    alt="Paisagem"
    class="h-full w-full object-cover"
  />
</AspectRatio>`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
]);

const variantItems = computed(() => [
  { name: '16 / 9', description: stripHtml(tContent('variants.items.sixteenNine')), code: codeSixteenNine },
  { name: '4 / 3',  description: stripHtml(tContent('variants.items.fourThree')),  code: codeFourThree  },
  { name: '1 / 1',  description: stripHtml(tContent('variants.items.square')),     code: codeSquare     },
  { name: '3 / 4',  description: stripHtml(tContent('variants.items.threeFour')),  code: codeThreeFour  },
  { name: '21 / 9', description: stripHtml(tContent('variants.items.ultraWide')),  code: codeUltraWide  },
]);

const stateItems = computed(() => [
  { label: tContent('states.item1.label'), trigger: tContent('states.item1.trigger'), behavior: tContent('states.item1.behavior') },
  { label: tContent('states.item2.label'), trigger: tContent('states.item2.trigger'), behavior: tContent('states.item2.behavior') },
  { label: tContent('states.item3.label'), trigger: tContent('states.item3.trigger'), behavior: stripHtml(tContent('states.item3.behavior')) },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const aspectRatioPropItems = computed(() => [
  { name: 'ratio',   type: 'number',  defaultValue: '1',     required: 'Não', description: stripHtml(tContent('props.table.ratio'))     },
  { name: 'asChild', type: 'boolean', defaultValue: 'false', required: 'Não', description: stripHtml(tContent('props.table.asChild'))   },
  { name: 'class',   type: 'string',  defaultValue: '—',     required: 'Não', description: stripHtml(tContent('props.table.className')) },
]);

const slotPropItems = computed(() => [
  { name: 'default slot', type: 'VNode', defaultValue: '—', required: 'Sim', description: stripHtml(tContent('props.table.children')) },
]);

const tokenRows = computed(() => [
  { token: '—',         value: '—',            description: tContent('tokens.table.radius')  },
  { token: '--border',  value: 'border',       description: tContent('tokens.table.border')  },
  { token: '--muted',   value: 'bg-muted',     description: tContent('tokens.table.muted')   },
]);

const accessibilityItems = computed(() => [
  tContent('accessibility.aria.item1'),
  tContent('accessibility.aria.item2'),
  tContent('accessibility.aria.item3'),
  tContent('accessibility.aria.item4'),
  tContent('accessibility.aria.item5'),
]);

const keyboardItems = computed(() => [
  { key: '—', description: tContent('accessibility.keyboard.item1') },
  { key: '—', description: tContent('accessibility.keyboard.note')  },
]);

const relatedItems = computed(() => [
  { name: 'Avatar',     description: tContent('related.avatar'),   path: '?path=/docs/ui-avatar--docs'     },
  { name: 'Card',       description: tContent('related.card'),     path: '?path=/docs/ui-card--docs'       },
  { name: 'Skeleton',   description: tContent('related.skeleton'), path: '?path=/docs/ui-skeleton--docs'   },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
]);

const analyticsItems = computed(() => [
  { event: '—', trigger: tContent('analytics.note'), payload: '—' },
]);

const a11yCritCols = computed(() => ({
  criterion: tNav('common.criterion'),
  level: 'WCAG',
  how: tNav('common.howToVerify'),
}));

const functionalTestItems = computed(() => [
  { action: stripHtml(tContent('testes.functional.item1.action')), result: stripHtml(tContent('testes.functional.item1.result')), priority: localPriority(tContent('testes.functional.item1.priority')) },
  { action: stripHtml(tContent('testes.functional.item2.action')), result: stripHtml(tContent('testes.functional.item2.result')), priority: localPriority(tContent('testes.functional.item2.priority')) },
  { action: stripHtml(tContent('testes.functional.item3.action')), result: stripHtml(tContent('testes.functional.item3.result')), priority: localPriority(tContent('testes.functional.item3.priority')) },
  { action: stripHtml(tContent('testes.functional.item4.action')), result: stripHtml(tContent('testes.functional.item4.result')), priority: localPriority(tContent('testes.functional.item4.priority')) },
  { action: stripHtml(tContent('testes.functional.item5.action')), result: stripHtml(tContent('testes.functional.item5.result')), priority: localPriority(tContent('testes.functional.item5.priority')) },
]);

const a11yTestItems = computed(() => [
  { criterion: stripHtml(tContent('testes.accessibility.item1.criterion')), level: tContent('testes.accessibility.item1.level'), how: tContent('testes.accessibility.item1.how') },
  { criterion: stripHtml(tContent('testes.accessibility.item2.criterion')), level: tContent('testes.accessibility.item2.level'), how: tContent('testes.accessibility.item2.how') },
  { criterion: stripHtml(tContent('testes.accessibility.item3.criterion')), level: tContent('testes.accessibility.item3.level'), how: stripHtml(tContent('testes.accessibility.item3.how')) },
  { criterion: stripHtml(tContent('testes.accessibility.item4.criterion')), level: tContent('testes.accessibility.item4.level'), how: stripHtml(tContent('testes.accessibility.item4.how')) },
  { criterion: stripHtml(tContent('testes.accessibility.item5.criterion')), level: tContent('testes.accessibility.item5.level'), how: tContent('testes.accessibility.item5.how') },
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
        install-note="npx shadcn-vue@latest add aspect-ratio"
      />
    </template>

    <!-- ── Demonstração ───────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div class="space-y-2">
          <AspectRatio :ratio="16 / 9">
            <img :src="imgLandscape" :alt="tContent('demonstration.labels.sixteenNine')" loading="lazy" decoding="async" class="h-full w-full object-cover rounded-md" />
          </AspectRatio>
          <p class="text-xs text-muted-foreground">{{ tContent('demonstration.labels.sixteenNine') }}</p>
        </div>
        <div class="space-y-2">
          <AspectRatio :ratio="4 / 3">
            <img :src="imgProduct" :alt="tContent('demonstration.labels.fourThree')" loading="lazy" decoding="async" class="h-full w-full object-cover rounded-md" />
          </AspectRatio>
          <p class="text-xs text-muted-foreground">{{ tContent('demonstration.labels.fourThree') }}</p>
        </div>
        <div class="space-y-2">
          <AspectRatio :ratio="1">
            <img :src="imgAvatar" :alt="tContent('demonstration.labels.square')" loading="lazy" decoding="async" class="h-full w-full object-cover rounded-md" />
          </AspectRatio>
          <p class="text-xs text-muted-foreground">{{ tContent('demonstration.labels.square') }}</p>
        </div>
        <div class="space-y-2">
          <AspectRatio :ratio="3 / 4">
            <img :src="imgPortrait" :alt="tContent('demonstration.labels.threeFour')" loading="lazy" decoding="async" class="h-full w-full object-cover rounded-md" />
          </AspectRatio>
          <p class="text-xs text-muted-foreground">{{ tContent('demonstration.labels.threeFour') }}</p>
        </div>
      </div>
    </DocsDemonstration>

    <!-- ── Anatomia ───────────────────────────────────────────────── -->
    <DocsAnatomy
      :title="tContent('anatomy.title')"
      :items="anatomyItems"
      :structure-code="anatomyStructure"
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
          { s: tContent('usage.scenarios.item1.s'), u: tContent('usage.scenarios.item1.u'), a: stripHtml(tContent('usage.scenarios.item1.a')) },
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

    <!-- ── Do & Don't ─────────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="[
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: tContent('doDont.pair1.do'), dontCaption: tContent('doDont.pair1.dont') },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: tContent('doDont.pair2.do'), dontCaption: tContent('doDont.pair2.dont') },
      ]"
    >
      <template #do-preview-0>
        <AspectRatio :ratio="16 / 9" class="w-full">
          <img :src="imgLandscape" alt="Paisagem" loading="lazy" decoding="async" class="h-full w-full object-cover rounded-md" />
        </AspectRatio>
      </template>
      <template #dont-preview-0>
        <AspectRatio :ratio="16 / 9" class="w-full bg-muted">
          <img :src="imgLandscape" alt="Paisagem" loading="lazy" decoding="async" class="h-full w-full object-contain rounded-md" />
        </AspectRatio>
      </template>
      <template #do-preview-1>
        <AspectRatio :ratio="4 / 3" class="w-full">
          <img :src="imgProduct" alt="Produto" loading="lazy" decoding="async" class="h-full w-full object-cover rounded-md" />
        </AspectRatio>
      </template>
      <template #dont-preview-1>
        <AspectRatio :ratio="4 / 3" class="w-full rounded-md border">
          <img :src="imgProduct" alt="Produto" loading="lazy" decoding="async" class="h-full w-full object-cover" />
        </AspectRatio>
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :code="codeImportBasic"
    />

    <!-- ── Variantes ──────────────────────────────────────────────── -->
    <DocsVariants :title="tContent('variants.title')" :items="variantItems">
      <template #variant-preview-0>
        <AspectRatio :ratio="16 / 9" class="w-full">
          <img :src="imgLandscape" alt="Paisagem 16:9" loading="lazy" decoding="async" class="h-full w-full object-cover rounded-md" />
        </AspectRatio>
      </template>
      <template #variant-preview-1>
        <AspectRatio :ratio="4 / 3" class="w-full">
          <img :src="imgProduct" alt="Produto 4:3" loading="lazy" decoding="async" class="h-full w-full object-cover rounded-md" />
        </AspectRatio>
      </template>
      <template #variant-preview-2>
        <AspectRatio :ratio="1" class="w-full">
          <img :src="imgAvatar" alt="Avatar 1:1" loading="lazy" decoding="async" class="h-full w-full object-cover rounded-md" />
        </AspectRatio>
      </template>
      <template #variant-preview-3>
        <AspectRatio :ratio="3 / 4" class="w-full">
          <img :src="imgPortrait" alt="Retrato 3:4" loading="lazy" decoding="async" class="h-full w-full object-cover rounded-md" />
        </AspectRatio>
      </template>
      <template #variant-preview-4>
        <AspectRatio :ratio="21 / 9" class="w-full">
          <img :src="imgUltraWide" alt="Ultra-wide 21:9" loading="lazy" decoding="async" class="h-full w-full object-cover rounded-md" />
        </AspectRatio>
      </template>
    </DocsVariants>

    <!-- ── Estados ─────────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{
        state: tContent('props.table.prop'),
        trigger: tContent('usage.scenarios.cols.scenario'),
        behavior: tContent('usage.scenarios.cols.use'),
      }"
      :items="stateItems"
    />

    <!-- ── Propriedades ───────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: 'AspectRatio', cols: propCols, items: aspectRatioPropItems },
        { title: 'Slot',        cols: propCols, items: slotPropItems       },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="stripHtml(tContent('props.extensibility'))"
    />

    <!-- ── Tokens ─────────────────────────────────────────────────── -->
    <DocsTokens
      :title="tContent('tokens.title')"
      :cols="{
        token: 'Token',
        value: 'Classe',
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
      :keyboard-title="tContent('accessibility.keyboard.title')"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ───────────────────────────────────────────── -->
    <DocsRelated :title="tContent('related.title')" :items="relatedItems" />

    <!-- ── Notas ──────────────────────────────────────────────────── -->
    <DocsNotes :title="tContent('notes.title')" :items="noteItems" />

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
