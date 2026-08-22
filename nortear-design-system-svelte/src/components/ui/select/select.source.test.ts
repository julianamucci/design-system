import { describe, expect, it } from 'vitest';
import {
  selectBloqueadoSource,
  selectWithGroupsSource,
  selectWithIconSource,
  selectCompactoSource,
  selectInvalidoSource,
  selectListPlanaSource,
  selectSelectedSource,
  selectSource,
} from './select.source';

describe('selectSource', () => {
  it('sem args, entrega a lista plana controlada por bind:value', () => {
    expect(selectSource()).toBe(
      `<script lang="ts">
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
  } from "@/components/ui/select";

  let value = $state("");

  const estados = [
    { value: "sp", label: "São Paulo" },
    { value: "rj", label: "Rio de Janeiro" },
    { value: "mg", label: "Minas Gerais" },
  ];

  const rotulo = $derived(estados.find((estado) => estado.value === value)?.label ?? "");
</script>

<Select type="single" bind:value>
  <SelectTrigger aria-label="Selecionar estado">
    {#if rotulo}
      <span>{rotulo}</span>
    {:else}
      <span class="nds-text-muted-foreground">Selecione...</span>
    {/if}
  </SelectTrigger>
  <SelectContent>
    {#each estados as estado (estado.value)}
      <SelectItem value={estado.value} label={estado.label} />
    {/each}
  </SelectContent>
</Select>`,
    );
  });

  it('o control de valor entra como estado inicial do campo controlado', () => {
    expect(selectSource('', { args: { value: 'rj' } })).toContain('let value = $state("rj");');
  });

  it('só escreve disabled quando o valor difere do padrão', () => {
    expect(selectSource('', { args: { disabled: false } })).not.toContain('disabled');
    expect(selectSource('', { args: { disabled: true } })).toContain('disabled');
  });

  it('só escreve name quando o campo tem nome de formulário', () => {
    expect(selectSource()).not.toContain('name=');
    expect(selectSource('', { args: { name: 'estado' } })).toContain('name="estado"');
  });
});

describe('transforms das stories de variação, estado e composição', () => {
  it('a lista plana não traz cabeçalho nem divisão', () => {
    const saida = selectListPlanaSource();
    expect(saida).not.toContain('SelectGroupHeading');
    expect(saida).not.toContain('SelectSeparator');
  });

  it('a lista agrupada nomeia cada grupo e divide entre eles', () => {
    const saida = selectWithGroupsSource();
    expect(saida).toContain('<SelectGroupHeading>{regiao.label}</SelectGroupHeading>');
    expect(saida).toContain('<SelectSeparator />');
    expect(saida).toContain('aria-label="Selecionar região"');
  });

  it('a opção com ícone importa o ícone e mantém o rótulo em texto', () => {
    const saida = selectWithIconSource();
    expect(saida).toContain('import MapPinIcon from "@lucide/svelte/icons/map-pin";');
    expect(saida).toContain('<span>{estado.label}</span>');
  });

  it('o estado preenchido nasce com um valor escolhido', () => {
    expect(selectSelectedSource()).toContain('let value = $state("rj");');
  });

  it('o estado bloqueado declara disabled na raiz', () => {
    expect(selectBloqueadoSource()).toContain('<Select type="single" bind:value disabled>');
  });

  it('o estado inválido se anuncia no gatilho, e não só pela cor', () => {
    expect(selectInvalidoSource()).toContain('aria-invalid="true"');
  });

  it('a composição compacta declara a densidade no gatilho', () => {
    expect(selectCompactoSource()).toContain('<SelectTrigger size="sm"');
  });
});
