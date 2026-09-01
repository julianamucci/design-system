<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@/components/ui/stepper';
import { Button } from '@/components/ui/button';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import stepperTranslations from '@shared/content/stepper/translations.json';

import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.vue';
import DocsDemonstration from '@/components/docs/shared/sections/DocsDemonstration.vue';
import DocsAnatomy       from '@/components/docs/shared/sections/DocsAnatomy.vue';
import DocsWhenToUse     from '@/components/docs/shared/sections/DocsWhenToUse.vue';
import DocsDoDont        from '@/components/docs/shared/sections/DocsDoDont.vue';
import DocsImport        from '@/components/docs/shared/sections/DocsImport.vue';
import DocsCompositions  from '@/components/docs/shared/sections/DocsCompositions.vue';
import DocsStates        from '@/components/docs/shared/sections/DocsStates.vue';
import DocsProps         from '@/components/docs/shared/sections/DocsProps.vue';
import DocsTokens        from '@/components/docs/shared/sections/DocsTokens.vue';
import DocsAccessibility from '@/components/docs/shared/sections/DocsAccessibility.vue';
import DocsRelated       from '@/components/docs/shared/sections/DocsRelated.vue';
import DocsNotes         from '@/components/docs/shared/sections/DocsNotes.vue';
import DocsAnalytics     from '@/components/docs/shared/sections/DocsAnalytics.vue';
import DocsTestes        from '@/components/docs/shared/sections/DocsTestes.vue';
import { toPlainText } from '@/lib/strip-html';
// O snippet da composição sai da MESMA transform que alimenta o painel Code das
// stories — duas cópias do mesmo exemplo divergem sem ninguém ver.
import { stepperWithDescriptionsSource, stepperWizardSource } from '@/components/ui/stepper/stepper.source';

// ─── i18n ─────────────────────────────────────────────────────────────────────

// O locale vem de `useTranslation`, nunca de Pinia — a leitura pela store já
// derrubou docs page desta stack em runtime.
const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(stepperTranslations);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
const screenReaderItems = computed(() =>
  Object.values(
    (stepperTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >)[locale.value]?.accessibility?.screenReader ?? {},
  ),
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  componentSlug: 'stepper',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
  breadcrumb: [
    { name: 'Components', item: '/components' },
    { name: tContent('category'), item: '/components/navigation' },
    { name: tContent('title') },
  ],
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'stepper',
    locale: newLocale as 'pt-BR' | 'en' | 'es',
    page_title: `${tContent('title')} · Design System`,
  });
}, { immediate: true });

// ─── Navigation groups ────────────────────────────────────────────────────────

// Sem "Variantes": o Stepper tem uma forma só — o que muda é a posição no
// fluxo, e isso é estado, não variante.
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
      { id: 'importacao',   label: tNav('nav.import')       },
      { id: 'composicoes',  label: tNav('nav.compositions') },
      { id: 'estados',      label: tNav('nav.states')       },
      { id: 'propriedades', label: tNav('nav.props')        },
      { id: 'tokens',       label: tNav('nav.tokens')       },
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
    component_name: 'stepper',
    locale: locale.value,
  });
});

// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImport = `import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper";`;

const interfaceCode = `// Stepper (raiz)
interface StepperProps {
  value?: number;
  labels?: { completed?: string; current?: string };
  class?: string;
}
// emits: (e: 'step-select', step: number) => void
// o nome acessível do fluxo entra como atributo: aria-label="…"

// StepperItem
interface StepperItemProps {
  step: number;
  completed?: boolean;
  disabled?: boolean;
  class?: string;
}

// StepperTrigger / StepperIndicator / StepperTitle
// StepperDescription / StepperSeparator
interface StepperPartProps { class?: string; }`;

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

const guidelines = computed(() => ({
  title: tContent('usage.guidelines.title'),
  items: [1, 2, 3, 4, 5].map(i => tContent(`usage.guidelines.item${i}`)),
}));

const scenarios = computed(() => ({
  title: tContent('usage.scenarios.title'),
  cols: {
    scenario: tContent('usage.scenarios.cols.scenario'),
    use: tContent('usage.scenarios.cols.use'),
    alternative: tContent('usage.scenarios.cols.alternative'),
  },
  items: [1, 2, 3, 4, 5].map(i => ({
    s: tContent(`usage.scenarios.item${i}.s`),
    u: tContent(`usage.scenarios.item${i}.u`),
    a: tContent(`usage.scenarios.item${i}.a`),
  })),
}));

