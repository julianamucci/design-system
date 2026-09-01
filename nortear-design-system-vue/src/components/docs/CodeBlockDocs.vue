<script setup lang="ts">
import { computed, watch } from 'vue';
import { useTranslation, type TranslationOverrides } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { CodeBlock } from '@/components/ui/code-block';
import uiTranslations from '@/i18n/ui.json';
import codeBlockTranslations from '@shared/content/code-block/translations.json';

import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.vue';
import DocsDemonstration from '@/components/docs/shared/sections/DocsDemonstration.vue';
import DocsAnatomy       from '@/components/docs/shared/sections/DocsAnatomy.vue';
import DocsWhenToUse     from '@/components/docs/shared/sections/DocsWhenToUse.vue';
import DocsDoDont        from '@/components/docs/shared/sections/DocsDoDont.vue';
import DocsImport        from '@/components/docs/shared/sections/DocsImport.vue';
import DocsCompositions  from '@/components/docs/shared/sections/DocsCompositions.vue';
import DocsStates        from '@/components/docs/shared/sections/DocsStates.vue';
import DocsProps         from '@/components/docs/shared/sections/DocsProps.vue';
import DocsTokens        from '@/components/docs/shared/sections/DocsTokens.vue';
import DocsAccessibility from '@/components/docs/shared/sections/DocsAccessibility.vue';
import DocsRelated       from '@/components/docs/shared/sections/DocsRelated.vue';
import DocsNotes         from '@/components/docs/shared/sections/DocsNotes.vue';
import DocsAnalytics     from '@/components/docs/shared/sections/DocsAnalytics.vue';
import DocsTestes        from '@/components/docs/shared/sections/DocsTestes.vue';
import { toPlainText } from '@/lib/strip-html';

// ─── Overrides da stack ───────────────────────────────────────────────────────
// O JSON compartilhado descreve a API em JSX (`className`, `ReactNode`, tags com
// `{/* */}`). Aqui trocamos só o que muda de sintaxe — o texto descritivo é
// neutro e fica como está.

const overrides: TranslationOverrides = {
  '*': {
    'props.table.className.name': 'class',
    'props.table.footer.type': 'string | slot',
    // Divergência de API de framework, registrada e não "alinhada": aqui os
    // controles extras do cabeçalho não são prop — são um slot nomeado, que é a
    // forma idiomática do Vue para o mesmo encaixe.
    'props.table.actions.type': 'slot',
  },
};

const INTERFACE_CODE = `export interface CodeBlockProps
  extends /* @vue-ignore */ HTMLAttributes<HTMLDivElement> {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
  highlightLines?: string | number | Array<string | number>;
  lineKinds?: Array<'context' | 'added' | 'removed'>;
  copyLabel?: string;
  copiedLabel?: string;
  addedLabel?: string;
  removedLabel?: string;
  regionLabel?: string;
  class?: HTMLAttributes['class'];
}

// O rodapé é um slot nomeado, não uma prop:
// <CodeBlock ...><template #footer>Observação</template></CodeBlock>
//
// As ações extras do cabeçalho também são um slot nomeado, e entram antes
// da ação de copiar:
// <CodeBlock ...><template #actions><Button …/></template></CodeBlock>`;

// ─── i18n ─────────────────────────────────────────────────────────────────────
// locale vem SEMPRE de useTranslation — nunca de Pinia/useLocaleStore.

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(codeBlockTranslations, overrides);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
const screenReaderItems = computed(() =>
  Object.values(
    (codeBlockTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >)[locale.value]?.accessibility?.screenReader ?? {},
  ),
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

/** Rótulos da ação de copiar, iguais em todos os blocos da página. */
const copyLabels = computed(() => ({
  copyLabel: tContent('demonstration.labels.copy'),
  copiedLabel: tContent('demonstration.labels.copied'),
}));

// ─── SEO & GEO ────────────────────────────────────────────────────────────────

useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: 'code-block',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
  breadcrumb: [
    { name: 'Components', item: '/components' },
    { name: tContent('category'), item: '/components/display' },
    { name: tContent('title') },
  ],
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'code-block',
    locale: newLocale,
    page_title: `${tContent('title')} · Design System`,
  });
}, { immediate: true });

