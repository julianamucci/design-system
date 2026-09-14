import { describe, expect, it } from 'vitest';
import {
  skeletonCardDePerfilSource,
  skeletonCirculoSource,
  skeletonStateSource,
  ratioSkeletonImageSource,
  textSkeletonLinesSource,
  skeletonListWithAvatarSource,
  skeletonParagrafoSource,
  skeletonRetanguloSource,
  skeletonSource,
} from './skeleton.source';

const ALL_SNIPPETS = {
  skeletonSource: () => skeletonSource(),
  skeletonRetanguloSource,
  skeletonCirculoSource,
  textSkeletonLinesSource,
  skeletonStateSource,
  skeletonCardDePerfilSource,
  skeletonListWithAvatarSource,
  ratioSkeletonImageSource,
  skeletonParagrafoSource,
};

describe('skeletonSource', () => {
  it('sem args, entrega a forma canônica com a peça de região', () => {
    expect(skeletonSource()).toBe(
      `<script lang="ts">
  import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";
</script>

<SkeletonRegion label="Carregando conteúdo">
  <Skeleton data-shape="text" data-width="3-4" />
</SkeletonRegion>`,
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

  it('fill não tem caixa própria — ela vem da proporção em volta', () => {
    const output = skeletonSource('', { args: { shape: 'fill', width: '1-3' } });
    expect(output).toContain('import { AspectRatio } from "@/components/ui/aspect-ratio";');
    expect(output).toContain('<AspectRatio ratio={16 / 9}>');
    expect(output).toContain('label="Carregando conteúdo"');
    expect(output).not.toContain('data-width');
  });
});

describe('toda região é a peça, nunca escrita à mão', () => {
  for (const [name, render] of Object.entries(ALL_SNIPPETS)) {
    it(`${name}: usa SkeletonRegion e não escreve papel, estado nem nome`, () => {
      const output = render();
      expect(output).toMatch(/<SkeletonRegion\s+label="/);
      expect(output).toContain('import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";');
      // A região não alterna: ela sai quando o conteúdo chega.
      expect(output).not.toContain('role="status"');
      expect(output).not.toContain('aria-busy');
      expect(output).not.toContain('aria-label');
      expect(output).not.toContain('$state(');
    });
  }
});

describe('transforms das stories de variação, estado e composição', () => {
  it('o retângulo preenche a caixa do container, sem largura em fração', () => {
    const output = skeletonRetanguloSource();
    expect(output).toContain('data-shape="fill"');
    // Solto, `fill` nasce com altura zero: quem dá a caixa é a proporção.
    expect(output).toContain('import { AspectRatio } from "@/components/ui/aspect-ratio";');
    expect(output).toContain('<AspectRatio ratio={16 / 9}>');
    expect(output).toContain('nds-w-sm');
    expect(output).not.toContain('data-width');
    // A classe de demonstração da docs page não é API do design system.
    expect(output).not.toContain('nds-docs-skeleton-media');
  });

  it('o círculo é a forma de avatar, sem fração de largura', () => {
    const output = skeletonCirculoSource();
    expect(output).toContain('data-shape="avatar"');
    expect(output).not.toContain('data-width');
  });

  it('as linhas de texto decrescem — é o que faz o bloco parecer parágrafo', () => {
    const output = textSkeletonLinesSource();
    expect(output).toContain('data-width="full"');
    expect(output).toContain('data-width="3-4"');
    expect(output).toContain('data-width="1-2"');
  });

  it('as duas stories de estado compartilham a mesma marcação de duas linhas', () => {
    const output = skeletonStateSource();
    expect(output.match(/<Skeleton /g)).toHaveLength(2);
    expect(output).toContain('label="Carregando conteúdo"');
  });

  it('o card de perfil junta avatar e duas linhas na mesma região', () => {
    const output = skeletonCardDePerfilSource();
    expect(output).toContain('data-shape="avatar"');
    expect(output.match(/data-shape="text"/g)).toHaveLength(2);
    expect(output).toContain('label="Carregando card de perfil"');
  });

  it('a lista é UMA região ocupada, com a `<ul role="list">` dentro da peça', () => {
    const output = skeletonListWithAvatarSource();
    expect(output.indexOf('<SkeletonRegion')).toBeLessThan(output.indexOf('<ul role="list"'));
    expect(output.indexOf('</ul>')).toBeLessThan(output.indexOf('</SkeletonRegion>'));
    expect(output).toContain('data-size="sm"');
    expect(output).toContain('{#each Array.from({ length: 5 }) as _, i (i)}');
  });

  it('a imagem em proporção importa o AspectRatio junto do Skeleton', () => {
    const output = ratioSkeletonImageSource();
    expect(output).toContain('from "@/components/ui/aspect-ratio"');
    expect(output).toContain('<AspectRatio ratio={16 / 9}>');
    expect(output).toContain('data-shape="fill"');
  });

  it('o parágrafo tem três linhas de larguras diferentes', () => {
    const output = skeletonParagrafoSource();
    expect(output.match(/<Skeleton /g)).toHaveLength(3);
    expect(output).toContain('label="Carregando parágrafo"');
  });
});
