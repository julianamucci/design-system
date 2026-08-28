/**
 * Transforms do painel Code do MediaPlayer.
 *
 * O painel imprimiria a tag sozinha, sem os rótulos que o componente EXIGE —
 * um exemplo que não compila. O que se copia daqui é o SFC inteiro: import,
 * rótulos e a tag com a fonte da story.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 */
import { attrsMultilinha, vueSnippet, type SourceTransform } from '@/lib/story-source';

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
};

/** Os args do Playground que a transform do `meta` lê. */
export type MediaPlayerArgs = {
  kind: 'video' | 'audio';
  rates: number[];
};

const IMPORT = `import { MediaPlayer, type MediaPlayerLabels } from '@/components/ui/media-player'`;

/**
 * O objeto de rótulos, por extenso.
 *
 * Não dá para abreviar sem mentir: todo controle é só de ícone, não há texto
 * visível de onde deduzir nome nenhum, e por isso `labels` é obrigatório. Quem
 * copiar o exemplo precisa ver o tamanho real do compromisso.
 */
const LABELS_BLOCK = `// Todo controle é só de ícone: o rótulo É o nome acessível que o leitor de
// tela anuncia. Os pares (tocar/pausar, silenciar/ativar) trocam com o estado.
const labels: MediaPlayerLabels = {
  player: 'Reprodutor',
  controls: 'Controles de reprodução',
  play: 'Reproduzir', pause: 'Pausar',
  mute: 'Silenciar', unmute: 'Ativar o som',
  seek: 'Posição da reprodução', rate: 'Velocidade de reprodução',
  enterFullscreen: 'Tela cheia', exitFullscreen: 'Sair da tela cheia',
  enterPip: 'Janela flutuante', exitPip: 'Sair da janela flutuante',
}`;

/**
 * A faixa de legenda, na forma que se escreve.
 *
 * O `src` das stories é um `data:` de 24 caracteres — copiá-lo ensinaria a
 * embutir legenda em base64, que não é o caso de uso de ninguém.
 */
const TRACKS_BLOCK =
  `const tracks = [{ src: '/legendas/pt.vtt', srclang: 'pt-BR', label: 'Português' }]`;

/**
 * Monta o SFC: import, rótulos, o que a fonte exigir de estado, e a tag.
 *
 * `kind` nasce `video` e `rates` nasce com a lista de seis: documentação não
 * ensina a repetir o padrão, só o que difere dele. A exceção é `rates: []`, que
 * difere do padrão justamente por ser vazia — e é o que desliga o seletor.
 */
export function mediaPlayerSnippet(options: MediaPlayerSnippetOptions = {}): string {
  const script = [IMPORT, '', LABELS_BLOCK];
  if (options.stream) script.push('', `const stream = ${options.stream}`);
  if (options.tracks) script.push('', TRACKS_BLOCK);

  // `videoId`, e não a URL inteira: é o que o componente aceita, e a diferença
  // é o erro mais comum de quem integra provedor.
  const embed = options.embed
    ? `:embed="{ provider: '${options.embed.provider}', videoId: '${options.embed.videoId}' }"`
    : '';

  const queue = attrsMultilinha([
    options.kind === 'audio' ? 'kind="audio"' : '',
    options.src ? `src="${options.src}"` : '',
    options.stream ? ':stream="stream"' : '',
    embed,
    options.tracks ? ':tracks="tracks"' : '',
    options.rates && options.rates.length === 0 ? ':rates="[]"' : '',
    ':labels="labels"',
  ]);

  // Quebrada, a fila já traz a quebra antes do fecho; em linha, o espaço antes
  // de `/>` é por conta daqui.
  const tag = queue.startsWith('\n')
    ? `<MediaPlayer${queue}/>`
    : `<MediaPlayer${queue} />`;
  return vueSnippet(script.join('\n'), tag);
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai nos padrões do componente.
 */
export const mediaPlayerSource: SourceTransform<MediaPlayerArgs> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  return args.kind === 'video'
    // O Playground de vídeo é a fonte ao vivo do canvas: sem velocidade, porque
    // stream ignora `playbackRate`, e com a faixa de legenda que WCAG 1.2.2 pede.
    ? mediaPlayerSnippet({
      stream: 'await navigator.mediaDevices.getUserMedia({ video: true })',
      tracks: true,
      rates: [],
    })
    : mediaPlayerSnippet({ kind: 'audio', src: '/audios/episodio.mp3' });
};

/** Fonte de vídeo hospedado por quem consome. */
export function mediaPlayerVideoSource(): string {
  return mediaPlayerSnippet({
    stream: 'await navigator.mediaDevices.getUserMedia({ video: true })',
    tracks: true,
    rates: [],
  });
}

/** Fonte de áudio: a barra é o componente inteiro. */
export function mediaPlayerAudioSource(): string {
  return mediaPlayerSnippet({ kind: 'audio', src: '/audios/episodio.mp3' });
}

/** Vídeo no YouTube — mesma barra, mesma API, outro motor. */
export function mediaPlayerYouTubeSource(): string {
  return mediaPlayerSnippet({ embed: { provider: 'youtube', videoId: 'aqz-KE-bpKQ' } });
}

/** Vídeo no Vimeo — o dialeto muda em `media-embed`, e não na barra. */
export function mediaPlayerVimeoSource(): string {
  return mediaPlayerSnippet({ embed: { provider: 'vimeo', videoId: '76979871' } });
}

/** Vídeo com a faixa de legenda declarada no próprio elemento. */
export function mediaPlayerCaptionsSource(): string {
  return mediaPlayerSnippet({
    src: '/videos/tour.mp4',
    tracks: true,
  });
}

/**
 * Dois players na mesma página — e um NÃO manda no outro.
 *
 * O snippet mostra a composição inteira porque é ela o assunto: a conferência
 * de origem que separa os dois mora dentro do componente, e o que quem consome
 * escreve é simplesmente dois.
 */
export function mediaPlayerTwoPlayersSource(): string {
  const script = [
    IMPORT,
    '',
    LABELS_BLOCK,
    '',
    `const videoId = 'aqz-KE-bpKQ'`,
  ].join('\n');
  return vueSnippet(
    script,
    `<div class="nds-stack" data-spacing="md">
  <MediaPlayer
    :embed="{ provider: 'youtube', videoId }"
    :labels="labels"
  />
  <MediaPlayer
    :embed="{ provider: 'youtube', videoId }"
    :labels="labels"
  />
</div>`,
  );
}
