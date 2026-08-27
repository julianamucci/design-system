<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { Editor, type EditorPreset } from '@/components/ui/editor';
import { editorLabelsFor, nounLabelsFor } from '@/components/ui/editor/editor.labels';
import { Button } from '@/components/ui/button';
import {
  editorAdvancedSource,
  editorBasicSource,
} from '@/components/ui/editor/editor.source';

import DocsPageLayout    from '@/components/docs/shared/sections/DocsPageLayout.vue';
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

import uiTranslations        from '@/i18n/ui.json';
import componentTranslations from '@shared/content/editor/translations.json';
import { toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────
// IMPORTANTE: locale vem de useTranslation — NUNCA de useLocaleStore/Pinia
const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(componentTranslations, {
  // O conteúdo compartilhado descreve o callback de mudança de forma neutra de
  // API. Aqui ele tem o nome que esta stack usa — e só o NOME muda; a descrição
  // continua vindo do conteúdo.
  '*': { 'props.table.onChange.name': '@change' },
});

// ─── Rótulos das demonstrações ────────────────────────────────────────────────
//
// Os rótulos da barra vêm do CONTEÚDO COMPARTILHADO, no idioma da página.
//
// Todo botão do editor é só de ícone: o rótulo É o nome acessível, e nome
// acessível é conteúdo. Antes eram um objeto de 51 entradas escrito aqui, em
// pt-BR — a página trocava de idioma e a interface que ela demonstra, não.
// A leitura é tipada em `editor.labels.ts`: rótulo ausente reprova no
// `vue-tsc`, e não em silêncio na tela.

const baseLabels = computed(() => editorLabelsFor(locale.value));

/**
 * O lado errado do primeiro Do & Don't: o SUBSTANTIVO no lugar do verbo.
 *
 * Muda um rótulo só, o do botão de link — `labels.actions.link` ("Inserir
 * link") contra `labels.nouns.link` ("Link"), os dois vindos do conteúdo. É
 * exatamente o que a legenda do par contrasta, e um segundo texto diferente
 * daria à comparação uma segunda variável.
 */
const nounLabels = computed(() => nounLabelsFor(locale.value));

// ─── Conteúdo dos exemplos ────────────────────────────────────────────────────

const DEMO_CONTENT = '<p>Escreva aqui. A energia de repouso é <strong>E = mc²</strong>.</p>';
const BASIC_CONTENT =
  '<p>Comentário curto, com ênfase e uma lista.</p><ul><li>primeiro</li><li>segundo</li></ul>';
const ADVANCED_CONTENT =
  '<h2>Relatório</h2><p>Texto com <mark>destaque</mark> e <a href="https://exemplo.com">link</a>.</p>';
const THANKS_CONTENT = '<p>Ótimo trabalho, obrigado!</p>';

// ─── SEO & GEO ────────────────────────────────────────────────────────────────

useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: 'editor',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
  breadcrumb: [
    { name: 'Components', item: '/components' },
    { name: tContent('category'), item: '/components/form' },
    { name: tContent('title') },
  ],
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'editor',
    locale: newLocale as 'pt-BR' | 'en' | 'es',
    page_title: tContent('seo.title'),
  });
}, { immediate: true });

// ─── Demonstração ─────────────────────────────────────────────────────────────

const demoPreset = ref<EditorPreset>('advanced');
const demoReadOnly = ref(false);

/**
 * Os três controles da demonstração, cada um marcado para o observer.
 *
 * O evento sai do PRÓPRIO botão. A seção de demonstração é um container
 * auto-instrumentado (`data-track-container`), e o observer resolve por
 * `.closest('[data-track]')`: um controle sem marcação própria fazia o clique
 * subir até a seção, e o container disparava um SEGUNDO `docs_demo_click` com
 * `element_id` tirado do texto traduzido — o mesmo clique virava dois eventos
 * no GA4, e um deles partido em três idiomas. Marcado o botão, o `closest` para
 * nele: um evento, com a chave estável na terceira parte do id.
 */
