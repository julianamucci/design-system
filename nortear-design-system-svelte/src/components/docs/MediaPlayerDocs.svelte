<script lang="ts">
  import { untrack } from 'svelte';
  import { Button } from '@/components/ui/button';
  import { MediaPlayer, type MediaPlayerProps } from '@/components/ui/media-player';
  import MediaPlayerCountingPlayer from '@/components/ui/media-player/MediaPlayerCountingPlayer.svelte';
  import {
    VIMEO_VIDEO_ID,
    YOUTUBE_VIDEO_ID,
    canvasStream,
    captionTrack,
    mediaPlayerLabelsFor,
    silentWav,
  } from '@/components/ui/media-player/media-player.fixtures';
  import {
    mediaPlayerAudioSource,
    mediaPlayerVideoSource,
    mediaPlayerVimeoSource,
    mediaPlayerYouTubeSource,
  } from '@/components/ui/media-player/media-player.source';
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
  import mediaPlayerTranslations from '@shared/content/media-player/translations.json';

  // Sem overrides: o `translations.json` do MediaPlayer descreve a API em
  // nomenclatura neutra, e nesta stack os nomes coincidem — `kind`, `src`,
  // `stream`, `embed`, `tracks`, `rates`, `labels`. Os três callbacks são a
  // exceção prevista pelo conteúdo, que os nomeia por PROPÓSITO justamente
  // porque o nome real muda de stack para stack; a tabela abaixo promete o nome
  // que se digita aqui.
  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(mediaPlayerTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'media-player',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/display' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'media-player',
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
    track('docs_section_viewed', { section_id: id, component_name: 'media-player', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const priorityKeyMap: Record<string, string> = {
    high: 'common.high', medium: 'common.medium', low: 'common.low',
  };
  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  /** As quatro fontes, na ordem em que o conteúdo as lista. */
  const SOURCE_KEYS = ['video', 'audio', 'youtube', 'vimeo'] as const;
  type SourceKey = typeof SOURCE_KEYS[number];

  /** Chaves da tabela de propriedades, na ordem do contrato. */
  const PROP_KEYS = [
    'kind', 'src', 'stream', 'embed', 'tracks', 'rates', 'labels',
    'onPlay', 'onPause', 'onEnded',
  ] as const;

  /**
   * O nome do callback é o DESTA stack; a descrição é compartilhada.
   *
   * O conteúdo nomeia os três por propósito ("callback de início") justamente
   * porque o nome real muda de stack para stack — a tabela tem de prometer o
   * que se digita aqui.
   */
  const PROP_NAME_OVERRIDE: Partial<Record<typeof PROP_KEYS[number], string>> = {
    onPlay: 'onplay',
    onPause: 'onpause',
    onEnded: 'onended',
  };

  /** Estados descritos pelo conteúdo compartilhado, na ordem em que ele os lista. */
  const STATE_KEYS = ['idle', 'playing', 'ended', 'refused', 'unavailable'] as const;

  /** Chaves da tabela de tokens, na ordem em que o conteúdo as declara. */
  const TOKEN_KEYS = [
    'border', 'background', 'muted', 'mutedForeground', 'foreground',
    'primary', 'accent', 'ring', 'spacing6',
  ] as const;

  const interfaceCode = `type MediaPlayerProps = {
  kind?: "video" | "audio";
  src?: string;
  stream?: MediaStream;
  embed?: { provider: "youtube" | "vimeo"; videoId: string; hash?: string };
  tracks?: MediaPlayerTrack[];
  rates?: number[];
  labels: MediaPlayerLabels;
  onplay?: () => void;
  onpause?: (info: { ended: boolean; currentTime: number }) => void;
  onended?: () => void;
  class?: string;
};`;

  // ─── Rótulos da barra ────────────────────────────────────────────────────────
  //
  // Os doze rótulos vêm do conteúdo compartilhado, no idioma da página. O rótulo
  // é o NOME ACESSÍVEL de um controle só de ícone, e uma barra em português numa
  // página em espanhol é ilegível para quem ouve.
  const barLabels = $derived(mediaPlayerLabelsFor($locale));

  // ─── Mídia dos exemplos ──────────────────────────────────────────────────────
  //
  // Tudo construído em MEMÓRIA: vídeo por canvas, áudio por WAV. Nada baixado,
  // nada de rede — os dois provedores são os únicos casos desta página em que o
  // navegador de quem lê vai à rede, e é o que a fonte É.
  //
  // Montados uma vez, fora de qualquer derivado: recriar o stream a cada troca
  // de idioma remontaria o player, e a limpeza dele para as trilhas do stream
  // anterior.
  const audioSrc = silentWav(0.6);
  const variantVideoStream = canvasStream();
  const doDontVideoStream = canvasStream();
  const dontVideoStream = canvasStream();

  /** A fonte de cada card, sem os rótulos — eles trocam com o idioma. */
  function sourceProps(key: SourceKey, stream: MediaStream): Omit<MediaPlayerProps, 'labels'> {
    switch (key) {
      case 'video':
        // `rates: []` porque a fonte é stream ao vivo, e nela a velocidade de
        // reprodução é ignorada — medido. Oferecer o seletor seria dar um
        // controle que a pessoa mexe e não acontece nada.
        return { kind: 'video', stream, rates: [], tracks: [captionTrack()] };
      case 'audio':
        return { kind: 'audio', src: audioSrc };
      case 'youtube':
        return { embed: { provider: 'youtube', videoId: YOUTUBE_VIDEO_ID } };
      case 'vimeo':
        return { embed: { provider: 'vimeo', videoId: VIMEO_VIDEO_ID } };
    }
  }

  /**
   * O código de cada card sai do MESMO construtor que alimenta o painel Code
   * das stories — um lugar só para a forma da montagem.
   *
   * Os endereços aqui são de ensino, e não o `data:` das stories: copiar um WAV
   * em base64 não é o caso de uso de ninguém.
   */
  const SOURCE_CODE: Record<SourceKey, string> = {
    video: mediaPlayerVideoSource(),
    audio: mediaPlayerAudioSource(),
    youtube: mediaPlayerYouTubeSource(),
    vimeo: mediaPlayerVimeoSource(),
  };

  // ─── Demonstração ────────────────────────────────────────────────────────────
  //
  // Trocar de fonte REMONTA o player, e aqui isso é correto: a fonte decide o
  // motor, e motor não se troca em voo — um `<video>` não vira `<iframe>`. O
  // `{#key}` é o que força a remontagem, e com ela a limpeza do player antigo:
  // sem ela o áudio removido continuaria tocando e o quadro do provedor
  // continuaria baixando.
  //
  // O evento sai do PRÓPRIO botão, por `data-track`: o observer do
  // DocsPageLayout resolve por `.closest('[data-track]')`, e sem marcação no
  // controle ele subiria até o container da seção e dispararia um segundo
  // `docs_demo_click` com o rótulo TRADUZIDO no `element_id` — o mesmo clique
  // contado duas vezes, e a segunda partida em três valores no GA4.

  let demoSource = $state<SourceKey>('video');
  const demoStream = $derived.by(() => (demoSource === 'video' ? canvasStream() : undefined));
  const demoProps = $derived(sourceProps(demoSource, demoStream as MediaStream));
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="media-player">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')} componentSlug="media-player">
    <div class="nds-stack nds-w-full" data-spacing="md">
      <div
        class="nds-cluster"
        data-spacing="sm"
        role="group"
        aria-label={$tStore('demonstration.title')}
      >
        {#each SOURCE_KEYS as key (key)}
          <Button
            variant="outline"
            size="sm"
            aria-pressed={demoSource === key}
            data-track="demo"
            data-track-id={`media-player:demonstracao:${key}`}
            data-track-label={$tStore(`demonstration.labels.${key}`)}
            onclick={() => { demoSource = key; }}
          >
            {$tStore(`demonstration.labels.${key}`)}
          </Button>
        {/each}
      </div>

      <div class="nds-w-full">
        {#key demoSource}
          <MediaPlayer {...demoProps} labels={barLabels} class="nds-w-full" />
        {/key}
      </div>
    </div>
  </DocsDemonstration>

  <!-- ── Anatomia ───────────────────────────────────────────────── -->
  <DocsAnatomy
    title={$tStore('anatomy.title')}
    items={[1, 2, 3, 4, 5, 6, 7].map((n) => $tStore(`anatomy.item${n}`))}
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
      items: [1, 2, 3, 4, 5].map((n) => ({
        s: $tStore(`usage.scenarios.item${n}.s`),
        u: $tStore(`usage.scenarios.item${n}.u`),
        a: $tStore(`usage.scenarios.item${n}.a`),
      })),
    }}
    do={{
      title: $tNavStore('common.do'),
      items: [1, 2, 3, 4].map((n) => $tStore(`usage.do.item${n}`)),
    }}
    dont={{
      title: $tNavStore('common.dont'),
      items: [1, 2, 3, 4].map((n) => $tStore(`usage.dont.item${n}`)),
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

  <!-- Os dois players do par 1 são IDÊNTICOS; muda só QUEM o contador escuta.
       O botão "tocar por fora" é o caminho que não passa pela barra — como uma
       tecla de mídia ou o controle do sistema — e é ali que os dois números
       deixam de bater. -->
  {#snippet doPair1()}
    <MediaPlayerCountingPlayer
      listenTo="engine"
      countLabel={$tStore('doDont.countLabel')}
      outsideLabel={$tStore('doDont.outsideLabel')}
    />
  {/snippet}
  {#snippet dontPair1()}
    <MediaPlayerCountingPlayer
      listenTo="click"
      countLabel={$tStore('doDont.countLabel')}
      outsideLabel={$tStore('doDont.outsideLabel')}
    />
  {/snippet}

  <!-- O mesmo vídeo, e a única diferença é a faixa declarada. -->
  {#snippet doPair2()}
    <MediaPlayer
      kind="video"
      stream={doDontVideoStream}
      rates={[]}
      tracks={[captionTrack()]}
      labels={barLabels}
      class="nds-w-full"
    />
  {/snippet}
  {#snippet dontPair2()}
    <MediaPlayer
      kind="video"
      stream={dontVideoStream}
      rates={[]}
      tracks={[]}
      labels={barLabels}
      class="nds-w-full"
    />
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    description={$tStore('import.basic')}
    code={$tStore('import.basicCode')}
    secondaryDescription={$tStore('import.withProvider')}
    secondaryCode={$tStore('import.withProviderCode')}
    componentSlug="media-player"
    copyLabel={$tNavStore('common.copy')}
    copiedLabel={$tNavStore('common.copied')}
  />

  <!-- ── Fontes ─────────────────────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    note={$tStore('variants.note')}
    componentSlug="media-player"
    copyLabel={$tNavStore('common.copy')}
    copiedLabel={$tNavStore('common.copied')}
    items={[
      {
        // O `name` é a chave ESTÁVEL, não traduzida: é ela que vira
        // `snippet_id` do `docs_code_copy`, e um nome traduzido partiria o
        // mesmo evento em três valores no GA4.
        name: $tStore('variants.items.video.name'),
        trackId: 'video',
        description: $tStore('variants.items.video.description'),
        code: SOURCE_CODE.video,
        preview: sourceVideo,
      },
      {
        name: $tStore('variants.items.audio.name'),
        trackId: 'audio',
        description: $tStore('variants.items.audio.description'),
        code: SOURCE_CODE.audio,
        preview: sourceAudio,
      },
      {
        name: $tStore('variants.items.youtube.name'),
        trackId: 'youtube',
        description: $tStore('variants.items.youtube.description'),
        code: SOURCE_CODE.youtube,
        preview: sourceYouTube,
      },
      {
        name: $tStore('variants.items.vimeo.name'),
        trackId: 'vimeo',
        description: $tStore('variants.items.vimeo.description'),
        code: SOURCE_CODE.vimeo,
        preview: sourceVimeo,
      },
    ]}
  />

  {#snippet sourceVideo()}
    <MediaPlayer
      {...sourceProps('video', variantVideoStream)}
      labels={barLabels}
      class="nds-w-full"
    />
  {/snippet}
  {#snippet sourceAudio()}
    <MediaPlayer {...sourceProps('audio', variantVideoStream)} labels={barLabels} class="nds-w-full" />
  {/snippet}
  {#snippet sourceYouTube()}
    <MediaPlayer
      {...sourceProps('youtube', variantVideoStream)}
      labels={barLabels}
      class="nds-w-full"
    />
  {/snippet}
  {#snippet sourceVimeo()}
    <MediaPlayer {...sourceProps('vimeo', variantVideoStream)} labels={barLabels} class="nds-w-full" />
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
        items: PROP_KEYS.map((key) => ({
          name: PROP_NAME_OVERRIDE[key] ?? $tStore(`props.table.${key}.name`),
          type: $tStore(`props.table.${key}.type`),
          defaultValue: $tStore(`props.table.${key}.default`),
          required: $tStore(`props.table.${key}.required`),
          description: $tStore(`props.table.${key}.description`),
        })),
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
    items={[1, 2, 3, 4, 5, 6, 7, 8].map((n) => $tStore(`accessibility.item${n}`))}
    keyboardTitle={$tStore('accessibility.keyboardTitle')}
    keyboardItems={['tab', 'space', 'arrows', 'homeEnd', 'escape'].map((key) => ({
      key: $tStore(`accessibility.keyboard.${key}.key`),
      description: $tStore(`accessibility.keyboard.${key}.action`),
    }))}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    componentSlug="media-player"
    items={[
      { name: 'AspectRatio', description: $tStore('related.aspectRatio'), path: '?path=/docs/ui-aspectratio--docs' },
      { name: 'Sonner',      description: $tStore('related.sonner'),      path: '?path=/docs/ui-sonner--docs'      },
      { name: 'Button',      description: $tStore('related.button'),      path: '?path=/docs/ui-button--docs'      },
      { name: 'Card',        description: $tStore('related.card'),        path: '?path=/docs/ui-card--docs'        },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    componentSlug="media-player"
    items={[1, 2, 3, 4, 5, 6].map((n) => ({ title: '', content: $tStore(`notes.tip${n}`) }))}
  />

  <!-- ── Analytics ─────────────────────────────────────────────── -->
  <DocsAnalytics
    title={$tStore('analytics.title')}
    cols={{
      event: $tStore('analytics.table.event'),
      trigger: $tStore('analytics.table.trigger'),
      payload: $tStore('analytics.table.payload'),
    }}
    items={['pageView', 'sectionViewed', 'demoClick'].map((key) => ({
      event: $tStore(`analytics.table.${key}`),
      trigger: $tStore(`analytics.table.${key}Trigger`),
      payload: $tStore(`analytics.table.${key}Payload`),
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
      items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({
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
        level: $tNavStore('common.priority'),
        how: $tNavStore('common.howToVerify'),
      },
      // O critério é o RESULTADO esperado; a ação é como se verifica. Invertê-los
      // deixaria "Inspecionar o reprodutor" na coluna de critério, que não é
      // critério nenhum.
      items: [1, 2, 3, 4, 5].map((n) => ({
        criterion: $tStore(`testes.accessibility.item${n}.result`),
        level: localPriority($tStore(`testes.accessibility.item${n}.priority`), $tNavStore),
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
      items: [1, 2].map((n) => ({
        story: `${$tStore(`testes.visual.item${n}.action`)} — ${$tStore(`testes.visual.item${n}.result`)}`,
        priority: localPriority($tStore(`testes.visual.item${n}.priority`), $tNavStore),
      })),
    }}
  />
</DocsPageLayout>
