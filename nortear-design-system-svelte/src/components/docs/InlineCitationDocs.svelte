<script lang="ts">
  import { untrack } from 'svelte';
  import { InlineCitation, type InlineCitationLabels } from '@/components/ui/inline-citation';
  import {
    citationOf,
    inlineCitationLabelsFor,
    sentenceCitations,
    sentenceParts,
  } from '@/components/ui/inline-citation/inline-citation.fixtures';
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
  import type { Citation } from '@shared/primitives/chat-protocol';
  import uiTranslations from '@/i18n/ui.json';
  import inlineCitationTranslations from '@shared/content/inline-citation/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  // SEM SOBRESCRITA NENHUMA, e é o que se espera: as cinco propriedades do
  // conteúdo compartilhado — `citation`, `index`, `defaultOpen`, `onOpenChange`
  // e `labels` — têm aqui o mesmo NOME e o mesmo TIPO. A única divergência de
  // API desta stack é a FORMA de alcançar os comandos, que é `bind:this`, e
  // forma não se corrige à força: registra-se (§4.1 da guideline 17), e o lugar
  // dela é a seção de extensão.
  const { tStore } = useTranslation(inlineCitationTranslations);

  const parts = sentenceParts();
  const citations = sentenceCitations();

  /** A citação daquele exemplo, com o rótulo já escrito no idioma corrente. */
  function labelsOf(index: number, citation: Citation): InlineCitationLabels {
    return inlineCitationLabelsFor($locale, index, citation);
  }

  const fullCitation = citationOf('full');
  const minimalCitation = citationOf('minimal');
  const unsafeCitation = citationOf('unsafe');

  /**
   * O contraexemplo do segundo par: um traço no lugar do que não veio.
   *
   * Escrito à mão porque a peça nunca o produz — ela não monta nada no lugar do
   * que a citação não trouxe. É o que faz do par um par: o erro só existe se
   * alguém o escrever.
   */
  const dashedCitation: Citation = {
    source: minimalCitation.source,
    excerpt: '—',
    anchor: '—',
  };

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria. O
  // `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = $derived(
    Object.entries(
      (inlineCitationTranslations as unknown as Record<
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
      componentSlug: 'inline-citation',
    });
    track('docs_page_view', {
      component_name: 'inline-citation',
      locale: l,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

  // ─── Active section ──────────────────────────────────────────────────────────
  //
  // Não há seção de variantes: esta peça não tem eixo de forma. A marca é sempre
  // a mesma — o número sobre a mesma superfície — e o que muda é o que a prévia
  // tem para dizer, que é a seção de estados.

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
      component_name: 'inline-citation',
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

  const interfaceCode = `// As cinco propriedades da marca. Os nomes são os mesmos nas cinco stacks; o
// que muda aqui é a FORMA de alcançar os comandos, que é \`bind:this\`.
interface InlineCitationProps {
  citation: Citation;                    // a fonte, o trecho e onde dentro dela
  index: number;                         // o número que a marca mostra
  defaultOpen?: boolean;                 // nasce com a prévia aberta
  onOpenChange?: (open: boolean) => void;
  labels: InlineCitationLabels;
}

// O VOCABULÁRIO NÃO É DAQUI. \`Citation\` e \`ChatSource\` vêm de
// \`@shared/primitives/chat-protocol\`, e é lá que está escrito por que o trecho
// mora na CITAÇÃO e não na fonte: a mesma fonte apoia afirmações diferentes.
interface Citation {
  source: ChatSource;         // o documento
  excerpt?: string;           // o texto citado, como saiu da fonte
  anchor?: string;            // onde dentro dele — página, âncora, linhas
}

interface InlineCitationLabels {
  marker: string;             // o nome acessível, já escrito, com o número dentro
  unsafeSource: string;       // o que se diz no lugar de um endereço recusado
}

// A MARCA É CONTROLÁVEL, e o comando é o que resolve a exclusão mútua entre
// duas prévias — a peça não conhece as vizinhas, e não conhecê-las é o que
// permite que duas marcas da mesma frase venham de lugares diferentes.
interface InlineCitationCommands {
  open(): void;
  close(): void;
  toggle(): void;
  isOpen(): boolean;
}`;
</script>

<!--
  A FRASE É DE QUEM ESCREVE, e o trecho aceita a citação, o rótulo e se a prévia
  nasce aberta. Nenhum pedaço termina em espaço, e nada separa `{parts[0]}` da
  tag: é assim que a marca não se descola da palavra que a antecede quando a
  linha quebra.
-->
{#snippet sentence(citation: Citation, labels: InlineCitationLabels, open: boolean)}
  <p>{parts[0]}<InlineCitation
      {citation}
      index={1}
      defaultOpen={open}
      {labels}
    />{parts[1]}{parts[2]}</p>
{/snippet}

<!-- A frase com as DUAS marcas, cada uma com a própria numeração. -->
{#snippet sentenceWithTwo()}
  <p>{parts[0]}{#each citations as citation, i (i)}<InlineCitation
        {citation}
        index={i + 1}
        labels={labelsOf(i + 1, citation)}
      />{parts[i + 1]}{/each}</p>
{/snippet}

{#snippet doPair1()}
  {@render sentence(fullCitation, labelsOf(1, fullCitation), false)}
{/snippet}
{#snippet dontPair1()}
  <!--
    O contraexemplo: o nome acessível é o número. Quem vê não nota diferença
    nenhuma, e é esse o ponto — a perda é inteira de quem ouve.
  -->
  {@render sentence(
    fullCitation,
    { marker: '1', unsafeSource: $tStore('labels.unsafeSource') },
    false,
  )}
{/snippet}
{#snippet doPair2()}
  {@render sentence(minimalCitation, labelsOf(1, minimalCitation), true)}
{/snippet}
{#snippet dontPair2()}
  {@render sentence(dashedCitation, labelsOf(1, minimalCitation), true)}
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
    A legenda diz QUAL exemplo está desenhado — sem ela, quatro frases quase
    iguais viram uma só, e o assunto da demonstração é justamente a diferença
    entre elas.

    `nds-min-h-50` dá altura ao exemplo cuja prévia nasce aberta: a caixa é
    posicionada fora do fluxo, então sem folga ela cobriria a legenda do exemplo
    seguinte.
  -->
  <DocsDemonstration
    title={$tStore('demonstration.title')}
    componentSlug="inline-citation"
  >
    <div class="nds-stack nds-w-full" data-spacing="lg">
      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.inSentence')}
        </p>
        <!--
          O primeiro é o único fechado, e é ele que mostra a peça como ela vive:
          duas marcas dentro de uma frase, à espera de quem lê.
        -->
        <div>{@render sentenceWithTwo()}</div>
      </div>

      <Separator />

      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.open')}
        </p>
        <div class="nds-min-h-50">
          {@render sentence(fullCitation, labelsOf(1, fullCitation), true)}
        </div>
      </div>

      <Separator />

      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.minimal')}
        </p>
        <div class="nds-min-h-50">
          {@render sentence(minimalCitation, labelsOf(1, minimalCitation), true)}
        </div>
      </div>

      <Separator />

      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.unsafe')}
        </p>
        <div class="nds-min-h-50">
          {@render sentence(unsafeCitation, labelsOf(1, unsafeCitation), true)}
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
      items: [1, 2, 3, 4, 5, 6].map(i => $tStore(`usage.guidelines.item${i}`)),
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
      items: ['marker', 'unsafeSource', 'sourceTitle', 'anchor'].map(k => ({
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
    Só os dois primeiros são estados que a peça guarda — recolhida e expandida.
    Os outros dois são o que a mesma prévia faz conforme o que a citação trouxe.
  -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('states.cols.state'),
      trigger: $tStore('states.cols.trigger'),
      behavior: $tStore('states.cols.behavior'),
    }}
    items={['closed', 'open', 'minimal', 'unsafe'].map(k => ({
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
        title: 'InlineCitation',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: ['citation', 'index', 'defaultOpen', 'onOpenChange', 'labels'].map(k => ({
          name: $tStore(`props.table.${k}.name`),
          type: $tStore(`props.table.${k}.type`),
          defaultValue: $tStore(`props.table.${k}.default`),
          required: $tStore(`props.table.${k}.required`),
          description: toPlainText($tStore(`props.table.${k}.description`)),
        })),
      },
      {
        title: 'Citation',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: ['citationSource', 'citationExcerpt', 'citationAnchor'].map(k => ({
          name: $tStore(`props.table.${k}.name`),
          type: $tStore(`props.table.${k}.type`),
          defaultValue: $tStore(`props.table.${k}.default`),
          required: $tStore(`props.table.${k}.required`),
          description: toPlainText($tStore(`props.table.${k}.description`)),
        })),
      },
      {
        title: 'ChatSource',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: ['sourceTitle', 'sourceUrl'].map(k => ({
          name: $tStore(`props.table.${k}.name`),
          type: $tStore(`props.table.${k}.type`),
          defaultValue: $tStore(`props.table.${k}.default`),
          required: $tStore(`props.table.${k}.required`),
          description: toPlainText($tStore(`props.table.${k}.description`)),
        })),
      },
      {
        title: 'InlineCitationLabels',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: ['labelsMarker', 'labelsUnsafeSource'].map(k => ({
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
      'muted', 'foreground', 'primary', 'primaryForeground', 'ring',
      'sizeXs', 'radiusSm', 'textLabel',
      'textControlSm', 'spacing2', 'mutedForeground', 'border',
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
      { key: 'Tab',           description: $tStore('accessibility.keyboard.tab') },
      { key: 'Enter / Space', description: $tStore('accessibility.keyboard.enter') },
      { key: 'Escape',        description: $tStore('accessibility.keyboard.escape') },
    ]}
    screenReaderTitle={$tStore('accessibility.screenReader.title')}
    screenReaderItems={screenReaderItems}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.chatThread.name'), description: toPlainText($tStore('related.items.chatThread.description')), path: '?path=/docs/components-conversational-chatthread--docs' },
      { name: $tStore('related.items.hoverCard.name'),  description: toPlainText($tStore('related.items.hoverCard.description')),  path: '?path=/docs/components-overlay-hovercard--docs'        },
      { name: $tStore('related.items.popover.name'),    description: toPlainText($tStore('related.items.popover.description')),    path: '?path=/docs/components-overlay-popover--docs'          },
      { name: $tStore('related.items.tooltip.name'),    description: toPlainText($tStore('related.items.tooltip.description')),    path: '?path=/docs/components-overlay-tooltip--docs'          },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    componentSlug="inline-citation"
    items={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => ({ title: '', content: $tStore(`notes.item${i}`) }))}
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
      items: [1, 2, 3, 4, 5, 6].map(i => ({
        story: toPlainText($tStore(`testes.visual.item${i}.story`)),
        priority: localPriority($tStore(`testes.visual.item${i}.priority`), $tNavStore),
      })),
    }}
  />
</DocsPageLayout>
