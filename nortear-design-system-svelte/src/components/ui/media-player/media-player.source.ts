/**
 * Transforms do painel Code do MediaPlayer.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. O painel monta o snippet pelo `sourceDecorator`
 * do renderer, que com o docgen desligado cai no nome interno da função
 * compilada — daí sairia uma tag que ninguém consegue importar.
 *
 * Uma transform NOMEADA por exemplo, e nenhuma fábrica de transform: a
 * varredura de `source-snippets.test.ts` chama cada export sem argumento e
 * cobra uma string de volta. Uma fábrica devolveria outra função, sairia da
 * convenção de nome e sumiria da contagem — que é exatamente o defeito que
 * aquele portão existe para pegar.
 */
import { svelteSnippet } from '@/lib/story-source';

const IMPORT = `import { MediaPlayer } from "@/components/ui/media-player";`;

/**
 * Todo controle da barra é só de ícone, então `labels` é a única coisa que o
 * leitor de tela tem para anunciar. O objeto tem doze nomes e pertence a quem
 * consome — no snippet ele entra por import, e não copiado inteiro a cada
 * exemplo, senão a chamada que o snippet existe para ensinar afogaria.
 */
const IMPORT_LABELS = `import { labels } from "./media-player-labels";`;

/** Identificadores públicos, os mesmos que as stories exercitam. */
const YOUTUBE_VIDEO_ID = 'aqz-KE-bpKQ';
const VIMEO_VIDEO_ID = '76979871';

/**
 * Junta os atributos, quebrando uma linha por atributo quando a fila passa do
 * limite.
 *
 * Escrito aqui, e não importado do `story-source`, porque o auxiliar de lá se
 * chama `attrsMultilinha` — a dívida de idioma que a catraca
 * `identificador_pt_novo` cobra de todo arquivo NOVO que a importa. O limite é
 * de leitura, não de lint: o painel Code é estreito e a quebra acontece de
 * qualquer jeito — melhor onde a gente escolhe.
 */
function multilineAttrs(parts: string[], indent = '  ', limit = 60): string {
  const list = parts.filter((part) => Boolean(part));
  if (!list.length) return '';
  const inLine = list.join(' ');
  if (inLine.length <= limit) return ` ${inLine}`;
  return `\n${list.map((part) => `${indent}${part}`).join('\n')}\n`;
}

/** O que as stories usam da API e que o snippet precisa mostrar. */
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
const TRACKS_ATTR =
  'tracks={[{ src: "/legendas/pt.vtt", srclang: "pt-BR", label: "Português" }]}';

/**
 * Os atributos da montagem, sem o que o componente já assume por padrão.
 *
 * `kind` nasce `video` e `rates` nasce com a lista de seis: documentação não
 * ensina a repetir o padrão, só o que difere dele. A exceção é `rates={[]}`,
 * que difere do padrão justamente por ser vazia — e é o que desliga o seletor.
 */
function commonAttrs(options: MediaPlayerSnippetOptions): string[] {
  const embed = options.embed
    ? `embed={{ provider: "${options.embed.provider}", videoId: "${options.embed.videoId}" }}`
    : '';
  return [
    options.kind === 'audio' ? 'kind="audio"' : '',
    options.src ? `src="${options.src}"` : '',
    options.stream ? `stream={${options.stream}}` : '',
    embed,
    options.tracks ? TRACKS_ATTR : '',
    options.rates && options.rates.length === 0 ? 'rates={[]}' : '',
    options.class ? `class="${options.class}"` : '',
  ].filter(Boolean);
}

/** A montagem real do componente, com os rótulos que ele exige. */
export function mediaPlayerSnippet(options: MediaPlayerSnippetOptions = {}): string {
  const head = [IMPORT, IMPORT_LABELS].join('\n');
  const attrs = multilineAttrs(['{labels}', ...commonAttrs(options)]);
  // Em fila única o fechamento pede o espaço da frente; quebrado em linhas ele
  // já vem depois de uma quebra, e o espaço sobraria.
  const close = attrs.startsWith('\n') ? '/>' : ' />';
  return svelteSnippet(head, `<MediaPlayer${attrs}${close}`);
}

/**
 * Playground: os controls decidem o motor e a lista de velocidades.
 *
 * Nas stories sem args cai nos padrões do componente.
 */
export function mediaPlayerSource(
  _generated?: string,
  ctx?: { args?: MediaPlayerSnippetOptions },
): string {
  return mediaPlayerSnippet(ctx?.args ?? {});
}

/** Video (Fontes) e WithCaptions (Composições): fonte ao vivo, com legenda. */
export function mediaPlayerVideoSource(): string {
  // A fonte ao vivo ignora `playbackRate`, e `rates={[]}` é o que desliga o
  // seletor — omitir aqui ensinaria o oposto do que a story faz.
  return mediaPlayerSnippet({ kind: 'video', src: '/videos/tour.mp4', tracks: true, rates: [] });
}

/** Audio (Fontes) e todos os Estados: o motor de áudio, sem superfície. */
export function mediaPlayerAudioSource(): string {
  return mediaPlayerSnippet({ kind: 'audio', src: '/audios/episodio.mp3' });
}

/** YouTube (Fontes) e TwoPlayers (Composições). */
export function mediaPlayerYouTubeSource(): string {
  return mediaPlayerSnippet({ embed: { provider: 'youtube', videoId: YOUTUBE_VIDEO_ID } });
}

/** Vimeo (Fontes). */
export function mediaPlayerVimeoSource(): string {
  return mediaPlayerSnippet({ embed: { provider: 'vimeo', videoId: VIMEO_VIDEO_ID } });
}
