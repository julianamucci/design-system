import { describe, expect, it } from 'vitest';
import {
  skeletonCircleSource,
  skeletonImageRatioSource,
  skeletonLineTextSource,
  skeletonListSource,
  skeletonParagraphSource,
  skeletonPlaygroundSource,
  skeletonProfileCardSource,
  skeletonPulsingSource,
  skeletonRectangleSource,
  skeletonReducedMotionSource,
} from './skeleton.source';

const ALL = [
  skeletonPlaygroundSource,
  skeletonRectangleSource,
  skeletonCircleSource,
  skeletonLineTextSource,
  skeletonPulsingSource,
  skeletonReducedMotionSource,
  skeletonProfileCardSource,
  skeletonListSource,
  skeletonImageRatioSource,
  skeletonParagraphSource,
];

describe('skeletonPlaygroundSource', () => {
  it('sem args, entrega uma peça dentro da região que a anuncia', () => {
    expect(skeletonPlaygroundSource()).toBe(
      `<script setup lang="ts">
import { Skeleton, SkeletonRegion } from '@/components/ui/skeleton'
</script>

<template>
  <SkeletonRegion label="Carregando conteúdo">
    <Skeleton data-shape="text" data-width="3-4" />
  </SkeletonRegion>
</template>`,
    );
  });

  it('a forma acompanha o control e é SEMPRE escrita', () => {
    // Sem `data-shape` a folha não tem o que aplicar e o bloco nasce com altura
    // zero: o atributo não é "valor padrão a omitir", é o que desenha a caixa.
    expect(skeletonPlaygroundSource('', { args: { shape: 'heading' } })).toContain(
      'data-shape="heading"',
    );
    expect(skeletonPlaygroundSource('', { args: { shape: 'text' } })).toContain(
      'data-shape="text"',
    );
  });

  it('a largura só entra nas formas que a folha lê', () => {
    const avatar = skeletonPlaygroundSource('', { args: { shape: 'avatar', width: '1-2' } });
    expect(avatar).toContain('<Skeleton data-shape="avatar" />');
    expect(avatar).not.toContain('data-width');
  });

  it('fill não tem caixa própria — ela vem do AspectRatio, não de classe da docs page', () => {
    const saida = skeletonPlaygroundSource('', { args: { shape: 'fill', width: '1-3' } });
    expect(saida).toContain(`import { AspectRatio } from '@/components/ui/aspect-ratio'`);
    expect(saida).toContain('<AspectRatio :ratio="16 / 9">');
    expect(saida).toContain('<Skeleton data-shape="fill" />');
    expect(saida).not.toContain('nds-docs-skeleton-media');
    expect(saida).not.toContain('data-width');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const saida = skeletonPlaygroundSource('', {
      args: { shape: (() => {}) as never, width: (() => {}) as never },
    });
    expect(saida).not.toContain('function');
    // Cai no padrão em vez de interpolar o espião.
    expect(saida).toContain('<Skeleton data-shape="text" data-width="3-4" />');
  });
});

