// ─── Media Player ────────────────────────────────────────────────────────────
//
// Um player, DOIS motores, uma API.
//
//   nativo     `<video>` / `<audio>` — propriedade e evento de DOM
//   provedor   `<iframe>` do YouTube ou do Vimeo — conversa por `postMessage`
//
// Quem consome passa os mesmos `labels` e escuta `(played)`, `(paused)` e
// `(finished)` nos dois casos, e vê a mesma barra. Isso só é possível porque a
// barra ficou do nosso lado desde o começo: ela fala com um ESTADO, e cada motor
// alimenta esse estado do jeito que sabe. Trocar o motor não redesenha nada.
//
// Por que o elemento nativo é o padrão: ele já entrega legenda por `<track>`,
// teclado, Media Session, Picture-in-Picture, tela cheia e todos os eventos.
// Por que o provedor existe: nem todo vídeo é nosso para hospedar.
//
// A referência de markup, de classes `.nds-*` e de comportamento é
// `nortear-design-system-vanilla/src/components/ui/media-player.ts`. O que muda
// aqui é o CICLO DE VIDA: no lugar de `paint*()` chamadas à mão, o estado são
// signals e o template deriva deles; no lugar de `destroy()`, o cleanup dos
// effects e o `ngOnDestroy`. As divergências de API de framework — nome de
// saída, host em vez de `<div>` — estão comentadas onde acontecem.

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  isDevMode,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import {
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  Volume2,
  VolumeX,
} from 'lucide';

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

/** Quanto tempo parado até a barra sair de cena, em tela cheia. */
const IDLE_MS = 3000;

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
   * dois relógios. É molde, e não conector solto, porque a ordem dos dois
   * tempos e a palavra entre eles são decisão de cada idioma. Antes desta
   * chave o conector estava cravado em pt-BR, e numa página em inglês quem
   * ouve recebia uma preposição em português entre dois relógios.
   */
  seekValueText: string;
  /**
   * O que a barra diz no lugar do relógio quando a fonte é AO VIVO.
   *
   * Transmissão não tem duração, e `--:--` ao lado de uma barra parada se lê
   * como defeito. Este rótulo é o que separa "não sei" de "não existe".
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

/**
 * O elemento hospedeiro carrega os dois motores possíveis — e um deles é sempre
 * nulo.
 *
 * Mesma superfície da raiz devolvida pela fábrica do Vanilla. A story e o teste
 * só alcançam o componente pelo DOM, e o que importa (qual motor está montado,
 * onde está o relógio da mídia) vive no elemento, não numa propriedade de
 * classe. A instância expõe os mesmos dois nomes, para quem tem um `viewChild`.
 */
export type MediaPlayerHostElement = HTMLElement & {
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

// ─── Ícones ──────────────────────────────────────────────────────────────────
//
// Mesmo mecanismo do `NdsEditorIcon`: o host é o próprio `<svg>` e os filhos
// nascem de `createElementNS`, porque cada ícone do lucide é uma lista
// `[tag, attrs]` com tag variável, e template Angular exige tag estática.

const asIcon = (node: unknown): LucideIconNode[] => node as LucideIconNode[];

const MEDIA_PLAYER_ICONS = {
  play: asIcon(Play),
  pause: asIcon(Pause),
  volumeOn: asIcon(Volume2),
  volumeOff: asIcon(VolumeX),
  enterFullscreen: asIcon(Maximize),
  exitFullscreen: asIcon(Minimize),
  pictureInPicture: asIcon(PictureInPicture2),
} satisfies Record<string, LucideIconNode[]>;

export type MediaPlayerIconKind = keyof typeof MEDIA_PLAYER_ICONS;

@Component({
  selector: 'svg[ndsMediaPlayerIcon]',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    // O ícone reforça o rótulo, nunca o substitui: o nome acessível vive no
    // `aria-label` do botão, que é só de ícone.
    'aria-hidden': 'true',
  },
})
export class NdsMediaPlayerIcon {
  readonly kind = input.required<MediaPlayerIconKind>();

  private readonly hostRef = inject<ElementRef<SVGSVGElement>>(ElementRef);

  constructor() {
    effect(() => {
      const svg = this.hostRef.nativeElement;
      svg.replaceChildren();
      for (const [tag, attrs] of MEDIA_PLAYER_ICONS[this.kind()]) {
        const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [name, value] of Object.entries(attrs)) child.setAttribute(name, value);
        svg.appendChild(child);
      }
    });
  }
}

