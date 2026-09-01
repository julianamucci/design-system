<script lang="ts">
  import { untrack } from 'svelte';
  import { ActivityGraph } from '@/components/ui/activity-graph';
  import {
    WIDE_END,
    WIDE_START,
    activityGraphLabelsFor,
  } from '@/components/ui/activity-graph/activity-graph.fixtures';
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
  import {
    resolveActivityCalendar,
    type ActivityCalendarCell,
    type ActivityCalendarDrawing,
  } from '@shared/primitives/activity-calendar';
  import {
    ACTIVITY_DAYS,
    ACTIVITY_DAYS_EMPTY,
    ACTIVITY_END,
    ACTIVITY_MONTH_END,
    ACTIVITY_MONTH_START,
    ACTIVITY_START,
    ACTIVITY_THRESHOLDS,
  } from '@shared/primitives/activity-graph-examples';
  import uiTranslations from '@/i18n/ui.json';
  import activityGraphTranslations from '@shared/content/activity-graph/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  // SEM OVERRIDE NENHUM. O conteúdo compartilhado descreve nomes e tipos que
  // já são os desta stack — `days`, `start`, `end`, `thresholds`, `weekStart`,
  // `status`, `labels`, e nenhum deles carrega tipo de framework. A
  // divergência de API desta peça é a FORMA da chamada (componente, não
  // fábrica), e forma não se corrige por override: ela se registra, e está
  // registrada no docblock do componente (§4.1 da guideline 17).
  const { tStore } = useTranslation(activityGraphTranslations);

  const labels = $derived(activityGraphLabelsFor($locale));

  /** As duas contas dos contraexemplos, para as demonstrações à mão do Do & Don't. */
  const MONTH_DRAWING = resolveActivityCalendar(ACTIVITY_DAYS, {
    start: ACTIVITY_MONTH_START,
    end: ACTIVITY_MONTH_END,
    thresholds: ACTIVITY_THRESHOLDS,
  });
  const WIDE_DRAWING = resolveActivityCalendar(ACTIVITY_DAYS, {
    start: WIDE_START,
    end: WIDE_END,
    thresholds: ACTIVITY_THRESHOLDS,
  });

  /** A data por extenso, montada a partir do molde do idioma — cópia do componente. */
  function formatDate(cell: ActivityCalendarCell): string {
    return labels.dateFormat
      .replace('{day}', String(cell.day))
      .replace('{month}', labels.monthsLong[cell.month] ?? '')
      .replace('{year}', String(cell.year));
  }

  /** A frase que só quem ouve recebe: a contagem, o dia e a palavra do nível. */
  function readingOf(cell: ActivityCalendarCell): string {
    const date = formatDate(cell);
    if (cell.count === 0) return labels.none.replace('{date}', date);
    const template = cell.count === 1 ? labels.one : labels.many;
    return template
      .replace('{count}', String(cell.count))
      .replace('{date}', date)
      .replace('{level}', labels.levels[cell.level] ?? '');
  }

  // As chaves de `accessibility.screenReader` variam por componente, então só
  // os valores chegam ao container — o `t()` exige nome de chave e não
  // serviria. O `title` fica de fora: ele é o cabeçalho da lista, não um item
  // dela.
  const screenReaderItems = $derived(
    Object.entries(
      (activityGraphTranslations as unknown as Record<
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
      componentSlug: 'activity-graph',
    });
    track('docs_page_view', {
      component_name: 'activity-graph',
      locale: l,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

  // ─── Active section ──────────────────────────────────────────────────────────
  //
  // Não há seção de variantes: esta peça não tem eixo de forma. A estrutura é
  // sempre a mesma — total, camada que rola, calendário e legenda — e o que
  // muda é o estado da execução, que é a seção de estados.

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
      component_name: 'activity-graph',
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

  const interfaceCode = `interface ActivityGraphProps {
  days: readonly ActivityDay[];   // dia fora da janela sai; dia repetido soma
  start: string;                  // ano-mês-dia
  end: string;
  thresholds: readonly number[];  // obrigatório — ver o docblock do módulo
  weekStart?: number;             // zero é domingo
  status?: RunStatus;
  labels: ActivityGraphLabels;
  class?: string;
}

export interface ActivityGraphLabels {
  region: string;                     // o nome da camada que rola — obrigatório
  total: string;                      // molde com \`{count}\`, \`{start}\` e \`{end}\`
  dateFormat: string;                 // molde com \`{day}\`, \`{month}\` e \`{year}\`
  monthsShort: readonly string[];     // 12, para os rótulos de coluna
  monthsLong: readonly string[];      // 12, para a frase de cada casa
  weekdaysShort: readonly string[];   // 7, começando no domingo
  none: string;                       // a frase do dia sem atividade
  one: string;                        // molde com \`{count}\`, \`{date}\` e \`{level}\`
  many: string;
  levels: readonly string[];          // uma palavra a mais que os degraus
  legendLess: string;
  legendMore: string;
}

// O dia vem de \`@shared/primitives/chat-protocol\`, e é o único tipo daquele
// arquivo desta família que NÃO carrega geometria: a casa em que ele cai não
// é declarada, ela se DEDUZ da data e da janela.
interface ActivityDay {
  date: string;   // ano-mês-dia, um dia civil sem hora e sem fuso
  count: number;  // dias repetidos SOMAM
}

// A JANELA E A ESCALA SÃO DADO, e são o que separa esta peça de um mapa de
// calor de janela fixa: nada aqui olha o relógio, e a escala não se deriva do
// maior valor — derivada, a mesma contagem pintaria diferente em duas
// grades.

type RunStatus = 'idle' | 'running' | 'stopped' | 'complete' | 'failed';`;
</script>

<!--
  A GRADE ESCRITA À MÃO, e ela existe só para os contraexemplos.

  `omit` diz o que falta: `reading` tira a frase que só quem ouve recebe;
  `name` tira o papel e o nome da camada que rola. São os dois defeitos que o
  par mostra, e nenhum dos dois tem argumento que o produza — a peça sempre
  escreve os dois.
-->
{#snippet handActivityGraph(drawing: ActivityCalendarDrawing, omit: 'reading' | 'name')}
  <div
    class="nds-activity-graph"
    data-slot="activity-graph"
    style="--activity-graph-levels: {drawing.levels}"
    aria-busy="true"
  >
    <p class="nds-activity-graph-total" data-slot="activity-graph-total">
      {labels.total
        .replace('{count}', String(drawing.total))
        .replace('{start}', formatDate(drawing.from))
        .replace('{end}', formatDate(drawing.to))}
    </p>

    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      class="nds-activity-graph-viewport"
      data-slot="activity-graph-viewport"
      tabindex="0"
      role={omit === 'name' ? undefined : 'group'}
      aria-label={omit === 'name' ? undefined : labels.region}
    >
      <div
        class="nds-activity-graph-calendar"
        data-slot="activity-graph-calendar"
        style="--activity-graph-weeks: {drawing.weeks}"
      >
        <ol class="nds-activity-graph-months" data-slot="activity-graph-months" aria-hidden="true">
          {#each drawing.months as month, index (index)}
            <li
              class="nds-activity-graph-month"
              data-slot="activity-graph-month"
              style="--activity-graph-month-column: {month.column}; --activity-graph-month-span: {month.span}"
            >{labels.monthsShort[month.month] ?? ''}</li>
          {/each}
        </ol>

        <ol class="nds-activity-graph-weekdays" data-slot="activity-graph-weekdays" aria-hidden="true">
          {#each drawing.weekdays as weekday, index (index)}
            <li
              class="nds-activity-graph-weekday"
              data-slot="activity-graph-weekday"
              style="--activity-graph-weekday-row: {weekday.row}"
            >{labels.weekdaysShort[weekday.weekday] ?? ''}</li>
          {/each}
        </ol>

        <ol class="nds-activity-graph-days" data-slot="activity-graph-days">
          {#each drawing.cells as cell, index (index)}
            <li
              class="nds-activity-graph-day"
              data-slot="activity-graph-day"
              data-level={cell.level}
              data-date={cell.date}
              style="--activity-graph-day-column: {cell.column}; --activity-graph-day-row: {cell.row}; --activity-graph-day-level: {cell.level}"
            >
              {#if omit !== 'reading'}
                <span class="nds-sr-only" data-slot="activity-graph-day-reading">{readingOf(cell)}</span>
              {/if}
            </li>
          {/each}
        </ol>
      </div>
    </div>

    <div class="nds-activity-graph-legend" data-slot="activity-graph-legend">
      <span class="nds-activity-graph-legend-end" data-slot="activity-graph-legend-end">{labels.legendLess}</span>
      <ol class="nds-activity-graph-scale" data-slot="activity-graph-scale">
        {#each Array.from({ length: drawing.levels + 1 }) as _, level (level)}
          <li
            class="nds-activity-graph-swatch"
            data-slot="activity-graph-swatch"
            data-level={level}
            style="--activity-graph-day-level: {level}"
          >
            <span class="nds-sr-only" data-slot="activity-graph-swatch-reading">{labels.levels[level] ?? ''}</span>
          </li>
        {/each}
      </ol>
      <span class="nds-activity-graph-legend-end" data-slot="activity-graph-legend-end">{labels.legendMore}</span>
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
  <DocsDemonstration
    title={$tStore('demonstration.title')}
    componentSlug="activity-graph"
  >
    <div class="nds-stack nds-w-full" data-spacing="lg">
      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.quarter')}
        </p>
        <ActivityGraph
          days={ACTIVITY_DAYS}
          start={ACTIVITY_START}
          end={ACTIVITY_END}
          thresholds={ACTIVITY_THRESHOLDS}
          status="complete"
          {labels}
        />
      </div>

      <Separator />

      <!-- GRADE VAZIA É GRADE: um período sem atividade nenhuma continua desenhado. -->
      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.empty')}
        </p>
        <ActivityGraph
          days={ACTIVITY_DAYS_EMPTY}
          start={ACTIVITY_START}
          end={ACTIVITY_END}
          thresholds={ACTIVITY_THRESHOLDS}
          status="complete"
          {labels}
        />
      </div>

      <Separator />

      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.month')}
        </p>
        <ActivityGraph
          days={ACTIVITY_DAYS}
          start={ACTIVITY_MONTH_START}
          end={ACTIVITY_MONTH_END}
          thresholds={ACTIVITY_THRESHOLDS}
          status="complete"
          {labels}
        />
      </div>

      <Separator />

      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.wide')}
        </p>
        <div class="nds-max-w-md">
          <ActivityGraph
            days={ACTIVITY_DAYS}
            start={WIDE_START}
            end={WIDE_END}
            thresholds={ACTIVITY_THRESHOLDS}
            status="complete"
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
      items: ['region', 'total', 'day', 'level'].map(k => ({
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
    O primeiro par é sobre a FRASE DE CADA CASA: sem ela, sobra a tinta — e
    tinta não se lê. A grade deixa de se reconstruir de ouvido.
  -->
  {#snippet doPair1()}
    <div class="nds-stack nds-w-full" data-spacing="lg">
      <ActivityGraph
        days={ACTIVITY_DAYS}
        start={ACTIVITY_MONTH_START}
        end={ACTIVITY_MONTH_END}
        thresholds={ACTIVITY_THRESHOLDS}
        status="complete"
        {labels}
      />
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <div class="nds-stack nds-w-full" data-spacing="lg">
      {#if MONTH_DRAWING}
        {@render handActivityGraph(MONTH_DRAWING, 'reading')}
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
        <ActivityGraph
          days={ACTIVITY_DAYS}
          start={WIDE_START}
          end={WIDE_END}
          thresholds={ACTIVITY_THRESHOLDS}
          status="complete"
          {labels}
        />
      </div>
    </div>
  {/snippet}
  {#snippet dontPair2()}
    <div class="nds-stack nds-w-full" data-spacing="lg">
      <div class="nds-max-w-md">
        {#if WIDE_DRAWING}
          {@render handActivityGraph(WIDE_DRAWING, 'name')}
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
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('states.cols.state'),
      trigger: $tStore('states.cols.trigger'),
      behavior: $tStore('states.cols.behavior'),
    }}
    items={['empty', 'low', 'high', 'busy'].map(k => ({
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
        title: 'ActivityGraph',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: ['days', 'start', 'end', 'thresholds', 'weekStart', 'status', 'labels'].map(k => ({
          name: $tStore(`props.table.${k}.name`),
          type: $tStore(`props.table.${k}.type`),
          defaultValue: $tStore(`props.table.${k}.default`),
          required: $tStore(`props.table.${k}.required`),
          description: toPlainText($tStore(`props.table.${k}.description`)),
        })),
      },
      {
        title: 'ActivityGraphLabels',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          'labelsRegion', 'labelsTotal', 'labelsDateFormat',
          'labelsMonthsShort', 'labelsMonthsLong', 'labelsWeekdaysShort',
          'labelsNone', 'labelsOne', 'labelsMany',
          'labelsLevels', 'labelsLegendLess', 'labelsLegendMore',
        ].map(k => ({
          name: $tStore(`props.table.${k}.name`),
          type: $tStore(`props.table.${k}.type`),
          defaultValue: $tStore(`props.table.${k}.default`),
          required: $tStore(`props.table.${k}.required`),
          description: toPlainText($tStore(`props.table.${k}.description`)),
        })),
      },
      {
        title: 'ActivityDay',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: ['dayDate', 'dayCount'].map(k => ({
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
      'textLabel', 'spacing3', 'spacing05', 'spacing2', 'mutedForeground',
      'lineHeightNormal', 'spacing3Viewport', 'border', 'radius', 'muted',
      'ring', 'spacing1', 'radiusXs', 'background', 'primary',
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
      { name: $tStore('related.items.chart.name'),          description: toPlainText($tStore('related.items.chart.description')),          path: '?path=/docs/primitives-display-chart--docs'                 },
      { name: $tStore('related.items.calendar.name'),       description: toPlainText($tStore('related.items.calendar.description')),       path: '?path=/docs/primitives-form-calendar--docs'                 },
      { name: $tStore('related.items.traceWaterfall.name'), description: toPlainText($tStore('related.items.traceWaterfall.description')), path: '?path=/docs/primitives-conversational-tracewaterfall--docs' },
      { name: $tStore('related.items.jobProgress.name'),    description: toPlainText($tStore('related.items.jobProgress.description')),    path: '?path=/docs/primitives-conversational-jobprogress--docs'    },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    componentSlug="activity-graph"
    items={[1, 2, 3, 4, 5, 6, 7, 8].map(i => ({ title: '', content: $tStore(`notes.item${i}`) }))}
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
