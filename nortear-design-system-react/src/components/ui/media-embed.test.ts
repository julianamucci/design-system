// O dialeto dos provedores, preso sem rede.
//
// As formas testadas aqui não são inventadas: foram CAPTURADAS de quadros reais
// por uma sonda, e cada bloco diz o que a medição mostrou. É o que separa este
// arquivo de um teste que confirma o que o autor imaginou.

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  buildEmbedUrl,
  createEmbedClock,
  createEmbedHandshake,
  EMBED_ALLOW,
  embedCommand,
  embedRequest,
  embedHandshake,
  isFromFrame,
  isHandshakeAck,
  parseEmbedMessage,
} from './media-embed';

describe('buildEmbedUrl', () => {
  it('YouTube: domínio sem cookie por padrão', () => {
    const url = buildEmbedUrl({ provider: 'youtube', videoId: 'abc' }, 'https://ds.test');
    expect(url).toContain('www.youtube-nocookie.com');
    expect(url).not.toContain('//www.youtube.com');
  });

  it('YouTube: o domínio comum só entra quando pedido explicitamente', () => {
    const url = buildEmbedUrl(
      { provider: 'youtube', videoId: 'abc', noCookie: false },
      'https://ds.test',
    );
    expect(url).toContain('www.youtube.com');
  });

  it('YouTube: habilita a conversa e declara a origem', () => {
    const url = buildEmbedUrl({ provider: 'youtube', videoId: 'abc' }, 'https://ds.test');
    // Sem `enablejsapi` não há conversa; sem `origin` o YouTube recusa comandos.
    expect(url).toContain('enablejsapi=1');
    expect(url).toContain('origin=https%3A%2F%2Fds.test');
  });

  it('YouTube: não deixa o iOS sequestrar a tela cheia', () => {
    const url = buildEmbedUrl({ provider: 'youtube', videoId: 'abc' }, 'https://ds.test');
    expect(url).toContain('playsinline=1');
  });

  it('YouTube: esconde a barra do PROVEDOR, porque a nossa cobre tudo', () => {
    // Duas barras na mesma caixa foi o que a dona viu na tela. Só se pode
    // esconder a do provedor porque a nossa faz tudo que ela fazia.
    const url = buildEmbedUrl({ provider: 'youtube', videoId: 'abc' }, 'https://ds.test');
    expect(url).toContain('controls=0');
    expect(url).toContain('iv_load_policy=3');
  });

  it('YouTube: o segundo de partida entra inteiro', () => {
    const url = buildEmbedUrl(
      { provider: 'youtube', videoId: 'abc', startAt: 42.7 },
      'https://ds.test',
    );
    expect(url).toContain('start=42');
  });

  it('YouTube: o identificador é escapado, e não concatenado cru', () => {
    const url = buildEmbedUrl({ provider: 'youtube', videoId: 'a/b?c' }, 'https://ds.test');
    expect(url).toContain('/embed/a%2Fb%3Fc?');
  });

  it('Vimeo: habilita a conversa e apaga o excesso do provedor', () => {
    const url = buildEmbedUrl({ provider: 'vimeo', videoId: '123' }, 'https://ds.test');
    expect(url).toContain('player.vimeo.com/video/123');
    expect(url).toContain('api=1');
    // Além dos controles, o Vimeo desenha título, autor e avatar por cima.
    expect(url).toContain('controls=0');
    expect(url).toContain('title=0');
    expect(url).toContain('byline=0');
    expect(url).toContain('portrait=0');
  });

  it('Vimeo: a chave de vídeo não listado entra como `h`', () => {
    const url = buildEmbedUrl(
      { provider: 'vimeo', videoId: '123', hash: 'segredo' },
      'https://ds.test',
    );
    // Sem ela, vídeo privado responde 404 dentro do quadro.
    expect(url).toContain('h=segredo');
  });

  it('Vimeo: o tempo de partida vai em segundos, com sufixo', () => {
    const url = buildEmbedUrl(
      { provider: 'vimeo', videoId: '123', startAt: 90.4 },
      'https://ds.test',
    );
    expect(url).toContain('t=90s');
  });
});

describe('EMBED_ALLOW', () => {
  it('delega as quatro permissões que os controles precisam', () => {
    for (const permission of ['autoplay', 'fullscreen', 'picture-in-picture', 'encrypted-media']) {
      expect(EMBED_ALLOW).toContain(permission);
    }
  });
});

describe('embedHandshake', () => {
  it('YouTube: uma mensagem de escuta, no canal de widget', () => {
    const [message] = embedHandshake('youtube');
    expect(JSON.parse(message)).toEqual({ event: 'listening', id: 1, channel: 'widget' });
  });

  it('Vimeo: uma inscrição por evento, que é como ele assina', () => {
    const values = embedHandshake('vimeo').map((m) => JSON.parse(m).value);
    expect(values).toEqual(['play', 'pause', 'ended', 'timeupdate']);
  });
});

