// ─── Protocolo dos provedores externos ───────────────────────────────────────
//
// YouTube e Vimeo NÃO entregam um `HTMLMediaElement`: entregam um `<iframe>`. Não
// há `play`, `pause` nem `ended` de DOM para escutar, e a barra do design system
// não alcança o que está dentro do quadro. O que existe é uma conversa por
// `postMessage`, e é ela que este módulo traduz.
//
// SEM o SDK dos provedores, e isso é decisão, não economia. Carregar
// `youtube.com/iframe_api` ou `@vimeo/player` custaria script de terceiro no
// pacote, uma entrada em `script-src` na política de segurança e mais um
// terceiro executando código na página de quem consome. Os dois provedores
// aceitam comando e emitem evento pelo `postMessage` do próprio iframe — o SDK é
// conveniência, não requisito.
//
// Tudo aqui é FUNÇÃO PURA de propósito: a conversa com o provedor exige rede, e
// suíte que depende de serviço externo é lenta e falha por motivo alheio. Assim
// o protocolo inteiro é verificável sem sair da máquina, e o que sobra sem
// cobertura é só o aperto de mão real — que está declarado na story.

export type EmbedProvider = 'youtube' | 'vimeo';

export type EmbedSource = {
  provider: EmbedProvider;
  /** O identificador do vídeo no provedor, não a URL inteira. */
  videoId: string;
  /**
   * Vimeo: a chave de vídeo não listado (o `h=` da URL).
   * Sem ela, vídeo privado responde 404 dentro do quadro.
   */
  hash?: string;
  /**
   * YouTube: usa o domínio sem cookie de rastreamento.
   *
   * Padrão LIGADO. O domínio comum grava cookie de perfil de quem assiste antes
   * mesmo de a pessoa dar play, e num design system o padrão precisa ser o que
   * não surpreende quem consome.
   */
  noCookie?: boolean;
  /** Começa em determinado segundo. */
  startAt?: number;
};

/** O que a barra precisa saber, normalizado entre os dois provedores. */
export type EmbedEvent =
  | { type: 'playing' }
  | { type: 'paused' }
  | { type: 'ended' }
  | { type: 'time'; currentTime: number; duration: number };

/**
 * A URL do quadro.
 *
 * `origin` entra porque o YouTube recusa comandos de página que não a declare —
 * é o mecanismo dele contra terceiro dirigindo a reprodução sem consentimento.
 */
export function buildEmbedUrl(source: EmbedSource, origin: string): string {
  if (source.provider === 'youtube') {
    const host = source.noCookie === false ? 'www.youtube.com' : 'www.youtube-nocookie.com';
    const params = new URLSearchParams({
      enablejsapi: '1',
      origin,
      // Sem isto o iOS abre em tela cheia por conta própria ao dar play, e a
      // barra do design system some no exato momento em que seria usada.
      playsinline: '1',
      rel: '0',
    });
    if (source.startAt) params.set('start', String(Math.floor(source.startAt)));
    return `https://${host}/embed/${encodeURIComponent(source.videoId)}?${params}`;
  }

  const params = new URLSearchParams({ api: '1' });
  if (source.hash) params.set('h', source.hash);
  if (source.startAt) params.set('t', `${Math.floor(source.startAt)}s`);
  return `https://player.vimeo.com/video/${encodeURIComponent(source.videoId)}?${params}`;
}

/**
 * O `allow` do quadro.
 *
 * Permissão de iframe é DELEGADA: o quadro só recebe o que a página que o
 * hospeda já tem. Declarar aqui é necessário e não suficiente — se a própria
 * página estiver dentro de um iframe sem `picture-in-picture`, o botão do
 * provedor não vai funcionar por mais que se peça.
 */
export const EMBED_ALLOW = 'autoplay; fullscreen; picture-in-picture; encrypted-media';

/**
 * A mensagem que INICIA a conversa.
 *
 * Sem ela nenhum dos dois envia evento: os provedores só falam depois de a
 * página pedir. É o passo que costuma faltar em integração feita às pressas, e o
 * sintoma é "os comandos funcionam mas nada volta".
 */
