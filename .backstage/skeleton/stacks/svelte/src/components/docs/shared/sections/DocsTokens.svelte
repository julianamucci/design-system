<script lang="ts">
  import { Card } from '@/components/ui/card';
  import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

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
    <Card class="overflow-x-auto p-4">
        <Table class="w-full text-sm">
          <TableHeader>
            <TableRow class="border-b border-border bg-muted/50 text-left">
              <TableHead class="p-3 border-r border-border font-semibold">{cols.token}</TableHead>
              <TableHead class="p-3 border-r border-border font-semibold">{cols.value}</TableHead>
              <TableHead class="p-3 font-semibold">{cols.description}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each items as item}
              <TableRow class="border-b border-border last:border-0 hover:bg-muted/5">
                <TableCell class="p-3 border-r border-border font-mono text-primary">{item.token}</TableCell>
                <TableCell class="p-3 border-r border-border font-mono text-muted-foreground">{item.value}</TableCell>
                <TableCell class="p-3 text-muted-foreground">{item.description}</TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
    </Card>
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
