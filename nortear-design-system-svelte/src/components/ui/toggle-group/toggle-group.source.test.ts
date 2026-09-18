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
    const output = toggleGroupSource('', { args: { type: 'multiple' } });
    expect(output).toContain('type="multiple"');
    expect(output).toContain('let alinhamento: string[] = $state([]);');
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

  it('o desabilitado vale para o grupo inteiro, não item a item', () => {
    const output = toggleGroupSource('', { args: { disabled: true } });
    expect(output).toMatch(/^ {2}disabled$/m);
    expect(output).not.toContain('<ToggleGroupItem value="left" disabled');
  });
});

describe('transforms das stories de variação, estado e composição', () => {
  it('a formatação é o modo combinado, com o valor em lista', () => {
    const output = toggleGroupFormattingSource();
    expect(output).toContain('type="multiple"');
    expect(output).toContain('aria-label="Formatação"');
    expect(output).toContain('let formatacao: string[] = $state([]);');
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
    const output = alignmentToggleGroupBarSource();
    expect(output.match(/<ToggleGroupItem /g)).toHaveLength(4);
    expect(output).toContain('aria-label="Justificar"');
  });

  it('o item desabilitado é um só, e o grupo continua de pé', () => {
    const output = toggleGroupItemDisabledSource();
    expect(output).toContain('<ToggleGroupItem value="center" disabled aria-label="Centralizar">');
    expect(output.match(/disabled/g)).toHaveLength(1);
  });
});
