<script setup lang="ts">
import { computed, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { AgentPlan, type AgentPlanLabels } from '@/components/ui/agent-plan';
import {
  everyStatePlan,
  finishedPlan,
  proposedPlan,
  runningPlan,
  useAgentPlanLabels,
} from '@/components/ui/agent-plan/agent-plan.fixtures';
import {
  PLAN_STEP_STATES,
  type PlanStepState,
} from '@shared/primitives/chat-protocol';
import { Separator } from '@/components/ui/separator';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import planTranslations from '@shared/content/agent-plan/translations.json';

import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.vue';
import DocsDemonstration from '@/components/docs/shared/sections/DocsDemonstration.vue';
import DocsAnatomy       from '@/components/docs/shared/sections/DocsAnatomy.vue';
import DocsWhenToUse     from '@/components/docs/shared/sections/DocsWhenToUse.vue';
import DocsDoDont        from '@/components/docs/shared/sections/DocsDoDont.vue';
import DocsImport        from '@/components/docs/shared/sections/DocsImport.vue';
import DocsStates        from '@/components/docs/shared/sections/DocsStates.vue';
import DocsProps         from '@/components/docs/shared/sections/DocsProps.vue';
import DocsTokens        from '@/components/docs/shared/sections/DocsTokens.vue';
import DocsAccessibility from '@/components/docs/shared/sections/DocsAccessibility.vue';
import DocsRelated       from '@/components/docs/shared/sections/DocsRelated.vue';
import DocsNotes         from '@/components/docs/shared/sections/DocsNotes.vue';
import DocsAnalytics     from '@/components/docs/shared/sections/DocsAnalytics.vue';
import DocsTestes        from '@/components/docs/shared/sections/DocsTestes.vue';
import { stripHtml, toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────
//
// O locale sai do `useTranslation`, nunca de store de estado: locale de Pinia já
// derrubou docs page em runtime neste repositório.
//
// Nenhuma linha sobrescrita: os nomes das duas propriedades e os dos quatro
// campos do passo são os mesmos do conteúdo compartilhado. A única divergência
// desta stack é por onde a classe extra entra, e classe não é linha de tabela.

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(planTranslations);

const planLabels = useAgentPlanLabels();

/**
 * As listas desenhadas na página, montadas UMA vez.
 *
 * O texto dos passos é dado de exemplo e não muda com o idioma — só os rótulos
 * de interface mudam, e eles chegam por `planLabels`. Montar as listas a cada
 * render trocaria a identidade delas sem que nada tivesse mudado.
 */
const proposedSteps = proposedPlan();
const runningSteps = runningPlan();
const finishedSteps = finishedPlan();
const everyStateSteps = everyStatePlan();

/**
 * O contraexemplo do primeiro par: o passo pulado fora da lista.
 *
 * O plano passa a contar uma história diferente da que aconteceu, e quem lê
 * perde a informação de que havia outro caminho.
 */
const withoutSkipped = finishedSteps.filter((step) => step.state !== 'skipped');

/**
 * O contraexemplo do segundo par: as palavras dos estados apagadas.
 *
 * A diferença entre os cinco estados passa a existir só na forma e na cor do
 * marcador — e nenhuma das duas descreve estado sozinha (WCAG 1.4.1).
 */
const wordlessLabels = computed<AgentPlanLabels>(() => ({
  ...planLabels.value,
  state: PLAN_STEP_STATES.reduce((acc, state) => {
    acc[state] = '';
    return acc;
  }, {} as Record<PlanStepState, string>),
}));

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria. O
// `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
const screenReaderItems = computed(() =>
  Object.entries(
    (planTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >)[locale.value]?.accessibility?.screenReader ?? {},
  )
    .filter(([key]) => key !== 'title')
    .map(([, value]) => value),
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
  componentSlug: 'agent-plan',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'agent-plan',
    locale: newLocale,
    page_title: `${tContent('title')} · Design System`,
  });
}, { immediate: true });

// ─── Navigation groups ────────────────────────────────────────────────────────
//
// Não há seção de variantes: esta peça não tem eixo de forma. A lista é sempre a
// mesma, e o que muda é em que pé está cada passo — o que é estado, e mora na
// seção de estados.

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
      { id: 'importacao',   label: tNav('nav.import') },
      { id: 'estados',      label: tNav('nav.states') },
      { id: 'propriedades', label: tNav('nav.props')  },
      { id: 'tokens',       label: tNav('nav.tokens') },
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
    component_name: 'agent-plan',
    locale: locale.value,
  });
});

// ─── Conteúdo das seções ──────────────────────────────────────────────────────

