import { describe, expect, it } from 'vitest';
import {
  midiaSkeletonBlockSource,
  ratioSkeletonImageSource,
  skeletonAvatarSource,
  skeletonCardDePerfilSource,
  skeletonListSource,
  skeletonParagrafoSource,
  skeletonStatesSource,
  skeletonSource,
} from './skeleton.source';

const ALL = [
  () => skeletonSource(),
  midiaSkeletonBlockSource,
  skeletonAvatarSource,
  skeletonParagrafoSource,
  skeletonStatesSource,
  skeletonCardDePerfilSource,
  skeletonListSource,
  ratioSkeletonImageSource,
];

describe('skeletonSource', () => {
  it('sem args, entrega uma linha dentro da peça de região', () => {
    expect(skeletonSource()).toBe(
      `import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";

<SkeletonRegion label="Carregando conteúdo">
  <Skeleton data-shape="text" data-width="3-4" />
</SkeletonRegion>`,
    );
  });

  it('a forma acompanha o control e é SEMPRE escrita', () => {
    // Sem `data-shape` a folha não tem o que aplicar e o bloco nasce com altura
    // zero: o atributo não é "valor padrão a omitir", é o que desenha a caixa.
    expect(skeletonSource('', { args: { shape: 'heading' } })).toContain('data-shape="heading"');
    expect(skeletonSource('', { args: { shape: 'text' } })).toContain('data-shape="text"');
  });

  it('a largura só entra nas formas que a folha lê', () => {
    const avatar = skeletonSource('', { args: { shape: 'avatar', width: '1-2' } });
    expect(avatar).toContain('<Skeleton data-shape="avatar" />');
    expect(avatar).not.toContain('data-width');
  });

  it('fill não tem caixa própria — ela vem da proporção em volta', () => {
    const output = skeletonSource('', { args: { shape: 'fill', width: '1-3' } });
    expect(output).toContain('import { AspectRatio } from "@/components/ui/aspect-ratio";');
    expect(output).toContain('<AspectRatio ratio={16 / 9}>');
    expect(output).not.toContain('data-width');
    // A classe de demonstração da docs page não é API do design system.
    expect(output).not.toContain('nds-docs-skeleton-media');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const output = skeletonSource('', {
      args: { shape: (() => {}) as never, width: (() => {}) as never },
    });
    expect(output).not.toContain('=>');
    expect(output).toContain('<Skeleton data-shape="text" data-width="3-4" />');
  });
});

describe('o placeholder nunca aparece sozinho', () => {
  it('toda transform embrulha a peça na região, com nome', () => {
    for (const fn of ALL) {
      const output = fn();
      expect(output).toContain('import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";');
      expect(output).toMatch(/<SkeletonRegion\s+label="Carregando [^"]+"/);
      expect(output).toContain('</SkeletonRegion>');
    }
  });

  it('nenhuma escreve à mão o que é da peça ou do componente', () => {
    // Papel e estado são da região e não se sobrescrevem; `aria-busy` não é
    // alternado por ninguém — a região sai quando o conteúdo chega.
    for (const fn of ALL) {
      const output = fn();
      expect(output).not.toContain('role="status"');
      expect(output).not.toContain('aria-busy');
      expect(output).not.toContain('aria-label');
      expect(output).not.toContain('aria-hidden');
    }
  });

  it('medida não entra por style', () => {
    for (const fn of ALL) expect(fn()).not.toContain('style');
  });
});

describe('transforms das stories de forma', () => {
  it('o bloco de mídia preenche a caixa que a proporção estabelece', () => {
    const output = midiaSkeletonBlockSource();
    expect(output).toContain('className="nds-w-sm"');
    expect(output).toContain('<Skeleton data-shape="fill" />');
  });

  it('o avatar traz medida própria e dispensa largura', () => {
    const output = skeletonAvatarSource();
    expect(output).toContain('<Skeleton data-shape="avatar" />');
    expect(output).not.toContain('data-width');
  });

  it('as linhas do parágrafo decrescem — é isso que as faz parecer texto', () => {
    const larguras = [...skeletonParagrafoSource().matchAll(/data-width="([^"]+)"/g)].map((m) => m[1]);
    expect(larguras).toEqual(['full', '3-4', '1-2']);
    expect(skeletonParagrafoSource()).not.toContain('avatar');
  });
});

