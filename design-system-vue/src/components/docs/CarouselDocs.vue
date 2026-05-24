<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { Card } from '@/components/ui/card';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import carouselTranslations from '@shared/content/carousel/translations.json';

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
const { t: tContent, locale } = useTranslation(carouselTranslations);

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
  componentSlug: 'carousel',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'carousel',
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
    component_name: 'carousel',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";`;

const codeImportWithPlugin = `import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";`;

const codeHorizontal = `<Carousel class="w-full max-w-sm">
  <CarouselContent>
    <CarouselItem v-for="(n, i) in 5" :key="i">Slide {{ n }}</CarouselItem>
  </CarouselContent>
  <CarouselPrevious aria-label="Item anterior" />
  <CarouselNext aria-label="Próximo item" />
</Carousel>`;

const codeVertical = `<Carousel orientation="vertical" class="w-full max-w-xs">
  <CarouselContent class="h-[200px]">
    <CarouselItem v-for="(n, i) in 5" :key="i">Slide {{ n }}</CarouselItem>
  </CarouselContent>
  <CarouselPrevious aria-label="Item anterior" />
  <CarouselNext aria-label="Próximo item" />
</Carousel>`;

const codeSingle = `<Carousel class="w-full max-w-sm">
  <CarouselContent>
    <CarouselItem v-for="(n, i) in 5" :key="i">Slide {{ n }}</CarouselItem>
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`;

const codeMulti = `<Carousel class="w-full max-w-xl">
  <CarouselContent>
    <CarouselItem v-for="(n, i) in 6" :key="i" class="md:basis-1/2 lg:basis-1/3">
      Slide {{ n }}
    </CarouselItem>
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`;

const codeCustomizationTokens = `/* Em globals.css — personalizar tokens usados pelos botões */
:root {
  --border: 214 32% 91%;
  --accent: 210 40% 96%;
  --ring:   221 83% 53%;
  --radius-button: 0.5rem;
}

.dark {
  --border: 217 33% 18%;
  --accent: 215 28% 17%;
}`;

const interfaceCode = `// Carousel — baseado em embla-carousel-vue
import type { EmblaOptionsType, EmblaPluginType } from "embla-carousel-vue";

interface CarouselProps {
  opts?: EmblaOptionsType;
  plugins?: EmblaPluginType[];
  orientation?: "horizontal" | "vertical";
  class?: string;
}

// CarouselContent / CarouselItem aceitam apenas \`class\`
// CarouselPrevious / CarouselNext estendem Button (variant, size, class)

interface CarouselEmits {
  (e: "init-api", payload: CarouselApi): void;
}`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
  tContent('anatomy.item4'),
]);

const variantItems = computed(() => [
  { name: 'horizontal', description: stripHtml(tContent('variants.items.horizontal')), code: codeHorizontal },
  { name: 'vertical',   description: stripHtml(tContent('variants.items.vertical')),   code: codeVertical   },
  { name: 'single',     description: stripHtml(tContent('variants.items.single')),     code: codeSingle     },
  { name: 'multi',      description: stripHtml(tContent('variants.items.multi')),      code: codeMulti      },
]);

const codeCompositionWithDots = `<script setup lang="ts">
import { ref } from "vue";
import type { CarouselApi } from "@/components/ui/carousel";

const api = ref<CarouselApi>();
const current = ref(0);

function onInitApi(payload: CarouselApi) {
  api.value = payload;
  current.value = payload.selectedScrollSnap();
  payload.on("select", () => (current.value = payload.selectedScrollSnap()));
}
<\/script>

<template>
  <div class="space-y-3">
    <Carousel @init-api="onInitApi" aria-label="Galeria de fotos do produto">
      <CarouselContent>
        <CarouselItem v-for="(s, i) in slides" :key="i">{{ s }}</CarouselItem>
      </CarouselContent>
      <CarouselPrevious aria-label="Item anterior" />
      <CarouselNext aria-label="Próximo item" />
    </Carousel>
    <div class="flex justify-center gap-2" aria-label="Ir para o slide">
      <button
        v-for="(_, i) in slides"
        :key="i"
        type="button"
        :aria-label="\`Ir para o slide \${i + 1} de \${slides.length}\`"
        :aria-current="i === current ? 'true' : 'false'"
        :class="['h-2 w-2 rounded-full', i === current ? 'bg-primary' : 'bg-muted-foreground/30']"
        @click="api?.scrollTo(i)"
      />
    </div>
  </div>
</template>`;

