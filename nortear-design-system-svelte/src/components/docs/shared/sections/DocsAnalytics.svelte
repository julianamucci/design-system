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
  <h2 class="nds-section-title">{title}</h2>
  <Card class="nds-p-4 nds-overflow-x">
      <Table class="nds-w-full nds-text-body">
        <TableHeader>
          <TableRow class="nds-border-b nds-bg-muted-soft">
            <TableHead class="nds-p-2 nds-font-semibold">{cols.event}</TableHead>
            <TableHead class="nds-p-2 nds-font-semibold">{cols.trigger}</TableHead>
            <TableHead class="nds-p-2 nds-font-semibold">{cols.payload}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#each items as item, i (i)}
            <TableRow class="nds-border-b nds-hover-bg-muted-faint">
              <TableCell class="nds-p-2 nds-font-mono nds-text-primary">{item.event}</TableCell>
              <TableCell class="nds-p-2 nds-text-muted-foreground">{item.trigger}</TableCell>
              <TableCell class="nds-p-2 nds-font-mono nds-text-caption nds-text-muted-foreground">{item.payload}</TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
  </Card>
</section>
