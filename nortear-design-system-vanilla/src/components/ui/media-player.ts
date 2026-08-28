// ─── Media Player — protótipo Vanilla ────────────────────────────────────────
//
// Vídeo e áudio sobre o elemento NATIVO. Não é componente entregue: é a medição
// que decide se o design system constrói o player em vez de adotar uma lib.
//
// Por que o elemento nativo. Ele já entrega, de graça: legenda por `<track>`,
// teclado, Media Session (o controle da tela de bloqueio e do fone), Picture-in
// -Picture e TODOS os eventos de reprodução. O que falta é a aparência — e
// aparência é o que um design system tem. É a mesma divisão do editor: a lib é
// o motor, a barra é nossa.
//
// A consequência boa dessa divisão é que o motor fica substituível. Se o
// `@videojs/core` (hoje em beta, GA prevista para meados de 2026) amadurecer e
// resolver qualidade adaptativa melhor do que o elemento nativo, troca-se o
// motor sem redesenhar a barra.

import { Pause, Play, Volume2, VolumeX } from 'lucide';
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
  labels: MediaPlayerLabels;
  /**
   * Disparado quando a reprodução COMEÇA de fato.
   *
   * Ligado a `playing`, e não a `play`: `play` avisa que a reprodução foi
   * PEDIDA, e entre o pedido e o primeiro quadro há o buffer. Numa mídia
   * grande os dois se separam por segundos, e contar `play` como início infla
   * a métrica com tentativas que nunca saíram do lugar.
   */
  onPlay?: () => void;
  /** Disparado em toda parada — inclusive no fim. Ver `MediaPauseInfo.ended`. */
  onPause?: (info: MediaPauseInfo) => void;
  onEnded?: () => void;
  class?: string;
};

export type MediaPlayerRoot = DestroyableElement<HTMLDivElement> & {
  /** O elemento nativo. Quem consome precisa dele para volume, taxa, faixas. */
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

  const muteButton = controlButton(labels.mute, ico(Volume2));

  controls.append(playButton, seek, time, muteButton);
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

  playButton.addEventListener('click', () => {
    if (media.paused || media.ended) {
      // A promessa PODE ser recusada — a política de autoplay nega `play()` sem
      // gesto do usuário, e há navegador que nega mesmo com gesto. Engolir a
      // recusa em silêncio deixaria o botão mentindo; repintar devolve o estado
      // verdadeiro.
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

  paintPlay();
  paintMute();
  paintTime();

  const raiz = tornarDestruivel(root, root, () => {
    // Parar e soltar a fonte: um elemento removido do documento continua
    // baixando, e um áudio removido continua TOCANDO.
    media.pause();
    media.removeAttribute('src');
    media.load();
  }) as MediaPlayerRoot;
  raiz.media = media;
  return raiz;
}
