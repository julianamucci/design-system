<script lang="ts">
  interface DocsStateItem { label: string; trigger: string; behavior: string }

  const { title, cols, items }: {
    title: string;
    cols: { state: string; trigger: string; behavior: string };
    items: DocsStateItem[];
  } = $props();
</script>

<section id="estados">
  <h2 class="text-xl font-semibold mb-4">{title}</h2>
  <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-border bg-muted/50 text-left">
          <th class="p-3 border-r border-border font-semibold">{cols.state}</th>
          <th class="p-3 border-r border-border font-semibold">{cols.trigger}</th>
          <th class="p-3 font-semibold">{cols.behavior}</th>
        </tr>
      </thead>
      <tbody>
        {#each items as item}
          <tr class="border-b border-border last:border-0 hover:bg-muted/5">
            <td class="p-3 border-r border-border font-medium">{item.label}</td>
            <td class="p-3 border-r border-border text-muted-foreground">{item.trigger}</td>
            <td class="p-3 text-muted-foreground">{item.behavior}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>
