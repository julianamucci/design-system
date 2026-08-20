import { describe, expect, it } from 'vitest';
import {
  separatorDecorativoSource,
  separatorEmCardSource,
  separatorEmMenuSource,
  separatorEnfaseForteSource,
  separatorHorizontalSource,
  separatorSemanticoSource,
  separatorSource,
  separatorVerticalSource,
} from './separator.source';

const TODAS = [
  separatorSource(),
  separatorHorizontalSource(),
  separatorVerticalSource(),
  separatorDecorativoSource(),
  separatorSemanticoSource(),
  separatorEmCardSource(),
  separatorEmMenuSource(),
  separatorEnfaseForteSource(),
];

describe('separatorSource', () => {
  it('sem args, entrega a forma canônica no eixo horizontal', () => {
    expect(separatorSource()).toBe(
      `<script setup lang="ts">
import { Separator } from '@/components/ui/separator'
</script>

<template>
  <div class="nds-stack nds-w-full nds-max-w-md" data-spacing="md">
    <p class="nds-text-body">Seção superior</p>
    <Separator />
    <p class="nds-text-body">Seção inferior</p>
  </div>
</template>`,
    );
  });

  // A transform anterior escrevia `orientation="horizontal"` SEMPRE, contra o
  // próprio comentário que dizia trazer só o que difere do padrão.
  it('não escreve nenhum dos três padrões do componente', () => {
    const saida = separatorSource('', {
      args: { orientation: 'horizontal', decorative: true, emphasis: 'default' },
    });
    expect(saida).not.toContain('orientation=');
    expect(saida).not.toContain('decorative');
    expect(saida).not.toContain('emphasis');
    expect(saida).toContain('<Separator />');
  });

  // A transform anterior mostrava dois parágrafos SOLTOS, sem contêiner: no
  // eixo vertical o separador colapsa para zero fora de um flex, e o snippet
  // entregava um exemplo que não desenha linha nenhuma.
  it('o eixo vertical troca o contêiner para uma linha de flex', () => {
    const saida = separatorSource('', { args: { orientation: 'vertical' } });
    expect(saida).toContain('<div class="nds-cluster nds-w-full nds-max-w-md" data-spacing="md">');
    expect(saida).toContain('<Separator orientation="vertical" />');
    expect(saida).not.toContain('nds-stack');
  });

  // …e trocava só o eixo, deixando "Seção superior" ao lado de uma linha
  // vertical — texto que descreve outra tela.
  it('o texto dos vizinhos acompanha o eixo', () => {
    const vertical = separatorSource('', { args: { orientation: 'vertical' } });
    expect(vertical).toContain('Item A');
    expect(vertical).toContain('Item B');
    expect(vertical).not.toContain('Seção superior');
  });

  it('os outros dois controls viram atributo quando saem do padrão', () => {
    expect(separatorSource('', { args: { decorative: false } })).toContain(':decorative="false"');
    expect(separatorSource('', { args: { emphasis: 'strong' } })).toContain('emphasis="strong"');
  });

  it('ignora control que não é string nem booleano', () => {
    const saida = separatorSource('', {
      args: { orientation: (() => {}) as never, emphasis: (() => {}) as never },
    });
    expect(saida).not.toContain('function');
    expect(saida).not.toContain('orientation=');
    expect(saida).not.toContain('emphasis=');
  });

  it('nenhuma transform crava medida em style inline', () => {
    // A altura da linha vertical nasce do vizinho; cravá-la esconderia o
    // contrato que o componente promete.
    for (const saida of TODAS) {
      expect(saida).not.toContain('style=');
      expect(saida).not.toContain('height');
    }
  });

  it('nenhuma transform leva marca de teste da story', () => {
    for (const saida of TODAS) expect(saida).not.toContain('data-testid');
  });
});

describe('transforms das stories de variante', () => {
  it('a horizontal é a canônica, sem atributo de eixo', () => {
    const saida = separatorHorizontalSource();
    expect(saida).toContain('nds-stack');
    expect(saida).not.toContain('orientation=');
  });

  it('a vertical põe duas linhas na mesma fileira', () => {
    const saida = separatorVerticalSource();
    expect(saida).toContain('nds-cluster');
    expect([...saida.matchAll(/<Separator orientation="vertical" \/>/g)]).toHaveLength(2);
    // A referência cross-stack usa o cluster comum: a classe de demonstração
    // das docs não é importável por quem consome.
    expect(saida).not.toContain('nds-docs-demo-row');
  });
});

describe('transforms das stories de modo', () => {
  it('o decorativo não pede nada — é o padrão do componente', () => {
    expect(separatorDecorativoSource()).toContain('<Separator />');
    expect(separatorDecorativoSource()).not.toContain('decorative');
  });

  it('o semântico desliga o modo decorativo', () => {
    expect(separatorSemanticoSource()).toContain('<Separator :decorative="false" />');
    // O papel e a orientação anunciada vêm do componente: escrevê-los à mão
    // ensinaria atributos que ninguém precisa passar.
    expect(separatorSemanticoSource()).not.toContain('role=');
    expect(separatorSemanticoSource()).not.toContain('aria-orientation');
  });
});

describe('transforms das stories de composição', () => {
  it('no cartão a linha é irmã do cabeçalho e do conteúdo', () => {
    const saida = separatorEmCardSource();
    expect(saida).toContain('</CardHeader>\n    <Separator />\n    <CardContent>');
    expect(saida).toContain(`} from '@/components/ui/card'`);
  });

  it('no menu a divisão entre grupos é anunciada', () => {
    const saida = separatorEmMenuSource();
    expect(saida).toContain('<Separator :decorative="false" />');
    // Entre os dois grupos, nunca dentro de um deles.
    expect(saida).toContain('Conta</div>\n    <Separator :decorative="false" />\n    <div');
  });

  it('a ênfase forte aparece ao lado da padrão, e a classe extra convive', () => {
    const saida = separatorEnfaseForteSource();
    expect(saida).toContain('<Separator />');
    expect(saida).toContain('<Separator emphasis="strong" class="nds-mt-4" />');
    expect([...saida.matchAll(/<Separator/g)]).toHaveLength(2);
  });
});
