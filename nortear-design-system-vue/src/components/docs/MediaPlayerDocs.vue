<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { MediaPlayer, type MediaPlayerTrack } from '@/components/ui/media-player';
import { mediaPlayerLabelsFor } from '@/components/ui/media-player/media-player.labels';
import {
  VIMEO_VIDEO_ID,
  YOUTUBE_VIDEO_ID,
  canvasStream,
  captionTrack,
  silentWav,
  DEMO_SECONDS,
} from '@/components/ui/media-player/media-player.fixtures';
import {
  mediaPlayerAudioSource,
  mediaPlayerCaptionsSource,
  mediaPlayerVimeoSource,
  mediaPlayerYouTubeSource,
} from '@/components/ui/media-player/media-player.source';
import { Button } from '@/components/ui/button';

import DocsPageLayout    from '@/components/docs/shared/sections/DocsPageLayout.vue';
import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.vue';
import DocsDemonstration from '@/components/docs/shared/sections/DocsDemonstration.vue';
import DocsAnatomy       from '@/components/docs/shared/sections/DocsAnatomy.vue';
import DocsWhenToUse     from '@/components/docs/shared/sections/DocsWhenToUse.vue';
import DocsDoDont        from '@/components/docs/shared/sections/DocsDoDont.vue';
import DocsImport        from '@/components/docs/shared/sections/DocsImport.vue';
import DocsVariants      from '@/components/docs/shared/sections/DocsVariants.vue';
import DocsStates        from '@/components/docs/shared/sections/DocsStates.vue';
import DocsProps         from '@/components/docs/shared/sections/DocsProps.vue';
import DocsTokens        from '@/components/docs/shared/sections/DocsTokens.vue';
import DocsAccessibility from '@/components/docs/shared/sections/DocsAccessibility.vue';
import DocsRelated       from '@/components/docs/shared/sections/DocsRelated.vue';
import DocsNotes         from '@/components/docs/shared/sections/DocsNotes.vue';
import DocsAnalytics     from '@/components/docs/shared/sections/DocsAnalytics.vue';
import DocsTestes        from '@/components/docs/shared/sections/DocsTestes.vue';

import uiTranslations        from '@/i18n/ui.json';
import componentTranslations from '@shared/content/media-player/translations.json';
import { toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────
// IMPORTANTE: locale vem de useTranslation — NUNCA de useLocaleStore/Pinia
const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(componentTranslations, {
  // O conteúdo compartilhado nomeia os três callbacks por PROPÓSITO, justamente
  // porque o nome real muda de stack para stack. Aqui a tabela promete o que se
  // digita nesta stack — e só o NOME muda; a descrição continua vindo do
  // conteúdo. As demais entradas coincidem: `kind`, `src`, `stream`, `embed`,
  // `tracks`, `rates` e `labels` se escrevem igual.
  '*': {
    'props.table.onPlay.name': '@play',
    'props.table.onPause.name': '@pause',
    'props.table.onEnded.name': '@ended',
  },
});

type MediaPlayerInstance = InstanceType<typeof MediaPlayer>;

/**
 * Os rótulos da barra vêm do CONTEÚDO COMPARTILHADO, no idioma da página.
 *
 * Todo controle do player é só de ícone: o rótulo É o nome acessível, e nome
 * acessível é conteúdo. Uma barra em português numa página em espanhol é
 * ilegível para quem ouve, e o defeito não aparece na tela de ninguém que
 * enxergue. A leitura é tipada em `media-player.labels.ts`: rótulo ausente
 * reprova no `vue-tsc`, e não em silêncio na tela.
 */
const labels = computed(() => mediaPlayerLabelsFor(locale.value));

// ─── SEO & GEO ────────────────────────────────────────────────────────────────

useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: 'media-player',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
  breadcrumb: [
    { name: 'Components', item: '/components' },
    { name: tContent('category'), item: '/components/display' },
    { name: tContent('title') },
  ],
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'media-player',
    locale: newLocale as 'pt-BR' | 'en' | 'es',
    page_title: tContent('seo.title'),
  });
}, { immediate: true });

