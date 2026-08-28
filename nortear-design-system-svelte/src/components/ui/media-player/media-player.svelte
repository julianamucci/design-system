<script lang="ts" module>
  // ─── Media Player ──────────────────────────────────────────────────────────
  //
  // Um player, DOIS motores, uma API.
  //
  //   nativo     `<video>` / `<audio>` — propriedade e evento de DOM
  //   provedor   `<iframe>` do YouTube ou do Vimeo — conversa por `postMessage`
  //
  // Quem consome passa os mesmos `labels`, `onplay`, `onpause` e `onended` nos
  // dois casos, e vê a mesma barra. Isso só é possível porque a barra ficou do
  // nosso lado desde o começo: ela fala com um ESTADO, e cada motor alimenta
  // esse estado do jeito que sabe. Trocar o motor não redesenha nada.
  //
  // Por que o elemento nativo é o padrão: ele já entrega legenda por `<track>`,
  // teclado, Media Session, Picture-in-Picture, tela cheia e todos os eventos.
  // Por que o provedor existe: nem todo vídeo é nosso para hospedar.
  //
  // Nesta stack o ESTADO é o que as runes guardam, e a marcação é derivada dele
  // — não há função de pintura. É a mesma ideia do primitivo de referência
  // escrita na forma que o framework oferece: lá cada função de pintura relê o
  // estado e reescreve o nó; aqui a releitura é o compilador que faz.
  import type { EmbedSource } from './media-embed';

  export type MediaPlayerKind = 'video' | 'audio';

  /** Faixa de legenda. Vídeo com áudio EXIGE ao menos uma — WCAG 1.2.2, nível A. */
  export type MediaPlayerTrack = {
    src: string;
    srclang: string;
    label: string;
    default?: boolean;
  };

  export type MediaPlayerLabels = {
    player: string;
    controls: string;
    play: string;
    pause: string;
    mute: string;
    unmute: string;
    seek: string;
    /**
     * O que o slider ANUNCIA, como molde: `{current}` e `{duration}` viram os
     * dois relógios. É molde, e não conector solto, porque a ordem dos dois
     * tempos e a palavra entre eles são decisão de cada idioma. Antes desta
     * chave o conector estava cravado em pt-BR, e numa página em inglês quem
     * ouve recebia uma preposição em português entre dois relógios.
     */
    seekValueText: string;
    rate: string;
    enterFullscreen: string;
    exitFullscreen: string;
    enterPip: string;
    exitPip: string;
  };

  /**
   * O que se sabe quando a reprodução para.
   *
   * `ended` existe porque MEDIDO: o navegador dispara `pause` também quando a
   * mídia TERMINA, e antes do `ended` — `play > playing > pause > ended`. Quem
   * contar `pause` sem olhar isto conta toda reprodução completa como uma
   * pausa, e o erro é silencioso porque o número continua plausível.
   */
  export type MediaPauseInfo = {
    ended: boolean;
    currentTime: number;
  };

  export type MediaPlayerProps = {
    kind?: MediaPlayerKind;
    /** Endereço da mídia. */
    src?: string;
    /**
     * Fonte ao vivo — câmera, compartilhamento de tela, canvas.
     *
     * MEDIDO: `playbackRate` é ignorado em stream (1.5 escrito lê de volta 1) e
     * a duração é infinita, então a barra de progresso não tem o que
     * representar.
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
    tracks?: MediaPlayerTrack[];
    rates?: number[];
    labels: MediaPlayerLabels;
    /**
     * Disparado quando a reprodução COMEÇA de fato.
     *
     * No motor nativo é `playing`, não `play`: `play` avisa que a reprodução
     * foi PEDIDA, e entre o pedido e o primeiro quadro há o buffer. Contar
     * `play` infla a métrica com tentativas que nunca saíram do lugar.
     */
    onplay?: () => void;
    /** Disparado em toda parada — inclusive no fim. Ver `MediaPauseInfo.ended`. */
    onpause?: (info: MediaPauseInfo) => void;
    onended?: () => void;
    class?: string;
  };

  /**
   * A moldura, com o motor que ela montou pendurado.
   *
   * Um dos dois é sempre nulo, e o tipo obriga quem consome a declarar qual
   * espera: sem isso alguém escreve `player.media.currentTime` num provedor e
   * descobre em produção que ali não existe mídia nenhuma.
   */
  export type MediaPlayerRootElement = HTMLDivElement & {
    /** O elemento nativo — `null` quando a fonte é provedor externo. */
    media: HTMLMediaElement | null;
    /** O quadro — `null` quando a fonte é nativa. */
    frame: HTMLIFrameElement | null;
  };

  /** `83` vira `1:23`. Duração desconhecida vira `--:--`, não `NaN:aN`. */
  export function formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
    const total = Math.floor(seconds);
    const minutes = Math.floor(total / 60);
    const rest = total % 60;
    return `${minutes}:${String(rest).padStart(2, '0')}`;
  }

  const DEFAULT_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];
