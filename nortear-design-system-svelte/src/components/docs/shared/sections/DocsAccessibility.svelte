<script lang="ts">
  import DOMPurify from 'dompurify';
  import { Card } from '@/components/ui/card';

  interface DocsKeyboardItem { key: string; description: string }

  // As chaves de `accessibility.screenReader` variam por componente
  // (`closed/open/disabled`, `onOpen/onClose`, …), então o container recebe só
  // os valores — quem chama passa `Object.values(...)`.
  const {
    title,
    summary,
    items,
    keyboardTitle = '',
    keyboardItems,
    screenReaderTitle = '',
    screenReaderItems = [],
    contrast = '',
  }: {
    title: string;
    summary: string;
    items: string[];
    keyboardTitle?: string;
    keyboardItems: DocsKeyboardItem[];
    screenReaderTitle?: string;
    screenReaderItems?: string[];
    contrast?: string;
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
      {#if contrast}
        <p class="nds-text-body nds-leading-relaxed">{@html DOMPurify.sanitize(contrast)}</p>
      {/if}
    </div>
    <div>
      <!-- Render condicional (mesmo fix do Vue): keyboardTitle vazio gerava
           <h3> vazio — axe empty-heading. -->
      {#if keyboardTitle}
        <h3 class="nds-text-base nds-font-semibold nds-mb-4">{keyboardTitle}</h3>
      {/if}
      <div class="nds-grid" data-cols="2" data-spacing="sm">
        {#each keyboardItems as item, i (i)}
          <Card class="nds-row nds-border-none nds-shadow-none nds-bg-muted-soft nds-p-4" data-spacing="sm" data-align="start">
              <kbd class="nds-kbd">
                {item.key}
              </kbd>
              <span class="nds-text-body nds-text-muted-foreground nds-leading-relaxed">{item.description}</span>
          </Card>
        {/each}
      </div>
    </div>
    {#if screenReaderItems.length}
      <div>
        {#if screenReaderTitle}
          <h3 class="nds-text-base nds-font-semibold nds-mb-4">{screenReaderTitle}</h3>
        {/if}
        <ul class="nds-stack nds-text-body nds-list-disc" data-spacing="sm">
          {#each screenReaderItems as item, i (i)}
            <li class="nds-leading-relaxed">{@html DOMPurify.sanitize(item)}</li>
          {/each}
        </ul>
      </div>
    {/if}
  </Card>
</section>
