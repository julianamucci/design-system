<script setup lang="ts">
// ─── Media Player ────────────────────────────────────────────────────────────
//
// Um player, DOIS motores, uma API.
//
//   nativo     `<video>` / `<audio>` — propriedade e evento de DOM
//   provedor   `<iframe>` do YouTube ou do Vimeo — conversa por `postMessage`
//
// Quem consome passa os mesmos `labels` e escuta `@play`, `@pause` e `@ended`
// nos dois casos, e vê a mesma barra. Isso só é possível porque a barra ficou
// do nosso lado desde o começo: ela fala com um ESTADO, e cada motor alimenta
// esse estado do jeito que sabe. Trocar o motor não redesenha nada.
//
// Por que o elemento nativo é o padrão: ele já entrega legenda por `<track>`,
// teclado, Media Session, Picture-in-Picture, tela cheia e todos os eventos.
// Por que o provedor existe: nem todo vídeo é nosso para hospedar.
//
// Nenhuma biblioteca de UI por baixo: o motor é o elemento nativo do navegador
// e os provedores são conversados por `postMessage` — sem `iframe_api` e sem
// SDK, o que evita script de terceiro no pacote e uma entrada a mais em
// `script-src`.
import { computed, onBeforeUnmount, onMounted, ref, watch, type HTMLAttributes } from 'vue';
import {
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-vue-next';
import { cn } from '@/lib/utils';
import {
  EMBED_ALLOW,
  buildEmbedUrl,
  embedCommand,
  createEmbedHandshake,
  isFromFrame,
  parseEmbedMessage,
  type EmbedCommand,
  type EmbedSource,
} from './media-embed';
import {
  DEFAULT_RATES,
  formatTime,
  type MediaPauseInfo,
  type MediaPlayerKind,
  type MediaPlayerLabels,
  type MediaPlayerTrack,
} from './index';

// ─── Contrato do componente ─────────────────────────────────────────────────

const props = withDefaults(
  defineProps<{
    kind?: MediaPlayerKind;
    /** Endereço da mídia. Exclusivo com `stream` e com `embed`. */
    src?: string;
    /**
     * Fonte ao vivo — câmera, compartilhamento de tela, canvas.
     *
     * MEDIDO: `playbackRate` é ignorado em stream (1.5 escrito lê de volta 1) e
     * a duração é infinita, então a barra de progresso não tem o que
     * representar — quem usa esta fonte passa `rates: []`.
     */
    stream?: MediaStream;
    /**
     * Vídeo hospedado no YouTube ou no Vimeo.
     *
     * Muda o MOTOR, não a API. O que muda por baixo é que não existe elemento
     * de mídia: existe um `<iframe>` de outra origem, e a conversa é por
     * `postMessage`.
     *
     * O que fica FORA do alcance, e não é contornável: legenda, faixa de áudio
     * e qualidade pertencem ao provedor; a política de privacidade de quem
     * assiste é do provedor; e o Picture-in-Picture depende de a página que
     * hospeda já ter a permissão para delegar ao quadro.
     */
    embed?: EmbedSource;
    poster?: string;
    /** Faixas de legenda. Vídeo com áudio EXIGE ao menos uma — WCAG 1.2.2. */
    tracks?: MediaPlayerTrack[];
    /** Lista vazia esconde o seletor de velocidade. */
    rates?: number[];
    /**
     * Nome acessível do player, da barra e de cada controle.
     *
     * Obrigatório: todo controle é só de ícone, então o rótulo É o que o leitor
     * de tela anuncia. Não há texto visível de onde deduzir nome nenhum.
     */
    labels: MediaPlayerLabels;
    class?: HTMLAttributes['class'];
  }>(),
  { kind: 'video' },
);

const emit = defineEmits<{
  /**
   * A reprodução COMEÇOU de fato.
   *
   * No motor nativo é `playing`, não `play`: `play` avisa que a reprodução foi
   * PEDIDA, e entre o pedido e o primeiro quadro há o buffer. Contar `play`
   * infla a métrica com tentativas que nunca saíram do lugar.
   */
  (e: 'play'): void;
  /** Toda parada — inclusive no fim. Ver `MediaPauseInfo.ended`. */
  (e: 'pause', info: MediaPauseInfo): void;
  (e: 'ended'): void;
}>();

// ─── O que a barra sabe, independentemente de quem informou ─────────────────
//
// Existe porque os dois motores contam a mesma história em línguas diferentes:
// o nativo por propriedade lida na hora, o provedor por mensagem que chega
// quando chega. Sem este intermediário, cada pedaço do template precisaria
// saber qual motor está por baixo — e a barra deixaria de ser uma só.

const playing = ref(false);
const ended = ref(false);
const muted = ref(false);
const currentTime = ref(0);
const duration = ref(Number.NaN);
const rate = ref(1);
/** Há faixa de vídeo? Só o nativo sabe responder; no quadro é uma aposta. */
const hasVideoTrack = ref(false);
const fullscreenOn = ref(false);
const pipOn = ref(false);

const rootRef = ref<HTMLDivElement | null>(null);
const mediaRef = ref<HTMLMediaElement | null>(null);
const frameRef = ref<HTMLIFrameElement | null>(null);

const isVideo = computed(() => props.kind === 'video' || Boolean(props.embed));
const trackList = computed(() => props.tracks ?? []);
const rateList = computed(() => props.rates ?? DEFAULT_RATES);
const kindAttr = computed(() => (props.embed ? props.embed.provider : props.kind));
const embedUrl = computed(() =>
  props.embed ? buildEmbedUrl(props.embed, window.location.origin) : undefined,
);

// Tela cheia e PiP: detecção em tempo de EXECUÇÃO, porque a resposta muda com o
// navegador, com a permissão do iframe que hospeda a página e com o próprio
// elemento. Botão que não faz nada é ruído. São refs, e não computeds, porque a
// pergunta só tem resposta depois de o elemento existir.
const canFullscreen = ref(false);
const canPip = ref(false);

const playingNow = computed(() => playing.value && !ended.value);
const knownDuration = computed(() => Number.isFinite(duration.value) && duration.value > 0);
const clock = computed(() => `${formatTime(currentTime.value)} / ${formatTime(duration.value)}`);
const seekMax = computed(() => (knownDuration.value ? String(duration.value) : '100'));
const seekValue = computed(() => (knownDuration.value ? String(currentTime.value) : '0'));
/**
 * O slider anuncia POSIÇÃO, e "37" não é posição para quem ouve. O texto do
 * valor é o relógio, e o molde vem do CONTEÚDO: era a única string falada com
 * palavra cravada em português.
 */
const seekValueText = computed(() =>
  knownDuration.value
    ? props.labels.seekValueText
        .replace('{current}', formatTime(currentTime.value))
        .replace('{duration}', formatTime(duration.value))
    : undefined,
);

// ─── Os motores alimentam o estado ──────────────────────────────────────────

function started(): void {
  playing.value = true;
  ended.value = false;
  emit('play');
}

function stopped(finishedNow: boolean): void {
  playing.value = false;
  ended.value = finishedNow;
  emit('pause', { ended: finishedNow, currentTime: currentTime.value });
}

function finished(): void {
  ended.value = true;
  playing.value = false;
  emit('ended');
}

// ─── Motor A: o elemento nativo ─────────────────────────────────────────────

function onPause(): void {
  stopped(Boolean(mediaRef.value?.ended));
}

/**
 * Começou de fato.
 *
 * `playing` também é onde a largura do vídeo costuma aparecer numa fonte ao
 * vivo — os primeiros quadros só chegam tocando —, e por isso a leitura da
 * faixa de vídeo anda junto.
 */
function onPlaying(): void {
  started();
  refreshVideoTrack();
}

function onTimeUpdate(): void {
  const media = mediaRef.value;
  if (!media) return;
  currentTime.value = media.currentTime;
  duration.value = media.duration;
}

/**
 * A largura é lida A CADA evento que pode revelá-la, e não guardada por um só.
 *
 * Em stream ao vivo ela aparece quando os primeiros quadros chegam, e isso pode
 * vir por `loadedmetadata`, `loadeddata`, `resize` ou `playing`, conforme a
 * fonte — depender de um deles deixa o botão escondido para sempre no caso em
 * que ele veio por outro.
 *
 * A detecção de capacidade não basta: `pictureInPictureEnabled` responde pelo
 * DOCUMENTO, não pelo conteúdo — um `<video>` alimentado com áudio passa por ela
 * e recusa o pedido com `InvalidStateError` (medido, `videoWidth=0`).
 */
function refreshVideoTrack(): void {
  const media = mediaRef.value as HTMLVideoElement | null;
  hasVideoTrack.value = Boolean(media && media.videoWidth > 0);
}

function onLoadedMetadata(): void {
  const media = mediaRef.value;
  if (!media) return;
  // `loadedmetadata` é quando o conteúdo passa a ser conhecido: é ali que
  // `videoWidth` deixa de ser 0 e se descobre se HÁ faixa de vídeo.
  duration.value = media.duration;
  refreshVideoTrack();
}

function onVolumeChange(): void {
  muted.value = Boolean(mediaRef.value?.muted);
}

function onRateChange(): void {
  rate.value = mediaRef.value?.playbackRate ?? 1;
}

// ─── Motor B: o quadro do provedor ──────────────────────────────────────────

function post(command: EmbedCommand): void {
  const frame = frameRef.value;
  if (!frame || !props.embed) return;
  frame.contentWindow?.postMessage(embedCommand(props.embed.provider, command), '*');
}

function onMessage(event: MessageEvent): void {
  const frame = frameRef.value;
  // A página recebe `message` de QUALQUER origem — outro embed, uma extensão,
  // um anúncio. Sem conferir a fonte, um segundo player na mesma página pausa o
  // primeiro.
  if (!frame || !props.embed || !isFromFrame(event, frame)) return;
  // Qualquer resposta do provedor encerra a insistência do aperto de mão.
  handshake?.observe(event.data);
  // Lista, e não um evento só: uma mensagem do provedor carrega mais de uma
  // notícia — o `infoDelivery` do YouTube traz estado e tempo juntos.
  for (const parsed of parseEmbedMessage(props.embed.provider, event.data)) {
    if (parsed.type === 'playing') started();
    else if (parsed.type === 'paused') stopped(false);
    else if (parsed.type === 'ended') finished();
    else {
      // Só o que VEIO. O provedor avisa o que mudou, não o estado inteiro:
      // sobrescrever com `undefined` apagaria a duração a cada atualização de
      // posição, e o relógio voltaria a `--:--` no meio do vídeo.
      if (parsed.currentTime !== undefined) currentTime.value = parsed.currentTime;
      if (parsed.duration !== undefined) duration.value = parsed.duration;
    }
  }
}

/**
 * O aperto de mão: sem ele nenhum dos dois provedores envia evento algum.
 *
 * É o passo que costuma faltar, e o sintoma é "os comandos funcionam mas nada
 * volta".
 */
let handshake: ReturnType<typeof createEmbedHandshake> | null = null;

function onFrameLoad(): void {
  const frame = frameRef.value;
  if (!frame || !props.embed) return;
  handshake?.stop();
  handshake = createEmbedHandshake(props.embed.provider, (message) => {
    frame.contentWindow?.postMessage(message, '*');
  });
  handshake.start();
}

/**
 * O aperto de mão insiste por dez segundos: um player desmontado antes de o
 * provedor responder deixaria um temporizador batendo num quadro que já foi.
 */
onBeforeUnmount(() => handshake?.stop());

// ─── Os controles falam com o motor ─────────────────────────────────────────

function togglePlay(): void {
  const shouldPlay = !playing.value || ended.value;
  const media = mediaRef.value;
  if (media) {
    // A promessa PODE ser recusada — a política de autoplay nega `play()` sem
    // ativação do usuário. Engolir a recusa deixaria o botão mentindo; aqui a
    // barra volta a ler o motor, que é a única verdade que ela tem.
    if (shouldPlay) void media.play().catch(() => { playing.value = !media.paused; });
    else media.pause();
    return;
  }
  post({ kind: shouldPlay ? 'play' : 'pause' });
  // No quadro não há resposta síncrona: o estado só muda quando a mensagem do
  // provedor voltar. Mexer no estado aqui seria adivinhar.
}

function onSeek(event: Event): void {
  const value = Number((event.target as HTMLInputElement).value);
  if (mediaRef.value) mediaRef.value.currentTime = value;
  else post({ kind: 'seek', value });
}

function toggleMute(): void {
  const next = !muted.value;
  if (mediaRef.value) {
    mediaRef.value.muted = next;
    return;
  }
  // O provedor não avisa mudança de volume: o estado é nosso para manter.
  muted.value = next;
  post({ kind: 'mute', value: next });
}

function onRateSelect(event: Event): void {
  const value = Number((event.target as HTMLSelectElement).value);
  if (mediaRef.value) mediaRef.value.playbackRate = value;
  else {
    rate.value = value;
    post({ kind: 'rate', value });
  }
}

function syncFullscreen(): void {
  fullscreenOn.value = document.fullscreenElement === rootRef.value;
}

/**
 * A tela cheia é da MOLDURA, não do vídeo nem do quadro.
 *
 * Pedindo no `<video>`, o navegador passa a desenhar os controles dele — ou
 * nenhum — e a nossa barra desaparece justamente quando a tela é maior. No
 * quadro seria pior: entraria em tela cheia o player do provedor, com a
 * aparência dele. Na moldura, superfície e controles crescem juntos.
 */
function toggleFullscreen(): void {
  if (document.fullscreenElement === rootRef.value) {
    void document.exitFullscreen().catch(syncFullscreen);
  } else {
    void rootRef.value?.requestFullscreen().catch(syncFullscreen);
  }
}

function syncPip(): void {
  pipOn.value = document.pictureInPictureElement === mediaRef.value;
}

/**
 * A recusa não pode ser SILENCIOSA: engolir o erro transforma um pedido negado
 * em "clico e nada acontece", e o nome do erro diz o que houve —
 * `InvalidStateError` é falta de faixa de vídeo, `NotAllowedError` é falta de
 * ativação do usuário.
 */
function refusedPip(error: unknown): void {
  syncPip();
  refreshVideoTrack();
  if (import.meta.env?.DEV) {
    console.warn(`[nds-media-player] Picture-in-Picture recusado: ${(error as Error).name}`);
  }
}

function togglePip(): void {
  const video = mediaRef.value as HTMLVideoElement | null;
  if (!video) return;
  if (document.pictureInPictureElement === video) {
    void document.exitPictureInPicture().catch(refusedPip);
  } else {
    void video.requestPictureInPicture().catch(refusedPip);
  }
}

// ─── Montagem, troca de fonte e limpeza ─────────────────────────────────────

/**
 * Solta a mídia que sai de cena.
 *
 * Um elemento removido do documento continua baixando, e um áudio removido
 * continua TOCANDO. Fonte ao vivo se solta pelo `srcObject`, e as trilhas param
 * uma a uma: `removeAttribute('src')` não alcança stream, e uma câmera aberta
 * continuaria gravando com o player já fora da tela.
 */
function releaseMedia(media: HTMLMediaElement): void {
  media.pause();
  const stream = media.srcObject as MediaStream | null;
  if (stream) {
    for (const track of stream.getTracks()) track.stop();
    media.srcObject = null;
  }
  media.removeAttribute('src');
  media.load();
}

/** A fonte ao vivo não cabe em atributo: `srcObject` só existe como propriedade. */
function attachStream(): void {
  const media = mediaRef.value;
  if (!media) return;
  if (props.stream) media.srcObject = props.stream;
  else if (media.srcObject) media.srcObject = null;
}

function detectCapabilities(): void {
  const video = mediaRef.value as HTMLVideoElement | null;
  canFullscreen.value =
    isVideo.value
    && document.fullscreenEnabled
    && typeof rootRef.value?.requestFullscreen === 'function';
  canPip.value =
    !props.embed
    && props.kind === 'video'
    && document.pictureInPictureEnabled
    && typeof video?.requestPictureInPicture === 'function'
    && !video.disablePictureInPicture;
}

function warnMissingCaptions(): void {
  if (props.kind === 'video' && !props.embed && trackList.value.length === 0 && import.meta.env?.DEV) {
    // Aviso, não exceção: quebrar a página por falta de legenda esconderia o
    // conteúdo de todo mundo para punir a falta de acesso de alguns.
    console.warn(
      '[nds-media-player] vídeo sem faixa de legenda. WCAG 1.2.2 (nível A) exige '
        + 'legenda para vídeo com áudio — passe `tracks`.',
    );
  }
}

/**
 * O elemento de mídia entrou em cena — na montagem ou trocando de motor.
 *
 * Trocar de fonte troca o MOTOR, e motor não se troca em voo: um `<video>` não
 * vira `<audio>`. O elemento anterior é solto de propósito — sem isto o áudio
 * que saiu da tela continuaria tocando e a câmera continuaria aberta —, e o
 * estado volta ao ponto de partida, porque um elemento novo nasce sem som
 * cortado, na velocidade 1 e sem duração conhecida.
 *
 * É UM SÓ lugar, e não também o `onMounted`, porque a troca passa por
 * `null` no meio (o v-if desmonta antes de montar): dividir o trabalho entre os
 * dois faria a montagem inicial avisar duas vezes sobre a legenda que falta.
 */
watch(mediaRef, (fresh, previous) => {
  if (previous && previous !== fresh) releaseMedia(previous);
  if (!fresh) return;
  playing.value = false;
  ended.value = false;
  muted.value = fresh.muted;
  currentTime.value = 0;
  duration.value = Number.NaN;
  rate.value = fresh.playbackRate;
  hasVideoTrack.value = false;
  attachStream();
  detectCapabilities();
  warnMissingCaptions();
// `post` porque o trabalho aqui LÊ o DOM — `videoWidth`, `requestFullscreen`,
// `requestPictureInPicture` —, e leitura antes da atualização mede o elemento
// que está saindo.
}, { flush: 'post' });

watch(() => props.stream, attachStream);

onMounted(() => {
  // Também aqui, e não só no observador acima: no motor de quadro não existe
  // elemento de mídia, e sem esta chamada o botão de tela cheia nunca
  // apareceria num provedor externo.
  detectCapabilities();
  // Os dois ouvintes moram FORA da moldura: `fullscreenchange` é do documento e
  // `message` é da janela, e nenhum dos dois se solta ao remover o nó.
  //
  // O de tela cheia é assinado SEM condição: a capacidade só é conhecida
  // depois que o elemento existe, e condicionar a assinatura a ela obrigaria a
  // assinar e desassinar a cada troca de motor. `syncFullscreen` é uma
  // comparação de identidade — custa menos do que a condição custaria.
  document.addEventListener('fullscreenchange', syncFullscreen);
  if (props.embed) window.addEventListener('message', onMessage);
});

onBeforeUnmount(() => {
  if (mediaRef.value) releaseMedia(mediaRef.value);
  // Trocar o `src` por vazio é o que de fato para o vídeo do provedor: a
  // remoção do nó não garante que o documento de dentro pare, e vídeo tocando
  // em quadro invisível é o defeito clássico de embed.
  if (frameRef.value) frameRef.value.src = 'about:blank';
  document.removeEventListener('fullscreenchange', syncFullscreen);
  window.removeEventListener('message', onMessage);
});

defineExpose({ media: mediaRef, frame: frameRef });
</script>

<template>
  <!-- `group` e não `region`: o player é um agrupamento de controles, e `region`
       entraria na lista de marcos da página — um player por artigo poluiria a
       navegação por marco de quem usa leitor de tela. -->
  <div
    ref="rootRef"
    data-slot="media-player"
    :data-kind="kindAttr"
    role="group"
    :aria-label="props.labels.player"
    :class="cn('nds-media-player', props.class)"
  >
    <!-- SEM `controls`: os controles nativos apareceriam junto dos nossos. -->
    <video
      v-if="!props.embed && props.kind === 'video'"
      ref="mediaRef"
      class="nds-media-player-surface"
      preload="metadata"
      :src="props.stream ? undefined : props.src"
      :poster="props.poster"
      @playing="onPlaying"
      @pause="onPause"
      @ended="finished"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @loadeddata="refreshVideoTrack"
      @resize="refreshVideoTrack"
      @volumechange="onVolumeChange"
      @ratechange="onRateChange"
      @enterpictureinpicture="syncPip"
      @leavepictureinpicture="syncPip"
    >
      <track
        v-for="captions in trackList"
        :key="captions.src"
        kind="captions"
        :src="captions.src"
        :srclang="captions.srclang"
        :label="captions.label"
        :default="captions.default"
      >
    </video>

    <audio
      v-else-if="!props.embed"
      ref="mediaRef"
      class="nds-media-player-surface"
      preload="metadata"
      :src="props.stream ? undefined : props.src"
      @playing="started"
      @pause="onPause"
      @ended="finished"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @volumechange="onVolumeChange"
      @ratechange="onRateChange"
    >
      <track
        v-for="captions in trackList"
        :key="captions.src"
        kind="captions"
        :src="captions.src"
        :srclang="captions.srclang"
        :label="captions.label"
        :default="captions.default"
      >
    </audio>

    <!-- O quadro tem nome próprio: sem `title` o leitor de tela anuncia apenas
         "quadro", e uma página com três vídeos vira três "quadro".

         `sandbox` NÃO entra, e a ausência é decisão: os dois provedores
         precisam de scripts e de mesma origem consigo mesmos, e um sandbox que
         os permita não restringe nada — seria teatro. O que de fato limita é o
         `allow`. -->
    <iframe
      v-else
      ref="frameRef"
      class="nds-media-player-surface"
      :src="embedUrl"
      :allow="EMBED_ALLOW"
      :title="props.labels.player"
      frameborder="0"
      loading="lazy"
      @load="onFrameLoad"
    />

    <!-- `group`, e não `toolbar`: barra de ferramentas promete navegação por
         seta, e aqui a seta pertence à barra de progresso, que a usa para
         avançar a mídia. -->
    <div
      data-slot="media-player-controls"
      class="nds-media-player-controls"
      role="group"
      :aria-label="props.labels.controls"
    >
      <button
        type="button"
        class="nds-media-player-button"
        :aria-label="playingNow ? props.labels.pause : props.labels.play"
        @click="togglePlay"
      >
        <component
          :is="playingNow ? Pause : Play"
          aria-hidden="true"
        />
      </button>

      <input
        type="range"
        class="nds-media-player-seek"
        min="0"
        step="0.1"
        :max="seekMax"
        :value="seekValue"
        :aria-label="props.labels.seek"
        :aria-valuetext="seekValueText"
        @input="onSeek"
      >

      <span
        class="nds-media-player-time"
        data-slot="media-player-time"
      >{{ clock }}</span>

      <!-- Um `<select>` nativo, e não um menu desenhado: já é operável por
           teclado, já anuncia opção e valor, já se comporta como a plataforma
           manda no toque. -->
      <select
        class="nds-media-player-rate"
        data-slot="media-player-rate"
        :aria-label="props.labels.rate"
        :hidden="rateList.length === 0"
        :value="String(rate)"
        @change="onRateSelect"
      >
        <!-- `1×`, e não `1`: sozinho o número não diz de que grandeza se fala. -->
        <option
          v-for="option in rateList"
          :key="option"
          :value="String(option)"
        >
          {{ option }}×
        </option>
      </select>

      <button
        type="button"
        class="nds-media-player-button"
        :aria-label="muted ? props.labels.unmute : props.labels.mute"
        @click="toggleMute"
      >
        <component
          :is="muted ? VolumeX : Volume2"
          aria-hidden="true"
        />
      </button>

      <!-- Nasce escondido e é revelado quando se souber que HÁ faixa de vídeo.
           Escondido primeiro e revelado depois, e não o contrário: mostrar para
           depois esconder faria a barra saltar quando os metadados chegassem.

           No provedor o botão nem existe: quem tem a faixa de vídeo é o
           documento dentro do quadro, e ele é de outra origem — não há como
           pedir daqui. O provedor oferece o dele, dentro do próprio quadro. -->
      <button
        v-if="canPip"
        type="button"
        class="nds-media-player-button"
        :hidden="!hasVideoTrack"
        :aria-label="pipOn ? props.labels.exitPip : props.labels.enterPip"
        @click="togglePip"
      >
        <PictureInPicture2 aria-hidden="true" />
      </button>

      <button
        v-if="canFullscreen"
        type="button"
        class="nds-media-player-button"
        :aria-label="fullscreenOn ? props.labels.exitFullscreen : props.labels.enterFullscreen"
        @click="toggleFullscreen"
      >
        <component
          :is="fullscreenOn ? Minimize : Maximize"
          aria-hidden="true"
        />
      </button>
    </div>
  </div>
</template>