</script>

<script lang="ts">
  import { untrack } from 'svelte';
  import Maximize from '@lucide/svelte/icons/maximize';
  import Minimize from '@lucide/svelte/icons/minimize';
  import Pause from '@lucide/svelte/icons/pause';
  import PictureInPicture2 from '@lucide/svelte/icons/picture-in-picture-2';
  import Play from '@lucide/svelte/icons/play';
  import Volume2 from '@lucide/svelte/icons/volume-2';
  import VolumeX from '@lucide/svelte/icons/volume-x';
  import { cn } from '@/lib/utils';
  import {
    buildEmbedUrl,
    EMBED_ALLOW,
    embedCommand,
    createEmbedClock,
    createEmbedHandshake,
    isFromFrame,
    parseEmbedMessage,
    type EmbedCommand,
  } from './media-embed';

  let {
    kind = 'video',
    src,
    stream,
    embed,
    poster,
    tracks = [],
    rates = DEFAULT_RATES,
    labels,
    onplay,
    onpause,
    onended,
    class: className,
  }: MediaPlayerProps = $props();

  let rootEl = $state<HTMLDivElement | null>(null);
  let mediaEl = $state<HTMLMediaElement | null>(null);
  let frameEl = $state<HTMLIFrameElement | null>(null);

  // ─── O que a barra sabe, independentemente de quem informou ────────────────
  //
  // Os dois motores contam a mesma história em línguas diferentes: o nativo por
  // propriedade lida na hora, o provedor por mensagem que chega quando chega.
  // Sem este intermediário, cada pedaço da marcação precisaria saber qual motor
  // está por baixo — e a barra deixaria de ser uma só.
  let playing = $state(false);
  let ended = $state(false);
  let muted = $state(false);
  let currentTime = $state(0);
  let duration = $state(Number.NaN);
  let rate = $state(1);
  /** Há faixa de vídeo? Só o nativo sabe responder; no quadro é uma aposta. */
  let hasVideoTrack = $state(false);
  let fullscreenActive = $state(false);
  let pipActive = $state(false);

  const isVideo = $derived(kind === 'video' || Boolean(embed));
  const isPlaying = $derived(playing && !ended);
  const hasDuration = $derived(Number.isFinite(duration) && duration > 0);

  // O slider anuncia POSIÇÃO, e "37" não é posição para quem ouve. O texto do
  // valor é o relógio, e o molde vem do CONTEÚDO: era a única string falada com
  // palavra cravada em português.
  const seekValueText = $derived(
    labels.seekValueText
      .replace('{current}', formatTime(currentTime))
      .replace('{duration}', formatTime(duration)),
  );

  // Tela cheia e janela flutuante: detecção em tempo de EXECUÇÃO, porque a
  // resposta muda com o navegador, com a permissão do iframe que hospeda a
  // página e com o próprio elemento. Botão que não faz nada é ruído.
  //
  // No provedor, a janela flutuante fica de fora: quem tem a faixa de vídeo é o
  // documento dentro do quadro, e ele é de outra origem — não há como pedir
  // daqui. O provedor oferece a dele, dentro do próprio quadro.
  const canFullscreen = $derived(
    isVideo
    && document.fullscreenEnabled
    && typeof HTMLDivElement.prototype.requestFullscreen === 'function',
  );
  const canPip = $derived(
    !embed
    && kind === 'video'
    && document.pictureInPictureEnabled
    && typeof HTMLVideoElement.prototype.requestPictureInPicture === 'function'
    && !(mediaEl as HTMLVideoElement | null)?.disablePictureInPicture,
  );

  // O botão de janela flutuante só entra na barra quando se SABE que há faixa
  // de vídeo. A detecção de capacidade não basta: `pictureInPictureEnabled`
  // responde pelo DOCUMENTO, não pelo conteúdo — um `<video>` alimentado com
  // áudio passa por ela e recusa o pedido com `InvalidStateError` (medido,
  // `videoWidth` em 0). Era o botão que "não fazia nada" na tela.
  //
  // Aqui ele é MONTADO quando a largura aparece, em vez de nascer com o
  // atributo `hidden` e ser revelado depois. A diferença é medida: `[hidden]`
  // é regra da folha de agente de usuário, e `.nds-media-player-button` declara
  // `display: inline-flex` — declaração de autor vence agente de usuário, então
  // o atributo não esconderia nada. O efeito na tela é o que a referência
  // pretende: a barra não salta, porque o botão nunca ocupou espaço antes de a
  // largura chegar.
  const showsPip = $derived(canPip && hasVideoTrack);

  // ─── O motor nativo alimenta o estado ──────────────────────────────────────

  function started(): void {
    playing = true;
    ended = false;
    // No provedor a posição é PERGUNTADA enquanto toca; no motor nativo isto
    // não faz nada. Ver `createEmbedClock`.
    providerClock?.start();
    onplay?.();
  }

  function stopped(finished: boolean): void {
    playing = false;
    ended = finished;
    providerClock?.stop();
    onpause?.({ ended: finished, currentTime });
  }

  function finish(): void {
    ended = true;
    playing = false;
    providerClock?.stop();
    onended?.();
  }

  /**
   * A largura é lida NA HORA, e não guardada por um evento específico.
   *
   * Em stream ao vivo ela só aparece quando os primeiros quadros chegam, e isso
   * pode vir por `loadedmetadata`, `loadeddata`, `resize` ou `playing`,
   * conforme a fonte — depender de um deles deixa o botão escondido para sempre
   * no caso em que ele veio por outro.
   */
  function readVideoTrack(): void {
    hasVideoTrack = ((mediaEl as HTMLVideoElement | null)?.videoWidth ?? 0) > 0;
  }

  function onMediaPause(): void {
    stopped(mediaEl?.ended === true);
  }

  function onTimeUpdate(): void {
    if (!mediaEl) return;
    currentTime = mediaEl.currentTime;
    duration = mediaEl.duration;
  }

  // `loadedmetadata` é quando o conteúdo passa a ser conhecido: é ali que
  // `videoWidth` deixa de ser 0 e se descobre se HÁ faixa de vídeo.
  function onLoadedMetadata(): void {
    if (!mediaEl) return;
    duration = mediaEl.duration;
    readVideoTrack();
  }

  function onVolumeChange(): void {
    muted = mediaEl?.muted === true;
  }

  function onRateChanged(): void {
    rate = mediaEl?.playbackRate ?? 1;
  }

  // ─── O motor de quadro alimenta o mesmo estado ─────────────────────────────

  function post(command: EmbedCommand): void {
    if (!frameEl || !embed) return;
    frameEl.contentWindow?.postMessage(embedCommand(embed.provider, command), '*');
  }

  let handshake: ReturnType<typeof createEmbedHandshake> | null = null;
  /**
   * O relógio que pergunta a posição enquanto o provedor toca. Só o Vimeo
   * precisa — ver `createEmbedClock`.
   */
  let providerClock: ReturnType<typeof createEmbedClock> | null = null;

  function onFrameLoad(): void {
    // O aperto de mão: sem ele nenhum dos dois provedores envia evento algum.
    // É o passo que costuma faltar, e o sintoma é "os comandos funcionam mas
    // nada volta" — que foi exatamente o que se viu na tela.
    //
    // `start()` INSISTE até o provedor responder. Mandar uma vez não bastava: o
    // `load` do iframe é o documento do provedor, não o player dentro dele.
    // Medido — com um envio só, o YouTube devolveu ZERO mensagens.
    const frame = frameEl;
    if (!frame || !embed) return;
    const toFrame = (message: string): void => {
      frame.contentWindow?.postMessage(message, '*');
    };
    handshake?.stop();
    providerClock?.stop();
    handshake = createEmbedHandshake(embed.provider, toFrame);
    providerClock = createEmbedClock(embed.provider, toFrame);
    handshake.start();
  }

  $effect(() => {
    const frame = frameEl;
    const source = embed;
    if (!frame || !source) return;

    const onMessage = (event: MessageEvent): void => {
      // A página recebe `message` de QUALQUER origem — outro embed, uma
      // extensão, um anúncio. Sem conferir a fonte, um segundo player na mesma
      // página pausa o primeiro.
      if (!isFromFrame(event, frame)) return;
      // Qualquer resposta do provedor encerra a insistência do aperto de mão.
      handshake?.observe(event.data);
      // Lista, e não um evento só: uma mensagem do provedor carrega mais de uma
      // notícia — o `infoDelivery` do YouTube traz estado e tempo juntos.
      for (const parsed of parseEmbedMessage(source.provider, event.data)) {
        if (parsed.type === 'playing') started();
        else if (parsed.type === 'paused') stopped(false);
        else if (parsed.type === 'ended') finish();
        else {
          // Só o que VEIO. O provedor avisa o que mudou, não o estado
          // inteiro: sobrescrever com `undefined` apagaria a duração a cada
          // atualização de posição, e o relógio voltaria a `--:--` no meio do
          // vídeo.
          if (parsed.currentTime !== undefined) currentTime = parsed.currentTime;
          if (parsed.duration !== undefined) duration = parsed.duration;
        }
      }
    };

    window.addEventListener('message', onMessage);
    // O ouvinte mora na `window` e sobrevive à remoção da moldura; o aperto de
    // mão insiste por dez segundos e bateria num quadro que já foi.
    return () => {
      window.removeEventListener('message', onMessage);
      handshake?.stop();
      providerClock?.stop();
    };
  });

  // ─── A fonte ao vivo se liga pelo objeto, não pelo atributo ────────────────

  $effect(() => {
    const media = mediaEl;
    const live = stream;
    if (!media || !live) return;
    media.srcObject = live;
  });

  // ─── Aviso de legenda faltando ─────────────────────────────────────────────

  $effect(() => {
    if (kind !== 'video' || embed || tracks.length > 0) return;
    if (!import.meta.env?.DEV) return;
    // Aviso, não exceção: quebrar a página por falta de legenda esconderia o
    // conteúdo de todo mundo para punir a falta de acesso de alguns.
    console.warn(
      '[nds-media-player] vídeo sem faixa de legenda. WCAG 1.2.2 (nível A) exige '
        + 'legenda para vídeo com áudio — passe `tracks`.',
    );
  });

  // ─── Tela cheia e janela flutuante: ouvintes fora da moldura ───────────────

  $effect(() => {
    if (!canFullscreen) return;
    const sync = (): void => {
      fullscreenActive = document.fullscreenElement === rootEl;
    };
    document.addEventListener('fullscreenchange', sync);
    // O ouvinte mora no `document` e sobrevive à remoção da moldura.
    return () => document.removeEventListener('fullscreenchange', sync);
  });

  $effect(() => {
    const media = mediaEl;
    if (!media) return;
    // Os dois eventos de janela flutuante não têm nome tipado em
    // `svelte/elements`, então entram por `addEventListener` em vez de atributo
    // — é a mesma assinatura, sem supressão de tipo no meio.
    const sync = (): void => {
      pipActive = document.pictureInPictureElement === media;
      readVideoTrack();
    };
    media.addEventListener('enterpictureinpicture', sync);
    media.addEventListener('leavepictureinpicture', sync);
    return () => {
      media.removeEventListener('enterpictureinpicture', sync);
      media.removeEventListener('leavepictureinpicture', sync);
    };
  });

  // ─── A moldura carrega o motor que montou ──────────────────────────────────

  $effect(() => {
    const root = untrack(() => rootEl) as MediaPlayerRootElement | null;
    if (!root) return;
    root.media = untrack(() => mediaEl);
    root.frame = untrack(() => frameEl);
  });

  // ─── Limpeza ───────────────────────────────────────────────────────────────

  $effect(() => {
    const media = untrack(() => mediaEl);
    const frame = untrack(() => frameEl);
    return () => {
      if (media) {
        // Parar e soltar a fonte: um elemento removido do documento continua
        // baixando, e um áudio removido continua TOCANDO.
        media.pause();
        // Fonte ao vivo se solta pelo `srcObject`, e as trilhas param uma a
        // uma: `removeAttribute('src')` não alcança stream, e uma câmera aberta
        // continuaria gravando com o player já fora da tela.
        const live = media.srcObject as MediaStream | null;
        if (live) {
          for (const track of live.getTracks()) track.stop();
          media.srcObject = null;
        }
        media.removeAttribute('src');
        media.load();
      }
      if (frame) {
        // Trocar o `src` por vazio é o que de fato para o vídeo do provedor: a
        // remoção do nó não garante que o documento de dentro pare, e vídeo
        // tocando em quadro invisível é o defeito clássico de embed.
        frame.src = 'about:blank';
      }
    };
  });

  // ─── Os controles falam com o motor ────────────────────────────────────────

  function togglePlay(): void {
    const wantsToPlay = !playing || ended;
    const media = mediaEl;
    if (media) {
      // A promessa PODE ser recusada — a política de autoplay nega `play()` sem
      // ativação do usuário. Engolir a recusa deixaria o botão mentindo, então
      // na recusa o estado é relido do elemento.
      if (wantsToPlay) void media.play().catch(() => { playing = !media.paused; });
      else media.pause();
      return;
    }
    post({ kind: wantsToPlay ? 'play' : 'pause' });
    // No quadro não há resposta síncrona: o estado só muda quando a mensagem do
    // provedor voltar. Mexer nele aqui seria adivinhar.
  }

  function onSeekInput(event: Event): void {
    const value = Number((event.currentTarget as HTMLInputElement).value);
    if (mediaEl) mediaEl.currentTime = value;
    else post({ kind: 'seek', value });
  }

  function toggleMute(): void {
    const next = !muted;
    if (mediaEl) {
      // O `volumechange` do elemento é quem devolve o estado.
      mediaEl.muted = next;
      return;
    }
    // O provedor não avisa mudança de volume: o estado é nosso para manter.
    muted = next;
    post({ kind: 'mute', value: next });
  }

  function onRateSelect(event: Event): void {
    const value = Number((event.currentTarget as HTMLSelectElement).value);
    if (mediaEl) mediaEl.playbackRate = value;
    else {
      rate = value;
      post({ kind: 'rate', value });
    }
  }

  function toggleFullscreen(): void {
    // A tela cheia é da MOLDURA, não do vídeo nem do quadro.
    //
    // Pedindo no `<video>`, o navegador passa a desenhar os controles dele — ou
    // nenhum — e a nossa barra desaparece justamente quando a tela é maior. No
    // quadro seria pior: entraria em tela cheia o player do provedor, com a
    // aparência dele. Na moldura, superfície e controles crescem juntos.
    const root = rootEl;
    if (!root) return;
    const refused = (): void => {
      fullscreenActive = document.fullscreenElement === root;
    };
    if (document.fullscreenElement === root) void document.exitFullscreen().catch(refused);
    else void root.requestFullscreen().catch(refused);
  }

  function togglePip(): void {
    const video = mediaEl as HTMLVideoElement | null;
    if (!video) return;
    // A recusa não pode ser SILENCIOSA: engolir o erro transforma um pedido
    // negado em "clico e nada acontece", e o nome do erro diz o que houve —
    // `InvalidStateError` é falta de faixa de vídeo, `NotAllowedError` é falta
    // de ativação do usuário.
    const refused = (error: unknown): void => {
      pipActive = document.pictureInPictureElement === video;
      readVideoTrack();
      if (import.meta.env?.DEV) {
        console.warn(`[nds-media-player] Picture-in-Picture recusado: ${(error as Error).name}`);
      }
    };
    if (document.pictureInPictureElement === video) {
      void document.exitPictureInPicture().catch(refused);
    } else {
      void video.requestPictureInPicture().catch(refused);
    }
  }
