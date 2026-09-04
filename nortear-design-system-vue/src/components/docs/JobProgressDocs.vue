<script setup lang="ts">
import { computed, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { JobProgress, type JobProgressLabels } from '@/components/ui/job-progress';
import {
  useJobLabel,
  useJobProgressLabels,
  JOB_COUNT,
  JOB_COUNT_WITHOUT_TOTAL,
} from '@/components/ui/job-progress/job-progress.fixtures';
import { RUN_STATUSES, type RunStatus } from '@shared/primitives/chat-protocol';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import jobTranslations from '@shared/content/job-progress/translations.json';

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
// A ÚNICA linha sobrescrita é o NOME do aviso de que alguém pediu a ação. O
// conteúdo compartilhado o descreve como callback, que é a forma do primitivo de
// referência; aqui ele é um evento, e quem consome o escuta. Divergência de API
// de framework se registra, não se "alinha" — e a forma do que se escuta
// (`(intent) => void`) é a mesma dos dois lados, então só o nome muda.

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(jobTranslations, {
  '*': { 'props.table.onAction.name': '@action' },
});

const jobLabel = useJobLabel();
const jobLabels = useJobProgressLabels();

/**
 * A conta sem denominador, já escrita.
 *
 * Ela existe aqui só para o contraexemplo, que é montado à mão: a peça a
 * escreve sozinha em toda foto legítima.
 */
const countWithoutTotalText = computed(() =>
  jobLabels.value.countWithoutTotal.replace(
    '{done}',
    JOB_COUNT_WITHOUT_TOTAL.done.toLocaleString(),
  ),
);

/**
 * O contraexemplo do segundo par: a palavra do estado apagada.
 *
 * A diferença entre o que corre e o que foi interrompido passa a existir só na
 * barra — e as duas param no mesmo lugar, então não existe diferença nenhuma
 * (WCAG 1.4.1).
 */
const mutedLabels = computed<JobProgressLabels>(() => ({
  ...jobLabels.value,
  status: RUN_STATUSES.reduce((acc, status) => {
    acc[status] = '';
    return acc;
  }, {} as Record<RunStatus, string>),
}));

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria. O
// `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
const screenReaderItems = computed(() =>
  Object.entries(
    (jobTranslations as unknown as Record<
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
  componentSlug: 'job-progress',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'job-progress',
    locale: newLocale,
    page_title: `${tContent('title')} · Design System`,
  });
}, { immediate: true });

