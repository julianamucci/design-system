<script lang="ts">
  import * as Table from './table/index.js';

  type Scenario =
    | 'playground'
    | 'basic'
    | 'withCaption'
    | 'withFooter'
    | 'withSelection'
    | 'hover'
    | 'selected'
    | 'empty'
    | 'scroll'
    | 'compact'
    | 'default'
    | 'comfortable';

  let { scenario = 'playground' as Scenario } = $props();

  const invoices = [
    { invoice: 'INV001', status: 'Pago', method: 'Cartão de crédito', amount: 'R$ 250,00' },
    { invoice: 'INV002', status: 'Pendente', method: 'PayPal', amount: 'R$ 150,00' },
    { invoice: 'INV003', status: 'Em aberto', method: 'Transferência', amount: 'R$ 350,00' },
    { invoice: 'INV004', status: 'Pago', method: 'Cartão de crédito', amount: 'R$ 450,00' },
    { invoice: 'INV005', status: 'Pago', method: 'PayPal', amount: 'R$ 550,00' },
  ];
</script>

{#if scenario === 'playground'}
  <Table.Root>
    <Table.Caption>Lista das faturas recentes.</Table.Caption>
    <Table.Header>
      <Table.Row>
        <Table.Head class="w-[100px]" scope="col">Fatura</Table.Head>
        <Table.Head scope="col">Status</Table.Head>
        <Table.Head scope="col">Método</Table.Head>
        <Table.Head class="text-right" scope="col">Valor</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each invoices as row (row.invoice)}
        <Table.Row>
          <Table.Cell class="font-medium">{row.invoice}</Table.Cell>
          <Table.Cell>{row.status}</Table.Cell>
          <Table.Cell>{row.method}</Table.Cell>
          <Table.Cell class="text-right">{row.amount}</Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
    <Table.Footer>
      <Table.Row>
        <Table.Cell colspan={3}>Total</Table.Cell>
        <Table.Cell class="text-right">R$ 1.750,00</Table.Cell>
      </Table.Row>
    </Table.Footer>
  </Table.Root>
{:else if scenario === 'basic'}
  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.Head scope="col">Fatura</Table.Head>
        <Table.Head scope="col">Status</Table.Head>
        <Table.Head scope="col">Método</Table.Head>
        <Table.Head class="text-right" scope="col">Valor</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      <Table.Row>
        <Table.Cell class="font-medium">INV001</Table.Cell>
        <Table.Cell>Pago</Table.Cell>
        <Table.Cell>Cartão</Table.Cell>
        <Table.Cell class="text-right">R$ 250,00</Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell class="font-medium">INV002</Table.Cell>
        <Table.Cell>Pendente</Table.Cell>
        <Table.Cell>PayPal</Table.Cell>
        <Table.Cell class="text-right">R$ 150,00</Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell class="font-medium">INV003</Table.Cell>
        <Table.Cell>Em aberto</Table.Cell>
        <Table.Cell>Transferência</Table.Cell>
        <Table.Cell class="text-right">R$ 350,00</Table.Cell>
      </Table.Row>
    </Table.Body>
  </Table.Root>
{:else if scenario === 'withCaption'}
  <Table.Root>
    <Table.Caption>Lista das faturas recentes.</Table.Caption>
    <Table.Header>
      <Table.Row>
        <Table.Head scope="col">Fatura</Table.Head>
        <Table.Head scope="col">Status</Table.Head>
        <Table.Head class="text-right" scope="col">Valor</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      <Table.Row>
        <Table.Cell class="font-medium">INV001</Table.Cell>
        <Table.Cell>Pago</Table.Cell>
        <Table.Cell class="text-right">R$ 250,00</Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell class="font-medium">INV002</Table.Cell>
        <Table.Cell>Pendente</Table.Cell>
        <Table.Cell class="text-right">R$ 150,00</Table.Cell>
      </Table.Row>
    </Table.Body>
  </Table.Root>
{:else if scenario === 'withFooter'}
  <Table.Root>
    <Table.Caption>Resumo das faturas do mês.</Table.Caption>
    <Table.Header>
      <Table.Row>
        <Table.Head scope="col">Fatura</Table.Head>
        <Table.Head scope="col">Status</Table.Head>
        <Table.Head class="text-right" scope="col">Valor</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      <Table.Row>
        <Table.Cell class="font-medium">INV001</Table.Cell>
        <Table.Cell>Pago</Table.Cell>
        <Table.Cell class="text-right">R$ 250,00</Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell class="font-medium">INV002</Table.Cell>
        <Table.Cell>Pendente</Table.Cell>
        <Table.Cell class="text-right">R$ 150,00</Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell class="font-medium">INV003</Table.Cell>
        <Table.Cell>Em aberto</Table.Cell>
        <Table.Cell class="text-right">R$ 350,00</Table.Cell>
      </Table.Row>
    </Table.Body>
    <Table.Footer>
      <Table.Row>
        <Table.Cell colspan={2}>Total</Table.Cell>
        <Table.Cell class="text-right">R$ 750,00</Table.Cell>
      </Table.Row>
    </Table.Footer>
  </Table.Root>
{:else if scenario === 'withSelection' || scenario === 'selected'}
  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.Head scope="col">Fatura</Table.Head>
        <Table.Head scope="col">Status</Table.Head>
        <Table.Head class="text-right" scope="col">Valor</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      <Table.Row>
        <Table.Cell class="font-medium">INV001</Table.Cell>
        <Table.Cell>Pago</Table.Cell>
        <Table.Cell class="text-right">R$ 250,00</Table.Cell>
      </Table.Row>
      <Table.Row data-state="selected">
        <Table.Cell class="font-medium">INV002</Table.Cell>
        <Table.Cell>Pendente</Table.Cell>
        <Table.Cell class="text-right">R$ 150,00</Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell class="font-medium">INV003</Table.Cell>
        <Table.Cell>Em aberto</Table.Cell>
        <Table.Cell class="text-right">R$ 350,00</Table.Cell>
      </Table.Row>
    </Table.Body>
  </Table.Root>
{:else if scenario === 'hover'}
  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.Head scope="col">Fatura</Table.Head>
        <Table.Head scope="col">Status</Table.Head>
        <Table.Head class="text-right" scope="col">Valor</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      <Table.Row>
        <Table.Cell class="font-medium">INV001</Table.Cell>
        <Table.Cell>Pago</Table.Cell>
        <Table.Cell class="text-right">R$ 250,00</Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell class="font-medium">INV002</Table.Cell>
        <Table.Cell>Pendente</Table.Cell>
        <Table.Cell class="text-right">R$ 150,00</Table.Cell>
      </Table.Row>
    </Table.Body>
  </Table.Root>
{:else if scenario === 'empty'}
  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.Head scope="col">Fatura</Table.Head>
        <Table.Head scope="col">Status</Table.Head>
        <Table.Head class="text-right" scope="col">Valor</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      <Table.Row>
        <Table.Cell colspan={3} class="h-24 text-center text-muted-foreground">
          Nenhuma fatura encontrada. Crie a primeira para começar.
        </Table.Cell>
      </Table.Row>
    </Table.Body>
  </Table.Root>
{:else if scenario === 'scroll'}
  <div style="max-width: 400px">
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head scope="col">Fatura</Table.Head>
          <Table.Head scope="col">Status</Table.Head>
          <Table.Head scope="col">Método</Table.Head>
          <Table.Head scope="col">Data</Table.Head>
          <Table.Head scope="col">Cliente</Table.Head>
          <Table.Head class="text-right" scope="col">Valor</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <Table.Row>
          <Table.Cell class="font-medium whitespace-nowrap">INV001</Table.Cell>
          <Table.Cell class="whitespace-nowrap">Pago</Table.Cell>
          <Table.Cell class="whitespace-nowrap">Cartão de crédito</Table.Cell>
          <Table.Cell class="whitespace-nowrap">12/04/2026</Table.Cell>
          <Table.Cell class="whitespace-nowrap">Empresa Alpha Ltda</Table.Cell>
          <Table.Cell class="text-right whitespace-nowrap">R$ 2.500,00</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell class="font-medium whitespace-nowrap">INV002</Table.Cell>
          <Table.Cell class="whitespace-nowrap">Pendente</Table.Cell>
          <Table.Cell class="whitespace-nowrap">Transferência bancária</Table.Cell>
          <Table.Cell class="whitespace-nowrap">13/04/2026</Table.Cell>
          <Table.Cell class="whitespace-nowrap">Fornecedor Beta S.A.</Table.Cell>
          <Table.Cell class="text-right whitespace-nowrap">R$ 1.150,00</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table.Root>
  </div>
{:else if scenario === 'compact'}
  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.Head class="h-8" scope="col">Fatura</Table.Head>
        <Table.Head class="h-8" scope="col">Status</Table.Head>
        <Table.Head class="h-8 text-right" scope="col">Valor</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      <Table.Row>
        <Table.Cell class="py-1 font-medium">INV001</Table.Cell>
        <Table.Cell class="py-1">Pago</Table.Cell>
        <Table.Cell class="py-1 text-right">R$ 250,00</Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell class="py-1 font-medium">INV002</Table.Cell>
        <Table.Cell class="py-1">Pendente</Table.Cell>
        <Table.Cell class="py-1 text-right">R$ 150,00</Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell class="py-1 font-medium">INV003</Table.Cell>
        <Table.Cell class="py-1">Em aberto</Table.Cell>
        <Table.Cell class="py-1 text-right">R$ 350,00</Table.Cell>
      </Table.Row>
    </Table.Body>
  </Table.Root>
{:else if scenario === 'default'}
  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.Head scope="col">Fatura</Table.Head>
        <Table.Head scope="col">Status</Table.Head>
        <Table.Head class="text-right" scope="col">Valor</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      <Table.Row>
        <Table.Cell class="font-medium">INV001</Table.Cell>
        <Table.Cell>Pago</Table.Cell>
        <Table.Cell class="text-right">R$ 250,00</Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell class="font-medium">INV002</Table.Cell>
        <Table.Cell>Pendente</Table.Cell>
        <Table.Cell class="text-right">R$ 150,00</Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell class="font-medium">INV003</Table.Cell>
        <Table.Cell>Em aberto</Table.Cell>
        <Table.Cell class="text-right">R$ 350,00</Table.Cell>
      </Table.Row>
    </Table.Body>
  </Table.Root>
{:else if scenario === 'comfortable'}
  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.Head class="h-12" scope="col">Fatura</Table.Head>
        <Table.Head class="h-12" scope="col">Status</Table.Head>
        <Table.Head class="h-12 text-right" scope="col">Valor</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      <Table.Row>
        <Table.Cell class="py-4 font-medium">INV001</Table.Cell>
        <Table.Cell class="py-4">Pago</Table.Cell>
        <Table.Cell class="py-4 text-right">R$ 250,00</Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell class="py-4 font-medium">INV002</Table.Cell>
        <Table.Cell class="py-4">Pendente</Table.Cell>
        <Table.Cell class="py-4 text-right">R$ 150,00</Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell class="py-4 font-medium">INV003</Table.Cell>
        <Table.Cell class="py-4">Em aberto</Table.Cell>
        <Table.Cell class="py-4 text-right">R$ 350,00</Table.Cell>
      </Table.Row>
    </Table.Body>
  </Table.Root>
{/if}
