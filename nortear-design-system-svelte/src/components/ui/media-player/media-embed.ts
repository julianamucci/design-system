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
// o protocolo inteiro é verificável sem sair da máquina.
//
// O QUE A SONDA MEDIU, e que a versão anterior deste arquivo errava. As formas
// abaixo foram capturadas de quadros reais, com rede:
//
//   {"event":"onReady","info":null,"channel":"widget","id":1}
//   {"event":"infoDelivery","info":{"muted":false,"volume":100},…}
//   {"event":"infoDelivery","info":{"playbackQuality":"large",…},…}
//
// O YouTube manda `infoDelivery` PARCIAL: cada mensagem traz o subconjunto de
// campos que mudou. A versão anterior só aceitava a mensagem que trouxesse
// `currentTime` E `duration` juntos — o que acontece uma vez, no começo. Daí o
// defeito que a dona viu: a duração aparecia (`10:35`) e a posição ficava
// congelada em `0:00` para sempre.

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

/**
 * O que a barra precisa saber, normalizado entre os dois provedores.
 *
 * Os dois tempos são OPCIONAIS, e é o ponto: o YouTube avisa o que mudou, não o
 * estado inteiro. Exigir os dois juntos descartava toda atualização de posição.
 * Quem consome aplica só o que veio.
 */
export type EmbedEvent =
  | { type: 'playing' }
  | { type: 'paused' }
  | { type: 'ended' }
  | { type: 'time'; currentTime?: number; duration?: number };

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
      // A barra do PROVEDOR sai de cena. Sem isto ficam duas barras na mesma
      // caixa, uma por cima da outra, e a de baixo é a que o design system
      // desenhou: quem assiste vê dois conjuntos de controles disputando a
      // mesma função. Só se pode esconder a do provedor porque a nossa cobre
      // tudo que ela fazia — tocar, pausar, posição, som, velocidade e tela
      // cheia.
      controls: '0',
      // Anotações e cartões sobrepostos ao vídeo, que a nossa barra não
      // controla e que ninguém pediu.
      iv_load_policy: '3',
    });
    if (source.startAt) params.set('start', String(Math.floor(source.startAt)));
    return `https://${host}/embed/${encodeURIComponent(source.videoId)}?${params}`;
  }

  const params = new URLSearchParams({
    api: '1',
    // Mesmo motivo do YouTube: a barra é nossa. No Vimeo o excesso é maior —
    // além dos controles, ele desenha título, autor e avatar por cima do vídeo.
    controls: '0',
    title: '0',
    byline: '0',
    portrait: '0',
  });
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
 *
 * MEDIDO: o Vimeo ECOA cada `addEventListener` de volta, com a mesma forma
 * (`{"method":"addEventListener","value":"play"}`). O eco é a confirmação da
 * assinatura, e não um evento — `parseEmbedMessage` precisa descartá-lo, senão
 * a barra reage à própria inscrição.
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

/**
 * A mensagem que veio do quadro é a CONFIRMAÇÃO da inscrição?
 *
 * Existe porque o aperto de mão pode ser recusado em silêncio, e o único jeito
 * de saber se ele pegou é o provedor responder.
 *
 *   YouTube  responde `onReady` — e passa a mandar `infoDelivery`. Antes da
 *            inscrição ele não manda absolutamente nada.
 *   Vimeo    ECOA cada `addEventListener` de volta. O `ready` dele NÃO serve de
 *            confirmação: ele chega mesmo quando a inscrição foi descartada —
 *            medido, e é o que faria a espera parar cedo demais.
 */
export function isHandshakeAck(provider: EmbedProvider, data: unknown): boolean {
  const payload = asPayload(data);
  if (!payload) return false;
  if (provider === 'youtube') {
    return payload.event === 'onReady' || payload.event === 'infoDelivery';
  }
  return payload.method === 'addEventListener';
}

/** De quanto em quanto tempo insistir, e por quanto tempo no máximo. */
const HANDSHAKE_INTERVAL_MS = 500;
const HANDSHAKE_ATTEMPTS = 20;

/**
 * O aperto de mão que INSISTE até o provedor responder.
 *
 * MEDIDO, e é o defeito que a dona encontrou clicando: mandar a inscrição uma
 * vez, no `load` do quadro, não funciona. O `load` do iframe dispara quando o
 * DOCUMENTO do provedor carregou, e não quando o player dentro dele está pronto
 * para conversar — a mensagem chega cedo e é descartada sem aviso.
 *
 * Com um envio só: o YouTube devolveu ZERO mensagens, e o Vimeo devolveu o
 * `ready` mas nenhum eco de inscrição. Com um segundo envio 1,5s depois: 28
 * mensagens do YouTube e as quatro inscrições do Vimeo confirmadas. O sintoma
 * na tela era o vídeo tocando com a nossa barra parada — e, no Vimeo, a posição
 * congelada porque `timeupdate` nunca fora assinado.
 *
 * Insiste, e não espera um tempo fixo: quanto o player demora para ficar pronto
 * depende da rede de quem assiste, e prazo fixo é a mesma aposta com outro
 * número. Para no primeiro sinal de vida, e desiste depois de dez segundos para
 * não bater num quadro que nunca vai responder.
 */
