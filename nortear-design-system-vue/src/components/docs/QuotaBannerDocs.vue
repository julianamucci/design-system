<script setup lang="ts">
import { computed, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { QuotaBanner } from '@/components/ui/quota-banner';
import {
  quotaOf,
  useQuotaBannerActionLabel,
  useQuotaBannerLabels,
  useQuotaRenewals,
} from '@/components/ui/quota-banner/quota-banner.fixtures';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import quotaTranslations from '@shared/content/quota-banner/translations.json';

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
// DUAS linhas sobrescritas, e as duas são a única divergência de API da peça: o
// espaço dos controles é um SLOT nesta stack, e não uma lista de nós passada por
// propriedade — então o NOME é o do slot e o TIPO acompanha. Mesmo precedente da
// conversa e do cartão de autorização. A DESCRIÇÃO nunca entra: o que o espaço
// dos controles significa é o mesmo nas cinco, e vontade de sobrescrevê-la é
// sinal de que o defeito está no texto compartilhado.

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(quotaTranslations, {
  '*': {
    'props.table.actions.name': '#actions',
    'props.table.actions.type': 'slot',
  },
});

const labels = useQuotaBannerLabels();
const renewals = useQuotaRenewals();
const actionLabel = useQuotaBannerActionLabel();

/** As cotas dos quatro exemplos da demonstração. */
const quotas = computed(() => ({
  normal: quotaOf('normal'),
  threshold: quotaOf('threshold'),
  exhausted: quotaOf('exhausted'),
  noRenewal: quotaOf('noRenewal'),
  warning: quotaOf('warning'),
}));

/**
 * O contraexemplo do segundo par: o horizonte escrito à mão.
 *
 * Ponto decimal, unidade por extenso e nenhuma das duas trocando com o idioma
 * de quem lê — que é exatamente o que a peça não tem como consertar, porque o
 * horizonte chega pronto.
 */
const HANDWRITTEN_HORIZON = '3.2 hours';

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria. O
// `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
const screenReaderItems = computed(() =>
  Object.entries(
    (quotaTranslations as unknown as Record<
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
  componentSlug: 'quota-banner',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'quota-banner',
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
    component_name: 'quota-banner',
    locale: locale.value,
  });
});

// ─── Conteúdo das seções ──────────────────────────────────────────────────────

