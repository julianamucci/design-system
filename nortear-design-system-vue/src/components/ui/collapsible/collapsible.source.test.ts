import { describe, expect, it } from 'vitest';
import {
  defaultCollapsibleOpenSource,
  collapsibleWithButtonSource,
  collapsibleWithChevronSource,
  collapsibleWithIconSource,
  collapsibleControlledSource,
  collapsibleDisabledSource,
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
    const output = collapsibleSource('', { args: { disabled: true } });
    expect(output).toContain('<Collapsible disabled class="nds-w-sm">');
    expect(output).toMatch(/<CollapsibleTrigger\n {6}disabled\n/);
  });

  it('não escreve o que já é padrão do componente', () => {
    const output = collapsibleSource('', { args: { defaultOpen: false, disabled: false } });
    expect(output).not.toContain('default-open');
    expect(output).not.toContain('disabled');
  });

  it('ignora control que não é booleano — o espião de ação vira ruído no painel', () => {
    const spy = (() => {}) as never;
    const output = collapsibleSource('', { args: { defaultOpen: spy, disabled: spy } });
    expect(output).toBe(collapsibleSource());
    expect(output).not.toContain('function');
  });

  it('o chevron é decorativo e não precisa de classe de estado', () => {
    const output = collapsibleSource();
    expect(output).toContain('<ChevronDown aria-hidden="true"');
    // `.nds-chevron` gira sob `[aria-expanded="true"]`: não há ouvinte nem
    // classe condicional a escrever.
    expect(output).toContain('nds-chevron');
    expect(output).not.toContain('rotate');
    expect(output).not.toContain('data-state');
  });
});

describe('transforms das stories de estado', () => {
  it('o não controlado é a forma mínima, sem prop de estado nenhuma', () => {
    expect(collapsibleNotControlledSource()).toBe(collapsibleSource());
    expect(collapsibleNotControlledSource()).not.toContain(':open');
  });

  it('aberto por padrão troca o rótulo junto com o estado', () => {
    const output = defaultCollapsibleOpenSource();
    expect(output).toContain('<Collapsible default-open');
    // "Exibir" num painel já aberto descreveria o contrário do que se vê.
    expect(output).toContain('<span>Ocultar filtros avançados</span>');
  });

  it('o controlado guarda o estado fora e o devolve pelo mesmo canal', () => {
    const output = collapsibleControlledSource();
    expect(output).toContain(`import { ref } from 'vue'`);
    expect(output).toContain('const aberto = ref(false)');
    expect(output).toContain('<Collapsible v-model:open="aberto" class="nds-w-full">');
    // Os botões de fora mandam no painel sem tocar no gatilho.
    expect(output).toContain('@click="aberto = true"');
    expect(output).toContain('@click="aberto = false"');
    // Nomes próprios: dois controles com o mesmo nome acessível ficam ambíguos.
    expect(output).toContain('Abrir pelo estado externo');
    expect(output).toContain('Fechar pelo estado externo');
  });

  it('o desabilitado tira a rotação do chevron — não há estado que o faça girar', () => {
    const output = collapsibleDisabledSource();
    expect(output).toContain('<Collapsible disabled');
    expect(output).toContain('<ChevronDown aria-hidden="true" class="nds-icon nds-shrink-0" />');
    expect(output).not.toContain('nds-chevron');
  });
});

describe('transforms das stories de composição', () => {
  it('o gatilho É o botão do design system, sem repasse para um filho', () => {
    const output = collapsibleWithButtonSource();
    expect(output).toContain('class="nds-button nds-button-outline nds-cluster nds-w-full nds-px-4"');
    // Nada de <Button> por dentro: o estado precisa morar no próprio gatilho.
    expect(output).not.toContain('<Button');
    expect(output).toContain('<p>Opção avançada 3</p>');
  });

  it('os dois ícones do gatilho ficam fora do nome acessível', () => {
    const output = collapsibleWithIconSource();
    expect(output).toContain(`import { ChevronDown, Filter } from 'lucide-vue-next'`);
    expect(output.match(/aria-hidden="true"/g)).toHaveLength(2);
    expect(output).toContain('<Filter aria-hidden="true"');
  });

  it('o chevron rotativo revela pares rótulo/valor', () => {
    const output = collapsibleWithChevronSource();
    expect(output).toContain('<span class="nds-font-medium">Modo estrito</span>');
    expect(output).toContain('nds-chevron');
  });

  it('nenhum snippet carrega valor de design em style inline', () => {
    for (const output of [
      collapsibleSource(),
      collapsibleControlledSource(),
      collapsibleWithIconSource(),
      collapsibleWithChevronSource(),
    ]) {
      expect(output).not.toContain('style="');
    }
  });
});