// ─── Navegação ────────────────────────────────────────────────────────────────

// Os rótulos do nav são globais (ui.json), não do conteúdo do componente — é o
// mesmo menu em 48 páginas. Onde o nav e o heading da seção divergem
// ("Estados" no menu, "Configurações" no título), o heading é que manda.
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
      { id: 'importacao',   label: tNav('nav.import')       },
      { id: 'variantes',    label: tNav('nav.variants')     },
      { id: 'estados',      label: tNav('nav.states')       },
      { id: 'propriedades', label: tNav('nav.props')        },
      { id: 'tokens',       label: tNav('nav.tokens')       },
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
    component_name: 'code-block',
    locale: locale.value,
  });
});

// ─── Trechos exibidos ─────────────────────────────────────────────────────────
// Literais do contrato: as 4 stacks renderizam exatamente estas strings.

const demoTsxCode = `import { CodeBlock } from "@/components/ui/code-block";

const snippet = \`npm install\`;

export function Exemplo() {
  return <CodeBlock code={snippet} language="bash" />;
}`;

const demoBashCode = `# instala e sobe o Storybook
npm install
npm run storybook`;

const demoCssCode = `.nds-code-block-root {
  --code-block-bg: var(--muted);
  --code-token-keyword: var(--primary);
}`;

const demoJsonCode = `{
  "name": "nortear-design-system",
  "private": true,
  "version": "1.0.0"
}`;

const demoTxtCode = `Valor não reconhecido cai em texto simples.
O bloco continua rolando e copiando normalmente.`;

const variantScriptCode = 'const total = items.length; // soma';
const variantMarkupCode = '<button class="nds-button" :disabled="loading">Salvar</button>';
const variantStylesCode = '.nds-card { padding: var(--spacing-4); }';
const variantDataCode = '{ "port": 6006, "open": true }';
const variantShellCode = 'npm run build -- --mode production';
const variantTextCode = 'Sem classificação: monoespaçado e sem cor.';

/** Snippet exibido no toggle "Ver código" de cada linguagem suportada. */
const variantSnippet = (language: string) =>
  `<CodeBlock\n  :code="source"\n  language="${language}"\n  :show-line-numbers="false"\n/>`;

const compositionCode = `const items = await load();
const total = items.length;
render(items, total);`;

// O par 2 do Do & Don't contrasta numeração ligada e desligada no MESMO comando
// de uma linha — que é o que a legenda descreve.
const doDontCommandCode = 'npm run build -- --mode production';

const codeImportBasic = 'import { CodeBlock } from "@/components/ui/code-block";';

const codeImportWithFooter = `<template>
  <CodeBlock
    :code="source"
    language="bash"
    title="terminal"
    footer="Requer Node 20 ou superior."
  />
</template>`;

// ─── Dados das seções ─────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
  tContent('anatomy.item4'),
  tContent('anatomy.item5'),
  tContent('anatomy.item6'),
  tContent('anatomy.item7'),
  tContent('anatomy.item8'),
]);

