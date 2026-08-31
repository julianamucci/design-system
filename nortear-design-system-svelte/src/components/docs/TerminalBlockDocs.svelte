<script lang="ts">
  import { untrack } from 'svelte';
  import { TerminalBlock, type TerminalBlockLabels } from '@/components/ui/terminal-block';
  import {
    exitCodeFor,
    linesFor,
    terminalBlockLabelsFor,
  } from '@/components/ui/terminal-block/terminal-block.fixtures';
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
  import { TERMINAL_COMMAND } from '@shared/primitives/terminal-block-examples';
  import uiTranslations from '@/i18n/ui.json';
  import terminalTranslations from '@shared/content/terminal-block/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  // Não há linha sobrescrita aqui: as cinco props têm o mesmo nome nesta stack e
  // no conteúdo compartilhado, e a tabela dos rótulos descreve o vocabulário de
  // tela, que não muda conforme quem renderiza. A divergência de API é de FORMA
  // — lá uma fábrica com objeto de opções, aqui um componente com props —, e
  // forma não se corrige à força: registra-se (§4.1 da guideline 17).
  const { tStore } = useTranslation(terminalTranslations);

  const labels = $derived(terminalBlockLabelsFor($locale));

  /**
   * O id do comando do CONTRAEXEMPLO, por instância.
   *
   * A marcação errada é escrita à mão, então o `aria-labelledby` dela precisa de
   * um id próprio — e derivado da instância, e não cravado: `aria-labelledby`
   * resolve para o PRIMEIRO id do documento, e um id fixo colidiria com o de
   * qualquer outra cópia desta página na mesma tela.
   */
  const uid = $props.id();
  const wrongCommandId = `${uid}-do-dont-command`;

  /**
   * A saída e o código de saída do contraexemplo, já escritos.
   *
   * A peça os monta sozinha; aqui eles são remontados porque a marcação errada é
   * escrita à mão — o assunto do par é o MODO DE QUEBRA da caixa, e não há
   * argumento que o produza: a peça preserva o espaçamento por construção.
   */
  const wrongOutputText = $derived(linesFor('complete').join('\n'));
  const wrongExitText = $derived(labels.exitCode.replace('{code}', '0'));

  /**
   * O contraexemplo do segundo par: a palavra de cada estado apagada.
   *
   * A diferença entre o que terminou bem e o que quebrou passa a existir só na
   * cor do ponto — e cor sozinha não descreve estado (WCAG 1.4.1). O texto sai
   * dos próprios rótulos traduzidos, esvaziados, e não de uma palavra cravada
   * aqui.
   */
  const WORDLESS_STATUS: TerminalBlockLabels = $derived({
    ...labels,
    status: RUN_STATUSES.reduce((acc, status) => {
      acc[status] = '';
      return acc;
    }, {} as Record<RunStatus, string>),
  });

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria. O
  // `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = $derived(
    Object.entries(
      (terminalTranslations as unknown as Record<
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
      componentSlug: 'terminal-block',
    });
    track('docs_page_view', {
      component_name: 'terminal-block',
      locale: l,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

  // ─── Active section ──────────────────────────────────────────────────────────
  //
  // Não há seção de variantes: esta peça não tem eixo de forma. A estrutura é
  // sempre a mesma — o que rodou, o que voltou, como terminou — e o que muda é o
  // que cada parte tem para dizer, que é a seção de estados.

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
      component_name: 'terminal-block',
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

  const interfaceCode = `export interface TerminalBlockLabels {
  status: Record<RunStatus, string>;   // a palavra de cada estado
  exitCode: string;                    // molde com \`{code}\`
}

// O estado vem de \`@shared/primitives/chat-protocol\`, e serve inteiro: um
// comando fica na fila, corre, é interrompido, termina ou quebra. O
// interrompido daqui é o Ctrl-C — escolha de pessoa, e não falha de máquina.
type RunStatus = 'idle' | 'running' | 'stopped' | 'complete' | 'failed';

// É ela que decide se já existe código de saída para mostrar. Mora no
// vocabulário, e não na tela, porque a resposta tem de ser a mesma nas cinco
// stacks — e a que discordaria é a do comando interrompido.
declare function isRunFinished(status: RunStatus): boolean;`;
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
    A legenda diz QUAL caso está desenhado — sem ela, quatro blocos empilhados
    viram um só, e o assunto da demonstração é justamente a diferença entre eles.

    A saída de exemplo ACOMPANHA o estado, e é o vocabulário compartilhado que
    decide o resto: se há cursor, se a peça se declara ocupada e se o código de
    saída já existe.
  -->
  <DocsDemonstration
    title={$tStore('demonstration.title')}
    componentSlug="terminal-block"
  >
    <div class="nds-stack nds-w-full" data-spacing="lg">
      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.running')}
        </p>
        <TerminalBlock
          command={TERMINAL_COMMAND}
          lines={linesFor('running')}
          status="running"
          exitCode={exitCodeFor('running')}
          {labels}
        />
      </div>

      <Separator />

      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.complete')}
        </p>
        <TerminalBlock
          command={TERMINAL_COMMAND}
          lines={linesFor('complete')}
          status="complete"
          exitCode={exitCodeFor('complete')}
          {labels}
        />
      </div>

      <Separator />

      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.failed')}
        </p>
        <TerminalBlock
          command={TERMINAL_COMMAND}
          lines={linesFor('failed')}
          status="failed"
          exitCode={exitCodeFor('failed')}
          {labels}
        />
      </div>

      <Separator />

      <!--
        O comando que terminou sem escrever nada: sem linha nenhuma não há caixa
        de saída, e caixa vazia com parada de tabulação dentro seria dar foco a
        lugar nenhum.
      -->
      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.withoutOutput')}
        </p>
        <TerminalBlock
          command={TERMINAL_COMMAND}
          status="complete"
          exitCode={exitCodeFor('complete')}
          {labels}
        />
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
      items: ['command', 'output', 'status', 'exitCode'].map(k => ({
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
      <TerminalBlock
        command={TERMINAL_COMMAND}
        lines={linesFor('complete')}
        status="complete"
        exitCode={exitCodeFor('complete')}
        {labels}
      />
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <!--
      O contraexemplo é escrito À MÃO, e tem de ser: a peça preserva o
      espaçamento por construção, então não há argumento que produza o erro. Aqui
      a caixa passa a quebrar a linha, e a tabela que alinhava os números vira um
      parágrafo.
    -->
    <div class="nds-stack nds-w-full" data-spacing="lg">
      <div class="nds-terminal-block" data-slot="terminal-block" data-status="complete">
        <p class="nds-terminal-block-command nds-font-mono" data-slot="terminal-block-command">
          <span
            class="nds-terminal-block-sigil"
            data-slot="terminal-block-sigil"
            aria-hidden="true">$</span
          >
          <code
            id={wrongCommandId}
            class="nds-terminal-block-command-text"
            data-slot="terminal-block-command-text"
            lang="en">{TERMINAL_COMMAND}</code
          >
        </p>
        <!--
          Mecânico, e não valor de desenho: o que se está mostrando é o efeito de
          trocar o modo de quebra, e ele não tem token.
        -->
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <pre
          class="nds-terminal-block-output nds-font-mono"
          data-slot="terminal-block-output"
          lang="en"
          tabindex="0"
          role="group"
          aria-labelledby={wrongCommandId}
          style="white-space: pre-wrap; overflow-x: hidden">{wrongOutputText}</pre>
        <p class="nds-terminal-block-result" data-slot="terminal-block-result">
          <span
            class="nds-terminal-block-dot"
            data-slot="terminal-block-dot"
            aria-hidden="true"
          ></span>
          <span class="nds-terminal-block-status" data-slot="terminal-block-status"
            >{labels.status.complete}</span
          >
          <span class="nds-terminal-block-exit" data-slot="terminal-block-exit"
            >{wrongExitText}</span
          >
        </p>
      </div>
    </div>
  {/snippet}
  <!--
    O segundo par é o MESMO par de estados, e os dois pontos são o que se vê: o
    que muda é se a palavra chega a quem não distingue verde de vermelho.
  -->
  {#snippet doPair2()}
    <div class="nds-stack nds-w-full" data-spacing="lg">
      <TerminalBlock
        command={TERMINAL_COMMAND}
        lines={linesFor('complete')}
        status="complete"
        exitCode={exitCodeFor('complete')}
        {labels}
      />
      <TerminalBlock
        command={TERMINAL_COMMAND}
        lines={linesFor('failed')}
        status="failed"
        exitCode={exitCodeFor('failed')}
        {labels}
      />
    </div>
  {/snippet}
  {#snippet dontPair2()}
    <div class="nds-stack nds-w-full" data-spacing="lg">
      <TerminalBlock
        command={TERMINAL_COMMAND}
        lines={linesFor('complete')}
        status="complete"
        exitCode={exitCodeFor('complete')}
        labels={WORDLESS_STATUS}
      />
      <TerminalBlock
        command={TERMINAL_COMMAND}
        lines={linesFor('failed')}
        status="failed"
        exitCode={exitCodeFor('failed')}
        labels={WORDLESS_STATUS}
      />
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
        title: 'TerminalBlock',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: ['command', 'lines', 'status', 'exitCode', 'labels'].map(k => ({
          name: $tStore(`props.table.${k}.name`),
          type: $tStore(`props.table.${k}.type`),
          defaultValue: $tStore(`props.table.${k}.default`),
          required: $tStore(`props.table.${k}.required`),
          description: toPlainText($tStore(`props.table.${k}.description`)),
        })),
      },
      {
        title: 'TerminalBlockLabels',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: ['labelsStatus', 'labelsExitCode'].map(k => ({
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
      'textLabel', 'spacing2', 'spacing3', 'muted', 'border', 'radius', 'radiusSm',
      'mutedForeground', 'foreground', 'fontWeightMedium', 'ring', 'durationStately',
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
    items={[1, 2, 3, 4, 5, 6, 7, 8].map(i => $tStore(`accessibility.items.item${i}`))}
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
      { name: $tStore('related.items.codeBlock.name'),   description: toPlainText($tStore('related.items.codeBlock.description')),   path: '?path=/docs/primitives-display-codeblock--docs'           },
      { name: $tStore('related.items.agentStatus.name'), description: toPlainText($tStore('related.items.agentStatus.description')), path: '?path=/docs/primitives-conversational-agentstatus--docs' },
      { name: $tStore('related.items.toolGroup.name'),   description: toPlainText($tStore('related.items.toolGroup.description')),   path: '?path=/docs/primitives-conversational-toolgroup--docs'   },
      { name: $tStore('related.items.jobProgress.name'), description: toPlainText($tStore('related.items.jobProgress.description')), path: '?path=/docs/primitives-conversational-jobprogress--docs' },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    componentSlug="terminal-block"
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
      items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => ({
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
      items: [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({
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
      items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => ({
        story: toPlainText($tStore(`testes.visual.item${i}.story`)),
        priority: localPriority($tStore(`testes.visual.item${i}.priority`), $tNavStore),
      })),
    }}
  />
</DocsPageLayout>
