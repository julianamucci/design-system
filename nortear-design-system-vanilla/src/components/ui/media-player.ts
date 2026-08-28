// ─── Media Player — protótipo Vanilla ────────────────────────────────────────
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

import {
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  Volume2,
  VolumeX,
} from 'lucide';
import { cn } from '@/lib/utils';
import { tornarDestruivel, type DestroyableElement } from '@/lib/destroy';
import {
  buildEmbedUrl,
  EMBED_ALLOW,
  embedCommand,
  createEmbedClock,
  createEmbedHandshake,
  isFromFrame,
  parseEmbedMessage,
  type EmbedCommand,
  type EmbedSource,
} from './media-embed';

type LucideIconNode = [string, Record<string, string>];

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
   * dois relógios.
   *
   * É molde, e não um conector solto, porque a ordem dos dois tempos e a
   * palavra entre eles são decisão de cada idioma — montar a frase no código
   * daria errado no primeiro idioma que não pusesse as partes nesta ordem.
   * Antes desta chave o conector estava cravado em pt-BR, e numa página em
   * inglês quem ouve recebia uma preposição em português entre dois relógios.
   */
  seekValueText: string;
  /**
   * O que a barra diz no lugar do relógio quando a fonte é AO VIVO.
   *
   * Transmissão não tem duração, e `--:--` ao lado de uma barra parada se
   * lê como defeito. Este rótulo é o que separa "não sei" de "não existe".
   */
  live: string;
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

export type MediaPlayerOptions = {
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
  class?: string;
};

export type MediaPlayerRoot = DestroyableElement<HTMLDivElement> & {
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

const ico = (n: unknown): LucideIconNode[] => n as LucideIconNode[];

function iconSvg(nodes: LucideIconNode[]): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  for (const [tag, attrs] of nodes) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    svg.appendChild(node);
  }
  return svg;
}

/** `83` vira `1:23`. Duração desconhecida vira `--:--`, não `NaN:aN`. */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** O molde de `labels.seekValueText`, com os dois relógios no lugar. */
export function seekValueText(template: string, current: number, duration: number): string {
  return template
    .replace('{current}', formatTime(current))
    .replace('{duration}', formatTime(duration));
}

function controlButton(label: string, icon: LucideIconNode[]): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'nds-media-player-button';
  btn.setAttribute('aria-label', label);
  btn.appendChild(iconSvg(icon));
  return btn;
}

