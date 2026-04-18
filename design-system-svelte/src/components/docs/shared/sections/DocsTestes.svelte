<script lang="ts">
  import { Card } from '@/components/ui/card';
  import { Badge } from '@/components/ui/badge';
  import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

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
    ({ Alta: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50', Média: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50', Baixa: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/50', High: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50', Medium: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50', Low: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/50' } as Record<string, string>)[p] ?? '';
</script>

<section id="testes">
  <h2 class="text-xl font-semibold mb-4">{title}</h2>
  <div class="space-y-8">

    <!-- Functional -->
    <div class="space-y-3">
      <h3 class="text-base font-semibold">{functional.title}</h3>
      <Card class="overflow-x-auto p-4">
          <Table class="w-full text-sm">
            <TableHeader>
              <TableRow class="border-b border-border bg-muted/50 text-left">
                <TableHead class="p-3 border-r border-border font-semibold">{functional.cols.action}</TableHead>
                <TableHead class="p-3 border-r border-border font-semibold">{functional.cols.result}</TableHead>
                <TableHead class="p-3 font-semibold">{functional.cols.priority}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each functional.items as item}
                <TableRow class="border-b border-border last:border-0 hover:bg-muted/5">
                  <TableCell class="p-3 border-r border-border">{item.action}</TableCell>
                  <TableCell class="p-3 border-r border-border text-muted-foreground">{item.result}</TableCell>
                  <TableCell class="p-3">
                    <Badge variant="outline" class={priorityClass(item.priority)}>{item.priority}</Badge>
                  </TableCell>
                </TableRow>
              {/each}
            </TableBody>
          </Table>
      </Card>
    </div>

    <!-- Accessibility -->
    <div class="space-y-3">
      <h3 class="text-base font-semibold">{accessibility.title}</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {#each accessibility.items as item}
          <Card class="bg-muted/30 border-0 shadow-none p-3 space-y-1">
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono font-bold text-primary border border-primary/20 rounded px-1.5 py-0.5 bg-primary/5">{item.level}</span>
                <span class="text-sm font-medium">{item.criterion}</span>
              </div>
              <p class="text-xs text-muted-foreground pl-0.5">{item.how}</p>
          </Card>
        {/each}
      </div>
    </div>

    <!-- Visual -->
    <div class="space-y-3">
      <h3 class="text-base font-semibold">{visual.title}</h3>
      <Card class="overflow-x-auto p-4">
          <Table class="w-full text-sm">
            <TableHeader>
              <TableRow class="border-b border-border bg-muted/50 text-left">
                <TableHead class="p-3 border-r border-border font-semibold">{visual.cols.story}</TableHead>
                <TableHead class="p-3 font-semibold">{visual.cols.priority}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each visual.items as item}
                <TableRow class="border-b border-border last:border-0 hover:bg-muted/5">
                  <TableCell class="p-3 border-r border-border font-mono text-xs">{item.story}</TableCell>
                  <TableCell class="p-3">
                    <Badge variant="outline" class={priorityClass(item.priority)}>{item.priority}</Badge>
                  </TableCell>
                </TableRow>
              {/each}
            </TableBody>
          </Table>
      </Card>
    </div>

  </div>
</section>
