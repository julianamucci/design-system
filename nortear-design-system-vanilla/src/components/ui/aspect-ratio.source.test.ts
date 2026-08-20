import { describe, expect, it } from 'vitest';
import {
  aspectRatioSnippet,
  aspectRatioSource,
  aspectRatioSourceCom,
  expressaoDeProporcao,
} from './aspect-ratio.source';

describe('aspectRatioSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const código = aspectRatioSnippet();
    expect(código).toContain(
      "import { createAspectRatio } from '@/components/ui/aspect-ratio';",
    );
    expect(código).toContain('createAspectRatio({');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('--ratio');
  });

  it('escreve a proporção como fração, e não como a dízima que a conta produz', () => {
    expect(aspectRatioSnippet({ ratio: 16 / 9 })).toContain('ratio: 16 / 9');
    expect(aspectRatioSnippet({ ratio: 16 / 9 })).not.toContain('1.777');
    expect(aspectRatioSnippet({ ratio: 4 / 3 })).toContain('ratio: 4 / 3');
    expect(aspectRatioSnippet({ ratio: 3 / 4 })).toContain('ratio: 3 / 4');
    expect(aspectRatioSnippet({ ratio: 21 / 9 })).toContain('ratio: 21 / 9');
  });

  it('não arredonda a proporção que veio do control', () => {
    // Arredondar mudaria a caixa: o valor sai como entrou.
    expect(expressaoDeProporcao(1.85)).toBe('1.85');
    expect(aspectRatioSnippet({ ratio: 1.85 })).toContain('ratio: 1.85');
  });

  it('omite o que já é padrão da fábrica', () => {
    // 1 (quadrado) é o padrão de `ratio`; `className` é opcional.
    const quadrado = aspectRatioSnippet({ ratio: 1 });
    expect(quadrado).not.toContain('ratio:');
    // `className:` é a OPÇÃO da fábrica; `imagem.className` é a classe do filho,
    // que a folha do componente não dá.
    expect(quadrado).not.toContain('className:');
  });

  it('mostra a classe extra quando a story a usa', () => {
    expect(aspectRatioSnippet({ className: 'nds-rounded-md nds-bg-muted' })).toContain(
      "className: 'nds-rounded-md nds-bg-muted'",
    );
  });

  it('usa o atributo de nome acessível que cada filho tem', () => {
    expect(aspectRatioSnippet({ alt: 'Paisagem' })).toContain("imagem.alt = 'Paisagem';");
    expect(aspectRatioSnippet({ content: 'iframe', alt: 'Mapa do escritório' })).toContain(
      "mapa.title = 'Mapa do escritório';",
    );
    expect(aspectRatioSnippet({ content: 'video', alt: 'Vídeo com legendas' })).toContain(
      "video.setAttribute('aria-label', 'Vídeo com legendas');",
    );
  });

  it('imagem decorativa é alt vazio, e não atributo ausente', () => {
    const código = aspectRatioSnippet({ alt: '' });
    expect(código).toContain("imagem.alt = '';");
  });

  it('o vídeo leva a faixa de legendas junto', () => {
    const código = aspectRatioSnippet({ content: 'video' });
    expect(código).toContain("legenda.kind = 'captions';");
    expect(código).toContain('video.appendChild(legenda);');
    expect(código).toContain('content: video');
  });

  it('sem filho, a caixa entra sozinha — é o que reserva o espaço', () => {
    const código = aspectRatioSnippet({ content: 'none', className: 'nds-bg-muted' });
    expect(código).not.toContain('content:');
    expect(código).not.toContain('createElement');
    expect(código).toContain("className: 'nds-bg-muted'");
  });

  it('não vaza os helpers do arquivo de story', () => {
    const código = aspectRatioSnippet();
    expect(código).not.toContain('buildImage');
    expect(código).not.toContain('boxed(');
    // A largura máxima do andaime da story não é do componente.
    expect(código).not.toContain('maxWidth');
  });
});

describe('aspectRatioSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const semArgs = aspectRatioSource('<div data-slot="aspect-ratio">', {});
    const comArgs = aspectRatioSource('<div data-slot="aspect-ratio">', {
      args: { ratio: 4 / 3, alt: 'Imagem de produto' },
    });
    expect(semArgs).not.toBe(comArgs);
    expect(comArgs).toContain('ratio: 4 / 3');
    expect(comArgs).toContain("imagem.alt = 'Imagem de produto';");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(
      aspectRatioSource('<div data-slot="aspect-ratio" style="--ratio: 1.7777">', {}),
    ).not.toContain('1.7777');
  });
});

describe('aspectRatioSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = aspectRatioSourceCom({ ratio: 21 / 9, content: 'none' });
    const código = transform('', { args: { ratio: 16 / 9 } });
    expect(código).toContain('ratio: 21 / 9');
    expect(código).not.toContain('16 / 9');
    expect(código).not.toContain('createElement');
  });
});
