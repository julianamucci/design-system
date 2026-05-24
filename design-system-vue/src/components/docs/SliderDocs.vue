<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { Slider } from '@/components/ui/slider';
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

import uiTranslations         from '@/i18n/ui.json';
import componentTranslations  from '@shared/content/slider/translations.json';

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
  componentSlug: 'slider',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
  aiIntent: tContent('seo.aiIntent') as 'informational' | 'navigational',
  breadcrumb: [
    { name: 'Components', item: '/components' },
    { name: tContent('category'), item: '/components/form' },
    { name: tContent('title') },
  ],
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'slider',
    locale: newLocale as 'pt-BR' | 'en' | 'es',
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
    component_name: 'slider',
    locale: locale.value,
  });
});
// ─── Reactive demo state ──────────────────────────────────────────────────────

const volumeValue = ref<number[]>([50]);
const priceValue = ref<number[]>([100, 400]);
const verticalValue = ref<number[]>([60]);

// Composições
const compVolume = ref<number[]>([50]);
const compBrightness = ref<number[]>([75]);
const compPrice = ref<number[]>([100, 400]);
const compFormVolume = ref<number[]>([60]);
const compFormCommitted = ref<number>(60);
function onCompFormSubmit(e: Event) {
  e.preventDefault();
  compFormCommitted.value = compFormVolume.value[0];
}
function onCompFormCommit(value: number[]) {
  compFormCommitted.value = value[0];
}

// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import { Slider } from "@/components/ui/slider";`;

const codeSingle = `<script setup lang="ts">
import { ref } from "vue";
import { Slider } from "@/components/ui/slider";
const value = ref<number[]>([50]);
<\/script>

<template>
  <div class="space-y-3 w-72">
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium">Volume</span>
      <span aria-live="polite" class="text-sm tabular-nums">{{ value[0] }}%</span>
    </div>
    <Slider
      v-model="value"
      :min="0"
      :max="100"
      :step="1"
      aria-label="Volume"
    />
  </div>
</template>`;

const codeRange = `<script setup lang="ts">
import { ref } from "vue";
import { Slider } from "@/components/ui/slider";
const value = ref<number[]>([100, 400]);
<\/script>

<template>
  <div class="space-y-3 w-72">
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium">Faixa de preço</span>
      <span aria-live="polite" class="text-sm tabular-nums">
        R$ {{ value[0] }} — R$ {{ value[1] }}
      </span>
    </div>
    <Slider
      v-model="value"
      :min="0"
      :max="500"
      :step="10"
      aria-label="Faixa de preço"
    />
  </div>
</template>`;

const codeVertical = `<template>
  <div class="h-40">
    <Slider
      v-model="value"
      orientation="vertical"
      :min="0"
      :max="100"
      aria-label="Brilho"
    />
  </div>
</template>`;

const codeCustomizationTokens = `/* Override do tamanho do Thumb */
[data-slot="slider-thumb"] {
  width: 1rem;
  height: 1rem;
}

/* Cor customizada do Range */
.slider-success [data-slot="slider-range"] {
  @apply bg-green-500;
}`;

const interfaceCode = `// Slider (reka-ui SliderRoot)
interface SliderProps {
  modelValue?: number[];           // SEMPRE array
  defaultValue?: number[];
  min?: number;                    // 0
  max?: number;                    // 100
  step?: number;                   // 1
  orientation?: 'horizontal' | 'vertical';
  disabled?: boolean;
  'aria-label'?: string;           // OBRIGATÓRIO
  class?: string;
  // Emits
  'onUpdate:modelValue'?: (value: number[]) => void;
  'onValueCommit'?: (value: number[]) => void;
}`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
  tContent('anatomy.item4'),
  tContent('anatomy.item5'),
]);

const variantItems = computed(() => [
  { name: tContent('variants.items.single'),   description: stripHtml(tContent('variants.styles.single')),   code: codeSingle   },
  { name: tContent('variants.items.range'),    description: stripHtml(tContent('variants.styles.range')),    code: codeRange    },
  { name: tContent('variants.items.vertical'), description: stripHtml(tContent('variants.styles.vertical')), code: codeVertical },
]);

