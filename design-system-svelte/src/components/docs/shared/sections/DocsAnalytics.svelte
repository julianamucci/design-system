<script lang="ts">
  import { Card } from '@/components/ui/card';
  import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

  interface DocsAnalyticsEventItem { event: string; trigger: string; payload: string }

  const { title, cols, items }: {
    title: string;
    cols: { event: string; trigger: string; payload: string };
    items: DocsAnalyticsEventItem[];
  } = $props();
</script>

<section id="analytics">
  <h2 class="text-xl font-semibold mb-4">{title}</h2>
  <Card class="overflow-x-auto md:overflow-visible p-4">
      <Table class="w-full text-sm [&_th]:whitespace-normal [&_td]:whitespace-normal">
        <TableHeader>
          <TableRow class="border-b border-border bg-muted/50 text-left">
            <TableHead class="p-3 font-semibold">{cols.event}</TableHead>
            <TableHead class="p-3 font-semibold">{cols.trigger}</TableHead>
            <TableHead class="p-3 font-semibold">{cols.payload}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#each items as item}
            <TableRow class="border-b border-border last:border-0 hover:bg-muted/5">
              <TableCell class="p-3 font-mono text-primary">{item.event}</TableCell>
              <TableCell class="p-3 text-muted-foreground">{item.trigger}</TableCell>
              <TableCell class="p-3 font-mono text-xs text-muted-foreground">{item.payload}</TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
  </Card>
</section>
