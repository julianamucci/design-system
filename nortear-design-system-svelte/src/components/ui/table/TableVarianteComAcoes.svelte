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
  import { Button } from '@/components/ui/button';

  const invoices = [
    { id: '#INV-001', status: 'Pago',     method: 'Cartão de crédito', amount: 'R$ 250,00' },
    { id: '#INV-002', status: 'Pendente', method: 'Boleto bancário',   amount: 'R$ 150,00' },
    { id: '#INV-003', status: 'Cancelado',method: 'Pix',               amount: 'R$ 350,00' },
  ];
</script>

<Table>
  <TableCaption>Lista de faturas recentes</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col">Status</TableHead>
      <TableHead scope="col">Método</TableHead>
      <TableHead scope="col" class="nds-text-right">Valor</TableHead>
      <!-- Sem largura cravada: a coluna se ajusta ao botão. `w-[80px]` era
           classe morta, e uma medida em px não acompanharia o crescimento do
           botão quando a pessoa aumenta a fonte do navegador. -->
      <TableHead scope="col">Ações</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {#each invoices as invoice (invoice.id)}
      <TableRow>
        <TableCell class="nds-font-medium">{invoice.id}</TableCell>
        <TableCell>{invoice.status}</TableCell>
        <TableCell>{invoice.method}</TableCell>
        <TableCell class="nds-text-right">{invoice.amount}</TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Ações para fatura ${invoice.id}`}
          >
            &hellip;
          </Button>
        </TableCell>
      </TableRow>
    {/each}
  </TableBody>
</Table>
