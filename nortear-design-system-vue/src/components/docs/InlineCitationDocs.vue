<script setup lang="ts">
import { computed, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { InlineCitation } from '@/components/ui/inline-citation';
import {
  citationOf,
  sentenceCitations,
  sentenceParts,
  useInlineCitationLabels,
} from '@/components/ui/inline-citation/inline-citation.fixtures';
import { Separator } from '@/components/ui/separator';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import inlineCitationTranslations from '@shared/content/inline-citation/translations.json';

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
// A ÚNICA LINHA SOBRESCRITA é a do aviso de abertura, e ela registra a
// divergência de API de framework: o conteúdo compartilhado o descreve como
// callback, que é a forma do primitivo de referência; aqui ele é um EVENTO, e
// quem consome o escuta. Só o NOME muda — o tipo compartilhado descreve o que
// QUEM CONSOME escreve, `(open: boolean) => void`, e a descrição já é neutra de
// API. A outra divergência, o comando por `ref` de template, não tem linha na
// tabela porque não é propriedade: ela mora na seção de Extensão, no código de
// interface logo abaixo.

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(inlineCitationTranslations, {
  '*': {
    'props.table.onOpenChange.name': '@open-change',
  },
});

const labelsOf = useInlineCitationLabels();

const parts = sentenceParts();
const citations = sentenceCitations();

/** A citação inteira — a que mostra as quatro linhas da prévia de uma vez. */
const fullCitation = citationOf('full');

/** A citação que só tem fonte. */
const minimalCitation = citationOf('minimal');

/** A citação cujo endereço não pode virar link. */
const unsafeCitation = citationOf('unsafe');

/**
 * O contraexemplo do segundo par: um traço no lugar do que não veio.
 *
 * Montado aqui porque a peça nunca o produz — ela não monta o que não recebeu.
 * Passar o traço é justamente o erro que o par existe para mostrar: a prévia
 * passa a afirmar que existe um trecho vazio.
 */
const dashedCitation = computed(() => ({
  source: minimalCitation.source,
  excerpt: '—',
  anchor: '—',
}));

/**
 * O contraexemplo do primeiro par: o nome acessível é o NÚMERO.
 *
 * Quem vê não nota diferença nenhuma, e é esse o ponto — quem ouve recebe um
 * botão chamado "1", que não descreve fonte nenhuma.
 */
const numberOnlyLabels = computed(() => ({
  marker: '1',
  unsafeSource: labelsOf(1, fullCitation).unsafeSource,
}));

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria. O
// `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
const screenReaderItems = computed(() =>
  Object.entries(
    (inlineCitationTranslations as unknown as Record<
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
  componentSlug: 'inline-citation',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'inline-citation',
    locale: newLocale,
    page_title: `${tContent('title')} · Design System`,
  });
}, { immediate: true });

// ─── Navigation groups ────────────────────────────────────────────────────────
//
// Não há seção de variantes: a marca não tem eixo de forma. A estrutura é sempre
// a mesma — o número, e a prévia que ele controla — e o que muda é quanto a
// citação tem para dizer, que é estado e mora na seção de estados.

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
    component_name: 'inline-citation',
    locale: locale.value,
  });
});

// ─── Conteúdo das seções ──────────────────────────────────────────────────────

const anatomyItems = computed(() =>
  [1, 2, 3, 4, 5].map(i => tContent(`anatomy.item${i}`)),
);