/** Velocidades oferecidas quando quem consome não escolhe outra lista. */
const DEFAULT_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

@Component({
  selector: 'nds-media-player',
  standalone: true,
  imports: [NdsMediaPlayerIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    // A moldura É o host. No Vanilla ela é um `<div class="nds-media-player">`;
    // aqui é `<nds-media-player>` com a mesma classe, porque um `<div>` interno
    // acrescentaria uma caixa entre o host e a folha. A classe declara
    // `display: flex`, então a largura do host não se perde — é a armadilha
    // `host_inline_com_largura`, que só morde quem põe classe de largura em host
    // cujo `.nds-*` não declara display.
    class: 'nds-media-player',
    '[attr.data-slot]': '"media-player"',
    '[attr.data-kind]': 'dataKind()',
    '[attr.data-live]': 'live()',
    '[attr.data-fullscreen]': 'fullscreenOn()',
    '[attr.data-idle]': 'idle()',
    // `focusin` está na lista por acessibilidade, e não por simetria: chegar
    // num controle pelo teclado é atividade, e a barra tem de estar visível
    // quando o foco pousa nela.
    '(pointermove)': 'markActive()',
    '(pointerdown)': 'markActive()',
    '(keydown)': 'markActive()',
    '(focusin)': 'markActive()',
    // `group` e não `region`: o player é um agrupamento de controles, e `region`
    // entraria na lista de marcos da página — um player por artigo poluiria a
    // navegação por marco de quem usa leitor de tela.
    role: 'group',
    '[attr.aria-label]': 'labels().player',
  },
  template: `
    @if (embed(); as source) {
      <!--
        O quadro tem nome próprio: sem 'title' o leitor de tela anuncia apenas
        "quadro", e uma página com três vídeos vira três "quadro".

        'sandbox' NÃO entra, e a ausência é decisão: os dois provedores precisam
        de scripts e de mesma origem consigo mesmos, e um sandbox que os permita
        não restringe nada — seria teatro. O que de fato limita é o 'allow'.

        E o 'allow' NÃO está aqui: o Angular recusa 'allow' como binding em
        iframe (NG0910), porque atributo sensível a segurança só pode ser
        estático. Escrevê-lo estático aqui duplicaria a constante que as cinco
        stacks compartilham, então ele é escrito no elemento — junto do 'src', e
        antes dele, porque a política de permissão é lida na NAVEGAÇÃO.
      -->
      <iframe
        #frame
        class="nds-media-player-surface"
        frameborder="0"
        loading="lazy"
        [attr.title]="labels().player"
      ></iframe>
    } @else if (kind() === 'video') {
      <!-- SEM 'controls': os controles nativos apareceriam junto dos nossos. -->
      <video
        #media
        class="nds-media-player-surface"
        preload="metadata"
        [attr.poster]="poster() || null"
      >
        @for (caption of tracks(); track caption.src) {
          <track
            kind="captions"
            [attr.src]="caption.src"
            [attr.srclang]="caption.srclang"
            [attr.label]="caption.label"
            [attr.default]="caption.default ? '' : null"
          />
        }
      </video>
    } @else {
      <audio #media class="nds-media-player-surface" preload="metadata"></audio>
    }

    <!--
      'group', e não 'toolbar': barra de ferramentas promete navegação por seta, e
      aqui a seta pertence à barra de progresso, que a usa para avançar a mídia.
    -->
    <div
      class="nds-media-player-controls"
      data-slot="media-player-controls"
      role="group"
      [attr.aria-label]="labels().controls"
    >
      <button
        type="button"
        class="nds-media-player-button"
        [attr.aria-label]="playLabel()"
        (click)="onPlayClick()"
      >
        <svg ndsMediaPlayerIcon [kind]="isPlaying() ? 'pause' : 'play'"></svg>
      </button>

      <!--
        A posição, o máximo e o texto do valor são pintados por effect sobre o
        elemento, e não por binding: em fonte ao vivo a duração é infinita, e
        nesse caso o Vanilla NÃO toca no slider — um binding o devolveria ao zero
        a cada ciclo, no meio do arrasto de quem está mexendo nele.
      -->
      <input
        #seek
        type="range"
        class="nds-media-player-seek"
        min="0"
        max="100"
        step="0.1"
        value="0"
        [hidden]="live()"
        [attr.aria-label]="labels().seek"
        (input)="onSeek($event)"
      />

      <span class="nds-media-player-time" data-slot="media-player-time">{{ clock() }}</span>

      <!--
        Um '<select>' nativo, e não um menu desenhado: já é operável por teclado,
        já anuncia opção e valor, já se comporta como a plataforma manda no toque.
      -->
      <select
        #rate
        class="nds-media-player-rate"
        data-slot="media-player-rate"
        [hidden]="rateOptions().length === 0"
        [attr.aria-label]="labels().rate"
        (change)="onRateChange($event)"
      >
        @for (option of rateOptions(); track option.value) {
          <option [value]="option.value">{{ option.label }}</option>
        }
      </select>

      <button
        type="button"
        class="nds-media-player-button"
        [attr.aria-label]="muteLabel()"
        (click)="onMuteClick()"
      >
        <svg ndsMediaPlayerIcon [kind]="isMuted() ? 'volumeOff' : 'volumeOn'"></svg>
      </button>

      <!--
        Tela cheia e janela flutuante entram por DETECÇÃO em tempo de execução: a
        resposta muda com o navegador, com a permissão do iframe que hospeda a
        página e com o próprio elemento. Botão que não faz nada é ruído.

        No provedor o PiP fica de fora: quem tem a faixa de vídeo é o documento
        dentro do quadro, e ele é de outra origem — não há como pedir daqui.
      -->
      @if (canPip()) {
        <!--
          Nasce escondido e é revelado quando se souber que HÁ faixa de vídeo. A
          detecção de capacidade não basta: 'pictureInPictureEnabled' responde
          pelo DOCUMENTO, não pelo conteúdo — um '<video>' alimentado com áudio
          passa por ela e recusa o pedido com 'InvalidStateError' (medido,
          'videoWidth=0'). Escondido primeiro e revelado depois, e não o
          contrário: mostrar para depois esconder faria a barra saltar quando os
          metadados chegassem.
        -->
        <button
          type="button"
          class="nds-media-player-button"
          [hidden]="!hasVideoTrack()"
          [attr.aria-label]="pipLabel()"
          (click)="onPipClick()"
        >
          <svg ndsMediaPlayerIcon kind="pictureInPicture"></svg>
        </button>
      }

      @if (canFullscreen()) {
        <button
          type="button"
          class="nds-media-player-button"
          [attr.aria-label]="fullscreenLabel()"
          (click)="onFullscreenClick()"
        >
          <svg
            ndsMediaPlayerIcon
            [kind]="isFullscreen() ? 'exitFullscreen' : 'enterFullscreen'"
          ></svg>
        </button>
      }
    </div>
  `,
})
export class MediaPlayerComponent implements OnDestroy {
  /** Motor nativo a montar. Ignorado quando a fonte é `embed`. */
  readonly kind = input<MediaPlayerKind>('video');

