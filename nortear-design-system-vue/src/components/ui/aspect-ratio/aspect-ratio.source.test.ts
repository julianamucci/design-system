import { describe, expect, it } from 'vitest';
import {
  aspectRatioComIframeSource,
  aspectRatioComImagemSource,
  aspectRatioComVideoSource,
  aspectRatioDecorativaSource,
  aspectRatioDezesseisNoveSource,
  aspectRatioEmGradeSource,
  aspectRatioPlaceholderSource,
  aspectRatioQuadradoSource,
  aspectRatioQuatroTresSource,
  aspectRatioSource,
  aspectRatioTresQuatroSource,
  aspectRatioUltraWideSource,
  attrProporcao,
  expressaoDeProporcao,
} from './aspect-ratio.source';

describe('aspectRatioSource', () => {
  it('sem args, entrega a caixa canônica em 16/9 com imagem cobrindo', () => {
    expect(aspectRatioSource()).toBe(
      `<script setup lang="ts">
import { AspectRatio } from '@/components/ui/aspect-ratio'
</script>

<template>
  <div class="nds-w-lg">
    <AspectRatio :ratio="16 / 9">
      <img
        src="https://images.unsplash.com/photo-1535025183041-0991a977e25b?w=800&auto=format"
        alt="Paisagem ao amanhecer"
        loading="lazy"
        decoding="async"
        class="nds-rounded-md"
        style="object-fit: cover"
      />
    </AspectRatio>
  </div>
</template>`,
    );
  });

  it('a proporção vira fração, não decimal infinito', () => {
    expect(expressaoDeProporcao(16 / 9)).toBe('16 / 9');
    expect(expressaoDeProporcao(21 / 9)).toBe('21 / 9');
    expect(aspectRatioSource('', { args: { ratio: 4 / 3 } })).toContain(':ratio="4 / 3"');
    // Fora das proporções conhecidas o número é arredondado: `1.7777777777777777`
    // no painel ensina a copiar um decimal infinito.
    expect(expressaoDeProporcao(1.234567)).toBe('1.23');
  });

  it('o quadrado é o padrão do componente e não é escrito', () => {
    expect(attrProporcao(1)).toBe('');
    expect(aspectRatioSource('', { args: { ratio: 1 } })).not.toContain(':ratio=');
  });

  it('ignora control que não é número — o espião de ação vira ruído no painel', () => {
    expect(attrProporcao((() => {}) as never)).toBe('');
    expect(attrProporcao(Number.NaN)).toBe('');
    const saida = aspectRatioSource('', { args: { ratio: (() => {}) as never } });
    expect(saida).not.toContain('function');
    expect(saida).not.toContain(':ratio=');
  });

  it('o filho não repete largura nem altura — o componente já o estica', () => {
    const saida = aspectRatioSource();
    expect(saida).not.toContain('nds-w-full');
    expect(saida).not.toContain('nds-h-full');
    expect(saida).not.toContain('height: 100%');
  });

  it('a caixa vive dentro de um contêiner com largura da escala', () => {
    // A caixa ocupa 100% do que está em volta: sem teto não há do que derivar
    // a altura, e o exemplo não mostraria proporção nenhuma.
    expect(aspectRatioSource()).toContain('<div class="nds-w-lg">');
  });
});

describe('transforms das stories de proporção', () => {
  it('cada variante escreve a própria fração', () => {
    expect(aspectRatioDezesseisNoveSource()).toContain(':ratio="16 / 9"');
    expect(aspectRatioQuatroTresSource()).toContain(':ratio="4 / 3"');
    expect(aspectRatioTresQuatroSource()).toContain(':ratio="3 / 4"');
    expect(aspectRatioUltraWideSource()).toContain(':ratio="21 / 9"');
  });

  it('a quadrada sai sem proporção, porque escrevê-la ensinaria obrigação', () => {
    const saida = aspectRatioQuadradoSource();
    expect(saida).toContain('<AspectRatio>');
    expect(saida).not.toContain(':ratio=');
    expect(saida).toContain('alt="Avatar quadrado"');
  });
});

describe('transforms das stories de composição', () => {
  it('a imagem informativa descreve o que se vê', () => {
    expect(aspectRatioComImagemSource()).toContain(
      'alt="Paisagem ao amanhecer com montanhas e céu laranja"',
    );
  });

  it('a decorativa leva alt VAZIO, e não alt ausente', () => {
    const saida = aspectRatioDecorativaSource();
    // Sem o atributo o leitor de tela anuncia o nome do arquivo.
    expect(saida).toContain('alt=""');
  });

  it('o quadro embutido é nomeado por title', () => {
    const saida = aspectRatioComIframeSource();
    expect(saida).toContain('title="Mapa do escritório em São Paulo"');
    expect(saida).not.toContain('alt=');
  });

  it('o vídeo traz controle de teclado e faixa de legendas', () => {
    const saida = aspectRatioComVideoSource();
    expect(saida).toContain('  controls\n');
    expect(saida).toContain('<track kind="captions"');
    expect(saida).toContain('label="Português" default');
    expect(saida).toContain('Seu navegador não suporta vídeo.');
    // A legenda embutida em `data:` existe para a play medir; ninguém escreve
    // uma assim num produto.
    expect(saida).not.toContain('data:text/vtt');
  });

  it('a grade dá a largura, e cada caixa deriva a própria altura', () => {
    const saida = aspectRatioEmGradeSource();
    expect(saida).toContain('<div class="nds-grid nds-max-w-prose" data-spacing="md">');
    expect(saida.match(/<AspectRatio>/g)).toHaveLength(6);
    // Nenhuma altura cravada: é o recálculo a partir da largura que a story ensina.
    expect(saida).not.toContain('height:');
    const alts = [...saida.matchAll(/alt="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(alts).size).toBe(alts.length);
  });

  it('o espaço reservado tem papel e rótulo, porque não há mídia a descrever', () => {
    const saida = aspectRatioPlaceholderSource();
    expect(saida).toContain('role="img"');
    expect(saida).toContain('aria-label="Conteúdo carregando"');
    expect(saida).not.toContain('<img');
  });
});
