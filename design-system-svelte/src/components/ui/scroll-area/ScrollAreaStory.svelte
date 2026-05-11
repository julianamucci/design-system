<script lang="ts">
  import { ScrollArea } from './index';

  type Variant = 'vertical' | 'horizontal' | 'both';

  interface Props {
    variant?: Variant;
    type?: 'auto' | 'always' | 'scroll' | 'hover';
    scrollHideDelay?: number;
    height?: string;
    width?: string;
    itemCount?: number;
    rowCount?: number;
    colCount?: number;
    tagLabel?: string;
    cardLabel?: string;
    class?: string;
  }

  let {
    variant = 'vertical',
    type = 'hover',
    scrollHideDelay = 600,
    height = '300px',
    width = '100%',
    itemCount = 30,
    rowCount = 12,
    colCount = 12,
    tagLabel = 'Tag',
    cardLabel = 'Card',
    class: className = '',
  }: Props = $props();

  const tags = $derived(Array.from({ length: itemCount }, (_, i) => i + 1));
  const cards = $derived(Array.from({ length: Math.min(itemCount, 10) }, (_, i) => i + 1));
  const rows = $derived(Array.from({ length: rowCount }, (_, i) => i + 1));
  const cols = $derived(Array.from({ length: colCount }, (_, i) => i + 1));
</script>

{#if variant === 'vertical'}
  <div class="rounded-md border bg-background overflow-hidden {className}" style="height: {height}; width: {width};">
    <ScrollArea orientation="vertical" {type} {scrollHideDelay} class="h-full w-full">
      <div class="p-4 space-y-2">
        {#each tags as n}
          <div class="text-sm border-b pb-2 last:border-b-0">{tagLabel} {n}</div>
        {/each}
      </div>
    </ScrollArea>
  </div>
{:else if variant === 'horizontal'}
  <div class="rounded-md border bg-background overflow-hidden {className}" style="height: {height}; width: {width};">
    <ScrollArea orientation="horizontal" {type} {scrollHideDelay} class="h-full w-full whitespace-nowrap">
      <div class="flex w-max gap-4 p-4">
        {#each cards as n}
          <div class="flex h-[120px] w-[140px] items-center justify-center rounded-md bg-muted text-sm shrink-0">
            {cardLabel} {n}
          </div>
        {/each}
      </div>
    </ScrollArea>
  </div>
{:else if variant === 'both'}
  <div class="rounded-md border bg-background overflow-hidden {className}" style="height: {height}; width: {width};">
    <ScrollArea orientation="both" {type} {scrollHideDelay} class="h-full w-full">
      <table class="w-max border-collapse text-xs">
        <tbody>
          {#each rows as r}
            <tr>
              {#each cols as c}
                <td class="border px-3 py-2 whitespace-nowrap">R{r}·C{c}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </ScrollArea>
  </div>
{/if}
