// ─── MediaPlayer ─────────────────────────────────────────────────────────────
//
// Um player, DOIS motores, uma API.
//
//   nativo     `<video>` / `<audio>` — propriedade e evento de DOM
//   provedor   `<iframe>` do YouTube ou do Vimeo — conversa por `postMessage`
//
// Quem consome passa os mesmos `labels`, `onPlay`, `onPause` e `onEnded` nos
// dois casos, e vê a mesma barra. Isso só é possível porque a barra ficou do
// nosso lado desde o começo: ela fala com um ESTADO, e cada motor alimenta esse
// estado do jeito que sabe. Trocar o motor não redesenha nada.
//
// Por que o elemento nativo é o padrão: ele já entrega legenda por `<track>`,
// teclado, Media Session, Picture-in-Picture, tela cheia e todos os eventos.
// Por que o provedor existe: nem todo vídeo é nosso para hospedar.
//
// ZERO dependência de lib de UI. O motor é o elemento nativo do navegador, e os
// provedores são conversados por `postMessage` — sem `iframe_api` do YouTube e
// sem `@vimeo/player`, o que evita script de terceiro no pacote e uma entrada a
// mais em `script-src`.

import type * as React from 'react';
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  buildEmbedUrl,
  EMBED_ALLOW,
  embedCommand,
  createEmbedHandshake,
  isFromFrame,
  parseEmbedMessage,
  type EmbedCommand,
  type EmbedSource,
} from './media-embed';

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
 * contar `pause` sem olhar isto conta toda reprodução completa como uma pausa, e
 * o erro é silencioso porque o número continua plausível.
 */
export type MediaPauseInfo = {
  ended: boolean;
  currentTime: number;
};

/**
 * O que a story e o teste alcançam por `ref`.
 *
 * `media` e `frame` são o mesmo contrato que o vanilla devolve na raiz da
 * fábrica; nesta stack a raiz é um componente, e o que ela devolve chega por
 * `ref`. Divergência de API de framework, não de comportamento.
 */
export type MediaPlayerHandle = {
  /** A moldura. É por ela que o teste encontra a instância certa na página. */
  root: HTMLDivElement | null;
  /**
   * O elemento nativo — `null` quando a fonte é provedor externo.
   *
   * O tipo diz a diferença de propósito: em provedor não há mídia, há um quadro
   * de outra origem. Sem isso alguém escreve `player.media.currentTime` e
   * descobre em produção que ali não existe mídia nenhuma.
   */
  media: HTMLMediaElement | null;
  /** O quadro — `null` quando a fonte é nativa. */
  frame: HTMLIFrameElement | null;
};

export type MediaPlayerProps = {
  kind?: MediaPlayerKind;
  /** Endereço da mídia. */
  src?: string;
  /**
   * Fonte ao vivo — câmera, compartilhamento de tela, canvas.
   *
   * MEDIDO: `playbackRate` é ignorado em stream (1.5 escrito lê de volta 1) e a
   * duração é infinita, então a barra de progresso não tem o que representar.
   */
  stream?: MediaStream;
  /**
   * Vídeo hospedado no YouTube ou no Vimeo.
   *
   * Muda o MOTOR, não a API. O que muda por baixo é que não existe elemento de
   * mídia: existe um `<iframe>` de outra origem, e a conversa é por
   * `postMessage`.
   *
   * O que fica FORA do alcance, e não é contornável: legenda, faixa de áudio e
   * qualidade pertencem ao provedor; a política de privacidade de quem assiste
   * é do provedor; e o Picture-in-Picture depende de a página que hospeda já ter
   * a permissão para delegar ao quadro.
   */
  embed?: EmbedSource;
  poster?: string;
  tracks?: MediaPlayerTrack[];
  rates?: number[];
  labels: MediaPlayerLabels;
  /**
   * Disparado quando a reprodução COMEÇA de fato.
   *
   * No motor nativo é `playing`, não `play`: `play` avisa que a reprodução foi
   * PEDIDA, e entre o pedido e o primeiro quadro há o buffer. Contar `play`
   * infla a métrica com tentativas que nunca saíram do lugar.
   */
  onPlay?: () => void;
  /** Disparado em toda parada — inclusive no fim. Ver `MediaPauseInfo.ended`. */
  onPause?: (info: MediaPauseInfo) => void;
  onEnded?: () => void;
  className?: string;
  ref?: React.Ref<MediaPlayerHandle>;
};

