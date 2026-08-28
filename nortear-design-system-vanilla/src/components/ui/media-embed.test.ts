// O protocolo dos provedores externos é função pura, e é aqui que ele se
// verifica — sem rede, sem serviço de terceiro, sem navegador.
//
// O que ESTE arquivo não cobre está declarado na story: o aperto de mão real com
// o YouTube e com o Vimeo exige rede, e suíte que depende de serviço externo
// falha por motivo alheio ao código.
import { describe, it, expect } from 'vitest';
import {
  buildEmbedUrl,
  embedCommand,
  embedHandshake,
  parseEmbedMessage,
  EMBED_ALLOW,
} from './media-embed';

describe('buildEmbedUrl', () => {
  it('usa o domínio sem cookie por padrão no YouTube', () => {
    const url = buildEmbedUrl({ provider: 'youtube', videoId: 'abc123' }, 'https://exemplo.com');
    // O padrão precisa ser o que não surpreende: o domínio comum grava cookie de
    // perfil antes mesmo de a pessoa dar play.
    expect(url).toContain('www.youtube-nocookie.com');
    expect(url).not.toContain('//www.youtube.com');
  });

  it('só usa o domínio com cookie quando pedido explicitamente', () => {
    const url = buildEmbedUrl(
      { provider: 'youtube', videoId: 'abc123', noCookie: false },
      'https://exemplo.com',
    );
    expect(url).toContain('www.youtube.com');
  });

  it('declara a origem, sem a qual o YouTube recusa comandos', () => {
    const url = buildEmbedUrl({ provider: 'youtube', videoId: 'abc' }, 'https://exemplo.com');
    expect(url).toContain('enablejsapi=1');
    expect(url).toContain(`origin=${encodeURIComponent('https://exemplo.com')}`);
  });

  it('pede reprodução em linha, para o iOS não abrir em tela cheia sozinho', () => {
    const url = buildEmbedUrl({ provider: 'youtube', videoId: 'abc' }, 'https://exemplo.com');
    expect(url).toContain('playsinline=1');
  });

  it('leva a chave de vídeo não listado do Vimeo', () => {
    const url = buildEmbedUrl(
      { provider: 'vimeo', videoId: '76979871', hash: 'a1b2c3' },
      'https://exemplo.com',
    );
    expect(url).toContain('player.vimeo.com/video/76979871');
    expect(url).toContain('h=a1b2c3');
  });

  it('escapa o identificador do vídeo', () => {
    // Identificador vem de fora; concatenar sem escapar deixaria injetar
    // parâmetro na URL do quadro.
    const url = buildEmbedUrl(
      { provider: 'youtube', videoId: 'a b&autoplay=1' },
      'https://exemplo.com',
    );
    expect(url).toContain('a%20b%26autoplay%3D1');
    expect(url).not.toContain('&autoplay=1&enablejsapi');
  });

  it('respeita o segundo inicial em cada dialeto', () => {
    expect(
      buildEmbedUrl({ provider: 'youtube', videoId: 'a', startAt: 42.7 }, 'https://x.com'),
    ).toContain('start=42');
    expect(
      buildEmbedUrl({ provider: 'vimeo', videoId: '1', startAt: 42.7 }, 'https://x.com'),
    ).toContain('t=42s');
  });
});

describe('EMBED_ALLOW', () => {
  it('pede as permissões que os controles precisam delegar', () => {
    for (const p of ['autoplay', 'fullscreen', 'picture-in-picture']) {
      expect(EMBED_ALLOW).toContain(p);
    }
  });
});

describe('embedHandshake', () => {
  it('YouTube abre a conversa com uma escuta', () => {
    const [msg] = embedHandshake('youtube');
    expect(JSON.parse(msg)).toMatchObject({ event: 'listening' });
  });

  it('Vimeo assina um evento por vez, e assina os quatro que a barra usa', () => {
    const assinados = embedHandshake('vimeo').map((m) => JSON.parse(m).value);
    expect(assinados).toEqual(['play', 'pause', 'ended', 'timeupdate']);
  });
});