describe('o placeholder nunca aparece sozinho', () => {
  it('toda transform embrulha o bloco na PEÇA de região, com nome', () => {
    for (const fn of ALL) {
      const saida = fn();
      expect(saida).toContain('import { Skeleton, SkeletonRegion }');
      expect(saida).toMatch(/<SkeletonRegion[\s\S]*label="Carregando/);
      expect(saida).toContain('</SkeletonRegion>');
    }
  });

  it('nenhuma escreve papel de status nem estado à mão — vêm da peça', () => {
    // A região não alterna `aria-busy`: ela SAI quando o conteúdo chega. Um
    // snippet que ensina o atributo ensina a alternância.
    for (const fn of ALL) {
      const saida = fn();
      expect(saida).not.toContain('role="status"');
      expect(saida).not.toContain('aria-busy');
      expect(saida).not.toContain('aria-label');
    }
  });

  it('nenhuma escreve aria-hidden na peça — ele já vem do componente', () => {
    for (const fn of ALL) {
      expect(fn()).not.toContain('aria-hidden');
    }
  });
});

describe('transforms das stories de forma', () => {
  it('o retângulo preenche a caixa que o container estabelece', () => {
    const saida = skeletonRectangleSource();
    expect(saida).toContain('label="Carregando bloco"');
    expect(saida).toContain('class="nds-w-sm"');
    expect(saida).toContain(`import { AspectRatio } from '@/components/ui/aspect-ratio'`);
    expect(saida).toContain('<AspectRatio :ratio="16 / 9">');
    expect(saida).toContain('<Skeleton data-shape="fill" />');
    // A classe de mídia é da docs page: no snippet ela ensinaria API que não existe.
    expect(saida).not.toContain('nds-docs-skeleton-media');
  });

  it('o avatar traz medida própria e dispensa largura', () => {
    const saida = skeletonCircleSource();
    expect(saida).toContain('<Skeleton data-shape="avatar" />');
    expect(saida).not.toContain('data-width');
  });

  it('as linhas variam de largura — é isso que as faz parecer parágrafo', () => {
    const saida = skeletonLineTextSource();
    const larguras = [...saida.matchAll(/data-width="([^"]+)"/g)].map((m) => m[1]);
    expect(larguras).toEqual(['full', '3-4', '1-2']);
  });
});

describe('transforms das stories de estado', () => {
  it('o pulso não tem prop: vem da classe base do componente', () => {
    const saida = skeletonPulsingSource();
    expect(saida).toContain('<Skeleton data-shape="text" data-width="full" />');
    // Nem prop, nem atributo, nem classe de animação escritos à mão.
    expect(saida).not.toContain('animate');
    expect(saida).not.toContain('pulse');
  });

  it('movimento reduzido não acrescenta nada ao markup', () => {
    const saida = skeletonReducedMotionSource();
    // A preferência é do sistema e quem responde é a folha compartilhada.
    expect(saida).not.toContain('reduced');
    expect(saida).not.toContain('motion');
    // Mesmas duas linhas do pulso: o que muda é a preferência, não o markup.
    expect([...saida.matchAll(/data-width="([^"]+)"/g)].map((m) => m[1])).toEqual(['full', '3-4']);
    expect(saida).toBe(skeletonPulsingSource());
  });
});

describe('transforms das stories de composição', () => {
  it('o card de perfil põe o avatar ao lado de duas linhas desiguais', () => {
    const saida = skeletonProfileCardSource();
    expect(saida).toContain('<Skeleton data-shape="avatar" />');
    expect(saida).toContain('data-align="center"');
    expect(saida).toContain('<div class="nds-stack nds-flex-1" data-spacing="sm">');
    expect([...saida.matchAll(/data-width="([^"]+)"/g)].map((m) => m[1])).toEqual(['2-3', '1-2']);
  });

  it('na lista, a ul fica DENTRO da peça e não carrega estado nem nome', () => {
    const saida = skeletonListSource();
    expect(saida.indexOf('<SkeletonRegion')).toBeLessThan(saida.indexOf('<ul'));
    expect(saida).toContain('<ul role="list" class="nds-stack nds-list-none nds-p-0" data-spacing="md">');
    expect(saida).toContain('<li v-for="i in 5" :key="i"');
    // O avatar menor sai de `data-size`, não de uma medida escrita à mão.
    expect(saida).toContain('<Skeleton data-shape="avatar" data-size="sm" />');
  });

  it('a imagem toma a caixa do AspectRatio', () => {
    const saida = skeletonImageRatioSource();
    expect(saida).toContain(`import { AspectRatio } from '@/components/ui/aspect-ratio'`);
    expect(saida).toContain('<AspectRatio :ratio="16 / 9">');
    // Dentro de um container que já dá a caixa, a classe de proporção sobraria.
    expect(saida).toContain('<Skeleton data-shape="fill" />');
    expect(saida).not.toContain('nds-docs-skeleton-media');
  });

  it('o parágrafo é só linhas, e elas decrescem', () => {
    const saida = skeletonParagraphSource();
    expect([...saida.matchAll(/data-width="([^"]+)"/g)].map((m) => m[1])).toEqual([
      'full',
      '3-4',
      '1-2',
    ]);
    expect(saida).not.toContain('avatar');
  });
});

/**
 * O painel ensina o que a story MOSTRA — uma entrada por story, com o nome da
 * região, as peças que ela renderiza e o container que dá a caixa ao `fill`.
 *
 * É o caso que faltava: o render do Playground e do `Rectangle` davam a caixa com
 * `nds-docs-skeleton-media`, classe da docs page, enquanto o snippet ensinava
 * `AspectRatio` — e no Playground o nome da região ainda divergia. Nenhum dos
 * dois lados estava errado sozinho, e nada acusava a diferença.
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
    build: () => skeletonPlaygroundSource(),
    label: 'Carregando conteúdo',
    partes: ['<Skeleton data-shape="text" data-width="3-4" />'],
    ratio: false,
  },
  {
    story: 'Playground (heading/1-2)',
    build: () => skeletonPlaygroundSource('', { args: { shape: 'heading', width: '1-2' } }),
    label: 'Carregando conteúdo',
    partes: ['<Skeleton data-shape="heading" data-width="1-2" />'],
    ratio: false,
  },
  {
    story: 'Playground (avatar)',
    build: () => skeletonPlaygroundSource('', { args: { shape: 'avatar' } }),
    label: 'Carregando conteúdo',
    partes: ['<Skeleton data-shape="avatar" />'],
    ratio: false,
  },
  {
    story: 'Playground (fill)',
    build: () => skeletonPlaygroundSource('', { args: { shape: 'fill', width: '1-3' } }),
    label: 'Carregando conteúdo',
    partes: ['<Skeleton data-shape="fill" />'],
    ratio: true,
  },
  {
    story: 'Variants/Rectangle',
    build: skeletonRectangleSource,
    label: 'Carregando bloco',
    partes: ['<Skeleton data-shape="fill" />'],
    ratio: true,
  },
  {
    story: 'Variants/Circle',
    build: skeletonCircleSource,
    label: 'Carregando avatar',
    partes: ['<Skeleton data-shape="avatar" />'],
    ratio: false,
  },
  {
    story: 'Variants/TextLine',
    build: skeletonLineTextSource,
    label: 'Carregando linhas de texto',
    partes: [
      '<Skeleton data-shape="text" data-width="full" />',
      '<Skeleton data-shape="text" data-width="3-4" />',
      '<Skeleton data-shape="text" data-width="1-2" />',
    ],
    ratio: false,
  },
  {
    story: 'States/Pulsing',
    build: skeletonPulsingSource,
    label: 'Carregando conteúdo',
    partes: [
      '<Skeleton data-shape="text" data-width="full" />',
      '<Skeleton data-shape="text" data-width="3-4" />',
    ],
    ratio: false,
  },
  {
    story: 'States/ReducedMotion',
    build: skeletonReducedMotionSource,
    label: 'Carregando conteúdo',
    partes: [
      '<Skeleton data-shape="text" data-width="full" />',
      '<Skeleton data-shape="text" data-width="3-4" />',
    ],
    ratio: false,
  },
  {
    story: 'Compositions/ProfileCard',
    build: skeletonProfileCardSource,
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
    build: skeletonImageRatioSource,
    label: 'Carregando imagem',
    partes: ['<Skeleton data-shape="fill" />'],
    ratio: true,
  },
  {
    story: 'Compositions/Paragraph',
    build: skeletonParagraphSource,
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
      const saida = build();
      expect(saida).toContain(`label="${label}"`);
      for (const parte of partes) expect(saida).toContain(parte);
      if (ratio) {
        // Quem dá a caixa ao `fill` é o container, e ele aparece no exemplo.
        expect(saida).toContain(`import { AspectRatio } from '@/components/ui/aspect-ratio'`);
        expect(saida).toContain('<AspectRatio :ratio="16 / 9">');
      } else {
        expect(saida).not.toContain('AspectRatio');
      }
      // A classe de proporção é da docs page: ela daria a caixa sem ser API.
      expect(saida).not.toContain('nds-docs-skeleton-media');
    });
  }

  it('a região do Playground só ganha layout na forma que precisa de container', () => {
    // Nas formas de texto e no avatar o render não põe classe na região, então o
    // snippet também não pode pôr.
    expect(skeletonPlaygroundSource()).not.toContain('class=');
    expect(skeletonPlaygroundSource('', { args: { shape: 'avatar' } })).not.toContain('class=');
    expect(skeletonPlaygroundSource('', { args: { shape: 'fill' } })).toContain(
      'class="nds-w-sm"',
    );
  });
});
