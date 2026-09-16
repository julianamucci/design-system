import { describe, expect, it } from 'vitest';
import {
  ratioSkeletonSnippet,
  skeletonListSnippet,
  skeletonPerfilSnippet,
  skeletonSnippet,
  skeletonSource,
  skeletonSourceWith,
} from './skeleton.source';

/** Todo snippet desta família: a região vem da peça, nunca montada à mão. */
function expectRegionPiece(code: string, label: string) {
  expect(code).toContain(
    "import { createSkeleton, createSkeletonRegion } from '@/components/ui/skeleton';",
  );
  expect(code).toContain('createSkeletonRegion(');
  expect(code).toContain(`label: '${label}'`);
  expect(code).not.toContain("'status'");
  expect(code).not.toContain('aria-busy');
  expect(code).not.toContain('aria-label');
}

describe('skeletonSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = skeletonSnippet();
    expect(code).toContain('createSkeleton()');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('aria-hidden="true"');
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = skeletonSnippet();
    expect(code).not.toContain('shape:');
    expect(code).not.toContain('width:');
    expect(code).not.toContain('size:');
    // A região não traz classe de fábrica: sem layout, a opção não aparece.
    expect(code).not.toContain('class:');
  });

  it('mostra forma e fração de largura quando a story as usa', () => {
    const code = skeletonSnippet({ shape: 'text', width: '2-3' });
    expect(code).toContain("shape: 'text'");
    expect(code).toContain("width: '2-3'");
  });

  it('não mostra a fração de largura nas formas em que ela não vale', () => {
    const code = skeletonSnippet({ shape: 'avatar', width: '3-4' });
    expect(code).toContain("shape: 'avatar'");
    expect(code).not.toContain('width:');
  });

  it('a região que anuncia o carregamento é a peça — papel e estado não se escrevem à mão', () => {
    const code = skeletonSnippet({ regionLabel: 'Carregando pedidos' });
    expectRegionPiece(code, 'Carregando pedidos');
    expect(code).not.toContain('setAttribute');
    expect(code).not.toContain('regiaoDeCarregamento');
  });

  it('empilha várias peças quando a story mostra um parágrafo', () => {
    const code = skeletonSnippet({
      lines: [
        { shape: 'text', width: 'full' },
        { shape: 'text', width: '3-4' },
        { shape: 'text', width: '1-2' },
      ],
    });
    expect(code.match(/createSkeleton\(/g)).toHaveLength(3);
    expect(code).toContain("class: 'nds-stack nds-w-sm'");
    expect(code).toContain("regiao.dataset.spacing = 'sm';");
  });

  it('a forma que preenche a caixa vem dentro de um container que a estabelece', () => {
    const code = skeletonSnippet({ shape: 'fill' });
    expect(code).toContain('createAspectRatio(');
    // A classe de demonstração da docs page não é API do design system.
    expect(code).not.toContain('nds-docs-skeleton-media');
  });
});

describe('skeletonSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const text = skeletonSource('<div data-slot="skeleton">', { args: { shape: 'text', width: 'full' } });
    const avatar = skeletonSource('<div data-slot="skeleton">', { args: { shape: 'avatar' } });
    expect(text).not.toBe(avatar);
    expect(text).toContain("width: 'full'");
    expect(avatar).toContain("shape: 'avatar'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(skeletonSource('<div data-slot="skeleton" data-shape="text">', {})).not.toContain(
      'data-shape=',
    );
  });
});

describe('skeletonSourceWith', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const code = skeletonSourceWith({ shape: 'avatar' })('', { args: { shape: 'text' } });
    expect(code).toContain("shape: 'avatar'");
    expect(code).not.toContain("shape: 'text'");
  });
});

describe('skeletonPerfilSnippet', () => {
  it('põe a peça redonda ao lado das linhas, com larguras diferentes', () => {
    const code = skeletonPerfilSnippet();
    expectRegionPiece(code, 'Carregando card de perfil');
    expect(code).toContain("createSkeleton({ shape: 'avatar' })");
    expect(code).toContain("createSkeleton({ shape: 'text', width: '2-3' })");
    expect(code).toContain("createSkeleton({ shape: 'text', width: '1-2' })");
    expect(code).toContain("regiao.dataset.align = 'center';");
  });
});

describe('skeletonListSnippet', () => {
  it('a lista inteira fica DENTRO de uma região só, e a lista não carrega estado', () => {
    const code = skeletonListSnippet();
    expectRegionPiece(code, 'Carregando lista de pedidos');
    expect(code).toContain("lista.setAttribute('role', 'list');");
    expect(code).toMatch(/children: lista/);
    expect(code).toContain("createSkeleton({ shape: 'avatar', size: 'sm' })");
  });
});

describe('ratioSkeletonSnippet', () => {
  it('deixa a caixa por conta do container da proporção', () => {
    const code = ratioSkeletonSnippet();
    expectRegionPiece(code, 'Carregando imagem');
    expect(code).toContain("import { createAspectRatio } from '@/components/ui/aspect-ratio';");
    expect(code).toContain('ratio: 16 / 9');
    expect(code).toContain("content: createSkeleton({ shape: 'fill' })");
    expect(code).not.toContain('style');
  });
});

