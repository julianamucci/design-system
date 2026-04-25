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

  const invoices: { id: string; status: string; method: string; amount: string }[] = [];
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
    {#if invoices.length === 0}
      <TableRow>
        <TableCell colspan={4} class="h-24 text-center text-muted-foreground">
          Nenhuma fatura encontrada.
        </TableCell>
      </TableRow>
    {/if}
  </TableBody>
</Table>