const codeCompositionGallery = `<Carousel class="w-full max-w-md" aria-label="Galeria de fotos do produto">
  <CarouselContent>
    <CarouselItem v-for="photo in photos" :key="photo.id">
      <Card class="overflow-hidden">
        <div class="aspect-video bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center">
          <span class="text-2xl font-semibold">{{ photo.title }}</span>
        </div>
        <div class="p-4">
          <h3 class="font-semibold">{{ photo.title }}</h3>
          <p class="text-sm text-muted-foreground">{{ photo.description }}</p>
        </div>
      </Card>
    </CarouselItem>
  </CarouselContent>
  <CarouselPrevious aria-label="Item anterior" />
  <CarouselNext aria-label="Próximo item" />
</Carousel>`;

const codeCompositionAutoplay = `<script setup lang="ts">
import Autoplay from "embla-carousel-autoplay";
<\/script>

<template>
  <Carousel
    :opts="{ loop: true }"
    :plugins="[Autoplay({ delay: 4000, stopOnInteraction: true })]"
    aria-label="Destaques"
  >
    <CarouselContent>
      <CarouselItem v-for="(h, i) in highlights" :key="i">{{ h }}</CarouselItem>
    </CarouselContent>
    <CarouselPrevious aria-label="Item anterior" />
    <CarouselNext aria-label="Próximo item" />
  </Carousel>
</template>`;

const codeCompositionMultiResponsive = `<Carousel class="w-full max-w-2xl" aria-label="Cards de produto">
  <CarouselContent>
    <CarouselItem
      v-for="p in products"
      :key="p.id"
      class="md:basis-1/2 lg:basis-1/3"
    >
      <Card>{{ p.name }}</Card>
    </CarouselItem>
  </CarouselContent>
  <CarouselPrevious aria-label="Item anterior" />
  <CarouselNext aria-label="Próximo item" />
</Carousel>`;

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.withDots.name'),
    description: tContent('variants.compositions.withDots.description'),
    useWhen: tContent('variants.compositions.withDots.use'),
    code: codeCompositionWithDots,
  },
  {
    name: tContent('variants.compositions.gallery.name'),
    description: tContent('variants.compositions.gallery.description'),
    useWhen: tContent('variants.compositions.gallery.use'),
    code: codeCompositionGallery,
  },
  {
    name: tContent('variants.compositions.autoplay.name'),
    description: tContent('variants.compositions.autoplay.description'),
    useWhen: tContent('variants.compositions.autoplay.use'),
    code: codeCompositionAutoplay,
  },
  {
    name: tContent('variants.compositions.multiResponsive.name'),
    description: tContent('variants.compositions.multiResponsive.description'),
    useWhen: tContent('variants.compositions.multiResponsive.use'),
    code: codeCompositionMultiResponsive,
  },
]);

// Dots demo state (preview)
const dotsApi = ref<unknown>();
const dotsCurrent = ref(0);
function onDotsInit(payload: any) {
  dotsApi.value = payload;
  dotsCurrent.value = payload.selectedScrollSnap();
  payload.on('select', () => (dotsCurrent.value = payload.selectedScrollSnap()));
}
const galleryPhotos = [
  { title: 'Foto 1', description: 'Paisagem ao amanhecer' },
  { title: 'Foto 2', description: 'Detalhe arquitetônico' },
  { title: 'Foto 3', description: 'Cidade à noite' },
  { title: 'Foto 4', description: 'Praia vista do alto' },
];

