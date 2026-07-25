<script lang="ts">
  import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from './index';
  import { Skeleton } from '@/components/ui/skeleton';

  const skeletonRows = [1, 2, 3, 4, 5];
</script>

<Table>
  <TableCaption>Lista de faturas recentes</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col">Status</TableHead>
      <TableHead scope="col">Método</TableHead>
      <TableHead scope="col" class="text-right">Valor</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {#each skeletonRows as row (row)}
      <TableRow>
        <TableCell><Skeleton style="height: 1rem; width: 5rem" /></TableCell>
        <TableCell><Skeleton style="height: 1rem; width: 4rem" /></TableCell>
        <TableCell><Skeleton style="height: 1rem; width: 8rem" /></TableCell>
        <TableCell class="nds-text-right"><Skeleton class="nds-spacer-start" style="height: 1rem; width: 4rem" /></TableCell>
      </TableRow>
    {/each}
  </TableBody>
</Table>