const demoControls = computed(() => [
  {
    key: 'basic',
    label: tContent('demonstration.labels.basic'),
    pressed: demoPreset.value === 'basic',
    apply: () => { demoPreset.value = 'basic'; },
  },
  {
    key: 'advanced',
    label: tContent('demonstration.labels.advanced'),
    pressed: demoPreset.value === 'advanced',
    apply: () => { demoPreset.value = 'advanced'; },
  },
  {
    key: 'readOnly',
    label: tContent('demonstration.labels.readOnly'),
    pressed: demoReadOnly.value,
    apply: () => { demoReadOnly.value = !demoReadOnly.value; },
  },
]);

// ─── Navegação ────────────────────────────────────────────────────────────────

const navGroups = computed(() => [
  {
    label: tContent('nav.overview'),
    sections: [
      { id: 'demonstracao', label: tContent('nav.demonstration') },
      { id: 'anatomia',     label: tContent('nav.anatomy')       },
      { id: 'quando-usar',  label: tContent('nav.usage')         },
      { id: 'do-dont',      label: tContent('nav.doDont')        },
    ],
  },
  {
    label: tContent('nav.techRef'),
    sections: [
      { id: 'importacao',   label: tContent('nav.import')   },
      { id: 'variantes',    label: tContent('nav.variants') },
      { id: 'estados',      label: tContent('nav.states')   },
      { id: 'propriedades', label: tContent('nav.props')    },
      { id: 'tokens',       label: tContent('nav.tokens')   },
    ],
  },
  {
    label: tNav('nav.context'),
    sections: [
      { id: 'acessibilidade', label: tContent('nav.accessibility') },
      { id: 'relacionados',   label: tContent('nav.related')       },
      { id: 'notas',          label: tContent('nav.notes')         },
    ],
  },
  {
    label: tNav('nav.quality'),
    sections: [
      { id: 'analytics', label: tContent('nav.analytics') },
      { id: 'testes',    label: tContent('nav.testes')    },
    ],
  },
]);

const allSectionIds = computed(() => navGroups.value.flatMap((g) => g.sections.map((s) => s.id)));

