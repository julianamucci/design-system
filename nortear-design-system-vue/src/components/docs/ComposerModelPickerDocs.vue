<script setup lang="ts">
import { computed, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { Composer, ComposerModelPicker } from '@/components/ui/composer';
import { useComposerLabels } from '@/components/ui/composer/composer.fixtures';
import {
  availableModels,
  everyModel,
  useModelLabels,
} from '@/components/ui/composer/composer-model-picker.fixtures';
import type { ModelOption } from '@shared/primitives/chat-protocol';
import { Separator } from '@/components/ui/separator';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import pickerTranslations from '@shared/content/composer-model-picker/translations.json';

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
// AS LINHAS SOBRESCRITAS são as dos dois avisos. O conteúdo compartilhado os
// descreve como callbacks, que é a forma do primitivo de referência; aqui eles
// são eventos, e quem consome os escuta. Divergência de API de framework se
// registra, não se "alinha".

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(pickerTranslations, {
  '*': {
    'props.table.onValueChange.name': '@change',
    'props.table.onValueChange.type': 'evento',
    'props.table.onOpenChange.name': '@open-change',
    'props.table.onOpenChange.type': 'evento',
  },
});

const composerLabels = useComposerLabels();
const pickerLabels = useModelLabels();

const models = everyModel();
const available = availableModels();

/**
 * O contraexemplo do primeiro par: o impedimento sem o motivo.
 *
 * A opção continua apagada, e a pergunta "por que não posso?" fica sem resposta
 * na tela.
 */
const withoutReason: ModelOption[] = everyModel().map((model) =>
  model.unavailable
    ? { id: model.id, label: model.label, description: model.description, unavailable: true }
    : model,
);

/**
 * O contraexemplo do segundo par: a descrição empurrada para dentro do nome.
 *
 * É como um gatilho que "leva a descrição" de fato acontece — não há prop para
 * isso, o que há é alguém escrevendo a frase inteira no nome. E o campo encolhe.
 */
const nameCarryingDescription: ModelOption[] = everyModel().map((model) => ({
  ...model,
  label: model.description ? `${model.label} — ${model.description}` : model.label,
}));

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria. O
// `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
const screenReaderItems = computed(() =>
  Object.entries(
    (pickerTranslations as unknown as Record<
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
  componentSlug: 'composer-model-picker',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'composer-model-picker',
    locale: newLocale,
    page_title: `${tContent('title')} · Design System`,
  });
}, { immediate: true });