export function createEmbedHandshake(
  provider: EmbedProvider,
  post: (message: string) => void,
): { start(): void; observe(data: unknown): void; stop(): void } {
  let timer: ReturnType<typeof setInterval> | null = null;
  let attempts = 0;

  const send = (): void => {
    for (const message of embedHandshake(provider)) post(message);
  };

  const stop = (): void => {
    if (timer !== null) clearInterval(timer);
    timer = null;
  };

  return {
    start() {
      stop();
      attempts = 0;
      send();
      timer = setInterval(() => {
        attempts += 1;
        if (attempts >= HANDSHAKE_ATTEMPTS) {
          stop();
          return;
        }
        send();
      }, HANDSHAKE_INTERVAL_MS);
    },
    observe(data: unknown) {
      if (isHandshakeAck(provider, data)) stop();
    },
    stop,
  };
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

/**
 * Os estados que o YouTube emite — em `onStateChange` e em `info.playerState`.
 *
 * `-1` (não iniciado), `3` (armazenando) e `5` (na fila) ficam de fora de
 * propósito: nenhum deles é começo nem parada de reprodução, e tratá-los faria
 * o botão piscar entre tocar e pausar a cada engasgo da rede.
 */
const YOUTUBE_STATE: Record<number, 'playing' | 'paused' | 'ended' | undefined> = {
  0: 'ended',
  1: 'playing',
  2: 'paused',
};

function asPayload(data: unknown): Record<string, unknown> | null {
  if (typeof data === 'string') {
    try {
      const parsed: unknown = JSON.parse(data);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
}

/** Só entra no evento o que veio como número — o resto fica de fora. */
function timeEvent(
  currentTime: unknown,
  duration: unknown,
): Extract<EmbedEvent, { type: 'time' }> | null {
  const event: Extract<EmbedEvent, { type: 'time' }> = { type: 'time' };
  if (typeof currentTime === 'number' && Number.isFinite(currentTime)) {
    event.currentTime = currentTime;
  }
  if (typeof duration === 'number' && Number.isFinite(duration) && duration > 0) {
    event.duration = duration;
  }
  return event.currentTime === undefined && event.duration === undefined ? null : event;
}

/**
 * Traduz o que veio do quadro. Devolve LISTA, e vazia para o que não interessa.
 *
 * Lista porque uma mensagem só carrega mais de uma notícia: o `infoDelivery` do
 * YouTube traz estado e tempo juntos, e o `play` do Vimeo vem com a duração
 * dentro. A versão anterior devolvia um evento só e escolhia um dos dois —
 * perdia o outro em silêncio.
 *
 * Aceita `data` como objeto OU como texto: o YouTube manda string JSON e o Vimeo
 * manda ora string, ora objeto, conforme a versão do player. Tratar só um dos
 * dois formatos é a causa mais comum de "às vezes funciona".
 */
export function parseEmbedMessage(provider: EmbedProvider, data: unknown): EmbedEvent[] {
  const payload = asPayload(data);
  if (!payload) return [];

  // O eco da própria inscrição, que o Vimeo devolve. Não é notícia do vídeo.
  if (payload.method === 'addEventListener') return [];

  const events: EmbedEvent[] = [];

  if (provider === 'youtube') {
    if (payload.event === 'onStateChange') {
      const state = YOUTUBE_STATE[Number(payload.info)];
      if (state) events.push({ type: state } as EmbedEvent);
      return events;
    }

    if (payload.event === 'infoDelivery') {
      const info = payload.info as Record<string, unknown> | null | undefined;
      if (!info) return events;
      // O estado chega TAMBÉM por aqui, e não só por `onStateChange` — medido.
      // Ler só o `onStateChange` deixava o botão preso em "Reproduzir" com o
      // vídeo tocando.
      const state = YOUTUBE_STATE[Number(info.playerState)];
      if (state) events.push({ type: state } as EmbedEvent);
      const time = timeEvent(info.currentTime, info.duration);
      if (time) events.push(time);
    }
    return events;
  }

  const name = payload.event;
  const info = (payload.data ?? {}) as Record<string, unknown>;
  if (name === 'play') events.push({ type: 'playing' });
  else if (name === 'pause') events.push({ type: 'paused' });
  // `finish` é o nome antigo do fim no Vimeo, e players mais velhos ainda o
  // mandam.
  else if (name === 'ended' || name === 'finish') events.push({ type: 'ended' });

  // O tempo vem junto de `play`, `pause` e `ended`, além do `timeupdate`
  // próprio: aproveitar os quatro é o que faz a duração aparecer no primeiro
  // play, e não só depois da primeira atualização de posição.
  if (name === 'play' || name === 'pause' || name === 'ended' || name === 'timeupdate') {
    const time = timeEvent(info.seconds, info.duration);
    if (time) events.push(time);
  }
  return events;
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
