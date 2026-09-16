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

/**
 * O painel ensina o que a story MOSTRA — uma entrada por story, com o nome da
 * região, as peças que ela renderiza e o container que dá a caixa ao `fill`.
 *
 * É o caso que faltava: o render do Playground e do `Rectangle` davam a caixa com
 * `nds-docs-skeleton-media`, classe da docs page, enquanto o snippet ensinava
 * `AspectRatio`. Nenhum dos dois lados estava errado sozinho, e nada acusava a
 * diferença — o painel mostrava um elemento que a story não tinha.
 */
const POR_STORY: Array<{
  story: string;
  build: () => string;
  label: string;
  partes: string[];
  ratio: boolean;
}> = [
  {
    story: 'Playground (text/3-4)',
    build: () => skeletonSource(),
    label: 'Carregando conteúdo',
    partes: ['<Skeleton data-shape="text" data-width="3-4" />'],
    ratio: false,
  },
  {
    story: 'Playground (heading/1-2)',
    build: () => skeletonSource('', { args: { shape: 'heading', width: '1-2' } }),
    label: 'Carregando conteúdo',
    partes: ['<Skeleton data-shape="heading" data-width="1-2" />'],
    ratio: false,
  },
  {
    story: 'Playground (avatar)',
    build: () => skeletonSource('', { args: { shape: 'avatar' } }),
    label: 'Carregando conteúdo',
    partes: ['<Skeleton data-shape="avatar" />'],
    ratio: false,
  },
  {
    story: 'Playground (fill)',
    build: () => skeletonSource('', { args: { shape: 'fill', width: '1-3' } }),
    label: 'Carregando conteúdo',
    partes: ['<Skeleton data-shape="fill" />'],
    ratio: true,
  },
  {
    story: 'Variants/Rectangle',
    build: skeletonRetanguloSource,
    label: 'Carregando bloco',
    partes: ['<Skeleton data-shape="fill" />'],
    ratio: true,
  },
  {
    story: 'Variants/Circle',
    build: skeletonCirculoSource,
    label: 'Carregando avatar',
    partes: ['<Skeleton data-shape="avatar" />'],
    ratio: false,
  },
  {
    story: 'Variants/TextLine',
    build: textSkeletonLinesSource,
    label: 'Carregando linhas de texto',
    partes: [
      '<Skeleton data-shape="text" data-width="full" />',
      '<Skeleton data-shape="text" data-width="3-4" />',
      '<Skeleton data-shape="text" data-width="1-2" />',
    ],
    ratio: false,
  },
  {
    story: 'States/Pulsing + States/ReducedMotion',
    build: skeletonStateSource,
    label: 'Carregando conteúdo',
    partes: [
      '<Skeleton data-shape="text" data-width="full" />',
      '<Skeleton data-shape="text" data-width="3-4" />',
    ],
    ratio: false,
  },
  {
    story: 'Compositions/ProfileCard',
    build: skeletonCardDePerfilSource,
    label: 'Carregando card de perfil',
    partes: [
      '<Skeleton data-shape="avatar" />',
      '<Skeleton data-shape="text" data-width="2-3" />',
      '<Skeleton data-shape="text" data-width="1-2" />',
    ],
    ratio: false,
  },
  {
    story: 'Compositions/ListWithAvatar',
    build: skeletonListWithAvatarSource,
    label: 'Carregando lista de pedidos',
    partes: [
      '<Skeleton data-shape="avatar" data-size="sm" />',
      '<Skeleton data-shape="text" data-width="2-3" />',
      '<Skeleton data-shape="text" data-width="1-3" />',
    ],
    ratio: false,
  },
  {
    story: 'Compositions/ImageInAspectRatio',
    build: ratioSkeletonImageSource,
    label: 'Carregando imagem',
    partes: ['<Skeleton data-shape="fill" />'],
    ratio: true,
  },
  {
    story: 'Compositions/Paragraph',
    build: skeletonParagrafoSource,
    label: 'Carregando parágrafo',
    partes: [
      '<Skeleton data-shape="text" data-width="full" />',
      '<Skeleton data-shape="text" data-width="3-4" />',
      '<Skeleton data-shape="text" data-width="1-2" />',
    ],
    ratio: false,
  },
];

describe('o painel ensina o que a story mostra', () => {
  for (const { story, build, label, partes, ratio } of POR_STORY) {
    it(`${story}: a região, as peças e o container batem com o render`, () => {
      const output = build();
      expect(output).toContain(`label="${label}"`);
      for (const parte of partes) expect(output).toContain(parte);
      if (ratio) {
        // Quem dá a caixa ao `fill` é o container, e ele aparece no exemplo.
        expect(output).toContain('import { AspectRatio } from "@/components/ui/aspect-ratio";');
        expect(output).toContain('<AspectRatio ratio={16 / 9}>');
      } else {
        expect(output).not.toContain('AspectRatio');
      }
      // A classe de proporção é da docs page: ela daria a caixa sem ser API.
      expect(output).not.toContain('nds-docs-skeleton-media');
    });
  }

  it('a região do Playground só ganha layout na forma que precisa de container', () => {
    // Nas formas de texto e no avatar o render não põe classe na região, então o
    // snippet também não pode pôr.
    expect(skeletonSource()).not.toContain('class=');
    expect(skeletonSource('', { args: { shape: 'avatar' } })).not.toContain('class=');
    expect(skeletonSource('', { args: { shape: 'fill' } })).toContain('class="nds-w-sm"');
  });
});
