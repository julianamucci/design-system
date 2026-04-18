<script lang="ts">
  interface DocsTestItem { action: string; result: string; priority: string }
  interface DocsA11yTestItem { criterion: string; level: string; how: string }
  interface DocsVisualTestItem { story: string; priority: string }

  const { title, functional, accessibility, visual }: {
    title: string;
    functional: { title: string; cols: { action: string; result: string; priority: string }; items: DocsTestItem[] };
    accessibility: { title: string; cols: { criterion: string; level: string; how: string }; items: DocsA11yTestItem[] };
    visual: { title: string; cols: { story: string; priority: string }; items: DocsVisualTestItem[] };
  } = $props();

  const priorityClass = (p: string) =>
    ({ Alta: 'text-red-600 dark:text-red-400', Média: 'text-yellow-600 dark:text-yellow-400', Baixa: 'text-green-600 dark:text-green-400', High: 'text-red-600 dark:text-red-400', Medium: 'text-yellow-600 dark:text-yellow-400', Low: 'text-green-600 dark:text-green-400' } as Record<string, string>)[p] ?? '';
</script>

<section id="testes">
  <h2 class="text-xl font-semibold mb-4">{title}</h2>
  <div class="space-y-8">

    <!-- Functional -->
    <div class="space-y-3">
      <h3 class="text-base font-semibold">{functional.title}</h3>
      <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-muted/50 text-left">
              <th class="p-3 border-r border-border font-semibold">{functional.cols.action}</th>
              <th class="p-3 border-r border-border font-semibold">{functional.cols.result}</th>
              <th class="p-3 font-semibold">{functional.cols.priority}</th>
            </tr>
          </thead>
          <tbody>
            {#each functional.items as item}
              <tr class="border-b border-border last:border-0 hover:bg-muted/5">
                <td class="p-3 border-r border-border">{item.action}</td>
                <td class="p-3 border-r border-border text-muted-foreground">{item.result}</td>
                <td class="p-3 font-medium {priorityClass(item.priority)}">{item.priority}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Accessibility -->
    <div class="space-y-3">
      <h3 class="text-base font-semibold">{accessibility.title}</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {#each accessibility.items as item}
          <div class="border rounded-lg p-3 bg-muted/30 space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold text-primary border border-primary/20 rounded px-1.5 py-0.5 bg-primary/5">{item.level}</span>
              <span class="text-sm font-medium">{item.criterion}</span>
            </div>
            <p class="text-xs text-muted-foreground pl-0.5">{item.how}</p>
          </div>
        {/each}
      </div>
    </div>

    <!-- Visual -->
    <div class="space-y-3">
      <h3 class="text-base font-semibold">{visual.title}</h3>
      <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-muted/50 text-left">
              <th class="p-3 border-r border-border font-semibold">{visual.cols.story}</th>
              <th class="p-3 font-semibold">{visual.cols.priority}</th>
            </tr>
          </thead>
          <tbody>
            {#each visual.items as item}
              <tr class="border-b border-border last:border-0 hover:bg-muted/5">
                <td class="p-3 border-r border-border font-mono text-xs">{item.story}</td>
                <td class="p-3 font-medium {priorityClass(item.priority)}">{item.priority}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

  </div>
</section>
