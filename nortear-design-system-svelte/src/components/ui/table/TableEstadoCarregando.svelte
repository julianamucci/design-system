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

<!-- aria-busy na REGIÃO, não na célula: o esqueleto é aria-hidden, e sem o
     container quem usa leitor de tela ouve uma tabela vazia sem saber que os
     dados estão a caminho. -->
<div role="status" aria-busy="true" aria-label="Carregando faturas">
<Table>
  <TableCaption>Lista de faturas recentes</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col">Status</TableHead>
      <TableHead scope="col">Método</TableHead>
      <TableHead scope="col" class="nds-text-right">Valor</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {#each skeletonRows as row (row)}
      <TableRow>
        <TableCell><Skeleton data-shape="text" data-width="1-2" /></TableCell>
        <TableCell><Skeleton data-shape="text" data-width="1-3" /></TableCell>
        <TableCell><Skeleton data-shape="text" data-width="3-4" /></TableCell>
        <TableCell class="nds-text-right"><Skeleton class="nds-spacer-start" data-shape="text" data-width="1-3" /></TableCell>
      </TableRow>
    {/each}
  </TableBody>
</Table>
</div>
