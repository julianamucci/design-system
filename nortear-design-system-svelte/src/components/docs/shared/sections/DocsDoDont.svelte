<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Card } from '@/components/ui/card';

  interface DocsDoDontPair {
    doLabel: string;
    dontLabel: string;
    doCaption: string;
    dontCaption: string;
    doPreview: Snippet;
    dontPreview: Snippet;
  }

  const { title, pairs }: { title: string; pairs: DocsDoDontPair[] } = $props();
</script>

<section id="do-dont">
  <h2 class="nds-section-title">{title}</h2>
  <Card class="nds-cluster nds-p-4 nds-mt-2">
      <div class="nds-stack nds-w-full" data-spacing="xl">
        {#each pairs as pair, i (i)}
          <div class="nds-grid" data-cols="2" data-spacing="lg">
            <!-- DO -->
            <div class="nds-stack" data-spacing="sm">
              <div class="nds-cluster nds-text-success" data-spacing="sm">
                <span class="nds-pill" data-tone="success">✓</span>
                <span class="nds-text-body nds-font-semibold nds-uppercase nds-tracking-wider">{pair.doLabel}</span>
              </div>
              <!-- `nds-cluster` + `data-justify` é o mesmo par que centraliza o
                   preview em DocsVariants e em ComponentDemo. Sem ele o Card
                   herda a coluna do `.nds-card` e encosta tudo à esquerda —
                   visível em qualquer componente de largura própria. -->
              <Card class="nds-cluster nds-shadow-none nds-p-4 nds-card-nested" data-justify="center" data-docs-preview="do">
                {@render pair.doPreview()}
              </Card>
              <p class="nds-text-body nds-italic nds-px-1">{pair.doCaption}</p>
            </div>
            <!-- DON'T -->
            <div class="nds-stack" data-spacing="sm">
              <div class="nds-cluster nds-text-destructive" data-spacing="sm">
                <span class="nds-pill" data-tone="destructive">✗</span>
                <span class="nds-text-body nds-font-semibold nds-uppercase nds-tracking-wider">{pair.dontLabel}</span>
              </div>
              <Card class="nds-cluster nds-shadow-none nds-p-4 nds-card-nested" data-justify="center" data-docs-preview="dont">
                {@render pair.dontPreview()}
              </Card>
              <p class="nds-text-body nds-italic nds-px-1">{pair.dontCaption}</p>
            </div>
          </div>
        {/each}
      </div>
  </Card>
</section>
