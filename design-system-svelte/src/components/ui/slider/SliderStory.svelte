<script lang="ts">
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

  let current = $state<number[]>([...initialValue]);

  $effect(() => {
    current = [...initialValue];
  });
</script>

{#if orientation === 'vertical'}
  <div class="space-y-2">
    {#if label || showValue}
      <div class="flex items-center justify-between w-40">
        {#if label}<Label>{label}</Label>{/if}
        {#if showValue}
          <span class="text-sm tabular-nums" aria-live="polite">{current[0]}{valueSuffix}</span>
        {/if}
      </div>
    {/if}
    <div class="{verticalHeight} flex justify-center">
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
  <div class="{width} space-y-2">
    {#if label || showValue || showRangeValue}
      <div class="flex items-center justify-between">
        {#if label}<Label>{label}</Label>{/if}
        {#if showRangeValue}
          <span class="text-sm tabular-nums" aria-live="polite">
            {rangePrefix}{current[0]}{valueSuffix} — {rangePrefix}{current[1]}{valueSuffix}
          </span>
        {:else if showValue}
          <span class="text-sm tabular-nums" aria-live="polite">{current[0]}{valueSuffix}</span>
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
