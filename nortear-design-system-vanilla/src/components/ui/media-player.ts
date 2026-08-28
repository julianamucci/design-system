// ─── Media Player — protótipo Vanilla ────────────────────────────────────────
//
// Vídeo e áudio sobre o elemento NATIVO. Não é componente entregue: é a medição
// que decide se o design system constrói o player em vez de adotar uma lib.
//
// Por que o elemento nativo. Ele já entrega, de graça: legenda por `<track>`,
// teclado, Media Session (o controle da tela de bloqueio e do fone),
// Picture-in-Picture, tela cheia e TODOS os eventos de reprodução. O que falta é
// a aparência — e aparência é o que um design system tem. É a mesma divisão do
// editor: a lib é o motor, a barra é nossa.
//
// A consequência boa dessa divisão é que o motor fica substituível. Se o
// `@videojs/core` (hoje em beta, GA prevista para meados de 2026) amadurecer e
// resolver qualidade adaptativa melhor que o elemento nativo, troca-se o motor
// sem redesenhar a barra.

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

type LucideIconNode = [string, Record<string, string>];

export type MediaPlayerKind = 'video' | 'audio';

/** Faixa de legenda. Vídeo com áudio EXIGE ao menos uma — WCAG 1.2.2, nível A. */
export type MediaPlayerTrack = {
  src: string;
  /** Código de idioma da faixa, como `pt-BR`. */
  srclang: string;
  /** Nome que aparece no menu de legendas do navegador. */
  label: string;
  default?: boolean;
};

export type MediaPlayerLabels = {
  /** Nome acessível do player inteiro. */
  player: string;
  /** Nome acessível do grupo de controles. */
  controls: string;
  play: string;
  pause: string;
  mute: string;
  unmute: string;
  /** Rótulo da barra de progresso. */
  seek: string;
  /** Rótulo do seletor de velocidade. */
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
 * mídia TERMINA, e antes do `ended`. A sequência real, cronometrada num WAV de
 * 0,4s: `play@0.00 > playing@0.00 > pause@0.40 > ended@0.40`. Quem contar
 * `pause` sem olhar isto conta toda reprodução completa como uma pausa — e o
 * erro é silencioso, porque o número continua plausível.
 */
export type MediaPauseInfo = {
  /** A parada foi o fim da mídia, não uma pausa de quem assiste. */
  ended: boolean;
  currentTime: number;
};

export type MediaPlayerOptions = {
  kind?: MediaPlayerKind;
  src: string;
  /** Imagem de capa. Só o vídeo a usa. */
  poster?: string;
  /**
   * Faixas de legenda.
   *
   * Vídeo com áudio SEM legenda reprova em WCAG 1.2.2 (nível A). O componente
   * não pode gerar legenda, mas pode recusar-se a esconder a falta: quando é
   * vídeo e a lista vem vazia, ele avisa no console em desenvolvimento.
   */
  tracks?: MediaPlayerTrack[];
  /**
   * Velocidades oferecidas, na ordem em que aparecem.
   *
   * MEDIDO: `playbackRate` vale para mídia de ARQUIVO e é IGNORADO em stream ao
   * vivo — escrever 1.5 num `srcObject` de `MediaStream` lê de volta 1. Quem
   * montar o player sobre stream deve passar lista vazia para o seletor sumir:
   * controle que não faz nada é pior que controle ausente.
   */
  rates?: number[];
  labels: MediaPlayerLabels;
  /**
   * Disparado quando a reprodução COMEÇA de fato.
   *
   * Ligado a `playing`, e não a `play`: `play` avisa que a reprodução foi
   * PEDIDA, e entre o pedido e o primeiro quadro há o buffer. Numa mídia grande
   * os dois se separam por segundos, e contar `play` como início infla a
   * métrica com tentativas que nunca saíram do lugar.
   */
  onPlay?: () => void;
  /** Disparado em toda parada — inclusive no fim. Ver `MediaPauseInfo.ended`. */
  onPause?: (info: MediaPauseInfo) => void;
  onEnded?: () => void;
  class?: string;
};

export type MediaPlayerRoot = DestroyableElement<HTMLDivElement> & {
  /** O elemento nativo. Quem consome precisa dele para volume, faixas, taxa. */
  media: HTMLMediaElement;
};

const ico = (n: unknown): LucideIconNode[] => n as LucideIconNode[];

/** Monta um SVG a partir dos nós do lucide — mesma forma do editor e do alert. */
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

function controlButton(label: string, icon: LucideIconNode[]): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'nds-media-player-button';
  btn.setAttribute('aria-label', label);
  btn.appendChild(iconSvg(icon));
  return btn;
}

