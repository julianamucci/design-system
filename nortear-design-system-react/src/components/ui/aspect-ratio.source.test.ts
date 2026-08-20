import { describe, expect, it } from 'vitest';
import {
  aspectRatioComIframeSource,
  aspectRatioComVideoSource,
  aspectRatioEmGradeSource,
  aspectRatioImagemDecorativaSource,
  aspectRatioPlaceholderSource,
  aspectRatioQuadradoSource,
  aspectRatioQuatroTercosSource,
  aspectRatioSource,
  aspectRatioTresQuartosSource,
  aspectRatioUltraWideSource,
  ratioExpr,
} from './aspect-ratio.source';

describe('ratioExpr', () => {
  it('devolve a fração documentada, e não o ponto flutuante do control', () => {
    expect(ratioExpr(16 / 9)).toBe('16 / 9');
    expect(ratioExpr(4 / 3)).toBe('4 / 3');
    expect(ratioExpr(1)).toBe('1');
    expect(ratioExpr(3 / 4)).toBe('3 / 4');
    expect(ratioExpr(21 / 9)).toBe('21 / 9');
  });

  it('valor fora dos presets vira decimal curto, nunca 16 casas', () => {
    expect(ratioExpr(2.5)).toBe('2.5');
    expect(ratioExpr(1.23456)).toBe('1.235');
  });

  it('control adulterado cai no preset padrão em vez de gerar NaN', () => {
    for (const ruim of [undefined, null, 'dois', Number.NaN, Infinity, 0, -1]) {
      expect(ratioExpr(ruim)).toBe('16 / 9');
    }
  });
});

describe('aspectRatioSource', () => {
  it('ensina a importação do design system', () => {
    expect(aspectRatioSource()).toContain(
      'import { AspectRatio } from "@/components/ui/aspect-ratio";',
    );
  });

  it('o ratio do control chega ao snippet como fração', () => {
    expect(aspectRatioSource(undefined, { args: { ratio: 4 / 3 } })).toContain(
      '<AspectRatio ratio={4 / 3}>',
    );
  });

  it('usa <img> comum — o invólucro de fallback é andaime das stories', () => {
    const saida = aspectRatioSource();
    expect(saida).toContain('<img');
    expect(saida).not.toContain('ImageWithFallback');
    expect(saida).not.toContain('components/figma');
  });

  it('object-fit e raio ficam no FILHO, nunca no contêiner', () => {
    const saida = aspectRatioSource();
    expect(saida).toContain('style={{ objectFit: "cover" }}');
    expect(saida).toContain('className="nds-rounded-md"');
    expect(saida).not.toContain('<AspectRatio ratio={16 / 9} className');
  });

  it('a imagem informativa tem alt descritivo', () => {
    expect(aspectRatioSource()).toContain('alt="Paisagem ao entardecer"');
  });
});

describe('proporções canônicas', () => {
  it('cada uma diz a sua, porque o arquivo desliga os controls', () => {
    expect(aspectRatioQuatroTercosSource()).toContain('ratio={4 / 3}');
    expect(aspectRatioQuadradoSource()).toContain('ratio={1}');
    expect(aspectRatioTresQuartosSource()).toContain('ratio={3 / 4}');
    expect(aspectRatioUltraWideSource()).toContain('ratio={21 / 9}');
  });
});

describe('composições', () => {
  it('a imagem decorativa usa alt vazio, e não omite o atributo', () => {
    const saida = aspectRatioImagemDecorativaSource();
    expect(saida).toContain('alt=""');
  });

  it('o iframe carrega title — é o nome acessível do quadro embutido', () => {
    const saida = aspectRatioComIframeSource();
    expect(saida).toContain('<iframe');
    expect(saida).toContain('title="Mapa do escritório em São Paulo"');
  });

  it('o vídeo traz faixa de legendas e controles alcançáveis pelo teclado', () => {
    const saida = aspectRatioComVideoSource();
    expect(saida).toContain('<track');
    expect(saida).toContain('kind="captions"');
    expect(saida).toContain('controls');
  });

  it('o espaço reservado não tem mídia dentro e ainda assim se anuncia', () => {
    const saida = aspectRatioPlaceholderSource();
    expect(saida).not.toContain('<img');
    expect(saida).not.toContain('<video');
    expect(saida).toContain('role="img"');
    expect(saida).toContain('aria-label="Conteúdo carregando"');
  });

  it('na grade a proporção é a mesma em todas as células', () => {
    const saida = aspectRatioEmGradeSource();
    expect(saida).toContain('nds-grid');
    expect(saida.match(/ratio=\{4 \/ 3\}/g)).toHaveLength(1);
    expect(saida).toContain('itens.map');
  });

  it('nenhum snippet ensina o andaime da story', () => {
    for (const fn of [
      aspectRatioSource,
      aspectRatioComIframeSource,
      aspectRatioComVideoSource,
      aspectRatioEmGradeSource,
      aspectRatioImagemDecorativaSource,
      aspectRatioPlaceholderSource,
      aspectRatioQuadradoSource,
      aspectRatioQuatroTercosSource,
      aspectRatioTresQuartosSource,
      aspectRatioUltraWideSource,
    ]) {
      const saida = fn();
      expect(saida).not.toContain('fixtures');
      expect(saida).not.toContain('ImageWithFallback');
      expect(saida).not.toContain('LANDSCAPE_SRC');
      // O ponto flutuante cru do control era o que o painel imprimia antes.
      expect(saida).not.toContain('1.7777');
    }
  });
});
