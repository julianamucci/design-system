<script lang="ts">
  import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
  } from './index';

  interface Invoice {
    id: string;
    status: string;
    method: string;
    amount: string;
  }

  interface Props {
    caption?: string;
    showFooter?: boolean;
    /**
     * Legenda visível ou apenas para leitor de tela. Ela nunca sai do DOM — é o
     * nome da tabela; o que muda é ficar ou não visível.
     */
    captionVisivel?: boolean;
    invoices?: Invoice[];
  }

  let {
    caption = 'Lista de faturas recentes',
    showFooter = true,
    captionVisivel = false,
    invoices = [
      { id: '#INV-001', status: 'Pago',      method: 'Cartão de crédito',  amount: 'R$ 250,00' },
      { id: '#INV-002', status: 'Pendente',   method: 'Boleto bancário',    amount: 'R$ 150,00' },
      { id: '#INV-003', status: 'Cancelado',  method: 'Pix',                amount: 'R$ 350,00' },
      { id: '#INV-004', status: 'Pago',       method: 'Cartão de débito',   amount: 'R$ 450,00' },
      { id: '#INV-005', status: 'Pendente',   method: 'Transferência',      amount: 'R$ 200,00' },
    ],
  }: Props = $props();
</script>

<Table>
  <TableCaption class={captionVisivel ? '' : 'nds-sr-only'}>{caption}</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col">Status</TableHead>
      <TableHead scope="col">Método</TableHead>
      <TableHead scope="col" class="nds-text-right">Valor</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {#each invoices as invoice (invoice.id)}
      <TableRow>
        <TableCell class="nds-font-medium">{invoice.id}</TableCell>
        <TableCell>{invoice.status}</TableCell>
        <TableCell>{invoice.method}</TableCell>
        <TableCell class="nds-text-right">{invoice.amount}</TableCell>
      </TableRow>
    {/each}
  </TableBody>
  {#if showFooter}
    <TableFooter>
      <TableRow>
        <TableCell colspan={3}>Total</TableCell>
        <TableCell class="nds-text-right">R$ 1.400,00</TableCell>
      </TableRow>
    </TableFooter>
  {/if}
</Table>