describe('embedCommand', () => {
  it('traduz tocar e pausar para cada dialeto', () => {
    expect(JSON.parse(embedCommand('youtube', { kind: 'play' }))).toMatchObject({
      event: 'command',
      func: 'playVideo',
    });
    expect(JSON.parse(embedCommand('vimeo', { kind: 'pause' }))).toMatchObject({ method: 'pause' });
  });

  it('o Vimeo não tem mudo: tem volume, e zero é o mudo', () => {
    expect(JSON.parse(embedCommand('vimeo', { kind: 'mute', value: true }))).toMatchObject({
      method: 'setVolume',
      value: 0,
    });
    expect(JSON.parse(embedCommand('vimeo', { kind: 'mute', value: false }))).toMatchObject({
      value: 1,
    });
  });

  it('o YouTube tem dois comandos diferentes para o mudo', () => {
    expect(JSON.parse(embedCommand('youtube', { kind: 'mute', value: true })).func).toBe('mute');
    expect(JSON.parse(embedCommand('youtube', { kind: 'mute', value: false })).func).toBe('unMute');
  });

  it('o segundo argumento do seekTo do YouTube pede a busca imediata', () => {
    const cmd = JSON.parse(embedCommand('youtube', { kind: 'seek', value: 12.5 }));
    expect(cmd.func).toBe('seekTo');
    expect(cmd.args).toEqual([12.5, true]);
  });
});

describe('parseEmbedMessage', () => {
  it('lê o estado numérico do YouTube', () => {
    const t = (info: number) => parseEmbedMessage('youtube', { event: 'onStateChange', info });
    expect(t(1)).toEqual({ type: 'playing' });
    expect(t(2)).toEqual({ type: 'paused' });
    expect(t(0)).toEqual({ type: 'ended' });
    // 3 é "carregando" e -1 é "não iniciado": nenhum dos dois é mudança de
    // reprodução, e tratá-los como tal inventaria evento que não houve.
    expect(t(3)).toBeNull();
    expect(t(-1)).toBeNull();
  });

  it('lê o tempo do YouTube', () => {
    expect(
      parseEmbedMessage('youtube', {
        event: 'infoDelivery',
        info: { currentTime: 12.5, duration: 60 },
      }),
    ).toEqual({ type: 'time', currentTime: 12.5, duration: 60 });
  });

  it('lê os eventos nomeados do Vimeo', () => {
    expect(parseEmbedMessage('vimeo', { event: 'play' })).toEqual({ type: 'playing' });
    expect(parseEmbedMessage('vimeo', { event: 'ended' })).toEqual({ type: 'ended' });
    expect(
      parseEmbedMessage('vimeo', { event: 'timeupdate', data: { seconds: 3, duration: 9 } }),
    ).toEqual({ type: 'time', currentTime: 3, duration: 9 });
  });

  it('aceita a carga como TEXTO e como objeto', () => {
    // O YouTube manda string JSON; o Vimeo manda ora string, ora objeto,
    // conforme a versão do player. Tratar só um formato é a causa mais comum de
    // "às vezes funciona".
    const comoTexto = parseEmbedMessage('youtube', JSON.stringify({ event: 'onStateChange', info: 1 }));
    expect(comoTexto).toEqual({ type: 'playing' });
    expect(parseEmbedMessage('vimeo', JSON.stringify({ event: 'play' }))).toEqual({
      type: 'playing',
    });
  });

  it('ignora ruído sem estourar', () => {
    // A página recebe `message` de qualquer origem — extensão, anúncio, outro
    // embed. Nada disso pode derrubar a barra.
    for (const lixo of ['nao é json', '', null, undefined, 42, { event: 'outro' }, {}]) {
      expect(parseEmbedMessage('youtube', lixo)).toBeNull();
      expect(parseEmbedMessage('vimeo', lixo)).toBeNull();
    }
  });
});
