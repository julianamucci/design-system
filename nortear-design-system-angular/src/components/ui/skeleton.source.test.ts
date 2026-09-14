import { describe, expect, it } from 'vitest';
import * as skeletonSource from './skeleton.source';
import {
  skeletonCircleSource,
  skeletonImageRatioSource,
  skeletonListWithAvatarSource,
  skeletonParagraphSource,
  skeletonPlaygroundSource,
  skeletonProfileCardSource,
  skeletonRectangleSource,
  skeletonStatesSource,
  skeletonTextLineSource,
} from './skeleton.source';

/**
 * A varredura genérica prova que o snippet importa o que usa e liga só o que a
 * classe declara. Estes casos guardam o que ela não alcança: que o snippet
 * ensina a PEÇA de região em vez do trio à mão, que não liga estado de
 * carregamento, e que bate com a story ao lado.
 */

const CONSTRUCTORS: Array<{ name: string; story: string; build: () => string }> = [
  { name: 'skeletonPlaygroundSource', story: 'Playground', build: () => skeletonPlaygroundSource() },
  { name: 'skeletonRectangleSource', story: 'Variants/Rectangle', build: skeletonRectangleSource },
  { name: 'skeletonCircleSource', story: 'Variants/Circle', build: skeletonCircleSource },
  { name: 'skeletonTextLineSource', story: 'Variants/TextLine', build: skeletonTextLineSource },
  // Serve DUAS stories: Pulsing e ReducedMotion renderizam o mesmo markup.
  {
    name: 'skeletonStatesSource',
    story: 'States/Pulsing + States/ReducedMotion',
    build: skeletonStatesSource,
  },
  {
    name: 'skeletonProfileCardSource',
    story: 'Compositions/ProfileCard',
    build: skeletonProfileCardSource,
  },
  {
    name: 'skeletonListWithAvatarSource',
    story: 'Compositions/ListWithAvatar',
    build: skeletonListWithAvatarSource,
  },
  {
    name: 'skeletonImageRatioSource',
    story: 'Compositions/ImageInAspectRatio',
    build: skeletonImageRatioSource,
  },
  {
    name: 'skeletonParagraphSource',
    story: 'Compositions/Paragraph',
    build: skeletonParagraphSource,
  },
];

/** Os `data-width` na ordem em que o snippet os escreve. */
function widths(code: string): string[] {
  return [...code.matchAll(/data-width="([^"]+)"/g)].map((m) => m[1]!);
}