const variantItems = computed(() => [
  { name: 'script', description: tContent('variants.items.script'), code: variantSnippet('tsx')  },
  { name: 'markup', description: tContent('variants.items.markup'), code: variantSnippet('vue')  },
  { name: 'styles', description: tContent('variants.items.styles'), code: variantSnippet('css')  },
  { name: 'data',   description: tContent('variants.items.data'),   code: variantSnippet('json') },
  { name: 'shell',  description: tContent('variants.items.shell'),  code: variantSnippet('bash') },
  { name: 'text',   description: tContent('variants.items.text'),   code: variantSnippet('txt')  },
  // `trackId` é a chave estável do evento — `name` aqui é texto traduzido, e sem
  // ela o mesmo toggle sairia com um id por idioma.
  {
    name: tContent('variants.items.withTitle.name'),
    description: tContent('variants.items.withTitle.description'),
    useWhen: tContent('variants.items.withTitle.use'),
    trackId: 'with-title',
    code: `<CodeBlock\n  :code="source"\n  language="ts"\n  title="lista.ts"\n/>`,
  },
  {
    name: tContent('variants.items.withoutNumbers.name'),
    description: tContent('variants.items.withoutNumbers.description'),
    useWhen: tContent('variants.items.withoutNumbers.use'),
    trackId: 'without-numbers',
    code: `<CodeBlock\n  :code="source"\n  language="ts"\n  :show-line-numbers="false"\n/>`,
  },
  {
    name: tContent('variants.items.highlighted.name'),
    description: tContent('variants.items.highlighted.description'),
    useWhen: tContent('variants.items.highlighted.use'),
    trackId: 'highlighted',
    code: `<CodeBlock\n  :code="source"\n  language="ts"\n  :highlight-lines="[2]"\n/>`,
  },
  {
    name: tContent('variants.items.withFooter.name'),
    description: tContent('variants.items.withFooter.description'),
    useWhen: tContent('variants.items.withFooter.use'),
    trackId: 'with-footer',
    code: `<CodeBlock\n  :code="source"\n  language="ts"\n  footer="A ação de copiar leva apenas o código."\n/>`,
  },
]);