export function createMediaPlayer(options: MediaPlayerOptions): MediaPlayerRoot {
  const { kind = 'video', labels, tracks = [] } = options;
  const isVideo = kind === 'video';

  const root = document.createElement('div');
  root.dataset.slot = 'media-player';
  root.dataset.kind = kind;
  root.className = cn('nds-media-player', options.class);
  // `group` e não `region`: o player é um agrupamento de controles, e `region`
  // entraria na lista de marcos da página — um player por artigo poluiria a
  // navegação por marco de quem usa leitor de tela.
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', labels.player);

  // ─── O motor ───────────────────────────────────────────────────────────────
  const media = document.createElement(kind) as HTMLMediaElement;
  media.className = 'nds-media-player-surface';
  media.src = options.src;
  media.preload = 'metadata';
  // SEM `controls`: os controles nativos apareceriam junto dos nossos. O
  // elemento continua acessível porque quem o opera é a barra abaixo, e ele
  // segue fora da ordem de tabulação por não ter `controls`.
  if (isVideo && options.poster) (media as HTMLVideoElement).poster = options.poster;

  for (const t of tracks) {
    const track = document.createElement('track');
    track.kind = 'captions';
    track.src = t.src;
    track.srclang = t.srclang;
    track.label = t.label;
    if (t.default) track.default = true;
    media.appendChild(track);
  }

  if (isVideo && tracks.length === 0 && import.meta.env?.DEV) {
    // Aviso, não exceção: quebrar a página por falta de legenda esconderia o
    // conteúdo de todo mundo para punir a falta de acesso de alguns.
    console.warn(
      '[nds-media-player] vídeo sem faixa de legenda. WCAG 1.2.2 (nível A) exige '
        + 'legenda para vídeo com áudio — passe `tracks`.',
    );
  }

  // ─── A barra ───────────────────────────────────────────────────────────────
  const controls = document.createElement('div');
  controls.dataset.slot = 'media-player-controls';
  controls.className = 'nds-media-player-controls';
  // `group`, e não `toolbar`: barra de ferramentas promete navegação por seta
  // entre os controles, e aqui a seta pertence à barra de progresso, que a usa
  // para avançar a mídia. Prometer o que não se cumpre é pior que não prometer.
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

  // ─── Velocidade ────────────────────────────────────────────────────────────
  //
  // Um `<select>` nativo, e não um menu desenhado: ele já é operável por
  // teclado, já anuncia opção e valor, e já se comporta como a plataforma manda
  // em toque. Um menu próprio significaria reimplementar tudo isso à mão — a
  // mesma razão que fez a barra de progresso ser um `<input type="range">`.
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

  // ─── Tela cheia e Picture-in-Picture ───────────────────────────────────────
  //
  // Só existem em vídeo, e só quando o navegador de fato os oferece. A detecção
  // é em tempo de EXECUÇÃO porque a resposta muda com o navegador, com a
  // política de permissão do iframe que hospeda a página e com o próprio
  // elemento (`disablePictureInPicture`). Botão que não faz nada é ruído.
  const canFullscreen =
    isVideo && document.fullscreenEnabled && typeof root.requestFullscreen === 'function';
  const canPip =
    isVideo
    && document.pictureInPictureEnabled
    && typeof (media as HTMLVideoElement).requestPictureInPicture === 'function'
    && !(media as HTMLVideoElement).disablePictureInPicture;

  const pipButton = canPip ? controlButton(labels.enterPip, ico(PictureInPicture2)) : null;
  const fsButton = canFullscreen ? controlButton(labels.enterFullscreen, ico(Maximize)) : null;
  if (pipButton) controls.appendChild(pipButton);
  if (fsButton) controls.appendChild(fsButton);

  root.append(media, controls);

  // ─── Estado: a BARRA reflete o elemento, nunca o próprio clique ────────────
  //
  // É a mesma regra da barra do editor, e aqui vale ainda mais: a reprodução
  // muda por caminhos que não passam por botão nenhum — tecla de mídia do
  // teclado, Picture-in-Picture, a Media Session do sistema, outra aba tomando
  // o áudio, a política de autoplay recusando o início.
  function paintPlay(): void {
    const playing = !media.paused && !media.ended;
    playButton.setAttribute('aria-label', playing ? labels.pause : labels.play);
    playButton.replaceChildren(iconSvg(ico(playing ? Pause : Play)));
  }

  function paintMute(): void {
    muteButton.setAttribute('aria-label', media.muted ? labels.unmute : labels.mute);
    muteButton.replaceChildren(iconSvg(ico(media.muted ? VolumeX : Volume2)));
  }

  function paintTime(): void {
    const { currentTime, duration } = media;
    time.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
    if (Number.isFinite(duration) && duration > 0) {
      seek.max = String(duration);
      seek.value = String(currentTime);
      // O slider anuncia POSIÇÃO, e "37" não é posição para quem ouve. O texto
      // do valor é o relógio, que é o que a pessoa quer saber.
      seek.setAttribute('aria-valuetext', `${formatTime(currentTime)} de ${formatTime(duration)}`);
    }
  }

  function paintRate(): void {
    rateSelect.value = String(media.playbackRate);
  }

  function paintFullscreen(): void {
    if (!fsButton) return;
    const on = document.fullscreenElement === root;
    fsButton.setAttribute('aria-label', on ? labels.exitFullscreen : labels.enterFullscreen);
    fsButton.replaceChildren(iconSvg(ico(on ? Minimize : Maximize)));
  }

  function paintPip(): void {
    if (!pipButton) return;
    const on = document.pictureInPictureElement === media;
    pipButton.setAttribute('aria-label', on ? labels.exitPip : labels.enterPip);
  }

  media.addEventListener('playing', () => {
    paintPlay();
    options.onPlay?.();
  });

  media.addEventListener('pause', () => {
    paintPlay();
    // `ended` viaja junto porque `pause` dispara TAMBÉM no fim da mídia, e
    // antes do `ended` — medido. Sem este campo, quem consome não tem como
    // separar "alguém pausou" de "acabou".
    options.onPause?.({ ended: media.ended, currentTime: media.currentTime });
  });

  media.addEventListener('ended', () => {
    paintPlay();
    options.onEnded?.();
  });

  media.addEventListener('timeupdate', paintTime);
  media.addEventListener('loadedmetadata', paintTime);
  media.addEventListener('volumechange', paintMute);
  media.addEventListener('ratechange', paintRate);

  playButton.addEventListener('click', () => {
    if (media.paused || media.ended) {
      // A promessa PODE ser recusada — a política de autoplay nega `play()` sem
      // ativação do usuário. Engolir a recusa em silêncio deixaria o botão
      // mentindo; repintar devolve o estado verdadeiro.
      void media.play().catch(paintPlay);
    } else {
      media.pause();
    }
  });

  seek.addEventListener('input', () => {
    media.currentTime = Number(seek.value);
  });

  muteButton.addEventListener('click', () => {
    media.muted = !media.muted;
  });

  rateSelect.addEventListener('change', () => {
    media.playbackRate = Number(rateSelect.value);
  });

  if (fsButton) {
    // A tela cheia é da MOLDURA, não do vídeo.
    //
    // Pedindo no `<video>`, o navegador passa a desenhar os controles dele — ou
    // nenhum — e a nossa barra desaparece justamente quando a tela é maior. Na
    // moldura, vídeo e controles crescem juntos.
    fsButton.addEventListener('click', () => {
      if (document.fullscreenElement === root) void document.exitFullscreen().catch(paintFullscreen);
      else void root.requestFullscreen().catch(paintFullscreen);
    });
    document.addEventListener('fullscreenchange', paintFullscreen);
  }

  if (pipButton) {
    const video = media as HTMLVideoElement;
    pipButton.addEventListener('click', () => {
      // Recusa é caminho comum, não excepcional: sem ativação do usuário o
      // navegador nega com `NotAllowedError` — medido. Repintar devolve a
      // verdade ao botão em vez de deixá-lo prometendo o que não aconteceu.
      if (document.pictureInPictureElement === video) {
        void document.exitPictureInPicture().catch(paintPip);
      } else {
        void video.requestPictureInPicture().catch(paintPip);
      }
    });
    media.addEventListener('enterpictureinpicture', paintPip);
    media.addEventListener('leavepictureinpicture', paintPip);
  }

  paintPlay();
  paintMute();
  paintTime();
  paintRate();
  paintFullscreen();
  paintPip();

  const raiz = tornarDestruivel(root, root, () => {
    // Parar e soltar a fonte: um elemento removido do documento continua
    // baixando, e um áudio removido continua TOCANDO.
    media.pause();
    media.removeAttribute('src');
    media.load();
    // `fullscreenchange` mora no DOCUMENTO, e sobrevive à remoção da moldura:
    // sem soltar aqui, cada player montado e descartado deixa um ouvinte para
    // trás, e o fecho dele segura a moldura inteira na memória.
    document.removeEventListener('fullscreenchange', paintFullscreen);
  }) as MediaPlayerRoot;
  raiz.media = media;
  return raiz;
}
