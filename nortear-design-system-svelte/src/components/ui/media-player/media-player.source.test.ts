import { describe, expect, it } from 'vitest';
import {
  mediaPlayerAudioSource,
  mediaPlayerSnippet,
  mediaPlayerSource,
  mediaPlayerVideoSource,
  mediaPlayerVimeoSource,
  mediaPlayerYouTubeSource,
} from './media-player.source';

describe('mediaPlayerSnippet', () => {
  it('devolve a montagem do componente, e não o markup interno da moldura', () => {
    const code = mediaPlayerSnippet();
    expect(code).toContain('import { MediaPlayer } from "@/components/ui/media-player";');
    expect(code).toContain('<MediaPlayer');
    // O renderer imprimiria o `outerHTML`: um `<div>` com um `<video>` e sete
    // botões, que não é o que se escreve nesta stack.
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('<video');
  });

  it('mostra os rótulos, que o componente exige', () => {
    const code = mediaPlayerSnippet();
    expect(code).toContain('import { labels } from "./media-player-labels";');
    expect(code).toContain('{labels}');
  });

  it('omite o que já é padrão do componente', () => {
    const code = mediaPlayerSnippet();
    expect(code).not.toContain('kind=');
    expect(code).not.toContain('rates=');
    expect(code).not.toContain('tracks=');
    expect(code).not.toContain('embed=');
    expect(code).not.toContain('class=');
  });

  it('não repete `video`, que é o padrão, mesmo quando a story o declara', () => {
    expect(mediaPlayerSnippet({ kind: 'video' })).not.toContain('kind=');
    expect(mediaPlayerSnippet({ kind: 'audio' })).toContain('kind="audio"');
  });

  it('imprime a lista vazia de velocidades, que DIFERE do padrão', () => {
    // O padrão são seis velocidades; `[]` é o que desliga o seletor, e é
    // justamente o que a fonte ao vivo precisa — `playbackRate` é ignorado em
    // stream. Omitir aqui ensinaria o oposto do que a story faz.
    expect(mediaPlayerSnippet({ rates: [] })).toContain('rates={[]}');
    expect(mediaPlayerSnippet({ rates: [1, 1.5] })).not.toContain('rates=');
  });

  it('ensina a legenda pelo arquivo, e não pelo `data:` da story', () => {
    const code = mediaPlayerSnippet({ tracks: true });
    expect(code).toContain('srclang: "pt-BR"');
    expect(code).toContain('src: "/legendas/pt.vtt"');
    // O `data:` de 24 caracteres é andaime de teste; copiá-lo ensinaria a
    // embutir legenda em base64.
    expect(code).not.toContain('data:text/vtt');
  });

  it('imprime o provedor com as duas chaves que a URL exige', () => {
    const code = mediaPlayerSnippet({ embed: { provider: 'youtube', videoId: 'aqz-KE-bpKQ' } });
    expect(code).toContain('provider: "youtube"');
    expect(code).toContain('videoId: "aqz-KE-bpKQ"');
    // `videoId`, e não a URL inteira: é o que o componente aceita, e a diferença
    // é o erro mais comum de quem integra provedor.
    expect(code).not.toContain('youtube.com/watch');
  });

  it('imprime a fonte ao vivo como expressão, nunca como objeto serializado', () => {
    // Um `MediaStream` em `String()` vira `[object MediaStream]`. O que o leitor
    // precisa é da expressão que o produz.
    const code = mediaPlayerSnippet({
      stream: 'await navigator.mediaDevices.getUserMedia({ video: true })',
    });
    expect(code).toContain('stream={await navigator.mediaDevices.getUserMedia');
    expect(code).not.toContain('[object');
  });

  it('quebra em linhas quando a fila de atributos passa do limite do painel', () => {
    const code = mediaPlayerSnippet({
      kind: 'audio',
      tracks: true,
      rates: [],
      class: 'nds-w-full',
    });
    expect(code).toContain('<MediaPlayer\n');
    expect(code).toContain('\n/>');
  });
});

describe('mediaPlayerSource', () => {
  it('lê os controls do Playground', () => {
    expect(mediaPlayerSource('', { args: { kind: 'audio' } })).toContain('kind="audio"');
  });

  it('sobrevive a contexto sem args', () => {
    expect(mediaPlayerSource()).toContain('<MediaPlayer');
    expect(mediaPlayerSource('', {})).toContain('<MediaPlayer');
  });
});

describe('transforms das stories de fonte, estado e composição', () => {
  it('a fonte de vídeo ensina a legenda e a lista vazia de velocidades', () => {
    const code = mediaPlayerVideoSource();
    expect(code).toContain('tracks={[');
    expect(code).toContain('rates={[]}');
    expect(code).not.toContain('kind=');
  });

  it('a fonte de áudio declara o motor, que difere do padrão', () => {
    expect(mediaPlayerAudioSource()).toContain('kind="audio"');
    expect(mediaPlayerAudioSource()).toContain('src="/audios/episodio.mp3"');
  });

  it('os dois provedores se distinguem pelo dialeto, não pela montagem', () => {
    expect(mediaPlayerYouTubeSource()).toContain('provider: "youtube"');
    expect(mediaPlayerVimeoSource()).toContain('provider: "vimeo"');
    // A barra é a mesma nos dois — é o ponto do componente, e o snippet o mostra.
    for (const build of [mediaPlayerYouTubeSource, mediaPlayerVimeoSource]) {
      expect(build()).toContain('<MediaPlayer');
      expect(build()).toContain('{labels}');
      expect(build()).not.toContain('kind=');
    }
  });

  it('nenhum snippet vaza o andaime da story nem endereço de teste', () => {
    for (const build of [
      mediaPlayerSnippet,
      mediaPlayerSource,
      mediaPlayerVideoSource,
      mediaPlayerAudioSource,
      mediaPlayerYouTubeSource,
      mediaPlayerVimeoSource,
    ]) {
      const code = build();
      expect(code).not.toContain('data:audio/wav');
      expect(code).not.toContain('canvasStream');
      expect(code).not.toContain('LABELS');
    }
  });
});
