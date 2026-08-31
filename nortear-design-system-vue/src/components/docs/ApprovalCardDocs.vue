<script setup lang="ts">
import { computed, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { ApprovalCard } from '@/components/ui/approval-card';
import {
  approvalChoicesOf,
  approvalScopeOf,
  useApprovalCardLabels,
  APPROVAL_EXAMPLE_NAMES,
} from '@/components/ui/approval-card/approval-card.fixtures';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import approvalTranslations from '@shared/content/approval-card/translations.json';

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
// AS LINHAS SOBRESCRITAS SÃO DUAS, e as duas são NOME. O espaço dos controles é
// um slot nesta stack, e não uma lista de nós passada por propriedade — aí o
// tipo declarado é de fato outro, e acompanha o nome. O aviso da escolha é um
// evento, e ali só o nome muda: o que quem consome escreve continua sendo um
// manipulador que recebe o valor, e a forma de DECLARAÇÃO do emit é do autor do
// componente, não da tabela. Divergência de API de framework se registra, não
// se "alinha"; a descrição nunca entra, porque ela já é neutra de API.

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(approvalTranslations, {
  '*': {
    'props.table.actions.name': '#actions',
    'props.table.actions.type': 'slot',
    'props.table.onChoose.name': '@choose',
  },
});

const labels = useApprovalCardLabels();

/** Os controles da demonstração, todos com a MESMA ênfase — ver o andaime. */
const choices = computed(() => approvalChoicesOf(labels.value));

/**
 * Os três exemplos, cada um com a sua legenda.
 *
 * A legenda diz QUAL caso está desenhado — sem ela, três cartões empilhados
 * viram um só, e o assunto da demonstração é justamente a diferença entre eles.
 */
const demonstrationExamples = computed(() =>
  APPROVAL_EXAMPLE_NAMES.map((name) => ({
    name,
    caption: stripHtml(tContent(`demonstration.labels.${name}`)),
    question: labels.value.question[name],
    scope: approvalScopeOf(labels.value, name),
  })),
);

/** Os dois alcances que os pares de boas práticas desenham. */
const publishScope = computed(() => approvalScopeOf(labels.value, 'publish'));
const writeFileScope = computed(() => approvalScopeOf(labels.value, 'writeFile'));

/**
 * O contraexemplo do primeiro par: o alcance embutido na frase.
 *
 * É o que a peça NÃO pode impedir — quem escreve a pergunta é quem consome. O
 * pareamento passa a viver na pontuação, e pontuação não sobrevive à navegação
 * por lista de um leitor de tela.
 */
const inlineScopeQuestion = computed(() =>
  [
    labels.value.question.publish,
    publishScope.value.map((item) => `${item.term}: ${item.detail}`).join(' · '),
  ].join(' '),
);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria. O
// `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
const screenReaderItems = computed(() =>
  Object.entries(
    (approvalTranslations as unknown as Record<
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
  componentSlug: 'approval-card',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'approval-card',
    locale: newLocale,
    page_title: `${tContent('title')} · Design System`,
  });
}, { immediate: true });

