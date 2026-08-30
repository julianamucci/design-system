<script lang="ts">
  import { untrack } from 'svelte';
  import { Editor } from '@/components/ui/editor';
  import { Button } from '@/components/ui/button';
  import {
    CONTENTS,
    editorLabelsFor,
    nounLabelsFor,
  } from '@/components/ui/editor/editor.fixtures';
  import {
    editorAdvancedSource,
    editorBasicSource,
  } from '@/components/ui/editor/editor.source';
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
  import editorTranslations from '@shared/content/editor/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(editorTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'editor',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/form' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'editor',
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
    track('docs_section_viewed', { section_id: id, component_name: 'editor', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const priorityKeyMap: Record<string, string> = {
    high: 'common.high', medium: 'common.medium', low: 'common.low',
  };
  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  /** Estados do conteúdo compartilhado, na ordem em que ele os lista. */
  const STATE_KEYS = [
    'editing', 'readOnly', 'imageSelected', 'inTable', 'fieldOpen', 'invalidValue',
  ] as const;

  /** Chaves da tabela de tokens, na ordem em que o conteúdo as declara. */
  const TOKEN_KEYS = [
    'border', 'background', 'muted', 'mutedForeground', 'foreground',
    'primary', 'accent', 'ring', 'textH1',
  ] as const;

  // ─── Rótulos da barra ────────────────────────────────────────────────────────
  //
  // Os 51 rótulos vêm do conteúdo compartilhado, no idioma da página. Antes
  // vinham de um objeto local em pt-BR — inclusive `editorField`, o nome
  // acessível da área editável: a página trocava de idioma e a interface que ela
  // demonstra continuava em português para quem ouve.

  const barLabels = $derived(editorLabelsFor($locale));

  /** Os mesmos rótulos com o SUBSTANTIVO no lugar do verbo — o par 1 do Do & Don't. */
  const nounBarLabels = $derived(nounLabelsFor($locale));

  // ─── Demonstração ────────────────────────────────────────────────────────────
  //
  // Dois EIXOS independentes, e não uma escolha de três: o conjunto (básico ou
  // avançado) e a edição ligada ou desligada são perguntas diferentes. Como
  // escolha única, "somente leitura" excluía o conjunto escolhido — não dava para
  // ver o conjunto avançado em leitura, que é justamente o estado que a seção de
  // estados descreve.
  //
  // O evento sai do PRÓPRIO botão, por `data-track`: o observer do
  // DocsPageLayout resolve por `.closest('[data-track]')`, e sem marcação no
  // controle ele subia até o container da seção e disparava um segundo
  // `docs_demo_click` com o rótulo TRADUZIDO no `element_id` — o mesmo clique
  // contado duas vezes, e a segunda partida em três valores no GA4.

  let demoPreset = $state<'basic' | 'advanced'>('advanced');
  let demoEditable = $state(true);

  const demoControls = $derived([
    {
      key: 'basic',
      label: $tStore('demonstration.labels.basic'),
      pressed: demoPreset === 'basic',
      apply: () => { demoPreset = 'basic'; },
    },
    {
      key: 'advanced',
      label: $tStore('demonstration.labels.advanced'),
      pressed: demoPreset === 'advanced',
      apply: () => { demoPreset = 'advanced'; },
    },
    {
      key: 'readOnly',
      label: $tStore('demonstration.labels.readOnly'),
      pressed: !demoEditable,
      apply: () => { demoEditable = !demoEditable; },
    },
  ]);

  // ─── Código dos exemplos ─────────────────────────────────────────────────────
  //
  // O mesmo construtor que alimenta o painel Code das stories: um lugar só para
  // o snippet do conjunto básico e o do avançado.
  const codeBasic = editorBasicSource();
  const codeAdvanced = editorAdvancedSource();

  const interfaceCode = `interface EditorProps {
  content?: string;
  editable?: boolean;
  preset?: "basic" | "advanced";
  labels: EditorLabels;
  resolveImage?: (file: File) => Promise<string | null>;
  describeImage?: (file: File | null, src: string) => Promise<string | null>;
  onchange?: (html: string) => void;
  class?: string;
}`;

  /** Conteúdo dos dois pares de boas práticas — o mesmo nos quatro previews. */
  const DO_DONT_CONTENT = '<p>Ótimo trabalho, obrigado!</p>';
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="editor">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')} componentSlug="editor">
    <div class="nds-stack nds-w-full" data-spacing="md">
      <div class="nds-cluster" data-spacing="sm" role="group" aria-label={$tStore('demonstration.title')}>
        {#each demoControls as control (control.key)}
          <Button
            variant="outline"
            size="sm"
            aria-pressed={control.pressed}
            data-track="demo"
            data-track-id={`editor:demonstracao:${control.key}`}
            data-track-label={control.label}
            onclick={control.apply}
          >
            {control.label}
          </Button>
        {/each}
      </div>

      <Editor
        content={CONTENTS.playground}
        preset={demoPreset}
        editable={demoEditable}
        labels={barLabels}
        class="nds-w-full"
      />
    </div>
  </DocsDemonstration>

  <!-- ── Anatomia ───────────────────────────────────────────────── -->
  <DocsAnatomy
    title={$tStore('anatomy.title')}
    items={[
      $tStore('anatomy.item1'),
      $tStore('anatomy.item2'),
      $tStore('anatomy.item3'),
      $tStore('anatomy.item4'),
      $tStore('anatomy.item5'),
      $tStore('anatomy.item6'),
      $tStore('anatomy.item7'),
    ]}
    structureLabel={$tStore('anatomy.structureLabel')}
    structureCode={$tStore('anatomy.structureCode')}
    language="html"
  />

  <!-- ── Quando Usar ────────────────────────────────────────────── -->
  <DocsWhenToUse
    title={$tStore('usage.title')}
    guidelines={{
      title: $tStore('usage.guidelines.title'),
      items: [1, 2, 3, 4, 5].map((n) => $tStore(`usage.guidelines.item${n}`)),
    }}
    scenarios={{
      title: $tStore('usage.scenarios.title'),
      cols: {
        scenario: $tStore('usage.scenarios.cols.scenario'),
        use: $tStore('usage.scenarios.cols.use'),
        alternative: $tStore('usage.scenarios.cols.alternative'),
      },
      items: [1, 2, 3, 4, 5, 6].map((n) => ({
        s: $tStore(`usage.scenarios.item${n}.s`),
        u: $tStore(`usage.scenarios.item${n}.u`),
        a: $tStore(`usage.scenarios.item${n}.a`),
      })),
    }}
    do={{
      title: $tNavStore('common.do'),
      items: [
        $tStore('usage.do.item1'),
        $tStore('usage.do.item2'),
        $tStore('usage.do.item3'),
        $tStore('usage.do.item4'),
      ],
    }}
    dont={{
      title: $tNavStore('common.dont'),
      items: [
        $tStore('usage.dont.item1'),
        $tStore('usage.dont.item2'),
        $tStore('usage.dont.item3'),
        $tStore('usage.dont.item4'),
      ],
    }}
  />

  <!-- ── Do & Don't ─────────────────────────────────────────────── -->
  <DocsDoDont
    title={$tStore('doDont.title')}
    pairs={[
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: $tStore('doDont.pair1.do'),
        dontCaption: $tStore('doDont.pair1.dont'),
        doPreview: doPair1,
        dontPreview: dontPair1,
      },
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: $tStore('doDont.pair2.do'),
        dontCaption: $tStore('doDont.pair2.dont'),
        doPreview: doPair2,
        dontPreview: dontPair2,
      },
    ]}
  />

  <!-- Os dois editores do par 1 diferem em UM rótulo, o do botão de link:
       `labels.actions.link` ("Inserir link") de um lado, `labels.nouns.link`
       ("Link") do outro, os dois vindos do conteúdo compartilhado. É exatamente
       o que a legenda deste par contrasta, e um segundo texto diferente daria à
       comparação uma segunda variável. -->
  {#snippet doPair1()}
    <Editor content={DO_DONT_CONTENT} preset="basic" labels={barLabels} class="nds-w-full" />
  {/snippet}
  {#snippet dontPair1()}
    <Editor
      content={DO_DONT_CONTENT}
      preset="basic"
      labels={nounBarLabels}
      class="nds-w-full"
    />
  {/snippet}

  {#snippet doPair2()}
    <Editor content={DO_DONT_CONTENT} preset="basic" labels={barLabels} class="nds-w-full" />
  {/snippet}
  {#snippet dontPair2()}
    <Editor content={DO_DONT_CONTENT} preset="advanced" labels={barLabels} class="nds-w-full" />
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    description={$tStore('import.basic')}
    code={$tStore('import.basicCode')}
    secondaryDescription={$tStore('import.withStorage')}
    secondaryCode={$tStore('import.withStorageCode')}
    componentSlug="editor"
    copyLabel={$tNavStore('common.copy')}
    copiedLabel={$tNavStore('common.copied')}
  />

  <!-- ── Conjuntos ──────────────────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    note={$tStore('variants.note')}
    componentSlug="editor"
    copyLabel={$tNavStore('common.copy')}
    copiedLabel={$tNavStore('common.copied')}
    items={[
      {
        name: $tStore('variants.items.basic.name'),
        // A chave ESTÁVEL, e não o nome traduzido: é ela que vira `snippet_id`
        // do `docs_code_copy`, e um nome traduzido partiria o mesmo evento em
        // três valores no GA4.
        trackId: 'basic',
        description: $tStore('variants.items.basic.description'),
        code: codeBasic,
        preview: variantBasic,
      },
      {
        name: $tStore('variants.items.advanced.name'),
        trackId: 'advanced',
        description: $tStore('variants.items.advanced.description'),
        code: codeAdvanced,
        preview: variantAdvanced,
      },
    ]}
  />

  {#snippet variantBasic()}
    <Editor content={CONTENTS.basic} preset="basic" labels={barLabels} class="nds-w-full" />
  {/snippet}
  {#snippet variantAdvanced()}
    <Editor content={CONTENTS.advanced} preset="advanced" labels={barLabels} class="nds-w-full" />
  {/snippet}

  <!-- ── Estados ────────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('states.cols.state'),
      trigger: $tStore('states.cols.trigger'),
      behavior: $tStore('states.cols.behavior'),
    }}
    items={STATE_KEYS.map((key) => ({
      label: $tStore(`states.${key}.label`),
      trigger: $tStore(`states.${key}.trigger`),
      behavior: $tStore(`states.${key}.behavior`),
    }))}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: $tStore('props.table.content.name'),       type: $tStore('props.table.content.type'),       defaultValue: $tStore('props.table.content.default'),       required: $tStore('props.table.content.required'),       description: $tStore('props.table.content.description') },
          { name: $tStore('props.table.editable.name'),      type: $tStore('props.table.editable.type'),      defaultValue: $tStore('props.table.editable.default'),      required: $tStore('props.table.editable.required'),      description: $tStore('props.table.editable.description') },
          { name: $tStore('props.table.preset.name'),        type: $tStore('props.table.preset.type'),        defaultValue: $tStore('props.table.preset.default'),        required: $tStore('props.table.preset.required'),        description: $tStore('props.table.preset.description') },
          { name: $tStore('props.table.labels.name'),        type: $tStore('props.table.labels.type'),        defaultValue: $tStore('props.table.labels.default'),        required: $tStore('props.table.labels.required'),        description: $tStore('props.table.labels.description') },
          // O nome do callback é o desta stack; a descrição é compartilhada.
          { name: 'onchange',                                type: $tStore('props.table.onChange.type'),      defaultValue: $tStore('props.table.onChange.default'),      required: $tStore('props.table.onChange.required'),      description: $tStore('props.table.onChange.description') },
          { name: $tStore('props.table.resolveImage.name'),  type: $tStore('props.table.resolveImage.type'),  defaultValue: $tStore('props.table.resolveImage.default'),  required: $tStore('props.table.resolveImage.required'),  description: $tStore('props.table.resolveImage.description') },
          { name: $tStore('props.table.describeImage.name'), type: $tStore('props.table.describeImage.type'), defaultValue: $tStore('props.table.describeImage.default'), required: $tStore('props.table.describeImage.required'), description: $tStore('props.table.describeImage.description') },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityNotes={$tStore('props.extensibility')}
    extensibilityCode={$tStore('props.extensibilityCode')}
    copyLabel={$tNavStore('common.copy')}
    copiedLabel={$tNavStore('common.copied')}
  />

  <!-- ── Tokens ─────────────────────────────────────────────────── -->
  <DocsTokens
    title={$tStore('tokens.title')}
    cols={{
      token: $tStore('tokens.table.token'),
      value: $tStore('tokens.table.value'),
      description: $tStore('tokens.table.description'),
    }}
    items={TOKEN_KEYS.map((key) => ({
      token: $tStore(`tokens.table.${key}.token`),
      value: $tStore(`tokens.table.${key}.value`),
      description: $tStore(`tokens.table.${key}.description`),
    }))}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={$tStore('tokens.customizationCode')}
    copyLabel={$tNavStore('common.copy')}
    copiedLabel={$tNavStore('common.copied')}
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
    title={$tStore('accessibility.title')}
    summary={$tStore('accessibility.summary')}
    items={[
      $tStore('accessibility.item1'),
      $tStore('accessibility.item2'),
      $tStore('accessibility.item3'),
      $tStore('accessibility.item4'),
      $tStore('accessibility.item5'),
      $tStore('accessibility.item6'),
      $tStore('accessibility.item7'),
    ]}
    keyboardTitle={$tStore('accessibility.keyboardTitle')}
    keyboardItems={[
      { key: $tStore('accessibility.keyboard.tab.key'),      description: $tStore('accessibility.keyboard.tab.action')      },
      { key: $tStore('accessibility.keyboard.arrows.key'),   description: $tStore('accessibility.keyboard.arrows.action')   },
      { key: $tStore('accessibility.keyboard.homeEnd.key'),  description: $tStore('accessibility.keyboard.homeEnd.action')  },
      { key: $tStore('accessibility.keyboard.enter.key'),    description: $tStore('accessibility.keyboard.enter.action')    },
      { key: $tStore('accessibility.keyboard.escape.key'),   description: $tStore('accessibility.keyboard.escape.action')   },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    componentSlug="editor"
    items={[
      { name: 'Textarea',    description: $tStore('related.textarea'),    path: '?path=/docs/primitives-form-textarea--docs'    },
      { name: 'CodeBlock',   description: $tStore('related.codeBlock'),   path: '?path=/docs/primitives-display-codeblock--docs'   },
      { name: 'ToggleGroup', description: $tStore('related.toggleGroup'), path: '?path=/docs/primitives-form-togglegroup--docs' },
      { name: 'Button',      description: $tStore('related.button'),      path: '?path=/docs/primitives-form-button--docs'      },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    componentSlug="editor"
    items={[
      { title: '', content: $tStore('notes.tip1') },
      { title: '', content: $tStore('notes.tip2') },
      { title: '', content: $tStore('notes.tip3') },
      { title: '', content: $tStore('notes.tip4') },
      { title: '', content: $tStore('notes.tip5') },
      { title: '', content: $tStore('notes.tip6') },
    ]}
  />

  <!-- ── Analytics ─────────────────────────────────────────────── -->
  <DocsAnalytics
    title={$tStore('analytics.title')}
    cols={{
      event: $tStore('analytics.table.event'),
      trigger: $tStore('analytics.table.trigger'),
      payload: $tStore('analytics.table.payload'),
    }}
    items={[
      { event: $tStore('analytics.table.pageView'),      trigger: $tStore('analytics.table.pageViewTrigger'),      payload: $tStore('analytics.table.pageViewPayload') },
      { event: $tStore('analytics.table.sectionViewed'), trigger: $tStore('analytics.table.sectionViewedTrigger'), payload: $tStore('analytics.table.sectionViewedPayload') },
      { event: $tStore('analytics.table.demoClick'),     trigger: $tStore('analytics.table.demoClickTrigger'),     payload: $tStore('analytics.table.demoClickPayload') },
    ]}
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
      items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => ({
        action: $tStore(`testes.functional.item${n}.action`),
        result: $tStore(`testes.functional.item${n}.result`),
        priority: localPriority($tStore(`testes.functional.item${n}.priority`), $tNavStore),
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
      // O critério é o RESULTADO esperado; a ação é como se verifica. Invertê-los
      // deixaria "Inspecionar a barra" na coluna de critério, que não é critério
      // nenhum.
      items: [1, 2, 3, 4, 5].map((n) => ({
        criterion: $tStore(`testes.accessibility.item${n}.result`),
        level: 'AA',
        how: $tStore(`testes.accessibility.item${n}.action`),
      })),
    }}
    visual={{
      title: $tStore('testes.visual.title'),
      description: $tStore('testes.visual.description'),
      cols: {
        story: $tNavStore('common.storyState'),
        priority: $tNavStore('common.priority'),
      },
      items: [1, 2, 3].map((n) => ({
        story: `${$tStore(`testes.visual.item${n}.action`)} — ${$tStore(`testes.visual.item${n}.result`)}`,
        priority: localPriority($tStore(`testes.visual.item${n}.priority`), $tNavStore),
      })),
    }}
  />
</DocsPageLayout>