const anatomyItems = computed(() =>
  [1, 2, 3, 4, 5, 6].map(i => tContent(`anatomy.item${i}`)),
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
  items: ['title', 'unit', 'left', 'exhausted'].map(k => ({
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
 * A tabela de estados percorre as cinco respostas que a MESMA faixa dá conforme
 * o que a conta devolve — nenhuma delas é um estado que a peça guarde.
 */
const stateItems = computed(() =>
  ['normal', 'warning', 'critical', 'exhausted', 'noRenewal'].map(k => ({
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
    title: 'QuotaBanner',
    cols: propsCols.value,
    items: propsRows(['quota', 'renewsIn', 'actions', 'labels']),
  },
  { title: 'QuotaAllowance', cols: propsCols.value, items: propsRows(['quotaUsed', 'quotaLimit']) },
  {
    title: 'QuotaBannerLabels',
    cols: propsCols.value,
    items: propsRows([
      'labelsTitle', 'labelsUnit', 'labelsLeft', 'labelsExhausted',
      'labelsRenews', 'labelsOf', 'labelsLevel',
    ]),
  },
]);

const interfaceCode = `interface QuotaBannerProps {
  quota: QuotaAllowance;      // o uso e o teto
  renewsIn?: string;          // quando renova, JÁ ESCRITO; ausente é "não renova"
  labels: QuotaBannerLabels;
}

// Os controles não entram por propriedade: eles são o SLOT \`#actions\`, e slot
// que não desenha nada não desenha a caixa.
//
//   <template #actions>
//     <Button variant="outline" size="sm">Mudar de plano</Button>
//   </template>

// O teto é OBRIGATÓRIO aqui, ao contrário das medições irmãs: a cota É o teto,
// e "quanto ainda resta" não tem resposta sem ele. Quem não tem teto não monta
// a faixa.
interface QuotaAllowance {
  used: number;               // quanto já foi usado
  limit: number;              // o teto da cota
}

interface QuotaBannerLabels {
  title: string;                      // de qual cota se trata; só para quem ouve
  unit: string;                       // o que está sendo contado
  left: string;                       // a palavra que acompanha o resto
  exhausted: string;                  // o que dizer quando não sobra nada
  renews: string;                     // a palavra que antecede o horizonte
  of: string;                         // liga o usado ao teto na razão
  level: Record<BudgetLevel, string>; // a palavra de cada nível
}

// A conta vem de \`@shared/primitives/token-budget\`, e é a MESMA que as outras
// medições leem — é isso que faz a palavra do nível querer dizer o mesmo em
// todas elas:
//   remainingUnits(uso, teto)    // o resto, nunca negativo
//   spentFraction(uso, teto)     // de 0 a 1, ou \`null\` quando o teto não é teto
//   fractionLevel(fracao)        // 'normal' | 'warning' | 'critical'
//   fractionPercent(fracao)      // inteiro travado nas duas pontas`;

const tokenItems = computed(() =>
  [
    'textLabel', 'mutedForeground', 'foreground', 'fontWeightMedium',
    'primary', 'warning', 'destructive', 'muted',
    'spacing2', 'spacing3', 'spacing6', 'radius', 'radiusFull',
  ].map(k => ({
    token: tContent(`tokens.table.${k}.token`),
    value: tContent(`tokens.table.${k}.value`),
    description: toPlainText(tContent(`tokens.table.${k}.description`)),
  })),
);

const accessibilityItems = computed(() =>
  [1, 2, 3, 4, 5, 6, 7].map(i => tContent(`accessibility.items.item${i}`)),
);

// Duas linhas, e as duas são honestas: a faixa em si não tem controle, mas os
// controles que chegam de fora entram na ordem de foco — e é aí que o teclado
// tem o que fazer.
const keyboardItems = computed(() => [
  { key: 'Tab', description: tContent('accessibility.keyboard.tab') },
  { key: 'Enter', description: tContent('accessibility.keyboard.enter') },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.contextDisplay.name'), description: toPlainText(tContent('related.items.contextDisplay.description')), path: '?path=/docs/primitives-conversational-contextdisplay--docs' },
  { name: tContent('related.items.costMeter.name'),      description: toPlainText(tContent('related.items.costMeter.description')),      path: '?path=/docs/primitives-conversational-costmeter--docs'      },
  { name: tContent('related.items.alert.name'),          description: toPlainText(tContent('related.items.alert.description')),          path: '?path=/docs/primitives-feedback-alert--docs'                  },
  { name: tContent('related.items.progress.name'),       description: toPlainText(tContent('related.items.progress.description')),       path: '?path=/docs/primitives-feedback-progress--docs'               },
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
  items: [1, 2, 3, 4, 5, 6, 7].map(i => ({
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
      A legenda diz QUAL exemplo está desenhado — sem ela, quatro caixas
      empilhadas viram uma só, e o assunto da demonstração é justamente a
      diferença entre elas.

      O controle entra só onde ele muda alguma coisa — a cota esgotada —, e é de
      propósito: repeti-lo nas quatro faria a demonstração parecer que a faixa
      nasce com um botão, quando o botão é de quem a monta.
    -->
    <DocsDemonstration
      :title="tContent('demonstration.title')"
      component-slug="quota-banner"
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
            {{ tContent('demonstration.labels.normal') }}
          </p>
          <QuotaBanner
            :quota="quotas.normal"
            :renews-in="renewals.normal"
            :labels="labels"
          />
        </div>

        <Separator />

        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ tContent('demonstration.labels.threshold') }}
          </p>
          <QuotaBanner
            :quota="quotas.threshold"
            :renews-in="renewals.threshold"
            :labels="labels"
          />
        </div>

        <Separator />

        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ tContent('demonstration.labels.exhausted') }}
          </p>
          <!-- O controle da demonstração, montado por QUEM CONSOME.

               Ele nasce aqui e não dentro da peça porque a §7 da guideline 17
               deixa o desenho do controle, a ênfase dele e o significado da
               escolha do lado de fora do design system. A faixa desenha o LUGAR
               de quem responde; o que o botão faz é de quem o passou — e é por
               isso que ele não tem manipulador nenhum aqui. -->
          <QuotaBanner
            :quota="quotas.exhausted"
            :renews-in="renewals.exhausted"
            :labels="labels"
          >
            <template #actions>
              <Button
                variant="outline"
                size="sm"
              >{{ actionLabel }}</Button>
            </template>
          </QuotaBanner>
        </div>

        <Separator />

        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ tContent('demonstration.labels.noRenewal') }}
          </p>
          <QuotaBanner
            :quota="quotas.noRenewal"
            :renews-in="renewals.noRenewal"
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
      <!-- O MESMO uso nos dois lados: o que muda é o horizonte chegar. -->
      <template #do-preview-0>
        <QuotaBanner
          :quota="quotas.warning"
          :renews-in="renewals.warning"
          :labels="labels"
        />
      </template>
      <!-- O contraexemplo: a cota renova, mas o horizonte não é passado. A
           faixa só pode dizer que está no fim, e esperar vira aposta — sem que
           nada pareça errado na tela. -->
      <template #dont-preview-0>
        <QuotaBanner
          :quota="quotas.warning"
          :labels="labels"
        />
      </template>

      <template #do-preview-1>
        <QuotaBanner
          :quota="quotas.warning"
          :renews-in="renewals.warning"
          :labels="labels"
        />
      </template>
      <!-- O contraexemplo: o horizonte escrito à mão. Ponto decimal, unidade
           por extenso e nenhuma das duas trocando com o idioma de quem lê. -->
      <template #dont-preview-1>
        <QuotaBanner
          :quota="quotas.warning"
          :renews-in="HANDWRITTEN_HORIZON"
          :labels="labels"
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
      component-slug="quota-banner"
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