/**
 * O que a barra sabe, independentemente de quem informou.
 *
 * Existe porque os dois motores contam a mesma história em línguas diferentes: o
 * nativo por propriedade lida na hora, o provedor por mensagem que chega quando
 * chega. Sem este intermediário, cada função de pintura precisaria saber qual
 * motor está por baixo — e a barra deixaria de ser uma só.
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
};

export function createMediaPlayer(options: MediaPlayerOptions): MediaPlayerRoot {
  const { kind = 'video', labels, tracks = [] } = options;
  const embed = options.embed;
  const isVideo = kind === 'video' || Boolean(embed);

  const root = document.createElement('div');
  root.dataset.slot = 'media-player';
  root.dataset.fullscreen = 'false';
  root.dataset.idle = 'false';
  root.dataset.kind = embed ? embed.provider : kind;
  root.className = cn('nds-media-player', options.class);
  // `group` e não `region`: o player é um agrupamento de controles, e `region`
  // entraria na lista de marcos da página — um player por artigo poluiria a
  // navegação por marco de quem usa leitor de tela.
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', labels.player);

  const state: PlayerState = {
    playing: false,
    ended: false,
    muted: false,
    currentTime: 0,
    duration: Number.NaN,
    rate: 1,
    hasVideoTrack: false,
  };

  // ─── Motor A: o elemento nativo ────────────────────────────────────────────
  const media = embed ? null : (document.createElement(kind) as HTMLMediaElement);
  if (media) {
    media.className = 'nds-media-player-surface';
    if (options.stream) media.srcObject = options.stream;
    else if (options.src) media.src = options.src;
    media.preload = 'metadata';
    // SEM `controls`: os controles nativos apareceriam junto dos nossos.
    if (kind === 'video' && options.poster) (media as HTMLVideoElement).poster = options.poster;

    for (const t of tracks) {
      const track = document.createElement('track');
      track.kind = 'captions';
      track.src = t.src;
      track.srclang = t.srclang;
      track.label = t.label;
      if (t.default) track.default = true;
      media.appendChild(track);
    }

    if (kind === 'video' && tracks.length === 0 && import.meta.env?.DEV) {
      // Aviso, não exceção: quebrar a página por falta de legenda esconderia o
      // conteúdo de todo mundo para punir a falta de acesso de alguns.
      console.warn(
        '[nds-media-player] vídeo sem faixa de legenda. WCAG 1.2.2 (nível A) exige '
          + 'legenda para vídeo com áudio — passe `tracks`.',
      );
    }
  }

  // ─── Motor B: o quadro do provedor ─────────────────────────────────────────
  const frame = embed ? document.createElement('iframe') : null;
  if (frame && embed) {
    frame.className = 'nds-media-player-surface';
    frame.src = buildEmbedUrl(embed, window.location.origin);
    frame.allow = EMBED_ALLOW;
    // O quadro tem nome próprio: sem `title` o leitor de tela anuncia apenas
    // "quadro", e uma página com três vídeos vira três "quadro".
    frame.title = labels.player;
    frame.setAttribute('frameborder', '0');
    frame.setAttribute('loading', 'lazy');
    // `sandbox` NÃO entra, e a ausência é decisão: os dois provedores precisam
    // de scripts e de mesma origem consigo mesmos, e um sandbox que os permita
    // não restringe nada — seria teatro. O que de fato limita é o `allow`.
  }

  const surface: HTMLElement = media ?? frame!;

  const post = (command: EmbedCommand): void => {
    if (!frame || !embed) return;
    frame.contentWindow?.postMessage(embedCommand(embed.provider, command), '*');
  };

  // ─── A barra ───────────────────────────────────────────────────────────────
  const controls = document.createElement('div');
  controls.dataset.slot = 'media-player-controls';
  controls.className = 'nds-media-player-controls';
  // `group`, e não `toolbar`: barra de ferramentas promete navegação por seta, e
  // aqui a seta pertence à barra de progresso, que a usa para avançar a mídia.
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', labels.controls);

  const playButton = controlButton(labels.play, ico(Play));

  const seek = document.createElement('input');
  seek.type = 'range';
  seek.className = 'nds-media-player-seek';
  seek.min = '0';
  seek.max = '100';
  seek.value = '0';
  seek.step = '0.1';
  seek.setAttribute('aria-label', labels.seek);

  const time = document.createElement('span');
  time.className = 'nds-media-player-time';
  time.dataset.slot = 'media-player-time';
  time.textContent = '--:-- / --:--';

  // Um `<select>` nativo, e não um menu desenhado: já é operável por teclado, já
  // anuncia opção e valor, já se comporta como a plataforma manda no toque.
  const rates = options.rates ?? [0.5, 0.75, 1, 1.25, 1.5, 2];
  const rateSelect = document.createElement('select');
  rateSelect.className = 'nds-media-player-rate';
  rateSelect.dataset.slot = 'media-player-rate';
  rateSelect.setAttribute('aria-label', labels.rate);
  rateSelect.hidden = rates.length === 0;
  for (const r of rates) {
    const opt = document.createElement('option');
    opt.value = String(r);
    // `1×`, e não `1`: sozinho o número não diz de que grandeza se fala.
    opt.textContent = `${r}×`;
    if (r === 1) opt.selected = true;
    rateSelect.appendChild(opt);
  }

  const muteButton = controlButton(labels.mute, ico(Volume2));
  controls.append(playButton, seek, time, rateSelect, muteButton);

  // Tela cheia e PiP: detecção em tempo de EXECUÇÃO, porque a resposta muda com
  // o navegador, com a permissão do iframe que hospeda a página e com o próprio
  // elemento. Botão que não faz nada é ruído.
  //
  // No provedor, o PiP fica de fora: quem tem a faixa de vídeo é o documento
  // dentro do quadro, e ele é de outra origem — não há como pedir daqui. O
  // provedor oferece o dele, dentro do próprio quadro.
  const canFullscreen =
    isVideo && document.fullscreenEnabled && typeof root.requestFullscreen === 'function';
  const canPip =
    !embed
    && kind === 'video'
    && document.pictureInPictureEnabled
    && typeof (media as HTMLVideoElement | null)?.requestPictureInPicture === 'function'
    && !(media as HTMLVideoElement | null)?.disablePictureInPicture;

  const pipButton = canPip ? controlButton(labels.enterPip, ico(PictureInPicture2)) : null;
  if (pipButton) {
    // Nasce escondido e é revelado quando se souber que HÁ faixa de vídeo. A
    // detecção de capacidade não basta: `pictureInPictureEnabled` responde pelo
    // DOCUMENTO, não pelo conteúdo — um `<video>` alimentado com áudio passa por
    // ela e recusa o pedido com `InvalidStateError` (medido, `videoWidth=0`).
    // Escondido primeiro e revelado depois, e não o contrário: mostrar para
    // depois esconder faria a barra saltar quando os metadados chegassem.
    pipButton.hidden = true;
  }
  const fsButton = canFullscreen ? controlButton(labels.enterFullscreen, ico(Maximize)) : null;
  if (pipButton) controls.appendChild(pipButton);
  if (fsButton) controls.appendChild(fsButton);

  root.append(surface, controls);

  // ─── Ociosidade da tela cheia ──────────────────────────────────────────────
  //
  // Em tela cheia a imagem é o conteúdo e a barra é andaime: some depois de um
  // tempo sem atividade e volta ao primeiro sinal de vida. Fora da tela cheia
  // NUNCA some — ali a moldura é pequena e a barra é a única forma de operar.
  //
  // Quem esconde é o CSS, por `[data-fullscreen][data-idle]`; aqui só se decide
  // QUANDO. A separação é o que torna a regra exercitável: a pseudo-classe
  // `:fullscreen` exige tela cheia de verdade, que exige ativação do usuário —
  // e o clique sintético do driver não a concede (medido).

  /** Quanto tempo parado até a barra sair de cena. */
  const IDLE_MS = 3000;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  function clearIdle(): void {
    if (idleTimer !== null) clearTimeout(idleTimer);
    idleTimer = null;
    root.dataset.idle = 'false';
  }

  function markActive(): void {
    if (idleTimer !== null) clearTimeout(idleTimer);
    idleTimer = null;
    root.dataset.idle = 'false';
    // O relógio só corre em tela cheia: fora dela não há o que esconder, e um
    // temporizador por player aberto na página seria custo sem uso.
    if (root.dataset.fullscreen !== 'true') return;
    idleTimer = setTimeout(() => {
      idleTimer = null;
      root.dataset.idle = 'true';
    }, IDLE_MS);
  }

  // `focusin` está na lista por acessibilidade, e não por simetria: chegar num
  // controle pelo teclado é atividade, e a barra tem de estar visível quando o
  // foco pousa nela. A folha ainda garante isso por `:focus-within`, e as duas
  // guardas se cobrem — a de CSS vale enquanto o foco fica, esta reinicia a
  // contagem.
  for (const name of ['pointermove', 'pointerdown', 'keydown', 'focusin'] as const) {
    root.addEventListener(name, markActive);
  }

  // ─── Pintura: lê o ESTADO, nunca o motor ───────────────────────────────────
  function paintPlay(): void {
    const playing = state.playing && !state.ended;
    playButton.setAttribute('aria-label', playing ? labels.pause : labels.play);
    playButton.replaceChildren(iconSvg(ico(playing ? Pause : Play)));
  }

  function paintMute(): void {
    muteButton.setAttribute('aria-label', state.muted ? labels.unmute : labels.mute);
    muteButton.replaceChildren(iconSvg(ico(state.muted ? VolumeX : Volume2)));
  }

  function paintTime(): void {
    // Fonte AO VIVO: duração infinita não é duração desconhecida, é ausência de
    // fim. A diferença importa na tela — `0:00 / --:--` com uma barra que não
    // anda se lê como componente quebrado, e foi assim que a transmissão
    // apareceu. Quem assiste precisa saber que é transmissão.
    //
    // `Infinity` é o que o navegador reporta em `MediaStream`, e é também o que
    // um canal ao vivo de verdade reporta: o mesmo caminho serve os dois.
    const live = state.duration === Number.POSITIVE_INFINITY;
    root.dataset.live = live ? 'true' : 'false';
    // A barra de progresso sai de cena: não há duração para representar nem
    // posição para onde arrastar, e slider que não move é o "controle que não
    // faz nada" de novo.
    seek.hidden = live;

    if (live) {
      time.textContent = labels.live;
      return;
    }

    time.textContent = `${formatTime(state.currentTime)} / ${formatTime(state.duration)}`;
    if (Number.isFinite(state.duration) && state.duration > 0) {
      seek.max = String(state.duration);
      seek.value = String(state.currentTime);
      // O slider anuncia POSIÇÃO, e "37" não é posição para quem ouve. O texto
      // do valor é o relógio, e o molde vem do CONTEÚDO: era a única string
      // falada com palavra cravada em português.
      seek.setAttribute(
        'aria-valuetext',
        seekValueText(labels.seekValueText, state.currentTime, state.duration),
      );
    }
  }

  function paintRate(): void {
    rateSelect.value = String(state.rate);
  }

  function paintFullscreen(): void {
    const on = document.fullscreenElement === root;
    // O atributo é o gancho do CSS que esconde a barra parada. Ele existe
    // mesmo sem o botão de tela cheia: quem entra por atalho do navegador
    // (F11 não, mas a API dá outros caminhos) tem o mesmo comportamento.
    root.dataset.fullscreen = on ? 'true' : 'false';
    // Saindo, a barra volta imediatamente — e o temporizador para.
    if (!on) clearIdle();
    else markActive();

    if (!fsButton) return;
    fsButton.setAttribute('aria-label', on ? labels.exitFullscreen : labels.enterFullscreen);
    fsButton.replaceChildren(iconSvg(ico(on ? Minimize : Maximize)));
  }

  function paintPip(): void {
    if (!pipButton) return;
    // A largura é lida NA HORA de pintar, e não guardada por um evento
    // específico. Em stream ao vivo ela só aparece quando os primeiros quadros
    // chegam, e isso pode vir por loadedmetadata, loadeddata, resize ou
    // playing, conforme a fonte — depender de um deles deixa o botão escondido
    // para sempre no caso em que ele veio por outro.
    if (media) state.hasVideoTrack = (media as HTMLVideoElement).videoWidth > 0;
    pipButton.hidden = !state.hasVideoTrack;
    const on = document.pictureInPictureElement === media;
    pipButton.setAttribute('aria-label', on ? labels.exitPip : labels.enterPip);
  }

  function paintAll(): void {
    paintPlay();
    paintMute();
    paintTime();
    paintRate();
    paintFullscreen();
    paintPip();
  }

  // ─── Os motores alimentam o estado ─────────────────────────────────────────
  function started(): void {
    state.playing = true;
    state.ended = false;
    paintPlay();
    // No provedor a posição é PERGUNTADA enquanto toca; no motor nativo isto
    // não faz nada. Ver `createEmbedClock`.
    clock?.start();
    options.onPlay?.();
  }

  function stopped(ended: boolean): void {
    state.playing = false;
    state.ended = ended;
    paintPlay();
    clock?.stop();
    options.onPause?.({ ended, currentTime: state.currentTime });
  }

  function finished(): void {
    state.ended = true;
    state.playing = false;
    paintPlay();
    clock?.stop();
    options.onEnded?.();
  }

  if (media) {
    media.addEventListener('playing', started);
    media.addEventListener('pause', () => stopped(media.ended));
    media.addEventListener('ended', finished);
    media.addEventListener('timeupdate', () => {
      state.currentTime = media.currentTime;
      state.duration = media.duration;
      paintTime();
    });
    // `loadedmetadata` é quando o conteúdo passa a ser conhecido: é ali que
    // `videoWidth` deixa de ser 0 e se descobre se HÁ faixa de vídeo.
    media.addEventListener('loadedmetadata', () => {
      state.duration = media.duration;
      state.hasVideoTrack = (media as HTMLVideoElement).videoWidth > 0;
      paintTime();
      paintPip();
    });
    // Stream ao vivo troca de dimensão sem novo `loadedmetadata` — a câmera que
    // gira, a janela compartilhada que muda de tamanho.
    media.addEventListener('resize', paintPip);
    media.addEventListener('loadeddata', paintPip);
    media.addEventListener('playing', paintPip);
    media.addEventListener('volumechange', () => {
      state.muted = media.muted;
      paintMute();
    });
    media.addEventListener('ratechange', () => {
      state.rate = media.playbackRate;
      paintRate();
    });
  }

  /** Só existe no motor de quadro; guardado para soltar na limpeza. */
  let onMessage: ((e: MessageEvent) => void) | null = null;
  let handshake: ReturnType<typeof createEmbedHandshake> | null = null;
  let clock: ReturnType<typeof createEmbedClock> | null = null;

  if (frame && embed) {
    const toFrame = (message: string): void => {
      frame.contentWindow?.postMessage(message, '*');
    };
    handshake = createEmbedHandshake(embed.provider, toFrame);
    clock = createEmbedClock(embed.provider, toFrame);

    onMessage = (event: MessageEvent) => {
      // A página recebe `message` de QUALQUER origem — outro embed, uma
      // extensão, um anúncio. Sem conferir a fonte, um segundo player na mesma
      // página pausa o primeiro.
      if (!isFromFrame(event, frame)) return;
      // Qualquer resposta do provedor encerra a insistência do aperto de mão.
      handshake?.observe(event.data);
      // Lista, e não um evento só: uma mensagem do provedor carrega mais de uma
      // notícia — o `infoDelivery` do YouTube traz estado e tempo juntos.
      for (const parsed of parseEmbedMessage(embed.provider, event.data)) {
        if (parsed.type === 'playing') started();
        else if (parsed.type === 'paused') stopped(false);
        else if (parsed.type === 'ended') finished();
        else {
          // Só o que VEIO. O provedor avisa o que mudou, não o estado inteiro:
          // sobrescrever com `undefined` apagaria a duração a cada atualização
          // de posição, e o relógio voltaria a `--:--` no meio do vídeo.
          if (parsed.currentTime !== undefined) state.currentTime = parsed.currentTime;
          if (parsed.duration !== undefined) state.duration = parsed.duration;
          paintTime();
        }
      }
    };
    window.addEventListener('message', onMessage);

    // O aperto de mão: sem ele nenhum dos dois provedores envia evento algum.
    // É o passo que costuma faltar, e o sintoma é "os comandos funcionam mas
    // nada volta" — que foi exatamente o que se viu na tela.
    //
    // `start()` INSISTE até o provedor responder. Mandar uma vez, aqui no
    // `load`, não bastava: o `load` do iframe é o documento do provedor, não o
    // player dentro dele. Medido — com um envio só, o YouTube devolveu zero
    // mensagens.
    frame.addEventListener('load', () => handshake?.start());
  }

  // ─── Os controles falam com o motor ────────────────────────────────────────
  playButton.addEventListener('click', () => {
    const tocar = !state.playing || state.ended;
    if (media) {
      // A promessa PODE ser recusada — a política de autoplay nega `play()` sem
      // ativação do usuário. Engolir a recusa deixaria o botão mentindo.
      if (tocar) void media.play().catch(paintPlay);
      else media.pause();
      return;
    }
    post({ kind: tocar ? 'play' : 'pause' });
    // No quadro não há resposta síncrona: o estado só muda quando a mensagem do
    // provedor voltar. Repintar aqui seria adivinhar.
  });

  seek.addEventListener('input', () => {
    const value = Number(seek.value);
    if (media) media.currentTime = value;
    else post({ kind: 'seek', value });
  });

  muteButton.addEventListener('click', () => {
    const next = !state.muted;
    if (media) {
      media.muted = next;
      return;
    }
    // O provedor não avisa mudança de volume: o estado é nosso para manter.
    state.muted = next;
    post({ kind: 'mute', value: next });
    paintMute();
  });

  rateSelect.addEventListener('change', () => {
    const value = Number(rateSelect.value);
    if (media) media.playbackRate = value;
    else {
      state.rate = value;
      post({ kind: 'rate', value });
    }
  });

  if (fsButton) {
    // A tela cheia é da MOLDURA, não do vídeo nem do quadro.
    //
    // Pedindo no `<video>`, o navegador passa a desenhar os controles dele — ou
    // nenhum — e a nossa barra desaparece justamente quando a tela é maior. No
    // quadro seria pior: entraria em tela cheia o player do provedor, com a
    // aparência dele. Na moldura, superfície e controles crescem juntos.
    fsButton.addEventListener('click', () => {
      if (document.fullscreenElement === root) void document.exitFullscreen().catch(paintFullscreen);
      else void root.requestFullscreen().catch(paintFullscreen);
    });
    document.addEventListener('fullscreenchange', paintFullscreen);
  }

  if (pipButton && media) {
    const video = media as HTMLVideoElement;
    // A recusa não pode ser SILENCIOSA: engolir o erro transforma um pedido
    // negado em "clico e nada acontece", e o nome do erro diz o que houve —
    // `InvalidStateError` é falta de faixa de vídeo, `NotAllowedError` é falta
    // de ativação do usuário.
    const refused = (error: unknown): void => {
      paintPip();
      if (import.meta.env?.DEV) {
        console.warn(`[nds-media-player] Picture-in-Picture recusado: ${(error as Error).name}`);
      }
    };
    pipButton.addEventListener('click', () => {
      if (document.pictureInPictureElement === video) {
        void document.exitPictureInPicture().catch(refused);
      } else {
        void video.requestPictureInPicture().catch(refused);
      }
    });
    media.addEventListener('enterpictureinpicture', paintPip);
    media.addEventListener('leavepictureinpicture', paintPip);
  }

  paintAll();

  const playerRoot = tornarDestruivel(root, root, () => {
    if (media) {
      // Parar e soltar a fonte: um elemento removido do documento continua
      // baixando, e um áudio removido continua TOCANDO.
      media.pause();
      // Fonte ao vivo se solta pelo `srcObject`, e as trilhas param uma a uma:
      // `removeAttribute('src')` não alcança stream, e uma câmera aberta
      // continuaria gravando com o player já fora da tela.
      const stream = media.srcObject as MediaStream | null;
      if (stream) {
        for (const trilha of stream.getTracks()) trilha.stop();
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
    // Os dois ouvintes moram fora da moldura e sobrevivem à remoção dela.
    document.removeEventListener('fullscreenchange', paintFullscreen);
    if (onMessage) window.removeEventListener('message', onMessage);
    // O aperto de mão insiste por dez segundos: sem isto, um player montado e
    // removido antes de o provedor responder deixaria um temporizador batendo
    // num quadro que já foi.
    handshake?.stop();
    clock?.stop();
    // O temporizador de ociosidade sobrevive à remoção do nó.
    if (idleTimer !== null) clearTimeout(idleTimer);
  }) as MediaPlayerRoot;

  playerRoot.media = media;
  playerRoot.frame = frame;
  return playerRoot;
}
