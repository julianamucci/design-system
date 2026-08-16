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
      <TableHead scope="col" class="nds-text-right">Valor</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {#if invoices.length === 0}
      <TableRow>
        <!-- `.nds-table-empty` é a regra compartilhada do estado vazio: reserva
             a altura, centraliza e apaga a cor. Antes eram três classes soltas
             (`h-24 text-center`) que não existem no CSS — a mensagem saía
             encostada à esquerda e sem caixa. -->
        <TableCell colspan={4} class="nds-table-empty">
          Nenhuma fatura encontrada.
        </TableCell>
      </TableRow>
    {/if}
  </TableBody>
</Table>
