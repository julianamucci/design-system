import { describe, expect, it } from 'vitest';
import {
  toggleGroupBarAlignmentSource,
  toggleGroupBarFormattingSource,
  toggleGroupDisabledSource,
  toggleGroupItemDisabledSource,
  toggleGroupMultipleSource,
  toggleGroupDefaultSource,
  toggleGroupSelectedSource,
  toggleGroupSingleSource,
  toggleGroupSource,
  toggleGroupSizesSource,
  toggleGroupVerticalSource,
} from './toggle-group.source';

/** A linha da raiz — é nela que mora tudo que o grupo decide pelos itens. */
function rootOf(output: string): string {
  return output.split('\n').find((line) => line.includes('<ToggleGroup ')) ?? '';
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
    const output = toggleGroupSource('', {
      args: {
        type: 'single',
        orientation: 'horizontal',
        variant: 'default',
        size: 'default',
        disabled: false,
      },
    });
    expect(output).not.toContain('orientation=');
    expect(output).not.toContain('variant=');
    expect(output).not.toContain('size=');
    expect(output).not.toContain('disabled');
  });

  it('o modo de seleção nunca é omitido — é ele que decide o formato do valor', () => {
    expect(toggleGroupSource()).toContain('type="single"');
    expect(toggleGroupSource('', { args: { type: 'multiple' } })).toContain('type="multiple"');
  });

  it('os controls que diferem do padrão chegam à raiz, cada um na sua sintaxe', () => {
    const output = toggleGroupSource('', {
      args: { orientation: 'vertical', variant: 'outline', size: 'lg', disabled: true },
    });
    expect(output).toContain('orientation="vertical"');
    expect(output).toContain('variant="outline"');
    expect(output).toContain('size="lg"');
    expect(output).toContain('disabled');
    // A fila longa quebra uma linha por atributo em vez de sumir na rolagem.
    expect(output).toContain('<ToggleGroup\n');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const output = toggleGroupSource('', {
      args: { type: (() => {}) as never, variant: (() => {}) as never },
    });
    expect(output).not.toContain('function');
    // O modo cai no exclusivo em vez de interpolar o espião.
    expect(output).toContain('type="single"');
    expect(output).not.toContain('variant=');
  });

  it('o item icon-only carrega o nome, e o ícone sai da árvore de acessibilidade', () => {
    const output = toggleGroupSource();
    expect(output).toContain('<ToggleGroupItem value="left" aria-label="Alinhar à esquerda">');
    expect(output).toContain('<AlignLeft aria-hidden="true" />');
  });
});

describe('transforms das stories de variante', () => {
  it('o modo exclusivo recebe o valor inicial como texto', () => {
    const output = toggleGroupSingleSource();
    expect(output).toContain('type="single"');
    expect(output).toContain('default-value="center"');
  });

  it('o modo combinado precisa da ligação — o valor inicial é uma lista', () => {
    const output = toggleGroupMultipleSource();
    expect(output).toContain('type="multiple"');
    expect(output).toContain(`:default-value="['bold', 'italic']"`);
    // Sem os dois-pontos o array chegaria como string ao componente.
    expect(output).not.toMatch(/[^:]default-value="\[/);
    expect(output).toContain(`import { Bold, Italic, Underline } from 'lucide-vue-next'`);
  });

  it('o eixo vertical troca a orientação e emenda os itens pelo contorno do grupo', () => {
    const output = toggleGroupVerticalSource();
    expect(output).toContain('orientation="vertical"');
    // Cinco atributos na raiz: a fila quebra em uma linha por atributo.
    expect(output).toContain('<ToggleGroup\n');
    expect(output).toContain('  variant="outline"');
    // O contorno é do GRUPO nesta composição: nenhum item declara o seu.
    expect(output).not.toContain('<ToggleGroupItem variant="outline"');
    expect(output).toContain('aria-label="Modo de visualização"');
  });
});

describe('transforms das stories de estado', () => {
  it('o estado de partida não liga item nenhum', () => {
    expect(toggleGroupDefaultSource()).not.toContain('default-value');
  });

  it('a seleção inicial é do grupo, nunca um atributo no item', () => {
    const output = toggleGroupSelectedSource();
    expect(output).toContain('default-value="center"');
    expect(output).not.toContain('<ToggleGroupItem value="center" selected');
    expect(output).not.toContain('aria-pressed');
  });

  it('o grupo desabilitado leva a prop na raiz, e os itens seguem limpos', () => {
    const output = toggleGroupDisabledSource();
    expect(rootOf(output)).toContain('disabled');
    expect(output).not.toContain('<ToggleGroupItem value="left" disabled');
  });

  it('o item desabilitado leva a prop nele, e só nele', () => {
    const output = toggleGroupItemDisabledSource();
    expect(rootOf(output)).not.toContain('disabled');
    expect(output).toContain('<ToggleGroupItem value="center" disabled aria-label="Centralizar">');
    expect(output).toContain('<ToggleGroupItem value="left" aria-label="Alinhar à esquerda">');
  });
});

describe('transforms das stories de composição', () => {
  it('a barra de alinhamento traz a quarta opção e o contorno no grupo', () => {
    const output = toggleGroupBarAlignmentSource();
    expect(output).toContain('value="justify"');
    expect(output).toContain('<AlignJustify aria-hidden="true" />');
    expect(output).toContain('  variant="outline"');
  });

  it('a barra de formatação abre com um valor só, ainda em lista', () => {
    const output = toggleGroupBarFormattingSource();
    expect(output).toContain(`:default-value="['bold']"`);
    expect(output).not.toContain('variant=');
  });

  it('a comparação de tamanhos empilha três grupos, e o do meio sai sem size', () => {
    const output = toggleGroupSizesSource();
    expect(output.match(/<ToggleGroup\n/g)).toHaveLength(3);
    expect(output).toContain('size="sm"');
    expect(output).toContain('size="lg"');
    // Escrever o padrão ensinaria que o tamanho precisa ser declarado sempre.
    expect(output).not.toContain('size="default"');
    expect(output).toContain('<div class="nds-stack" data-spacing="sm">');
    expect(output).toContain('aria-label="Centro default"');
  });
});
