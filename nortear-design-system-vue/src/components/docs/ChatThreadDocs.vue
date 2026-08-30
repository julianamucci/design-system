<script setup lang="ts">
import { computed, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { ChatThread, type ChatMessage, type ChatThreadLabels } from '@/components/ui/chat-thread';
import { toMessages, useChatLabels } from '@/components/ui/chat-thread/chat-thread.fixtures';
import { Separator } from '@/components/ui/separator';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import chatTranslations from '@shared/content/chat-thread/translations.json';
import {
  CHAT_COM_FERRAMENTAS,
  CHAT_CONVERSA,
  CHAT_EM_STREAMING,
  CHAT_FERRAMENTA_FALHOU,
} from '@shared/primitives/chat-examples';

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
import { toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────
//
// O locale sai do `useTranslation`, nunca de store: locale de Pinia já derrubou
// docs page em runtime neste repositório.
//
// A ÚNICA linha sobrescrita é a de `actions`, e por um motivo de API: aqui os
// botões do turno não entram numa prop, entram num slot com escopo. Deixar a
// tabela anunciando uma prop que não existe seria documentar outra stack.

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(chatTranslations, {
  '*': {
    'props.table.actions.name': '#actions',
    'props.table.actions.type': 'slot',
  },
});

const labels = useChatLabels();

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria. O
// `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
const screenReaderItems = computed(() =>
  Object.entries(
    (chatTranslations as unknown as Record<
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

// ─── Exemplos ─────────────────────────────────────────────────────────────────

function streamingExample(): ChatMessage[] {
  const messages = toMessages(CHAT_EM_STREAMING);
  messages[messages.length - 1].streaming = true;
  return messages;
}

/**
 * Uma conversa rotulada por demonstração.
 *
 * A legenda diz QUAL exemplo está desenhado — sem ela, quatro conversas
 * empilhadas viram uma só, e o assunto da demonstração é justamente a diferença
 * entre elas.
 */
const EXAMPLES = [
  { key: 'conversation', messages: toMessages(CHAT_CONVERSA) },
  { key: 'tools', messages: toMessages(CHAT_COM_FERRAMENTAS) },
  { key: 'streaming', messages: streamingExample() },
  { key: 'failed', messages: toMessages(CHAT_FERRAMENTA_FALHOU) },
];

const CONVERSATION = toMessages(CHAT_CONVERSA);
const TOOL_FAILED = toMessages(CHAT_FERRAMENTA_FALHOU);

/** O contraexemplo do segundo par: o estado sem palavra, só o ícone colorido. */
const wordlessLabels = computed<ChatThreadLabels>(() => ({
  ...labels.value,
  toolState: { pending: '', running: '', done: '', failed: '' },
}));

const ROLES = ['user', 'assistant', 'system'] as const;

function byRole(role: (typeof ROLES)[number]): ChatMessage[] {
  return toMessages(CHAT_CONVERSA.filter((message) => message.role === role));
}

const ROLE_EXAMPLES = ROLES.map((role) => ({ role, messages: byRole(role) }));

// ─── SEO & GEO ────────────────────────────────────────────────────────────────

useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: 'chat-thread',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'chat-thread',
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
      { id: 'anatomia',     label: tNav('nav.anatomy')      },
      { id: 'quando-usar',  label: tNav('nav.usage')        },
      { id: 'do-dont',      label: tNav('nav.doDont')       },
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
    component_name: 'chat-thread',
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
  items: ['author', 'toolName', 'toolState', 'system'].map(k => ({
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

const variantItems = computed(() =>
  ROLES.map(role => ({
    name: role,
    description: tContent(`variants.items.${role}.description`),
    code: `<ChatThread\n  :messages="[{ role: '${role}', content: texto }]"\n  :labels="labels"\n/>`,
  })),
);

const stateItems = computed(() =>
  ['atEnd', 'away', 'streaming', 'toolPending', 'toolFailed', 'error'].map(k => ({
    label: tContent(`states.${k}.label`),
    trigger: toPlainText(tContent(`states.${k}.trigger`)),
    behavior: toPlainText(tContent(`states.${k}.behavior`)),
  })),
);

const propsTables = computed(() => [
  {
    title: 'ChatThread',
    cols: {
      prop: tContent('props.table.prop'),
      type: tContent('props.table.type'),
      default: tContent('props.table.default'),
      required: tContent('props.table.required'),
      description: tContent('props.table.description'),
    },
    items: [
      'messages', 'labels', 'id', 'role', 'streaming',
      'toolCalls', 'sources', 'actions', 'error', 'class',
    ].map(k => ({
      name: tContent(`props.table.${k}.name`),
      type: tContent(`props.table.${k}.type`),
      defaultValue: tContent(`props.table.${k}.default`),
      required: tContent(`props.table.${k}.required`),
      description: toPlainText(tContent(`props.table.${k}.description`)),
    })),
  },
]);

const interfaceCode = `// ChatThread.vue
interface ChatThreadProps {
  messages: ChatMessage[];
  labels: ChatThreadLabels;
  error?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  class?: string;
}

// A LISTA é a API: quem faz streaming troca — ou muda — o array.
//   mensagem nova   — acrescenta ao fim, e é por ela que a rolagem decide
//   mesmo \`id\`      — onde o streaming pousa, sem remontar a mensagem
//   \`error\`         — a falha da execução, fora da conversa

// A marcação que quem consome fornece entra por SLOT COM ESCOPO:
//   <template #avatar="{ message }">   — o retrato de quem falou
//   <template #actions="{ message }">  — os botões do turno
//   <template #approval="{ call }">    — os controles de autorização`;

const tokenItems = computed(() =>
  ['bubble', 'header', 'body', 'disclosure', 'failed', 'ring'].map(k => ({
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
  { name: tContent('related.items.markdown.name'), description: toPlainText(tContent('related.items.markdown.description')), path: '?path=/docs/primitives-conversational-markdown--docs' },
  { name: tContent('related.items.avatar.name'),   description: toPlainText(tContent('related.items.avatar.description')),   path: '?path=/docs/primitives-display-avatar--docs' },
  { name: tContent('related.items.button.name'),   description: toPlainText(tContent('related.items.button.description')),   path: '?path=/docs/primitives-form-button--docs' },
  { name: tContent('related.items.skeleton.name'), description: toPlainText(tContent('related.items.skeleton.description')), path: '?path=/docs/primitives-feedback-skeleton--docs' },
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
  items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => ({
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
    <DocsDemonstration
      :title="tContent('demonstration.title')"
      component-slug="chat-thread"
    >
      <div
        class="nds-stack nds-w-full"
        data-spacing="lg"
      >
        <!--
          Separador ENTRE os exemplos, e não em volta de cada um. A thread não
          tem moldura própria — em uso real ela mora dentro de um painel que dá
          o quadro. Empilhadas, quatro delas viram uma sopa: o rótulo de uma
          encosta no último turno da anterior. O separador é decorativo de
          propósito: quem dá a estrutura para quem ouve é a legenda de cada
          exemplo, não a linha.
        -->
        <template
          v-for="(example, i) in EXAMPLES"
          :key="example.key"
        >
          <Separator v-if="i > 0" />
          <div
            class="nds-stack nds-w-full"
            data-spacing="xs"
          >
            <p class="nds-text-caption nds-text-muted-foreground">
              {{ tContent(`demonstration.labels.${example.key}`) }}
            </p>
            <ChatThread
              :messages="example.messages"
              :labels="labels"
              size="md"
            />
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

    <!-- ── Do & Don't ─────────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="doDontPairs"
    >
      <!-- O par é a MESMA conversa: o que muda é para onde a rolagem vai
           quando a mensagem chega. -->
      <template #do-preview-0>
        <ChatThread
          :messages="CONVERSATION"
          :labels="labels"
          size="sm"
        />
      </template>
      <template #dont-preview-0>
        <ChatThread
          :messages="CONVERSATION"
          :labels="labels"
          size="sm"
        />
      </template>
      <template #do-preview-1>
        <ChatThread
          :messages="TOOL_FAILED"
          :labels="labels"
          size="sm"
        />
      </template>
      <template #dont-preview-1>
        <ChatThread
          :messages="TOOL_FAILED"
          :labels="wordlessLabels"
          size="sm"
        />
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :description="tContent('import.basic')"
      :code="tContent('import.basicCode')"
      :secondary-description="tContent('import.withStreaming')"
      :secondary-code="tContent('import.withStreamingCode')"
    />

    <!-- ── Variantes ──────────────────────────────────────────────── -->
    <DocsVariants
      :title="tContent('variants.title')"
      :note="tContent('variants.note')"
      :items="variantItems"
      component-slug="chat-thread"
    >
      <template #variant-preview-0>
        <ChatThread
          :messages="ROLE_EXAMPLES[0].messages"
          :labels="labels"
          size="xs"
        />
      </template>
      <template #variant-preview-1>
        <ChatThread
          :messages="ROLE_EXAMPLES[1].messages"
          :labels="labels"
          size="xs"
        />
      </template>
      <template #variant-preview-2>
        <ChatThread
          :messages="ROLE_EXAMPLES[2].messages"
          :labels="labels"
          size="xs"
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
      :extensibility-notes="tContent('props.extensibility')"
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
      component-slug="chat-thread"
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
