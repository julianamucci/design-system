<script lang="ts">
  import { untrack } from 'svelte';
  import { AgentStatus, type AgentStatusLabels } from '@/components/ui/agent-status';
  import {
    agentStatusLabelsFor,
    elapsedOf,
  } from '@/components/ui/agent-status/agent-status.fixtures';
  import { Separator } from '@/components/ui/separator';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsStates, DocsProps, DocsTokens,
    DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes,
  } from '@/components/docs/shared/sections';
  import { RUN_STATUSES, type RunStatus } from '@shared/primitives/chat-protocol';
  import uiTranslations from '@/i18n/ui.json';
  import statusTranslations from '@shared/content/agent-status/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  // Não há linha sobrescrita aqui: as quatro props têm o mesmo nome nesta stack
  // e no conteúdo compartilhado, e a tabela dos rótulos descreve o vocabulário
  // de tela, que não muda conforme quem renderiza.
  const { tStore } = useTranslation(statusTranslations);

  const labels = $derived(agentStatusLabelsFor($locale));

  /**
   * O contraexemplo do primeiro par: a palavra de cada estado apagada.
   *
   * A diferença entre a execução em curso e a que falhou passa a existir só na
   * cor do ponto — e cor não chega a quem ouve a tela (WCAG 1.4.1). O texto sai
   * dos próprios rótulos traduzidos, esvaziados, e não de uma palavra cravada
   * aqui.
   */
  const WORDLESS_STATUS: AgentStatusLabels = $derived({
    ...labels,
    status: RUN_STATUSES.reduce((acc, status) => {
      acc[status] = '';
      return acc;
    }, {} as Record<RunStatus, string>),
  });

  /** O contraexemplo do segundo par: um rótulo só para os três estados. */
  const SAME_ACTION: AgentStatusLabels = $derived({
    ...labels,
    action: {
      running: labels.action?.running,
      stopped: labels.action?.running,
      failed: labels.action?.running,
    },
  });

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria. O
  // `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = $derived(
    Object.entries(
      (statusTranslations as unknown as Record<
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
      componentSlug: 'agent-status',
    });
    track('docs_page_view', {
      component_name: 'agent-status',
      locale: l,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

  // ─── Active section ──────────────────────────────────────────────────────────
  //
  // Não há seção de variantes: esta peça não tem eixo de forma. A linha é sempre
  // a mesma, e o que muda é em que pé está a resposta — que é a seção de estados.

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
        { id: 'importacao',   label: tNav('nav.import') },
        { id: 'estados',      label: tNav('nav.states') },
        { id: 'propriedades', label: tNav('nav.props')  },
        { id: 'tokens',       label: tNav('nav.tokens') },
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
    track('docs_section_viewed', {
      section_id: id,
      component_name: 'agent-status',
      locale: $locale,
    });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const priorityKeyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };
  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── Code strings ────────────────────────────────────────────────────────────

  const interfaceCode = `export interface AgentStatusLabels {
  status: Record<RunStatus, string>;              // a palavra de cada estado
  action?: Partial<Record<RunStatus, string>>;    // o rótulo da ação onde ela existe
}

// O estado e a pergunta "já terminou?" vêm de
// \`@shared/primitives/chat-protocol\`:
type RunStatus = 'idle' | 'running' | 'stopped' | 'complete' | 'failed';

// A intenção que sai da linha. \`start\` cobre retomar e refazer: a diferença
// entre as duas é política de produto, e a peça não executa nenhuma.
export type AgentStatusIntent = 'stop' | 'start';`;
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
  <!--
    A legenda diz QUAL caso está desenhado — sem ela, quatro linhas empilhadas
    viram uma só, e o assunto da demonstração é justamente a diferença entre
    elas.
  -->
  <DocsDemonstration
    title={$tStore('demonstration.title')}
    componentSlug="agent-status"
  >
    <div class="nds-stack nds-w-full" data-spacing="lg">
      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.running')}
        </p>
        <AgentStatus status="running" elapsed={elapsedOf('running')} {labels} />
      </div>

      <Separator />

      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.stopped')}
        </p>
        <AgentStatus status="stopped" elapsed={elapsedOf('stopped')} {labels} />
      </div>

      <Separator />

      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.failed')}
        </p>
        <AgentStatus status="failed" elapsed={elapsedOf('failed')} {labels} />
      </div>

      <Separator />

      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.complete')}
        </p>
        <AgentStatus status="complete" elapsed={elapsedOf('complete')} {labels} />
      </div>
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
      items: ['state', 'elapsed', 'stopAction', 'restartAction'].map(k => ({
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
  <!--
    Os dois pares desenham o MESMO par de estados. O que muda é se a palavra
    chega a quem não vê a cor do ponto, e se a ação troca de nome quando troca
    de função.
  -->
  {#snippet doPair1()}
    <div class="nds-stack nds-w-full" data-spacing="sm">
      <AgentStatus status="running" elapsed={elapsedOf('running')} {labels} />
      <AgentStatus status="failed" elapsed={elapsedOf('failed')} {labels} />
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <div class="nds-stack nds-w-full" data-spacing="sm">
      <AgentStatus status="running" elapsed={elapsedOf('running')} labels={WORDLESS_STATUS} />
      <AgentStatus status="failed" elapsed={elapsedOf('failed')} labels={WORDLESS_STATUS} />
    </div>
  {/snippet}
  {#snippet doPair2()}
    <div class="nds-stack nds-w-full" data-spacing="sm">
      <AgentStatus status="running" elapsed={elapsedOf('running')} {labels} />
      <AgentStatus status="failed" elapsed={elapsedOf('failed')} {labels} />
    </div>
  {/snippet}
  {#snippet dontPair2()}
    <div class="nds-stack nds-w-full" data-spacing="sm">
      <AgentStatus status="running" elapsed={elapsedOf('running')} labels={SAME_ACTION} />
      <AgentStatus status="failed" elapsed={elapsedOf('failed')} labels={SAME_ACTION} />
    </div>
  {/snippet}

  <DocsDoDont
    title={$tStore('doDont.title')}
    pairs={[
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: toPlainText($tStore('doDont.pair1.do')),
        dontCaption: toPlainText($tStore('doDont.pair1.dont')),
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
    secondaryDescription={$tStore('import.withLabels')}
    secondaryCode={$tStore('import.withLabelsCode')}
  />

  <!-- ── Estados ────────────────────────────────────────────────── -->
  <!--
    A ordem sai de `RUN_STATUSES`: a tabela e a story de estados leem a mesma
    lista, e nenhuma das duas fica para trás quando o tipo cresce.
  -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('states.cols.state'),
      trigger: $tStore('states.cols.trigger'),
      behavior: $tStore('states.cols.behavior'),
    }}
    items={RUN_STATUSES.map(k => ({
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
        title: 'AgentStatus',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: ['status', 'elapsed', 'labels', 'onAction'].map(k => ({
          name: $tStore(`props.table.${k}.name`),
          type: $tStore(`props.table.${k}.type`),
          defaultValue: $tStore(`props.table.${k}.default`),
          required: $tStore(`props.table.${k}.required`),
          description: toPlainText($tStore(`props.table.${k}.description`)),
        })),
      },
      {
        title: 'AgentStatusLabels',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: ['labelsStatus', 'labelsAction'].map(k => ({
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
    extensibilityNotes={stripHtml($tStore('props.extensibility'))}
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
    items={[
      'textLabel', 'mutedForeground', 'foreground',
      'primary', 'success', 'destructive',
      'spacing2', 'radiusFull', 'spacing6',
    ].map(k => ({
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
      { name: $tStore('related.items.chatThread.name'), description: toPlainText($tStore('related.items.chatThread.description')), path: '?path=/docs/primitives-conversational-chatthread--docs' },
      { name: $tStore('related.items.composer.name'),   description: toPlainText($tStore('related.items.composer.description')),   path: '?path=/docs/primitives-conversational-composer--docs'   },
      { name: $tStore('related.items.progress.name'),   description: toPlainText($tStore('related.items.progress.description')),   path: '?path=/docs/primitives-feedback-progress--docs'          },
      { name: $tStore('related.items.badge.name'),      description: toPlainText($tStore('related.items.badge.description')),      path: '?path=/docs/primitives-feedback-badge--docs'             },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    componentSlug="agent-status"
    items={[1, 2, 3, 4, 5, 6].map(i => ({ title: '', content: $tStore(`notes.item${i}`) }))}
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
      items: [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({
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
      items: [1, 2, 3, 4, 5, 6].map(i => ({
        story: toPlainText($tStore(`testes.visual.item${i}.story`)),
        priority: localPriority($tStore(`testes.visual.item${i}.priority`), $tNavStore),
      })),
    }}
  />
</DocsPageLayout>
