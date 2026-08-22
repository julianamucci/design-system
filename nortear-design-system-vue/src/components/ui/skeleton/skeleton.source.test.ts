import { describe, expect, it } from 'vitest';
import {
  skeletonCardPerfilSource,
  skeletonCirculoSource,
  skeletonImageRatioSource,
  skeletonLineTextSource,
  skeletonListSource,
  skeletonMovimentoReduzidoSource,
  skeletonParagrafoSource,
  skeletonPlaygroundSource,
  skeletonPulsandoSource,
  skeletonRetanguloSource,
} from './skeleton.source';

const TODAS = [
  skeletonPlaygroundSource,
  skeletonRetanguloSource,
  skeletonCirculoSource,
  skeletonLineTextSource,
  skeletonPulsandoSource,
  skeletonMovimentoReduzidoSource,
  skeletonCardPerfilSource,
  skeletonListSource,
  skeletonImageRatioSource,
  skeletonParagrafoSource,
];

describe('skeletonPlaygroundSource', () => {
  it('sem args, entrega uma peça dentro da região que a anuncia', () => {
    expect(skeletonPlaygroundSource()).toBe(
      `<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <div
    role="status"
    aria-busy="true"
    aria-label="Carregando conteúdo"
  >
    <Skeleton data-shape="text" data-width="3-4" />
  </div>
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

  it('fill não tem caixa própria — ela vem do container', () => {
    const saida = skeletonPlaygroundSource('', { args: { shape: 'fill', width: '1-3' } });
    expect(saida).toContain('<Skeleton data-shape="fill" class="nds-docs-skeleton-media" />');
    expect(saida).not.toContain('data-width');
  });

  it('aria-busy acompanha o control de carregamento', () => {
    expect(skeletonPlaygroundSource('', { args: { loading: false } })).toContain(
      'aria-busy="false"',
    );
    expect(skeletonPlaygroundSource('', { args: { loading: true } })).toContain(
      'aria-busy="true"',
    );
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
  it('toda transform embrulha a peça numa região com papel, estado e nome', () => {
    for (const fn of TODAS) {
      const saida = fn();
      expect(saida).toMatch(/role="(status|list)"/);
      expect(saida).toContain('aria-busy=');
      expect(saida).toContain('aria-label="Carregando');
    }
  });

  it('nenhuma escreve aria-hidden na peça — ele já vem do componente', () => {
    for (const fn of TODAS) {
      expect(fn()).not.toContain('aria-hidden');
    }
  });
});

describe('transforms das stories de forma', () => {
  it('o retângulo preenche a caixa que o container estabelece', () => {
    const saida = skeletonRetanguloSource();
    expect(saida).toContain('class="nds-w-sm"');
    expect(saida).toContain('<Skeleton data-shape="fill" class="nds-docs-skeleton-media" />');
  });

  it('o avatar traz medida própria e dispensa largura', () => {
    const saida = skeletonCirculoSource();
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
    const saida = skeletonPulsandoSource();
    expect(saida).toContain('<Skeleton data-shape="text" data-width="full" />');
    // Nem prop, nem atributo, nem classe de animação escritos à mão.
    expect(saida).not.toContain('animate');
    expect(saida).not.toContain('pulse');
  });

  it('movimento reduzido não acrescenta nada ao markup', () => {
    const saida = skeletonMovimentoReduzidoSource();
    // A preferência é do sistema e quem responde é a folha compartilhada.
    expect(saida).not.toContain('reduced');
    expect(saida).not.toContain('motion');
    expect(saida).toContain('<Skeleton data-shape="text" data-width="3-4" />');
  });
});

describe('transforms das stories de composição', () => {
  it('o card de perfil põe o avatar ao lado de duas linhas desiguais', () => {
    const saida = skeletonCardPerfilSource();
    expect(saida).toContain('<Skeleton data-shape="avatar" />');
    expect(saida).toContain('<div class="nds-stack nds-flex-1" data-spacing="sm">');
    expect([...saida.matchAll(/data-width="([^"]+)"/g)].map((m) => m[1])).toEqual(['2-3', '1-2']);
  });

  it('na lista, a região ocupada é a própria ul', () => {
    const saida = skeletonListSource();
    expect(saida).toContain('<ul\n    role="list"');
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
    const saida = skeletonParagrafoSource();
    expect([...saida.matchAll(/data-width="([^"]+)"/g)].map((m) => m[1])).toEqual([
      'full',
      '3-4',
      '1-2',
    ]);
    expect(saida).not.toContain('avatar');
  });
});
