<script lang="ts">
  import DOMPurify from 'dompurify';
  import { Card } from '@/components/ui/card';

  interface DocsKeyboardItem { key: string; description: string }

  const { title, summary, items, keyboardTitle, keyboardItems }: {
    title: string;
    summary: string;
    items: string[];
    keyboardTitle: string;
    keyboardItems: DocsKeyboardItem[];
  } = $props();
</script>

<section id="acessibilidade">
  <h2 class="nds-section-title">{title}</h2>
  <Card class="nds-p-4 nds-stack" data-spacing="lg">
    <div class="nds-stack" data-spacing="md">
      <p class="nds-text-body nds-leading-relaxed">{@html DOMPurify.sanitize(summary)}</p>
      <ul class="nds-stack nds-text-body nds-list-disc" data-spacing="sm">
        {#each items as item, i (i)}
          <li class="nds-leading-relaxed">{@html DOMPurify.sanitize(item)}</li>
        {/each}
      </ul>
    </div>
    <div>
      <h3 class="nds-text-base nds-font-semibold nds-mb-4">{keyboardTitle}</h3>
      <div class="nds-grid" data-cols="2" data-spacing="sm">
        {#each keyboardItems as item (item.key)}
          <Card class="nds-row nds-border-none nds-shadow-none nds-bg-muted-soft nds-p-4" data-spacing="sm" data-align="start">
              <kbd class="nds-kbd">
                {item.key}
              </kbd>
              <span class="nds-text-body nds-text-muted-foreground nds-leading-relaxed">{item.description}</span>
          </Card>
        {/each}
      </div>
    </div>
  </Card>
</section>