  /** Endereço da mídia. Exclusivo com `stream` e com `embed`. */
  readonly src = input<string | undefined>(undefined);

  /**
   * Fonte ao vivo — câmera, compartilhamento de tela, canvas.
   *
   * MEDIDO: `playbackRate` é ignorado em stream (1.5 escrito lê de volta 1) e a
   * duração é infinita, então a barra de progresso não tem o que representar.
   */
  readonly stream = input<MediaStream | undefined>(undefined);

  /**
   * Vídeo hospedado no YouTube ou no Vimeo.
   *
   * Muda o MOTOR, não a API. O que muda por baixo é que não existe elemento de
   * mídia: existe um `<iframe>` de outra origem, e a conversa é por
   * `postMessage`.
   *
   * O que fica FORA do alcance, e não é contornável: legenda, faixa de áudio e
   * qualidade pertencem ao provedor; a política de privacidade de quem assiste é
   * do provedor; e o Picture-in-Picture depende de a página que hospeda já ter a
   * permissão para delegar ao quadro.
   */
  readonly embed = input<EmbedSource | undefined>(undefined);

  readonly poster = input<string | undefined>(undefined);

  /** Faixas de legenda da mídia própria. */
  readonly tracks = input<MediaPlayerTrack[]>([]);

  /** Velocidades oferecidas. Lista vazia esconde o seletor. */
  readonly rates = input<number[]>(DEFAULT_RATES);

  /**
   * Nome acessível do player, da barra e de cada controle. Todos são só de
   * ícone, então o rótulo é o que o leitor de tela anuncia.
   */
  readonly labels = input.required<MediaPlayerLabels>();

