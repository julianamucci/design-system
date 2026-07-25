<script lang="ts">
  import DOMPurify from 'dompurify';
  import ComponentDemo from '@/components/ComponentDemo.svelte';
  import { Card } from '@/components/ui/card';

  const { title, items, structureCode, structureLabel }: {
    title: string;
    items: string[];
    structureCode: string;
    structureLabel?: string;
  } = $props();
</script>

<section id="anatomia">
  <h2 class="nds-section-title">{title}</h2>
  <ComponentDemo>
    <div class="nds-stack nds-w-full" data-spacing="md">
        <ol class="nds-stack nds-text-body nds-list-none" data-spacing="sm">
          {#each items as item, i}
            <li class="nds-row nds-list-none" data-spacing="sm" data-align="start">
              <span class="nds-pill" data-tone="primary">
                {i + 1}
              </span>
              <span>{@html DOMPurify.sanitize(item)}</span>
            </li>
          {/each}
        </ol>
        <Card class="nds-bg-muted-soft nds-border-soft nds-shadow-none nds-p-4 nds-overflow-x">
          {#if structureLabel}
            <p class="nds-text-caption nds-text-muted-foreground nds-mb-2">{structureLabel}</p>
          {/if}
          <pre class="nds-font-mono nds-text-body nds-whitespace-pre">{structureCode}</pre>
        </Card>
    </div>
  </ComponentDemo>
</section>
