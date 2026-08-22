import { describe, expect, it } from 'vitest';
import {
  toggleActiveSource,
  formattingToggleBarSource,
  toggleWithLabelSource,
  toggleControlledSource,
  toggleDisabledSource,
  toggleFiltersSource,
  toggleInvalidoSource,
  variantsTogglePairSource,
  toggleSource,
  toggleSizesSource,
} from './toggle.source';

describe('toggleSource', () => {
  it('sem args, entrega o toggle só de ícone com nome acessível', () => {
    expect(toggleSource()).toBe(
      `<script lang="ts">
  import { Toggle } from "@/components/ui/toggle";
  import Bold from "@lucide/svelte/icons/bold";
</script>

<Toggle aria-label="Negrito">
  <Bold aria-hidden="true" />
</Toggle>`,
    );
  });

  it('só escreve variant quando o valor difere do padrão', () => {
    expect(toggleSource('', { args: { variant: 'default' } })).not.toContain('variant');
    expect(toggleSource('', { args: { variant: 'outline' } })).toContain('variant="outline"');
  });

  it('só escreve size quando o degrau difere do padrão', () => {
    expect(toggleSource('', { args: { size: 'default' } })).not.toContain('size=');
    expect(toggleSource('', { args: { size: 'lg' } })).toContain('size="lg"');
  });

  it('acompanha os controls booleanos de estado', () => {
    expect(toggleSource('', { args: { pressed: true } })).toContain('<Toggle pressed');
    expect(toggleSource('', { args: { disabled: true } })).toContain('disabled');
    expect(toggleSource('', { args: { ariaInvalid: true } })).toContain('aria-invalid="true"');
  });

  it('troca de ícone troca o import junto — snippet copiável não fica sem ele', () => {
    const saida = toggleSource('', { args: { icon: 'eye' } });
    expect(saida).toContain('import Eye from "@lucide/svelte/icons/eye";');
    expect(saida).toContain('<Eye aria-hidden="true" />');
    expect(saida).not.toContain('Bold');
  });

  it('com texto visível o aria-label sai de cena', () => {
    const saida = toggleSource('', { args: { withLabel: true } });
    expect(saida).not.toContain('aria-label');
    expect(saida).toContain('<Toggle>');
    expect(saida).toContain('Negrito');
  });

  it('o nome acessível segue o control de aria-label quando ele existe', () => {
    expect(toggleSource('', { args: { ariaLabel: 'Alternar negrito' } })).toContain(
      'aria-label="Alternar negrito"',
    );
  });
});

describe('transforms das stories de variação, estado e composição', () => {
  it('o par de variantes mostra a padrão ao lado da outline', () => {
    const saida = variantsTogglePairSource();
    expect(saida).toContain('<Toggle aria-label="Negrito">');
    expect(saida).toContain('variant="outline"');
    expect(saida).toContain('nds-cluster');
  });

  it('a escada de tamanhos deixa o degrau padrão sem atributo', () => {
    const saida = toggleSizesSource();
    expect(saida).toContain('size="sm"');
    expect(saida).toContain('size="lg"');
    expect(saida).toContain('<Toggle variant="outline" aria-label="Negrito padrão">');
  });

  it('a variação com rótulo tem texto visível e nenhum aria-label', () => {
    const saida = toggleWithLabelSource();
    expect(saida).not.toContain('aria-label');
    expect(saida).toContain('Mostrar ocultos');
    expect(saida).toContain('bind:pressed={compacta}');
  });

  it('o estado ativo nasce de um estado local, não de um literal', () => {
    const saida = toggleActiveSource();
    expect(saida).toContain('let ativo = $state(true);');
    expect(saida).toContain('bind:pressed={ativo}');
  });

  it('o desabilitado aparece nas duas pontas, ligado e desligado', () => {
    const saida = toggleDisabledSource();
    expect(saida.match(/disabled/g)).toHaveLength(2);
    expect(saida).toContain('aria-label="Itálico ativo e desabilitado"');
  });

  it('o inválido leva o par aria-invalid + aria-describedby', () => {
    const saida = toggleInvalidoSource();
    expect(saida).toContain('aria-invalid="true"');
    expect(saida).toContain('aria-describedby="toggle-invalid-msg"');
    expect(saida).toContain('id="toggle-invalid-msg"');
  });

  it('a barra de formatação é um grupo nomeado com quatro toggles', () => {
    const saida = formattingToggleBarSource();
    expect(saida).toContain('role="group"');
    expect(saida).toContain('aria-label="Formatação de texto"');
    expect(saida.match(/<Toggle /g)).toHaveLength(4);
  });

  it('a lista de filtros usa a variante outline e rótulo visível', () => {
    const saida = toggleFiltersSource();
    expect(saida).toContain('Filtros de exibição');
    expect(saida.match(/variant="outline"/g)).toHaveLength(2);
  });

  it('o controlado mostra o valor externo acompanhando o toggle', () => {
    const saida = toggleControlledSource();
    expect(saida).toContain('let ativo = $state(false);');
    expect(saida).toContain('{String(ativo)}');
  });
});