// ─── Demonstração ─────────────────────────────────────────────────────────────
//
// Trocar de fonte REMONTA o player, e aqui isso é correto: a fonte decide o
// motor, e motor não se troca em voo — um `<video>` não vira `<iframe>`. O
// `:key` é o que força a remontagem, e com ela a limpeza: sem isso o áudio que
// saiu de cena continuaria tocando e o quadro do provedor continuaria baixando.

/** As quatro fontes, na ordem em que o conteúdo as lista. */
const SOURCE_KEYS = ['video', 'audio', 'youtube', 'vimeo'] as const;
type SourceKey = typeof SOURCE_KEYS[number];

const demoSource = ref<SourceKey>('video');

/**
 * A mídia de cada fonte, montada em memória.
 *
 * Vídeo por canvas e áudio por WAV — nada baixado, nada de rede. Os dois
 * provedores são identificadores públicos, e são os únicos casos desta página
 * em que o navegador de quem lê vai à rede: é o que a fonte É.
 *
 * `rates: []` na fonte ao vivo porque nela a velocidade de reprodução é
 * ignorada — medido. Oferecer o seletor seria dar um controle que a pessoa
 * mexe e não acontece nada.
 */
const demoOptions = computed(() => {
  switch (demoSource.value) {
    case 'video':
      return { kind: 'video' as const, stream: canvasStream(), rates: [], tracks: [captionTrack()] };
    case 'audio':
      return { kind: 'audio' as const, src: silentWav(DEMO_SECONDS) };
    case 'youtube':
      return { embed: { provider: 'youtube' as const, videoId: YOUTUBE_VIDEO_ID } };
    default:
      return { embed: { provider: 'vimeo' as const, videoId: VIMEO_VIDEO_ID } };
  }
});

/**
 * Os quatro controles da demonstração, cada um marcado para o observer.
 *
 * O evento sai do PRÓPRIO botão. A seção de demonstração é um container
 * auto-instrumentado (`data-track-container`), e o observer resolve por
 * `.closest('[data-track]')`: um controle sem marcação própria fazia o clique
 * subir até a seção, e o container disparava um SEGUNDO `docs_demo_click` com
 * `element_id` tirado do texto traduzido — o mesmo clique virava dois eventos
 * no GA4, e um deles partido em três idiomas.
 */
const demoControls = computed(() =>
  SOURCE_KEYS.map((key) => ({
    key,
    label: tContent(`demonstration.labels.${key}`),
    pressed: demoSource.value === key,
  })),
);

function selectSource(key: SourceKey): void {
  demoSource.value = key;
}

// ─── Do & Don't, par 1: a mesma reprodução contada de dois jeitos ─────────────
//
// À esquerda o contador escuta o MOTOR (`@play`); à direita, o clique no botão
// da barra. Com um clique os dois marcam um. A diferença aparece quando a
// reprodução parte de outro caminho — e o botão "Tocar por fora" é exatamente
// esse caminho: ele chama `play()` no elemento, como faria uma tecla de mídia,
// a janela flutuante ou o controle do sistema. O contador da esquerda sobe; o
// da direita fica onde estava.

type CounterSide = 'engine' | 'click';

const playCounts = ref<Record<CounterSide, number>>({ engine: 0, click: 0 });
const enginePlayer = ref<MediaPlayerInstance | null>(null);
const clickPlayer = ref<MediaPlayerInstance | null>(null);

// ─── Mídia dos previews, montada UMA VEZ ─────────────────────────────────────
//
// Fora do template de propósito: `:stream="canvasStream()"` numa ligação abre
// um canvas novo a cada repintura da página, e cada um deles fica com a própria
// trilha viva. O mesmo vale para as listas — identidade nova a cada ciclo faz o
// componente rever a faixa de legenda sem que nada tenha mudado.

