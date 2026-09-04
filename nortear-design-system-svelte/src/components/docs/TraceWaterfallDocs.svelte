<script lang="ts">
  import { untrack } from 'svelte';
  import { TraceWaterfall } from '@/components/ui/trace-waterfall';
  import {
    WIDE_TOTAL_MS,
    traceWaterfallLabelsFor,
    wideTraceSpans,
  } from '@/components/ui/trace-waterfall/trace-waterfall.fixtures';
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
    resolveTraceWaterfall,
    type TraceWaterfallDrawing,
    type TraceWaterfallRowDrawing,
  } from '@shared/primitives/trace-waterfall-axis';
  import {
    TRACE_SPANS_FAILURE,
    TRACE_SPANS_ORDER,
    TRACE_SPANS_PARTIAL,
    TRACE_TOTAL_MS,
  } from '@shared/primitives/trace-waterfall-examples';
  import uiTranslations from '@/i18n/ui.json';
  import traceWaterfallTranslations from '@shared/content/trace-waterfall/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  // SEM OVERRIDE NENHUM. O conteúdo compartilhado descreve nomes e tipos que já
  // são os desta stack — `spans`, `totalMs`, `status`, `labels`, e nenhum deles
  // carrega tipo de framework. A divergência de API desta peça é a FORMA da
  // chamada (componente, não fábrica), e forma não se corrige por override:
  // ela se registra, e está registrada no docblock do componente (§4.1 da
  // guideline 17).
  const { tStore } = useTranslation(traceWaterfallTranslations);

  const labels = $derived(traceWaterfallLabelsFor($locale));

  /** O rastro largo das duas fotos em que o assunto é a rolagem. */
  const WIDE_SPANS = wideTraceSpans();

  /**
   * As duas contas dos contraexemplos.
   *
   * A marcação errada é escrita À MÃO, e tem de ser: a peça sempre escreve a
   * leitura de cada linha e sempre põe papel e nome na camada que rola, então
   * não há argumento que produza o erro. O que ela NÃO faz à mão é a conta —
   * o recuo, o recorte e a barra mínima continuam saindo do primitivo
   * compartilhado, senão o contraexemplo mostraria uma cascata diferente da
   * certa por um motivo que não é o assunto do par.
   */
  const ORDER_DRAWING = resolveTraceWaterfall(TRACE_SPANS_ORDER, TRACE_TOTAL_MS);
  const WIDE_DRAWING = resolveTraceWaterfall(WIDE_SPANS, WIDE_TOTAL_MS);

  /** A frase que só quem ouve recebe: a palavra do estado e a posição em números. */
  function readingOf(drawn: TraceWaterfallRowDrawing): string {
    const parts = [
      labels.state[drawn.span.state],
      labels.reading
        .replace('{start}', String(drawn.span.startMs))
        .replace('{duration}', String(drawn.span.durationMs)),
    ];
    if (drawn.clipped) parts.push(labels.clipped);
    return parts.join(' ');
  }

  // As chaves de `accessibility.screenReader` variam por componente, então só
  // os valores chegam ao container — o `t()` exige nome de chave e não
  // serviria. O `title` fica de fora: ele é o cabeçalho da lista, não um item
  // dela.
  const screenReaderItems = $derived(
    Object.entries(
      (traceWaterfallTranslations as unknown as Record<
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
      componentSlug: 'trace-waterfall',
    });
    track('docs_page_view', {
      component_name: 'trace-waterfall',
      locale: l,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

  // ─── Active section ──────────────────────────────────────────────────────────
  //
  // Não há seção de variantes: esta peça não tem eixo de forma. A estrutura é
  // sempre a mesma — régua, camada que rola e linhas — e o que muda é o
  // estado de cada trecho, que é a seção de estados.

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
      component_name: 'trace-waterfall',
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

  const interfaceCode = `export interface TraceWaterfallLabels {
  region: string;    // o nome da camada que rola — obrigatório
  axis: string;      // molde visível da régua, com \`{total}\`
  duration: string;  // molde da duração visível, com \`{duration}\`
  reading: string;   // molde da leitura, com \`{start}\` e \`{duration}\`
  clipped: string;   // a frase do trecho que não coube no eixo
  state: Record<ToolCallState, string>;
}

// O trecho vem de \`@shared/primitives/chat-protocol\`. \`TraceSpan\` é o TERCEIRO
// tipo daquele arquivo que carrega geometria, e entra pelo mesmo critério dos
// dois primeiros: ser a origem única do que cinco stacks reescreveriam.
//
// O INTERVALO É PLANO, e não um tipo aninhado: os dois tipos de geometria que
// já moravam ali carregam as coordenadas soltas, e um tipo que embrulha dois
// campos para um consumidor só é indireção, não vocabulário.
interface TraceSpan {
  id: string;
  label: string;
  startMs: number;     // desde a origem do eixo
  durationMs: number;
  depth: number;       // recuo em degraus, relativo aos demais
  state: ToolCallState;
}

// O TOTAL NÃO MORA NO TRECHO: ele é propriedade do EIXO, e é ele que faz as
// barras dividirem uma régua só. Um total por trecho seriam N verdades sobre a
// mesma régua.

type ToolCallState = 'pending' | 'running' | 'done' | 'failed';`;
</script>

<!--
  A CASCATA ESCRITA À MÃO, e ela existe só para os contraexemplos.

  `omit` diz o que falta: `reading` tira a frase que só quem ouve recebe;
  `name` tira o papel e o nome da camada que rola. São os dois defeitos que o
  par mostra, e nenhum dos dois tem argumento que o produza — a peça sempre
  escreve os dois.
-->
{#snippet handWaterfall(drawing: TraceWaterfallDrawing, omit: 'reading' | 'name')}
  <div class="nds-trace-waterfall" data-slot="trace-waterfall" aria-busy="true">
    <p class="nds-trace-waterfall-axis" data-slot="trace-waterfall-axis">
      {labels.axis.replace('{total}', String(drawing.totalMs))}
    </p>

    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      class="nds-trace-waterfall-viewport"
      data-slot="trace-waterfall-viewport"
      tabindex="0"
      role={omit === 'name' ? undefined : 'group'}
      aria-label={omit === 'name' ? undefined : labels.region}
    >
      <ol class="nds-trace-waterfall-rows" data-slot="trace-waterfall-rows">
        {#each drawing.rows as drawn, index (index)}
          <li
            class="nds-trace-waterfall-row"
            data-slot="trace-waterfall-row"
            data-state={drawn.span.state}
            data-span-id={drawn.span.id}
            style="--trace-waterfall-row-indent: {drawn.indent}"
          >
            <span class="nds-trace-waterfall-name" data-slot="trace-waterfall-name">
              <span
                class="nds-trace-waterfall-marker"
                data-slot="trace-waterfall-marker"
                aria-hidden="true"
              ></span>
              <span
                class="nds-trace-waterfall-label"
                data-slot="trace-waterfall-label">{drawn.span.label}</span
              >
            </span>

            <span class="nds-trace-waterfall-track" data-slot="trace-waterfall-track" aria-hidden="true">
              <span
                class="nds-trace-waterfall-bar"
                data-slot="trace-waterfall-bar"
                style="--trace-waterfall-bar-start: {drawn.start}; --trace-waterfall-bar-size: {drawn.size}"
              ></span>
            </span>

            <span
              class="nds-trace-waterfall-duration"
              data-slot="trace-waterfall-duration">{labels.duration.replace('{duration}', String(drawn.span.durationMs))}</span
            >
            {#if omit !== 'reading'}
              <span
                class="nds-sr-only"
                data-slot="trace-waterfall-row-reading">{readingOf(drawn)}</span
              >
            {/if}
          </li>
        {/each}
      </ol>
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
    A legenda diz QUAL caso está desenhado — sem ela, quatro réguas empilhadas
    viram uma só, e o assunto da demonstração é justamente a diferença entre
    elas.
  -->
  <DocsDemonstration
    title={$tStore('demonstration.title')}
    componentSlug="trace-waterfall"
  >
    <div class="nds-stack nds-w-full" data-spacing="lg">
      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.order')}
        </p>
        <TraceWaterfall
          spans={TRACE_SPANS_ORDER}
          totalMs={TRACE_TOTAL_MS}
          status="running"
          {labels}
        />
      </div>

      <Separator />

      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.failure')}
        </p>
        <TraceWaterfall
          spans={TRACE_SPANS_FAILURE}
          totalMs={TRACE_TOTAL_MS}
          status="failed"
          {labels}
        />
      </div>

      <Separator />

      <!--
        O rastro pela metade: quem revela passa MENOS trechos, e o eixo
        continua o mesmo.
      -->
      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.partial')}
        </p>
        <TraceWaterfall
          spans={TRACE_SPANS_PARTIAL}
          totalMs={TRACE_TOTAL_MS}
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
          <TraceWaterfall
            spans={WIDE_SPANS}
            totalMs={WIDE_TOTAL_MS}
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
      items: ['region', 'label', 'axis', 'reading'].map(k => ({
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
      <TraceWaterfall spans={TRACE_SPANS_ORDER} totalMs={TRACE_TOTAL_MS} status="running" {labels} />
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <!--
      Sem a frase de cada linha, sobra a barra — e barra não se lê. A cascata
      deixa de se reconstruir de ouvido: quem não vê o desenho não recebe nem
      o estado do trecho nem a posição no eixo.
    -->
    <div class="nds-stack nds-w-full" data-spacing="lg">
      {#if ORDER_DRAWING}
        {@render handWaterfall(ORDER_DRAWING, 'reading')}
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
        <TraceWaterfall spans={WIDE_SPANS} totalMs={WIDE_TOTAL_MS} status="running" {labels} />
      </div>
    </div>
  {/snippet}
  {#snippet dontPair2()}
    <div class="nds-stack nds-w-full" data-spacing="lg">
      <div class="nds-max-w-md">
        {#if WIDE_DRAWING}
          {@render handWaterfall(WIDE_DRAWING, 'name')}
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
    A ordem sai de `TOOL_CALL_STATES`: a tabela e a story de estados leem a
    mesma lista, e nenhuma das duas fica para trás quando o tipo cresce.
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
        title: 'TraceWaterfall',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: ['spans', 'totalMs', 'status', 'labels'].map(k => ({
          name: $tStore(`props.table.${k}.name`),
          type: $tStore(`props.table.${k}.type`),
          defaultValue: $tStore(`props.table.${k}.default`),
          required: $tStore(`props.table.${k}.required`),
          description: toPlainText($tStore(`props.table.${k}.description`)),
        })),
      },
      {
        title: 'TraceWaterfallLabels',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          'labelsRegion', 'labelsAxis', 'labelsDuration',
          'labelsReading', 'labelsClipped', 'labelsState',
        ].map(k => ({
          name: $tStore(`props.table.${k}.name`),
          type: $tStore(`props.table.${k}.type`),
          defaultValue: $tStore(`props.table.${k}.default`),
          required: $tStore(`props.table.${k}.required`),
          description: toPlainText($tStore(`props.table.${k}.description`)),
        })),
      },
      {
        title: 'TraceSpan',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          'spanId', 'spanLabel', 'spanStart',
          'spanDuration', 'spanDepth', 'spanState',
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
      'textLabel', 'spacing24', 'spacing40', 'spacing2', 'lineHeightNormal',
      'spacing3', 'border', 'radius', 'muted', 'ring', 'spacing4',
      'radiusFull', 'mutedForeground', 'foreground', 'background',
      'primary', 'primaryForeground', 'spacing1', 'success', 'destructive',
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
      { name: $tStore('related.items.flowGraph.name'),     description: toPlainText($tStore('related.items.flowGraph.description')),     path: '?path=/docs/components-conversational-flowgraph--docs'     },
      { name: $tStore('related.items.agentPlan.name'),     description: toPlainText($tStore('related.items.agentPlan.description')),     path: '?path=/docs/components-conversational-agentplan--docs'     },
      { name: $tStore('related.items.messageTiming.name'), description: toPlainText($tStore('related.items.messageTiming.description')), path: '?path=/docs/components-conversational-messagetiming--docs' },
      { name: $tStore('related.items.progress.name'),      description: toPlainText($tStore('related.items.progress.description')),      path: '?path=/docs/components-feedback-progress--docs'            },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    componentSlug="trace-waterfall"
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
