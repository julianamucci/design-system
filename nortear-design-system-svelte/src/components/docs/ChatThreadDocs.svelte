<script lang="ts">
  import { untrack } from 'svelte';
  import { ChatThread, type ChatMessage, type ChatThreadLabels } from '@/components/ui/chat-thread';
  import { chatThreadLabelsFor, toMessages } from '@/components/ui/chat-thread/chat-thread.fixtures';
  import { Separator } from '@/components/ui/separator';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsVariants, DocsStates, DocsProps, DocsTokens,
    DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes,
  } from '@/components/docs/shared/sections';
  import uiTranslations from '@/i18n/ui.json';
  import chatTranslations from '@shared/content/chat-thread/translations.json';
  import {
    CHAT_COM_FERRAMENTAS,
    CHAT_CONVERSA,
    CHAT_EM_STREAMING,
    CHAT_FERRAMENTA_FALHOU,
    type ChatExampleMessage,
  } from '@shared/primitives/chat-examples';
  import { toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  // A ÚNICA linha sobrescrita é o TIPO de `actions`, e por um motivo de API: o
  // conteúdo compartilhado descreve o tipo na API do Vanilla, onde os botões do
  // turno chegam como lista de elementos. Aqui eles chegam como trecho de
  // marcação. O nome da prop é o mesmo nas duas, então só o tipo diverge.
  const { tStore } = useTranslation(chatTranslations, {
    '*': { 'props.table.actions.type': 'Snippet' },
  });

  const labels = $derived(chatThreadLabelsFor($locale));

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria. O
  // `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = $derived(
    Object.entries(
      (chatTranslations as unknown as Record<
        string,
        { accessibility?: { screenReader?: Record<string, string> } }
      >)[$locale]?.accessibility?.screenReader ?? {},
    )
      .filter(([key]) => key !== 'title')
      .map(([, value]) => value),
  );

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'chat-thread',
    });
    track('docs_page_view', {
      component_name: 'chat-thread',
      locale: l,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

  // ─── Active section ──────────────────────────────────────────────────────────

  const NAV_GROUPS = $derived.by(() => {
    const tNav = $tNavStore;
    return [
      { label: tNav('nav.overview'), sections: [
        { id: 'demonstracao', label: tNav('nav.demonstration') },
        { id: 'anatomia',     label: tNav('nav.anatomy')       },
        { id: 'quando-usar',  label: tNav('nav.usage')         },
        { id: 'do-dont',      label: tNav('nav.doDont')        },
      ]},
      { label: tNav('nav.techRef'), sections: [
        { id: 'importacao',   label: tNav('nav.import')   },
        { id: 'variantes',    label: tNav('nav.variants') },
        { id: 'estados',      label: tNav('nav.states')   },
        { id: 'propriedades', label: tNav('nav.props')    },
        { id: 'tokens',       label: tNav('nav.tokens')   },
      ]},
      { label: tNav('nav.context'), sections: [
        { id: 'acessibilidade', label: tNav('nav.accessibility') },
        { id: 'relacionados',   label: tNav('nav.related')       },
        { id: 'notas',          label: tNav('nav.notes')         },
      ]},
      { label: tNav('nav.quality'), sections: [
        { id: 'analytics', label: tNav('nav.analytics') },
        { id: 'testes',    label: tNav('nav.testes')    },
      ]},
    ];
  });

  const sectionIds = untrack(() => NAV_GROUPS.flatMap(g => g.sections.map(s => s.id)));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'chat-thread', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const priorityKeyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };
  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── Exemplos ────────────────────────────────────────────────────────────────
  //
  // A legenda diz QUAL exemplo está desenhado — sem ela, quatro conversas
  // empilhadas viram uma só, e o assunto da demonstração é justamente a
  // diferença entre elas.

  function demoMessages(source: ChatExampleMessage[], streaming = false): ChatMessage[] {
    const list = toMessages(source);
    if (streaming) list[list.length - 1].streaming = true;
    return list;
  }

  const EXAMPLES = [
    { key: 'conversation', messages: demoMessages(CHAT_CONVERSA) },
    { key: 'tools',        messages: demoMessages(CHAT_COM_FERRAMENTAS) },
    { key: 'streaming',    messages: demoMessages(CHAT_EM_STREAMING, true) },
    { key: 'failed',       messages: demoMessages(CHAT_FERRAMENTA_FALHOU) },
  ];

  const ROLES = ['user', 'assistant', 'system'] as const;

  /** O contraexemplo do segundo par: o estado sem palavra, só o ícone colorido. */
  const MUTE_TOOL_STATE: ChatThreadLabels = $derived({
    ...labels,
    toolState: { pending: '', running: '', done: '', failed: '' },
  });

  const CONVERSATION = toMessages(CHAT_CONVERSA);
  const FAILED = toMessages(CHAT_FERRAMENTA_FALHOU);

  // ─── Code strings ────────────────────────────────────────────────────────────

  const interfaceCode = `interface ChatThreadProps {
  messages: ChatMessage[];
  labels: ChatThreadLabels;
  error?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  class?: string;
}

// A LISTA é a API: quem faz streaming troca o array.
//   mensagem nova   — acrescenta ao fim, e é por ela que a rolagem decide
//   mesmo \`id\`      — onde o streaming pousa, sem remontar a mensagem
//   \`error\`         — a falha da execução, fora da conversa`;

  function variantCode(role: string): string {
    return `<ChatThread\n  messages={[{ role: '${role}', content: answer }]}\n  {labels}\n/>`;
  }
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value}>
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')} componentSlug="chat-thread">
    <div class="nds-stack nds-w-full" data-spacing="lg">
      <!--
        Separador ENTRE os exemplos, e não em volta de cada um.

        A thread não tem moldura própria — em uso real ela mora dentro de um
        painel que dá o quadro. Empilhadas na demonstração, quatro delas viram
        uma sopa: o rótulo de uma encosta no último turno da anterior, e não dá
        para dizer onde uma acaba. O separador é decorativo de propósito: quem
        dá a estrutura para quem ouve é a legenda de cada exemplo, não a linha.
      -->
      {#each EXAMPLES as example, i (example.key)}
        {#if i > 0}
          <Separator />
        {/if}
        <div class="nds-stack nds-w-full" data-spacing="xs">
          <p class="nds-text-caption nds-text-muted-foreground">
            {$tStore(`demonstration.labels.${example.key}`)}
          </p>
          <ChatThread messages={example.messages} {labels} size="md" />
        </div>
      {/each}
    </div>
  </DocsDemonstration>

  <!-- ── Anatomia ───────────────────────────────────────────────── -->
  <DocsAnatomy
    title={$tStore('anatomy.title')}
    items={[1, 2, 3, 4, 5].map(i => $tStore(`anatomy.item${i}`))}
    structureLabel={$tStore('anatomy.structureLabel')}
    structureCode={$tStore('anatomy.structureCode')}
    language="html"
  />

  <!-- ── Quando Usar ────────────────────────────────────────────── -->
  <DocsWhenToUse
    title={$tStore('usage.title')}
    guidelines={{
      title: $tStore('usage.guidelines.title'),
      items: [1, 2, 3, 4, 5].map(i => $tStore(`usage.guidelines.item${i}`)),
    }}
    scenarios={{
      title: $tStore('usage.scenarios.title'),
      cols: {
        scenario: $tStore('usage.scenarios.cols.scenario'),
        use: $tStore('usage.scenarios.cols.use'),
        alternative: $tStore('usage.scenarios.cols.alternative'),
      },
      items: [1, 2, 3, 4, 5].map(i => ({
        s: $tStore(`usage.scenarios.item${i}.s`),
        u: $tStore(`usage.scenarios.item${i}.u`),
        a: toPlainText($tStore(`usage.scenarios.item${i}.a`)),
      })),
    }}
    uxWriting={{
      title: $tStore('usage.uxWriting.title'),
      cols: {
        element: $tStore('usage.uxWriting.table.element'),
        rules: $tStore('usage.uxWriting.table.rules'),
        do: $tStore('usage.uxWriting.table.correct'),
        dont: $tStore('usage.uxWriting.table.avoid'),
      },
      items: ['author', 'toolName', 'toolState', 'system'].map(k => ({
        element: $tStore(`usage.uxWriting.table.${k}.name`),
        rules: $tStore(`usage.uxWriting.table.${k}.format`),
        do: $tStore(`usage.uxWriting.table.${k}.good`),
        dont: $tStore(`usage.uxWriting.table.${k}.bad`),
      })),
    }}
    do={{
      title: $tStore('usage.do.title'),
      items: [1, 2, 3, 4].map(i => $tStore(`usage.do.item${i}`)),
    }}
    dont={{
      title: $tStore('usage.dont.title'),
      items: [1, 2, 3, 4].map(i => $tStore(`usage.dont.item${i}`)),
    }}
  />

  <!-- ── Do & Don't ─────────────────────────────────────────────── -->
  {#snippet doPair1()}
    <ChatThread messages={CONVERSATION} {labels} size="sm" />
  {/snippet}
  {#snippet dontPair1()}
    <ChatThread messages={CONVERSATION} {labels} size="sm" />
  {/snippet}
  {#snippet doPair2()}
    <ChatThread messages={FAILED} {labels} size="sm" />
  {/snippet}
  {#snippet dontPair2()}
    <ChatThread messages={FAILED} labels={MUTE_TOOL_STATE} size="sm" />
  {/snippet}

  <DocsDoDont
    title={$tStore('doDont.title')}
    pairs={[
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: toPlainText($tStore('doDont.pair1.do')),
        dontCaption: toPlainText($tStore('doDont.pair1.dont')),
        // O par é a MESMA conversa: o que muda é para onde a rolagem vai
        // quando a mensagem chega.
        doPreview: doPair1,
        dontPreview: dontPair1,
      },
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: toPlainText($tStore('doDont.pair2.do')),
        dontCaption: toPlainText($tStore('doDont.pair2.dont')),
        doPreview: doPair2,
        dontPreview: dontPair2,
      },
    ]}
  />

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    description={$tStore('import.basic')}
    code={$tStore('import.basicCode')}
    secondaryDescription={$tStore('import.withStreaming')}
    secondaryCode={$tStore('import.withStreamingCode')}
  />

  <!-- ── Variantes ──────────────────────────────────────────────── -->
  {#snippet variantUser()}
    <ChatThread
      messages={toMessages(CHAT_CONVERSA.filter(m => m.role === 'user'))}
      {labels}
      size="xs"
    />
  {/snippet}
  {#snippet variantAssistant()}
    <ChatThread
      messages={toMessages(CHAT_CONVERSA.filter(m => m.role === 'assistant'))}
      {labels}
      size="xs"
    />
  {/snippet}
  {#snippet variantSystem()}
    <ChatThread
      messages={toMessages(CHAT_CONVERSA.filter(m => m.role === 'system'))}
      {labels}
      size="xs"
    />
  {/snippet}

  <DocsVariants
    title={$tStore('variants.title')}
    note={$tStore('variants.note')}
    componentSlug="chat-thread"
    items={[
      { name: ROLES[0], description: $tStore('variants.items.user.description'),      code: variantCode(ROLES[0]), preview: variantUser },
      { name: ROLES[1], description: $tStore('variants.items.assistant.description'), code: variantCode(ROLES[1]), preview: variantAssistant },
      { name: ROLES[2], description: $tStore('variants.items.system.description'),    code: variantCode(ROLES[2]), preview: variantSystem },
    ]}
  />

  <!-- ── Estados ────────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('states.cols.state'),
      trigger: $tStore('states.cols.trigger'),
      behavior: $tStore('states.cols.behavior'),
    }}
    items={['atEnd', 'away', 'streaming', 'toolPending', 'toolFailed', 'error'].map(k => ({
      label: $tStore(`states.${k}.label`),
      trigger: toPlainText($tStore(`states.${k}.trigger`)),
      behavior: toPlainText($tStore(`states.${k}.behavior`)),
    }))}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        title: 'ChatThread',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          'messages', 'labels', 'id', 'role', 'streaming',
          'toolCalls', 'sources', 'actions', 'error', 'regionLabel', 'class',
        ].map(k => ({
          name: $tStore(`props.table.${k}.name`),
          type: $tStore(`props.table.${k}.type`),
          defaultValue: $tStore(`props.table.${k}.default`),
          required: $tStore(`props.table.${k}.required`),
          description: toPlainText($tStore(`props.table.${k}.description`)),
        })),
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityNotes={$tStore('props.extensibility')}
    extensibilityCode={$tStore('props.extensibilityCode')}
  />

  <!-- ── Tokens ─────────────────────────────────────────────────── -->
  <DocsTokens
    title={$tStore('tokens.title')}
    cols={{
      token: $tStore('tokens.table.token'),
      value: $tStore('tokens.table.value'),
      description: $tStore('tokens.table.description'),
    }}
    items={['bubble', 'header', 'body', 'disclosure', 'failed', 'ring'].map(k => ({
      token: $tStore(`tokens.table.${k}.token`),
      value: $tStore(`tokens.table.${k}.value`),
      description: toPlainText($tStore(`tokens.table.${k}.description`)),
    }))}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={$tStore('tokens.customizationCode')}
    language="css"
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
    title={$tStore('accessibility.title')}
    summary={$tStore('accessibility.summary')}
    items={[1, 2, 3, 4, 5].map(i => $tStore(`accessibility.items.item${i}`))}
    keyboardTitle={$tStore('accessibility.keyboard.title')}
    keyboardItems={[
      { key: 'Tab',   description: $tStore('accessibility.keyboard.tab') },
      { key: 'Enter', description: $tStore('accessibility.keyboard.enter') },
      { key: '↑ ↓',   description: $tStore('accessibility.keyboard.arrows') },
    ]}
    screenReaderTitle={$tStore('accessibility.screenReader.title')}
    screenReaderItems={screenReaderItems}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.markdown.name'), description: toPlainText($tStore('related.items.markdown.description')), path: '?path=/docs/components-conversational-markdown--docs' },
      { name: $tStore('related.items.avatar.name'),   description: toPlainText($tStore('related.items.avatar.description')),   path: '?path=/docs/components-display-avatar--docs' },
      { name: $tStore('related.items.button.name'),   description: toPlainText($tStore('related.items.button.description')),   path: '?path=/docs/components-form-button--docs' },
      { name: $tStore('related.items.skeleton.name'), description: toPlainText($tStore('related.items.skeleton.description')), path: '?path=/docs/components-feedback-skeleton--docs' },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    componentSlug="chat-thread"
    items={[1, 2, 3, 4, 5].map(i => ({ title: '', content: $tStore(`notes.item${i}`) }))}
  />

  <!-- ── Analytics ──────────────────────────────────────────────── -->
  <DocsAnalytics
    title={$tStore('analytics.title')}
    cols={{
      event: $tStore('analytics.table.event'),
      trigger: $tStore('analytics.table.trigger'),
      payload: $tStore('analytics.table.payload'),
    }}
    items={['pageView', 'sectionViewed', 'demoClick'].map(k => ({
      event: $tStore(`analytics.table.${k}`),
      trigger: toPlainText($tStore(`analytics.table.${k}Trigger`)),
      payload: $tStore(`analytics.table.${k}Payload`),
    }))}
  />

  <!-- ── Testes ─────────────────────────────────────────────────── -->
  <DocsTestes
    title={$tStore('testes.title')}
    functional={{
      title: $tStore('testes.functional.title'),
      description: $tStore('testes.functional.description'),
      cols: {
        action: $tNavStore('common.userAction'),
        result: $tNavStore('common.expectedResult'),
        priority: $tNavStore('common.priority'),
      },
      items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => ({
        action: toPlainText($tStore(`testes.functional.item${i}.action`)),
        result: toPlainText($tStore(`testes.functional.item${i}.result`)),
        priority: localPriority($tStore(`testes.functional.item${i}.priority`), $tNavStore),
      })),
    }}
    accessibility={{
      title: $tStore('testes.accessibility.title'),
      description: $tStore('testes.accessibility.description'),
      cols: {
        criterion: $tNavStore('common.criterion'),
        level: 'WCAG',
        how: $tNavStore('common.howToVerify'),
      },
      items: [1, 2, 3, 4, 5, 6].map(i => ({
        criterion: toPlainText($tStore(`testes.accessibility.item${i}`)),
        level: 'AA',
        how: '—',
      })),
    }}
    visual={{
      title: $tStore('testes.visual.title'),
      description: $tStore('testes.visual.description'),
      cols: {
        story: $tNavStore('common.storyState'),
        priority: $tNavStore('common.priority'),
      },
      items: [1, 2, 3, 4, 5, 6, 7].map(i => ({
        story: toPlainText($tStore(`testes.visual.item${i}.story`)),
        priority: localPriority($tStore(`testes.visual.item${i}.priority`), $tNavStore),
      })),
    }}
  />
</DocsPageLayout>