const uxWriting = computed(() => ({
  title: tContent('usage.uxWriting.title'),
  cols: {
    element: tContent('usage.uxWriting.table.element'),
    rules: tContent('usage.uxWriting.table.rules'),
    do: tContent('usage.uxWriting.table.correct'),
    dont: tContent('usage.uxWriting.table.avoid'),
  },
  items: ['title', 'description', 'stateLabel', 'flowName'].map(k => ({
    element: tContent(`usage.uxWriting.table.${k}.name`),
    rules: tContent(`usage.uxWriting.table.${k}.format`),
    do: tContent(`usage.uxWriting.table.${k}.good`),
    dont: tContent(`usage.uxWriting.table.${k}.bad`),
  })),
}));

const doList = computed(() => ({
  title: tContent('usage.do.title'),
  items: [1, 2, 3, 4].map(i => tContent(`usage.do.item${i}`)),
}));

const dontList = computed(() => ({
  title: tContent('usage.dont.title'),
  items: [1, 2, 3, 4].map(i => tContent(`usage.dont.item${i}`)),
}));

const doDontPairs = computed(() => [1, 2, 3].map(i => ({
  doLabel: tNav('common.do'),
  dontLabel: tNav('common.dont'),
  doCaption: toPlainText(tContent(`doDont.pair${i}.do`)),
  dontCaption: toPlainText(tContent(`doDont.pair${i}.dont`)),
})));

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.wizard.name'),
    // Chave do conteúdo, não o nome traduzido: o id do evento tem de ser o mesmo
    // nos três idiomas, senão um toggle vira três eventos no GA4.
    trackId: 'wizard',
    description: tContent('variants.compositions.wizard.description'),
    useWhen: tContent('variants.compositions.wizard.use'),
    code: stepperWizardSource(),
  },
  {
    name: tContent('variants.compositions.withDescriptions.name'),
    trackId: 'with-descriptions',
    description: tContent('variants.compositions.withDescriptions.description'),
    useWhen: tContent('variants.compositions.withDescriptions.use'),
    code: stepperWithDescriptionsSource(),
  },
]);

const stateCols = computed(() => ({
  state: tContent('states.cols.state'),
  trigger: toPlainText(tContent('states.cols.trigger')),
  behavior: toPlainText(tContent('states.cols.behavior')),
}));

const stateItems = computed(() => ['inactive', 'active', 'completed', 'disabled'].map(k => ({
  label: tContent(`states.${k}.label`),
  trigger: toPlainText(tContent(`states.${k}.trigger`)),
  behavior: toPlainText(tContent(`states.${k}.behavior`)),
})));

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

// Nomes na API desta stack: o conteúdo compartilhado descreve o conceito, e a
// tabela mostra a prop/evento que existe aqui — a seleção chega por evento
// (`step-select`), não por callback em prop.
const rootPropItems = computed(() => [
  { name: 'value',        type: tContent('props.table.value.type'),        defaultValue: tContent('props.table.value.default'),        required: tContent('props.table.value.required'),        description: toPlainText(tContent('props.table.value.description'))        },
  { name: 'aria-label',   type: tContent('props.table.ariaLabel.type'),    defaultValue: tContent('props.table.ariaLabel.default'),    required: tContent('props.table.ariaLabel.required'),    description: toPlainText(tContent('props.table.ariaLabel.description'))    },
  { name: 'labels',       type: tContent('props.table.labels.type'),       defaultValue: tContent('props.table.labels.default'),       required: tContent('props.table.labels.required'),       description: toPlainText(tContent('props.table.labels.description'))       },
  { name: 'step-select',  type: tContent('props.table.onStepSelect.type'), defaultValue: tContent('props.table.onStepSelect.default'), required: tContent('props.table.onStepSelect.required'), description: toPlainText(tContent('props.table.onStepSelect.description')) },
  { name: 'class',        type: tContent('props.table.class.type'),        defaultValue: tContent('props.table.class.default'),        required: tContent('props.table.class.required'),        description: toPlainText(tContent('props.table.class.description'))        },
]);

