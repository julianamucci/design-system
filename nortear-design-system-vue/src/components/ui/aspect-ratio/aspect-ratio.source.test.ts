import { describe, expect, it } from 'vitest';
import {
  aspectRatioWithIframeSource,
  aspectRatioWithImageSource,
  aspectRatioWithVideoSource,
  aspectRatioDecorativaSource,
  aspectRatioDezesseisNoveSource,
  gridAspectRatioSource,
  aspectRatioPlaceholderSource,
  aspectRatioQuadradoSource,
  aspectRatioQuatroTresSource,
  aspectRatioSource,
  aspectRatioTresQuatroSource,
  aspectRatioUltraWideSource,
  attrRatio,
  ratioExpression,
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
    expect(ratioExpression(16 / 9)).toBe('16 / 9');
    expect(ratioExpression(21 / 9)).toBe('21 / 9');
    expect(aspectRatioSource('', { args: { ratio: 4 / 3 } })).toContain(':ratio="4 / 3"');
    // Fora das proporções conhecidas o número é arredondado: `1.7777777777777777`
    // no painel ensina a copiar um decimal infinito.
    expect(ratioExpression(1.234567)).toBe('1.23');
  });

  it('o quadrado é o padrão do componente e não é escrito', () => {
    expect(attrRatio(1)).toBe('');
    expect(aspectRatioSource('', { args: { ratio: 1 } })).not.toContain(':ratio=');
  });

  it('ignora control que não é número — o espião de ação vira ruído no painel', () => {
    expect(attrRatio((() => {}) as never)).toBe('');
    expect(attrRatio(Number.NaN)).toBe('');
    const output = aspectRatioSource('', { args: { ratio: (() => {}) as never } });
    expect(output).not.toContain('function');
    expect(output).not.toContain(':ratio=');
  });

  it('o filho não repete largura nem altura — o componente já o estica', () => {
    const output = aspectRatioSource();
    expect(output).not.toContain('nds-w-full');
    expect(output).not.toContain('nds-h-full');
    expect(output).not.toContain('height: 100%');
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
    const output = aspectRatioQuadradoSource();
    expect(output).toContain('<AspectRatio>');
    expect(output).not.toContain(':ratio=');
    expect(output).toContain('alt="Avatar quadrado"');
  });
});

describe('transforms das stories de composição', () => {
  it('a imagem informativa descreve o que se vê', () => {
    expect(aspectRatioWithImageSource()).toContain(
      'alt="Paisagem ao amanhecer com montanhas e céu laranja"',
    );
  });

  it('a decorativa leva alt VAZIO, e não alt ausente', () => {
    const output = aspectRatioDecorativaSource();
    // Sem o atributo o leitor de tela anuncia o nome do arquivo.
    expect(output).toContain('alt=""');
  });

  it('o quadro embutido é nomeado por title', () => {
    const output = aspectRatioWithIframeSource();
    expect(output).toContain('title="Mapa do escritório em São Paulo"');
    expect(output).not.toContain('alt=');
  });

  it('o vídeo traz controle de teclado e faixa de legendas', () => {
    const output = aspectRatioWithVideoSource();
    expect(output).toContain('  controls\n');
    expect(output).toContain('<track kind="captions"');
    expect(output).toContain('label="Português" default');
    expect(output).toContain('Seu navegador não suporta vídeo.');
    // A legenda embutida em `data:` existe para a play medir; ninguém escreve
    // uma assim num produto.
    expect(output).not.toContain('data:text/vtt');
  });

  it('a grade dá a largura, e cada caixa deriva a própria altura', () => {
    const output = gridAspectRatioSource();
    expect(output).toContain('<div class="nds-grid nds-max-w-prose" data-spacing="md">');
    expect(output.match(/<AspectRatio>/g)).toHaveLength(6);
    // Nenhuma altura cravada: é o recálculo a partir da largura que a story ensina.
    expect(output).not.toContain('height:');
    const alts = [...output.matchAll(/alt="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(alts).size).toBe(alts.length);
  });

  it('o espaço reservado tem papel e rótulo, porque não há mídia a descrever', () => {
    const output = aspectRatioPlaceholderSource();
    expect(output).toContain('role="img"');
    expect(output).toContain('aria-label="Conteúdo carregando"');
    expect(output).not.toContain('<img');
  });
});
