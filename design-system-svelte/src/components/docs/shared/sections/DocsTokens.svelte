<script lang="ts">
  interface DocsTokenItem { token: string; value: string; description: string }

  const { title, cols, items, customizationTitle, customizationCode }: {
    title: string;
    cols: { token: string; value: string; description: string };
    items: DocsTokenItem[];
    customizationTitle?: string;
    customizationCode?: string;
  } = $props();
</script>

<section id="tokens">
  <h2 class="text-xl font-semibold mb-4">{title}</h2>
  <div class="space-y-6">
    <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-border bg-muted/50 text-left">
            <th class="p-3 border-r border-border font-semibold">{cols.token}</th>
            <th class="p-3 border-r border-border font-semibold">{cols.value}</th>
            <th class="p-3 font-semibold">{cols.description}</th>
          </tr>
        </thead>
        <tbody>
          {#each items as item}
            <tr class="border-b border-border last:border-0 hover:bg-muted/5">
              <td class="p-3 border-r border-border font-mono text-primary">{item.token}</td>
              <td class="p-3 border-r border-border font-mono text-muted-foreground">{item.value}</td>
              <td class="p-3 text-muted-foreground">{item.description}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    {#if customizationTitle}
      <div class="space-y-3">
        <h3 class="text-base font-semibold">{customizationTitle}</h3>
        {#if customizationCode}
          <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
            <code class="whitespace-pre">{customizationCode}</code>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</section>
