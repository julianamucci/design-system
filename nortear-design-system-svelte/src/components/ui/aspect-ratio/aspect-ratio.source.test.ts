import { describe, expect, it } from 'vitest';
import { gridAspectRatioSource, aspectRatioSource } from './aspect-ratio.source';

describe('aspectRatioSource', () => {
  it('sem args, entrega a forma canônica com a proporção escrita como fração', () => {
    expect(aspectRatioSource()).toBe(
      `<script lang="ts">
  import { AspectRatio } from "@/components/ui/aspect-ratio";
</script>

<div class="nds-w-lg">
  <AspectRatio ratio={16 / 9}>
    <img
      src="/midia/paisagem.jpg"
      alt="Paisagem ao entardecer"
      loading="lazy"
      decoding="async"
      class="nds-w-full nds-rounded-md"
      style="height: 100%; object-fit: cover"
    />
  </AspectRatio>
</div>`,
    );
  });

  it('acompanha o control de proporção, e escreve fração em vez de dízima', () => {
    // `1.3333333333333333` no painel não ensina nada; `4 / 3` ensina.
    expect(aspectRatioSource('', { args: { ratio: 4 / 3 } })).toContain('ratio={4 / 3}');
    expect(aspectRatioSource('', { args: { ratio: 1 } })).toContain('ratio={1}');
    expect(aspectRatioSource('', { args: { ratio: 3 / 4 } })).toContain('ratio={3 / 4}');
    expect(aspectRatioSource('', { args: { ratio: 21 / 9 } })).toContain('ratio={21 / 9}');
  });

  it('proporção fora da tabela sai arredondada, e nunca como dízima inteira', () => {
    const saida = aspectRatioSource('', { args: { ratio: 1.55 } });
    expect(saida).toContain('ratio={1.55}');
  });

  it('o control de largura máxima chega ao contêiner que envolve a caixa', () => {
    expect(aspectRatioSource('', { args: { width: 'nds-w-xs' } })).toContain(
      '<div class="nds-w-xs">',
    );
  });

  it('o iframe leva o nome acessível que a story escolheu', () => {
    const saida = aspectRatioSource('', {
      args: { child: 'iframe', title: 'Mapa do escritório em São Paulo' },
    });
    expect(saida).toContain('<iframe');
    expect(saida).toContain('title="Mapa do escritório em São Paulo"');
    expect(saida).not.toContain('<img');
  });

  it('o vídeo vem com controles e com a faixa de legendas', () => {
    const saida = aspectRatioSource('', { args: { child: 'video' } });
    expect(saida).toContain('<video');
    expect(saida).toContain('controls');
    expect(saida).toContain('kind="captions"');
  });

  it('o bloco reservado mostra o rótulo e não traz mídia nenhuma', () => {
    const saida = aspectRatioSource('', { args: { child: 'placeholder', label: 'Carregando…' } });
    expect(saida).toContain('Carregando…');
    expect(saida).not.toContain('<img');
    expect(saida).not.toContain('<video');
  });

  it('imagem decorativa mantém o alt, vazio — nunca o atributo ausente', () => {
    // Sem o alt o leitor de tela anuncia o nome do arquivo; `alt=""` o cala.
    const saida = aspectRatioSource('', { args: { alt: '' } });
    expect(saida).toContain('alt=""');
  });
});

describe('aspectRatioEmGradeSource', () => {
  it('a grade repete a mesma proporção em larguras diferentes', () => {
    const saida = gridAspectRatioSource();
    expect(saida).toContain('nds-grid');
    expect(saida).toContain('<AspectRatio ratio={4 / 3}>');
    expect(saida).toContain('{#each imagens as imagem (imagem.src)}');
  });
});