// ─── Navigation groups ────────────────────────────────────────────────────────
//
// Não há seção de variantes: esta peça não tem eixo de forma no sentido de
// variante. O que existe são as FORMAS que ela toma do que recebe, e elas moram
// na seção de estados.

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
    component_name: 'approval-card',
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
  items: ['question', 'scopeTerm', 'scopeDetail', 'choice'].map(k => ({
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

/** As formas, na ordem em que a tabela e as stories as apresentam. */
const STATE_KEYS = [
  'withScope',
  'withoutScope',
  'longDetail',
  'manyChoices',
  'withoutActions',
] as const;

const stateItems = computed(() =>
  STATE_KEYS.map(k => ({
    label: tContent(`states.${k}.label`),
    trigger: toPlainText(tContent(`states.${k}.trigger`)),
    behavior: toPlainText(tContent(`states.${k}.behavior`)),
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
    title: 'ApprovalCard',
    cols: propsCols.value,
    items: ['question', 'scope', 'actions', 'onChoose'].map(k => ({
      name: tContent(`props.table.${k}.name`),
      type: tContent(`props.table.${k}.type`),
      defaultValue: tContent(`props.table.${k}.default`),
      required: tContent(`props.table.${k}.required`),
      description: toPlainText(tContent(`props.table.${k}.description`)),
    })),
  },
  {
    title: 'ApprovalScopeItem',
    cols: propsCols.value,
    items: ['term', 'detail'].map(k => ({
      name: tContent(`props.table.${k}.name`),
      type: tContent(`props.table.${k}.type`),
      defaultValue: tContent(`props.table.${k}.default`),
      required: tContent(`props.table.${k}.required`),
      description: toPlainText(tContent(`props.table.${k}.description`)),
    })),
  },
]);

const interfaceCode = `interface ApprovalScopeItem {
  term: string;     // o rótulo daquela linha do alcance
  detail: string;   // o valor, inteiro — sem abreviar e sem reticências
}

// O atributo com que um controle se declara resposta. Ele NÃO é do design
// system: quem o escreve é quem monta os controles, e é o único pedaço do
// contrato que atravessa a fronteira do que a peça desenha.
//
//   <Button data-approval-choice="allow-once">Permitir uma vez</Button>
//
// Controle sem ele não dispara nada — um link de "saiba mais" no meio dos
// controles continua sendo só um link.`;

const tokenItems = computed(() =>
  [
    'textLabel', 'warning', 'muted', 'radius', 'spacing3',
    'foreground', 'fontWeightMedium', 'mutedForeground',
    'spacing1', 'spacing2',
  ].map(k => ({
    token: tContent(`tokens.table.${k}.token`),
    value: tContent(`tokens.table.${k}.value`),
    description: toPlainText(tContent(`tokens.table.${k}.description`)),
  })),
);

const accessibilityItems = computed(() =>
  [1, 2, 3, 4, 5, 6].map(i => tContent(`accessibility.items.item${i}`)),
);

const keyboardItems = computed(() => [
  { key: 'Tab',   description: tContent('accessibility.keyboard.tab') },
  { key: 'Enter', description: tContent('accessibility.keyboard.enter') },
  { key: '↑ ↓',   description: tContent('accessibility.keyboard.arrows') },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.toolGroup.name'),   description: toPlainText(tContent('related.items.toolGroup.description')),   path: '?path=/docs/primitives-conversational-toolgroup--docs'  },
  { name: tContent('related.items.chatThread.name'),  description: toPlainText(tContent('related.items.chatThread.description')),  path: '?path=/docs/primitives-conversational-chatthread--docs' },
  { name: tContent('related.items.alertDialog.name'), description: toPlainText(tContent('related.items.alertDialog.description')), path: '?path=/docs/primitives-overlay-alertdialog--docs'       },
  { name: tContent('related.items.button.name'),      description: toPlainText(tContent('related.items.button.description')),      path: '?path=/docs/primitives-form-button--docs'               },
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
  items: [1, 2, 3, 4, 5, 6].map(i => ({
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
      Os controles vêm do mesmo andaime das stories, e é de propósito: eles são
      de quem consome, e esta página é quem consome. Nenhum deles recebe ênfase
      — dar destaque a "permitir" num cartão de autorização empurra para
      aprovar, e um design system que ensinasse isso o espalharia.
    -->
    <DocsDemonstration
      :title="tContent('demonstration.title')"
      component-slug="approval-card"
    >
      <div
        class="nds-stack nds-w-full"
        data-spacing="lg"
      >
        <template
          v-for="(example, index) in demonstrationExamples"
          :key="example.name"
        >
          <Separator v-if="index > 0" />
          <div
            class="nds-stack nds-w-full"
            data-spacing="xs"
          >
            <p class="nds-text-caption nds-text-muted-foreground">
              {{ example.caption }}
            </p>
            <ApprovalCard
              :question="example.question"
              :scope="example.scope"
            >
              <template #actions>
                <Button
                  v-for="choice in choices"
                  :key="choice.value"
                  variant="outline"
                  size="sm"
                  :data-approval-choice="choice.value"
                >
                  {{ choice.label }}
                </Button>
              </template>
            </ApprovalCard>
          </div>
        </template>
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
      <!-- O contraexemplo se monta com a MESMA API: o alcance entra embutido na
           frase, e a lista deixa de existir. É o que a peça não pode impedir —
           quem escreve a pergunta é quem consome. -->
      <template #do-preview-0>
        <ApprovalCard
          :question="labels.question.publish"
          :scope="publishScope"
        >
          <template #actions>
            <Button
              v-for="choice in choices"
              :key="choice.value"
              variant="outline"
              size="sm"
              :data-approval-choice="choice.value"
            >
              {{ choice.label }}
            </Button>
          </template>
        </ApprovalCard>
      </template>
      <template #dont-preview-0>
        <ApprovalCard :question="inlineScopeQuestion">
          <template #actions>
            <Button
              v-for="choice in choices"
              :key="choice.value"
              variant="outline"
              size="sm"
              :data-approval-choice="choice.value"
            >
              {{ choice.label }}
            </Button>
          </template>
        </ApprovalCard>
      </template>

      <template #do-preview-1>
        <ApprovalCard
          :question="labels.question.writeFile"
          :scope="writeFileScope"
        >
          <template #actions>
            <Button
              v-for="choice in choices"
              :key="choice.value"
              variant="outline"
              size="sm"
              :data-approval-choice="choice.value"
            >
              {{ choice.label }}
            </Button>
          </template>
        </ApprovalCard>
      </template>
      <!-- A pergunta genérica e sem alcance nenhum: quem responde está
           autorizando o que não viu. -->
      <template #dont-preview-1>
        <ApprovalCard :question="labels.question.vague">
          <template #actions>
            <Button
              v-for="choice in choices"
              :key="choice.value"
              variant="outline"
              size="sm"
              :data-approval-choice="choice.value"
            >
              {{ choice.label }}
            </Button>
          </template>
        </ApprovalCard>
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :description="tContent('import.basic')"
      :code="tContent('import.basicCode')"
      :secondary-description="tContent('import.withActions')"
      :secondary-code="tContent('import.withActionsCode')"
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
      component-slug="approval-card"
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
