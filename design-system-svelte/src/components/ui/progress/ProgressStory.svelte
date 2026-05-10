<script lang="ts">
  import { onMount } from 'svelte';
  import { Progress } from './index';

  interface Props {
    value?: number | null;
    max?: number;
    class?: string;
    'aria-label'?: string;
    animated?: boolean;
    intervalMs?: number;
    step?: number;
    showLabel?: boolean;
    label?: string;
    showValue?: boolean;
  }

  let {
    value: initialValue = 0,
    max = 100,
    class: className = '',
    'aria-label': ariaLabel = 'Progresso',
    animated = false,
    intervalMs = 500,
    step = 5,
    showLabel = false,
    label = '',
    showValue = false,
  }: Props = $props();

  let current = $state<number | null>(initialValue);

  $effect(() => {
    current = initialValue;
  });

  $effect(() => {
    if (!animated || current === null) return;
    const id = setInterval(() => {
      const next = (current ?? 0) + step;
      current = next >= max ? 0 : next;
    }, intervalMs);
    return () => clearInterval(id);
  });

  const percent = $derived(
    current === null ? null : Math.round((100 * (current ?? 0)) / (max || 1))
  );
</script>

<div class="w-72 space-y-2">
  {#if showLabel || showValue}
    <div class="flex items-center justify-between text-sm">
      {#if showLabel}
        <span class="font-medium text-foreground">{label}</span>
      {/if}
      {#if showValue && percent !== null}
        <span class="text-muted-foreground tabular-nums" aria-live="polite">{percent}%</span>
      {/if}
    </div>
  {/if}
  <Progress
    value={current}
    {max}
    class={className}
    aria-label={ariaLabel}
  />
</div>
