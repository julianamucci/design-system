<script setup lang="ts">
import { computed, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { Composer, DraftRestore, type DraftRestoreLabels } from '@/components/ui/composer';
import { useComposerLabels } from '@/components/ui/composer/composer.fixtures';
import {
  SAMPLE_DRAFT,
  SAMPLE_DRAFT_LONG,
  SAMPLE_TIMESTAMP,
  useDraftLabels,
} from '@/components/ui/composer/draft-restore.fixtures';
import { Separator } from '@/components/ui/separator';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import draftTranslations from '@shared/content/draft-restore/translations.json';

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
// A ÚNICA linha sobrescrita é a do aviso de que alguém escolheu restaurar ou
// descartar. O conteúdo compartilhado o descreve como callback, que é a forma
// do primitivo de referência; aqui ele é um evento, e quem consome o escuta.
// Divergência de API de framework se registra, não se "alinha".

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(draftTranslations, {
  '*': {
    'props.table.onAction.name': '@action',
    'props.table.onAction.type': '(action: DraftRestoreAction) => void',
  },
});

const composerLabels = useComposerLabels();
const draftBandLabels = useDraftLabels();

const sampleDraft = SAMPLE_DRAFT;
const sampleDraftLong = SAMPLE_DRAFT_LONG;
const sampleTimestamp = SAMPLE_TIMESTAMP;

/**
 * O contraexemplo do primeiro par: o rascunho que chega JÁ CORTADO.
 *
 * O que sumiu sumiu do documento também — e com ele a busca do navegador e a
 * leitura por completo. As reticências viram, para quem ouve, um fim que não é
 * o fim do rascunho.
 */
const truncatedDraft = `${SAMPLE_DRAFT_LONG.slice(0, 96)}…`;

/**
 * O VERBO SOZINHO, tirado do próprio rótulo.
 *
 * O contraexemplo da decisão 3 é o rótulo sem o objeto, e derivá-lo do rótulo
 * traduzido é o que o mantém correto nos três idiomas — escrever o verbo à mão
 * aqui plantaria português dentro da página em inglês.
 */
function firstWord(label: string): string {
  return label.split(' ')[0];
}

const verbOnlyLabels = computed<DraftRestoreLabels>(() => ({
  title: draftBandLabels.value.title,
  restore: firstWord(draftBandLabels.value.restore),
  discard: firstWord(draftBandLabels.value.discard),
}));

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria. O
// `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
const screenReaderItems = computed(() =>
  Object.entries(
    (draftTranslations as unknown as Record<
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
  componentSlug: 'draft-restore',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'draft-restore',
    locale: newLocale,
    page_title: `${tContent('title')} · Design System`,
  });
}, { immediate: true });

