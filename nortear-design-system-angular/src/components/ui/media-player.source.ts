// Snippets do painel Code do MediaPlayer.
//
// O painel imprime o `template` da story como está escrito — com os bindings
// ligados aos args e com o andaime que só existe para a story ocupar a tela.
// Isso não é o que alguém escreve para usar o componente. Estas funções devolvem
// o uso real, com os valores atuais dos controls já resolvidos.
//
// Vive num arquivo próprio, e não solto na story, porque QUATRO arquivos de
// story mostram o mesmo componente: repetir o construtor em cada um é como as
// cópias divergem sem ninguém notar. É também o que permite ao módulo rodar em
// TS puro, sem o compilador de template no caminho — e por isso ele tem teste de
// unidade, que nenhuma play alcançaria: a saída do painel não vai ao DOM.
//
// A decisão de composição: `[labels]` aparece SEMPRE. Todos os controles são só
// de ícone, e sem o objeto de rótulos a barra não tem nome acessível nenhum — é
// a única entrada obrigatória, e um snippet que a omitisse ensinaria um player
// que o axe reprova.

/**
 * O objeto de rótulos, como campo da classe.
 *
 * São doze nomes, e imprimi-los todos afogaria o uso que o snippet existe para
 * ensinar — por isso os pares vão na mesma linha. O que o leitor precisa levar
 * daqui é a FORMA e a razão de serem obrigatórios.
 */
const LABELS_FIELD = [
  '  // Todo controle é só de ícone: o rótulo É o nome acessível que o leitor de',
  '  // tela anuncia. Os pares (play/pause, mute/unmute) trocam com o estado.',
  '  readonly labels = {',
  "    player: 'Reprodutor',",
  "    controls: 'Controles de reprodução',",
  "    play: 'Reproduzir', pause: 'Pausar',",
  "    mute: 'Silenciar', unmute: 'Ativar o som',",
  "    seek: 'Posição da reprodução', rate: 'Velocidade de reprodução',",
  "    enterFullscreen: 'Tela cheia', exitFullscreen: 'Sair da tela cheia',",
  "    enterPip: 'Janela flutuante', exitPip: 'Sair da janela flutuante',",
  '  };',
].join('\n');

/**
 * A faixa de legenda, na forma que se escreve.
 *
 * O `src` das stories é um `data:` de 24 caracteres — copiá-lo ensinaria a
 * embutir legenda em base64, que não é o caso de uso de ninguém.
 */
const TRACKS_FIELD =
  "  readonly tracks = [{ src: '/legendas/pt.vtt', srclang: 'pt-BR', label: 'Português' }];";

/** O que as stories usam da API e que o snippet precisa mostrar. */
export type MediaPlayerSnippetOptions = {
  kind?: 'video' | 'audio';
  /** Endereço da mídia. */
  src?: string;
  /** Descrição da fonte ao vivo — a expressão que a monta, como TEXTO. */
  stream?: string;
  /** Provedor externo, quando a story o exercita. */
  embed?: { provider: 'youtube' | 'vimeo'; videoId: string };
  /** Há faixa de legenda? O snippet mostra a forma, não o arquivo. */
  tracks?: boolean;
  rates?: number[];
};

/** Os controls do Playground, na forma em que o `transform` os recebe. */
export type MediaPlayerArgs = {
  kind?: 'video' | 'audio';
  rates?: number[];
};

/**
 * Os atributos da tag, sem o que o componente já assume por padrão.
 *
 * `kind` nasce `video` e `rates` nasce com a lista de seis: documentação não
 * ensina a repetir o padrão, só o que difere dele. A exceção é `rates: []`, que
 * difere do padrão justamente por ser vazia — e é o que desliga o seletor.
 */
function tagAttributes(options: MediaPlayerSnippetOptions): string[] {
  return [
    '[labels]="labels"',
    options.kind === 'audio' ? 'kind="audio"' : '',
    options.src ? '[src]="src"' : '',
    options.stream ? '[stream]="stream"' : '',
    options.embed ? '[embed]="embed"' : '',
    options.tracks ? '[tracks]="tracks"' : '',
    options.rates && options.rates.length === 0 ? '[rates]="[]"' : '',
    // As saídas ficam de fora: são opcionais, e um manipulador no snippet
    // pediria um método que a classe do exemplo teria de inventar. Quem quer
    // contar reprodução tem a seção Importação, que mostra as três com o
    // discriminador de fim.
  ].filter(Boolean);
}

/** Os campos da classe do exemplo, na ordem em que a tag os cita. */
function classMembers(options: MediaPlayerSnippetOptions): string[] {
  return [
    LABELS_FIELD,
    options.src ? `  readonly src = '${options.src}';` : '',
    options.stream ? `  readonly stream = ${options.stream};` : '',
    options.embed
      ? `  readonly embed = { provider: '${options.embed.provider}', `
        + `videoId: '${options.embed.videoId}' };`
      : '',
    options.tracks ? TRACKS_FIELD : '',
  ].filter(Boolean);
}

/** O uso real do componente, com só o que difere do padrão. */
export function mediaPlayerSnippet(options: MediaPlayerSnippetOptions = {}): string {
  const attrs = tagAttributes(options).join('\n      ');
  const members = classMembers(options).join('\n\n');

  return `import { MediaPlayerComponent } from '@/components/ui/media-player';

@Component({
  imports: [MediaPlayerComponent],
  template: \`
    <nds-media-player
      ${attrs}
    />
  \`,
})
export class Exemplo {
${members}
}`;
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls do
 * Playground; nas stories sem args cai nos padrões do componente.
 */
export function mediaPlayerSource(
  _generated: string,
  context: { args?: MediaPlayerArgs } = {},
): string {
  return mediaPlayerSnippet(context.args ?? {});
}

/**
 * Transforms de story: mesma tag, opções fixas que os controls não cobrem.
 *
 * Uma por configuração, e não uma fábrica exportada que recebe a configuração.
 * A fábrica devolvia FUNÇÃO, e a guarda transversal (`source-snippets.test.ts`)
 * chama todo export sem argumento esperando string — curried, as checagens que
 * LEEM o snippet nunca chegavam ao snippet. Nomeadas, cada uma é verificada.
 */
const comFixas =
  (fixed: MediaPlayerSnippetOptions) =>
  (_generated?: string, context: { args?: MediaPlayerArgs } = {}): string =>
    mediaPlayerSnippet({ ...context.args, ...fixed });

/** Com faixa de legenda, e sem o seletor de velocidade. */
export const mediaPlayerTracksSource = comFixas({ tracks: true, rates: [] });

/** Só áudio. */
export const mediaPlayerAudioSource = comFixas({ kind: 'audio' });

/**
 * Os vídeos das demonstrações incorporadas.
 *
 * Moram aqui, e não nas fixtures, porque é o snippet que precisa deles como
 * TEXTO — a fixture só os repassa ao componente, e por isso reexporta daqui.
 * Declarados nos dois lugares, o painel Code ensinaria um vídeo e a
 * demonstração tocaria outro, e nada acusaria.
 *
 * Identificadores públicos, escolhidos por serem estáveis há mais de uma década.
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
