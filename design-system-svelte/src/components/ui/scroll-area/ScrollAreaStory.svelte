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
  <div class="nds-rounded-md nds-border-default nds-bg-background nds-overflow-hidden {className}" style="height: {height}; width: {width};">
    <ScrollArea orientation="vertical" {type} {scrollHideDelay} class="nds-w-full" style="height: 100%">
      <div class="nds-p-4" data-spacing="sm">
        {#each tags as n}
          <div class="nds-text-body nds-border-b nds-last-border-0" style="padding-bottom: 0.5rem">{tagLabel} {n}</div>
        {/each}
      </div>
    </ScrollArea>
  </div>
{:else if variant === 'horizontal'}
  <div class="nds-rounded-md nds-border-default nds-bg-background nds-overflow-hidden {className}" style="height: {height}; width: {width};">
    <ScrollArea orientation="horizontal" {type} {scrollHideDelay} class="nds-w-full nds-whitespace-nowrap" style="height: 100%">
      <div class="nds-cluster nds-p-4" data-spacing="md" style="width: max-content">
        {#each cards as n}
          <div class="nds-cluster nds-rounded-md nds-bg-muted nds-text-body nds-shrink-0" data-align="center" data-justify="center" style="height: 120px; width: 140px">
            {cardLabel} {n}
          </div>
        {/each}
      </div>
    </ScrollArea>
  </div>
{:else if variant === 'both'}
  <div class="nds-rounded-md nds-border-default nds-bg-background nds-overflow-hidden {className}" style="height: {height}; width: {width};">
    <ScrollArea orientation="both" {type} {scrollHideDelay} class="nds-w-full" style="height: 100%">
      <table class="border-collapse nds-text-caption" style="width: max-content">
        <tbody>
          {#each rows as r}
            <tr>
              {#each cols as c}
                <td class="nds-border-default nds-py-2 nds-whitespace-nowrap" style="padding-inline: 0.75rem">R{r}·C{c}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </ScrollArea>
  </div>
{/if}