// ─── Composições ─────────────────────────────────────────────────────────────

const codeCompVolume = `<script setup lang="ts">
import { ref } from "vue";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
const value = ref<number[]>([50]);
<\/script>

<template>
  <div class="space-y-3 w-72">
    <div class="flex items-center justify-between">
      <Label>Volume</Label>
      <span aria-live="polite" class="text-sm tabular-nums">{{ value[0] }}%</span>
    </div>
    <Slider v-model="value" :min="0" :max="100" aria-label="Volume" />
  </div>
</template>`;

const codeCompBrightness = `<Slider
  v-model="value"
  :min="0"
  :max="100"
  :step="5"
  aria-label="Brilho"
/>`;

const codeCompPrice = `<script setup lang="ts">
import { ref } from "vue";
const range = ref<number[]>([100, 400]);
<\/script>

<template>
  <Slider
    v-model="range"
    :min="0"
    :max="1000"
    :step="10"
    aria-label="Faixa de preço"
  />
</template>`;

const codeCompForm = `<form aria-label="Configurações de áudio" @submit.prevent="onSubmit">
  <Label>Volume</Label>
  <Slider
    v-model="value"
    @value-commit="(v) => track('slider_change', {
      component: 'slider',
      field_name: 'volume',
      value: v[0],
    })"
    :min="0"
    :max="100"
    aria-label="Volume"
  />
  <Button type="submit">Salvar</Button>
</form>`;

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.volume.name'),
    description: tContent('variants.compositions.volume.description'),
    useWhen: tContent('variants.compositions.volume.use'),
    code: codeCompVolume,
  },
  {
    name: tContent('variants.compositions.brightness.name'),
    description: tContent('variants.compositions.brightness.description'),
    useWhen: tContent('variants.compositions.brightness.use'),
    code: codeCompBrightness,
  },
  {
    name: tContent('variants.compositions.priceRange.name'),
    description: tContent('variants.compositions.priceRange.description'),
    useWhen: tContent('variants.compositions.priceRange.use'),
    code: codeCompPrice,
  },
  {
    name: tContent('variants.compositions.form.name'),
    description: tContent('variants.compositions.form.description'),
    useWhen: tContent('variants.compositions.form.use'),
    code: codeCompForm,
  },
]);

