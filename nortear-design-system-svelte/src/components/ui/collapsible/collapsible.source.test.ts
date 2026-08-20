import { describe, expect, it } from 'vitest';
import {
  collapsibleAbertoPorPadraoSource,
  collapsibleComBotaoSource,
  collapsibleComChevronSource,
  collapsibleControladoSource,
  collapsibleDesabilitadoSource,
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

<Collapsible class="nds-w-cap-sm">
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
    const saida = collapsibleSource('', { args: { defaultOpen: true } });
    expect(saida).toContain('<Collapsible class="nds-w-cap-sm" open>');
    // `defaultOpen` é o rótulo do control; a prop publicada é `open`.
    expect(saida).not.toContain('defaultOpen');
    // Aberto, o gatilho promete o inverso do que faz fechado.
    expect(saida).toContain('<span>Ocultar filtros avançados</span>');
  });

  it('só escreve disabled quando o valor difere do padrão', () => {
    expect(collapsibleSource('', { args: { disabled: false } })).not.toContain('disabled');
    expect(collapsibleSource('', { args: { disabled: true } })).toContain(
      '<Collapsible class="nds-w-cap-sm" disabled>',
    );
  });

  it('o gatilho carrega as classes de botão, sem botão aninhado', () => {
    const saida = collapsibleSource();
    expect(saida).toContain('<CollapsibleTrigger');
    expect(saida).not.toContain('<Button');
  });
});

describe('transforms das stories de estado e composição', () => {
  it('aberto por padrão é a forma canônica com open', () => {
    expect(collapsibleAbertoPorPadraoSource()).toBe(
      collapsibleSource('', { args: { defaultOpen: true } }),
    );
  });

  it('desabilitado é a forma canônica com disabled', () => {
    expect(collapsibleDesabilitadoSource()).toBe(
      collapsibleSource('', { args: { disabled: true } }),
    );
  });

  it('o modo controlado mostra o estado externo e o vínculo de duas vias', () => {
    const saida = collapsibleControladoSource();
    expect(saida).toContain('let aberto = $state(false);');
    expect(saida).toContain('bind:open={aberto}');
    expect(saida).toContain('from "@/components/ui/button"');
    expect(saida).toContain('Abrir pelo estado externo');
    expect(saida).toContain('Fechar pelo estado externo');
  });

  it('a composição com botão veste o gatilho de contorno', () => {
    const saida = collapsibleComBotaoSource();
    expect(saida).toContain('nds-button nds-button-outline');
    expect(saida).toContain('<p>Opção avançada 3</p>');
  });

  it('a composição do chevron mantém a classe que o CSS gira', () => {
    const saida = collapsibleComChevronSource();
    expect(saida).toContain('nds-transition-transform nds-chevron');
    // A rotação é 100% CSS: nada de ângulo, medida ou style no markup.
    expect(saida).not.toContain('rotate');
    expect(saida).not.toContain('style=');
  });
});
