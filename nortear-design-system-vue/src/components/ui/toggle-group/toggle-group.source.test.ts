import { describe, expect, it } from 'vitest';
import {
  toggleGroupBarAlignmentSource,
  toggleGroupBarFormattingSource,
  toggleGroupWithSpacingSource,
  toggleGroupDesabilitadoSource,
  toggleGroupItemDesabilitadoSource,
  toggleGroupMultipleSource,
  toggleGroupDefaultSource,
  toggleGroupSelectedSource,
  toggleGroupSingleSource,
  toggleGroupSource,
  toggleGroupSizesSource,
  toggleGroupVerticalSource,
} from './toggle-group.source';

/** A linha da raiz — é nela que mora tudo que o grupo decide pelos itens. */
function raizDe(saida: string): string {
  return saida.split('\n').find((linha) => linha.includes('<ToggleGroup ')) ?? '';
}

describe('toggleGroupSource', () => {
  it('sem args, entrega a forma canônica de escolha exclusiva', () => {
    expect(toggleGroupSource()).toBe(
      `<script setup lang="ts">
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-vue-next'
</script>

<template>
  <ToggleGroup type="single" aria-label="Alinhamento do texto">
    <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
      <AlignLeft aria-hidden="true" />
    </ToggleGroupItem>
    <ToggleGroupItem value="center" aria-label="Centralizar">
      <AlignCenter aria-hidden="true" />
    </ToggleGroupItem>
    <ToggleGroupItem value="right" aria-label="Alinhar à direita">
      <AlignRight aria-hidden="true" />
    </ToggleGroupItem>
  </ToggleGroup>
</template>`,
    );
  });

  it('não escreve os valores padrão do componente', () => {
    const saida = toggleGroupSource('', {
      args: {
        type: 'single',
        orientation: 'horizontal',
        variant: 'default',
        size: 'default',
        spacing: 0,
        disabled: false,
      },
    });
    expect(saida).not.toContain('orientation=');
    expect(saida).not.toContain('variant=');
    expect(saida).not.toContain('size=');
    expect(saida).not.toContain('spacing=');
    expect(saida).not.toContain('disabled');
  });

  it('o modo de seleção nunca é omitido — é ele que decide o formato do valor', () => {
    expect(toggleGroupSource()).toContain('type="single"');
    expect(toggleGroupSource('', { args: { type: 'multiple' } })).toContain('type="multiple"');
  });

  it('os controls que diferem do padrão chegam à raiz, cada um na sua sintaxe', () => {
    const saida = toggleGroupSource('', {
      args: { orientation: 'vertical', variant: 'outline', size: 'lg', spacing: 2, disabled: true },
    });
    expect(saida).toContain('orientation="vertical"');
    expect(saida).toContain('variant="outline"');
    expect(saida).toContain('size="lg"');
    // Número e booleano não são texto: um vai por ligação, o outro vai sozinho.
    expect(saida).toContain(':spacing="2"');
    expect(saida).toContain('disabled');
    // A fila longa quebra uma linha por atributo em vez de sumir na rolagem.
    expect(saida).toContain('<ToggleGroup\n');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const saida = toggleGroupSource('', {
      args: { type: (() => {}) as never, variant: (() => {}) as never },
    });
    expect(saida).not.toContain('function');
    // O modo cai no exclusivo em vez de interpolar o espião.
    expect(saida).toContain('type="single"');
    expect(saida).not.toContain('variant=');
  });

  it('o item icon-only carrega o nome, e o ícone sai da árvore de acessibilidade', () => {
    const saida = toggleGroupSource();
    expect(saida).toContain('<ToggleGroupItem value="left" aria-label="Alinhar à esquerda">');
    expect(saida).toContain('<AlignLeft aria-hidden="true" />');
  });
});