  /**
   * Disparado quando a reprodução COMEÇA de fato.
   *
   * No motor nativo é `playing`, não `play`: `play` avisa que a reprodução foi
   * PEDIDA, e entre o pedido e o primeiro quadro há o buffer. Contar `play`
   * infla a métrica com tentativas que nunca saíram do lugar.
   *
   * O nome é divergência de API de framework, e se registra em vez de se
   * "alinhar": em Angular a saída é um verbo no passado (`(played)`), porque
   * `(play)` colidiria com a leitura de "faça play" no template.
   */
  readonly played = output<void>();

  /** Disparado em toda parada — inclusive no fim. Ver `MediaPauseInfo.ended`. */
  readonly paused = output<MediaPauseInfo>();

  readonly finished = output<void>();

  // ─── Estado ────────────────────────────────────────────────────────────────
  //
  // O que a barra sabe, independentemente de quem informou.
  //
  // Existe porque os dois motores contam a mesma história em línguas diferentes:
  // o nativo por propriedade lida na hora, o provedor por mensagem que chega
  // quando chega. Sem este intermediário, cada pedaço do template precisaria
  // saber qual motor está por baixo — e a barra deixaria de ser uma só.

  private readonly playing = signal(false);
  private readonly ended = signal(false);
  private readonly muted = signal(false);
  private readonly currentTime = signal(0);
  private readonly duration = signal(Number.NaN);
  private readonly rate = signal(1);
  /** Há faixa de vídeo? Só o nativo sabe responder; no quadro é uma aposta. */
  private readonly hasVideoTrackState = signal(false);
  // `protected`, e não `private`: o host binding `[attr.data-fullscreen]` é
  // expressão de TEMPLATE, e template não enxerga membro privado.
  protected readonly fullscreenOn = signal(false);

  /**
   * Em tela cheia a barra some depois de um tempo sem atividade, e volta ao
   * primeiro sinal de vida. Fora da tela cheia NUNCA some — ali a moldura é
   * pequena e a barra é a única forma de operar.
   *
   * Quem esconde é a folha compartilhada, por `[data-fullscreen][data-idle]`;
   * aqui só se decide QUANDO. A separação é o que torna a regra exercitável: a
   * pseudo-classe `:fullscreen` exige tela cheia de verdade, que exige ativação
   * do usuário — e o clique sintético do driver não a concede (medido).
   */
  protected readonly idle = signal(false);
  private idleTimer: ReturnType<typeof setTimeout> | null = null;

  protected markActive(): void {
    this.idle.set(false);
    if (this.idleTimer !== null) clearTimeout(this.idleTimer);
    this.idleTimer = null;
    // O relógio só corre em tela cheia: fora dela não há o que esconder.
    if (!this.fullscreenOn()) return;
    this.idleTimer = setTimeout(() => this.idle.set(true), IDLE_MS);
  }
  private readonly pipOn = signal(false);
  /** O elemento aceita Picture-in-Picture? Só se sabe com ele montado. */
  private readonly pipSupported = signal(false);

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  private readonly mediaRef = viewChild<ElementRef<HTMLMediaElement>>('media');
  private readonly frameRef = viewChild<ElementRef<HTMLIFrameElement>>('frame');
  private readonly seekRef = viewChild<ElementRef<HTMLInputElement>>('seek');
  private readonly rateRef = viewChild<ElementRef<HTMLSelectElement>>('rate');


  /**
   * O elemento nativo — `null` em provedor externo.
   *
   * Getter e não signal: é assim que o conteúdo compartilhado ensina a lê-lo
   * (`this.player().media`), e uma leitura pontual não precisa reagir a nada.
   */
  get media(): HTMLMediaElement | null {
    return this.mediaRef()?.nativeElement ?? null;
  }

  /** O quadro — `null` quando a fonte é nativa. */
  get frame(): HTMLIFrameElement | null {
    return this.frameRef()?.nativeElement ?? null;
  }

  // ─── Capacidades, medidas em tempo de execução ─────────────────────────────

  private readonly fullscreenEnabled =
    typeof document !== 'undefined' && document.fullscreenEnabled;
  private readonly pipEnabled =
    typeof document !== 'undefined' && document.pictureInPictureEnabled;

  private readonly isVideoSource = computed(
    () => this.kind() === 'video' || Boolean(this.embed()),
  );

  protected readonly canFullscreen = computed(
    () =>
      this.isVideoSource()
      && this.fullscreenEnabled
      && typeof this.hostRef.nativeElement.requestFullscreen === 'function',
  );

