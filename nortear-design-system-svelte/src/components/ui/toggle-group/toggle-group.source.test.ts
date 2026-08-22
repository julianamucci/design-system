import { describe, expect, it } from 'vitest';
import {
  alignmentToggleGroupBarSource,
  toggleGroupFormattingSource,
  toggleGroupItemDisabledSource,
  toggleGroupSelectionMultiplaSource,
  toggleGroupSource,
  toggleGroupVerticalSource,
  toggleGroupVisualizacaoVerticalSource,
} from './toggle-group.source';

describe('toggleGroupSource', () => {
  it('sem args, entrega a barra de alinhamento exclusiva', () => {
    expect(toggleGroupSource()).toBe(
      `<script lang="ts">
  import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
  import AlignLeft from "@lucide/svelte/icons/text-align-start";
  import AlignCenter from "@lucide/svelte/icons/text-align-center";
  import AlignRight from "@lucide/svelte/icons/text-align-end";

  let alinhamento = $state("");
</script>

<ToggleGroup
  type="single"
  bind:value={alinhamento}
  aria-label="Alinhamento do texto"
>
  <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
    <AlignLeft aria-hidden="true" />
  </ToggleGroupItem>
  <ToggleGroupItem value="center" aria-label="Centralizar">
    <AlignCenter aria-hidden="true" />
  </ToggleGroupItem>
  <ToggleGroupItem value="right" aria-label="Alinhar à direita">
    <AlignRight aria-hidden="true" />
  </ToggleGroupItem>
</ToggleGroup>`,
    );
  });

  it('o modo combinado troca o valor de texto para lista', () => {
    const saida = toggleGroupSource('', { args: { type: 'multiple' } });
    expect(saida).toContain('type="multiple"');
    expect(saida).toContain('let alinhamento: string[] = $state([]);');
  });

  it('a seleção inicial chega ao estado, nos dois modos', () => {
    expect(toggleGroupSource('', { args: { value: 'center' } })).toContain(
      'let alinhamento = $state("center");',
    );
    expect(
      toggleGroupSource('', { args: { type: 'multiple', value: ['left', 'center'] } }),
    ).toContain('let alinhamento = $state(["left", "center"]);');
  });

  it('só escreve variant, size e orientation quando diferem do padrão', () => {
    expect(toggleGroupSource()).not.toContain('variant');
    expect(toggleGroupSource()).not.toContain('orientation');
    expect(toggleGroupSource('', { args: { variant: 'outline' } })).toContain('variant="outline"');
    expect(toggleGroupSource('', { args: { size: 'sm' } })).toContain('size="sm"');
    expect(toggleGroupSource('', { args: { orientation: 'vertical' } })).toContain(
      'orientation="vertical"',
    );
  });

  it('o espaçamento entre itens só aparece quando desemenda a barra', () => {
    expect(toggleGroupSource('', { args: { spacing: 0 } })).not.toContain('spacing');
    expect(toggleGroupSource('', { args: { spacing: 2 } })).toContain('spacing={2}');
  });

  it('o desabilitado vale para o grupo inteiro, não item a item', () => {
    const saida = toggleGroupSource('', { args: { disabled: true } });
    expect(saida).toMatch(/^ {2}disabled$/m);
    expect(saida).not.toContain('<ToggleGroupItem value="left" disabled');
  });
});

describe('transforms das stories de variação, estado e composição', () => {
  it('a formatação é o modo combinado, com o valor em lista', () => {
    const saida = toggleGroupFormattingSource();
    expect(saida).toContain('type="multiple"');
    expect(saida).toContain('aria-label="Formatação"');
    expect(saida).toContain('let formatacao: string[] = $state([]);');
  });

  it('a seleção múltipla nasce com duas opções combinadas', () => {
    expect(toggleGroupSelectionMultiplaSource()).toContain(
      'let formatacao = $state(["bold", "italic"]);',
    );
  });

  it('o grupo vertical declara a orientação, e a composição soma a borda única', () => {
    expect(toggleGroupVerticalSource()).toContain('orientation="vertical"');
    expect(toggleGroupVerticalSource()).not.toContain('variant');
    expect(toggleGroupVisualizacaoVerticalSource()).toContain('variant="outline"');
    expect(toggleGroupVisualizacaoVerticalSource()).toContain('orientation="vertical"');
  });

  it('a barra de alinhamento completa tem a quarta opção', () => {
    const saida = alignmentToggleGroupBarSource();
    expect(saida.match(/<ToggleGroupItem /g)).toHaveLength(4);
    expect(saida).toContain('aria-label="Justificar"');
  });

  it('o item desabilitado é um só, e o grupo continua de pé', () => {
    const saida = toggleGroupItemDisabledSource();
    expect(saida).toContain('<ToggleGroupItem value="center" disabled aria-label="Centralizar">');
    expect(saida.match(/disabled/g)).toHaveLength(1);
  });
});
