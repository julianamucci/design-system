<script setup lang="ts">
import { computed, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { TraceWaterfall } from '@/components/ui/trace-waterfall';
import {
  useTraceWaterfallLabels,
  WIDE_TOTAL_MS,
  wideTraceSpans,
} from '@/components/ui/trace-waterfall/trace-waterfall.fixtures';
import { TOOL_CALL_STATES } from '@shared/primitives/chat-protocol';
import {
  resolveTraceWaterfall,
  type TraceWaterfallDrawing,
  type TraceWaterfallRowDrawing,
} from '@shared/primitives/trace-waterfall-axis';
import {
  TRACE_SPANS_FAILURE,
  TRACE_SPANS_ORDER,
  TRACE_SPANS_PARTIAL,
  TRACE_TOTAL_MS,
} from '@shared/primitives/trace-waterfall-examples';
import { Separator } from '@/components/ui/separator';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import traceWaterfallTranslations from '@shared/content/trace-waterfall/translations.json';

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
// O locale sai do `useTranslation`, nunca de store de estado: locale de Pinia
// já derrubou docs page em runtime neste repositório.
//
// NENHUMA LINHA SOBRESCRITA, e isso é o achado desta stack: o conteúdo
// compartilhado descreve `spans`, `totalMs`, `status` e `labels`, que são
// exatamente os nomes e os tipos que esta peça declara. A única divergência de
// API de framework — a classe extra por atributo de repasse — não tem linha na
// tabela, porque não é propriedade nenhuma.

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(traceWaterfallTranslations);

const traceLabels = useTraceWaterfallLabels();

// ─── As cascatas das fotos ────────────────────────────────────────────────────

/**
 * O rastro largo, montado UMA vez.
 *
 * A demonstração e o segundo contraexemplo mostram o mesmo desenho, e duas
 * chamadas independentes ao gerador dariam duas listas equivalentes com
 * identidade diferente — o que a foto não perdoa é a forma mudar entre uma e
 * outra.
 */
const wideSpans = wideTraceSpans();

/**
 * A conta da cascata, para os contraexemplos.
 *
 * Eles são montados À MÃO — a peça sempre escreve a leitura de cada linha e
 * sempre põe papel e nome na camada que rola, então não há propriedade que
 * produza o erro. O que muda no errado é o que se APAGA da marcação; o
 * desenho vem da mesma conta compartilhada, para que o par compare uma coisa
 * só.
 *
 * O `!` é seguro por construção: os dois rastros têm trecho e eixo, e a conta
 * só devolve nada quando falta um dos dois.
 */
const orderDrawing: TraceWaterfallDrawing = resolveTraceWaterfall(TRACE_SPANS_ORDER, TRACE_TOTAL_MS)!;
const wideDrawing: TraceWaterfallDrawing = resolveTraceWaterfall(wideSpans, WIDE_TOTAL_MS)!;

/** O recuo de uma linha, em propriedade personalizada. */
const rowStyleOf = (drawn: TraceWaterfallRowDrawing) => ({
  '--trace-waterfall-row-indent': String(drawn.indent),
});

/** As duas coordenadas da barra, em propriedade personalizada. */
const barStyleOf = (drawn: TraceWaterfallRowDrawing) => ({
  '--trace-waterfall-bar-start': String(drawn.start),
  '--trace-waterfall-bar-size': String(drawn.size),
});

/** A régua dita em palavras, com o eixo declarado no lugar do molde. */
const axisTextOf = (drawing: TraceWaterfallDrawing) =>
  traceLabels.value.axis.replace('{total}', String(drawing.totalMs));

/** A duração visível de uma linha, com o número no lugar do molde. */
const durationOf = (drawn: TraceWaterfallRowDrawing) =>
  traceLabels.value.duration.replace('{duration}', String(drawn.span.durationMs));

/** A palavra do estado, o começo e a duração — a leitura da linha. */
function readingOf(drawn: TraceWaterfallRowDrawing): string {
  const parts = [
    traceLabels.value.state[drawn.span.state],
    traceLabels.value.reading
      .replace('{start}', String(drawn.span.startMs))
      .replace('{duration}', String(drawn.span.durationMs)),
  ];
  if (drawn.clipped) parts.push(traceLabels.value.clipped);
  return parts.join(' ');
}

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria. O
// `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
const screenReaderItems = computed(() =>
  Object.entries(
    (traceWaterfallTranslations as unknown as Record<
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
  componentSlug: 'trace-waterfall',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'trace-waterfall',
    locale: newLocale,
    page_title: `${tContent('title')} · Design System`,
  });
}, { immediate: true });

