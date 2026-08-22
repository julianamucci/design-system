import { describe, expect, it } from 'vitest';
import {
  ratioSnippetSkeleton,
  skeletonListSnippet,
  skeletonPerfilSnippet,
  skeletonSnippet,
  skeletonSource,
  skeletonSourceWith,
} from './skeleton.source';

describe('skeletonSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const código = skeletonSnippet();
    expect(código).toContain("import { createSkeleton } from '@/components/ui/skeleton';");
    expect(código).toContain('createSkeleton()');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('aria-hidden="true"');
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = skeletonSnippet();
    expect(código).not.toContain('shape:');
    expect(código).not.toContain('width:');
    expect(código).not.toContain('size:');
  });

  it('mostra forma e fração de largura quando a story as usa', () => {
    const código = skeletonSnippet({ shape: 'text', width: '2-3' });
    expect(código).toContain("shape: 'text'");
    expect(código).toContain("width: '2-3'");
  });

  it('não mostra a fração de largura nas formas em que ela não vale', () => {
    const código = skeletonSnippet({ shape: 'avatar', width: '3-4' });
    expect(código).toContain("shape: 'avatar'");
    expect(código).not.toContain('width:');
  });

  it('monta a região que anuncia o carregamento — o esqueleto já nasce oculto', () => {
    const código = skeletonSnippet({ regionLabel: 'Carregando pedidos', loading: true });
    expect(código).toContain("regiao.setAttribute('role', 'status');");
    expect(código).toContain("regiao.setAttribute('aria-busy', 'true');");
    expect(código).toContain("regiao.setAttribute('aria-label', 'Carregando pedidos');");
    expect(código).not.toContain('regiaoDeCarregamento');
    expect(código).not.toContain('regiaoComLinhas');
  });

  it('empilha várias peças quando a story mostra um parágrafo', () => {
    const código = skeletonSnippet({
      linhas: [
        { shape: 'text', width: 'full' },
        { shape: 'text', width: '3-4' },
        { shape: 'text', width: '1-2' },
      ],
    });
    expect(código.match(/createSkeleton\(/g)).toHaveLength(3);
    expect(código).toContain("regiao.dataset.spacing = 'sm';");
  });

  it('a forma que preenche a caixa vem dentro de um container que a estabelece', () => {
    const código = skeletonSnippet({ shape: 'fill' });
    expect(código).toContain('createAspectRatio(');
    // A classe de demonstração da docs page não é API do design system.
    expect(código).not.toContain('nds-docs-skeleton-media');
  });
});

describe('skeletonSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const texto = skeletonSource('<div data-slot="skeleton">', { args: { shape: 'text', width: 'full' } });
    const avatar = skeletonSource('<div data-slot="skeleton">', { args: { shape: 'avatar' } });
    expect(texto).not.toBe(avatar);
    expect(texto).toContain("width: 'full'");
    expect(avatar).toContain("shape: 'avatar'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(skeletonSource('<div data-slot="skeleton" data-shape="text">', {})).not.toContain(
      'data-shape=',
    );
  });

  it('leva o estado de carregamento da região para o snippet', () => {
    expect(skeletonSource('', { args: { loading: false } })).toContain(
      "regiao.setAttribute('aria-busy', 'false');",
    );
  });
});

describe('skeletonSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const código = skeletonSourceWith({ shape: 'avatar' })('', { args: { shape: 'text' } });
    expect(código).toContain("shape: 'avatar'");
    expect(código).not.toContain("shape: 'text'");
  });
});

describe('skeletonPerfilSnippet', () => {
  it('põe a peça redonda ao lado das linhas, com larguras diferentes', () => {
    const código = skeletonPerfilSnippet();
    expect(código).toContain("createSkeleton({ shape: 'avatar' })");
    expect(código).toContain("createSkeleton({ shape: 'text', width: '2-3' })");
    expect(código).toContain("createSkeleton({ shape: 'text', width: '1-2' })");
    expect(código).toContain("regiao.setAttribute('aria-label', 'Carregando card de perfil');");
  });
});

describe('skeletonListaSnippet', () => {
  it('faz da lista inteira UMA região ocupada', () => {
    const código = skeletonListSnippet();
    expect(código).toContain("lista.setAttribute('aria-busy', 'true');");
    expect(código).toContain("lista.setAttribute('aria-label', 'Carregando lista de pedidos');");
    expect(código).toContain("createSkeleton({ shape: 'avatar', size: 'sm' })");
    expect(código).not.toContain("role', 'status");
  });
});

describe('skeletonEmProporcaoSnippet', () => {
  it('deixa a caixa por conta do container da proporção', () => {
    const código = ratioSnippetSkeleton();
    expect(código).toContain("import { createAspectRatio } from '@/components/ui/aspect-ratio';");
    expect(código).toContain('ratio: 16 / 9');
    expect(código).toContain("content: createSkeleton({ shape: 'fill' })");
    expect(código).not.toContain('style');
  });
});
