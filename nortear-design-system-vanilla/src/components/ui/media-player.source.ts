// Snippet do painel Code do MediaPlayer — ver `@/lib/story-source`.
//
// O renderer html imprimiria o `outerHTML` da moldura: um `<div>` com um
// `<video>` e sete botões, que não é o que se escreve nesta stack. O que se
// copia é a chamada da fábrica.

import {
  importing,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

/**
 * A chamada da fábrica, em uma linha enquanto couber.
 *
 * Mesmo desenho do auxiliar do `story-source`, escrito aqui porque os dois
 * nomes de lá (`chamada`, `montar`) são a dívida de idioma que a catraca
 * `identificador_pt_novo` cobra de todo arquivo NOVO que os importa.
 */
function factoryCall(factory: string, lines: string[]): string {
  const oneLine = `${factory}({ ${lines.map((line) => line.replace(/,$/, '')).join(', ')} })`;
  // O limite é de leitura, não de lint: o painel Code é estreito e a quebra
  // acontece de qualquer jeito — melhor onde a gente escolhe.
  if (oneLine.length <= 72) return oneLine;
  return `${factory}({\n${lines.map((line) => `  ${line}`).join('\n')}\n})`;
}

/** Linha final canônica: o elemento devolvido pela fábrica entra na página. */
function appendToPage(variable: string): string {
  return `document.querySelector('#app')?.append(${variable});`;
}

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
  "  player: 'Reprodutor',",
  "  controls: 'Controles de reprodução',",
  "  play: 'Reproduzir', pause: 'Pausar',",
  "  mute: 'Silenciar', unmute: 'Ativar o som',",
  "  seek: 'Posição da reprodução', rate: 'Velocidade de reprodução',",
  "  enterFullscreen: 'Tela cheia', exitFullscreen: 'Sair da tela cheia',",
  "  enterPip: 'Janela flutuante', exitPip: 'Sair da janela flutuante',",
  '};',
].join('\n');

/** O que as stories usam da `MediaPlayerOptions` e que o snippet precisa mostrar. */
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
  class?: string;
};

/**
 * A faixa de legenda, na forma que se escreve.
 *
 * O `src` das stories é um `data:` de 24 caracteres — copiá-lo ensinaria a
 * embutir legenda em base64, que não é o caso de uso de ninguém.
 */
const TRACKS_BLOCK = "tracks: [{ src: '/legendas/pt.vtt', srclang: 'pt-BR', label: 'Português' }]";

/**
 * As opções da chamada, sem o que a fábrica já assume por padrão.
 *
 * `kind` nasce `video` e `rates` nasce com a lista de seis: documentação não
 * ensina a repetir o padrão, só o que difere dele. A exceção é `rates: []`,
 * que difere do padrão justamente por ser vazia — e é o que desliga o seletor.
 */
function commonOptions(o: MediaPlayerSnippetOptions): string[] {
  const embed = o.embed
    ? `{ provider: ${text(o.embed.provider)}, videoId: ${text(o.embed.videoId)} }`
    : undefined;
  return options([
    ['kind', o.kind === 'audio' ? text('audio') : undefined],
    ['src', o.src ? text(o.src) : undefined],
    ['stream', o.stream],
    ['embed', embed],
    ['tracks', o.tracks ? TRACKS_BLOCK.replace(/^tracks: /, '') : undefined],
    ['rates', o.rates && o.rates.length === 0 ? '[]' : undefined],
    ['labels', 'labels'],
    ['class', o.class ? text(o.class) : undefined],
  ]);
}

/** A chamada real de `createMediaPlayer`, com os rótulos que ela exige. */
export function mediaPlayerSnippet(o: MediaPlayerSnippetOptions = {}): string {
  return snippet(
    importing('media-player', 'createMediaPlayer'),
    LABELS_BLOCK,
    `const player = ${factoryCall('createMediaPlayer', commonOptions(o))};`,
    appendToPage('player'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai nos padrões da fábrica.
 */
export const mediaPlayerSource: SourceTransform<MediaPlayerSnippetOptions> = (_generated, ctx) =>
  mediaPlayerSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function mediaPlayerSourceWith(
  fixed: MediaPlayerSnippetOptions,
): SourceTransform<MediaPlayerSnippetOptions> {
  return (_generated, ctx) => mediaPlayerSnippet({ ...ctx.args, ...fixed });
}
