<script lang="ts">
  import { Card } from '@/components/ui/card';
  import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

  interface DocsStateItem { label: string; trigger: string; behavior: string }

  const { title, cols, items }: {
    title: string;
    cols: { state: string; trigger: string; behavior: string };
    items: DocsStateItem[];
  } = $props();
</script>

<section id="estados">
  <h2 class="nds-section-title">{title}</h2>
  <Card class="nds-p-4 nds-overflow-x">
      <Table class="nds-w-full nds-text-body">
        <TableHeader>
          <TableRow class="nds-border-b nds-bg-muted-soft">
            <TableHead class="nds-p-2 nds-font-semibold">{cols.state}</TableHead>
            <TableHead class="nds-p-2 nds-font-semibold">{cols.trigger}</TableHead>
            <TableHead class="nds-p-2 nds-font-semibold">{cols.behavior}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#each items as item (item.label)}
            <TableRow class="nds-border-b nds-hover-bg-muted-faint">
              <TableCell class="nds-p-2 nds-font-medium">{item.label}</TableCell>
              <TableCell class="nds-p-2 nds-text-muted-foreground">{item.trigger}</TableCell>
              <TableCell class="nds-p-2 nds-text-muted-foreground">{item.behavior}</TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
  </Card>
</section>