// ─── Navigation groups ────────────────────────────────────────────────────────
//
// NÃO HÁ SEÇÃO DE VARIANTES, e a ausência é a mesma decisão do arquivo de
// stories: a peça tem um desenho só, e tudo o que muda nela é o que ela
// encontrou.

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
    component_name: 'draft-restore',
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
  items: ['bannerTitle', 'restore', 'discard', 'timestamp'].map(k => ({
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

const stateItems = computed(() =>
  ['found', 'dated', 'long', 'absent'].map(k => ({
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
    title: 'DraftRestore',
    cols: propsCols.value,
    items: ['draft', 'labels', 'timestamp', 'onAction'].map(k => ({
      name: tContent(`props.table.${k}.name`),
      type: tContent(`props.table.${k}.type`),
      defaultValue: tContent(`props.table.${k}.default`),
      required: tContent(`props.table.${k}.required`),
      description: toPlainText(tContent(`props.table.${k}.description`)),
    })),
  },
  {
    title: 'DraftRestoreLabels',
    cols: propsCols.value,
    items: ['labelTitle', 'labelRestore', 'labelDiscard'].map(k => ({
      name: tContent(`props.table.${k}.name`),
      type: tContent(`props.table.${k}.type`),
      defaultValue: tContent(`props.table.${k}.default`),
      required: tContent(`props.table.${k}.required`),
      description: toPlainText(tContent(`props.table.${k}.description`)),
    })),
  },
]);

const interfaceCode = `export interface DraftRestoreLabels {
  title: string;     // o que a faixa diz ter encontrado
  restore: string;   // nomeia o rascunho, e não traz só o verbo
  discard: string;   // idem — verbo sozinho é destino sem assunto
}

// A escolha sai como aviso, e o que ela SIGNIFICA é de quem consome:
// o que descartar apaga, se dá para desfazer, quando um rascunho expira.
export type DraftRestoreAction = 'restore' | 'discard';`;

const tokenItems = computed(() =>
  [
    'muted', 'border', 'radius', 'spacing3',
    'spacing2', 'spacing1', 'textLabel', 'mutedForeground',
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
  { name: tContent('related.items.composer.name'),    description: toPlainText(tContent('related.items.composer.description')),    path: '?path=/docs/primitives-conversational-composer--docs' },
  { name: tContent('related.items.alert.name'),       description: toPlainText(tContent('related.items.alert.description')),       path: '?path=/docs/primitives-feedback-alert--docs' },
  { name: tContent('related.items.alertDialog.name'), description: toPlainText(tContent('related.items.alertDialog.description')), path: '?path=/docs/primitives-overlay-alertdialog--docs' },
  { name: tContent('related.items.sonner.name'),      description: toPlainText(tContent('related.items.sonner.description')),      path: '?path=/docs/primitives-feedback-sonner--docs' },
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
  items: [1, 2, 3, 4, 5, 6, 7].map(i => ({
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
      A legenda diz QUAL caso está desenhado — sem ela, três faixas empilhadas
      viram uma só, e o assunto da demonstração é justamente a diferença entre
      elas.
    -->
    <DocsDemonstration
      :title="tContent('demonstration.title')"
      component-slug="draft-restore"
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
            {{ tContent('demonstration.labels.found') }}
          </p>
          <DraftRestore
            :labels="draftBandLabels"
            :draft="sampleDraft"
          />
        </div>

        <Separator />

        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ tContent('demonstration.labels.dated') }}
          </p>
          <DraftRestore
            :labels="draftBandLabels"
            :draft="sampleDraft"
            :timestamp="sampleTimestamp"
          />
        </div>

        <Separator />

        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ tContent('demonstration.labels.long') }}
          </p>
          <DraftRestore
            :labels="draftBandLabels"
            :draft="sampleDraftLong"
            :timestamp="sampleTimestamp"
          />
        </div>

        <Separator />

        <!-- A faixa onde ela de fato mora: acima do campo, e fora dele. Sem
             utilitário de pilha no invólucro — a distância até o campo já é do
             desenho da faixa, e uma pilha por cima somaria o gap dela ao
             respiro que a folha já declarou. -->
        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ tContent('demonstration.labels.aboveComposer') }}
          </p>
          <div class="nds-w-full">
            <DraftRestore
              :labels="draftBandLabels"
              :draft="sampleDraft"
              :timestamp="sampleTimestamp"
            />
            <Composer :labels="composerLabels" />
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

    <!-- ── Do &amp; Dont ──────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="doDontPairs"
    >
      <!-- O par é o MESMO rascunho longo: o que muda é quem corta. À esquerda
           o texto vai inteiro e a folha corta; à direita ele chega já cortado,
           e o que sumiu sumiu do documento também. -->
      <template #do-preview-0>
        <DraftRestore
          :labels="draftBandLabels"
          :draft="sampleDraftLong"
          :timestamp="sampleTimestamp"
        />
      </template>
      <template #dont-preview-0>
        <DraftRestore
          :labels="draftBandLabels"
          :draft="truncatedDraft"
          :timestamp="sampleTimestamp"
        />
      </template>
      <!-- O contraexemplo: o verbo sem o objeto, tirado do próprio rótulo para
           continuar certo nos três idiomas. -->
      <template #do-preview-1>
        <DraftRestore
          :labels="draftBandLabels"
          :draft="sampleDraft"
        />
      </template>
      <template #dont-preview-1>
        <DraftRestore
          :labels="verbOnlyLabels"
          :draft="sampleDraft"
        />
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :description="tContent('import.basic')"
      :code="tContent('import.basicCode')"
      :secondary-description="tContent('import.withTimestamp')"
      :secondary-code="tContent('import.withTimestampCode')"
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
      component-slug="draft-restore"
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