describe('transforms das stories de variante', () => {
  it('o modo exclusivo recebe o valor inicial como texto', () => {
    const saida = toggleGroupSingleSource();
    expect(saida).toContain('type="single"');
    expect(saida).toContain('default-value="center"');
  });

  it('o modo combinado precisa da ligação — o valor inicial é uma lista', () => {
    const saida = toggleGroupMultipleSource();
    expect(saida).toContain('type="multiple"');
    expect(saida).toContain(`:default-value="['bold', 'italic']"`);
    // Sem os dois-pontos o array chegaria como string ao componente.
    expect(saida).not.toMatch(/[^:]default-value="\[/);
    expect(saida).toContain(`import { Bold, Italic, Underline } from 'lucide-vue-next'`);
  });

  it('o eixo vertical troca a orientação e emenda os itens pelo contorno do grupo', () => {
    const saida = toggleGroupVerticalSource();
    expect(saida).toContain('orientation="vertical"');
    // Cinco atributos na raiz: a fila quebra em uma linha por atributo.
    expect(saida).toContain('<ToggleGroup\n');
    expect(saida).toContain('  variant="outline"');
    // O contorno é do GRUPO nesta composição: nenhum item declara o seu.
    expect(saida).not.toContain('<ToggleGroupItem variant="outline"');
    expect(saida).toContain('aria-label="Modo de visualização"');
  });
});

describe('transforms das stories de estado', () => {
  it('o estado de partida não liga item nenhum', () => {
    expect(toggleGroupDefaultSource()).not.toContain('default-value');
  });

  it('a seleção inicial é do grupo, nunca um atributo no item', () => {
    const saida = toggleGroupSelectedSource();
    expect(saida).toContain('default-value="center"');
    expect(saida).not.toContain('<ToggleGroupItem value="center" selected');
    expect(saida).not.toContain('aria-pressed');
  });

  it('o grupo desabilitado leva a prop na raiz, e os itens seguem limpos', () => {
    const saida = toggleGroupDesabilitadoSource();
    expect(raizDe(saida)).toContain('disabled');
    expect(saida).not.toContain('<ToggleGroupItem value="left" disabled');
  });

  it('o item desabilitado leva a prop nele, e só nele', () => {
    const saida = toggleGroupItemDesabilitadoSource();
    expect(raizDe(saida)).not.toContain('disabled');
    expect(saida).toContain('<ToggleGroupItem value="center" disabled aria-label="Centralizar">');
    expect(saida).toContain('<ToggleGroupItem value="left" aria-label="Alinhar à esquerda">');
  });
});

describe('transforms das stories de composição', () => {
  it('a barra de alinhamento traz a quarta opção e o contorno no grupo', () => {
    const saida = toggleGroupBarAlignmentSource();
    expect(saida).toContain('value="justify"');
    expect(saida).toContain('<AlignJustify aria-hidden="true" />');
    expect(saida).toContain('  variant="outline"');
  });

  it('a barra de formatação abre com um valor só, ainda em lista', () => {
    const saida = toggleGroupBarFormattingSource();
    expect(saida).toContain(`:default-value="['bold']"`);
    expect(saida).not.toContain('variant=');
  });

  it('com espaçamento o contorno muda de dono: sai da raiz e entra no item', () => {
    const saida = toggleGroupWithSpacingSource();
    expect(raizDe(saida)).toContain(':spacing="1"');
    expect(raizDe(saida)).not.toContain('variant=');
    expect(saida).toContain('<ToggleGroupItem variant="outline" value="bold" aria-label="Negrito">');
  });

  it('a comparação de tamanhos empilha três grupos, e o do meio sai sem size', () => {
    const saida = toggleGroupSizesSource();
    expect(saida.match(/<ToggleGroup\n/g)).toHaveLength(3);
    expect(saida).toContain('size="sm"');
    expect(saida).toContain('size="lg"');
    // Escrever o padrão ensinaria que o tamanho precisa ser declarado sempre.
    expect(saida).not.toContain('size="default"');
    expect(saida).toContain('<div class="nds-stack" data-spacing="sm">');
    expect(saida).toContain('aria-label="Centro default"');
  });
});
