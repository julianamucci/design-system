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
    width?: string;
    verticalHeight?: string;
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
    width = 'w-72',
    verticalHeight = 'h-40',
    onValueCommit,
  }: Props = $props();

  let current = $state<number[]>(untrack(() => [...initialValue]));

  $effect(() => {
    current = [...initialValue];
  });
</script>

{#if orientation === 'vertical'}
  <div class="nds-stack" data-spacing="sm">
    {#if label || showValue}
      <div class="nds-cluster" data-align="center" data-justify="between" style="width: 10rem">
        {#if label}<Label>{label}</Label>{/if}
        {#if showValue}
          <span class="nds-text-body nds-tabular-nums" aria-live="polite">{current[0]}{valueSuffix}</span>
        {/if}
      </div>
    {/if}
    <div class="nds-cluster {verticalHeight}" data-justify="center">
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
  <div class="{width}" data-spacing="sm">
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