export function embedHandshake(provider: EmbedProvider): string[] {
  if (provider === 'youtube') {
    return [JSON.stringify({ event: 'listening', id: 1, channel: 'widget' })];
  }
  // O Vimeo assina um evento por vez.
  return ['play', 'pause', 'ended', 'timeupdate'].map((value) =>
    JSON.stringify({ method: 'addEventListener', value }),
  );
}

export type EmbedCommand =
  | { kind: 'play' }
  | { kind: 'pause' }
  | { kind: 'mute'; value: boolean }
  | { kind: 'seek'; value: number }
  | { kind: 'rate'; value: number };

/** Traduz um comando da barra para o dialeto do provedor. */
export function embedCommand(provider: EmbedProvider, command: EmbedCommand): string {
  if (provider === 'youtube') {
    const map = {
      play: { func: 'playVideo', args: [] as unknown[] },
      pause: { func: 'pauseVideo', args: [] as unknown[] },
      mute: { func: command.kind === 'mute' && command.value ? 'mute' : 'unMute', args: [] },
      seek: { func: 'seekTo', args: [command.kind === 'seek' ? command.value : 0, true] },
      rate: { func: 'setPlaybackRate', args: [command.kind === 'rate' ? command.value : 1] },
    }[command.kind];
    return JSON.stringify({ event: 'command', ...map });
  }

  switch (command.kind) {
    case 'play':
      return JSON.stringify({ method: 'play' });
    case 'pause':
      return JSON.stringify({ method: 'pause' });
    // O Vimeo não tem "mudo": tem volume. Zero é o mudo, e um é o retorno — a
    // barra não guarda o volume anterior, e essa perda é conhecida.
    case 'mute':
      return JSON.stringify({ method: 'setVolume', value: command.value ? 0 : 1 });
    case 'seek':
      return JSON.stringify({ method: 'setCurrentTime', value: command.value });
    case 'rate':
      return JSON.stringify({ method: 'setPlaybackRate', value: command.value });
  }
}

/** Os estados que o YouTube emite em `onStateChange`. */
const YOUTUBE_STATE: Record<number, EmbedEvent['type'] | undefined> = {
  0: 'ended',
  1: 'playing',
  2: 'paused',
};

/**
 * Traduz o que veio do quadro. Devolve `null` para o que não interessa.
 *
 * Aceita `data` como objeto OU como texto: o YouTube manda string JSON e o Vimeo
 * manda ora string, ora objeto, conforme a versão do player. Tratar só um dos
 * dois formatos é a causa mais comum de "às vezes funciona".
 */
export function parseEmbedMessage(provider: EmbedProvider, data: unknown): EmbedEvent | null {
  let payload: Record<string, unknown>;
  if (typeof data === 'string') {
    try {
      payload = JSON.parse(data) as Record<string, unknown>;
    } catch {
      return null;
    }
  } else if (data && typeof data === 'object') {
    payload = data as Record<string, unknown>;
  } else {
    return null;
  }

  if (provider === 'youtube') {
    if (payload.event === 'onStateChange') {
      const tipo = YOUTUBE_STATE[Number(payload.info)];
      return tipo ? ({ type: tipo } as EmbedEvent) : null;
    }
    if (payload.event === 'infoDelivery') {
      const info = payload.info as { currentTime?: number; duration?: number } | undefined;
      if (info && typeof info.currentTime === 'number' && typeof info.duration === 'number') {
        return { type: 'time', currentTime: info.currentTime, duration: info.duration };
      }
    }
    return null;
  }

  const evento = payload.event;
  const dados = payload.data as { seconds?: number; duration?: number } | undefined;
  if (evento === 'play') return { type: 'playing' };
  if (evento === 'pause') return { type: 'paused' };
  if (evento === 'ended') return { type: 'ended' };
  if (evento === 'timeupdate' && dados && typeof dados.seconds === 'number') {
    return { type: 'time', currentTime: dados.seconds, duration: dados.duration ?? 0 };
  }
  return null;
}

/**
 * A mensagem veio DESTE quadro?
 *
 * A página inteira recebe `message` de qualquer origem — outro embed, uma
 * extensão, um anúncio. Sem conferir a fonte, um segundo player na mesma página
 * pausa o primeiro, e uma extensão qualquer consegue mexer na reprodução.
 */
export function isFromFrame(event: MessageEvent, frame: HTMLIFrameElement): boolean {
  return event.source === frame.contentWindow;
}
