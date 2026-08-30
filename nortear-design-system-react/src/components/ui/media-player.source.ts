/**
 * Transforms do painel Code do MediaPlayer.
 *
 * O painel imprimiria a árvore do `render`, que passa pelo `MediaPlayerCanvas`
 * das fixtures e por uma mídia construída em memória — andaime que só existe na
 * suíte. O que se copia é a chamada real do componente.
 *
 * Módulo de TS puro — o `.tsx` não entra aqui. É o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm: a saída do painel
 * não chega ao DOM durante a `play`.
 */
import { jsxSnippet, text, type SourceTransform } from '@/lib/story-source';

const IMPORTS = 'import { MediaPlayer } from "@/components/ui/media-player";';

/**
 * O objeto de rótulos, resumido.
 *
 * `labels` é obrigatório e tem doze nomes: imprimi-los todos afogaria a chamada
 * que o snippet existe para ensinar. O que o leitor precisa levar daqui é a
 * FORMA e a razão de serem obrigatórios.
 */
const LABELS_BLOCK = [
  '// Todo controle é só de ícone: o rótulo É o nome acessível que o leitor de',
  '// tela anuncia. Os pares (play/pause, mute/unmute) trocam com o estado.',
  'const labels = {',
  '  player: "Reprodutor",',
  '  controls: "Controles de reprodução",',
  '  play: "Reproduzir", pause: "Pausar",',
  '  mute: "Silenciar", unmute: "Ativar o som",',
  '  seek: "Posição da reprodução", rate: "Velocidade de reprodução",',
  '  enterFullscreen: "Tela cheia", exitFullscreen: "Sair da tela cheia",',
  '  enterPip: "Janela flutuante", exitPip: "Sair da janela flutuante",',
  '};',
].join('\n');

/** O que as stories usam da `MediaPlayerProps` e que o snippet precisa mostrar. */
export type MediaPlayerSnippetOptions = {
  kind?: 'video' | 'audio';
  src?: string;
  /** Descrição da fonte ao vivo — a expressão que a monta, como TEXTO. */
  stream?: string;
  /** Provedor externo, quando a story o exercita. */
  embed?: { provider: 'youtube' | 'vimeo'; videoId: string };
  /** Há faixa de legenda? O snippet mostra a forma, não o arquivo. */
  tracks?: boolean;
  rates?: number[];
  className?: string;
};

/**
 * A faixa de legenda, na forma que se escreve.
 *
 * O `src` das stories é um `data:` de 24 caracteres — copiá-lo ensinaria a
 * embutir legenda em base64, que não é o caso de uso de ninguém.
 */
const TRACKS_ATTR =
  'tracks={[{ src: "/legendas/pt.vtt", srclang: "pt-BR", label: "Português" }]}';

/** Um atributo por linha — a fila de props do player passa de qualquer limite. */
function playerTag(parts: Array<string | false | null | undefined>): string {
  const list = parts.filter((part): part is string => Boolean(part));
  return `<MediaPlayer\n${list.map((part) => `  ${part}`).join('\n')}\n/>`;
}

/**
 * Os atributos da chamada, sem o que o componente já assume por padrão.
 *
 * `kind` nasce `video` e `rates` nasce com a lista de seis: documentação não
 * ensina a repetir o padrão, só o que difere dele. A exceção é `rates={[]}`,
 * que difere do padrão justamente por ser vazia — e é o que desliga o seletor.
 */
function commonAttrs(options: MediaPlayerSnippetOptions): Array<string | undefined> {
  const embed = options.embed
    ? `embed={{ provider: "${options.embed.provider}", videoId: "${options.embed.videoId}" }}`
    : undefined;
  return [
    options.kind === 'audio' ? 'kind="audio"' : undefined,
    text(options.src) ? `src="${text(options.src)}"` : undefined,
    // A fonte ao vivo é uma EXPRESSÃO, e só entra como tal: um `MediaStream` em
    // `String()` vira `[object MediaStream]`, e é isso que os args da story
    // entregariam se o valor não fosse texto.
    text(options.stream) ? `stream={${text(options.stream)}}` : undefined,
    embed,
    options.tracks ? TRACKS_ATTR : undefined,
    options.rates && options.rates.length === 0 ? 'rates={[]}' : undefined,
    'labels={labels}',
    text(options.className) ? `className="${text(options.className)}"` : undefined,
  ];
}

/** A chamada real do `MediaPlayer`, com os rótulos que ele exige. */
export function mediaPlayerSnippet(options: MediaPlayerSnippetOptions = {}): string {
  return jsxSnippet(`${IMPORTS}\n\n${LABELS_BLOCK}`, playerTag(commonAttrs(options)));
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai nos padrões do componente.
 */
export const mediaPlayerSource: SourceTransform<MediaPlayerSnippetOptions> = (_generated, ctx) =>
  mediaPlayerSnippet(ctx?.args ?? {});

/**
 * Transforms de story: mesmo componente, opções fixas que os controls não
 * cobrem.
 *
 * Uma por configuração, e não uma fábrica que recebe a configuração. A fábrica
 * devolvia FUNÇÃO, e o guarda transversal chama todo export sem argumento
 * esperando string — curried, os quatro checks que verificam o snippet (texto
 * honesto, peças com origem, import que o componente exporta, espião de control
 * que não vaza) nunca chegavam ao snippet. Nomeadas, cada uma é verificada.
 */
const comFixas =
  (fixed: MediaPlayerSnippetOptions): SourceTransform<MediaPlayerSnippetOptions> =>
  (_generated, ctx) =>
    mediaPlayerSnippet({ ...ctx?.args, ...fixed });

/** Com faixas de legenda, e sem o seletor de velocidade. */
export const mediaPlayerTracksSource = comFixas({ tracks: true, rates: [] });

/** Só áudio. */
export const mediaPlayerAudioSource = comFixas({ kind: 'audio' });

/**
 * Os vídeos das demonstrações incorporadas.
 *
 * Moram aqui, e não nas fixtures, porque é o snippet que precisa deles como
 * TEXTO — a fixture só os repassa ao componente. Declarados nos dois, o painel
 * Code ensinaria um vídeo e a demonstração tocaria outro, e nada acusaria.
 */
export const YOUTUBE_VIDEO_ID = 'aqz-KE-bpKQ';
export const VIMEO_VIDEO_ID = '76979871';

/** Incorporado do YouTube. */
export const mediaPlayerYoutubeSource = comFixas({
  embed: { provider: 'youtube', videoId: YOUTUBE_VIDEO_ID },
});

/** Incorporado do Vimeo. */
export const mediaPlayerVimeoSource = comFixas({
  embed: { provider: 'vimeo', videoId: VIMEO_VIDEO_ID },
});