/**
 * As velocidades oferecidas quando quem consome não escolhe.
 *
 * Constante de MÓDULO, e não literal no valor padrão do parâmetro: um array novo
 * a cada renderização entraria como dependência nova em todo `useMemo` que a
 * lesse, e a lista voltaria a ser recalculada em cada desenho.
 */
const DEFAULT_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

/** `83` vira `1:23`. Duração desconhecida vira `--:--`, não `NaN:aN`. */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

/** O molde de `labels.seekValueText`, com os dois relógios no lugar. */
export function seekValueText(template: string, current: number, duration: number): string {
  return template
    .replace('{current}', formatTime(current))
    .replace('{duration}', formatTime(duration));
}

/**
 * O que a barra sabe, independentemente de quem informou.
 *
 * Existe porque os dois motores contam a mesma história em línguas diferentes: o
 * nativo por propriedade lida na hora, o provedor por mensagem que chega quando
 * chega. Sem este intermediário, cada função de pintura precisaria saber qual
 * motor está por baixo — e a barra deixaria de ser uma só.
 *
 * `fullscreen` e `pip` entram aqui, e no vanilla não: lá a pintura lê
 * `document.fullscreenElement` na hora de desenhar. Nesta stack a pintura É a
 * renderização, e ler o documento durante ela seria efeito colateral no meio do
 * desenho — então o mesmo par de eventos que mandava repintar agora alimenta o
 * estado.
 */
type PlayerState = {
  playing: boolean;
  ended: boolean;
  muted: boolean;
  currentTime: number;
  duration: number;
  rate: number;
  /** Há faixa de vídeo? Só o nativo sabe responder; no quadro é uma aposta. */
  hasVideoTrack: boolean;
  fullscreen: boolean;
  pip: boolean;
};

const INITIAL_STATE: PlayerState = {
  playing: false,
  ended: false,
  muted: false,
  currentTime: 0,
  duration: Number.NaN,
  rate: 1,
  hasVideoTrack: false,
  fullscreen: false,
  pip: false,
};