  protected readonly canPip = computed(
    () => !this.embed() && this.kind() === 'video' && this.pipEnabled && this.pipSupported(),
  );

  // ─── O que o template lê ───────────────────────────────────────────────────

  protected readonly dataKind = computed(() => this.embed()?.provider ?? this.kind());

  protected readonly isPlaying = computed(() => this.playing() && !this.ended());
  protected readonly isMuted = this.muted.asReadonly();
  protected readonly isFullscreen = this.fullscreenOn.asReadonly();
  protected readonly hasVideoTrack = this.hasVideoTrackState.asReadonly();

  protected readonly playLabel = computed(() =>
    this.isPlaying() ? this.labels().pause : this.labels().play,
  );
  protected readonly muteLabel = computed(() =>
    this.muted() ? this.labels().unmute : this.labels().mute,
  );
  protected readonly fullscreenLabel = computed(() =>
    this.fullscreenOn() ? this.labels().exitFullscreen : this.labels().enterFullscreen,
  );
  protected readonly pipLabel = computed(() =>
    this.pipOn() ? this.labels().exitPip : this.labels().enterPip,
  );

  /**
   * Fonte AO VIVO: duração infinita não é duração desconhecida, é ausência de
   * fim. A diferença importa na tela — `0:00 / --:--` com uma barra que não
   * anda se lê como componente quebrado, e foi assim que a transmissão
   * apareceu. `Infinity` é o que o navegador reporta em `MediaStream`, e também
   * o que um canal ao vivo de verdade reporta.
   */
  protected readonly live = computed(() => this.duration() === Number.POSITIVE_INFINITY);

  protected readonly clock = computed(() =>
    this.live()
      ? this.labels().live
      : `${formatTime(this.currentTime())} / ${formatTime(this.duration())}`,
  );

  /**
   * As opções do seletor, já como texto.
   *
   * `1×`, e não `1`: sozinho o número não diz de que grandeza se fala. E o valor
   * viaja como string porque é o que a propriedade `value` do `<option>` aceita
   * — `strictTemplates` reprova o número.
   */
  protected readonly rateOptions = computed(() =>
    this.rates().map((value) => ({ value: String(value), label: `${value}×` })),
  );