describe('isHandshakeAck', () => {
  it('YouTube: `onReady` e `infoDelivery` confirmam a inscrição', () => {
    expect(isHandshakeAck('youtube', JSON.stringify({ event: 'onReady', info: null }))).toBe(true);
    expect(isHandshakeAck('youtube', JSON.stringify({ event: 'infoDelivery', info: {} }))).toBe(true);
  });

  it('Vimeo: o ECO da inscrição confirma; o `ready` NÃO', () => {
    // Medido: com a inscrição descartada, o `ready` chega do mesmo jeito. Usar
    // o `ready` como confirmação faria a insistência parar cedo demais — que é
    // exatamente o estado em que o componente estava.
    expect(isHandshakeAck('vimeo', JSON.stringify({ method: 'addEventListener', value: 'play' })))
      .toBe(true);
    expect(isHandshakeAck('vimeo', JSON.stringify({ event: 'ready' }))).toBe(false);
  });

  it('lixo não confirma nada', () => {
    expect(isHandshakeAck('youtube', 'não é json')).toBe(false);
    expect(isHandshakeAck('vimeo', null)).toBe(false);
  });
});

describe('createEmbedHandshake', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('INSISTE, porque um envio só não é aceito', () => {
    // MEDIDO contra os quadros reais: mandando uma vez no `load`, o YouTube
    // devolveu ZERO mensagens e o Vimeo não aceitou nenhuma inscrição. O `load`
    // do iframe é o documento do provedor, não o player dentro dele.
    const sent: string[] = [];
    const handshake = createEmbedHandshake('youtube', (m) => sent.push(m));

    handshake.start();
    expect(sent).toHaveLength(1);

    vi.advanceTimersByTime(1500);
    expect(sent.length).toBeGreaterThan(1);
    handshake.stop();
  });

  it('para no primeiro sinal de vida', () => {
    const sent: string[] = [];
    const handshake = createEmbedHandshake('youtube', (m) => sent.push(m));

    handshake.start();
    vi.advanceTimersByTime(600);
    const beforeAck = sent.length;

    handshake.observe(JSON.stringify({ event: 'onReady', info: null }));
    vi.advanceTimersByTime(5000);
    expect(sent).toHaveLength(beforeAck);
  });

  it('não insiste para sempre num quadro que nunca responde', () => {
    const sent: string[] = [];
    const handshake = createEmbedHandshake('youtube', (m) => sent.push(m));

    handshake.start();
    vi.advanceTimersByTime(60_000);
    const afterGivingUp = sent.length;
    vi.advanceTimersByTime(60_000);
    expect(sent).toHaveLength(afterGivingUp);
    expect(afterGivingUp).toBeLessThan(25);
  });

  it('`stop` solta o temporizador, para um player removido não bater num quadro que já foi', () => {
    const sent: string[] = [];
    const handshake = createEmbedHandshake('vimeo', (m) => sent.push(m));
    handshake.start();
    const atStop = sent.length;
    handshake.stop();
    vi.advanceTimersByTime(10_000);
    expect(sent).toHaveLength(atStop);
  });
});

describe('embedRequest', () => {
  it('Vimeo pergunta por `method`; YouTube por comando', () => {
    expect(JSON.parse(embedRequest('vimeo', 'duration'))).toEqual({ method: 'getDuration' });
    expect(JSON.parse(embedRequest('vimeo', 'currentTime'))).toEqual({ method: 'getCurrentTime' });
    expect(JSON.parse(embedRequest('youtube', 'duration')))
      .toEqual({ event: 'command', func: 'getDuration', args: [] });
  });
});

describe('createEmbedClock', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('Vimeo: PERGUNTA a posição enquanto toca', () => {
    // A posição do Vimeo não estava chegando: `play` e `pause` sim, e a barra
    // saltava para o instante da pausa em vez de acompanhar.
    const sent: string[] = [];
    const clock = createEmbedClock('vimeo', (m) => sent.push(m));

    clock.start();
    expect(sent).toHaveLength(1);
    vi.advanceTimersByTime(1000);
    expect(sent.length).toBeGreaterThan(3);
    clock.stop();
  });

  it('para de perguntar quando para de tocar', () => {
    const sent: string[] = [];
    const clock = createEmbedClock('vimeo', (m) => sent.push(m));
    clock.start();
    vi.advanceTimersByTime(1000);
    const atStop = sent.length;
    clock.stop();
    vi.advanceTimersByTime(5000);
    expect(sent).toHaveLength(atStop);
  });

  it('`start` duas vezes não abre dois relógios', () => {
    const sent: string[] = [];
    const clock = createEmbedClock('vimeo', (m) => sent.push(m));
    clock.start();
    clock.start();
    vi.advanceTimersByTime(1000);
    const single = sent.length;
    clock.stop();

    const other: string[] = [];
    const one = createEmbedClock('vimeo', (m) => other.push(m));
    one.start();
    vi.advanceTimersByTime(1000);
    one.stop();
    expect(single).toBe(other.length);
  });

  it('YouTube: não pergunta nada, porque ele já empurra', () => {
    // Perguntar ali seria tráfego sem notícia nova — o `infoDelivery` chega
    // sozinho.
    const sent: string[] = [];
    const clock = createEmbedClock('youtube', (m) => sent.push(m));
    clock.start();
    vi.advanceTimersByTime(5000);
    expect(sent).toEqual([]);
  });
});

