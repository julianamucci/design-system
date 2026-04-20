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
  <h2 class="text-xl font-semibold mb-4">{title}</h2>
  <Card class="p-4 mt-6">
      <div class="space-y-8 w-full">
        {#each pairs as pair}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- DO -->
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-green-600">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
                <span class="text-sm font-semibold uppercase tracking-wider">{pair.doLabel}</span>
              </div>
              <div class="border border-green-200 dark:border-green-900/50 rounded-xl p-4 bg-green-50/50 dark:bg-green-950/10">
                {@render pair.doPreview()}
              </div>
              <p class="text-sm text-muted-foreground italic px-1">{pair.doCaption}</p>
            </div>
            <!-- DON'T -->
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-red-600">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                <span class="text-sm font-semibold uppercase tracking-wider">{pair.dontLabel}</span>
              </div>
              <div class="border border-red-200 dark:border-red-900/50 rounded-xl p-4 bg-red-50/50 dark:bg-red-950/10">
                {@render pair.dontPreview()}
              </div>
              <p class="text-sm text-muted-foreground italic px-1">{pair.dontCaption}</p>
            </div>
          </div>
        {/each}
      </div>
  </Card>
</section>