const itemPropItems = computed(() => [
  { name: 'step',      type: tContent('props.table.step.type'),      defaultValue: tContent('props.table.step.default'),      required: tContent('props.table.step.required'),      description: toPlainText(tContent('props.table.step.description'))      },
  { name: 'completed', type: tContent('props.table.completed.type'), defaultValue: tContent('props.table.completed.default'), required: tContent('props.table.completed.required'), description: toPlainText(tContent('props.table.completed.description')) },
  { name: 'disabled',  type: tContent('props.table.disabled.type'),  defaultValue: tContent('props.table.disabled.default'),  required: tContent('props.table.disabled.required'),  description: toPlainText(tContent('props.table.disabled.description'))  },
  { name: 'class',     type: tContent('props.table.class.type'),     defaultValue: tContent('props.table.class.default'),     required: tContent('props.table.class.required'),     description: toPlainText(tContent('props.table.class.description'))     },
]);

const partPropItems = computed(() => [
  { name: 'class', type: tContent('props.table.class.type'), defaultValue: tContent('props.table.class.default'), required: tContent('props.table.class.required'), description: toPlainText(tContent('props.table.class.description')) },
]);

const tokenRows = computed(() => ([
  ['gap',                '--spacing-2'],
  ['itemGap',            '--spacing-2'],
  ['triggerGap',         '--spacing-1'],
  ['triggerRadius',      '--radius-md'],
  ['ring',               '--ring'],
  ['ringHalo',           '--background'],
  ['indicatorSize',      '--spacing-8'],
  ['indicatorRadius',    '--radius-full'],
  ['indicatorBg',        '--muted'],
  ['indicatorFg',        '--muted-foreground'],
  ['activeBg',           '--primary'],
  ['activeFg',           '--primary-foreground'],
  ['completedBg',        '--accent'],
  ['completedFg',        '--accent-foreground'],
  ['titleSize',          '--text-control-lg'],
  ['titleWeight',        '--font-weight-semi-bold'],
  ['descriptionSize',    '--text-control-sm'],
  ['descriptionColor',   '--muted-foreground'],
  ['separator',          '--border'],
  ['separatorLength',    '--spacing-8'],
  ['separatorCompleted', '--accent'],
  ['separatorDisabled',  '--muted'],
] as const).map(([key, token]) => ({
  token,
  value: tContent(`tokens.table.${key}.class`),
  description: tContent(`tokens.table.${key}.part`),
})));

const accessibilityItems = computed(() => [1, 2, 3, 4, 5, 6, 7].map(i => tContent(`accessibility.items.item${i}`)));

const keyboardItems = computed(() => [
  { key: 'Tab',       description: toPlainText(tContent('accessibility.keyboard.tab'))      },
  { key: 'Shift+Tab', description: toPlainText(tContent('accessibility.keyboard.shiftTab')) },
  { key: 'Enter',     description: toPlainText(tContent('accessibility.keyboard.enter'))    },
  { key: 'Space',     description: toPlainText(tContent('accessibility.keyboard.space'))    },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.tabs.name'),       description: toPlainText(tContent('related.items.tabs.description')),       path: '?path=/docs/primitives-navigation-tabs--docs'       },
  { name: tContent('related.items.breadcrumb.name'), description: toPlainText(tContent('related.items.breadcrumb.description')), path: '?path=/docs/primitives-navigation-breadcrumb--docs' },
  { name: tContent('related.items.progress.name'),   description: toPlainText(tContent('related.items.progress.description')),   path: '?path=/docs/primitives-feedback-progress--docs'     },
  { name: tContent('related.items.form.name'),       description: toPlainText(tContent('related.items.form.description')),       path: '?path=/docs/primitives-form-form--docs'             },
]);

const noteItems = computed(() => [1, 2, 3, 4, 5].map(i => ({ title: '', content: tContent(`notes.item${i}`) })));

const analyticsItems = computed(() => [
  { event: 'step_change',        trigger: toPlainText(tContent('analytics.table.step_change.trigger')),        payload: tContent('analytics.table.step_change.payload')        },
  { event: 'docs_section_viewed', trigger: toPlainText(tContent('analytics.table.docs_section_viewed.trigger')), payload: tContent('analytics.table.docs_section_viewed.payload') },
]);