</script>

<!--
  `group` e não `region`: o player é um agrupamento de controles, e `region`
  entraria na lista de marcos da página — um player por artigo poluiria a
  navegação por marco de quem usa leitor de tela.
-->
<div
  bind:this={rootEl}
  data-slot="media-player"
  data-kind={embed ? embed.provider : kind}
  class={cn('nds-media-player', className)}
  role="group"
  aria-label={labels.player}
>
  {#if embed}
    <!--
      O quadro tem nome próprio: sem `title` o leitor de tela anuncia apenas
      "quadro", e uma página com três vídeos vira três "quadro".

      `sandbox` NÃO entra, e a ausência é decisão: os dois provedores precisam
      de scripts e de mesma origem consigo mesmos, e um sandbox que os permita
      não restringe nada — seria teatro. O que de fato limita é o `allow`.
    -->
    <iframe
      bind:this={frameEl}
      class="nds-media-player-surface"
      src={buildEmbedUrl(embed, window.location.origin)}
      allow={EMBED_ALLOW}
      title={labels.player}
      frameborder="0"
      loading="lazy"
      onload={onFrameLoad}
    ></iframe>
  {:else if kind === 'video'}
    <!--
      SEM `controls`: os controles nativos apareceriam junto dos nossos.

      A supressão do aviso de legenda é deliberada e tem substituto: a faixa
      chega por `tracks`, que é lista de execução e não marcação literal — o
      compilador não a enxerga. Quem cobra a legenda é o aviso de DEV acima, que
      olha o valor de verdade em vez do formato do arquivo.
    -->
    <!-- svelte-ignore a11y_media_has_caption -->
    <video
      bind:this={mediaEl}
      class="nds-media-player-surface"
      src={stream ? undefined : src}
      {poster}
      preload="metadata"
      onplaying={() => { started(); readVideoTrack(); }}
      onpause={onMediaPause}
      onended={finish}
      ontimeupdate={onTimeUpdate}
      onloadedmetadata={onLoadedMetadata}
      onloadeddata={readVideoTrack}
      onresize={readVideoTrack}
      onvolumechange={onVolumeChange}
      onratechange={onRateChanged}
    >
      {#each tracks as track (track.src + track.srclang)}
        <track
          kind="captions"
          src={track.src}
          srclang={track.srclang}
          label={track.label}
          default={track.default}
        />
      {/each}
    </video>
  {:else}
    <audio
      bind:this={mediaEl}
      class="nds-media-player-surface"
      src={stream ? undefined : src}
      preload="metadata"
      onplaying={started}
      onpause={onMediaPause}
      onended={finish}
      ontimeupdate={onTimeUpdate}
      onloadedmetadata={onLoadedMetadata}
      onvolumechange={onVolumeChange}
      onratechange={onRateChanged}
    >
      {#each tracks as track (track.src + track.srclang)}
        <track
          kind="captions"
          src={track.src}
          srclang={track.srclang}
          label={track.label}
          default={track.default}
        />
      {/each}
    </audio>
  {/if}

  <!--
    `group`, e não `toolbar`: barra de ferramentas promete navegação por seta, e
    aqui a seta pertence à barra de progresso, que a usa para avançar a mídia.
  -->
  <div
    data-slot="media-player-controls"
    class="nds-media-player-controls"
    role="group"
    aria-label={labels.controls}
  >
    <button
      type="button"
      class="nds-media-player-button"
      aria-label={isPlaying ? labels.pause : labels.play}
      onclick={togglePlay}
    >
      {#if isPlaying}
        <Pause aria-hidden="true" />
      {:else}
        <Play aria-hidden="true" />
      {/if}
    </button>

    <!--
      A barra de progresso é um `<input type="range">`, e não uma barra desenhada
      com `div`: o elemento nativo já é operável por teclado, já tem papel de
      slider e já anuncia valor.

      O slider anuncia POSIÇÃO, e "37" não é posição para quem ouve — o texto do
      valor é o relógio. Com duração desconhecida não há posição a anunciar, e um
      texto inventado seria pior que nenhum.
    -->
    <input
      type="range"
      class="nds-media-player-seek"
      min="0"
      max={hasDuration ? String(duration) : '100'}
      step="0.1"
      value={hasDuration ? String(currentTime) : '0'}
      aria-label={labels.seek}
      aria-valuetext={hasDuration ? seekValueText : undefined}
      oninput={onSeekInput}
    />

    <span class="nds-media-player-time" data-slot="media-player-time"
      >{formatTime(currentTime)} / {formatTime(duration)}</span
    >

    <!--
      Um `<select>` nativo, e não um menu desenhado: já é operável por teclado,
      já anuncia opção e valor, já se comporta como a plataforma manda no toque.
      Lista vazia esconde o seletor — é o que a fonte ao vivo pede, porque nela a
      velocidade não tem efeito.
    -->
    <select
      class="nds-media-player-rate"
      data-slot="media-player-rate"
      aria-label={labels.rate}
      hidden={rates.length === 0}
      value={String(rate)}
      onchange={onRateSelect}
    >
      {#each rates as option (option)}
        <!-- `1×`, e não `1`: sozinho o número não diz de que grandeza se fala. -->
        <option value={String(option)}>{option}×</option>
      {/each}
    </select>

    <button
      type="button"
      class="nds-media-player-button"
      aria-label={muted ? labels.unmute : labels.mute}
      onclick={toggleMute}
    >
      {#if muted}
        <VolumeX aria-hidden="true" />
      {:else}
        <Volume2 aria-hidden="true" />
      {/if}
    </button>

    {#if showsPip}
      <button
        type="button"
        class="nds-media-player-button"
        aria-label={pipActive ? labels.exitPip : labels.enterPip}
        onclick={togglePip}
      >
        <PictureInPicture2 aria-hidden="true" />
      </button>
    {/if}

    {#if canFullscreen}
      <button
        type="button"
        class="nds-media-player-button"
        aria-label={fullscreenActive ? labels.exitFullscreen : labels.enterFullscreen}
        onclick={toggleFullscreen}
      >
        {#if fullscreenActive}
          <Minimize aria-hidden="true" />
        {:else}
          <Maximize aria-hidden="true" />
        {/if}
      </button>
    {/if}
  </div>
</div>