const anatomyItems = computed(() =>
  [1, 2, 3, 4, 5].map(i => tContent(`anatomy.item${i}`)),
);

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
    a: toPlainText(tContent(`usage.scenarios.item${i}.a`)),
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
  items: ['stepLabel', 'stateWord', 'detail', 'order'].map(k => ({
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

const doDontPairs = computed(() => [
  {
    doLabel: tNav('common.do'),
    dontLabel: tNav('common.dont'),
    doCaption: toPlainText(tContent('doDont.pair1.do')),
    dontCaption: toPlainText(tContent('doDont.pair1.dont')),
  },
  {
    doLabel: tNav('common.do'),
    dontLabel: tNav('common.dont'),
    doCaption: toPlainText(tContent('doDont.pair2.do')),
    dontCaption: toPlainText(tContent('doDont.pair2.dont')),
  },
]);

/**
 * A tabela de estados percorre `PLAN_STEP_STATES`.
 *
 * A tabela e a story dos estados leem a MESMA lista, e nenhuma das duas fica
 * para trás quando o vocabulário compartilhado cresce.
 */
const stateItems = computed(() =>
  PLAN_STEP_STATES.map(state => ({
    label: tContent(`states.${state}.label`),
    trigger: toPlainText(tContent(`states.${state}.trigger`)),
    behavior: toPlainText(tContent(`states.${state}.behavior`)),
  })),
);

const propsCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

function propRows(keys: string[]) {
  return keys.map(k => ({
    name: tContent(`props.table.${k}.name`),
    type: tContent(`props.table.${k}.type`),
    defaultValue: tContent(`props.table.${k}.default`),
    required: tContent(`props.table.${k}.required`),
    description: toPlainText(tContent(`props.table.${k}.description`)),
  }));
}

const propsTables = computed(() => [
  { title: 'AgentPlan', cols: propsCols.value, items: propRows(['steps', 'labels']) },
  {
    title: 'AgentPlanLabels',
    cols: propsCols.value,
    items: propRows(['labelsPlan', 'labelsState']),
  },
  {
    title: 'PlanStep',
    cols: propsCols.value,
    items: propRows(['stepId', 'stepLabel', 'stepState', 'stepDetail']),
  },
]);

const interfaceCode = `export interface AgentPlanLabels {
  plan: string;                          // o nome acessível da lista
  state: Record<PlanStepState, string>;  // a palavra de cada estado
}

// O passo e a pergunta "já terminou?" vêm de
// \`@shared/primitives/chat-protocol\`:
type PlanStepState = 'pending' | 'running' | 'done' | 'failed' | 'skipped';

interface PlanStep {
  id?: string;
  label: string;
  state: PlanStepState;
  detail?: string;   // por que pulou, o que produziu, o que falhou
}`;

const tokenItems = computed(() =>
  [
    'textLabel', 'foreground', 'mutedForeground', 'border',
    'primary', 'success', 'destructive',
    'spacing1', 'spacing2', 'spacing4', 'radiusFull',
  ].map(k => ({
    token: tContent(`tokens.table.${k}.token`),
    value: tContent(`tokens.table.${k}.value`),
    description: toPlainText(tContent(`tokens.table.${k}.description`)),
  })),
);

const accessibilityItems = computed(() =>
  [1, 2, 3, 4, 5].map(i => tContent(`accessibility.items.item${i}`)),
);

const keyboardItems = computed(() => [
  { key: 'Tab',   description: tContent('accessibility.keyboard.tab') },
  { key: 'Enter', description: tContent('accessibility.keyboard.enter') },
  { key: '↑ ↓',   description: tContent('accessibility.keyboard.arrows') },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.agentStatus.name'), description: toPlainText(tContent('related.items.agentStatus.description')), path: '?path=/docs/primitives-conversational-agentstatus--docs' },
  { name: tContent('related.items.chatThread.name'),  description: toPlainText(tContent('related.items.chatThread.description')),  path: '?path=/docs/primitives-conversational-chatthread--docs'  },
  { name: tContent('related.items.progress.name'),    description: toPlainText(tContent('related.items.progress.description')),    path: '?path=/docs/primitives-feedback-progress--docs'           },
  { name: tContent('related.items.badge.name'),       description: toPlainText(tContent('related.items.badge.description')),       path: '?path=/docs/primitives-feedback-badge--docs'              },
]);

const noteItems = computed(() =>
  [1, 2, 3, 4, 5, 6].map(i => ({ title: '', content: tContent(`notes.item${i}`) })),
);

const analyticsItems = computed(() =>
  ['pageView', 'sectionViewed', 'demoClick'].map(k => ({
    event: tContent(`analytics.table.${k}`),
    trigger: toPlainText(tContent(`analytics.table.${k}Trigger`)),
    payload: tContent(`analytics.table.${k}Payload`),
  })),
);

const functionalTests = computed(() => ({
  title: tContent('testes.functional.title'),
  description: tContent('testes.functional.description'),
  cols: {
    action: tNav('common.userAction'),
    result: tNav('common.expectedResult'),
    priority: tNav('common.priority'),
  },
  items: [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({
    action: toPlainText(tContent(`testes.functional.item${i}.action`)),
    result: toPlainText(tContent(`testes.functional.item${i}.result`)),
    priority: localPriority(tContent(`testes.functional.item${i}.priority`)),
  })),
}));

// A lista é PLANA: cada item é um critério, e o "como verificar" é o próprio
// addon-a11y rodando em toda story.
const accessibilityTests = computed(() => ({
  title: tContent('testes.accessibility.title'),
  description: tContent('testes.accessibility.description'),
  cols: {
    criterion: tNav('common.criterion'),
    level: 'WCAG',
    how: tNav('common.howToVerify'),
  },
  items: [1, 2, 3, 4, 5, 6].map(i => ({
    criterion: toPlainText(tContent(`testes.accessibility.item${i}`)),
    level: 'AA',
    how: '—',
  })),
}));

const visualTests = computed(() => ({
  title: tContent('testes.visual.title'),
  description: tContent('testes.visual.description'),
  cols: {
    story: tNav('common.storyState'),
    priority: tNav('common.priority'),
  },
  items: [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({
    story: toPlainText(tContent(`testes.visual.item${i}.story`)),
    priority: localPriority(tContent(`testes.visual.item${i}.priority`)),
  })),
}));
</script>

<template>
  <DocsPageLayout
    :nav-groups="navGroups"
    :active-section="activeSection"
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
    <!--
      OS DOIS USOS, na mesma página e sem virar duas páginas: o plano proposto
      antes de agir, a lista mantida durante, e o que sobra quando tudo se
      resolveu. É a mesma peça nas três.

      A legenda diz QUAL caso está desenhado — sem ela, três listas empilhadas
      viram uma só, e o assunto da demonstração é justamente a diferença entre
      elas.
    -->
    <DocsDemonstration
      :title="tContent('demonstration.title')"
      component-slug="agent-plan"
    >
      <div
        class="nds-stack nds-w-full"
        data-spacing="lg"
      >
        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ stripHtml(tContent('demonstration.labels.proposed')) }}
          </p>
          <AgentPlan
            :steps="proposedSteps"
            :labels="planLabels"
          />
        </div>

        <Separator />

        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ stripHtml(tContent('demonstration.labels.running')) }}
          </p>
          <AgentPlan
            :steps="runningSteps"
            :labels="planLabels"
          />
        </div>

        <Separator />

        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ stripHtml(tContent('demonstration.labels.finished')) }}
          </p>
          <AgentPlan
            :steps="finishedSteps"
            :labels="planLabels"
          />
        </div>
      </div>
    </DocsDemonstration>

    <!-- ── Anatomia ───────────────────────────────────────────────── -->
    <DocsAnatomy
      :title="tContent('anatomy.title')"
      :items="anatomyItems"
      :structure-label="tContent('anatomy.structureLabel')"
      :structure-code="tContent('anatomy.structureCode')"
      language="html"
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

    <!-- ── Do &amp; Don't ─────────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="doDontPairs"
    >
      <!-- O par é o MESMO plano: o que muda é se o passo que ficou pelo caminho
           continua na lista, com o motivo. -->
      <template #do-preview-0>
        <AgentPlan
          :steps="finishedSteps"
          :labels="planLabels"
        />
      </template>
      <template #dont-preview-0>
        <AgentPlan
          :steps="withoutSkipped"
          :labels="planLabels"
        />
      </template>

      <!-- O contraexemplo: as palavras apagadas, e a diferença entre os cinco
           estados passa a existir só na forma e na cor do marcador. -->
      <template #do-preview-1>
        <AgentPlan
          :steps="everyStateSteps"
          :labels="planLabels"
        />
      </template>
      <template #dont-preview-1>
        <AgentPlan
          :steps="everyStateSteps"
          :labels="wordlessLabels"
        />
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :description="tContent('import.basic')"
      :code="tContent('import.basicCode')"
      :secondary-description="tContent('import.withLabels')"
      :secondary-code="tContent('import.withLabelsCode')"
    />

    <!-- ── Estados ────────────────────────────────────────────────── -->
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
      :tables="propsTables"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="stripHtml(tContent('props.extensibility'))"
      :extensibility-code="tContent('props.extensibilityCode')"
    />

    <!-- ── Tokens ─────────────────────────────────────────────────── -->
    <DocsTokens
      :title="tContent('tokens.title')"
      :cols="{
        token: tContent('tokens.table.token'),
        value: tContent('tokens.table.value'),
        description: tContent('tokens.table.description'),
      }"
      :items="tokenItems"
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
      :screen-reader-title="tContent('accessibility.screenReader.title')"
      :screen-reader-items="screenReaderItems"
    />

    <!-- ── Relacionados ───────────────────────────────────────────── -->
    <DocsRelated
      :title="tContent('related.title')"
      :items="relatedItems"
    />

    <!-- ── Notas ──────────────────────────────────────────────────── -->
    <DocsNotes
      :title="tContent('notes.title')"
      :items="noteItems"
      component-slug="agent-plan"
    />

    <!-- ── Analytics ──────────────────────────────────────────────── -->
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
      :functional="functionalTests"
      :accessibility="accessibilityTests"
      :visual="visualTests"
    />
  </DocsPageLayout>
</template>