const AUDIO_SRC = silentWav(DEMO_SECONDS);
const CAPTIONS = [captionTrack()];
/** O contra-exemplo do segundo par: o mesmo vídeo, sem faixa nenhuma. */
const NO_CAPTIONS: MediaPlayerTrack[] = [];
const DO_STREAM = canvasStream();
const DONT_STREAM = canvasStream();
const VARIANT_STREAM = canvasStream();

function playOutside(side: CounterSide): void {
  const media = (side === 'engine' ? enginePlayer.value : clickPlayer.value)?.media;
  if (!media) return;
  media.muted = true;
  media.currentTime = 0;
  void media.play().catch(() => undefined);
}

/**
 * O contador errado: escuta o CLIQUE no botão da barra, e por isso não vê nada
 * do que não passa por ele.
 *
 * A escuta é no invólucro e filtra pelo PRIMEIRO botão da barra — o de tocar.
 * Contar qualquer botão faria o silenciar somar reprodução, e o
 * contra-exemplo passaria a errar por um segundo motivo.
 */
function countBarClick(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  const controls = target.closest('[data-slot="media-player-controls"]');
  const playButton = controls?.querySelector('button');
  if (playButton && playButton.contains(target)) playCounts.value.click += 1;
}

// ─── Navegação ────────────────────────────────────────────────────────────────

const navGroups = computed(() => [
  {
    label: tContent('nav.overview'),
    sections: [
      { id: 'demonstracao', label: tContent('nav.demonstration') },
      { id: 'anatomia',     label: tContent('nav.anatomy')       },
      { id: 'quando-usar',  label: tContent('nav.usage')         },
      { id: 'do-dont',      label: tContent('nav.doDont')        },
    ],
  },
  {
    label: tContent('nav.techRef'),
    sections: [
      { id: 'importacao',   label: tContent('nav.import')   },
      { id: 'variantes',    label: tContent('nav.variants') },
      { id: 'estados',      label: tContent('nav.states')   },
      { id: 'propriedades', label: tContent('nav.props')    },
      { id: 'tokens',       label: tContent('nav.tokens')   },
    ],
  },
  {
    label: tNav('nav.context'),
    sections: [
      { id: 'acessibilidade', label: tContent('nav.accessibility') },
      { id: 'relacionados',   label: tContent('nav.related')       },
      { id: 'notas',          label: tContent('nav.notes')         },
    ],
  },
  {
    label: tNav('nav.quality'),
    sections: [
      { id: 'analytics', label: tContent('nav.analytics') },
      { id: 'testes',    label: tContent('nav.testes')    },
    ],
  },
]);

const allSectionIds = computed(() => navGroups.value.flatMap((g) => g.sections.map((s) => s.id)));