describe('cobertura das stories', () => {
  it('todo construtor exportado pelo módulo entra na varredura', () => {
    const exported = Object.entries(skeletonSource)
      .filter(([, value]) => typeof value === 'function')
      .map(([name]) => name)
      .sort();
    expect(exported).toEqual(CONSTRUCTORS.map((c) => c.name).sort());
  });

  for (const { name, story, build } of CONSTRUCTORS) {
    it(`${name} (${story}) embrulha o placeholder na peça de região`, () => {
      const code = build();
      expect(code).toContain(
        "import { NdsSkeleton, NdsSkeletonRegion } from '@/components/ui/skeleton';",
      );
      expect(code).toContain('imports: [NdsSkeleton, NdsSkeletonRegion');
      expect(code.match(/ndsSkeletonRegion label="Carregando [^"]+"/g)).toHaveLength(1);
      // O trio é da peça: escrever à mão é a divergência que ela fechou.
      expect(code).not.toContain('role="status"');
      expect(code).not.toContain('aria-busy');
      expect(code).not.toContain('aria-label');
      // `aria-hidden` e `data-slot` a diretiva escreve em runtime.
      expect(code).not.toContain('aria-hidden');
      expect(code).not.toContain('data-slot=');
      // Andaime da story e classe que só existe na docs page.
      expect(code).not.toContain('[attr.');
      expect(code).not.toContain('args.');
      expect(code).not.toContain('nds-docs-skeleton-media');
      expect(code).not.toContain('style=');
    });
  }
});

describe('skeletonPlaygroundSource', () => {
  it('sem args, entrega uma linha de texto na fração padrão', () => {
    const code = skeletonPlaygroundSource();
    expect(code).toContain('<div ndsSkeletonRegion label="Carregando conteúdo">');
    expect(code).toContain('<div ndsSkeleton data-shape="text" data-width="3-4"></div>');
  });

  it('acompanha os controls de forma e largura', () => {
    const code = skeletonPlaygroundSource('', { args: { shape: 'heading', width: '1-2' } });
    expect(code).toContain('<div ndsSkeleton data-shape="heading" data-width="1-2"></div>');
  });

  it('a largura só entra nas formas que a folha lê', () => {
    const code = skeletonPlaygroundSource('', { args: { shape: 'avatar', width: '1-2' } });
    expect(code).toContain('<div ndsSkeleton data-shape="avatar"></div>');
    expect(code).not.toContain('data-width');
  });

  it('fill toma a caixa do container de proporção', () => {
    const code = skeletonPlaygroundSource('', { args: { shape: 'fill', width: '1-3' } });
    expect(code).toContain("import { NdsAspectRatio } from '@/components/ui/aspect-ratio';");
    expect(code).toContain('<div ndsAspectRatio [ratio]="16 / 9">');
    expect(code).toContain('<div ndsSkeleton data-shape="fill"></div>');
    expect(code).not.toContain('data-width');
  });

  it('não liga estado de carregamento — a região sai quando o conteúdo chega', () => {
    const code = skeletonPlaygroundSource('', { args: { shape: 'text' } });
    expect(code).not.toContain('signal');
    expect(code).not.toContain('loading');
    expect(code).toContain('export class Example {}');
  });

  it('ignora control que não é da lista em vez de interpolá-lo', () => {
    const code = skeletonPlaygroundSource('', {
      args: { shape: (() => {}) as never, width: (() => {}) as never },
    });
    expect(code).not.toContain('=>');
    expect(code).toContain('<div ndsSkeleton data-shape="text" data-width="3-4"></div>');
  });
});

describe('variantes', () => {
  it('Rectangle: fill dentro da proporção, na região que a story nomeia', () => {
    const code = skeletonRectangleSource();
    expect(code).toContain('<div ndsSkeletonRegion label="Carregando bloco" class="nds-w-sm">');
    expect(code).toContain('<div ndsAspectRatio [ratio]="16 / 9">');
  });

  it('Circle: avatar sem largura', () => {
    const code = skeletonCircleSource();
    expect(code).toContain('<div ndsSkeleton data-shape="avatar"></div>');
    expect(code).not.toContain('data-width');
  });

  it('TextLine: três linhas decrescentes', () => {
    expect(widths(skeletonTextLineSource())).toEqual(['full', '3-4', '1-2']);
  });
});

describe('estados', () => {
  it('nem pulso nem movimento reduzido acrescentam nada ao markup', () => {
    const code = skeletonStatesSource();
    expect(widths(code)).toEqual(['full', '3-4']);
    expect(code).not.toContain('pulse');
    expect(code).not.toContain('motion');
    expect(code).not.toContain('reduced');
  });
});

describe('composições', () => {
  it('ProfileCard põe o avatar ao lado de duas linhas desiguais', () => {
    const code = skeletonProfileCardSource();
    expect(code).toContain('<div ndsSkeleton data-shape="avatar"></div>');
    expect(code).toContain('<div class="nds-stack nds-flex-1" data-spacing="sm">');
    expect(widths(code)).toEqual(['2-3', '1-2']);
  });

  it('ListWithAvatar: a ul fica DENTRO da peça, com role list e sem estado', () => {
    const code = skeletonListWithAvatarSource();
    const regionAt = code.indexOf('ndsSkeletonRegion label="Carregando lista de pedidos"');
    const listAt = code.indexOf('<ul role="list"');
    expect(regionAt).toBeGreaterThan(-1);
    expect(listAt).toBeGreaterThan(regionAt);
    expect(code).toContain('@for (item of items; track item) {');
    expect(code).toContain('readonly items = [1, 2, 3, 4, 5];');
    expect(code).toContain('<div ndsSkeleton data-shape="avatar" data-size="sm"></div>');
  });

  it('ImageInAspectRatio toma a caixa do container de proporção', () => {
    const code = skeletonImageRatioSource();
    expect(code).toContain('imports: [NdsSkeleton, NdsSkeletonRegion, NdsAspectRatio]');
    expect(code).toContain('<div ndsSkeleton data-shape="fill"></div>');
  });

  it('Paragraph é só linhas, e elas decrescem', () => {
    const code = skeletonParagraphSource();
    expect(widths(code)).toEqual(['full', '3-4', '1-2']);
    expect(code).not.toContain('avatar');
  });
});