  constructor() {
    // ── Motor A: o elemento nativo ───────────────────────────────────────────
    effect((onCleanup) => {
      const element = this.mediaRef()?.nativeElement;
      (this.hostRef.nativeElement as MediaPlayerHostElement).media = element ?? null;
      if (!element) return;

      // `untracked` porque este bloco LÊ inputs que não podem re-disparar a
      // fiação: `tracks` mudando religaria os ouvintes e, pior, passaria pelo
      // cleanup — que para a mídia e solta a fonte. Trocar a legenda pararia a
      // reprodução, e o motivo não estaria em lugar nenhum.
      untracked(() => {
        const video = element as HTMLVideoElement;
        this.pipSupported.set(
          typeof video.requestPictureInPicture === 'function' && !video.disablePictureInPicture,
        );

        if (this.kind() === 'video' && this.tracks().length === 0 && isDevMode()) {
          // Aviso, não exceção: quebrar a página por falta de legenda esconderia
          // o conteúdo de todo mundo para punir a falta de acesso de alguns.
          console.warn(
            '[nds-media-player] vídeo sem faixa de legenda. WCAG 1.2.2 (nível A) exige '
              + 'legenda para vídeo com áudio — passe `tracks`.',
          );
        }
      });

      const onPlaying = (): void => {
        this.started();
        this.refreshPip();
      };
      const onPause = (): void => this.stopped(element.ended);
      const onEnded = (): void => this.finish();
      const onTimeUpdate = (): void => {
        this.currentTime.set(element.currentTime);
        this.duration.set(element.duration);
      };
      // `loadedmetadata` é quando o conteúdo passa a ser conhecido: é ali que
      // `videoWidth` deixa de ser 0 e se descobre se HÁ faixa de vídeo.
      const onLoadedMetadata = (): void => {
        this.duration.set(element.duration);
        this.refreshPip();
      };
      const onVolumeChange = (): void => this.muted.set(element.muted);
      const onRateChange = (): void => this.rate.set(element.playbackRate);
      const onPipChange = (): void => this.refreshPip();

      const wiring: Array<[string, EventListener]> = [
        ['playing', onPlaying],
        ['pause', onPause],
        ['ended', onEnded],
        ['timeupdate', onTimeUpdate],
        ['loadedmetadata', onLoadedMetadata],
        // Stream ao vivo troca de dimensão sem novo `loadedmetadata` — a câmera
        // que gira, a janela compartilhada que muda de tamanho.
        ['resize', onPipChange],
        ['loadeddata', onPipChange],
        ['volumechange', onVolumeChange],
        ['ratechange', onRateChange],
        ['enterpictureinpicture', onPipChange],
        ['leavepictureinpicture', onPipChange],
      ];
      for (const [name, listener] of wiring) element.addEventListener(name, listener);

      onCleanup(() => {
        for (const [name, listener] of wiring) element.removeEventListener(name, listener);
        // Parar e soltar a fonte: um elemento removido do documento continua
        // baixando, e um áudio removido continua TOCANDO.
        element.pause();
        // Fonte ao vivo se solta pelo `srcObject`, e as trilhas param uma a uma:
        // `removeAttribute('src')` não alcança stream, e uma câmera aberta
        // continuaria gravando com o player já fora da tela.
        const live = element.srcObject as MediaStream | null;
        if (live) {
          for (const line of live.getTracks()) line.stop();
          element.srcObject = null;
        }
        element.removeAttribute('src');
        element.load();
      });
    });

    // A fonte é escrita no elemento, e não por binding: `srcObject` não tem
    // atributo, e escrever os dois no mesmo lugar é o que mantém a exclusão
    // entre stream e endereço visível numa linha só.
    effect(() => {
      const element = this.mediaRef()?.nativeElement;
      if (!element) return;
      const live = this.stream();
      const address = this.src();
      if (live) {
        element.srcObject = live;
      } else {
        element.srcObject = null;
        if (address) element.src = address;
      }
    });

    // ── Motor B: o quadro do provedor ────────────────────────────────────────
    effect((onCleanup) => {
      const frame = this.frameRef()?.nativeElement;
      const source = this.embed();
      (this.hostRef.nativeElement as MediaPlayerHostElement).frame = frame ?? null;
      if (!frame || !source) return;

      // O `src` é escrito no elemento, e não por `[src]`: em Angular o `src` de
      // iframe é contexto de URL de RECURSO, e um binding exigiria
      // `bypassSecurityTrustResourceUrl` — um bypass declarado é exatamente o
      // que uma varredura de segurança deve encontrar, e aqui não há valor de
      // fora em que confiar: a URL sai de `buildEmbedUrl`, com host fixo e
      // identificador escapado.
      //
      // O `allow` vem ANTES, e a ordem não é estética: a política de permissão
      // do quadro é lida na NAVEGAÇÃO, então escrevê-la depois do `src` a
      // deixaria valendo só a partir do próximo carregamento.
      //
      // Ele está aqui, e não no template, porque o Angular recusa `allow` como
      // binding em iframe (NG0910) — atributo sensível a segurança só pode ser
      // estático. MEDIDO: com o binding, o erro é lançado durante a detecção de
      // mudanças, `frame.allow` volta vazio e a story com DOIS players perde o
      // segundo inteiro. `setAttribute` não passa pela guarda, e é o que
      // preserva uma fonte só para a constante que as cinco stacks dividem.
      frame.setAttribute('allow', EMBED_ALLOW);
      frame.src = buildEmbedUrl(source, window.location.origin);

      // `start()` INSISTE até o provedor responder. Mandar uma vez, no `load`,
      // não bastava: o `load` do iframe é o documento do provedor, não o player
      // dentro dele. Medido contra os quadros reais — com um envio só, o YouTube
      // devolveu ZERO mensagens e o Vimeo não aceitou nenhuma inscrição.
      const toFrame = (message: string): void => {
        frame.contentWindow?.postMessage(message, '*');
      };
      const handshake = createEmbedHandshake(source.provider, toFrame);
      // O relógio que pergunta a posição enquanto o provedor toca. Só o Vimeo
      // precisa — ver `createEmbedClock`.
      this.providerClock = createEmbedClock(source.provider, toFrame);

      const onMessage = (event: MessageEvent): void => {
        // A página recebe `message` de QUALQUER origem — outro embed, uma
        // extensão, um anúncio. Sem conferir a fonte, um segundo player na mesma
        // página pausa o primeiro.
        if (!isFromFrame(event, frame)) return;
        // Qualquer resposta do provedor encerra a insistência do aperto de mão.
        handshake.observe(event.data);
        // Lista, e não um evento só: uma mensagem do provedor carrega mais de
        // uma notícia — o `infoDelivery` do YouTube traz estado e tempo juntos.
        for (const parsed of parseEmbedMessage(source.provider, event.data)) {
          if (parsed.type === 'playing') this.started();
          else if (parsed.type === 'paused') this.stopped(false);
          else if (parsed.type === 'ended') this.finish();
          else {
            // Só o que VEIO. O provedor avisa o que mudou, não o estado
            // inteiro: sobrescrever com `undefined` apagaria a duração a cada
            // atualização de posição, e o relógio voltaria a `--:--` no meio
            // do vídeo.
            if (parsed.currentTime !== undefined) this.currentTime.set(parsed.currentTime);
            if (parsed.duration !== undefined) this.duration.set(parsed.duration);
          }
        }
      };
      window.addEventListener('message', onMessage);

      // O aperto de mão: sem ele nenhum dos dois provedores envia evento algum.
      // É o passo que costuma faltar, e o sintoma é "os comandos funcionam mas
      // nada volta".
      const onLoad = (): void => handshake.start();
      frame.addEventListener('load', onLoad);

      onCleanup(() => {
        // Os dois ouvintes moram FORA da moldura e sobreviveriam à remoção dela;
        // e o aperto de mão insiste por dez segundos, batendo num quadro que já
        // foi se ninguém o parar.
        handshake.stop();
        this.providerClock?.stop();
        this.providerClock = null;
        window.removeEventListener('message', onMessage);
        frame.removeEventListener('load', onLoad);
        // Trocar o `src` por vazio é o que de fato para o vídeo do provedor: a
        // remoção do nó não garante que o documento de dentro pare, e vídeo
        // tocando em quadro invisível é o defeito clássico de embed.
        frame.src = 'about:blank';
      });
    });

    // ── A posição, pintada sobre o elemento ──────────────────────────────────
    effect(() => {
      const seek = this.seekRef()?.nativeElement;
      if (!seek) return;
      const position = this.currentTime();
      const total = this.duration();
      if (!Number.isFinite(total) || total <= 0) return;
      seek.max = String(total);
      seek.value = String(position);
      // O slider anuncia POSIÇÃO, e "37" não é posição para quem ouve. O texto
      // do valor é o relógio.
      seek.setAttribute(
        'aria-valuetext',
        seekValueText(this.labels().seekValueText, position, total),
      );
    });

    // O `<select>` segue o ESTADO, e não o próprio clique: mudar a velocidade
    // por fora (pelo elemento, pela tecla de mídia) tem de repintar o seletor.
    effect(() => {
      const select = this.rateRef()?.nativeElement;
      if (!select) return;
      // Leitura de `rateOptions` para reagir também à troca da LISTA: opções
      // novas nascem sem seleção, e sem isto o seletor ficaria no primeiro item.
      this.rateOptions();
      select.value = String(this.rate());
    });

    // A tela cheia é do documento, e o ouvinte sobrevive à remoção da moldura.
    if (typeof document !== 'undefined') {
      const onFullscreenChange = (): void => this.syncFullscreen();
      document.addEventListener('fullscreenchange', onFullscreenChange);
      this.destroyRef.onDestroy(() =>
        document.removeEventListener('fullscreenchange', onFullscreenChange),
      );
    }
  }