const { activeId: activeSection } = useActiveSection(allSectionIds, (id) => {
  track('docs_section_viewed', {
    section_id: id,
    component_name: 'media-player',
    locale: locale.value,
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function localPriority(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

/** Chaves da tabela de propriedades, na ordem do contrato. */
const PROP_KEYS = [
  'kind', 'src', 'stream', 'embed', 'tracks', 'rates', 'labels',
  'onPlay', 'onPause', 'onEnded',
];

/** Chaves da tabela de tokens, na ordem em que o conteúdo as declara. */
const TOKEN_KEYS = [
  'border', 'background', 'muted', 'mutedForeground', 'foreground',
  'primary', 'accent', 'ring', 'spacing6',
];

/** Estados descritos pelo conteúdo compartilhado, na ordem em que ele os lista. */
const STATE_KEYS = ['idle', 'playing', 'live', 'ended', 'refused', 'unavailable'];

// ─── Código exibido ───────────────────────────────────────────────────────────

const interfaceCode = `interface MediaPlayerProps {
  kind?: 'video' | 'audio';           // padrão: 'video'
  src?: string;
  stream?: MediaStream;
  embed?: { provider: 'youtube' | 'vimeo'; videoId: string; hash?: string };
  tracks?: MediaPlayerTrack[];
  rates?: number[];                   // padrão: [0.5, 0.75, 1, 1.25, 1.5, 2]
  labels: MediaPlayerLabels;          // obrigatório
}

// Emits
//   (e: 'play'): void
//   (e: 'pause', info: { ended: boolean; currentTime: number }): void
//   (e: 'ended'): void

// Exposto pela instância — um dos dois é SEMPRE nulo
//   media: HTMLMediaElement | null
//   frame: HTMLIFrameElement | null`;

// ─── Dados das seções ─────────────────────────────────────────────────────────

const anatomyItems = computed(() =>
  [1, 2, 3, 4, 5, 6, 7].map((i) => tContent(`anatomy.item${i}`)),
);

const guidelineItems = computed(() =>
  [1, 2, 3, 4, 5].map((i) => tContent(`usage.guidelines.item${i}`)),
);

const scenarioItems = computed(() =>
  [1, 2, 3, 4, 5].map((i) => ({
    s: tContent(`usage.scenarios.item${i}.s`),
    u: tContent(`usage.scenarios.item${i}.u`),
    a: tContent(`usage.scenarios.item${i}.a`),
  })),
);

const variantItems = computed(() => {
  // O `name` é a chave ESTÁVEL, não traduzida: é ela que vira `snippet_id` do
  // `docs_code_copy`, e um nome traduzido partiria o mesmo evento em três no
  // GA4.
  const snippets: Record<SourceKey, string> = {
    video: mediaPlayerCaptionsSource(),
    audio: mediaPlayerAudioSource(),
    youtube: mediaPlayerYouTubeSource(),
    vimeo: mediaPlayerVimeoSource(),
  };
  return SOURCE_KEYS.map((key) => ({
    name: tContent(`variants.items.${key}.name`),
    trackId: key,
    description: tContent(`variants.items.${key}.description`),
    code: snippets[key],
  }));
});

const stateItems = computed(() =>
  STATE_KEYS.map((key) => ({
    label: tContent(`states.${key}.label`),
    trigger: tContent(`states.${key}.trigger`),
    behavior: toPlainText(tContent(`states.${key}.behavior`)),
  })),
);

const propItems = computed(() =>
  PROP_KEYS.map((key) => ({
    name: tContent(`props.table.${key}.name`),
    type: tContent(`props.table.${key}.type`),
    defaultValue: tContent(`props.table.${key}.default`),
    required: tContent(`props.table.${key}.required`),
    description: toPlainText(tContent(`props.table.${key}.description`)),
  })),
);

const tokenRows = computed(() =>
  TOKEN_KEYS.map((key) => ({
    token: tContent(`tokens.table.${key}.token`),
    value: tContent(`tokens.table.${key}.value`),
    description: tContent(`tokens.table.${key}.description`),
  })),
);

const accessibilityItems = computed(() =>
  [1, 2, 3, 4, 5, 6, 7, 8].map((i) => tContent(`accessibility.item${i}`)),
);

const keyboardItems = computed(() =>
  ['tab', 'space', 'arrows', 'homeEnd', 'escape'].map((key) => ({
    key: tContent(`accessibility.keyboard.${key}.key`),
    description: tContent(`accessibility.keyboard.${key}.action`),
  })),
);

const relatedItems = computed(() => [
  { name: 'AspectRatio', description: toPlainText(tContent('related.aspectRatio')), path: '?path=/docs/ui-aspectratio--docs' },
  { name: 'Sonner',      description: toPlainText(tContent('related.sonner')),      path: '?path=/docs/ui-sonner--docs'      },
  { name: 'Button',      description: toPlainText(tContent('related.button')),      path: '?path=/docs/ui-button--docs'      },
  { name: 'Card',        description: toPlainText(tContent('related.card')),        path: '?path=/docs/ui-card--docs'        },
]);

const noteItems = computed(() =>
  [1, 2, 3, 4, 5, 6].map((i) => ({ title: '', content: tContent(`notes.tip${i}`) })),
);

const analyticsItems = computed(() =>
  ['pageView', 'sectionViewed', 'demoClick'].map((key) => ({
    event: tContent(`analytics.table.${key}`),
    trigger: toPlainText(tContent(`analytics.table.${key}Trigger`)),
    payload: tContent(`analytics.table.${key}Payload`),
  })),
);

const functionalTestItems = computed(() =>
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => ({
    action: tContent(`testes.functional.item${i}.action`),
    result: tContent(`testes.functional.item${i}.result`),
    priority: localPriority(tContent(`testes.functional.item${i}.priority`)),
  })),
);

// As três sub-seções do conteúdo usam a MESMA forma (`action`/`result`/
// `priority`). Os containers de acessibilidade e de visual foram desenhados
// para outra: aqui cada campo entra no lugar que o preserva, sem descartar
// texto.
const a11yTestItems = computed(() =>
  [1, 2, 3, 4, 5].map((i) => ({
    criterion: tContent(`testes.accessibility.item${i}.action`),
    level: localPriority(tContent(`testes.accessibility.item${i}.priority`)),
    how: tContent(`testes.accessibility.item${i}.result`),
  })),
);

const visualTestItems = computed(() =>
  [1, 2].map((i) => ({
    story: `${tContent(`testes.visual.item${i}.action`)} — ${tContent(`testes.visual.item${i}.result`)}`,
    priority: localPriority(tContent(`testes.visual.item${i}.priority`)),
  })),
);
</script>

<template>
  <DocsPageLayout
    :nav-groups="navGroups"
    :active-section="activeSection"
    component-slug="media-player"
  >
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
      />
    </template>

    <!-- ── Demonstração ─────────────────────────────────────────────── -->
    <DocsDemonstration
      :title="tContent('demonstration.title')"
      component-slug="media-player"
    >
      <div
        class="nds-stack nds-w-full"
        data-spacing="md"
      >
        <div
          class="nds-cluster"
          data-spacing="sm"
          role="group"
          :aria-label="tContent('demonstration.title')"
        >
          <!-- O observer resolve por `.closest('[data-track]')`, e a terceira
               parte do id estruturado vira `element_id`. -->
          <Button
            v-for="control in demoControls"
            :key="control.key"
            type="button"
            variant="outline"
            size="sm"
            :aria-pressed="control.pressed"
            data-track="demo"
            :data-track-id="`media-player:demonstracao:${control.key}`"
            :data-track-label="control.label"
            @click="selectSource(control.key)"
          >
            {{ control.label }}
          </Button>
        </div>

        <MediaPlayer
          :key="demoSource"
          v-bind="demoOptions"
          :labels="labels"
          class="nds-w-full nds-max-w-xl"
        />
      </div>
    </DocsDemonstration>

    <!-- ── Anatomia ─────────────────────────────────────────────────── -->
    <DocsAnatomy
      :title="tContent('anatomy.title')"
      :items="anatomyItems"
      :structure-label="tContent('anatomy.structureLabel')"
      :structure-code="tContent('anatomy.structureCode')"
      language="html"
    />

    <!-- ── Quando Usar ──────────────────────────────────────────────── -->
    <DocsWhenToUse
      :title="tContent('usage.title')"
      :guidelines="{ title: tContent('usage.guidelines.title'), items: guidelineItems }"
      :scenarios="{
        title: tContent('usage.scenarios.title'),
        cols: {
          scenario: tContent('usage.scenarios.cols.scenario'),
          use: tContent('usage.scenarios.cols.use'),
          alternative: tContent('usage.scenarios.cols.alternative'),
        },
        items: scenarioItems,
      }"
      :do="{
        title: tNav('common.do'),
        items: [
          tContent('usage.do.item1'),
          tContent('usage.do.item2'),
          tContent('usage.do.item3'),
          tContent('usage.do.item4'),
        ],
      }"
      :dont="{
        title: tNav('common.dont'),
        items: [
          tContent('usage.dont.item1'),
          tContent('usage.dont.item2'),
          tContent('usage.dont.item3'),
          tContent('usage.dont.item4'),
        ],
      }"
    />

    <!-- ── Do & Don't ───────────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="[
        {
          doLabel: tNav('common.do'),
          dontLabel: tNav('common.dont'),
          doCaption: toPlainText(tContent('doDont.pair1.do')),
          dontCaption: toPlainText(tContent('doDont.pair1.dont')),
        },
        {
          doLabel: tNav('common.do'),
          dontLabel: tNav('common.dont'),
          doCaption: toPlainText(tContent('doDont.pair2.do')),
          dontCaption: toPlainText(tContent('doDont.pair2.dont')),
        },
      ]"
    >
      <!-- Par 1: os dois players são IDÊNTICOS; muda só quem o contador escuta.
           O botão "Tocar por fora" é o caminho que não passa pela barra — como
           uma tecla de mídia ou o controle do sistema — e é ali que os dois
           números deixam de bater. -->
      <template #do-preview-0>
        <div
          class="nds-stack nds-w-full"
          data-spacing="sm"
        >
          <MediaPlayer
            ref="enginePlayer"
            kind="audio"
            :src="AUDIO_SRC"
            :labels="labels"
            class="nds-w-full nds-max-w-xl"
            @play="playCounts.engine += 1"
          />
          <p class="nds-text-body nds-text-muted-foreground">
            {{ tContent('doDont.countLabel') }}: {{ playCounts.engine }}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            @click="playOutside('engine')"
          >
            {{ tContent('doDont.outsideLabel') }}
          </Button>
        </div>
      </template>
      <template #dont-preview-0>
        <div
          class="nds-stack nds-w-full"
          data-spacing="sm"
          @click="countBarClick"
        >
          <MediaPlayer
            ref="clickPlayer"
            kind="audio"
            :src="AUDIO_SRC"
            :labels="labels"
            class="nds-w-full nds-max-w-xl"
          />
          <p class="nds-text-body nds-text-muted-foreground">
            {{ tContent('doDont.countLabel') }}: {{ playCounts.click }}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            @click="playOutside('click')"
          >
            {{ tContent('doDont.outsideLabel') }}
          </Button>
        </div>
      </template>

      <!-- Par 2: o MESMO vídeo, e a única diferença é a faixa declarada. -->
      <template #do-preview-1>
        <MediaPlayer
          kind="video"
          :stream="DO_STREAM"
          :rates="[]"
          :tracks="CAPTIONS"
          :labels="labels"
          class="nds-w-full nds-max-w-xl"
        />
      </template>
      <template #dont-preview-1>
        <MediaPlayer
          kind="video"
          :stream="DONT_STREAM"
          :rates="[]"
          :tracks="NO_CAPTIONS"
          :labels="labels"
          class="nds-w-full nds-max-w-xl"
        />
      </template>
    </DocsDoDont>

    <!-- ── Importação ───────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :description="tContent('import.basic')"
      :code="tContent('import.basicCode')"
      :secondary-description="tContent('import.withProvider')"
      :secondary-code="tContent('import.withProviderCode')"
      component-slug="media-player"
    />

    <!-- ── Fontes ───────────────────────────────────────────────────── -->
    <DocsVariants
      :title="tContent('variants.title')"
      :note="tContent('variants.note')"
      :items="variantItems"
      component-slug="media-player"
    >
      <template #variant-preview-0>
        <MediaPlayer
          kind="video"
          :stream="VARIANT_STREAM"
          :rates="[]"
          :tracks="CAPTIONS"
          :labels="labels"
          class="nds-w-full nds-max-w-xl"
        />
      </template>
      <template #variant-preview-1>
        <MediaPlayer
          kind="audio"
          :src="AUDIO_SRC"
          :labels="labels"
          class="nds-w-full nds-max-w-xl"
        />
      </template>
      <template #variant-preview-2>
        <MediaPlayer
          :embed="{ provider: 'youtube', videoId: YOUTUBE_VIDEO_ID }"
          :labels="labels"
          class="nds-w-full nds-max-w-xl"
        />
      </template>
      <template #variant-preview-3>
        <MediaPlayer
          :embed="{ provider: 'vimeo', videoId: VIMEO_VIDEO_ID }"
          :labels="labels"
          class="nds-w-full nds-max-w-xl"
        />
      </template>
    </DocsVariants>

    <!-- ── Estados ──────────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{
        state: tContent('states.cols.state'),
        trigger: tContent('states.cols.trigger'),
        behavior: tContent('states.cols.behavior'),
      }"
      :items="stateItems"
    />

    <!-- ── Propriedades ─────────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        {
          title: 'MediaPlayer',
          cols: {
            prop: tContent('props.table.prop'),
            type: tContent('props.table.type'),
            default: tContent('props.table.default'),
            required: tContent('props.table.required'),
            description: tContent('props.table.description'),
          },
          items: propItems,
        },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="tContent('props.extensibility')"
      :extensibility-code="tContent('props.extensibilityCode')"
      language="ts"
    />

    <!-- ── Tokens ───────────────────────────────────────────────────── -->
    <DocsTokens
      :title="tContent('tokens.title')"
      :cols="{
        token: tContent('tokens.table.token'),
        value: tContent('tokens.table.value'),
        description: tContent('tokens.table.description'),
      }"
      :items="tokenRows"
      :customization-title="tContent('tokens.customizationTitle')"
      :customization-code="tContent('tokens.customizationCode')"
    />

    <!-- ── Acessibilidade ───────────────────────────────────────────── -->
    <DocsAccessibility
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-title="tContent('accessibility.keyboardTitle')"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ─────────────────────────────────────────────── -->
    <DocsRelated
      :title="tContent('related.title')"
      :items="relatedItems"
      component-slug="media-player"
    />

    <!-- ── Notas ────────────────────────────────────────────────────── -->
    <DocsNotes
      :title="tContent('notes.title')"
      :items="noteItems"
      component-slug="media-player"
    />

    <!-- ── Analytics ────────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :cols="{
        event: tContent('analytics.table.event'),
        trigger: toPlainText(tContent('analytics.table.trigger')),
        payload: tContent('analytics.table.payload'),
      }"
      :items="analyticsItems"
    />

    <!-- ── Testes ───────────────────────────────────────────────────── -->
    <DocsTestes
      :title="tContent('testes.title')"
      :functional="{
        title: tContent('testes.functional.title'),
        description: tContent('testes.functional.description'),
        cols: {
          action: tNav('common.userAction'),
          result: tNav('common.expectedResult'),
          priority: tNav('common.priority'),
        },
        items: functionalTestItems,
      }"
      :accessibility="{
        title: tContent('testes.accessibility.title'),
        description: tContent('testes.accessibility.description'),
        cols: {
          criterion: tNav('common.userAction'),
          level: tNav('common.priority'),
          how: tNav('common.expectedResult'),
        },
        items: a11yTestItems,
      }"
      :visual="{
        title: tContent('testes.visual.title'),
        description: tContent('testes.visual.description'),
        cols: {
          story: tNav('common.storyState'),
          priority: tNav('common.priority'),
        },
        items: visualTestItems,
      }"
    />
  </DocsPageLayout>
</template>