describe('embedCommand', () => {
  it('YouTube: comando é `event: command` com nome de função', () => {
    expect(JSON.parse(embedCommand('youtube', { kind: 'play' })))
      .toEqual({ event: 'command', func: 'playVideo', args: [] });
    expect(JSON.parse(embedCommand('youtube', { kind: 'pause' })).func).toBe('pauseVideo');
  });

  it('YouTube: mudo e som são funções DIFERENTES, não um argumento', () => {
    expect(JSON.parse(embedCommand('youtube', { kind: 'mute', value: true })).func).toBe('mute');
    expect(JSON.parse(embedCommand('youtube', { kind: 'mute', value: false })).func).toBe('unMute');
  });

  it('YouTube: a posição leva o segundo argumento que manda buscar já', () => {
    expect(JSON.parse(embedCommand('youtube', { kind: 'seek', value: 30 })).args).toEqual([30, true]);
  });

  it('Vimeo: comando é `method`, com `value` quando há valor', () => {
    expect(JSON.parse(embedCommand('vimeo', { kind: 'play' }))).toEqual({ method: 'play' });
    expect(JSON.parse(embedCommand('vimeo', { kind: 'seek', value: 30 })))
      .toEqual({ method: 'setCurrentTime', value: 30 });
  });

  it('Vimeo: não tem mudo, tem VOLUME — e a perda é conhecida', () => {
    // Zero é o mudo e um é o retorno: a barra não guarda o volume anterior.
    expect(JSON.parse(embedCommand('vimeo', { kind: 'mute', value: true })))
      .toEqual({ method: 'setVolume', value: 0 });
    expect(JSON.parse(embedCommand('vimeo', { kind: 'mute', value: false })).value).toBe(1);
  });
});

