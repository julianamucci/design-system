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

  const invoices = [
    { id: '#INV-001', status: 'Pago',     method: 'Cartão de crédito', amount: 'R$ 250,00', selected: false },
    { id: '#INV-002', status: 'Pendente', method: 'Boleto bancário',   amount: 'R$ 150,00', selected: true  },
    { id: '#INV-003', status: 'Cancelado',method: 'Pix',               amount: 'R$ 350,00', selected: false },
  ];
</script>

<Table>
  <TableCaption>Lista de faturas — linha selecionada via data-state</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col">Status</TableHead>
      <TableHead scope="col">Método</TableHead>
      <TableHead scope="col" class="text-right">Valor</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {#each invoices as invoice (invoice.id)}
      <TableRow data-state={invoice.selected ? 'selected' : undefined}>
        <TableCell class="font-medium">{invoice.id}</TableCell>
        <TableCell>{invoice.status}</TableCell>
        <TableCell>{invoice.method}</TableCell>
        <TableCell class="text-right">{invoice.amount}</TableCell>
      </TableRow>
    {/each}
  </TableBody>
</Table>
