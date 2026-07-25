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
        <TableCell><Skeleton class="h-4 w-20" /></TableCell>
        <TableCell><Skeleton class="h-4 w-16" /></TableCell>
        <TableCell><Skeleton class="h-4 w-32" /></TableCell>
        <TableCell class="text-right"><Skeleton class="h-4 w-16 ml-auto" /></TableCell>
      </TableRow>
    {/each}
  </TableBody>
</Table>