/**
 * O painel ensina o que a story MOSTRA — uma entrada por story, com o nome da
 * região, as peças que ela renderiza e o container que dá a caixa ao `fill`.
 *
 * É o caso que faltava: o render do Playground e do `Rectangle` davam a caixa com
 * `nds-docs-skeleton-media`, classe da docs page, enquanto o snippet ensinava
 * `createAspectRatio` — e no Playground o nome da região ainda divergia
 * ("Carregando imagem" no painel contra "Carregando conteúdo" na tela). Nenhum
 * dos dois lados estava errado sozinho, e nada acusava a diferença.
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
    build: () => skeletonSource('', { args: { shape: 'text', width: '3-4' } }),
    label: 'Carregando conteúdo',
    partes: ["createSkeleton({ shape: 'text', width: '3-4' })"],
    ratio: false,
  },
  {
    story: 'Playground (heading/1-2)',
    build: () => skeletonSource('', { args: { shape: 'heading', width: '1-2' } }),
    label: 'Carregando conteúdo',
    partes: ["createSkeleton({ shape: 'heading', width: '1-2' })"],
    ratio: false,
  },
  {
    story: 'Playground (avatar)',
    build: () => skeletonSource('', { args: { shape: 'avatar' } }),
    label: 'Carregando conteúdo',
    partes: ["createSkeleton({ shape: 'avatar' })"],
    ratio: false,
  },
  {
    story: 'Playground (fill)',
    build: () => skeletonSource('', { args: { shape: 'fill', width: '1-3' } }),
    label: 'Carregando conteúdo',
    partes: ["createSkeleton({ shape: 'fill' })"],
    ratio: true,
  },
  {
    story: 'Variants/Rectangle',
    build: () => ratioSkeletonSnippet({ regionLabel: 'Carregando bloco' }),
    label: 'Carregando bloco',
    partes: ["createSkeleton({ shape: 'fill' })"],
    ratio: true,
  },
  {
    story: 'Variants/Circle',
    build: () => skeletonSnippet({ shape: 'avatar', regionLabel: 'Carregando avatar' }),
    label: 'Carregando avatar',
    partes: ["createSkeleton({ shape: 'avatar' })"],
    ratio: false,
  },
  {
    story: 'Variants/TextLine',
    build: () =>
      skeletonSnippet({
        regionLabel: 'Carregando linhas de texto',
        lines: [
          { shape: 'text', width: 'full' },
          { shape: 'text', width: '3-4' },
          { shape: 'text', width: '1-2' },
        ],
      }),
    label: 'Carregando linhas de texto',
    partes: [
      "createSkeleton({ shape: 'text', width: 'full' })",
      "createSkeleton({ shape: 'text', width: '3-4' })",
      "createSkeleton({ shape: 'text', width: '1-2' })",
    ],
    ratio: false,
  },
  {
    story: 'States/Pulsing + States/ReducedMotion',
    build: () =>
      skeletonSnippet({
        lines: [
          { shape: 'text', width: 'full' },
          { shape: 'text', width: '3-4' },
        ],
      }),
    label: 'Carregando conteúdo',
    partes: [
      "createSkeleton({ shape: 'text', width: 'full' })",
      "createSkeleton({ shape: 'text', width: '3-4' })",
    ],
    ratio: false,
  },
  {
    story: 'Compositions/ProfileCard',
    build: () => skeletonPerfilSnippet(),
    label: 'Carregando card de perfil',
    partes: [
      "createSkeleton({ shape: 'avatar' })",
      "createSkeleton({ shape: 'text', width: '2-3' })",
      "createSkeleton({ shape: 'text', width: '1-2' })",
    ],
    ratio: false,
  },
  {
    story: 'Compositions/ListWithAvatar',
    build: () => skeletonListSnippet(),
    label: 'Carregando lista de pedidos',
    partes: [
      "createSkeleton({ shape: 'avatar', size: 'sm' })",
      "createSkeleton({ shape: 'text', width: '2-3' })",
      "createSkeleton({ shape: 'text', width: '1-3' })",
    ],
    ratio: false,
  },
  {
    story: 'Compositions/ImageInAspectRatio',
    build: () => ratioSkeletonSnippet(),
    label: 'Carregando imagem',
    partes: ["createSkeleton({ shape: 'fill' })"],
    ratio: true,
  },
  {
    story: 'Compositions/Paragraph',
    build: () =>
      skeletonSnippet({
        regionLabel: 'Carregando parágrafo',
        lines: [
          { shape: 'text', width: 'full' },
          { shape: 'text', width: '3-4' },
          { shape: 'text', width: '1-2' },
        ],
      }),
    label: 'Carregando parágrafo',
    partes: [
      "createSkeleton({ shape: 'text', width: 'full' })",
      "createSkeleton({ shape: 'text', width: '3-4' })",
      "createSkeleton({ shape: 'text', width: '1-2' })",
    ],
    ratio: false,
  },
];

describe('o painel ensina o que a story mostra', () => {
  for (const { story, build, label, partes, ratio } of POR_STORY) {
    it(`${story}: a região, as peças e o container batem com o render`, () => {
      const code = build();
      expect(code).toContain(`label: '${label}'`);
      for (const parte of partes) expect(code).toContain(parte);
      if (ratio) {
        // Quem dá a caixa ao `fill` é o container, e ele aparece no exemplo.
        expect(code).toContain(
          "import { createAspectRatio } from '@/components/ui/aspect-ratio';",
        );
        expect(code).toContain('ratio: 16 / 9');
      } else {
        expect(code).not.toContain('createAspectRatio');
      }
      // A classe de proporção é da docs page: ela daria a caixa sem ser API.
      expect(code).not.toContain('nds-docs-skeleton-media');
    });
  }

  it('a região do Playground só ganha layout na forma que precisa de container', () => {
    // Nas formas de texto e no avatar o render não põe classe na região, então o
    // snippet também não pode pôr.
    expect(skeletonSource('', { args: { shape: 'text', width: '3-4' } })).not.toContain('class:');
    expect(skeletonSource('', { args: { shape: 'avatar' } })).not.toContain('class:');
    expect(skeletonSource('', { args: { shape: 'fill' } })).toContain("class: 'nds-w-sm'");
  });
});