describe('transforms das stories de estado', () => {
  it('o pulso não tem prop: vem da classe base do componente', () => {
    const output = skeletonStatesSource();
    // As duas stories de estado montam a mesma região de duas linhas.
    expect([...output.matchAll(/data-width="([^"]+)"/g)].map((m) => m[1])).toEqual(['full', '3-4']);
    expect(output).toContain('<Skeleton data-shape="text" data-width="full" />');
    expect(output).not.toContain('animate');
    expect(output).not.toContain('pulse');
  });
});

describe('transforms das stories de composição', () => {
  it('o card de perfil põe o avatar ao lado de duas linhas desiguais', () => {
    const output = skeletonCardDePerfilSource();
    expect(output).toContain('<Skeleton data-shape="avatar" />');
    expect(output).toContain('<div className="nds-stack nds-flex-1" data-spacing="sm">');
    expect([...output.matchAll(/data-width="([^"]+)"/g)].map((m) => m[1])).toEqual(['2-3', '1-2']);
  });

  it('na lista, a ul fica DENTRO da peça e carrega só a semântica de lista', () => {
    const output = skeletonListSource();
    expect(output.indexOf('<SkeletonRegion')).toBeLessThan(output.indexOf('<ul'));
    expect(output).toContain('<ul role="list"');
    expect(output.match(/<li /g)).toHaveLength(1);
    expect(output).toContain('[1, 2, 3, 4, 5].map(');
    // O avatar menor sai de `data-size`, não de uma medida escrita à mão.
    expect(output).toContain('<Skeleton data-shape="avatar" data-size="sm" />');
  });

  it('a imagem toma a caixa do AspectRatio', () => {
    const output = ratioSkeletonImageSource();
    expect(output).toContain('import { AspectRatio } from "@/components/ui/aspect-ratio";');
    expect(output).toContain('<AspectRatio ratio={16 / 9}>');
    expect(output).toContain('<Skeleton data-shape="fill" />');
    expect(output).not.toContain('nds-docs-skeleton-media');
  });
});

/**
 * O painel ensina o que a story MOSTRA — uma entrada por story, com o nome da
 * região, as peças que ela renderiza e o container que dá a caixa ao `fill`.
 *
 * É o caso que faltava: o render do Playground e do `Rectangle` davam a caixa
 * com `nds-docs-skeleton-media`, classe da docs page, enquanto o snippet ensinava
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
    build: midiaSkeletonBlockSource,
    label: 'Carregando bloco',
    partes: ['<Skeleton data-shape="fill" />'],
    ratio: true,
  },
  {
    story: 'Variants/Circle',
    build: skeletonAvatarSource,
    label: 'Carregando avatar',
    partes: ['<Skeleton data-shape="avatar" />'],
    ratio: false,
  },
  {
    story: 'Variants/TextLine + Compositions/Paragraph',
    build: skeletonParagrafoSource,
    label: 'Carregando parágrafo',
    partes: [
      '<Skeleton data-shape="text" data-width="full" />',
      '<Skeleton data-shape="text" data-width="3-4" />',
      '<Skeleton data-shape="text" data-width="1-2" />',
    ],
    ratio: false,
  },
  {
    story: 'States/Pulsing + States/ReducedMotion',
    build: skeletonStatesSource,
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
    build: skeletonListSource,
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
    // snippet também não pode pôr — era a divergência só do React.
    expect(skeletonSource()).not.toContain('className=');
    expect(skeletonSource('', { args: { shape: 'avatar' } })).not.toContain('className=');
    expect(skeletonSource('', { args: { shape: 'fill' } })).toContain('className="nds-w-sm"');
  });
});
