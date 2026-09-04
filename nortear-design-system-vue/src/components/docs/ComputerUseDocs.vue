<script setup lang="ts">
import { computed, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { ComputerUse } from '@/components/ui/computer-use';
import {
  ComputerUseDemoScreen,
  useComputerUseLabels,
} from '@/components/ui/computer-use/computer-use.fixtures';
import { RUN_STATUSES } from '@shared/primitives/chat-protocol';
import {
  COMPUTER_STEPS_LOGIN,
  COMPUTER_URL,
} from '@shared/primitives/computer-use-examples';
import { Separator } from '@/components/ui/separator';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import computerUseTranslations from '@shared/content/computer-use/translations.json';

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
// A ÚNICA LINHA SOBRESCRITA é a da tela, e ela registra a divergência de API de
// framework: o conteúdo compartilhado descreve o espaço da tela como uma
// propriedade que recebe um nó já montado, e aqui ele é um SLOT NOMEADO. Troca
// o NOME e o TIPO, e nunca a DESCRIÇÃO — o que a tela É, e de quem é o texto
// alternativo dela, não muda com a stack.

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(computerUseTranslations, {
  '*': {
    'props.table.screen.name': '#screen',
    'props.table.screen.type': 'slot',
  },
});

const computerLabels = useComputerUseLabels();

const url = COMPUTER_URL;
const steps = COMPUTER_STEPS_LOGIN;

/**
 * As três marcas que a peça desenharia no quarto passo.
 *
 * Elas existem aqui só para o contraexemplo, que é montado à mão: a peça as
 * desenha sozinha em toda foto legítima.
 */
const trailAtFourthStep = computed(() => COMPUTER_STEPS_LOGIN.slice(1, 4));

/** O último passo da sessão — o que a legenda do segundo par descreve. */
const lastStep = computed(() => COMPUTER_STEPS_LOGIN[COMPUTER_STEPS_LOGIN.length - 1]!);

/** A contagem do último passo, já dentro do molde do idioma. */
const lastPositionText = computed(() =>
  computerLabels.value.position
    .replace('{index}', String(COMPUTER_STEPS_LOGIN.length))
    .replace('{total}', String(COMPUTER_STEPS_LOGIN.length)),
);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria. O
// `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
const screenReaderItems = computed(() =>
  Object.entries(
    (computerUseTranslations as unknown as Record<
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
  componentSlug: 'computer-use',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'computer-use',
    locale: newLocale,
    page_title: `${tContent('title')} · Design System`,
  });
}, { immediate: true });

// ─── Navigation groups ────────────────────────────────────────────────────────
//
// Não há seção de variantes: esta peça não tem eixo de forma. A estrutura é
// sempre a mesma — endereço, quadro e legenda — e o que muda é quanto cada
// parte tem para dizer, que é estado e mora na seção de estados.

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
    component_name: 'computer-use',
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
  items: ['address', 'action', 'target', 'position'].map(k => ({
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
    title: 'ComputerUse',
    cols: propsCols.value,
    items: propsRows(['url', 'screen', 'steps', 'activeIndex', 'status', 'labels']),
  },
  {
    title: 'ComputerUseLabels',
    cols: propsCols.value,
    items: propsRows(['labelsAddress', 'labelsPosition']),
  },
  {
    title: 'ComputerStep',
    cols: propsCols.value,
    items: propsRows(['stepAction', 'stepTarget', 'stepX', 'stepY']),
  },
]);

const interfaceCode = `interface ComputerUseLabels {
  address: string;    // a palavra que apresenta o endereço, só para quem ouve
  position: string;   // molde com \`{index}\` e \`{total}\`
}

// O passo vem de \`@shared/primitives/chat-protocol\`, e é o primeiro tipo
// daquele arquivo que carrega GEOMETRIA. \`action\` e \`target\` rimam com o nome
// e o detalhe de uma chamada de ferramenta; \`x\` e \`y\` não têm par em nada que
// o vocabulário já descreva, e é essa dupla que faz a peça existir.
interface ComputerStep {
  id?: string;
  action: string;
  target: string;
  x: number;   // porcentagem da largura do quadro
  y: number;   // porcentagem da altura do quadro
}

// O ESTADO É DA SESSÃO, e não do passo. Um estado por passo faria a peça pintar
// cores sobre uma tela de terceiro, que é justamente a codificação que a legenda
// existe para não precisar.
type RunStatus = 'idle' | 'running' | 'stopped' | 'complete' | 'failed';`;

