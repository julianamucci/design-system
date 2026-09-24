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
  const months = ['2025', '2026'].flatMap((year) =>
    ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map(
      (month) => `${month}/${year}`,
    ),
  );

  const invoices = [
    { id: '#INV-001', amount: 'R$ 250,00' },
    { id: '#INV-002', amount: 'R$ 150,00' },
    { id: '#INV-003', amount: 'R$ 350,00' },
  ];
</script>

<!-- A legenda nomeia a TABELA; `regionLabel` nomeia o contêiner que ROLA, que é
     outro elemento e entra sozinho na ordem de tabulação. Sem nome o wrapper não
     recebe papel, e quem chega nele por Tab ouve uma parada muda. -->
<Table regionLabel="Faturas por mês de competência">
  <TableCaption class="nds-sr-only">Faturas por mês de competência</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      {#each months as month (month)}
        <TableHead scope="col">{month}</TableHead>
      {/each}
    </TableRow>
  </TableHeader>
  <TableBody>
    {#each invoices as invoice (invoice.id)}
      <TableRow>
        <TableCell class="nds-font-medium">{invoice.id}</TableCell>
        {#each months as month (month)}
          <TableCell class="nds-text-right">{invoice.amount}</TableCell>
        {/each}
      </TableRow>
    {/each}
  </TableBody>
</Table>
