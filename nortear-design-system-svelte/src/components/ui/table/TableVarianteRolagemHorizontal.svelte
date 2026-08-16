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

  // Dois anos de competência, não um: com doze colunas a tabela ainda cabe num
  // canvas largo, e a story provaria a rolagem só nos viewports estreitos.
  const meses = ['2025', '2026'].flatMap((ano) =>
    ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map(
      (mes) => `${mes}/${ano}`,
    ),
  );

  const invoices = [
    { id: '#INV-001', amount: 'R$ 250,00' },
    { id: '#INV-002', amount: 'R$ 150,00' },
    { id: '#INV-003', amount: 'R$ 350,00' },
  ];
</script>

<Table>
  <TableCaption class="nds-sr-only">Faturas por mês de competência</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      {#each meses as mes (mes)}
        <TableHead scope="col">{mes}</TableHead>
      {/each}
    </TableRow>
  </TableHeader>
  <TableBody>
    {#each invoices as invoice (invoice.id)}
      <TableRow>
        <TableCell class="nds-font-medium">{invoice.id}</TableCell>
        {#each meses as mes (mes)}
          <TableCell class="nds-text-right">{invoice.amount}</TableCell>
        {/each}
      </TableRow>
    {/each}
  </TableBody>
</Table>