const stateItems = computed(() => [
  { label: tContent('states.single.label'),   trigger: stripHtml(tContent('states.single.trigger')),   behavior: stripHtml(tContent('states.single.behavior'))   },
  { label: tContent('states.multi.label'),    trigger: stripHtml(tContent('states.multi.trigger')),    behavior: stripHtml(tContent('states.multi.behavior'))    },
  { label: tContent('states.autoplay.label'), trigger: stripHtml(tContent('states.autoplay.trigger')), behavior: stripHtml(tContent('states.autoplay.behavior')) },
  { label: tContent('states.vertical.label'), trigger: stripHtml(tContent('states.vertical.trigger')), behavior: stripHtml(tContent('states.vertical.behavior')) },
  { label: tContent('states.disabled.label'), trigger: stripHtml(tContent('states.disabled.trigger')), behavior: stripHtml(tContent('states.disabled.behavior')) },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const carouselPropItems = computed(() => [
  { name: 'opts',        type: 'EmblaOptionsType',               defaultValue: '—',             required: 'Não', description: stripHtml(tContent('props.table.opts'))        },
  { name: 'plugins',     type: 'EmblaPluginType[]',              defaultValue: '—',             required: 'Não', description: stripHtml(tContent('props.table.plugins'))     },
  { name: 'orientation', type: '"horizontal" | "vertical"',     defaultValue: '"horizontal"',  required: 'Não', description: stripHtml(tContent('props.table.orientation')) },
  { name: '@init-api',   type: '(api: CarouselApi) => void',    defaultValue: '—',             required: 'Não', description: stripHtml(tContent('props.table.setApi'))      },
  { name: 'class',       type: 'string',                         defaultValue: '—',             required: 'Não', description: tContent('props.table.className')              },
]);

const contentItemPropItems = computed(() => [
  { name: 'class',       type: 'string',                         defaultValue: '—',             required: 'Não', description: tContent('props.table.className')              },
  { name: 'default slot', type: 'slots',                         defaultValue: '—',             required: 'Sim', description: tContent('props.table.children')               },
]);

const navPropItems = computed(() => [
  { name: 'variant',     type: 'ButtonVariants["variant"]',      defaultValue: '"outline"',     required: 'Não', description: stripHtml(tContent('props.table.variant'))     },
  { name: 'size',        type: 'ButtonVariants["size"]',         defaultValue: '"icon-sm"',     required: 'Não', description: stripHtml(tContent('props.table.size'))        },
  { name: 'class',       type: 'string',                         defaultValue: '—',             required: 'Não', description: tContent('props.table.className')              },
]);

const tokenRows = computed(() => [
  { token: '--background',    value: 'bg-background',   description: tContent('tokens.table.background')    },
  { token: '--foreground',    value: 'text-foreground', description: tContent('tokens.table.foreground')    },
  { token: '--border',        value: 'border',          description: tContent('tokens.table.border')        },
  { token: '--accent',        value: 'hover:bg-accent', description: tContent('tokens.table.accent')        },
  { token: '--ring',          value: 'focus-visible:ring-ring', description: tContent('tokens.table.ring')  },
  { token: '--radius-button', value: 'rounded-(--radius-button)', description: tContent('tokens.table.radiusButton')  },
  { token: '--primary',       value: 'bg-primary',      description: tContent('tokens.table.primary')       },
]);

const accessibilityItems = computed(() => [
  tContent('accessibility.item1'),
  tContent('accessibility.item2'),
  tContent('accessibility.item3'),
  tContent('accessibility.item4'),
  tContent('accessibility.item5'),
]);

const keyboardItems = computed(() => [
  { key: 'Tab',         description: tContent('accessibility.keyboard.tab')        },
  { key: 'ArrowLeft',   description: tContent('accessibility.keyboard.arrowLeft')  },
  { key: 'ArrowRight',  description: tContent('accessibility.keyboard.arrowRight') },
  { key: 'Enter',       description: tContent('accessibility.keyboard.enter')      },
  { key: 'Space',       description: tContent('accessibility.keyboard.space')      },
]);

const relatedItems = computed(() => [
  { name: 'Tabs',       description: tContent('related.tabs'),       path: '?path=/docs/ui-tabs--docs'       },
  { name: 'ScrollArea', description: tContent('related.scrollArea'), path: '?path=/docs/ui-scrollarea--docs' },
  { name: 'Card',       description: tContent('related.card'),       path: '?path=/docs/ui-card--docs'       },
  { name: 'Pagination', description: tContent('related.pagination'), path: '?path=/docs/ui-pagination--docs' },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.tip1') },
  { title: '', content: tContent('notes.tip2') },
  { title: '', content: tContent('notes.tip3') },
  { title: '', content: tContent('notes.tip4') },
]);

const analyticsItems = computed(() => [
  { event: tContent('analytics.table.slideChange'),    trigger: tContent('analytics.table.slideChangeTrigger'),    payload: tContent('analytics.table.slideChangePayload')    },
  { event: tContent('analytics.table.autoplayPause'),  trigger: tContent('analytics.table.autoplayPauseTrigger'),  payload: tContent('analytics.table.autoplayPausePayload')  },
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
  { criterion: tContent('testes.accessibility.item5.criterion'), level: tContent('testes.accessibility.item5.level'), how: tContent('testes.accessibility.item5.how') },
]);

const visualTestItems = computed(() => [
  { story: tContent('testes.visual.item1.story'), priority: localPriority(tContent('testes.visual.item1.priority')) },
  { story: tContent('testes.visual.item2.story'), priority: localPriority(tContent('testes.visual.item2.priority')) },
  { story: tContent('testes.visual.item3.story'), priority: localPriority(tContent('testes.visual.item3.priority')) },
  { story: tContent('testes.visual.item4.story'), priority: localPriority(tContent('testes.visual.item4.priority')) },
  { story: tContent('testes.visual.item5.story'), priority: localPriority(tContent('testes.visual.item5.priority')) },
]);

const demoSlides = [1, 2, 3, 4, 5];
</script>

<template>
  <DocsPageLayout :nav-groups="navGroups" :active-section="activeSection" component-slug="carousel">
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
        install-note="npx shadcn-vue@latest add carousel"
      />
    </template>

    <!-- ── Demonstração ───────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')" component-slug="carousel">
      <div class="flex items-center justify-center w-full py-10">
        <Carousel class="w-full max-w-sm" :aria-label="tContent('usage.uxWriting.table.caption.good')">
          <CarouselContent>
            <CarouselItem v-for="n in demoSlides" :key="n">
              <Card class="flex aspect-square items-center justify-center p-6">
                <span class="text-3xl font-semibold">{{ n }}</span>
              </Card>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious :aria-label="tContent('demonstration.labels.previous')" />
          <CarouselNext :aria-label="tContent('demonstration.labels.next')" />
        </Carousel>
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
          { element: tContent('usage.uxWriting.table.previous.name'), rules: tContent('usage.uxWriting.table.previous.format'), do: tContent('usage.uxWriting.table.previous.good'), dont: tContent('usage.uxWriting.table.previous.bad') },
          { element: tContent('usage.uxWriting.table.next.name'),     rules: tContent('usage.uxWriting.table.next.format'),     do: tContent('usage.uxWriting.table.next.good'),     dont: tContent('usage.uxWriting.table.next.bad')     },
          { element: tContent('usage.uxWriting.table.dots.name'),     rules: tContent('usage.uxWriting.table.dots.format'),     do: tContent('usage.uxWriting.table.dots.good'),     dont: tContent('usage.uxWriting.table.dots.bad')     },
          { element: tContent('usage.uxWriting.table.caption.name'),  rules: tContent('usage.uxWriting.table.caption.format'),  do: tContent('usage.uxWriting.table.caption.good'),  dont: tContent('usage.uxWriting.table.caption.bad')  },
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
        <div class="flex items-center justify-center py-6 px-8">
          <Carousel class="w-full max-w-[200px]" :aria-label="tContent('usage.uxWriting.table.caption.good')">
            <CarouselContent>
              <CarouselItem v-for="n in [1, 2, 3]" :key="n">
                <Card class="flex aspect-square items-center justify-center p-4">
                  <span class="text-xl font-semibold">{{ n }}</span>
                </Card>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious :aria-label="tContent('demonstration.labels.previous')" />
            <CarouselNext :aria-label="tContent('demonstration.labels.next')" />
          </Carousel>
        </div>
      </template>
      <template #dont-preview-0>
        <div class="flex items-center justify-center py-6 px-8">
          <Carousel class="w-full max-w-[200px]">
            <CarouselContent>
              <CarouselItem v-for="n in [1, 2, 3]" :key="n">
                <Card class="flex aspect-square items-center justify-center p-4">
                  <span class="text-xl font-semibold">{{ n }}</span>
                </Card>
              </CarouselItem>
            </CarouselContent>
          </Carousel>
        </div>
      </template>
      <template #do-preview-1>
        <div class="flex flex-col items-center justify-center gap-2 py-4">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-xs font-mono">
            <span class="w-2 h-2 rounded-full bg-green-500" aria-hidden="true"></span>
            <code>Autoplay({ delay: 3000, stopOnInteraction: true })</code>
          </div>
          <p class="text-xs text-muted-foreground text-center max-w-xs">loop: true + stopOnInteraction respeita WCAG 2.2.2</p>
        </div>
      </template>
      <template #dont-preview-1>
        <div class="flex flex-col items-center justify-center gap-2 py-4">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-xs font-mono">
            <span class="w-2 h-2 rounded-full bg-red-500" aria-hidden="true"></span>
            <code>Autoplay({ delay: 800 })</code>
          </div>
          <p class="text-xs text-muted-foreground text-center max-w-xs">Avanço rápido sem pausa quebra WCAG 2.2.2</p>
        </div>
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :description="tContent('import.basic')"
      :code="codeImportBasic"
      :secondary-description="tContent('import.withPlugin')"
      :secondary-code="codeImportWithPlugin"
    />

    <!-- ── Variantes ──────────────────────────────────────────────── -->
    <DocsVariants :title="tContent('variants.title')" :items="variantItems" component-slug="carousel">
      <template #variant-preview-0>
        <div class="py-10 px-12">
          <Carousel class="w-full max-w-xs" :aria-label="tContent('usage.uxWriting.table.caption.good')">
            <CarouselContent>
              <CarouselItem v-for="n in demoSlides" :key="n">
                <Card class="flex aspect-square items-center justify-center p-6">
                  <span class="text-2xl font-semibold">{{ n }}</span>
                </Card>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious :aria-label="tContent('demonstration.labels.previous')" />
            <CarouselNext :aria-label="tContent('demonstration.labels.next')" />
          </Carousel>
        </div>
      </template>
      <template #variant-preview-1>
        <div class="py-14 px-4">
          <Carousel orientation="vertical" class="w-full max-w-[200px]" :aria-label="tContent('usage.uxWriting.table.caption.good')">
            <CarouselContent class="h-[200px]">
              <CarouselItem v-for="n in demoSlides" :key="n">
                <Card class="flex aspect-square items-center justify-center p-4">
                  <span class="text-2xl font-semibold">{{ n }}</span>
                </Card>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious :aria-label="tContent('demonstration.labels.previous')" />
            <CarouselNext :aria-label="tContent('demonstration.labels.next')" />
          </Carousel>
        </div>
      </template>
      <template #variant-preview-2>
        <div class="py-10 px-12">
          <Carousel class="w-full max-w-xs" :aria-label="tContent('usage.uxWriting.table.caption.good')">
            <CarouselContent>
              <CarouselItem v-for="n in demoSlides" :key="n">
                <Card class="flex aspect-square items-center justify-center p-6">
                  <span class="text-2xl font-semibold">{{ n }}</span>
                </Card>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious :aria-label="tContent('demonstration.labels.previous')" />
            <CarouselNext :aria-label="tContent('demonstration.labels.next')" />
          </Carousel>
        </div>
      </template>
      <template #variant-preview-3>
        <div class="py-10 px-12">
          <Carousel class="w-full max-w-md" :aria-label="tContent('usage.uxWriting.table.caption.good')">
            <CarouselContent>
              <CarouselItem v-for="n in [1, 2, 3, 4, 5, 6]" :key="n" class="md:basis-1/2 lg:basis-1/3">
                <Card class="flex aspect-square items-center justify-center p-4">
                  <span class="text-xl font-semibold">{{ n }}</span>
                </Card>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious :aria-label="tContent('demonstration.labels.previous')" />
            <CarouselNext :aria-label="tContent('demonstration.labels.next')" />
          </Carousel>
        </div>
      </template>
    </DocsVariants>

    <!-- ── Composições ────────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="carousel"
      :items="compositionItems"
    >
      <template #variant-preview-0>
        <div class="w-full max-w-md space-y-3">
          <Carousel
            class="w-full"
            :aria-label="tContent('usage.uxWriting.table.caption.good')"
            @init-api="onDotsInit"
          >
            <CarouselContent>
              <CarouselItem v-for="n in demoSlides" :key="n">
                <Card class="flex aspect-square items-center justify-center p-6">
                  <span class="text-2xl font-semibold">{{ n }}</span>
                </Card>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious :aria-label="tContent('demonstration.labels.previous')" />
            <CarouselNext :aria-label="tContent('demonstration.labels.next')" />
          </Carousel>
          <div class="flex items-center justify-center gap-2" :aria-label="tContent('demonstration.labels.goToSlide')">
            <button
              v-for="(_, i) in demoSlides"
              :key="i"
              type="button"
              :aria-label="`${tContent('demonstration.labels.goToSlide')} ${i + 1} ${tContent('demonstration.labels.of')} ${demoSlides.length}`"
              :aria-current="i === dotsCurrent ? 'true' : 'false'"
              :class="['h-2 w-2 rounded-full transition-colors', i === dotsCurrent ? 'bg-primary' : 'bg-muted-foreground/30']"
              @click="(dotsApi as any)?.scrollTo(i)"
            />
          </div>
        </div>
      </template>
      <template #variant-preview-1>
        <div class="py-6 px-4">
          <Carousel class="w-full max-w-sm" :aria-label="tContent('usage.uxWriting.table.caption.good')">
            <CarouselContent>
              <CarouselItem v-for="(photo, i) in galleryPhotos" :key="i">
                <Card class="overflow-hidden">
                  <div class="aspect-video bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center">
                    <span class="text-2xl font-semibold text-foreground">{{ photo.title }}</span>
                  </div>
                  <div class="p-4">
                    <h3 class="text-sm font-semibold text-foreground">{{ photo.title }}</h3>
                    <p class="text-xs text-muted-foreground">{{ photo.description }}</p>
                  </div>
                </Card>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious :aria-label="tContent('demonstration.labels.previous')" />
            <CarouselNext :aria-label="tContent('demonstration.labels.next')" />
          </Carousel>
        </div>
      </template>
      <template #variant-preview-2>
        <div class="py-10 px-12">
          <Carousel
            class="w-full max-w-xs"
            :opts="{ loop: true }"
            :aria-label="tContent('usage.uxWriting.table.caption.good')"
          >
            <CarouselContent>
              <CarouselItem v-for="n in demoSlides" :key="n">
                <Card class="flex aspect-square items-center justify-center p-6">
                  <span class="text-2xl font-semibold">{{ n }}</span>
                </Card>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious :aria-label="tContent('demonstration.labels.previous')" />
            <CarouselNext :aria-label="tContent('demonstration.labels.next')" />
          </Carousel>
        </div>
      </template>
      <template #variant-preview-3>
        <div class="py-10 px-12">
          <Carousel class="w-full max-w-md" :aria-label="tContent('usage.uxWriting.table.caption.good')">
            <CarouselContent>
              <CarouselItem v-for="n in [1, 2, 3, 4, 5, 6]" :key="n" class="md:basis-1/2 lg:basis-1/3">
                <Card class="flex aspect-square items-center justify-center p-4">
                  <span class="text-xl font-semibold">{{ n }}</span>
                </Card>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious :aria-label="tContent('demonstration.labels.previous')" />
            <CarouselNext :aria-label="tContent('demonstration.labels.next')" />
          </Carousel>
        </div>
      </template>
    </DocsCompositions>

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
        { title: tContent('props.carouselTitle'),  cols: propCols, items: carouselPropItems    },
        { title: tContent('props.contentTitle'),   cols: propCols, items: contentItemPropItems },
        { title: tContent('props.itemTitle'),      cols: propCols, items: contentItemPropItems },
        { title: tContent('props.navTitle'),       cols: propCols, items: navPropItems         },
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
    <DocsRelated :title="tContent('related.title')" :items="relatedItems" component-slug="carousel" />

    <!-- ── Notas ──────────────────────────────────────────────────── -->
    <DocsNotes :title="tContent('notes.title')" :items="noteItems" component-slug="carousel" />

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
