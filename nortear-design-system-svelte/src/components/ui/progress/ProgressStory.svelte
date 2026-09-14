<script lang="ts">
  import { Progress } from './index';
  import type { ProgressArgs, ProgressItem } from './progress.source';

  // As mesmas chaves das `args` que a transform do painel Code lê: o que a story
  // desenha e o que o snippet ensina saem do mesmo objeto.
  let {
    value: initialValue,
    min,
    max,
    variant,
    'aria-label': ariaLabel = '',
    getAriaValueText,
    label,
    valueText,
    showValue = false,
    strongLabel = false,
    animated = false,
    intervalMs = 400,
    step = 5,
    items,
    spacing = 'sm',
    card,
  }: Partial<ProgressArgs> = $props();

  let current: number | null | undefined = $derived(initialValue);

  $effect(() => {
    if (!animated) return;
    const top = max ?? 100;
    const id = setInterval(() => {
      const now = current ?? 0;
      current = now >= top ? 0 : now + step;
    }, intervalMs);
    return () => clearInterval(id);
  });

  // Uma barra só é a lista de um item: a marcação de cada entrada é a mesma.
  const entries: ProgressItem[] = $derived(
    items ?? [
      { value: current, variant, 'aria-label': ariaLabel, label, valueText, showValue, strongLabel },
    ],
  );

  function shownText(item: ProgressItem): string | undefined {
    if (item.valueText) return item.valueText;
    if (!item.showValue || typeof item.value !== 'number') return undefined;
    return `${item.value}%`;
  }
</script>

{#snippet bar(item: ProgressItem)}
  <Progress
    value={item.value}
    {min}
    {max}
    data-variant={item.variant}
    aria-label={item['aria-label']}
    getAriaValueText={items ? undefined : getAriaValueText}
  />
{/snippet}

{#snippet entry(item: ProgressItem)}
  {@const shown = shownText(item)}
  {#if item.label || shown}
    <div class="nds-stack nds-w-full" data-spacing="xs">
      <div class="nds-cluster nds-text-body" data-justify="between">
        {#if item.label}
          <span class={item.strongLabel ? 'nds-text-foreground nds-font-medium' : 'nds-text-foreground'}
            >{item.label}</span
          >
        {/if}
        {#if shown}
          <!-- `polite` e não `assertive`: a cada passo o leitor seria
               interrompido no meio da frase anterior. -->
          <span
            class={item.valueText ? 'nds-text-muted-foreground' : 'nds-text-muted-foreground nds-tabular-nums'}
            aria-live="polite">{shown}</span
          >
        {/if}
      </div>
      {@render bar(item)}
    </div>
  {:else}
    {@render bar(item)}
  {/if}
{/snippet}

<!-- `nds-w-md` no lugar de largura inline: inline vence a folha e sai do tema,
     da densidade e da escala. -->
{#if card}
  <div
    class="nds-stack nds-w-md nds-p-4 nds-rounded-lg nds-border-default nds-bg-card nds-text-card-foreground"
    data-spacing="sm"
    role={card.busy ? 'status' : undefined}
    aria-busy={card.busy ? 'true' : undefined}
  >
    <div class="nds-text-body nds-font-medium">{card.title}</div>
    <div class="nds-text-caption nds-text-muted-foreground">{card.meta}</div>
    {#each entries as item, i (i)}
      {@render entry(item)}
    {/each}
  </div>
{:else}
  <div class="nds-stack nds-w-md" data-spacing={spacing}>
    {#each entries as item, i (i)}
      {@render entry(item)}
    {/each}
  </div>
{/if}
