<script lang="ts">
  import { untrack } from 'svelte';
  import { JobProgress, type JobProgressLabels } from '@/components/ui/job-progress';
  import {
    jobLabelFor,
    jobProgressLabelsFor,
    JOB_COUNT,
    JOB_COUNT_WITHOUT_TOTAL,
  } from '@/components/ui/job-progress/job-progress.fixtures';
  import { Progress } from '@/components/ui/progress';
  import { Button } from '@/components/ui/button';
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
  import jobTranslations from '@shared/content/job-progress/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  // Não há linha sobrescrita aqui: as cinco props têm o mesmo nome nesta stack e
  // no conteúdo compartilhado — o aviso de que alguém pediu a ação continua
  // chegando por `onAction` —, e a tabela dos rótulos descreve o vocabulário de
  // tela, que não muda conforme quem renderiza.
  const { tStore } = useTranslation(jobTranslations);

  const labels = $derived(jobProgressLabelsFor($locale));
  const label = $derived(jobLabelFor($locale));

  /**
   * O contraexemplo do segundo par: a palavra de cada estado apagada.
   *
   * A diferença entre o que corre e o que foi interrompido passa a existir só na
   * barra — e barra parada não diz qual dos dois é (WCAG 1.4.1). O texto sai dos
   * próprios rótulos traduzidos, esvaziados, e não de uma palavra cravada aqui.
   */
  const WORDLESS_STATUS: JobProgressLabels = $derived({
    ...labels,
    status: RUN_STATUSES.reduce((acc, status) => {
      acc[status] = '';
      return acc;
    }, {} as Record<RunStatus, string>),
  });

  /**
   * A conta sem total, já escrita — só o contraexemplo precisa dela.
   *
   * A peça a monta sozinha a partir do molde; aqui ela é remontada porque a
   * marcação errada é escrita à mão, e o assunto do par é a BARRA, não a conta.
   */
  const countWithoutTotalText = $derived(
    labels.countWithoutTotal.replace('{done}', JOB_COUNT_WITHOUT_TOTAL.done.toLocaleString()),
  );

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria. O
  // `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = $derived(
    Object.entries(
      (jobTranslations as unknown as Record<
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
      componentSlug: 'job-progress',
    });
    track('docs_page_view', {
      component_name: 'job-progress',
      locale: l,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

  // ─── Active section ──────────────────────────────────────────────────────────
  //
  // Não há seção de variantes: esta peça não tem eixo de forma. A grade é sempre
  // a mesma, e o que muda é o que a barra pode dizer — que é a seção de estados.

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
      component_name: 'job-progress',
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

  const interfaceCode = `export interface JobProgressLabels {
  status: Record<RunStatus, string>;                  // a palavra de cada estado
  count: string;                                      // molde com \`{done}\` e \`{total}\`
  countWithoutTotal: string;                          // molde com \`{done}\` só
  action?: Partial<Record<RunStatus, string>>;        // o rótulo da ação onde ela existe
}

// A conta e o que a barra mostra vêm de \`@shared/primitives/chat-protocol\`:
interface JobCount {
  done: number;
  total?: number;   // ausente é "não se sabe", nunca zero
}

// É ela que decide se a barra tem uma fração para mostrar. Mora no vocabulário,
// e não na tela, porque a resposta tem de ser a mesma nas cinco stacks — e a que
// discordaria é a do trabalho parado sem total.
declare function jobProgressValue(status: RunStatus, count?: JobCount): number | null;`;
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
    A legenda diz QUAL caso está desenhado — sem ela, quatro peças empilhadas
    viram uma só, e o assunto da demonstração é justamente a diferença entre
    elas.

    A MESMA conta vai para as fotos, de propósito: quem decide o que a barra
    mostra em cada estado é o vocabulário compartilhado, e não esta página.
  -->
  <DocsDemonstration
    title={$tStore('demonstration.title')}
    componentSlug="job-progress"
  >
    <div class="nds-stack nds-w-full" data-spacing="lg">
      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.running')}
        </p>
        <JobProgress {label} status="running" count={JOB_COUNT} {labels} />
      </div>

      <Separator />

      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.unknownTotal')}
        </p>
        <JobProgress
          {label}
          status="running"
          count={JOB_COUNT_WITHOUT_TOTAL}
          {labels}
        />
      </div>

      <Separator />

      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.stopped')}
        </p>
        <JobProgress {label} status="stopped" count={JOB_COUNT} {labels} />
      </div>

      <Separator />

      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.complete')}
        </p>
        <JobProgress {label} status="complete" count={JOB_COUNT} {labels} />
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
      items: ['jobLabel', 'count', 'countWithoutTotal', 'status', 'action'].map(k => ({
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
      <JobProgress
        {label}
        status="running"
        count={JOB_COUNT_WITHOUT_TOTAL}
        {labels}
      />
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <!--
      O contraexemplo é escrito À MÃO, e tem de ser: a peça trata total zero como
      ausência, então não há argumento que produza o erro. A barra determinada em
      zero é posta no lugar da indeterminada, para que se veja a trilha vazia
      dizendo "acabou de começar" para algo que já andou muito.
    -->
    <div class="nds-stack nds-w-full" data-spacing="lg">
      <div
        class="nds-job-progress"
        data-slot="job-progress"
        data-status="running"
        aria-busy="true"
      >
        <span class="nds-job-progress-label" data-slot="job-progress-label">{label}</span>
        <span
          class="nds-job-progress-count"
          data-slot="job-progress-count"
          aria-hidden="true">{countWithoutTotalText}</span
        >
        <Progress value={0} class="nds-job-progress-bar" aria-label={label} />
        <span class="nds-job-progress-status" data-slot="job-progress-status"
          >{labels.status.running}</span
        >
        <Button
          class="nds-job-progress-action"
          data-slot="job-progress-action"
          variant="outline"
          size="sm">{labels.action?.running}</Button
        >
      </div>
    </div>
  {/snippet}
  <!--
    O segundo par é o MESMO par de estados, e as duas barras param no mesmo
    lugar: o que muda é se a palavra chega a quem não distingue uma barra parada
    de outra.
  -->
  {#snippet doPair2()}
    <div class="nds-stack nds-w-full" data-spacing="lg">
      <JobProgress {label} status="running" count={JOB_COUNT} {labels} />
      <JobProgress {label} status="stopped" count={JOB_COUNT} {labels} />
    </div>
  {/snippet}
  {#snippet dontPair2()}
    <div class="nds-stack nds-w-full" data-spacing="lg">
      <JobProgress {label} status="running" count={JOB_COUNT} labels={WORDLESS_STATUS} />
      <JobProgress {label} status="stopped" count={JOB_COUNT} labels={WORDLESS_STATUS} />
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
        title: 'JobProgress',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: ['label', 'status', 'count', 'labels', 'onAction'].map(k => ({
          name: $tStore(`props.table.${k}.name`),
          type: $tStore(`props.table.${k}.type`),
          defaultValue: $tStore(`props.table.${k}.default`),
          required: $tStore(`props.table.${k}.required`),
          description: toPlainText($tStore(`props.table.${k}.description`)),
        })),
      },
      {
        title: 'JobProgressLabels',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: ['labelsStatus', 'labelsCount', 'labelsCountWithoutTotal', 'labelsAction'].map(k => ({
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
      'textLabel', 'mutedForeground', 'spacing1', 'spacing2',
      'foreground', 'fontWeightMedium', 'spacing6',
      'primary', 'success', 'destructive',
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
    items={[1, 2, 3, 4, 5, 6, 7].map(i => $tStore(`accessibility.items.item${i}`))}
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
      { name: $tStore('related.items.agentStatus.name'),     description: toPlainText($tStore('related.items.agentStatus.description')),     path: '?path=/docs/primitives-conversational-agentstatus--docs'     },
      { name: $tStore('related.items.agentPlan.name'),       description: toPlainText($tStore('related.items.agentPlan.description')),       path: '?path=/docs/primitives-conversational-agentplan--docs'       },
      { name: $tStore('related.items.progress.name'),        description: toPlainText($tStore('related.items.progress.description')),        path: '?path=/docs/primitives-feedback-progress--docs'              },
      { name: $tStore('related.items.connectionState.name'), description: toPlainText($tStore('related.items.connectionState.description')), path: '?path=/docs/primitives-conversational-connectionstate--docs' },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    componentSlug="job-progress"
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
      items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => ({
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
      items: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => ({
        story: toPlainText($tStore(`testes.visual.item${i}.story`)),
        priority: localPriority($tStore(`testes.visual.item${i}.priority`), $tNavStore),
      })),
    }}
  />
</DocsPageLayout>