// ─── Navigation groups ────────────────────────────────────────────────────────

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
    component_name: 'composer-model-picker',
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
  items: ['trigger', 'modelName', 'description', 'badge', 'reason'].map(k => ({
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
  ['closed', 'open', 'selected', 'unavailable'].map(k => ({
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
    title: 'ComposerModelPicker',
    cols: propsCols.value,
    items: ['models', 'labels', 'value', 'onValueChange', 'open', 'onOpenChange'].map(k => ({
      name: tContent(`props.table.${k}.name`),
      type: tContent(`props.table.${k}.type`),
      defaultValue: tContent(`props.table.${k}.default`),
      required: tContent(`props.table.${k}.required`),
      description: toPlainText(tContent(`props.table.${k}.description`)),
    })),
  },
  {
    title: 'ModelOption',
    cols: propsCols.value,
    items: ['id', 'modelLabel', 'modelDescription', 'badge', 'unavailable', 'unavailableReason']
      .map(k => ({
        name: tContent(`props.table.${k}.name`),
        type: tContent(`props.table.${k}.type`),
        defaultValue: tContent(`props.table.${k}.default`),
        required: tContent(`props.table.${k}.required`),
        description: toPlainText(tContent(`props.table.${k}.description`)),
      })),
  },
]);

const interfaceCode = `interface ComposerModelPickerLabels {
  trigger: string;   // \`{label}\` vira o nome do modelo escolhido
  list: string;      // o nome acessível da lista
}

// O modelo vem de \`@shared/primitives/chat-protocol\`:
interface ModelOption {
  id: string;
  label: string;
  description?: string;         // aparece na lista, e não no gatilho
  badge?: string;               // reforço; nunca a única portadora
  unavailable?: boolean;
  unavailableReason?: string;   // obrigatório quando indisponível
}`;

const tokenItems = computed(() =>
  [
    'popover', 'border', 'elevationMd', 'zPopover', 'accent',
    'radiusSm', 'spacing6', 'textP', 'mutedForeground',
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
  { key: 'Esc',   description: tContent('accessibility.keyboard.escape') },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.composer.name'),               description: toPlainText(tContent('related.items.composer.description')),               path: '?path=/docs/components-conversational-composer--docs' },
  { name: tContent('related.items.composerTriggerPopover.name'), description: toPlainText(tContent('related.items.composerTriggerPopover.description')), path: '?path=/docs/components-conversational-composertriggerpopover--docs' },
  { name: tContent('related.items.select.name'),                 description: toPlainText(tContent('related.items.select.description')),                 path: '?path=/docs/components-form-select--docs' },
  { name: tContent('related.items.badge.name'),                  description: toPlainText(tContent('related.items.badge.description')),                  path: '?path=/docs/components-feedback-badge--docs' },
]);

const noteItems = computed(() =>
  [1, 2, 3, 4, 5].map(i => ({ title: '', content: tContent(`notes.item${i}`) })),
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
      A LEGENDA VAI EMBAIXO, e é a única divergência de forma em relação às
      outras docs pages. Ela sai do desenho: a lista abre PARA CIMA, e uma
      legenda acima do seletor seria a primeira coisa que a lista cobriria. O
      recuo no topo reserva o espaço que a lista ocupa, que de outro modo não
      entraria no fluxo — ela é absoluta.
    -->
    <DocsDemonstration
      :title="tContent('demonstration.title')"
      component-slug="composer-model-picker"
    >
      <div
        class="nds-stack nds-w-full"
        data-spacing="lg"
      >
        <div
          class="nds-stack nds-w-full nds-pt-8"
          data-spacing="xs"
        >
          <ComposerModelPicker
            :labels="pickerLabels"
            :models="models"
            value="balanced"
          />
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ tContent('demonstration.labels.closed') }}
          </p>
        </div>

        <Separator />

        <div
          class="nds-stack nds-w-full nds-pt-8"
          data-spacing="xs"
        >
          <ComposerModelPicker
            :labels="pickerLabels"
            :models="available"
            open
          />
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ tContent('demonstration.labels.open') }}
          </p>
        </div>

        <Separator />

        <div
          class="nds-stack nds-w-full nds-pt-8"
          data-spacing="xs"
        >
          <ComposerModelPicker
            :labels="pickerLabels"
            :models="models"
            value="fast"
            open
          />
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ tContent('demonstration.labels.unavailable') }}
          </p>
        </div>

        <Separator />

        <!-- O seletor é AUTÔNOMO: ele não é uma prop do campo. Quem consome o
             monta e o põe no trilho, pelo mesmo espaço de qualquer outro
             controle. -->
        <div
          class="nds-stack nds-w-full nds-pt-8"
          data-spacing="xs"
        >
          <Composer :labels="composerLabels">
            <template #railStart>
              <ComposerModelPicker
                :labels="pickerLabels"
                :models="models"
                value="fast"
              />
            </template>
          </Composer>
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ tContent('demonstration.labels.withField') }}
          </p>
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
      <!-- O par é a MESMA lista: o que muda é se a opção apagada explica por
           que está apagada. -->
      <template #do-preview-0>
        <ComposerModelPicker
          :labels="pickerLabels"
          :models="models"
          value="fast"
          open
        />
      </template>
      <template #dont-preview-0>
        <ComposerModelPicker
          :labels="pickerLabels"
          :models="withoutReason"
          value="fast"
          open
        />
      </template>
      <!-- O contraexemplo: a descrição empurrada para dentro do nome, e o campo
           encolhe para caber o que já está na lista. -->
      <template #do-preview-1>
        <Composer :labels="composerLabels">
          <template #railStart>
            <ComposerModelPicker
              :labels="pickerLabels"
              :models="models"
              value="fast"
            />
          </template>
        </Composer>
      </template>
      <template #dont-preview-1>
        <Composer :labels="composerLabels">
          <template #railStart>
            <ComposerModelPicker
              :labels="pickerLabels"
              :models="nameCarryingDescription"
              value="fast"
            />
          </template>
        </Composer>
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :description="tContent('import.basic')"
      :code="tContent('import.basicCode')"
      :secondary-description="tContent('import.withUnavailable')"
      :secondary-code="tContent('import.withUnavailableCode')"
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
      component-slug="composer-model-picker"
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
