<script lang="ts">
  import { untrack } from 'svelte';
  import { ComputerUse } from '@/components/ui/computer-use';
  import ComputerUseDemoScreen from '@/components/ui/computer-use/ComputerUseDemoScreen.svelte';
  import { computerUseLabelsFor } from '@/components/ui/computer-use/computer-use.fixtures';
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
  import { RUN_STATUSES } from '@shared/primitives/chat-protocol';
  import {
    COMPUTER_STEPS_LOGIN,
    COMPUTER_URL,
  } from '@shared/primitives/computer-use-examples';
  import uiTranslations from '@/i18n/ui.json';
  import computerUseTranslations from '@shared/content/computer-use/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  // A ÚNICA linha sobrescrita é o TIPO de `screen`, e por um motivo de API: o
  // conteúdo compartilhado descreve o tipo na API do Vanilla, onde a tela chega
  // como elemento já montado. Aqui ela chega como trecho de marcação. O NOME da
  // prop é o mesmo nas duas, e a DESCRIÇÃO não muda — ela fala do contrato, não
  // de quem renderiza: a peça nunca cria a tela, e não escreve nem apaga o texto
  // alternativo dela. A divergência é de FORMA, e forma não se corrige à força:
  // registra-se (§4.1 da guideline 17).
  const { tStore } = useTranslation(computerUseTranslations, {
    '*': { 'props.table.screen.type': 'Snippet' },
  });

  const labels = $derived(computerUseLabelsFor($locale));

  /** O último passo da sessão de demonstração. */
  const LAST_INDEX = COMPUTER_STEPS_LOGIN.length - 1;

  /**
   * O rastro CERTO do primeiro par: as três últimas marcas até o passo em curso.
   *
   * A peça o monta sozinha; aqui ele é remontado porque a marcação errada é
   * escrita à mão — o assunto do par é a AUSÊNCIA da legenda, e não há argumento
   * que a produza: a peça sempre desenha a legenda quando há passo.
   */
  const SHORT_TRAIL = COMPUTER_STEPS_LOGIN.slice(1, 4);

  /** A legenda do contraexemplo do segundo par, montada à mão. */
  const lastPositionText = $derived(
    labels.position
      .replace('{index}', String(COMPUTER_STEPS_LOGIN.length))
      .replace('{total}', String(COMPUTER_STEPS_LOGIN.length)),
  );

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria. O
  // `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = $derived(
    Object.entries(
      (computerUseTranslations as unknown as Record<
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
      componentSlug: 'computer-use',
    });
    track('docs_page_view', {
      component_name: 'computer-use',
      locale: l,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

  // ─── Active section ──────────────────────────────────────────────────────────
  //
  // Não há seção de variantes: esta peça não tem eixo de forma. A estrutura é
  // sempre a mesma — endereço, quadro e legenda — e o que muda é quanto cada
  // parte tem para dizer, que é a seção de estados.

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
      component_name: 'computer-use',
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

  const interfaceCode = `export interface ComputerUseLabels {
  address: string;    // a palavra que apresenta o endereço, só para quem ouve
  position: string;   // molde com \`{index}\` e \`{total}\`
}

// O passo vem de \`@shared/primitives/chat-protocol\`, e é o primeiro tipo
// daquele arquivo que carrega GEOMETRIA. \`action\` e \`target\` rimam com o nome
// e o detalhe de uma chamada de ferramenta; \`x\` e \`y\` não têm par em nada que
// o vocabulário já descreva, e é essa dupla que faz a peça existir.
interface ComputerStep {
  id?: string;
  action: string;
  target: string;
  x: number;   // porcentagem da largura do quadro
  y: number;   // porcentagem da altura do quadro
}

// O ESTADO É DA SESSÃO, e não do passo. Um estado por passo faria a peça pintar
// cores sobre uma tela de terceiro, que é justamente a codificação que a legenda
// existe para não precisar.
type RunStatus = 'idle' | 'running' | 'stopped' | 'complete' | 'failed';`;
</script>

<!--
  A TELA É NOVA A CADA MOLDURA, e tem de ser: o trecho é renderizado uma vez por
  peça, e cada renderização monta a sua. Um elemento só, passado a duas peças,
  seria movido da primeira para a segunda — e a primeira moldura ficaria vazia.
-->
{#snippet screen()}
  <ComputerUseDemoScreen />
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
    A legenda diz QUAL caso está desenhado — sem ela, quatro molduras empilhadas
    viram uma só, e o assunto da demonstração é justamente a diferença entre elas.
  -->
  <DocsDemonstration
    title={$tStore('demonstration.title')}
    componentSlug="computer-use"
  >
    <div class="nds-stack nds-w-full" data-spacing="lg">
      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.running')}
        </p>
        <ComputerUse
          url={COMPUTER_URL}
          {screen}
          steps={COMPUTER_STEPS_LOGIN}
          activeIndex={3}
          status="running"
          {labels}
        />
      </div>

      <Separator />

      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.finished')}
        </p>
        <ComputerUse
          url={COMPUTER_URL}
          {screen}
          steps={COMPUTER_STEPS_LOGIN}
          activeIndex={LAST_INDEX}
          status="complete"
          {labels}
        />
      </div>

      <Separator />

      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.firstStep')}
        </p>
        <ComputerUse
          url={COMPUTER_URL}
          {screen}
          steps={COMPUTER_STEPS_LOGIN}
          activeIndex={0}
          status="running"
          {labels}
        />
      </div>

      <Separator />

      <!--
        A moldura antes do primeiro toque: sem passo nenhum não há rastro nem
        legenda, e uma legenda vazia daria à figura um nome em branco.
      -->
      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.withoutSteps')}
        </p>
        <ComputerUse url={COMPUTER_URL} {screen} status="idle" {labels} />
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
      items: ['address', 'action', 'target', 'position'].map(k => ({
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
      <ComputerUse
        url={COMPUTER_URL}
        {screen}
        steps={COMPUTER_STEPS_LOGIN}
        activeIndex={3}
        status="running"
        {labels}
      />
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <!--
      O contraexemplo é escrito À MÃO, e tem de ser: a peça sempre desenha a
      legenda quando há passo, então não há argumento que produza o erro. Aqui a
      legenda não existe, e sobra a marca sobre a imagem — que é exatamente o
      que não chega a quem não vê.
    -->
    <div class="nds-stack nds-w-full" data-spacing="lg">
      <figure
        class="nds-computer-use"
        data-slot="computer-use"
        data-status="running"
        aria-busy="true"
      >
        <p class="nds-computer-use-address nds-font-mono" data-slot="computer-use-address">
          <span class="nds-sr-only">{labels.address}</span>
          <span
            class="nds-computer-use-url nds-truncate"
            data-slot="computer-use-url"
            lang="en">{COMPUTER_URL}</span
          >
        </p>
        <div class="nds-computer-use-screen" data-slot="computer-use-screen">
          <div class="nds-computer-use-surface" data-slot="computer-use-surface">
            <ComputerUseDemoScreen />
          </div>
          <span
            class="nds-computer-use-trail"
            data-slot="computer-use-trail"
            aria-hidden="true"
          >
            {#each SHORT_TRAIL as step, i (i)}
              <span
                class="nds-computer-use-mark"
                data-slot="computer-use-mark"
                data-active={i === SHORT_TRAIL.length - 1 ? 'true' : undefined}
                style="--computer-use-mark-x: {step.x}; --computer-use-mark-y: {step.y}"
              ></span>
            {/each}
          </span>
        </div>
      </figure>
    </div>
  {/snippet}
  <!--
    O segundo par é sobre o RASTRO: o certo mostra as últimas ações e a marca em
    curso se destaca; o errado marca a sessão inteira de uma vez.
  -->
  {#snippet doPair2()}
    <div class="nds-stack nds-w-full" data-spacing="lg">
      <ComputerUse
        url={COMPUTER_URL}
        {screen}
        steps={COMPUTER_STEPS_LOGIN}
        activeIndex={LAST_INDEX}
        status="running"
        {labels}
      />
    </div>
  {/snippet}
  {#snippet dontPair2()}
    <!--
      Também à mão: a peça limita o rastro a três marcas por construção, e nenhum
      argumento produz o erro. Com a sessão inteira marcada, o rastro deixa de
      mostrar um caminho e passa a cobrir a tela que ele deveria estar apontando.
    -->
    <div class="nds-stack nds-w-full" data-spacing="lg">
      <figure
        class="nds-computer-use"
        data-slot="computer-use"
        data-status="running"
        aria-busy="true"
      >
        <p class="nds-computer-use-address nds-font-mono" data-slot="computer-use-address">
          <span class="nds-sr-only">{labels.address}</span>
          <span
            class="nds-computer-use-url nds-truncate"
            data-slot="computer-use-url"
            lang="en">{COMPUTER_URL}</span
          >
        </p>
        <div class="nds-computer-use-screen" data-slot="computer-use-screen">
          <div class="nds-computer-use-surface" data-slot="computer-use-surface">
            <ComputerUseDemoScreen />
          </div>
          <span
            class="nds-computer-use-trail"
            data-slot="computer-use-trail"
            aria-hidden="true"
          >
            {#each COMPUTER_STEPS_LOGIN as step, i (i)}
              <span
                class="nds-computer-use-mark"
                data-slot="computer-use-mark"
                data-active={i === LAST_INDEX ? 'true' : undefined}
                style="--computer-use-mark-x: {step.x}; --computer-use-mark-y: {step.y}"
              ></span>
            {/each}
          </span>
        </div>
        <figcaption class="nds-computer-use-caption" data-slot="computer-use-caption">
          <span class="nds-computer-use-action" data-slot="computer-use-action"
            >{COMPUTER_STEPS_LOGIN[LAST_INDEX].action}</span
          >
          <span
            class="nds-computer-use-target nds-truncate"
            data-slot="computer-use-target">{COMPUTER_STEPS_LOGIN[LAST_INDEX].target}</span
          >
          <span class="nds-computer-use-position" data-slot="computer-use-position"
            >{lastPositionText}</span
          >
        </figcaption>
      </figure>
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
        title: 'ComputerUse',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: ['url', 'screen', 'steps', 'activeIndex', 'status', 'labels'].map(k => ({
          name: $tStore(`props.table.${k}.name`),
          type: $tStore(`props.table.${k}.type`),
          defaultValue: $tStore(`props.table.${k}.default`),
          required: $tStore(`props.table.${k}.required`),
          description: toPlainText($tStore(`props.table.${k}.description`)),
        })),
      },
      {
        title: 'ComputerUseLabels',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: ['labelsAddress', 'labelsPosition'].map(k => ({
          name: $tStore(`props.table.${k}.name`),
          type: $tStore(`props.table.${k}.type`),
          defaultValue: $tStore(`props.table.${k}.default`),
          required: $tStore(`props.table.${k}.required`),
          description: toPlainText($tStore(`props.table.${k}.description`)),
        })),
      },
      {
        title: 'ComputerStep',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: ['stepAction', 'stepTarget', 'stepX', 'stepY'].map(k => ({
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
      'textLabel', 'spacing1', 'spacing2', 'spacing3', 'muted', 'border',
      'radius', 'radiusSm', 'radiusFull', 'mutedForeground', 'foreground',
      'background', 'primary', 'fontWeightMedium', 'durationStately', 'easeStandard',
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
      { name: $tStore('related.items.agentStatus.name'),   description: toPlainText($tStore('related.items.agentStatus.description')),   path: '?path=/docs/primitives-conversational-agentstatus--docs'   },
      { name: $tStore('related.items.toolGroup.name'),     description: toPlainText($tStore('related.items.toolGroup.description')),     path: '?path=/docs/primitives-conversational-toolgroup--docs'     },
      { name: $tStore('related.items.terminalBlock.name'), description: toPlainText($tStore('related.items.terminalBlock.description')), path: '?path=/docs/primitives-conversational-terminalblock--docs' },
      { name: $tStore('related.items.agentPlan.name'),     description: toPlainText($tStore('related.items.agentPlan.description')),     path: '?path=/docs/primitives-conversational-agentplan--docs'     },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    componentSlug="computer-use"
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
