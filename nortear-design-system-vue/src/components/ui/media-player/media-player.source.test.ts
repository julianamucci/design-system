import { describe, expect, it } from 'vitest';
import {
  mediaPlayerAudioSource,
  mediaPlayerCaptionsSource,
  mediaPlayerSnippet,
  mediaPlayerSource,
  mediaPlayerTwoPlayersSource,
  mediaPlayerVideoSource,
  mediaPlayerVimeoSource,
  mediaPlayerYouTubeSource,
} from './media-player.source';

describe('mediaPlayerSnippet', () => {
  it('devolve o SFC de quem consome, e não o markup interno da barra', () => {
    const code = mediaPlayerSnippet();
    expect(code).toContain(
      `import { MediaPlayer, type MediaPlayerLabels } from '@/components/ui/media-player'`,
    );
    expect(code).toContain('<MediaPlayer');
    expect(code).toContain('<template>');
    // O que o painel imprimiria sozinho é a moldura montada — sete botões e um
    // `<video>` que ninguém digita.
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('<video');
  });

  it('mostra os rótulos, que o componente exige', () => {
    const code = mediaPlayerSnippet();
    expect(code).toContain('const labels: MediaPlayerLabels = {');
    expect(code).toContain(`player: 'Reprodutor'`);
    expect(code).toContain(`enterPip: 'Janela flutuante'`);
    expect(code).toContain(':labels="labels"');
  });

  it('omite o que já é padrão do componente', () => {
    const code = mediaPlayerSnippet();
    expect(code).not.toContain('kind=');
    expect(code).not.toContain(':rates=');
    expect(code).not.toContain(':tracks=');
    expect(code).not.toContain(':embed=');
    expect(code).not.toContain(':stream=');
  });

  it('não repete `video`, que é o padrão, mesmo quando a story o declara', () => {
    expect(mediaPlayerSnippet({ kind: 'video' })).not.toContain('kind=');
    expect(mediaPlayerSnippet({ kind: 'audio' })).toContain('kind="audio"');
  });

  it('imprime a lista vazia de velocidades, que DIFERE do padrão', () => {
    // O padrão são seis velocidades; `[]` é o que desliga o seletor, e é
    // justamente o que a fonte ao vivo precisa — `playbackRate` é ignorado em
    // stream. Omitir aqui ensinaria o oposto do que a story faz.
    expect(mediaPlayerSnippet({ rates: [] })).toContain(':rates="[]"');
    expect(mediaPlayerSnippet({ rates: [1, 1.5] })).not.toContain(':rates=');
  });

  it('ensina a legenda pelo arquivo, e não pelo `data:` da story', () => {
    const code = mediaPlayerSnippet({ tracks: true });
    expect(code).toContain(`srclang: 'pt-BR'`);
    expect(code).toContain(`src: '/legendas/pt.vtt'`);
    // O `data:` de 24 caracteres é andaime de teste; copiá-lo ensinaria a
    // embutir legenda em base64.
    expect(code).not.toContain('data:text/vtt');
  });

  it('imprime o provedor com as duas chaves que a URL exige', () => {
    const code = mediaPlayerSnippet({ embed: { provider: 'youtube', videoId: 'aqz-KE-bpKQ' } });
    expect(code).toContain(`provider: 'youtube'`);
    expect(code).toContain(`videoId: 'aqz-KE-bpKQ'`);
    // `videoId`, e não a URL inteira: é o que o componente aceita, e a
    // diferença é o erro mais comum de quem integra provedor.
    expect(code).not.toContain('youtube.com/watch');
  });

  it('imprime a fonte ao vivo como expressão, nunca como objeto serializado', () => {
    // Um `MediaStream` em `String()` vira `[object MediaStream]`. O que o
    // leitor precisa é da expressão que o produz, num `const` que a ligação
    // possa referenciar — atributo de template não aceita `await`.
    const code = mediaPlayerSnippet({
      stream: 'await navigator.mediaDevices.getUserMedia({ video: true })',
    });
    expect(code).toContain('const stream = await navigator.mediaDevices.getUserMedia');
    expect(code).toContain(':stream="stream"');
    expect(code).not.toContain('[object');
  });
});

describe('mediaPlayerSource', () => {
  it('lê o control de fonte do Playground', () => {
    expect(mediaPlayerSource('', { args: { kind: 'audio' } })).toContain('kind="audio"');
    expect(mediaPlayerSource('', { args: { kind: 'video' } })).toContain(':stream="stream"');
  });

  it('sobrevive a contexto sem args, e cai no áudio que o Playground abre', () => {
    expect(mediaPlayerSource()).toContain('<MediaPlayer');
    expect(mediaPlayerSource('', {})).toContain('kind="audio"');
  });

  it('o Playground de vídeo não promete velocidade que a fonte ao vivo ignora', () => {
    const code = mediaPlayerSource('', { args: { kind: 'video' } });
    expect(code).toContain(':rates="[]"');
    // E não ensina vídeo sem legenda: WCAG 1.2.2 é nível A.
    expect(code).toContain(':tracks="tracks"');
  });
});

describe('transforms das stories de fonte', () => {
  it('cada provedor imprime o seu identificador, e nenhum carrega SDK', () => {
    expect(mediaPlayerYouTubeSource()).toContain(`provider: 'youtube'`);
    expect(mediaPlayerVimeoSource()).toContain(`provider: 'vimeo'`);
    for (const code of [mediaPlayerYouTubeSource(), mediaPlayerVimeoSource()]) {
      expect(code).not.toContain('iframe_api');
      expect(code).not.toContain('@vimeo/player');
      // Provedor externo não tem elemento de mídia para velocidade nem legenda:
      // o que o quadro oferece é do quadro.
      expect(code).not.toContain(':tracks=');
    }
  });

  it('o áudio declara a fonte e dispensa o resto', () => {
    const code = mediaPlayerAudioSource();
    expect(code).toContain('kind="audio"');
    expect(code).toContain('src="/audios/episodio.mp3"');
    expect(code).not.toContain(':embed=');
  });

  it('o vídeo ao vivo mostra as duas consequências medidas da fonte', () => {
    const code = mediaPlayerVideoSource();
    expect(code).toContain(':stream="stream"');
    expect(code).toContain(':rates="[]"');
    expect(code).toContain(':tracks="tracks"');
  });

  it('a composição de legenda usa arquivo hospedado, onde a velocidade vale', () => {
    const code = mediaPlayerCaptionsSource();
    expect(code).toContain('src="/videos/tour.mp4"');
    expect(code).toContain(':tracks="tracks"');
    // Arquivo tem duração finita: aqui o seletor de velocidade faz efeito, e
    // desligá-lo seria copiar a limitação da fonte ao vivo para onde ela não
    // existe.
    expect(code).not.toContain(':rates="[]"');
  });

  it('a composição de dois players escreve dois, e um só objeto de rótulos', () => {
    const code = mediaPlayerTwoPlayersSource();
    expect(code.match(/<MediaPlayer/g)).toHaveLength(2);
    expect(code.match(/const labels/g)).toHaveLength(1);
    // A conferência de origem que separa os dois mora dentro do componente:
    // quem consome escreve simplesmente dois.
    expect(code).not.toContain('addEventListener');
  });
});
