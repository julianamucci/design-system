<script setup lang="ts">
import { computed, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import {
  ContextDisplay,
  CONTEXT_DISPLAY_FORMS,
  type ContextDisplayLabels,
} from '@/components/ui/context-display';
import {
  usageOf,
  useContextDisplayLabels,
} from '@/components/ui/context-display/context-display.fixtures';
import { BUDGET_LEVELS, type BudgetLevel } from '@shared/primitives/token-budget';
import { Separator } from '@/components/ui/separator';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import contextTranslations from '@shared/content/context-display/translations.json';

import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.vue';
import DocsDemonstration from '@/components/docs/shared/sections/DocsDemonstration.vue';
import DocsAnatomy       from '@/components/docs/shared/sections/DocsAnatomy.vue';
import DocsWhenToUse     from '@/components/docs/shared/sections/DocsWhenToUse.vue';
import DocsDoDont        from '@/components/docs/shared/sections/DocsDoDont.vue';
import DocsImport        from '@/components/docs/shared/sections/DocsImport.vue';
import DocsVariants      from '@/components/docs/shared/sections/DocsVariants.vue';
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
// Nenhuma linha sobrescrita aqui, e é o esperado: a peça é só leitura, então não
// há retorno nem evento — o ponto em que a API costuma divergir entre as stacks
// simplesmente não existe. As três props têm o mesmo nome nas cinco.

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(contextTranslations);

const labels = useContextDisplayLabels();

/**
 * O contraexemplo do primeiro par: a palavra do nível apagada.
 *
 * A diferença entre a janela com folga e a janela no limite passa a existir só
 * na cor do medidor — e cor sozinha não descreve estado (WCAG 1.4.1).
 */
const wordlessLevels = computed<ContextDisplayLabels>(() => ({
  ...labels.value,
  level: BUDGET_LEVELS.reduce((acc, level) => {
    acc[level] = '';
    return acc;
  }, {} as Record<BudgetLevel, string>),
}));

/**
 * O contraexemplo do segundo par: a ausência de teto tratada como um zero.
 *
 * A MESMA conversa, desenhada como se o teto fosse conhecido e nada tivesse
 * sido gasto — um anel vazio e "0%", que é o oposto de "não se sabe quanto
 * cabe".
 */
const zeroedUsage = { input: 0, output: 0, limit: 32_000 };

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria. O
// `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
const screenReaderItems = computed(() =>
  Object.entries(
    (contextTranslations as unknown as Record<
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
  componentSlug: 'context-display',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'context-display',
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
      { id: 'importacao',   label: tNav('nav.import')   },
      { id: 'variantes',    label: tNav('nav.variants') },
      { id: 'estados',      label: tNav('nav.states')   },
      { id: 'propriedades', label: tNav('nav.props')    },
      { id: 'tokens',       label: tNav('nav.tokens')   },
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
    component_name: 'context-display',
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
  items: ['name', 'level', 'unit', 'unbounded'].map(k => ({
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
 * A seção de formas percorre `CONTEXT_DISPLAY_FORMS`.
 *
 * A seção e a story de formas leem a mesma lista, e nenhuma das duas fica para
 * trás quando o tipo cresce. Os encaixes de pré-visualização abaixo seguem esta
 * ordem, que é a do mais compacto para o mais nu.
 */
const variantItems = computed(() =>
  CONTEXT_DISPLAY_FORMS.map(form => ({
    name: form,
    description: stripHtml(tContent(`variants.items.${form}.description`)),
    code: tContent(`variants.items.${form}.variantCode`),
  })),
);

/**
 * A tabela de estados abre com os três níveis do primitivo compartilhado.
 *
 * Os dois últimos são casos que o nível não modela — passar do teto e não ter
 * teto —, e por isso vêm escritos e não iterados.
 */
const stateItems = computed(() =>
  [...BUDGET_LEVELS, 'over', 'unbounded'].map(k => ({
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
    title: 'ContextDisplay',
    cols: propsCols.value,
    items: ['usage', 'form', 'labels'].map(k => ({
      name: tContent(`props.table.${k}.name`),
      type: tContent(`props.table.${k}.type`),
      defaultValue: tContent(`props.table.${k}.default`),
      required: tContent(`props.table.${k}.required`),
      description: toPlainText(tContent(`props.table.${k}.description`)),
    })),
  },
  {
    title: 'ContextDisplayLabels',
    cols: propsCols.value,
    items: [
      'labelsTitle', 'labelsLevel', 'labelsOf', 'labelsUnit', 'labelsUnbounded',
    ].map(k => ({
      name: tContent(`props.table.${k}.name`),
      type: tContent(`props.table.${k}.type`),
      defaultValue: tContent(`props.table.${k}.default`),
      required: tContent(`props.table.${k}.required`),
      description: toPlainText(tContent(`props.table.${k}.description`)),
    })),
  },
]);

const interfaceCode = `interface ContextDisplayLabels {
  title: string;                        // o nome da medida, fora da tela
  level: Record<BudgetLevel, string>;   // a palavra de cada nível
  of: string;                           // liga o consumido ao teto
  unit: string;                         // o que está sendo contado
  unbounded: string;                    // o que dizer sem teto conhecido
}

// O dado vem de \`@shared/primitives/chat-protocol\`. O total é FUNÇÃO, e nunca
// campo: total guardado pode discordar da soma.
interface TokenUsage {
  input: number;
  output: number;
  limit?: number;   // sem ele não há fração, só contagem
}

// A conta vem de \`@shared/primitives/token-budget\`, e o nível com ela:
type BudgetLevel = 'normal' | 'warning' | 'critical';

// A forma é escolha de espaço, e não de significado.
type ContextDisplayForm = 'ring' | 'bar' | 'text';`;

const tokenItems = computed(() =>
  [
    'textLabel', 'mutedForeground', 'foreground', 'fontWeightMedium',
    'primary', 'warning', 'destructive', 'muted',
    'sizeXs', 'spacing2', 'radiusFull',
  ].map(k => ({
    token: tContent(`tokens.table.${k}.token`),
    value: tContent(`tokens.table.${k}.value`),
    description: toPlainText(tContent(`tokens.table.${k}.description`)),
  })),
);

const accessibilityItems = computed(() =>
  [1, 2, 3, 4, 5].map(i => tContent(`accessibility.items.item${i}`)),
);

// Uma linha só, e é honesto: não há controle nesta peça. Listar Enter e setas
// para dizer que não fazem nada seria encher a tabela com ausências.
const keyboardItems = computed(() => [
  { key: 'Tab', description: tContent('accessibility.keyboard.tab') },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.agentStatus.name'), description: toPlainText(tContent('related.items.agentStatus.description')), path: '?path=/docs/components-conversational-agentstatus--docs' },
  { name: tContent('related.items.chatThread.name'),  description: toPlainText(tContent('related.items.chatThread.description')),  path: '?path=/docs/components-conversational-chatthread--docs'  },
  { name: tContent('related.items.progress.name'),    description: toPlainText(tContent('related.items.progress.description')),    path: '?path=/docs/components-feedback-progress--docs'           },
  { name: tContent('related.items.badge.name'),       description: toPlainText(tContent('related.items.badge.description')),       path: '?path=/docs/components-feedback-badge--docs'              },
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
      A legenda diz QUAL caso está desenhado — sem ela, quatro blocos empilhados
      viram um só, e o assunto da demonstração é justamente a diferença entre
      eles.
    -->
    <DocsDemonstration
      :title="tContent('demonstration.title')"
      component-slug="context-display"
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
            {{ tContent('demonstration.labels.ring') }}
          </p>
          <ContextDisplay
            :usage="usageOf('warning')"
            form="ring"
            :labels="labels"
          />
        </div>

        <Separator />

        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ tContent('demonstration.labels.bar') }}
          </p>
          <ContextDisplay
            :usage="usageOf('warning')"
            form="bar"
            :labels="labels"
          />
        </div>

        <Separator />

        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ tContent('demonstration.labels.text') }}
          </p>
          <ContextDisplay
            :usage="usageOf('warning')"
            form="text"
            :labels="labels"
          />
        </div>

        <Separator />

        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ tContent('demonstration.labels.unbounded') }}
          </p>
          <ContextDisplay
            :usage="usageOf('unbounded')"
            :labels="labels"
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
      <!-- O par é o MESMO par de níveis: o que muda é se a palavra chega a quem
           não vê a cor do medidor. -->
      <template #do-preview-0>
        <div
          class="nds-stack nds-w-full"
          data-spacing="sm"
        >
          <ContextDisplay
            :usage="usageOf('normal')"
            :labels="labels"
          />
          <ContextDisplay
            :usage="usageOf('critical')"
            :labels="labels"
          />
        </div>
      </template>
      <template #dont-preview-0>
        <div
          class="nds-stack nds-w-full"
          data-spacing="sm"
        >
          <ContextDisplay
            :usage="usageOf('normal')"
            :labels="wordlessLevels"
          />
          <ContextDisplay
            :usage="usageOf('critical')"
            :labels="wordlessLevels"
          />
        </div>
      </template>

      <!-- O contraexemplo: a MESMA medição sem teto, desenhada como se o teto
           fosse conhecido e nada tivesse sido gasto. É o que sai de tratar a
           ausência de teto como um zero. -->
      <template #do-preview-1>
        <div
          class="nds-stack nds-w-full"
          data-spacing="sm"
        >
          <ContextDisplay
            :usage="usageOf('unbounded')"
            :labels="labels"
          />
        </div>
      </template>
      <template #dont-preview-1>
        <div
          class="nds-stack nds-w-full"
          data-spacing="sm"
        >
          <ContextDisplay
            :usage="zeroedUsage"
            :labels="labels"
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

    <!-- ── Variantes ──────────────────────────────────────────────── -->
    <!-- Os encaixes seguem a ordem de `CONTEXT_DISPLAY_FORMS`. -->
    <DocsVariants
      :title="tContent('variants.title')"
      :note="stripHtml(tContent('variants.note'))"
      :items="variantItems"
      component-slug="context-display"
    >
      <template #variant-preview-0>
        <ContextDisplay
          :usage="usageOf('warning')"
          form="ring"
          :labels="labels"
        />
      </template>
      <template #variant-preview-1>
        <ContextDisplay
          :usage="usageOf('warning')"
          form="bar"
          :labels="labels"
        />
      </template>
      <template #variant-preview-2>
        <ContextDisplay
          :usage="usageOf('warning')"
          form="text"
          :labels="labels"
        />
      </template>
    </DocsVariants>

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
      component-slug="context-display"
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
