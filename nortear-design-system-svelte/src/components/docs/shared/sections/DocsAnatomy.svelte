<script lang="ts">
  import DOMPurify from 'dompurify';
  import ComponentDemo from '@/components/ComponentDemo.svelte';
  import { CodeBlock } from '@/components/ui/code-block';

  const { title, items, structureCode, structureLabel, language = 'svelte', copyLabel, copiedLabel }: {
    title: string;
    items: string[];
    structureCode: string;
    structureLabel?: string;
    language?: string;
    copyLabel?: string;
    copiedLabel?: string;
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
        <div>
          {#if structureLabel}
            <p class="nds-text-caption nds-text-muted-foreground nds-mb-2">{structureLabel}</p>
          {/if}
          <CodeBlock code={structureCode} {language} showLineNumbers={false} {copyLabel} {copiedLabel} />
        </div>
    </div>
  </ComponentDemo>
</section>