const stateItems = computed(() => [
  { label: tContent('states.idle.label'),            trigger: toPlainText(tContent('states.idle.trigger')),            behavior: toPlainText(tContent('states.idle.behavior'))},
  { label: tContent('states.copied.label'),          trigger: toPlainText(tContent('states.copied.trigger')),          behavior: toPlainText(tContent('states.copied.behavior'))},
  { label: tContent('states.numbered.label'),        trigger: toPlainText(tContent('states.numbered.trigger')),        behavior: toPlainText(tContent('states.numbered.behavior'))},
  { label: tContent('states.unnumbered.label'),      trigger: toPlainText(tContent('states.unnumbered.trigger')),      behavior: toPlainText(tContent('states.unnumbered.behavior'))},
  { label: tContent('states.scrolling.label'),       trigger: toPlainText(tContent('states.scrolling.trigger')),       behavior: toPlainText(tContent('states.scrolling.behavior'))},
  { label: tContent('states.unknownLanguage.label'), trigger: toPlainText(tContent('states.unknownLanguage.trigger')), behavior: toPlainText(tContent('states.unknownLanguage.behavior'))},
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const PROP_KEYS = [
  'code', 'language', 'title', 'showLineNumbers', 'highlightLines',
  'lineKinds', 'actions', 'footer', 'copyLabel', 'copiedLabel',
  'addedLabel', 'removedLabel', 'regionLabel', 'className',
] as const;

const propItems = computed(() => PROP_KEYS.map(key => ({
  name: tContent(`props.table.${key}.name`),
  type: tContent(`props.table.${key}.type`),
  defaultValue: tContent(`props.table.${key}.default`),
  required: tContent(`props.table.${key}.required`),
  description: tContent(`props.table.${key}.description`),
})));

const SURFACE_TOKEN_KEYS = [
  'bg', 'border', 'headerBg', 'highlightBg', 'highlightAccent',
  'addedBg', 'addedAccent', 'removedBg', 'removedAccent', 'maxBlockSize',
] as const;
const SYNTAX_TOKEN_KEYS = [
  'comment', 'string', 'number', 'keyword', 'builtin', 'function',
  'tag', 'attr', 'property', 'operator', 'punctuation', 'plain',
] as const;
const INHERITED_TOKEN_KEYS = ['radius', 'mutedForeground', 'foreground', 'borderBase'] as const;

const tokenRows = computed(() => [
  ...SURFACE_TOKEN_KEYS.map(key => ({
    token: tContent(`tokens.table.${key}.token`),
    value: tContent('tokens.surfaceTitle'),
    description: tContent(`tokens.table.${key}.part`),
  })),
  ...SYNTAX_TOKEN_KEYS.map(key => ({
    token: tContent(`tokens.table.${key}.token`),
    value: tContent('tokens.syntaxTitle'),
    description: tContent(`tokens.table.${key}.part`),
  })),
  ...INHERITED_TOKEN_KEYS.map(key => ({
    token: tContent(`tokens.table.${key}.token`),
    value: tContent('tokens.inheritedTitle'),
    description: tContent(`tokens.table.${key}.part`),
  })),
]);

const accessibilityItems = computed(() => [
  tContent('accessibility.item1'),
  tContent('accessibility.item2'),
  tContent('accessibility.item3'),
  tContent('accessibility.item4'),
  tContent('accessibility.item5'),
  tContent('accessibility.item6'),
]);

const keyboardItems = computed(() => [
  { key: 'Tab',         description: tContent('accessibility.keyboard.tab')      },
  { key: 'Enter',       description: tContent('accessibility.keyboard.enter')    },
  { key: 'Space',       description: tContent('accessibility.keyboard.space')    },
  { key: 'Arrow Up / Arrow Down / Arrow Left / Arrow Right',     description: tContent('accessibility.keyboard.arrows')   },
  { key: 'Home / End',  description: tContent('accessibility.keyboard.homeEnd')  },
]);

const relatedItems = computed(() => [
  { name: 'Table', description: toPlainText(tContent('related.table')), path: '?path=/docs/primitives-tables-table--docs' },
  { name: 'Alert', description: toPlainText(tContent('related.alert')), path: '?path=/docs/primitives-feedback-alert--docs' },
  { name: 'Tabs',  description: toPlainText(tContent('related.tabs')),  path: '?path=/docs/primitives-navigation-tabs--docs'  },
  { name: 'Card',  description: toPlainText(tContent('related.card')),  path: '?path=/docs/primitives-layout-card--docs'  },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.tip1') },
  { title: '', content: tContent('notes.tip2') },
  { title: '', content: tContent('notes.tip3') },
  { title: '', content: tContent('notes.tip4') },
  { title: '', content: tContent('notes.tip5') },
]);

const analyticsItems = computed(() => [
  { event: tContent('analytics.table.copy'),          trigger: toPlainText(tContent('analytics.table.copyTrigger')),          payload: tContent('analytics.table.copyPayload')          },
  { event: tContent('analytics.table.pageView'),      trigger: toPlainText(tContent('analytics.table.pageViewTrigger')),      payload: tContent('analytics.table.pageViewPayload')      },
  { event: tContent('analytics.table.sectionViewed'), trigger: toPlainText(tContent('analytics.table.sectionViewedTrigger')), payload: tContent('analytics.table.sectionViewedPayload') },
  { event: tContent('analytics.table.langSwitch'),    trigger: toPlainText(tContent('analytics.table.langSwitchTrigger')),    payload: tContent('analytics.table.langSwitchPayload')    },
]);

const functionalTestItems = computed(() => [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({
  action: tContent(`testes.functional.item${i}.action`),
  result: tContent(`testes.functional.item${i}.result`),
  priority: localPriority(tContent(`testes.functional.item${i}.priority`)),
})));

const a11yTestItems = computed(() => [1, 2, 3, 4, 5].map(i => ({
  criterion: tContent(`testes.accessibility.item${i}.criterion`),
  level: tContent(`testes.accessibility.item${i}.level`),
  how: tContent(`testes.accessibility.item${i}.how`),
})));

const visualTestItems = computed(() => [1, 2, 3, 4, 5].map(i => ({
  story: tContent(`testes.visual.item${i}.story`),
  priority: localPriority(tContent(`testes.visual.item${i}.priority`)),
})));

const a11yCritCols = computed(() => ({
  criterion: tNav('common.criterion'),
  level: 'WCAG',
  how: tNav('common.howToVerify'),
}));
</script>

<template>
  <DocsPageLayout
    :nav-groups="navGroups"
    :active-section="activeSection"
    component-slug="code-block"
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
    <DocsDemonstration
      :title="tContent('demonstration.title')"
      component-slug="code-block"
    >
      <div
        class="nds-stack nds-w-full"
        data-spacing="md"
      >
        <CodeBlock
          v-bind="copyLabels"
          class="nds-w-full"
          :title="tContent('demonstration.labels.fileName')"
          language="tsx"
          :code="demoTsxCode"
          highlight-lines="3, 5-7"
          :footer="tContent('demonstration.labels.footer')"
          data-track="code"
          data-track-id="code-block:demonstracao:exemplo-tsx"
        />
        <CodeBlock
          v-bind="copyLabels"
          class="nds-w-full"
          :title="tContent('demonstration.labels.terminalTitle')"
          language="bash"
          :code="demoBashCode"
          :show-line-numbers="false"
          data-track="code"
          data-track-id="code-block:demonstracao:terminal"
        />
        <CodeBlock
          v-bind="copyLabels"
          class="nds-w-full"
          :title="tContent('demonstration.labels.themeTitle')"
          language="css"
          :code="demoCssCode"
          data-track="code"
          data-track-id="code-block:demonstracao:tema-css"
        />
        <CodeBlock
          v-bind="copyLabels"
          class="nds-w-full"
          :title="tContent('demonstration.labels.dataTitle')"
          language="json"
          :code="demoJsonCode"
          data-track="code"
          data-track-id="code-block:demonstracao:package-json"
        />
        <CodeBlock
          v-bind="copyLabels"
          class="nds-w-full"
          :title="tContent('demonstration.labels.plainTitle')"
          language="txt"
          :code="demoTxtCode"
          :show-line-numbers="false"
          data-track="code"
          data-track-id="code-block:demonstracao:notas-txt"
        />
      </div>
    </DocsDemonstration>

    <!-- ── Anatomia ───────────────────────────────────────────────── -->
    <DocsAnatomy
      :title="tContent('anatomy.title')"
      :items="anatomyItems"
      :structure-label="tContent('anatomy.structureLabel')"
      :structure-code="tContent('anatomy.structureCode')"
    />

    <!-- ── Quando Usar ────────────────────────────────────────────── -->
    <DocsWhenToUse
      :title="tContent('usage.title')"
      :guidelines="{
        title: tContent('usage.guidelines.title'),
        items: [tContent('usage.guidelines.item1'), tContent('usage.guidelines.item2'), tContent('usage.guidelines.item3'), tContent('usage.guidelines.item4')],
      }"
      :scenarios="{
        title: tContent('usage.scenarios.title'),
        cols: { scenario: tContent('usage.scenarios.cols.scenario'), use: tContent('usage.scenarios.cols.use'), alternative: tContent('usage.scenarios.cols.alternative') },
        items: [
          { s: tContent('usage.scenarios.item1.s'), u: tContent('usage.scenarios.item1.u'), a: tContent('usage.scenarios.item1.a') },
          { s: tContent('usage.scenarios.item2.s'), u: tContent('usage.scenarios.item2.u'), a: tContent('usage.scenarios.item2.a') },
          { s: tContent('usage.scenarios.item3.s'), u: tContent('usage.scenarios.item3.u'), a: tContent('usage.scenarios.item3.a') },
          { s: tContent('usage.scenarios.item4.s'), u: tContent('usage.scenarios.item4.u'), a: tContent('usage.scenarios.item4.a') },
        ],
      }"
      :ux-writing="{
        title: tContent('usage.uxWriting.title'),
        cols: { element: tContent('usage.uxWriting.table.element'), rules: tContent('usage.uxWriting.table.rules'), do: tContent('usage.uxWriting.table.correct'), dont: tContent('usage.uxWriting.table.avoid') },
        items: [
          { element: tContent('usage.uxWriting.table.headerTitle.name'), rules: tContent('usage.uxWriting.table.headerTitle.format'), do: tContent('usage.uxWriting.table.headerTitle.good'), dont: tContent('usage.uxWriting.table.headerTitle.bad') },
          { element: tContent('usage.uxWriting.table.footer.name'), rules: tContent('usage.uxWriting.table.footer.format'), do: tContent('usage.uxWriting.table.footer.good'), dont: tContent('usage.uxWriting.table.footer.bad') },
          { element: tContent('usage.uxWriting.table.copy.name'), rules: tContent('usage.uxWriting.table.copy.format'), do: tContent('usage.uxWriting.table.copy.good'), dont: tContent('usage.uxWriting.table.copy.bad') },
          { element: tContent('usage.uxWriting.table.comments.name'), rules: tContent('usage.uxWriting.table.comments.format'), do: tContent('usage.uxWriting.table.comments.good'), dont: tContent('usage.uxWriting.table.comments.bad') },
        ],
      }"
      :do="{ title: tContent('usage.do.title'), items: [tContent('usage.do.item1'), tContent('usage.do.item2'), tContent('usage.do.item3'), tContent('usage.do.item4')] }"
      :dont="{ title: tContent('usage.dont.title'), items: [tContent('usage.dont.item1'), tContent('usage.dont.item2'), tContent('usage.dont.item3')] }"
    />

    <!-- ── Do & Don't ─────────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="[
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair1.do')), dontCaption: toPlainText(tContent('doDont.pair1.dont')) },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair2.do')), dontCaption: toPlainText(tContent('doDont.pair2.dont')) },
      ]"
    >
      <template #do-preview-0>
        <CodeBlock
          v-bind="copyLabels"
          class="nds-w-full"
          title="lista.ts"
          language="ts"
          :code="compositionCode"
          :highlight-lines="[2]"
          data-track="code"
          data-track-id="code-block:do-dont:do-1"
        />
      </template>
      <template #dont-preview-0>
        <CodeBlock
          v-bind="copyLabels"
          class="nds-w-full"
          :code="compositionCode"
          highlight-lines="1-2"
          data-track="code"
          data-track-id="code-block:do-dont:dont-1"
        />
      </template>
      <template #do-preview-1>
        <CodeBlock
          v-bind="copyLabels"
          class="nds-w-full"
          language="bash"
          :code="doDontCommandCode"
          :show-line-numbers="false"
          data-track="code"
          data-track-id="code-block:do-dont:do-2"
        />
      </template>
      <template #dont-preview-1>
        <CodeBlock
          v-bind="copyLabels"
          class="nds-w-full"
          language="bash"
          :code="doDontCommandCode"
          :show-line-numbers="true"
          data-track="code"
          data-track-id="code-block:do-dont:dont-2"
        />
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :description="tContent('import.basic')"
      :code="codeImportBasic"
      :secondary-description="tContent('import.withFooter')"
      :secondary-code="codeImportWithFooter"
      component-slug="code-block"
    />

    <!-- ── Variantes (linguagens suportadas) ──────────────────────── -->
    <DocsCompositions
      id="variantes"
      :title="tContent('variants.title')"
      :note="tContent('variants.note')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="code-block"
      :items="variantItems"
    >
      <template #variant-preview-0>
        <CodeBlock
          v-bind="copyLabels"
          class="nds-w-full"
          language="tsx"
          :code="variantScriptCode"
          :show-line-numbers="false"
          data-track="code"
          data-track-id="code-block:variantes:script"
        />
      </template>
      <template #variant-preview-1>
        <CodeBlock
          v-bind="copyLabels"
          class="nds-w-full"
          language="vue"
          :code="variantMarkupCode"
          :show-line-numbers="false"
          data-track="code"
          data-track-id="code-block:variantes:markup"
        />
      </template>
      <template #variant-preview-2>
        <CodeBlock
          v-bind="copyLabels"
          class="nds-w-full"
          language="css"
          :code="variantStylesCode"
          :show-line-numbers="false"
          data-track="code"
          data-track-id="code-block:variantes:styles"
        />
      </template>
      <template #variant-preview-3>
        <CodeBlock
          v-bind="copyLabels"
          class="nds-w-full"
          language="json"
          :code="variantDataCode"
          :show-line-numbers="false"
          data-track="code"
          data-track-id="code-block:variantes:data"
        />
      </template>
      <template #variant-preview-4>
        <CodeBlock
          v-bind="copyLabels"
          class="nds-w-full"
          language="bash"
          :code="variantShellCode"
          :show-line-numbers="false"
          data-track="code"
          data-track-id="code-block:variantes:shell"
        />
      </template>
      <template #variant-preview-5>
        <CodeBlock
          v-bind="copyLabels"
          class="nds-w-full"
          language="txt"
          :code="variantTextCode"
          :show-line-numbers="false"
          data-track="code"
          data-track-id="code-block:variantes:text"
        />
      </template>
      <template #variant-preview-6>
        <CodeBlock
          v-bind="copyLabels"
          class="nds-w-full"
          title="lista.ts"
          language="ts"
          :code="compositionCode"
          data-track="code"
          data-track-id="code-block:variantes:with-title"
        />
      </template>
      <template #variant-preview-7>
        <CodeBlock
          v-bind="copyLabels"
          class="nds-w-full"
          language="ts"
          :code="compositionCode"
          :show-line-numbers="false"
          data-track="code"
          data-track-id="code-block:variantes:without-numbers"
        />
      </template>
      <template #variant-preview-8>
        <CodeBlock
          v-bind="copyLabels"
          class="nds-w-full"
          language="ts"
          :code="compositionCode"
          :highlight-lines="[2]"
          data-track="code"
          data-track-id="code-block:variantes:highlighted"
        />
      </template>
      <template #variant-preview-9>
        <CodeBlock
          v-bind="copyLabels"
          class="nds-w-full"
          language="ts"
          :code="compositionCode"
          :footer="tContent('demonstration.labels.footer')"
          data-track="code"
          data-track-id="code-block:variantes:with-footer"
        />
      </template>
    </DocsCompositions>

    <!-- ── Configurações ──────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{ state: tContent('states.cols.state'), trigger: toPlainText(tContent('states.cols.trigger')), behavior: toPlainText(tContent('states.cols.behavior'))}"
      :items="stateItems"
    />

    <!-- ── Propriedades ───────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[{ cols: propCols, items: propItems }]"
      :interface-code="INTERFACE_CODE"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="tContent('props.extensibility')"
      :extensibility-code="tContent('props.extensibilityCode')"
    />

    <!-- ── Tokens ─────────────────────────────────────────────────── -->
    <DocsTokens
      :title="tContent('tokens.title')"
      :cols="{ token: tContent('tokens.table.token'), value: tContent('tokens.table.group'), description: tContent('tokens.table.part') }"
      :items="tokenRows"
      :customization-title="tContent('tokens.customizationTitle')"
      :customization-code="tContent('tokens.customizationCode')"
    />

    <!-- ── Acessibilidade ─────────────────────────────────────────── -->
    <DocsAccessibility
      :screen-reader-title="tNav('common.screenReader')"
      :screen-reader-items="screenReaderItems"
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-title="tContent('accessibility.keyboardTitle')"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ───────────────────────────────────────────── -->
    <DocsRelated
      :title="tContent('related.title')"
      :items="relatedItems"
      component-slug="code-block"
    />

    <!-- ── Notas ──────────────────────────────────────────────────── -->
    <DocsNotes
      :title="tContent('notes.title')"
      :items="noteItems"
      component-slug="code-block"
    />

    <!-- ── Analytics ──────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :cols="{ event: tContent('analytics.table.event'), trigger: toPlainText(tContent('analytics.table.trigger')), payload: tContent('analytics.table.payload') }"
      :items="analyticsItems"
    />

    <!-- ── Testes ─────────────────────────────────────────────────── -->
    <DocsTestes
      :title="tContent('testes.title')"
      :functional="{
        title: tContent('testes.functional.title'),
        description: tContent('testes.functional.description'),
        cols: { action: tNav('common.userAction'), result: tNav('common.expectedResult'), priority: tNav('common.priority') },
        items: functionalTestItems,
      }"
      :accessibility="{
        title: tContent('testes.accessibility.title'),
        description: tContent('testes.accessibility.description'),
        cols: a11yCritCols,
        items: a11yTestItems,
      }"
      :visual="{
        title: tContent('testes.visual.title'),
        description: tContent('testes.visual.description'),
        cols: { story: tNav('common.storyState'), priority: tNav('common.priority') },
        items: visualTestItems,
      }"
    />
  </DocsPageLayout>
</template>
