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
    const output = aspectRatioSource('', { args: { ratio: 1.55 } });
    expect(output).toContain('ratio={1.55}');
  });

  it('o control de largura máxima chega ao contêiner que envolve a caixa', () => {
    expect(aspectRatioSource('', { args: { width: 'nds-w-xs' } })).toContain(
      '<div class="nds-w-xs">',
    );
  });

  it('o iframe leva o nome acessível que a story escolheu', () => {
    const output = aspectRatioSource('', {
      args: { child: 'iframe', title: 'Mapa do escritório em São Paulo' },
    });
    expect(output).toContain('<iframe');
    expect(output).toContain('title="Mapa do escritório em São Paulo"');
    expect(output).not.toContain('<img');
  });

  it('o vídeo vem com controles e com a faixa de legendas', () => {
    const output = aspectRatioSource('', { args: { child: 'video' } });
    expect(output).toContain('<video');
    expect(output).toContain('controls');
    expect(output).toContain('kind="captions"');
  });

  it('o bloco reservado mostra o rótulo e não traz mídia nenhuma', () => {
    const output = aspectRatioSource('', { args: { child: 'placeholder', label: 'Carregando…' } });
    expect(output).toContain('Carregando…');
    expect(output).not.toContain('<img');
    expect(output).not.toContain('<video');
  });

  it('imagem decorativa mantém o alt, vazio — nunca o atributo ausente', () => {
    // Sem o alt o leitor de tela anuncia o nome do arquivo; `alt=""` o cala.
    const output = aspectRatioSource('', { args: { alt: '' } });
    expect(output).toContain('alt=""');
  });
});

describe('aspectRatioEmGradeSource', () => {
  it('a grade repete a mesma proporção em larguras diferentes', () => {
    const output = gridAspectRatioSource();
    expect(output).toContain('nds-grid');
    expect(output).toContain('<AspectRatio ratio={4 / 3}>');
    expect(output).toContain('{#each imagens as imagem (imagem.src)}');
  });
});