  ngOnDestroy(): void {
    // O elemento de mídia e o quadro são soltos pelo cleanup dos effects, que
    // roda na destruição do componente. Aqui fica o que não pertence a nenhum
    // dos dois — hoje, nada além de zerar o que o host expunha.
    const host = this.hostRef.nativeElement as MediaPlayerHostElement;
    host.media = null;
    host.frame = null;
  }

  /**
   * O relógio que pergunta a posição enquanto o provedor toca.
   *
   * Só o Vimeo precisa — ver `createEmbedClock`. A posição dele não estava
   * chegando: `play` e `pause` sim, e a barra saltava para o instante da pausa
   * em vez de acompanhar.
   */
  private providerClock: ReturnType<typeof createEmbedClock> | null = null;

  // ─── Os motores alimentam o estado ─────────────────────────────────────────

  private started(): void {
    this.playing.set(true);
    this.ended.set(false);
    // No provedor a posição é PERGUNTADA enquanto toca; no motor nativo isto
    // não faz nada. Ver `createEmbedClock`.
    this.providerClock?.start();
    this.played.emit();
  }

  private stopped(ended: boolean): void {
    this.playing.set(false);
    this.ended.set(ended);
    this.providerClock?.stop();
    this.paused.emit({ ended, currentTime: this.currentTime() });
  }