const a11yCritCols = computed(() => ({
  criterion: tNav('common.criterion'),
  level: 'WCAG',
  how: tNav('common.howToVerify'),
}));

const functionalTestItems = computed(() => [1, 2, 3, 4].map(i => ({
  action:   tContent(`testes.functional.item${i}.action`),
  result:   tContent(`testes.functional.item${i}.result`),
  priority: localPriority(tContent(`testes.functional.item${i}.priority`)),
})));

const a11yTestItems = computed(() => [1, 2, 3, 4, 5, 6].map(i => ({
  criterion: tContent(`testes.accessibility.item${i}`),
  level: 'AA',
  how: '',
})));

const visualTestItems = computed(() => [1, 2, 3, 4].map(i => ({
  story:    tContent(`testes.visual.item${i}.story`),
  priority: localPriority(tContent(`testes.visual.item${i}.priority`)),
})));

// ─── Demonstração ─────────────────────────────────────────────────────────────

const demoLabels = computed(() => ({
  flow: tContent('demonstration.labels.flow'),
  completed: tContent('demonstration.labels.completed'),
  current: tContent('demonstration.labels.current'),
  back: tContent('demonstration.labels.back'),
  next: tContent('demonstration.labels.next'),
}));

const demoSteps = computed(() => [
  { step: 1, title: tContent('demonstration.labels.account'), description: tContent('demonstration.labels.accountHint') },
  { step: 2, title: tContent('demonstration.labels.address'), description: tContent('demonstration.labels.addressHint') },
  { step: 3, title: tContent('demonstration.labels.payment'), description: tContent('demonstration.labels.paymentHint') },
  { step: 4, title: tContent('demonstration.labels.review'),  description: tContent('demonstration.labels.reviewHint')  },
]);

const demoValue = ref(1);

// A composição tem o PRÓPRIO valor: dois fluxos na mesma página que
// compartilham estado avançam juntos, e quem lê acha que clicou no errado.
const wizardValue = ref(1);

// O payload carrega número e total — nunca o título traduzido, que dividiria um
// evento em três no GA4.
function emitStepChange(step: number, location: string) {
  track('step_change', {
    component: 'stepper',
    step,
    total: demoSteps.value.length,
    location,
  });
}

function goToStep(step: number) {
  demoValue.value = step;
  emitStepChange(step, 'docs_demo');
}

function goToWizardStep(step: number) {
  wizardValue.value = step;
  emitStepChange(step, 'docs_composition');
}

// ─── Previews de Do & Don't ───────────────────────────────────────────────────

const previewSteps = [
  { step: 1, title: 'Conta' },
  { step: 2, title: 'Endereço' },
  { step: 3, title: 'Pagamento' },
];

const previewLabels = computed(() => ({
  completed: demoLabels.value.completed,
  current: demoLabels.value.current,
}));
</script>

