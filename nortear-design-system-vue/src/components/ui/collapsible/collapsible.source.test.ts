import { describe, expect, it } from 'vitest';
import {
  collapsibleAbertoPorPadraoSource,
  collapsibleComBotaoSource,
  collapsibleComChevronSource,
  collapsibleComIconeSource,
  collapsibleControladoSource,
  collapsibleDesabilitadoSource,
  collapsibleNotControlledSource,
  collapsibleSource,
} from './collapsible.source';

describe('collapsibleSource', () => {
  it('sem args, entrega a composição de três peças', () => {
    expect(collapsibleSource()).toBe(
      `<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
</script>

<template>
  <Collapsible class="nds-w-sm">
    <CollapsibleTrigger
      class="nds-button nds-button-ghost nds-cluster nds-w-full nds-px-4"
      data-justify="between"
    >
      <span>Exibir filtros avançados</span>
      <ChevronDown aria-hidden="true" class="nds-icon nds-shrink-0 nds-transition-transform nds-chevron" />
    </CollapsibleTrigger>
    <CollapsibleContent
      class="nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2"
      data-spacing="sm"
    >
      <p>Filtro avançado 1</p>
      <p>Filtro avançado 2</p>
    </CollapsibleContent>
  </Collapsible>
</template>`,
    );
  });

  it('o estado inicial acompanha o control', () => {
    expect(collapsibleSource('', { args: { defaultOpen: true } })).toContain(
      '<Collapsible default-open class="nds-w-sm">',
    );
  });

  it('desabilitado chega às duas pontas: a raiz guarda o estado, o gatilho é o botão', () => {
    const saida = collapsibleSource('', { args: { disabled: true } });
    expect(saida).toContain('<Collapsible disabled class="nds-w-sm">');
    expect(saida).toMatch(/<CollapsibleTrigger\n {6}disabled\n/);
  });

  it('não escreve o que já é padrão do componente', () => {
    const saida = collapsibleSource('', { args: { defaultOpen: false, disabled: false } });
    expect(saida).not.toContain('default-open');
    expect(saida).not.toContain('disabled');
  });

  it('ignora control que não é booleano — o espião de ação vira ruído no painel', () => {
    const espiao = (() => {}) as never;
    const saida = collapsibleSource('', { args: { defaultOpen: espiao, disabled: espiao } });
    expect(saida).toBe(collapsibleSource());
    expect(saida).not.toContain('function');
  });

  it('o chevron é decorativo e não precisa de classe de estado', () => {
    const saida = collapsibleSource();
    expect(saida).toContain('<ChevronDown aria-hidden="true"');
    // `.nds-chevron` gira sob `[aria-expanded="true"]`: não há ouvinte nem
    // classe condicional a escrever.
    expect(saida).toContain('nds-chevron');
    expect(saida).not.toContain('rotate');
    expect(saida).not.toContain('data-state');
  });
});

describe('transforms das stories de estado', () => {
  it('o não controlado é a forma mínima, sem prop de estado nenhuma', () => {
    expect(collapsibleNotControlledSource()).toBe(collapsibleSource());
    expect(collapsibleNotControlledSource()).not.toContain(':open');
  });

  it('aberto por padrão troca o rótulo junto com o estado', () => {
    const saida = collapsibleAbertoPorPadraoSource();
    expect(saida).toContain('<Collapsible default-open');
    // "Exibir" num painel já aberto descreveria o contrário do que se vê.
    expect(saida).toContain('<span>Ocultar filtros avançados</span>');
  });

  it('o controlado guarda o estado fora e o devolve pelo mesmo canal', () => {
    const saida = collapsibleControladoSource();
    expect(saida).toContain(`import { ref } from 'vue'`);
    expect(saida).toContain('const aberto = ref(false)');
    expect(saida).toContain('<Collapsible v-model:open="aberto" class="nds-w-full">');
    // Os botões de fora mandam no painel sem tocar no gatilho.
    expect(saida).toContain('@click="aberto = true"');
    expect(saida).toContain('@click="aberto = false"');
    // Nomes próprios: dois controles com o mesmo nome acessível ficam ambíguos.
    expect(saida).toContain('Abrir pelo estado externo');
    expect(saida).toContain('Fechar pelo estado externo');
  });

  it('o desabilitado tira a rotação do chevron — não há estado que o faça girar', () => {
    const saida = collapsibleDesabilitadoSource();
    expect(saida).toContain('<Collapsible disabled');
    expect(saida).toContain('<ChevronDown aria-hidden="true" class="nds-icon nds-shrink-0" />');
    expect(saida).not.toContain('nds-chevron');
  });
});

describe('transforms das stories de composição', () => {
  it('o gatilho É o botão do design system, sem repasse para um filho', () => {
    const saida = collapsibleComBotaoSource();
    expect(saida).toContain('class="nds-button nds-button-outline nds-cluster nds-w-full nds-px-4"');
    // Nada de <Button> por dentro: o estado precisa morar no próprio gatilho.
    expect(saida).not.toContain('<Button');
    expect(saida).toContain('<p>Opção avançada 3</p>');
  });

  it('os dois ícones do gatilho ficam fora do nome acessível', () => {
    const saida = collapsibleComIconeSource();
    expect(saida).toContain(`import { ChevronDown, Filter } from 'lucide-vue-next'`);
    expect(saida.match(/aria-hidden="true"/g)).toHaveLength(2);
    expect(saida).toContain('<Filter aria-hidden="true"');
  });

  it('o chevron rotativo revela pares rótulo/valor', () => {
    const saida = collapsibleComChevronSource();
    expect(saida).toContain('<span class="nds-font-medium">Modo estrito</span>');
    expect(saida).toContain('nds-chevron');
  });

  it('nenhum snippet carrega valor de design em style inline', () => {
    for (const saida of [
      collapsibleSource(),
      collapsibleControladoSource(),
      collapsibleComIconeSource(),
      collapsibleComChevronSource(),
    ]) {
      expect(saida).not.toContain('style="');
    }
  });
});
