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
    const output = toggleSource('', { args: { icon: 'eye' } });
    expect(output).toContain('import Eye from "@lucide/svelte/icons/eye";');
    expect(output).toContain('<Eye aria-hidden="true" />');
    expect(output).not.toContain('Bold');
  });

  it('com texto visível o aria-label sai de cena', () => {
    const output = toggleSource('', { args: { withLabel: true } });
    expect(output).not.toContain('aria-label');
    expect(output).toContain('<Toggle>');
    expect(output).toContain('Negrito');
  });

  it('o nome acessível segue o control de aria-label quando ele existe', () => {
    expect(toggleSource('', { args: { ariaLabel: 'Alternar negrito' } })).toContain(
      'aria-label="Alternar negrito"',
    );
  });
});

describe('transforms das stories de variação, estado e composição', () => {
  it('o par de variantes mostra a padrão ao lado da outline', () => {
    const output = variantsTogglePairSource();
    expect(output).toContain('<Toggle aria-label="Negrito">');
    expect(output).toContain('variant="outline"');
    expect(output).toContain('nds-cluster');
  });

  it('a escada de tamanhos deixa o degrau padrão sem atributo', () => {
    const output = toggleSizesSource();
    expect(output).toContain('size="sm"');
    expect(output).toContain('size="lg"');
    expect(output).toContain('<Toggle variant="outline" aria-label="Negrito padrão">');
  });

  it('a variação com rótulo tem texto visível e nenhum aria-label', () => {
    const output = toggleWithLabelSource();
    expect(output).not.toContain('aria-label');
    expect(output).toContain('Mostrar ocultos');
    expect(output).toContain('bind:pressed={compacta}');
  });

  it('o estado ativo nasce de um estado local, não de um literal', () => {
    const output = toggleActiveSource();
    expect(output).toContain('let ativo = $state(true);');
    expect(output).toContain('bind:pressed={ativo}');
  });

  it('o desabilitado aparece nas duas pontas, ligado e desligado', () => {
    const output = toggleDisabledSource();
    expect(output.match(/disabled/g)).toHaveLength(2);
    expect(output).toContain('aria-label="Itálico ativo e desabilitado"');
  });

  it('o inválido leva o par aria-invalid + aria-describedby', () => {
    const output = toggleInvalidoSource();
    expect(output).toContain('aria-invalid="true"');
    expect(output).toContain('aria-describedby="toggle-invalid-msg"');
    expect(output).toContain('id="toggle-invalid-msg"');
  });

  it('a barra de formatação é um grupo nomeado com quatro toggles', () => {
    const output = formattingToggleBarSource();
    expect(output).toContain('role="group"');
    expect(output).toContain('aria-label="Formatação de texto"');
    expect(output.match(/<Toggle /g)).toHaveLength(4);
  });

  it('a lista de filtros usa a variante outline e rótulo visível', () => {
    const output = toggleFiltersSource();
    expect(output).toContain('Filtros de exibição');
    expect(output.match(/variant="outline"/g)).toHaveLength(2);
  });

  it('o controlado mostra o valor externo acompanhando o toggle', () => {
    const output = toggleControlledSource();
    expect(output).toContain('let ativo = $state(false);');
    expect(output).toContain('{String(ativo)}');
  });
});
