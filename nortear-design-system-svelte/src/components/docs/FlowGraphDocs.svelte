<script lang="ts">
  import { untrack } from 'svelte';
  import { FlowGraph } from '@/components/ui/flow-graph';
  import {
    flowGraphLabelsFor,
    wideFlowEdges,
    wideFlowNodes,
  } from '@/components/ui/flow-graph/flow-graph.fixtures';
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
  import { TOOL_CALL_STATES } from '@shared/primitives/chat-protocol';
  import {
    resolveFlowGraph,
    type FlowGraphDrawing,
    type FlowGraphNodeDrawing,
  } from '@shared/primitives/flow-graph-edges';
  import {
    FLOW_EDGES_ORDER,
    FLOW_NODES_FAILURE,
    FLOW_NODES_ORDER,
    FLOW_NODES_PARTIAL,
  } from '@shared/primitives/flow-graph-examples';
  import uiTranslations from '@/i18n/ui.json';
  import flowGraphTranslations from '@shared/content/flow-graph/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  // SEM OVERRIDE NENHUM. O conteúdo compartilhado descreve nomes e tipos que já
  // são os desta stack — `nodes`, `edges`, `status`, `labels`, e nenhum deles
  // carrega tipo de framework. A divergência de API desta peça é a FORMA da
  // chamada (componente, não fábrica), e forma não se corrige por override: ela
  // se registra, e está registrada no docblock do componente (§4.1 da
  // guideline 17).
  const { tStore } = useTranslation(flowGraphTranslations);

  const labels = $derived(flowGraphLabelsFor($locale));

  /** O grafo largo das duas fotos em que o assunto é a rolagem. */
  const WIDE_NODES = wideFlowNodes();
  const WIDE_EDGES = wideFlowEdges();

  /**
   * As duas contas dos contraexemplos.
   *
   * A marcação errada é escrita À MÃO, e tem de ser: a peça sempre escreve a
   * leitura de cada nó e sempre põe papel e nome na camada que rola, então não
   * há argumento que produza o erro. O que ela NÃO faz à mão é a conta — a
   * curva, a normalização e o descarte de aresta órfã continuam saindo do
   * primitivo compartilhado, senão o contraexemplo mostraria um grafo diferente
   * do certo por um motivo que não é o assunto do par.
   */
  const ORDER_DRAWING = resolveFlowGraph(FLOW_NODES_ORDER, FLOW_EDGES_ORDER);
  const WIDE_DRAWING = resolveFlowGraph(WIDE_NODES, WIDE_EDGES);

  /** A frase que só quem ouve recebe: a palavra do estado e de quem depende. */
  function readingOf(drawn: FlowGraphNodeDrawing): string {
    const parts = [labels.state[drawn.node.state]];
    if (drawn.dependsOn.length > 0) {
      parts.push(labels.dependsOn.replace('{sources}', drawn.dependsOn.join(', ')));
    }
    return parts.join(' ');
  }

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria. O
  // `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = $derived(
    Object.entries(
      (flowGraphTranslations as unknown as Record<
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
      componentSlug: 'flow-graph',
    });
    track('docs_page_view', {
      component_name: 'flow-graph',
      locale: l,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

  // ─── Active section ──────────────────────────────────────────────────────────
  //
  // Não há seção de variantes: esta peça não tem eixo de forma. A estrutura é
  // sempre a mesma — camada que rola, curvas e nós — e o que muda é o estado de
  // cada nó, que é a seção de estados.

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
      component_name: 'flow-graph',
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

  const interfaceCode = `export interface FlowGraphLabels {
  region: string;     // o nome da camada que rola — obrigatório
  dependsOn: string;  // molde com \`{sources}\`
  state: Record<ToolCallState, string>;
}

// O nó e a ligação vêm de \`@shared/primitives/chat-protocol\`. \`FlowNode\` é o
// SEGUNDO tipo daquele arquivo que carrega geometria, e entra pelo mesmo
// critério do primeiro: ser a origem única do que cinco stacks reescreveriam.
interface FlowNode {
  id: string;
  label: string;
  column: number;  // casa da grade, relativa às demais
  row: number;     // casa da grade, relativa às demais
  state: ToolCallState;
}

// A PRIMEIRA RELAÇÃO deste vocabulário: um par de endereços diz "este depende
// daquele". Uma fila ordenada não sabe dizer isso, porque fila não se ramifica
// nem se reencontra. A ligação não carrega estado — o estado mora nos nós, e
// uma ligação com estado próprio poderia discordar das duas pontas.
interface FlowEdge {
  from: string;
  to: string;
}

type ToolCallState = 'pending' | 'running' | 'done' | 'failed';`;
</script>

<!--
  O GRAFO ESCRITO À MÃO, e ele existe só para os contraexemplos.

  `omit` diz o que falta: `reading` tira a frase que só quem ouve recebe;
  `name` tira o papel e o nome da camada que rola. São os dois defeitos que o
  par mostra, e nenhum dos dois tem argumento que o produza — a peça sempre
  escreve os dois.
-->
{#snippet handGraph(drawing: FlowGraphDrawing, omit: 'reading' | 'name')}
  <div class="nds-flow-graph" data-slot="flow-graph" aria-busy="true">
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      class="nds-flow-graph-viewport"
      data-slot="flow-graph-viewport"
      tabindex="0"
      role={omit === 'name' ? undefined : 'group'}
      aria-label={omit === 'name' ? undefined : labels.region}
    >
      <div
        class="nds-flow-graph-canvas"
        data-slot="flow-graph-canvas"
        style="--flow-graph-columns: {drawing.columns}; --flow-graph-rows: {drawing.rows}"
      >
        <svg
          class="nds-flow-graph-edges"
          data-slot="flow-graph-edges"
          viewBox="0 0 {drawing.columns} {drawing.rows}"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          {#each drawing.edges as edge, index (index)}
            <path
              class="nds-flow-graph-edge"
              data-slot="flow-graph-edge"
              d={edge.path}
              vector-effect="non-scaling-stroke"
            />
          {/each}
        </svg>

        <ol class="nds-flow-graph-nodes" data-slot="flow-graph-nodes">
          {#each drawing.nodes as drawn, index (index)}
            <li
              class="nds-flow-graph-node"
              data-slot="flow-graph-node"
              data-state={drawn.node.state}
              data-node-id={drawn.node.id}
              style="--flow-graph-node-column: {drawn.columnLine}; --flow-graph-node-row: {drawn.rowLine}"
            >
              <span
                class="nds-flow-graph-node-marker"
                data-slot="flow-graph-node-marker"
                aria-hidden="true"
              ></span>
              <span
                class="nds-flow-graph-node-label"
                data-slot="flow-graph-node-label">{drawn.node.label}</span
              >
              {#if omit !== 'reading'}
                <span
                  class="nds-sr-only"
                  data-slot="flow-graph-node-reading">{readingOf(drawn)}</span
                >
              {/if}
            </li>
          {/each}
        </ol>
      </div>
    </div>
  </div>
{/snippet}

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
    A legenda diz QUAL grafo está desenhado — sem ela, quatro grades empilhadas
    viram uma só, e o assunto da demonstração é justamente a diferença entre elas.
  -->
  <DocsDemonstration
    title={$tStore('demonstration.title')}
    componentSlug="flow-graph"
  >
    <div class="nds-stack nds-w-full" data-spacing="lg">
      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.order')}
        </p>
        <FlowGraph
          nodes={FLOW_NODES_ORDER}
          edges={FLOW_EDGES_ORDER}
          status="running"
          {labels}
        />
      </div>

      <Separator />

      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.failure')}
        </p>
        <FlowGraph
          nodes={FLOW_NODES_FAILURE}
          edges={FLOW_EDGES_ORDER}
          status="failed"
          {labels}
        />
      </div>

      <Separator />

      <!--
        O grafo pela metade: quem revela passa MENOS nós, e as ligações que
        perderam uma ponta somem sozinhas.
      -->
      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.partial')}
        </p>
        <FlowGraph
          nodes={FLOW_NODES_PARTIAL}
          edges={FLOW_EDGES_ORDER}
          status="running"
          {labels}
        />
      </div>

      <Separator />

      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.wide')}
        </p>
        <div class="nds-max-w-md">
          <FlowGraph
            nodes={WIDE_NODES}
            edges={WIDE_EDGES}
            status="running"
            {labels}
          />
        </div>
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
      items: ['region', 'label', 'dependsOn', 'state'].map(k => ({
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
    <div class="nds-stack nds-w-full" data-spacing="lg">
      <FlowGraph
        nodes={FLOW_NODES_ORDER}
        edges={FLOW_EDGES_ORDER}
        status="running"
        {labels}
      />
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <!--
      Sem a frase de cada nó, sobra a curva — e curva não se lê. O grafo deixa
      de se reconstruir de ouvido: quem não vê o desenho não recebe nem o estado
      do nó nem de quem ele depende.
    -->
    <div class="nds-stack nds-w-full" data-spacing="lg">
      {#if ORDER_DRAWING}
        {@render handGraph(ORDER_DRAWING, 'reading')}
      {/if}
    </div>
  {/snippet}
  <!--
    O segundo par é sobre a CAMADA QUE ROLA: o certo lhe dá papel e nome; o
    errado deixa uma parada de teclado anônima, que é o defeito que dois
    componentes desta casa já tiveram.
  -->
  {#snippet doPair2()}
    <div class="nds-stack nds-w-full" data-spacing="lg">
      <div class="nds-max-w-md">
        <FlowGraph
          nodes={WIDE_NODES}
          edges={WIDE_EDGES}
          status="running"
          {labels}
        />
      </div>
    </div>
  {/snippet}
  {#snippet dontPair2()}
    <div class="nds-stack nds-w-full" data-spacing="lg">
      <div class="nds-max-w-md">
        {#if WIDE_DRAWING}
          {@render handGraph(WIDE_DRAWING, 'name')}
        {/if}
      </div>
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
    A ordem sai de `TOOL_CALL_STATES`: a tabela e a story de estados leem a mesma
    lista, e nenhuma das duas fica para trás quando o tipo cresce.
  -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('states.cols.state'),
      trigger: $tStore('states.cols.trigger'),
      behavior: $tStore('states.cols.behavior'),
    }}
    items={TOOL_CALL_STATES.map(k => ({
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
        title: 'FlowGraph',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: ['nodes', 'edges', 'status', 'labels'].map(k => ({
          name: $tStore(`props.table.${k}.name`),
          type: $tStore(`props.table.${k}.type`),
          defaultValue: $tStore(`props.table.${k}.default`),
          required: $tStore(`props.table.${k}.required`),
          description: toPlainText($tStore(`props.table.${k}.description`)),
        })),
      },
      {
        title: 'FlowGraphLabels',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: ['labelsRegion', 'labelsDependsOn', 'labelsState'].map(k => ({
          name: $tStore(`props.table.${k}.name`),
          type: $tStore(`props.table.${k}.type`),
          defaultValue: $tStore(`props.table.${k}.default`),
          required: $tStore(`props.table.${k}.required`),
          description: toPlainText($tStore(`props.table.${k}.description`)),
        })),
      },
      {
        title: 'FlowNode',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: ['nodeId', 'nodeLabel', 'nodeColumn', 'nodeRow', 'nodeState'].map(k => ({
          name: $tStore(`props.table.${k}.name`),
          type: $tStore(`props.table.${k}.type`),
          defaultValue: $tStore(`props.table.${k}.default`),
          required: $tStore(`props.table.${k}.required`),
          description: toPlainText($tStore(`props.table.${k}.description`)),
        })),
      },
      {
        title: 'FlowEdge',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: ['edgeFrom', 'edgeTo'].map(k => ({
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
      'textLabel', 'lineHeightNormal', 'spacing2', 'spacing3', 'spacing16',
      'spacing24', 'muted', 'background', 'foreground', 'mutedForeground',
      'border', 'primary', 'success', 'destructive', 'ring', 'radius',
      'radiusSm', 'radiusFull',
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
    items={[1, 2, 3, 4, 5, 6, 7, 8].map(i => $tStore(`accessibility.items.item${i}`))}
    keyboardTitle={$tStore('accessibility.keyboard.title')}
    keyboardItems={[
      { key: 'Tab',   description: $tStore('accessibility.keyboard.tab') },
      { key: 'Enter', description: $tStore('accessibility.keyboard.enter') },
      { key: '← →',   description: $tStore('accessibility.keyboard.arrows') },
    ]}
    screenReaderTitle={$tStore('accessibility.screenReader.title')}
    screenReaderItems={screenReaderItems}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.agentPlan.name'),   description: toPlainText($tStore('related.items.agentPlan.description')),   path: '?path=/docs/components-conversational-agentplan--docs'   },
      { name: $tStore('related.items.toolGroup.name'),   description: toPlainText($tStore('related.items.toolGroup.description')),   path: '?path=/docs/components-conversational-toolgroup--docs'   },
      { name: $tStore('related.items.agentStatus.name'), description: toPlainText($tStore('related.items.agentStatus.description')), path: '?path=/docs/components-conversational-agentstatus--docs' },
      { name: $tStore('related.items.chart.name'),       description: toPlainText($tStore('related.items.chart.description')),       path: '?path=/docs/components-display-chart--docs'              },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    componentSlug="flow-graph"
    items={[1, 2, 3, 4, 5, 6, 7].map(i => ({ title: '', content: $tStore(`notes.item${i}`) }))}
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
      items: [1, 2, 3, 4, 5, 6, 7].map(i => ({
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
      items: [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({
        story: toPlainText($tStore(`testes.visual.item${i}.story`)),
        priority: localPriority($tStore(`testes.visual.item${i}.priority`), $tNavStore),
      })),
    }}
  />
</DocsPageLayout>