describe('parseEmbedMessage', () => {
  it('aceita objeto E texto — o Vimeo manda ora um, ora outro', () => {
    // Tratar só um dos dois formatos é a causa mais comum de "às vezes funciona".
    expect(parseEmbedMessage('vimeo', { event: 'play' })).toEqual([{ type: 'playing' }]);
    expect(parseEmbedMessage('vimeo', JSON.stringify({ event: 'play' })))
      .toEqual([{ type: 'playing' }]);
  });

  it('descarta o que não é mensagem', () => {
    expect(parseEmbedMessage('youtube', 'não é json')).toEqual([]);
    expect(parseEmbedMessage('youtube', null)).toEqual([]);
    expect(parseEmbedMessage('youtube', 42)).toEqual([]);
    expect(parseEmbedMessage('vimeo', { event: 'algumaCoisa' })).toEqual([]);
  });

  it('YouTube: os três estados que importam, e só eles', () => {
    const state = (info: number) =>
      parseEmbedMessage('youtube', JSON.stringify({ event: 'onStateChange', info }));
    expect(state(1)).toEqual([{ type: 'playing' }]);
    expect(state(2)).toEqual([{ type: 'paused' }]);
    expect(state(0)).toEqual([{ type: 'ended' }]);
    // Armazenando, na fila e não iniciado não são começo nem parada: tratá-los
    // faria o botão piscar a cada engasgo da rede.
    expect(state(3)).toEqual([]);
    expect(state(5)).toEqual([]);
    expect(state(-1)).toEqual([]);
  });

  it('YouTube: o estado chega TAMBÉM por `infoDelivery`', () => {
    // Ler só o `onStateChange` deixava o botão preso em "Reproduzir" com o
    // vídeo tocando — o defeito que a dona viu na tela.
    expect(parseEmbedMessage('youtube', JSON.stringify({
      event: 'infoDelivery', info: { playerState: 1 },
    }))).toEqual([{ type: 'playing' }]);
  });

  it('YouTube: `infoDelivery` PARCIAL vale, e é a maioria delas', () => {
    // MEDIDO na sonda: `{"info":{"muted":false,"volume":100}}` e
    // `{"info":{"playbackQuality":"large",…}}`. Cada mensagem traz só o que
    // mudou. Exigir `currentTime` E `duration` juntos descartava toda
    // atualização de posição, e o relógio congelava em `0:00` com a duração
    // certa ao lado.
    expect(parseEmbedMessage('youtube', JSON.stringify({
      event: 'infoDelivery', info: { currentTime: 30 },
    }))).toEqual([{ type: 'time', currentTime: 30 }]);

    expect(parseEmbedMessage('youtube', JSON.stringify({
      event: 'infoDelivery', info: { duration: 120 },
    }))).toEqual([{ type: 'time', duration: 120 }]);

    // E a que não traz tempo nenhum não vira evento de tempo.
    expect(parseEmbedMessage('youtube', JSON.stringify({
      event: 'infoDelivery', info: { muted: false, volume: 100 },
    }))).toEqual([]);
  });

  it('YouTube: uma mensagem pode trazer DUAS notícias', () => {
    expect(parseEmbedMessage('youtube', JSON.stringify({
      event: 'infoDelivery', info: { playerState: 1, currentTime: 5, duration: 60 },
    }))).toEqual([{ type: 'playing' }, { type: 'time', currentTime: 5, duration: 60 }]);
  });

  it('YouTube: duração zero não é duração', () => {
    // Um vídeo ainda não carregado responde `duration: 0`, e aceitá-lo faria o
    // relógio prometer um fim que não existe.
    expect(parseEmbedMessage('youtube', JSON.stringify({
      event: 'infoDelivery', info: { duration: 0 },
    }))).toEqual([]);
  });

  it('Vimeo: o ECO da própria inscrição não é notícia do vídeo', () => {
    // Sem descartar, a barra reagiria à própria inscrição.
    expect(parseEmbedMessage('vimeo', JSON.stringify({
      method: 'addEventListener', value: 'play',
    }))).toEqual([]);
  });

  it('Vimeo: o tempo vem junto de `play`, `pause` e `ended`', () => {
    // É o que faz a duração aparecer no primeiro play, e não só depois da
    // primeira atualização de posição.
    expect(parseEmbedMessage('vimeo', JSON.stringify({
      event: 'play', data: { seconds: 3, duration: 90 },
    }))).toEqual([{ type: 'playing' }, { type: 'time', currentTime: 3, duration: 90 }]);
  });

  it('Vimeo: a RESPOSTA a uma pergunta também move o relógio', () => {
    // MEDIDO: o Vimeo não empurra a duração — `loaded` traz só o identificador
    // do vídeo. `{method:'getDuration'}` respondeu `{value: 62}` com o vídeo
    // parado, e é por aqui que ela entra. Sem isto a barra ficava em `--:--` e
    // saltava no clique da pausa, que é o primeiro evento a trazer duração.
    expect(parseEmbedMessage('vimeo', JSON.stringify({ method: 'getDuration', value: 62 })))
      .toEqual([{ type: 'time', duration: 62 }]);
    expect(parseEmbedMessage('vimeo', JSON.stringify({ method: 'getCurrentTime', value: 12 })))
      .toEqual([{ type: 'time', currentTime: 12 }]);
    // Posição zero é posição, e não ausência de resposta.
    expect(parseEmbedMessage('vimeo', JSON.stringify({ method: 'getCurrentTime', value: 0 })))
      .toEqual([{ type: 'time', currentTime: 0 }]);
  });

  it('Vimeo: `timeupdate` move o relógio', () => {
    expect(parseEmbedMessage('vimeo', JSON.stringify({
      event: 'timeupdate', data: { seconds: 12.5, duration: 90 },
    }))).toEqual([{ type: 'time', currentTime: 12.5, duration: 90 }]);
  });

  it('Vimeo: `finish` é o nome antigo do fim, e players velhos ainda o mandam', () => {
    expect(parseEmbedMessage('vimeo', JSON.stringify({ event: 'finish' })))
      .toEqual([{ type: 'ended' }]);
  });
});

describe('isFromFrame', () => {
  it('só aceita mensagem do quadro que a barra dirige', () => {
    // Sem conferir a fonte, um segundo player na mesma página pausa o primeiro,
    // e uma extensão qualquer mexe na reprodução.
    const contentWindow = {} as Window;
    const frame = { contentWindow } as HTMLIFrameElement;
    expect(isFromFrame({ source: contentWindow } as MessageEvent, frame)).toBe(true);
    expect(isFromFrame({ source: {} as Window } as MessageEvent, frame)).toBe(false);
    expect(isFromFrame({ source: null } as MessageEvent, frame)).toBe(false);
  });
});