const stateItems = computed(() => [
  { label: tContent('states.items.default'),  trigger: '—',                                   behavior: stripHtml(tContent('states.descriptions.default'))  },
  { label: tContent('states.items.hover'),    trigger: 'hover',                               behavior: stripHtml(tContent('states.descriptions.hover'))    },
  { label: tContent('states.items.focus'),    trigger: 'Tab',                                 behavior: stripHtml(tContent('states.descriptions.focus'))    },
  { label: tContent('states.items.active'),   trigger: 'pointerdown',                         behavior: stripHtml(tContent('states.descriptions.active'))   },
  { label: tContent('states.items.disabled'), trigger: 'disabled=true',                       behavior: stripHtml(tContent('states.descriptions.disabled')) },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const sliderPropItems = computed(() => [
  { name: 'modelValue',          type: tContent('props.table.value.type'),            defaultValue: tContent('props.table.value.default'),            required: tContent('props.table.value.required'),            description: stripHtml(tContent('props.table.value.description'))            },
  { name: 'defaultValue',        type: tContent('props.table.defaultValue.type'),     defaultValue: tContent('props.table.defaultValue.default'),     required: tContent('props.table.defaultValue.required'),     description: stripHtml(tContent('props.table.defaultValue.description'))     },
  { name: '@update:modelValue',  type: tContent('props.table.onValueChange.type'),    defaultValue: tContent('props.table.onValueChange.default'),    required: tContent('props.table.onValueChange.required'),    description: stripHtml(tContent('props.table.onValueChange.description'))    },
  { name: '@valueCommit',        type: tContent('props.table.onValueCommitted.type'), defaultValue: tContent('props.table.onValueCommitted.default'), required: tContent('props.table.onValueCommitted.required'), description: stripHtml(tContent('props.table.onValueCommitted.description')) },
  { name: 'min',                 type: tContent('props.table.min.type'),              defaultValue: tContent('props.table.min.default'),              required: tContent('props.table.min.required'),              description: stripHtml(tContent('props.table.min.description'))              },
  { name: 'max',                 type: tContent('props.table.max.type'),              defaultValue: tContent('props.table.max.default'),              required: tContent('props.table.max.required'),              description: stripHtml(tContent('props.table.max.description'))              },
  { name: 'step',                type: tContent('props.table.step.type'),             defaultValue: tContent('props.table.step.default'),             required: tContent('props.table.step.required'),             description: stripHtml(tContent('props.table.step.description'))             },
  { name: 'orientation',         type: tContent('props.table.orientation.type'),      defaultValue: tContent('props.table.orientation.default'),      required: tContent('props.table.orientation.required'),      description: stripHtml(tContent('props.table.orientation.description'))      },
  { name: 'disabled',            type: tContent('props.table.disabled.type'),         defaultValue: tContent('props.table.disabled.default'),         required: tContent('props.table.disabled.required'),         description: stripHtml(tContent('props.table.disabled.description'))         },
]);

const tokenRows = computed(() => [
  { token: '--muted',            value: tContent('tokens.table.muted.class'),           description: tContent('tokens.table.muted.part')           },
  { token: '--primary',          value: tContent('tokens.table.primary.class'),         description: tContent('tokens.table.primary.part')         },
  { token: '--ring',             value: tContent('tokens.table.ring.class'),            description: tContent('tokens.table.ring.part')            },
  { token: '--background',       value: tContent('tokens.table.background.class'),      description: tContent('tokens.table.background.part')      },
  { token: '--foreground',       value: tContent('tokens.table.foreground.class'),      description: tContent('tokens.table.foreground.part')      },
  { token: '--muted-foreground', value: tContent('tokens.table.mutedForeground.class'), description: tContent('tokens.table.mutedForeground.part') },
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
  { key: 'Tab',         description: tContent('accessibility.keyboard.tab')        },
  { key: 'ArrowRight',  description: tContent('accessibility.keyboard.arrowRight') },
  { key: 'ArrowLeft',   description: tContent('accessibility.keyboard.arrowLeft')  },
  { key: 'ArrowUp',     description: tContent('accessibility.keyboard.arrowUp')    },
  { key: 'ArrowDown',   description: tContent('accessibility.keyboard.arrowDown')  },
  { key: 'Home',        description: tContent('accessibility.keyboard.home')       },
  { key: 'End',         description: tContent('accessibility.keyboard.end')        },
  { key: 'PageUp',      description: tContent('accessibility.keyboard.pageUp')     },
  { key: 'PageDown',    description: tContent('accessibility.keyboard.pageDown')   },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.input.name'),      description: tContent('related.items.input.description'),      path: '?path=/docs/ui-input--docs'       },
  { name: tContent('related.items.switch.name'),     description: tContent('related.items.switch.description'),     path: '?path=/docs/ui-switch--docs'      },
  { name: tContent('related.items.progress.name'),   description: tContent('related.items.progress.description'),   path: '?path=/docs/ui-progress--docs'    },
  { name: tContent('related.items.radioGroup.name'), description: tContent('related.items.radioGroup.description'), path: '?path=/docs/ui-radiogroup--docs' },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
]);

const analyticsItems = computed(() => [
  { event: 'slider_change',
    trigger: tContent('analytics.table.slider_change.trigger'),
    payload: tContent('analytics.table.slider_change.payload') },
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
  { criterion: tContent('testes.accessibility.item1'), level: 'AA', how: '' },
  { criterion: tContent('testes.accessibility.item2'), level: 'AA', how: '' },
  { criterion: tContent('testes.accessibility.item3'), level: 'AA', how: '' },
  { criterion: tContent('testes.accessibility.item4'), level: 'AA', how: '' },
  { criterion: tContent('testes.accessibility.item5'), level: 'AA', how: '' },
]);

const visualTestItems = computed(() => [
  { story: tContent('testes.visual.item1.story'), priority: localPriority(tContent('testes.visual.item1.priority')) },
  { story: tContent('testes.visual.item2.story'), priority: localPriority(tContent('testes.visual.item2.priority')) },
  { story: tContent('testes.visual.item3.story'), priority: localPriority(tContent('testes.visual.item3.priority')) },
  { story: tContent('testes.visual.item4.story'), priority: localPriority(tContent('testes.visual.item4.priority')) },
]);
</script>

<template>
  <DocsPageLayout :nav-groups="navGroups" :active-section="activeSection" component-slug="slider">
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
        install-note="npx shadcn-vue@latest add slider"
      />
    </template>

    <!-- ── Demonstração ─────────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div class="w-full max-w-md space-y-10">
        <!-- Single — Volume -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <Label>{{ tContent('demonstration.labels.volume') }}</Label>
            <span aria-live="polite" class="text-sm tabular-nums text-foreground">
              {{ volumeValue[0] }}%
            </span>
          </div>
          <Slider
            v-model="volumeValue"
            :min="0"
            :max="100"
            :step="1"
            :aria-label="tContent('demonstration.labels.volume')"
          />
        </div>

        <!-- Range — Faixa de preço -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <Label>{{ tContent('demonstration.labels.priceRange') }}</Label>
            <span aria-live="polite" class="text-sm tabular-nums text-foreground">
              R$ {{ priceValue[0] }} — R$ {{ priceValue[1] }}
            </span>
          </div>
          <Slider
            v-model="priceValue"
            :min="0"
            :max="500"
            :step="10"
            :aria-label="tContent('demonstration.labels.priceRange')"
          />
        </div>

        <!-- Vertical — Brilho -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <Label>{{ tContent('demonstration.labels.brightness') }}</Label>
            <span aria-live="polite" class="text-sm tabular-nums text-foreground">
              {{ verticalValue[0] }}%
            </span>
          </div>
          <div class="h-40 flex justify-center">
            <Slider
              v-model="verticalValue"
              orientation="vertical"
              :min="0"
              :max="100"
              :step="1"
              :aria-label="tContent('demonstration.labels.brightness')"
            />
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
      :ux-writing="{
        title: tContent('usage.uxWriting.title'),
        cols: {
          element: tContent('usage.uxWriting.table.element'),
          rules: tContent('usage.uxWriting.table.rules'),
          do: tContent('usage.uxWriting.table.correct'),
          dont: tContent('usage.uxWriting.table.avoid'),
        },
        items: [
          { element: tContent('usage.uxWriting.table.ariaLabel.name'),    rules: tContent('usage.uxWriting.table.ariaLabel.format'),    do: tContent('usage.uxWriting.table.ariaLabel.good'),    dont: tContent('usage.uxWriting.table.ariaLabel.bad')    },
          { element: tContent('usage.uxWriting.table.valueDisplay.name'), rules: tContent('usage.uxWriting.table.valueDisplay.format'), do: tContent('usage.uxWriting.table.valueDisplay.good'), dont: tContent('usage.uxWriting.table.valueDisplay.bad') },
          { element: tContent('usage.uxWriting.table.range.name'),        rules: tContent('usage.uxWriting.table.range.format'),        do: tContent('usage.uxWriting.table.range.good'),        dont: tContent('usage.uxWriting.table.range.bad')        },
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
      <!-- Pair 1: valor visível vs invisível -->
      <template #do-preview-0>
        <div class="space-y-2 w-64">
          <div class="flex items-center justify-between">
            <Label>Volume</Label>
            <span aria-live="polite" class="text-sm tabular-nums">75%</span>
          </div>
          <Slider :model-value="[75]" :min="0" :max="100" aria-label="Volume" />
        </div>
      </template>
      <template #dont-preview-0>
        <div class="w-64">
          <Slider :model-value="[75]" :min="0" :max="100" aria-label="Volume" />
        </div>
      </template>

      <!-- Pair 2: aria-label descritivo vs genérico -->
      <template #do-preview-1>
        <div class="w-64">
          <Slider :model-value="[40]" :min="0" :max="100" aria-label="Brilho" />
        </div>
      </template>
      <template #dont-preview-1>
        <div class="w-64">
          <Slider :model-value="[40]" :min="0" :max="100" aria-label="Slider" />
        </div>
      </template>
    </DocsDoDont>

    <!-- ── Importação ───────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :code="codeImportBasic"
    />

    <!-- ── Variantes ────────────────────────────────────────────────── -->
    <DocsVariants :title="tContent('variants.title')" :items="variantItems" component-slug="slider">
      <!-- single -->
      <template #variant-preview-0>
        <div class="w-64 space-y-2">
          <div class="flex items-center justify-between">
            <Label>Volume</Label>
            <span aria-live="polite" class="text-sm tabular-nums">50%</span>
          </div>
          <Slider :model-value="[50]" :min="0" :max="100" aria-label="Volume" />
        </div>
      </template>

      <!-- range -->
      <template #variant-preview-1>
        <div class="w-64 space-y-2">
          <div class="flex items-center justify-between">
            <Label>Faixa de preço</Label>
            <span aria-live="polite" class="text-sm tabular-nums">R$ 100 — R$ 400</span>
          </div>
          <Slider :model-value="[100, 400]" :min="0" :max="500" :step="10" aria-label="Faixa de preço" />
        </div>
      </template>

      <!-- vertical -->
      <template #variant-preview-2>
        <div class="h-40 flex justify-center">
          <Slider :model-value="[60]" orientation="vertical" :min="0" :max="100" aria-label="Brilho" />
        </div>
      </template>
    </DocsVariants>

    <!-- ── Composições ──────────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="slider"
      :items="compositionItems"
    >
      <template #variant-preview-0>
        <div class="space-y-3 w-72">
          <div class="flex items-center justify-between">
            <Label>Volume</Label>
            <span aria-live="polite" class="text-sm tabular-nums">{{ compVolume[0] }}%</span>
          </div>
          <Slider v-model="compVolume" :min="0" :max="100" aria-label="Volume" />
        </div>
      </template>

      <template #variant-preview-1>
        <div class="space-y-3 w-72">
          <div class="flex items-center justify-between">
            <Label>Brilho</Label>
            <span aria-live="polite" class="text-sm tabular-nums">{{ compBrightness[0] }}%</span>
          </div>
          <Slider v-model="compBrightness" :min="0" :max="100" :step="5" aria-label="Brilho" />
        </div>
      </template>

      <template #variant-preview-2>
        <div class="space-y-3 w-72">
          <div class="flex items-center justify-between">
            <Label>Faixa de preço</Label>
            <span aria-live="polite" class="text-sm tabular-nums">
              R$ {{ compPrice[0] }} — R$ {{ compPrice[1] }}
            </span>
          </div>
          <Slider v-model="compPrice" :min="0" :max="1000" :step="10" aria-label="Faixa de preço" />
        </div>
      </template>

      <template #variant-preview-3>
        <form
          aria-label="Configurações de áudio"
          class="flex flex-col gap-4 w-72"
          @submit="onCompFormSubmit"
        >
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <Label>Volume</Label>
              <span aria-live="polite" class="text-sm tabular-nums">{{ compFormVolume[0] }}%</span>
            </div>
            <Slider
              v-model="compFormVolume"
              :min="0"
              :max="100"
              aria-label="Volume"
              @value-commit="onCompFormCommit"
            />
          </div>
          <Button type="submit" size="sm" class="self-start">Salvar</Button>
          <p class="text-xs text-muted-foreground" aria-live="polite">
            Último commit: {{ compFormCommitted }}%
          </p>
        </form>
      </template>
    </DocsCompositions>

    <!-- ── Estados ──────────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{
        state: tNav('common.state') || 'Estado',
        trigger: tNav('common.trigger') || 'Trigger',
        behavior: tNav('common.behavior') || 'Comportamento',
      }"
      :items="stateItems"
    />

    <!-- ── Propriedades ─────────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: 'Slider', cols: propCols, items: sliderPropItems },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-code="tContent('props.extensibilityCode')"
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
