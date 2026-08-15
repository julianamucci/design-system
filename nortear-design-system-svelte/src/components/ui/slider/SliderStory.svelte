<script lang="ts">
  import { untrack } from 'svelte';
  import { Slider } from './index';
  import { Label } from '@/components/ui/label';

  interface Props {
    value?: number[];
    min?: number;
    max?: number;
    step?: number;
    orientation?: 'horizontal' | 'vertical';
    disabled?: boolean;
    'aria-label'?: string;
    label?: string;
    showValue?: boolean;
    showRangeValue?: boolean;
    valueSuffix?: string;
    rangePrefix?: string;
    onValueCommit?: (v: number[]) => void;
  }

  let {
    value: initialValue = [50],
    min = 0,
    max = 100,
    step = 1,
    orientation = 'horizontal',
    disabled = false,
    'aria-label': ariaLabel = 'Slider',
    label = '',
    showValue = false,
    showRangeValue = false,
    valueSuffix = '%',
    rangePrefix = '',
    onValueCommit,
  }: Props = $props();

  // `$derived` aqui impedia o slider de mudar de valor: derivado é somente
  // leitura e se recalcula, então o `bind:value` nunca segurava a alteração —
  // ArrowRight não movia nada. Precisa ser estado.
  //
  // A ressincronização compara o CONTEÚDO, não a identidade do array: os args
  // do Storybook chegam como literal novo a cada render, e comparar por
  // referência reverteria a interação do usuário a cada ciclo.
  // untrack: a leitura no inicializador e proposital — captura so o valor
  // inicial. Sem ele o Svelte avisa que a referencia nao e reativa.
  let current = $state(untrack(() => [...initialValue]));
  let ultimoRecebido = $state(untrack(() => initialValue.join(',')));
  $effect(() => {
    const assinatura = initialValue.join(',');
    if (assinatura !== ultimoRecebido) {
      ultimoRecebido = assinatura;
      current = [...initialValue];
    }
  });
</script>

<!--
Largura e altura vêm de classe `.nds-*` e do próprio componente: as versões
anteriores traziam `w-72` e `h-40` como valor padrão de prop, classes do
framework utilitário que saiu do projeto. Não pintavam nada — o andaime nascia
sem largura e o slider em pé só ficava de pé por causa da altura mínima que o
CSS do componente já garante.
-->
{#if orientation === 'vertical'}
  <div class="nds-stack" data-spacing="sm">
    {#if label || showValue}
      <div class="nds-cluster" data-align="center" data-justify="between">
        {#if label}<Label>{label}</Label>{/if}
        {#if showValue}
          <span class="nds-text-body nds-tabular-nums" aria-live="polite">{current[0]}{valueSuffix}</span>
        {/if}
      </div>
    {/if}
    <div class="nds-cluster" data-justify="center">
      <Slider
        bind:value={current}
        {min}
        {max}
        {step}
        orientation="vertical"
        {disabled}
        aria-label={ariaLabel}
        onValueCommit={(v: number | number[]) => onValueCommit?.(v as number[])}
      />
    </div>
  </div>
{:else}
  <div class="nds-stack nds-w-sm" data-spacing="sm">
    {#if label || showValue || showRangeValue}
      <div class="nds-cluster" data-justify="between">
        {#if label}<Label>{label}</Label>{/if}
        {#if showRangeValue}
          <span class="nds-text-body nds-tabular-nums" aria-live="polite">
            {rangePrefix}{current[0]}{valueSuffix} — {rangePrefix}{current[1]}{valueSuffix}
          </span>
        {:else if showValue}
          <span class="nds-text-body nds-tabular-nums" aria-live="polite">{current[0]}{valueSuffix}</span>
        {/if}
      </div>
    {/if}
    <Slider
      bind:value={current}
      {min}
      {max}
      {step}
      {disabled}
      aria-label={ariaLabel}
      onValueCommit={(v: number | number[]) => onValueCommit?.(v as number[])}
    />
  </div>
{/if}