const { activeId: activeSection } = useActiveSection(allSectionIds, (id) => {
  track('docs_section_viewed', {
    section_id: id,
    component_name: 'editor',
    locale: locale.value,
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function localPriority(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

/** Estados do conteúdo compartilhado, na ordem em que ele os declara. */
const STATE_KEYS = [
  'editing',
  'readOnly',
  'imageSelected',
  'inTable',
  'fieldOpen',
  'invalidValue',
];

/** Chaves da tabela de tokens, na ordem em que o conteúdo as declara. */
const TOKEN_KEYS = [
  'border',
  'background',
  'muted',
  'mutedForeground',
  'foreground',
  'primary',
  'accent',
  'ring',
  'textH1',
];

// ─── Código exibido ───────────────────────────────────────────────────────────

const interfaceCode = `interface EditorProps {
  content?: string;                   // HTML inicial, sanitizado antes de montar
  editable?: boolean;                 // padrão: true
  preset?: 'basic' | 'advanced';      // padrão: 'advanced'
  labels: EditorLabels;               // obrigatório
  resolveImage?: (file: File) => Promise<string | null>;
  describeImage?: (file: File | null, src: string) => Promise<string | null>;
}

// Emits
//   (e: 'change', html: string): void`;

// ─── Dados das seções ─────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
  tContent('anatomy.item4'),
  tContent('anatomy.item5'),
  tContent('anatomy.item6'),
  tContent('anatomy.item7'),
]);

const guidelineItems = computed(() =>
  [1, 2, 3, 4, 5].map((i) => tContent(`usage.guidelines.item${i}`)),
);

const scenarioItems = computed(() =>
  [1, 2, 3, 4, 5, 6].map((i) => ({
    s: tContent(`usage.scenarios.item${i}.s`),
    u: tContent(`usage.scenarios.item${i}.u`),
    a: tContent(`usage.scenarios.item${i}.a`),
  })),
);

const variantItems = computed(() => [
  {
    // Chave ESTÁVEL, não traduzida: ela vira o `snippet_id` do evento de cópia.
    name: tContent('variants.items.basic.name'),
    trackId: 'basic',
    description: tContent('variants.items.basic.description'),
    code: editorBasicSource(),
  },
  {
    name: tContent('variants.items.advanced.name'),
    trackId: 'advanced',
    description: tContent('variants.items.advanced.description'),
    code: editorAdvancedSource(),
  },
]);

const stateItems = computed(() =>
  STATE_KEYS.map((key) => ({
    label: tContent(`states.${key}.label`),
    trigger: tContent(`states.${key}.trigger`),
    behavior: toPlainText(tContent(`states.${key}.behavior`)),
  })),
);

const propItems = computed(() =>
  ['content', 'editable', 'preset', 'labels', 'onChange', 'resolveImage', 'describeImage'].map(
    (key) => ({
      name: tContent(`props.table.${key}.name`),
      type: tContent(`props.table.${key}.type`),
      defaultValue: tContent(`props.table.${key}.default`),
      required: tContent(`props.table.${key}.required`),
      description: toPlainText(tContent(`props.table.${key}.description`)),
    }),
  ),
);

const tokenRows = computed(() =>
  TOKEN_KEYS.map((key) => ({
    token: tContent(`tokens.table.${key}.token`),
    value: tContent(`tokens.table.${key}.value`),
    description: tContent(`tokens.table.${key}.description`),
  })),
);

const accessibilityItems = computed(() => [
  tContent('accessibility.item1'),
  tContent('accessibility.item2'),
  tContent('accessibility.item3'),
  tContent('accessibility.item4'),
  tContent('accessibility.item5'),
  tContent('accessibility.item6'),
  tContent('accessibility.item7'),
]);

const keyboardItems = computed(() =>
  ['tab', 'arrows', 'homeEnd', 'enter', 'escape'].map((key) => ({
    key: tContent(`accessibility.keyboard.${key}.key`),
    description: tContent(`accessibility.keyboard.${key}.action`),
  })),
);

const relatedItems = computed(() => [
  { name: 'Textarea',    description: toPlainText(tContent('related.textarea')),    path: '?path=/docs/ui-textarea--docs'    },
  { name: 'CodeBlock',   description: toPlainText(tContent('related.codeBlock')),   path: '?path=/docs/ui-codeblock--docs'   },
  { name: 'ToggleGroup', description: toPlainText(tContent('related.toggleGroup')), path: '?path=/docs/ui-togglegroup--docs' },
  { name: 'Button',      description: toPlainText(tContent('related.button')),      path: '?path=/docs/ui-button--docs'      },
]);

const noteItems = computed(() =>
  ['tip1', 'tip2', 'tip3', 'tip4', 'tip5', 'tip6'].map((key) => ({
    title: '',
    content: tContent(`notes.${key}`),
  })),
);

const analyticsItems = computed(() => [
  {
    event: tContent('analytics.table.pageView'),
    trigger: toPlainText(tContent('analytics.table.pageViewTrigger')),
    payload: tContent('analytics.table.pageViewPayload'),
  },
  {
    event: tContent('analytics.table.sectionViewed'),
    trigger: toPlainText(tContent('analytics.table.sectionViewedTrigger')),
    payload: tContent('analytics.table.sectionViewedPayload'),
  },
  {
    event: tContent('analytics.table.demoClick'),
    trigger: toPlainText(tContent('analytics.table.demoClickTrigger')),
    payload: tContent('analytics.table.demoClickPayload'),
  },
]);

const functionalTestItems = computed(() =>
  Array.from({ length: 11 }, (_value, i) => `item${i + 1}`).map((key) => ({
    action: tContent(`testes.functional.${key}.action`),
    result: tContent(`testes.functional.${key}.result`),
    priority: localPriority(tContent(`testes.functional.${key}.priority`)),
  })),
);

// O conteúdo compartilhado descreve a verificação de acessibilidade como AÇÃO e
// RESULTADO. A tabela pergunta critério, nível e como verificar: o resultado é o
// critério que precisa valer, e a ação é como se chega até ele.
const a11yTestItems = computed(() =>
  ['item1', 'item2', 'item3', 'item4', 'item5'].map((key) => ({
    criterion: tContent(`testes.accessibility.${key}.result`),
    level: 'WCAG 2.2 AA',
    how: tContent(`testes.accessibility.${key}.action`),
  })),
);

const visualTestItems = computed(() =>
  ['item1', 'item2', 'item3'].map((key) => ({
    story: `${tContent(`testes.visual.${key}.action`)} — ${tContent(`testes.visual.${key}.result`)}`,
    priority: localPriority(tContent(`testes.visual.${key}.priority`)),
  })),
);
</script>

<template>
  <DocsPageLayout
    :nav-groups="navGroups"
    :active-section="activeSection"
    component-slug="editor"
  >
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
      />
    </template>

    <!-- ── Demonstração ─────────────────────────────────────────────── -->
    <DocsDemonstration
      :title="tContent('demonstration.title')"
      component-slug="editor"
    >
      <div
        class="nds-stack nds-w-full"
        data-spacing="md"
      >
        <div
          class="nds-cluster"
          data-spacing="sm"
          role="group"
          :aria-label="tContent('demonstration.title')"
        >
          <!-- O observer resolve por `.closest('[data-track]')`, e a terceira
               parte do id estruturado vira `element_id`. -->
          <Button
            v-for="control in demoControls"
            :key="control.key"
            type="button"
            variant="outline"
            size="sm"
            :aria-pressed="control.pressed"
            data-track="demo"
            :data-track-id="`editor:demonstracao:${control.key}`"
            :data-track-label="control.label"
            @click="control.apply"
          >
            {{ control.label }}
          </Button>
        </div>

        <Editor
          :labels="baseLabels"
          :content="DEMO_CONTENT"
          :preset="demoPreset"
          :editable="!demoReadOnly"
        />
      </div>
    </DocsDemonstration>

    <!-- ── Anatomia ─────────────────────────────────────────────────── -->
    <DocsAnatomy
      :title="tContent('anatomy.title')"
      :items="anatomyItems"
      :structure-label="tContent('anatomy.structureLabel')"
      :structure-code="tContent('anatomy.structureCode')"
      language="html"
    />

    <!-- ── Quando Usar ──────────────────────────────────────────────── -->
    <DocsWhenToUse
      :title="tContent('usage.title')"
      :guidelines="{ title: tContent('usage.guidelines.title'), items: guidelineItems }"
      :scenarios="{
        title: tContent('usage.scenarios.title'),
        cols: {
          scenario: tContent('usage.scenarios.cols.scenario'),
          use: tContent('usage.scenarios.cols.use'),
          alternative: tContent('usage.scenarios.cols.alternative'),
        },
        items: scenarioItems,
      }"
      :do="{
        title: tNav('common.do'),
        items: [
          tContent('usage.do.item1'),
          tContent('usage.do.item2'),
          tContent('usage.do.item3'),
          tContent('usage.do.item4'),
        ],
      }"
      :dont="{
        title: tNav('common.dont'),
        items: [
          tContent('usage.dont.item1'),
          tContent('usage.dont.item2'),
          tContent('usage.dont.item3'),
          tContent('usage.dont.item4'),
        ],
      }"
    />

    <!-- ── Do & Don't ───────────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="[
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
      ]"
    >
      <!-- Par 1: o verbo da ação contra o nome da marcação.
           MESMO conjunto e MESMO conteúdo nos dois lados: muda um rótulo só, o
           do botão de link — e é dele que a legenda fala. -->
      <template #do-preview-0>
        <Editor
          :labels="baseLabels"
          :content="THANKS_CONTENT"
          preset="basic"
        />
      </template>
      <template #dont-preview-0>
        <Editor
          :labels="nounLabels"
          :content="THANKS_CONTENT"
          preset="basic"
        />
      </template>

      <!-- Par 2: o conjunto pelo tipo de conteúdo, não pelo espaço -->
      <template #do-preview-1>
        <Editor
          :labels="baseLabels"
          :content="THANKS_CONTENT"
          preset="basic"
        />
      </template>
      <template #dont-preview-1>
        <Editor
          :labels="baseLabels"
          :content="THANKS_CONTENT"
          preset="advanced"
        />
      </template>
    </DocsDoDont>

    <!-- ── Importação ───────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :description="tContent('import.basic')"
      :code="tContent('import.basicCode')"
      :secondary-description="tContent('import.withStorage')"
      :secondary-code="tContent('import.withStorageCode')"
      component-slug="editor"
    />

    <!-- ── Variantes ────────────────────────────────────────────────── -->
    <DocsVariants
      :title="tContent('variants.title')"
      :note="tContent('variants.note')"
      :items="variantItems"
      component-slug="editor"
    >
      <template #variant-preview-0>
        <Editor
          :labels="baseLabels"
          :content="BASIC_CONTENT"
          preset="basic"
        />
      </template>
      <template #variant-preview-1>
        <Editor
          :labels="baseLabels"
          :content="ADVANCED_CONTENT"
          preset="advanced"
        />
      </template>
    </DocsVariants>

    <!-- ── Estados ──────────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{
        state: tContent('states.cols.state'),
        trigger: tContent('states.cols.trigger'),
        behavior: tContent('states.cols.behavior'),
      }"
      :items="stateItems"
    />

    <!-- ── Propriedades ─────────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        {
          title: 'Editor',
          cols: {
            prop: tContent('props.table.prop'),
            type: tContent('props.table.type'),
            default: tContent('props.table.default'),
            required: tContent('props.table.required'),
            description: tContent('props.table.description'),
          },
          items: propItems,
        },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="tContent('props.extensibility')"
      :extensibility-code="tContent('props.extensibilityCode')"
      language="ts"
    />

    <!-- ── Tokens ───────────────────────────────────────────────────── -->
    <DocsTokens
      :title="tContent('tokens.title')"
      :cols="{
        token: tContent('tokens.table.token'),
        value: tContent('tokens.table.value'),
        description: tContent('tokens.table.description'),
      }"
      :items="tokenRows"
      :customization-title="tContent('tokens.customizationTitle')"
      :customization-code="tContent('tokens.customizationCode')"
    />

    <!-- ── Acessibilidade ───────────────────────────────────────────── -->
    <DocsAccessibility
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-title="tContent('accessibility.keyboardTitle')"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ─────────────────────────────────────────────── -->
    <DocsRelated
      :title="tContent('related.title')"
      :items="relatedItems"
      component-slug="editor"
    />

    <!-- ── Notas ────────────────────────────────────────────────────── -->
    <DocsNotes
      :title="tContent('notes.title')"
      :items="noteItems"
      component-slug="editor"
    />

    <!-- ── Analytics ────────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :cols="{
        event: tContent('analytics.table.event'),
        trigger: toPlainText(tContent('analytics.table.trigger')),
        payload: tContent('analytics.table.payload'),
      }"
      :items="analyticsItems"
    />

    <!-- ── Testes ───────────────────────────────────────────────────── -->
    <DocsTestes
      :title="tContent('testes.title')"
      :functional="{
        title: tContent('testes.functional.title'),
        description: tContent('testes.functional.description'),
        cols: {
          action: tNav('common.userAction'),
          result: tNav('common.expectedResult'),
          priority: tNav('common.priority'),
        },
        items: functionalTestItems,
      }"
      :accessibility="{
        title: tContent('testes.accessibility.title'),
        description: tContent('testes.accessibility.description'),
        cols: {
          criterion: tNav('common.criterion'),
          level: 'WCAG',
          how: tNav('common.howToVerify'),
        },
        items: a11yTestItems,
      }"
      :visual="{
        title: tContent('testes.visual.title'),
        description: tContent('testes.visual.description'),
        cols: {
          story: tNav('common.storyState'),
          priority: tNav('common.priority'),
        },
        items: visualTestItems,
      }"
    />
  </DocsPageLayout>
</template>
