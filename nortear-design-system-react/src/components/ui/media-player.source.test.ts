import { describe, expect, it } from 'vitest';
import {
  mediaPlayerSnippet,
  mediaPlayerSource,
  mediaPlayerAudioSource,
  mediaPlayerTracksSource,
  mediaPlayerVimeoSource,
  mediaPlayerYoutubeSource,
  VIMEO_VIDEO_ID,
  YOUTUBE_VIDEO_ID,
} from './media-player.source';

describe('mediaPlayerSnippet', () => {
  it('devolve a chamada do componente, e não o outerHTML da moldura', () => {
    const code = mediaPlayerSnippet();
    expect(code).toContain('import { MediaPlayer } from "@/components/ui/media-player";');
    expect(code).toContain('<MediaPlayer');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('<video');
    // O andaime das stories fica de fora: `MediaPlayerCanvas` só existe nas
    // fixtures, e um snippet que o ensinasse não compilaria em lugar nenhum.
    expect(code).not.toContain('MediaPlayerCanvas');
  });

  it('mostra os rótulos, que o componente exige', () => {
    const code = mediaPlayerSnippet();
    expect(code).toContain('const labels = {');
    expect(code).toContain('player: "Reprodutor"');
    expect(code).toContain('enterPip: "Janela flutuante"');
    expect(code).toContain('labels={labels}');
  });

  it('omite o que já é padrão do componente', () => {
    const code = mediaPlayerSnippet();
    expect(code).not.toContain('kind=');
    expect(code).not.toContain('rates=');
    expect(code).not.toContain('tracks=');
    expect(code).not.toContain('embed=');
    expect(code).not.toContain('className=');
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
    // Um `MediaStream` em `String()` vira `[object MediaStream]`. O que o
    // leitor precisa é da expressão que o produz.
    const code = mediaPlayerSnippet({
      stream: 'await navigator.mediaDevices.getUserMedia({ video: true })',
    });
    expect(code).toContain('stream={await navigator.mediaDevices.getUserMedia');
    expect(code).not.toContain('[object');
  });

  it('descarta o que chega dos args e não é texto', () => {
    // Os args do Playground carregam um `MediaStream` de verdade e os espiões da
    // aba Actions. Interpolados, virariam `[object MediaStream]` e o corpo de um
    // mock dentro do snippet.
    const code = mediaPlayerSnippet({
      stream: {} as unknown as string,
      src: (() => 'x') as unknown as string,
    });
    expect(code).not.toContain('stream=');
    expect(code).not.toContain('src=');
  });
});

describe('mediaPlayerSource', () => {
  it('lê os controls do Playground', () => {
    expect(mediaPlayerSource('', { args: { kind: 'audio' } })).toContain('kind="audio"');
  });

  it('sobrevive a contexto sem args', () => {
    expect(mediaPlayerSource('', {})).toContain('<MediaPlayer');
  });

  it('sobrevive à chamada sem argumento nenhum', () => {
    // A guarda transversal chama cada transform exportada sem contexto.
    expect(mediaPlayerSource()).toContain('labels={labels}');
  });
});

describe('as transforms de opção fixa', () => {
  it('as opções fixas vencem os controls', () => {
    // É a razão de elas existirem: a story fixa o que os controls não cobrem,
    // e o painel Code tem de mostrar o que a story de fato renderiza.
    expect(mediaPlayerAudioSource('', { args: { kind: 'video' } })).toContain('kind="audio"');
  });

  it('e sobrevivem à chamada sem contexto', () => {
    // A guarda transversal chama cada transform exportada sem argumento. Era
    // exatamente isto que a fábrica curried não fazia: devolvia função, e os
    // quatro checks que verificam o snippet nunca chegavam ao snippet.
    expect(mediaPlayerTracksSource()).toContain('labels={labels}');
    expect(mediaPlayerYoutubeSource()).toContain('youtube');
    expect(mediaPlayerVimeoSource()).toContain('vimeo');
  });

  it('o vídeo do snippet é o MESMO que a demonstração toca', () => {
    // Os IDs viviam nas fixtures e no snippet; declarados nos dois, o painel
    // Code ensinaria um vídeo e a tela tocaria outro, e nada acusaria.
    expect(mediaPlayerYoutubeSource()).toContain(YOUTUBE_VIDEO_ID);
    expect(mediaPlayerVimeoSource()).toContain(VIMEO_VIDEO_ID);
  });
});
