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
  <h2 class="text-xl font-semibold mb-4">{title}</h2>
  <Card class="overflow-x-auto md:overflow-visible p-4">
      <Table class="w-full text-sm [&_th]:whitespace-normal [&_td]:whitespace-normal">
        <TableHeader>
          <TableRow class="border-b border-border bg-muted/50 text-left">
            <TableHead class="p-3 font-semibold">{cols.state}</TableHead>
            <TableHead class="p-3 font-semibold">{cols.trigger}</TableHead>
            <TableHead class="p-3 font-semibold">{cols.behavior}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#each items as item}
            <TableRow class="border-b border-border last:border-0 hover:bg-muted/5">
              <TableCell class="p-3 font-medium">{item.label}</TableCell>
              <TableCell class="p-3 text-muted-foreground">{item.trigger}</TableCell>
              <TableCell class="p-3 text-muted-foreground">{item.behavior}</TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
  </Card>
</section>