const guidelines = computed(() => ({
  title: tContent('usage.guidelines.title'),
  items: [1, 2, 3, 4, 5, 6].map(i => tContent(`usage.guidelines.item${i}`)),
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
  items: ['marker', 'unsafeSource', 'sourceTitle', 'anchor'].map(k => ({
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
 * Só os dois primeiros são estados que a peça guarda — recolhida e expandida.
 * Os outros dois são o que a MESMA prévia faz conforme o que a citação trouxe.
 */
const stateItems = computed(() =>
  ['closed', 'open', 'minimal', 'unsafe'].map(k => ({
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
    title: 'InlineCitation',
    cols: propsCols.value,
    items: propsRows(['citation', 'index', 'defaultOpen', 'onOpenChange', 'labels']),
  },
  {
    title: 'Citation',
    cols: propsCols.value,
    items: propsRows(['citationSource', 'citationExcerpt', 'citationAnchor']),
  },
  {
    title: 'ChatSource',
    cols: propsCols.value,
    items: propsRows(['sourceTitle', 'sourceUrl']),
  },
  {
    title: 'InlineCitationLabels',
    cols: propsCols.value,
    items: propsRows(['labelsMarker', 'labelsUnsafeSource']),
  },
]);

const interfaceCode = `interface InlineCitationLabels {
  marker: string;         // o nome acessível, já escrito, com o número dentro
  unsafeSource: string;   // o que se diz no lugar de um endereço recusado
}

// O VOCABULÁRIO NÃO É DAQUI. \`Citation\` e \`ChatSource\` vêm de
// \`@shared/primitives/chat-protocol\`, e é lá que está escrito por que o trecho
// mora na CITAÇÃO e não na fonte: a mesma fonte apoia afirmações diferentes.
interface Citation {
  source: ChatSource;     // o documento
  excerpt?: string;       // o texto citado, como saiu da fonte
  anchor?: string;        // onde dentro dele — página, âncora, linhas
}

// A MARCA É CONTROLÁVEL POR COMANDO, e é o comando que resolve a exclusão mútua
// entre duas prévias — a peça não conhece as vizinhas, e não conhecê-las é o que
// permite que duas marcas da mesma frase venham de lugares diferentes. Ele chega
// por \`ref\` de template, sobre o que a peça expõe.
interface InlineCitationCommands {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
}`;

const tokenItems = computed(() =>
  [
    'muted', 'foreground', 'primary', 'primaryForeground', 'ring',
    'sizeXs', 'radiusSm', 'textLabel',
    'textControlSm', 'spacing2', 'mutedForeground', 'border',
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
  { key: 'Tab',           description: tContent('accessibility.keyboard.tab') },
  { key: 'Enter / Space', description: tContent('accessibility.keyboard.enter') },
  { key: 'Escape',        description: tContent('accessibility.keyboard.escape') },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.chatThread.name'), description: toPlainText(tContent('related.items.chatThread.description')), path: '?path=/docs/primitives-conversational-chatthread--docs' },
  { name: tContent('related.items.hoverCard.name'),  description: toPlainText(tContent('related.items.hoverCard.description')),  path: '?path=/docs/primitives-overlay-hovercard--docs'        },
  { name: tContent('related.items.popover.name'),    description: toPlainText(tContent('related.items.popover.description')),    path: '?path=/docs/primitives-overlay-popover--docs'          },
  { name: tContent('related.items.tooltip.name'),    description: toPlainText(tContent('related.items.tooltip.description')),    path: '?path=/docs/primitives-overlay-tooltip--docs'          },
]);

const noteItems = computed(() =>
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => ({ title: '', content: tContent(`notes.item${i}`) })),
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
      A legenda diz QUAL exemplo está desenhado — sem ela, quatro frases quase
      iguais viram uma só, e o assunto da demonstração é justamente a diferença
      entre elas.

      O primeiro é o único fechado, e é ele que mostra a peça como ela vive:
      duas marcas dentro de uma frase, à espera de quem lê. Os três seguintes
      nascem abertos, e por isso ganham folga (`nds-min-h-50`): a prévia é
      posicionada fora do fluxo, então sem ela cobriria a legenda do exemplo
      seguinte.
    -->
    <DocsDemonstration
      :title="tContent('demonstration.title')"
      component-slug="inline-citation"
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
            {{ tContent('demonstration.labels.inSentence') }}
          </p>
          <div>
            <p>
              {{ parts[0] }}<InlineCitation
                :citation="citations[0]"
                :index="1"
                :labels="labelsOf(1, citations[0])"
              />{{ parts[1] }}<InlineCitation
                :citation="citations[1]"
                :index="2"
                :labels="labelsOf(2, citations[1])"
              />{{ parts[2] }}
            </p>
          </div>
        </div>

        <Separator />

        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ tContent('demonstration.labels.open') }}
          </p>
          <div class="nds-min-h-50">
            <p>
              {{ parts[0] }}<InlineCitation
                :citation="fullCitation"
                :index="1"
                default-open
                :labels="labelsOf(1, fullCitation)"
              />{{ parts[1] + parts[2] }}
            </p>
          </div>
        </div>

        <Separator />

        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ tContent('demonstration.labels.minimal') }}
          </p>
          <div class="nds-min-h-50">
            <p>
              {{ parts[0] }}<InlineCitation
                :citation="minimalCitation"
                :index="1"
                default-open
                :labels="labelsOf(1, minimalCitation)"
              />{{ parts[1] + parts[2] }}
            </p>
          </div>
        </div>

        <Separator />

        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ tContent('demonstration.labels.unsafe') }}
          </p>
          <div class="nds-min-h-50">
            <p>
              {{ parts[0] }}<InlineCitation
                :citation="unsafeCitation"
                :index="1"
                default-open
                :labels="labelsOf(1, unsafeCitation)"
              />{{ parts[1] + parts[2] }}
            </p>
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
      <!-- A MESMA citação nos dois lados do primeiro par: o que muda é o nome
           acessível, e quem vê não nota diferença nenhuma. É esse o ponto. -->
      <template #do-preview-0>
        <p>
          {{ parts[0] }}<InlineCitation
            :citation="fullCitation"
            :index="1"
            :labels="labelsOf(1, fullCitation)"
          />{{ parts[1] + parts[2] }}
        </p>
      </template>
      <template #dont-preview-0>
        <p>
          {{ parts[0] }}<InlineCitation
            :citation="fullCitation"
            :index="1"
            :labels="numberOnlyLabels"
          />{{ parts[1] + parts[2] }}
        </p>
      </template>

      <!-- O segundo par é a mesma citação MÍNIMA: de um lado o que não veio não
           ocupa lugar, do outro um traço afirma que existe um trecho vazio. -->
      <template #do-preview-1>
        <p>
          {{ parts[0] }}<InlineCitation
            :citation="minimalCitation"
            :index="1"
            default-open
            :labels="labelsOf(1, minimalCitation)"
          />{{ parts[1] + parts[2] }}
        </p>
      </template>
      <template #dont-preview-1>
        <p>
          {{ parts[0] }}<InlineCitation
            :citation="dashedCitation"
            :index="1"
            default-open
            :labels="labelsOf(1, minimalCitation)"
          />{{ parts[1] + parts[2] }}
        </p>
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
      component-slug="inline-citation"
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
