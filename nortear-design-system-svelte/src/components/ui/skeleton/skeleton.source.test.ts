import { describe, expect, it } from 'vitest';
import {
  skeletonCardDePerfilSource,
  skeletonCirculoSource,
  skeletonStateSource,
  skeletonImagemEmProporcaoSource,
  textSourceSkeletonLines,
  skeletonListWithAvatarSource,
  skeletonParagrafoSource,
  skeletonRetanguloSource,
  skeletonSource,
} from './skeleton.source';

describe('skeletonSource', () => {
  it('sem args, entrega a forma canônica com a região que anuncia o carregamento', () => {
    expect(skeletonSource()).toBe(
      `<script lang="ts">
  import { Skeleton } from "@/components/ui/skeleton";

  let carregando = $state(true);
</script>

<div role="status" aria-busy={carregando} aria-label="Carregando conteúdo">
  <Skeleton data-shape="text" data-width="3-4" />
</div>`,
    );
  });

  it('acompanha o control de forma', () => {
    expect(skeletonSource('', { args: { shape: 'heading' } })).toContain('data-shape="heading"');
    expect(skeletonSource('', { args: { shape: 'avatar' } })).toContain('data-shape="avatar"');
  });

  it('só escreve data-width nas formas de texto — nas outras o atributo não responde', () => {
    expect(skeletonSource('', { args: { shape: 'text', width: '1-3' } })).toContain(
      'data-width="1-3"',
    );
    expect(skeletonSource('', { args: { shape: 'heading', width: 'full' } })).toContain(
      'data-width="full"',
    );
    expect(skeletonSource('', { args: { shape: 'avatar' } })).not.toContain('data-width');
    expect(skeletonSource('', { args: { shape: 'fill' } })).not.toContain('data-width');
  });

  it('acompanha o control de carregamento no estado da região', () => {
    expect(skeletonSource('', { args: { loading: true } })).toContain('$state(true)');
    expect(skeletonSource('', { args: { loading: false } })).toContain('$state(false)');
  });
});

describe('transforms das stories de variação, estado e composição', () => {
  it('o retângulo preenche a caixa do container, sem largura em fração', () => {
    const saida = skeletonRetanguloSource();
    expect(saida).toContain('data-shape="fill"');
    expect(saida).toContain('nds-w-sm');
    expect(saida).not.toContain('data-width');
  });

  it('o círculo é a forma de avatar, sem fração de largura', () => {
    const saida = skeletonCirculoSource();
    expect(saida).toContain('data-shape="avatar"');
    expect(saida).not.toContain('data-width');
  });

  it('as linhas de texto decrescem — é o que faz o bloco parecer parágrafo', () => {
    const saida = textSourceSkeletonLines();
    expect(saida).toContain('data-width="full"');
    expect(saida).toContain('data-width="3-4"');
    expect(saida).toContain('data-width="1-2"');
  });

  it('as duas stories de estado compartilham a mesma marcação de duas linhas', () => {
    const saida = skeletonStateSource();
    expect(saida.match(/<Skeleton /g)).toHaveLength(2);
    expect(saida).toContain('aria-busy="true"');
  });

  it('o card de perfil junta avatar e duas linhas na mesma região', () => {
    const saida = skeletonCardDePerfilSource();
    expect(saida).toContain('data-shape="avatar"');
    expect(saida.match(/data-shape="text"/g)).toHaveLength(2);
    expect(saida).toContain('aria-label="Carregando card de perfil"');
  });

  it('a lista é UMA região ocupada, com o avatar no degrau compacto', () => {
    const saida = skeletonListWithAvatarSource();
    expect(saida).toContain('<ul');
    expect(saida).toContain('data-size="sm"');
    expect(saida).toContain('{#each Array.from({ length: 5 }) as _, i (i)}');
  });

  it('a imagem em proporção importa o AspectRatio junto do Skeleton', () => {
    const saida = skeletonImagemEmProporcaoSource();
    expect(saida).toContain('from "@/components/ui/aspect-ratio"');
    expect(saida).toContain('<AspectRatio ratio={16 / 9}>');
    expect(saida).toContain('data-shape="fill"');
  });

  it('o parágrafo tem três linhas de larguras diferentes', () => {
    const saida = skeletonParagrafoSource();
    expect(saida.match(/<Skeleton /g)).toHaveLength(3);
    expect(saida).toContain('aria-label="Carregando parágrafo"');
  });
});