export function MediaPlayer({
  kind = 'video',
  src,
  stream,
  embed,
  poster,
  tracks = [],
  rates = DEFAULT_RATES,
  labels,
  onPlay,
  onPause,
  onEnded,
  className,
  ref,
}: MediaPlayerProps) {
  const isVideo = kind === 'video' || Boolean(embed);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  const [state, setState] = useState<PlayerState>(INITIAL_STATE);
  const patch = useCallback((next: Partial<PlayerState>) => {
    setState((current) => ({ ...current, ...next }));
  }, []);

  /**
   * O relógio como REFERÊNCIA, além de como estado.
   *
   * `onPause` carrega o instante em que a mídia parou, e o manipulador de
   * `pause` roda fora da renderização: ler o estado dali pegaria o valor do
   * desenho em que o ouvinte foi criado, não o último. Os dois motores escrevem
   * aqui no mesmo lugar em que escrevem no estado.
   */
  const currentTimeRef = useRef(0);

  /**
   * Os callbacks de quem consome, sempre os do último desenho.
   *
   * Sem isto eles entrariam na lista de dependências dos efeitos que assinam os
   * eventos, e uma função escrita em linha (`onPause={() => …}`) — que é como
   * toda story os passa — reassinaria os doze ouvintes a cada renderização.
   */
  const callbacks = useRef({ onPlay, onPause, onEnded });
  // Efeito SEM lista de dependências: roda depois de todo desenho. A atribuição
  // direta no corpo seria escrita em referência durante a renderização, que a
  // regra `react-hooks/refs` reprova — e reprova com razão, porque numa
  // renderização descartada ela já teria acontecido. Na montagem o valor já
  // está certo pelo inicializador do `useRef`.
  useEffect(() => {
    callbacks.current = { onPlay, onPause, onEnded };
  });

  useImperativeHandle(
    ref,
    () => ({
      get root() {
        return rootRef.current;
      },
      get media() {
        return mediaRef.current;
      },
      get frame() {
        return frameRef.current;
      },
    }),
    [],
  );

  // ─── Motor B: o endereço do quadro ─────────────────────────────────────────

  const embedUrl = useMemo(
    () => (embed ? buildEmbedUrl(embed, window.location.origin) : undefined),
    [embed],
  );

  const provider = embed?.provider;

  const post = useCallback(
    (command: EmbedCommand): void => {
      if (!frameRef.current || !provider) return;
      frameRef.current.contentWindow?.postMessage(embedCommand(provider, command), '*');
    },
    [provider],
  );

  // ─── Capacidade: tela cheia e janela flutuante ─────────────────────────────
  //
  // Detecção em tempo de EXECUÇÃO, porque a resposta muda com o navegador, com a
  // permissão do iframe que hospeda a página e com o próprio elemento. Botão que
  // não faz nada é ruído.
  //
  // No provedor, o PiP fica de fora: quem tem a faixa de vídeo é o documento
  // dentro do quadro, e ele é de outra origem — não há como pedir daqui. O
  // provedor oferece o dele, dentro do próprio quadro.
  //
  // A pergunta é feita ao PROTÓTIPO, e não à instância como no vanilla: aqui o
  // elemento só existe depois do primeiro desenho, e é justamente no primeiro
  // desenho que se decide se o botão entra na barra. A metade que o vanilla lê
  // da instância — `disablePictureInPicture` — é constante: este componente
  // nunca a liga, e ela nasce falsa.
  const canFullscreen =
    isVideo
    && typeof document !== 'undefined'
    && document.fullscreenEnabled
    && typeof Element.prototype.requestFullscreen === 'function';
  const canPip =
    !embed
    && kind === 'video'
    && typeof document !== 'undefined'
    && document.pictureInPictureEnabled
    && typeof HTMLVideoElement !== 'undefined'
    && typeof HTMLVideoElement.prototype.requestPictureInPicture === 'function';

  // ─── Motor A: o elemento nativo alimenta o estado ──────────────────────────

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const started = () => {
      patch({ playing: true, ended: false });
      callbacks.current.onPlay?.();
    };
    const stopped = (ended: boolean) => {
      patch({ playing: false, ended });
      callbacks.current.onPause?.({ ended, currentTime: currentTimeRef.current });
    };
    const finished = () => {
      patch({ playing: false, ended: true });
      callbacks.current.onEnded?.();
    };
    const onPauseEvent = () => stopped(media.ended);
    const onTimeUpdate = () => {
      currentTimeRef.current = media.currentTime;
      patch({ currentTime: media.currentTime, duration: media.duration });
    };
    /**
     * A largura é lida a cada evento que PODE tê-la revelado, e não guardada por
     * um evento específico. Em stream ao vivo ela só aparece quando os primeiros
     * quadros chegam, e isso pode vir por `loadedmetadata`, `loadeddata`,
     * `resize` ou `playing`, conforme a fonte — depender de um deles deixa o
     * botão escondido para sempre no caso em que ele veio por outro.
     */
    const syncVideoTrack = () => {
      patch({ hasVideoTrack: (media as HTMLVideoElement).videoWidth > 0 });
    };
    // `loadedmetadata` é quando o conteúdo passa a ser conhecido: é ali que
    // `videoWidth` deixa de ser 0 e se descobre se HÁ faixa de vídeo.
    const onLoadedMetadata = () => {
      patch({
        duration: media.duration,
        hasVideoTrack: (media as HTMLVideoElement).videoWidth > 0,
      });
    };
    const onVolumeChange = () => patch({ muted: media.muted });
    const onRateChange = () => patch({ rate: media.playbackRate });
    const syncPip = () => patch({ pip: document.pictureInPictureElement === media });

    media.addEventListener('playing', started);
    media.addEventListener('pause', onPauseEvent);
    media.addEventListener('ended', finished);
    media.addEventListener('timeupdate', onTimeUpdate);
    media.addEventListener('loadedmetadata', onLoadedMetadata);
    // Stream ao vivo troca de dimensão sem novo `loadedmetadata` — a câmera que
    // gira, a janela compartilhada que muda de tamanho.
    media.addEventListener('resize', syncVideoTrack);
    media.addEventListener('loadeddata', syncVideoTrack);
    media.addEventListener('playing', syncVideoTrack);
    media.addEventListener('volumechange', onVolumeChange);
    media.addEventListener('ratechange', onRateChange);
    media.addEventListener('enterpictureinpicture', syncPip);
    media.addEventListener('leavepictureinpicture', syncPip);

    return () => {
      media.removeEventListener('playing', started);
      media.removeEventListener('pause', onPauseEvent);
      media.removeEventListener('ended', finished);
      media.removeEventListener('timeupdate', onTimeUpdate);
      media.removeEventListener('loadedmetadata', onLoadedMetadata);
      media.removeEventListener('resize', syncVideoTrack);
      media.removeEventListener('loadeddata', syncVideoTrack);
      media.removeEventListener('playing', syncVideoTrack);
      media.removeEventListener('volumechange', onVolumeChange);
      media.removeEventListener('ratechange', onRateChange);
      media.removeEventListener('enterpictureinpicture', syncPip);
      media.removeEventListener('leavepictureinpicture', syncPip);
    };
  }, [kind, embedUrl, patch]);

  /**
   * Fonte ao vivo: `srcObject` é PROPRIEDADE, e não atributo.
   *
   * Um `MediaStream` não tem endereço para escrever em `src` — quem tenta
   * recebe `[object MediaStream]` como URL. A ligação é imperativa por
   * definição, e é este efeito.
   */
  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;
    if (stream) media.srcObject = stream;
    else if (media.srcObject) media.srcObject = null;
  }, [stream, kind]);

  /**
   * A limpeza que a remoção do nó NÃO faz.
   *
   * Um elemento removido do documento continua baixando, e um áudio removido
   * continua TOCANDO. Fonte ao vivo se solta pelo `srcObject`, e as trilhas
   * param uma a uma: uma câmera aberta continuaria gravando com o player já
   * fora da tela.
   *
   * O efeito só tem limpeza, e as dependências são as que TROCAM o elemento:
   * mudar `kind` substitui `<audio>` por `<video>`, e o que sai da árvore
   * precisa parar do mesmo jeito que pararia na desmontagem. As referências são
   * capturadas na montagem de propósito — quando a limpeza roda, elas já
   * apontam para o elemento novo.
   */
  useEffect(() => {
    const media = mediaRef.current;
    const frame = frameRef.current;
    return () => {
      if (media) {
        media.pause();
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
  }, [kind, embedUrl]);

  /** Aviso, não exceção: quebrar a página por falta de legenda esconderia o
   * conteúdo de todo mundo para punir a falta de acesso de alguns. */
  useEffect(() => {
    if (embed || kind !== 'video' || tracks.length > 0) return;
    if (!import.meta.env?.DEV) return;
    console.warn(
      '[nds-media-player] vídeo sem faixa de legenda. WCAG 1.2.2 (nível A) exige '
        + 'legenda para vídeo com áudio — passe `tracks`.',
    );
  }, [embed, kind, tracks.length]);

  // ─── Motor B: as mensagens do quadro alimentam o mesmo estado ──────────────

  /** O aperto de mão em curso — guardado para observar e para parar. */
  const handshakeRef = useRef<ReturnType<typeof createEmbedHandshake> | null>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !provider) return;

    const onMessage = (event: MessageEvent) => {
      // A página recebe `message` de QUALQUER origem — outro embed, uma
      // extensão, um anúncio. Sem conferir a fonte, um segundo player na mesma
      // página pausa o primeiro.
      if (!isFromFrame(event, frame)) return;
      // Qualquer resposta do provedor encerra a insistência do aperto de mão.
      handshakeRef.current?.observe(event.data);
      // Lista, e não um evento só: uma mensagem do provedor carrega mais de uma
      // notícia — o `infoDelivery` do YouTube traz estado e tempo juntos.
      for (const parsed of parseEmbedMessage(provider, event.data)) {
        if (parsed.type === 'playing') {
          patch({ playing: true, ended: false });
          callbacks.current.onPlay?.();
        } else if (parsed.type === 'paused') {
          patch({ playing: false, ended: false });
          callbacks.current.onPause?.({ ended: false, currentTime: currentTimeRef.current });
        } else if (parsed.type === 'ended') {
          patch({ playing: false, ended: true });
          callbacks.current.onEnded?.();
        } else {
          // Só o que VEIO. O provedor avisa o que mudou, não o estado
          // inteiro: sobrescrever com `undefined` apagaria a duração a cada
          // atualização de posição, e o relógio voltaria a `--:--` no meio do
          // vídeo.
          const next: { currentTime?: number; duration?: number } = {};
          if (parsed.currentTime !== undefined) {
            currentTimeRef.current = parsed.currentTime;
            next.currentTime = parsed.currentTime;
          }
          if (parsed.duration !== undefined) next.duration = parsed.duration;
          patch(next);
        }
      }
    };

    // O ouvinte mora na `window`, e não na moldura: ele sobrevive à remoção do
    // quadro, e é por isso que a limpeza tem de soltá-lo à mão.
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [provider, patch]);

  /**
   * O aperto de mão: sem ele nenhum dos dois provedores envia evento algum.
   *
   * É o passo que costuma faltar, e o sintoma é "os comandos funcionam mas nada
   * volta" — que foi exatamente o que se viu na tela.
   *
   * `start()` INSISTE até o provedor responder. Mandar uma vez, no `onLoad`,
   * não bastava: o `load` do iframe é o documento do provedor, não o player
   * dentro dele. Medido contra os quadros reais — com um envio só, o YouTube
   * devolveu ZERO mensagens e o Vimeo não aceitou nenhuma inscrição.
   *
   * Mora numa ref, e não num `useMemo`: o objeto tem VIDA — um temporizador que
   * precisa ser parado —, e memo é para valor derivado. Foi o que o compilador
   * apontou ao ver `frameRef` sendo lida ali dentro.
   */
  const startHandshake = useCallback(() => {
    if (!provider) return;
    handshakeRef.current?.stop();
    handshakeRef.current = createEmbedHandshake(provider, (message) => {
      frameRef.current?.contentWindow?.postMessage(message, '*');
    });
    handshakeRef.current.start();
  }, [provider]);

  // Insiste por dez segundos: um player desmontado antes de o provedor responder
  // deixaria um temporizador batendo num quadro que já foi.
  useEffect(() => () => handshakeRef.current?.stop(), []);

  // ─── Tela cheia ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!canFullscreen) return;
    const sync = () => patch({ fullscreen: document.fullscreenElement === rootRef.current });
    // Ouvinte de `document`: sobrevive à remoção da moldura, e por isso a
    // limpeza tem de soltá-lo à mão.
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, [canFullscreen, patch]);

  // ─── Os controles falam com o motor ────────────────────────────────────────

  const togglePlay = useCallback(() => {
    const shouldPlay = !state.playing || state.ended;
    const media = mediaRef.current;
    if (media) {
      // A promessa PODE ser recusada — a política de autoplay nega `play()` sem
      // ativação do usuário. Engolir a recusa deixaria o botão mentindo: aqui o
      // desenho segue o estado, então a recusa se registra NO estado.
      if (shouldPlay) void media.play().catch(() => patch({ playing: false }));
      else media.pause();
      return;
    }
    post({ kind: shouldPlay ? 'play' : 'pause' });
    // No quadro não há resposta síncrona: o estado só muda quando a mensagem do
    // provedor voltar. Mexer no estado aqui seria adivinhar.
  }, [state.playing, state.ended, patch, post]);

  const onSeek = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value);
      const media = mediaRef.current;
      if (media) media.currentTime = value;
      else post({ kind: 'seek', value });
    },
    [post],
  );

  const toggleMute = useCallback(() => {
    const next = !state.muted;
    const media = mediaRef.current;
    if (media) {
      // `volumechange` é quem repinta — o mesmo caminho de quando o silêncio vem
      // de fora da barra.
      media.muted = next;
      return;
    }
    // O provedor não avisa mudança de volume: o estado é nosso para manter.
    patch({ muted: next });
    post({ kind: 'mute', value: next });
  }, [state.muted, patch, post]);

  const onRate = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = Number(event.target.value);
      const media = mediaRef.current;
      if (media) {
        media.playbackRate = value;
        return;
      }
      patch({ rate: value });
      post({ kind: 'rate', value });
    },
    [patch, post],
  );

  const toggleFullscreen = useCallback(() => {
    // A tela cheia é da MOLDURA, não do vídeo nem do quadro.
    //
    // Pedindo no `<video>`, o navegador passa a desenhar os controles dele — ou
    // nenhum — e a nossa barra desaparece justamente quando a tela é maior. No
    // quadro seria pior: entraria em tela cheia o player do provedor, com a
    // aparência dele. Na moldura, superfície e controles crescem juntos.
    const root = rootRef.current;
    if (!root) return;
    const sync = () => patch({ fullscreen: document.fullscreenElement === root });
    if (document.fullscreenElement === root) void document.exitFullscreen().catch(sync);
    else void root.requestFullscreen().catch(sync);
  }, [patch]);

  const togglePip = useCallback(() => {
    const video = mediaRef.current as HTMLVideoElement | null;
    if (!video) return;
    // A recusa não pode ser SILENCIOSA: engolir o erro transforma um pedido
    // negado em "clico e nada acontece", e o nome do erro diz o que houve —
    // `InvalidStateError` é falta de faixa de vídeo, `NotAllowedError` é falta
    // de ativação do usuário.
    const refused = (error: unknown): void => {
      patch({ pip: document.pictureInPictureElement === video });
      if (import.meta.env?.DEV) {
        console.warn(`[nds-media-player] Picture-in-Picture recusado: ${(error as Error).name}`);
      }
    };
    if (document.pictureInPictureElement === video) {
      void document.exitPictureInPicture().catch(refused);
    } else {
      void video.requestPictureInPicture().catch(refused);
    }
  }, [patch]);

  // ─── A pintura lê o ESTADO, nunca o motor ──────────────────────────────────

  const playing = state.playing && !state.ended;
  const hasDuration = Number.isFinite(state.duration) && state.duration > 0;
  const clock = `${formatTime(state.currentTime)} / ${formatTime(state.duration)}`;

  const trackNodes = tracks.map((track) => (
    <track
      key={`${track.srclang}-${track.src}`}
      kind="captions"
      src={track.src}
      srcLang={track.srclang}
      label={track.label}
      default={track.default}
    />
  ));

  // SEM `controls`: os controles nativos apareceriam junto dos nossos.
  const surfaceProps = {
    className: 'nds-media-player-surface',
    preload: 'metadata' as const,
    // Com fonte ao vivo o endereço não existe: quem liga a fonte é o efeito de
    // `srcObject`.
    src: stream ? undefined : src,
  };

  return (
    <div
      ref={rootRef}
      data-slot="media-player"
      data-kind={embed ? embed.provider : kind}
      className={cn('nds-media-player', className)}
      // `group` e não `region`: o player é um agrupamento de controles, e
      // `region` entraria na lista de marcos da página — um player por artigo
      // poluiria a navegação por marco de quem usa leitor de tela.
      role="group"
      aria-label={labels.player}
    >
      {embed ? (
        <iframe
          ref={frameRef}
          className="nds-media-player-surface"
          src={embedUrl}
          allow={EMBED_ALLOW}
          // O quadro tem nome próprio: sem `title` o leitor de tela anuncia
          // apenas "quadro", e uma página com três vídeos vira três "quadro".
          title={labels.player}
          frameBorder="0"
          loading="lazy"
          onLoad={startHandshake}
          // `sandbox` NÃO entra, e a ausência é decisão: os dois provedores
          // precisam de scripts e de mesma origem consigo mesmos, e um sandbox
          // que os permita não restringe nada — seria teatro. O que de fato
          // limita é o `allow`.
        />
      ) : kind === 'audio' ? (
        <audio
          ref={(element) => {
            mediaRef.current = element;
          }}
          {...surfaceProps}
        >
          {trackNodes}
        </audio>
      ) : (
        <video
          ref={(element) => {
            mediaRef.current = element;
          }}
          poster={poster}
          {...surfaceProps}
        >
          {trackNodes}
        </video>
      )}

      <div
        data-slot="media-player-controls"
        className="nds-media-player-controls"
        // `group`, e não `toolbar`: barra de ferramentas promete navegação por
        // seta, e aqui a seta pertence à barra de progresso, que a usa para
        // avançar a mídia.
        role="group"
        aria-label={labels.controls}
      >
        <button
          type="button"
          className="nds-media-player-button"
          aria-label={playing ? labels.pause : labels.play}
          onClick={togglePlay}
        >
          {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        </button>

        <input
          type="range"
          className="nds-media-player-seek"
          min={0}
          // Sem duração conhecida a barra não tem o que representar: fica na
          // escala de partida, no zero, em vez de fingir uma posição.
          max={hasDuration ? state.duration : 100}
          step={0.1}
          value={hasDuration ? state.currentTime : 0}
          aria-label={labels.seek}
          // O slider anuncia POSIÇÃO, e "37" não é posição para quem ouve. O
          // texto do valor é o relógio.
          aria-valuetext={
            hasDuration
              ? seekValueText(labels.seekValueText, state.currentTime, state.duration)
              : undefined
          }
          onChange={onSeek}
        />

        <span className="nds-media-player-time" data-slot="media-player-time">
          {clock}
        </span>

        {/* Um `<select>` nativo, e não um menu desenhado: já é operável por
            teclado, já anuncia opção e valor, já se comporta como a plataforma
            manda no toque. */}
        <select
          className="nds-media-player-rate"
          data-slot="media-player-rate"
          aria-label={labels.rate}
          hidden={rates.length === 0}
          value={String(state.rate)}
          onChange={onRate}
        >
          {rates.map((rate) => (
            // `1×`, e não `1`: sozinho o número não diz de que grandeza se fala.
            <option key={rate} value={rate}>{`${rate}×`}</option>
          ))}
        </select>

        <button
          type="button"
          className="nds-media-player-button"
          aria-label={state.muted ? labels.unmute : labels.mute}
          onClick={toggleMute}
        >
          {state.muted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
        </button>

        {canPip && (
          <button
            type="button"
            className="nds-media-player-button"
            // Nasce escondido e é revelado quando se souber que HÁ faixa de
            // vídeo. A detecção de capacidade não basta:
            // `pictureInPictureEnabled` responde pelo DOCUMENTO, não pelo
            // conteúdo — um `<video>` alimentado com áudio passa por ela e
            // recusa o pedido com `InvalidStateError` (medido, `videoWidth=0`).
            // Escondido primeiro e revelado depois, e não o contrário: mostrar
            // para depois esconder faria a barra saltar quando os metadados
            // chegassem.
            hidden={!state.hasVideoTrack}
            aria-label={state.pip ? labels.exitPip : labels.enterPip}
            onClick={togglePip}
          >
            <PictureInPicture2 aria-hidden="true" />
          </button>
        )}

        {canFullscreen && (
          <button
            type="button"
            className="nds-media-player-button"
            aria-label={state.fullscreen ? labels.exitFullscreen : labels.enterFullscreen}
            onClick={toggleFullscreen}
          >
            {state.fullscreen ? <Minimize aria-hidden="true" /> : <Maximize aria-hidden="true" />}
          </button>
        )}
      </div>
    </div>
  );
}
