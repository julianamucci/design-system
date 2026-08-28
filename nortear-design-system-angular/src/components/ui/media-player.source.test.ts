// O snippet do painel Code é função pura, e nenhuma play o alcança: a saída do
// painel não aparece no DOM durante a story. Entra `ctx.args`, sai a string — e
// isso se verifica aqui, em TS puro, sem navegador e sem compilador de template.
import { describe, expect, it } from 'vitest';
import {
  mediaPlayerSnippet,
  mediaPlayerSource,
  mediaPlayerSourceWith,
} from './media-player.source';

describe('mediaPlayerSnippet', () => {
  it('devolve o uso do componente, e não o template da story', () => {
    const code = mediaPlayerSnippet();
    expect(code).toContain(
      "import { MediaPlayerComponent } from '@/components/ui/media-player';",
    );
    expect(code).toContain('<nds-media-player');
    expect(code).toContain('export class Exemplo {');
    // O andaime da story — a caixa de largura e os slots do DOM — não é o que
    // alguém escreve para usar o componente.
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('nds-w-full');
  });

  it('mostra os rótulos, que o componente exige', () => {
    const code = mediaPlayerSnippet();
    expect(code).toContain('readonly labels = {');
    expect(code).toContain("player: 'Reprodutor'");
    expect(code).toContain("enterPip: 'Janela flutuante'");
    expect(code).toContain('[labels]="labels"');
  });

  it('omite o que já é padrão do componente', () => {
    const code = mediaPlayerSnippet();
    expect(code).not.toContain('kind=');
    expect(code).not.toContain('[rates]');
    expect(code).not.toContain('[tracks]');
    expect(code).not.toContain('[embed]');
    expect(code).not.toContain('[src]');
  });

  it('não repete `video`, que é o padrão, mesmo quando a story o declara', () => {
    expect(mediaPlayerSnippet({ kind: 'video' })).not.toContain('kind=');
    expect(mediaPlayerSnippet({ kind: 'audio' })).toContain('kind="audio"');
  });

  it('imprime a lista vazia de velocidades, que DIFERE do padrão', () => {
    // O padrão são seis velocidades; `[]` é o que desliga o seletor, e é
    // justamente o que a fonte ao vivo precisa — `playbackRate` é ignorado em
    // stream. Omitir aqui ensinaria o oposto do que a story faz.
    expect(mediaPlayerSnippet({ rates: [] })).toContain('[rates]="[]"');
    expect(mediaPlayerSnippet({ rates: [1, 1.5] })).not.toContain('[rates]');
  });

  it('ensina a legenda pelo arquivo, e não pelo `data:` da story', () => {
    const code = mediaPlayerSnippet({ tracks: true });
    expect(code).toContain('[tracks]="tracks"');
    expect(code).toContain("srclang: 'pt-BR'");
    expect(code).toContain("src: '/legendas/pt.vtt'");
    // O `data:` de 24 caracteres é andaime de teste; copiá-lo ensinaria a
    // embutir legenda em base64.
    expect(code).not.toContain('data:text/vtt');
  });

  it('imprime o provedor com as duas chaves que a URL exige', () => {
    const code = mediaPlayerSnippet({ embed: { provider: 'youtube', videoId: 'aqz-KE-bpKQ' } });
    expect(code).toContain('[embed]="embed"');
    expect(code).toContain("provider: 'youtube'");
    expect(code).toContain("videoId: 'aqz-KE-bpKQ'");
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
    expect(code).toContain('[stream]="stream"');
    expect(code).toContain('readonly stream = await navigator.mediaDevices.getUserMedia');
    expect(code).not.toContain('[object');
  });
});

describe('mediaPlayerSource', () => {
  it('lê os controls do Playground', () => {
    expect(mediaPlayerSource('', { args: { kind: 'audio' } })).toContain('kind="audio"');
  });

  it('sobrevive a contexto sem args', () => {
    expect(mediaPlayerSource('', {})).toContain('<nds-media-player');
  });
});

describe('mediaPlayerSourceWith', () => {
  it('as opções fixas vencem os controls', () => {
    const transform = mediaPlayerSourceWith({ kind: 'audio' });
    expect(transform('', { args: { kind: 'video' } })).toContain('kind="audio"');
  });
});