const tokenItems = computed(() =>
  [
    'textLabel', 'spacing1', 'spacing2', 'spacing3', 'muted', 'border',
    'radius', 'radiusSm', 'radiusFull', 'mutedForeground', 'foreground',
    'background', 'primary', 'fontWeightMedium', 'durationStately', 'easeStandard',
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
  { key: '↑ ↓',   description: tContent('accessibility.keyboard.arrows') },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.agentStatus.name'),   description: toPlainText(tContent('related.items.agentStatus.description')),   path: '?path=/docs/components-conversational-agentstatus--docs'   },
  { name: tContent('related.items.toolGroup.name'),     description: toPlainText(tContent('related.items.toolGroup.description')),     path: '?path=/docs/components-conversational-toolgroup--docs'     },
  { name: tContent('related.items.terminalBlock.name'), description: toPlainText(tContent('related.items.terminalBlock.description')), path: '?path=/docs/components-conversational-terminalblock--docs' },
  { name: tContent('related.items.agentPlan.name'),     description: toPlainText(tContent('related.items.agentPlan.description')),     path: '?path=/docs/components-conversational-agentplan--docs'     },
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
  items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => ({
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
  items: [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({
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
  items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => ({
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
      A legenda diz QUAL caso está desenhado — sem ela, quatro molduras
      empilhadas viram uma só, e o assunto da demonstração é justamente a
      diferença entre elas.

      A TELA É NOVA A CADA MOLDURA, e tem de ser: um nó só, passado a duas
      peças, seria movido da primeira para a segunda — e a primeira moldura
      ficaria vazia.
    -->
    <DocsDemonstration
      :title="tContent('demonstration.title')"
      component-slug="computer-use"
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
          <ComputerUse
            :url="url"
            :steps="steps"
            :active-index="3"
            status="running"
            :labels="computerLabels"
          >
            <template #screen>
              <ComputerUseDemoScreen />
            </template>
          </ComputerUse>
        </div>

        <Separator />

        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ tContent('demonstration.labels.finished') }}
          </p>
          <ComputerUse
            :url="url"
            :steps="steps"
            :active-index="steps.length - 1"
            status="complete"
            :labels="computerLabels"
          >
            <template #screen>
              <ComputerUseDemoScreen />
            </template>
          </ComputerUse>
        </div>

        <Separator />

        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ tContent('demonstration.labels.firstStep') }}
          </p>
          <ComputerUse
            :url="url"
            :steps="steps"
            :active-index="0"
            status="running"
            :labels="computerLabels"
          >
            <template #screen>
              <ComputerUseDemoScreen />
            </template>
          </ComputerUse>
        </div>

        <Separator />

        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ tContent('demonstration.labels.withoutSteps') }}
          </p>
          <!-- Sem passo nenhum não há rastro nem legenda: sobra a moldura com o
               endereço e a tela. -->
          <ComputerUse
            :url="url"
            status="idle"
            :labels="computerLabels"
          >
            <template #screen>
              <ComputerUseDemoScreen />
            </template>
          </ComputerUse>
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
          <ComputerUse
            :url="url"
            :steps="steps"
            :active-index="3"
            status="running"
            :labels="computerLabels"
          >
            <template #screen>
              <ComputerUseDemoScreen />
            </template>
          </ComputerUse>
        </div>
      </template>
      <template #dont-preview-0>
        <div
          class="nds-stack nds-w-full"
          data-spacing="lg"
        >
          <!-- O contraexemplo é montado À MÃO, e tem de ser: a peça sempre
               desenha a legenda quando há passo, então não há propriedade que
               produza o erro. Aqui a legenda não existe, e sobra a marca sobre
               a imagem — que é exatamente o que não chega a quem não vê. -->
          <figure
            class="nds-computer-use"
            data-slot="computer-use"
            data-status="running"
            aria-busy="true"
          >
            <p
              class="nds-computer-use-address nds-font-mono"
              data-slot="computer-use-address"
            >
              <span class="nds-sr-only">{{ computerLabels.address }}</span>
              <span
                class="nds-computer-use-url nds-truncate"
                data-slot="computer-use-url"
                lang="en"
              >{{ url }}</span>
            </p>
            <div
              class="nds-computer-use-screen"
              data-slot="computer-use-screen"
            >
              <div
                class="nds-computer-use-surface"
                data-slot="computer-use-surface"
              >
                <ComputerUseDemoScreen />
              </div>
              <span
                class="nds-computer-use-trail"
                data-slot="computer-use-trail"
                aria-hidden="true"
              >
                <span
                  v-for="(mark, index) in trailAtFourthStep"
                  :key="mark.id ?? index"
                  class="nds-computer-use-mark"
                  data-slot="computer-use-mark"
                  :data-active="index === trailAtFourthStep.length - 1 ? 'true' : undefined"
                  :style="{
                    '--computer-use-mark-x': String(mark.x),
                    '--computer-use-mark-y': String(mark.y),
                  }"
                />
              </span>
            </div>
          </figure>
        </div>
      </template>

      <!-- O par é a MESMA sessão, e o que muda é quanto do caminho o rastro
           mostra: três marcas desenham por onde o agente veio, e a sessão
           inteira marcada de uma vez cobre a tela que ela deveria apontar. -->
      <template #do-preview-1>
        <div
          class="nds-stack nds-w-full"
          data-spacing="lg"
        >
          <ComputerUse
            :url="url"
            :steps="steps"
            :active-index="steps.length - 1"
            status="running"
            :labels="computerLabels"
          >
            <template #screen>
              <ComputerUseDemoScreen />
            </template>
          </ComputerUse>
        </div>
      </template>
      <template #dont-preview-1>
        <div
          class="nds-stack nds-w-full"
          data-spacing="lg"
        >
          <!-- O errado é a sessão inteira marcada de uma vez: o rastro deixa de
               mostrar um caminho e passa a cobrir a tela que ele deveria estar
               apontando. Montado à mão porque a peça nunca desenha mais de
               três marcas. -->
          <figure
            class="nds-computer-use"
            data-slot="computer-use"
            data-status="running"
            aria-busy="true"
          >
            <p
              class="nds-computer-use-address nds-font-mono"
              data-slot="computer-use-address"
            >
              <span class="nds-sr-only">{{ computerLabels.address }}</span>
              <span
                class="nds-computer-use-url nds-truncate"
                data-slot="computer-use-url"
                lang="en"
              >{{ url }}</span>
            </p>
            <div
              class="nds-computer-use-screen"
              data-slot="computer-use-screen"
            >
              <div
                class="nds-computer-use-surface"
                data-slot="computer-use-surface"
              >
                <ComputerUseDemoScreen />
              </div>
              <span
                class="nds-computer-use-trail"
                data-slot="computer-use-trail"
                aria-hidden="true"
              >
                <!-- Propriedade personalizada, e não valor de desenho: é o
                     mesmo caminho pelo qual a peça posiciona as marcas dela. -->
                <span
                  v-for="(mark, index) in steps"
                  :key="mark.id ?? index"
                  class="nds-computer-use-mark"
                  data-slot="computer-use-mark"
                  :data-active="index === steps.length - 1 ? 'true' : undefined"
                  :style="{
                    '--computer-use-mark-x': String(mark.x),
                    '--computer-use-mark-y': String(mark.y),
                  }"
                />
              </span>
            </div>
            <figcaption
              class="nds-computer-use-caption"
              data-slot="computer-use-caption"
            >
              <span
                class="nds-computer-use-action"
                data-slot="computer-use-action"
              >{{ lastStep.action }}</span>
              <span
                class="nds-computer-use-target nds-truncate"
                data-slot="computer-use-target"
              >{{ lastStep.target }}</span>
              <span
                class="nds-computer-use-position"
                data-slot="computer-use-position"
              >{{ lastPositionText }}</span>
            </figcaption>
          </figure>
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
      component-slug="computer-use"
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
