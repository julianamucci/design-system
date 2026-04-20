<script lang="ts">
  import { sanitizeHtml } from '@/lib/sanitize-html';
  import { Card } from '@/components/ui/card';
  import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

  interface Scenario { s: string; u: string; a: string }
  interface UXRow { element: string; do: string; dont: string; rules?: string }

  const { title, guidelines, scenarios, uxWriting, do: doBlock, dont: dontBlock }: {
    title: string;
    guidelines: { title: string; items: string[] };
    scenarios: { title?: string; cols: { scenario: string; use: string; alternative: string }; items: Scenario[] };
    uxWriting: { title: string; cols: { element: string; do: string; dont: string; rules?: string }; items: UXRow[] };
    do: { title: string; items: string[] };
    dont: { title: string; items: string[] };
  } = $props();
</script>

<section id="quando-usar">
  <h2 class="text-xl font-semibold mb-4">{title}</h2>
  <Card class="p-4 space-y-6">

      <!-- Guidelines -->
      <Card class="bg-muted/50 border border-border/40 shadow-none p-4 space-y-3">
          <h3 class="font-medium text-sm">{guidelines.title}</h3>
          <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            {#each guidelines.items as item}
              <li>{@html sanitizeHtml(item)}</li>
            {/each}
          </ul>
      </Card>

      <!-- Cenários -->
      <div class="overflow-x-auto">
        <Table class="w-full border-collapse text-sm">
          <TableHeader>
            <TableRow class="border-b border-border text-left bg-muted/50 font-medium">
              <TableHead class="p-3 border-r border-border">{scenarios.cols.scenario}</TableHead>
              <TableHead class="p-3 border-r border-border">{scenarios.cols.use}</TableHead>
              <TableHead class="p-3">{scenarios.cols.alternative}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each scenarios.items as item}
              <TableRow class="border-b border-border hover:bg-muted/5">
                <TableCell class="p-3 border-r border-border">{item.s}</TableCell>
                <TableCell class="p-3 border-r border-border font-medium text-primary">{item.u}</TableCell>
                <TableCell class="p-3 text-muted-foreground">{item.a}</TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      </div>

      <!-- UX Writing -->
      <div class="space-y-3">
        <h3 class="font-medium text-sm">{uxWriting.title}</h3>
        <div class="overflow-x-auto">
          <Table class="w-full border-collapse text-sm">
            <TableHeader>
              <TableRow class="border-b border-border bg-muted/70 text-left">
                <TableHead class="p-3 border-r border-border font-semibold">{uxWriting.cols.element}</TableHead>
                {#if uxWriting.cols.rules}
                  <TableHead class="p-3 border-r border-border font-semibold">{uxWriting.cols.rules}</TableHead>
                {/if}
                <TableHead class="p-3 border-r border-border font-semibold text-green-700 dark:text-green-400">
                  <span class="flex items-center gap-1.5">
                    <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
                    {uxWriting.cols.do}
                  </span>
                </TableHead>
                <TableHead class="p-3 font-semibold text-red-700 dark:text-red-400">
                  <span class="flex items-center gap-1.5">
                    <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                    {uxWriting.cols.dont}
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each uxWriting.items as row}
                <TableRow class="border-b border-border last:border-0 hover:bg-muted/5">
                  <TableCell class="p-3 border-r border-border font-medium">{row.element}</TableCell>
                  {#if uxWriting.cols.rules}
                    <TableCell class="p-3 border-r border-border text-muted-foreground">{row.rules ?? ''}</TableCell>
                  {/if}
                  <TableCell class="p-3 border-r border-border font-medium text-green-600 dark:text-green-500">{row.do}</TableCell>
                  <TableCell class="p-3 font-medium text-red-600 dark:text-red-500">{row.dont}</TableCell>
                </TableRow>
              {/each}
            </TableBody>
          </Table>
        </div>
      </div>

      <!-- Do / Don't cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card class="bg-card p-4">
            <h3 class="mb-3 text-sm font-semibold text-green-600 flex items-center gap-2">
              <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
              {doBlock.title}
            </h3>
            <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
              {#each doBlock.items as item}
                <li>{@html sanitizeHtml(item)}</li>
              {/each}
            </ul>
        </Card>
        <Card class="bg-card p-4">
            <h3 class="mb-3 text-sm font-semibold text-red-600 flex items-center gap-2">
              <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
              {dontBlock.title}
            </h3>
            <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
              {#each dontBlock.items as item}
                <li>{@html sanitizeHtml(item)}</li>
              {/each}
            </ul>
        </Card>
      </div>

  </Card>
</section>