<template>
  <DocsPageLayout
    :nav-groups="navGroups"
    :active-section="activeSection"
    component-slug="stepper"
  >
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
      />
    </template>

    <!-- ── Demonstração ───────────────────────────────────────────── -->
    <DocsDemonstration
      :title="tContent('demonstration.title')"
      component-slug="stepper"
    >
      <div
        class="nds-stack nds-w-full"
        data-spacing="md"
      >
        <Stepper
          :value="demoValue"
          :aria-label="demoLabels.flow"
          :labels="{ completed: demoLabels.completed, current: demoLabels.current }"
          @step-select="goToStep"
        >
          <StepperItem
            v-for="item in demoSteps"
            :key="item.step"
            :step="item.step"
          >
            <StepperTrigger>
              <StepperIndicator />
              <StepperTitle>{{ item.title }}</StepperTitle>
              <StepperDescription>{{ item.description }}</StepperDescription>
            </StepperTrigger>
            <StepperSeparator v-if="item.step < demoSteps.length" />
          </StepperItem>
        </Stepper>

        <div
          class="nds-cluster"
          data-spacing="md"
        >
          <Button
            variant="outline"
            :disabled="demoValue === 1"
            @click="goToStep(demoValue - 1)"
          >
            {{ demoLabels.back }}
          </Button>
          <Button
            :disabled="demoValue === demoSteps.length"
            @click="goToStep(demoValue + 1)"
          >
            {{ demoLabels.next }}
          </Button>
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
      :guidelines="guidelines"
      :scenarios="scenarios"
      :ux-writing="uxWriting"
      :do="doList"
      :dont="dontList"
    />

    <!-- ── Do & Don't ─────────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="doDontPairs"
    >
      <!-- Par 1 — estado por forma e palavra, não só por cor -->
      <template #do-preview-0>
        <Stepper
          :value="2"
          :aria-label="demoLabels.flow"
          :labels="previewLabels"
        >
          <StepperItem
            v-for="item in previewSteps"
            :key="item.step"
            :step="item.step"
          >
            <StepperTrigger>
              <StepperIndicator />
              <StepperTitle>{{ item.title }}</StepperTitle>
            </StepperTrigger>
            <StepperSeparator v-if="item.step < previewSteps.length" />
          </StepperItem>
        </Stepper>
      </template>
      <template #dont-preview-0>
        <!-- Sem `labels`, e com o número mantido no indicador da etapa
             concluída: a diferença sobra só na cor do círculo. -->
        <Stepper
          :value="2"
          :aria-label="demoLabels.flow"
        >
          <StepperItem
            v-for="item in previewSteps"
            :key="item.step"
            :step="item.step"
          >
            <StepperTrigger>
              <StepperIndicator>{{ item.step }}</StepperIndicator>
              <StepperTitle>{{ item.title }}</StepperTitle>
            </StepperTrigger>
            <StepperSeparator v-if="item.step < previewSteps.length" />
          </StepperItem>
        </Stepper>
      </template>

      <!-- Par 2 — aria-current na etapa atual, sem região viva -->
      <template #do-preview-1>
        <Stepper
          :value="2"
          :aria-label="demoLabels.flow"
          :labels="previewLabels"
        >
          <StepperItem
            v-for="item in previewSteps"
            :key="item.step"
            :step="item.step"
          >
            <StepperTrigger>
              <StepperIndicator />
              <StepperTitle>{{ item.title }}</StepperTitle>
            </StepperTrigger>
            <StepperSeparator v-if="item.step < previewSteps.length" />
          </StepperItem>
        </Stepper>
      </template>
      <template #dont-preview-1>
        <div
          class="nds-stack"
          data-spacing="sm"
        >
          <Stepper
            :value="2"
            :aria-label="demoLabels.flow"
            :labels="previewLabels"
          >
            <StepperItem
              v-for="item in previewSteps"
              :key="item.step"
              :step="item.step"
            >
              <StepperTrigger>
                <StepperIndicator />
                <StepperTitle>{{ item.title }}</StepperTitle>
              </StepperTrigger>
              <StepperSeparator v-if="item.step < previewSteps.length" />
            </StepperItem>
          </Stepper>
          <!-- Ilustração do anti-padrão: o texto que uma região viva
               reanunciaria a cada avanço. Fica FORA da árvore de
               acessibilidade — página de documentação não abre região viva com
               conteúdo estático. -->
          <span
            aria-hidden="true"
            class="nds-text-body nds-text-muted-foreground"
          >Etapa 2 de 3</span>
        </div>
      </template>

      <!-- Par 3 — etapa indisponível sai da tabulação -->
      <template #do-preview-2>
        <Stepper
          :value="1"
          :aria-label="demoLabels.flow"
          :labels="previewLabels"
        >
          <StepperItem
            v-for="item in previewSteps"
            :key="item.step"
            :step="item.step"
            :disabled="item.step === 3"
          >
            <StepperTrigger>
              <StepperIndicator />
              <StepperTitle>{{ item.title }}</StepperTitle>
            </StepperTrigger>
            <StepperSeparator v-if="item.step < previewSteps.length" />
          </StepperItem>
        </Stepper>
      </template>
      <template #dont-preview-2>
        <Stepper
          :value="1"
          :aria-label="demoLabels.flow"
          :labels="previewLabels"
        >
          <StepperItem
            v-for="item in previewSteps"
            :key="item.step"
            :step="item.step"
          >
            <StepperTrigger>
              <StepperIndicator />
              <StepperTitle>{{ item.title }}</StepperTitle>
            </StepperTrigger>
            <StepperSeparator v-if="item.step < previewSteps.length" />
          </StepperItem>
        </Stepper>
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :code="codeImport"
      component-slug="stepper"
    />

    <!-- ── Composições ────────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.title')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="stepper"
      :items="compositionItems"
    >
      <template #variant-preview-0>
        <div
          class="nds-stack nds-w-full"
          data-spacing="md"
        >
          <Stepper
            :value="wizardValue"
            :aria-label="demoLabels.flow"
            :labels="{ completed: demoLabels.completed, current: demoLabels.current }"
            @step-select="goToWizardStep"
          >
            <StepperItem
              v-for="item in demoSteps"
              :key="item.step"
              :step="item.step"
            >
              <StepperTrigger>
                <StepperIndicator />
                <StepperTitle>{{ item.title }}</StepperTitle>
              </StepperTrigger>
              <StepperSeparator v-if="item.step < demoSteps.length" />
            </StepperItem>
          </Stepper>
          <div
            class="nds-p-4 nds-rounded-md nds-border-default nds-bg-card nds-stack"
            data-spacing="sm"
          >
            <h3 class="nds-text-body nds-font-semibold">
              {{ demoSteps[wizardValue - 1].title }}
            </h3>
            <p class="nds-text-body nds-text-muted-foreground">
              {{ demoSteps[wizardValue - 1].description }}
            </p>
          </div>
          <div
            class="nds-cluster"
            data-spacing="md"
          >
            <Button
              variant="outline"
              :disabled="wizardValue === 1"
              @click="goToWizardStep(wizardValue - 1)"
            >
              {{ demoLabels.back }}
            </Button>
            <Button
              :disabled="wizardValue === demoSteps.length"
              @click="goToWizardStep(wizardValue + 1)"
            >
              {{ demoLabels.next }}
            </Button>
          </div>
        </div>
      </template>

      <template #variant-preview-1>
        <Stepper
          :value="2"
          :aria-label="demoLabels.flow"
          :labels="{ completed: demoLabels.completed, current: demoLabels.current }"
        >
          <StepperItem
            v-for="item in demoSteps"
            :key="item.step"
            :step="item.step"
          >
            <StepperTrigger>
              <StepperIndicator />
              <StepperTitle>{{ item.title }}</StepperTitle>
              <StepperDescription>{{ item.description }}</StepperDescription>
            </StepperTrigger>
            <StepperSeparator v-if="item.step < demoSteps.length" />
          </StepperItem>
        </Stepper>
      </template>
    </DocsCompositions>

    <!-- ── Estados ────────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="stateCols"
      :items="stateItems"
    />

    <!-- ── Propriedades ───────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: 'Stepper', cols: propCols, items: rootPropItems },
        { title: 'StepperItem', cols: propCols, items: itemPropItems },
        { title: 'StepperTrigger · StepperIndicator · StepperTitle · StepperDescription · StepperSeparator', cols: propCols, items: partPropItems },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-code="tContent('props.extensibilityCode')"
    />

    <!-- ── Tokens ─────────────────────────────────────────────────── -->
    <DocsTokens
      :title="tContent('tokens.title')"
      :cols="{ token: tContent('tokens.table.token'), value: tContent('tokens.table.class'), description: tContent('tokens.table.part') }"
      :items="tokenRows"
      :customization-title="tContent('tokens.customizationTitle')"
      :customization-code="tContent('tokens.customizationCode')"
      language="css"
    />

    <!-- ── Acessibilidade ─────────────────────────────────────────── -->
    <DocsAccessibility
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-title="tContent('accessibility.keyboard.title')"
      :keyboard-items="keyboardItems"
      :screen-reader-title="tNav('common.screenReader')"
      :screen-reader-items="screenReaderItems"
    />

    <!-- ── Relacionados ───────────────────────────────────────────── -->
    <DocsRelated
      :title="tContent('related.title')"
      :items="relatedItems"
      component-slug="stepper"
    />

    <!-- ── Notas ──────────────────────────────────────────────────── -->
    <DocsNotes
      :title="tContent('notes.title')"
      :items="noteItems"
      component-slug="stepper"
    />

    <!-- ── Analytics ──────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :cols="{ event: tContent('analytics.table.event'), trigger: toPlainText(tContent('analytics.table.trigger')), payload: tContent('analytics.table.payload') }"
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
