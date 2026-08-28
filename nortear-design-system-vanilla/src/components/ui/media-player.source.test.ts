import { describe, expect, it } from 'vitest';
import {
  mediaPlayerSnippet,
  mediaPlayerSource,
  mediaPlayerSourceWith,
} from './media-player.source';

describe('mediaPlayerSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML da moldura', () => {
    const code = mediaPlayerSnippet();
    expect(code).toContain("import { createMediaPlayer } from '@/components/ui/media-player';");
    expect(code).toContain('createMediaPlayer({');
    expect(code).toContain("document.querySelector('#app')?.append(player);");
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('<video');
  });

  it('mostra os rótulos, que a fábrica exige', () => {
    const code = mediaPlayerSnippet();
    expect(code).toContain('const labels = {');
    expect(code).toContain("player: 'Reprodutor'");
    expect(code).toContain("enterPip: 'Janela flutuante'");
    expect(code).toContain('labels: labels');
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = mediaPlayerSnippet();
    expect(code).not.toContain('kind:');
    expect(code).not.toContain('rates:');
    expect(code).not.toContain('tracks:');
    expect(code).not.toContain('embed:');
    expect(code).not.toContain('class:');
  });

  it('não repete `video`, que é o padrão, mesmo quando a story o declara', () => {
    expect(mediaPlayerSnippet({ kind: 'video' })).not.toContain('kind:');
    expect(mediaPlayerSnippet({ kind: 'audio' })).toContain("kind: 'audio'");
  });

  it('imprime a lista vazia de velocidades, que DIFERE do padrão', () => {
    // O padrão são seis velocidades; `[]` é o que desliga o seletor, e é
    // justamente o que a fonte ao vivo precisa — `playbackRate` é ignorado em
    // stream. Omitir aqui ensinaria o oposto do que a story faz.
    expect(mediaPlayerSnippet({ rates: [] })).toContain('rates: []');
    expect(mediaPlayerSnippet({ rates: [1, 1.5] })).not.toContain('rates:');
  });

  it('ensina a legenda pelo arquivo, e não pelo `data:` da story', () => {
    const code = mediaPlayerSnippet({ tracks: true });
    expect(code).toContain("srclang: 'pt-BR'");
    expect(code).toContain("src: '/legendas/pt.vtt'");
    // O `data:` de 24 caracteres é andaime de teste; copiá-lo ensinaria a
    // embutir legenda em base64.
    expect(code).not.toContain('data:text/vtt');
  });

  it('imprime o provedor com as duas chaves que a URL exige', () => {
    const code = mediaPlayerSnippet({ embed: { provider: 'youtube', videoId: 'aqz-KE-bpKQ' } });
    expect(code).toContain("provider: 'youtube'");
    expect(code).toContain("videoId: 'aqz-KE-bpKQ'");
    // `videoId`, e não a URL inteira: é o que a fábrica aceita, e a diferença
    // é o erro mais comum de quem integra provedor.
    expect(code).not.toContain('youtube.com/watch');
  });

  it('imprime a fonte ao vivo como expressão, nunca como objeto serializado', () => {
    // Um `MediaStream` em `String()` vira `[object MediaStream]`. O que o
    // leitor precisa é da expressão que o produz.
    const code = mediaPlayerSnippet({ stream: 'await navigator.mediaDevices.getUserMedia({ video: true })' });
    expect(code).toContain('stream: await navigator.mediaDevices.getUserMedia');
    expect(code).not.toContain('[object');
  });
});

describe('mediaPlayerSource', () => {
  it('lê os controls do Playground', () => {
    expect(mediaPlayerSource('', { args: { kind: 'audio' } })).toContain("kind: 'audio'");
  });

  it('sobrevive a contexto sem args', () => {
    expect(mediaPlayerSource('', {})).toContain('createMediaPlayer(');
  });
});

describe('mediaPlayerSourceWith', () => {
  it('as opções fixas vencem os controls', () => {
    const transform = mediaPlayerSourceWith({ kind: 'audio' });
    expect(transform('', { args: { kind: 'video' } })).toContain("kind: 'audio'");
  });
});