// ─── Navigation groups ────────────────────────────────────────────────────────
//
// Não há seção de variantes: esta peça não tem eixo de forma. A estrutura é
// sempre a mesma — régua, camada que rola, linhas e barras — e o que muda é o
// estado de cada trecho, que é a seção de estados.

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
    component_name: 'trace-waterfall',
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
  items: ['region', 'label', 'axis', 'reading'].map(k => ({
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
 * A tabela de estados percorre `TOOL_CALL_STATES`.
 *
 * A tabela e a story dos estados leem a MESMA lista, e nenhuma das duas fica
 * para trás quando o vocabulário compartilhado cresce.
 */
const stateItems = computed(() =>
  TOOL_CALL_STATES.map(state => ({
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

const propsRows = (keys: string[]) =>
  keys.map(k => ({
    name: tContent(`props.table.${k}.name`),
    type: tContent(`props.table.${k}.type`),
    defaultValue: tContent(`props.table.${k}.default`),
    required: tContent(`props.table.${k}.required`),
    description: toPlainText(tContent(`props.table.${k}.description`)),
  }));

const propsTables = computed(() => [
  {
    title: 'TraceWaterfall',
    cols: propsCols.value,
    items: propsRows(['spans', 'totalMs', 'status', 'labels']),
  },
  {
    title: 'TraceWaterfallLabels',
    cols: propsCols.value,
    items: propsRows([
      'labelsRegion', 'labelsAxis', 'labelsDuration',
      'labelsReading', 'labelsClipped', 'labelsState',
    ]),
  },
  {
    title: 'TraceSpan',
    cols: propsCols.value,
    items: propsRows([
      'spanId', 'spanLabel', 'spanStart',
      'spanDuration', 'spanDepth', 'spanState',
    ]),
  },
]);

const interfaceCode = `export interface TraceWaterfallLabels {
  region: string;    // o nome da camada que rola — obrigatório
  axis: string;      // molde visível da régua, com \`{total}\`
  duration: string;  // molde da duração visível, com \`{duration}\`
  reading: string;   // molde da leitura, com \`{start}\` e \`{duration}\`
  clipped: string;   // a frase do trecho que não coube no eixo
  state: Record<ToolCallState, string>;
}

// O trecho vem de \`@shared/primitives/chat-protocol\`. \`TraceSpan\` é o TERCEIRO
// tipo daquele arquivo que carrega geometria, e entra pelo mesmo critério dos
// dois primeiros: ser a origem única do que cinco stacks reescreveriam.
//
// O INTERVALO É PLANO, e não um tipo aninhado: os dois tipos de geometria que
// já moravam ali carregam as coordenadas soltas, e um tipo que embrulha dois
// campos para um consumidor só é indireção, não vocabulário.
interface TraceSpan {
  id: string;
  label: string;
  startMs: number;     // desde a origem do eixo
  durationMs: number;
  depth: number;       // recuo em degraus, relativo aos demais
  state: ToolCallState;
}

// O TOTAL NÃO MORA NO TRECHO: ele é propriedade do EIXO, e é ele que faz as
// barras dividirem uma régua só. Um total por trecho seriam N verdades sobre a
// mesma régua.

type ToolCallState = 'pending' | 'running' | 'done' | 'failed';`;

const tokenItems = computed(() =>
  [
    'textLabel', 'spacing24', 'spacing40', 'spacing2', 'lineHeightNormal',
    'spacing3', 'border', 'radius', 'muted', 'ring', 'spacing4',
    'radiusFull', 'mutedForeground', 'foreground', 'background',
    'primary', 'primaryForeground', 'spacing1', 'success', 'destructive',
  ].map(k => ({
    token: tContent(`tokens.table.${k}.token`),
    value: tContent(`tokens.table.${k}.value`),
    description: toPlainText(tContent(`tokens.table.${k}.description`)),
  })),
);

const accessibilityItems = computed(() =>
  [1, 2, 3, 4, 5, 6, 7, 8].map(i => tContent(`accessibility.items.item${i}`)),
);

const keyboardItems = computed(() => [
  { key: 'Tab',   description: tContent('accessibility.keyboard.tab') },
  { key: 'Enter', description: tContent('accessibility.keyboard.enter') },
  { key: '← →',   description: tContent('accessibility.keyboard.arrows') },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.flowGraph.name'),     description: toPlainText(tContent('related.items.flowGraph.description')),     path: '?path=/docs/primitives-conversational-flowgraph--docs'     },
  { name: tContent('related.items.agentPlan.name'),     description: toPlainText(tContent('related.items.agentPlan.description')),     path: '?path=/docs/primitives-conversational-agentplan--docs'     },
  { name: tContent('related.items.messageTiming.name'), description: toPlainText(tContent('related.items.messageTiming.description')), path: '?path=/docs/primitives-conversational-messagetiming--docs' },
  { name: tContent('related.items.progress.name'),      description: toPlainText(tContent('related.items.progress.description')),      path: '?path=/docs/primitives-feedback-progress--docs'            },
]);

const noteItems = computed(() =>
  [1, 2, 3, 4, 5, 6, 7].map(i => ({ title: '', content: tContent(`notes.item${i}`) })),
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
  items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => ({
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
  items: [1, 2, 3, 4, 5, 6, 7].map(i => ({
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
      A legenda diz QUAL caso está desenhado — sem ela, quatro réguas
      empilhadas viram uma só, e o assunto da demonstração é justamente a
      diferença entre elas.
    -->
    <DocsDemonstration
      :title="tContent('demonstration.title')"
      component-slug="trace-waterfall"
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
            {{ tContent('demonstration.labels.order') }}
          </p>
          <TraceWaterfall
            :spans="TRACE_SPANS_ORDER"
            :total-ms="TRACE_TOTAL_MS"
            status="running"
            :labels="traceLabels"
          />
        </div>

        <Separator />

        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ tContent('demonstration.labels.failure') }}
          </p>
          <TraceWaterfall
            :spans="TRACE_SPANS_FAILURE"
            :total-ms="TRACE_TOTAL_MS"
            status="failed"
            :labels="traceLabels"
          />
        </div>

        <Separator />

        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ tContent('demonstration.labels.partial') }}
          </p>
          <!-- REVELAR É PASSAR MENOS TRECHOS: o eixo continua o mesmo, e as
               barras que sobram guardam a posição verdadeira. -->
          <TraceWaterfall
            :spans="TRACE_SPANS_PARTIAL"
            :total-ms="TRACE_TOTAL_MS"
            status="running"
            :labels="traceLabels"
          />
        </div>

        <Separator />

        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ tContent('demonstration.labels.wide') }}
          </p>
          <!-- O teto de largura é parte do assunto: sem ele a cascata larga
               ficaria folgada, e a camada que rola não teria o que mostrar. -->
          <div class="nds-max-w-md">
            <TraceWaterfall
              :spans="wideSpans"
              :total-ms="WIDE_TOTAL_MS"
              status="running"
              :labels="traceLabels"
            />
          </div>
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
      <template #do-preview-0>
        <div
          class="nds-stack nds-w-full"
          data-spacing="lg"
        >
          <TraceWaterfall
            :spans="TRACE_SPANS_ORDER"
            :total-ms="TRACE_TOTAL_MS"
            status="running"
            :labels="traceLabels"
          />
        </div>
      </template>
      <template #dont-preview-0>
        <div
          class="nds-stack nds-w-full"
          data-spacing="lg"
        >
          <!-- O contraexemplo é montado À MÃO, e tem de ser: a peça sempre
               escreve a leitura de cada linha, então não há propriedade que
               produza o erro. Aqui a frase foi removida, e sobra a barra —
               que é exatamente o que não chega a quem lê de ouvido. -->
          <div
            class="nds-trace-waterfall"
            data-slot="trace-waterfall"
            aria-busy="true"
          >
            <p
              class="nds-trace-waterfall-axis"
              data-slot="trace-waterfall-axis"
            >{{ axisTextOf(orderDrawing) }}</p>
            <div
              class="nds-trace-waterfall-viewport"
              data-slot="trace-waterfall-viewport"
              tabindex="0"
              role="group"
              :aria-label="traceLabels.region"
            >
              <ol
                class="nds-trace-waterfall-rows"
                data-slot="trace-waterfall-rows"
              >
                <li
                  v-for="(drawn, index) in orderDrawing.rows"
                  :key="index"
                  class="nds-trace-waterfall-row"
                  data-slot="trace-waterfall-row"
                  :data-state="drawn.span.state"
                  :data-span-id="drawn.span.id"
                  :style="rowStyleOf(drawn)"
                >
                  <span
                    class="nds-trace-waterfall-name"
                    data-slot="trace-waterfall-name"
                  >
                    <span
                      class="nds-trace-waterfall-marker"
                      data-slot="trace-waterfall-marker"
                      aria-hidden="true"
                    />
                    <span
                      class="nds-trace-waterfall-label"
                      data-slot="trace-waterfall-label"
                    >{{ drawn.span.label }}</span>
                  </span>
                  <span
                    class="nds-trace-waterfall-track"
                    data-slot="trace-waterfall-track"
                    aria-hidden="true"
                  >
                    <span
                      class="nds-trace-waterfall-bar"
                      data-slot="trace-waterfall-bar"
                      :style="barStyleOf(drawn)"
                    />
                  </span>
                  <span
                    class="nds-trace-waterfall-duration"
                    data-slot="trace-waterfall-duration"
                  >{{ durationOf(drawn) }}</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </template>

      <!-- O par é o MESMO rastro largo, e o que muda é a camada que rola ter,
           ou não, papel e nome. -->
      <template #do-preview-1>
        <div
          class="nds-stack nds-w-full"
          data-spacing="lg"
        >
          <div class="nds-max-w-md">
            <TraceWaterfall
              :spans="wideSpans"
              :total-ms="WIDE_TOTAL_MS"
              status="running"
              :labels="traceLabels"
            />
          </div>
        </div>
      </template>
      <template #dont-preview-1>
        <div
          class="nds-stack nds-w-full"
          data-spacing="lg"
        >
          <!-- O errado é a camada que rola sem papel e sem nome: quem chega
               ali por teclado para numa parada anônima. É o defeito que dois
               componentes desta casa já tiveram, e o motivo pelo qual o papel
               e o nome andam na mesma linha. -->
          <div class="nds-max-w-md">
            <div
              class="nds-trace-waterfall"
              data-slot="trace-waterfall"
              aria-busy="true"
            >
              <p
                class="nds-trace-waterfall-axis"
                data-slot="trace-waterfall-axis"
              >{{ axisTextOf(wideDrawing) }}</p>
              <div
                class="nds-trace-waterfall-viewport"
                data-slot="trace-waterfall-viewport"
                tabindex="0"
              >
                <ol
                  class="nds-trace-waterfall-rows"
                  data-slot="trace-waterfall-rows"
                >
                  <li
                    v-for="(drawn, index) in wideDrawing.rows"
                    :key="index"
                    class="nds-trace-waterfall-row"
                    data-slot="trace-waterfall-row"
                    :data-state="drawn.span.state"
                    :data-span-id="drawn.span.id"
                    :style="rowStyleOf(drawn)"
                  >
                    <span
                      class="nds-trace-waterfall-name"
                      data-slot="trace-waterfall-name"
                    >
                      <span
                        class="nds-trace-waterfall-marker"
                        data-slot="trace-waterfall-marker"
                        aria-hidden="true"
                      />
                      <span
                        class="nds-trace-waterfall-label"
                        data-slot="trace-waterfall-label"
                      >{{ drawn.span.label }}</span>
                    </span>
                    <span
                      class="nds-trace-waterfall-track"
                      data-slot="trace-waterfall-track"
                      aria-hidden="true"
                    >
                      <span
                        class="nds-trace-waterfall-bar"
                        data-slot="trace-waterfall-bar"
                        :style="barStyleOf(drawn)"
                      />
                    </span>
                    <span
                      class="nds-trace-waterfall-duration"
                      data-slot="trace-waterfall-duration"
                    >{{ durationOf(drawn) }}</span>
                    <span
                      class="nds-sr-only"
                      data-slot="trace-waterfall-row-reading"
                    >{{ readingOf(drawn) }}</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
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
      component-slug="trace-waterfall"
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