// ─── Navigation groups ────────────────────────────────────────────────────────
//
// Não há seção de variantes: esta peça não tem eixo de forma. A grade é sempre a
// mesma, e o que muda é o que a barra pode dizer — o que é estado, e mora na
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
    component_name: 'job-progress',
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
  items: ['jobLabel', 'count', 'countWithoutTotal', 'status', 'action'].map(k => ({
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
 * A tabela de estados percorre `RUN_STATUSES`.
 *
 * A tabela e a story dos estados leem a MESMA lista, e nenhuma das duas fica
 * para trás quando o vocabulário compartilhado cresce.
 */
const stateItems = computed(() =>
  RUN_STATUSES.map(status => ({
    label: tContent(`states.${status}.label`),
    trigger: toPlainText(tContent(`states.${status}.trigger`)),
    behavior: toPlainText(tContent(`states.${status}.behavior`)),
  })),
);

const propsCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const propsTables = computed(() => [
  {
    title: 'JobProgress',
    cols: propsCols.value,
    items: ['label', 'status', 'count', 'labels', 'onAction'].map(k => ({
      name: tContent(`props.table.${k}.name`),
      type: tContent(`props.table.${k}.type`),
      defaultValue: tContent(`props.table.${k}.default`),
      required: tContent(`props.table.${k}.required`),
      description: toPlainText(tContent(`props.table.${k}.description`)),
    })),
  },
  {
    title: 'JobProgressLabels',
    cols: propsCols.value,
    items: ['labelsStatus', 'labelsCount', 'labelsCountWithoutTotal', 'labelsAction'].map(k => ({
      name: tContent(`props.table.${k}.name`),
      type: tContent(`props.table.${k}.type`),
      defaultValue: tContent(`props.table.${k}.default`),
      required: tContent(`props.table.${k}.required`),
      description: toPlainText(tContent(`props.table.${k}.description`)),
    })),
  },
]);

const interfaceCode = `interface JobProgressLabels {
  status: Record<RunStatus, string>;                  // a palavra de cada estado
  count: string;                                      // molde com \`{done}\` e \`{total}\`
  countWithoutTotal: string;                          // molde com \`{done}\` só
  action?: Partial<Record<RunStatus, string>>;        // o rótulo da ação onde ela existe
}

// A conta e o que a barra mostra vêm de \`@shared/primitives/chat-protocol\`:
interface JobCount {
  done: number;
  total?: number;   // ausente é "não se sabe", nunca zero
}

// É ela que decide se a barra tem uma fração para mostrar. Mora no vocabulário,
// e não na tela, porque a resposta tem de ser a mesma nas cinco stacks — e a
// que discordaria é a do trabalho parado sem total.
declare function jobProgressValue(status: RunStatus, count?: JobCount): number | null;`;

const tokenItems = computed(() =>
  [
    'textLabel', 'mutedForeground', 'spacing1', 'spacing2',
    'foreground', 'fontWeightMedium', 'spacing6',
    'primary', 'success', 'destructive',
  ].map(k => ({
    token: tContent(`tokens.table.${k}.token`),
    value: tContent(`tokens.table.${k}.value`),
    description: toPlainText(tContent(`tokens.table.${k}.description`)),
  })),
);

const accessibilityItems = computed(() =>
  [1, 2, 3, 4, 5, 6, 7].map(i => tContent(`accessibility.items.item${i}`)),
);

const keyboardItems = computed(() => [
  { key: 'Tab',   description: tContent('accessibility.keyboard.tab') },
  { key: 'Enter', description: tContent('accessibility.keyboard.enter') },
  { key: '↑ ↓',   description: tContent('accessibility.keyboard.arrows') },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.agentStatus.name'),     description: toPlainText(tContent('related.items.agentStatus.description')),     path: '?path=/docs/components-conversational-agentstatus--docs'     },
  { name: tContent('related.items.agentPlan.name'),       description: toPlainText(tContent('related.items.agentPlan.description')),       path: '?path=/docs/components-conversational-agentplan--docs'       },
  { name: tContent('related.items.progress.name'),        description: toPlainText(tContent('related.items.progress.description')),        path: '?path=/docs/components-feedback-progress--docs'              },
  { name: tContent('related.items.connectionState.name'), description: toPlainText(tContent('related.items.connectionState.description')), path: '?path=/docs/components-conversational-connectionstate--docs' },
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
  items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => ({
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
  items: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => ({
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
      A legenda diz QUAL caso está desenhado — sem ela, quatro peças empilhadas
      viram uma só, e o assunto da demonstração é justamente a diferença entre
      elas.

      A MESMA conta vai para as fotos, de propósito: quem decide o que a barra
      mostra em cada estado é o vocabulário compartilhado, e não esta página.
    -->
    <DocsDemonstration
      :title="tContent('demonstration.title')"
      component-slug="job-progress"
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
            {{ tContent('demonstration.labels.running') }}
          </p>
          <JobProgress
            :label="jobLabel"
            status="running"
            :count="JOB_COUNT"
            :labels="jobLabels"
          />
        </div>

        <Separator />

        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ tContent('demonstration.labels.unknownTotal') }}
          </p>
          <JobProgress
            :label="jobLabel"
            status="running"
            :count="JOB_COUNT_WITHOUT_TOTAL"
            :labels="jobLabels"
          />
        </div>

        <Separator />

        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ tContent('demonstration.labels.stopped') }}
          </p>
          <JobProgress
            :label="jobLabel"
            status="stopped"
            :count="JOB_COUNT"
            :labels="jobLabels"
          />
        </div>

        <Separator />

        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ tContent('demonstration.labels.complete') }}
          </p>
          <JobProgress
            :label="jobLabel"
            status="complete"
            :count="JOB_COUNT"
            :labels="jobLabels"
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
      <template #do-preview-0>
        <div
          class="nds-stack nds-w-full"
          data-spacing="lg"
        >
          <JobProgress
            :label="jobLabel"
            status="running"
            :count="JOB_COUNT_WITHOUT_TOTAL"
            :labels="jobLabels"
          />
        </div>
      </template>
      <template #dont-preview-0>
        <div
          class="nds-stack nds-w-full"
          data-spacing="lg"
        >
          <!-- O contraexemplo é montado À MÃO, e tem de ser: a peça trata total
               zero como ausência, então não há argumento que produza o erro.
               Aqui a barra determinada em zero é posta no lugar da
               indeterminada, para que se veja a trilha vazia dizendo "acabou de
               começar" para algo que já andou muito. -->
          <div
            class="nds-job-progress"
            data-slot="job-progress"
            data-status="running"
            aria-busy="true"
          >
            <span
              class="nds-job-progress-label"
              data-slot="job-progress-label"
            >{{ jobLabel }}</span>
            <span
              class="nds-job-progress-count"
              data-slot="job-progress-count"
              aria-hidden="true"
            >{{ countWithoutTotalText }}</span>
            <Progress
              class="nds-job-progress-bar"
              :model-value="0"
              :aria-label="jobLabel"
            />
            <span
              class="nds-job-progress-status"
              data-slot="job-progress-status"
            >{{ jobLabels.status.running }}</span>
            <Button
              class="nds-job-progress-action"
              data-slot="job-progress-action"
              variant="outline"
              size="sm"
            >
              {{ jobLabels.action?.running }}
            </Button>
          </div>
        </div>
      </template>

      <!-- O par é o MESMO par de estados, e as duas barras param no mesmo
           lugar: o que muda é se a palavra chega a quem não distingue uma barra
           parada de outra. -->
      <template #do-preview-1>
        <div
          class="nds-stack nds-w-full"
          data-spacing="lg"
        >
          <JobProgress
            :label="jobLabel"
            status="running"
            :count="JOB_COUNT"
            :labels="jobLabels"
          />
          <JobProgress
            :label="jobLabel"
            status="stopped"
            :count="JOB_COUNT"
            :labels="jobLabels"
          />
        </div>
      </template>
      <template #dont-preview-1>
        <div
          class="nds-stack nds-w-full"
          data-spacing="lg"
        >
          <JobProgress
            :label="jobLabel"
            status="running"
            :count="JOB_COUNT"
            :labels="mutedLabels"
          />
          <JobProgress
            :label="jobLabel"
            status="stopped"
            :count="JOB_COUNT"
            :labels="mutedLabels"
          />
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
      component-slug="job-progress"
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
