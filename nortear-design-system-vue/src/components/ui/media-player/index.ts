export { default as MediaPlayer } from './MediaPlayer.vue';

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
 * O que a instância expõe para quem monta o player por fora.
 *
 * UM DOS DOIS É SEMPRE NULO, e o tipo obriga quem consome a declarar qual
 * espera: em provedor externo não há mídia, há um quadro de outra origem. Sem
 * isso alguém escreve `player.media.currentTime` e descobre em produção que ali
 * não existe mídia nenhuma.
 */
export type MediaPlayerApi = {
  media: HTMLMediaElement | null;
  frame: HTMLIFrameElement | null;
};

export type { EmbedProvider, EmbedSource } from './media-embed';

/**
 * `83` vira `1:23`. Duração desconhecida vira `--:--`, não `NaN:aN`.
 *
 * Mora aqui, e não dentro do SFC, porque é superfície PÚBLICA do componente — o
 * mesmo formato que a barra pinta é o que quem consome usa para escrever a
 * duração ao lado de uma lista de episódios. Um `<script>` extra só para
 * exportá-la do SFC daria ao módulo duas portas de entrada para a mesma coisa.
 */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

/** Velocidades oferecidas quando `rates` não é declarado. */
export const DEFAULT_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

