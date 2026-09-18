import { describe, expect, it } from 'vitest';
import {
  defaultCollapsibleOpenSource,
  collapsibleWithButtonSource,
  collapsibleWithChevronSource,
  collapsibleControlledSource,
  collapsibleDisabledSource,
  collapsibleSource,
} from './collapsible.source';

describe('collapsibleSource', () => {
  it('sem args, entrega a forma canônica fechada', () => {
    expect(collapsibleSource()).toBe(
      `<script lang="ts">
  import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,
  } from "@/components/ui/collapsible";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
</script>

<Collapsible class="nds-w-sm">
  <CollapsibleTrigger
    class="nds-button nds-button-ghost nds-cluster nds-w-full nds-px-4"
    data-justify="between"
  >
    <span>Exibir filtros avançados</span>
    <ChevronDown
      aria-hidden="true"
      class="nds-icon nds-shrink-0 nds-transition-transform nds-chevron"
    />
  </CollapsibleTrigger>
  <CollapsibleContent
    class="nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2"
    data-spacing="sm"
  >
    <p>Filtro avançado 1 · Filtro avançado 2</p>
  </CollapsibleContent>
</Collapsible>`,
    );
  });

  it('escreve `open`, e nunca o nome do control, quando o painel nasce aberto', () => {
    const output = collapsibleSource('', { args: { defaultOpen: true } });
    expect(output).toContain('<Collapsible class="nds-w-sm" open>');
    // `defaultOpen` é o rótulo do control; a prop publicada é `open`.
    expect(output).not.toContain('defaultOpen');
    // Aberto, o gatilho promete o inverso do que faz fechado.
    expect(output).toContain('<span>Ocultar filtros avançados</span>');
  });

  it('só escreve disabled quando o valor difere do padrão', () => {
    expect(collapsibleSource('', { args: { disabled: false } })).not.toContain('disabled');
    expect(collapsibleSource('', { args: { disabled: true } })).toContain(
      '<Collapsible class="nds-w-sm" disabled>',
    );
  });

  it('o gatilho carrega as classes de botão, sem botão aninhado', () => {
    const output = collapsibleSource();
    expect(output).toContain('<CollapsibleTrigger');
    expect(output).not.toContain('<Button');
  });
});

describe('transforms das stories de estado e composição', () => {
  it('aberto por padrão é a forma canônica com open', () => {
    expect(defaultCollapsibleOpenSource()).toBe(
      collapsibleSource('', { args: { defaultOpen: true } }),
    );
  });

  it('desabilitado é a forma canônica com disabled', () => {
    expect(collapsibleDisabledSource()).toBe(
      collapsibleSource('', { args: { disabled: true } }),
    );
  });

  it('o modo controlado mostra o estado externo e o vínculo de duas vias', () => {
    const output = collapsibleControlledSource();
    expect(output).toContain('let aberto = $state(false);');
    expect(output).toContain('bind:open={aberto}');
    expect(output).toContain('from "@/components/ui/button"');
    expect(output).toContain('Abrir pelo estado externo');
    expect(output).toContain('Fechar pelo estado externo');
  });

  it('a composição com botão veste o gatilho de contorno', () => {
    const output = collapsibleWithButtonSource();
    expect(output).toContain('nds-button nds-button-outline');
    expect(output).toContain('<p>Opção avançada 3</p>');
  });

  it('a composição do chevron mantém a classe que o CSS gira', () => {
    const output = collapsibleWithChevronSource();
    expect(output).toContain('nds-transition-transform nds-chevron');
    // A rotação é 100% CSS: nada de ângulo, medida ou style no markup.
    expect(output).not.toContain('rotate');
    expect(output).not.toContain('style=');
  });
});