  private finish(): void {
    this.ended.set(true);
    this.playing.set(false);
    this.providerClock?.stop();
    this.finished.emit();
  }

  /**
   * A largura é lida NA HORA, e não guardada por um evento específico.
   *
   * Em stream ao vivo ela só aparece quando os primeiros quadros chegam, e isso
   * pode vir por `loadedmetadata`, `loadeddata`, `resize` ou `playing`, conforme
   * a fonte — depender de um deles deixa o botão escondido para sempre no caso
   * em que ele veio por outro.
   */
  private refreshPip(): void {
    const element = this.mediaRef()?.nativeElement as HTMLVideoElement | undefined;
    if (element) this.hasVideoTrackState.set(element.videoWidth > 0);
    // A comparação exige o elemento: sem ele, `pictureInPictureElement` também
    // é nulo, e `null === null` diria que o player está em janela flutuante.
    this.pipOn.set(Boolean(element) && document.pictureInPictureElement === element);
  }

  private syncFullscreen(): void {
    this.fullscreenOn.set(document.fullscreenElement === this.hostRef.nativeElement);
  }

  private post(command: EmbedCommand): void {
    const source = this.embed();
    const frame = this.frameRef()?.nativeElement;
    if (!frame || !source) return;
    frame.contentWindow?.postMessage(embedCommand(source.provider, command), '*');
  }

  // ─── Os controles falam com o motor ────────────────────────────────────────

  protected onPlayClick(): void {
    const shouldPlay = !this.playing() || this.ended();
    const element = this.mediaRef()?.nativeElement;
    if (element) {
      // A promessa PODE ser recusada — a política de autoplay nega `play()` sem
      // ativação do usuário. Engolir a recusa deixaria o botão mentindo, então o
      // estado volta a ser o do elemento.
      if (shouldPlay) void element.play().catch(() => this.playing.set(!element.paused));
      else element.pause();
      return;
    }
    this.post({ kind: shouldPlay ? 'play' : 'pause' });
    // No quadro não há resposta síncrona: o estado só muda quando a mensagem do
    // provedor voltar. Repintar aqui seria adivinhar.
  }

  protected onSeek(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    const element = this.mediaRef()?.nativeElement;
    if (element) element.currentTime = value;
    else this.post({ kind: 'seek', value });
  }

  protected onMuteClick(): void {
    const next = !this.muted();
    const element = this.mediaRef()?.nativeElement;
    if (element) {
      element.muted = next;
      return;
    }
    // O provedor não avisa mudança de volume: o estado é nosso para manter.
    this.muted.set(next);
    this.post({ kind: 'mute', value: next });
  }

  protected onRateChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    const element = this.mediaRef()?.nativeElement;
    if (element) {
      element.playbackRate = value;
      return;
    }
    this.rate.set(value);
    this.post({ kind: 'rate', value });
  }

  /**
   * A tela cheia é da MOLDURA, não do vídeo nem do quadro.
   *
   * Pedindo no `<video>`, o navegador passa a desenhar os controles dele — ou
   * nenhum — e a nossa barra desaparece justamente quando a tela é maior. No
   * quadro seria pior: entraria em tela cheia o player do provedor, com a
   * aparência dele. Na moldura, superfície e controles crescem juntos.
   */
  protected onFullscreenClick(): void {
    const host = this.hostRef.nativeElement;
    if (document.fullscreenElement === host) {
      void document.exitFullscreen().catch(() => this.syncFullscreen());
    } else {
      void host.requestFullscreen().catch(() => this.syncFullscreen());
    }
  }

  protected onPipClick(): void {
    const video = this.mediaRef()?.nativeElement as HTMLVideoElement | undefined;
    if (!video) return;
    // A recusa não pode ser SILENCIOSA: engolir o erro transforma um pedido
    // negado em "clico e nada acontece", e o nome do erro diz o que houve —
    // `InvalidStateError` é falta de faixa de vídeo, `NotAllowedError` é falta de
    // ativação do usuário.
    const refused = (error: unknown): void => {
      this.refreshPip();
      if (isDevMode()) {
        console.warn(`[nds-media-player] Picture-in-Picture recusado: ${(error as Error).name}`);
      }
    };
    if (document.pictureInPictureElement === video) {
      void document.exitPictureInPicture().catch(refused);
    } else {
      void video.requestPictureInPicture().catch(refused);
    }
  }
}
