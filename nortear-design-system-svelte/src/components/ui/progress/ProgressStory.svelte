<script lang="ts">
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

  let current: number | null = $derived(initialValue);

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

<div class="" data-spacing="sm" style="width: 18rem">
  {#if showLabel || showValue}
    <div class="nds-cluster nds-text-body" data-align="center" data-justify="between">
      {#if showLabel}
        <span class="nds-font-medium nds-text-foreground">{label}</span>
      {/if}
      {#if showValue && percent !== null}
        <span class="nds-text-muted-foreground nds-tabular-nums" aria-live="polite">{percent}%</span>
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
